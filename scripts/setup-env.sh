#!/bin/bash

# CQG Seeding Environment Setup Script
echo "🚀 Setting up CQG seeding environment..."

# Check if .env.local exists
if [ ! -f "../.env.local" ]; then
    echo "❌ .env.local not found. Please create it first with your Firebase config."
    exit 1
fi

# Source the environment file
source ../.env.local

# Set Firebase project ID from .env.local
if [ -n "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then
    export FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    echo "✅ Firebase Project ID set: $FIREBASE_PROJECT_ID"
else
    echo "⚠️  NEXT_PUBLIC_FIREBASE_PROJECT_ID not found in .env.local"
    echo "   Please add it to your .env.local file"
fi

# Check for service account credentials
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS not set"
    echo ""
    echo "🔧 To set up Firebase Admin SDK credentials:"
    echo "   1. Go to Firebase Console > Project Settings > Service Accounts"
    echo "   2. Click 'Generate New Private Key'"
    echo "   3. Download the JSON file"
    echo "   4. Set the environment variable:"
    echo "      export GOOGLE_APPLICATION_CREDENTIALS=\"/path/to/serviceAccountKey.json\""
    echo ""
    echo "   Or use Google Cloud CLI:"
    echo "      gcloud auth application-default login"
    echo ""
else
    echo "✅ Service account credentials found: $GOOGLE_APPLICATION_CREDENTIALS"
fi

echo ""
echo "🎯 Ready to seed! Run: pnpm seed"
echo "📖 For more info, see: scripts/README.md"


