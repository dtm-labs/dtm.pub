# 运维

## 报警

正常情况下，全局事务会很快结束，结果在dtm.trans_global的status记录为succeed/failed，即使出现临时的网络问题等，通常也会在一两次重试之后，最终结束。

如果重试次数超过3，通常意味着异常情况，最好能够监测起来，建议的查询条件为：

``` SQL
select * from dtm.trans_global where status not in ('succeed', 'failed') and
  create_time between date_add(now(), interval -3600 second) and date_add(now(), interval -120 second)
```

项目在v1.1.0版本后支持Prometheus监控，为Prometheus提供的输出端口为`8889`，配置在文件`dtmsvr/dtmsvr.go`中。
该监视接口提供网络接口(HTTP/gRPC)的可用性和响应时间以及执行事务和分支操作结果的统计。

具体的metrics为

- `dtm_server_process_total`
- `dtm_server_response_duration`
- `dtm_transaction_process_total`
- `dtm_branch_process_total`

例如，如果对`confirm/cancel`分支操作的失败情况进行监控，一个可行的PromQL触发条件为

```
sum(dtm_branch_process_total{branchtype=~"confirm|cancel",status="fail"}) by (gid, branchid) > 3
```

## 触发全局事务立即重试

dtm会轮询数据库中超时时间在近一小时内的未完成的全局事务，不在这个范围内的，dtm不检查。如果您想要手动触发立即重试，您可以手动把相应事务的next_cron_time修改为当前时间，就能触发重试。

dtm对每个事务的重试间隔是每失败一次，间隔加倍，避免过多的重试，导致系统负载异常上升。

有以下场景可以用到立即重试：

- 某个业务出现bug，导致事务重试多次未完成，重试间隔数值已经很大。修复bug后，需要dtm立即重试未完成的事务
- dtm宕机，或者dtm依赖的数据库宕机，并且宕机时间超过1小时，此时未完成的全局事务已不再dtm自动轮询的范围内了

手动把相应事务的next_cron_time修改为当前时间后，会在数秒内被定时轮询
