# 云上服务

dtm提供云上服务（目前为测试，未来有更多需求，会考虑提供高性能、高可用的dtm服务）

## 使用

您只需要将例子里面的DtmServer地址换成下面地址即可：

国内地址：https://dtm.pub/api/dtmsvr

国外地址：https://en.dtm.pub/api/dtmsvr

## 重试次数限制

因为这是测试服务，因此容易出现用户填错地址，或者用户的服务不可访问，所以限定重试次数为6，否则会出现无限重试

## 查询事务状态

### 查询批量订单

``` bash
curl https://dtm.pub/api/dtmsvr/all?last_id=
```

last_id: 上一个请求的订单id，这个id不是gid，而是全局订单表里面的id字段

响应结果为id小于last_id的100条数据，按照id倒序排列：

``` json
{
    "transactions":[
        {
            "ID":64,
            "CreateTime":"2021-09-14T19:10:50+08:00",
            "UpdateTime":"2021-09-14T19:10:50+08:00",
            "gid":"xaRollback",
            "trans_type":"xa",
            "data":"",
            "status":"failed",
            "query_prepared":"",
            "protocol":"http",
            "CommitTime":null,
            "FinishTime":null,
            "RollbackTime":"2021-09-14T19:10:50+08:00",
            "NextCronInterval":10,
            "NextCronTime":"2021-09-14T19:11:00+08:00"
        }
    ]
}
```

### 查询特定订单

``` bash
curl https://dtm.pub/api/dtmsvr/query?gid=xaRollback
```

gid: 订单gid，必选字段

响应结果：

``` json
{
    "branches":[
        {
            "ID":195,
            "CreateTime":"2021-09-14T19:10:50+08:00",
            "UpdateTime":"2021-09-14T19:10:50+08:00",
            "Gid":"xaRollback",
            "url":"http://localhost:8081/api/busi/xa",
            "Data":"",
            "branch_id":"0101",
            "BranchType":"commit",
            "Status":"prepared",
            "FinishTime":null,
            "RollbackTime":null
        },
        {
            "ID":194,
            "CreateTime":"2021-09-14T19:10:50+08:00",
            "UpdateTime":"2021-09-14T19:10:50+08:00",
            "Gid":"xaRollback",
            "url":"http://localhost:8081/api/busi/xa",
            "Data":"",
            "branch_id":"0101",
            "BranchType":"rollback",
            "Status":"succeed",
            "FinishTime":"2021-09-14T19:10:50+08:00",
            "RollbackTime":null
        }
    ],
    "transaction":{
        "ID":64,
        "CreateTime":"2021-09-14T19:10:50+08:00",
        "UpdateTime":"2021-09-14T19:10:50+08:00",
        "gid":"xaRollback",
        "trans_type":"xa",
        "data":"",
        "status":"failed",
        "query_prepared":"",
        "protocol":"http",
        "CommitTime":null,
        "FinishTime":null,
        "RollbackTime":"2021-09-14T19:10:50+08:00",
        "NextCronInterval":10,
        "NextCronTime":"2021-09-14T19:11:00+08:00"
    }
}
```
