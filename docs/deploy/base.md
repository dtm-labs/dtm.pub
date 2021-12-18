# 基础

## 概览
dtm分为AP、RM、TM三个角色，其中AP、RM，是业务微服务，会集成DTM的SDK，随业务部署，不需要单独部署，只有DTM需要单独部署。

本小节说明的是线上部署方式，如果您仅在本地运行，可以参考[安装](../guide/start)

进行线上部署时，一共包括以下几个步骤：

1. 创建相关的数据库表
2. 通过环境变量配置启动dtm容器（推荐）
  - 您在测试接入期间，可以使用云上服务（未来大家真实需求量大，将会提供在线服务）
  - 您也可以选择不用环境变量，而采用文件配置（非推荐方式）
  - 您可以选择编译出dtm直接部署（非推荐方式）

## 准备数据表

### RM数据表
RM因为涉及本地资源管理，因此使用DTM提供的子事务屏障技术则需要在本地数据库中创建子事务屏障相关的表，建表语句详见：[子事务屏障表SQL](https://github.com/yedf/dtm/tree/main/dtmcli/barrier.mysql.sql)

### DTM数据表
DTM作为TM角色，将全局事务信息保存在数据库中，需要在相应数据库中创建相关表，建表语句详见[DTM全局事务表SQL](https://github.com/yedf/dtm/blob/main/dtmsvr/dtmsvr.mysql.sql)

## DTM配置
DTM支持环境变量和文件两种配置，如果同时有环境变量和文件，那么配置文件的优先级高

## 环境变量(推荐方式)
为了友好支持容器化和云原生，DTM支持环境变量进行配置

### 重要配置项
最重要配置项为dtm的存储，列出如下

#### DRIVER_STORE_DRIVER
指定您采用的存储引擎，取值为：mysql|postgres|redis|boltdb(默认)

#### DRIVER_STORE_HOST
如果DRIVER_STORE_DRIVER=="mysql"，那么这里指定数据库的主机名

#### DRIVER_STORE_PORT
如果DRIVER_STORE_DRIVER=="mysql"，那么这里指定数据库的端口号

#### DRIVER_STORE_USER
如果DRIVER_STORE_DRIVER=="mysql"，那么这里指定数据库的用户名

#### DRIVER_STORE_PASSWORD
如果DRIVER_STORE_DRIVER=="mysql"，那么这里指定数据库的用户密码


### 其他配置项

#### CRON_TRANS_INTERVAL
指定每个获取超时事务协程，每次获取空任务后的睡眠时间
#### TIMEOUT_TO_FAIL
指定XA，TCC失败的超时时间，以及事务消息模式中，反查的超时时间。

这个时间可以被各个事务单独的TimeoutToFail设置。其中saga事务，只使用事务中的TimeoutToFail，不使用系统中的设置，主要原因为SAGA事务的时间跨度可能很长

#### RETRY_INTERVAL
重试间隔，当某个事务分支操作返回错误，那么dtm会间隔这个时间进行重试。dtm的重试使用退避算法，详情见[重试](../ref/options)

### 更多配置项
更多的配置项，可以参考[yml样板配置文件](https://github.com/yedf/dtm/blob/main/conf.sample.yml)中的注释

## yml文件配置(非推荐方式)
为了方便直接部署和调试，DTM也支持yml配置文件，参考[yml样板配置文件](https://github.com/yedf/dtm/blob/main/conf.sample.yml)

dtm会依次读取当前路径以及父目录路径上的配置文件，每个目录，都会先查找conf.yml，再查找conf.sample.yml，找到文件即停止