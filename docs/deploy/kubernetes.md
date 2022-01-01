# Kubernetes部署

## dtm副本数

dtm本身类似于一个普通的无状态应用，数据都存储在数据库中。因此dtm可以像普通应用一样，部署多个副本。建议的副本数量为2~3，这样就具备了高可用的特性。随着负载升高，可以增加dtm的副本数，增加dtm的处理能力

## K8S部署

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
          image: yedf/dtm:1.8
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
