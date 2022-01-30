# 订单系统
dtm 可以应用于订单系统，可以大幅简化订单系统的架构，下面详细说明

## 现有问题
大多数的订单系统都已经服务化，会将订单系统拆分为订单服务、库存服务、优惠券服务、支付服务、账户服务等等。整个订单处理过程中，有许多的操作（例如创建订单与扣减库存）需要保证原子性，但是在分布式系统中，保证这些操作的原子性，有大量的难题需要解决，下面我们来详细探讨其中一个典型的问题，逐步给出更好的架构方案。

场景：当前端的用户提交订单，服务端需要完成以下操作：
- 创建订单：需要在订单表中创建订单，唯一键为订单ID
- 扣减库存：需要给用户下单的商品扣减库存
- 扣减优惠券：用户在下单前，选择了可使用的优惠券，提交订单时，则扣减这部分优惠券
- 创建支付单：提交订单后，需要创建支付单，最后告诉用户跳转到支付页

对于上述这个场景，如果在单体订单系统中，很容易使用数据库的事务来解决。但是一旦服务化了之后，那就需要考虑分布式系统中的问题，我们将逐步分析其中的问题，并给出解决方案。

#### 进程 crash 问题
我们在下单api中，按顺序调用: 创建订单->扣减库存->扣减优惠券->创建支付单，但是在这个调用过程中，有一定的概率会发生进程 crash ，导致这几个步骤，仅完成了一部分，还有一部分未完成。

这是一个常见问题，只要订单量变大，就会常见。有以下几种处理方案：
- 允许不一致：很小的公司可能会允许这种不一致数据出现，反馈到客服，或者监测到这种情况发生，则开发人员人肉处理；
- 消息队列保证最少成功一次：为了避免上述不一致的情况，可以把下单中的各个操作放到消息队列，当出现进程 crash ，那么相关消息还在队列中，会再次被消费，保证至少成功一次，但是队列无法保证有且仅有一次，因此相关操作都必须幂等，详细情况后面小节详述
- 状态机实现：很多大厂通过实现复杂的状态机，来定义订单的每个状态、每个操作的状态流转。这个方案非常复杂，多数中小厂，没有这么强的研发力量

#### 幂等问题
一旦到了分布式系统中，会有一定的概率出现重复请求。例如前面的消息队列方案，保证至少被成功消费一次，但是可能被多次消费，这就会出现重复请求。另外在微服务领域，为了防止网络临时失败，导致请求失败，也常常会配置重试策略。

假设这样的场景，扣减库存的数据库事务提交之后，进程 crash 了，那么这次的请求结果未知，按照前面介绍的场景，会进行重试。当处理重复请求时，库存服务需要判断出这是重复请求，不能再扣减库存，而是直接返回扣减成功。

扣减优惠券、创建支付单等其他操作，也需要做幂等处理，这类的处理虽然难度并不高，但依旧有不小的工作量，而且不易复现所有的异常情况，因此线上出现重复请求时，容易出现问题，耗费开发人员大量的时间

#### 回滚问题
假如订单的多个步骤中，有一个步骤出现了问题，例如库存不足，或者用户在两个终端同时下单，导致其中一笔订单的优惠券扣减失败，就需要回滚。一旦要处理回滚，就会发现订单系统的实现难度就很高了。如果采用消息队列，那么会往消息队列里插入回滚补偿的消息，而这个补偿消息的处理会很复杂，需要判断进度，然后进行补偿；如果采用状态机，这类回滚操作，也会给状态机增加不少的状态，导致系统变得更加复杂

#### 精准补偿问题
业务进行补偿时，也是一个难度很高的问题，难在哪？我们考虑库存扣减这个问题，如果库存服务收到库存扣减的请求，进行处理，那么本地事务可能已提交，也可能因为进程 crash 未提交。此时再收到回滚库存的请求，则需要识别出库存是否已修改，对于已修改的库存，需要进行补偿修改；对于未修改的库存，需要略过。

这种补偿问题同时存在于消息队列方案和状态机方案中，想要做到每个资源都妥善处理了这个精准补偿，会耗费大量的开发精力。

## dtm 解决方案
面对上述问题，dtm 首创了极简方案，方案详情参见 [dtm-cases/order](https://github.com/dtm-labs/dtm-cases/tree/main/order)：

我们下面来解析这个方案，以及该方案是如何解决我们前面提出的问题的，首先看看，下单 api 的主要处理过程：

``` go
app.POST("/api/busi/submitOrder", common.WrapHandler(func(c *gin.Context) interface{} {
  req := common.MustGetReq(c)
  saga := dtmcli.NewSaga(conf.DtmServer, "gid-"+req.OrderID).
    Add(conf.BusiUrl+"/orderCreate", conf.BusiUrl+"/orderCreateRevert", &req).
    Add(conf.BusiUrl+"/stockDeduct", conf.BusiUrl+"/stockDeductRevert", &req).
    Add(conf.BusiUrl+"/couponUse", conf.BusiUrl+"couponUseRevert", &req).
    Add(conf.BusiUrl+"/payCreate", conf.BusiUrl+"/payCreateRevert", &req)
  return saga.Submit()
}))
```

在这个代码中，定义了一个saga事务，包含上述下单过程中需要的四个步骤，以及四个步骤需要的补偿操作。
- **进程crash问题** dtm的saga事务进行过程中，如果发生进程crash，那么dtm会进行重试，保证操作会最终完成
- **回滚问题** 上述这个saga事务中，如果扣减库存时发现库存不足，则返回failure，会进行回滚。dtm 会记录哪些操作已完成，并回滚相关的操作

然后我们选取扣减库存和回滚库存的代码进一步分析：
``` go
app.POST("/api/busi/stockDeduct", common.WrapHandler(func(c *gin.Context) interface{} {
  req := common.MustGetReq(c)
  return common.MustBarrierFrom(c).CallWithDB(common.DBGet(), func(tx *sql.Tx) error {
    affected, err := dtmimp.DBExec(tx,
      "update busi.stock set stock=stock-?, update_time=now() where product_id=? and stock >= ?",
      req.ProductCount, req.ProductID, req.ProductCount)
    if err == nil && affected == 0 {
      return dtmcli.ErrFailure // not enough stock, return Failure to rollback
    }
    return err
  })
}))
app.POST("/api/busi/stockDeductRevert", common.WrapHandler(func(c *gin.Context) interface{} {
  req := common.MustGetReq(c)
  return common.MustBarrierFrom(c).CallWithDB(common.DBGet(), func(tx *sql.Tx) error {
    _, err := dtmimp.DBExec(tx,
      "update busi.stock set stock=stock+?, update_time=now() where product_id=?",
      req.ProductCount, req.ProductID)
    return err
  })
}))
```

上述的代码，核心的业务逻辑就是扣减库存和回滚库存，那么幂等与精准扣减库存怎么处理？核心就在下面这行代码上：
``` go
  common.MustBarrierFrom(c).CallWithDB(common.DBGet(), func(tx *sql.Tx) error { /* ... */ })
```

当我们把数据库的操作放到上述代码内部时，就能够自动处理：
- **幂等：** 重复请求里面的业务操作会被上述代码过滤，数据库操作仅在非重复请求时被调用
- **精准补偿：** 如果 stockDeduct 中没有提交相关的数据库操作，stockDeductRevert 中数据库操作，会被上述代码过滤
- **悬挂：** 上述代码不仅处理了幂等和精准补偿问题，还处理了悬挂请求

上述代码的使用了 dtm 首创的子事务屏障技术，详细原理参见 [子事务屏障](https://dtm.pub/practice/barrier.html)

## 例子源码
详细的源代码可以参见 [dtm-cases/order](https://github.com/dtm-labs/dtm-cases/tree/main/order)

在这个项目中，你可以便捷的试验本文所讲的全部内容

## 小结
非单体的订单系统，需要花费大量时间处理分布式系统中出现的新问题，而 dtm 则是一个专业的解决方案，提供了非常优雅易用的方案，可以大幅简化现有的消息队列架构或状态机架构。

希望通过本文的分析，以及简单优雅的项目代码，让大家快速了解dtm，改变大家“分布式事务能不用就不用”的旧观念，将分布式事务相关逻辑全部交由 dtm 处理，而让大家关注于业务本身，只需要安心写好相关操作和补偿操作。