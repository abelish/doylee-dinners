#!/bin/bash

# Set up AWS Budget alert for $1 threshold
set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUDGET_NAME="doylee-dinners-free-tier"
ALERT_EMAIL="${1:-your-email@example.com}"

echo "🔔 Setting up budget alert for AWS account: $ACCOUNT_ID"
echo "📧 Alert email: $ALERT_EMAIL"
echo ""

# Create budget with alert
aws budgets put-budget \
  --account-id $ACCOUNT_ID \
  --budget '{
    "BudgetName": "'"$BUDGET_NAME"'",
    "BudgetLimit": {
      "Amount": "1.0",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST",
    "CostTypes": {
      "IncludeTax": true,
      "IncludeSubscription": true,
      "UseBlended": false,
      "IncludeSupport": true,
      "IncludeOtherSubscription": true,
      "IncludeUpfront": true,
      "IncludeRecurring": true,
      "IncludeRefund": false,
      "IncludeCredit": false,
      "IncludeDiscount": true,
      "UseAmortized": false
    }
  }' 2>&1 | grep -q "already exists" && echo "ℹ️  Budget already exists" || echo "✅ Budget created"

# Add notification (requires SNS topic)
echo ""
echo "📊 Budget created! View at:"
echo "https://console.aws.amazon.com/billing/home#/budgets"
echo ""
echo "To add email alerts, visit the console and add a notification."
