# 基础

## 结构
dtm分为AP、RM、TM三个角色，其中AP，只涉及dtm客户端SDK的集成，无需部署

## RM部署
RM因为涉及本地资源管理，因此使用DTM提供的子事务屏障技术则需要在本地数据库中创建子事务屏障相关的表，建表语句详见：[子事务屏障表SQL](https://github.com/yedf/dtm/tree/main/dtmcli/barrier.mysql.sql)

## DTM部署
DTM作为TM角色，将全局事务信息保存在数据库中，需要在相应数据库中创建相关表，建表语句详见[DTM全局事务表SQL](https://github.com/yedf/dtm/blob/main/dtmsvr/dtmsvr.mysql.sql)

## DTM的配置
DTM支持环境变量和文件两种配置，如果同时有环境变量和文件，那么配置文件的优先级高

### 环境变量
为了友好支持容器化和云原生，DTM支持环境变量进行配置

#### DB_DRIVER
指定数据库类型，取值为:

- mysql dtm对mysql提供了良好支持
- postgres dtm服务端支持postgres，但是dtmcli以及示例，目前为了简单，并没有写成兼容postgres的方式。感兴趣的童鞋可以找到postgres分支，做相关的实践

#### DB_HOST

指定数据库的host

#### DB_PORT
指定数据库的port，默认为3306

#### DB_USER
指定数据库的用户名

#### DB_PASSWORD
指定数据库的密码

#### CRON_JOB_INTERVAL
轮询检查超时需处理的时间间隔，默认为10，表示大约10秒，会检查一次数据库中超时的全局事务

### yml文件部署
为了方便直接部署和调试，DTM也支持yml配置文件，参考[yml样板配置文件](https://github.com/yedf/dtm/blob/main/conf.sample.yml)

dtm会依次读取当前路径以及父目录路径上的配置文件，每个目录，都会先查找conf.yml，再查找conf.sample.yml，找到文件即停止