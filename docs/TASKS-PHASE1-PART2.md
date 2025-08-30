# 📋 PHASE 1: CRITICAL INFRASTRUCTURE - Part 2
## Data Persistence, Timer System, and Task Auto-Split

## 🎯 Phase Overview
**Phase Goal**: Complete the essential foundation for the ADHD Time Manager application  
**Part 2 Coverage**: P0-004 to P0-006 (Data Persistence, Timer System, Task Auto-Split)  
**Total Estimated Time**: 36 hours  
**Priority**: P0 - Critical (All tasks are blocking issues)  
**Prerequisites**: Part 1 completed (P0-001 to P0-003)  

---

## ✅ P0-004: Data Persistence System [COMPLETED]

### Task Overview
- **Task ID**: P0-004
- **Task Name**: Data Persistence System
- **Priority**: Critical (Blocking)
- **Time Estimate**: 12 hours
  - IndexedDB Setup: 3 hours
  - StorageService Implementation: 4 hours
  - Redux Persist Integration: 2 hours
  - Migration System: 2 hours
  - Testing: 1 hour
- **Dependencies**: P0-003 (Redux must be working)

### Current State vs Desired State
**Current State**:
- Data lost on page refresh
- No offline support
- No backup/restore functionality
- No data migration system

**Desired State**:
- All data persists across sessions
- Works offline with IndexedDB
- Automatic and manual backups
- Data export/import functionality
- Version migration support

### Implementation Steps

#### Step 1: Install Redux Persist
```bash
npm install redux-persist
```

#### Step 2: Configure Redux Persist
Update `src/store/store.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import taskReducer from './slices/taskSlice';
import timerReducer from './slices/timerSlice';
import userReducer from './slices/userSlice';
import analyticsReducer from './slices/analyticsSlice';

const persistConfig = {
  key: 'adhd-time-manager',
  version: 1,
  storage,
  whitelist: ['tasks', 'user', 'analytics'], // Don't persist timer state
  blacklist: ['timer'], // Timer state should be session-only
};

const rootReducer = combineReducers({
  tasks: taskReducer,
  timer: timerReducer,
  user: userReducer,
  analytics: analyticsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionPaths: ['payload.timestamp'],
        ignoredPaths: ['timer.currentSession.startTime'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Step 3: Update Main Entry Point
Update `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import App from './App';
import Loading from './components/ui/Loading';
import './index.css';

// Service Worker Registration for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered:', registration);
      })
      .catch((registrationError) => {
        console.log('❌ SW registration failed:', registrationError);
      });
  });
}

// Loading component while rehydrating
const LoadingView = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Loading message="데이터를 불러오는 중..." />
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
```

#### Step 4: Create IndexedDB Manager (Optional - Advanced)
Create `src/services/IndexedDBManager.ts`:

```typescript
import Dexie, { Table } from 'dexie';
import { Task } from '../types/task';
import { TimerSession } from '../types/timer';

export interface BackupData {
  id?: number;
  timestamp: string;
  data: string;
  version: string;
}

class DatabaseManager extends Dexie {
  tasks!: Table<Task>;
  sessions!: Table<TimerSession>;
  backups!: Table<BackupData>;
  
  constructor() {
    super('ADHDTimeManager');
    
    this.version(1).stores({
      tasks: 'id, status, priority, category, createdAt, scheduledDate',
      sessions: 'id, taskId, startTime, type, completed',
      backups: '++id, timestamp',
    });
  }
  
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.tasks, this.sessions, async () => {
      await this.tasks.clear();
      await this.sessions.clear();
    });
  }
  
  async exportData(): Promise<string> {
    const tasks = await this.tasks.toArray();
    const sessions = await this.sessions.toArray();
    
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: { tasks, sessions },
    }, null, 2);
  }
  
  async importData(jsonData: string): Promise<void> {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.version || !parsed.data) {
        throw new Error('Invalid backup format');
      }
      
      await this.clearAllData();
      
      if (parsed.data.tasks) {
        await this.tasks.bulkAdd(parsed.data.tasks);
      }
      if (parsed.data.sessions) {
        await this.sessions.bulkAdd(parsed.data.sessions);
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('데이터 가져오기에 실패했습니다');
    }
  }
}

export const db = new DatabaseManager();
```

#### Step 5: Create Storage Service
Create `src/services/storageService.ts`:

```typescript
export class StorageService {
  private readonly STORAGE_KEY = 'adhd-time-manager-backup';
  
  async exportToFile(): Promise<void> {
    const state = store.getState();
    const data = JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        tasks: state.tasks.tasks,
        analytics: state.analytics,
        user: state.user,
      },
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adhd-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  async importFromFile(file: File): Promise<void> {
    const text = await file.text();
    const parsed = JSON.parse(text);
    
    if (!parsed.version || !parsed.data) {
      throw new Error('Invalid backup file format');
    }
    
    // Dispatch actions to update Redux store
    if (parsed.data.tasks) {
      store.dispatch({ type: 'tasks/importTasks', payload: parsed.data.tasks });
    }
    if (parsed.data.user) {
      store.dispatch({ type: 'user/importData', payload: parsed.data.user });
    }
    if (parsed.data.analytics) {
      store.dispatch({ type: 'analytics/importData', payload: parsed.data.analytics });
    }
  }
  
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { used: 0, quota: 0 };
  }
}
```

### Files to Modify/Create
- ✅ Install: redux-persist package **[INSTALLED]**
- ✅ Modify: `src/store/store.ts` **[IMPLEMENTED with Redux Persist]**
- ✅ Modify: `src/main.tsx` **[IMPLEMENTED with PersistGate]**
- ❌ Create: `src/services/IndexedDBManager.ts` **[Not implemented - using localStorage]**
- ✅ Create: `src/services/storageService.ts` **[IMPLEMENTED]**

### Testing Requirements
```typescript
// src/tests/services/storageService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../../services/storageService';

describe('StorageService', () => {
  let service: StorageService;
  
  beforeEach(() => {
    service = new StorageService();
    localStorage.clear();
  });
  
  it('should export and import data correctly', async () => {
    // Test export/import functionality
  });
  
  it('should handle corrupted data gracefully', async () => {
    // Test error handling
  });
});
```

### Common Pitfalls to Avoid
1. **Serialization issues**: Ensure dates are properly serialized
2. **Storage quotas**: Handle storage limit errors gracefully
3. **Migration failures**: Always backup before migrations
4. **Stale data**: Clear cache when updating data structure
5. **Performance**: Don't persist frequently changing data (like timer ticks)

### Definition of Done
- [x] Data persists across page refreshes ✅
- [x] Redux store automatically saves to localStorage ✅
- [x] Selective persistence (timer excluded) ✅
- [x] Loading state during rehydration ✅
- [x] Export/import functionality works ✅
- [x] Storage usage monitoring ✅
- [x] No data loss on updates ✅

---

## ✅ P0-005: Timer System Implementation [COMPLETED]

### Task Overview
- **Task ID**: P0-005
- **Task Name**: Timer System Implementation
- **Priority**: Critical (Blocking)
- **Time Estimate**: 16 hours
  - Timer Core Logic: 4 hours
  - Timer UI Components: 4 hours
  - Notifications: 3 hours
  - Background Timer: 3 hours
  - Testing: 2 hours
- **Dependencies**: P0-003, P0-004

### Current State vs Desired State
**Current State**:
- No working timer
- No Pomodoro cycles
- No break management
- No session tracking

**Desired State**:
- Full Pomodoro timer with focus/break cycles
- Background timer continues when tab inactive
- Audio and visual notifications
- Session history tracking
- Timer recovery after page refresh

### Implementation Steps

#### Step 1: Create Timer Service
Create `src/services/timerService.ts`:

```typescript
export class TimerService {
  private worker: Worker | null = null;
  private callbacks: Map<string, Function> = new Map();
  
  constructor() {
    this.initializeWorker();
  }
  
  private initializeWorker() {
    // Create a web worker for accurate timing
    const workerCode = `
      let interval = null;
      
      self.addEventListener('message', (e) => {
        if (e.data.command === 'start') {
          interval = setInterval(() => {
            self.postMessage({ type: 'tick' });
          }, 1000);
        } else if (e.data.command === 'stop') {
          clearInterval(interval);
        }
      });
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    
    this.worker.addEventListener('message', (e) => {
      if (e.data.type === 'tick' && this.callbacks.has('tick')) {
        this.callbacks.get('tick')?.();
      }
    });
  }
  
  start() {
    this.worker?.postMessage({ command: 'start' });
  }
  
  stop() {
    this.worker?.postMessage({ command: 'stop' });
  }
  
  onTick(callback: Function) {
    this.callbacks.set('tick', callback);
  }
  
  destroy() {
    this.stop();
    this.worker?.terminate();
  }
}
```

#### Step 2: Create Timer Recovery Service
Create `src/services/timerRecoveryService.ts`:

```typescript
interface TimerState {
  isRunning: boolean;
  startTime: number;
  duration: number;
  timeRemaining: number;
  taskId?: string;
}

export class TimerRecoveryService {
  private readonly STORAGE_KEY = 'timer-recovery';
  
  saveState(state: TimerState): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      ...state,
      savedAt: Date.now(),
    }));
  }
  
  recoverState(): TimerState | null {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (!saved) return null;
    
    try {
      const state = JSON.parse(saved);
      const elapsed = Date.now() - state.savedAt;
      
      if (state.isRunning && elapsed < state.timeRemaining * 1000) {
        return {
          ...state,
          timeRemaining: state.timeRemaining - Math.floor(elapsed / 1000),
        };
      }
      
      return state;
    } catch {
      return null;
    }
  }
  
  clearState(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
```

#### Step 3: Create Timer Hook
Create `src/hooks/useTimer.ts`:

```typescript
import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { 
  startTimer, 
  pauseTimer, 
  resumeTimer, 
  stopTimer, 
  tick, 
  completeTimer 
} from '../store/slices/timerSlice';
import { TimerService } from '../services/timerService';
import { TimerRecoveryService } from '../services/timerRecoveryService';
import { useNotifications } from './useNotifications';

export function useTimer() {
  const dispatch = useAppDispatch();
  const timerState = useAppSelector((state) => state.timer);
  const timerService = useRef<TimerService | null>(null);
  const recoveryService = useRef<TimerRecoveryService>(new TimerRecoveryService());
  const { showNotification, playSound } = useNotifications();
  
  // Initialize timer service
  useEffect(() => {
    timerService.current = new TimerService();
    
    timerService.current.onTick(() => {
      dispatch(tick());
    });
    
    // Recover timer state on mount
    const recovered = recoveryService.current.recoverState();
    if (recovered && recovered.isRunning) {
      dispatch(startTimer({ taskId: recovered.taskId }));
    }
    
    return () => {
      timerService.current?.destroy();
    };
  }, [dispatch]);
  
  // Handle timer completion
  useEffect(() => {
    if (timerState.timeRemaining === 0 && timerState.isRunning) {
      handleTimerComplete();
    }
  }, [timerState.timeRemaining, timerState.isRunning]);
  
  // Save state for recovery
  useEffect(() => {
    if (timerState.isRunning) {
      recoveryService.current.saveState({
        isRunning: timerState.isRunning,
        startTime: Date.now(),
        duration: timerState.timerDuration,
        timeRemaining: timerState.timeRemaining,
        taskId: timerState.currentSession?.taskId,
      });
    } else {
      recoveryService.current.clearState();
    }
  }, [timerState]);
  
  const handleTimerComplete = useCallback(() => {
    dispatch(completeTimer());
    
    // Show notification
    const message = timerState.timerType === 'focus' 
      ? '포모도로 완료! 휴식 시간입니다.' 
      : '휴식 끝! 다시 집중할 시간입니다.';
    
    showNotification('타이머 완료', message);
    playSound('complete');
  }, [dispatch, timerState.timerType, showNotification, playSound]);
  
  const start = useCallback((taskId?: string) => {
    dispatch(startTimer({ taskId }));
    timerService.current?.start();
  }, [dispatch]);
  
  const pause = useCallback(() => {
    dispatch(pauseTimer());
    timerService.current?.stop();
  }, [dispatch]);
  
  const resume = useCallback(() => {
    dispatch(resumeTimer());
    timerService.current?.start();
  }, [dispatch]);
  
  const stop = useCallback(() => {
    dispatch(stopTimer());
    timerService.current?.stop();
    recoveryService.current.clearState();
  }, [dispatch]);
  
  return {
    ...timerState,
    start,
    pause,
    resume,
    stop,
  };
}
```

#### Step 4: Create Timer Components
Create `src/components/timer/PomodoroTimer.tsx`:

```typescript
import { useTimer } from '../../hooks/useTimer';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import TimerSettings from './TimerSettings';
import { Card } from '../ui/Card';

export default function PomodoroTimer() {
  const timer = useTimer();
  
  return (
    <div className="space-y-6">
      <Card>
        <div className="text-center">
          <TimerDisplay 
            timeRemaining={timer.timeRemaining}
            timerType={timer.timerType}
            isRunning={timer.isRunning}
          />
          
          <TimerControls
            isRunning={timer.isRunning}
            isPaused={timer.isPaused}
            onStart={timer.start}
            onPause={timer.pause}
            onResume={timer.resume}
            onStop={timer.stop}
          />
          
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < timer.pomodoroCount % 4
                    ? 'bg-indigo-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
      
      <TimerSettings />
    </div>
  );
}
```

### Files to Modify/Create
- ✅ Create: `src/services/timerService.ts` **[IMPLEMENTED]**
- ✅ Create: `src/services/timerRecoveryService.ts` **[IMPLEMENTED]**
- ✅ Create: `src/hooks/useTimer.ts` **[IMPLEMENTED]**
- ✅ Create: `src/hooks/useNotifications.ts` **[IMPLEMENTED]**
- ✅ Create: `src/components/timer/PomodoroTimer.tsx` **[IMPLEMENTED]**
- ✅ Create: `src/components/timer/TimerDisplay.tsx` **[IMPLEMENTED]**
- ✅ Create: `src/components/timer/TimerControls.tsx` **[IMPLEMENTED]**
- ❌ Create: `src/components/timer/TimerSettings.tsx` **[Not found separately]**

### Common Pitfalls to Avoid
1. **Timer drift**: Use Web Workers for accurate timing
2. **Tab throttling**: Handle visibility API changes
3. **State recovery**: Save timer state to sessionStorage
4. **Memory leaks**: Clean up intervals and workers
5. **Notification permissions**: Request permissions early

### Definition of Done
- [x] Timer starts, pauses, resumes, stops correctly ✅
- [x] Accurate timing implementation ✅
- [x] Continues in background tabs ✅
- [x] Recovers state after refresh ✅
- [ ] Audio/visual notifications (partial implementation)
- [x] Pomodoro cycles tracked ✅
- [x] Settings persisted ✅
- [x] No memory leaks ✅

---

## ✅ P0-006: Task Auto-Split Logic [COMPLETED]

### Task Overview
- **Task ID**: P0-006
- **Task Name**: Task Auto-Split Logic
- **Priority**: Critical (Blocking)
- **Time Estimate**: 8 hours
  - Split Algorithm: 2 hours
  - UI Integration: 3 hours
  - Parent-Child Relationships: 2 hours
  - Testing: 1 hour
- **Dependencies**: P0-002 (Task Modal must exist)

### Current State vs Desired State
**Current State**:
- Long tasks are overwhelming
- No automatic breaking down
- No subtask management

**Desired State**:
- Tasks >25min automatically split
- Smart subtask generation
- Parent-child task relationships
- Progress tracking across subtasks
- Flexible override options

### Implementation Steps

#### Step 1: Create Split Algorithm
Create `src/utils/taskSplitter.ts`:

```typescript
export interface SplitResult {
  subtasks: Array<{
    title: string;
    duration: number;
    description?: string;
  }>;
  totalDuration: number;
  pomodoroCount: number;
}

export function splitTask(
  title: string,
  duration: number,
  description?: string
): SplitResult {
  const POMODORO_DURATION = 25;
  const pomodoroCount = Math.ceil(duration / POMODORO_DURATION);
  const subtasks = [];
  
  if (pomodoroCount <= 1) {
    return {
      subtasks: [{
        title,
        duration,
        description
      }],
      totalDuration: duration,
      pomodoroCount: 1
    };
  }
  
  // Smart splitting based on duration
  let remainingDuration = duration;
  let partNumber = 1;
  
  while (remainingDuration > 0) {
    const subtaskDuration = Math.min(POMODORO_DURATION, remainingDuration);
    const isLast = remainingDuration <= POMODORO_DURATION;
    
    subtasks.push({
      title: `${title} - 파트 ${partNumber}`,
      duration: subtaskDuration,
      description: isLast && remainingDuration < POMODORO_DURATION
        ? `마무리 작업 (${subtaskDuration}분)`
        : `포모도로 세션 ${partNumber}`,
    });
    
    remainingDuration -= subtaskDuration;
    partNumber++;
  }
  
  return {
    subtasks,
    totalDuration: duration,
    pomodoroCount
  };
}

export function generateSmartSubtasks(
  title: string,
  duration: number,
  taskType?: string
): SplitResult {
  // Smart splitting based on task type
  const templates: Record<string, (title: string, sessions: number) => string[]> = {
    writing: (title, sessions) => [
      `${title} - 아웃라인 작성`,
      `${title} - 초안 작성`,
      `${title} - 수정 및 편집`,
      `${title} - 최종 검토`,
    ].slice(0, sessions),
    
    coding: (title, sessions) => [
      `${title} - 요구사항 분석`,
      `${title} - 구현`,
      `${title} - 테스트 작성`,
      `${title} - 리팩토링`,
    ].slice(0, sessions),
    
    study: (title, sessions) => [
      `${title} - 개요 파악`,
      `${title} - 심화 학습`,
      `${title} - 정리 및 복습`,
      `${title} - 실습/연습`,
    ].slice(0, sessions),
    
    default: (title, sessions) => 
      Array.from({ length: sessions }, (_, i) => 
        `${title} - 세션 ${i + 1}`
      ),
  };
  
  const POMODORO_DURATION = 25;
  const pomodoroCount = Math.ceil(duration / POMODORO_DURATION);
  const template = templates[taskType || 'default'] || templates.default;
  const subtaskTitles = template(title, pomodoroCount);
  
  const subtasks = subtaskTitles.map((subtaskTitle, index) => {
    const isLast = index === subtaskTitles.length - 1;
    const remainingDuration = duration - (index * POMODORO_DURATION);
    
    return {
      title: subtaskTitle,
      duration: isLast 
        ? Math.min(remainingDuration, POMODORO_DURATION)
        : POMODORO_DURATION,
    };
  });
  
  return {
    subtasks,
    totalDuration: duration,
    pomodoroCount
  };
}
```

#### Step 2: Create Task Split Modal
Create `src/components/tasks/TaskSplitModal.tsx`:

```typescript
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { splitTask, generateSmartSubtasks } from '../../utils/taskSplitter';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface TaskSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subtasks: any[]) => void;
  taskTitle: string;
  taskDuration: number;
  taskType?: string;
}

export default function TaskSplitModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  taskDuration,
  taskType
}: TaskSplitModalProps) {
  const [useSmartSplit, setUseSmartSplit] = useState(true);
  const [customSubtasks, setCustomSubtasks] = useState<any[]>([]);
  
  const splitResult = useSmartSplit
    ? generateSmartSubtasks(taskTitle, taskDuration, taskType)
    : splitTask(taskTitle, taskDuration);
  
  const handleConfirm = () => {
    onConfirm(useSmartSplit ? splitResult.subtasks : customSubtasks);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="작업 자동 분할"
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            이 작업은 {taskDuration}분으로 예상됩니다. 
            포모도로 기법에 따라 25분 단위로 자동 분할하시겠습니까?
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setUseSmartSplit(true)}
            className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
              useSmartSplit 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <SparklesIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">스마트 분할</span>
          </button>
          
          <button
            onClick={() => setUseSmartSplit(false)}
            className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
              !useSmartSplit 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <ClockIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">균등 분할</span>
          </button>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 dark:text-white">
            생성될 하위 작업 ({splitResult.pomodoroCount}개)
          </h3>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {splitResult.subtasks.map((subtask, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) => {
                      const updated = [...splitResult.subtasks];
                      updated[index].title = e.target.value;
                      setCustomSubtasks(updated);
                    }}
                    className="w-full bg-transparent border-none focus:outline-none"
                    disabled={useSmartSplit}
                  />
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {subtask.duration}분
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            분할 적용
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

#### Step 3: Update Task Slice for Subtasks
Update `src/store/slices/taskSlice.ts`:

```typescript
// Add to task slice
createTaskWithSubtasks: (state, action: PayloadAction<{
  parent: Task;
  subtasks: Array<Partial<Task>>;
}>) => {
  const parentId = action.payload.parent.id;
  
  // Create parent task
  const parentTask = {
    ...action.payload.parent,
    hasSubtasks: true,
    subtaskIds: [] as string[],
  };
  
  // Create subtasks
  const subtasks = action.payload.subtasks.map((subtask, index) => ({
    ...subtask,
    id: `${parentId}-sub-${index}`,
    parentId: parentId,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  parentTask.subtaskIds = subtasks.map(s => s.id);
  
  // Add to state
  state.tasks.push(parentTask);
  state.tasks.push(...subtasks);
},

updateSubtaskProgress: (state, action: PayloadAction<{
  parentId: string;
  subtaskId: string;
  completed: boolean;
}>) => {
  const subtask = state.tasks.find(t => t.id === action.payload.subtaskId);
  if (subtask) {
    subtask.status = action.payload.completed ? 'completed' : 'in_progress';
  }
  
  // Update parent progress
  const parent = state.tasks.find(t => t.id === action.payload.parentId);
  if (parent && parent.subtaskIds) {
    const completedCount = parent.subtaskIds.filter(id => {
      const st = state.tasks.find(t => t.id === id);
      return st?.status === 'completed';
    }).length;
    
    parent.completedPomodoros = completedCount;
    
    if (completedCount === parent.subtaskIds.length) {
      parent.status = 'completed';
    } else if (completedCount > 0) {
      parent.status = 'in_progress';
    }
  }
},
```

### Files to Modify/Create
- ❌ Create: `src/utils/taskSplitter.ts` **[Not created - logic in components]**
- ✅ Create: `src/components/tasks/TaskSplitModal.tsx` **[IMPLEMENTED]**
- ✅ Modify: `src/store/slices/taskSlice.ts` **[IMPLEMENTED with auto-split]**
- ✅ Modify: `src/components/tasks/TaskForm.tsx` **[IMPLEMENTED with split trigger]**

### Testing Requirements
```typescript
// src/tests/utils/taskSplitter.test.ts
import { describe, it, expect } from 'vitest';
import { splitTask, generateSmartSubtasks } from '../../utils/taskSplitter';

describe('Task Splitter', () => {
  it('should not split tasks under 25 minutes', () => {
    const result = splitTask('Short task', 20);
    expect(result.subtasks).toHaveLength(1);
    expect(result.pomodoroCount).toBe(1);
  });
  
  it('should split 50-minute task into 2 pomodoros', () => {
    const result = splitTask('Medium task', 50);
    expect(result.subtasks).toHaveLength(2);
    expect(result.subtasks[0].duration).toBe(25);
    expect(result.subtasks[1].duration).toBe(25);
  });
  
  it('should handle odd durations correctly', () => {
    const result = splitTask('Odd task', 40);
    expect(result.subtasks).toHaveLength(2);
    expect(result.subtasks[0].duration).toBe(25);
    expect(result.subtasks[1].duration).toBe(15);
  });
});
```

### Common Pitfalls to Avoid
1. **Parent-child sync**: Keep parent and subtask states synchronized
2. **Progress calculation**: Ensure accurate progress tracking
3. **Edge cases**: Handle tasks that don't divide evenly
4. **User control**: Always allow manual override
5. **Performance**: Avoid creating too many subtasks

### Definition of Done
- [x] Tasks >25min show split option ✅
- [x] Smart split generates contextual subtasks ✅
- [x] Manual split allows customization ✅
- [x] Parent task tracks subtask progress ✅
- [x] Subtasks can be managed independently ✅
- [x] Progress bar shows combined progress ✅
- [x] No performance issues with many subtasks ✅

---

## 📝 Summary

### Phase 1 Part 2 Checklist
- [x] **P0-004**: Data Persistence System ✅
  - [x] Redux Persist configured ✅
  - [x] LocalStorage integration working ✅
  - [x] Data survives refresh ✅
  - [x] Export/import functionality ✅
  
- [x] **P0-005**: Timer System Implementation ✅
  - [x] Pomodoro timer working ✅
  - [x] Background timing accurate ✅
  - [ ] Notifications functional (partial)
  - [x] Session tracking ✅
  
- [x] **P0-006**: Task Auto-Split Logic ✅
  - [x] Auto-split for long tasks ✅
  - [x] Smart subtask generation ✅
  - [x] Parent-child relationships ✅
  - [x] Progress tracking ✅

### Next Steps
After completing Part 2, proceed to Phase 2: Core Functionality Implementation which includes:
- Analytics dashboard
- Productivity insights
- Social features
- Advanced scheduling
- Mobile responsiveness

### Success Criteria
- All P0 tasks completed and tested
- No blocking bugs
- Data persistence verified
- Timer accuracy confirmed
- Auto-split working smoothly
- Ready for Phase 2 implementation

---

**End of Phase 1 Part 2 Documentation**