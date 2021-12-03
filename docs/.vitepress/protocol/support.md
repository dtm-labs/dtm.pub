# 微服务对接指南

此文档主要针对框架维护者，普通用户无需关注

dtm支持gRPC协议之上的微服务框架接入，即采用gRPC Resolver机制的微服务框架，下面先看一个如何使用一个自定义的协议

## 运行一个接入示例
dtm做了一个最简协议示例：protocol1，方便框架维护者接入，按照如下步骤能够运行这个协议的应用：

- 配置dtm服务器，并运行
```
MicroService:
  Driver: 'dtm-driver-protocol1'
```
- 运行一个使用dtm的APP
```
# yedf/dtmdriver-clients
go run protocol1/main.go
```

至此您可以看到类似这样的日志，这个简单的协议已经运行起来了：
```
2021/12/03 15:27:13.65 types.go:43 grpc client called: protocol1://localhost:36790/dtmgimp.Dtm/NewGid  result: Gid:"c0a803b8_4psHCRxQ1kA" err: <nil>
2021/12/03 15:27:13 TransOut 30 from user 1
2021/12/03 15:27:13 TransIn 30 to user 2
```

更加完整的运行示例可以参考[go-zero](./gozero)

## 接入步骤

接入步骤如下：
- 实现yedf/dtmdriver里面的接口
- 提一个PR给dtm，在dtm导入您实现了dtmdriver的包
- 配置dtm服务器，使用您的驱动
- 执行dtmdriver.Use，注册您的驱动，之后就可以使用dtmgrpc

### 步骤1：dtmdriver接口
此接口定义如下
``` go
// Driver interface to do service register and discover
type Driver interface {
	// GetName return the name of the driver
	GetName() string
	// RegisterGrpcResolver register the grpc resolver to handle custom scheme
	RegisterGrpcResolver()
	// RegisterGrpcService register dtm endpoint to target
	RegisterGrpcService(target string, endpoint string) error
	// ParseServerMethod parse the uri to server and method.
	// server will be passed to grpc.Dial, and method to grpc.ClientConn.invoke
	ParseServerMethod(uri string) (server string, method string, err error)
}
```

#### GetName
返回微服务框架的驱动名称，一般以"dtm-driver-"作为前缀，例如"dtm-driver-gozero"。

它会被dtm服务器和dtm客户端用到

#### RegisterGrpcResolver
您需要在这个函数里，注册您的grpc的resolver，这样grpc调用时，会使用您的服务发现

#### RegisterGrpcService
在您的微服务框架中，您可能需要将dtm服务，注册到您的服务发现组件里。dtm服务启动之后，会调用您的这个函数，并传递dtm配置中的Target和Endpoint

#### ParseServerMethod
由于各个微服务框架，对于协议中的URL，dtm需要将它拆分成server和method两部分，然后创建连接并调用。但是不同微服务协议，通常有不同的拆解方式，因此dtm服务器和SDK将调用这个接口完成拆分

#### init
您实现了Driver之后，请将您的Driver注册到dtmdriver中，如下所示:
``` go
func init() {
	dtmdriver.Register(&protocol1Driver{})
}
```

### 步骤2：提PR给DTM
如果您完成了驱动的编写，您可以提PR给dtm，dtm团队将及时给您反馈，评估您的需求。您的PR内容类似于：
``` go
import _ "github.com/yedf/dtmdriver-gozero"
```

### 步骤3：配置运行dtm
配置dtm支持您的自定义协议，示例如下：
```
MicroService:
  Driver: 'dtm-driver-gozero' # 填写您的驱动名称
  Target: 'etcd://localhost:2379/dtmservice' # dtm服务将注册到这个url
  EndPoint: 'localhost:36790' # dtm服务的ip端口
```

### 步骤4：使用dtm SDK
dtm的grpc协议SDK为dtmgrpc，您先调用dtmdriver.Use("dtm-driver-gozero")，告知dtmgrpc使用这个驱动来解析url。

然后您就可以正常使用dtmgrpc来使用dtm了