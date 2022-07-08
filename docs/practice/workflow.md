# Workflow模式

Workflow 模式是DTM首创推出的模式，在这个模式下，可以混合使用XA、SAGA、TCC，用户可以对分布式事务里面的绝大部分内容进行定制，具备极大的灵活性，下面我们以转账场景，讲述如何在Workflow下进行实现。

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
workflow.InitGrpc(dtmutil.DefaultGrpcServer, busi.BusiGrpc, gsvr)
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
- 上述代码`NewBranch`会创建一个事务分支，一个分支会包括一个正向操作，以及全局事务的提交/回滚的操作
- `OnRollback`会给当前事务分支指定全局事务提交的回调，上述代码中，只指定了`OnRollback`，属于Saga模式
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

## 优势
workflow模式下
- 强类型gRPC调用：在workflow模式下，用户不在需要像原有的Saga或Tcc模式那样，手动指定分支的url，而是像普通的gRPC调用一样执行分支操作
- 灵活处理每一步的结果：在workflow模式下，子事务的编排非常灵活，和普通服务调用没有差别
- 支持XA，Saga，TCC混合使用：在workflow模式下，支持XA，Saga，TCC。可以把没有行锁的业务走XA，一致性要求较高的走TCC，而普通的业务走Saga
- 可以不用处理空补偿和悬挂：如果工作流中的所有操作能够保证幂等，那么就不会发生空补偿和悬挂，可以简化业务处理
- 对旧服务兼容度更好：默认情况下，HTTP的409，gRPC的Aborted表示业务失败，但是可以通过Options.HTTPResp2DtmError/GRPCError2DtmError进行定制

## 下一步工作
- 逐步完善workflow的例子以及文档
- 支持并发