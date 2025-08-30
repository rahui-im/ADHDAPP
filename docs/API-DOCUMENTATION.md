# API Documentation: ADHD Time Manager

## 📚 Table of Contents
1. [Overview](#1-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [REST API Endpoints](#3-rest-api-endpoints)
4. [WebSocket Events](#4-websocket-events)
5. [Data Models](#5-data-models)
6. [Error Handling](#6-error-handling)
7. [Rate Limiting](#7-rate-limiting)
8. [Code Examples](#8-code-examples)
9. [Integration Patterns](#9-integration-patterns)
10. [SDK Reference](#10-sdk-reference)

---

## 1. Overview

### 1.1 API Architecture
The ADHD Time Manager uses a hybrid offline-first architecture with Supabase as the cloud backend:

```
Frontend (React PWA) ←→ Service Layer ←→ Local Storage (IndexedDB/LocalStorage)
                                      ↓
                              Sync Engine ←→ Supabase Backend
```

### 1.2 Base URLs
- **Production**: `https://xjxxamqitqxwzmvjmeuw.supabase.co`
- **Local Development**: `http://localhost:54321`
- **REST API**: `{BASE_URL}/rest/v1/`
- **Realtime**: `{BASE_URL}/realtime/v1/websocket`

### 1.3 API Characteristics
- **Offline-First**: All operations work offline with background sync
- **RESTful**: Standard HTTP methods and status codes
- **Real-time**: WebSocket subscriptions for live updates
- **Type-Safe**: Full TypeScript support with generated types

---

## 2. Authentication & Authorization

### 2.1 Authentication Methods

#### Anonymous Mode (Default)
```typescript
// No authentication required for offline-only usage
const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});
```

#### Email/Password Authentication
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123'
});

// Sign out
const { error } = await supabase.auth.signOut();
```

#### OAuth Authentication (Optional)
```typescript
// Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});

// GitHub OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github'
});
```

### 2.2 Authorization

#### Row Level Security (RLS)
All tables implement RLS policies to ensure users can only access their own data:

```sql
-- Example policy for tasks table
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
```

#### API Key Authentication
```typescript
// All requests include the anon key
const headers = {
  'apikey': 'your-supabase-anon-key',
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json'
};
```

---

## 3. REST API Endpoints

### 3.1 Tasks API

#### GET /rest/v1/tasks
Retrieve tasks for the authenticated user.

**Query Parameters:**
```typescript
interface TaskQueryParams {
  select?: string;          // Fields to select: "id,title,status"
  status?: string;          // Filter by status: "eq.pending"
  priority?: string;        // Filter by priority: "eq.high"
  category?: string;        // Filter by category: "eq.work"
  scheduled_for?: string;   // Filter by date: "gte.2024-01-01"
  order?: string;          // Sort order: "created_at.desc"
  limit?: number;          // Limit results: 50
  offset?: number;         // Pagination offset: 0
}
```

**Request:**
```http
GET /rest/v1/tasks?select=id,title,status,priority&status=eq.pending&order=priority.desc&limit=20
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Complete project documentation",
      "status": "pending",
      "priority": "high"
    }
  ],
  "count": 1,
  "status": 200,
  "statusText": "OK"
}
```

#### POST /rest/v1/tasks
Create a new task.

**Request Body:**
```typescript
interface CreateTaskRequest {
  title: string;
  description?: string;
  estimated_duration: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  energy_level?: 'low' | 'medium' | 'high';
  scheduled_for?: string;    // ISO 8601
  deadline?: string;         // ISO 8601
  subtasks?: SubtaskData[];
}
```

**Request:**
```http
POST /rest/v1/tasks
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "title": "Review pull requests",
  "description": "Review pending PRs for the mobile app",
  "estimated_duration": 45,
  "priority": "high",
  "category": "development",
  "tags": ["code-review", "mobile"],
  "energy_level": "medium",
  "scheduled_for": "2024-01-15T14:00:00Z"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "user_id": "user-uuid",
  "title": "Review pull requests",
  "description": "Review pending PRs for the mobile app",
  "estimated_duration": 45,
  "actual_duration": 0,
  "priority": "high",
  "status": "pending",
  "category": "development",
  "tags": ["code-review", "mobile"],
  "energy_level": "medium",
  "subtasks": [
    {
      "id": "subtask-1",
      "title": "Part 1",
      "duration": 23,
      "isCompleted": false,
      "order": 0
    },
    {
      "id": "subtask-2", 
      "title": "Part 2",
      "duration": 22,
      "isCompleted": false,
      "order": 1
    }
  ],
  "scheduled_for": "2024-01-15T14:00:00Z",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "version": 1,
  "sync_status": "synced"
}
```

#### PATCH /rest/v1/tasks
Update an existing task.

**Query Parameters:**
- `id=eq.{task_id}` - Required to identify the task

**Request:**
```http
PATCH /rest/v1/tasks?id=eq.123e4567-e89b-12d3-a456-426614174001
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "status": "completed",
  "actual_duration": 40,
  "completed_at": "2024-01-15T15:30:00Z"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "status": "completed",
  "actual_duration": 40,
  "completed_at": "2024-01-15T15:30:00Z",
  "updated_at": "2024-01-15T15:30:00Z",
  "version": 2
}
```

#### DELETE /rest/v1/tasks
Soft delete a task (sets deleted_at timestamp).

**Request:**
```http
DELETE /rest/v1/tasks?id=eq.123e4567-e89b-12d3-a456-426614174001
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

### 3.2 Sessions API

#### GET /rest/v1/sessions
Retrieve timer sessions.

**Request:**
```http
GET /rest/v1/sessions?select=*&started_at=gte.2024-01-01&order=started_at.desc&limit=50
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "session-uuid",
      "user_id": "user-uuid",
      "task_id": "task-uuid",
      "type": "focus",
      "planned_duration": 1500,
      "actual_duration": 1480,
      "status": "completed",
      "started_at": "2024-01-15T14:00:00Z",
      "completed_at": "2024-01-15T14:25:00Z",
      "interruptions": [
        {
          "type": "external",
          "timestamp": "2024-01-15T14:10:00Z",
          "duration": 20,
          "reason": "phone call"
        }
      ],
      "energy_before": "medium",
      "energy_after": "high",
      "focus_quality": 4
    }
  ]
}
```

#### POST /rest/v1/sessions
Create a new timer session.

**Request:**
```http
POST /rest/v1/sessions
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "task_id": "task-uuid",
  "type": "focus",
  "planned_duration": 1500,
  "energy_before": "medium",
  "started_at": "2024-01-15T14:00:00Z"
}
```

### 3.3 Analytics API

#### GET /rest/v1/analytics
Retrieve analytics data.

**Request:**
```http
GET /rest/v1/analytics?date=gte.2024-01-01&date=lt.2024-02-01&order=date.desc
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "analytics-uuid",
      "user_id": "user-uuid",
      "date": "2024-01-15",
      "daily_stats": {
        "tasksCompleted": 5,
        "totalFocusMinutes": 120,
        "pomodorosCompleted": 3,
        "averageEnergyLevel": 2.5,
        "averageFocusQuality": 4.2,
        "categoriesWorkedOn": ["development", "planning"],
        "peakProductivityHour": 14
      },
      "patterns": {
        "bestFocusTime": ["morning", "afternoon"],
        "commonDistractions": ["notifications", "meetings"],
        "productivityTrends": "increasing"
      }
    }
  ]
}
```

#### POST /rest/v1/analytics
Create or update analytics data.

**Request:**
```http
POST /rest/v1/analytics
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "date": "2024-01-15",
  "daily_stats": {
    "tasksCompleted": 5,
    "totalFocusMinutes": 120,
    "pomodorosCompleted": 3
  }
}
```

### 3.4 Users API

#### GET /rest/v1/users
Get current user profile.

**Request:**
```http
GET /rest/v1/users?id=eq.{user_id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "preferences": {
        "defaultFocusDuration": 25,
        "theme": "dark",
        "language": "en"
      },
      "settings": {
        "notifications": true,
        "soundEnabled": true,
        "autoStartBreaks": false
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### PATCH /rest/v1/users
Update user profile.

**Request:**
```http
PATCH /rest/v1/users?id=eq.{user_id}
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "name": "John Smith",
  "preferences": {
    "defaultFocusDuration": 30,
    "theme": "light"
  }
}
```

### 3.5 Backups API

#### GET /rest/v1/backups
List user backups.

**Request:**
```http
GET /rest/v1/backups?order=created_at.desc&limit=10
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "backup-uuid",
      "user_id": "user-uuid",
      "backup_type": "auto",
      "version": "1.0.0",
      "created_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```

#### POST /rest/v1/backups
Create a backup.

**Request:**
```http
POST /rest/v1/backups
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "backup_data": {
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:00:00Z",
    "tasks": [...],
    "sessions": [...],
    "analytics": [...],
    "preferences": {...}
  },
  "backup_type": "manual"
}
```

---

## 4. WebSocket Events

### 4.1 Connection Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

### 4.2 Task Events

#### Subscribe to Task Changes
```typescript
// Subscribe to all task changes
const taskSubscription = supabase
  .channel('tasks_channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Task change:', payload);
      handleTaskUpdate(payload);
    }
  )
  .subscribe();

// Handle different event types
function handleTaskUpdate(payload: any) {
  switch (payload.eventType) {
    case 'INSERT':
      // Handle new task
      store.dispatch(addTask(payload.new));
      break;
    case 'UPDATE':
      // Handle task update
      store.dispatch(updateTask(payload.new));
      break;
    case 'DELETE':
      // Handle task deletion
      store.dispatch(removeTask(payload.old.id));
      break;
  }
}
```

#### Subscribe to Specific Task
```typescript
const specificTaskSubscription = supabase
  .channel(`task_${taskId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tasks',
      filter: `id=eq.${taskId}`
    },
    (payload) => {
      // Handle specific task updates
      if (payload.new.status === 'completed') {
        showNotification('Task completed!');
      }
    }
  )
  .subscribe();
```

### 4.3 Session Events

#### Real-time Session Tracking
```typescript
const sessionSubscription = supabase
  .channel('sessions_channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new.type === 'focus') {
        // Another device started a focus session
        handleConcurrentSession(payload.new);
      }
    }
  )
  .subscribe();
```

### 4.4 Custom Events

#### Presence System
```typescript
// Track user presence
const presenceChannel = supabase.channel('online_users', {
  config: {
    presence: {
      key: userId,
    },
  },
});

presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const presenceState = presenceChannel.presenceState();
    console.log('Online users:', Object.keys(presenceState));
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {
    console.log('User joined:', newPresences);
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }) => {
    console.log('User left:', leftPresences);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        userId: userId,
        lastSeen: new Date().toISOString(),
        currentTask: getCurrentTask()?.id || null
      });
    }
  });
```

#### Custom Broadcast Events
```typescript
// Send custom events
const broadcastChannel = supabase.channel('custom_events');

// Send achievement unlock
broadcastChannel.send({
  type: 'broadcast',
  event: 'achievement_unlocked',
  payload: {
    userId: userId,
    achievementId: 'first_week_streak',
    timestamp: new Date().toISOString()
  }
});

// Listen for custom events
broadcastChannel
  .on('broadcast', { event: 'achievement_unlocked' }, (payload) => {
    if (payload.userId === userId) {
      showAchievementNotification(payload.achievementId);
    }
  })
  .subscribe();
```

---

## 5. Data Models

### 5.1 Task Model

```typescript
interface Task {
  // Identity
  id: string;                    // UUID v4
  user_id: string;              // Foreign key to users
  version: number;               // Optimistic locking
  sync_status: 'pending' | 'synced' | 'conflict';
  
  // Basic Information
  title: string;                 // Max 200 characters
  description?: string;          // Max 2000 characters
  
  // Time Management
  estimated_duration: number;    // Minutes (5-480)
  actual_duration: number;       // Auto-tracked minutes
  
  // Classification
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
  category?: string;             // Max 50 characters
  tags?: string[];               // Max 10 tags
  
  // ADHD Features
  energy_level: 'low' | 'medium' | 'high';
  subtasks?: SubtaskData[];      // Auto-generated for tasks > 25 min
  
  // Scheduling
  scheduled_for?: string;        // ISO 8601 timestamp
  deadline?: string;             // ISO 8601 timestamp
  completed_at?: string;         // ISO 8601 timestamp
  
  // Timestamps
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
}

interface SubtaskData {
  id: string;
  title: string;
  duration: number;             // 15-25 minutes
  isCompleted: boolean;
  order: number;
}
```

### 5.2 Session Model

```typescript
interface Session {
  // Identity
  id: string;
  user_id: string;
  task_id?: string;             // Optional task association
  
  // Session Configuration
  type: 'focus' | 'short_break' | 'long_break' | 'custom';
  planned_duration: number;     // Seconds
  actual_duration: number;      // Seconds
  
  // Status Tracking
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled' | 'abandoned';
  
  // Time Tracking
  started_at: string;           // ISO 8601
  completed_at?: string;        // ISO 8601
  
  // Interruption Tracking
  interruptions?: InterruptionData[];
  
  // ADHD Metrics
  energy_before: 'low' | 'medium' | 'high';
  energy_after?: 'low' | 'medium' | 'high';
  focus_quality?: number;       // 1-5 rating
  
  // Metadata
  created_at: string;
}

interface InterruptionData {
  type: 'internal' | 'external' | 'break' | 'emergency';
  timestamp: string;            // ISO 8601
  duration: number;             // Seconds
  reason?: string;
}
```

### 5.3 Analytics Model

```typescript
interface Analytics {
  // Identity
  id: string;
  user_id: string;
  date: string;                 // YYYY-MM-DD format
  
  // Daily Statistics
  daily_stats?: {
    // Task Metrics
    tasksCreated: number;
    tasksCompleted: number;
    tasksPostponed: number;
    tasksCancelled: number;
    
    // Time Metrics
    totalFocusMinutes: number;
    totalBreakMinutes: number;
    longestFocusSession: number;
    
    // Pomodoro Metrics
    pomodorosPlanned: number;
    pomodorosCompleted: number;
    pomodoroCompletionRate: number;
    
    // Energy & Focus
    averageEnergyLevel: number;   // 1-3 scale
    averageFocusQuality: number;  // 1-5 scale
    peakProductivityHour: number; // 0-23
    
    // Categories
    categoriesWorkedOn: string[];
    mostProductiveCategory?: string;
  };
  
  // Weekly Insights
  weekly_insights?: {
    weekNumber: number;
    totalProductiveHours: number;
    taskCompletionRate: number;
    consistencyScore: number;     // 0-100
    mostProductiveDays: string[];
    improvementSuggestions: string[];
    weeklyGoalMet: boolean;
  };
  
  // Behavioral Patterns
  patterns?: {
    bestFocusTime: string[];      // ['morning', 'afternoon']
    commonDistractions: string[];
    productivityTrends: 'increasing' | 'stable' | 'decreasing';
    focusTrends: 'improving' | 'stable' | 'declining';
  };
  
  // Metadata
  created_at: string;
}
```

### 5.4 User Model

```typescript
interface User {
  // Identity
  id: string;                   // UUID from Supabase Auth
  email: string;
  name?: string;
  
  // Preferences
  preferences?: {
    // Timer Defaults
    defaultFocusDuration: number; // Minutes (15, 25, 45)
    defaultShortBreak: number;    // Minutes (5, 10, 15)
    defaultLongBreak: number;     // Minutes (20-30)
    cyclesBeforeLongBreak: number; // 3-4
    
    // Task Defaults
    defaultTaskDuration: number;
    autoSplitTasks: boolean;
    splitThreshold: number;       // Minutes
    
    // Notifications
    enableNotifications: boolean;
    soundEnabled: boolean;
    soundVolume: number;          // 0-100
    
    // UI Preferences
    theme: 'light' | 'dark' | 'auto';
    language: 'ko' | 'en';
    fontSize: 'small' | 'medium' | 'large';
    reducedMotion: boolean;
  };
  
  // Application Settings
  settings?: {
    // ADHD Profile
    energyPatterns: {
      morning: 'low' | 'medium' | 'high';
      afternoon: 'low' | 'medium' | 'high';
      evening: 'low' | 'medium' | 'high';
    };
    
    // Focus Preferences
    optimalFocusDuration: number;  // Minutes
    needsFrequentBreaks: boolean;
    distractionTriggers: string[];
    
    // Privacy & Sync
    cloudSyncEnabled: boolean;
    autoBackup: boolean;
    shareUsageData: boolean;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### 5.5 Backup Model

```typescript
interface Backup {
  // Identity
  id: string;
  user_id: string;
  
  // Backup Configuration
  backup_type: 'manual' | 'auto' | 'scheduled' | 'export';
  version: string;              // Schema version
  
  // Backup Data
  backup_data?: {
    version: string;
    timestamp: string;
    
    // Core Data
    tasks: Task[];
    sessions: Session[];
    analytics: Analytics[];
    user: User;
    
    // Statistics
    stats: {
      taskCount: number;
      sessionCount: number;
      totalFocusHours: number;
      dateRange: {
        start: string;
        end: string;
      };
    };
  };
  
  // Metadata
  created_at: string;
}
```

---

## 6. Error Handling

### 6.1 Error Response Format

```typescript
interface APIError {
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  status: number;
  statusText: string;
}
```

### 6.2 Common Error Codes

| Status Code | Error Code | Description | Solution |
|-------------|------------|-------------|----------|
| 400 | `PGRST102` | Invalid query parameter | Check parameter format |
| 401 | `invalid_token` | Authentication failed | Refresh access token |
| 403 | `insufficient_privilege` | Permission denied | Check RLS policies |
| 409 | `23505` | Unique constraint violation | Handle duplicate data |
| 422 | `PGRST201` | Invalid JSON | Validate request body |
| 429 | `rate_limit_exceeded` | Too many requests | Implement backoff |

### 6.3 Error Handling Examples

```typescript
// Basic error handling
try {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData);
    
  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
  
  return data;
} catch (error) {
  console.error('Task creation failed:', error);
  
  // Handle specific error types
  if (error.code === '23505') {
    throw new Error('Task with this ID already exists');
  }
  
  throw error;
}

// Advanced error handling with retry logic
async function createTaskWithRetry(taskData: CreateTaskRequest, retries = 3): Promise<Task> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      // Don't retry on client errors
      if (error.status < 500 && attempt === retries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (attempt === retries) {
        throw error;
      }
    }
  }
}

// Offline-first error handling
async function syncTasksWithErrorHandling() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .gte('updated_at', lastSyncTime);
      
    if (error) {
      throw error;
    }
    
    // Success - update local storage
    await updateLocalTasks(data);
    
  } catch (error) {
    if (error.name === 'NetworkError') {
      // Handle offline mode
      console.log('Working offline - sync will resume when online');
      return { offline: true, error: null };
    }
    
    // Log error for debugging
    console.error('Sync failed:', error);
    return { offline: false, error };
  }
}
```

---

## 7. Rate Limiting

### 7.1 Default Limits
Supabase implements the following rate limits:

| Resource | Anonymous | Authenticated | Pro Plan |
|----------|-----------|---------------|----------|
| Requests/minute | 60 | 200 | 700 |
| Concurrent connections | 60 | 200 | 700 |
| Database queries/minute | 30 | 100 | 500 |
| Realtime messages/minute | 60 | 200 | 700 |

### 7.2 Handling Rate Limits

```typescript
// Implement exponential backoff
class RateLimitHandler {
  private retryDelays = [1000, 2000, 4000, 8000]; // ms
  
  async executeWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // Check if it's a rate limit error
        if (error.status === 429 && attempt < maxRetries) {
          const delay = this.retryDelays[attempt] || 8000;
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await this.delay(delay);
          continue;
        }
        throw error;
      }
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage example
const rateLimitHandler = new RateLimitHandler();

const task = await rateLimitHandler.executeWithBackoff(async () => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
});
```

### 7.3 Batch Operations

```typescript
// Batch operations to reduce API calls
class BatchOperations {
  private taskQueue: Task[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds
  
  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  queueTask(task: Task) {
    this.taskQueue.push(task);
    
    if (this.taskQueue.length >= this.batchSize) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.taskQueue.length === 0) return;
    
    const batch = this.taskQueue.splice(0, this.batchSize);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .upsert(batch);
        
      if (error) {
        console.error('Batch operation failed:', error);
        // Re-queue failed items
        this.taskQueue.unshift(...batch);
      }
    } catch (error) {
      console.error('Batch operation error:', error);
      this.taskQueue.unshift(...batch);
    }
  }
}
```

---

## 8. Code Examples

### 8.1 Task Management Examples

#### Create Task with Auto-Split
```typescript
async function createTaskWithAutoSplit(taskData: CreateTaskRequest): Promise<Task> {
  // Auto-generate subtasks for tasks longer than 25 minutes
  if (taskData.estimated_duration > 25) {
    const subtaskCount = Math.ceil(taskData.estimated_duration / 25);
    const subtaskDuration = Math.floor(taskData.estimated_duration / subtaskCount);
    
    taskData.subtasks = Array.from({ length: subtaskCount }, (_, i) => ({
      id: `subtask-${i + 1}`,
      title: `Part ${i + 1}`,
      duration: subtaskDuration,
      isCompleted: false,
      order: i
    }));
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
  
  return data;
}

// Usage
const newTask = await createTaskWithAutoSplit({
  title: "Write comprehensive documentation",
  estimated_duration: 90, // Will be split into ~4 subtasks
  priority: "high",
  category: "documentation"
});
```

#### Complete Task with Analytics
```typescript
async function completeTaskWithAnalytics(taskId: string): Promise<void> {
  const completedAt = new Date().toISOString();
  
  // Update task status
  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: completedAt
    })
    .eq('id', taskId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to complete task: ${error.message}`);
  }
  
  // Update daily analytics
  const today = new Date().toISOString().split('T')[0];
  await updateDailyStats(today, {
    tasksCompleted: 1,
    categoriesWorkedOn: [task.category]
  });
  
  // Check for achievements
  await checkTaskCompletionAchievements(task);
}

async function updateDailyStats(date: string, updates: Partial<DailyStats>) {
  const { data: existing } = await supabase
    .from('analytics')
    .select('daily_stats')
    .eq('date', date)
    .single();
    
  const currentStats = existing?.daily_stats || {};
  const newStats = {
    ...currentStats,
    tasksCompleted: (currentStats.tasksCompleted || 0) + (updates.tasksCompleted || 0),
    categoriesWorkedOn: [
      ...(currentStats.categoriesWorkedOn || []),
      ...(updates.categoriesWorkedOn || [])
    ].filter((value, index, self) => self.indexOf(value) === index)
  };
  
  await supabase
    .from('analytics')
    .upsert({
      date,
      daily_stats: newStats
    });
}
```

### 8.2 Timer Session Examples

#### Start Focus Session
```typescript
async function startFocusSession(
  taskId?: string,
  duration: number = 1500 // 25 minutes default
): Promise<Session> {
  const sessionData = {
    task_id: taskId,
    type: 'focus' as const,
    planned_duration: duration,
    energy_before: getCurrentEnergyLevel(),
    started_at: new Date().toISOString(),
    status: 'active' as const
  };
  
  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to start session: ${error.message}`);
  }
  
  // Set up local timer
  startLocalTimer(data.id, duration);
  
  // Send notification when session ends
  setTimeout(() => {
    showNotification('Focus session complete!', {
      body: 'Time for a break',
      actions: [
        { action: 'break', title: 'Take Break' },
        { action: 'continue', title: 'Continue Working' }
      ]
    });
  }, duration * 1000);
  
  return data;
}
```

#### Complete Session with Metrics
```typescript
async function completeSession(
  sessionId: string,
  actualDuration: number,
  interruptions: InterruptionData[] = [],
  focusQuality?: number
): Promise<Session> {
  const completedAt = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      actual_duration: actualDuration,
      completed_at: completedAt,
      interruptions,
      focus_quality: focusQuality,
      energy_after: getCurrentEnergyLevel()
    })
    .eq('id', sessionId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to complete session: ${error.message}`);
  }
  
  // Update task actual duration if linked
  if (data.task_id) {
    await supabase
      .from('tasks')
      .update({
        actual_duration: supabase.raw(`actual_duration + ${Math.floor(actualDuration / 60)}`)
      })
      .eq('id', data.task_id);
  }
  
  return data;
}
```

### 8.3 Real-time Synchronization

#### Sync Manager Implementation
```typescript
class SyncManager {
  private isOnline = navigator.onLine;
  private syncQueue: SyncOperation[] = [];
  private lastSyncTime: string;
  
  constructor(private supabase: SupabaseClient) {
    this.setupEventListeners();
    this.startPeriodicSync();
  }
  
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
  
  async queueOperation(operation: SyncOperation) {
    this.syncQueue.push(operation);
    
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }
  
  private async processSyncQueue() {
    while (this.syncQueue.length > 0 && this.isOnline) {
      const operation = this.syncQueue.shift()!;
      
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Re-queue the operation
        this.syncQueue.unshift(operation);
        break;
      }
    }
  }
  
  private async executeOperation(operation: SyncOperation) {
    const { table, type, data } = operation;
    
    switch (type) {
      case 'INSERT':
        await this.supabase.from(table).insert(data);
        break;
      case 'UPDATE':
        await this.supabase.from(table).update(data).eq('id', data.id);
        break;
      case 'DELETE':
        await this.supabase.from(table).delete().eq('id', data.id);
        break;
    }
  }
  
  private startPeriodicSync() {
    setInterval(async () => {
      if (this.isOnline) {
        await this.pullRemoteChanges();
      }
    }, 30000); // Sync every 30 seconds
  }
  
  private async pullRemoteChanges() {
    const tables = ['tasks', 'sessions', 'analytics'];
    
    for (const table of tables) {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .gte('updated_at', this.lastSyncTime)
        .order('updated_at', { ascending: true });
        
      if (error) {
        console.error(`Failed to sync ${table}:`, error);
        continue;
      }
      
      // Update local storage
      for (const item of data) {
        await this.updateLocalItem(table, item);
      }
    }
    
    this.lastSyncTime = new Date().toISOString();
  }
  
  private async updateLocalItem(table: string, item: any) {
    // Update IndexedDB
    const db = await this.getIndexedDB();
    const transaction = db.transaction(table, 'readwrite');
    const store = transaction.objectStore(table);
    await store.put(item);
    
    // Update Redux store
    const action = this.createUpdateAction(table, item);
    store.dispatch(action);
  }
}

interface SyncOperation {
  table: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: string;
}
```

### 8.4 Bulk Operations

#### Bulk Task Import
```typescript
async function importTasks(tasks: CreateTaskRequest[]): Promise<ImportResult> {
  const BATCH_SIZE = 100;
  const results: ImportResult = {
    successful: 0,
    failed: 0,
    errors: []
  };
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(batch)
        .select();
        
      if (error) {
        results.failed += batch.length;
        results.errors.push({
          batch: i / BATCH_SIZE + 1,
          error: error.message
        });
      } else {
        results.successful += data.length;
        
        // Update local storage
        for (const task of data) {
          await updateLocalTask(task);
        }
      }
    } catch (error) {
      results.failed += batch.length;
      results.errors.push({
        batch: i / BATCH_SIZE + 1,
        error: error.message
      });
    }
    
    // Avoid rate limits
    if (i + BATCH_SIZE < tasks.length) {
      await delay(100);
    }
  }
  
  return results;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: Array<{
    batch: number;
    error: string;
  }>;
}
```

---

## 9. Integration Patterns

### 9.1 Service Layer Pattern

```typescript
// Base service class
abstract class BaseService {
  constructor(
    protected supabase: SupabaseClient,
    protected store: AppStore
  ) {}
  
  protected async executeWithFallback<T>(
    cloudOperation: () => Promise<T>,
    localFallback: () => Promise<T>
  ): Promise<T> {
    try {
      if (navigator.onLine) {
        return await cloudOperation();
      }
    } catch (error) {
      console.warn('Cloud operation failed, using local fallback:', error);
    }
    
    return await localFallback();
  }
}

// Task service implementation
class TaskService extends BaseService {
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    return this.executeWithFallback(
      // Cloud operation
      async () => {
        const { data, error } = await this.supabase
          .from('tasks')
          .insert(taskData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Update local storage
        await this.updateLocalTask(data);
        
        return data;
      },
      // Local fallback
      async () => {
        const task: Task = {
          ...taskData,
          id: generateUUID(),
          sync_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1
        };
        
        // Store locally
        await this.updateLocalTask(task);
        
        // Queue for sync
        await this.queueForSync('tasks', 'INSERT', task);
        
        return task;
      }
    );
  }
  
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    return this.executeWithFallback(
      // Cloud operation
      async () => {
        let query = this.supabase.from('tasks').select('*');
        
        if (filters) {
          query = this.applyFilters(query, filters);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Update local cache
        for (const task of data) {
          await this.updateLocalTask(task);
        }
        
        return data;
      },
      // Local fallback
      async () => {
        const localTasks = await this.getLocalTasks();
        return this.filterTasks(localTasks, filters);
      }
    );
  }
  
  private applyFilters(query: any, filters: TaskFilters) {
    if (filters.status) {
      query = query.in('status', filters.status);
    }
    
    if (filters.priority) {
      query = query.in('priority', filters.priority);
    }
    
    if (filters.dateRange) {
      query = query
        .gte('scheduled_for', filters.dateRange.start.toISOString())
        .lte('scheduled_for', filters.dateRange.end.toISOString());
    }
    
    if (filters.search) {
      query = query.textSearch('title', filters.search);
    }
    
    if (filters.sortBy) {
      const ascending = filters.sortOrder === 'asc';
      query = query.order(filters.sortBy, { ascending });
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }
    
    return query;
  }
}
```

### 9.2 Repository Pattern

```typescript
// Generic repository interface
interface IRepository<T> {
  create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filters?: any): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Supabase repository implementation
class SupabaseRepository<T> implements IRepository<T> {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string
  ) {}
  
  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }
    
    return data;
  }
  
  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }
    
    return data;
  }
  
  async findMany(filters?: any): Promise<T[]> {
    let query = this.supabase.from(this.tableName).select('*');
    
    if (filters) {
      // Apply filters dynamically
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }
    
    return data;
  }
  
  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }
    
    return data;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
      
    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }
}

// Usage
const taskRepository = new SupabaseRepository<Task>(supabase, 'tasks');
const sessionRepository = new SupabaseRepository<Session>(supabase, 'sessions');
```

### 9.3 Cache-First Pattern

```typescript
class CacheFirstService<T> {
  private cache = new Map<string, CachedItem<T>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  constructor(
    private repository: IRepository<T>,
    private cacheKey: (item: T) => string
  ) {}
  
  async findById(id: string): Promise<T | null> {
    // Check cache first
    const cached = this.cache.get(id);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    // Fetch from repository
    const item = await this.repository.findById(id);
    
    if (item) {
      // Update cache
      this.cache.set(id, {
        data: item,
        timestamp: Date.now()
      });
    }
    
    return item;
  }
  
  async findMany(filters?: any): Promise<T[]> {
    // For lists, always fetch fresh data but use cache for individual items
    const items = await this.repository.findMany(filters);
    
    // Update cache with fresh items
    items.forEach(item => {
      const key = this.cacheKey(item);
      this.cache.set(key, {
        data: item,
        timestamp: Date.now()
      });
    });
    
    return items;
  }
  
  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const created = await this.repository.create(item);
    
    // Update cache
    const key = this.cacheKey(created);
    this.cache.set(key, {
      data: created,
      timestamp: Date.now()
    });
    
    return created;
  }
  
  async update(id: string, updates: Partial<T>): Promise<T> {
    const updated = await this.repository.update(id, updates);
    
    // Update cache
    this.cache.set(id, {
      data: updated,
      timestamp: Date.now()
    });
    
    return updated;
  }
  
  invalidateCache(id: string) {
    this.cache.delete(id);
  }
  
  clearCache() {
    this.cache.clear();
  }
  
  private isExpired(cached: CachedItem<T>): boolean {
    return Date.now() - cached.timestamp > this.TTL;
  }
}

interface CachedItem<T> {
  data: T;
  timestamp: number;
}
```

---

## 10. SDK Reference

### 10.1 Supabase Client Configuration

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'adhd-time-manager@1.0.0'
      }
    }
  }
);
```

### 10.2 Type-Safe Database Operations

```typescript
// Type-safe database operations using generated types
import { Database } from './types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type CreateTask = Database['public']['Tables']['tasks']['Insert'];
type UpdateTask = Database['public']['Tables']['tasks']['Update'];

// Type-safe queries
const { data: tasks, error } = await supabase
  .from('tasks')
  .select(`
    id,
    title,
    status,
    priority,
    estimated_duration,
    subtasks,
    created_at,
    updated_at
  `)
  .eq('status', 'pending')
  .order('priority', { ascending: false });

// Type-safe inserts
const newTask: CreateTask = {
  title: 'New task',
  estimated_duration: 30,
  priority: 'medium'
};

const { data, error } = await supabase
  .from('tasks')
  .insert(newTask)
  .select()
  .single();
```

### 10.3 Custom Hooks for React Integration

```typescript
// useSupabaseQuery hook
function useSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const query = useCallback(async () => {
    if (!options?.enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, options?.enabled]);
  
  useEffect(() => {
    query();
    
    if (options?.refetchInterval) {
      const interval = setInterval(query, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [query, options?.refetchInterval]);
  
  return { data, loading, error, refetch: query };
}

// useTasks hook
function useTasks(filters?: TaskFilters) {
  return useSupabaseQuery(
    ['tasks', JSON.stringify(filters)],
    async () => {
      let query = supabase.from('tasks').select('*');
      
      if (filters?.status) {
        query = query.in('status', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      enabled: true,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 5000 // Consider data stale after 5 seconds
    }
  );
}

// useTaskMutation hook
function useTaskMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const createTask = useCallback(async (taskData: CreateTask) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateTask = useCallback(async (id: string, updates: UpdateTask) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    createTask,
    updateTask,
    loading,
    error
  };
}

// Usage in components
function TaskList() {
  const { data: tasks, loading, error } = useTasks({ status: ['pending'] });
  const { createTask, updateTask } = useTaskMutation();
  
  const handleCreateTask = async (taskData: CreateTask) => {
    try {
      await createTask(taskData);
      // Task list will automatically refetch
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {tasks?.map(task => (
        <TaskItem key={task.id} task={task} onUpdate={updateTask} />
      ))}
    </div>
  );
}
```

### 10.4 Realtime Subscriptions

```typescript
// useSupabaseSubscription hook
function useSupabaseSubscription<T>(
  channel: string,
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter })
        },
        (payload) => {
          console.log(`${table} change:`, payload);
          callback?.(payload);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, table, filter, callback]);
}

// useTaskSubscription hook
function useTaskSubscription(userId: string) {
  const dispatch = useAppDispatch();
  
  useSupabaseSubscription(
    'tasks_channel',
    'tasks',
    `user_id=eq.${userId}`,
    (payload) => {
      switch (payload.eventType) {
        case 'INSERT':
          dispatch(addTask(payload.new));
          break;
        case 'UPDATE':
          dispatch(updateTask({ id: payload.new.id, updates: payload.new }));
          break;
        case 'DELETE':
          dispatch(removeTask(payload.old.id));
          break;
      }
    }
  );
}
```

---

## Additional Resources

### API Testing
- Use Postman collection: [Download Collection](https://documenter.getpostman.com/view/your-collection-id)
- Supabase REST API documentation: https://supabase.com/docs/guides/api
- API playground: Available in Supabase dashboard

### TypeScript Types
- Generate types: `npx supabase gen types typescript --project-id=xjxxamqitqxwzmvjmeuw > src/types/supabase.ts`
- Update types when schema changes
- Use strict TypeScript configuration

### Performance Monitoring
- Monitor API performance in Supabase dashboard
- Set up alerts for high latency or error rates
- Use browser dev tools for client-side performance

### Security Best Practices
- Never expose service role key in client
- Implement proper RLS policies
- Validate all user inputs
- Use HTTPS only in production
- Regularly rotate API keys

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Production Ready

---

This API documentation provides comprehensive coverage of all endpoints, patterns, and integration approaches for the ADHD Time Manager application. For specific implementation questions or updates, please refer to the technical specifications and database design documents.