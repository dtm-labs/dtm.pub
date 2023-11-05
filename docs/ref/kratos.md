# Kratos支持

## 运行一个已有的示例

我们以 etcd 作为注册服务中心为例，按照如下步骤运行一个 kratos 的示例：

- 启动 etcd

```shell
# 请先确保已经安装 etcd
etcd
```

- 配置 dtm

```yaml
MicroService:
 Driver: 'dtm-driver-kratos' # name of the driver to handle register/discover
 Target: 'etcd://127.0.0.1:2379/dtmservice' # register dtm server to this url
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
2022/03/30 09:35:36 transfer out 30 cents from 1
2022/03/30 09:35:36 transfer in 30 cents to 2
```

那就是事务正常完成了



## 开发接入

参考 [dtm-labs/dtmdriver-clients](https://github.com/dtm-labs/dtmdriver-clients/blob/main/kratos/app/main.go) 的代码

```go

import (
	"github.com/dtm-labs/client/dtmcli/logger"
	"github.com/dtm-labs/client/dtmgrpc"
  // 导入 kratos 的 dtm 驱动
	_ "github.com/dtm-labs/driver-kratos"
	"github.com/dtm-labs/dtmdriver-clients/busi"
	"github.com/go-kratos/kratos/contrib/registry/etcd/v2"
	"github.com/go-kratos/kratos/v2/transport/grpc/resolver/discovery"
	etcdAPI "go.etcd.io/etcd/client/v3"
	"google.golang.org/grpc/resolver"
	"strings"
)

var etcdServer = "localhost:2379"
//采用Kratos的方法创建registry, https://go-kratos.dev/docs/component/registry/
client, err := etcdAPI.New(etcdAPI.Config{
  Endpoints: strings.Split(etcdServer, ","),
})
if err != nil {
  panic(err)
}
registry := etcd.New(client)

//注册全局的resolver,  现在business server可以使用 discovery:///dtmservice 来访问dtm
resolver.Register(discovery.NewBuilder(registry, discovery.WithInsecure(true)))


var dtmServer = "discovery:///dtmservice"

// 业务地址，下面的 busi 换成实际在 server 初始化设置的名字, dtm将采用registry来访问busi
var busiServer = "discovery:///busi"

// 发起一个msg事务，保证TransOut和TransIn都会完成
gid := dtmgrpc.MustGenGid(dtmServer)
m := dtmgrpc.NewMsgGrpc(dtmServer, gid).
  Add(busiServer+"/api.trans.v1.Trans/TransOut", &busi.BusiReq{Amount: 30, UserId: 1}).
  Add(busiServer+"/api.trans.v1.Trans/TransIn", &busi.BusiReq{Amount: 30, UserId: 2})
m.WaitResult = true
err := m.Submit()
logger.FatalIfError(err)
```

## 深入理解动态调用

在 kratos 使用 dtm 的分布式事务时，许多的调用是从 dtm 服务器发起的，例如 TCC 的Confirm/Cancel，SAGA/MSG 的所有调用。

dtm 无需知道组成分布式事务的相关业务 api 的强类型，它是动态的调用这些api。

grpc 的调用，可以类比于 HTTP 的 POST，其中：

- "/api.trans.v1.Trans/TransIn" 相当于 URL 中的 Path。请注意这个Path一定是要从TransIn的Invoke函数实现里面找
- &busi.BusiReq{Amount: 30, UserId: 1} 相当于 Post 中 Body
- v1.Response 相当于HTTP请求的响应

通过下面这部分代码，dtm就拿到了完整信息，就能够发起完整的调用了

`Add(busiServer+"/api.trans.v1.Trans/TransIn", &busi.BusiReq{Amount: 30, UserId: 1})`

## 其他方式接入

kratos 的微服务还有非 etcd 的其他方式，下面列出它们的接入方式


#### Consul

对于 Consul 这种方式，需要将对于是 etcd 相关换成 `consul` 即可，如下

```yaml
#  dtm: conf.yml
MicroService:
 Driver: 'dtm-driver-kratos' # name of the driver to handle register/discover
 Target: 'consul://127.0.0.1:8500/dtmservice' # register dtm server to this url
 EndPoint: 'grpc://localhost:36790'
```

```go
// client:
import(
  consulAPI "github.com/hashicorp/consul/api"
  consul "github.com/go-kratos/kratos/contrib/registry/consul/v2"
  ...
)
var consulServer = "localhost:2379"
//采用Kratos的方法创建registry, https://go-kratos.dev/docs/component/registry/
client, err := consulAPI.New(consulAPI.Config{
  Endpoints: strings.Split(consulServer, ","),
})
if err != nil {
  panic(err)
}
registry := consul.New(client)

//注册全局的resolver,  现在business server可以使用 discovery:///dtmservice 来访问dtm
resolver.Register(discovery.NewBuilder(registry, discovery.WithInsecure(true)))


// 实际的调用逻辑
var dtmServer = "discovery:///dtmservice"

// 业务地址，下面的 busi 换成实际在 server 初始化设置的名字
var busiServer = "discovery:///busi"

...
```

## 小结

欢迎使用 [dtm](https://github.com/dtm-labs/dtm)，并 star 支持我们，一起共建 golang 的微服务生态
