#!/bin/bash

# Package Lambda functions for deployment
set -e

echo "📦 Packaging Lambda functions..."

# Build TypeScript first
cd /Users/ahendlish/Documents/Projects/doylee-dinners/backend
echo "🔨 Building TypeScript..."
npm run build

# Create packages directory
PACKAGES_DIR="packages"
rm -rf $PACKAGES_DIR
mkdir -p $PACKAGES_DIR

# Package each Lambda function
echo ""
echo "📦 Packaging auth functions..."

# Function to package a Lambda
package_lambda() {
  local FUNC_NAME=$1
  local FUNC_PATH=$2

  echo "  → $FUNC_NAME"

  # Create temp directory
  TEMP_DIR=$(mktemp -d)

  # Copy compiled function code
  cp -r dist/* $TEMP_DIR/

  # Copy node_modules (dependencies)
  cp -r node_modules $TEMP_DIR/

  # Create zip
  cd $TEMP_DIR
  zip -qr "$FUNC_NAME.zip" .

  # Move to packages directory
  mv "$FUNC_NAME.zip" "/Users/ahendlish/Documents/Projects/doylee-dinners/backend/$PACKAGES_DIR/"

  # Cleanup
  rm -rf $TEMP_DIR

  cd /Users/ahendlish/Documents/Projects/doylee-dinners/backend
}

# Package each auth function
package_lambda "auth-register" "functions/auth/register"
package_lambda "auth-login" "functions/auth/login"
package_lambda "auth-me" "functions/auth/me"
package_lambda "auth-logout" "functions/auth/logout"

echo ""
echo "📦 Packaging meal functions..."

# Package each meal function
package_lambda "meals-create" "functions/meals/create"
package_lambda "meals-list" "functions/meals/list"
package_lambda "meals-get" "functions/meals/get"
package_lambda "meals-update" "functions/meals/update"
package_lambda "meals-delete" "functions/meals/delete"
package_lambda "meals-signup" "functions/meals/signup"
package_lambda "meals-remove-signup" "functions/meals/remove-signup"

echo ""
echo "✅ Lambda packages created:"
ls -lh $PACKAGES_DIR/

echo ""
echo "📊 Package sizes:"
du -sh $PACKAGES_DIR/*
