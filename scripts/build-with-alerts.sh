#!/bin/bash
# CQG Build Script with Alert Integration
# Tracks build time and sends success/failure alerts to Discord

set -e

echo "🔨 Starting CQG Platform build..."
START_TIME=$(date +%s)

# Build log file
BUILD_LOG="/tmp/cqg-build-log.txt"

# Run the build and capture output
if pnpm run build > "$BUILD_LOG" 2>&1; then
  END_TIME=$(date +%s)
  BUILD_DURATION=$((END_TIME - START_TIME))
  BUILD_TIME="${BUILD_DURATION}s"
  
  echo "✅ Build completed successfully in ${BUILD_TIME}"
  
  # Send success alert
  if [ -n "$ALERT_WEBHOOK_URL" ]; then
    ts-node scripts/deploymentAlert.ts success "$BUILD_TIME" 2>/dev/null || echo "⚠️  Failed to send success alert"
  fi
  
  exit 0
else
  END_TIME=$(date +%s)
  BUILD_DURATION=$((END_TIME - START_TIME))
  BUILD_TIME="${BUILD_DURATION}s"
  
  echo "❌ Build failed after ${BUILD_TIME}"
  
  # Extract error from build log
  ERROR_LOG=$(tail -n 20 "$BUILD_LOG")
  
  # Send failure alert
  if [ -n "$ALERT_WEBHOOK_URL" ]; then
    ts-node scripts/deploymentAlert.ts failure "$BUILD_TIME" "$ERROR_LOG" 2>/dev/null || echo "⚠️  Failed to send failure alert"
  fi
  
  # Display error log
  echo ""
  echo "📋 Build Error Log (last 20 lines):"
  echo "-----------------------------------"
  tail -n 20 "$BUILD_LOG"
  echo "-----------------------------------"
  
  exit 1
fi

