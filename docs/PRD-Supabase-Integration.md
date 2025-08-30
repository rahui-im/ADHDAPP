# PRD: ADHD Time Manager - Supabase 백엔드 통합

## 1. 개요

### 1.1 프로젝트 배경
현재 ADHD Time Manager는 LocalStorage와 IndexedDB를 사용한 오프라인 전용 PWA입니다. 
Supabase 통합을 통해 다음 기능을 추가합니다:
- 클라우드 데이터 동기화
- 다중 기기 지원
- 데이터 백업/복원
- 분석 데이터 중앙화

### 1.2 목표
- **Primary**: 사용자 데이터를 Supabase에 안전하게 저장
- **Secondary**: 실시간 동기화 및 협업 기능 기반 마련
- **Long-term**: 팀 기능 및 공유 대시보드 지원

## 2. 기술 스택

### 2.1 프론트엔드 (Vercel)
- **URL**: https://vercel.com/ra-huis-projects/adhdapp
- **Framework**: React + TypeScript + Vite
- **상태관리**: Redux Toolkit
- **배포**: Vercel (자동 배포)

### 2.2 백엔드 (Supabase)
- **URL**: https://supabase.com/dashboard/project/xjxxamqitqxwzmvjmeuw
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (JSON 백업용)
- **Realtime**: 실시간 구독

## 3. 데이터 아키텍처

### 3.1 하이브리드 저장 전략
```
LocalStorage/IndexedDB (Primary) ←→ Sync Engine ←→ Supabase (Cloud)
```

### 3.2 동기화 정책
- **오프라인 우선**: 로컬 변경사항 즉시 적용
- **백그라운드 동기화**: 온라인 시 자동 동기화
- **충돌 해결**: Last-Write-Wins + 버전 관리

## 4. 데이터베이스 스키마

### 4.1 핵심 테이블

#### users (사용자)
```sql
- id: uuid (PK)
- email: text (unique)
- name: text
- preferences: jsonb
- settings: jsonb
- created_at: timestamp
- updated_at: timestamp
```

#### tasks (작업)
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- title: text
- description: text
- estimated_duration: integer
- subtasks: jsonb
- priority: text
- category: text
- status: text
- scheduled_for: timestamp
- completed_at: timestamp
- created_at: timestamp
- updated_at: timestamp
- sync_version: integer
```

#### sessions (세션)
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- task_id: uuid (FK)
- type: text
- planned_duration: integer
- actual_duration: integer
- started_at: timestamp
- completed_at: timestamp
- was_interrupted: boolean
- interruption_reasons: jsonb
- energy_before: integer
- energy_after: integer
- created_at: timestamp
```

#### analytics (분석)
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- date: date
- daily_stats: jsonb
- weekly_insights: jsonb
- patterns: jsonb
- created_at: timestamp
```

#### backups (백업)
```sql
- id: uuid (PK)
- user_id: uuid (FK)
- backup_data: jsonb
- backup_type: text
- version: text
- created_at: timestamp
```

## 5. 주요 기능 구현

### 5.1 인증 (Phase 1)
- **익명 사용자**: 로컬 전용 모드
- **가입 사용자**: 이메일/비밀번호 인증
- **소셜 로그인**: Google, GitHub (선택)

### 5.2 데이터 동기화 (Phase 2)
```typescript
// 동기화 플로우
1. 로컬 변경 감지
2. 변경사항 큐잉
3. 배치 업로드 (5초 디바운스)
4. 충돌 해결
5. 로컬 상태 업데이트
```

### 5.3 실시간 기능 (Phase 3)
- 다중 기기 실시간 동기화
- 협업 기능 준비

## 6. API 엔드포인트

### 6.1 RESTful API (자동 생성)
```
GET    /rest/v1/tasks?user_id=eq.{userId}
POST   /rest/v1/tasks
PATCH  /rest/v1/tasks?id=eq.{taskId}
DELETE /rest/v1/tasks?id=eq.{taskId}
```

### 6.2 RPC Functions
```sql
-- 일일 통계 계산
get_daily_stats(user_id, date)

-- 주간 인사이트 생성
generate_weekly_insights(user_id, week_start)

-- 백업 생성
create_backup(user_id, backup_data)

-- 데이터 복원
restore_backup(user_id, backup_id)
```

## 7. 보안

### 7.1 Row Level Security (RLS)
- 사용자는 자신의 데이터만 접근
- 공유 기능은 별도 권한 테이블로 관리

### 7.2 데이터 암호화
- 전송: HTTPS/WSS
- 저장: Supabase 자동 암호화
- 민감 정보: 클라이언트 암호화 고려

## 8. 마이그레이션 전략

### 8.1 기존 사용자 마이그레이션
1. 로컬 데이터 유지
2. 선택적 클라우드 동기화 활성화
3. 점진적 기능 활성화

### 8.2 롤백 계획
- 로컬 전용 모드 항상 사용 가능
- 데이터 내보내기 기능 제공

## 9. 성능 최적화

### 9.1 쿼리 최적화
- 인덱스 전략
- 페이지네이션
- 필요한 필드만 선택

### 9.2 캐싱 전략
- 로컬 캐시 우선
- Stale-While-Revalidate
- 옵티미스틱 업데이트

## 10. 모니터링

### 10.1 메트릭
- API 응답 시간
- 동기화 성공률
- 활성 사용자 수

### 10.2 에러 추적
- Sentry 통합 고려
- Supabase 로그 모니터링

## 11. 타임라인

### Phase 1 (Week 1-2)
- [ ] Supabase 프로젝트 설정
- [ ] 데이터베이스 스키마 생성
- [ ] 인증 시스템 구현
- [ ] 기본 CRUD 작업

### Phase 2 (Week 3-4)
- [ ] 동기화 엔진 구현
- [ ] 충돌 해결 로직
- [ ] 백업/복원 기능

### Phase 3 (Week 5-6)
- [ ] 실시간 동기화
- [ ] 성능 최적화
- [ ] 테스트 및 배포

## 12. 성공 지표

- **기술적 지표**
  - API 응답 시간 < 200ms
  - 동기화 성공률 > 99%
  - 데이터 손실 0건

- **비즈니스 지표**
  - 클라우드 동기화 사용률 > 60%
  - 다중 기기 사용자 > 30%
  - 사용자 만족도 > 4.5/5

## 13. 리스크 및 대응

### 13.1 리스크
- 네트워크 연결 불안정
- 데이터 충돌
- 비용 증가

### 13.2 대응 방안
- 강력한 오프라인 모드
- 버전 관리 시스템
- 사용량 모니터링 및 최적화

## 14. 환경 변수

```env
# .env.local
VITE_SUPABASE_URL=https://xjxxamqitqxwzmvjmeuw.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_CLOUD_SYNC=true
```

## 15. 다음 단계

1. Supabase 프로젝트에 스키마 적용
2. 클라이언트 SDK 통합
3. 인증 플로우 구현
4. 동기화 서비스 개발
5. 테스트 및 배포