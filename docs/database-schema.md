# DynamoDB Single-Table Design

## Overview

Doylee Dinners uses a single-table design pattern for DynamoDB, which is a best practice for optimizing costs and performance. This document describes the entity patterns and access patterns supported by the schema.

## Table Configuration

**Table Name:** `doylee-dinners`

**Primary Key:**
- **PK** (Partition Key) - String: Composite entity identifier
- **SK** (Sort Key) - String: Additional entity or relationship identifier

**Global Secondary Indexes:**

### GSI1: Email Lookup
- **GSI1PK** (Partition Key) - String: User email address
- **GSI1SK** (Sort Key) - String: USER# prefix
- **Purpose:** Enable user lookup by email for authentication

### GSI2: Date-based Meal Queries
- **GSI2PK** (Partition Key) - String: MEAL#DATE#{YYYY-MM-DD}
- **GSI2SK** (Sort Key) - String: Meal timestamp
- **Purpose:** Enable efficient queries for meals by date range

## Entity Patterns

### 1. User Profile

```
PK: USER#{userId}
SK: PROFILE

Attributes:
- userId: string (UUID)
- email: string (unique)
- passwordHash: string (bcrypt hashed)
- name: string
- dietaryRestrictions: string (optional)
- createdAt: string (ISO 8601 timestamp)
- updatedAt: string (ISO 8601 timestamp)

GSI1PK: {email}
GSI1SK: USER#{userId}
```

### 2. Meal Metadata

```
PK: MEAL#{mealId}
SK: METADATA

Attributes:
- mealId: string (UUID)
- date: string (YYYY-MM-DD)
- time: string (HH:MM)
- maxDiners: number
- cookId: string (userId, optional)
- cookName: string (denormalized, optional)
- assistantId: string (userId, optional)
- assistantName: string (denormalized, optional)
- menu: string (optional)
- status: string (OPEN | FULL | CANCELLED)
- createdAt: string (ISO 8601 timestamp)
- updatedAt: string (ISO 8601 timestamp)

GSI2PK: MEAL#DATE#{date}
GSI2SK: {date}T{time}
```

### 3. Meal Signup (Diner)

```
PK: MEAL#{mealId}
SK: DINER#{userId}

Attributes:
- mealId: string
- userId: string
- userName: string (denormalized)
- dietaryRestrictions: string (denormalized)
- signupTime: string (ISO 8601 timestamp)
```

### 4. User's Meal Participation Index

```
PK: USER#{userId}
SK: MEAL#{mealId}#{role}

Attributes:
- userId: string
- mealId: string
- mealDate: string (YYYY-MM-DD, denormalized for sorting)
- mealTime: string (HH:MM)
- role: string (COOK | ASSISTANT | DINER)
```

## Access Patterns

### User Authentication
- **Get user by email:** Query GSI1 where GSI1PK = email
- **Get user by ID:** GetItem PK=USER#{userId}, SK=PROFILE

### Meal Queries
- **Get meal details:** Query PK=MEAL#{mealId}
- **List meals by date range:** Query GSI2 where GSI2PK=MEAL#DATE#{date}
- **Get all diners for meal:** Query PK=MEAL#{mealId}, SK begins_with DINER#

### User's Meals
- **Get user's meals:** Query PK=USER#{userId}, SK begins_with MEAL#

## Free Tier Optimization

**Estimated Usage for 20 users:**
- Storage: ~1.5 MB (0.006% of 25 GB free tier)
- Read operations: ~500/day
- Write operations: ~50/day
- **Well within free tier limits**
