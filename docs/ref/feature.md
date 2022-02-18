# 更多功能特性
大部分的功能特性，已经在相关的文档里详细介绍，下面将介绍额外的功能特性

## 鉴权
对于许多公司的api，通常需要鉴权，大部分鉴权系统是通过http/grpc的header携带token，dtm支持全局事务范围的header自定义，详细的使用，可以参考 [事务选项](./options)中自定义header部分

## 单服务多数据源
部分应用服务，会访问多个数据源，当他们组成全局事务时，需要做到多个数据源的事务，要么都成功，要么都回滚。大多数分布式事务框架，未提供这种支持，而 dtm 可以通过简单的技巧支持

假定现在跨行转账时，不需要跨服务，只需要跨数据库修改数据，那么可以将两个事务分支，合并为一个事务分支，然后在一个服务内，跨数据源操作数据。

``` go
app.POST(BusiAPI+"/SagaMultiSource", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  transOutSource := pdbGet() // 数据源1
  err := barrier.CallWithDB(transOutSource, func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransOutUID, -reqFrom(c).Amount, reqFrom(c).TransOutResult)
  })
  if err != nil {
    return err
  }
  transInSource := pdbGet() // 数据源2
  return MustBarrierFromGin(c).CallWithDB(transInSource, func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransInUID, reqFrom(c).Amount, reqFrom(c).TransInResult)
  })
}))
app.POST(BusiAPI+"/SagaMultiSourceRevert", dtmutil.WrapHandler2(func(c *gin.Context) interface{} {
  barrier := MustBarrierFromGin(c)
  transInSource := pdbGet() // 数据源2
  err := MustBarrierFromGin(c).CallWithDB(transInSource, func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransInUID, -reqFrom(c).Amount, "")
  })
  if err != nil {
    return err
  }
  transOutSource := pdbGet() // 数据源1
  return barrier.CallWithDB(transOutSource, func(tx *sql.Tx) error {
    return SagaAdjustBalance(tx, TransOutUID, +reqFrom(c).Amount, "")
  })
}))
```

上述的代码能够保证，在各种异常情况下，数据源1和数据源2的数据修改，要么同时成功，要么同时回滚。

可运行的示例，参见[dtm-examples](https://github.com/dtm-labs/dtm-examples)中的 `multiSource`