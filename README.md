# Doylee Dinners

A web application for cohousing communities to organize and coordinate shared dinners.

## Overview

Doylee Dinners helps cohousing communities manage their shared meal experiences. Community members can sign up as cooks, assistants, or diners, with cooks posting menus in advance and diners specifying dietary restrictions and preferences.

## Architecture

- **Frontend**: React app hosted on AWS S3 + CloudFront
- **Backend**: TypeScript Lambda functions via AWS API Gateway
- **Database**: AWS DynamoDB (single-table design)
- **Email**: AWS SES for notifications and password resets
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

## Email Configuration

The app uses AWS SES for sending transactional emails (password resets and meal announcements).

### SES Sandbox Mode (Current)

**Limitations:**
- Can only send emails TO verified email addresses
- 200 emails per day limit
- Each recipient must verify their email in AWS SES console

**Verify an email:**
```bash
aws ses verify-email-identity --email-address user@example.com --region us-west-2
```

The user will receive a verification email from AWS. Once verified, they can receive notifications.

### SES Production Mode (Recommended)

To send emails to any address:

1. **Purchase a domain** (~$1-2/year for .xyz, ~$10/year for .com)
2. **Verify domain in SES:**
   - Add DNS records (TXT, CNAME) provided by SES
   - Takes ~10 minutes to verify
3. **Request production access:**
   - Go to AWS SES Console → Account dashboard → Request production access
   - State use case: "Transactional emails for meal coordination app"
   - Approval typically within 24 hours
4. **Update environment:**
   ```bash
   # Update terraform.tfvars
   ses_sender_email = "noreply@your-domain.com"
   
   # Redeploy
   terraform apply
   bash scripts/deploy-lambdas.sh
   ```

**Production mode cost:** ~$0.20-0.50/month for typical usage (essentially free)

### Email Features

**Password Reset:**
- Secure single-use tokens with 1-hour expiration
- SHA-256 hashed tokens in database
- No email enumeration (always returns success)
- Auto-login after successful reset

**Meal Announcements:**
- Sent when cook first posts menu (not on edits)
- Confirmation modal warns cook before sending
- Batch sending with `Promise.allSettled` (continues on failures)
- Fun, engaging template with CTA button
- Direct link to meal page (login required)

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

**Phase 3: Authentication** ✅ Complete
- Lambda functions for register/login/logout/me
- JWT token generation and validation
- React auth components and context
- Password hashing with bcrypt
- Password reset flow with email verification

**Phase 4: Meals & Signups** ✅ Complete
- Create, view, update, delete meals
- Role-based signups (cook, assistant, diner)
- Menu posting with dietary restrictions
- Meal status management (open/full/closed)

**Phase 5: Email Notifications** ✅ Complete
- AWS SES integration for transactional emails
- Password reset emails with secure tokens
- Meal announcement emails to all users
- Confirmation modal for first menu posts

**Phase 6: CI/CD** 📋 Planned
- GitHub Actions workflows
- Automated testing and deployment

## Features

### Infrastructure & Architecture
- ✅ Infrastructure as Code with Terraform
- ✅ Single-table DynamoDB design with GSIs
- ✅ CloudFront CDN with S3 hosting
- ✅ API Gateway with Lambda functions
- ✅ Free tier optimized (runs at $0/month)

### Authentication & Security
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Password reset via email
- ✅ Secure single-use reset tokens (1-hour expiration)
- ✅ Protected routes and API endpoints

### Meal Management
- ✅ Create and schedule meals
- ✅ Update meal details (date, time, capacity)
- ✅ Post menus with confirmation modal
- ✅ Close/reopen meals for signups
- ✅ Delete meals
- ✅ View meal details with participant lists

### Sign-ups & Roles
- ✅ Role-based signups (cook, assistant, diner)
- ✅ Dietary restrictions tracking
- ✅ Dietary summary for cooks
- ✅ Cancel signups
- ✅ Meal capacity management
- ✅ Auto-status updates (OPEN → FULL)

### Email Notifications
- ✅ AWS SES integration (sandbox mode)
- ✅ Password reset emails with secure links
- ✅ Meal announcement emails to all users
- ✅ HTML and plain text email templates
- ✅ Batch email sending with error handling
- ✅ First-post detection (no spam on edits)

### Future Enhancements
- 📋 Meal calendar view
- 📋 Admin dashboard
- 📋 SES production mode with custom domain
- 📋 CI/CD with GitHub Actions
- 📋 User profile management
- 📋 Meal history and statistics

## Free Tier Optimized

This project is designed to run entirely within AWS free tier limits:
- DynamoDB: On-demand pricing, single-table design
- Lambda: 128-256MB memory, minimal execution time
- S3/CloudFront: Compressed assets, aggressive caching
