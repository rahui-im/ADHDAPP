# 📋 PHASE 1: CRITICAL INFRASTRUCTURE - Part 1
## Navigation, UI Components, and State Management

## 🎯 Phase Overview
**Phase Goal**: Establish the essential foundation for the ADHD Time Manager application  
**Part 1 Coverage**: P0-001 to P0-003 (Navigation, Task Modal, Redux Integration)  
**Total Estimated Time**: 36 hours  
**Priority**: P0 - Critical (All tasks are blocking issues)  
**Prerequisites**: Node.js 18+, npm/pnpm, VS Code or similar IDE  

---

## ✅ P0-001: Navigation System Implementation [COMPLETED]

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
- ✅ Create: `src/router/AppRouter.tsx` **[IMPLEMENTED]**
- ❌ Create: `src/pages/NotFoundPage.tsx` **[Not created - 404 handled via redirect]**
- ❌ Create: `src/hooks/useNavigation.ts` **[Not created - using react-router hooks directly]**
- ✅ Modify: `src/App.tsx` **[IMPLEMENTED]**
- ✅ Modify: `src/components/layout/Layout.tsx` **[IMPLEMENTED]**

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
- [x] All navigation menu items work ✅
- [x] Direct URL access functional for all routes ✅
- [x] Browser navigation (back/forward) works ✅
- [x] 404 handling (redirects to dashboard) ✅
- [x] No console errors during navigation ✅
- [x] Tests pass ✅
- [x] Code reviewed and documented ✅

---

## ✅ P0-002: Task Modal and Form Implementation [COMPLETED]

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

[Form implementation continues with full code examples...]

### Files to Modify/Create
- ✅ Create: `src/schemas/taskSchema.ts` **[IMPLEMENTED in taskSlice]**
- ✅ Create: `src/components/ui/Modal.tsx` **[IMPLEMENTED]**
- ✅ Create: `src/components/tasks/TaskForm.tsx` **[IMPLEMENTED]**
- ❌ Create: `src/components/tasks/TaskModal.tsx` **[Not created - using Modal+TaskForm directly]**
- ✅ Modify: `src/components/tasks/TaskManager.tsx` **[IMPLEMENTED]**
- ✅ Create: `src/types/task.ts` **[IMPLEMENTED]**

### Common Pitfalls to Avoid
1. **Form validation timing**: Validate on blur, not just on submit
2. **Modal accessibility**: Ensure proper ARIA attributes and keyboard navigation
3. **Memory leaks**: Clean up event listeners in useEffect
4. **Race conditions**: Handle async submission properly
5. **Z-index conflicts**: Test modal with other overlays

### Definition of Done
- [x] Modal opens/closes smoothly with animations ✅
- [x] All form fields work with validation ✅
- [x] Auto-split preview updates in real-time ✅
- [x] Tasks are created in Redux store ✅
- [x] Edit mode populates existing data ✅
- [x] Toast notifications ✅
- [x] No console errors ✅
- [x] Tests pass ✅

---

## ✅ P0-003: Redux Store Integration [COMPLETED]

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

[Redux implementation continues with full code examples...]

### Files to Modify/Create
- ✅ Modify: `src/store/slices/taskSlice.ts` **[IMPLEMENTED]**
- ✅ Modify: `src/store/slices/timerSlice.ts` **[IMPLEMENTED]**
- ✅ Modify: `src/store/store.ts` **[IMPLEMENTED with Redux Persist]**
- ❌ Modify: `src/hooks/redux.ts` **[Not created - hooks in store.ts]**
- ✅ Modify: All component files to connect to Redux **[IMPLEMENTED]**
- ✅ Create: `src/components/ui/ErrorBoundary.tsx` **[IMPLEMENTED]**
- ✅ Create: `src/components/ui/Loading.tsx` **[IMPLEMENTED]**

### Common Pitfalls to Avoid
1. **Serialization errors**: Don't store non-serializable data in Redux
2. **Direct state mutation**: Always create new objects/arrays
3. **Excessive re-renders**: Use proper selectors and memoization
4. **Race conditions**: Handle async actions properly
5. **Memory leaks**: Clean up subscriptions in useEffect

### Definition of Done
- [x] All components show real data from Redux ✅
- [x] State updates reflect immediately in UI ✅
- [x] Loading states display during async operations ✅
- [x] Error states handled gracefully ✅
- [x] Redux DevTools show correct state ✅
- [x] No console errors or warnings ✅
- [x] Tests pass ✅

---

## 📝 Next Steps
After completing Part 1 (P0-001 to P0-003), proceed to Part 2 which covers:
- P0-004: Data Persistence System
- P0-005: Timer System Implementation
- P0-006: Task Auto-Split Logic

See `TASKS-PHASE1-PART2.md` for continuation.