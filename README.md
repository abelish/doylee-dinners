# Doylee Dinners

A web application for cohousing communities to organize and coordinate shared dinners.

## Overview

Doylee Dinners helps cohousing communities manage their shared meal experiences. Community members can sign up as cooks, assistants, or diners, with cooks posting menus in advance and diners specifying dietary restrictions and preferences.

## Architecture

- **Frontend**: React app hosted on AWS S3 + CloudFront
- **Backend**: TypeScript Lambda functions via AWS API Gateway
- **Database**: AWS DynamoDB (single-table design)
- **Infrastructure**: Terraform for IaC
- **Local Development**: LocalStack for AWS service emulation
- **CI/CD**: GitHub Actions

## Tech Stack

- **Backend**: TypeScript, AWS Lambda, DynamoDB SDK v3
- **Frontend**: React 18, React Router, Axios
- **Auth**: Custom JWT with bcrypt password hashing
- **Infrastructure**: Terraform, Docker (LocalStack)
- **Testing**: Jest, React Testing Library

## Project Structure

```
doylee-dinners/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   └── public/
├── backend/            # TypeScript Lambda functions
│   ├── src/
│   │   ├── functions/  # Lambda handlers
│   │   └── shared/     # Shared utilities
│   └── tests/
├── infrastructure/     # Terraform & LocalStack
│   ├── terraform/
│   └── localstack/
├── scripts/            # Deployment scripts
└── docs/              # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS CLI
- Git

### Quick Start

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start LocalStack:**
   ```bash
   cd infrastructure/localstack
   docker-compose up -d
   ```

4. **Deploy local infrastructure:**
   ```bash
   bash scripts/local-deploy.sh
   ```

5. **Build backend and start frontend:**
   ```bash
   cd backend && npm run build
   cd ../frontend && npm start
   ```

## Documentation

- [Setup Guide](./docs/setup-guide.md) - Local development setup
- [Database Schema](./docs/database-schema.md) - DynamoDB single-table design
- [Infrastructure Overview](./docs/infrastructure-overview.md) - AWS architecture and Terraform modules
- [Deployment Guide](./docs/deployment-guide.md) - Deploy to AWS step-by-step
- [Implementation Plan](~/.claude/plans/silly-giggling-boot.md) - Full project plan

## Development

- **Backend build:** `cd backend && npm run build`
- **Backend tests:** `cd backend && npm test`
- **Frontend dev server:** `cd frontend && npm start`
- **Frontend tests:** `cd frontend && npm test`

## Project Status

**Phase 1: Foundation** ✅ Complete
- Project structure with TypeScript
- LocalStack for local AWS development
- DynamoDB single-table design
- Documentation and setup scripts

**Phase 2: Infrastructure** ✅ Complete
- Terraform modules for all AWS resources
- DynamoDB, Lambda, API Gateway, S3, CloudFront
- IAM roles and policies with least privilege
- Free tier optimized configuration

**Phase 3: Authentication** 🔄 Next
- Lambda functions for register/login/logout
- JWT token generation and validation
- React auth components and context
- Password hashing with bcrypt

**Phase 4-6:** Meals, Signups, CI/CD - Planned

## Features

- ✅ Infrastructure as Code (Terraform)
- ✅ Local development environment (LocalStack)
- ✅ Single-table DynamoDB design
- ✅ CloudFront CDN with S3 hosting
- 🔄 User authentication (Phase 3)
- 🔄 Meal scheduling and management
- 🔄 Role-based sign-ups (cook, assistant, diner)
- 🔄 Menu posting and dietary restrictions
- 📋 Meal calendar view
- 📋 Email notifications
- 📋 Admin dashboard

## Free Tier Optimized

This project is designed to run entirely within AWS free tier limits:
- DynamoDB: On-demand pricing, single-table design
- Lambda: 128-256MB memory, minimal execution time
- S3/CloudFront: Compressed assets, aggressive caching
