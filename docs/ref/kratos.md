# Kratos支持

## 运行一个已有的示例

我们以 etcd 作为注册服务中心为例，按照如下步骤运行一个 kratos 的示例：

- 启动 etcd

```shell
# 请先确保已经安装 etcd
etc
```

- 配置 dtm

```yaml
MicroService:
 Driver: 'dtm-driver-kratos' # name of the driver to handle register/discover
 Target: 'discovery://127.0.0.1:2379/dtmservice' # register dtm server to this url
 EndPoint: 'grpc://localhost:36790'
```

- 启动 dtm

```shell
# 请先配置好dtm的数据库
go run app/main.go -c conf.yml # conf.yml 为你对应的 dtm 配置文件
```

- 运行一个 kratos 的服务

```shell
git clone https://github.com/dtm-labs/dtmdriver-clients && cd dtmdriver-clients
cd kratos/trans
make build && ./bin/trans -conf configs/config.yaml
```

- 发起一个 kratos 使用 dtm 的事务

```
# 在 dtmdriver-clients 的目录下

cd kratos/app && go run main.go
```

当您在 trans 的日志中看到

```
INFO msg=config loaded: config.yaml format: yaml
INFO msg=[gRPC] server listening on: [::]:9000
2022/03/19 19:38:53 transfer in 30 cents to 1
2022/03/19 19:38:53 transfer out 30 cents from 1
```

那就是事务正常完成了



## 开发接入

参考 [dtm-labs/dtmdriver-clients](https://github.com/dtm-labs/dtmdriver-clients/blob/main/gozero/app/main.go) 的代码

```go
// 下面这些导入 kratos 的 dtm 驱动
import (
	_ "github.com/dtm-labs/driver-kratos"
)

// dtm 已经经过前面的配置，注册到下面这个地址，因此在 dtmgrpc 中使用该地址
var dtmServer = "discovery://localhost:2379/dtmservice"

// 业务地址，下面的 busi 换成实际在 server 初始化设置的名字
var busiServer = "discovery://localhost:2379/busi" 

// 使用 dtmgrpc 生成一个 tcc 分布式事务并提交
gid := dtmgrpc.MustGenGid(dtmServer)
err := dtmgrpc.TccGlobalTransaction(dtmServer, gid, func(tcc *dtmgrpc.TccGrpc) err {
  rep := v1.Response{} // proto 生成的响应结构
  err1 := tcc.CallBranch(&busi.BusiReq{Amount:30, UserId: 1},
      busiServer+"/api.trans.v1.Trans/TransIn",
      busiServer+"/api.trans.v1.Trans/TransInConfirm",
      busiServer+"/api.trans.v1.Trans/TransInCancel",
      &rep)
  return err1
})
```

## 深入理解动态调用

在 kratos 使用 dtm 的分布式事务时，许多的调用是从 dtm 服务器发起的，例如 TCC 的Confirm/Cancel，SAGA/MSG 的所有调用。

dtm 无需知道组成分布式事务的相关业务 api 的强类型，它是动态的调用这些api。

grpc 的调用，可以类比于 HTTP 的 POST，其中：

- "/api.trans.v1.Trans/TransIn" 相当于 URL 中的 Path
- &busi.BusiReq{Amount: 30, UserId: 1} 相当于 Post 中 Body
- v1.Response 相当于HTTP请求的响应

通过下面这部分代码，dtm就拿到了完整信息，就能够发起完整的调用了

`Add(busiServer+"/api.trans.v1.Trans/TransIn", &busi.BusiReq{Amount: 30, UserId: 1})`

## 其他方式接入

kratos 的微服务还有非 etcd 的其他方式，下面列出它们的接入方式

#### 直连

对于直连这种方式，您只需要在上面 dtm 的 etcd 配置基础上，将 Target 设置为空字符串即可。

直连的情况，不需要将 dtm 注册到注册中心

#### K8S

对于 K8S 这种方式，您只需要在上面 dtm 的 etcd 配置基础上，将 Target 设置为空字符串即可。

在 K8S 中，将服务注册到 K8S 中，是有 deployment.yaml 完成的，应用内部，不需要进行注册

## 小结

欢迎使用 [dtm](https://github.com/dtm-labs/dtm)，并 star 支持我们，一起共建 golang 的微服务生态