# 代码概况

## 项目组织

dtm项目主要有一下几个目录

- app: 下面只有一个main，是作为dtm的总入口，可以传入不同的参数，以不同的模式运行
- common: 公共的函数与类库，包括日志、json、数据库、网络等
- dtmcli: dtm的http客户端，包含tcc、saga、xa、msg这几种事务模式，以及子事务屏障barrier
- dtmgrpc: dtm的grpc客户端，包含tcc、saga、xa、msg这几种事务模式，以及子事务屏障barrier
- dtmsvr: dtm的服务端，包含http、grpc的api，各种事务模式的实现
- examples: 包含各类的例子
- test: 包含各种测试用例

## 代码说明

go语言推荐的错误处理方式是error is a value，而不是异常的方式，因此dtmcli中提供给用户使用的接口都是符合这个标准的。

但是给出的示例，使用了函数e2p，这是一个自定义的函数，将error转成了panic，虽然不符合go的规范，但是减少了错误处理的代码量，让贴出来的代码更简短，能让用户聚焦在核心演示的内容上面

## 例子说明

在dtm中使用的例子，主要是一个转账的分布式事务，假设一个这样的场景：有一个A转账给B，但A和B属于不同银行，存储在不同的数据库里。这个场景就是一个典型的分布式事务场景。我们把这个分布式事务定义为两个子事务，一个是转出TransOut，一个是转入TransIn。

由于我们在后面的例子中，会常常重复调用这两个子事务，因此我们把这两个子事务的处理，单独抽出来

### http

http协议在[examples/base_http.go](https://github.com/yedf/dtm/blob/main/examples/base_http.go)里面定义TransIn、TransOut相关的各个基本操作，如下：

``` go
func handleGeneralBusiness(c *gin.Context, result1 string, result2 string, busi string) (interface{}, error) {
	info := infoFromContext(c)
	res := common.OrString(MainSwitch.TransInResult.Fetch(), result2, "SUCCESS")
	logrus.Printf("%s %s result: %s", busi, info.String(), res)
	return M{"dtm_result": res}, nil
}

// BaseAddRoute add base route handler
func BaseAddRoute(app *gin.Engine) {
	app.POST(BusiAPI+"/TransIn", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return handleGeneralBusiness(c, MainSwitch.TransInResult.Fetch(), reqFrom(c).TransInResult, "transIn")
	}))
	app.POST(BusiAPI+"/TransOut", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return handleGeneralBusiness(c, MainSwitch.TransOutResult.Fetch(), reqFrom(c).TransOutResult, "TransOut")
	}))
	app.POST(BusiAPI+"/TransInConfirm", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return handleGeneralBusiness(c, MainSwitch.TransInConfirmResult.Fetch(), "", "TransInConfirm")
	}))
	app.POST(BusiAPI+"/TransOutConfirm", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return handleGeneralBusiness(c, MainSwitch.TransOutConfirmResult.Fetch(), "", "TransOutConfirm")
	}))
	app.POST(BusiAPI+"/TransInRevert", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return handleGeneralBusiness(c, MainSwitch.TransInRevertResult.Fetch(), "", "TransInRevert")
	}))
	app.POST(BusiAPI+"/TransOutRevert", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		return handleGeneralBusiness(c, MainSwitch.TransOutRevertResult.Fetch(), "", "TransOutRevert")
	}))
	app.GET(BusiAPI+"/CanSubmit", common.WrapHandler(func(c *gin.Context) (interface{}, error) {
		logrus.Printf("%s CanSubmit", c.Query("gid"))
		return common.OrString(MainSwitch.CanSubmitResult.Fetch(), "SUCCESS"), nil
	}))
}
```

### grpc

grpc协议在[examples/base_grpc.go](https://github.com/yedf/dtm/blob/main/examples/base_grpc.go)里面定义TransIn、TransOut相关的各个基本操作，如下：

``` go
func handleGrpcBusiness(in *dtmgrpc.BusiRequest, result1 string, result2 string, busi string) error {
	res := dtmcli.OrString(result1, result2, "SUCCESS")
	dtmcli.Logf("grpc busi %s %s result: %s", busi, in.Info, res)
	if res == "SUCCESS" {
		return nil
	} else if res == "FAILURE" {
		return status.New(codes.Aborted, "user want to rollback").Err()
	}
	return status.New(codes.Internal, fmt.Sprintf("unknow result %s", res)).Err()
}

func (s *busiServer) CanSubmit(ctx context.Context, in *dtmgrpc.BusiRequest) (*emptypb.Empty, error) {
	res := MainSwitch.CanSubmitResult.Fetch()
	return &emptypb.Empty{}, dtmgrpc.Result2Error(res, nil)
}

func (s *busiServer) TransIn(ctx context.Context, in *dtmgrpc.BusiRequest) (*emptypb.Empty, error) {
	req := TransReq{}
	dtmcli.MustUnmarshal(in.BusiData, &req)
	return &emptypb.Empty{}, handleGrpcBusiness(in, MainSwitch.TransInResult.Fetch(), req.TransInResult, dtmcli.GetFuncName())
}

func (s *busiServer) TransOut(ctx context.Context, in *dtmgrpc.BusiRequest) (*emptypb.Empty, error) {
	req := TransReq{}
	dtmcli.MustUnmarshal(in.BusiData, &req)
	return &emptypb.Empty{}, handleGrpcBusiness(in, MainSwitch.TransOutResult.Fetch(), req.TransOutResult, dtmcli.GetFuncName())
}

func (s *busiServer) TransInRevert(ctx context.Context, in *dtmgrpc.BusiRequest) (*emptypb.Empty, error) {
	req := TransReq{}
	dtmcli.MustUnmarshal(in.BusiData, &req)
	return &emptypb.Empty{}, handleGrpcBusiness(in, MainSwitch.TransInRevertResult.Fetch(), "", dtmcli.GetFuncName())
}

func (s *busiServer) TransOutRevert(ctx context.Context, in *dtmgrpc.BusiRequest) (*emptypb.Empty, error) {
	req := TransReq{}
	dtmcli.MustUnmarshal(in.BusiData, &req)
	return &emptypb.Empty{}, handleGrpcBusiness(in, MainSwitch.TransOutRevertResult.Fetch(), "", dtmcli.GetFuncName())
}

func (s *busiServer) TransInConfirm(ctx context.Context, in *dtmgrpc.BusiRequest) (*emptypb.Empty, error) {
	req := TransReq{}
	dtmcli.MustUnmarshal(in.BusiData, &req)
	return &emptypb.Empty{}, handleGrpcBusiness(in, MainSwitch.TransInConfirmResult.Fetch(), "", dtmcli.GetFuncName())
}

func (s *busiServer) TransOutConfirm(ctx context.Context, in *dtmgrpc.BusiRequest) (*emptypb.Empty, error) {
	req := TransReq{}
	dtmcli.MustUnmarshal(in.BusiData, &req)
	return &emptypb.Empty{}, handleGrpcBusiness(in, MainSwitch.TransOutConfirmResult.Fetch(), "", dtmcli.GetFuncName())
}

```
### 例子小结

上述代码中，后缀为Confirm的，会被Tcc事务模式调用，后缀为Revert会被Tcc的Cancel、SAGA的compensate调用，CanSubmit会被事务消息调用

另外MainSwitch用于辅助测试，用于模拟各种故障

## 各语言客户端

### go
客户端sdk: [https://github.com/yedf/dtmcli](https://github.com/yedf/dtmcli)

示例: [https://github.com/yedf/dtmcli-go-sample](https://github.com/yedf/dtmcli-go-sample)

### python

客户端sdk（当前支持TCC、SAGA、子事务屏障）: [https://github.com/yedf/dtmcli-py](https://github.com/yedf/dtmcli-py)

示例: [https://github.com/yedf/dtmcli-py-sample](https://github.com/yedf/dtmcli-py-sample)

### Java

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-java](https://github.com/yedf/dtmcli-java)

示例: [https://github.com/yedf/dtmcli-java-sample](https://github.com/yedf/dtmcli-java-sample)

### php

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-php](https://github.com/yedf/dtmcli-php)

示例: [https://github.com/yedf/dtmcli-php-sample](https://github.com/yedf/dtmcli-php-sample)

感谢 [onlyshow](https://github.com/onlyshow) 的帮助，php的sdk和示例，全部由[onlyshow](https://github.com/onlyshow)独立完成

### node

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-node](https://github.com/yedf/dtmcli-node)

示例: [https://github.com/yedf/dtmcli-node-sample](https://github.com/yedf/dtmcli-node-sample)

### dotnet

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-csharp](https://github.com/yedf/dtmcli-csharp)

示例: [https://github.com/yedf/dtmcli-csharp-sample](https://github.com/yedf/dtmcli-csharp-sample)
