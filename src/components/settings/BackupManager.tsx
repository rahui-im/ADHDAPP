import React, { useState, useEffect } from 'react'
import { dataBackupService } from '../../services/dataBackupService'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  TrashIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowDownIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface BackupManagerProps {
  onClose?: () => void
}

export const BackupManager: React.FC<BackupManagerProps> = ({ onClose }) => {
  const [backups, setBackups] = useState<any[]>([])
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [restoreResult, setRestoreResult] = useState<any>(null)
  const [backupOptions, setBackupOptions] = useState({
    includeAnalytics: true,
    includeSettings: true,
    includePersonalData: true
  })

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = () => {
    try {
      const backupList = dataBackupService.getBackupList()
      setBackups(backupList)
    } catch (error) {
      console.error('백업 목록 로드 실패:', error)
    }
  }

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `adhd-timer-backup-${timestamp}.json`
      
      await dataBackupService.downloadBackup(filename, backupOptions)
      loadBackups()
      
      // 성공 메시지
      setRestoreResult({
        success: true,
        message: '백업 파일이 다운로드되었습니다.'
      })
      
      setTimeout(() => setRestoreResult(null), 3000)
    } catch (error) {
      console.error('백업 생성 실패:', error)
      setRestoreResult({
        success: false,
        message: '백업 생성에 실패했습니다.'
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.json')) {
        alert('JSON 파일만 선택할 수 있습니다.')
        return
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB 제한
        alert('파일 크기가 너무 큽니다. (최대 50MB)')
        return
      }
      
      setSelectedFile(file)
      setRestoreResult(null)
    }
  }

  const handleRestoreFromFile = async () => {
    if (!selectedFile) return

    const confirmMessage = `
백업 파일에서 데이터를 복원하시겠습니까?

⚠️ 주의사항:
- 현재 데이터와 중복되지 않는 항목만 추가됩니다
- 기존 데이터는 덮어쓰지 않습니다
- 복원 전 자동 백업이 생성됩니다

계속하시겠습니까?`

    if (!confirm(confirmMessage)) return

    setIsRestoring(true)
    try {
      const result = await dataBackupService.restoreFromFile(selectedFile, {
        overwriteExisting: false,
        skipDuplicates: true,
        createBackupBeforeRestore: true
      })
      
      setRestoreResult(result)
      
      if (result.restored) {
        loadBackups()
        
        // 복원 완료 후 새로고침 권장
        setTimeout(() => {
          if (confirm('복원이 완료되었습니다. 변경사항을 적용하려면 페이지를 새로고침해야 합니다. 지금 새로고침하시겠습니까?')) {
            window.location.reload()
          }
        }, 2000)
      }
    } catch (error) {
      console.error('복원 실패:', error)
      setRestoreResult({
        success: false,
        message: error instanceof Error ? error.message : '복원에 실패했습니다.'
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleRestoreFromStoredBackup = async (backupId: string) => {
    if (!confirm('이 백업으로 복원하시겠습니까? 현재 데이터가 변경될 수 있습니다.')) {
      return
    }

    setIsRestoring(true)
    try {
      const backupData = dataBackupService.getStoredBackup(backupId)
      if (!backupData) {
        throw new Error('백업 데이터를 찾을 수 없습니다.')
      }

      const result = await dataBackupService.restoreBackup(backupData, {
        overwriteExisting: false,
        skipDuplicates: true,
        createBackupBeforeRestore: true
      })
      
      setRestoreResult(result)
      
      if (result.restored) {
        loadBackups()
        setTimeout(() => {
          if (confirm('복원이 완료되었습니다. 페이지를 새로고침하시겠습니까?')) {
            window.location.reload()
          }
        }, 2000)
      }
    } catch (error) {
      console.error('저장된 백업 복원 실패:', error)
      setRestoreResult({
        success: false,
        message: error instanceof Error ? error.message : '백업 복원에 실패했습니다.'
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDeleteBackup = (backupId: string) => {
    if (confirm('이 백업을 삭제하시겠습니까?')) {
      const success = dataBackupService.deleteBackup(backupId)
      if (success) {
        loadBackups()
      } else {
        alert('백업 삭제에 실패했습니다.')
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* 백업 생성 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CloudArrowDownIcon className="w-5 h-5" />
          <span>데이터 백업 생성</span>
        </h3>
        <p className="text-gray-600 mb-4">
          현재 데이터를 JSON 파일로 내보내어 안전하게 보관하세요.
        </p>
        
        {/* 백업 옵션 */}
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">백업 옵션</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupOptions.includeAnalytics}
                onChange={(e) => setBackupOptions(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">분석 데이터 포함</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupOptions.includeSettings}
                onChange={(e) => setBackupOptions(prev => ({ ...prev, includeSettings: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">설정 데이터 포함</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupOptions.includePersonalData}
                onChange={(e) => setBackupOptions(prev => ({ ...prev, includePersonalData: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">개인정보 포함 (이름, 작업 제목 등)</span>
            </label>
          </div>
        </div>
        
        <Button
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
          className="flex items-center space-x-2"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>{isCreatingBackup ? '백업 생성 중...' : '백업 다운로드'}</span>
        </Button>
      </Card>

      {/* 백업 복원 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <ArrowUpTrayIcon className="w-5 h-5" />
          <span>데이터 복원</span>
        </h3>
        <p className="text-gray-600 mb-4">
          백업 파일에서 데이터를 복원합니다. 기존 데이터는 보존되며 새로운 항목만 추가됩니다.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              백업 파일 선택 (.json)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <DocumentArrowDownIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
              
              <Button
                onClick={handleRestoreFromFile}
                disabled={isRestoring}
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                <span>{isRestoring ? '복원 중...' : '복원 시작'}</span>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 복원 결과 */}
      {restoreResult && (
        <Card className={`p-6 ${restoreResult.success !== false ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-start space-x-3">
            {restoreResult.success !== false ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium ${restoreResult.success !== false ? 'text-green-900' : 'text-red-900'}`}>
                {restoreResult.success !== false ? '작업 완료' : '작업 실패'}
              </h4>
              <p className={`text-sm ${restoreResult.success !== false ? 'text-green-700' : 'text-red-700'}`}>
                {restoreResult.message}
              </p>
              
              {restoreResult.restored && (
                <div className="mt-2 text-sm text-green-700">
                  <p>복원된 항목:</p>
                  <ul className="list-disc list-inside ml-4">
                    {restoreResult.restored.user && <li>사용자 정보</li>}
                    {restoreResult.restored.tasks > 0 && <li>{restoreResult.restored.tasks}개 작업</li>}
                    {restoreResult.restored.sessions > 0 && <li>{restoreResult.restored.sessions}개 세션</li>}
                    {restoreResult.restored.dailyStats > 0 && <li>{restoreResult.restored.dailyStats}개 일일 통계</li>}
                    {restoreResult.restored.settings > 0 && <li>{restoreResult.restored.settings}개 설정</li>}
                  </ul>
                  {restoreResult.skipped > 0 && (
                    <p className="mt-1">건너뛴 항목: {restoreResult.skipped}개 (중복)</p>
                  )}
                </div>
              )}
              
              {restoreResult.errors && restoreResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-700">
                  <p>오류:</p>
                  <ul className="list-disc list-inside ml-4">
                    {restoreResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 저장된 백업 목록 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <ClockIcon className="w-5 h-5" />
          <span>저장된 백업</span>
        </h3>
        
        {backups.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">저장된 백업이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">
              자동 백업은 24시간마다 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    backup.isAutoBackup ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {backup.isAutoBackup ? (
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {backup.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(backup.createdAt)} • {formatFileSize(backup.size)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {backup.dataTypes.map((type: string) => (
                        <span key={type} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleRestoreFromStoredBackup(backup.id)}
                    disabled={isRestoring}
                    variant="outline"
                    size="sm"
                  >
                    복원
                  </Button>
                  <Button
                    onClick={() => handleDeleteBackup(backup.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 주의사항 */}
      <Card className="p-6 border-yellow-200 bg-yellow-50">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900">백업 및 복원 안내</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• 자동 백업은 24시간마다 생성되며 최대 10개까지 보관됩니다</li>
              <li>• 복원 시 기존 데이터는 보존되고 새로운 항목만 추가됩니다</li>
              <li>• 중요한 데이터는 정기적으로 수동 백업하여 안전한 곳에 보관하세요</li>
              <li>• 복원 후에는 페이지를 새로고침하여 변경사항을 적용하세요</li>
              <li>• 개인정보가 포함된 백업 파일은 안전하게 관리하세요</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 닫기 버튼 */}
      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            닫기
          </Button>
        </div>
      )}
    </div>
  )
}

export default BackupManager