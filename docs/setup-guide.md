# Setup Guide

This guide will help you set up the Doylee Dinners development environment.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- AWS CLI
- Git

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your local configuration

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your local configuration
```

### 3. Start LocalStack

LocalStack provides a local AWS environment for development.

```bash
# From project root
cd infrastructure/localstack
docker-compose up -d

# Verify it's running
curl http://localhost:4566/_localstack/health
```

### 4. Deploy Local Infrastructure

```bash
# From project root
bash scripts/local-deploy.sh
```

This script will:
- Create the DynamoDB table with GSIs
- Verify the setup

### 5. Build Backend

```bash
cd backend
npm run build

# Or watch for changes
npm run build:watch
```

### 6. Start Frontend

```bash
cd frontend
npm start
```

The app will open at http://localhost:3000

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Stopping LocalStack

```bash
cd infrastructure/localstack
docker-compose down

# To remove volumes
docker-compose down -v
```

## Project Structure

```
doylee-dinners/
├── backend/               # TypeScript Lambda functions
│   ├── src/
│   │   ├── functions/    # Lambda handlers
│   │   └── shared/       # Shared utilities
│   ├── tests/            # Jest tests
│   └── dist/             # Compiled JavaScript
├── frontend/             # React application
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   └── build/            # Production build
├── infrastructure/       # IaC and local dev
│   ├── terraform/        # Terraform modules
│   └── localstack/       # Docker Compose config
└── docs/                 # Documentation
```

## Troubleshooting

### LocalStack Connection Issues

If you can't connect to LocalStack:

```bash
# Check if container is running
docker ps | grep localstack

# Check logs
cd infrastructure/localstack
docker-compose logs

# Restart LocalStack
docker-compose restart
```

### DynamoDB Table Issues

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:4566

# Delete and recreate
aws dynamodb delete-table --table-name doylee-dinners --endpoint-url http://localhost:4566
bash scripts/local-deploy.sh
```

### TypeScript Build Errors

```bash
# Clean build
cd backend
rm -rf dist node_modules
npm install
npm run build
```

## Next Steps

- Read [database-schema.md](./database-schema.md) to understand the data model
- Start implementing Phase 2: Infrastructure & Database
- Review the plan at `/Users/ahendlish/.claude/plans/silly-giggling-boot.md`
