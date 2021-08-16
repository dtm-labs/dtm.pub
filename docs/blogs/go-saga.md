# 用Go轻松完成一个SAGA分布式事务，保姆级教程

银行跨行转账业务是一个典型分布式事务场景，假设A需要跨行转账给B，那么就涉及两个银行的数据，无法通过一个数据库的本地事务保证转账的ACID，只能够通过分布式事务来解决。

## 分布式事务

分布式事务在分布式环境下，为了满足可用性、性能与降级服务的需要，降低一致性与隔离性的要求，一方面遵循 BASE 理论：

- 基本业务可用性（Basic Availability）
- 柔性状态（Soft state）
- 最终一致性（Eventual consistency）

另一方面，分布式事务也部分遵循 ACID 规范：

- 原子性：严格遵循
- 一致性：事务完成后的一致性严格遵循；事务中的一致性可适当放宽
- 隔离性：并行事务间不可影响；事务中间结果可见性允许安全放宽
- 持久性：严格遵循

## SAGA

Saga是这一篇数据库论文[SAGAS](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)提到的一个分布式事务方案。其核心思想是将长事务拆分为多个本地短事务，由Saga事务协调器协调，如果各个本地事务成功完成那就正常完成，如果某个步骤失败，则根据相反顺序一次调用补偿操作。

目前可用于SAGA的开源框架，主要为Java语言，其中以seata为代表。我们的例子采用go语言，使用的分布式事务框架为[https://github.com/yedf/dtm](https://github.com/yedf/dtm)，它对分布式事务的支持非常优雅。下面来详细讲解SAGA的组成：

DTM事务框架里，有3个角色，与经典的XA分布式事务一样：

- AP/应用程序，发起全局事务，定义全局事务包含哪些事务分支
- RM/资源管理器，负责分支事务各项资源的管理
- TM/事务管理器，负责协调全局事务的正确执行，包括SAGA正向/逆向操作的执行

下面看一个成功完成的SAGA时序图，就很容易理解SAGA分布式事务：

![image.png](../imgs/saga_normal.jpg)

## SAGA实践

对于我们要进行的银行转账的例子，我们将在正向操作中，进行转入转出，在补偿操作中，做相反的调整。

首先我们创建账户余额表：
``` Go
CREATE TABLE dtm_busi.`user_account` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `user_id` int(11) not NULL UNIQUE ,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `create_time` datetime DEFAULT now(),
  `update_time` datetime DEFAULT now()
);

```

我们先编写核心业务代码，调整用户的账户余额

``` Go
func qsAdjustBalance(uid int, amount int) (interface{}, error) {
	_, err := dtmcli.SdbExec(sdbGet(), "update dtm_busi.user_account set balance = balance + ? where user_id = ?", amount, uid)
	return dtmcli.ResultSuccess, err
}
```

下面我们来编写具体的正向操作/补偿操作的处理函数

``` GO
	app.POST(qsBusiAPI+"/TransIn", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return qsAdjustBalance(2, 30)
	}))
	app.POST(qsBusiAPI+"/TransInCompensate", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return qsAdjustBalance(2, -30)
	}))
	app.POST(qsBusiAPI+"/TransOut", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return qsAdjustBalance(1, -30)
	}))
	app.POST(qsBusiAPI+"/TransOutCompensate", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return qsAdjustBalance(1, 30)
	}))
```

到此各个子事务的处理函数已经OK了，然后是开启SAGA事务，进行分支调用
``` GO
	req := &gin.H{"amount": 30} // 微服务的载荷
	// DtmServer为DTM服务的地址
	saga := dtmcli.NewSaga(DtmServer, dtmcli.MustGenGid(DtmServer)).
		// 添加一个TransOut的子事务，正向操作为url: qsBusi+"/TransOut"， 逆向操作为url: qsBusi+"/TransOutCompensate"
		Add(qsBusi+"/TransOut", qsBusi+"/TransOutCompensate", req).
		// 添加一个TransIn的子事务，正向操作为url: qsBusi+"/TransOut"， 逆向操作为url: qsBusi+"/TransInCompensate"
		Add(qsBusi+"/TransIn", qsBusi+"/TransInCompensate", req)
	// 提交saga事务，dtm会完成所有的子事务/回滚所有的子事务
	err := saga.Submit()

```

至此，一个完整的SAGA分布式事务编写完成。

如果您想要完整运行一个成功的示例，那么按照yedf/dtm项目的说明搭建好环境之后，通过下面命令运行saga的例子即可：

``` bash
go run app/main.go quick_start
```

## 处理网络异常

假设提交给dtm的事务中，调用转入操作时，出现短暂的故障怎么办？按照SAGA事务的协议，dtm会重试未完成的操作，这时我们要如何处理？故障有可能是转入操作完成后出网络故障，也有可能是转入操作完成中出现机器宕机。如何处理才能够保障账户余额的调整是正确无问题的？

DTM提供了子事务屏障功能，保证多次重试，只会有一次成功提交。（子事务屏障不仅保证幂等，还能够解决空补偿等问题，详情参考[分布式事务最经典的七种解决方案](https://segmentfault.com/a/1190000040321750)的子事务屏障环节）

我们把处理函数调整为：

``` Go
func sagaBarrierAdjustBalance(sdb *sql.Tx, uid int, amount int) (interface{}, error) {
	_, err := dtmcli.StxExec(sdb, "update dtm_busi.user_account set balance = balance + ? where user_id = ?", amount, uid)
	return dtmcli.ResultSuccess, err

}

func sagaBarrierTransIn(c *gin.Context) (interface{}, error) {
	return dtmcli.ThroughBarrierCall(sdbGet(), MustGetTrans(c), func(sdb *sql.Tx) (interface{}, error) {
		return sagaBarrierAdjustBalance(sdb, 1, reqFrom(c).Amount)
	})
}

func sagaBarrierTransInCompensate(c *gin.Context) (interface{}, error) {
	return dtmcli.ThroughBarrierCall(sdbGet(), MustGetTrans(c), func(sdb *sql.Tx) (interface{}, error) {
		return sagaBarrierAdjustBalance(sdb, 1, -reqFrom(c).Amount)
	})
}
```

这里的dtmcli.TroughBarrierCall调用会使用子事务屏障技术，保证第三个参数里的回调函数仅被处理一次​

您可以尝试多次调用这个TransIn服务，仅有一次余额调整。您可以运行以下命令，运行新的处理方式：
``` bash
go run app/main.go saga_barrier
```

## 处理回滚

假如银行将金额准备转入用户2时，发现用户2的账户异常，返回失败，会怎么样？我们调整处理函数，让转入操作返回失败

``` go
func sagaBarrierTransIn(c *gin.Context) (interface{}, error) {
	return dtmcli.ResultFailure, nil
}
```

我们给出事务失败交互的时序图

![image.png](../imgs/saga_rollback.jpg)

这里有一点，TransIn的正向操作什么都没有做，就返回了失败，此时调用TransIn的补偿操作，会不会导致反向调整出错了呢？

不用担心，前面的子事务屏障技术，能够保证TransIn的错误如果发生在提交之前，则补偿为空操作；TransIn的错误如果发生在提交之后，则补偿操作会将数据提交一次。

您可以将返回错误的TransIn改成：
``` Go
func sagaBarrierTransIn(c *gin.Context) (interface{}, error) {
	dtmcli.ThroughBarrierCall(sdbGet(), MustGetTrans(c), func(sdb *sql.Tx) (interface{}, error) {
		return sagaBarrierAdjustBalance(sdb, 1, 30)
	})
	return dtmcli.ResultFailure, nil
}
```
最后的结果余额依旧会是对的，原理可以参考：[分布式事务最经典的七种解决方案](https://segmentfault.com/a/1190000040321750)的子事务屏障环节

## 小结

在这篇文章里，我们介绍了SAGA的理论知识，也通过一个例子，完整给出了编写一个SAGA事务的过程，涵盖了正常成功完成，异常情况，以及成功回滚的情况。相信读者通过这边文章，对SAGA已经有了深入的理解。

文中使用的dtm是新开源的Golang分布式事务管理框架，功能强大，支持TCC、SAGA、XA、事务消息等事务模式，支持Go、python、PHP、node、csharp等语言的。同时提供了非常简单易用的接口。

阅读完此篇干货，欢迎大家访问项目[https://github.com/yedf/dtm](https://github.com/yedf/dtm)，给颗星星支持！
