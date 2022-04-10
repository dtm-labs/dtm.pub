# 谁在用

如果您正在使用dtm，请帮忙在[这个链接](https://github.com/dtm-labs/dtm/issues/7)添加一个评论，帮助我们更好的扩散dtm。

## 典型案例

### 腾讯 {#tencent}
腾讯内部有多个事业部使用了dtm，涵盖许多业务场景。

dtm合并了多个腾讯同学提过来的PR，特性包括uber automaxprocs, MaxOpenConns, Polaris等等，特别感谢腾讯的同学们

dtm的这几个特性是优先考虑腾讯同学的需求开发的：
- 日志采用uber zap
- Redis存储引擎
- 并发Saga
- 自定义Header支持

[公司官网](https://www.tencent.com)

### 字节 {#bytedance}
字节内部某部门将dtm应用于环境的自动搭建。搭建环境是一个需要多处协调，耗时较长，中途容易出现中断的应用场景，通过引入dtm，做到了以下几点：

- 通过dtm，避免环境搭建处于搭建一半的状态，做到最后要么搭建成功，要么全部被清理
- 通过子事务屏障，避免部分环节被并发重入，导致问题
- 通过dtm的重试，保证出错回滚的情况下，一定会有一个清理任务最终成功完成

[公司官网](https://www.bytedance.com)

### 常青藤爸爸 {#ivydad}
这是一家B轮在线教育公司，我之前在这担任CTO

dtm最早解决的需求来自于常青藤爸爸，当时调研完市场情况，做了初步的架构设计之后，就认为go领域的分布式事务是强需求，我们的架构设计，我们的许多创新在业内非常先进，将dtm开源会让dtm获得很好的发展

当时常青藤爸爸的一个重要需求是：单体订单系统扣库存支持的并发度很低，大约20单每秒。虽然可以通过拆分微服务，提高并发量，但是一致性难以保证。市场上只有Java有成熟方案，以Seata为代表。我们把服务端语言切成Java的工作量太大，因此需要一个新的方案，因而诞生了dtm。

[公司官网](https://www.ivydad.com)

## 谁在使用

下面仅包含部分使用者

<div style='vertical-align: middle'>
    <img alt='腾讯' height='80'  src='../imgs/company/tencent.jpeg'  />
    <img alt='字节' height='80'  src='../imgs/company/bytedance.webp'  />
    <img alt='常青藤爸爸' height='80'  src='../imgs/company/ivydad.png'  />
    <img alt='聚爱优选' height='80'  src='../imgs/company/juaiyouxuan.png'  />
    <img alt='竹芒科技' height='80'  src='../imgs/company/zhumangkeji.jpeg'  />
    <img alt='镜小二' height='80'  src='../imgs/company/eglass.png'  />
    <img alt='极欧科技' height='80'  src='../imgs/company/jiou.png'  />
    <img alt='金数智联' height='80'  src='../imgs/company/gdci.png'  />
</div>
