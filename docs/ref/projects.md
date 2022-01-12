# 项目概况

## dtm-labs 组织
[dtm-labs](https://github.com/dtm-labs)的主要的目标是让分布式事务变得更加简单，包含了dtm相关的各个项目
- 主项目dtm，主要功能是dtm服务器，涵盖dtm的源代码、单元测试，http客户端，gRPC客户端
- dtm的大量示例dtm-examples，该项目包含了各种dtm事务模式的使用示例，各种选项的使用
- dtm的文档，包括中文文档dtm.pub，英文文档en.dtm.pub
- dtm的go客户端，包括dtmcli，dtmgrpc，这两个项目的代码同步自dtm项目中的dtmcli和dtmgrpc两个目录
- dtm的go简单示例，包括dtmcli-go-sample，dtmgrpc-go-sample，这两个示例主要演示了dtmcli和dtmgrpc的最简例子
- dtm的其他语言客户端，包括dtmcli-xxx
- dtm的其他语言示例，包括dtmcli-xxx-sample

## 主项目dtm

dtm项目主要有一下几个目录

- bench: 性能测试的服务器代码，以及相关的测试脚本
- dtmcli: dtm的http客户端，发版时同步到 dtm-labs/dtmcli
- dtmgrpc: dtm的grpc客户端，发版时同步到 dtm-labs/dtmgrpc
- dtmsvr: dtm的服务端，包含http、grpc的服务
- dtmutil: dtm使用的工具类，会在 dtmsvr 和 test 中共用
- helper: 各类辅助文件
- qs: quick-start 例子
- sqls: 包含了dtm使用的sql
- test: 包含各种测试用例

#### 代码说明
go语言推荐的错误处理方式是error is a value，而不是异常的方式，因此dtmcli中提供给用户使用的接口都是符合这个标准的。

但是给出的示例，使用了函数E2P，这是一个自定义的函数，将error转成了panic，虽然不符合go的规范，但是减少了错误处理的代码量，让贴出来的代码更简短，能让用户聚焦在核心演示的内容上面

## 如何阅读dtm源码
如果您需要阅读研究 DTM 的源码，建议方式为
- dtm 首页README，运行一个quick-start，理解dtm的一个分布式事务过程
- 阅读dtm.pub中的文档，了解相关的理论与事务，并结合dtm-labs/dtm-examples 运行相关的例子
- 到 dtm 项目的test，运行感兴趣的测试用例，结合测试用例，跟踪调试dtm的SDK和服务器代码
