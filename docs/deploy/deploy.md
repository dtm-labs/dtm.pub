# 部署

## 可执行文件部署

dtm 目前已支持brew直接安装，暂未支持apt/yum等方式直接安装，您可以从github上面下载相应版本，或者通过go环境，编译出相关的二进制文件。

#### 编译

您需要有go 1.16以上的环境，通过下面命令编译出二进制文件
```
go build
```

#### 配置

您可以设置相关的环境变量(参见[部署基础](./base))，也可以在工作目录下，参考[配置样板文件](https://github.com/dtm-labs/dtm/blob/main/conf.sample.yml)创建conf.yml文件

#### 启动

dtm会监听
- HTTP: 36789
- gRPC: 36790

```
./dtm -c ./conf.yml
```

## Docker部署

#### Docker启动

``` bash
docker run --name dtm -p 36789:36789 -p 36790:36790 -e STORE_DRIVER='mysql' -e STORE_HOST='localhost' -e STORE_USER='root' -e STORE_PASSWORD='' -e STORE_PORT='3306' yedf/dtm:latest
```

各个参数，详见[部署基础](./base)

#### docker-compose启动
示例 docker-compose.yaml 文件:
``` yml
version: '3'
services:
  dtm:
    image: yedf/dtm
    environment:
      STORE_DRIVER: mysql
      STORE_HOST: localhost
      STORE_USER: root
      STORE_PASSWORD: ''
      STORE_PORT: 3306
    ports:
      - '36789:36789'
      - '36790:36790'
```

#### 容器其他命令

交互式使用dtm容器

``` docker exec -it dtm sh ```

查看日志

```docker logs -f dtm ```

## Kubernetes部署

当前dtm支持http协议，可以把前面docker部署的方式，增加K8S的deployment配置，完成K8S部署，下面给出一个deployment.yml的一个参考

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dtm
  labels:
    app: dtm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dtm
  template:
    metadata:
      labels:
        app: dtm
    spec:
      containers:
        - name: dtm
          image: yedf/dtm:latest
          imagePullPolicy: IfNotPresent
          args:
            - "-c=/app/dtm/configs/config.yaml"
          volumeMounts:
            - mountPath: /app/dtm/configs
              name: config
          ports:
            - containerPort: 36789
              protocol: TCP
              name: http
            - containerPort: 36790
              protocol: TCP
              name: grpc
          livenessProbe:
            httpGet:
              path: /api/ping
              port: 36789
              scheme: HTTP
          readinessProbe:
            httpGet:
              path: /api/ping
              port: 36789
              scheme: HTTP
          resources:
            requests:
              cpu: 200m
              memory: 200Mi
      volumes:
        - name: config
          configMap:
            name: dtm-conf
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: dtm-conf
  labels:
    app: dtm
data:
  config.yaml: |-
    Store:
      Driver: mysql # 此处以 mysql 为例，其他数据库可自行替换
      Host: dtm-db  # 此处设置为集群外部的数据库 host，或者集群内部的数据库 svc-dns
      Port: 3306
      User: root
      Password: ''
---
apiVersion: v1
kind: Service
metadata:
  name: dtm-svc
  labels:
    app: dtm
spec:
  ports:
    - port: 36790
      targetPort: 36790
      name: grpc
      appProtocol: grpc # Kubernetes v1.20 [stable]，低版本请剔除此行
    - port: 36789
      targetPort: 36789
      name: http
      appProtocol: http # Kubernetes v1.20 [stable]，低版本请剔除此行
  selector:
    app: dtm
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dtm-ing
spec:
  rules:
    - host: "your-domain.com"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: dtm-svc
                port:
                  number: 36789 # 此处为 http server，grpc server 的设置，请访问 https://kubernetes.github.io/ingress-nginx/examples/grpc/
  ingressClassName: nginx # 使用了其他的 ingressClassName， 请自行查询
```
