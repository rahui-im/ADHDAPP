# Technical Specification: ADHD Time Manager MVP

## 📚 목차
1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [데이터 모델](#4-데이터-모델)
5. [API 설계](#5-api-설계)
6. [컴포넌트 설계](#6-컴포넌트-설계)
7. [상태 관리](#7-상태-관리)
8. [라우팅 구현](#8-라우팅-구현)
9. [서비스 레이어](#9-서비스-레이어)
10. [보안 및 인증](#10-보안-및-인증)
11. [성능 최적화](#11-성능-최적화)
12. [테스트 전략](#12-테스트-전략)
13. [배포 전략](#13-배포-전략)
14. [구현 가이드](#14-구현-가이드)

---

## 1. 개요

### 1.1 문서 목적
PRD(Product Requirements Document)를 기반으로 한 상세 기술 구현 명세서입니다.
개발자가 실제 구현 시 참조할 수 있는 구체적인 기술 가이드를 제공합니다.

### 1.2 범위
- MVP 완성을 위한 필수 기능 구현
- Phase 1 (Core Functionality) 우선 구현
- 예상 공수: 100-145시간

### 1.3 제약사항
- 브라우저 전용 (오프라인 우선)
- 클라우드 동기화는 MVP 이후
- 모바일 앱은 PWA로 대체

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                         Presentation Layer                   │
├─────────────────────────────────────────────────────────────┤
│  React Components  │  React Router  │  PWA Service Worker  │
├─────────────────────────────────────────────────────────────┤
│                      Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Redux Store  │  Custom Hooks  │  Service Layer            │
├─────────────────────────────────────────────────────────────┤
│                        Data Layer                           │
├─────────────────────────────────────────────────────────────┤
│  LocalStorage  │  IndexedDB  │  Session Storage            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 플로우
```typescript
// Unidirectional Data Flow
User Action 
  → Component Event Handler
  → Redux Action Dispatch
  → Reducer State Update
  → Middleware (persistence)
  → Component Re-render
  → UI Update
```

### 2.3 폴더 구조
```
src/
├── components/        # Presentational Components
│   ├── common/       # Shared components
│   ├── features/     # Feature-specific components
│   └── layouts/      # Layout components
├── pages/            # Route Components
├── hooks/            # Custom Hooks
├── services/         # Business Logic
├── store/           # Redux Store
│   ├── slices/      # Redux Slices
│   ├── middleware/  # Custom Middleware
│   └── selectors/   # Memoized Selectors
├── utils/           # Utility Functions
├── types/           # TypeScript Types
├── styles/          # Global Styles
└── constants/       # Constants
```

---

## 3. 기술 스택

### 3.1 Core Dependencies
```json
{
  "dependencies": {
    // Core
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.2.2",
    
    // Routing
    "react-router-dom": "^6.22.0",
    
    // State Management
    "@reduxjs/toolkit": "^2.2.7",
    "react-redux": "^9.1.2",
    "redux-persist": "^6.0.0",
    
    // UI/UX
    "framer-motion": "^11.3.28",
    "@heroicons/react": "^2.2.0",
    "tailwindcss": "^3.4.10",
    
    // Data
    "idb": "^8.0.0", // IndexedDB wrapper
    "uuid": "^9.0.1",
    "date-fns": "^3.0.0",
    
    // Validation
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0",
    
    // Charts
    "recharts": "^2.10.0",
    
    // PWA
    "workbox-window": "^7.3.0",
    "vite-plugin-pwa": "^0.20.5",
    
    // i18n
    "i18next": "^25.4.2",
    "react-i18next": "^15.7.3"
  }
}
```

### 3.2 Development Dependencies
```json
{
  "devDependencies": {
    // Testing
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "vitest": "^2.0.5",
    "@vitest/ui": "^2.0.5",
    
    // Linting
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    
    // Types
    "@types/react": "^18.3.3",
    "@types/react-router-dom": "^5.3.3",
    "@types/uuid": "^9.0.7"
  }
}
```

---

## 4. 데이터 모델

### 4.1 Core Entities

#### Task Entity
```typescript
interface Task {
  // Identity
  id: string;                    // UUID v4
  version: number;                // Optimistic locking
  
  // Basic Info
  title: string;                  // Required, max 200 chars
  description?: string;           // Optional, max 2000 chars
  
  // Time Management
  estimatedDuration: number;      // Minutes (min: 5, max: 480)
  actualDuration: number;         // Auto-tracked minutes
  
  // Organization
  priority: Priority;             // 'low' | 'medium' | 'high' | 'urgent'
  status: TaskStatus;             // 'pending' | 'in-progress' | 'completed' | 'cancelled'
  category: string;               // User-defined category
  tags: string[];                 // Max 10 tags
  
  // ADHD Features
  energyLevel: EnergyLevel;       // 'low' | 'medium' | 'high'
  isFlexible: boolean;            // Can be rescheduled
  subtasks: Subtask[];            // Auto-split if > 25 min
  breakReminders: boolean;        // Remind to take breaks
  
  // Relationships
  parentId?: string;              // Parent task ID
  dependencies: string[];         // Blocking task IDs
  
  // Scheduling
  scheduledFor?: Date;            // ISO 8601
  deadline?: Date;                // ISO 8601
  recurring?: RecurringConfig;    // Recurring pattern
  
  // Metadata
  createdAt: Date;                // ISO 8601
  updatedAt: Date;                // ISO 8601
  completedAt?: Date;             // ISO 8601
  deletedAt?: Date;               // Soft delete
  
  // User Data
  userId: string;                 // User identifier
  notes?: string;                 // Additional notes
  attachments: Attachment[];      // File references
}

interface Subtask {
  id: string;
  title: string;
  duration: number;               // 15-25 minutes
  isCompleted: boolean;
  completedAt?: Date;
  order: number;
}

interface RecurringConfig {
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[];          // 0-6 (Sun-Sat)
  dayOfMonth?: number;
  endDate?: Date;
  maxOccurrences?: number;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}
```

#### Timer Session Entity
```typescript
interface TimerSession {
  id: string;
  taskId?: string;
  userId: string;
  
  // Timer Config
  type: SessionType;              // 'focus' | 'short-break' | 'long-break'
  duration: number;               // Planned duration in seconds
  actualDuration: number;         // Actual duration in seconds
  
  // Status
  status: SessionStatus;          // 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  interruptions: Interruption[];
  
  // ADHD Metrics
  energyBefore: EnergyLevel;
  energyAfter?: EnergyLevel;
  distractionCount: number;
  focusQuality?: number;          // 1-5 rating
  
  // Timestamps
  startedAt: Date;
  pausedAt?: Date[];
  resumedAt?: Date[];
  completedAt?: Date;
  
  // Pomodoro Tracking
  cycleNumber: number;            // Which pomodoro in sequence
  cycleTotal: number;             // Total planned pomodoros
}

interface Interruption {
  type: 'internal' | 'external' | 'break' | 'emergency';
  timestamp: Date;
  duration: number;
  reason?: string;
}
```

#### User Entity
```typescript
interface User {
  id: string;
  name: string;
  email?: string;
  
  // Preferences
  preferences: UserPreferences;
  settings: UserSettings;
  
  // ADHD Profile
  adhdProfile: ADHDProfile;
  
  // Metadata
  createdAt: Date;
  lastActiveAt: Date;
  onboardingCompleted: boolean;
}

interface UserPreferences {
  // Timer Defaults
  defaultFocusDuration: number;   // 15, 25, or 45
  defaultBreakDuration: number;   // 5, 10, or 15
  longBreakDuration: number;      // 20-30
  cyclesBeforeLongBreak: number;  // 3-4
  
  // Task Defaults
  defaultTaskDuration: number;
  preferredCategories: string[];
  autoSplitTasks: boolean;
  
  // Notifications
  enableNotifications: boolean;
  notificationSound: string;
  notificationVolume: number;
  
  // UI
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
}

interface ADHDProfile {
  // Energy Patterns
  morningEnergy: EnergyLevel;
  afternoonEnergy: EnergyLevel;
  eveningEnergy: EnergyLevel;
  
  // Focus Patterns
  bestFocusTime: string[];        // ['morning', 'afternoon', 'evening']
  averageFocusDuration: number;
  
  // Triggers & Strategies
  distractionTriggers: string[];
  copingStrategies: string[];
  
  // Medication Tracking (optional)
  medicationReminders?: MedicationReminder[];
}
```

### 4.2 Storage Schema

#### LocalStorage Schema
```typescript
// Key-Value pairs in LocalStorage
const LOCAL_STORAGE_KEYS = {
  USER: 'adhd_tm_user',
  PREFERENCES: 'adhd_tm_preferences',
  SETTINGS: 'adhd_tm_settings',
  THEME: 'adhd_tm_theme',
  LANGUAGE: 'adhd_tm_language',
  ONBOARDING: 'adhd_tm_onboarding',
  LAST_SYNC: 'adhd_tm_last_sync'
} as const;
```

#### IndexedDB Schema
```typescript
// IndexedDB Database Structure
const DB_NAME = 'ADHDTimeManagerDB';
const DB_VERSION = 1;

const STORES = {
  tasks: {
    name: 'tasks',
    keyPath: 'id',
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'priority', keyPath: 'priority' },
      { name: 'scheduledFor', keyPath: 'scheduledFor' },
      { name: 'category', keyPath: 'category' },
      { name: 'createdAt', keyPath: 'createdAt' }
    ]
  },
  sessions: {
    name: 'sessions',
    keyPath: 'id',
    indexes: [
      { name: 'taskId', keyPath: 'taskId' },
      { name: 'startedAt', keyPath: 'startedAt' },
      { name: 'type', keyPath: 'type' }
    ]
  },
  analytics: {
    name: 'analytics',
    keyPath: 'date',
    indexes: [
      { name: 'weekNumber', keyPath: 'weekNumber' },
      { name: 'monthYear', keyPath: 'monthYear' }
    ]
  }
};
```

---

## 5. API 설계

### 5.1 Service Layer Architecture
```typescript
// Service Interface Pattern
interface ITaskService {
  // CRUD Operations
  create(task: CreateTaskDTO): Promise<Task>;
  update(id: string, updates: UpdateTaskDTO): Promise<Task>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<Task | null>;
  getAll(filters?: TaskFilters): Promise<Task[]>;
  
  // Business Logic
  splitTask(id: string): Promise<Task[]>;
  completeTask(id: string): Promise<Task>;
  postponeTask(id: string, newDate: Date): Promise<Task>;
  
  // Bulk Operations
  bulkCreate(tasks: CreateTaskDTO[]): Promise<Task[]>;
  bulkUpdate(updates: BulkUpdateDTO[]): Promise<Task[]>;
  bulkDelete(ids: string[]): Promise<void>;
}
```

### 5.2 Data Transfer Objects (DTOs)
```typescript
// Create Task DTO
interface CreateTaskDTO {
  title: string;
  description?: string;
  estimatedDuration: number;
  priority?: Priority;
  category?: string;
  tags?: string[];
  energyLevel?: EnergyLevel;
  scheduledFor?: Date;
  deadline?: Date;
}

// Update Task DTO
interface UpdateTaskDTO {
  title?: string;
  description?: string;
  estimatedDuration?: number;
  priority?: Priority;
  status?: TaskStatus;
  category?: string;
  tags?: string[];
  energyLevel?: EnergyLevel;
  scheduledFor?: Date;
  deadline?: Date;
}

// Task Filters DTO
interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  categories?: string[];
  tags?: string[];
  energyLevel?: EnergyLevel[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: 'createdAt' | 'priority' | 'deadline' | 'scheduledFor';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

### 5.3 Service Implementation Pattern
```typescript
class TaskService implements ITaskService {
  private db: IDBDatabase;
  private store: AppStore;
  
  constructor(db: IDBDatabase, store: AppStore) {
    this.db = db;
    this.store = store;
  }
  
  async create(dto: CreateTaskDTO): Promise<Task> {
    // Validation
    const validated = taskSchema.parse(dto);
    
    // Business Logic
    const task: Task = {
      id: uuid(),
      ...validated,
      version: 1,
      status: 'pending',
      subtasks: this.generateSubtasks(validated.estimatedDuration),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: this.store.getState().user.currentUser?.id || 'anonymous'
    };
    
    // Persistence
    await this.persistTask(task);
    
    // State Update
    this.store.dispatch(taskActions.addTask(task));
    
    // Side Effects
    await this.scheduleNotifications(task);
    
    return task;
  }
  
  private generateSubtasks(duration: number): Subtask[] {
    if (duration <= 25) return [];
    
    const subtaskCount = Math.ceil(duration / 25);
    const subtaskDuration = Math.floor(duration / subtaskCount);
    
    return Array.from({ length: subtaskCount }, (_, i) => ({
      id: uuid(),
      title: `Part ${i + 1}`,
      duration: subtaskDuration,
      isCompleted: false,
      order: i
    }));
  }
  
  private async persistTask(task: Task): Promise<void> {
    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    await store.add(task);
  }
}
```

---

## 6. 컴포넌트 설계

### 6.1 Component Architecture
```typescript
// Component Structure Pattern
interface ComponentProps {
  // Data Props
  data: any;
  
  // Event Handlers
  onAction: (event: any) => void;
  
  // UI State
  isLoading?: boolean;
  isDisabled?: boolean;
  error?: Error;
  
  // Styling
  className?: string;
  variant?: string;
}
```

### 6.2 Core Components

#### Task Management Components
```typescript
// TaskModal Component
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;  // Edit mode if provided
  onSubmit: (task: CreateTaskDTO | UpdateTaskDTO) => Promise<void>;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: task || defaultTaskValues
  });
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Title Field */}
        <Input
          label="작업 제목"
          {...register('title')}
          error={errors.title?.message}
          maxLength={200}
          required
        />
        
        {/* Duration Slider */}
        <DurationSlider
          {...register('estimatedDuration')}
          min={5}
          max={480}
          step={5}
          showSubtaskPreview
        />
        
        {/* Priority Selector */}
        <PrioritySelector
          {...register('priority')}
          options={PRIORITY_OPTIONS}
        />
        
        {/* Energy Level */}
        <EnergyLevelSelector
          {...register('energyLevel')}
          recommendation={getEnergyRecommendation()}
        />
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            {task ? '수정' : '생성'}
          </Button>
          <Button type="button" onClick={onClose} variant="outline">
            취소
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

#### Timer Components
```typescript
// Enhanced Timer Component
interface TimerProps {
  task?: Task;
  onComplete: (session: TimerSession) => void;
}

const Timer: React.FC<TimerProps> = ({ task, onComplete }) => {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      const interval = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [state.isRunning, state.isPaused]);
  
  // Background timer with Web Worker
  useEffect(() => {
    if ('Worker' in window) {
      const worker = new Worker('/timer-worker.js');
      worker.postMessage({ 
        action: 'start', 
        duration: state.duration 
      });
      
      worker.onmessage = (e) => {
        if (e.data.action === 'complete') {
          handleComplete();
        }
      };
      
      return () => worker.terminate();
    }
  }, []);
  
  return (
    <div className="timer-container">
      <CircularProgress
        value={state.progress}
        size={300}
        strokeWidth={20}
        color={getTimerColor(state.mode)}
      >
        <TimerDisplay
          minutes={Math.floor(state.remaining / 60)}
          seconds={state.remaining % 60}
        />
      </CircularProgress>
      
      <TimerControls
        isRunning={state.isRunning}
        isPaused={state.isPaused}
        onStart={() => dispatch({ type: 'START' })}
        onPause={() => dispatch({ type: 'PAUSE' })}
        onStop={() => dispatch({ type: 'STOP' })}
        onSkip={() => dispatch({ type: 'SKIP' })}
      />
      
      <audio ref={audioRef} src="/sounds/bell.mp3" />
    </div>
  );
};
```

### 6.3 Component Composition Pattern
```typescript
// Higher-Order Component for Data Fetching
function withDataFetching<T>(
  Component: React.ComponentType<T & { data: any }>,
  fetchFn: () => Promise<any>
) {
  return (props: T) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
      fetchFn()
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    }, []);
    
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorBoundary error={error} />;
    
    return <Component {...props} data={data} />;
  };
}
```

---

## 7. 상태 관리

### 7.1 Redux Store Structure
```typescript
// Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['tasks', 'user', 'settings'],
  blacklist: ['ui', 'temp']
};

export const store = configureStore({
  reducer: {
    tasks: persistReducer(persistConfig, tasksSlice.reducer),
    timer: timerSlice.reducer,
    user: persistReducer(persistConfig, userSlice.reducer),
    analytics: analyticsSlice.reducer,
    ui: uiSlice.reducer,
    notifications: notificationsSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
    .concat(analyticsMiddleware)
    .concat(notificationMiddleware)
    .concat(syncMiddleware)
});
```

### 7.2 Redux Slices

#### Tasks Slice
```typescript
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [] as Task[],
    filter: 'all' as TaskFilter,
    sortBy: 'createdAt' as SortBy,
    isLoading: false,
    error: null as string | null,
    selectedTaskId: null as string | null
  },
  reducers: {
    // CRUD Actions
    addTask: (state, action: PayloadAction<Task>) => {
      state.items.push(action.payload);
    },
    
    updateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates,
          updatedAt: new Date().toISOString()
        };
      }
    },
    
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    
    // Bulk Actions
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
    },
    
    // Filter & Sort
    setFilter: (state, action: PayloadAction<TaskFilter>) => {
      state.filter = action.payload;
    },
    
    setSortBy: (state, action: PayloadAction<SortBy>) => {
      state.sortBy = action.payload;
    }
  },
  
  extraReducers: (builder) => {
    // Async Actions
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      });
  }
});
```

### 7.3 Middleware

#### Analytics Middleware
```typescript
const analyticsMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Track task completions
  if (action.type === 'tasks/updateTask' && action.payload.updates.status === 'completed') {
    const task = store.getState().tasks.items.find(t => t.id === action.payload.id);
    if (task) {
      trackEvent('task_completed', {
        taskId: task.id,
        duration: task.actualDuration,
        category: task.category,
        priority: task.priority
      });
    }
  }
  
  // Track timer sessions
  if (action.type === 'timer/complete') {
    trackEvent('timer_session_completed', {
      duration: action.payload.duration,
      type: action.payload.type
    });
  }
  
  return result;
};
```

---

## 8. 라우팅 구현

### 8.1 Router Configuration
```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tasks" element={<TasksLayout />}>
            <Route index element={<TasksPage />} />
            <Route path=":taskId" element={<TaskDetailPage />} />
            <Route path="new" element={<NewTaskPage />} />
          </Route>
          <Route path="timer" element={<TimerLayout />}>
            <Route index element={<TimerPage />} />
            <Route path=":taskId" element={<TimerWithTaskPage />} />
          </Route>
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<SettingsPage />} />
            <Route path="preferences" element={<PreferencesPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Route>
        <Route path="/focus" element={<FocusModePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 8.2 Route Guards
```typescript
// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false,
  requireOnboarding = false 
}) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasCompletedOnboarding = useAppSelector(selectOnboardingStatus);
  
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};
```

### 8.3 Navigation Hooks
```typescript
// useNavigation Hook
export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const navigateToTask = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };
  
  const navigateToTimerWithTask = (taskId: string) => {
    navigate(`/timer/${taskId}`);
  };
  
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };
  
  return {
    navigate,
    location,
    params,
    navigateToTask,
    navigateToTimerWithTask,
    goBack
  };
};
```

---

## 9. 서비스 레이어

### 9.1 Service Architecture
```typescript
// Base Service Class
abstract class BaseService {
  protected db: IDBDatabase;
  protected store: Store;
  
  constructor(db: IDBDatabase, store: Store) {
    this.db = db;
    this.store = store;
  }
  
  protected async transaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    callback: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    const tx = this.db.transaction(stores, mode);
    try {
      const result = await callback(tx);
      await tx.complete;
      return result;
    } catch (error) {
      tx.abort();
      throw error;
    }
  }
}
```

### 9.2 Core Services Implementation

#### Storage Service
```typescript
class StorageService extends BaseService {
  private readonly STORAGE_KEYS = {
    USER: 'adhd_user',
    PREFERENCES: 'adhd_preferences',
    THEME: 'adhd_theme'
  } as const;
  
  // LocalStorage Operations
  saveToLocal<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.clearOldData();
        localStorage.setItem(key, JSON.stringify(data));
      }
    }
  }
  
  loadFromLocal<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  
  // IndexedDB Operations
  async saveToIndexedDB<T>(storeName: string, data: T): Promise<void> {
    await this.transaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      await store.put(data);
    });
  }
  
  async loadFromIndexedDB<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    return await this.transaction([storeName], 'readonly', async (tx) => {
      const store = tx.objectStore(storeName);
      return await store.get(key);
    });
  }
  
  // Bulk Operations
  async bulkSave<T>(storeName: string, items: T[]): Promise<void> {
    await this.transaction([storeName], 'readwrite', async (tx) => {
      const store = tx.objectStore(storeName);
      await Promise.all(items.map(item => store.put(item)));
    });
  }
}
```

#### Notification Service
```typescript
class NotificationService {
  private permission: NotificationPermission = 'default';
  
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }
  
  async notify(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }
    
    const notification = new Notification(options.title, {
      body: options.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      actions: options.actions,
      data: options.data
    });
    
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (options.onClick) {
        options.onClick(event);
      }
      notification.close();
    };
  }
  
  scheduleNotification(task: Task): void {
    if (!task.scheduledFor) return;
    
    const timeUntil = task.scheduledFor.getTime() - Date.now();
    if (timeUntil <= 0) return;
    
    setTimeout(() => {
      this.notify({
        title: '작업 시작 시간',
        body: `"${task.title}" 작업을 시작할 시간입니다.`,
        tag: `task-${task.id}`,
        requireInteraction: true,
        onClick: () => {
          window.location.href = `/timer/${task.id}`;
        }
      });
    }, timeUntil);
  }
}
```

---

## 10. 보안 및 인증

### 10.1 Data Validation
```typescript
// Zod Schemas for Validation
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  estimatedDuration: z.number().min(5).max(480),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().max(50),
  tags: z.array(z.string()).max(10),
  energyLevel: z.enum(['low', 'medium', 'high']),
  scheduledFor: z.date().optional(),
  deadline: z.date().optional()
});

// Input Sanitization
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};
```

### 10.2 Data Encryption (Optional for sensitive data)
```typescript
class EncryptionService {
  private async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  async encrypt(data: string, key: CryptoKey): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return combined.buffer;
  }
  
  async decrypt(data: ArrayBuffer, key: CryptoKey): Promise<string> {
    const combined = new Uint8Array(data);
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}
```

---

## 11. 성능 최적화

### 11.1 Code Splitting
```typescript
// Lazy Loading Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TimerPage = lazy(() => import('./pages/TimerPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Component with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 11.2 Memoization
```typescript
// Memoized Selectors
import { createSelector } from '@reduxjs/toolkit';

export const selectTasks = (state: RootState) => state.tasks.items;
export const selectFilter = (state: RootState) => state.tasks.filter;

export const selectFilteredTasks = createSelector(
  [selectTasks, selectFilter],
  (tasks, filter) => {
    switch (filter) {
      case 'pending':
        return tasks.filter(t => t.status === 'pending');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      case 'today':
        const today = new Date().toDateString();
        return tasks.filter(t => 
          t.scheduledFor && new Date(t.scheduledFor).toDateString() === today
        );
      default:
        return tasks;
    }
  }
);

// Memoized Components
const TaskItem = React.memo(({ task, onUpdate, onDelete }) => {
  return (
    <div className="task-item">
      {/* Component content */}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.task.updatedAt === nextProps.task.updatedAt;
});
```

### 11.3 Virtual Scrolling
```typescript
// Virtual List for Large Task Lists
import { FixedSizeList } from 'react-window';

const TaskList = ({ tasks }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TaskItem task={tasks[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### 11.4 Web Workers
```typescript
// timer-worker.js
let interval;
let remaining;

self.onmessage = (e) => {
  if (e.data.action === 'start') {
    remaining = e.data.duration;
    interval = setInterval(() => {
      remaining--;
      self.postMessage({ action: 'tick', remaining });
      
      if (remaining <= 0) {
        clearInterval(interval);
        self.postMessage({ action: 'complete' });
      }
    }, 1000);
  } else if (e.data.action === 'stop') {
    clearInterval(interval);
  }
};
```

---

## 12. 테스트 전략

### 12.1 Unit Tests
```typescript
// Task Service Tests
describe('TaskService', () => {
  let service: TaskService;
  let mockDB: IDBDatabase;
  
  beforeEach(() => {
    mockDB = createMockDB();
    service = new TaskService(mockDB, store);
  });
  
  describe('create', () => {
    it('should create a task with valid data', async () => {
      const dto: CreateTaskDTO = {
        title: 'Test Task',
        estimatedDuration: 30,
        priority: 'medium'
      };
      
      const task = await service.create(dto);
      
      expect(task).toMatchObject({
        title: 'Test Task',
        estimatedDuration: 30,
        priority: 'medium',
        status: 'pending'
      });
      expect(task.subtasks).toHaveLength(2); // 30 min = 2 subtasks
    });
    
    it('should validate input data', async () => {
      const dto: CreateTaskDTO = {
        title: '', // Invalid
        estimatedDuration: 30
      };
      
      await expect(service.create(dto)).rejects.toThrow('Title is required');
    });
  });
});
```

### 12.2 Integration Tests
```typescript
// Timer Flow Test
describe('Timer Workflow', () => {
  it('should complete a full pomodoro cycle', async () => {
    const { getByRole, getByText } = render(
      <Provider store={store}>
        <TimerPage />
      </Provider>
    );
    
    // Select task
    const taskSelect = getByRole('combobox', { name: /select task/i });
    await userEvent.selectOptions(taskSelect, 'task-1');
    
    // Start timer
    const startButton = getByRole('button', { name: /start/i });
    await userEvent.click(startButton);
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });
    
    // Check completion
    expect(getByText(/break time/i)).toBeInTheDocument();
  });
});
```

### 12.3 E2E Tests
```typescript
// Playwright E2E Test
import { test, expect } from '@playwright/test';

test('complete task creation flow', async ({ page }) => {
  await page.goto('/tasks');
  
  // Click new task button
  await page.click('button:has-text("New Task")');
  
  // Fill form
  await page.fill('input[name="title"]', 'E2E Test Task');
  await page.fill('input[name="duration"]', '45');
  await page.selectOption('select[name="priority"]', 'high');
  
  // Submit
  await page.click('button:has-text("Create")');
  
  // Verify task appears
  await expect(page.locator('text=E2E Test Task')).toBeVisible();
});
```

---

## 13. 배포 전략

### 13.1 Build Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ADHD Time Manager',
        short_name: 'ADHD TM',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['framer-motion', '@heroicons/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### 13.2 Environment Configuration
```bash
# .env.production
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_API_TIMEOUT=30000
```

### 13.3 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 14. 구현 가이드

### 14.1 Implementation Order

#### Phase 1: Core (Week 1-2)
```
Day 1-2: Router Setup
├── Install react-router-dom
├── Configure routes
├── Update Layout component
└── Test navigation

Day 3-5: Task CRUD
├── Create TaskModal component
├── Implement TaskForm with validation
├── Connect to Redux
└── Add persistence layer

Day 6-7: Timer Integration
├── Task selection UI
├── Timer-task binding
├── Session recording
└── Notifications

Day 8-10: Data Persistence
├── Setup IndexedDB
├── Configure redux-persist
├── Implement auto-save
└── Add data migration
```

#### Phase 2: UX (Week 3)
```
Day 11-12: Feedback System
├── Toast notifications
├── Loading states
├── Error boundaries
└── Success feedback

Day 13: Onboarding
├── Tour component
├── First-time setup
└── Help system

Day 14-15: Settings & Analytics
├── Settings persistence
├── Theme switching
├── Basic charts
└── Data export
```

#### Phase 3: Polish (Week 4)
```
Day 16-17: Optimization
├── Code splitting
├── Lazy loading
├── Bundle optimization
└── Performance profiling

Day 18-19: Testing
├── Unit tests
├── Integration tests
└── E2E tests

Day 20: Deployment
├── Production build
├── Environment setup
├── Deployment
└── Monitoring setup
```

### 14.2 Development Checklist

#### Before Starting
- [ ] Fork and clone repository
- [ ] Install dependencies
- [ ] Setup development environment
- [ ] Review PRD and Tech Spec

#### During Development
- [ ] Follow coding standards
- [ ] Write tests for new features
- [ ] Update documentation
- [ ] Regular commits with clear messages

#### Before PR
- [ ] Run all tests
- [ ] Fix linting errors
- [ ] Update changelog
- [ ] Request code review

### 14.3 Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| State not persisting | Check redux-persist configuration |
| Router not working | Ensure BrowserRouter wraps app |
| Timer drift | Use Web Worker for accuracy |
| Memory leaks | Clean up useEffect subscriptions |
| Bundle too large | Implement code splitting |

---

## 📎 Appendix

### A. File Structure Template
```
src/
├── components/
│   ├── tasks/
│   │   ├── TaskModal.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   └── index.ts
│   └── ...
├── hooks/
│   ├── useTask.ts
│   ├── useTimer.ts
│   └── ...
├── services/
│   ├── TaskService.ts
│   ├── StorageService.ts
│   └── ...
└── ...
```

### B. Code Style Guide
```typescript
// Component naming: PascalCase
// File naming: PascalCase for components, camelCase for utilities
// Function naming: camelCase
// Constants: UPPER_SNAKE_CASE
// Types/Interfaces: PascalCase

// Import order:
// 1. React
// 2. Third-party libraries
// 3. Local components
// 4. Local utilities
// 5. Types
// 6. Styles
```

### C. Git Workflow
```bash
# Feature branch
git checkout -b feature/task-modal

# Commit messages
git commit -m "feat: add task modal component"
git commit -m "fix: resolve timer drift issue"
git commit -m "docs: update API documentation"

# PR title format
[TYPE] Brief description
# Types: feat, fix, docs, style, refactor, test, chore
```

---

**Document Version**: 1.0.0
**Last Updated**: 2024-12-30
**Authors**: ADHD Time Manager Development Team

---

END OF TECHNICAL SPECIFICATION