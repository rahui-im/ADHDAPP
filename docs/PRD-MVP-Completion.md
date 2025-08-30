# PRD: ADHD Time Manager - MVP 완성 계획

## 📋 Executive Summary

ADHD Time Manager는 현재 35% 완성도의 프로토타입 상태입니다. 
핵심 기능들이 미구현되어 실제 사용이 불가능합니다.
이 PRD는 MVP(Minimum Viable Product) 완성을 위한 로드맵입니다.

**현재 상태**: 프로토타입 (사용 불가)
**목표 상태**: 실사용 가능한 MVP
**예상 공수**: 100-145시간
**우선순위**: 핵심 기능 → UX 개선 → 부가 기능

---

## 🎯 프로젝트 목표

### Primary Goals
1. **실사용 가능한 ADHD 시간관리 도구 완성**
2. **오프라인 우선 PWA로 완전 작동**
3. **ADHD 사용자를 위한 특화 기능 구현**

### Success Metrics
- ✅ 작업 생성/수정/삭제 가능
- ✅ 타이머 완전 작동
- ✅ 데이터 영구 저장
- ✅ 모든 페이지 접근 가능
- ✅ 오프라인 사용 가능

---

## 🔴 Critical Issues (즉시 수정 필요)

### 1. 네비게이션 시스템 부재
**현재 문제**:
- 페이지 간 이동 불가능
- URL 라우팅 없음
- 브라우저 뒤로가기 작동 안함

**해결 방안**:
```typescript
// React Router 도입
npm install react-router-dom @types/react-router-dom

// App.tsx 수정
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<DashboardPage />} />
      <Route path="tasks" element={<TasksPage />} />
      <Route path="timer" element={<TimerPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

### 2. 작업 관리 UI 미완성
**현재 문제**:
- 작업 추가 모달 없음
- 하드코딩된 더미 데이터
- 수정/삭제 UI 없음

**해결 방안**:
- TaskModal 컴포넌트 생성
- TaskForm 실제 구현
- 삭제 확인 다이얼로그 추가

### 3. 데이터 흐름 단절
**현재 문제**:
- Redux와 컴포넌트 연결 불완전
- 서비스 레이어 미사용
- LocalStorage 저장 안됨

**해결 방안**:
- Redux 미들웨어로 자동 저장
- 서비스 레이어 통합
- 데이터 동기화 로직 구현

---

## 📊 현재 상태 분석

### 완성도 평가

| 영역 | 완성도 | 상태 |
|------|--------|------|
| 프로젝트 구조 | 80% | ✅ 양호 |
| UI 컴포넌트 | 60% | ⚠️ 부분완성 |
| 비즈니스 로직 | 30% | ❌ 미완성 |
| 네비게이션 | 20% | ❌ 작동안함 |
| 데이터 관리 | 40% | ⚠️ 부분완성 |
| PWA 기능 | 50% | ⚠️ 부분완성 |
| 테스트 | 10% | ❌ 거의없음 |

### 컴포넌트 상태

**✅ 구현됨 (구조만)**:
- 모든 페이지 컴포넌트 (5/5)
- 대시보드 위젯 (9/9)
- UI 기본 컴포넌트 (9/9)

**⚠️ 부분 구현**:
- TaskManager - 더미 데이터 사용
- PomodoroTimer - 작업 연동 안됨
- Settings - 저장 안됨

**❌ 미구현**:
- 작업 CRUD 실제 동작
- 페이지 라우팅
- 데이터 영속성
- 알림 시스템
- 분석 차트

---

## 🚀 구현 로드맵

## Phase 1: Core Functionality (40시간)
**목표**: 기본 기능이 작동하는 앱

### 1.1 라우팅 시스템 (8시간)
```typescript
// 구현 내용
- React Router v6 설치 및 설정
- Layout 컴포넌트 라우터 통합
- 네비게이션 메뉴 활성화
- URL 파라미터 처리
- 404 페이지
```

### 1.2 작업 관리 완성 (16시간)
```typescript
// 구현 내용
- TaskModal 컴포넌트
  - 작업 생성 폼
  - 작업 수정 폼
  - 유효성 검사
  
- TaskList 개선
  - 실제 데이터 렌더링
  - 필터/정렬 기능
  - 상태별 그룹핑
  
- 작업 작업
  - 삭제 확인 모달
  - 일괄 선택/삭제
  - 드래그앤드롭 순서변경
```

### 1.3 타이머 통합 (8시간)
```typescript
// 구현 내용
- 작업 선택 UI
- 타이머-작업 연동
- 세션 자동 기록
- 타이머 알림
- 백그라운드 타이머
```

### 1.4 데이터 영속성 (8시간)
```typescript
// 구현 내용
- Redux Persist 설정
- LocalStorage 통합
- IndexedDB 세션 저장
- 자동 저장 미들웨어
- 데이터 마이그레이션
```

---

## Phase 2: User Experience (30시간)
**목표**: 사용하기 편한 앱

### 2.1 피드백 시스템 (8시간)
```typescript
// 구현 내용
- Toast 알림 시스템
- 로딩 상태 표시
- 에러 처리
- 성공 메시지
- 진행률 표시
```

### 2.2 온보딩 완성 (6시간)
```typescript
// 구현 내용
- 첫 사용자 가이드
- 툴팁 투어
- 기능 설명
- 초기 설정 마법사
```

### 2.3 설정 기능 (8시간)
```typescript
// 구현 내용
- 설정 저장/로드
- 테마 전환 (다크모드)
- 언어 변경 (i18n 통합)
- 알림 설정
- 백업/복원 UI
```

### 2.4 분석 대시보드 (8시간)
```typescript
// 구현 내용
- 차트 라이브러리 통합
- 일일/주간 통계
- 생산성 그래프
- 패턴 분석 시각화
```

---

## Phase 3: Polish & Optimization (20시간)
**목표**: 완성도 높은 앱

### 3.1 성능 최적화 (8시간)
- 코드 스플리팅 개선
- 번들 크기 최적화
- 렌더링 최적화
- 메모리 누수 해결

### 3.2 접근성 개선 (6시간)
- ARIA 레이블 완성
- 키보드 네비게이션
- 스크린 리더 지원
- 고대비 모드

### 3.3 PWA 완성 (6시간)
- 오프라인 완전 지원
- 설치 프롬프트 개선
- 앱 아이콘/스플래시
- 백그라운드 동기화

---

## 📝 상세 구현 사양

### 1. 작업(Task) 모델 개선
```typescript
interface Task {
  id: string
  title: string
  description?: string
  estimatedDuration: number
  actualDuration?: number
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  category: string
  tags: string[]
  subtasks: Subtask[]
  parentId?: string // 상위 작업
  dependencies?: string[] // 선행 작업
  recurring?: RecurringConfig
  reminder?: ReminderConfig
  attachments?: Attachment[]
  notes?: string
  energyLevel?: 'low' | 'medium' | 'high'
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  deletedAt?: Date // Soft delete
}
```

### 2. 타이머 개선 사양
```typescript
interface TimerConfig {
  // 프리셋
  presets: {
    focus: [15, 25, 45, 60, 90]
    shortBreak: [5, 10, 15]
    longBreak: [20, 30, 45]
  }
  
  // 자동화
  autoStartBreak: boolean
  autoStartFocus: boolean
  
  // 알림
  notifications: {
    sound: boolean
    volume: number
    vibration: boolean
    desktop: boolean
  }
  
  // 통계
  dailyGoal: number // 목표 포모도로 수
  weeklyGoal: number
}
```

### 3. 네비게이션 구조
```typescript
const routes = [
  { path: '/', name: '대시보드', icon: 'dashboard' },
  { path: '/tasks', name: '작업', icon: 'tasks' },
  { path: '/tasks/:id', name: '작업 상세', hidden: true },
  { path: '/timer', name: '타이머', icon: 'timer' },
  { path: '/timer/:taskId', name: '타이머 실행', hidden: true },
  { path: '/analytics', name: '분석', icon: 'chart' },
  { path: '/settings', name: '설정', icon: 'settings' },
  { path: '/help', name: '도움말', icon: 'help' }
]
```

### 4. 상태 관리 구조 개선
```typescript
// Store 구조
{
  // 기존
  tasks: TaskState
  timer: TimerState
  user: UserState
  analytics: AnalyticsState
  
  // 추가 필요
  ui: {
    navigation: NavigationState
    modals: ModalState
    notifications: NotificationState
    loading: LoadingState
  }
  
  cache: {
    recommendations: CacheState
    achievements: CacheState
  }
  
  sync: {
    pending: SyncQueue
    conflicts: ConflictState
    lastSync: Date
  }
}
```

---

## 🎨 UI/UX 개선 사항

### 1. 디자인 시스템 정립
- 일관된 색상 팔레트
- 표준 spacing/sizing
- 컴포넌트 variants 정의
- 애니메이션 가이드라인

### 2. 반응형 디자인
- 모바일 최적화
- 태블릿 레이아웃
- 데스크톱 와이드 뷰

### 3. 마이크로 인터랙션
- 호버 효과
- 클릭 피드백
- 전환 애니메이션
- 스켈레톤 로더

### 4. 빈 상태 디자인
- 작업 없을 때
- 데이터 로딩 중
- 에러 발생 시
- 첫 사용자

---

## 🧪 테스트 전략

### 1. 단위 테스트
- 서비스 로직
- Redux reducers
- 유틸리티 함수
- Custom hooks

### 2. 통합 테스트
- 작업 CRUD 플로우
- 타이머 워크플로우
- 데이터 동기화

### 3. E2E 테스트
- 회원가입/로그인
- 작업 생성-완료
- 타이머 전체 사이클

---

## 📅 구현 일정

### Week 1-2: Phase 1 (Core)
- Day 1-2: 라우팅 구현
- Day 3-5: 작업 관리 완성
- Day 6-7: 타이머 통합
- Day 8-10: 데이터 영속성

### Week 3: Phase 2 (UX)
- Day 11-12: 피드백 시스템
- Day 13: 온보딩
- Day 14-15: 설정/분석

### Week 4: Phase 3 (Polish)
- Day 16-17: 최적화
- Day 18-19: 테스트
- Day 20: 배포 준비

---

## 🚦 위험 요소 및 대응

### 1. 기술적 위험
- **라우터 도입 시 기존 코드 충돌**
  - 해결: 점진적 마이그레이션
  
- **성능 저하**
  - 해결: 프로파일링 및 최적화

### 2. 일정 위험
- **예상보다 긴 구현 시간**
  - 해결: 우선순위 조정, Phase별 릴리즈

### 3. 품질 위험
- **버그 증가**
  - 해결: 테스트 커버리지 확보

---

## 📊 성공 지표

### 기술적 지표
- [ ] 모든 CRUD 작업 3초 이내 완료
- [ ] 페이지 로드 2초 이내
- [ ] 오프라인 모드 100% 작동
- [ ] 데이터 손실 0건

### 사용성 지표
- [ ] 작업 생성 3클릭 이내
- [ ] 타이머 시작 2클릭 이내
- [ ] 모든 기능 키보드로 접근 가능

### 완성도 지표
- [ ] TypeScript 에러 0개
- [ ] Console 경고 0개
- [ ] 테스트 커버리지 70% 이상

---

## 🎯 MVP 완성 정의

### Must Have (필수)
✅ 작업 CRUD 완전 작동
✅ 타이머 기본 기능
✅ 페이지 네비게이션
✅ 데이터 저장/로드
✅ 기본 설정

### Should Have (권장)
⭕ 분석 대시보드
⭕ 온보딩 플로우
⭕ 다크 모드
⭕ 백업/복원

### Nice to Have (선택)
➖ 클라우드 동기화
➖ 협업 기능
➖ 고급 분석
➖ 외부 연동

---

## 📝 다음 단계

1. **즉시 시작**: Phase 1 라우팅 구현
2. **병렬 진행**: UI 컴포넌트 보완
3. **지속적 테스트**: 각 기능 완성 시 테스트
4. **문서화**: 구현하며 문서 업데이트

---

## 부록: 파일별 수정 필요 사항

### 우선순위 1 (즉시 수정)
```
src/App.tsx - 라우터 통합
src/components/layout/Layout.tsx - 네비게이션 연결
src/components/tasks/TaskManager.tsx - 실제 CRUD
src/components/tasks/TaskForm.tsx - 폼 구현
```

### 우선순위 2 (핵심 기능)
```
src/store/taskSlice.ts - 액션 구현
src/services/storageService.ts - 저장 로직
src/components/timer/PomodoroTimer.tsx - 작업 연동
```

### 우선순위 3 (UX 개선)
```
src/components/ui/Modal.tsx - 모달 시스템
src/components/ui/Toast.tsx - 알림 시스템
src/hooks/useNotifications.ts - 알림 훅
```

---

**작성일**: 2024년 12월 30일
**버전**: 1.0.0
**작성자**: ADHD Time Manager Team