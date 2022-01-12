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
## 等待事务结果

上面介绍了各种模式，每种模式将事务提交之后，立即返回，不等待事务结束。但某些实际应用的场景，用户需要知道整个事务的结果，dtm对此进行了支持。

可以在示例项目中搜索WaitResult，查看相关的例子

所有的全局事务对象，Saga/Xa/Tcc/Msg，都可以设置WaitResult。

该标记为true的情况下，Submit提交给dtm后，dtm会同步对事务进行一轮处理，如果一切正常，返回SUCCESS，如果全局事务的某个分支操作，出现问题，返回错误，后续会超时重试相关的分支操作。

客户端检查Submit返回的错误，如果为nil，则表示整个全局事务已经正常完成。如果不是nil，不意味全局事务已回滚，可能的情况有很多，客户端最好通过dtm的query接口查询全局事务的状态。

## 超时

默认情况下，当一个TCC、XA事务超过TimeoutToFail（系统默认为33秒）之后，会超时失败，进行回滚。您可以修改系统的默认值，也可以单独指定事务的TimeoutToFail

MSG事务模式因为不回滚，所以忽略超时设置，但是MSG中的事务消息，会在TimeoutToFail之后，进行反查

SAGA事务可能为长事务，超时时间跨度非常大，因此不采用系统设定的值，但是可以单独指定事务的TimeoutToFail

## 重试时间

DTM会对许多事务分支操作进行重试，重试的间隔时间为RetryInterval（系统默认为10秒），您可以修改系统的默认值，也可以单独指定事务的RetryInterval

DTM重试时采用退避算法，如果重试失败，则会加倍重试间隔时间后重试；如果某一次重试成功，那么会重置间隔时间，避免后续的正常操作采用过大的间隔时间

如果您不想要退避算法，而是希望间隔固定的时间，例如您预定了机票，需要定时查询结果，那么您可以在您的服务中，返回ONGOING，当DTM收到这个返回值，会不走退避算法，而是按照设定的间隔时间进行重试

## 自定义header

有一部分的业务中的子事务，需要自定义header。dtm支持全局事务粒度的header定制，即您可以给不同的全局事务指定不同的自定义header，dtm调用您的子事务服务时，将会添加您指定的header

HTTP和gRPC都支持自定义header，详情可以参考[dtm-examples](https://github.com/dtm-labs/dtm-examples)名字中带有Header的例子
