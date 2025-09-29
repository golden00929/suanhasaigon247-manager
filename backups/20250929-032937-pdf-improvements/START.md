# 🏠 Suanha Manager - PDF 개선 버전 백업 (2024-09-29)

## 📋 이 백업에 포함된 개선사항

### ✨ 주요 업데이트
1. **PDF 견적서 개선**
   - 공급자 정보 섹션 추가 (회사명, 연락처, 이메일)
   - 안내사항 섹션 추가 (결제조건, 보증기간, 유효기간 등)
   - PDF 레이아웃 최적화 (컬럼 너비 조정)
   - 아이템명 길이 제한 (20자 + ... 처리)

2. **견적서 관리 시스템 버그 수정**
   - 견적서 수정 시 항목 단가 0으로 바뀌는 문제 해결
   - PDF 항목 정보 누락 문제 수정
   - 데이터베이스 스키마 개선 (description, notes 필드 추가)

3. **시스템 안정성 개선**
   - 서버 환경변수 자동 대응
   - API 연동 최적화
   - 캐시 정리 시스템

## 🚀 독립 실행 방법

### 1. 의존성 설치
```bash
# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 2. 데이터베이스 설정
```bash
# 백엔드 디렉토리에서
cd backend
npx prisma db push
npx prisma db seed
```

### 3. 서버 실행
```bash
# 터미널 1: 백엔드 서버
cd backend
npm run dev

# 터미널 2: 프론트엔드 서버
cd frontend
npm run dev

# 터미널 3: 데이터베이스 관리 (선택사항)
cd backend
npx prisma studio --port 5555
```

### 4. 접속 정보
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **Prisma Studio**: http://localhost:5555

### 5. 로그인 정보
- **관리자**: system.admin@suanhasaigon247.com / admin123
- **직원**: demo.employee@suanhasaigon247.com / emp123

## 📂 백업 구조
```
20250929-032937-pdf-improvements/
├── frontend/                 # React 프론트엔드
├── backend/                  # Node.js 백엔드
├── README.md                 # 프로젝트 문서
├── CLAUDE.md                 # 개발 히스토리
├── START.md                  # 이 파일 (실행 가이드)
├── netlify.toml              # Netlify 배포 설정
├── render.yaml               # Render 배포 설정
└── sua-nha-sai-gon-247.png   # 회사 로고
```

## 🔄 복구 방법
1. 이 폴더 전체를 새로운 위치에 복사
2. 위의 "독립 실행 방법" 단계를 따라 실행
3. 필요시 환경변수 파일(.env) 수정

## 📝 백업 일시
- **생성일**: 2024년 9월 29일 03:29:37
- **Git 커밋**: v1.1.0-stable 기반
- **주요 기능**: PDF 견적서 개선, 버그 수정, 시스템 안정화

---

이 백업은 완전히 독립적으로 실행 가능하며, 모든 최신 개선사항이 포함되어 있습니다.