# HTTP 协议支持
dtm服务器启动时，默认监听36789端口，提供http服务

对于通过HTTP协议使用dtm的用户，建议您使用[dtmcli](https://github.com/yedf/dtmcli)这个SDK来使用

使用HTTP的示例，可以参考[dtmcli-go-sample](https://github.com/yedf/dtmcli-go-sample)

更多高级的HTTP使用示例，可以参考[dtm](https://github.com/yedf/dtm/examples)下的带有http的文件内容

如果您接入的是HTTP之上的微服务协议，目前您可能需要自己将相关的微服务以独立的HTTP服务提供出来

dtm后续可能会接入类似SpringCloud这样的微服务协议
