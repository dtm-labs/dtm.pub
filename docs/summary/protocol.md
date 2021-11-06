# 接口协议

## 角色间通信协议

目前dtm只支持了http和grpc协议。由于分布式事务涉及多个角色协作，某些参与者可能出现暂时不可用，需要重试；某些参与者明确告知失败，需要进行回滚。

### HTTP

下面对各种情况进行分类说明，定义各类情况的返回值。接口类似微信/支付宝订单成功回调的接口:
- 如果接口返回的结果中，包含SUCCESS，则表示成功；
- 如果接口返回的结果中，包含FAILURE，则表示失败;
- 如果接口返回的结果中，包含ONGOING，则表示正常进行中，需要按照指定的时间间隔重试;
- 其他则表示出错，需要进行重试，重试时采用退避算法，避免雪崩。

上面的架构图中，主要有以下几类接口：

#### AP调用TM的接口，主要为全局事务注册、提交，子事务注册等：
  - 成功: { dtm_result: "SUCCESS" }
  - 失败: { dtm_result: "FAILURE" }，表示这个请求状态不对，例如已经走fail的全局事务不允许再注册分支
  - 其他表示状态不确定，可重试

#### TM调用RM的接口，主要为二阶段的提交、回滚，以及saga的各分支
  - 成功: { dtm_result: "SUCCESS" }
  - 失败: { dtm_result: "FAILURE" }，表示这个接口业务失败，全局事务需要进行回滚。例如saga中的正向操作如果返回FAILURE，则整个saga事务失败回滚
  - 进行中: { dtm_result: "ONGOING" }，表示这个接口正常进行中，后续按照固定间隔重试
  - 其他结果则重试，一直按照退避算法重试，直到返回上述的两个结果之一

#### AP调用RM的接口，跟业务相关，主要是被TCC、XA两种模式调用。
考虑到许多微服务的治理，都有失败重试的机制，因此建议接口设计（由于是AP和RM之间的接口，dtm不做强制要求）如下：
  - 成功: { dtm_result: "SUCCESS" }。返回的结果可以额外包含其他业务数据。
  - 失败: { dtm_result: "FAILURE" }，表示这个接口业务失败，全局事务需要进行回滚。例如tcc中的Try动作如果返回FAILURE，则整个tcc全局事务回滚
  - 其他返回值，应当允许重试，重试如果还是失败，需要允许全局事务回滚。主要是因为TCC、XA事务的下一步操作不保存在数据库，而是在AP里，它需要及时响应用户，无法长时间等待故障恢复。

::: tip 接口数据注意点
dtm框架通过resp.String()是否包含SUCCESS/FAILURE/ONGOING来判断成功和失败，因此请避免在子事务接口返回的业务数据里包含这两个词。
:::

### GRPC
由于GRPC为强类型协议，并且定义好了各个错误状态码，并且能够定义不同的错误码，采用不同的重试策略，因此GRPC的协议如下：

#### GRPC协议
- 成功: OK。对应上述http协议中的{ dtm_result: "SUCCESS" }
- 失败: Aborted && Message=="FAILURE"。对应上述http协议中的{ dtm_result: "FAILURE" }，表示失败;
- 进行中: Aborted && Message=="ONGOING"。对应上述http协议中的{ dtm_result: "FAILURE" }，则表示正常进行中，需要按照指定的时间间隔重试;
- 其他错误吗：状态未知，可重试，重试时采用退避算法，避免雪崩。

#### AP调用TM的接口，主要为全局事务注册、提交，子事务注册等：
- nil：成功
- Aborted：表示这个请求状态不对，例如已经走fail的全局事务不允许再注册分支
- 其他错误：表示状态未知，可重试

``` go
type DtmServer interface {
  ...
  Submit(context.Context, *DtmRequest) (*emptypb.Empty, error)
}
```

#### TM调用RM的接口，主要为二阶段的提交、回滚，以及saga的各分支
- nil：成功
- Aborted && Message=="FAILURE"：表示失败，需要回滚事务
- Aborted && Message=="ONGOING"：表示进行中，后续采用固定间隔重试
- 其他错误：表示出错，采用退避算法重试

``` go
type BusiRequest struct {
	Info     *BranchInfo
	Dtm      string
	BusiData []byte
}

type BusiReply struct {
	BusiData []byte
}

type BusiClient interface {
  ...
  TransIn(ctx context.Context, in *dtmgrpc.BusiRequest, opts ...grpc.CallOption) (*emptypb.BusiReply, error)
```

#### AP调用RM的接口，跟业务相关，主要是被TCC、XA两种模式调用。返回的结果
- 有返回值，返回值为固定的 dtmgrpc.BusiReply，应用程序需要用到数据，则需要自己Unmarshal里面的BusiData
``` go
type BusiClient interface {
  ...
  TransInTcc(ctx context.Context, in *dtmgrpc.BusiRequest, opts ...grpc.CallOption) (*dtmgrpc.BusiReply, error)
```

## 重试策略

失败重试是微服务治理中，很重要的一个环节，上述http和grpc协议，能够很好的与主流的失败重试策略兼容

当全局事务由于某些组件导致临时故障，那么全局事务会暂时中断，后续dtm会定时轮询未完成的全局事务，进行重试。一般多次重试则间隔每次加倍，避免雪崩。

许多事务模式中的操作是要求不允许失败/最终成功的，含义见[不允许失败](../practice/must-succeed)
