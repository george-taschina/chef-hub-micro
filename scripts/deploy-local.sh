#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== ChefHub Local Deployment ==="
echo "Using Kustomize for declarative deployments"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing=()

    command -v kubectl &> /dev/null || missing+=("kubectl")
    command -v helm &> /dev/null || missing+=("helm")
    command -v minikube &> /dev/null || missing+=("minikube")

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        exit 1
    fi

    # Check if minikube is running
    if ! minikube status | grep -q "Running"; then
        log_error "Minikube is not running. Start it with: minikube start --cpus=4 --memory=8192"
        exit 1
    fi

    log_info "All prerequisites met"
}

# Install RabbitMQ Cluster Operator
install_rabbitmq_operator() {
    log_info "Installing RabbitMQ Cluster Operator..."

    if kubectl get namespace rabbitmq-system &> /dev/null; then
        log_warn "RabbitMQ Operator already installed, skipping..."
        return
    fi

    kubectl apply -f "https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml"

    log_info "Waiting for RabbitMQ Operator to be ready..."
    kubectl wait --for=condition=available deployment/rabbitmq-cluster-operator \
        -n rabbitmq-system --timeout=120s

    log_info "RabbitMQ Operator installed successfully"
}

# Deploy base infrastructure with Kustomize
deploy_base() {
    log_info "Deploying base infrastructure with Kustomize..."

    kubectl apply -k "$ROOT_DIR/kubernetes/overlays/local"

    log_info "Waiting for RabbitMQ cluster to be ready..."
    kubectl wait --for=condition=Ready rabbitmqcluster/rabbitmq \
        -n chefhub --timeout=180s || true

    log_info "Base infrastructure deployed"
}

# Deploy observability stack
deploy_observability() {
    log_info "Deploying observability stack..."

    kubectl apply -k "$ROOT_DIR/kubernetes/observability"

    log_info "Waiting for Prometheus to be ready..."
    kubectl wait --for=condition=available deployment/prometheus \
        -n chefhub-observability --timeout=120s || true

    log_info "Waiting for Grafana to be ready..."
    kubectl wait --for=condition=available deployment/grafana \
        -n chefhub-observability --timeout=120s || true

    log_info "Observability stack deployed"
}

# Install ArgoCD
install_argocd() {
    log_info "Installing ArgoCD..."

    if kubectl get namespace argocd &> /dev/null; then
        log_warn "ArgoCD namespace exists, checking if installed..."
        if kubectl get deployment argocd-server -n argocd &> /dev/null; then
            log_warn "ArgoCD already installed, skipping..."
            return
        fi
    fi

    # Create namespace
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

    # Install ArgoCD
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

    log_info "Waiting for ArgoCD to be ready..."
    kubectl wait --for=condition=available deployment/argocd-server \
        -n argocd --timeout=300s

    log_info "ArgoCD installed successfully"

    # Apply ArgoCD project and applications
    log_info "Applying ArgoCD configurations..."
    kubectl apply -f "$ROOT_DIR/kubernetes/argocd/project.yaml"

    # Get initial admin password
    log_info "ArgoCD admin password:"
    kubectl -n argocd get secret argocd-initial-admin-secret \
        -o jsonpath="{.data.password}" | base64 -d
    echo ""
}

# Build and deploy api-gateway
deploy_api_gateway() {
    log_info "Building api-gateway Docker image..."

    eval $(minikube docker-env)
    docker build -t api-gateway:latest "$ROOT_DIR/services/api-gateway"

    log_info "Deploying api-gateway with Helm..."
    helm dependency build "$ROOT_DIR/kubernetes/charts/api-gateway" 2>/dev/null || true

    helm upgrade --install api-gateway "$ROOT_DIR/kubernetes/charts/api-gateway" \
        -f "$ROOT_DIR/kubernetes/charts/api-gateway/values-local.yaml" \
        -n chefhub --wait --timeout 2m

    log_info "api-gateway deployed successfully"
}

# Print status and access information
print_status() {
    echo ""
    echo "=== Deployment Complete ==="
    echo ""

    log_info "Cluster Status:"
    kubectl get pods -n chefhub
    echo ""
    kubectl get pods -n chefhub-observability
    echo ""
    kubectl get pods -n argocd | head -5
    echo ""

    echo "=== Access Points ==="
    echo ""
    echo "API Gateway:"
    echo "  kubectl port-forward svc/api-gateway 3000:3000 -n chefhub"
    echo ""
    echo "RabbitMQ Management:"
    echo "  kubectl port-forward svc/rabbitmq 15672:15672 -n chefhub"
    echo "  URL: http://localhost:15672 (chefhub/chefhub)"
    echo ""
    echo "Prometheus:"
    echo "  kubectl port-forward svc/prometheus 9090:9090 -n chefhub-observability"
    echo "  URL: http://localhost:9090"
    echo ""
    echo "Grafana:"
    echo "  kubectl port-forward svc/grafana 3001:3000 -n chefhub-observability"
    echo "  URL: http://localhost:3001 (admin/admin)"
    echo ""
    echo "ArgoCD:"
    echo "  kubectl port-forward svc/argocd-server 8080:443 -n argocd"
    echo "  URL: https://localhost:8080 (admin/<password above>)"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    install_rabbitmq_operator
    deploy_base
    deploy_observability
    install_argocd
    deploy_api_gateway
    print_status
}

# Parse arguments
case "${1:-all}" in
    all)
        main
        ;;
    base)
        check_prerequisites
        install_rabbitmq_operator
        deploy_base
        ;;
    observability)
        check_prerequisites
        deploy_observability
        ;;
    argocd)
        check_prerequisites
        install_argocd
        ;;
    api-gateway)
        check_prerequisites
        deploy_api_gateway
        ;;
    status)
        print_status
        ;;
    *)
        echo "Usage: $0 {all|base|observability|argocd|api-gateway|status}"
        exit 1
        ;;
esac
