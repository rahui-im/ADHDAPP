import React, { useState } from 'react';
import { useAppDispatch } from '../../store/store';
import { deleteTaskAsync, updateTaskAsync } from '../../store/taskSlice';
import { Task, TaskStatus } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkOperationsProps {
  selectedTasks: Task[];
  onClearSelection: () => void;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({ 
  selectedTasks, 
  onClearSelection 
}) => {
  const dispatch = useAppDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  
  const handleBulkStatusUpdate = async (status: TaskStatus) => {
    setIsProcessing(true);
    
    try {
      // Update each selected task
      const updatePromises = selectedTasks.map(task =>
        dispatch(updateTaskAsync({
          id: task.id,
          updates: { status }
        })).unwrap()
      );
      
      await Promise.all(updatePromises);
      console.log(`${selectedTasks.length}개 작업 상태가 업데이트되었습니다`);
      onClearSelection();
      setShowStatusMenu(false);
    } catch (error) {
      console.error('일괄 업데이트 실패:', error);
      alert('일괄 업데이트에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkPriorityUpdate = async (priority: 'high' | 'medium' | 'low') => {
    setIsProcessing(true);
    
    try {
      const updatePromises = selectedTasks.map(task =>
        dispatch(updateTaskAsync({
          id: task.id,
          updates: { priority }
        })).unwrap()
      );
      
      await Promise.all(updatePromises);
      console.log(`${selectedTasks.length}개 작업 우선순위가 변경되었습니다`);
      onClearSelection();
      setShowPriorityMenu(false);
    } catch (error) {
      console.error('우선순위 변경 실패:', error);
      alert('우선순위 변경에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    
    try {
      const deletePromises = selectedTasks.map(task =>
        dispatch(deleteTaskAsync(task.id)).unwrap()
      );
      
      await Promise.all(deletePromises);
      console.log(`${selectedTasks.length}개 작업이 삭제되었습니다`);
      onClearSelection();
      setShowConfirmDelete(false);
    } catch (error) {
      console.error('일괄 삭제 실패:', error);
      alert('일괄 삭제에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkCategoryUpdate = async (category: string) => {
    setIsProcessing(true);
    
    try {
      const updatePromises = selectedTasks.map(task =>
        dispatch(updateTaskAsync({
          id: task.id,
          updates: { category }
        })).unwrap()
      );
      
      await Promise.all(updatePromises);
      console.log(`${selectedTasks.length}개 작업 카테고리가 변경되었습니다`);
    } catch (error) {
      console.error('카테고리 변경 실패:', error);
      alert('카테고리 변경에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (selectedTasks.length === 0) return null;
  
  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-30"
        >
          <div className="flex items-center gap-4">
            {/* 선택된 작업 수 */}
            <div className="text-sm font-medium text-gray-700">
              <span className="text-primary-600 font-bold">{selectedTasks.length}</span>개 선택됨
            </div>
            
            {/* 구분선 */}
            <div className="h-6 w-px bg-gray-300" />
            
            {/* 상태 변경 */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isProcessing}
              >
                상태 변경
              </Button>
              
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]">
                  <button
                    onClick={() => handleBulkStatusUpdate('pending')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    대기중
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('in-progress')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    진행중
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('completed')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    완료
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('postponed')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    연기됨
                  </button>
                </div>
              )}
            </div>
            
            {/* 우선순위 변경 */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                disabled={isProcessing}
              >
                우선순위 변경
              </Button>
              
              {showPriorityMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]">
                  <button
                    onClick={() => handleBulkPriorityUpdate('high')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                  >
                    높음
                  </button>
                  <button
                    onClick={() => handleBulkPriorityUpdate('medium')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-yellow-600"
                  >
                    보통
                  </button>
                  <button
                    onClick={() => handleBulkPriorityUpdate('low')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-600"
                  >
                    낮음
                  </button>
                </div>
              )}
            </div>
            
            {/* 삭제 */}
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowConfirmDelete(true)}
              disabled={isProcessing}
            >
              삭제
            </Button>
            
            {/* 구분선 */}
            <div className="h-6 w-px bg-gray-300" />
            
            {/* 선택 해제 */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearSelection}
              disabled={isProcessing}
            >
              선택 해제
            </Button>
            
            {/* 처리 중 표시 */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                처리 중...
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="작업 일괄 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-gray-900">
                선택한 <strong>{selectedTasks.length}개</strong>의 작업을 모두 삭제하시겠습니까?
              </p>
              <p className="mt-2 text-sm text-red-600">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmDelete(false)}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? '삭제 중...' : '모두 삭제'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BulkOperations;