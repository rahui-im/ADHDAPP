# Database Design Document: ADHD Time Manager

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Database Architecture](#2-database-architecture)
3. [Storage Strategy](#3-storage-strategy)
4. [Schema Design](#4-schema-design)
5. [IndexedDB Schema](#5-indexeddb-schema)
6. [LocalStorage Schema](#6-localstorage-schema)
7. [Data Relationships](#7-data-relationships)
8. [Data Validation Rules](#8-data-validation-rules)
9. [Performance Optimization](#9-performance-optimization)
10. [Migration Strategy](#10-migration-strategy)
11. [Backup & Recovery](#11-backup-recovery)
12. [Future Scalability](#12-future-scalability)

---

## 1. Executive Summary

### 1.1 Purpose
이 문서는 ADHD Time Manager MVP의 데이터베이스 설계를 정의합니다.
오프라인 우선 PWA를 위한 브라우저 기반 저장소 설계에 중점을 둡니다.

### 1.2 Scope
- **Primary Storage**: IndexedDB (대용량 데이터)
- **Secondary Storage**: LocalStorage (설정 및 캐시)
- **Future Storage**: Supabase PostgreSQL (클라우드 동기화)

### 1.3 Key Requirements
- ✅ 오프라인 전체 기능 지원
- ✅ 10,000+ 작업 저장 가능
- ✅ 1년치 세션 데이터 저장
- ✅ 3초 이내 쿼리 응답
- ✅ 자동 백업 및 복구

---

## 2. Database Architecture

### 2.1 Multi-Tier Storage Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
├─────────────────────────────────────────────────────────┤
│                    Storage Service                        │
├────────────────┬──────────────────┬────────────────────┤
│   IndexedDB    │   LocalStorage   │  SessionStorage    │
│  (Main Data)   │   (Settings)     │   (Temp Data)      │
├────────────────┴──────────────────┴────────────────────┤
│              Future: Supabase PostgreSQL                 │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Architecture
```typescript
// Write Path
User Input 
  → Validation Layer 
  → Storage Service 
  → IndexedDB Transaction 
  → Success Callback
  → Redux State Update

// Read Path  
Component Request
  → Redux Selector (Cache Check)
  → Storage Service
  → IndexedDB Query
  → Data Transformation
  → Component Update
```

### 2.3 Storage Distribution

| Data Type | Storage | Size Limit | Persistence |
|-----------|---------|------------|-------------|
| Tasks | IndexedDB | ~50% disk | Permanent |
| Sessions | IndexedDB | ~50% disk | Permanent |
| Analytics | IndexedDB | ~50% disk | Permanent |
| User Settings | LocalStorage | 10MB | Permanent |
| Preferences | LocalStorage | 10MB | Permanent |
| Theme | LocalStorage | 10MB | Permanent |
| Temp State | SessionStorage | 10MB | Session |
| Form Drafts | SessionStorage | 10MB | Session |

---

## 3. Storage Strategy

### 3.1 IndexedDB Strategy
```javascript
// Database Configuration
const DB_CONFIG = {
  name: 'ADHDTimeManagerDB',
  version: 1,
  stores: {
    tasks: { keyPath: 'id', autoIncrement: false },
    sessions: { keyPath: 'id', autoIncrement: false },
    analytics: { keyPath: 'date', autoIncrement: false },
    backups: { keyPath: 'id', autoIncrement: false },
    attachments: { keyPath: 'id', autoIncrement: false }
  }
};

// Storage Limits
const STORAGE_LIMITS = {
  maxTasksPerUser: 10000,
  maxSessionsPerTask: 1000,
  maxAttachmentSize: 5 * 1024 * 1024, // 5MB
  maxBackupCount: 10,
  dataRetentionDays: 365
};
```

### 3.2 LocalStorage Strategy
```javascript
// LocalStorage Keys Structure
const STORAGE_KEYS = {
  // User Data
  'adhd_user': UserProfile,
  'adhd_preferences': UserPreferences,
  'adhd_settings': UserSettings,
  
  // App State
  'adhd_theme': 'light' | 'dark' | 'auto',
  'adhd_language': 'ko' | 'en',
  'adhd_onboarding': OnboardingState,
  
  // Cache
  'adhd_last_sync': ISO8601,
  'adhd_cache_version': string,
  
  // Feature Flags
  'adhd_features': FeatureFlags
};
```

---

## 4. Schema Design

### 4.1 Core Tables

#### TASKS Table
```typescript
interface TaskSchema {
  // Primary Key
  id: string;                    // UUID v4, PRIMARY KEY
  
  // Version Control
  version: number;                // Optimistic locking
  revision: number;               // Change tracking
  
  // Core Fields
  title: string;                  // NOT NULL, VARCHAR(200)
  description: string | null;     // TEXT, max 2000 chars
  
  // Time Management
  estimatedDuration: number;      // INTEGER, minutes, CHECK >= 5 AND <= 480
  actualDuration: number;         // INTEGER, minutes, DEFAULT 0
  timeSpent: number;             // INTEGER, cumulative minutes
  
  // Classification
  priority: 'low' | 'medium' | 'high' | 'urgent'; // ENUM
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'archived'; // ENUM
  category: string;               // VARCHAR(50)
  tags: string[];                 // JSON array, max 10 items
  
  // ADHD Features
  energyLevel: 'low' | 'medium' | 'high'; // ENUM
  focusLevel: 1 | 2 | 3 | 4 | 5; // INTEGER
  isFlexible: boolean;            // BOOLEAN
  needsQuietEnvironment: boolean; // BOOLEAN
  
  // Subtasks (Auto-split)
  subtasks: {
    id: string;
    title: string;
    duration: number;           // 15-25 minutes
    order: number;
    isCompleted: boolean;
    completedAt: string | null;
  }[];                          // JSON array
  
  // Scheduling
  scheduledFor: string | null;   // ISO 8601
  deadline: string | null;       // ISO 8601
  startedAt: string | null;      // ISO 8601
  completedAt: string | null;    // ISO 8601
  
  // Relationships
  parentId: string | null;       // FOREIGN KEY -> tasks.id
  projectId: string | null;      // FOREIGN KEY -> projects.id
  dependencies: string[];        // JSON array of task IDs
  blockedBy: string[];          // JSON array of task IDs
  
  // Recurrence
  recurring: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    daysOfWeek: number[];       // 0-6
    endDate: string | null;
    nextDue: string | null;
  } | null;                     // JSON object
  
  // User Data
  userId: string;               // NOT NULL
  assignedTo: string | null;    // For future collaboration
  
  // Metadata
  notes: string | null;         // TEXT, max 5000 chars
  attachments: string[];        // JSON array of attachment IDs
  location: string | null;      // VARCHAR(100)
  reminder: {
    enabled: boolean;
    time: string;
    type: 'notification' | 'email' | 'both';
  } | null;                     // JSON object
  
  // Statistics
  postponedCount: number;       // INTEGER, DEFAULT 0
  completionRate: number;       // FLOAT, 0-100
  averageFocusQuality: number;  // FLOAT, 1-5
  
  // Timestamps
  createdAt: string;            // ISO 8601, NOT NULL
  updatedAt: string;            // ISO 8601, NOT NULL
  deletedAt: string | null;     // ISO 8601, soft delete
  
  // Sync
  lastSyncedAt: string | null;  // ISO 8601
  syncStatus: 'pending' | 'synced' | 'conflict'; // ENUM
  cloudId: string | null;       // Supabase ID
}

// Indexes
CREATE INDEX idx_tasks_user_id ON tasks(userId);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_scheduled ON tasks(scheduledFor);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_created ON tasks(createdAt);
CREATE INDEX idx_tasks_deleted ON tasks(deletedAt);
CREATE INDEX idx_tasks_parent ON tasks(parentId);
```

#### SESSIONS Table
```typescript
interface SessionSchema {
  // Primary Key
  id: string;                    // UUID v4, PRIMARY KEY
  
  // References
  taskId: string | null;         // FOREIGN KEY -> tasks.id
  userId: string;                // NOT NULL
  
  // Session Type
  type: 'focus' | 'short_break' | 'long_break' | 'custom'; // ENUM
  mode: 'pomodoro' | 'flowtime' | 'timeboxing'; // ENUM
  
  // Duration (seconds)
  plannedDuration: number;       // INTEGER, seconds
  actualDuration: number;        // INTEGER, seconds
  pausedDuration: number;        // INTEGER, total pause time
  overtime: number;              // INTEGER, seconds over planned
  
  // Session State
  status: 'planned' | 'active' | 'paused' | 'completed' | 'abandoned'; // ENUM
  completionRate: number;        // FLOAT, 0-100
  
  // Interruptions
  interruptions: {
    id: string;
    type: 'internal' | 'external' | 'break' | 'emergency';
    timestamp: string;
    duration: number;
    reason: string | null;
    severity: 1 | 2 | 3 | 4 | 5;
  }[];                          // JSON array
  interruptionCount: number;     // INTEGER
  
  // ADHD Metrics
  energyBefore: 'low' | 'medium' | 'high'; // ENUM
  energyAfter: 'low' | 'medium' | 'high' | null; // ENUM
  focusQuality: 1 | 2 | 3 | 4 | 5 | null; // INTEGER
  distractionLevel: 1 | 2 | 3 | 4 | 5; // INTEGER
  
  // Environmental Factors
  environment: {
    noise: 'quiet' | 'moderate' | 'loud';
    location: string | null;
    temperature: 'cold' | 'comfortable' | 'hot' | null;
    lighting: 'dim' | 'moderate' | 'bright' | null;
  } | null;                     // JSON object
  
  // Pomodoro Tracking
  pomodoroNumber: number | null; // INTEGER, which pomodoro in sequence
  cycleNumber: number | null;    // INTEGER, which cycle (4 pomodoros)
  dailySessionNumber: number;    // INTEGER, session count for the day
  
  // Time Tracking
  startedAt: string;             // ISO 8601, NOT NULL
  pausedAt: string[];            // JSON array of ISO 8601
  resumedAt: string[];           // JSON array of ISO 8601
  completedAt: string | null;    // ISO 8601
  
  // Notes & Reflection
  notes: string | null;          // TEXT, max 1000 chars
  reflection: {
    whatWentWell: string | null;
    whatCouldImprove: string | null;
    nextSessionGoal: string | null;
  } | null;                     // JSON object
  
  // Metadata
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  syncedAt: string | null;      // ISO 8601
}

// Indexes
CREATE INDEX idx_sessions_user ON sessions(userId);
CREATE INDEX idx_sessions_task ON sessions(taskId);
CREATE INDEX idx_sessions_started ON sessions(startedAt);
CREATE INDEX idx_sessions_type ON sessions(type);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_date ON sessions(date(startedAt));
```

#### ANALYTICS Table
```typescript
interface AnalyticsSchema {
  // Primary Key (Composite)
  userId: string;                // NOT NULL
  date: string;                  // DATE (YYYY-MM-DD), NOT NULL
  
  // Daily Statistics
  dailyStats: {
    // Task Metrics
    tasksCreated: number;
    tasksCompleted: number;
    tasksPostponed: number;
    tasksCancelled: number;
    
    // Time Metrics
    totalFocusMinutes: number;
    totalBreakMinutes: number;
    totalActiveMinutes: number;
    longestFocusSession: number;
    
    // Pomodoro Metrics
    pomodorosPlanned: number;
    pomodorosCompleted: number;
    pomodoroCompletionRate: number;
    
    // Energy & Focus
    averageEnergyLevel: number;  // 1-3 scale
    averageFocusQuality: number; // 1-5 scale
    peakProductivityHour: number; // 0-23
    
    // Interruptions
    totalInterruptions: number;
    internalInterruptions: number;
    externalInterruptions: number;
    
    // Categories
    categoriesWorkedOn: string[];
    mostProductiveCategory: string | null;
  };
  
  // Hourly Breakdown
  hourlyBreakdown: {
    hour: number;                // 0-23
    focusMinutes: number;
    tasksCompleted: number;
    energyLevel: number;
    interruptions: number;
  }[];                          // JSON array, 24 items
  
  // Task Distribution
  taskDistribution: {
    byPriority: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
    byStatus: {
      completed: number;
      inProgress: number;
      pending: number;
      cancelled: number;
    };
    byCategory: Record<string, number>;
  };
  
  // Session Patterns
  sessionPatterns: {
    averageSessionLength: number;
    preferredSessionType: string;
    optimalBreakLength: number;
    consistencyScore: number;    // 0-100
  };
  
  // Weekly Aggregates (computed on Sunday)
  weeklyInsights: {
    weekNumber: number;
    totalProductiveHours: number;
    taskCompletionRate: number;
    mostProductiveDays: string[];
    improvementSuggestions: string[];
    weeklyGoalMet: boolean;
  } | null;
  
  // Monthly Aggregates (computed on last day)
  monthlyInsights: {
    month: number;
    year: number;
    totalTasks: number;
    totalHours: number;
    topCategories: string[];
    streakDays: number;
    trends: {
      productivity: 'increasing' | 'stable' | 'decreasing';
      focus: 'improving' | 'stable' | 'declining';
    };
  } | null;
  
  // Metadata
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  processedAt: string | null;   // When aggregations were computed
}

// Indexes
CREATE UNIQUE INDEX idx_analytics_user_date ON analytics(userId, date);
CREATE INDEX idx_analytics_week ON analytics(strftime('%Y-%W', date));
CREATE INDEX idx_analytics_month ON analytics(strftime('%Y-%m', date));
```

#### USER_SETTINGS Table
```typescript
interface UserSettingsSchema {
  // Primary Key
  userId: string;                // PRIMARY KEY
  
  // Profile
  profile: {
    name: string;
    email: string | null;
    avatar: string | null;
    timezone: string;            // IANA timezone
    locale: 'ko' | 'en';
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  
  // ADHD Profile
  adhdProfile: {
    diagnosisType: 'adhd-i' | 'adhd-h' | 'adhd-c' | 'unspecified';
    
    // Energy Patterns
    energyPatterns: {
      morning: 'low' | 'medium' | 'high';
      afternoon: 'low' | 'medium' | 'high';
      evening: 'low' | 'medium' | 'high';
      night: 'low' | 'medium' | 'high';
    };
    
    // Focus Preferences
    optimalFocusDuration: number; // minutes
    optimalBreakDuration: number; // minutes
    needsFrequentBreaks: boolean;
    
    // Environmental Needs
    environmentalNeeds: {
      quietSpace: boolean;
      movement: boolean;
      fidgetTools: boolean;
      backgroundNoise: 'none' | 'white' | 'brown' | 'music';
    };
    
    // Challenges
    primaryChallenges: string[];  // ['hyperfocus', 'distraction', 'procrastination', etc.]
    
    // Medication Tracking
    medication: {
      enabled: boolean;
      reminders: {
        time: string;
        name: string;
        dosage: string;
      }[] | null;
    };
  };
  
  // Timer Preferences
  timerPreferences: {
    defaultFocusDuration: number; // minutes
    defaultShortBreak: number;
    defaultLongBreak: number;
    cyclesBeforeLongBreak: number;
    
    // Sounds
    soundEnabled: boolean;
    soundVolume: number;          // 0-100
    soundType: 'bell' | 'chime' | 'beep' | 'custom';
    customSoundUrl: string | null;
    
    // Notifications
    desktopNotifications: boolean;
    soundNotifications: boolean;
    vibrationEnabled: boolean;
    
    // Auto-behaviors
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    skipBreaks: boolean;
  };
  
  // Task Preferences
  taskPreferences: {
    defaultTaskDuration: number;
    autoSplitLongTasks: boolean;
    splitThreshold: number;       // minutes
    
    // Categories
    customCategories: string[];
    defaultCategory: string;
    colorCoding: Record<string, string>; // category -> color
    
    // Priorities
    defaultPriority: 'low' | 'medium' | 'high';
    urgentThresholdHours: number;
  };
  
  // UI Preferences
  uiPreferences: {
    theme: 'light' | 'dark' | 'auto' | 'high-contrast';
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    reducedMotion: boolean;
    compactMode: boolean;
    sidebarCollapsed: boolean;
    
    // Dashboard
    dashboardLayout: string[];    // Widget order
    hiddenWidgets: string[];
    
    // Colors
    accentColor: string;
    dangerColor: string;
    successColor: string;
  };
  
  // Accessibility
  accessibility: {
    screenReaderMode: boolean;
    keyboardNavigation: boolean;
    highContrast: boolean;
    focusIndicators: 'default' | 'enhanced';
    
    // Shortcuts
    customShortcuts: Record<string, string>;
  };
  
  // Privacy & Data
  privacy: {
    analyticsEnabled: boolean;
    crashReportsEnabled: boolean;
    shareUsageData: boolean;
    
    // Backup
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupRetention: number;      // days
  };
  
  // Experimental Features
  experimentalFeatures: {
    aiSuggestions: boolean;
    collaborationMode: boolean;
    advancedAnalytics: boolean;
    cloudSync: boolean;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastResetAt: string | null;
  version: number;                // Settings version for migration
}

// This is stored in LocalStorage as a single JSON object
```

#### BACKUPS Table
```typescript
interface BackupSchema {
  // Primary Key
  id: string;                    // UUID v4, PRIMARY KEY
  
  // Backup Info
  userId: string;                // NOT NULL
  name: string;                  // VARCHAR(100)
  type: 'manual' | 'auto' | 'scheduled' | 'export'; // ENUM
  
  // Data
  data: {
    version: string;             // Schema version
    timestamp: string;           // ISO 8601
    
    // Included Data
    tasks: TaskSchema[];
    sessions: SessionSchema[];
    analytics: AnalyticsSchema[];
    settings: UserSettingsSchema;
    
    // Metadata
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
  
  // Compression
  compressed: boolean;
  compressionType: 'gzip' | 'none';
  sizeBytes: number;
  
  // Restore Info
  restorable: boolean;
  lastRestoredAt: string | null;
  restoreCount: number;
  
  // Metadata
  createdAt: string;             // ISO 8601
  expiresAt: string | null;      // ISO 8601
  notes: string | null;
}

// Indexes
CREATE INDEX idx_backups_user ON backups(userId);
CREATE INDEX idx_backups_created ON backups(createdAt DESC);
CREATE INDEX idx_backups_type ON backups(type);
```

---

## 5. IndexedDB Schema

### 5.1 Database Initialization
```javascript
class DatabaseManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ADHDTimeManagerDB';
  private readonly DB_VERSION = 1;
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }
  
  private createStores(db: IDBDatabase): void {
    // Tasks Store
    if (!db.objectStoreNames.contains('tasks')) {
      const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
      taskStore.createIndex('userId', 'userId', { unique: false });
      taskStore.createIndex('status', 'status', { unique: false });
      taskStore.createIndex('priority', 'priority', { unique: false });
      taskStore.createIndex('scheduledFor', 'scheduledFor', { unique: false });
      taskStore.createIndex('category', 'category', { unique: false });
      taskStore.createIndex('createdAt', 'createdAt', { unique: false });
      taskStore.createIndex('deletedAt', 'deletedAt', { unique: false });
      
      // Compound indexes
      taskStore.createIndex('userStatus', ['userId', 'status'], { unique: false });
      taskStore.createIndex('userCategory', ['userId', 'category'], { unique: false });
    }
    
    // Sessions Store
    if (!db.objectStoreNames.contains('sessions')) {
      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('userId', 'userId', { unique: false });
      sessionStore.createIndex('taskId', 'taskId', { unique: false });
      sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
      sessionStore.createIndex('type', 'type', { unique: false });
      sessionStore.createIndex('status', 'status', { unique: false });
      
      // Compound indexes
      sessionStore.createIndex('userTask', ['userId', 'taskId'], { unique: false });
      sessionStore.createIndex('userDate', ['userId', 'startedAt'], { unique: false });
    }
    
    // Analytics Store
    if (!db.objectStoreNames.contains('analytics')) {
      const analyticsStore = db.createObjectStore('analytics', { 
        keyPath: ['userId', 'date'] 
      });
      analyticsStore.createIndex('userId', 'userId', { unique: false });
      analyticsStore.createIndex('date', 'date', { unique: false });
    }
    
    // Backups Store
    if (!db.objectStoreNames.contains('backups')) {
      const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
      backupStore.createIndex('userId', 'userId', { unique: false });
      backupStore.createIndex('createdAt', 'createdAt', { unique: false });
      backupStore.createIndex('type', 'type', { unique: false });
    }
    
    // Attachments Store
    if (!db.objectStoreNames.contains('attachments')) {
      const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
      attachmentStore.createIndex('taskId', 'taskId', { unique: false });
      attachmentStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
    }
  }
}
```

### 5.2 Transaction Management
```javascript
class TransactionManager {
  async executeTransaction<T>(
    db: IDBDatabase,
    stores: string[],
    mode: IDBTransactionMode,
    operation: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(stores, mode);
      let result: T;
      
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      operation(transaction)
        .then(res => { result = res; })
        .catch(reject);
    });
  }
  
  // Batch operations with transaction
  async batchInsert<T>(
    db: IDBDatabase,
    storeName: string,
    items: T[]
  ): Promise<void> {
    return this.executeTransaction(
      db,
      [storeName],
      'readwrite',
      async (tx) => {
        const store = tx.objectStore(storeName);
        await Promise.all(items.map(item => store.add(item)));
      }
    );
  }
}
```

---

## 6. LocalStorage Schema

### 6.1 Key Structure
```typescript
// LocalStorage Key Registry
const LOCAL_STORAGE_SCHEMA = {
  // User & Auth
  'adhd_user': {
    type: 'object',
    maxSize: 1024,      // 1KB
    schema: UserProfile
  },
  
  // Preferences (Frequently accessed)
  'adhd_theme': {
    type: 'string',
    enum: ['light', 'dark', 'auto', 'high-contrast'],
    default: 'auto'
  },
  
  'adhd_language': {
    type: 'string',
    enum: ['ko', 'en'],
    default: 'ko'
  },
  
  'adhd_timezone': {
    type: 'string',
    default: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
  
  // Settings (Less frequent)
  'adhd_settings': {
    type: 'object',
    maxSize: 10240,    // 10KB
    schema: UserSettings,
    compress: true
  },
  
  // Cache & Performance
  'adhd_cache_tasks': {
    type: 'array',
    maxItems: 100,
    ttl: 3600,         // 1 hour
    schema: TaskCache
  },
  
  'adhd_last_sync': {
    type: 'string',
    format: 'iso8601'
  },
  
  // Feature Flags
  'adhd_features': {
    type: 'object',
    schema: FeatureFlags
  },
  
  // Session Recovery
  'adhd_active_session': {
    type: 'object',
    schema: SessionRecovery,
    ttl: 86400         // 24 hours
  }
};
```

### 6.2 Storage Manager
```typescript
class LocalStorageManager {
  private readonly prefix = 'adhd_';
  private readonly maxSize = 10 * 1024 * 1024; // 10MB total
  
  set<T>(key: string, value: T, options?: StorageOptions): void {
    const fullKey = this.prefix + key;
    const schema = LOCAL_STORAGE_SCHEMA[fullKey];
    
    // Validate against schema
    if (schema) {
      this.validate(value, schema);
    }
    
    // Compress if needed
    let data: string;
    if (options?.compress || schema?.compress) {
      data = this.compress(JSON.stringify(value));
    } else {
      data = JSON.stringify(value);
    }
    
    // Check size limits
    if (data.length > (schema?.maxSize || this.maxSize)) {
      throw new Error(`Storage limit exceeded for key: ${key}`);
    }
    
    // Set with TTL if specified
    const wrapper = {
      data: value,
      timestamp: Date.now(),
      ttl: options?.ttl || schema?.ttl
    };
    
    try {
      localStorage.setItem(fullKey, JSON.stringify(wrapper));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this.cleanup();
        localStorage.setItem(fullKey, JSON.stringify(wrapper));
      }
    }
  }
  
  get<T>(key: string): T | null {
    const fullKey = this.prefix + key;
    const item = localStorage.getItem(fullKey);
    
    if (!item) return null;
    
    const wrapper = JSON.parse(item);
    
    // Check TTL
    if (wrapper.ttl) {
      const elapsed = Date.now() - wrapper.timestamp;
      if (elapsed > wrapper.ttl * 1000) {
        localStorage.removeItem(fullKey);
        return null;
      }
    }
    
    return wrapper.data;
  }
  
  private cleanup(): void {
    // Remove expired items
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (!key.startsWith(this.prefix)) return;
      
      try {
        const item = JSON.parse(localStorage.getItem(key)!);
        if (item.ttl && (now - item.timestamp) > item.ttl * 1000) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid item, remove it
        localStorage.removeItem(key);
      }
    });
  }
}
```

---

## 7. Data Relationships

### 7.1 Entity Relationship Diagram
```
┌──────────────┐       1:N       ┌──────────────┐
│    USERS     │─────────────────▶│    TASKS     │
└──────────────┘                  └──────────────┘
       │                                  │
       │ 1:N                              │ 1:N
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│   SESSIONS   │◀─────────────────│   SUBTASKS   │
└──────────────┘       N:1        └──────────────┘
       │
       │ N:1
       ▼
┌──────────────┐       1:N       ┌──────────────┐
│  ANALYTICS   │◀─────────────────│   BACKUPS    │
└──────────────┘                  └──────────────┘
```

### 7.2 Relationship Rules
```typescript
// Foreign Key Constraints (Simulated in IndexedDB)
const RELATIONSHIPS = {
  // Tasks
  'tasks.parentId': {
    references: 'tasks.id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  
  'tasks.userId': {
    references: 'users.id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  
  // Sessions
  'sessions.taskId': {
    references: 'tasks.id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  
  'sessions.userId': {
    references: 'users.id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  
  // Analytics
  'analytics.userId': {
    references: 'users.id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
};
```

---

## 8. Data Validation Rules

### 8.1 Validation Schemas
```typescript
import { z } from 'zod';

// Task Validation
const TaskValidation = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
    
  description: z.string()
    .max(2000, 'Description too long')
    .optional(),
    
  estimatedDuration: z.number()
    .min(5, 'Minimum 5 minutes')
    .max(480, 'Maximum 8 hours'),
    
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags'),
    
  energyLevel: z.enum(['low', 'medium', 'high']),
  
  scheduledFor: z.string()
    .datetime()
    .optional()
    .refine(val => !val || new Date(val) > new Date(), {
      message: 'Cannot schedule in the past'
    }),
    
  deadline: z.string()
    .datetime()
    .optional()
});

// Session Validation
const SessionValidation = z.object({
  type: z.enum(['focus', 'short_break', 'long_break', 'custom']),
  
  plannedDuration: z.number()
    .min(60, 'Minimum 1 minute')
    .max(5400, 'Maximum 90 minutes'),
    
  energyBefore: z.enum(['low', 'medium', 'high']),
  
  focusQuality: z.number()
    .min(1)
    .max(5)
    .optional()
});
```

### 8.2 Business Rules
```typescript
const BUSINESS_RULES = {
  tasks: {
    // Auto-split rule
    autoSplitThreshold: 25, // minutes
    maxSubtasks: 10,
    minSubtaskDuration: 15,
    maxSubtaskDuration: 25,
    
    // Scheduling rules
    maxTasksPerDay: 20,
    maxFocusHoursPerDay: 8,
    
    // Priority rules
    urgentThresholdHours: 24,
    
    // Deletion rules
    softDeleteRetentionDays: 30,
    hardDeleteAfterDays: 90
  },
  
  sessions: {
    // Duration rules
    minSessionMinutes: 1,
    maxSessionMinutes: 90,
    
    // Break rules
    shortBreakAfterMinutes: 25,
    longBreakAfterPomodoros: 4,
    
    // Abandonment rules
    autoAbandonAfterMinutes: 180
  },
  
  analytics: {
    // Retention
    detailedDataDays: 90,
    aggregatedDataDays: 365,
    
    // Processing
    aggregationDelayMinutes: 5,
    reprocessWindowHours: 24
  }
};
```

---

## 9. Performance Optimization

### 9.1 Indexing Strategy
```javascript
// Composite Index Usage
const QUERY_PATTERNS = {
  // Most common queries
  userActiveTasks: {
    index: 'userStatus',
    query: IDBKeyRange.bound(
      [userId, 'pending'],
      [userId, 'in_progress']
    )
  },
  
  todaysTasks: {
    index: 'scheduledFor',
    query: IDBKeyRange.bound(
      startOfDay,
      endOfDay
    )
  },
  
  recentSessions: {
    index: 'userDate',
    query: IDBKeyRange.bound(
      [userId, weekAgo],
      [userId, today]
    )
  }
};
```

### 9.2 Query Optimization
```javascript
class QueryOptimizer {
  // Cursor-based pagination
  async paginateQuery<T>(
    store: IDBObjectStore,
    index: string,
    range: IDBKeyRange,
    limit: number,
    offset: number
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = [];
      let skipped = 0;
      
      const request = store.index(index).openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (!cursor || results.length >= limit) {
          resolve(results);
          return;
        }
        
        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }
        
        results.push(cursor.value);
        cursor.continue();
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  // Batch fetching
  async batchFetch<T>(
    store: IDBObjectStore,
    ids: string[]
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    await Promise.all(
      ids.map(id => 
        store.get(id).then(value => {
          if (value) results.set(id, value);
        })
      )
    );
    
    return results;
  }
}
```

### 9.3 Caching Strategy
```typescript
class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly DEFAULT_TTL = 300000; // 5 minutes
  
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = this.DEFAULT_TTL
  ): Promise<T> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }
    
    // Fetch and cache
    const data = await fetcher();
    this.set(key, data);
    return data;
  }
  
  private set(key: string, data: any): void {
    // LRU eviction
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldest = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      this.cache.delete(oldest[0]);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

---

## 10. Migration Strategy

### 10.1 Version Management
```javascript
class MigrationManager {
  private readonly CURRENT_VERSION = 1;
  
  async migrate(db: IDBDatabase): Promise<void> {
    const version = await this.getCurrentVersion();
    
    if (version < this.CURRENT_VERSION) {
      await this.runMigrations(version, this.CURRENT_VERSION);
    }
  }
  
  private async runMigrations(from: number, to: number): Promise<void> {
    const migrations = {
      '0_1': this.migration_0_to_1,
      '1_2': this.migration_1_to_2,
      // Add future migrations here
    };
    
    for (let v = from; v < to; v++) {
      const key = `${v}_${v + 1}`;
      if (migrations[key]) {
        await migrations[key].call(this);
        await this.updateVersion(v + 1);
      }
    }
  }
  
  private async migration_0_to_1(): Promise<void> {
    // Initial schema creation
    console.log('Running migration 0 -> 1');
    // Implementation here
  }
}
```

### 10.2 Data Migration
```javascript
// Safe data migration with rollback
class DataMigrator {
  async migrateWithRollback(
    operation: () => Promise<void>
  ): Promise<void> {
    // Create backup
    const backup = await this.createBackup();
    
    try {
      // Run migration
      await operation();
      
      // Verify integrity
      await this.verifyDataIntegrity();
    } catch (error) {
      // Rollback on failure
      await this.restoreBackup(backup);
      throw error;
    }
  }
  
  private async verifyDataIntegrity(): Promise<void> {
    // Check foreign key constraints
    // Verify data consistency
    // Validate against schemas
  }
}
```

---

## 11. Backup & Recovery

### 11.1 Backup Strategy
```javascript
class BackupService {
  async createBackup(
    type: 'manual' | 'auto' | 'scheduled'
  ): Promise<string> {
    const backupId = uuid();
    const backup: BackupSchema = {
      id: backupId,
      userId: this.userId,
      name: `Backup ${new Date().toLocaleString()}`,
      type,
      data: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        tasks: await this.exportTasks(),
        sessions: await this.exportSessions(),
        analytics: await this.exportAnalytics(),
        settings: await this.exportSettings(),
        stats: await this.calculateStats()
      },
      compressed: false,
      sizeBytes: 0,
      restorable: true,
      restoreCount: 0,
      createdAt: new Date().toISOString()
    };
    
    // Compress if large
    if (JSON.stringify(backup.data).length > 1024 * 1024) {
      backup.data = await this.compress(backup.data);
      backup.compressed = true;
      backup.compressionType = 'gzip';
    }
    
    // Calculate size
    backup.sizeBytes = new Blob([JSON.stringify(backup)]).size;
    
    // Save to IndexedDB
    await this.saveBackup(backup);
    
    // Cleanup old backups
    await this.cleanupOldBackups();
    
    return backupId;
  }
  
  async restoreBackup(backupId: string): Promise<void> {
    const backup = await this.getBackup(backupId);
    
    if (!backup || !backup.restorable) {
      throw new Error('Backup not found or not restorable');
    }
    
    // Decompress if needed
    let data = backup.data;
    if (backup.compressed) {
      data = await this.decompress(data);
    }
    
    // Clear existing data
    await this.clearAllData();
    
    // Restore in order
    await this.restoreTasks(data.tasks);
    await this.restoreSessions(data.sessions);
    await this.restoreAnalytics(data.analytics);
    await this.restoreSettings(data.settings);
    
    // Update metadata
    backup.lastRestoredAt = new Date().toISOString();
    backup.restoreCount++;
    await this.updateBackup(backup);
  }
}
```

### 11.2 Export/Import
```javascript
class ExportService {
  async exportToJSON(): Promise<Blob> {
    const data = {
      version: '1.0.0',
      exported: new Date().toISOString(),
      tasks: await this.getAllTasks(),
      sessions: await this.getAllSessions(),
      analytics: await this.getAllAnalytics(),
      settings: await this.getSettings()
    };
    
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }
  
  async exportToCSV(): Promise<Blob> {
    const tasks = await this.getAllTasks();
    const csv = this.convertToCSV(tasks);
    return new Blob([csv], { type: 'text/csv' });
  }
  
  async importFromJSON(file: File): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate version compatibility
    if (!this.isCompatibleVersion(data.version)) {
      throw new Error('Incompatible version');
    }
    
    // Import with conflict resolution
    await this.importWithConflictResolution(data);
  }
}
```

---

## 12. Future Scalability

### 12.1 Supabase Integration Plan
```sql
-- Future PostgreSQL Schema (Supabase)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  estimated_duration INTEGER CHECK (estimated_duration >= 5 AND estimated_duration <= 480),
  actual_duration INTEGER DEFAULT 0,
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'archived')),
  category VARCHAR(50),
  tags JSONB DEFAULT '[]'::jsonb,
  energy_level VARCHAR(10) CHECK (energy_level IN ('low', 'medium', 'high')),
  subtasks JSONB DEFAULT '[]'::jsonb,
  scheduled_for TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  sync_status VARCHAR(10) DEFAULT 'synced'
);

-- Indexes for PostgreSQL
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_for) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_policy ON tasks
  USING (auth.uid() = user_id);
```

### 12.2 Sync Strategy
```typescript
class SyncManager {
  private syncQueue: SyncOperation[] = [];
  private syncing = false;
  
  async syncWithCloud(): Promise<void> {
    if (this.syncing || !navigator.onLine) return;
    
    this.syncing = true;
    
    try {
      // 1. Pull remote changes
      const remoteChanges = await this.fetchRemoteChanges();
      
      // 2. Detect conflicts
      const conflicts = await this.detectConflicts(remoteChanges);
      
      // 3. Resolve conflicts
      const resolved = await this.resolveConflicts(conflicts);
      
      // 4. Apply remote changes
      await this.applyRemoteChanges(resolved);
      
      // 5. Push local changes
      await this.pushLocalChanges();
      
      // 6. Update sync metadata
      await this.updateSyncMetadata();
    } finally {
      this.syncing = false;
    }
  }
  
  private async resolveConflicts(
    conflicts: Conflict[]
  ): Promise<Resolution[]> {
    // Conflict resolution strategies
    const strategies = {
      'last-write-wins': this.lastWriteWins,
      'client-wins': this.clientWins,
      'server-wins': this.serverWins,
      'merge': this.mergeChanges
    };
    
    return conflicts.map(conflict => 
      strategies[conflict.type](conflict)
    );
  }
}
```

### 12.3 Scalability Considerations
```typescript
const SCALABILITY_LIMITS = {
  // Current (Browser Storage)
  browser: {
    maxTasks: 10000,
    maxSessions: 50000,
    maxStorageGB: 1,
    maxConcurrentUsers: 1
  },
  
  // Future (Supabase)
  cloud: {
    maxTasks: 1000000,
    maxSessions: 10000000,
    maxStorageGB: 100,
    maxConcurrentUsers: 10000
  }
};

// Optimization strategies for scale
const OPTIMIZATION_STRATEGIES = {
  // Data Partitioning
  partitioning: {
    strategy: 'time-based',
    archiveAfterDays: 90,
    partitionSize: '1 month'
  },
  
  // Caching
  caching: {
    levels: ['memory', 'indexeddb', 'cloud'],
    ttl: [300, 3600, 86400], // seconds
    maxSize: ['10MB', '100MB', '1GB']
  },
  
  // Compression
  compression: {
    threshold: 1024, // bytes
    algorithm: 'gzip',
    level: 6
  }
};
```

---

## Appendix A: Data Dictionary

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Unique identifier | PRIMARY KEY, NOT NULL |
| userId | UUID | User identifier | FOREIGN KEY, NOT NULL |
| title | VARCHAR(200) | Task title | NOT NULL, MIN 1 char |
| estimatedDuration | INTEGER | Duration in minutes | MIN 5, MAX 480 |
| priority | ENUM | Task priority level | IN ('low','medium','high','urgent') |
| status | ENUM | Current task status | IN ('pending','in_progress','completed','cancelled','archived') |
| energyLevel | ENUM | Required energy level | IN ('low','medium','high') |
| createdAt | TIMESTAMP | Creation timestamp | NOT NULL, ISO 8601 |
| updatedAt | TIMESTAMP | Last update timestamp | NOT NULL, ISO 8601 |
| deletedAt | TIMESTAMP | Soft delete timestamp | NULL allowed |

---

## Appendix B: SQL Migration Scripts

```sql
-- Migration v1: Initial Schema
BEGIN TRANSACTION;

-- Create tables
CREATE TABLE IF NOT EXISTS tasks (...);
CREATE TABLE IF NOT EXISTS sessions (...);
CREATE TABLE IF NOT EXISTS analytics (...);
CREATE TABLE IF NOT EXISTS backups (...);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(userId);
-- ... more indexes

COMMIT;

-- Migration v2: Add ADHD Features
BEGIN TRANSACTION;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS energy_level VARCHAR(10);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS focus_level INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS focus_quality INTEGER;

COMMIT;
```

---

**Document Version**: 1.0.0
**Last Updated**: 2024-12-30
**Status**: Ready for Implementation

---

END OF DATABASE DESIGN DOCUMENT