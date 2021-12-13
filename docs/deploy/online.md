# 线上部署

## dtm副本数

dtm本身类似于一个普通的无状态应用，数据都存储在数据库中。因此dtm可以像普通应用一样，部署多个副本。建议的副本数量为2~3，这样就具备了高可用的特性。随着负载升高，可以增加dtm的副本数，增加dtm的处理能力

## K8S部署

当前dtm支持http协议，可以把前面docker部署的方式，增加K8S的deployment配置，完成K8S部署，下面给出一个deployment.yml的一个参考

``` yml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: dtm
  name: dtm
  namespace: default
spec:
  progressDeadlineSeconds: 600
  replicas: 4
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: dtm
  minReadySeconds: 3
  strategy:
    rollingUpdate:
      maxSurge: 10%
      maxUnavailable: 0
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: dtm
    spec:
      containers:
        - env:
            - name: DB_HOST
              value: your-host
            - name: DB_PORT
              value: 3306
            - name: DB_USER
              value: root
            - name: DB_PASSWORD
              value: ''
            - name: TRANS_CRON_INTERVAL
              value: 10
            - name: IS_DOCKER
              value: '1'
          image: yedf/dtm:latest
          imagePullPolicy: Always
          livenessProbe:
            failureThreshold: 30
            httpGet:
              path: /api/ping
              port: 36789
              scheme: HTTP
            initialDelaySeconds: 150
            periodSeconds: 2
            successThreshold: 1
            timeoutSeconds: 3
          readinessProbe:
            failureThreshold: 5
            httpGet:
              path: /api/ping
              port: 36789
              scheme: HTTP
            initialDelaySeconds: 150
            periodSeconds: 3
            successThreshold: 1
            timeoutSeconds: 2
          name: dtm
          ports:
            - containerPort: 36789
          resources:
            requests:
              cpu: 200m
              memory: 200Mi
          stdin: true
          tty: true
---
apiVersion: v1
kind: Service
metadata:
  name: dtm-svc
  namespace: default
spec:
  ports:
    - port: 80
      targetPort: 36789
      name: dtm-svc-port
  selector:
    app: dtm
  type: ClusterIP
---

apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: dtm-ingress
  namespace: default
spec:
  rules:
    - host: 'your-domain'
      http:
        paths:
          - backend:
              serviceName: dtm-svc
              servicePort: 80
            path: /api/dtmsvr/
```
