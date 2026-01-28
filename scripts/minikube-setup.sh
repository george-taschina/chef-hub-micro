#!/bin/bash

set -e

echo "=== ChefHub Minikube Setup ==="

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "Error: minikube is not installed. Please install it first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed. Please install it first."
    exit 1
fi

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "Error: helm is not installed. Please install it first."
    exit 1
fi

# Start minikube if not running
if ! minikube status | grep -q "Running"; then
    echo "Starting minikube..."
    minikube start --cpus=4 --memory=8192 --driver=docker
fi

# Enable required addons
echo "Enabling minikube addons..."
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# Install Istio
echo "Installing Istio..."
if ! command -v istioctl &> /dev/null; then
    echo "Error: istioctl is not installed. Please install it first."
    echo "Run: curl -L https://istio.io/downloadIstio | sh -"
    exit 1
fi

istioctl install --set profile=demo -y

# Wait for Istio to be ready
echo "Waiting for Istio to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/istiod -n istio-system

# Create namespaces
echo "Creating namespaces..."
kubectl apply -f kubernetes/base/namespace.yaml

# Apply network policies
echo "Applying network policies..."
kubectl apply -f kubernetes/base/network-policies.yaml

# Apply resource quotas
echo "Applying resource quotas..."
kubectl apply -f kubernetes/base/resource-quotas.yaml

# Install RabbitMQ via Helm
echo "Installing RabbitMQ..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm upgrade --install rabbitmq bitnami/rabbitmq \
    --namespace chefhub \
    --set auth.username=chefhub \
    --set auth.password=chefhub \
    --set replicaCount=1 \
    --set persistence.enabled=false \
    --set metrics.enabled=true \
    --wait

# Apply Istio configurations
echo "Applying Istio configurations..."
kubectl apply -f kubernetes/istio/peer-authentication.yaml
kubectl apply -f kubernetes/istio/gateway.yaml
kubectl apply -f kubernetes/istio/destination-rules/

# Deploy observability stack
echo "Deploying observability stack..."
kubectl apply -f kubernetes/observability/prometheus/
kubectl apply -f kubernetes/observability/grafana/

# Add hosts entry reminder
MINIKUBE_IP=$(minikube ip)
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Add the following to your /etc/hosts file:"
echo "$MINIKUBE_IP api.chefhub.local"
echo ""
echo "Access points:"
echo "  - Kubernetes Dashboard: minikube dashboard"
echo "  - Grafana: kubectl port-forward -n chefhub-observability svc/grafana 3001:3000"
echo "  - Prometheus: kubectl port-forward -n chefhub-observability svc/prometheus 9090:9090"
echo "  - RabbitMQ: kubectl port-forward -n chefhub svc/rabbitmq 15672:15672"
echo "  - Istio Gateway: minikube tunnel (in separate terminal)"
echo ""
echo "To deploy api-gateway:"
echo "  1. Build the image: eval \$(minikube docker-env) && docker build -t api-gateway:latest services/api-gateway"
echo "  2. Deploy: helm upgrade --install api-gateway kubernetes/charts/api-gateway -f kubernetes/charts/api-gateway/values-local.yaml -n chefhub"
