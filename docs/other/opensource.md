# 其他框架

## 与其他框架对比

目前开源的分布式事务框架，暂未看到非Java语言的其他框架。而Java语言的较多，其中以Seata应用最为广泛。

下面是DTM和SEATA的主要特性对比：

|  特性| DTM | SEATA |备注|
|:-----:|:----:|:----:|:----:|
| [支持语言](#lang) |<span style="color:green">Go、Java、python、php、c#...</span>|<span style="color:orange">Java</span>|dtm可轻松接入一门新语言|
|[异常处理](#exception)| <span style="color:green">子事务屏障自动处理</span>|<span style="color:orange">手动处理</span> |dtm解决了幂等、悬挂、空补偿|
|[TCC事务](#tcc)| <span style="color:green">✓</span>|<span style="color:green">✓</span>||
| [XA事务](#xa)|<span style="color:green">✓</span>|<span style="color:green">✓</span>||
|[AT事务](#at)|<span style="color:green">建议使用XA</span>|<span style="color:green">✓</span>|AT与XA类似，性能稍好，但有脏读脏回滚|
| [SAGA事务](#saga) |<span style="color:green">支持并发</span> |<span style="color:green">状态机模式</span> ||
|[二阶段消息](#msg)|<span style="color:green">✓</span>|<span style="color:red">✗</span>|dtm提供类似rocketmq的二阶段消息|
|[单服务多数据源](#multidb)|<span style="color:green">✓</span>|<span style="color:red">✗</span>||
|[通信协议](#protocol)|HTTP、gRPC|dubbo等协议||
|[star数量](#star)|<img src="https://img.shields.io/github/stars/dtm-labs/dtm.svg?style=social" alt="github stars"/>|<img src="https://img.shields.io/github/stars/seata/seata.svg?style=social" alt="github stars"/>|dtm从20210604发布0.1，发展快|

从上面对比的特性来看，如果您的语言栈包含了Java之外的语言，那么dtm是您的首选。如果您的语言栈是Java，您也可以选择接入dtm，使用子事务屏障技术，简化您的业务编写。

下面将详细介绍上述特性的对比（关于Seata的部分，可能更新不及时，如果读者发现，欢迎给我们提PR，我们会及时反馈与更新）

## 支持语言 {#lang}
dtm从设计之初就考虑了多语言支持，目前已经有多个语言的SDK，包括Go、Java、PHP、Python、C#、Node。

dtm在架构上面，就把SDK层做的很薄，把能够在服务端完成的事情全部放到服务端，这样能够方便各个语言快捷的开发SDK。通常一门语言某个模式的SDK实现也就几十到一两百行的代码。

Seata的SDK，相对较重，里面包含了大量的逻辑，想要在一门新语言中，实现SDK，工作量非常大

## 异常处理 {#exception}
异常问题这里主要是指分布式系统中Network Delay和Process Pause造成的乱序，需要应用处理重复请求、悬挂、空补偿。这是一个非常棘手的问题，虽然每个分布式事务框架都给出了业务实现建议，但是业务实现这个非常困难，很容易掉坑，并且难以测试，详情可以参考[子事务屏障自动处理](../exception/barrier.html)

dtm首创了子事务屏障技术，一方面系统性的处理了该问题，另一方面该技术极大的简化了问题处理，其他语言可以很容易参考实现，大大降低了分布式事务的使用门槛

Seata目前版本(截止2021-12-25的版本为1.4.2)还是需要业务手动处理

## TCC事务 {#tcc}
dtm和Seata都支持了TCC事务。因为现在的微服务框架，或者服务网格通常会进行失败重试，因此dtm在这方面做了很好的设计，允许重试，不会产生任何问题。Seata的TCC则需要注意重试可能导致的问题

## XA事务 {#xa}
dtm和Seata都支持XA事务，他们的接口差别较大。dtm采用的是回调函数形式的接口，而Seata采用的是Java特有的注解形式接口

## AT事务 {#at}
AT事务是Seata独有的事务模式，我的观点是，该模式是XA的手动实现，在适用场景、性能、使用注意点，与XA都非常相近，因此建议读者如果遇见使用AT的场景，都可以考虑使用XA事务

## SAGA事务 {#saga}
Seata的Saga实现采用了状态机，优点是可以做到灵活配置，缺点是上手难度非常高。一个简单的分布式事务，使用Saga的状态机Json配置，可以达到将近90行，而这部分配置可读性很差，可调试性也很差。

dtm在SAGA事务设计选择上，做了部分用户调研，发现使用状态机的用户非常少，许多经验丰富的程序员研究Seata的Saga状态机使用，也是困难重重。在收集了部分用户在长事务上面的需求之后，dtm选择了新的实现方式：支持并发的Saga。这项选择的重要结果是，dtm的用户中，很多人选择使用简单Saga。而部分高级需求可以通过一些简单的技巧解决，详情参考[深度剖析Saga分布式事务](https://segmentfault.com/a/1190000041001954)

## 二阶段消息 {#msg}
dtm支持了二阶段消息事务模式，该模式受RocketMQ的事务消息启发。这里我们起了一个新名字的主要原因是，“事务消息”和“事务模式”很容易就把大家弄混了。

二阶段消息主要是为了一站式的解决本地消息表这种事务模式带来的开发维护成本较高的问题。

二阶段消息也可以退化为一阶段消息，就跟普通的可靠消息类似。

Seata暂时未支持这种事务模式，未来可能会对接RocketMQ

## 单服务多数据 {#multidb}
dtm的TCC和SAGA事务支持单服务多数据源，详细的使用方式会在近期补充近文档

Seata暂未支持这种场景

## 通信协议 {#protocol}
dtm支持HTTP、gRPC，同时也支持基于gRPC的微服务协议，目前已支持go-zero、Polaris。未来可以非常便捷的接入更多新的协议，如有需求，也可以接入Spring cloud

Seata则对Java领域的微服务协议支持较多，例如Spring cloud、Dubbo等

## Star {#star}
dtm从2021年6月开源以来，受到了大量的关注，star增长趋势很好，潜力非常好