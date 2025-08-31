import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BulkOperations from '../BulkOperations';
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

describe('BulkOperations', () => {
  const mockOnClearSelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when no tasks are selected', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={[]}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.queryByText(/선택됨/)).not.toBeInTheDocument();
  });

  it('shows selected task count', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByText('2개 선택됨')).toBeInTheDocument();
  });

  it('displays all bulk operation buttons', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByText('상태 변경')).toBeInTheDocument();
    expect(screen.getByText('우선순위 변경')).toBeInTheDocument();
    expect(screen.getByText('삭제')).toBeInTheDocument();
    expect(screen.getByText('선택 해제')).toBeInTheDocument();
  });

  it('shows status menu when status button is clicked', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    const statusButton = screen.getByText('상태 변경');
    fireEvent.click(statusButton);

    expect(screen.getByText('대기중')).toBeInTheDocument();
    expect(screen.getByText('진행중')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.getByText('연기됨')).toBeInTheDocument();
  });

  it('shows priority menu when priority button is clicked', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    const priorityButton = screen.getByText('우선순위 변경');
    fireEvent.click(priorityButton);

    expect(screen.getByText('높음')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.getByText('낮음')).toBeInTheDocument();
  });

  it('shows delete confirmation modal when delete button is clicked', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    expect(screen.getByText('작업 일괄 삭제')).toBeInTheDocument();
    expect(screen.getByText(/선택한.*2개.*의 작업을 모두 삭제하시겠습니까/)).toBeInTheDocument();
    expect(screen.getByText('이 작업은 되돌릴 수 없습니다.')).toBeInTheDocument();
  });

  it('calls onClearSelection when clear button is clicked', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    const clearButton = screen.getByText('선택 해제');
    fireEvent.click(clearButton);

    expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
  });

  it('closes delete modal when cancel is clicked', () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('작업 일괄 삭제')).not.toBeInTheDocument();
  });

  it('shows processing state when performing bulk operations', async () => {
    renderWithProvider(
      <BulkOperations
        selectedTasks={mockTasks}
        onClearSelection={mockOnClearSelection}
      />
    );

    const statusButton = screen.getByText('상태 변경');
    fireEvent.click(statusButton);

    const completedOption = screen.getByText('완료');
    fireEvent.click(completedOption);

    // Should show processing indicator
    await waitFor(() => {
      expect(screen.queryByText('처리 중...')).toBeInTheDocument();
    });
  });
});