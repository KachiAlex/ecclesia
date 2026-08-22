#!/bin/bash

# Cloud SQL PostgreSQL Setup Script
# This script helps you set up Google Cloud SQL for the Ecclesia app

set -e

echo "🚀 Setting up Google Cloud SQL PostgreSQL for Ecclesia App"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Project ID: $PROJECT_ID"
read -p "Continue with this project? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Set variables
INSTANCE_NAME="ecclesia-db"
REGION="us-central1"
DB_NAME="ecclesia"
TIER="db-f1-micro"  # Change to db-n1-standard-1 for production

# Get password
echo ""
echo "🔐 Database Configuration"
read -sp "Enter database root password (min 8 chars): " DB_PASSWORD
echo ""
if [ ${#DB_PASSWORD} -lt 8 ]; then
    echo "❌ Password must be at least 8 characters"
    exit 1
fi

# Confirm tier
echo ""
echo "💻 Instance Configuration"
echo "Current tier: $TIER"
read -p "Use production tier (db-n1-standard-1)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    TIER="db-n1-standard-1"
fi

# Create instance
echo ""
echo "☁️  Creating Cloud SQL instance..."
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=$TIER \
  --region=$REGION \
  --root-password=$DB_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --maintenance-release-channel=production \
  --quiet

echo "✅ Instance created"

# Create database
echo ""
echo "📊 Creating database..."
gcloud sql databases create $DB_NAME \
  --instance=$INSTANCE_NAME \
  --quiet

echo "✅ Database created"

# Get connection info
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --format='value(connectionName)')

PUBLIC_IP=$(gcloud sql instances describe $INSTANCE_NAME \
  --format='value(ipAddresses[0].ipAddress)')

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Connection Information:"
echo "   Instance Name: $INSTANCE_NAME"
echo "   Connection Name: $CONNECTION_NAME"
echo "   Public IP: $PUBLIC_IP"
echo "   Database: $DB_NAME"
echo ""
echo "🔗 Connection Strings:"
echo ""
echo "For Cloud Run (Unix Socket):"
echo "postgresql://postgres:$DB_PASSWORD@/ecclesia?host=/cloudsql/$CONNECTION_NAME&sslmode=require"
echo ""
echo "For Public IP:"
echo "postgresql://postgres:$DB_PASSWORD@$PUBLIC_IP:5432/ecclesia?sslmode=require"
echo ""
echo "📝 Next Steps:"
echo "1. Update DATABASE_URL in your .env.production file"
echo "2. Run migrations: npx prisma migrate deploy"
echo "3. Deploy to Cloud Run with: --add-cloudsql-instances=$CONNECTION_NAME"
echo ""
echo "📚 For detailed setup, see: CLOUD_SQL_SETUP.md"

