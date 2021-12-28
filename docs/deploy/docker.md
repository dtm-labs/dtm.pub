# Docker部署

## Docker命令

``` bash
docker run --name dtm -p 36789:36789 -p 36790:36790 -e STORE_DRIVER='mysql' -e STORE_HOST='localhost' -e STORE_USER='root' -e STORE_PASSWORD='' -e STORE_PORT='3306' yedf/dtm:latest
```

各个参数，详见前一节中的环境变量

## docker-compose启动
docker-compose.yaml:
``` yml
version: '3'
services:
  dtm:
    image: yedf/dtm
    environment:
      - STORE_DRIVER: mysql
      - STORE_HOST: localhost
      - STORE_USER: root
      - STORE_PASSWORD: ''
      - STORE_PORT: 3306
    ports:
      - '36789:36789'
      - '36790:36790'
```

## 容器其他命令

交互式使用dtm容器

``` docker exec -it dtm sh ```

查看日志

```docker logs -f dtm ```
