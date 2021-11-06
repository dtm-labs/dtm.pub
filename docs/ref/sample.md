# 接入示例

各语言的最简接入示例参考[SDK](../summary/code.md)

对于Go语言，在dtm项目的examples下，有很多的高级示例，您可以参考这些示例，解决您现实业务中的需求。

如果您是Go语言，注意一点，在您的线上业务中，最好不要引用dtm，而是引用 yedf/dtmcli(等同于yedf/dtm/dtmcli) 或者 yedf/dtmgrpc(等同于yedf/dtm/dtmgrpc) 这两个SDK repo，减少您的包体大小