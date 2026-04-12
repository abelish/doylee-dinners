# Phase 4: Meal Management - Implementation Plan

## Overview

Build meal scheduling system where users can:
- Create meal events (date, time, max diners)
- View upcoming meals in a calendar/list
- Sign up as cook, assistant, or diner
- Post menu (cook only)
- Edit/delete meals (creator only)

---

## Backend: DynamoDB Schema

### Meal Entity

```typescript
{
  PK: "MEAL#{mealId}",           // Partition key
  SK: "METADATA",                // Sort key
  
  // Core fields
  mealId: string,                // UUID
  date: string,                  // ISO date: "2026-04-15"
  time: string,                  // Time: "18:00"
  maxDiners: number,             // e.g., 20
  
  // Roles
  cookId?: string,               // User ID of cook
  cookName?: string,             // Name for display
  assistantId?: string,          // User ID of assistant
  assistantName?: string,        // Name for display
  
  // Details
  menu?: string,                 // Menu description
  notes?: string,                // Additional notes
  status: "open" | "full" | "cancelled",
  
  // Metadata
  createdBy: string,             // User ID who created
  createdAt: string,             // ISO timestamp
  updatedAt: string,             // ISO timestamp
  
  // GSI2 for date queries
  GSI2PK: "MEAL#DATE#{date}",    // For querying meals by date
  GSI2SK: string,                // Time for sorting
}
```

### Diner Signup Entity

```typescript
{
  PK: "MEAL#{mealId}",           // Same partition as meal
  SK: "DINER#{userId}",          // Sort key for diner
  
  userId: string,
  userName: string,
  dietaryRestrictions?: string,  // Visible to cook/assistant
  signupTime: string,            // ISO timestamp
}
```

### User-Meal Index Entity (for "My Meals" view)

```typescript
{
  PK: "USER#{userId}",
  SK: "MEAL#{mealId}#{role}",    // role: COOK|ASSISTANT|DINER
  
  mealId: string,
  mealDate: string,
  role: "COOK" | "ASSISTANT" | "DINER",
}
```

---

## Backend: Lambda Functions

### 1. POST /meals - Create Meal
**Handler:** `functions/meals/create.ts`

**Request:**
```json
{
  "date": "2026-04-15",
  "time": "18:00",
  "maxDiners": 20,
  "notes": "Italian night!"
}
```

**Logic:**
1. Authenticate request
2. Validate date (not in past), time, maxDiners > 0
3. Generate mealId (UUID)
4. Create meal in DynamoDB
5. Return meal object

**Response:**
```json
{
  "success": true,
  "data": {
    "meal": { ...mealObject }
  }
}
```

### 2. GET /meals - List Meals
**Handler:** `functions/meals/list.ts`

**Query Params:**
- `startDate` (optional) - ISO date
- `endDate` (optional) - ISO date
- `status` (optional) - "open", "full", "cancelled"

**Logic:**
1. Query GSI2 for date range (or scan if no date filter)
2. Filter by status if provided
3. Return sorted by date/time
4. Include cook/assistant names, diner count

**Response:**
```json
{
  "success": true,
  "data": {
    "meals": [
      {
        "mealId": "...",
        "date": "2026-04-15",
        "time": "18:00",
        "maxDiners": 20,
        "currentDiners": 5,
        "cookName": "John Doe",
        "assistantName": "Jane Smith",
        "status": "open",
        "hasMenu": true
      }
    ]
  }
}
```

### 3. GET /meals/{mealId} - Get Meal Details
**Handler:** `functions/meals/get.ts`

**Logic:**
1. Query PK=MEAL#{mealId}, SK begins_with ""
2. Get METADATA + all DINERs
3. Return full meal object with diner list
4. Include dietary restrictions if user is cook/assistant

**Response:**
```json
{
  "success": true,
  "data": {
    "meal": {
      "mealId": "...",
      "date": "2026-04-15",
      "time": "18:00",
      "menu": "Pasta, salad, tiramisu",
      "notes": "Italian night!",
      "cook": { "userId": "...", "name": "John" },
      "assistant": { "userId": "...", "name": "Jane" },
      "diners": [
        { 
          "userId": "...", 
          "name": "Alice",
          "dietaryRestrictions": "Vegetarian" // if viewer is cook/assistant
        }
      ],
      "status": "open",
      "spotsAvailable": 15
    }
  }
}
```

### 4. PUT /meals/{mealId} - Update Meal
**Handler:** `functions/meals/update.ts`

**Request:**
```json
{
  "menu": "Updated menu",
  "notes": "New notes",
  "maxDiners": 25
}
```

**Logic:**
1. Authenticate request
2. Get meal from DB
3. Check if user is creator OR cook
4. Validate updates
5. Update meal in DynamoDB
6. Return updated meal

**Authorization:**
- Creator can update anything
- Cook can update menu/notes
- Others cannot update

### 5. DELETE /meals/{mealId} - Delete Meal
**Handler:** `functions/meals/delete.ts`

**Logic:**
1. Authenticate request
2. Get meal from DB
3. Check if user is creator
4. Delete all related items (METADATA + all DINERs)
5. Delete user-meal index entries
6. Return success

**Authorization:**
- Only creator can delete

### 6. POST /meals/{mealId}/signup - Sign Up for Meal
**Handler:** `functions/meals/signup.ts`

**Request:**
```json
{
  "role": "COOK" | "ASSISTANT" | "DINER"
}
```

**Logic:**
1. Authenticate request
2. Get meal from DB
3. Validate:
   - Meal is open
   - Role is available (cook/assistant not taken)
   - Spots available (for diner)
   - User not already signed up
4. Create signup entry
5. Update meal (set cookId/assistantId if applicable)
6. Create user-meal index entry
7. Return updated meal

### 7. DELETE /meals/{mealId}/signup - Remove Signup
**Handler:** `functions/meals/remove-signup.ts`

**Logic:**
1. Authenticate request
2. Get meal and user's signup
3. Delete signup entry
4. Update meal (clear cookId/assistantId if applicable)
5. Delete user-meal index entry
6. Return success

---

## Backend: Shared Utilities

### `shared/db/meals.ts`

```typescript
export async function createMeal(meal: Meal): Promise<Meal>
export async function getMealById(mealId: string): Promise<Meal | null>
export async function updateMeal(mealId: string, updates: Partial<Meal>): Promise<Meal>
export async function deleteMeal(mealId: string): Promise<void>
export async function listMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]>
export async function getMealWithDiners(mealId: string): Promise<MealWithDiners>
```

### `shared/db/signups.ts`

```typescript
export async function createSignup(mealId: string, userId: string, role: string): Promise<void>
export async function getSignup(mealId: string, userId: string): Promise<Signup | null>
export async function deleteSignup(mealId: string, userId: string): Promise<void>
export async function listDinersForMeal(mealId: string): Promise<Diner[]>
```

### `types/entities.ts` (add to existing)

```typescript
export interface Meal {
  PK: string;
  SK: string;
  mealId: string;
  date: string;
  time: string;
  maxDiners: number;
  cookId?: string;
  cookName?: string;
  assistantId?: string;
  assistantName?: string;
  menu?: string;
  notes?: string;
  status: "open" | "full" | "cancelled";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  GSI2PK: string;
  GSI2SK: string;
}

export interface Diner {
  PK: string;
  SK: string;
  userId: string;
  userName: string;
  dietaryRestrictions?: string;
  signupTime: string;
}
```

---

## Frontend: Components

### Pages

**`pages/Meals.js`** - Main meal management page
- Tab/toggle: Calendar view vs List view
- Filter by date range
- Filter by status (all, open, needs cook)
- "Create Meal" button

**`pages/MealDetails.js`** - Single meal detail page
- Full meal info (date, time, menu, notes)
- Cook and assistant names
- Diner list with dietary restrictions (if user is cook/assistant)
- Sign up buttons (Cook, Assistant, Diner)
- Edit/Delete buttons (if creator)
- Cancel signup button (if signed up)

### Components

**`components/meals/MealCalendar.js`**
- Calendar grid showing meals by date
- Click date to filter list or create meal
- Show meal count per date
- Color code: has cook (green), needs cook (red)

**`components/meals/MealList.js`**
- List of meal cards
- Sorted by date/time
- Filter controls at top
- Infinite scroll or pagination

**`components/meals/MealCard.js`**
- Compact meal display
- Date, time, cook name
- Diner count (5/20)
- Status badge (open, full, needs cook)
- Quick signup button
- Click to view details

**`components/meals/MealForm.js`**
- Create/edit meal form
- Date picker
- Time picker
- Max diners input
- Notes textarea
- Submit/cancel buttons

**`components/meals/MenuForm.js`**
- Menu textarea
- Only visible if user is cook
- Save button

**`components/meals/DinersList.js`**
- List of signed-up diners
- Show dietary restrictions (if viewer is cook/assistant)
- Show "You" indicator if current user
- Sorted by signup time

**`components/meals/SignupButton.js`**
- Sign up as Cook/Assistant/Diner
- Disable if role taken or meal full
- Loading state
- Success feedback

### Services

**`services/mealsService.js`**
```javascript
export const createMeal = (mealData)
export const getMeals = (filters)
export const getMealById = (mealId)
export const updateMeal = (mealId, updates)
export const deleteMeal = (mealId)
export const signupForMeal = (mealId, role)
export const removeSignup = (mealId)
```

### Context

**`contexts/MealContext.js`** (optional)
- Meals list state
- Selected meal state
- Filters state
- Refresh meals function

Or just use component state + React Query for caching

---

## UI/UX Design

### Meal Card Design
```
┌──────────────────────────────────┐
│ 🍽️ Thursday, April 15           │
│    6:00 PM                       │
│                                  │
│ 👨‍🍳 Cook: John Doe              │
│ 🧑‍🍳 Assistant: Jane Smith       │
│                                  │
│ 👥 5/20 diners signed up         │
│                                  │
│ Status: Open  [Sign Up →]       │
└──────────────────────────────────┘
```

### Calendar View
```
Sun  Mon  Tue  Wed  Thu  Fri  Sat
          1    2    3    4    5
                         🍽️   🍽️
 6    7    8    9   10   11   12
🍽️                  🍽️
```

### Meal Details Page
```
Thursday, April 15 at 6:00 PM
Status: Open (15 spots available)

👨‍🍳 Cook: John Doe
🧑‍🍳 Assistant: Jane Smith

Menu:
  Pasta with marinara sauce
  Caesar salad
  Tiramisu for dessert

Notes:
  Italian night! Please bring wine.

[Sign Up as Diner]

Signed Up Diners (5):
  • Alice (Vegetarian)
  • Bob
  • Charlie (Gluten-Free)
  • You
  • Eve

[Edit Meal] [Delete Meal] [Cancel Signup]
```

---

## Routing

Update `App.js`:
```javascript
<Route path="/meals" element={<ProtectedRoute><Meals /></ProtectedRoute>} />
<Route path="/meals/:mealId" element={<ProtectedRoute><MealDetails /></ProtectedRoute>} />
```

Update navigation:
```javascript
<nav>
  <Link to="/">Home</Link>
  <Link to="/meals">Meals</Link>
</nav>
```

---

## Validation Rules

**Meal Creation:**
- Date cannot be in the past
- Time must be valid HH:MM format
- maxDiners must be > 0 and <= 100
- Notes/menu max length: 1000 chars

**Signup:**
- Cannot sign up for past meals
- Cannot sign up for cancelled meals
- Cannot sign up for same role twice
- Diner signup blocked if meal is full

**Menu Posting:**
- Only cook can post menu
- Menu max length: 2000 chars

**Meal Editing:**
- Cannot change date to past
- Cannot reduce maxDiners below current diner count

**Meal Deletion:**
- Only creator can delete
- Warn if diners are signed up

---

## Access Control Matrix

| Action | Creator | Cook | Assistant | Diner | Other |
|--------|---------|------|-----------|-------|-------|
| Create meal | ✅ | ✅ | ✅ | ✅ | ✅ |
| View meal list | ✅ | ✅ | ✅ | ✅ | ✅ |
| View meal details | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit meal (all fields) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit menu | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete meal | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sign up as cook | ❌ | - | ❌ | ❌ | ✅ |
| Sign up as assistant | ❌ | ❌ | - | ❌ | ✅ |
| Sign up as diner | ❌ | ✅ | ✅ | - | ✅ |
| Cancel own signup | N/A | ✅ | ✅ | ✅ | N/A |
| View diner dietary info | ✅ | ✅ | ✅ | Own only | ❌ |

---

## Implementation Order

### Step 1: Backend Types & DB Layer (Day 1)
1. Add Meal and Diner types to `types/entities.ts`
2. Create `shared/db/meals.ts` with CRUD functions
3. Create `shared/db/signups.ts` with signup functions
4. Test locally with sample data

### Step 2: Lambda Functions (Day 1-2)
1. Implement meals-create
2. Implement meals-list
3. Implement meals-get
4. Implement meals-update
5. Implement meals-delete
6. Implement meals-signup
7. Implement meals-remove-signup
8. Build, package, deploy

### Step 3: API Gateway Setup (Day 2)
1. Add /meals resource
2. Add /meals/{mealId} resource
3. Add /meals/{mealId}/signup resource
4. Configure methods and integrations
5. Configure CORS
6. Deploy and test

### Step 4: Frontend Services (Day 2)
1. Create `services/mealsService.js`
2. Test API calls in browser console

### Step 5: Frontend Components (Day 3-4)
1. Create MealCard component
2. Create MealList component
3. Create Meals page (list view)
4. Create MealForm component
5. Create MealDetails page
6. Create SignupButton component
7. Create DinersList component

### Step 6: Calendar View (Day 4-5)
1. Install/create calendar component
2. Integrate with meal data
3. Add date filtering

### Step 7: Testing & Polish (Day 5)
1. Test full meal lifecycle
2. Test signup flow
3. Test authorization rules
4. Add loading states
5. Add error handling
6. Polish UI/UX

---

## Testing Checklist

### Backend Testing
- [ ] Create meal with valid data
- [ ] Create meal with invalid data (past date, negative maxDiners)
- [ ] List meals without filters
- [ ] List meals with date range
- [ ] List meals with status filter
- [ ] Get meal by ID (exists)
- [ ] Get meal by ID (not found)
- [ ] Update meal as creator
- [ ] Update menu as cook
- [ ] Update meal as unauthorized user (should fail)
- [ ] Delete meal as creator
- [ ] Delete meal as unauthorized user (should fail)
- [ ] Sign up as cook (available)
- [ ] Sign up as cook (taken - should fail)
- [ ] Sign up as diner (spots available)
- [ ] Sign up as diner (meal full - should fail)
- [ ] Cancel signup (own)
- [ ] Cancel signup (other's - should fail)

### Frontend Testing
- [ ] Create meal via form
- [ ] View meals in list
- [ ] Filter meals by date
- [ ] Filter meals by status
- [ ] Click meal card to view details
- [ ] Sign up as cook
- [ ] Sign up as assistant
- [ ] Sign up as diner
- [ ] Cancel signup
- [ ] View dietary restrictions as cook
- [ ] Cannot view dietary restrictions as non-cook
- [ ] Edit meal as creator
- [ ] Cannot edit meal as non-creator
- [ ] Delete meal as creator
- [ ] Cannot delete meal as non-creator
- [ ] View meals in calendar

---

## Ready to Start!

**First Task:** Create the TypeScript types and DynamoDB layer for meals.

Shall we begin?
