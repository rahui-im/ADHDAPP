import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DraggableTaskList from '../DraggableTaskList';
import taskReducer from '../../../store/taskSlice';
import { Task } from '../../../types';

const createMockStore = () => {
  return configureStore({
    reducer: {
      tasks: taskReducer,
    },
  });
};

const mockTasks: Task[] = [
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
    status: 'in-progress',
    estimatedDuration: 45,
    isFlexible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    subtasks: [],
  },
];

const renderWithProvider = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('DraggableTaskList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnSelectTask = jest.fn();
  const mockOnSelectAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tasks', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('displays task priorities correctly', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('높음')).toBeInTheDocument(); // high priority
    expect(screen.getByText('보통')).toBeInTheDocument(); // medium priority
  });

  it('displays task status correctly', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('대기중')).toBeInTheDocument(); // pending status
    expect(screen.getByText('진행중')).toBeInTheDocument(); // in-progress status
  });

  it('shows task metadata', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/30분/)).toBeInTheDocument();
    expect(screen.getByText(/45분/)).toBeInTheDocument();
    expect(screen.getByText(/work/)).toBeInTheDocument();
    expect(screen.getByText(/personal/)).toBeInTheDocument();
  });

  it('shows flexibility indicator for flexible tasks', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('유연함')).toBeInTheDocument();
  });

  it('renders drag handles for each task', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const dragHandles = screen.getAllByRole('button', { name: '' }).filter(
      button => button.closest('[class*="cursor-move"]')
    );
    expect(dragHandles).toHaveLength(2);
  });

  it('renders checkboxes when selection is enabled', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedTasks={[]}
        onSelectTask={mockOnSelectTask}
        onSelectAll={mockOnSelectAll}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('shows selected state for selected tasks', () => {
    renderWithProvider(
      <DraggableTaskList
        tasks={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        selectedTasks={[mockTasks[0]]}
        onSelectTask={mockOnSelectTask}
        onSelectAll={mockOnSelectAll}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });
});