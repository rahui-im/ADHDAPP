// 우리가 만든 타입들을 가져와요
import { User, Task, TimerState } from '../types'

/**
 * 🔑 저장소 키 상수들
 * 
 * 브라우저의 LocalStorage에 데이터를 저장할 때 사용하는 키(이름)들이에요.
 * 예를 들어, 사용자 정보는 'adhd-timer-user'라는 이름으로 저장됩니다.
 * 
 * 왜 상수로 만들까요?
 * - 오타를 방지할 수 있어요
 * - 나중에 키 이름을 바꿀 때 한 곳만 수정하면 돼요
 * - 코드를 읽기 쉬워져요
 */
const STORAGE_KEYS = {
  USER: 'adhd-timer-user',           // 사용자 정보 (이름, 설정 등)
  TASKS: 'adhd-timer-tasks',         // 할 일 목록
  TIMER_STATE: 'adhd-timer-state',   // 타이머 상태 (실행 중인지, 남은 시간 등)
  SETTINGS: 'adhd-timer-settings',   // 앱 설정
  ENERGY_LEVEL: 'adhd-timer-energy', // 현재 에너지 레벨
  FOCUS_MODE: 'adhd-timer-focus-mode', // 집중 모드 상태
} as const

/**
 * 🚨 저장소 오류 클래스
 * 
 * 저장소에서 문제가 생겼을 때 사용하는 특별한 에러 타입이에요.
 * 일반적인 Error보다 더 자세한 정보를 담을 수 있어요.
 * 
 * 예시: 저장소가 가득 찼을 때, 데이터가 손상되었을 때 등
 */
export class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message) // 부모 클래스(Error)의 생성자를 호출
    this.name = 'StorageError' // 에러 이름을 설정
  }
}

/**
 * 📦 데이터 직렬화/역직렬화 헬퍼 클래스
 * 
 * 직렬화란? 
 * - 복잡한 데이터(객체, 배열 등)를 문자열로 변환하는 것
 * - LocalStorage는 문자열만 저장할 수 있어서 필요해요
 * 
 * 역직렬화란?
 * - 문자열을 다시 원래 데이터로 변환하는 것
 * 
 * 특별한 점: Date 객체도 안전하게 저장/복원할 수 있어요!
 */
class StorageSerializer {
  /**
   * 데이터를 문자열로 변환 (저장할 때 사용)
   * @param data 저장할 데이터 (어떤 타입이든 가능)
   * @returns JSON 문자열
   */
  static serialize<T>(data: T): string {
    try {
      return JSON.stringify(data, (key, value) => {
        // 🗓️ Date 객체를 특별하게 처리
        // 왜냐하면 JSON.stringify는 Date를 제대로 처리하지 못해요
        if (value instanceof Date) {
          return { 
            __type: 'Date', // 이것이 Date였다는 표시
            value: value.toISOString() // 표준 날짜 문자열로 변환
          }
        }
        return value // 다른 값들은 그대로
      })
    } catch (error) {
      throw new StorageError('데이터 직렬화 실패', error as Error)
    }
  }

  /**
   * 문자열을 다시 데이터로 변환 (불러올 때 사용)
   * @param data JSON 문자열
   * @returns 원래 데이터
   */
  static deserialize<T>(data: string): T {
    try {
      return JSON.parse(data, (key, value) => {
        // 🗓️ Date 객체 복원
        // __type이 'Date'인 객체를 찾아서 다시 Date로 만들어요
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value)
        }
        return value // 다른 값들은 그대로
      })
    } catch (error) {
      throw new StorageError('데이터 역직렬화 실패', error as Error)
    }
  }
}

/**
 * 💾 LocalStorage 래퍼 클래스
 * 
 * LocalStorage를 더 안전하고 편리하게 사용할 수 있게 해주는 클래스예요.
 * 
 * 래퍼(Wrapper)란?
 * - 기존 기능을 감싸서 더 좋게 만드는 것
 * - 예: 에러 처리, 용량 관리, 데이터 정리 등을 자동으로 해줘요
 */
class LocalStorageService {
  /**
   * 🔍 LocalStorage를 사용할 수 있는지 확인
   * 
   * 왜 확인해야 할까요?
   * - 일부 브라우저에서는 LocalStorage가 비활성화될 수 있어요
   * - 시크릿 모드에서는 제한될 수 있어요
   * - 저장소가 가득 찬 경우도 있어요
   * 
   * @returns true면 사용 가능, false면 사용 불가
   */
  private isAvailable(): boolean {
    try {
      // 테스트용 데이터를 저장해보고 바로 삭제
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true // 성공하면 사용 가능
    } catch {
      return false // 실패하면 사용 불가
    }
  }

  /**
   * 📊 저장소 용량 확인 및 관리
   * 
   * LocalStorage는 보통 5-10MB 정도의 제한이 있어요.
   * 용량이 부족하면 새로운 데이터를 저장할 수 없으니까 미리 확인해요.
   */
  private checkQuota(): void {
    try {
      // 💡 현재 사용 중인 저장소 크기 계산
      // Blob을 사용해서 모든 localStorage 데이터의 크기를 측정해요
      const used = new Blob(Object.values(localStorage)).size
      const limit = 5 * 1024 * 1024 // 5MB (5 × 1024 × 1024 바이트)
      
      // 🚨 90% 이상 사용하면 경고하고 정리 시작
      if (used > limit * 0.9) {
        console.warn('LocalStorage 용량이 90%를 초과했습니다.')
        this.cleanup() // 오래된 데이터 정리
      }
    } catch (error) {
      console.warn('저장소 용량 확인 실패:', error)
    }
  }

  /**
   * 🧹 오래된 데이터 정리
   * 
   * 저장소가 가득 차지 않도록 오래된 데이터를 자동으로 삭제해요.
   * 30일 이상 된 세션 데이터나 손상된 데이터를 정리합니다.
   */
  private cleanup(): void {
    try {
      // 📅 30일 전 시간 계산
      // Date.now()는 현재 시간을 밀리초로 반환
      // 30일 = 30 × 24시간 × 60분 × 60초 × 1000밀리초
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      
      // 🔍 localStorage의 모든 키를 확인
      Object.keys(localStorage).forEach(key => {
        // 우리 앱의 세션 데이터만 확인 (다른 앱 데이터는 건드리지 않아요)
        if (key.startsWith('adhd-timer-session-')) {
          try {
            // 데이터를 불러와서 언제 저장되었는지 확인
            const data = this.get<{ timestamp: number }>(key)
            if (data && data.timestamp < thirtyDaysAgo) {
              localStorage.removeItem(key) // 30일 이상 된 데이터 삭제
            }
          } catch {
            // 💥 데이터를 읽을 수 없으면 (손상된 데이터) 삭제
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.error('저장소 정리 실패:', error)
    }
  }

  /**
   * 💾 데이터 저장하기
   * 
   * @param key 저장할 데이터의 이름 (예: 'user-settings')
   * @param value 저장할 데이터 (객체, 배열, 문자열 등 뭐든 가능)
   * 
   * 예시: set('user-name', 'John') 또는 set('tasks', [task1, task2])
   */
  set<T>(key: string, value: T): void {
    // 🔍 먼저 LocalStorage를 사용할 수 있는지 확인
    if (!this.isAvailable()) {
      throw new StorageError('LocalStorage를 사용할 수 없습니다.')
    }

    try {
      // 📊 저장소 용량 확인 (가득 차면 정리)
      this.checkQuota()
      
      // 📦 데이터를 문자열로 변환 (LocalStorage는 문자열만 저장 가능)
      const serialized = StorageSerializer.serialize(value)
      
      // 💾 실제로 저장
      localStorage.setItem(key, serialized)
    } catch (error) {
      // 🚨 이미 우리가 만든 에러면 그대로 던지기
      if (error instanceof StorageError) {
        throw error
      }
      
      // 💥 DOMException 코드 22는 "용량 부족" 에러
      if (error instanceof DOMException && error.code === 22) {
        throw new StorageError('저장소 용량이 부족합니다.', error)
      }
      
      // 🤷 기타 알 수 없는 에러
      throw new StorageError('데이터 저장 실패', error as Error)
    }
  }

  /**
   * 📂 데이터 불러오기
   * 
   * @param key 불러올 데이터의 이름
   * @returns 저장된 데이터 또는 null (없으면)
   * 
   * 예시: const userName = get<string>('user-name')
   */
  get<T>(key: string): T | null {
    // 🔍 LocalStorage를 사용할 수 없으면 null 반환
    if (!this.isAvailable()) {
      return null
    }

    try {
      // 📂 localStorage에서 데이터 가져오기
      const item = localStorage.getItem(key)
      
      // 🤷 데이터가 없으면 null 반환
      if (item === null) {
        return null
      }
      
      // 📦 문자열을 다시 원래 데이터로 변환
      return StorageSerializer.deserialize<T>(item)
    } catch (error) {
      // 💥 데이터를 읽을 수 없으면 (손상된 데이터)
      console.error(`데이터 로드 실패 (${key}):`, error)
      
      // 🗑️ 손상된 데이터는 삭제해서 문제를 방지
      this.remove(key)
      return null
    }
  }

  /**
   * 🗑️ 데이터 삭제하기
   * 
   * @param key 삭제할 데이터의 이름
   * 
   * 예시: remove('old-user-data')
   */
  remove(key: string): void {
    // 🔍 LocalStorage를 사용할 수 없으면 그냥 종료
    if (!this.isAvailable()) {
      return
    }

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`데이터 삭제 실패 (${key}):`, error)
    }
  }

  /**
   * 🧹 우리 앱의 모든 데이터 삭제
   * 
   * 주의: 다른 웹사이트의 데이터는 건드리지 않아요!
   * 'adhd-timer-'로 시작하는 우리 앱 데이터만 삭제합니다.
   */
  clear(): void {
    // 🔍 LocalStorage를 사용할 수 없으면 그냥 종료
    if (!this.isAvailable()) {
      return
    }

    try {
      // 🔍 localStorage의 모든 키를 확인
      Object.keys(localStorage).forEach(key => {
        // 우리 앱의 데이터만 삭제 (다른 앱 데이터는 보호)
        if (key.startsWith('adhd-timer-')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('저장소 초기화 실패:', error)
    }
  }

  /**
   * 📊 저장소 상태 정보 가져오기
   * 
   * @returns 사용량과 사용 가능 여부 정보
   * 
   * 용도: 설정 화면에서 저장소 상태를 보여줄 때 사용
   */
  getStorageInfo(): { used: number; available: boolean } {
    // 🔍 LocalStorage를 사용할 수 없으면 기본값 반환
    if (!this.isAvailable()) {
      return { used: 0, available: false }
    }

    try {
      // 📊 현재 사용 중인 저장소 크기 계산
      const used = new Blob(Object.values(localStorage)).size
      return { used, available: true }
    } catch {
      // 💥 계산 실패하면 기본값 반환
      return { used: 0, available: true }
    }
  }
}

/**
 * 👤 사용자 관련 데이터 저장소 서비스
 * 
 * 사용자 정보, 에너지 레벨, 집중 모드 등 사용자와 관련된 
 * 모든 데이터를 관리하는 전용 서비스예요.
 */
export class UserStorageService {
  // 🔧 내부에서 사용할 기본 저장소 서비스
  private storage = new LocalStorageService()

  /**
   * 👤 사용자 정보 저장
   * @param user 사용자 객체 (이름, 설정, 선호도 등)
   */
  saveUser(user: User): void {
    this.storage.set(STORAGE_KEYS.USER, user)
  }

  /**
   * 👤 사용자 정보 불러오기
   * @returns 저장된 사용자 정보 또는 null (처음 사용자)
   */
  loadUser(): User | null {
    return this.storage.get<User>(STORAGE_KEYS.USER)
  }

  /**
   * 👤 사용자 정보 삭제 (로그아웃 시 사용)
   */
  removeUser(): void {
    this.storage.remove(STORAGE_KEYS.USER)
  }

  /**
   * ⚡ 현재 에너지 레벨 저장
   * 
   * ADHD 사용자는 에너지 레벨에 따라 다른 작업을 해야 해요.
   * - low: 간단한 작업만
   * - medium: 보통 작업
   * - high: 복잡한 작업도 가능
   * 
   * @param level 에너지 레벨
   */
  saveEnergyLevel(level: 'low' | 'medium' | 'high'): void {
    this.storage.set(STORAGE_KEYS.ENERGY_LEVEL, {
      level,
      timestamp: Date.now(), // 언제 설정했는지도 기록
    })
  }

  /**
   * ⚡ 저장된 에너지 레벨 불러오기
   * @returns 에너지 레벨과 설정 시간
   */
  loadEnergyLevel(): { level: 'low' | 'medium' | 'high'; timestamp: number } | null {
    return this.storage.get(STORAGE_KEYS.ENERGY_LEVEL)
  }

  /**
   * 🎯 집중 모드 상태 저장
   * 
   * 집중 모드가 켜지면 불필요한 UI를 숨기고 
   * 방해 요소를 최소화해요.
   * 
   * @param isActive 집중 모드 활성화 여부
   */
  saveFocusMode(isActive: boolean): void {
    this.storage.set(STORAGE_KEYS.FOCUS_MODE, {
      isActive,
      timestamp: Date.now(), // 언제 설정했는지도 기록
    })
  }

  /**
   * 🎯 집중 모드 상태 불러오기
   * @returns 집중 모드 상태와 설정 시간
   */
  loadFocusMode(): { isActive: boolean; timestamp: number } | null {
    return this.storage.get(STORAGE_KEYS.FOCUS_MODE)
  }
}

/**
 * ✅ 할 일 관련 데이터 저장소 서비스
 * 
 * 사용자의 모든 할 일(Task)을 관리하는 전용 서비스예요.
 * 할 일 추가, 수정, 삭제, 완료 처리 등을 담당합니다.
 */
export class TaskStorageService {
  // 🔧 내부에서 사용할 기본 저장소 서비스
  private storage = new LocalStorageService()

  /**
   * ✅ 모든 할 일 목록 저장
   * @param tasks 할 일 배열
   */
  saveTasks(tasks: Task[]): void {
    this.storage.set(STORAGE_KEYS.TASKS, tasks)
  }

  /**
   * ✅ 저장된 모든 할 일 목록 불러오기
   * @returns 할 일 배열 (없으면 빈 배열)
   */
  loadTasks(): Task[] {
    // || [] 는 null이면 빈 배열을 반환한다는 뜻이에요
    return this.storage.get<Task[]>(STORAGE_KEYS.TASKS) || []
  }

  /**
   * 🗑️ 모든 할 일 삭제 (초기화)
   */
  clearTasks(): void {
    this.storage.remove(STORAGE_KEYS.TASKS)
  }

  /**
   * ✏️ 개별 할 일 저장 또는 업데이트
   * 
   * 이 메서드는 매우 똑똑해요!
   * - 새로운 할 일이면 목록에 추가
   * - 기존 할 일이면 내용을 업데이트
   * 
   * @param task 저장할 할 일 객체
   */
  saveTask(task: Task): void {
    // 📂 현재 저장된 모든 할 일 불러오기
    const tasks = this.loadTasks()
    
    // 🔍 같은 ID를 가진 할 일이 이미 있는지 찾기
    const existingIndex = tasks.findIndex(t => t.id === task.id)
    
    if (existingIndex !== -1) {
      // ✏️ 기존 할 일이 있으면 업데이트
      tasks[existingIndex] = task
    } else {
      // ➕ 새로운 할 일이면 목록에 추가
      tasks.push(task)
    }
    
    // 💾 변경된 목록을 다시 저장
    this.saveTasks(tasks)
  }

  /**
   * 🗑️ 특정 할 일 삭제
   * @param taskId 삭제할 할 일의 ID
   */
  removeTask(taskId: string): void {
    // 📂 현재 저장된 모든 할 일 불러오기
    const tasks = this.loadTasks()
    
    // 🔍 삭제할 할 일을 제외한 나머지만 남기기
    // filter는 조건에 맞는 것들만 새 배열로 만들어줘요
    const filteredTasks = tasks.filter(t => t.id !== taskId)
    
    // 💾 변경된 목록을 다시 저장
    this.saveTasks(filteredTasks)
  }
}

/**
 * ⏰ 타이머 관련 데이터 저장소 서비스
 * 
 * 포모도로 타이머의 상태를 관리하는 전용 서비스예요.
 * 페이지를 새로고침해도 타이머가 계속 돌아갈 수 있게 해줍니다!
 */
export class TimerStorageService {
  // 🔧 내부에서 사용할 기본 저장소 서비스
  private storage = new LocalStorageService()

  /**
   * ⏰ 타이머 상태 저장
   * 
   * 타이머가 실행 중일 때 상태를 저장해서,
   * 브라우저를 닫았다가 다시 열어도 타이머가 계속 돌아가요!
   * 
   * @param state 타이머 상태 (남은 시간, 실행 여부 등)
   */
  saveTimerState(state: TimerState & { lastStartTime?: number }): void {
    this.storage.set(STORAGE_KEYS.TIMER_STATE, {
      ...state, // 기존 상태 복사
      timestamp: Date.now(), // 언제 저장했는지 기록
    })
  }

  /**
   * ⏰ 저장된 타이머 상태 불러오기
   * @returns 타이머 상태 또는 null (저장된 상태 없음)
   */
  loadTimerState(): (TimerState & { lastStartTime?: number; timestamp?: number }) | null {
    return this.storage.get(STORAGE_KEYS.TIMER_STATE)
  }

  /**
   * 🗑️ 타이머 상태 삭제 (타이머 종료 시)
   */
  clearTimerState(): void {
    this.storage.remove(STORAGE_KEYS.TIMER_STATE)
  }

  /**
   * 🔄 타이머를 복구할 수 있는지 확인
   * 
   * 다음 조건을 모두 만족해야 복구 가능:
   * 1. 저장된 타이머 상태가 있어야 함
   * 2. 타이머가 실행 중이었어야 함
   * 3. 24시간 이내에 저장된 상태여야 함
   * 
   * @returns true면 복구 가능, false면 불가능
   */
  canRestoreTimer(): boolean {
    // 📂 저장된 타이머 상태 불러오기
    const state = this.loadTimerState()
    
    // 🚫 상태가 없거나, 실행 중이 아니었거나, 저장 시간이 없으면 복구 불가
    if (!state || !state.isRunning || !state.timestamp) {
      return false
    }

    // ⏱️ 저장된 시간부터 지금까지 얼마나 지났는지 계산
    const elapsed = Date.now() - state.timestamp
    
    // 📅 24시간 = 24 × 60분 × 60초 × 1000밀리초
    const twentyFourHours = 24 * 60 * 60 * 1000
    
    // ✅ 24시간 이내면 복구 가능
    return elapsed < twentyFourHours
  }
}

/**
 * 🏢 통합 저장소 서비스 (메인 클래스)
 * 
 * 모든 저장소 서비스들을 하나로 묶어서 관리하는 클래스예요.
 * 이 클래스 하나만 사용하면 모든 데이터를 관리할 수 있어요!
 * 
 * 사용법:
 * - storageService.user.saveUser(userData)
 * - storageService.tasks.loadTasks()
 * - storageService.timer.saveTimerState(timerData)
 */
export class StorageService {
  // 🎯 각 영역별 전용 서비스들
  user = new UserStorageService()   // 👤 사용자 관련
  tasks = new TaskStorageService()  // ✅ 할 일 관련
  timer = new TimerStorageService() // ⏰ 타이머 관련
  
  // 🔧 내부에서 사용할 기본 저장소 서비스
  private storage = new LocalStorageService()

  /**
   * 📤 전체 데이터 백업 (내보내기)
   * 
   * 사용자의 모든 데이터를 JSON 문자열로 만들어서 반환해요.
   * 이 문자열을 파일로 저장하면 데이터 백업이 완료!
   * 
   * @returns JSON 형태의 백업 데이터
   */
  exportData(): string {
    try {
      // 📦 모든 데이터를 하나의 객체로 모으기
      const data = {
        user: this.user.loadUser(),                 // 👤 사용자 정보
        tasks: this.tasks.loadTasks(),              // ✅ 할 일 목록
        timerState: this.timer.loadTimerState(),    // ⏰ 타이머 상태
        energyLevel: this.user.loadEnergyLevel(),   // ⚡ 에너지 레벨
        focusMode: this.user.loadFocusMode(),       // 🎯 집중 모드
        exportedAt: new Date().toISOString(),       // 📅 백업 생성 시간
        version: '1.0.0',                           // 🏷️ 데이터 버전
      }
      
      // 📦 객체를 JSON 문자열로 변환
      return StorageSerializer.serialize(data)
    } catch (error) {
      throw new StorageError('데이터 내보내기 실패', error as Error)
    }
  }

  /**
   * 📥 데이터 복원 (가져오기)
   * 
   * 백업된 JSON 데이터를 받아서 저장소에 복원해요.
   * 
   * @param jsonData 백업된 JSON 문자열
   */
  importData(jsonData: string): void {
    try {
      // 📦 JSON 문자열을 객체로 변환
      const data = StorageSerializer.deserialize<{
        user?: User
        tasks?: Task[]
        timerState?: TimerState
        energyLevel?: { level: 'low' | 'medium' | 'high'; timestamp: number }
        focusMode?: { isActive: boolean; timestamp: number }
        version?: string
      }>(jsonData)

      // 🏷️ 버전 호환성 확인
      if (data.version && data.version !== '1.0.0') {
        console.warn('다른 버전의 데이터입니다. 호환성 문제가 있을 수 있습니다.')
      }

      // 📥 데이터가 있으면 각각 복원
      if (data.user) this.user.saveUser(data.user)
      if (data.tasks) this.tasks.saveTasks(data.tasks)
      if (data.energyLevel) this.user.saveEnergyLevel(data.energyLevel.level)
      if (data.focusMode) this.user.saveFocusMode(data.focusMode.isActive)
      
      // ⚠️ 타이머 상태는 보안상 복원하지 않음
      // (악의적인 데이터로 타이머를 조작하는 것을 방지)
      
    } catch (error) {
      throw new StorageError('데이터 가져오기 실패', error as Error)
    }
  }

  /**
   * 📊 저장소 전체 상태 확인
   * 
   * 저장소가 정상인지, 얼마나 사용 중인지, 
   * 타이머 복구가 가능한지 등을 확인해요.
   * 
   * @returns 저장소 상태 정보
   */
  getStorageStatus(): {
    available: boolean    // 저장소 사용 가능 여부
    used: number         // 사용 중인 용량 (바이트)
    canRestore: boolean  // 타이머 복구 가능 여부
    lastBackup?: Date    // 마지막 백업 시간 (현재는 미구현)
  } {
    // 📊 기본 저장소 정보 가져오기
    const info = this.storage.getStorageInfo()
    
    return {
      available: info.available,
      used: info.used,
      canRestore: this.timer.canRestoreTimer(),
      // lastBackup은 나중에 구현 예정
    }
  }

  /**
   * 🧹 모든 데이터 삭제 (초기화)
   * 
   * ⚠️ 주의: 이 메서드를 실행하면 모든 데이터가 삭제됩니다!
   * 복구할 수 없으니 신중하게 사용하세요.
   */
  clearAllData(): void {
    this.storage.clear()
  }
}

/**
 * 🌟 싱글톤 인스턴스
 * 
 * 싱글톤 패턴이란?
 * - 앱 전체에서 하나의 인스턴스만 사용하는 패턴
 * - 어디서든 같은 저장소 서비스를 사용할 수 있어요
 * 
 * 사용법:
 * import { storageService } from './services/storageService'
 * storageService.user.saveUser(userData)
 */
export const storageService = new StorageService()