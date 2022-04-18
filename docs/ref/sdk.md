# SDK

## 支持的语言

#### go

这里的dtmcli和dtmgrpc都是dtm项目里面内容的复制。采用这里的包，而不是dtm，会让你的应用程序依赖更少，包体更小

http sdk: [https://github.com/dtm-labs/dtmcli](https://github.com/dtm-labs/dtmcli)

最简示例: [https://github.com/dtm-labs/dtmcli-go-sample](https://github.com/dtm-labs/dtmcli-go-sample)

grpc sdk: [https://github.com/dtm-labs/dtmgrpc](https://github.com/dtm-labs/dtmgrpc)

最简示例: [https://github.com/dtm-labs/dtmgrpc-go-sample](https://github.com/dtm-labs/dtmgrpc-go-sample)

关于SDK使用的最全的示例，包括了grpc/http/xa/msg/saga/tcc/barrier 等等，都合并在下面这个项目

[https://github.com/dtm-labs/dtm-examples](https://github.com/dtm-labs/dtm-examples)

[相关博客](../resource/blogs-go)

#### php
客户端sdk 协程版（支持Hyperf、SAGA、TCC、MSG、子事务屏障）[https://github.com/dtm-php/dtm-client](https://github.com/dtm-php/dtm-client)

示例：[https://github.com/dtm-php/dtm-sample](https://github.com/dtm-php/dtm-sample)

上述SDK由PHP界大佬[黄朝晖](https://github.com/huangzhhui)亲自操刀，并获得Swool创始人推荐，代码质量高，社区活跃

普通版客户端sdk（当前只支持TCC）: [https://github.com/dtm-labs/dtmcli-php](https://github.com/dtm-labs/dtmcli-php)

示例: [https://github.com/dtm-labs/dtmcli-php-sample](https://github.com/dtm-labs/dtmcli-php-sample)

感谢 [onlyshow](https://github.com/onlyshow) 的帮助，php的sdk和示例，主要由他完成

[相关博客](../resource/blogs-php)

#### dotnet

客户端sdk http版本（支持TCC、SAGA、MSG、子事务屏障）: [https://github.com/dtm-labs/dtmcli-csharp](https://github.com/dtm-labs/dtmcli-csharp)

示例: [https://github.com/dtm-labs/dtmcli-csharp-sample](https://github.com/dtm-labs/dtmcli-csharp-sample)

感谢 [catcherwong](https://github.com/catcherwong)、[geffzhang](https://github.com/geffzhang)的帮助，C的sdk和示例，主要由他们贡献

客户端sdk grpc版本：[https://github.com/catcherwong/dtmgrpc-csharp](https://github.com/catcherwong/dtmgrpc-csharp)

[相关博客](../resource/blogs-donet)

#### python

客户端sdk（当前支持TCC、SAGA、子事务屏障）: [https://github.com/dtm-labs/dtmcli-py](https://github.com/dtm-labs/dtmcli-py)

示例: [https://github.com/dtm-labs/dtmcli-py-sample](https://github.com/dtm-labs/dtmcli-py-sample)

[相关博客](../resource/blogs-py)


#### Java

客户端sdk（TCC、子事务屏障）: [https://github.com/dtm-labs/dtmcli-java](https://github.com/dtm-labs/dtmcli-java)

示例: [https://github.com/dtm-labs/dtmcli-java-sample](https://github.com/dtm-labs/dtmcli-java-sample)

感谢 [li-xiao-shuang](https://github.com/li-xiao-shuang)，[viticis](https://github.com/viticis) 的帮助，Java的sdk和示例，主要由他们贡献

[相关博客](../resource/blogs-java)

#### node

客户端sdk（当前只支持TCC）: [https://github.com/dtm-labs/dtmcli-node](https://github.com/dtm-labs/dtmcli-node)

示例: [https://github.com/dtm-labs/dtmcli-node-sample](https://github.com/dtm-labs/dtmcli-node-sample)

[相关博客](../resource/blogs-node)

#### 其他

如果这里没有找到您熟悉的语言，同时您又想运行dtm，看看一个分布式事务什么样，您可以参考这里：

[DTM安装运行](../guide/install)

如果你是通过brew 安装，那么您可以直接运行

```
dtm-qs
```

上述dtm-qs命令，会运行一个简单的quick start例子，这是一个saga事务，您可以对照saga的时序图与日志，更深入的了解dtm

## 支持的数据库
dtm的SDK中，提供了子事务屏障功能，也提供了XA相关的支持，这部分的支持是与具体的数据库相关的。目前已支持了常见的几种数据库事务，包括Mysql系列、Postgres，Redis、Mongo。未来将考虑接入更多的数据库事务
#### Mysql 系列

包括Mysql，MariaDB，TiDB，TDSQL

#### Postgres

已完整支持Postgres，如果您使用Postgres，需要在使用SDK前，进行如下调用

``` go
dtmcli.SetCurrentDBType("postgres")
```

详细例子，可以参考dtm/app/main.go中的代码

#### Redis
DTM 已支持 Redis 事务，这样用户可以在一个分布式事务里，组合使用 Redis 及 Mysql ，可以将扣库存放在 Redis 中，提供准确扣库存的架构，让订单系统可以轻松应对秒杀场景

#### Mongo
DTM已支持Mongo

## ORM 对接 {#orm}

#### 概述

dtm中的子事务屏障，需要与数据库交互，xa事务模式，也需要与数据库交互。目前dtm定义的交互接口，采用了与标准库sql兼容的方式，使用中，直接传递sql.DB/sql.Tx即可。

因为barrier需要在事务内部操作barrier相关的表，所以它的接口需要传入一个 *sql.Tx或 *sql.DB

``` go
func (bb *BranchBarrier) Call(tx *sql.Tx, busiCall BusiFunc) error
func (bb *BranchBarrier) CallWithDB(db *sql.DB, busiCall BusiFunc) error

```

Xa事务模式中，本地数据库连接是由dtmcli创建和管理的，因此调用回调函数的参数类型是 *sql.DB 。如果您使用其他的库，例如gorm等，那么您根据 *sql.DB 构建相关的orm对象即可。

``` go
type XaLocalFunc func(db *sql.DB, xa *Xa) (interface{}, error)
```

目前 dtm 的示例，只给出了gorm的，其他orm，暂时在此说明文档中说明用法

#### GORM

示例在 [dtm-examples](https://github.com/dtm-labs/dtm-examples)

barrier示例：
``` go
  barrier := MustBarrierFromGin(c)
  // gdb is a *gorm.DB
  tx := gdb.Begin()
	return dtmcli.ResultSuccess, barrier.Call(tx.Statement.ConnPool.(*sql.Tx), func(tx1 *sql.Tx) error {
		return tx.Exec("update dtm_busi.user_account set balance = balance + ? where user_id = ?", -req.Amount, 2).Error
	})
```

xa示例：

``` go
  return dtmcli.XaLocalTransaction(c.Request.URL.Query(), BusiConf, func(db *sql.DB, xa *dtmcli.Xa) error {
    // gorm提供接口，可以从标准的sql.DB对象，构造gorm.DB
    gdb, err := gorm.Open(mysql.New(mysql.Config{
      Conn: db,
    }), &gorm.Config{})
    if err != nil {
      return nil, err
    }
    dbr := gdb.Exec("update dtm_busi.user_account set balance=balance-? where user_id=?", reqFrom(c).Amount, 1)
    return dbr.Error
	})
```

#### GOQU

barrier示例：
``` go
	dialect := goqu.Dialect("mysql")
	sdb, err := dbGet().DB.DB()
	if err != nil {
		return nil, err
  }
  gdb := dialect.DB(sdb)
  // gdb is a goqu dialect.DB, the following code shows how to obtain tx
	tx, err := gdb.Begin()
	return dtmcli.ResultSuccess, barrier.Call(tx, func(tx1 *sql.Tx) error {
		_, err := tx.Exec("update dtm_busi.user_account set balance = balance + ? where user_id = ?", -req.Amount, 2)
		return err
	})
```

xa示例

``` go
  return dtmcli.XaLocalTransaction(c.Request.URL.Query(), BusiConf, func(db *sql.DB, xa *dtmcli.Xa) error {
    dialect := goqu.Dialect("mysql")
    godb := dialect.DB(db)
    _, err := godb.Exec("update dtm_busi.user_account set balance=balance-? where user_id=?", reqFrom(c).Amount, 1)
    return err
  })
```

#### XORM

请注意，2021-08-21刚给xorm提了pr，暴露了sql.Tx，虽然已合并，但是还未发布版本，因此需要安装最新版本

``` bash
go get -u xorm.io/xorm@7cd6a74c9f
```

barrier示例：

``` go
	x, _ := xorm.NewEngineWithDB("mysql", "dtm", core.FromDB(sdbGet()))
	se := x.NewSession()
	defer se.Close()
	err := se.Begin()
	if err != nil {
		return nil, err
	}
  // se is a xorm session, the following code shows how to obtain tx
	return dtmcli.ResultSuccess, barrier.Call(se.Tx().Tx, func(tx1 *sql.Tx) error {
		_, err := se.Exec("update dtm_busi.user_account set balance = balance + ? where user_id = ?", -req.Amount, 2)
		return err
	})
```

xa示例

``` go
  return dtmcli.XaLocalTransaction(c.Request.URL.Query(), BusiConf, func(db *sql.DB, xa *dtmcli.Xa) error {
    xdb, _ := xorm.NewEngineWithDB("mysql", "dtm", core.FromDB(db))
    _, err := xdb.Exec("update dtm_busi.user_account set balance=balance-? where user_id=?", reqFrom(c).Amount, 1)
    return err
  })

```

#### Go-zero

需要go-zero >= v1.2.0

barrier示例：

``` go
  // 假设conn为go-zero里面的 sqlx.SqlConn
  db, err := conn.RawDB()
  if err != nil {
    return err
  }
	return dtmcli.ResultSuccess, barrier.CallWithDB(db, func(tx *sql.Tx) error {
		_, err := tx.Exec("update dtm_busi.user_account set balance = balance + ? where user_id = ?", -req.Amount, 2)
		return err
	})
```

xa示例

``` go
  return dtmcli.XaLocalTransaction(c.Request.URL.Query(), BusiConf, func(db *sql.DB, xa *dtmcli.Xa) error {
    conn := NewSqlConnFromDB(db)
    _, err := conn.Exec("update dtm_busi.user_account set balance=balance-? where user_id=?", reqFrom(c).Amount, 1)
    return err
  })

```

#### ent
可以支持，代码示例待补充