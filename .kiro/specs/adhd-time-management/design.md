# Design Document

## Overview

ADHD 시간관리 웹앱은 React 기반의 SPA(Single Page Application)로 구현되며, ADHD 사용자의 인지적 특성에 최적화된 사용자 경험을 제공합니다. 앱은 모듈화된 컴포넌트 구조를 통해 유지보수성을 높이고, 상태 관리는 Redux Toolkit을 사용하여 예측 가능한 상태 변화를 보장합니다.

## Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────┐
│                 React App               │
├─────────────────────────────────────────┤
│  Components Layer                       │
│  ├── Dashboard                          │
│  ├── TaskManager                        │
│  ├── PomodoroTimer                      │
│  ├── FocusMode                          │
│  └── Analytics                          │
├─────────────────────────────────────────┤
│  State Management (Redux Toolkit)      │
│  ├── taskSlice                         │
│  ├── timerSlice                        │
│  ├── userSlice                         │
│  └── analyticsSlice                    │
├─────────────────────────────────────────┤
│  Services Layer                        │
│  ├── TaskService                       │
│  ├── TimerService                      │
│  ├── AnalyticsService                  │
│  └── NotificationService               │
├─────────────────────────────────────────┤
│  Storage Layer                         │
│  ├── LocalStorage (offline-first)      │
│  └── IndexedDB (large data)            │
└─────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS + Framer Motion (animations)
- **Storage**: LocalStorage + IndexedDB
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## Components and Interfaces

### Core Components

#### 1. Dashboard Component
```typescript
interface DashboardProps {
  user: User;
  todayTasks: Task[];
  completedPomodoros: number;
  currentStreak: number;
}

interface DashboardState {
  energyLevel: 'low' | 'medium' | 'high';
  focusMode: boolean;
  currentTask: Task | null;
}
```

#### 2. TaskManager Component
```typescript
interface TaskManagerProps {
  tasks: Task[];
  onTaskCreate: (task: CreateTaskRequest) => void;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedDuration: number; // minutes
  subtasks: Subtask[];
  priority: 'low' | 'medium' | 'high';
  category: string;
  isFlexible: boolean;
  status: 'pending' | 'in-progress' | 'completed' | 'postponed';
  createdAt: Date;
  completedAt?: Date;
}

interface Subtask {
  id: string;
  title: string;
  duration: number; // 15-25 minutes
  isCompleted: boolean;
  completedAt?: Date;
}
```

#### 3. PomodoroTimer Component
```typescript
interface PomodoroTimerProps {
  task: Task;
  onComplete: (duration: number) => void;
  onPause: () => void;
  onStop: () => void;
}

interface TimerState {
  mode: 'focus' | 'short-break' | 'long-break';
  duration: number; // seconds
  remaining: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
  currentCycle: number;
  totalCycles: number;
}

interface TimerSettings {
  focusDurations: [15, 25, 45]; // minutes
  shortBreakDurations: [5, 10, 15]; // minutes
  longBreakDuration: 25; // minutes
  cyclesBeforeLongBreak: 3;
}
```

#### 4. FocusMode Component
```typescript
interface FocusModeProps {
  isActive: boolean;
  currentTask: Task;
  onToggle: () => void;
  onDistraction: (type: DistractionType) => void;
}

interface FocusSettings {
  hideNotifications: boolean;
  blockDistractions: boolean;
  showBreathingReminders: boolean;
  inactivityThreshold: number; // minutes
}

type DistractionType = 'website' | 'notification' | 'inactivity' | 'manual';
```

#### 5. Analytics Component
```typescript
interface AnalyticsProps {
  timeRange: 'week' | 'month' | 'quarter';
  data: AnalyticsData;
}

interface AnalyticsData {
  completionRate: number;
  averageFocusTime: number;
  productiveHours: number[];
  preferredTaskTypes: string[];
  streakData: StreakData;
  improvementAreas: string[];
}

interface StreakData {
  current: number;
  longest: number;
  weeklyGoal: number;
}
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  name: string;
  preferences: UserPreferences;
  settings: UserSettings;
  createdAt: Date;
  lastActiveAt: Date;
}

interface UserPreferences {
  defaultFocusDuration: number;
  defaultBreakDuration: number;
  preferredTaskCategories: string[];
  energyTrackingEnabled: boolean;
  notificationsEnabled: boolean;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  timezone: string;
  focusMode: FocusSettings;
  timer: TimerSettings;
}
```

### Session Model
```typescript
interface Session {
  id: string;
  taskId: string;
  type: 'focus' | 'break';
  plannedDuration: number; // minutes
  actualDuration: number; // minutes
  startedAt: Date;
  completedAt?: Date;
  wasInterrupted: boolean;
  interruptionReasons: DistractionType[];
  energyBefore: number; // 1-5 scale
  energyAfter: number; // 1-5 scale
}
```

### Analytics Model
```typescript
interface DailyStats {
  date: Date;
  tasksCompleted: number;
  tasksPlanned: number;
  focusMinutes: number;
  breakMinutes: number;
  pomodorosCompleted: number;
  averageEnergyLevel: number;
  distractions: DistractionType[];
}

interface WeeklyInsight {
  weekStart: Date;
  completionRate: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
  improvementSuggestions: string[];
  goalAchievement: boolean;
}
```

## Error Handling

### Error Types
```typescript
type AppError = 
  | 'TASK_NOT_FOUND'
  | 'TIMER_ALREADY_RUNNING'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'NOTIFICATION_PERMISSION_DENIED'
  | 'INVALID_TASK_DURATION'
  | 'SUBTASK_CREATION_FAILED';

interface ErrorState {
  type: AppError;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}
```

### Error Handling Strategy
1. **Graceful Degradation**: 저장소 오류 시 메모리 상태로 폴백
2. **User-Friendly Messages**: ADHD 사용자를 고려한 비난하지 않는 오류 메시지
3. **Automatic Recovery**: 타이머 중단 시 자동 복구 옵션 제공
4. **Offline Support**: 네트워크 오류 시 로컬 저장소 활용

### Error Recovery Patterns
```typescript
// 타이머 복구 예시
const recoverTimer = (lastState: TimerState) => {
  const elapsed = Date.now() - lastState.startTime;
  const remaining = Math.max(0, lastState.duration - elapsed);
  
  if (remaining > 0) {
    return { ...lastState, remaining, isRunning: false };
  } else {
    // 시간이 지났으면 완료 처리
    return completeCurrentSession(lastState);
  }
};
```

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library를 사용한 컴포넌트 렌더링 및 상호작용 테스트
- **Redux Slices**: 상태 변화 로직 테스트
- **Services**: 비즈니스 로직 및 데이터 처리 테스트
- **Utilities**: 시간 계산, 데이터 변환 함수 테스트

### Integration Testing
- **Timer Flow**: 포모도로 타이머의 전체 사이클 테스트
- **Task Management**: 작업 생성부터 완료까지의 플로우 테스트
- **Storage Integration**: LocalStorage 및 IndexedDB 연동 테스트

### Accessibility Testing
- **Keyboard Navigation**: 키보드만으로 모든 기능 접근 가능
- **Screen Reader**: ARIA 레이블 및 시맨틱 HTML 구조
- **Color Contrast**: WCAG 2.1 AA 기준 준수
- **Focus Management**: 집중 모드에서의 포커스 트랩

### Performance Testing
- **Bundle Size**: 초기 로딩 시간 최적화
- **Memory Usage**: 장시간 사용 시 메모리 누수 방지
- **Timer Accuracy**: 타이머 정확도 및 백그라운드 동작 테스트

### User Experience Testing
```typescript
// ADHD 사용자 시나리오 테스트
describe('ADHD User Scenarios', () => {
  test('should handle task switching gracefully', () => {
    // 작업 중간에 다른 작업으로 전환하는 시나리오
  });
  
  test('should provide gentle reminders for inactivity', () => {
    // 15분 비활성 후 부드러운 리마인더 테스트
  });
  
  test('should adjust goals when completion rate is low', () => {
    // 완료율이 낮을 때 목표 자동 조정 테스트
  });
});
```

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: 라우트별 청크 분할로 초기 로딩 시간 단축
2. **Memoization**: React.memo 및 useMemo를 통한 불필요한 리렌더링 방지
3. **Virtual Scrolling**: 많은 작업 목록에 대한 가상 스크롤링
4. **Debounced Updates**: 사용자 입력에 대한 디바운싱 처리

### Memory Management
```typescript
// 타이머 정리 예시
useEffect(() => {
  const interval = setInterval(updateTimer, 1000);
  
  return () => {
    clearInterval(interval);
    // 컴포넌트 언마운트 시 타이머 상태 저장
    saveTimerState(timerState);
  };
}, []);
```

### Storage Optimization
- **Data Compression**: 분석 데이터의 압축 저장
- **Cleanup Strategy**: 오래된 세션 데이터 자동 정리
- **Incremental Sync**: 변경된 데이터만 저장소에 업데이트