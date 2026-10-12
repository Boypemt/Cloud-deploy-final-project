# Kubernetes manifests (Docker Desktop → Settings → Kubernetes → Enable)

```bash
# 1) namespace + config
kubectl apply -f deploy/k8s/00-namespace.yaml -f deploy/k8s/01-config.yaml
# 2) secrets: copy secret.example.yaml -> secret.yaml, edit, apply
kubectl apply -f deploy/k8s/secret.yaml
# 3) (demo only) in-cluster MongoDB — skip if you use MongoDB Atlas
kubectl apply -f deploy/k8s/02-mongo-dev.yaml
# 4) the 4 services (edit <dockerhub-user> and the version tag first)
kubectl apply -f deploy/k8s/10-auth-service.yaml -f deploy/k8s/11-product-service.yaml \
              -f deploy/k8s/12-order-service.yaml -f deploy/k8s/13-web-frontend.yaml

kubectl get pods -n campusmart          # all should become Running / READY 1/1
kubectl get svc  -n campusmart          # web-frontend EXTERNAL-IP = localhost on Docker Desktop
# open http://localhost:8080
```

Useful for the demo (matches the K8s lecture):

| Show | Command |
|---|---|
| Scaling | `kubectl scale deployment product-service -n campusmart --replicas=4` |
| Self-healing | `kubectl delete pod -n campusmart -l app=auth-service` → new pods appear |
| Rolling update | `kubectl set image deployment/auth-service auth-service=docker.io/<user>/campusmart-auth-service:1.1.0 -n campusmart` |
| Rollback | `kubectl rollout undo deployment/auth-service -n campusmart` |
| Logs | `kubectl logs -n campusmart -l app=order-service --tail=50` |
