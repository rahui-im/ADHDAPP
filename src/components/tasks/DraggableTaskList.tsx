import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { useAppDispatch } from '../../store/store';
import { reorderTasks } from '../../store/taskSlice';
import Card from '../ui/Card';
import TaskStatusManager from './TaskStatusManager';
import Button from '../ui/Button';
import { PencilIcon, TrashIcon } from '../ui/Icons';

interface DraggableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  selectedTasks: Task[];
  onSelectTask?: (task: Task) => void;
}

const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({ 
  task, 
  onEdit, 
  onDelete,
  selectedTasks,
  onSelectTask
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '보통';
    }
  };

  const isSelected = selectedTasks.some(t => t.id === task.id);
  
  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''} ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}>
        <div className="flex items-start justify-between">
          {/* 체크박스 */}
          {onSelectTask && (
            <div className="p-2 mr-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectTask(task)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </div>
          )}
          
          {/* 드래그 핸들 */}
          <div
            {...attributes}
            {...listeners}
            className="p-2 cursor-move hover:bg-gray-100 rounded mr-3"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {/* 작업 제목과 우선순위 */}
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {task.title}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            {/* 상태 관리 */}
            <div className="mb-3">
              <TaskStatusManager task={task} />
            </div>

            {/* 작업 설명 */}
            {task.description && (
              <p className="text-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* 작업 정보 */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                ⏱️ {task.estimatedDuration}분
              </span>
              <span className="flex items-center">
                📁 {task.category}
              </span>
              {task.isFlexible && (
                <span className="flex items-center">
                  🔄 유연함
                </span>
              )}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              onClick={() => onEdit(task)}
              variant="secondary"
              size="sm"
              className="p-2"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onDelete(task)}
              variant="danger"
              size="sm"
              className="p-2"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface DraggableTaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  selectedTasks?: Task[];
  onSelectTask?: (task: Task) => void;
}

const DraggableTaskList: React.FC<DraggableTaskListProps> = ({ 
  tasks, 
  onEdit, 
  onDelete,
  selectedTasks = [],
  onSelectTask
}) => {
  const dispatch = useAppDispatch();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState(tasks);

  React.useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Redux store 업데이트
      dispatch(reorderTasks({
        taskId: active.id as string,
        newIndex,
      }));
    }

    setActiveId(null);
  };

  const activeTask = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {items.map((task) => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              selectedTasks={selectedTasks}
              onSelectTask={onSelectTask}
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <Card className="shadow-xl">
              <div className="p-4">
                <h3 className="font-semibold">{activeTask.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{activeTask.description}</p>
              </div>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DraggableTaskList;