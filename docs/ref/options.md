# 事务选项

## 概况
dtm的事务可以设定以下的选项:
``` Go
type TransOptions struct {
	WaitResult         bool              `json:"wait_result,omitempty" gorm:"-"`
	TimeoutToFail      int64             `json:"timeout_to_fail,omitempty" gorm:"-"` // for trans type: saga xa tcc
	RetryInterval      int64             `json:"retry_interval,omitempty" gorm:"-"`  // for trans type: msg saga xa tcc
	BranchHeaders      map[string]string `json:"branch_headers,omitempty" gorm:"-"`
}
```

在 Saga、Msg事务模式中，可以在事务对象生成之后，设定这些选项

XA 则需要在 XaGlobalTransaction2 的第二个参数回调函数中设定

TCC 则需要在 TccGlobalTransaction2 的第三个参数回调函数中设定
## 等待事务结果

上面介绍了各种模式，每种模式将事务提交之后，立即返回，不等待事务结束。但某些实际应用的场景，很多时候希望在整个全局事务完成之后，返回给用户最终结果，dtm对此进行了支持。

dtm 是通过事务中的 WaitResult 选项，对此进行了支持。该标记为true的情况下，Submit提交给dtm后，dtm会同步对事务进行一轮分支事务操作的调用，如果一切正常，所有的分支事务操作全部成功结束，全局事务成功，那么返回SUCCESS。如果全局事务的某个分支操作，出现异常，那么返回错误，后续会超时重试相关的分支操作。

客户端检查Submit返回的错误，如果为nil，则表示整个全局事务已经正常完成。如果不是nil，不意味全局事务已回滚，可能的情况有很多，客户端最好通过 dtm 的 query 接口查询全局事务的状态。

WaitResult 选项适用于：Saga/Xa/Tcc/Msg。

可以在示例项目中搜索 WaitResult，查看相关的例子

## 超时
dtm 服务器有一个配置项 TimeoutToFail：他指定了全局事务默认的超时失败时长（系统默认为33秒）。

当一个TCC、XA事务超过TimeoutToFail之后，会超时失败，进行回滚。您可以修改系统的默认值，也可以单独指定事务的TimeoutToFail

MSG 事务模式对 TimeoutToFail 的解读与其他事务模式不同，它是指在这个时间之后，会对只调用了Prepare，但是没有调用Submit的全局事务进行反查。MSG 事务模式在Submit之后，是不会回滚的。

SAGA 事务可能为短事务，也可能为长事务，超时时间跨度非常大，因此不采用系统设定的值，但是可以单独指定事务的TimeoutToFail

可以在示例项目中搜索 TimeoutToFail，查看相关的例子

## 重试时间

DTM 会对许多事务分支操作进行重试，重试的间隔时间为 RetryInterval （系统默认为10秒），您可以修改系统的默认值，也可以单独指定事务的RetryInterval

DTM重试时采用退避算法，如果重试失败，则会加倍重试间隔时间后重试；如果某一次重试成功，那么会重置间隔时间，避免后续的正常操作采用过大的间隔时间

如果您不想要退避算法，而是希望间隔固定的时间，例如您预定了机票，需要定时查询结果，那么您可以在您的服务中，返回ONGOING，当DTM收到这个返回值，会不走退避算法，而是按照设定的间隔时间进行重试

可以在示例项目中搜索 RetryInterval ，查看相关的例子

## 自定义header

有一部分的业务中的子事务，需要自定义header。dtm支持全局事务粒度的header定制，即您可以给不同的全局事务指定不同的自定义header，dtm调用您的子事务服务时，将会添加您指定的header

HTTP和gRPC都支持自定义header，详情可以参考[dtm-examples](https://github.com/dtm-labs/dtm-examples)名字中带有Header的例子

可以在示例项目中搜索 BranchHeaders ，查看相关的例子
