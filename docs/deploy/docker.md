# Docker部署

## Docker命令

``` bash
docker run --name dtm -p 36789:36789 -p 36790:36790 -e DB_HOST='localhost' DB_USER='root' DB_PASSWORD='' dtm-labs/dtm:latest
```

各个参数，详见前一节中的环境变量

## docker-compose启动
docker-compose.yaml:
``` yml
version: '3'
services:
  dtm:
    image: dtm-labs/dtm
    environment:
      - DB_HOST: localhost
      - DB_USER: root
      - DB_PASSWORD: ''
      - DB_PORT: 3306
      - TRANS_CRON_INTERVAL: 10
    ports:
      - '36789:36789'
      - '36790:36790'
```

## 容器其他命令

交互式使用dtm容器

``` docker exec -it dtm sh ```

查看日志

```docker logs -f dtm ```
