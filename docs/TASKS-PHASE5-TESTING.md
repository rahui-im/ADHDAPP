# 📋 PHASE 5: TESTING AND QUALITY ASSURANCE - Detailed Implementation Guide

## 🎯 Phase Overview
**Phase Goal**: Implement comprehensive testing to ensure application quality and reliability  
**Total Estimated Time**: 26 hours  
**Priority**: P2 - Medium (Critical for maintainability)  
**Prerequisites**: Major features implemented (Phase 1-3)  

---

## 🧪 P2-005: Automated Testing Implementation

### Task Overview
- **Task ID**: P2-005
- **Task Name**: Automated Testing Implementation
- **Priority**: Medium
- **Time Estimate**: 20 hours
  - Vitest Setup: 2 hours
  - Unit Tests: 6 hours
  - Component Tests: 4 hours
  - Integration Tests: 4 hours
  - E2E Tests: 3 hours
  - CI/CD Setup: 1 hour
- **Dependencies**: Major features implemented

### Current State vs Desired State
**Current State**:
- No automated testing
- Manual testing only
- No test coverage metrics
- No CI/CD pipeline

**Desired State**:
- 70%+ unit test coverage
- 100% critical path coverage
- Automated E2E tests
- CI/CD with test automation
- Visual regression testing

### Implementation Steps

#### Step 1: Setup Testing Framework
Update `vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `src/tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { server } from './mocks/server';

// Setup MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Notification API
global.Notification = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
}));
Object.assign(Notification, {
  permission: 'granted',
  requestPermission: vi.fn().mockResolvedValue('granted'),
});

// Mock Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
  })),
  decodeAudioData: vi.fn().mockResolvedValue({}),
}));
```

#### Step 2: Create Unit Tests for Core Functions
Create `src/utils/taskUtils.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateOptimalSplit,
  shouldAutoSplit,
  mergeSubtasks,
  calculateTaskProgress,
  estimateCompletionTime,
  validateSubtaskCompletion,
} from './taskUtils';
import { Task, SubTask } from '../types/task';

describe('taskUtils', () => {
  describe('shouldAutoSplit', () => {
    it('should return false for tasks <= 25 minutes', () => {
      expect(shouldAutoSplit(25)).toBe(false);
      expect(shouldAutoSplit(20)).toBe(false);
      expect(shouldAutoSplit(15)).toBe(false);
    });
    
    it('should return true for tasks > 25 minutes', () => {
      expect(shouldAutoSplit(26)).toBe(true);
      expect(shouldAutoSplit(50)).toBe(true);
      expect(shouldAutoSplit(100)).toBe(true);
    });
    
    it('should respect custom threshold', () => {
      expect(shouldAutoSplit(30, 30)).toBe(false);
      expect(shouldAutoSplit(31, 30)).toBe(true);
    });
  });
  
  describe('calculateOptimalSplit', () => {
    it('should not split tasks <= maxDuration', () => {
      const subtasks = calculateOptimalSplit(25);
      expect(subtasks).toHaveLength(0);
    });
    
    it('should create even splits for 50 minutes', () => {
      const subtasks = calculateOptimalSplit(50);
      expect(subtasks).toHaveLength(2);
      expect(subtasks[0].duration).toBe(25);
      expect(subtasks[1].duration).toBe(25);
    });
    
    it('should handle uneven splits correctly', () => {
      const subtasks = calculateOptimalSplit(70);
      expect(subtasks).toHaveLength(3);
      const totalDuration = subtasks.reduce((sum, st) => sum + st.duration, 0);
      expect(totalDuration).toBe(70);
    });
    
    it('should respect custom options', () => {
      const subtasks = calculateOptimalSplit(60, {
        maxDuration: 20,
        minDuration: 15,
        namingPattern: 'alphabetic',
      });
      expect(subtasks).toHaveLength(3);
      expect(subtasks[0].title).toBe('파트 A');
      expect(subtasks[1].title).toBe('파트 B');
    });
    
    it('should generate unique IDs for subtasks', () => {
      const subtasks = calculateOptimalSplit(50);
      const ids = subtasks.map(st => st.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
  
  describe('calculateTaskProgress', () => {
    let mockTask: Task;
    
    beforeEach(() => {
      mockTask = {
        id: '1',
        title: 'Test Task',
        duration: 50,
        status: 'in_progress',
        priority: 'medium',
        category: 'work',
        energyLevel: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedPomodoros: 0,
        totalPomodoros: 2,
        subtasks: [
          { id: '1', title: 'Part 1', duration: 25, completed: true, order: 0 },
          { id: '2', title: 'Part 2', duration: 25, completed: false, order: 1 },
        ],
      };
    });
    
    it('should calculate progress based on subtask completion', () => {
      const progress = calculateTaskProgress(mockTask);
      expect(progress).toBe(50);
    });
    
    it('should return 100 for completed tasks', () => {
      mockTask.status = 'completed';
      const progress = calculateTaskProgress(mockTask);
      expect(progress).toBe(100);
    });
    
    it('should return 0 for tasks without subtasks and not completed', () => {
      mockTask.subtasks = undefined;
      mockTask.status = 'pending';
      const progress = calculateTaskProgress(mockTask);
      expect(progress).toBe(0);
    });
  });
  
  describe('validateSubtaskCompletion', () => {
    let mockTask: Task;
    
    beforeEach(() => {
      mockTask = {
        id: '1',
        title: 'Test Task',
        duration: 75,
        status: 'in_progress',
        priority: 'medium',
        category: 'work',
        energyLevel: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedPomodoros: 0,
        totalPomodoros: 3,
        subtasks: [
          { id: '1', title: 'Part 1', duration: 25, completed: true, order: 0 },
          { id: '2', title: 'Part 2', duration: 25, completed: false, order: 1 },
          { id: '3', title: 'Part 3', duration: 25, completed: false, order: 2 },
        ],
      };
    });
    
    it('should allow completion of next subtask in order', () => {
      const canComplete = validateSubtaskCompletion(mockTask, '2');
      expect(canComplete).toBe(true);
    });
    
    it('should not allow skipping subtasks', () => {
      const canComplete = validateSubtaskCompletion(mockTask, '3');
      expect(canComplete).toBe(false);
    });
    
    it('should return false for non-existent subtask', () => {
      const canComplete = validateSubtaskCompletion(mockTask, 'invalid');
      expect(canComplete).toBe(false);
    });
  });
});
```

#### Step 3: Create Component Tests
Create `src/components/tasks/TaskForm.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TaskForm from './TaskForm';
import taskReducer from '../../store/slices/taskSlice';

const createTestStore = () => {
  return configureStore({
    reducer: {
      tasks: taskReducer,
    },
  });
};

describe('TaskForm', () => {
  let store: ReturnType<typeof createTestStore>;
  let onSubmit: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    store = createTestStore();
    onSubmit = vi.fn();
    user = userEvent.setup();
  });
  
  const renderTaskForm = (props = {}) => {
    return render(
      <Provider store={store}>
        <TaskForm onSubmit={onSubmit} mode="create" {...props} />
      </Provider>
    );
  };
  
  describe('Form Validation', () => {
    it('should show error when title is empty', async () => {
      renderTaskForm();
      
      const submitButton = screen.getByRole('button', { name: /작업 생성/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/작업 제목은 필수입니다/i)).toBeInTheDocument();
      });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });
    
    it('should validate title length', async () => {
      renderTaskForm();
      
      const titleInput = screen.getByLabelText(/작업 제목/i);
      const longTitle = 'a'.repeat(101);
      
      await user.type(titleInput, longTitle);
      
      const submitButton = screen.getByRole('button', { name: /작업 생성/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/제목은 100자 이내여야 합니다/i)).toBeInTheDocument();
      });
    });
    
    it('should validate duration range', async () => {
      renderTaskForm();
      
      const durationSlider = screen.getByRole('slider');
      
      // Test minimum
      fireEvent.change(durationSlider, { target: { value: '3' } });
      
      const submitButton = screen.getByRole('button', { name: /작업 생성/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/최소 5분 이상이어야 합니다/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Auto-split Feature', () => {
    it('should show auto-split option for tasks > 25 minutes', async () => {
      renderTaskForm();
      
      const durationSlider = screen.getByRole('slider');
      fireEvent.change(durationSlider, { target: { value: '50' } });
      
      await waitFor(() => {
        expect(screen.getByText(/25분 단위로 자동 분할/i)).toBeInTheDocument();
      });
    });
    
    it('should preview subtasks when auto-split is enabled', async () => {
      renderTaskForm();
      
      const durationSlider = screen.getByRole('slider');
      fireEvent.change(durationSlider, { target: { value: '75' } });
      
      const autoSplitCheckbox = screen.getByRole('checkbox', { name: /자동 분할/i });
      expect(autoSplitCheckbox).toBeChecked();
      
      await waitFor(() => {
        expect(screen.getByText(/파트 1: 25분/i)).toBeInTheDocument();
        expect(screen.getByText(/파트 2: 25분/i)).toBeInTheDocument();
        expect(screen.getByText(/파트 3: 25분/i)).toBeInTheDocument();
      });
    });
    
    it('should hide preview when auto-split is disabled', async () => {
      renderTaskForm();
      
      const durationSlider = screen.getByRole('slider');
      fireEvent.change(durationSlider, { target: { value: '50' } });
      
      const autoSplitCheckbox = screen.getByRole('checkbox', { name: /자동 분할/i });
      await user.click(autoSplitCheckbox);
      
      await waitFor(() => {
        expect(screen.queryByText(/파트 1/i)).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      renderTaskForm();
      
      // Fill form
      const titleInput = screen.getByLabelText(/작업 제목/i);
      await user.type(titleInput, 'Test Task');
      
      const descriptionInput = screen.getByLabelText(/설명/i);
      await user.type(descriptionInput, 'Test Description');
      
      const durationSlider = screen.getByRole('slider');
      fireEvent.change(durationSlider, { target: { value: '30' } });
      
      // Select priority
      const highPriorityButton = screen.getByText('높음');
      await user.click(highPriorityButton);
      
      // Select energy level
      const lowEnergyButton = within(screen.getByText(/필요 에너지 레벨/i).parentElement!).getByText('낮음');
      await user.click(lowEnergyButton);
      
      // Select category
      const categorySelect = screen.getByLabelText(/카테고리/i);
      await user.selectOptions(categorySelect, '학습');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /작업 생성/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Task',
            description: 'Test Description',
            duration: 30,
            priority: 'high',
            energyLevel: 'low',
            category: '학습',
            enableAutoSplit: true,
          })
        );
      });
    });
    
    it('should populate form in edit mode', () => {
      const initialData = {
        title: 'Existing Task',
        description: 'Existing Description',
        duration: 45,
        priority: 'urgent' as const,
        energyLevel: 'high' as const,
        category: '업무',
      };
      
      renderTaskForm({ mode: 'edit', initialData });
      
      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
      expect(screen.getByText('45분')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /수정 완료/i })).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderTaskForm();
      
      expect(screen.getByLabelText(/작업 제목/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/설명/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/예상 소요 시간/i)).toBeInTheDocument();
    });
    
    it('should be keyboard navigable', async () => {
      renderTaskForm();
      
      const titleInput = screen.getByLabelText(/작업 제목/i);
      titleInput.focus();
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/설명/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('slider')).toHaveFocus();
    });
  });
});
```

#### Step 4: Create Integration Tests
Create `src/tests/integration/TaskWorkflow.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { store } from '../../store/store';
import { db } from '../../services/DatabaseManager';

describe('Task Workflow Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(async () => {
    user = userEvent.setup();
    // Clear database
    await db.clearAllData();
  });
  
  afterEach(async () => {
    await db.clearAllData();
  });
  
  const renderApp = () => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );
  };
  
  it('should complete full task creation to completion workflow', async () => {
    renderApp();
    
    // Navigate to tasks
    const tasksLink = screen.getByRole('link', { name: /작업 관리/i });
    await user.click(tasksLink);
    
    // Open task modal
    const newTaskButton = screen.getByRole('button', { name: /새 작업/i });
    await user.click(newTaskButton);
    
    // Fill and submit form
    const titleInput = screen.getByLabelText(/작업 제목/i);
    await user.type(titleInput, 'Integration Test Task');
    
    const submitButton = screen.getByRole('button', { name: /작업 생성/i });
    await user.click(submitButton);
    
    // Verify task appears in list
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });
    
    // Start timer for task
    const startTimerButton = screen.getByRole('button', { name: /타이머 시작/i });
    await user.click(startTimerButton);
    
    // Navigate to timer page
    await waitFor(() => {
      expect(screen.getByText(/현재 작업/i)).toBeInTheDocument();
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });
    
    // Complete task
    const completeButton = screen.getByRole('button', { name: /완료/i });
    await user.click(completeButton);
    
    // Verify task status updated
    await waitFor(() => {
      expect(screen.getByText(/완료/i)).toBeInTheDocument();
    });
    
    // Verify data persisted
    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Integration Test Task');
    expect(tasks[0].status).toBe('completed');
  });
  
  it('should handle task with auto-split and subtask completion', async () => {
    renderApp();
    
    // Create task with 75 minutes (3 subtasks)
    const tasksLink = screen.getByRole('link', { name: /작업 관리/i });
    await user.click(tasksLink);
    
    const newTaskButton = screen.getByRole('button', { name: /새 작업/i });
    await user.click(newTaskButton);
    
    await user.type(screen.getByLabelText(/작업 제목/i), 'Long Task');
    
    const durationSlider = screen.getByRole('slider');
    fireEvent.change(durationSlider, { target: { value: '75' } });
    
    const submitButton = screen.getByRole('button', { name: /작업 생성/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Long Task')).toBeInTheDocument();
      expect(screen.getByText(/0 \/ 3 포모도로/i)).toBeInTheDocument();
    });
    
    // Complete first subtask
    const firstSubtaskButton = screen.getByRole('button', { name: /파트 1 시작/i });
    await user.click(firstSubtaskButton);
    
    // Simulate timer completion
    await completeTimer();
    
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 3 포모도로/i)).toBeInTheDocument();
    });
  });
});
```

#### Step 5: Create E2E Tests with Playwright
Create `e2e/task-management.spec.ts`:

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Task Management E2E', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5173');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"]');
  });
  
  test.afterEach(async () => {
    await page.close();
  });
  
  test('should create and manage task lifecycle', async () => {
    // Navigate to tasks page
    await page.click('a:has-text("작업 관리")');
    await expect(page).toHaveURL(/.*\/tasks/);
    
    // Create new task
    await page.click('button:has-text("새 작업")');
    
    // Fill form
    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'This is an E2E test task');
    await page.fill('input[type="range"]', '30');
    
    // Select priority
    await page.click('label:has-text("높음")');
    
    // Submit form
    await page.click('button:has-text("작업 생성")');
    
    // Verify task appears
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
    
    // Change task status
    await page.click('[data-testid="task-status-button"]');
    await page.click('button:has-text("진행 중으로 변경")');
    
    // Verify status changed
    await expect(page.locator('text=진행 중')).toBeVisible();
    
    // Start timer
    await page.click('button:has-text("타이머 시작")');
    await expect(page).toHaveURL(/.*\/timer/);
    
    // Verify timer is running
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();
    
    // Stop timer
    await page.click('button[aria-label="정지"]');
    
    // Delete task
    await page.click('a:has-text("작업 관리")');
    await page.click('[data-testid="task-delete-button"]');
    await page.click('button:has-text("삭제")');
    
    // Verify task removed
    await expect(page.locator('text=E2E Test Task')).not.toBeVisible();
  });
  
  test('should handle offline mode', async () => {
    // Go offline
    await page.context().setOffline(true);
    
    // Try to create task
    await page.click('a:has-text("작업 관리")');
    await page.click('button:has-text("새 작업")');
    
    await page.fill('input[name="title"]', 'Offline Task');
    await page.click('button:has-text("작업 생성")');
    
    // Verify offline indicator
    await expect(page.locator('text=오프라인 상태입니다')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Verify reconnection
    await expect(page.locator('text=연결이 복구되었습니다')).toBeVisible();
    
    // Verify task was saved locally
    await expect(page.locator('text=Offline Task')).toBeVisible();
  });
  
  test('should export and import data', async () => {
    // Create test data
    await createTestTask(page, 'Export Test Task');
    
    // Navigate to settings
    await page.click('a:has-text("설정")');
    await page.click('button:has-text("백업 및 복원")');
    
    // Export data
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("데이터 내보내기")'),
    ]);
    
    const fileName = download.suggestedFilename();
    expect(fileName).toContain('adhd-timer-backup');
    
    // Clear data
    await page.click('button:has-text("모든 데이터 삭제")');
    await page.click('button:has-text("확인")');
    
    // Verify data cleared
    await page.click('a:has-text("작업 관리")');
    await expect(page.locator('text=작업이 없습니다')).toBeVisible();
    
    // Import data
    await page.click('a:has-text("설정")');
    await page.click('button:has-text("백업 및 복원")');
    
    const filePath = await download.path();
    await page.setInputFiles('input[type="file"]', filePath!);
    
    // Verify data restored
    await page.click('a:has-text("작업 관리")');
    await expect(page.locator('text=Export Test Task')).toBeVisible();
  });
  
  test('should track analytics correctly', async () => {
    // Create and complete tasks
    await createTestTask(page, 'Analytics Task 1');
    await completeTask(page, 'Analytics Task 1');
    
    await createTestTask(page, 'Analytics Task 2');
    await completeTask(page, 'Analytics Task 2');
    
    // Run timer session
    await runTimerSession(page, 25);
    
    // Navigate to analytics
    await page.click('a:has-text("분석")');
    
    // Verify statistics
    await expect(page.locator('text=완료한 작업')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
    
    await expect(page.locator('text=집중 시간')).toBeVisible();
    await expect(page.locator('text=25분')).toBeVisible();
    
    await expect(page.locator('text=포모도로')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible();
  });
});

// Helper functions
async function createTestTask(page: Page, title: string) {
  await page.click('a:has-text("작업 관리")');
  await page.click('button:has-text("새 작업")');
  await page.fill('input[name="title"]', title);
  await page.click('button:has-text("작업 생성")');
  await page.waitForSelector(`text=${title}`);
}

async function completeTask(page: Page, title: string) {
  await page.click(`[data-testid="task-${title}"] button:has-text("완료")`);
}

async function runTimerSession(page: Page, minutes: number) {
  await page.click('a:has-text("타이머")');
  await page.click('button[aria-label="시작"]');
  
  // Fast-forward timer (in real test, you'd mock time)
  await page.evaluate((mins) => {
    const event = new CustomEvent('timer-complete', { detail: { minutes: mins } });
    window.dispatchEvent(event);
  }, minutes);
  
  await page.waitForSelector('text=포모도로 완료!');
}
```

#### Step 6: Create Visual Regression Tests
Create `src/tests/visual/visual.test.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

test.describe('Visual Regression Tests', () => {
  test('Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await argosScreenshot(page, 'dashboard');
  });
  
  test('Task Manager', async ({ page }) => {
    await page.goto('http://localhost:5173/tasks');
    await page.waitForLoadState('networkidle');
    await argosScreenshot(page, 'task-manager');
  });
  
  test('Timer', async ({ page }) => {
    await page.goto('http://localhost:5173/timer');
    await page.waitForLoadState('networkidle');
    await argosScreenshot(page, 'timer');
  });
  
  test('Analytics', async ({ page }) => {
    await page.goto('http://localhost:5173/analytics');
    await page.waitForLoadState('networkidle');
    await argosScreenshot(page, 'analytics');
  });
  
  test('Settings', async ({ page }) => {
    await page.goto('http://localhost:5173/settings');
    await page.waitForLoadState('networkidle');
    await argosScreenshot(page, 'settings');
  });
  
  test('Dark Mode', async ({ page }) => {
    await page.goto('http://localhost:5173/settings');
    await page.click('button:has-text("테마")');
    await page.click('button:has-text("다크")');
    
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await argosScreenshot(page, 'dashboard-dark');
  });
  
  test('Mobile View', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await argosScreenshot(page, 'dashboard-mobile');
  });
});
```

### Files to Modify/Create
- ✅ Update: `vite.config.ts` with test configuration
- ✅ Create: `src/tests/setup.ts`
- ✅ Create: Unit test files for all utilities
- ✅ Create: Component test files
- ✅ Create: Integration test files
- ✅ Create: E2E test files
- ✅ Create: Visual regression tests
- ✅ Create: Test utilities and mocks

### Testing Requirements

#### Coverage Goals
```json
{
  "unit": {
    "statements": 70,
    "branches": 70,
    "functions": 70,
    "lines": 70
  },
  "integration": {
    "criticalPaths": 100,
    "userFlows": 90
  },
  "e2e": {
    "happyPaths": 100,
    "errorPaths": 80
  }
}
```

### Common Pitfalls to Avoid
1. **Flaky tests**: Use proper wait strategies
2. **Test isolation**: Each test should be independent
3. **Mock data**: Keep test data realistic
4. **Performance**: Tests should run quickly
5. **Maintenance**: Keep tests simple and readable

### Definition of Done
- [ ] 70% unit test coverage achieved
- [ ] All critical paths have integration tests
- [ ] E2E tests cover main user journeys
- [ ] Visual regression tests set up
- [ ] CI/CD pipeline runs all tests
- [ ] Test documentation complete
- [ ] No flaky tests

---

## 🐛 P1-006: Bug Fixes from UI Audit

### Task Overview
- **Task ID**: P1-006
- **Task Name**: Bug Fixes from UI Audit
- **Priority**: High
- **Time Estimate**: 6 hours
  - CurrentTaskDisplay Fix: 1 hour
  - TaskRecommendations Implementation: 1.5 hours
  - AchievementBadges Connection: 1 hour
  - Dashboard Statistics: 1.5 hours
  - Loading States: 1 hour
- **Dependencies**: P0-003 (Redux integration)

### Implementation Steps

#### Step 1: Fix CurrentTaskDisplay
Update `src/components/dashboard/CurrentTaskDisplay.tsx`:

```typescript
import { useAppSelector } from '../../hooks/redux';
import { selectCurrentTask } from '../../store/slices/taskSlice';
import { useNavigate } from 'react-router-dom';
import { PlayIcon, CheckIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export default function CurrentTaskDisplay() {
  const navigate = useNavigate();
  const currentTask = useAppSelector(selectCurrentTask);
  const { isRunning, timerType } = useAppSelector((state) => state.timer);
  
  if (!currentTask) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          현재 작업
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            진행 중인 작업이 없습니다
          </p>
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            작업 선택하기
          </button>
        </div>
      </div>
    );
  }
  
  const progress = currentTask.subtasks
    ? (currentTask.completedPomodoros / currentTask.totalPomodoros) * 100
    : currentTask.status === 'completed' ? 100 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          현재 작업
        </h3>
        {isRunning && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
            진행 중
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {currentTask.title}
          </h4>
          {currentTask.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentTask.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-1 rounded ${getPriorityColor(currentTask.priority)}`}>
            {currentTask.priority}
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {currentTask.category}
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {currentTask.duration}분
          </span>
        </div>
        
        {currentTask.subtasks && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">진행률</span>
              <span className="font-medium">
                {currentTask.completedPomodoros} / {currentTask.totalPomodoros} 포모도로
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-indigo-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          {currentTask.status !== 'completed' && (
            <button
              onClick={() => navigate(`/timer/${currentTask.id}`)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlayIcon className="w-4 h-4" />
              {isRunning ? '계속하기' : '시작하기'}
            </button>
          )}
          
          {currentTask.status === 'in_progress' && (
            <button
              onClick={() => {
                // Mark as complete
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'high':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    case 'medium':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'low':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
  }
}
```

### Files to Modify/Create
- ✅ Fix: `src/components/dashboard/CurrentTaskDisplay.tsx`
- ✅ Fix: `src/components/dashboard/TaskRecommendations.tsx`
- ✅ Fix: `src/components/dashboard/AchievementBadges.tsx`
- ✅ Fix: Dashboard statistics components
- ✅ Add: Loading states to all async components
- ✅ Add: Error boundaries

### Definition of Done
- [ ] CurrentTaskDisplay shows real data
- [ ] TaskRecommendations work
- [ ] Achievements connected to real system
- [ ] Dashboard shows real statistics
- [ ] All components have loading states
- [ ] Error boundaries prevent crashes
- [ ] Tests pass

---

## 📊 Phase 5 Summary

### Phase 5 Completion Checklist
- [ ] P2-005: Automated Testing ✅
- [ ] P1-006: Bug Fixes ✅
- [ ] P0-007: Database Schema ✅
- [ ] P1-007: Service Layer ✅

### Testing Metrics
- Unit Test Coverage: 70%+
- Integration Test Coverage: 90%+ for critical paths
- E2E Test Coverage: 100% for main user journeys
- Visual Regression: All major views covered
- Performance Tests: Core operations < 100ms

### Quality Gates
1. **Code Quality**:
   - [ ] ESLint: 0 errors, 0 warnings
   - [ ] TypeScript: No type errors
   - [ ] Prettier: All files formatted
   - [ ] No console.logs in production

2. **Test Quality**:
   - [ ] All tests pass
   - [ ] No flaky tests
   - [ ] Test execution < 5 minutes
   - [ ] Coverage meets targets

3. **Documentation**:
   - [ ] All functions documented
   - [ ] API documentation complete
   - [ ] User guide written
   - [ ] Developer guide available

### CI/CD Pipeline
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Integration tests
        run: npm run test:integration
      
      - name: E2E tests
        run: npm run test:e2e
      
      - name: Build
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Final Checklist Before Production
- [ ] All phases complete
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Accessibility audit passed
- [ ] Documentation complete
- [ ] Deployment pipeline ready
- [ ] Monitoring configured
- [ ] Rollback plan prepared
- [ ] User acceptance testing complete

---

This completes the comprehensive testing and quality assurance implementation guide for the ADHD Time Manager application. With all five phases documented, you now have a complete roadmap from infrastructure to production-ready application.