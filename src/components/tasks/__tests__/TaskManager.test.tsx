import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import TaskManager from '../TaskManager';
import taskReducer from '../../../store/taskSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      tasks: taskReducer,
    },
    preloadedState: {
      tasks: {
        tasks: [],
        loading: false,
        error: null,
        filter: {
          status: 'all',
          priority: 'all',
          category: 'all',
          searchTerm: '',
        },
        ...initialState,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('TaskManager', () => {
  it('renders task manager header', () => {
    renderWithProviders(<TaskManager />);
    expect(screen.getByText('작업 관리')).toBeInTheDocument();
    expect(screen.getByText('새 작업')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    renderWithProviders(<TaskManager />);
    expect(screen.getByText('아직 작업이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('첫 작업 만들기')).toBeInTheDocument();
  });

  it('opens task form when clicking new task button', () => {
    renderWithProviders(<TaskManager />);
    const newTaskButton = screen.getByText('새 작업');
    fireEvent.click(newTaskButton);
    // Form should be opened (modal will be rendered)
  });

  it('renders task list when tasks exist', () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Test Task 1',
        description: 'Description 1',
        category: 'work',
        priority: 'high',
        status: 'pending',
        estimatedDuration: 30,
        isFlexible: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        subtasks: [],
      },
      {
        id: '2',
        title: 'Test Task 2',
        description: 'Description 2',
        category: 'personal',
        priority: 'medium',
        status: 'in-progress',
        estimatedDuration: 45,
        isFlexible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        subtasks: [],
      },
    ];

    const store = createMockStore({ tasks: { tasks: mockTasks } });
    renderWithProviders(<TaskManager />, store);
    
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('filters tasks based on search term', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'React Component',
        description: 'Build React component',
        category: 'development',
        priority: 'high',
        status: 'pending',
        estimatedDuration: 60,
        isFlexible: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        subtasks: [],
      },
      {
        id: '2',
        title: 'Write Documentation',
        description: 'Document the API',
        category: 'documentation',
        priority: 'medium',
        status: 'pending',
        estimatedDuration: 30,
        isFlexible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        subtasks: [],
      },
    ];

    const store = createMockStore({ tasks: { tasks: mockTasks } });
    renderWithProviders(<TaskManager />, store);
    
    const searchInput = screen.getByPlaceholderText(/검색/i);
    fireEvent.change(searchInput, { target: { value: 'React' } });
    
    await waitFor(() => {
      expect(screen.getByText('React Component')).toBeInTheDocument();
      expect(screen.queryByText('Write Documentation')).not.toBeInTheDocument();
    });
  });

  it('handles task selection for bulk operations', () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Task 1',
        description: 'Description 1',
        category: 'work',
        priority: 'high',
        status: 'pending',
        estimatedDuration: 30,
        isFlexible: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        subtasks: [],
      },
      {
        id: '2',
        title: 'Task 2',
        description: 'Description 2',
        category: 'personal',
        priority: 'medium',
        status: 'pending',
        estimatedDuration: 45,
        isFlexible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        subtasks: [],
      },
    ];

    const store = createMockStore({ tasks: { tasks: mockTasks } });
    renderWithProviders(<TaskManager />, store);
    
    // Select first task
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    // Bulk operations bar should appear
    expect(screen.getByText(/1개 선택됨/)).toBeInTheDocument();
  });
});