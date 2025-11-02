#!/bin/bash
# File: setup-database.sh

set -e

echo "🎧 HexMusic - Database Setup"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^hexmusic-postgres$"; then
    echo "⚠️  Database container already exists."
    read -p "   Remove and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop hexmusic-postgres 2>/dev/null || true
        docker rm hexmusic-postgres 2>/dev/null || true
    else
        echo "   Exiting. Use 'docker start hexmusic-postgres' to start existing database."
        exit 0
    fi
fi

# Check if port 5432 is available
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost 5432 2>/dev/null; then
    echo "⚠️  Port 5432 is already in use."
    PORT=5433
    echo "   Using port $PORT instead."
else
    PORT=5432
fi

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-20)
DB_NAME="hexmusic"
DB_USER="postgres"

echo ""
echo "📦 Starting PostgreSQL container..."
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 3
    if docker exec hexmusic-postgres pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    echo "   Still waiting... ($i/10)"
    sleep 1
done

echo ""
echo "✅ Database is ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Add this to your .env file:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:$PORT/$DB_NAME\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Next steps:"
echo "   1. Update your .env file with the DATABASE_URL above"
echo "   2. Run: npm run db:push"
echo "   3. Run: npm run dev"
echo ""

# Test connection
for i in {1..10}; do
echo "💡 Useful commands:"
echo "   • View logs:   docker logs hexmusic-postgres"
echo "   • Stop:        docker stop hexmusic-postgres"
echo "   • Start:       docker start hexmusic-postgres"
echo "   • Remove:      docker rm -f hexmusic-postgres"
echo "   • Studio:      npm run db:studio"
echo ""  -e POSTGRES_DB="$DB_NAME" \
  -p "$PORT:5432" \
  postgres:16-alpine > /dev/null
