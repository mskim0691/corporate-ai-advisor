# AI-GFC (AI Global Finance Consultant)

AI 기반 기업 재무 컨설팅 서비스

**Production URL**: https://ai-gfc.kr

## 🚀 주요 기능

### ✅ 구현된 기능
1. **회원 관리**
   - 회원가입/로그인 (NextAuth.js)
   - Free/Pro 구독 모델
   - 월별 사용량 제한 (Free: 2회, Pro: 무제한)

2. **기업 정보 입력**
   - 회사명, 사업자등록번호, 대표자 이름 입력
   - 업종 (선택 사항)

3. **파일 업로드**
   - 드래그 앤 드롭 지원
   - 최대 5개 파일 업로드
   - 지원 형식: PDF, DOCX, XLSX, JPG, PNG

4. **AI 기반 분석**
   - Google Gemini 1.5 Pro 사용
   - 자동 문서 분석 및 인사이트 생성
   - 7개 슬라이드 리포트 생성

5. **리포트 뷰어**
   - 슬라이드 형태의 리포트 뷰어
   - 좌우 네비게이션
   - 슬라이드 썸네일

6. **리포트 다운로드**
   - 텍스트 파일 다운로드
   - 향후 PDF 변환 기능 추가 예정

## 📋 시작하기

### 1. 환경 변수 설정

`.env` 파일을 수정하여 필요한 환경 변수를 설정하세요:

```env
# Database (SQLite - 이미 생성됨)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
# Production: NEXTAUTH_URL="https://ai-gfc.kr"

# Google Gemini API (필수!)
GOOGLE_GEMINI_API_KEY="여기에-실제-Gemini-API-키-입력"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Production: NEXT_PUBLIC_APP_URL="https://ai-gfc.kr"
```

**중요**: Google Gemini API 키를 반드시 설정해야 분석 기능이 작동합니다.
- API 키 발급: https://aistudio.google.com/app/apikey

### 2. 개발 서버 실행

```bash
npm run dev
```

서버가 http://localhost:3000 에서 실행됩니다.

### 3. 사용 흐름

1. 홈페이지 (http://localhost:3000) 방문
2. "무료 시작하기" 클릭하여 회원가입
3. 로그인 후 대시보드로 이동
4. "새 분석 시작" 클릭
5. 기업 정보 입력
6. 파일 업로드 (테스트용 문서 준비 필요)
7. 분석 시작 (2-3분 소요)
8. 리포트 확인
9. 텍스트 파일 다운로드

## 🏗️ 프로젝트 구조

```
corporate-ai-advisor/
├── src/
│   ├── app/
│   │   ├── api/                    # API 라우트
│   │   │   ├── auth/              # 인증 관련
│   │   │   └── projects/          # 프로젝트 관련
│   │   ├── auth/                   # 인증 페이지
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/              # 대시보드
│   │   ├── projects/               # 프로젝트 페이지
│   │   │   ├── new/               # 새 프로젝트
│   │   │   └── [id]/              # 프로젝트 상세
│   │   ├── layout.tsx
│   │   ├── page.tsx               # 홈페이지
│   │   └── globals.css
├── components/
│   ├── ui/                         # UI 컴포넌트
│   ├── logout-button.tsx
│   └── slide-viewer.tsx            # 슬라이드 뷰어
├── lib/
│   ├── auth.ts                     # NextAuth 설정
│   ├── prisma.ts                   # Prisma Client
│   ├── gemini.ts                   # Gemini API
│   └── utils.ts                    # 유틸리티 함수
├── prisma/
│   ├── schema.prisma               # 데이터베이스 스키마
│   └── migrations/
├── uploads/                        # 업로드된 파일
├── dev.db                          # SQLite 데이터베이스
├── .env                            # 환경 변수
└── package.json
```

## 🗄️ 데이터베이스 스키마

- **users**: 사용자 정보
- **subscriptions**: 구독 정보 (Free/Pro)
- **usage_logs**: 월별 사용량 기록
- **projects**: 분석 프로젝트
- **files**: 업로드된 파일
- **reports**: 분석 결과 리포트

## 🛠️ 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM)
- **Authentication**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: Google Gemini 1.5 Pro
- **File Upload**: Native File API

## 📝 향후 개선 사항

### 필수 개선
1. **파일 처리 고도화**
   - PDF 파싱 라이브러리 추가 (pdf-parse)
   - DOCX 파싱 (mammoth)
   - XLSX 파싱 (xlsx)
   - 이미지 OCR (Google Vision API)

2. **PDF 생성**
   - 실제 PDF 생성 (jsPDF, puppeteer)
   - 슬라이드 스타일 적용
   - 차트/그래프 렌더링

3. **구독 결제**
   - Stripe 연동
   - 결제 페이지
   - Pro 구독 관리

4. **공유 기능** (Pro 전용)
   - 공유 링크 생성
   - 비밀번호 보호
   - 만료일 설정

### 추가 기능
- 차트/그래프 시각화
- 프로젝트 편집/삭제
- 사용자 설정 페이지
- 이메일 알림
- 분석 템플릿 커스터마이징
- 다국어 지원

## 🐛 알려진 이슈

1. 파일 텍스트 추출이 기본적인 구현 (실제 파싱 라이브러리 필요)
2. PDF 다운로드가 텍스트 파일로 제공 (실제 PDF 생성 필요)
3. 에러 처리 개선 필요
4. 로딩 상태 UX 개선 필요

## 🔐 보안 고려사항

- 업로드된 파일은 로컬 파일 시스템에 저장 (프로덕션에서는 S3 등 사용 권장)
- NEXTAUTH_SECRET은 반드시 변경 필요
- API 키는 환경 변수로 관리
- 사용자별 파일 접근 권한 체크

## 📄 라이선스

MIT

## 👨‍💻 개발자

이 프로젝트는 MVP (Minimum Viable Product) 버전입니다.
프로덕션 배포 전에 추가 개발 및 테스트가 필요합니다.
