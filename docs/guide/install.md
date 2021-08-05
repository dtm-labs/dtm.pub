# 安装

DTM包含服务和客户端SDK两部分，我们先看服务的安装

## docker方式安装

这种方式安装，对于其他语言栈启动dtm非常友好

您首先需要[安装docker 18+](https://docs.docker.com/get-docker/)

然后运行下面命令

``` bash
git clone https://github.com/yedf/dtm
cd dtm
docker-compose up
```

## go语言方式安装

这种方式安装，对于用go语言深入研究dtm的开发人员非常友好，能够方便开发人员运行所有的例子，调试跟踪所有代码的运行

### 准备工作

首先您需要先[安装go 15+](https://golang.google.cn/)

然后运行下面命令

``` bash
git clone https://github.com/yedf/dtm
cd dtm
```

dtm依赖于mysql，您可以以下两种方式，选择一个进行安装:

### 手动安装mysql(可选)

手动[安装mysql](https://www.mysql.com/)

填写mysql相关配置

``` bash
cp conf.sample.yml conf.yml # 修改conf.yml
```

### docker安装mysql(可选)

您首先需要[安装docker 18+](https://docs.docker.com/get-docker/)

然后运行下面命令

``` bash
docker-compose -f aux/compose.mysql.yml up
```

#### 启动

最常见的是准备数据并启动

``` bash
go run app/main.go
```

也可以准备数据，启动并运行一个saga示例

``` bash
go run app/main.go saga
```

也可以单纯启动，不准备数据

``` bash
go run app/main.go dtmsvr
```
