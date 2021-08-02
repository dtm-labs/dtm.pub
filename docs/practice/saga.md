# SAGA事务模式

SAGA最初出现在1987年Hector Garcaa-Molrna & Kenneth Salem发表的论文[SAGAS](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)里。其核心思想是将长事务拆分为多个本地短事务，由Saga事务协调器协调，如果正常结束那就正常完成，如果某个步骤失败，则根据相反顺序一次调用补偿操作。

如果我们要进行一个类似于银行跨行转账的业务，转出（TransOut）和转入（TransIn）分别在不同的微服务里，一个成功完成的SAGA事务典型的时序图如下：

![saga_normal](../imgs/saga_normal.jpg)


## 简单的SAGA

我们来完成一个最简单的TCC：

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

上面的代码首先创建了一个SAGA事务，然后添加了两个子事务TransOut、TransIn，每个子事务包括action和compensate两个分支，分别为Add函数的第一第二个参数。子事务定好之后提交给dtm。dtm收到saga提交的全局事务后，会调用所有子事务的正向操作，如果所有正向操作成功完成，那么事务成功结束。

### 失败回滚

如果有正向操作失败，那么dtm会调用各分支的反响操作，进行回滚，最后事务成功回滚。

我们将上述的第二个分支调用，传递参数，让他失败

``` go
  Add(qsBusi+"/TransIn", qsBusi+"/TransInCompensate", &TransReq{Amount: 30, TransInResult: "FAILURE"})
```

失败的时序图如下：

![saga_rollback](../imgs/saga_rollback.jpg)


## 高级SAGA

论文里面的SAGA内容较多，包括两种恢复策略，包括分支事务并发执行，我们这里的讨论，仅包括最简单的SAGA。

对于SAGA的高级用法，例如分支事务并发执行，后续dtm会开发支持

