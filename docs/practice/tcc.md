# TCC事务模式
什么是TCC，TCC是Try、Confirm、Cancel三个词语的缩写，最早是由 Pat Helland 于 2007 年发表的一篇名为《Life beyond Distributed Transactions:an Apostate’s Opinion》的论文提出。

## TCC组成
TCC分为3个阶段

- Try 阶段：尝试执行，完成所有业务检查（一致性）, 预留必须业务资源（准隔离性）
- Confirm 阶段：如果所有分支的Try都成功了，则走到Confirm阶段。Confirm真正执行业务，不作任何业务检查，只使用 Try 阶段预留的业务资源
- Cancel 阶段：如果所有分支的Try有一个失败了，则走到Cancel阶段。Cancel释放 Try 阶段预留的业务资源。

如果我们要进行一个类似于银行跨行转账的业务，转出（TransOut）和转入（TransIn）分别在不同的微服务里，一个成功完成的TCC事务典型的时序图如下：

![tcc_normal](../imgs/tcc_normal.jpg)

## 简单的TCC

我们来完成一个最简单的TCC：

``` go
err := dtmcli.TccGlobalTransaction(DtmServer, gid, func(tcc *dtmcli.Tcc) (*resty.Response, error) {
  resp, err := tcc.CallBranch(&TransReq{Amount: 30}, Busi+"/TransOut", Busi+"/TransOutConfirm", Busi+"/TransOutRevert")
  if err != nil {
    return resp, err
  }
  return tcc.CallBranch(&TransReq{Amount: 30}, Busi+"/TransIn", Busi+"/TransInConfirm", Busi+"/TransInRevert")
})
```

详细例子代码参考[dtm-examples](https://github.com/dtm-labs/dtm-examples)：

调用TccGlobalTransaction会开启一个全局的tcc事务。他的声明如下：

``` go
// TccGlobalTransaction begin a tcc global transaction
// dtm dtm服务器地址
// gid 全局事务id
// tccFunc tcc事务函数，里面会定义全局事务的分支
func TccGlobalTransaction(dtm string, gid string, tccFunc TccGlobalFunc) error
```

开启成功之后，会调用第三个参数传递的函数tccFunc。我们在这个函数的内部调用了CallBranch来定义了两个子事务TransOut和TransIn。

``` go
// CallBranch call a tcc branch
// 函数首先注册子事务的所有分支操作，成功后调用try，返回try的调用结果
func (t *Tcc) CallBranch(body interface{}, tryURL string, confirmURL string, cancelURL string) (*resty.Response, error)
```

当tccFunc正常返回时，TccGlobalTransaction会提交全局事务，然后返回给调用者。dtm收到提交请求，则会调用所有注册事务分支的二阶段Confirm。TccGlobalTransaction返回时，一阶段的Try已经全部完成，但是二阶段的Confirm通常还未完成。

## 失败回滚

如果tccFunc返回错误，TccGlobalTransaction会终止全局事务，然后返回给调用者。dtm收到终止请求，则会调用所有注册子事务的二阶段Cancel。

我们将上述的第二个Try调用，传递参数，让他失败

``` go
res2, rerr := tcc.CallBranch(&TransReq{Amount: 30, TransInResult: "FAILURE"}, Busi+"/TransIn", Busi+"/TransInConfirm", Busi+"/TransInRevert")
```

失败的时序图如下：

![tcc_rollback](../imgs/tcc_rollback.jpg)

## Confirm/Cancel操作异常

假如Confirm/Cancel操作遇见失败会怎么样？按照Tcc模式的协议，Confirm/Cancel操作是不允许失败的，遇见失败的情况，都是由于临时故障或者程序bug。dtm在Confirm/Cancel操作遇见失败时，会不断进行重试，直到成功。

为了避免程序bug导致补偿操作一直无法成功，建议开发者对全局事务表进行监控，发现重试超过3次的事务，发出报警，由运维人员找开发手动处理，参见[dtm的运维](../deploy/maintain)

## TCC 设计原则
在设计上，TCC主要用于处理一致性要求较高、需要较多灵活性的短事务：

### TCC如何做到更好的一致性
对于我们的 A 跨行转账给 B 的场景，如果采用SAGA，在正向操作中调余额，在补偿操作中，反向调整余额，那么会出现这种情况：如果A扣款成功，金额转入B失败，最后回滚，把A的余额调整为初始值。整个过程中如果A发现自己的余额被扣减了，但是收款方B迟迟没有收到资金，那么会对A造成非常大的困扰。

上述需求在SAGA中无法解决，但是可以通过TCC来解决，设计技巧如下：
- 在账户中的 balance 字段之外，再引入一个 trading_balance 字段
- Try 阶段检查账户是否被冻结，检查账户余额是否充足，没问题后，调整 trading_balance （即业务上的冻结资金）
- Confirm 阶段，调整 balance ，调整 trading_balance （即业务上的解冻资金）
- Cancel 阶段，调整 trading_balance （即业务上的解冻资金）

这种情况下，终端用户 A 就不会看到自己的余额扣减了，但是 B 又迟迟收不到资金的情况

### 为什么只适合短事务

TCC 的事务编排放在了应用端上，就是事务一共包含多少个分支，每个分支的顺序什么样，这些信息不会像 SAGA 那样，都发送给dtm服务器之后，再去调用实际的事务分支。当应用出现 crash 或退出，编排信息丢失，那么整个全局事务，就没有办法往前重试，只能够进行回滚。如果全局事务持续时间很长，例如一分钟以上，那么当应用进行正常的发布升级时，也会导致全局事务回滚，影响业务。因此 TCC 会更适合短事务。

那么是否可以把TCC的事务编排都保存到服务器，保证应用重启也不受到影响呢？理论上这种做法是可以解决这个问题的，但是存储到服务器会比在应用端更不灵活，无法获取到每个分支的中间结果，无法做嵌套等等。

考虑到一致性要求较高和短事务是高度相关的（一个中间不一致状态持续很长时间的事务，自然不能算一致性较好），这两者跟“应用灵活编排”，也是有较高相关度，所以将 TCC 实现为应用端编排，而 SAGA 实现为服务端编排。

## 嵌套的TCC

dtm的Tcc事务模式，支持子事务嵌套，流程图如下：

![nested_trans](../imgs/nested_trans.jpg)

在这个流程图中，Order这个微服务，管理了订单相关的数据修改，同时还管理了一个嵌套的子事务，因此他即扮演了RM的角色，也扮演了AP的角色。

#### 示例

tcc支持嵌套的子事务，代码如下(具体源码参考[dtm-examples](https://github.com/dtm-labs/dtm-examples))：

``` go
err := dtmcli.TccGlobalTransaction(DtmServer, gid, func(tcc *dtmcli.Tcc) (*resty.Response, error) {
  resp, err := tcc.CallBranch(&TransReq{Amount: 30}, Busi+"/TransOut", Busi+"/TransOutConfirm", Busi+"/TransOutRevert")
  if err != nil {
    return resp, err
  }
  return tcc.CallBranch(&TransReq{Amount: 30}, Busi+"/TransInTccParent", Busi+"/TransInConfirm", Busi+"/TransInRevert")
})
```

这里的TransInTccParent子事务，里面会再调用TransIn子事务，代码如下：

``` go
app.POST(BusiAPI+"/TransInTccParent", common.WrapHandler2(func(c *gin.Context) interface{} {
  tcc, err := dtmcli.TccFromReq(c)
  if err != nil {
    return err
  }
  logrus.Printf("TransInTccParent ")
  return tcc.CallBranch(&TransReq{Amount: reqFrom(c).Amount}, Busi+"/TransIn", Busi+"/TransInConfirm", Busi+"/TransInRevert")
}))
```

子事务嵌套时，从传入的请求中构建tcc对象，然后就能够正常使用tcc对象，进行相关的事务。

## 小结

在本节的教程中，我们简单介绍了TCC的理论知识，也通过几个例子，完整给出了编写一个TCC事务的过程，涵盖了正常成功完成，以及失败回滚的情况。另外还演示一个嵌套子事务。

完整的一个TCC事务教程，可以参考 [TCC教程](https://segmentfault.com/a/1190000040331793)