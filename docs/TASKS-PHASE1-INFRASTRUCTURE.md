# 📋 PHASE 1: CRITICAL INFRASTRUCTURE - Detailed Implementation Guide

## 📚 Document Split Notice
⚠️ **This document has been split for better readability!**

This long document has been divided into two parts:

### 📖 Part 1: [TASKS-PHASE1-PART1.md](./TASKS-PHASE1-PART1.md)
**Coverage**: P0-001 to P0-003
- ✅ P0-001: Navigation System Implementation (8 hours) **[COMPLETED]** ✅
- ✅ P0-002: Task Modal and Form Implementation (16 hours) **[COMPLETED]** ✅
- ✅ P0-003: Redux Store Integration (12 hours) **[COMPLETED]** ✅

### 📖 Part 2: [TASKS-PHASE1-PART2.md](./TASKS-PHASE1-PART2.md)
**Coverage**: P0-004 to P0-006
- ✅ P0-004: Data Persistence System (12 hours) **[COMPLETED]** ✅
- ✅ P0-005: Timer System Implementation (16 hours) **[COMPLETED]** ✅
- ✅ P0-006: Task Auto-Split Logic (8 hours) **[COMPLETED]** ✅

**💡 Recommendation**: Please use the split documents above for implementation. They contain the same content but are more manageable to read and follow.

---

## 🎯 Phase Overview (Original)
**Phase Goal**: Establish the essential foundation for the ADHD Time Manager application  
**Total Estimated Time**: 72 hours  
**Priority**: P0 - Critical (All tasks are blocking issues)  
**Prerequisites**: Node.js 18+, npm/pnpm, VS Code or similar IDE  

---

## 🚨 P0-001: Navigation System Implementation

### Task Overview
- **Task ID**: P0-001
- **Task Name**: Navigation System Implementation  
- **Priority**: Critical (Blocking)
- **Time Estimate**: 8 hours
  - Setup & Installation: 1 hour
  - Router Configuration: 2 hours
  - Component Updates: 3 hours
  - Testing & Debugging: 2 hours
- **Dependencies**: None (This is the first task)

### Current State vs Desired State
**Current State**:
- Manual page switching with state in App.tsx
- Only dashboard page loads
- No URL routing
- No browser navigation support
- Pages cannot be accessed directly

**Desired State**:
- Full React Router v6 implementation
- All pages accessible via URL
- Browser back/forward navigation works
- Clean URLs for each section
- 404 page handling

### Implementation Steps

#### Step 1: Install Dependencies
```bash
npm install react-router-dom@6.26.1 @types/react-router-dom@5.3.3
```

#### Step 2: Create Router Configuration
Create `src/router/AppRouter.tsx`:

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../components/dashboard/Dashboard';
import TaskManager from '../components/tasks/TaskManager';
import PomodoroTimer from '../components/timer/PomodoroTimer';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';
import SettingsPage from '../pages/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'tasks',
        element: <TaskManager />,
        children: [
          {
            path: ':taskId',
            element: <TaskManager /> // Will handle taskId internally
          }
        ]
      },
      {
        path: 'timer',
        element: <PomodoroTimer />,
        children: [
          {
            path: ':taskId',
            element: <PomodoroTimer /> // Timer with specific task
          }
        ]
      },
      {
        path: 'analytics',
        element: <AnalyticsOverview />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      }
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
```

#### Step 3: Update App.tsx
Replace current App.tsx content:

```typescript
import { Provider } from 'react-redux';
import { store } from './store/store';
import AppRouter from './router/AppRouter';
import { useTheme } from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const { theme } = useTheme();
  
  return (
    <Provider store={store}>
      <div className={`app ${theme}`}>
        <AppRouter />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#1f2937' : '#fff',
              color: theme === 'dark' ? '#f3f4f6' : '#111827',
            },
          }}
        />
      </div>
    </Provider>
  );
}

export default App;
```

#### Step 4: Update Layout Component
Modify `src/components/layout/Layout.tsx`:

```typescript
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ClipboardListIcon, 
  ClockIcon, 
  ChartBarIcon, 
  CogIcon 
} from '@heroicons/react/24/outline';

const navigationItems = [
  { path: '/', label: '대시보드', icon: HomeIcon },
  { path: '/tasks', label: '작업 관리', icon: ClipboardListIcon },
  { path: '/timer', label: '타이머', icon: ClockIcon },
  { path: '/analytics', label: '분석', icon: ChartBarIcon },
  { path: '/settings', label: '설정', icon: CogIcon },
];

export default function Layout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors
                    ${isActive 
                      ? 'border-indigo-500 text-gray-900 dark:text-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
```

#### Step 5: Create 404 Page
Create `src/pages/NotFoundPage.tsx`:

```typescript
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFoundPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          404 - 페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
```

#### Step 6: Add Navigation Hooks
Create `src/hooks/useNavigation.ts`:

```typescript
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

export function useNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  const navigateToTask = useCallback((taskId: string) => {
    navigate(`/tasks/${taskId}`);
  }, [navigate]);
  
  const navigateToTimer = useCallback((taskId?: string) => {
    if (taskId) {
      navigate(`/timer/${taskId}`);
    } else {
      navigate('/timer');
    }
  }, [navigate]);
  
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  return {
    navigate,
    navigateToTask,
    navigateToTimer,
    goBack,
    currentPath: location.pathname,
    params,
  };
}
```

### Files to Modify/Create
- ✅ Create: `src/router/AppRouter.tsx`
- ✅ Create: `src/pages/NotFoundPage.tsx`
- ✅ Create: `src/hooks/useNavigation.ts`
- ✅ Modify: `src/App.tsx`
- ✅ Modify: `src/components/layout/Layout.tsx`

### Testing Requirements

#### Unit Tests
Create `src/tests/router/AppRouter.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

describe('AppRouter', () => {
  it('renders dashboard on root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>
    );
    expect(screen.getByText(/대시보드/i)).toBeInTheDocument();
  });
  
  it('renders 404 page on unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <Layout />
      </MemoryRouter>
    );
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });
});
```

#### Manual Testing Checklist
- [ ] Navigate to each page using navigation menu
- [ ] Direct URL access works for all routes
- [ ] Browser back/forward buttons work correctly
- [ ] 404 page appears for invalid routes
- [ ] Active navigation item is highlighted
- [ ] URL parameters work (e.g., /tasks/123)
- [ ] Page refresh maintains current route

### Common Pitfalls to Avoid
1. **Don't forget basename**: If deploying to subdirectory, add basename to router
2. **Avoid nested routers**: Use one router at the app root
3. **Handle loading states**: Add suspense boundaries for lazy-loaded routes
4. **Test deep links**: Ensure direct URL access works after deployment
5. **Check 404 handling**: Both client and server-side 404s should work

### Definition of Done
- [ ] All navigation menu items work
- [ ] Direct URL access functional for all routes
- [ ] Browser navigation (back/forward) works
- [ ] 404 page displays for invalid routes
- [ ] No console errors during navigation
- [ ] Tests pass (unit and manual)
- [ ] Code reviewed and documented

---

## 🚨 P0-002: Task Modal and Form Implementation

### Task Overview
- **Task ID**: P0-002
- **Task Name**: Task Modal and Form Implementation
- **Priority**: Critical (Blocking)
- **Time Estimate**: 16 hours
  - Modal Component: 3 hours
  - Form Implementation: 5 hours
  - Validation & Error Handling: 3 hours
  - Redux Integration: 3 hours
  - Testing: 2 hours
- **Dependencies**: P0-001 (Navigation must work first)

### Current State vs Desired State
**Current State**:
- "새 작업" button shows alert instead of modal
- No task creation functionality
- No form validation
- No task editing capability

**Desired State**:
- Full-featured modal with smooth animations
- Complete task form with all fields
- Real-time validation with helpful error messages
- Create and edit modes
- Auto-split preview for long tasks
- Redux integration for state management

### Implementation Steps

#### Step 1: Install Form Dependencies
```bash
npm install react-hook-form@7.52.1 @hookform/resolvers@3.9.0 zod@3.23.8
npm install react-modal@3.16.1 @types/react-modal@3.16.3
```

#### Step 2: Create Task Validation Schema
Create `src/schemas/taskSchema.ts`:

```typescript
import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string()
    .min(1, '작업 제목은 필수입니다')
    .max(100, '제목은 100자 이내여야 합니다'),
  
  description: z.string()
    .max(500, '설명은 500자 이내여야 합니다')
    .optional(),
  
  duration: z.number()
    .min(5, '최소 5분 이상이어야 합니다')
    .max(240, '최대 4시간까지 설정 가능합니다'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: '올바른 우선순위를 선택하세요' })
  }),
  
  category: z.string()
    .min(1, '카테고리를 선택하세요'),
  
  energyLevel: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: '에너지 레벨을 선택하세요' })
  }),
  
  scheduledDate: z.date().optional(),
  
  tags: z.array(z.string()).max(5, '태그는 최대 5개까지 추가 가능합니다').optional(),
  
  enableAutoSplit: z.boolean().default(true),
});

export type TaskFormData = z.infer<typeof taskSchema>;

// Subtask preview calculation
export function calculateSubtasks(duration: number): Array<{ duration: number; title: string }> {
  if (duration <= 25) return [];
  
  const subtaskCount = Math.ceil(duration / 25);
  const subtasks = [];
  let remainingTime = duration;
  
  for (let i = 0; i < subtaskCount; i++) {
    const subtaskDuration = Math.min(remainingTime, 25);
    subtasks.push({
      duration: subtaskDuration,
      title: `파트 ${i + 1}`,
    });
    remainingTime -= subtaskDuration;
  }
  
  return subtasks;
}
```

#### Step 3: Create Modal Component
Create `src/components/ui/Modal.tsx`:

```typescript
import { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-x-4 top-[10vh] mx-auto ${sizeClasses[size]} bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="닫기"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

#### Step 4: Create Task Form Component
Create `src/components/tasks/TaskForm.tsx`:

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskFormData, calculateSubtasks } from '../../schemas/taskSchema';
import { useState, useEffect } from 'react';
import { 
  ExclamationCircleIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  mode: 'create' | 'edit';
}

const priorityOptions = [
  { value: 'low', label: '낮음', color: 'text-gray-500' },
  { value: 'medium', label: '보통', color: 'text-blue-500' },
  { value: 'high', label: '높음', color: 'text-orange-500' },
  { value: 'urgent', label: '긴급', color: 'text-red-500' },
];

const energyOptions = [
  { value: 'low', label: '낮음', icon: SparklesIcon, color: 'text-green-500' },
  { value: 'medium', label: '보통', icon: BoltIcon, color: 'text-yellow-500' },
  { value: 'high', label: '높음', icon: FireIcon, color: 'text-red-500' },
];

const categories = [
  '업무', '학습', '개인', '건강', '취미', '가사', '기타'
];

export default function TaskForm({ onSubmit, initialData, mode }: TaskFormProps) {
  const [subtaskPreview, setSubtaskPreview] = useState<Array<{ duration: number; title: string }>>([]);
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 25,
      priority: 'medium',
      category: '업무',
      energyLevel: 'medium',
      enableAutoSplit: true,
      tags: [],
      ...initialData,
    },
  });
  
  const duration = watch('duration');
  const enableAutoSplit = watch('enableAutoSplit');
  
  // Update subtask preview when duration changes
  useEffect(() => {
    if (enableAutoSplit && duration > 25) {
      setSubtaskPreview(calculateSubtasks(duration));
    } else {
      setSubtaskPreview([]);
    }
  }, [duration, enableAutoSplit]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          작업 제목 *
        </label>
        <input
          {...register('title')}
          type="text"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          placeholder="예: 프로젝트 보고서 작성"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <ExclamationCircleIcon className="w-4 h-4 mr-1" />
            {errors.title.message}
          </p>
        )}
      </div>
      
      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          설명
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          placeholder="작업에 대한 상세 설명을 입력하세요"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      
      {/* Duration Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          예상 소요 시간: {duration}분
        </label>
        <div className="relative">
          <input
            {...register('duration', { valueAsNumber: true })}
            type="range"
            min="5"
            max="240"
            step="5"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5분</span>
            <span>1시간</span>
            <span>2시간</span>
            <span>3시간</span>
            <span>4시간</span>
          </div>
        </div>
        
        {/* Auto-split toggle */}
        {duration > 25 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                {...register('enableAutoSplit')}
                type="checkbox"
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                25분 단위로 자동 분할 (포모도로 기법)
              </span>
            </label>
            
            {/* Subtask Preview */}
            {subtaskPreview.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">자동 생성될 하위 작업:</p>
                {subtaskPreview.map((subtask, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {subtask.title}: {subtask.duration}분
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Priority and Energy Level */}
      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            우선순위 *
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center px-3 py-2 border rounded-lg cursor-pointer transition-colors
                      ${field.value === option.value 
                        ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <input
                      type="radio"
                      {...field}
                      value={option.value}
                      className="sr-only"
                    />
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          />
        </div>
        
        {/* Energy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            필요 에너지 레벨 *
          </label>
          <Controller
            name="energyLevel"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {energyOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex-1 flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors
                      ${field.value === option.value 
                        ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <input
                      type="radio"
                      {...field}
                      value={option.value}
                      className="sr-only"
                    />
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-xs mt-1">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
        </div>
      </div>
      
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          카테고리 *
        </label>
        <select
          {...register('category')}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '저장 중...' : mode === 'create' ? '작업 생성' : '수정 완료'}
        </button>
      </div>
    </form>
  );
}
```

#### Step 5: Create Task Modal Component
Create `src/components/tasks/TaskModal.tsx`:

```typescript
import { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { createTask, updateTask } from '../../store/slices/taskSlice';
import Modal from '../ui/Modal';
import TaskForm from './TaskForm';
import { TaskFormData } from '../../schemas/taskSchema';
import { Task } from '../../types/task';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  mode: 'create' | 'edit';
}

export default function TaskModal({ isOpen, onClose, task, mode }: TaskModalProps) {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    
    try {
      if (mode === 'create') {
        const newTask: Task = {
          id: uuidv4(),
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedPomodoros: 0,
          totalPomodoros: Math.ceil(data.duration / 25),
          subtasks: data.enableAutoSplit && data.duration > 25 
            ? calculateSubtasks(data.duration).map((st, index) => ({
                id: uuidv4(),
                title: `${data.title} - ${st.title}`,
                duration: st.duration,
                completed: false,
                order: index,
              }))
            : [],
        };
        
        await dispatch(createTask(newTask)).unwrap();
        toast.success('작업이 성공적으로 생성되었습니다!');
      } else if (task) {
        const updatedTask = {
          ...task,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        
        await dispatch(updateTask(updatedTask)).unwrap();
        toast.success('작업이 성공적으로 수정되었습니다!');
      }
      
      onClose();
    } catch (error) {
      toast.error(mode === 'create' ? '작업 생성에 실패했습니다' : '작업 수정에 실패했습니다');
      console.error('Task operation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? '새 작업 만들기' : '작업 수정'}
      size="lg"
    >
      <TaskForm
        onSubmit={handleSubmit}
        initialData={task}
        mode={mode}
      />
    </Modal>
  );
}

// Helper function (import from taskSchema.ts)
function calculateSubtasks(duration: number) {
  // Implementation from taskSchema.ts
}
```

#### Step 6: Update TaskManager to Use Modal
Update `src/components/tasks/TaskManager.tsx`:

```typescript
import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import TaskModal from './TaskModal';
import TaskList from './TaskList';
import { useAppSelector } from '../../hooks/redux';

export default function TaskManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          작업 관리
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          새 작업
        </button>
      </div>
      
      {/* Task List */}
      <TaskList
        tasks={tasks}
        onEditTask={(task) => {
          setEditingTask(task);
          setIsModalOpen(true);
        }}
      />
      
      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        mode={editingTask ? 'edit' : 'create'}
      />
    </div>
  );
}
```

### Files to Modify/Create
- ✅ Create: `src/schemas/taskSchema.ts`
- ✅ Create: `src/components/ui/Modal.tsx`
- ✅ Create: `src/components/tasks/TaskForm.tsx`
- ✅ Create: `src/components/tasks/TaskModal.tsx`
- ✅ Modify: `src/components/tasks/TaskManager.tsx`
- ✅ Create: `src/types/task.ts` (if not exists)

### Testing Requirements

#### Unit Tests
```typescript
// src/tests/components/TaskForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskForm from '../../components/tasks/TaskForm';

describe('TaskForm', () => {
  it('validates required fields', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} mode="create" />);
    
    const submitButton = screen.getByText('작업 생성');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/작업 제목은 필수입니다/)).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
  
  it('shows subtask preview for tasks > 25 minutes', () => {
    render(<TaskForm onSubmit={vi.fn()} mode="create" />);
    
    const durationSlider = screen.getByRole('slider');
    fireEvent.change(durationSlider, { target: { value: '50' } });
    
    expect(screen.getByText(/자동 생성될 하위 작업/)).toBeInTheDocument();
  });
});
```

### Common Pitfalls to Avoid
1. **Form validation timing**: Validate on blur, not just on submit
2. **Modal accessibility**: Ensure proper ARIA attributes and keyboard navigation
3. **Memory leaks**: Clean up event listeners in useEffect
4. **Race conditions**: Handle async submission properly
5. **Z-index conflicts**: Test modal with other overlays

### Definition of Done
- [ ] Modal opens/closes smoothly with animations
- [ ] All form fields work with validation
- [ ] Auto-split preview updates in real-time
- [ ] Tasks are created in Redux store
- [ ] Edit mode populates existing data
- [ ] Toast notifications show success/error
- [ ] No console errors
- [ ] Tests pass

---

## 🚨 P0-003: Redux Store Integration

### Task Overview
- **Task ID**: P0-003
- **Task Name**: Redux Store Integration
- **Priority**: Critical (Blocking)
- **Time Estimate**: 12 hours
  - Store Configuration: 2 hours
  - Slice Implementation: 4 hours
  - Component Integration: 4 hours
  - Testing: 2 hours
- **Dependencies**: P0-001, P0-002

### Current State vs Desired State
**Current State**:
- Components show hardcoded dummy data
- No real state management
- No data flow between components
- Loading and error states not handled

**Desired State**:
- All components connected to Redux store
- Real-time state updates across app
- Proper loading and error handling
- Optimistic updates for better UX
- Full TypeScript type safety

### Implementation Steps

#### Step 1: Create Task Slice
Update `src/store/slices/taskSlice.ts`:

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus, SubTask } from '../../types/task';
import { StorageService } from '../../services/StorageService';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: TaskStatus | 'all';
    category: string | 'all';
    searchTerm: string;
  };
  sortBy: 'priority' | 'dueDate' | 'createdAt' | 'duration';
  sortOrder: 'asc' | 'desc';
}

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    category: 'all',
    searchTerm: '',
  },
  sortBy: 'priority',
  sortOrder: 'desc',
};

// Async thunks
export const loadTasks = createAsyncThunk(
  'tasks/loadTasks',
  async () => {
    const storage = new StorageService();
    return await storage.getTasks();
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (task: Task) => {
    const storage = new StorageService();
    await storage.saveTask(task);
    return task;
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (task: Task) => {
    const storage = new StorageService();
    await storage.updateTask(task);
    return task;
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string) => {
    const storage = new StorageService();
    await storage.deleteTask(taskId);
    return taskId;
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    
    updateTaskStatus: (state, action: PayloadAction<{ taskId: string; status: TaskStatus }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
        task.updatedAt = new Date().toISOString();
      }
    },
    
    updateSubtaskStatus: (state, action: PayloadAction<{ taskId: string; subtaskId: string; completed: boolean }>) => {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      if (task && task.subtasks) {
        const subtask = task.subtasks.find(st => st.id === action.payload.subtaskId);
        if (subtask) {
          subtask.completed = action.payload.completed;
          
          // Update completed pomodoros count
          task.completedPomodoros = task.subtasks.filter(st => st.completed).length;
          
          // Update task status if all subtasks completed
          if (task.completedPomodoros === task.totalPomodoros) {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
          }
        }
      }
    },
    
    setFilter: (state, action: PayloadAction<Partial<TaskState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    setSorting: (state, action: PayloadAction<{ sortBy: TaskState['sortBy']; sortOrder: TaskState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Load tasks
    builder
      .addCase(loadTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '작업을 불러오는데 실패했습니다';
      });
    
    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.error.message || '작업 생성에 실패했습니다';
      });
    
    // Update task
    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      });
    
    // Delete task
    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
      });
  },
});

export const {
  setCurrentTask,
  updateTaskStatus,
  updateSubtaskStatus,
  setFilter,
  setSorting,
  clearError,
} = taskSlice.actions;

// Selectors
export const selectFilteredTasks = (state: { tasks: TaskState }) => {
  let filtered = [...state.tasks.tasks];
  
  // Apply filters
  if (state.tasks.filters.status !== 'all') {
    filtered = filtered.filter(t => t.status === state.tasks.filters.status);
  }
  
  if (state.tasks.filters.category !== 'all') {
    filtered = filtered.filter(t => t.category === state.tasks.filters.category);
  }
  
  if (state.tasks.filters.searchTerm) {
    const term = state.tasks.filters.searchTerm.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term)
    );
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (state.tasks.sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'dueDate':
        comparison = (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
        break;
      case 'createdAt':
        comparison = a.createdAt.localeCompare(b.createdAt);
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
    }
    
    return state.tasks.sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return filtered;
};

export const selectTaskById = (taskId: string) => (state: { tasks: TaskState }) => {
  return state.tasks.tasks.find(t => t.id === taskId);
};

export const selectTaskStats = (state: { tasks: TaskState }) => {
  const tasks = state.tasks.tasks;
  
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    totalDuration: tasks.reduce((sum, t) => sum + t.duration, 0),
    completedDuration: tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.duration, 0),
  };
};

export default taskSlice.reducer;
```

#### Step 2: Create Timer Slice
Update `src/store/slices/timerSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TimerSession {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  type: 'focus' | 'short_break' | 'long_break';
  completed: boolean;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentSession: TimerSession | null;
  timeRemaining: number; // in seconds
  timerDuration: number; // in seconds
  timerType: 'focus' | 'short_break' | 'long_break';
  pomodoroCount: number;
  sessions: TimerSession[];
  settings: {
    focusDuration: number; // in minutes
    shortBreakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    longBreakInterval: number;
  };
}

const initialState: TimerState = {
  isRunning: false,
  isPaused: false,
  currentSession: null,
  timeRemaining: 25 * 60,
  timerDuration: 25 * 60,
  timerType: 'focus',
  pomodoroCount: 0,
  sessions: [],
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 20,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    longBreakInterval: 4,
  },
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    startTimer: (state, action: PayloadAction<{ taskId?: string }>) => {
      state.isRunning = true;
      state.isPaused = false;
      
      if (!state.currentSession) {
        state.currentSession = {
          id: Date.now().toString(),
          taskId: action.payload.taskId || '',
          startTime: new Date().toISOString(),
          duration: state.timerDuration,
          type: state.timerType,
          completed: false,
        };
      }
    },
    
    pauseTimer: (state) => {
      state.isRunning = false;
      state.isPaused = true;
    },
    
    resumeTimer: (state) => {
      state.isRunning = true;
      state.isPaused = false;
    },
    
    stopTimer: (state) => {
      if (state.currentSession) {
        state.currentSession.endTime = new Date().toISOString();
        state.currentSession.completed = false;
        state.sessions.push(state.currentSession);
      }
      
      state.isRunning = false;
      state.isPaused = false;
      state.currentSession = null;
      state.timeRemaining = state.timerDuration;
    },
    
    completeTimer: (state) => {
      if (state.currentSession) {
        state.currentSession.endTime = new Date().toISOString();
        state.currentSession.completed = true;
        state.sessions.push(state.currentSession);
        
        if (state.timerType === 'focus') {
          state.pomodoroCount++;
        }
      }
      
      // Determine next timer type
      let nextType: typeof state.timerType = 'focus';
      let nextDuration = state.settings.focusDuration;
      
      if (state.timerType === 'focus') {
        if (state.pomodoroCount % state.settings.longBreakInterval === 0) {
          nextType = 'long_break';
          nextDuration = state.settings.longBreakDuration;
        } else {
          nextType = 'short_break';
          nextDuration = state.settings.shortBreakDuration;
        }
      } else {
        nextType = 'focus';
        nextDuration = state.settings.focusDuration;
      }
      
      state.timerType = nextType;
      state.timerDuration = nextDuration * 60;
      state.timeRemaining = nextDuration * 60;
      state.currentSession = null;
      state.isRunning = false;
      state.isPaused = false;
      
      // Auto-start if enabled
      if (
        (nextType !== 'focus' && state.settings.autoStartBreaks) ||
        (nextType === 'focus' && state.settings.autoStartPomodoros)
      ) {
        state.isRunning = true;
        state.currentSession = {
          id: Date.now().toString(),
          taskId: state.currentSession?.taskId || '',
          startTime: new Date().toISOString(),
          duration: state.timerDuration,
          type: nextType,
          completed: false,
        };
      }
    },
    
    tick: (state) => {
      if (state.isRunning && !state.isPaused && state.timeRemaining > 0) {
        state.timeRemaining--;
      }
    },
    
    setTimerDuration: (state, action: PayloadAction<number>) => {
      state.timerDuration = action.payload * 60;
      state.timeRemaining = action.payload * 60;
    },
    
    setTimerType: (state, action: PayloadAction<typeof state.timerType>) => {
      state.timerType = action.payload;
      
      let duration = state.settings.focusDuration;
      if (action.payload === 'short_break') {
        duration = state.settings.shortBreakDuration;
      } else if (action.payload === 'long_break') {
        duration = state.settings.longBreakDuration;
      }
      
      state.timerDuration = duration * 60;
      state.timeRemaining = duration * 60;
    },
    
    updateSettings: (state, action: PayloadAction<Partial<typeof state.settings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    resetTimer: (state) => {
      state.isRunning = false;
      state.isPaused = false;
      state.currentSession = null;
      state.timeRemaining = state.timerDuration;
    },
    
    resetPomodoroCount: (state) => {
      state.pomodoroCount = 0;
    },
  },
});

export const {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  completeTimer,
  tick,
  setTimerDuration,
  setTimerType,
  updateSettings,
  resetTimer,
  resetPomodoroCount,
} = timerSlice.actions;

// Selectors
export const selectTimerDisplay = (state: { timer: TimerState }) => {
  const minutes = Math.floor(state.timer.timeRemaining / 60);
  const seconds = state.timer.timeRemaining % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const selectTimerProgress = (state: { timer: TimerState }) => {
  return ((state.timer.timerDuration - state.timer.timeRemaining) / state.timer.timerDuration) * 100;
};

export const selectTodaySessions = (state: { timer: TimerState }) => {
  const today = new Date().toDateString();
  return state.timer.sessions.filter(
    session => new Date(session.startTime).toDateString() === today
  );
};

export default timerSlice.reducer;
```

#### Step 3: Update Store Configuration
Update `src/store/store.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import taskReducer from './slices/taskSlice';
import timerReducer from './slices/timerSlice';
import settingsReducer from './slices/settingsSlice';
import analyticsReducer from './slices/analyticsSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['tasks', 'settings', 'analytics'], // Don't persist timer state
};

const rootReducer = combineReducers({
  tasks: taskReducer,
  timer: timerReducer,
  settings: settingsReducer,
  analytics: analyticsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Step 4: Create Redux Hooks
Update `src/hooks/redux.ts`:

```typescript
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

#### Step 5: Connect Components to Redux
Example: Update Dashboard component:

```typescript
// src/components/dashboard/Dashboard.tsx
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { loadTasks, selectTaskStats } from '../../store/slices/taskSlice';
import { selectTodaySessions } from '../../store/slices/timerSlice';
import CurrentTaskDisplay from './CurrentTaskDisplay';
import TodayTasksSummary from './TodayTasksSummary';
import PomodoroCounter from './PomodoroCounter';
import EnergyLevelTracker from './EnergyLevelTracker';
import AchievementBadges from './AchievementBadges';
import Loading from '../ui/Loading';
import ErrorBoundary from '../ui/ErrorBoundary';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.tasks);
  const taskStats = useAppSelector(selectTaskStats);
  const todaySessions = useAppSelector(selectTodaySessions);
  const currentTask = useAppSelector((state) => state.tasks.currentTask);
  
  useEffect(() => {
    dispatch(loadTasks());
  }, [dispatch]);
  
  if (loading) {
    return <Loading message="대시보드를 불러오는 중..." />;
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => dispatch(loadTasks())}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          다시 시도
        </button>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          대시보드
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CurrentTaskDisplay task={currentTask} />
          <TodayTasksSummary stats={taskStats} />
          <PomodoroCounter count={todaySessions.filter(s => s.type === 'focus' && s.completed).length} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EnergyLevelTracker />
          <AchievementBadges />
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

### Files to Modify/Create
- ✅ Modify: `src/store/slices/taskSlice.ts`
- ✅ Modify: `src/store/slices/timerSlice.ts`
- ✅ Modify: `src/store/store.ts`
- ✅ Modify: `src/hooks/redux.ts`
- ✅ Modify: All component files to connect to Redux
- ✅ Create: `src/components/ui/ErrorBoundary.tsx`
- ✅ Create: `src/components/ui/Loading.tsx`

### Testing Requirements
```typescript
// src/tests/store/taskSlice.test.ts
import { describe, it, expect } from 'vitest';
import taskReducer, { createTask, updateTaskStatus } from '../../store/slices/taskSlice';

describe('taskSlice', () => {
  it('should handle initial state', () => {
    expect(taskReducer(undefined, { type: 'unknown' })).toEqual({
      tasks: [],
      currentTask: null,
      loading: false,
      error: null,
      // ... other initial state
    });
  });
  
  it('should handle task creation', () => {
    const task = { id: '1', title: 'Test Task', /* ... */ };
    const state = taskReducer(initialState, createTask.fulfilled(task, '', task));
    expect(state.tasks).toContainEqual(task);
  });
});
```

### Common Pitfalls to Avoid
1. **Serialization errors**: Don't store non-serializable data in Redux
2. **Direct state mutation**: Always create new objects/arrays
3. **Excessive re-renders**: Use proper selectors and memoization
4. **Race conditions**: Handle async actions properly
5. **Memory leaks**: Clean up subscriptions in useEffect

### Definition of Done
- [ ] All components show real data from Redux
- [ ] State updates reflect immediately in UI
- [ ] Loading states display during async operations
- [ ] Error states handled gracefully
- [ ] Redux DevTools show correct state
- [ ] No console errors or warnings
- [ ] Tests pass

---

## 🚨 P0-004: Data Persistence System

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

### Implementation Steps

#### Step 1: Create Database Manager
Create `src/services/DatabaseManager.ts`:

```typescript
import Dexie, { Table } from 'dexie';
import { Task } from '../types/task';
import { TimerSession } from '../types/timer';
import { Analytics } from '../types/analytics';

export interface BackupData {
  id?: number;
  timestamp: string;
  data: string;
  version: string;
}

class DatabaseManager extends Dexie {
  tasks!: Table<Task>;
  sessions!: Table<TimerSession>;
  analytics!: Table<Analytics>;
  backups!: Table<BackupData>;
  
  constructor() {
    super('ADHDTimeManager');
    
    this.version(1).stores({
      tasks: 'id, status, priority, category, createdAt, scheduledDate',
      sessions: 'id, taskId, startTime, type, completed',
      analytics: 'id, date, type',
      backups: '++id, timestamp',
    });
    
    // Version 2: Add new indexes
    this.version(2).stores({
      tasks: 'id, status, priority, category, createdAt, scheduledDate, energyLevel',
      sessions: 'id, taskId, startTime, type, completed',
      analytics: 'id, date, type, taskId',
      backups: '++id, timestamp',
    }).upgrade(trans => {
      // Migration logic if needed
      return trans.tasks.toCollection().modify(task => {
        if (!task.energyLevel) {
          task.energyLevel = 'medium';
        }
      });
    });
  }
  
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.tasks, this.sessions, this.analytics, async () => {
      await this.tasks.clear();
      await this.sessions.clear();
      await this.analytics.clear();
    });
  }
  
  async exportData(): Promise<string> {
    const tasks = await this.tasks.toArray();
    const sessions = await this.sessions.toArray();
    const analytics = await this.analytics.toArray();
    
    return JSON.stringify({
      version: '2.0',
      exportDate: new Date().toISOString(),
      data: {
        tasks,
        sessions,
        analytics,
      },
    }, null, 2);
  }
  
  async importData(jsonData: string): Promise<void> {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.version || !parsed.data) {
        throw new Error('Invalid backup format');
      }
      
      await this.transaction('rw', this.tasks, this.sessions, this.analytics, async () => {
        // Clear existing data
        await this.clearAllData();
        
        // Import new data
        if (parsed.data.tasks) {
          await this.tasks.bulkAdd(parsed.data.tasks);
        }
        if (parsed.data.sessions) {
          await this.sessions.bulkAdd(parsed.data.sessions);
        }
        if (parsed.data.analytics) {
          await this.analytics.bulkAdd(parsed.data.analytics);
        }
      });
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('데이터 가져오기에 실패했습니다');
    }
  }
  
  async createBackup(): Promise<void> {
    const data = await this.exportData();
    await this.backups.add({
      timestamp: new Date().toISOString(),
      data,
      version: '2.0',
    });
    
    // Keep only last 10 backups
    const count = await this.backups.count();
    if (count > 10) {
      const oldBackups = await this.backups
        .orderBy('timestamp')
        .limit(count - 10)
        .toArray();
      
      await this.backups.bulkDelete(oldBackups.map(b => b.id!));
    }
  }
  
  async restoreBackup(backupId: number): Promise<void> {
    const backup = await this.backups.get(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }
    
    await this.importData(backup.data);
  }
}

export const db = new DatabaseManager();
```

#### Step 2: Create Storage Service
Create `src/services/StorageService.ts`:

```typescript
import { db } from './DatabaseManager';
import { Task } from '../types/task';
import { TimerSession } from '../types/timer';
import { Analytics } from '../types/analytics';

export class StorageService {
  // Task operations
  async getTasks(): Promise<Task[]> {
    try {
      return await db.tasks.toArray();
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }
  
  async getTask(id: string): Promise<Task | undefined> {
    return await db.tasks.get(id);
  }
  
  async saveTask(task: Task): Promise<void> {
    await db.tasks.add(task);
  }
  
  async updateTask(task: Task): Promise<void> {
    await db.tasks.put(task);
  }
  
  async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
  }
  
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    return await db.tasks.where('status').equals(status).toArray();
  }
  
  async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    return await db.tasks
      .where('scheduledDate')
      .between(startDate.toISOString(), endDate.toISOString())
      .toArray();
  }
  
  // Session operations
  async saveSessions(session: TimerSession): Promise<void> {
    await db.sessions.add(session);
  }
  
  async getSessionsByTask(taskId: string): Promise<TimerSession[]> {
    return await db.sessions.where('taskId').equals(taskId).toArray();
  }
  
  async getTodaySessions(): Promise<TimerSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await db.sessions
      .where('startTime')
      .between(today.toISOString(), tomorrow.toISOString())
      .toArray();
  }
  
  // Analytics operations
  async saveAnalytics(analytics: Analytics): Promise<void> {
    await db.analytics.add(analytics);
  }
  
  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return await db.analytics
      .where('date')
      .between(startDate.toISOString(), endDate.toISOString())
      .toArray();
  }
  
  // Storage management
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    
    // Fallback for browsers that don't support storage.estimate
    return { used: 0, quota: 0 };
  }
  
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }
    return false;
  }
  
  // Data validation
  validateTask(task: Partial<Task>): string[] {
    const errors: string[] = [];
    
    if (!task.title || task.title.trim().length === 0) {
      errors.push('Task title is required');
    }
    
    if (task.duration && (task.duration < 5 || task.duration > 240)) {
      errors.push('Duration must be between 5 and 240 minutes');
    }
    
    if (task.priority && !['low', 'medium', 'high', 'urgent'].includes(task.priority)) {
      errors.push('Invalid priority level');
    }
    
    return errors;
  }
}

// Singleton instance
export const storageService = new StorageService();
```

### Files to Modify/Create
- ✅ Create: `src/services/DatabaseManager.ts`
- ✅ Create: `src/services/StorageService.ts`
- ✅ Create: `src/types/analytics.ts`
- ✅ Modify: `src/store/store.ts` (add redux-persist)
- ✅ Create: `src/utils/migration.ts`

### Testing Requirements
```typescript
// src/tests/services/StorageService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../../services/StorageService';
import { db } from '../../services/DatabaseManager';

describe('StorageService', () => {
  beforeEach(async () => {
    await db.clearAllData();
  });
  
  it('should save and retrieve tasks', async () => {
    const task = {
      id: '1',
      title: 'Test Task',
      // ... other fields
    };
    
    await storageService.saveTask(task);
    const retrieved = await storageService.getTask('1');
    
    expect(retrieved).toEqual(task);
  });
});
```

### Common Pitfalls to Avoid
1. **IndexedDB async operations**: Always use async/await
2. **Storage quota**: Handle quota exceeded errors
3. **Browser compatibility**: Test in different browsers
4. **Migration failures**: Always backup before migration
5. **Data validation**: Validate before saving to DB

### Definition of Done
- [ ] IndexedDB properly configured
- [ ] All CRUD operations work
- [ ] Data persists across sessions
- [ ] Backup/restore functionality works
- [ ] Migration system in place
- [ ] Storage quota handling
- [ ] Tests pass

---

## 🚨 P0-005: Timer System Implementation

### Task Overview
- **Task ID**: P0-005
- **Task Name**: Timer System Implementation
- **Priority**: Critical (Blocking)
- **Time Estimate**: 16 hours
  - Timer Core Logic: 4 hours
  - UI Implementation: 4 hours
  - Web Worker Setup: 3 hours
  - Session Tracking: 3 hours
  - Testing: 2 hours
- **Dependencies**: P0-003, P0-004

### Implementation Steps

#### Step 1: Create Web Worker for Timer
Create `src/workers/timer.worker.ts`:

```typescript
let interval: number | null = null;

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'START':
      if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(() => {
        self.postMessage({ type: 'TICK' });
      }, 1000);
      break;
      
    case 'STOP':
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      break;
      
    case 'PAUSE':
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      break;
  }
});
```

#### Step 2: Create Timer Hook
Create `src/hooks/useTimer.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  completeTimer,
  tick,
} from '../store/slices/timerSlice';
import { updateSubtaskStatus } from '../store/slices/taskSlice';
import { NotificationService } from '../services/NotificationService';

export function useTimer() {
  const dispatch = useAppDispatch();
  const timerState = useAppSelector((state) => state.timer);
  const workerRef = useRef<Worker | null>(null);
  const notificationService = useRef(new NotificationService());
  
  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/timer.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current.addEventListener('message', (event) => {
      if (event.data.type === 'TICK') {
        dispatch(tick());
      }
    });
    
    return () => {
      workerRef.current?.terminate();
    };
  }, [dispatch]);
  
  // Handle timer completion
  useEffect(() => {
    if (timerState.timeRemaining === 0 && timerState.isRunning) {
      handleTimerComplete();
    }
  }, [timerState.timeRemaining, timerState.isRunning]);
  
  const handleTimerComplete = useCallback(async () => {
    dispatch(completeTimer());
    
    // Send notification
    const message = timerState.timerType === 'focus' 
      ? '포모도로 완료! 휴식 시간입니다.' 
      : '휴식 완료! 작업을 시작할 시간입니다.';
    
    await notificationService.current.sendNotification('타이머 완료', message);
    
    // Update task if it was a focus session
    if (timerState.timerType === 'focus' && timerState.currentSession?.taskId) {
      // Mark subtask as complete
      dispatch(updateSubtaskStatus({
        taskId: timerState.currentSession.taskId,
        subtaskId: timerState.currentSession.id,
        completed: true,
      }));
    }
  }, [dispatch, timerState.timerType, timerState.currentSession]);
  
  const start = useCallback((taskId?: string) => {
    dispatch(startTimer({ taskId }));
    workerRef.current?.postMessage({ type: 'START' });
  }, [dispatch]);
  
  const pause = useCallback(() => {
    dispatch(pauseTimer());
    workerRef.current?.postMessage({ type: 'PAUSE' });
  }, [dispatch]);
  
  const resume = useCallback(() => {
    dispatch(resumeTimer());
    workerRef.current?.postMessage({ type: 'START' });
  }, [dispatch]);
  
  const stop = useCallback(() => {
    dispatch(stopTimer());
    workerRef.current?.postMessage({ type: 'STOP' });
  }, [dispatch]);
  
  return {
    ...timerState,
    start,
    pause,
    resume,
    stop,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
  };
}
```

#### Step 3: Create PomodoroTimer Component
Update `src/components/timer/PomodoroTimer.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTimer } from '../../hooks/useTimer';
import { useAppSelector } from '../../hooks/redux';
import { selectTaskById } from '../../store/slices/taskSlice';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  CogIcon,
} from '@heroicons/react/24/solid';
import TimerSettings from './TimerSettings';
import { motion } from 'framer-motion';

export default function PomodoroTimer() {
  const { taskId } = useParams<{ taskId?: string }>();
  const task = useAppSelector(state => taskId ? selectTaskById(taskId)(state) : null);
  const timer = useTimer();
  const [showSettings, setShowSettings] = useState(false);
  
  const timerTypeLabels = {
    focus: '집중 시간',
    short_break: '짧은 휴식',
    long_break: '긴 휴식',
  };
  
  const timerTypeColors = {
    focus: 'from-red-400 to-red-600',
    short_break: 'from-green-400 to-green-600',
    long_break: 'from-blue-400 to-blue-600',
  };
  
  const progress = ((timer.timerDuration - timer.timeRemaining) / timer.timerDuration) * 100;
  
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Task Info */}
      {task && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            현재 작업
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{task.title}</p>
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                진행률: {task.completedPomodoros} / {task.totalPomodoros} 포모도로
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(task.completedPomodoros / task.totalPomodoros) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Timer Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
        <div className="text-center">
          {/* Timer Type */}
          <div className="mb-4">
            <span className={`inline-block px-4 py-2 rounded-full text-white bg-gradient-to-r ${timerTypeColors[timer.timerType]}`}>
              {timerTypeLabels[timer.timerType]}
            </span>
          </div>
          
          {/* Timer Circle */}
          <div className="relative w-64 h-64 mx-auto">
            <svg className="transform -rotate-90 w-64 h-64">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={754}
                strokeDashoffset={754 - (754 * progress) / 100}
                className="text-indigo-600"
                initial={{ strokeDashoffset: 754 }}
                animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 dark:text-white">
                  {timer.formatTime(timer.timeRemaining)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  포모도로 #{timer.pomodoroCount + 1}
                </div>
              </div>
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            {!timer.isRunning ? (
              <button
                onClick={() => timer.start(taskId)}
                className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg"
                aria-label="시작"
              >
                <PlayIcon className="w-8 h-8" />
              </button>
            ) : (
              <button
                onClick={timer.pause}
                className="p-4 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors shadow-lg"
                aria-label="일시정지"
              >
                <PauseIcon className="w-8 h-8" />
              </button>
            )}
            
            {timer.isPaused && (
              <button
                onClick={timer.resume}
                className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                aria-label="재개"
              >
                <PlayIcon className="w-8 h-8" />
              </button>
            )}
            
            <button
              onClick={timer.stop}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              aria-label="정지"
            >
              <StopIcon className="w-8 h-8" />
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="p-4 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors shadow-lg"
              aria-label="설정"
            >
              <CogIcon className="w-8 h-8" />
            </button>
          </div>
          
          {/* Quick Duration Buttons */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => timer.setTimerDuration(15)}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              15분
            </button>
            <button
              onClick={() => timer.setTimerDuration(25)}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              25분
            </button>
            <button
              onClick={() => timer.setTimerDuration(45)}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              45분
            </button>
          </div>
        </div>
      </div>
      
      {/* Today's Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          오늘의 세션
        </h3>
        <div className="space-y-2">
          {timer.sessions
            .filter(s => new Date(s.startTime).toDateString() === new Date().toDateString())
            .map((session, index) => (
              <div
                key={session.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {session.type === 'focus' ? '🍅' : '☕'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {timerTypeLabels[session.type]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.floor(session.duration / 60)}분
                  </p>
                  {session.completed && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      완료
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <TimerSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
```

### Files to Modify/Create
- ✅ Create: `src/workers/timer.worker.ts`
- ✅ Create: `src/hooks/useTimer.ts`
- ✅ Modify: `src/components/timer/PomodoroTimer.tsx`
- ✅ Create: `src/components/timer/TimerSettings.tsx`
- ✅ Create: `src/services/NotificationService.ts`

### Common Pitfalls to Avoid
1. **Timer drift**: Use Web Worker for accuracy
2. **Background tabs**: Handle visibility API
3. **State persistence**: Save timer state periodically
4. **Notification permissions**: Request properly
5. **Memory leaks**: Clean up intervals/workers

### Definition of Done
- [ ] Timer counts down accurately
- [ ] Start/pause/stop controls work
- [ ] Pomodoro cycles work correctly
- [ ] Notifications trigger on completion
- [ ] Sessions are tracked properly
- [ ] Timer persists on page refresh
- [ ] Tests pass

---

## 🚨 P0-006: Task Auto-Split Logic

### Task Overview
- **Task ID**: P0-006
- **Task Name**: Task Auto-Split Logic
- **Priority**: Critical (Blocking)
- **Time Estimate**: 8 hours
  - Algorithm Implementation: 2 hours
  - UI Integration: 3 hours
  - State Management: 2 hours
  - Testing: 1 hour
- **Dependencies**: P0-002, P0-003

### Implementation Steps

#### Step 1: Create Task Utils
Create `src/utils/taskUtils.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid';
import { Task, SubTask } from '../types/task';

export interface SplitOptions {
  maxDuration: number; // Maximum duration for each subtask (default: 25)
  minDuration: number; // Minimum duration for each subtask (default: 15)
  namingPattern: 'numeric' | 'alphabetic' | 'custom';
  customNames?: string[];
}

const DEFAULT_SPLIT_OPTIONS: SplitOptions = {
  maxDuration: 25,
  minDuration: 15,
  namingPattern: 'numeric',
};

export function shouldAutoSplit(duration: number, threshold: number = 25): boolean {
  return duration > threshold;
}

export function calculateOptimalSplit(
  totalDuration: number,
  options: Partial<SplitOptions> = {}
): SubTask[] {
  const opts = { ...DEFAULT_SPLIT_OPTIONS, ...options };
  
  if (totalDuration <= opts.maxDuration) {
    return [];
  }
  
  const subtasks: SubTask[] = [];
  let remainingDuration = totalDuration;
  let subtaskIndex = 0;
  
  // Calculate number of subtasks needed
  const minSubtasks = Math.ceil(totalDuration / opts.maxDuration);
  const maxSubtasks = Math.floor(totalDuration / opts.minDuration);
  
  // Find optimal number of subtasks for even distribution
  let optimalCount = minSubtasks;
  let optimalDuration = totalDuration / optimalCount;
  
  // Adjust if duration is too short
  while (optimalDuration < opts.minDuration && optimalCount > 1) {
    optimalCount--;
    optimalDuration = totalDuration / optimalCount;
  }
  
  // Create subtasks
  for (let i = 0; i < optimalCount; i++) {
    const isLast = i === optimalCount - 1;
    const duration = isLast ? remainingDuration : Math.min(optimalDuration, opts.maxDuration);
    
    subtasks.push({
      id: uuidv4(),
      title: getSubtaskName(i, opts),
      duration: Math.round(duration),
      completed: false,
      order: i,
    });
    
    remainingDuration -= duration;
  }
  
  return subtasks;
}

function getSubtaskName(index: number, options: SplitOptions): string {
  switch (options.namingPattern) {
    case 'numeric':
      return `파트 ${index + 1}`;
    case 'alphabetic':
      return `파트 ${String.fromCharCode(65 + index)}`; // A, B, C...
    case 'custom':
      return options.customNames?.[index] || `파트 ${index + 1}`;
    default:
      return `파트 ${index + 1}`;
  }
}

export function mergeSubtasks(subtasks: SubTask[]): number {
  return subtasks.reduce((total, subtask) => total + subtask.duration, 0);
}

export function getNextIncompleteSubtask(task: Task): SubTask | null {
  if (!task.subtasks || task.subtasks.length === 0) {
    return null;
  }
  
  return task.subtasks
    .sort((a, b) => a.order - b.order)
    .find(st => !st.completed) || null;
}

export function calculateTaskProgress(task: Task): number {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.status === 'completed' ? 100 : 0;
  }
  
  const completed = task.subtasks.filter(st => st.completed).length;
  return Math.round((completed / task.subtasks.length) * 100);
}

export function estimateCompletionTime(task: Task): Date | null {
  if (task.status === 'completed') {
    return task.completedAt ? new Date(task.completedAt) : null;
  }
  
  const remainingDuration = task.subtasks
    ? task.subtasks
        .filter(st => !st.completed)
        .reduce((sum, st) => sum + st.duration, 0)
    : task.duration;
  
  const now = new Date();
  const estimatedTime = new Date(now.getTime() + remainingDuration * 60 * 1000);
  
  return estimatedTime;
}

export function redistributeSubtasks(
  subtasks: SubTask[],
  newTotalDuration: number,
  options: Partial<SplitOptions> = {}
): SubTask[] {
  // Calculate completion ratio
  const completedSubtasks = subtasks.filter(st => st.completed);
  const completedDuration = completedSubtasks.reduce((sum, st) => sum + st.duration, 0);
  
  // Calculate remaining duration
  const remainingDuration = newTotalDuration - completedDuration;
  
  if (remainingDuration <= 0) {
    // All time used, return only completed subtasks
    return completedSubtasks;
  }
  
  // Generate new subtasks for remaining duration
  const newSubtasks = calculateOptimalSplit(remainingDuration, options);
  
  // Combine completed and new subtasks
  return [
    ...completedSubtasks,
    ...newSubtasks.map((st, index) => ({
      ...st,
      order: completedSubtasks.length + index,
    })),
  ];
}

// Validation helpers
export function validateSubtaskCompletion(task: Task, subtaskId: string): boolean {
  if (!task.subtasks) return false;
  
  const subtask = task.subtasks.find(st => st.id === subtaskId);
  if (!subtask) return false;
  
  // Check if previous subtasks are completed (enforce order)
  const previousSubtasks = task.subtasks.filter(st => st.order < subtask.order);
  return previousSubtasks.every(st => st.completed);
}

export function canStartSubtask(task: Task, subtaskId: string): boolean {
  if (task.status === 'completed') return false;
  
  return validateSubtaskCompletion(task, subtaskId);
}
```

### Files to Modify/Create
- ✅ Create: `src/utils/taskUtils.ts`
- ✅ Modify: Task creation forms to use auto-split
- ✅ Add visual preview of subtasks

### Testing Requirements
```typescript
// src/tests/utils/taskUtils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateOptimalSplit, shouldAutoSplit } from '../../utils/taskUtils';

describe('Task Auto-Split', () => {
  it('should not split tasks <= 25 minutes', () => {
    expect(shouldAutoSplit(25)).toBe(false);
    expect(shouldAutoSplit(20)).toBe(false);
  });
  
  it('should split tasks > 25 minutes', () => {
    expect(shouldAutoSplit(26)).toBe(true);
    expect(shouldAutoSplit(50)).toBe(true);
  });
  
  it('should create optimal subtasks', () => {
    const subtasks = calculateOptimalSplit(75);
    expect(subtasks).toHaveLength(3);
    expect(subtasks.every(st => st.duration === 25)).toBe(true);
  });
});
```

### Definition of Done
- [ ] Auto-split algorithm works correctly
- [ ] Subtasks display in UI
- [ ] Progress tracking works
- [ ] User can toggle auto-split
- [ ] Tests pass

---

## 📊 Phase Summary and Next Steps

### Phase 1 Completion Checklist
- [ ] P0-001: Navigation System ✅
- [ ] P0-002: Task Modal and Form ✅
- [ ] P0-003: Redux Store Integration ✅
- [ ] P0-004: Data Persistence ✅
- [ ] P0-005: Timer System ✅
- [ ] P0-006: Task Auto-Split ✅

### Integration Testing
After completing all P0 tasks, perform end-to-end testing:

1. **User Journey Test**:
   - Create a new task with 75-minute duration
   - Verify auto-split creates 3 subtasks
   - Start timer for first subtask
   - Complete timer session
   - Verify subtask marked complete
   - Refresh page and verify data persists
   - Navigate between pages
   - Complete all subtasks
   - Verify task marked as complete

2. **Data Persistence Test**:
   - Create multiple tasks
   - Close browser completely
   - Reopen and verify all data intact
   - Export backup
   - Clear data
   - Import backup
   - Verify data restored

3. **Timer Accuracy Test**:
   - Start 25-minute timer
   - Verify countdown accuracy
   - Test pause/resume
   - Verify notifications work
   - Check session tracking

### Common Integration Issues
1. **State Synchronization**: Ensure Redux and IndexedDB stay in sync
2. **Timer Persistence**: Handle timer state on page refresh
3. **Route Guards**: Protect routes that require data
4. **Error Boundaries**: Add error boundaries for each major section
5. **Performance**: Monitor and optimize re-renders

### Moving to Phase 2
Once Phase 1 is complete:
1. Run full integration test suite
2. Fix any critical bugs found
3. Document any technical debt
4. Review code for refactoring opportunities
5. Begin Phase 2 implementation

### Resources and Documentation
- [React Router v6 Documentation](https://reactrouter.com/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)

### Support and Troubleshooting
For common issues:
- **IndexedDB not working**: Check browser privacy settings
- **Notifications not showing**: Ensure permissions granted
- **Timer drifting**: Verify Web Worker implementation
- **State not persisting**: Check Redux Persist configuration
- **Routes not working**: Verify BrowserRouter setup

---

This completes the detailed implementation guide for Phase 1: Critical Infrastructure. Each task has been broken down with specific code examples, testing requirements, and clear acceptance criteria. Follow these guides step-by-step to build a solid foundation for the ADHD Time Manager application.