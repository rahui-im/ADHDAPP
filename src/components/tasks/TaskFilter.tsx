import React, { useState } from 'react';
import { useAppDispatch } from '../../store/store';
import { setTaskFilter } from '../../store/taskSlice';
import { TaskStatus } from '../../types';

interface TaskFilterProps {
  onSearch: (searchTerm: string) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ onSearch }) => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleStatusFilter = (status: TaskStatus | 'all') => {
    setStatusFilter(status);
    dispatch(setTaskFilter({ status }));
  };

  const handlePriorityFilter = (priority: 'all' | 'high' | 'medium' | 'low') => {
    setPriorityFilter(priority);
    dispatch(setTaskFilter({ priority }));
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    dispatch(setTaskFilter({ category }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    onSearch('');
    dispatch(setTaskFilter({ status: 'all', priority: 'all', category: 'all' }));
  };

  const categories = ['all', '업무', '개인', '학습', '운동', '기타'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="space-y-4">
        {/* 검색 바 */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="작업 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 필터 옵션들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as TaskStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="in-progress">진행중</option>
              <option value="postponed">연기됨</option>
              <option value="completed">완료</option>
            </select>
          </div>

          {/* 우선순위 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              우선순위
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">전체</option>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </div>

          {/* 카테고리 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? '전체' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 필터 초기화 버튼 */}
        {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskFilter;