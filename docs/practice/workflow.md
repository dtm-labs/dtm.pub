# Workflow模式

Workflow 模式是DTM首创推出的模式，在这个模式下，可以混合使用XA、SAGA、TCC，也可以混合使用HTTP、gRPC，用户可以对分布式事务里面的绝大部分内容进行定制，具备极大的灵活性，下面我们以转账场景，讲述如何在Workflow下进行实现。

## workflow例子
Workflow模式下，既可以使用HTTP协议，也可以使用gRPC协议，下面以gRPC协议作为例子，一共分为一下几步：
- 初始化 SDK
- 注册workflow
- 执行workflow

#### 首先需要在使用workflow前对 SDK 的 Workflow 进行初始化：

``` Go
import 	"github.com/dtm-labs/dtmgrpc/workflow"

// 初始化workflow SDK，三个参数分别为：
// 第一个参数，dtm服务器地址
// 第二个参数，业务服务器地址
// 第三个参数，grpcServer
// workflow的需要从"业务服务器地址"+"grpcServer"上接收dtm服务器的回调
workflow.InitGrpc(dtmGrpcServer, busi.BusiGrpc, gsvr)
```

#### 然后需要注册workflow的处理函数
``` Go
wfName := "wf_saga"
err := workflow.Register(wfName, func(wf *workflow.Workflow, data []byte) error {
  req := MustUnmarshalReqGrpc(data)
  wf.NewBranch().OnRollback(func(bb *dtmcli.BranchBarrier) error {
    _, err := busi.BusiCli.TransOutRevert(wf.Context, req)
    return err
  })
  _, err := busi.BusiCli.TransOut(wf.Context, req)
  if err != nil {
    return err
  }
  wf.NewBranch().OnRollback(func(bb *dtmcli.BranchBarrier) error {
    _, err := busi.BusiCli.TransInRevert(wf.Context, req)
    return err
  })
  _, err = busi.BusiCli.TransIn(wf.Context, req)
  return err
})
```

- 这个注册操作需要在业务服务启动之后执行，因为当进程crash，dtm会回调业务服务器，继续未完成的任务
- 上述代码`NewBranch`会创建一个事务分支，一个分支会包括一个正向操作，以及全局事务提交/回滚时的回调
- `OnRollback/OnCommit`会给当前事务分支指定全局事务回滚/提交时的回调，上述代码中，只指定了`OnRollback`，属于Saga模式
- 这里面的 `busi.BusiCli` 需要添加workflow的拦截器，该拦截器会自动把rpc的请求结果记录到dtm，如下所示
``` Go
conn1, err := grpc.Dial(busi.BusiGrpc, grpc.WithUnaryInterceptor(workflow.Interceptor), nossl)
busi.BusiCli = busi.NewBusiClient(conn1)
```

当然您也可以给所有的gRPC client添加`workflow.Interceptor`，这个中间件只会处理`wf.Context`和`wf.NewBranchContext()`下的请求

- 当工作流函数返回nil/ErrFailure，全局事务会进入Commit/Rollback阶段，反序调用函数内部OnCommit/OnRollback注册的操作

#### 最后是执行workflow
``` Go
req := &busi.ReqGrpc{Amount: 30}
err = workflow.Execute(wfName, shortuuid.New(), dtmgimp.MustProtoMarshal(req))
```

- 当Execute的结果为`nil/ErrFailure`时，全局事务已成功/已回滚。
- 当Execute的结果为其他值时，dtm服务器后续会回调这个工作流任务进行重试

## workflow原理
workflow是如何保证分布式事务的数据一致性呢？当业务进程出现crash等问题时，dtm服务器会发现这个workflow全局事务超时未完成，那么dtm会采用指数回避的策略，对workflow事务进行重试。当workflow的重试请求到达业务服务，SDK会从dtm服务器读取全局事务的进度，对于已完成的分支，会将之前保存的结果，通过gRPC/HTTP等拦截器，直接返回分支结果。最终workflow会顺利完成。

工作流函数需要做到幂等，即第一次调用，或者后续重试，都应当获得同样的结果

## Workflow下的Saga
Saga模式源自于这篇论文 [SAGAS](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)，其核心思想是将长事务拆分为多个短事务，由Saga事务协调器协调，如果每个短事务都成功提交完成，那么全局事务就正常完成，如果某个步骤失败，则根据相反顺序一次调用补偿操作。

在Workflow模式下，您可以在函数中，直接调用正向操作的函数，然后将补偿操作写到分支的`OnRollback`，那么补偿操作就会自动被调用，达到了Saga模式的效果

## Workflow下的Tcc
Tcc模式源自于这篇论文 [Life beyond Distributed Transactions:an Apostate’s Opinion](https://www.ics.uci.edu/~cs223/papers/cidr07p15.pdf)，他将一个大事务分成多个小事务，每个小事务有三个操作：
- Try 阶段：尝试执行，完成所有业务检查（一致性）, 预留必须业务资源（准隔离性）
- Confirm 阶段：如果所有分支的Try都成功了，则走到Confirm阶段。Confirm真正执行业务，不作任何业务检查，只使用 Try 阶段预留的业务资源
- Cancel 阶段：如果所有分支的Try有一个失败了，则走到Cancel阶段。Cancel释放 Try 阶段预留的业务资源。

对于我们的 A 跨行转账给 B 的场景，如果采用SAGA，在正向操作中调余额，在补偿操作中，反向调整余额，那
么会出现以下情况：
- A扣款成功
- A看到余额减少，并告诉B
- 金额转入B失败，整个事务回滚
- B一直收不到这笔资金

这样给AB双方带来了极大的困扰。这种情况在SAGA中无法避免，但是可以通过TCC来解决，设计技巧如下：
- 在账户中的 balance 字段之外，再引入一个 trading_balance 字段
- Try 阶段检查账户是否被冻结，检查账户余额是否充足，没问题后，调整 trading_balance （即业务上的冻结资金）
- Confirm 阶段，调整 balance ，调整 trading_balance （即业务上的解冻资金）
- Cancel 阶段，调整 trading_balance （即业务上的解冻资金）

这种情况下，一旦终端用户 A 看到自己的余额扣减了，那么 B 一定能够收到资金

在Workflow模式下，您可以在函数中，直接调用`Try`操作，然后将`Confirm`操作写到分支的`OnCommit`，将`Cancel`操作写到分支的`OnRollback`，达到了`Tcc`模式的效果

## Workflow下的XA
XA是由X/Open组织提出的分布式事务的规范，XA规范主要定义了(全局)事务管理器(TM)和(局部)资源管理器(RM)之间的接口。本地的数据库如mysql在XA中扮演的是RM角色

XA一共分为两阶段：

第一阶段（prepare）：即所有的参与者RM准备执行事务并锁住需要的资源。参与者ready时，向TM报告已准备就绪。
第二阶段 (commit/rollback)：当事务管理者(TM)确认所有参与者(RM)都ready后，向所有参与者发送commit命令。

目前主流的数据库基本都支持XA事务，包括mysql、oracle、sqlserver、postgre

在Workflow模式下，你可以在工作流函数中，调用`NewBranch().DoXa`来开启您的XA事务分支。

## 多种模式混合使用
在Workflow模式下，上述的Saga、Tcc、XA都是分支事务的模式，因此可以部分分支采用一种模式，其他分支采用另一种模式。这种混合模式带来的灵活性可以做到根据分支事务的特性选择子模式，因此建议如下：
- XA：如果业务没有行锁争抢，那么可以采用XA，这个模式需要的额外开发量比较低，`Commit/Rollback`是数据库自动完成的。例如这个模式适合创建订单业务，不同的订单锁定的订单行不同，相互之间并发无影响；不适合扣减库存，因为涉及同一个商品的订单都会争抢这个商品的行锁，会导致并发度低。
- Saga：不适合XA的普通业务可以采用这个模式，这个模式额外的开发量比Tcc要少，只需要开发正向操作和补偿操作
- Tcc：适合一致性要求较高，例如前面介绍的转账，这个模式额外的开发量最多，需要开发包括`Try/Confirm/Cancel`

## 幂等要求
在Workflow模式下，当crash发生时，会进行重试，因此要求各个操作支持幂等，即多次调用和一次调用的结果是一样的，返回相同的结果。业务中，通常采用数据库的`unique key`来实现幂等，具体为`insert ignore "unique-key"`，如果插入失败，说明这个操作已完成，此次直接忽略返回；如果插入成功，说明这是首次操作，继续后续的业务操作。

如果您的业务本身就是幂等的，那么您直接操作您的业务即可；如果您的业务未提供幂等功能，那么dtm提供了`BranchBarrier`辅助类，基于上述unique-key原理，可以方便的帮助开发者实现在`Mysql/Mongo/Redis`中实现幂等操作。

以下两个是典型的非幂等操作，请注意：
- 超时回滚：假如您的业务中有一个操作可能耗时长，并且您想要让您的全局事务在等待超时后，返回失败，进行回滚。那么这个就不是幂等操作，因为在极端情况下，两个进程同时调用了该操作，一个返回了超时失败，而另一个返回了成功，导致结果不同
- 达到重试上限后回滚：分析过程同上。

Workflow模式暂未支持上述的超时回滚及重试达到上限后回滚，如果您有相关的场景需求，欢迎把具体场景给我们，我们将积极考虑是否添加这种的支持

## 分支操作结果
分支操作会返回以下几种结果：
- 成功：分支操作返回`HTTP-200/gRPC-nil`
- 业务失败：分支操作返回`HTTP-409/gRPC-Aborted`，不再重试，全局事务需要进行回滚
- 进行中：分支操作返回`HTTP-425/gRPC-FailPrecondition`，这个结果表示事务正在正常进行中，要求dtm重试时，不要采用指数退避算法，而是采用固定间隔重试
- 未知错误 ：分支操作返回其他结果，表示未知错误，dtm会重试这个工作流，采用指数退避算法

如果您的现有服务与上述的结果不同，那么您可以通过`workflow.Options.HTTPResp2DtmError/GRPCError2DtmError`来定制这部分结果

Saga的补偿操作、Tcc的Confirm/Cancel操作，按照Saga和Tcc的协议，是不允许返回业务上的失败，因为到了工作流的第二阶段Commit/Rollback，此时既不成功，也不让重试，那么全局事务无法完成，这点请开发者在设计时就要注意避免

## 事务完成通知
部分业务场景，想要获得事务完成的通知，这个功能可以通过在第一个事务分支上设置`OnFinish`回调来实现。当回调函数被调用时，所有的业务操作已经执行完毕，因此全局事务在实质上已经完成。回调函数可以依据传入的`isCommit`来判断全局事务最终提交了还是回滚了。

有一个地方需要注意，收到`OnFinish`回调时，dtm服务器上，这个事务的状态还未修改为最终状态，因此如果混合使用事务完成通知和查询全局事务结果，那么两者的结果可能不一致，建议用户只使用其中一种方式，而不要混合使用。

## 性能
在DTM里，正常完成一个Workflow事务，需要两个分开的全局事务写（一个是Prepare时保存，另一个是将状态改为成功），需要保存中间事务进度（这部分批量化后，开销很小）。对比DTM的Saga模式，少了一个单独的分支事务保存，另外分支事务的写入量变小（成功的事务不需要额外保存补偿分支），因此性能会比Saga的性能更好，详细的测试报告，未来会出。

## 下一步工作
- 逐步完善workflow的例子以及文档
- 支持分支事务并发
