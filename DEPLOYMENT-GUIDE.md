# 🚀 ADHD Task Manager - Vercel 배포 가이드

## 📋 사전 준비사항
✅ 프로젝트 빌드 완료 (npm run build)
✅ Vercel CLI 설치 완료
✅ vercel.json 설정 파일 생성 완료

## 🔧 배포 단계

### 1. Vercel 로그인
```bash
npx vercel login
```
이메일을 입력하고 인증 링크를 확인하세요.

### 2. 프로젝트 배포

#### 방법 1: CLI를 통한 배포 (권장)
```bash
# 프로덕션 배포
npx vercel --prod

# 또는 개발 환경 배포 (미리보기)
npx vercel
```

배포 시 다음 설정을 사용하세요:
- **Set up and deploy**: `Y`
- **Which scope**: 본인 계정 선택
- **Link to existing project?**: `N` (첫 배포) 또는 `Y` (재배포)
- **Project name**: `adhd-task-manager` (또는 원하는 이름)
- **In which directory is your code located?**: `./` (Enter)
- **Build Command**: `npm run build` (자동 감지됨)
- **Output Directory**: `dist` (자동 감지됨)
- **Development Command**: `npm run dev` (자동 감지됨)

#### 방법 2: Vercel 웹사이트를 통한 배포
1. [vercel.com](https://vercel.com) 접속
2. GitHub 저장소 연결
3. 자동 배포 설정

### 3. 환경 변수 설정 (선택사항)
현재 프로젝트는 환경 변수가 필요 없지만, 추후 필요시:
```bash
npx vercel env add
```

## 🌐 배포 후 확인사항

### URL 구조
- **프로덕션**: `https://[project-name].vercel.app`
- **미리보기**: `https://[project-name]-[hash].vercel.app`

### 기능 테스트
1. ✅ 홈페이지 로딩
2. ✅ 작업 생성/편집/삭제
3. ✅ 타이머 기능
4. ✅ PWA 설치
5. ✅ 오프라인 모드
6. ✅ 다국어 전환

## 📱 PWA 설치 테스트
1. 배포된 URL 접속
2. 브라우저 주소창의 설치 아이콘 클릭
3. 또는 브라우저 메뉴 > "앱 설치"

## 🔍 디버깅

### 빌드 오류 시
```bash
# 로컬에서 빌드 테스트
npm run build

# TypeScript 오류 확인
npx tsc --noEmit
```

### 배포 상태 확인
```bash
npx vercel ls
```

### 로그 확인
```bash
npx vercel logs [deployment-url]
```

## 🎯 최적화 팁

### 성능 최적화
- ✅ 이미지 최적화 (자동)
- ✅ 코드 스플리팅 (설정됨)
- ✅ 캐싱 헤더 (설정됨)
- ✅ Gzip 압축 (자동)

### SEO 최적화
- ✅ 메타 태그 (구현됨)
- ✅ 오픈 그래프 (구현됨)
- ✅ 사이트맵 (public/sitemap.xml)
- ✅ robots.txt (public/robots.txt)

## 📊 배포 정보

### 프로젝트 사양
- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State**: Redux Toolkit
- **PWA**: Vite PWA Plugin

### 예상 성능 지표
- **Lighthouse Score**: 90+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB (gzipped)

## 🆘 문제 해결

### 자주 발생하는 문제

1. **"Token is not valid" 오류**
   ```bash
   npx vercel login
   ```

2. **빌드 실패**
   - TypeScript 오류 확인
   - 의존성 설치 확인
   ```bash
   npm install
   npm run build
   ```

3. **404 오류 (SPA 라우팅)**
   - vercel.json의 rewrites 설정 확인
   - 이미 설정되어 있음

## 🎉 배포 완료!

배포가 완료되면:
1. 제공된 URL로 접속
2. 모든 기능 테스트
3. PWA 설치 테스트
4. 친구들과 공유!

## 📝 추가 명령어

```bash
# 배포 목록 확인
npx vercel ls

# 특정 배포 삭제
npx vercel rm [deployment-url]

# 도메인 설정
npx vercel domains add [custom-domain]

# 프로젝트 설정 확인
npx vercel project ls
```

---

## 🚀 빠른 배포 (복사해서 실행)

```bash
# 1. 로그인 (첫 배포시만)
npx vercel login

# 2. 배포
npx vercel --prod
```

성공적인 배포를 축하합니다! 🎊