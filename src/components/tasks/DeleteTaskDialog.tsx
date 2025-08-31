import { useState } from 'react';
import { useAppDispatch } from '../../store/store';
import { deleteTaskAsync } from '../../store/taskSlice';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface DeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  hasSubtasks?: boolean;
}

export default function DeleteTaskDialog({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  hasSubtasks = false,
}: DeleteTaskDialogProps) {
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const handleDelete = async () => {
    if (hasSubtasks && confirmText !== '삭제') {
      alert('확인 텍스트를 입력해주세요');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await dispatch(deleteTaskAsync(taskId)).unwrap();
      console.log('Task deleted successfully');
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('작업 삭제에 실패했습니다');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="작업 삭제 확인"
      size="sm"
      priority="high"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-gray-900">
              정말로 "<strong>{taskTitle}</strong>" 작업을 삭제하시겠습니까?
            </p>
            {hasSubtasks && (
              <p className="mt-2 text-sm text-gray-600">
                이 작업에는 하위 작업이 포함되어 있습니다. 
                모든 하위 작업과 관련 데이터가 함께 삭제됩니다.
              </p>
            )}
            <p className="mt-2 text-sm text-red-600">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
        </div>
        
        {hasSubtasks && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              삭제를 확인하려면 "삭제"를 입력하세요
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="삭제"
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            onClick={handleDelete}
            variant="primary"
            disabled={isDeleting || (hasSubtasks && confirmText !== '삭제')}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}