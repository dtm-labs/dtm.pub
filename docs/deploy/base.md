# 基础

## 概览
dtm分为AP、RM、TM三个角色，其中AP、RM，是业务微服务，会集成DTM的SDK，随业务部署，不需要单独部署，只有DTM需要单独部署。

本小节说明的是线上部署方式，如果您仅在本地运行，可以参考[安装](../guide/install)

进行线上部署时，一共包括以下几个步骤：

1. 创建相关的数据库表
2. 通过环境变量配置启动dtm容器（推荐）
  - 您也可以选择不用环境变量，而采用文件配置（非推荐方式）
  - 您可以选择编译出dtm直接部署（非推荐方式）

## 准备数据表

### RM数据表
RM因为涉及本地资源管理，因此使用DTM提供的子事务屏障技术则需要在本地数据库中创建子事务屏障相关的表，建表语句详见：[子事务屏障表SQL](https://github.com/yedf/dtm/tree/main/dtmcli/barrier.mysql.sql)

## DTM数据表
DTM作为TM角色，将全局事务信息保存在数据库中，需要在相应数据库中创建相关表，建表语句详见[DTM全局事务表SQL](https://github.com/yedf/dtm/blob/main/dtmsvr/dtmsvr.mysql.sql)

## DTM配置
DTM支持环境变量和文件两种配置，如果同时有环境变量和文件，那么配置文件的优先级高

## 环境变量(推荐方式)
为了友好支持容器化和云原生，DTM支持环境变量进行配置

### 必须的配置项
必须的配置项有三个DB_HOST, DB_USER, DB_PASSWORD

#### DB_HOST
指定数据库的host

#### DB_USER
指定数据库的用户名

#### DB_PASSWORD
指定数据库的密码

### 可选的配置项
可选的配置项都有默认值

### DB_DRIVER
指定数据库类型，取值为:

- mysql dtm对mysql提供了良好支持
- postgres dtm服务端支持postgres，但是dtmcli以及示例，目前为了简单，并没有写成兼容postgres的方式。感兴趣的童鞋可以找到postgres分支，做相关的实践

不指定时，默认为mysql

#### DB_PORT
指定数据库的port，默认为3306

#### CRON_JOB_INTERVAL
轮询检查超时需处理的时间间隔，默认为10，表示大约10秒，会检查一次数据库中超时的全局事务

## yml文件配置(非推荐方式)
为了方便直接部署和调试，DTM也支持yml配置文件，参考[yml样板配置文件](https://github.com/yedf/dtm/blob/main/conf.sample.yml)

dtm会依次读取当前路径以及父目录路径上的配置文件，每个目录，都会先查找conf.yml，再查找conf.sample.yml，找到文件即停止