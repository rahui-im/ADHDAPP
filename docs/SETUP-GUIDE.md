# ADHD Time Manager - 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정

1. `.env.example` 파일을 `.env.local`로 복사합니다:
```bash
cp .env.example .env.local
```

2. Supabase 대시보드에서 API 키를 가져옵니다:
   - URL: https://supabase.com/dashboard/project/xjxxamqitqxwzmvjmeuw/settings/api
   - `Project URL` 복사 → `VITE_SUPABASE_URL`에 붙여넣기
   - `anon public` 키 복사 → `VITE_SUPABASE_ANON_KEY`에 붙여넣기

3. `.env.local` 파일 편집:
```env
VITE_SUPABASE_URL=https://xjxxamqitqxwzmvjmeuw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENABLE_CLOUD_SYNC=true
```

### 2. Supabase 데이터베이스 설정

1. Supabase SQL Editor 열기:
   - https://supabase.com/dashboard/project/xjxxamqitqxwzmvjmeuw/sql

2. `supabase/schema.sql` 파일의 내용을 복사하여 실행

3. 확인:
   - Table Editor에서 테이블이 생성되었는지 확인
   - Authentication → Policies에서 RLS 정책 확인

### 3. 로컬 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. Vercel 배포 설정

1. Vercel 대시보드 접속:
   - https://vercel.com/ra-huis-projects/adhdapp

2. Settings → Environment Variables 추가:
   ```
   VITE_SUPABASE_URL = https://xjxxamqitqxwzmvjmeuw.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   VITE_ENABLE_CLOUD_SYNC = true
   ```

3. 재배포 트리거:
   ```bash
   git push origin main
   ```

## 🔐 인증 설정

### 이메일 인증 활성화

1. Supabase Dashboard → Authentication → Providers
2. Email 활성화
3. 선택사항: Google, GitHub OAuth 설정

### 이메일 템플릿 커스터마이징

1. Authentication → Email Templates
2. 한국어 템플릿으로 수정

## 🔄 동기화 모드

### 1. 오프라인 전용 모드 (기본값)
```env
VITE_ENABLE_CLOUD_SYNC=false
```
- LocalStorage/IndexedDB만 사용
- 인터넷 연결 불필요
- 개인정보 완전 보호

### 2. 하이브리드 모드
```env
VITE_ENABLE_CLOUD_SYNC=true
```
- 오프라인 우선, 온라인 시 자동 동기화
- 다중 기기 지원
- 자동 백업

## 📊 데이터베이스 관리

### 백업 생성
```sql
SELECT create_backup('user-id', 'manual', '수동 백업');
```

### 백업 복원
```sql
SELECT restore_backup('user-id', 'backup-id');
```

### 일일 통계 조회
```sql
SELECT get_daily_stats('user-id', '2024-01-01');
```

## 🔍 모니터링

### Supabase 대시보드
- Realtime: 실시간 연결 모니터링
- Logs: API 요청 로그
- Database: 쿼리 성능 분석

### Vercel Analytics
- Web Vitals 모니터링
- 사용자 분석
- 에러 추적

## 🐛 문제 해결

### 1. 인증 오류
```
Error: Invalid API key
```
**해결**: `.env.local`의 `VITE_SUPABASE_ANON_KEY` 확인

### 2. CORS 오류
```
Access to fetch at 'supabase.co' from origin 'localhost:3000' has been blocked
```
**해결**: Supabase Dashboard → Settings → API → CORS 설정 확인

### 3. RLS 정책 오류
```
Error: new row violates row-level security policy
```
**해결**: 
- 사용자가 올바르게 인증되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 4. 동기화 실패
**확인 사항**:
- 네트워크 연결 상태
- Supabase 프로젝트 상태 (일시정지 여부)
- API 키 유효성

## 📝 체크리스트

### 초기 설정
- [ ] `.env.local` 파일 생성
- [ ] Supabase API 키 설정
- [ ] 데이터베이스 스키마 적용
- [ ] RLS 정책 확인
- [ ] 이메일 인증 설정

### 배포 전
- [ ] 환경 변수 설정 (Vercel)
- [ ] 프로덕션 빌드 테스트
- [ ] 동기화 기능 테스트
- [ ] 백업/복원 테스트

### 배포 후
- [ ] 실시간 동기화 확인
- [ ] 모니터링 대시보드 확인
- [ ] 에러 로그 확인
- [ ] 성능 메트릭 확인

## 🆘 지원

### 문제 발생 시
1. [GitHub Issues](https://github.com/rahui-im/ADHDAPP/issues)
2. Supabase Discord 커뮤니티
3. Vercel Support

### 문서
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [프로젝트 PRD](./PRD-Supabase-Integration.md)