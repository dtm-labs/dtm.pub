# Redis存储引擎性能测试报告

## 概述
之前dtm给出了Mysql作为存储引擎的性能测试报告，在一个普通配置的机器上，2.68w IOPS，4核8G机器上，能够支持大约每秒900+分布式事务，能够满足大部分公司的业务需求。

此次带来的是Redis存储引擎的测试报告，在一个普通配置的机器上，能够达到大约10800每秒的分布式事务能力，对比Mysql存储，有10倍左右的性能提升，满足绝大部分公司的业务需求。

下面我们来详细说明测试的步骤，并分析其中影影响性能的各个因素。

## 测试环境
下面的服务器都来自阿里云，地区为东京（外网访问比较方便）

Redis服务器：ecs.hfc6 4核8G CPU主频为3.1 GHz/3.5 GHz 内网收发包50万PPS ubuntu 20.04

两台应用服务器：ecs.hfc6 8核16G CPU主频为3.1 GHz/3.5 GHz 内网收发包80万PPS ubuntu 20.04

## 测试步骤：

### 准备好Redis
在上面的Redis上面准备好Redis，这次因为考虑到极限性能，因此不采用docker安装，而是采用apt install 安装，运行如下命令
``` bash
apt update
apt install -y redis
# 修改/etc/redis/redis.conf，找到其中的bind，改为bind 0.0.0.0
systemctl restart redis-server
```

### 配置应用服务器
``` bash
apt update
apt install -y git
git clone https://github.com/dtm-labs/dtm.git && cd dtm && git checkout alpha && cd bench && make
```

注意以下步骤是两台应用服务器都需要操作

### 配置dtm
修改 dtm目录下的conf.sample.yml，配置使用Redis，例如：
```
Store:
  Driver: 'redis'
	Host: 'redis ip'
	Port: 6379

# 另外再把ExamplesDB里面的配置删除，因为我们没有安装mysql
```

### 启动bench服务器
`
LOG_LEVEL=warn go run bench/main.go redis
`

### 启动测试
`
ab -n 1000000 -c 10 "http://127.0.0.1:8083/api/busi_bench/benchEmptyUrl"
`

### 获得结果

我这看到ab的结果显示，每秒完成的操作数量两台应用服务器加总为10875

## Redis性能分析
我们首先来看Redis本身的性能，影响它的因素是哪些，先看下面的这些测试数据：

`
redis-benchmark -n 300000 SET 'abcdefg' 'ddddddd'
`

每秒完成的请求数10w

`
redis-benchmark -h 内网其他主机IP -p 6379 -n 300000 SET 'abcdefg' 'ddddddd'
`

每秒完成的请求数10w

从这上面的两个结果看，本地Redis测试和远程Redis测试，性能差异并不明显。我也测试过其他更多的命令，也未发现明显差异，因此下面主要就测试本地Redis性能，不再比较本地和远程的差别。

`
redis-benchmark -n 300000 EVAL "redis.call('SET', 'abcdedf', 'ddddddd')" 0
`

Lua脚本每秒完成的请求数10w

`
redis-benchmark -n 300000 EVAL "redis.call('SET', KEYS[1], ARGS[1])" 1 'aaaaaaaaa' 'bbbbbbbbbb'
`

Lua脚本每秒完成的请求数10w

`
redis-benchmark -n 3000000 -P 50 SET 'abcdefg' 'ddddddd'
`

走Pipeline的话，每秒完成的请求数150w，这个性能对比单个Set操作有大幅提升。从这个数据和单个操作的对比看，Redis本身内存操作开销不大，很多的开销花在了网络IO上，因此批量任务能够大幅提升吞吐量

`
redis-benchmark -n 300000 EVAL "for k=1, 10 do; redis.call('SET', KEYS[1], ARGS[1]); end" 1 'aaaaaaaaa' 'bbbbbbbbbb'
`

我们在Lua内部，连续执行10次Set，每秒完成的请求数6.1w，和只执行1次Set差别没有很大。这个结果在我们的预期之内，因为前面Pipeline的结果显示Redis的内存操作开销大幅小于网络。

`
## dtm性能分析
dtm需要跟踪全局分布式事务的进度，我们以测试的Saga举例，大概涉及以下操作：
- 保存事务信息，含全局事务、事务分支、还有查找过期事务的索引，dtm用一个Lua脚本来完成这些操作
- 每个事务分支完成时，修改事务分支状态。由于修改状态时，需要确认全局事务处于正确状态，避免回滚中的事务还往前执行，因此dtm也用一个Lua脚本来完成
- 全局事务完成，修改全局事务为成功，此时也需要避免已超时回滚中的事务被覆盖，也需要确认状态修改，也是一个Lua脚本

那么一个事务在Redis上的理论开销大约是4个Lua脚本的开销，那么从前面每秒能够完成大约6w个简单Lua脚本来看，每秒最理想能够完成1.5w个分布式事务。由于实际的Lua脚本比我们测试的更复杂，传输的数据量更大，因此最终每秒完成1.08w个事务，已经是差不多的性能极限值。

## 展望
每秒1w事务已经是非常高的性能，足够应对绝大多数的场景。包括消息队列、秒杀等。

当Redis能够支撑这么大的事务量时，如果是长时间这么大的事务量，那么redis的存储空间很快就不够了，后续可能添加选项，允许及时清理掉已完成的事务

未来dtm的性能是否还能提高？我们可以从两方面看：

一个是在目前单进程的情况下，dtm能够达到1w事务每秒，在redis6.0上，官方的数据显示，4CPU性能大约提升150%，这样的话dtm预计能够支撑2.5w事务每秒。

另一个是dtm往集群的方向发展，提供集群能力，允许动态扩容等。这方面需要看未来的使用情况，再做相关规划。

