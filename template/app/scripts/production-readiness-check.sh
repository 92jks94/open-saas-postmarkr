#!/bin/bash
# Production Readiness Check Script
# This script validates that all production requirements are met before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# API URLs (can be overridden)
API_URL="${API_URL:-https://postmarkr-server.fly.dev}"
CLIENT_URL="${CLIENT_URL:-https://postmarkr-client.fly.dev}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Production Readiness Check for Postmarkr${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Function to print failure
print_failure() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check required tools
echo -e "\n${BLUE}Checking Required Tools...${NC}"
if command_exists curl; then
    print_success "curl is installed"
else
    print_failure "curl is not installed"
fi

if command_exists jq; then
    print_success "jq is installed"
else
    print_warning "jq is not installed (optional but recommended)"
fi

if command_exists flyctl; then
    print_success "flyctl is installed"
else
    print_warning "flyctl is not installed (required for Fly.io deployment)"
fi

# Check environment variables
echo -e "\n${BLUE}Checking Environment Variables...${NC}"

check_env_var() {
    local var_name=$1
    local required=${2:-true}
    local show_value=${3:-false}
    
    if [ -z "${!var_name}" ]; then
        if [ "$required" = true ]; then
            print_failure "$var_name is not set"
        else
            print_warning "$var_name is not set (optional)"
        fi
    else
        if [ "$show_value" = true ]; then
            print_success "$var_name is set: ${!var_name}"
        else
            # Show only first few characters for security
            local masked="${!var_name:0:4}..."
            print_success "$var_name is set ($masked)"
        fi
    fi
}

# Load .env.server if it exists
if [ -f ".env.server" ]; then
    print_info "Loading environment from .env.server"
    export $(cat .env.server | grep -v '^#' | xargs)
fi

# Required variables
check_env_var "DATABASE_URL"
check_env_var "JWT_SECRET"
check_env_var "WASP_SERVER_URL" true true
check_env_var "WASP_WEB_CLIENT_URL" true true
check_env_var "NODE_ENV" true true

# Email
check_env_var "SENDGRID_API_KEY"
check_env_var "SENDGRID_FROM_EMAIL" true true
check_env_var "SENDGRID_FROM_NAME" true true

# Stripe
check_env_var "STRIPE_SECRET_KEY"
check_env_var "STRIPE_PUBLISHABLE_KEY"
check_env_var "STRIPE_WEBHOOK_SECRET"
check_env_var "STRIPE_CUSTOMER_PORTAL_URL" true true
check_env_var "PAYMENTS_SMALL_BATCH_PLAN_ID"
check_env_var "PAYMENTS_MEDIUM_BATCH_PLAN_ID"
check_env_var "PAYMENTS_LARGE_BATCH_PLAN_ID"

# Lob
check_env_var "LOB_PROD_KEY"
check_env_var "LOB_ENVIRONMENT" true true
check_env_var "LOB_WEBHOOK_SECRET"

# AWS S3
check_env_var "AWS_S3_REGION" true true
check_env_var "AWS_S3_IAM_ACCESS_KEY"
check_env_var "AWS_S3_IAM_SECRET_KEY"
check_env_var "AWS_S3_FILES_BUCKET" true true

# Monitoring
check_env_var "SENTRY_DSN"
check_env_var "SENTRY_RELEASE" true true
check_env_var "SENTRY_SERVER_NAME" true true

# Optional
check_env_var "OPENAI_API_KEY" false
check_env_var "GOOGLE_ANALYTICS_ID" false
check_env_var "MONITORING_SLACK_WEBHOOK" false

# Validate API key formats
echo -e "\n${BLUE}Validating API Key Formats...${NC}"

if [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
    print_success "Stripe secret key is in live mode"
elif [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
    print_warning "Stripe secret key is in test mode (should be live for production)"
else
    print_failure "Stripe secret key format is invalid"
fi

if [[ "$LOB_PROD_KEY" == live_* ]]; then
    print_success "Lob API key is in live mode"
elif [[ "$LOB_PROD_KEY" == test_* ]]; then
    print_warning "Lob API key is in test mode (should be live for production)"
else
    print_failure "Lob API key format is invalid"
fi

if [[ "$SENDGRID_API_KEY" == SG.* ]]; then
    print_success "SendGrid API key format is valid"
else
    print_failure "SendGrid API key format is invalid"
fi

# Check Fly.io configuration
echo -e "\n${BLUE}Checking Fly.io Configuration...${NC}"

if [ -f "fly-server.toml" ]; then
    print_success "fly-server.toml exists"
    
    # Check for health check configuration
    if grep -q "http_service.checks" fly-server.toml; then
        print_success "Server health check is configured in fly-server.toml"
    else
        print_warning "Server health check not found in fly-server.toml"
    fi
else
    print_failure "fly-server.toml not found"
fi

if [ -f "fly-client.toml" ]; then
    print_success "fly-client.toml exists"
else
    print_failure "fly-client.toml not found"
fi

# Test API endpoints if deployed
echo -e "\n${BLUE}Testing Health Check Endpoints...${NC}"

if [ -n "$API_URL" ]; then
    print_info "Testing API at: $API_URL"
    
    # Test simple health check
    if curl -sf "$API_URL/health/simple" > /dev/null 2>&1; then
        print_success "Simple health check endpoint is accessible"
        
        # Check response
        HEALTH_STATUS=$(curl -sf "$API_URL/health/simple" | jq -r '.status' 2>/dev/null || echo "unknown")
        if [ "$HEALTH_STATUS" = "ok" ]; then
            print_success "Health check status is OK"
        else
            print_failure "Health check status is $HEALTH_STATUS"
        fi
    else
        print_warning "Simple health check endpoint is not accessible (may not be deployed yet)"
    fi
    
    # Test comprehensive health check
    if curl -sf "$API_URL/health" > /dev/null 2>&1; then
        print_success "Comprehensive health check endpoint is accessible"
        
        if command_exists jq; then
            SERVICES_STATUS=$(curl -sf "$API_URL/health" | jq -r '.status' 2>/dev/null || echo "unknown")
            print_info "Overall system status: $SERVICES_STATUS"
            
            # Check individual services
            SERVICES=$(curl -sf "$API_URL/health" | jq -r '.services | to_entries[] | "\(.key): \(.value)"' 2>/dev/null)
            if [ -n "$SERVICES" ]; then
                echo "$SERVICES" | while read -r line; do
                    print_info "  $line"
                done
            fi
        fi
    else
        print_warning "Comprehensive health check endpoint is not accessible (may not be deployed yet)"
    fi
    
    # Test webhook health check
    if curl -sf "$API_URL/api/webhooks/health" > /dev/null 2>&1; then
        print_success "Webhook health check endpoint is accessible"
        
        if command_exists jq; then
            WEBHOOK_STATUS=$(curl -sf "$API_URL/api/webhooks/health" | jq -r '.status' 2>/dev/null || echo "unknown")
            TOTAL_EVENTS=$(curl -sf "$API_URL/api/webhooks/health" | jq -r '.metrics.totalEvents' 2>/dev/null || echo "0")
            ERROR_RATE=$(curl -sf "$API_URL/api/webhooks/health" | jq -r '.metrics.errorRate' 2>/dev/null || echo "0")
            
            print_info "  Webhook status: $WEBHOOK_STATUS"
            print_info "  Total events: $TOTAL_EVENTS"
            print_info "  Error rate: $ERROR_RATE%"
            
            if (( $(echo "$ERROR_RATE > 25" | bc -l 2>/dev/null || echo "0") )); then
                print_warning "  Webhook error rate is high (>25%)"
            fi
        fi
    else
        print_warning "Webhook health check endpoint is not accessible (may not be deployed yet)"
    fi
else
    print_warning "API_URL not set, skipping endpoint tests"
fi

# Check client URL
if [ -n "$CLIENT_URL" ]; then
    print_info "Testing Client at: $CLIENT_URL"
    
    if curl -sf "$CLIENT_URL" > /dev/null 2>&1; then
        print_success "Client is accessible"
    else
        print_warning "Client is not accessible (may not be deployed yet)"
    fi
else
    print_warning "CLIENT_URL not set, skipping client test"
fi

# Check Fly.io status if flyctl is available
if command_exists flyctl; then
    echo -e "\n${BLUE}Checking Fly.io App Status...${NC}"
    
    # Check server app
    if flyctl status -a postmarkr-server > /dev/null 2>&1; then
        print_success "Fly.io server app exists"
        SERVER_STATUS=$(flyctl status -a postmarkr-server 2>/dev/null | grep "Status" | awk '{print $2}' || echo "unknown")
        print_info "  Server status: $SERVER_STATUS"
    else
        print_warning "Fly.io server app not found or not accessible"
    fi
    
    # Check client app
    if flyctl status -a postmarkr-client > /dev/null 2>&1; then
        print_success "Fly.io client app exists"
        CLIENT_STATUS=$(flyctl status -a postmarkr-client 2>/dev/null | grep "Status" | awk '{print $2}' || echo "unknown")
        print_info "  Client status: $CLIENT_STATUS"
    else
        print_warning "Fly.io client app not found or not accessible"
    fi
fi

# Database check
echo -e "\n${BLUE}Checking Database Configuration...${NC}"

if [ -n "$DATABASE_URL" ]; then
    # Check if it's PostgreSQL
    if [[ "$DATABASE_URL" == postgresql://* ]] || [[ "$DATABASE_URL" == postgres://* ]]; then
        print_success "Database URL is PostgreSQL"
    else
        print_warning "Database URL is not PostgreSQL (recommended for production)"
    fi
    
    # Check if SSL is enabled
    if [[ "$DATABASE_URL" == *"sslmode=require"* ]] || [[ "$DATABASE_URL" == *"ssl=true"* ]]; then
        print_success "Database SSL is enabled"
    else
        print_warning "Database SSL is not explicitly enabled"
    fi
fi

# Summary
echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Ready for production deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ All required checks passed, but there are $WARNINGS warnings to review.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ $FAILED checks failed. Please fix the issues before deploying to production.${NC}"
    exit 1
fi

