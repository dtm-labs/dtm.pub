# SDK

## 各语言SDK

### go

这里的dtmcli和dtmgrpc都是dtm项目里面内容的复制。采用这里的包，而不是dtm，会让你的应用程序依赖更少，包体更小

http sdk: [https://github.com/dtm-labs/dtmcli](https://github.com/dtm-labs/dtmcli)

最简示例: [https://github.com/dtm-labs/dtmcli-go-sample](https://github.com/dtm-labs/dtmcli-go-sample)

grpc sdk: [https://github.com/dtm-labs/dtmgrpc](https://github.com/dtm-labs/dtmgrpc)

最简示例: [https://github.com/dtm-labs/dtmgrpc-go-sample](https://github.com/dtm-labs/dtmgrpc-go-sample)

关于SDK使用的最全的示例，包括了grpc/http/xa/msg/saga/tcc/barrier 等等，都合并在下面这个项目

[https://github.com/dtm-labs/dtm-examples](https://github.com/dtm-labs/dtm-examples)

[相关博客](../resource/blogs-go)

### dotnet

客户端sdk（当前只支持TCC）: [https://github.com/dtm-labs/dtmcli-csharp](https://github.com/dtm-labs/dtmcli-csharp)

示例: [https://github.com/dtm-labs/dtmcli-csharp-sample](https://github.com/dtm-labs/dtmcli-csharp-sample)

感谢 [geffzhang](https://github.com/geffzhang)的帮助，C的sdk和示例，主要由[geffzhang](https://github.com/geffzhang)贡献

[相关博客](../resource/blogs-donet)

### python

客户端sdk（当前支持TCC、SAGA、子事务屏障）: [https://github.com/dtm-labs/dtmcli-py](https://github.com/dtm-labs/dtmcli-py)

示例: [https://github.com/dtm-labs/dtmcli-py-sample](https://github.com/dtm-labs/dtmcli-py-sample)

[相关博客](../resource/blogs-py)


### Java

客户端sdk（当前只支持TCC）: [https://github.com/dtm-labs/dtmcli-java](https://github.com/dtm-labs/dtmcli-java)

示例: [https://github.com/dtm-labs/dtmcli-java-sample](https://github.com/dtm-labs/dtmcli-java-sample)

感谢 [viticis](https://github.com/viticis) [li-xiao-shuang](https://github.com/li-xiao-shuang)的帮助，Java的sdk和示例，主要由他们贡献

[相关博客](../resource/blogs-java)

### php

客户端sdk（当前只支持TCC）: [https://github.com/dtm-labs/dtmcli-php](https://github.com/dtm-labs/dtmcli-php)

示例: [https://github.com/dtm-labs/dtmcli-php-sample](https://github.com/dtm-labs/dtmcli-php-sample)

感谢 [onlyshow](https://github.com/onlyshow) 的帮助，php的sdk和示例，全部由他独立完成

[相关博客](../resource/blogs-php)

### node

客户端sdk（当前只支持TCC）: [https://github.com/dtm-labs/dtmcli-node](https://github.com/dtm-labs/dtmcli-node)

示例: [https://github.com/dtm-labs/dtmcli-node-sample](https://github.com/dtm-labs/dtmcli-node-sample)

[相关博客](../resource/blogs-node)

### 其他

如果这里没有找到您熟悉的语言，同时您又想运行dtm，看看一个分布式事务什么样，您可以参考这里：

[DTM安装运行](../guide/install)

如果你是通过brew 安装，那么您可以直接运行

```
dtm-qs
```

上述dtm-qs命令，会运行一个简单的quick start例子，这是一个saga事务，您可以对照saga的时序图与日志，更深入的了解dtm