import { useState } from 'react';
import { useAppDispatch } from '../../store/store';
import { updateTaskAsync } from '../../store/taskSlice';
import { Task, TaskStatus } from '../../types';
import { motion } from 'framer-motion';

interface TaskStatusManagerProps {
  task: Task;
  onStatusChange?: (status: TaskStatus) => void;
}

const statusConfig = {
  pending: {
    label: '대기중',
    icon: '⏰',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    next: 'in-progress' as TaskStatus,
  },
  'in-progress': {
    label: '진행중',
    icon: '▶️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    next: 'completed' as TaskStatus,
  },
  postponed: {
    label: '연기됨',
    icon: '⏸️',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    next: 'in-progress' as TaskStatus,
  },
  completed: {
    label: '완료',
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    next: 'pending' as TaskStatus,
  },
};

export default function TaskStatusManager({ task, onStatusChange }: TaskStatusManagerProps) {
  const dispatch = useAppDispatch();
  const [isChanging, setIsChanging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const currentStatus = statusConfig[task.status];
  
  const handleStatusChange = async (newStatus: TaskStatus) => {
    setIsChanging(true);
    
    try {
      await dispatch(updateTaskAsync({
        id: task.id,
        updates: { status: newStatus }
      })).unwrap();
      
      // 완료 시 축하 효과
      if (newStatus === 'completed') {
        // 간단한 축하 알림
        const celebration = document.createElement('div');
        celebration.textContent = '🎉 작업 완료!';
        celebration.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 3000);
      }
      
      onStatusChange?.(newStatus);
      setShowDropdown(false);
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setIsChanging(false);
    }
  };
  
  const handleQuickTransition = () => {
    const nextStatus = currentStatus.next;
    handleStatusChange(nextStatus);
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* 현재 상태 표시 */}
      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${currentStatus.bgColor}`}>
        <span>{currentStatus.icon}</span>
        <span className={`text-sm font-medium ${currentStatus.color}`}>
          {currentStatus.label}
        </span>
      </div>
      
      {/* 빠른 전환 버튼 */}
      {task.status !== 'completed' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleQuickTransition}
          disabled={isChanging}
          className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {isChanging ? '변경 중...' : `${statusConfig[currentStatus.next].label}로 변경`}
        </motion.button>
      )}
      
      {/* 상태 드롭다운 */}
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status as TaskStatus)}
                disabled={task.status === status || isChanging}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg"
              >
                <span>{config.icon}</span>
                <span className="text-sm">{config.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}