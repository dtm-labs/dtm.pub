# 升级指南

## 1.6.x 升级到 1.7.x
dtm在1.7中引入新的存储引擎，因此重写了配置相关的代码。您只需要按照新的配置格式进行dtm服务器的配置即可

## 1.9.x 升级到 1.10.x
dtm在1.10中，引入了新的表示错误协议，该协议与旧协议不同，但做了兼容。做法如下：

1.9.x 及更低版本行为

- SUCCESS http：状态码 200 && 结果内容含 SUCCESS； grpc: err == nil
- FAILURE http: 状态码 200 && 结果内容含 FAILURE； grpc: Code == Aborted && Message == FAILURE
- ONGOING http: 状态码 200 && 结果内容含 ONGOING； grpc: Code == Aborted && Message == ONGOING

变更为（同时会兼容旧的）

- SUCCESS http: 状态码 200； grpc： err == nil
- FAILURE http: 状态码 409 (http.StatusConflict)；grpc Code == Aborted
- ONGOING http: 状态码 425 (http.StatusTooEarly)；grpc Code == FailedPrecondition

新版本的DTM服务器和客户端SDK是这么做兼容的：
- 服务端返回 SUCCESS  http：状态码 200 && 结果包含 SUCCESS；grpc： err == nil
- 服务端返回 FAILURE  http：状态码 409 && 结果包含 FAILURE；grpc： Code == Aborted && Message == FAILURE
- SDK与服务端判断 SUCCESS  http：状态码 200； grpc：err == nil
- SDK与服务端判断 FAILURE  http：状态码 409 || 结果包含 FAILURE；grpc： Code == Aborted && Message != ONGOING
- SDK与服务端判断 ONGOING  http：状态码 425 || 结果包含 ONGOING；grpc： Code == FailedPrecondition || Message == ONGOING

新版本的SDK可以和新旧版本的协议兼容；新版本的服务器能够与新旧版本的协议兼容。因此理论上可以随意升级。

但是从稳定性和渐进式迁移的角度来看，建议先逐步升级SDK，再升级dtm服务器。逐步升级一部分应用的SDK版本，过程中，可以充分灰度，监控出现的问题。然后再逐步灰度dtm服务器
