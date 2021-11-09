# SDK

## 各语言SDK

### go

这里的dtmcli和dtmgrpc都是dtm项目里面内容的复制。采用这里的包，而不是dtm，会让你的应用程序依赖更少，包体更小

http sdk: [https://github.com/yedf/dtmcli](https://github.com/yedf/dtmcli)

示例: [https://github.com/yedf/dtmcli-go-sample](https://github.com/yedf/dtmcli-go-sample)

grpc sdk: [https://github.com/yedf/dtmgrpc](https://github.com/yedf/dtmgrpc)

示例: [https://github.com/yedf/dtmgrpc-go-sample](https://github.com/yedf/dtmgrpc-go-sample)

[相关博客](../resource/blogs-go)

### dotnet

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-csharp](https://github.com/yedf/dtmcli-csharp)

示例: [https://github.com/yedf/dtmcli-csharp-sample](https://github.com/yedf/dtmcli-csharp-sample)

感谢 [geffzhang](https://github.com/geffzhang)的帮助，C的sdk和示例，全部由[geffzhang](https://github.com/geffzhang)独立贡献

[相关博客](../resource/blogs-donet)

### python

客户端sdk（当前支持TCC、SAGA、子事务屏障）: [https://github.com/yedf/dtmcli-py](https://github.com/yedf/dtmcli-py)

示例: [https://github.com/yedf/dtmcli-py-sample](https://github.com/yedf/dtmcli-py-sample)

[相关博客](../resource/blogs-py)


### Java

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-java](https://github.com/yedf/dtmcli-java)

示例: [https://github.com/yedf/dtmcli-java-sample](https://github.com/yedf/dtmcli-java-sample)

感谢 [viticis](https://github.com/viticis)的帮助，Java的sdk和示例，全部由[viticis](https://github.com/viticis)独立贡献

[相关博客](../resource/blogs-java)

### php

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-php](https://github.com/yedf/dtmcli-php)

示例: [https://github.com/yedf/dtmcli-php-sample](https://github.com/yedf/dtmcli-php-sample)

感谢 [onlyshow](https://github.com/onlyshow) 的帮助，php的sdk和示例，全部由[onlyshow](https://github.com/onlyshow)独立完成

[相关博客](../resource/blogs-php)

### node

客户端sdk（当前只支持TCC）: [https://github.com/yedf/dtmcli-node](https://github.com/yedf/dtmcli-node)

示例: [https://github.com/yedf/dtmcli-node-sample](https://github.com/yedf/dtmcli-node-sample)

[相关博客](../resource/blogs-node)

### 其他

如果这里没有找到您熟悉的语言，同时您又想运行dtm，看看一个分布式事务什么样，您可以：

- 安装[docker 20.04+](https://docs.docker.com/get-docker/)
- `docker-compose -f helper/compose.qs.yml up`

上述docker-compose命令，会运行一个简单的quick start例子，这是一个saga事务，您可以对照saga的时序图与日志，更深入的了解dtm