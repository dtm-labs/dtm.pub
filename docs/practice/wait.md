# 等待事务结果

上面介绍了各种模式，每种模式将事务提交之后，立即返回，不等待事务结束。但某些实际应用的场景，用户需要知道整个事务的结果，dtm对此进行了支持。

可以参考示例[saga wait](https://github.com/yedf/dtm/blob/main/examples/main_saga_wait.go)

所有的全局事务对象，Saga/Xa/Tcc/Msg，都可以设置WaitResult。

该标记为true的情况下，Submit提交给dtm后，dtm会同步对事务进行一轮处理，如果一切正常，返回SUCCESS，如果全局事务的某个分支，出现问题，返回错误，后续会超时重试相关的分支。

客户端检查Submit返回的错误，如果为nil，则表示整个全局事务已经正常完成。如果不是nil，不意味全局事务已回滚，可能的情况有很多，客户端最好通过dtm的query接口查询全局事务的状态。