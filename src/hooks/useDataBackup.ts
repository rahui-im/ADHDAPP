import { useState, useCallback, useEffect } from 'react'
import { dataBackupService, DataBackupError } from '../services/dataBackupService'

interface BackupMetadata {
  id: string
  name: string
  createdAt: Date
  size: number
  dataTypes: string[]
  isAutoBackup: boolean
}

interface BackupOptions {
  includeUser?: boolean
  includeTasks?: boolean
  includeSessions?: boolean
  includeStats?: boolean
  includeTimerState?: boolean
  includeSettings?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  compress?: boolean
}

interface RestoreOptions {
  overwriteExisting?: boolean
  validateData?: boolean
  skipDuplicates?: boolean
  restoreTimerState?: boolean
  createBackupBeforeRestore?: boolean
}

interface BackupState {
  isCreating: boolean
  isRestoring: boolean
  isLoading: boolean
  error: string | null
  lastBackupTime: Date | null
  backupList: BackupMetadata[]
}

export const useDataBackup = () => {
  const [state, setState] = useState<BackupState>({
    isCreating: false,
    isRestoring: false,
    isLoading: false,
    error: null,
    lastBackupTime: null,
    backupList: [],
  })

  /**
   * 백업 목록 새로고침
   */
  const refreshBackupList = useCallback(() => {
    try {
      const backupList = dataBackupService.getBackupList()
      const lastBackup = backupList.length > 0 
        ? backupList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null

      setState(prev => ({
        ...prev,
        backupList,
        lastBackupTime: lastBackup?.createdAt || null,
        error: null,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `백업 목록 조회 실패: ${error}`,
      }))
    }
  }, [])

  /**
   * 백업 생성
   */
  const createBackup = useCallback(async (options: BackupOptions = {}): Promise<boolean> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }))

    try {
      await dataBackupService.createAutoBackup('manual')
      refreshBackupList()
      return true
    } catch (error) {
      const errorMessage = error instanceof DataBackupError 
        ? error.message 
        : `백업 생성 실패: ${error}`
      
      setState(prev => ({ ...prev, error: errorMessage }))
      return false
    } finally {
      setState(prev => ({ ...prev, isCreating: false }))
    }
  }, [refreshBackupList])

  /**
   * 백업 다운로드
   */
  const downloadBackup = useCallback(async (
    filename?: string, 
    options: BackupOptions = {}
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      await dataBackupService.downloadBackup(filename, options)
      return true
    } catch (error) {
      const errorMessage = error instanceof DataBackupError 
        ? error.message 
        : `백업 다운로드 실패: ${error}`
      
      setState(prev => ({ ...prev, error: errorMessage }))
      return false
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  /**
   * 파일에서 백업 복원
   */
  const restoreFromFile = useCallback(async (
    file: File, 
    options: RestoreOptions = {}
  ): Promise<{
    success: boolean
    result?: {
      restored: {
        user: boolean
        tasks: number
        sessions: number
        dailyStats: number
        weeklyInsights: number
        settings: number
      }
      skipped: number
      errors: string[]
    }
  }> => {
    setState(prev => ({ ...prev, isRestoring: true, error: null }))

    try {
      const result = await dataBackupService.restoreFromFile(file, options)
      refreshBackupList()
      return { success: true, result }
    } catch (error) {
      const errorMessage = error instanceof DataBackupError 
        ? error.message 
        : `백업 복원 실패: ${error}`
      
      setState(prev => ({ ...prev, error: errorMessage }))
      return { success: false }
    } finally {
      setState(prev => ({ ...prev, isRestoring: false }))
    }
  }, [refreshBackupList])

  /**
   * 저장된 백업에서 복원
   */
  const restoreFromStored = useCallback(async (
    backupId: string, 
    options: RestoreOptions = {}
  ): Promise<{
    success: boolean
    result?: {
      restored: {
        user: boolean
        tasks: number
        sessions: number
        dailyStats: number
        weeklyInsights: number
        settings: number
      }
      skipped: number
      errors: string[]
    }
  }> => {
    setState(prev => ({ ...prev, isRestoring: true, error: null }))

    try {
      const backupData = dataBackupService.getStoredBackup(backupId)
      if (!backupData) {
        throw new Error('백업 데이터를 찾을 수 없습니다')
      }

      const result = await dataBackupService.restoreBackup(backupData, options)
      refreshBackupList()
      return { success: true, result }
    } catch (error) {
      const errorMessage = error instanceof DataBackupError 
        ? error.message 
        : `백업 복원 실패: ${error}`
      
      setState(prev => ({ ...prev, error: errorMessage }))
      return { success: false }
    } finally {
      setState(prev => ({ ...prev, isRestoring: false }))
    }
  }, [refreshBackupList])

  /**
   * 백업 삭제
   */
  const deleteBackup = useCallback((backupId: string): boolean => {
    try {
      const success = dataBackupService.deleteBackup(backupId)
      if (success) {
        refreshBackupList()
      }
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `백업 삭제 실패: ${error}`,
      }))
      return false
    }
  }, [refreshBackupList])

  /**
   * 스토리지 오류 복구
   */
  const handleStorageFailure = useCallback(async (): Promise<{
    success: boolean
    recoveredData?: any
    errors?: string[]
  }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await dataBackupService.handleStorageFailure()
      
      if (result.recovered) {
        return {
          success: true,
          recoveredData: result.fallbackData,
          errors: result.errors,
        }
      } else {
        return {
          success: false,
          errors: result.errors,
        }
      }
    } catch (error) {
      const errorMessage = `스토리지 복구 실패: ${error}`
      setState(prev => ({ ...prev, error: errorMessage }))
      return {
        success: false,
        errors: [errorMessage],
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  /**
   * 백업 상태 확인
   */
  const getBackupStatus = useCallback(() => {
    const backupList = dataBackupService.getBackupList()
    const autoBackups = backupList.filter(b => b.isAutoBackup)
    const manualBackups = backupList.filter(b => !b.isAutoBackup)
    
    const lastAutoBackup = autoBackups.length > 0 
      ? autoBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      : null

    const totalSize = backupList.reduce((sum, backup) => sum + backup.size, 0)

    return {
      totalBackups: backupList.length,
      autoBackups: autoBackups.length,
      manualBackups: manualBackups.length,
      lastAutoBackup: lastAutoBackup?.createdAt || null,
      totalSize,
      isHealthy: lastAutoBackup && 
        (Date.now() - lastAutoBackup.createdAt.getTime()) < 48 * 60 * 60 * 1000, // 48시간 이내
    }
  }, [])

  /**
   * 에러 클리어
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * 파일 크기 포맷팅
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  /**
   * 백업 유효성 검사
   */
  const validateBackupFile = useCallback(async (file: File): Promise<{
    isValid: boolean
    error?: string
    metadata?: {
      version: string
      createdAt: string
      dataTypes: string[]
      totalSize: number
    }
  }> => {
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('파일 읽기 실패'))
        reader.readAsText(file)
      })

      const backupData = JSON.parse(content)
      
      // 기본 구조 확인
      if (!backupData.version || !backupData.metadata || !backupData.data) {
        return {
          isValid: false,
          error: '유효하지 않은 백업 파일 형식입니다',
        }
      }

      return {
        isValid: true,
        metadata: backupData.metadata,
      }
    } catch (error) {
      return {
        isValid: false,
        error: `백업 파일 검증 실패: ${error}`,
      }
    }
  }, [])

  // 컴포넌트 마운트 시 백업 목록 로드
  useEffect(() => {
    refreshBackupList()
  }, [refreshBackupList])

  return {
    // 상태
    ...state,
    
    // 액션
    createBackup,
    downloadBackup,
    restoreFromFile,
    restoreFromStored,
    deleteBackup,
    handleStorageFailure,
    refreshBackupList,
    clearError,
    
    // 유틸리티
    getBackupStatus,
    formatFileSize,
    validateBackupFile,
  }
}

/**
 * 자동 백업 모니터링 훅
 */
export const useAutoBackupMonitor = () => {
  const [isHealthy, setIsHealthy] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkBackupHealth = useCallback(() => {
    try {
      const backupList = dataBackupService.getBackupList()
      const autoBackups = backupList.filter(b => b.isAutoBackup)
      
      if (autoBackups.length === 0) {
        setIsHealthy(false)
        return false
      }

      const latestBackup = autoBackups.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0]

      // 48시간 이내에 백업이 있는지 확인
      const isRecent = (Date.now() - latestBackup.createdAt.getTime()) < 48 * 60 * 60 * 1000
      
      setIsHealthy(isRecent)
      setLastCheck(new Date())
      
      return isRecent
    } catch (error) {
      console.warn('백업 상태 확인 실패:', error)
      setIsHealthy(false)
      return false
    }
  }, [])

  // 주기적으로 백업 상태 확인 (1시간마다)
  useEffect(() => {
    checkBackupHealth()
    
    const interval = setInterval(checkBackupHealth, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [checkBackupHealth])

  return {
    isHealthy,
    lastCheck,
    checkBackupHealth,
  }
}