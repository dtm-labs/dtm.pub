# 基础

## 概览

本小节说明的是线上部署方式，如果您仅在本地运行，可以参考[安装](../guide/start)

dtm的整个分布式事务中，各个参与者，分为AP、RM、TM三个角色，详情参见指南中的 dtm 架构。当您需要将一个分布式事务应用上线时，您需要以下几步：
- 准备 RM 中使用的子事务屏障表，需要在你的业务数据库中创建
- 准备 DTM 服务器中使用的事务状态存储表，只有DTM采用数据库存储才需要
- 设计你的部署方案：可采用的方案包括，直接二进制部署、docker部署、K8S 部署。这当中可能还跟您接入的微服务有关
- 设计你的 dtm 多副本方案：线上应用不建议单副本部署。dtm与普通的无状态应用一样，直接多副本即可
- 配置你的 dtm 服务器

## 注意点
- **dtm服务器如果使用数据库，那么一定要使用主库。一方面dtm是写多读少，读写分离，对于dtm的负载分摊有限；另一方面dtm对数据的一致性要求较高，从库延时会导致各种问题。**

## 准备 RM 数据表
RM 因为涉及本地资源管理，因此使用DTM提供的子事务屏障技术则需要在本地数据库中创建子事务屏障相关的表，建表语句详见：[建表SQL](https://github.com/dtm-labs/dtm/blob/main/sqls/)中的barrier文件

## 准备 DTM 数据表
DTM 作为TM角色，如果选择数据库作为存储引擎，那么会将全局事务信息保存在数据库中，需要在相应数据库中创建相关表，建表语句详见[建表SQL](https://github.com/dtm-labs/dtm/blob/main/sqls/)中的storage文件

## 部署方案
这部分内容较多，详情参见[部署](./deploy)

## dtm 多副本方案
线上应用不建议单副本部署，dtm 也不例外。你需要根据您的部署方案，进行多副本部署
- 微服务部署，如go-zero、polaris：这类微服务协议，已有多副本方案，参考具体的微服务情况即可
- 二进制部署、Docker部署时，您可以参考您的其他 RM 应用多副本部署方案，对 dtm 进行多副本部署
- K8S部署：可以直接指定副本数

dtm 的多副本如何协作，避免问题，可以参考 [dtm架构](../practice/arch)中的高可用部分

## DTM配置
DTM支持环境变量和文件两种配置，如果同时有环境变量和文件，那么配置文件的优先级高

#### 环境变量
为了友好支持容器化和云原生，DTM支持环境变量进行配置

所有可配置的选项参考: [yml样板配置文件](https://github.com/dtm-labs/dtm/blob/main/conf.sample.yml)，对于每个配置文件里的配置，都可以通过环境变量设置，对应规则如下：

```
MicroService.EndPoint => MICRO_SERVICE_END_POINT
```

一个使用mysql的配置文件样例如下：
``` yml
Store:
  Driver: 'mysql'
  Host: 'localhost'
  User: 'root'
  Password: ''
  Port: 3306
```

最详细的配置说明参考上述yml样板配置文件里面，每个配置项的注释

#### yml文件配置
为了方便直接部署和调试，DTM也支持yml配置文件，详细配置项参考[yml样板配置文件](https://github.com/dtm-labs/dtm/blob/main/conf.sample.yml)

采用yml配置dtm时，需要通过命令行指定配置文件，采用如下命令：

`dtm -c ./conf.sample.yml`
