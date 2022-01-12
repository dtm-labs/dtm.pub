# 存储引擎

dtm支持将全局事务的状态与进度保存到三类存储：关系数据库（mysql/postgres）、Redis、boltdb，这三种存储分别适合不同的场景，下面分别介绍如下

## 关系数据库
互联网里的几乎每个公司，都会将数据存储在关系数据库，因此dtm最早支持了关系型数据库的存储，包括：
- Mysql系列：Mysql，MariaDB，TiDB
- Postgress
详细配置参考[conf.sample.yml](https://github.com/dtm-labs/dtm/blob/main/conf.sample.yml)中Store.Driver:"mysql"部分

采用关系数据库进行存储，[性能测试报告](../other/performance)显示：2.6wIOPS磁盘上的的Mysql数据库，能够提供900+事务每秒，能够满足绝大部分公司的分布式事务需求。

如果上述性能不够，建议您考虑下面Redis存储方案
## Redis
Redis是应用非常广泛的缓存系统，几乎每个云厂商都会提供，几乎每个公司都有部署。dtm支持将全局事务进度存储到Redis，提供超高性能的分布式事务服务。

由于dtm需要按照时间顺序查询过期的全局事务，所以dtm的Redis存储不支持将负载分片到不同的slot上(PS: seata等分布式事务框架，同样不支持)。

各个公司可能已经购买了集群版的Redis服务，能否让dtm将数据存储到集群版Redis？答：可以，dtm默认会指定前缀，将所有的数据存储到一个slot。

详细配置参考[conf.sample.yml](https://github.com/dtm-labs/dtm/blob/main/conf.sample.yml)中Store.Driver:"redis"部分

采用Redis进行存储，可以达到非常高的性能，预计提供1w+事务每秒。相关的性能测试报告正在进行中，不久之后将更新。

如果您非常关注性能，可以接受机房断电的这种故障能够丢失短时间（1s左右)的数据，那么您可以考虑这种存储方案

## boltdb
boltdb是一种内嵌的kv存储，被etcd用作存储引擎，支持ACID。

dtm也支持您使用boltdb进行存储，这种存储方式适用于您想要快速体验dtm，省去安装mysql/redis的麻烦。

详细配置参考[conf.sample.yml](https://github.com/dtm-labs/dtm/blob/main/conf.sample.yml)中Store.Driver:"boltdb"部分

当您没有配置任何内容，默认情况下，dtm启动时，会采用boltdb

因为boltdb是内嵌的存储，未支持多机部署，因此不适合线上应用，只适合快速体验dtm。
