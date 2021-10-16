# 嵌套子事务

dtm的Tcc事务模式，支持子事务嵌套，流程图如下：

![nested_trans](../imgs/nested_trans.jpg)

在这个流程图中，Order这个微服务，管理了订单相关的数据修改，同时还管理了一个嵌套的子事务，因此他即扮演了RM的角色，也扮演了AP的角色。

## 示例

示例参考[http_tcc.go](https://github.com/yedf/dtm/blob/main/examples/http_tcc.go)