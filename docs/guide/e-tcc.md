# TCC 例子

本文将介绍一个完整的 TCC 例子，让读者对 TCC 型事务有一个准确的了解

## 业务场景
跨行转账是典型的分布式事务场景，在这里，A需要跨行转账给B，假设需求场景是：转出A和转入B都有可能成功和失败，需要最终转入转出都成功，或者都失败。

同时这里还有一个要求，假如发生回滚，SAGA 模式下会发生A发现自己的余额被扣减了，但是收款方B迟迟没有收到余额，那么会对A造成很大的困扰。业务上面希望不要出现这种情况

## TCC组成
TCC分为3个阶段

- Try 阶段：尝试执行，完成所有业务检查（一致性）, 预留必须业务资源（准隔离性）
- Confirm 阶段：如果所有分支的Try都成功了，则走到Confirm阶段。Confirm真正执行业务，不作任何业务检查，只使用 Try 阶段预留的业务资源
- Cancel 阶段：如果所有分支的Try有一个失败了，则走到Cancel阶段。Cancel释放 Try 阶段预留的业务资源。

如果我们要进行一个类似于银行跨行转账的业务，转出（TransOut）和转入（TransIn）分别在不同的微服务里，一个成功完成的TCC事务典型的时序图如下：
![tcc_normal](../imgs/tcc_normal.jpg)

## 核心业务
首先我们创建账户余额表，其中 trading_balance 表示被冻结的金额：
```
create table if not exists dtm_busi.user_account(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  user_id int(11) UNIQUE,
  balance DECIMAL(10, 2) not null default '0',
  trading_balance DECIMAL(10, 2) not null default '0',
  create_time datetime DEFAULT now(),
  update_time datetime DEFAULT now(),
  key(create_time),
  key(update_time)
);
```

我们先编写核心代码，冻结/解冻资金操作，会检查约束balance+trading_balance >= 0，如果约束不成立，执行失败

``` go
func tccAdjustTrading(db dtmcli.DB, uid int, amount int) error {
	affected, err := dtmimp.DBExec(db, `update dtm_busi.user_account
		set trading_balance=trading_balance+?
		where user_id=? and trading_balance + ? + balance >= 0`, amount, uid, amount)
	if err == nil && affected == 0 {
		return fmt.Errorf("update error, maybe balance not enough")
	}
	return err
}

func tccAdjustBalance(db dtmcli.DB, uid int, amount int) error {
	affected, err := dtmimp.DBExec(db, `update dtm_busi.user_account
		set trading_balance=trading_balance-?,
		balance=balance+? where user_id=?`, amount, amount, uid)
	if err == nil && affected == 0 {
		return fmt.Errorf("update user_account 0 rows")
	}
	return err
}
```

下面我们来编写具体的Try/Confirm/Cancel的处理函数


``` go
app.POST(BusiAPI+"/TccBTransOutTry", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  return bb.Call(txGet(), func(tx *sql.Tx) error {
    return tccAdjustTrading(tx, TransOutUID, -req.Amount)
  })
}))
app.POST(BusiAPI+"/TccBTransOutConfirm", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  return bb.Call(txGet(), func(tx *sql.Tx) error {
    return tccAdjustBalance(tx, TransOutUID, -reqFrom(c).Amount)
  })
}))
app.POST(BusiAPI+"/TccBTransOutCancel", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  return bb.Call(txGet(), func(tx *sql.Tx) error {
    return tccAdjustTrading(tx, TransOutUID, req.Amount)
  })
}))
app.POST(BusiAPI+"/TccBTransInTry", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  return bb.Call(txGet(), func(tx *sql.Tx) error {
    return tccAdjustTrading(tx, TransInUID, req.Amount)
  })
}))
app.POST(BusiAPI+"/TccBTransOutConfirm", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  return bb.Call(txGet(), func(tx *sql.Tx) error {
    return tccAdjustBalance(tx, TransInUID, reqFrom(c).Amount)
  })
}))
app.POST(BusiAPI+"/TccBTransInCancel", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  return bb.Call(txGet(), func(tx *sql.Tx) error {
    return tccAdjustTrading(tx, TransInUID, -req.Amount)
  })
}))
```

到此各个子事务的处理函数已经OK了，这些处理函数的核心逻辑都是冻结和调整余额，对于这里面的`bb.Call`作用，后面会详细解释

## TCC 事务
然后是开启TCC事务，进行分支调用

``` go
// TccGlobalTransaction 会开启一个全局事务
_, err := dtmcli.TccGlobalTransaction(DtmServer, func(tcc *dtmcli.Tcc) (rerr error) {
  // CallBranch 会将事务分支的Confirm/Cancel注册到全局事务上，然后直接调用Try
  res1, rerr := tcc.CallBranch(&TransReq{Amount: 30}, host+"/api/TccBTransOutTry", host+"/api/TccBTransOutConfirm", host+"/api/TccBTransOutCancel"
  if err != nil {
    return resp, err
  }
  return tcc.CallBranch(&TransReq{Amount: 30}, host+"/api/TccBTransInTry", host+"/api/TccBTransInConfirm", host+"/api/TccBTransInCancel")
})
```

至此，一个完整的TCC分布式事务编写完成。

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
go run main.go http_tcc_barrier
```

## 处理网络异常

假设提交给dtm的事务中，这些步骤中，出现短暂的故障怎么办？dtm 会重试未完成的操作，此时就会要求全局事务中的各个子事务是幂等的。dtm 框架首创子事务屏障技术，提供 BranchBarrier 工具类，可以帮助用户简单的处理幂等。它提供了一个函数 Call ，保证这个函数内部的业务，会被最多调用一次：
``` go
func (bb *BranchBarrier) Call(tx *sql.Tx, busiCall BarrierBusiFunc) error
```

该 BranchBarrier 不仅能够自动处理幂等，还能够自动处理空补偿、悬挂的问题，详情可以参考[异常与子事务屏障](../practice/barrier)

### TCC的回滚
假如银行将金额准备转入用户2时，发现用户2的账户异常，返回失败，会怎么样？我们修改代码，模拟这种情况：
``` go
app.POST(BusiAPI+"/TccBTransInTry", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  return dtmcli.ErrFailure
}))
```
这是事务失败交互的时序图
![tcc_rollback](../imgs/tcc_rollback.jpg)

这个跟成功的TCC差别就在于，当某个子事务返回失败后，后续就回滚全局事务，调用各个子事务的Cancel操作，保证全局事务全部回滚。

这里有一点，TransInTry的正向操作什么都没有做，就返回了失败，此时调用TransInCancel补偿操作，会不会导致反向调整出错了呢？

不用担心，前面的子事务屏障技术，能够保证TransInTry的错误如果发生在提交之前，则补偿为空操作；TransInTry的错误如果发生在提交之后，则补偿操作会将数据提交一次。

您可以将 `TccBTransInTry`改成
``` go
app.POST(BusiAPI+"/TccBTransInTry", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  bb.Call(txGet(), func(tx *sql.Tx) error {
    return tccAdjustTrading(tx, TransInUID, req.Amount)
  })
  return dtmcli.ErrFailure
}))
```

最后的结果余额依旧会是对的，详情可以参考[异常与子事务屏障](../practice/barrier)

### 小结

本文给出了一个完整的 TCC 事务方案，是一个可以实际运行的 TCC，您只需要在这个示例的基础上进行简单修改，就能够用于解决您的真实问题

关于更多TCC的原理，可以参见[TCC](../practice/tcc)