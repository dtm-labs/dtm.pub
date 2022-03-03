# 二阶段消息例子
本文将介绍一个完整的二阶段消息例子，让读者对二阶段消息型事务有一个准确的了解

## 业务场景
跨行转账是典型的分布式事务场景，在这里，A需要跨行转账给B，假设需求场景是：只有转出A可能失败，转入B是能够最终成功的

## 二阶段消息

二阶段消息是dtm首创的事务模式，用于替换本地事务表和事务消息这两种现有的方案。它能够保证本地事务的提交和全局事务提交是“原子的”，适合解决不需要回滚的分布式事务场景。下面我们来看看二阶段消息，如果解决这个业务场景的问题。

## 核心业务

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

再来编写具体的处理函数

``` GO
app.POST(BusiAPI+"/SagaBTransIn", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  return barrier.Call(txGet(), func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransInUID, reqFrom(c).Amount, "")
  })
}))
```

这些处理函数的核心逻辑都是是调整余额。这里面的`barrier.Call`主要是用于处理幂等，保证重复调用不会多次调整余额，详情参见[异常与子事务屏障](../practice/barrier)

## 二阶段消息事务

到此各个子事务的处理函数已经OK了，然后是开启二阶段消息事务，进行分支调用
``` GO
		msg := dtmcli.NewMsg(DtmServer, dtmcli.MustGenGid(DtmServer)).
			Add(busi.Busi+"/SagaBTransIn", &TransReq{ Amount: 30 })
		err := msg.DoAndSubmitDB(busi.Busi+"/QueryPreparedB", dbGet(), func(tx *sql.Tx) error {
			return busi.SagaAdjustBalance(tx, busi.TransOutUID, -req.Amount)
		})
```

这段代码中，会保证 DoAndSubmitDB 中的业务提交和全局事务提交是“原子的”，保证了TransOut和TransIn的同时成功，或同时失败。其中 DoAndSubmitDB 中的第一个参数为回查URL，他的代码如下：
``` go
app.GET(BusiAPI+"/QueryPreparedB", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  bb := MustBarrierFromGin(c)
  return bb.QueryPrepared(dbGet())
}))
```

至此，一个完整的二阶段消息分布式事务编写完成。

如果您想要完整运行一个成功的示例，步骤如下：
1. 运行dtm
``` bash
git clone https://github.com/dtm-labs/dtm && cd dtm
go run main.go
```

2. 运行例子

``` bash
git clone https://github.com/dtm-labs/dtm-examples && cd dtm-examples
go run main.go http_msg_doAndCommit
```

## 如何保证原子性

二阶段消息如何保证本地事务和全局事务要么都成功，要么都失败呢？假定本地事务提交完成后，提交全局事务前，进程crash会如何？下面时序图很好的讲解了二阶段消息是如何处理这个问题的：

![msg_query](../imgs/msg_query.jpg)

图中的回查处理逻辑，dtm已经做了自动处理，用户只需要粘贴上述的代码即可

## 小结

本文给出了一个完整的二阶段消息事务方案，是一个可以实际运行的二阶段消息，您只需要在这个示例的基础上进行简单修改，就能够用于解决您的真实问题