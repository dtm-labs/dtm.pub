# SAGA 例子
本文将介绍一个完整的 SAGA 例子，让读者对 SAGA 型事务有一个准确的了解

## 业务场景
跨行转账是典型的分布式事务场景，在这里，A需要跨行转账给B，假设需求场景是：转出A和转入B都有可能成功和失败，需要最终转入转出都成功，或者都失败

## SAGA

Saga是这一篇数据库论文[SAGAS](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)提到的一个分布式事务方案。其核心思想是将长事务拆分为多个本地短事务，由Saga事务协调器协调，如果各个本地事务成功完成那就正常完成，如果某个步骤失败，则根据相反顺序一次调用补偿操作。

## 核心业务

对于我们要进行的银行转账的例子，我们将在正向操作中，进行转入转出，在补偿操作中，做相反的调整。

首先我们创建账户余额表：
``` Go
CREATE TABLE dtm_busi.`user_account` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `user_id` int(11) not NULL UNIQUE ,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `trading_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `create_time` datetime DEFAULT now(),
  `update_time` datetime DEFAULT now()
);
```

然后编写核心业务代码，调整用户的账户余额

``` Go
func SagaAdjustBalance(db dtmcli.DB, uid int, amount int, result string) error {
	_, err := dtmimp.DBExec(db, "update dtm_busi.user_account set balance = balance + ? where user_id = ?", amount, uid)
	return err
}
```

再来编写具体的正向操作/补偿操作的处理函数

``` GO
app.POST(BusiAPI+"/SagaBTransIn", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  return barrier.Call(txGet(), func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransInUID, reqFrom(c).Amount, "")
  })
}))
app.POST(BusiAPI+"/SagaBTransInCom", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  return barrier.Call(txGet(), func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransInUID, -reqFrom(c).Amount, "")
  })
}))
app.POST(BusiAPI+"/SagaBTransOut", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  return barrier.Call(txGet(), func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransOutUID, -reqFrom(c).Amount, "")
  })
}))
app.POST(BusiAPI+"/SagaBTransOutCom", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  return barrier.Call(txGet(), func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransOutUID, reqFrom(c).Amount, "")
  })
}))
```

这些处理函数的核心逻辑都是是调整余额，对于这里面的`barrier.Call`作用，后面会详细解释

## SAGA 事务

到此各个子事务的处理函数已经OK了，然后是开启SAGA事务，进行分支调用
``` GO
	req := &gin.H{"amount": 30} // 微服务的载荷
	// DtmServer为DTM服务的地址
	saga := dtmcli.NewSaga(DtmServer, dtmcli.MustGenGid(DtmServer)).
		// 添加一个TransOut的子事务，正向操作为url: qsBusi+"/TransOut"， 逆向操作为url: qsBusi+"/TransOutCom"
		Add(qsBusi+"/SagaBTransOut", qsBusi+"/SagaBTransOutCom", req).
		// 添加一个TransIn的子事务，正向操作为url: qsBusi+"/TransOut"， 逆向操作为url: qsBusi+"/TransInCom"
		Add(qsBusi+"/SagaBTransIn", qsBusi+"/SagaBTransInCom", req)
	// 提交saga事务，dtm会完成所有的子事务/回滚所有的子事务
	err := saga.Submit()

```

至此，一个完整的SAGA分布式事务编写完成。

## 运行
如果您想要完整运行一个成功的示例，步骤如下：
1. 运行dtm
``` bash
git clone https://github.com/dtm-labs/dtm && cd dtm
go run main.go
```

2. 运行例子

``` bash
git clone https://github.com/dtm-labs/dtm-examples && cd dtm-examples
go run main.go http_saga_barrier
```

时序图如下：
![saga_normal](../imgs/saga_normal.jpg)

## 处理网络异常

假设提交给dtm的事务中，调用转入操作时，出现短暂的故障怎么办？dtm 会重试未完成的操作，此时就会要求全局事务中的各个子事务是幂等的。dtm 框架首创子事务屏障技术，提供 BranchBarrier 工具类，可以帮助用户简单的处理幂等。它提供了一个函数 Call ，保证这个函数内部的业务，会被最多调用一次：
``` go
func (bb *BranchBarrier) Call(tx *sql.Tx, busiCall BarrierBusiFunc) error
```

该 BranchBarrier 不仅能够自动处理幂等，还能够自动处理空补偿、悬挂的问题，详情可以参考[异常与子事务屏障](../practice/barrier)

## 处理回滚

假如银行将金额准备转入用户2时，发现用户2的账户异常，返回失败，会怎么样？我们调整处理函数，让转入操作返回失败

``` go
app.POST(BusiAPI+"/SagaBTransIn", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  return dtmcli.ErrFailure
}))
```

我们给出事务失败交互的时序图

![saga_rollback](../imgs/saga_rollback.jpg)

这里有一点，TransIn的正向操作什么都没有做，就返回了失败，此时调用TransIn的补偿操作，会不会导致反向调整出错了呢？

不用担心，前面的子事务屏障技术，能够保证TransIn的错误如果发生在提交之前，则补偿为空操作；TransIn的错误如果发生在提交之后，则补偿操作会将数据提交一次。

您可以将返回错误的TransIn改成：
``` Go
app.POST(BusiAPI+"/SagaBTransIn", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  barrier.Call(txGet(), func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransInUID, reqFrom(c).Amount, "")
  })
  return dtmcli.ErrFailure
}))
```
最后的结果余额依旧会是对的，详情可以参考[异常与子事务屏障](../practice/barrier)

## 小结

本文给出了一个完整的 SAGA 事务方案，是一个可以实际运行的 SAGA，您只需要在这个示例的基础上进行简单修改，就能够用于解决您的真实问题

关于更多SAGA的原理，可以参见[SAGA](../practice/saga)