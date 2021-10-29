## 嵌套的TCC

dtm的Tcc事务模式，支持子事务嵌套，流程图如下：

![nested_trans](../imgs/nested_trans.jpg)

在这个流程图中，Order这个微服务，管理了订单相关的数据修改，同时还管理了一个嵌套的子事务，因此他即扮演了RM的角色，也扮演了AP的角色。

### 示例

tcc支持嵌套的子事务，代码如下(摘自[examples/http_tcc](https://github.com/yedf/dtm/blob/main/examples/http_tcc.go))：

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
app.POST(BusiAPI+"/TransInTccParent", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
  tcc, err := dtmcli.TccFromReq(c)
  e2p(err)
  logrus.Printf("TransInTccParent ")
  return tcc.CallBranch(&TransReq{Amount: reqFrom(c).Amount}, Busi+"/TransIn", Busi+"/TransInConfirm", Busi+"/TransInRevert")
}))
```

子事务嵌套时，从传入的请求中构建tcc对象，然后就能够正常使用tcc对象，进行相关的事务。

更多子事务嵌套的文档细节，例如相关的流程图，待补充
