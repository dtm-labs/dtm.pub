# 支持的数据库

DTM支持的数据库包括：

## Mysql 系列

Mysql，MariaDB，TiDB

对这一系列的数据库，配置与Mysql完全相同，参考dtm项目中的 [conf.yml.sample](https://github.com/yedf/dtm/blob/main/conf.sample.yml)

## Postgres

配置参考 [conf.yml.sample](https://github.com/yedf/dtm/blob/main/conf.sample.yml)。

您还需要设置DBType为postgres，参考dtm/app/main.go中的代码

``` go
dtmcli.SetCurrentDBType("postgres")
```
