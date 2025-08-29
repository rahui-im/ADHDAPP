import React, { useState, useRef } from 'react'
import { useDataBackup, useAutoBackupMonitor } from '../../hooks/useDataBackup'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Card } from '../ui/Card'
import { Toast } from '../ui/Toast'

interface BackupManagerProps {
  className?: string
}

export const BackupManager: React.FC<BackupManagerProps> = ({ className = '' }) => {
  const {
    isCreating,
    isRestoring,
    isLoading,
    error,
    backupList,
    createBackup,
    downloadBackup,
    restoreFromFile,
    restoreFromStored,
    deleteBackup,
    handleStorageFailure,
    getBackupStatus,
    formatFileSize,
    validateBackupFile,
    clearError,
  } = useDataBackup()

  const { isHealthy: isBackupHealthy } = useAutoBackupMonitor()
  
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [restoreOptions, setRestoreOptions] = useState({
    overwriteExisting: false,
    skipDuplicates: true,
    restoreTimerState: false,
    createBackupBeforeRestore: true,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileValidation, setFileValidation] = useState<{
    isValid: boolean
    error?: string
    metadata?: any
  } | null>(null)
  const [showToast, setShowToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning'
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const backupStatus = getBackupStatus()

  // 백업 생성
  const handleCreateBackup = async () => {
    const success = await createBackup()
    if (success) {
      setShowToast({
        message: '백업이 성공적으로 생성되었습니다.',
        type: 'success',
      })
    }
  }

  // 백업 다운로드
  const handleDownloadBackup = async () => {
    const success = await downloadBackup()
    if (success) {
      setShowToast({
        message: '백업 파일이 다운로드되었습니다.',
        type: 'success',
      })
    }
  }

  // 파일 선택
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    
    // 파일 유효성 검사
    const validation = await validateBackupFile(file)
    setFileValidation(validation)
    
    if (validation.isValid) {
      setShowRestoreModal(true)
    } else {
      setShowToast({
        message: validation.error || '유효하지 않은 백업 파일입니다.',
        type: 'error',
      })
    }
  }

  // 파일에서 복원
  const handleRestoreFromFile = async () => {
    if (!selectedFile) return

    const result = await restoreFromFile(selectedFile, restoreOptions)
    
    if (result.success && result.result) {
      const { restored, skipped, errors } = result.result
      const totalRestored = Object.values(restored).reduce((sum, val) => 
        sum + (typeof val === 'number' ? val : val ? 1 : 0), 0
      )
      
      setShowToast({
        message: `복원 완료: ${totalRestored}개 항목 복원, ${skipped}개 건너뜀${errors.length > 0 ? `, ${errors.length}개 오류` : ''}`,
        type: errors.length > 0 ? 'warning' : 'success',
      })
    }
    
    setShowRestoreModal(false)
    setSelectedFile(null)
    setFileValidation(null)
  }

  // 저장된 백업에서 복원
  const handleRestoreFromStored = async (backupId: string) => {
    const result = await restoreFromStored(backupId, restoreOptions)
    
    if (result.success && result.result) {
      const { restored, skipped, errors } = result.result
      const totalRestored = Object.values(restored).reduce((sum, val) => 
        sum + (typeof val === 'number' ? val : val ? 1 : 0), 0
      )
      
      setShowToast({
        message: `복원 완료: ${totalRestored}개 항목 복원, ${skipped}개 건너뜀${errors.length > 0 ? `, ${errors.length}개 오류` : ''}`,
        type: errors.length > 0 ? 'warning' : 'success',
      })
    }
  }

  // 백업 삭제
  const handleDeleteBackup = (backupId: string) => {
    const success = deleteBackup(backupId)
    if (success) {
      setShowToast({
        message: '백업이 삭제되었습니다.',
        type: 'success',
      })
    }
    setShowDeleteConfirm(null)
  }

  // 스토리지 복구
  const handleStorageRecovery = async () => {
    const result = await handleStorageFailure()
    
    if (result.success) {
      setShowToast({
        message: '스토리지 복구가 완료되었습니다.',
        type: 'success',
      })
    } else {
      setShowToast({
        message: '스토리지 복구에 실패했습니다.',
        type: 'error',
      })
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 백업 상태 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">백업 상태</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isBackupHealthy 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isBackupHealthy ? '정상' : '주의 필요'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">전체 백업</div>
            <div className="font-semibold">{backupStatus.totalBackups}개</div>
          </div>
          <div>
            <div className="text-gray-500">자동 백업</div>
            <div className="font-semibold">{backupStatus.autoBackups}개</div>
          </div>
          <div>
            <div className="text-gray-500">수동 백업</div>
            <div className="font-semibold">{backupStatus.manualBackups}개</div>
          </div>
          <div>
            <div className="text-gray-500">총 크기</div>
            <div className="font-semibold">{formatFileSize(backupStatus.totalSize)}</div>
          </div>
        </div>
        
        {backupStatus.lastAutoBackup && (
          <div className="mt-4 text-sm text-gray-600">
            마지막 자동 백업: {backupStatus.lastAutoBackup.toLocaleString()}
          </div>
        )}
      </Card>

      {/* 백업 생성 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">백업 생성</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? '백업 생성 중...' : '새 백업 생성'}
          </Button>
          <Button
            onClick={handleDownloadBackup}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? '다운로드 중...' : '백업 다운로드'}
          </Button>
        </div>
      </Card>

      {/* 백업 복원 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">백업 복원</h3>
        <div className="space-y-4">
          <div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              variant="outline"
              className="w-full"
            >
              {isRestoring ? '복원 중...' : '파일에서 복원'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          {/* 응급 복구 */}
          <Button
            onClick={handleStorageRecovery}
            disabled={isLoading}
            variant="outline"
            className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            {isLoading ? '복구 중...' : '응급 데이터 복구'}
          </Button>
        </div>
      </Card>

      {/* 저장된 백업 목록 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">저장된 백업</h3>
        
        {backupList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            저장된 백업이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {backupList.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {backup.name}
                    {backup.isAutoBackup && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        자동
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {backup.createdAt.toLocaleString()} • {formatFileSize(backup.size)}
                  </div>
                  <div className="text-xs text-gray-400">
                    포함 데이터: {backup.dataTypes.join(', ')}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRestoreFromStored(backup.id)}
                    disabled={isRestoring}
                    size="sm"
                    variant="outline"
                  >
                    복원
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(backup.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 복원 옵션 모달 */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false)
          setSelectedFile(null)
          setFileValidation(null)
        }}
        title="백업 복원"
      >
        <div className="space-y-4">
          {fileValidation?.metadata && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">백업 정보</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>생성일: {new Date(fileValidation.metadata.createdAt).toLocaleString()}</div>
                <div>버전: {fileValidation.metadata.version}</div>
                <div>크기: {formatFileSize(fileValidation.metadata.totalSize)}</div>
                <div>데이터 유형: {fileValidation.metadata.dataTypes.join(', ')}</div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">복원 옵션</h4>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.overwriteExisting}
                onChange={(e) => setRestoreOptions(prev => ({
                  ...prev,
                  overwriteExisting: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">기존 데이터 덮어쓰기</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.skipDuplicates}
                onChange={(e) => setRestoreOptions(prev => ({
                  ...prev,
                  skipDuplicates: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">중복 데이터 건너뛰기</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.createBackupBeforeRestore}
                onChange={(e) => setRestoreOptions(prev => ({
                  ...prev,
                  createBackupBeforeRestore: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">복원 전 현재 데이터 백업</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.restoreTimerState}
                onChange={(e) => setRestoreOptions(prev => ({
                  ...prev,
                  restoreTimerState: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm text-orange-600">타이머 상태도 복원 (주의)</span>
            </label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleRestoreFromFile}
              disabled={isRestoring}
              className="flex-1"
            >
              {isRestoring ? '복원 중...' : '복원 시작'}
            </Button>
            <Button
              onClick={() => {
                setShowRestoreModal(false)
                setSelectedFile(null)
                setFileValidation(null)
              }}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="백업 삭제"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            이 백업을 삭제하시겠습니까? 삭제된 백업은 복구할 수 없습니다.
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={() => showDeleteConfirm && handleDeleteBackup(showDeleteConfirm)}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              삭제
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(null)}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800">{error}</div>
            <Button
              onClick={clearError}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300"
            >
              닫기
            </Button>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  )
}