# 接口协议

## 角色间通信协议

目前dtm只支持了http和grpc协议。由于分布式事务涉及多个角色协作，某些参与者可能出现暂时不可用，需要重试；某些参与者明确告知失败，需要进行回滚。

### HTTP

下面对各种情况进行分类说明，定义各类情况的返回值。接口类似微信/支付宝订单成功回调的接口，如果接口返回的结果中，包含SUCCESS，则表示成功；如果接口返回的结果中，包含FAILURE，则表示失败; 其他则表示出错，需要进行重试。

上面的架构图中，主要有以下几类接口：

AP调用TM的接口，主要为全局事务注册、提交，子事务注册等：
  - 成功: { dtm_result: "SUCCESS" }
  - 失败: { dtm_result: "FAILURE" }，表示这个请求状态不对，例如已经走fail的全局事务不允许再注册分支
  - 其他表示状态不确定，可重试

TM调用RM的接口，主要为二阶段的提交、回滚，以及saga的各分支
  - 成功: { dtm_result: "SUCCESS" }，表示这个接口调用成功，正常进行下一步操作
  - 失败: { dtm_result: "FAILURE" }，表示这个接口调用失败，全局事务需要进行回滚。例如saga中的正向操作如果返回FAILURE，则整个saga事务失败回滚
  - 其他结果则重试，一直重试，直到返回上述的两个结果之一

AP调用RM的接口，跟业务相关，主要是被TCC、XA两种模式调用。考虑到许多微服务的治理，都有失败重试的机制，因此建议接口设计如下
  - 成功: { dtm_result: "SUCCESS" }，表示这个接口调用成功，正常进行下一步操作。返回的结果可以额外包含其他业务数据。
  - 失败: { dtm_result: "FAILURE" }，表示这个接口调用失败，全局事务需要进行回滚。例如tcc中的Try动作如果返回FAILURE，则整个tcc全局事务回滚
  - 其他返回值，应当允许重试，重试如果还是失败，需要允许全局事务回滚。主要是因为TCC、XA事务的下一步操作不保存在数据库，而是在AP里，它需要及时响应用户，无法长时间等待故障恢复。

::: tip 接口数据注意点
dtm框架通过resp.String()是否包含SUCCESS/FAILURE来判断成功和失败，因此请避免在子事务接口返回的业务数据里包含这两个词。
:::

### GRPC

由于GRPC为强类型协议，并且定义好了各个错误状态码，并且能够定义不同的错误码，采用不同的重试策略，因此GRPC的协议如下：
- Aborted: 表示失败需要回滚，对应上述http协议中的{ dtm_result: "FAILURE" }，
- OK: 表示调用成功，对应上述http协议中的{ dtm_result: "SUCCESS" },可以进行下一步
- 其他错误吗：状态未知，可重试

AP调用TM的接口，主要为全局事务注册、提交，子事务注册等：
- 无返回值，仅判断error 为nil、为Aborted、其他

``` go
type DtmServer interface {
  ...
  Submit(context.Context, *DtmRequest) (*emptypb.Empty, error)
}
```

TM调用RM的接口，主要为二阶段的提交、回滚，以及saga的各分支
- 无返回值，仅判断error 为nil、为Aborted、其他
- 调用参数为dtmgrpc.BusiRequest，里面包含BusiData，AP传递给TM的数据，会透明传给RM
``` go
type BusiRequest struct {
	Info     *BranchInfo
	Dtm      string
	BusiData []byte
}

type BusiReply struct {
	BusiData []byte
}

type BusiClient interface {
  ...
  TransIn(ctx context.Context, in *dtmgrpc.BusiRequest, opts ...grpc.CallOption) (*emptypb.BusiReply, error)
```

AP调用RM的接口，跟业务相关，主要是被TCC、XA两种模式调用。返回的结果
- 有返回值，返回值为固定的 dtmgrpc.BusiReply，应用程序需要用到数据，则需要自己Unmarshal里面的BusiData
``` go
type BusiClient interface {
  ...
  TransInTcc(ctx context.Context, in *dtmgrpc.BusiRequest, opts ...grpc.CallOption) (*dtmgrpc.BusiReply, error)
```

## 重试策略

失败重试是微服务治理中，很重要的一个环节，上述http和grpc协议，能够很好的与主流的失败重试策略兼容

当全局事务由于某些组件导致临时故障，那么全局事务会暂时中断，后续dtm会定时轮询一小时内超时未完成的全局事务，进行重试。多次重试则间隔每次加倍，避免雪崩。

如果应用程序由于各类bug或故障导致全局事务在一小时内的都未进行重试，待开发人员修复bug或故障之后，可以通过手动修改dtm.trans_global中next_cron_time来触发重试。
