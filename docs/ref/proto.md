# 概述

dtm支持多种协议，包括通用类协议HTTP，gRPC，和微服务协议，如go-zero：

## HTTP

HTTP作为前端与后端交互中最通用的协议，通常也用于后端内部的通讯协议。

dtm服务器启动时，默认监听36789端口，提供http服务。建议您使用[dtmcli](https://github.com/dtm-labs/dtmcli)这个SDK，使用HTTP的最简示例，可以参考[dtmcli-go-sample](https://github.com/dtm-labs/dtmcli-go-sample)

更多高级的HTTP使用示例，可以参考[dtm-examples](https://github.com/dtm-labs/dtm-examples)下的带有http的文件内容

如果您接入的是HTTP之上的微服务协议，目前您可能需要自己将相关的微服务以独立的HTTP服务提供出来，dtm后续可能会接入类似SpringCloud这样的微服务协议


## gRPC

gRPC广泛应用于后端微服务中，大量云原生应用，大量微服务框架，构建在此协议之上，应用非常广泛

dtm服务器启动时，默认监听36790端口，提供gRPC服务。对于通过gRPC协议使用dtm的用户，建议您使用[dtmgrpc](https://github.com/dtm-labs/dtmgrpc)这个SDK，使用gRPC的最简示例，可以参考[dtmgrpc-go-sample](https://github.com/dtm-labs/dtmgrpc-go-sample)

更多高级的gRPC使用示例，可以参考[dtm-examples](https://github.com/dtm-labs/dtm-examples)下的带有grpc的文件内容

## 微服务协议

当前已有许多微服务框架被广泛应用，为了方便用户能够在自己的微服务框架中直接使用dtm，dtm采用插件的方式，支持了gRPC之上的多个微服务框架。

#### go-zero
dtm首先接入了go-zero，这是一个一开源就很火爆的微服务框架，在对接的过程中，获得了框架作者的大量支持，相关的代码主要由框架作者完成，我们只是做了最后的代码整理，以及相关的文档编写。

接入详情参见 [go-zero](./gozero)

#### polaris
dtm接入了腾讯开源的polaris，以及polaris之上的微服务框架，对接过程中，获得了腾讯同学的大力支持，由腾讯的同学[ychensha](https://github.com/ychensha)提供了PR。

dtm从v1.6.3开始原生支持grpc-polaris微服务框架

具体的接入指南待完善

#### 其他
其他gRPC之上的微服务框架协议，正在快速接入中，如果您有相关的需求或者您是框架维护者，欢迎联系我(微信yedf2008)，我们将非常乐意接入您的微服务框架

具体如何让您的微服务框架接入dtm，参考下面的 微服务接入指南

## 微服务对接指南

此文档主要针对框架维护者，普通用户无需关注

dtm支持gRPC协议之上的微服务框架接入，即采用gRPC Resolver机制的微服务框架，下面先看一个如何使用一个自定义的协议

#### 运行一个接入示例
dtm做了一个最简协议示例：protocol1，方便框架维护者接入，按照如下步骤能够运行这个协议的应用：

- 配置dtm服务器，并运行
```
MicroService:
  Driver: 'dtm-driver-protocol1'
```
- 运行一个使用dtm的APP
```
# dtm-labs/dtmdriver-clients
go run protocol1/main.go
```

至此您可以看到类似这样的日志，这个简单的协议已经运行起来了：
```
2021/12/03 15:27:13.65 types.go:43 grpc client called: protocol1://localhost:36790/dtmgimp.Dtm/NewGid  result: Gid:"c0a803b8_4psHCRxQ1kA" err: <nil>
2021/12/03 15:27:13 TransOut 30 from user 1
2021/12/03 15:27:13 TransIn 30 to user 2
```

更加完整的运行示例可以参考[go-zero](./gozero)

#### 接入步骤

接入步骤如下：
- 实现dtm-labs/dtmdriver里面的接口
- 提一个PR给dtm，在dtm导入您实现了dtmdriver的包
- 配置dtm服务器，使用您的驱动
- 执行dtmdriver.Use，注册您的驱动，之后就可以使用dtmgrpc

#### 步骤1：dtmdriver接口
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

##### GetName
返回微服务框架的驱动名称，一般以"dtm-driver-"作为前缀，例如"dtm-driver-gozero"。

它会被dtm服务器和dtm客户端用到

##### RegisterGrpcResolver
您需要在这个函数里，注册您的grpc的resolver，这样grpc调用时，会使用您的服务发现

##### RegisterGrpcService
在您的微服务框架中，您可能需要将dtm服务，注册到您的服务发现组件里。dtm服务启动之后，会调用您的这个函数，并传递dtm配置中的Target和Endpoint

##### ParseServerMethod
由于各个微服务框架，对于协议中的URL，dtm需要将它拆分成server和method两部分，然后创建连接并调用。但是不同微服务协议，通常有不同的拆解方式，因此dtm服务器和SDK将调用这个接口完成拆分

##### init
您实现了Driver之后，请将您的Driver注册到dtmdriver中，如下所示:
``` go
func init() {
	dtmdriver.Register(&protocol1Driver{})
}
```

#### 步骤2：提PR给DTM
如果您完成了驱动的编写，您可以提PR给dtm，dtm团队将及时给您反馈，评估您的需求。您的PR内容类似于：
``` go
import _ "github.com/dtm-labs/dtmdriver-gozero"
```

#### 步骤3：配置运行dtm
配置dtm支持您的自定义协议，示例如下：
```
MicroService:
  Driver: 'dtm-driver-gozero' # 填写您的驱动名称
  Target: 'etcd://localhost:2379/dtmservice' # dtm服务将注册到这个url
  EndPoint: 'localhost:36790' # dtm服务的ip端口
```

#### 步骤4：使用dtm SDK
dtm的grpc协议SDK为dtmgrpc，您先调用dtmdriver.Use("dtm-driver-gozero")，告知dtmgrpc使用这个驱动来解析url。

然后您就可以正常使用dtmgrpc来访问dtm了
