# 安装运行DTM

这里的安装运行主要是为了快速上手，如果您需要将DTM部署到线上，请参考 [线上部署](../deploy/base)

DTM的安装运行非常简单，已支持零配置启动，零依赖，只需要运行dtm可执行文件即可。您可以通过以下多种方式安装DTM

## MAC Homebrew 安装

```
brew install dtm
```

输入下面命令，即可启动运行
```
dtm
```

brew还会额外安装一个命令 dtm-qs，这是一个quick-start客户端，用于运行一个简单的例子。在dtm启动之后，运行下面命令：
```
dtm-qs
```

可以看到控制台打印出TransOut、TransIn成功，一个完整的分布式事务就完成了

## docker安装
需要docker 20.04版本及以上

```
docker run -itd  --name dtm -p 36789:36789 -p 36790:36790  yedf/dtm:latest
```

## 二进制包下载安装
github上面的[发布版本](https://github.com/dtm-labs/dtm/releases/latest)提供了各个版本的二进制包下载，提供了Mac、linux、windows三个平台的可运行文件：

- 苹果m1：dtm_$ver_darwin_arm64.tar.gz
- 苹果非m1：dtm_$ver_darwin_amd64.tar.gz
- linux：dtm_$ver_linux_amd64.tar.gz
- windows：dtm_$ver_windows_amd64.tar.gz

下载安装包，解压后即可运行

## 源码编译安装
需要go语言环境1.16以上

```
git clone https://github.com/dtm-labs/dtm && cd dtm
go build
```

`./dtm` 即可运行

## 运行
dtm运行后，会监听两个端口
- http：36789
- grpc：36790
