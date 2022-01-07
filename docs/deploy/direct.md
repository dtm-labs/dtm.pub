# 直接部署

## 获取二进制文件

dtm暂不支持apt/yum/brew等方式直接安装，您可以从github上面下载相应版本，或者通过go环境，编译出相关的二进制文件。

## 编译

您需要有go 1.15以上的环境，通过下面命令编译出二进制文件
```
go build
```

## 配置

您可以设置相关的环境变量(参见[部署基础](./base))，也可以在工作目录下，参考[配置样板文件](https://github.com/dtm-labs/dtm/blob/main/conf.sample.yml)创建conf.yml文件

## 启动

dtm会监听
- HTTP: 36789
- gRPC: 36790

```
./dtm dtmsvr
```