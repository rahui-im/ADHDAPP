# 🚀 Vercel & Supabase 초보자 가이드

## 📚 목차
1. [기본 개념 이해하기](#1-기본-개념-이해하기)
2. [Supabase 시작하기](#2-supabase-시작하기)
3. [Vercel 시작하기](#3-vercel-시작하기)
4. [프로젝트 연결하기](#4-프로젝트-연결하기)
5. [테스트하기](#5-테스트하기)
6. [자주 묻는 질문](#6-자주-묻는-질문)

---

## 1. 기본 개념 이해하기

### 🤔 왜 이 두 서비스를 사용하나요?

현재 당신의 ADHD Time Manager 앱은 **브라우저에만** 데이터를 저장합니다.
- 😢 **문제점**: 다른 기기에서 사용 불가, 브라우저 데이터 삭제시 모든 정보 손실

이를 해결하기 위해:
- **Supabase** = 클라우드 데이터베이스 (데이터 저장소)
- **Vercel** = 웹 호스팅 서비스 (앱을 인터넷에 공개)

### 📦 각 서비스의 역할

#### Supabase (수파베이스)
- **역할**: 온라인 데이터 저장소
- **비유**: Google Drive처럼 클라우드에 데이터 저장
- **장점**: 
  - ✅ 여러 기기에서 접속 가능
  - ✅ 자동 백업
  - ✅ 무료로 시작 가능

#### Vercel (버셀)
- **역할**: 웹사이트 호스팅
- **비유**: 당신의 앱을 인터넷 상점에 진열
- **장점**:
  - ✅ 자동 배포 (GitHub 연동)
  - ✅ 빠른 속도
  - ✅ 무료로 시작 가능

---

## 2. Supabase 시작하기

### Step 1: 계정 만들기

1. **웹사이트 접속**
   ```
   https://supabase.com
   ```

2. **"Start your project" 클릭**
   - GitHub 계정으로 가입 추천 (더 간편함)
   - 또는 이메일로 가입

3. **이메일 인증**
   - 가입시 사용한 이메일 확인
   - 인증 링크 클릭

### Step 2: 새 프로젝트 만들기

1. **"New project" 버튼 클릭**

2. **프로젝트 정보 입력**
   ```
   Project name: adhd-time-manager
   Database Password: (강력한 비밀번호 - 꼭 저장해두세요!)
   Region: Northeast Asia (Seoul) - 한국과 가장 가까움
   ```

3. **"Create new project" 클릭**
   - ⏳ 1-2분 대기 (데이터베이스 생성중)

### Step 3: 데이터베이스 설정하기

프로젝트가 생성되면:

1. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

2. **스키마 파일 복사하기**
   - 우리가 만든 `supabase/schema.sql` 파일 내용 전체 복사
   - SQL Editor에 붙여넣기

3. **실행하기**
   - "Run" 버튼 클릭 (또는 Ctrl+Enter)
   - ✅ "Success. No rows returned" 메시지 확인

4. **테이블 확인**
   - 왼쪽 메뉴 "Table Editor" 클릭
   - users, tasks, sessions 등 테이블이 보이면 성공!

### Step 4: API 키 찾기

1. **Settings 페이지**
   - 왼쪽 메뉴 맨 아래 "Settings" 클릭
   - "API" 섹션 클릭

2. **필요한 정보 복사**
   ```
   Project URL: https://xjxxamqitqxwzmvjmeuw.supabase.co
   anon public key: eyJhbGc... (매우 긴 문자열)
   ```
   
3. **안전하게 보관**
   - 메모장에 임시 저장
   - 나중에 사용할 예정

---

## 3. Vercel 시작하기

### Step 1: GitHub 준비

Vercel은 GitHub와 연동되므로 먼저:

1. **GitHub 계정 확인**
   - https://github.com 로그인
   - ADHDAPP 저장소 확인

### Step 2: Vercel 계정 만들기

1. **웹사이트 접속**
   ```
   https://vercel.com
   ```

2. **"Sign Up" 클릭**
   - "Continue with GitHub" 선택 (필수!)
   - GitHub 권한 허용

### Step 3: 프로젝트 Import

1. **"Import Project" 클릭**

2. **GitHub 저장소 선택**
   - "Import Git Repository" 선택
   - ADHDAPP 저장소 찾기
   - "Import" 클릭

3. **프로젝트 설정**
   ```
   Project Name: adhd-time-manager (또는 원하는 이름)
   Framework Preset: Vite (자동 감지됨)
   Root Directory: ./ (변경 불필요)
   ```

4. **환경 변수 추가** ⚠️ 중요!
   - "Environment Variables" 섹션 펼치기
   - 다음 변수들 추가:

   | Name | Value |
   |------|-------|
   | VITE_SUPABASE_URL | (Supabase에서 복사한 Project URL) |
   | VITE_SUPABASE_ANON_KEY | (Supabase에서 복사한 anon key) |
   | VITE_ENABLE_CLOUD_SYNC | true |

5. **"Deploy" 클릭**
   - ⏳ 2-3분 대기
   - ✅ "Congratulations!" 메시지가 나오면 성공!

---

## 4. 프로젝트 연결하기

### Step 1: 로컬 환경 설정

1. **환경 변수 파일 만들기**
   
   프로젝트 폴더(D:\ADHDAPP)에서:
   ```bash
   # .env.local 파일 생성
   ```

2. **메모장으로 .env.local 파일 열기**
   
   다음 내용 입력:
   ```
   VITE_SUPABASE_URL=여기에_Supabase_URL_붙여넣기
   VITE_SUPABASE_ANON_KEY=여기에_anon_key_붙여넣기
   VITE_ENABLE_CLOUD_SYNC=true
   ```

3. **저장하기**
   - 파일 저장 (Ctrl+S)
   - ⚠️ 이 파일은 절대 GitHub에 올리지 마세요!

### Step 2: 테스트 실행

1. **터미널 열기**
   ```bash
   cd D:\ADHDAPP
   npm install
   npm run dev
   ```

2. **브라우저에서 확인**
   - http://localhost:3000 접속
   - 앱이 정상 작동하는지 확인

### Step 3: 인증 테스트

1. **회원가입 기능 추가** (선택사항)
   - 앱에서 이메일/비밀번호로 가입
   - Supabase Dashboard → Authentication에서 사용자 확인

---

## 5. 테스트하기

### 🧪 동작 확인 체크리스트

#### 로컬 테스트
- [ ] 앱이 정상적으로 실행되나요?
- [ ] 작업을 추가하면 저장되나요?
- [ ] 타이머가 작동하나요?

#### Supabase 확인
1. **Table Editor** 열기
2. **tasks 테이블** 클릭
3. 앱에서 작업 추가 후 새로고침
4. 데이터가 나타나면 성공!

#### Vercel 확인
1. Vercel 대시보드에서 URL 클릭
   ```
   https://adhd-time-manager.vercel.app
   ```
2. 실제 배포된 사이트 확인

---

## 6. 자주 묻는 질문

### ❓ 무료로 얼마나 사용 가능한가요?

**Supabase 무료 플랜**
- 데이터베이스: 500MB
- 사용자: 무제한
- API 요청: 월 200만건
- 충분합니다! 개인 사용시 거의 무제한

**Vercel 무료 플랜**
- 프로젝트: 무제한
- 배포: 무제한
- 대역폭: 월 100GB
- 역시 충분합니다!

### ❓ 데이터는 안전한가요?

- ✅ HTTPS 암호화 전송
- ✅ Supabase는 AWS 사용 (매우 안전)
- ✅ Row Level Security로 본인 데이터만 접근
- ✅ 정기 백업

### ❓ 인터넷이 끊기면 어떻게 되나요?

- 오프라인 모드로 자동 전환
- 로컬 저장소 사용
- 인터넷 연결시 자동 동기화

### ❓ 실수로 삭제하면 어떻게 하나요?

Supabase Dashboard에서:
1. Table Editor → backups 테이블
2. 백업 목록 확인
3. 복원 기능 사용

### ❓ 비용이 발생하면 어떻게 알 수 있나요?

- Supabase: Dashboard → Usage 탭
- Vercel: Dashboard → Usage 탭
- 무료 한도 80% 도달시 이메일 알림

---

## 🆘 도움이 필요하면

### 1단계: 에러 메시지 확인
- 브라우저 개발자 도구 (F12) → Console 탭
- 빨간색 에러 메시지 확인

### 2단계: 흔한 문제 해결

**"Invalid API key" 에러**
- .env.local 파일의 키 확인
- 키 앞뒤 공백 제거

**"CORS error" 에러**
- Supabase Dashboard → Settings → API
- Allowed Origins에 URL 추가

**"Cannot connect to Supabase"**
- 인터넷 연결 확인
- Supabase 프로젝트가 일시정지 상태인지 확인

### 3단계: 커뮤니티 도움
- GitHub Issues 생성
- Discord/Slack 커뮤니티 질문

---

## 🎉 축하합니다!

이제 당신의 ADHD Time Manager는:
- ☁️ 클라우드에 데이터 저장
- 🌍 어디서나 접속 가능
- 💾 자동 백업
- 🚀 빠른 속도

**다음 단계:**
1. 친구들과 공유하기
2. 피드백 받기
3. 기능 개선하기

---

## 📝 메모 공간

여기에 본인만의 메모를 추가하세요:
- Supabase URL: _______________
- Vercel URL: _______________
- 중요한 날짜: _______________
- 기타 메모: _______________