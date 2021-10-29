# SAGA事务模式

SAGA最初出现在1987年Hector Garcaa-Molrna & Kenneth Salem发表的论文[SAGAS](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)里。其核心思想是将长事务拆分为多个本地短事务，由Saga事务协调器协调，如果正常结束那就正常完成，如果某个步骤失败，则根据相反顺序一次调用补偿操作。

如果我们要进行一个类似于银行跨行转账的业务，转出（TransOut）和转入（TransIn）分别在不同的微服务里，一个成功完成的SAGA事务典型的时序图如下：

![saga_normal](../imgs/saga_normal.jpg)


## 简单的SAGA

我们来完成一个最简单的SAGA：

### http

``` go
req := &gin.H{"amount": 30} // 微服务的载荷
// DtmServer为DTM服务的地址
saga := dtmcli.NewSaga(DtmServer, dtmcli.MustGenGid(DtmServer)).
  // 添加一个TransOut的子事务，正向操作为url: qsBusi+"/TransOut"， 逆向操作为url: qsBusi+"/TransOutCompensate"
  Add(qsBusi+"/TransOut", qsBusi+"/TransOutCompensate", req).
  // 添加一个TransIn的子事务，正向操作为url: qsBusi+"/TransIn"， 逆向操作为url: qsBusi+"/TransInCompensate"
  Add(qsBusi+"/TransIn", qsBusi+"/TransInCompensate", req)
// 提交saga事务，dtm会完成所有的子事务/回滚所有的子事务
err := saga.Submit()
```

详细例子代码参考[example/http_saga.go](https://github.com/yedf/dtm/blob/main/examples/http_saga.go)

### grpc

``` go
req := dtmcli.MustMarshal(&TransReq{Amount: 30})
gid := dtmgrpc.MustGenGid(DtmGrpcServer)
saga := dtmgrpc.NewSaga(DtmGrpcServer, gid).
  Add(BusiGrpc+"/examples.Busi/TransOut", BusiGrpc+"/examples.Busi/TransOutRevert", req).
  Add(BusiGrpc+"/examples.Busi/TransIn", BusiGrpc+"/examples.Busi/TransOutRevert", req)
err := saga.Submit()
```

详细例子代码参考[example/grpc_saga.go](https://github.com/yedf/dtm/blob/main/examples/grpc_saga.go)

上面的代码首先创建了一个SAGA事务，然后添加了两个子事务TransOut、TransIn，每个子事务包括action和compensate两个分支，分别为Add函数的第一第二个参数。子事务定好之后提交给dtm。dtm收到saga提交的全局事务后，会调用所有子事务的正向操作，如果所有正向操作成功完成，那么事务成功结束。

### 失败回滚

如果有正向操作失败，那么dtm会调用各分支的反向补偿操作，进行回滚，最后事务成功回滚。

我们将上述的第二个分支调用，传递参数，让他失败

``` go
  Add(qsBusi+"/TransIn", qsBusi+"/TransInCompensate", &TransReq{Amount: 30, TransInResult: "FAILURE"})
```

失败的时序图如下：

![saga_rollback](../imgs/saga_rollback.jpg)

### 补偿操作异常

假如补偿操作遇见失败会怎么样？按照Saga模式的协议，补偿操作是不允许失败的，遇见失败的情况，都是由于临时故障或者程序bug。dtm在补偿操作遇见失败时，会不断进行重试，直到成功。

为了避免程序bug导致补偿操作一直无法成功，建议开发者对全局事务表进行监控，发现重试超过3次的事务，发出报警，由运维人员找开发手动处理，参见[dtm的运维](../deploy/maintain)

## 并发SAGA

论文里面的SAGA提到了分支事务并发执行模式，这种模式，能够缩短SAGA事务的总执行时间，DTM对此也进行了支持：

并发SAGA通过dtmlic.NewConcurrentSaga创建，当saga提交后，多个事务分支之间是并发执行。DTM也支持指定事务分支之间的依赖关系，可以指定特定任务A执行完成之后才能够执行任务B。


### http

``` go
  req := &TransReq{Amount: 30}
  csaga := dtmcli.NewSaga(DtmServer, dtmcli.MustGenGid(DtmServer)).
    Add(Busi+"/TransOut", Busi+"/TransOutRevert", req).
    Add(Busi+"/TransOut", Busi+"/TransOutRevert", req).
    Add(Busi+"/TransIn", Busi+"/TransInRevert", req).
    Add(Busi+"/TransIn", Busi+"/TransInRevert", req).
    EnableConcurrent(). // 打开并发开关
    AddStepOrder(2, []int{0, 1}). // 这里指定 step 2 需要在 step 0, step 1之后执行
    AddStepOrder(3, []int{0, 1}) // 这里指定 step 3 需要在 step 0, step 1之后执行
  err := csaga.Submit()
```

详细例子代码参考[example/http_saga.go](https://github.com/yedf/dtm/blob/main/examples/http_saga.go)

### 失败回滚

并发SAGA如果出现回滚，那么所有回滚的补偿分支会全部并发执行，不再考虑前面的任务依赖。

由于并发SAGA的正向分支和补偿分支都是并发执行的，因此更容易出现空补偿和悬挂情况，需要参考DTM的子事务屏障环节妥善处理

