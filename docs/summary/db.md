# 数据库接口

## 概述

dtm中的子事务屏障，需要与数据库交互，xa事务模式，也需要与数据库交互。目前dtm定义的交互接口，采用了与标准库sql兼容的方式，使用中，直接传递sql.DB/sql.Tx即可。

实际使用的项目，大多会用更加高级的orm库，例如gorm以及ent等，此时需要进行接口适配。

为了保持dtm的依赖尽量小，dtm的示例，只给出了gorm的，其他orm，会在说明文档中说明用法

## GORM

示例在 examples/http_saga_gorm_barrier|http_gorm_xa

barrier示例：
``` go
  barrier := MustBarrierFromGin(c)
  // 手动开启事务
  tx := dbGet().DB.Begin()
	return dtmcli.ResultSuccess, barrier.Call(tx.Statement.ConnPool.(*sql.Tx), func(db dtmcli.DB) error {
		return tx.Exec("update dtm_busi.user_account set balance = balance + ? where user_id = ?", -req.Amount, 2).Error
	})
```

xa示例：

``` go
  return XaClient.XaLocalTransaction(c.Request.URL.Query(), func(db *sql.DB, xa *dtmcli.Xa) (interface{}, error) {
    // gorm提供接口，可以从标准的sql.DB对象，构造gorm.DB
    gdb, err := gorm.Open(mysql.New(mysql.Config{
      Conn: db,
    }), &gorm.Config{})
    if err != nil {
      return nil, err
    }
    dbr := gdb.Exec("update dtm_busi.user_account set balance=balance-? where user_id=?", reqFrom(c).Amount, 1)
    return dtmcli.ResultSuccess, dbr.Error
  })
```

## GOQU

barrier示例：
``` go
	dialect := goqu.Dialect("mysql")
	sdb, err := dbGet().DB.DB()
	if err != nil {
		return nil, err
	}
	tx, err := dialect.DB(sdb).Begin()
	return dtmcli.ResultSuccess, barrier.Call(tx, func(db dtmcli.DB) error {
		_, err := tx.Exec("update dtm_busi.user_account set balance = balance + ? where user_id = ?", -req.Amount, 2)
		return err
	})
```

xa示例

``` go
  return XaClient.XaLocalTransaction(c.Request.URL.Query(), func(db *sql.DB, xa *dtmcli.Xa) (interface{}, error) {
    dialect := goqu.Dialect("mysql")
    godb := dialect.DB(db)
    _, err := godb.Exec("update dtm_busi.user_account set balance=balance-? where user_id=?", reqFrom(c).Amount, 1)
    return dtmcli.ResultSuccess, err
  })
```

## XORM

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
	return dtmcli.ResultSuccess, barrier.Call(se.Tx().Tx, func(db dtmcli.DB) error {
		_, err := se.Exec("update dtm_busi.user_account set balance = balance + ? where user_id = ?", -req.Amount, 2)
		return err
	})
```

xa示例

``` go
  return XaClient.XaLocalTransaction(c.Request.URL.Query(), func(db *sql.DB, xa *dtmcli.Xa) (interface{}, error) {
    xdb, _ := xorm.NewEngineWithDB("mysql", "dtm", core.FromDB(db))
    _, err := xdb.Exec("update dtm_busi.user_account set balance=balance-? where user_id=?", reqFrom(c).Amount, 1)
    return dtmcli.ResultSuccess, err
  })

```