# Docker部署

## Docker命令

``` bash
docker run --name dtm -p 8080:8080 -e DSN='' yedf/dtm:latest
```

这里的DSN为mysql的连接信息

## docker-compose启动
docker-compose.yaml:
``` yml
version: '3'
services:
  dtm:
    image: yedf/dtm
    environment:
      - DSN=''
    ports:
      - '8080:8080'
```

## 支持的环境变量

### DB_DRIVER

指定数据库类型

取值为: mysql 或 postgres

### DB_DSN

指定数据库的用户名密码，跟go语言的数据库驱动相关，mysql和postgres的格式是不同的

- 当DB_DRIVER=="mysql": 格式类似：
- 当DB_DRIVER=="postgres": 格式类似：

### CRON_JOB_INTERVAL

轮询检查超时需处理的时间间隔，默认为10，表示大约10秒，会检查一次数据库中超时的全局事务
