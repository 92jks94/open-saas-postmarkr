#!/bin/bash
# Deployment monitoring script
# This script monitors the health of your deployed applications

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

# Configuration
SERVER_URL="https://postmarkr-server.fly.dev"
CLIENT_URL="https://postmarkr-client.fly.dev"
SERVER_APP="postmarkr-server"
CLIENT_APP="postmarkr-client"
DATABASE_APP="postmarkr-db"

# Alert thresholds
MAX_RESPONSE_TIME=5000  # 5 seconds
HEALTH_CHECK_FAILURES=3

print_status $BLUE "🔍 POSTMARKR DEPLOYMENT MONITOR"
print_status $BLUE "================================"
echo ""

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    print_status $BLUE "Checking $name..."
    
    # Use curl with timeout and capture response time
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" -o /tmp/response_$name --max-time 10 "$url" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response" = "$expected_status" ]; then
        print_status $GREEN "✅ $name: OK (${response_time}ms)"
        return 0
    else
        print_status $RED "❌ $name: FAILED (HTTP $response, ${response_time}ms)"
        return 1
    fi
}

# Function to check Fly.io app status
check_fly_app() {
    local app_name=$1
    local app_type=$2
    
    print_status $BLUE "Checking $app_type status..."
    
    local status=$(flyctl status --app "$app_name" --json 2>/dev/null | jq -r '.Machines[0].State' 2>/dev/null || echo "unknown")
    
    if [ "$status" = "started" ]; then
        print_status $GREEN "✅ $app_type: Running"
        return 0
    else
        print_status $RED "❌ $app_type: $status"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    print_status $BLUE "Checking database connectivity..."
    
    # Check if we can connect to the database through the server
    local db_check=$(curl -s --max-time 10 "$SERVER_URL/health" 2>/dev/null | jq -r '.services.database.status' 2>/dev/null || echo "unknown")
    
    if [ "$db_check" = "healthy" ]; then
        print_status $GREEN "✅ Database: Connected"
        return 0
    else
        print_status $RED "❌ Database: $db_check"
        return 1
    fi
}

# Function to send alert (placeholder for integration with monitoring services)
send_alert() {
    local message=$1
    local severity=$2
    
    print_status $RED "🚨 ALERT [$severity]: $message"
    
    # Here you could integrate with:
    # - Slack webhook
    # - Email service
    # - PagerDuty
    # - Discord webhook
    # - etc.
    
    # Example Slack webhook (uncomment and configure):
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"🚨 POSTMARKR ALERT [$severity]: $message\"}" \
    #   "$SLACK_WEBHOOK_URL"
}

# Main monitoring logic
main() {
    local failures=0
    local critical_failures=0
    
    echo "🕐 $(date)"
    echo ""
    
    # Check server health
    if ! check_endpoint "$SERVER_URL/health/simple" "Server Health"; then
        ((failures++))
        ((critical_failures++))
    fi
    
    # Check comprehensive server health
    if ! check_endpoint "$SERVER_URL/health" "Server Comprehensive Health"; then
        ((failures++))
    fi
    
    # Check client
    if ! check_endpoint "$CLIENT_URL" "Client App"; then
        ((failures++))
    fi
    
    # Check Fly.io app statuses
    if ! check_fly_app "$SERVER_APP" "Server App"; then
        ((failures++))
        ((critical_failures++))
    fi
    
    if ! check_fly_app "$CLIENT_APP" "Client App"; then
        ((failures++))
    fi
    
    if ! check_fly_app "$DATABASE_APP" "Database App"; then
        ((failures++))
        ((critical_failures++))
    fi
    
    # Check database connectivity
    if ! check_database; then
        ((failures++))
        ((critical_failures++))
    fi
    
    echo ""
    print_status $BLUE "📊 MONITORING SUMMARY"
    print_status $BLUE "====================="
    
    if [ $failures -eq 0 ]; then
        print_status $GREEN "✅ All systems operational"
    elif [ $critical_failures -gt 0 ]; then
        print_status $RED "🚨 CRITICAL ISSUES DETECTED ($critical_failures critical, $failures total)"
        send_alert "Critical deployment issues detected. $critical_failures critical failures." "CRITICAL"
    else
        print_status $YELLOW "⚠️  Minor issues detected ($failures total)"
        send_alert "Minor deployment issues detected. $failures failures." "WARNING"
    fi
    
    echo ""
    print_status $BLUE "🔧 QUICK FIXES:"
    print_status $BLUE "  Server logs: flyctl logs --app $SERVER_APP"
    print_status $BLUE "  Client logs: flyctl logs --app $CLIENT_APP"
    print_status $BLUE "  Database logs: flyctl logs --app $DATABASE_APP"
    print_status $BLUE "  Server status: flyctl status --app $SERVER_APP"
    print_status $BLUE "  Restart server: flyctl machine restart --app $SERVER_APP"
    echo ""
    
    # Exit with appropriate code
    if [ $critical_failures -gt 0 ]; then
        exit 2  # Critical failure
    elif [ $failures -gt 0 ]; then
        exit 1  # Warning
    else
        exit 0  # Success
    fi
}

# Run the monitoring
main "$@"
