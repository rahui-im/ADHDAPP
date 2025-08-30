# ADHD Time Manager 🎯

ADHD를 위한 맞춤형 시간관리 도구입니다. ADHD 특성을 고려하여 설계된 포모도로 타이머, 작업 분할, 집중 모드 등의 기능을 제공합니다.

## ✨ 주요 기능

### 🔄 자동 작업 분할
- 25분 이상의 작업을 자동으로 15-25분 단위로 분할
- ADHD 친화적인 작은 단위 작업으로 부담 감소
- 각 하위 작업 완료 시 성취감 제공

### ⏰ 유연한 포모도로 타이머
- 15분, 25분, 45분 집중 시간 선택 가능
- 에너지 레벨에 따른 맞춤형 시간 추천
- 3회 완료 후 긴 휴식 권장

### 🎯 집중 모드
- 방해 요소 최소화를 위한 UI 단순화
- 비활성 상태 감지 및 부드러운 리마인더
- 비난하지 않는 격려 메시지

### ⚡ 에너지 레벨 추적
- 현재 에너지 상태에 따른 작업 추천
- 낮은 에너지 시 간단한 작업 우선 제안
- 에너지 패턴 분석 및 인사이트 제공

### 🏆 성취 시스템
- 작은 성취도 축하하는 배지 시스템
- 연속 달성 기록 추적
- ADHD 친화적 격려 메시지

### 📊 분석 및 인사이트
- 생산적인 시간대 분석
- 완료율 및 패턴 추적
- 개인화된 개선 제안

### 🔔 스마트 알림
- 포모도로 완료 및 휴식 시간 알림
- 브라우저 알림 및 진동 지원
- 맞춤형 알림 설정

### 💾 데이터 백업
- 자동 백업 (24시간마다)
- 수동 백업 및 복원 기능
- 개인정보 보호 옵션

### 📱 PWA 지원
- 모바일 앱처럼 설치 가능
- 오프라인 사용 지원
- 서비스 워커를 통한 캐싱

### 🌍 다국어 지원
- 한국어, 영어 지원
- 언어별 맞춤형 격려 메시지
- 자동 언어 감지

## 🚀 시작하기

### 필요 조건
- Node.js 18+ 
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/adhd-time-manager.git
cd adhd-time-manager

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 테스트 실행

```bash
# 단위 테스트
npm run test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 🏗️ 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Framer Motion** - 애니메이션

### 상태 관리
- **Redux Toolkit** - 전역 상태 관리
- **React Redux** - React 바인딩

### 데이터 저장
- **LocalStorage** - 사용자 설정 및 작업
- **IndexedDB** - 세션 데이터 및 분석
- **Service Worker** - 오프라인 캐싱

### PWA & 성능
- **Vite PWA Plugin** - PWA 기능
- **Workbox** - 서비스 워커 관리
- **Code Splitting** - 번들 최적화

### 국제화
- **react-i18next** - 다국어 지원
- **i18next** - 번역 관리

### 테스팅
- **Vitest** - 단위 테스트
- **React Testing Library** - 컴포넌트 테스트
- **Jest DOM** - DOM 테스트 유틸리티

## 📁 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   ├── dashboard/      # 대시보드 컴포넌트
│   ├── tasks/          # 작업 관리 컴포넌트
│   ├── timer/          # 타이머 컴포넌트
│   ├── analytics/      # 분석 컴포넌트
│   ├── settings/       # 설정 컴포넌트
│   ├── accessibility/  # 접근성 컴포넌트
│   ├── pwa/           # PWA 관련 컴포넌트
│   └── onboarding/    # 온보딩 컴포넌트
├── hooks/              # 커스텀 훅
├── services/           # 비즈니스 로직 서비스
├── store/              # Redux 스토어
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
├── i18n/              # 국제화 설정
└── styles/            # 전역 스타일
```

## 🎨 ADHD 친화적 설계 원칙

### 1. 인지 부하 최소화
- 단순하고 직관적인 인터페이스
- 한 번에 하나의 주요 작업에 집중
- 시각적 혼란 요소 제거

### 2. 즉각적인 피드백
- 실시간 진행 상황 표시
- 작업 완료 시 즉시 성취감 제공
- 시각적, 청각적 피드백 조합

### 3. 유연성과 적응성
- 개인의 에너지 레벨에 맞는 조정
- 완벽하지 않아도 괜찮다는 메시지
- 실패에 대한 비난 없는 재시작 지원

### 4. 작은 성취의 축하
- 모든 진전을 인정하고 축하
- 작은 단위의 목표 설정
- 연속 달성보다 개별 성취 중시

### 5. 집중력 지원
- 방해 요소 감지 및 대응
- 집중 모드를 통한 환경 최적화
- 마음챙김 활동 제안

## 🔧 설정 및 커스터마이징

### 환경 변수
```bash
# .env.local
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
```

### 타이머 설정
- 집중 시간: 15분, 25분, 45분
- 휴식 시간: 5분, 10분, 15분
- 긴 휴식: 20-30분 (사이클 완료 후)

### 알림 설정
- 브라우저 알림 권한 관리
- 알림음 및 진동 설정
- 맞춤형 알림 메시지

## 📱 PWA 기능

### 설치
- 브라우저에서 "홈 화면에 추가" 선택
- 또는 주소창의 설치 아이콘 클릭

### 오프라인 사용
- 기본 기능은 오프라인에서도 동작
- 데이터는 로컬에 저장
- 온라인 복구 시 자동 동기화

## 🤝 기여하기

1. 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 개발 가이드라인
- TypeScript 사용 필수
- 컴포넌트는 함수형으로 작성
- 접근성 고려 (WCAG 2.1 AA 준수)
- ADHD 친화적 UX 원칙 준수
- 테스트 코드 작성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

이 프로젝트는 ADHD 커뮤니티의 피드백과 연구를 바탕으로 개발되었습니다. 모든 기여자와 테스터분들께 감사드립니다.

### 참고 자료
- [ADHD와 시간 관리 연구](https://example.com)
- [포모도로 기법 가이드](https://example.com)
- [접근성 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)

## 📞 지원 및 피드백

- 이슈 리포트: [GitHub Issues](https://github.com/your-username/adhd-time-manager/issues)
- 기능 요청: [GitHub Discussions](https://github.com/your-username/adhd-time-manager/discussions)
- 이메일: support@adhdtimemanager.com

---

**ADHD Time Manager**는 ADHD를 가진 모든 분들이 자신만의 속도로 성장할 수 있도록 돕는 것을 목표로 합니다. 완벽하지 않아도 괜찮습니다. 오늘 한 걸음 나아간 것만으로도 충분합니다. 💙