# 事务消息模式

事务消息提供了支持事务的消息接口，允许使用方把消息发送放到本地的一个事务里，保证事务的原子性。它的工作原理如下：

本地应用

- 开启本地事务
- 进行本地数据库修改
- 调用消息事务的prepare接口，预备发送消息
- 提交本地事务
- 调用消息事务的submit接口，触发消息发送

当事务管理器，只收到prepare请求，超时未收到submit请求时，调用反查接口canSubmit，询问应用程序，是否能够发送。

事务消息与本地消息方案类似，但是将创建本地消息表和轮询本地消息表的操作换成了一个反查接口，提供更加便捷的使用。

假定一个这样的场景，用户注册成功后，需要给用户赠送优惠券和一个月会员卡。这里赠送优惠券和一个月会员一定不会失败，这种情况就非常适合可靠消息事务模式。

## 成功的事务消息

我们拿跨行转账作为例子，一个成功的事务消息分布式事务时序图如下：

![msg_normal](../imgs/msg_normal.jpg)

我们通过dtm来完成一个普通的事务消息分布式事务

### http

``` go
	logrus.Printf("a busi transaction begin")
	req := &TransReq{Amount: 30}
	msg := dtmcli.NewMsg(DtmServer, dtmcli.MustGenGid(DtmServer)).
		Add(Busi+"/TransOut", req).
		Add(Busi+"/TransIn", req)
	err := msg.Prepare(Busi + "/CanSubmit")
	e2p(err)
	logrus.Printf("busi trans submit")
	err = msg.Submit()
```

详细例子代码参考[examples/http_msg.go](https://github.com/dtm-labs/dtm/blob/main/examples/http_msg.go)：

### grpc

``` go
	req := dtmcli.MustMarshal(&TransReq{Amount: 30})
	gid := dtmgrpc.MustGenGid(DtmGrpcServer)
	msg := dtmgrpc.NewMsgGrpc(DtmGrpcServer, gid).
		Add(BusiGrpc+"/examples.Busi/TransOut", req).
		Add(BusiGrpc+"/examples.Busi/TransIn", req)
	err := msg.Submit()
```

详细例子代码参考[examples/grpc_msg.go](https://github.com/dtm-labs/dtm/blob/main/examples/grpc_msg.go)：

上面的代码首先创建了一个事务消息，然后添加了两个子事务TransOut、TransIn，然后在本地事务里内部调用prepare，本地事务提交之后，调用submit。Submit之后，dtm就会调用相关的子事务，保证最终完成。

## 超时反查

如果应用程序在调用Prepare之后，Submit之前崩了，那么dtm会调用反查接口，反查返回成功的时序图如下：

![msg_query](../imgs/msg_query.jpg)


