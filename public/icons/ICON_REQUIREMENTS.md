# ADHD Time Manager - 필요한 아이콘 목록

## 기본 PWA 아이콘들
다음 크기의 PNG 아이콘들이 필요합니다:

### 필수 아이콘들
- `icon-16x16.png` - 16×16px (브라우저 탭 favicon)
- `icon-32x32.png` - 32×32px (브라우저 탭 favicon)
- `icon-48x48.png` - 48×48px (작은 앱 아이콘)
- `icon-72x72.png` - 72×72px (Android 홈스크린)
- `icon-96x96.png` - 96×96px (Android 홈스크린)
- `icon-144x144.png` - 144×144px (Windows 타일)
- `icon-192x192.png` - 192×192px ✅ (이미 있음)
- `icon-256x256.png` - 256×256px (Windows 타일)
- `icon-384x384.png` - 384×384px (Android 스플래시)
- `icon-512x512.png` - 512×512px (PWA 표준)

### Maskable 아이콘들 (Android Adaptive Icons)
- `maskable-icon-192x192.png` - 192×192px
- `maskable-icon-512x512.png` - 512×512px

### 단축키 아이콘들
- `shortcut-new-task.png` - 96×96px (새 작업 만들기)
- `shortcut-timer.png` - 96×96px (포모도로 타이머)

### Apple 관련
- `apple-touch-icon.png` - 180×180px (iOS 홈스크린)

## 디자인 가이드라인

### 색상 팔레트
- 주 색상: #3B82F6 (파란색)
- 보조 색상: #22C55E (초록색)
- 배경: #F8FAFC (연한 회색)

### 아이콘 컨셉
- 🧠 뇌 아이콘 (ADHD 상징)
- ⏰ 시계/타이머 (시간 관리)
- 🎯 타겟 (집중력)
- 조합: 뇌 + 시계 또는 뇌 + 타겟

### Maskable 아이콘 요구사항
- 중앙 80% 영역에 중요한 요소 배치
- 가장자리 20%는 잘릴 수 있음을 고려
- 단색 배경 사용 권장

## 생성 방법

### 온라인 도구 사용
1. [PWA Builder](https://www.pwabuilder.com/imageGenerator) - PWA 아이콘 생성기
2. [Favicon.io](https://favicon.io/) - 파비콘 생성기
3. [Maskable.app](https://maskable.app/) - Maskable 아이콘 테스트

### 수동 생성
1. 512×512px 마스터 아이콘 생성
2. 각 크기별로 리사이즈
3. Maskable 버전은 중앙에 아이콘, 주변에 배경색

## 현재 상태
- ✅ icon-192x192.png (이미 존재)
- ❌ 나머지 모든 아이콘들 필요

## 임시 해결책
현재 개발 중이므로 기본 아이콘으로 대체 가능:
- 모든 크기를 기존 192x192 아이콘으로 복사
- 나중에 적절한 아이콘으로 교체