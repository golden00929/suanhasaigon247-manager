# 🏠 Suanha Manager - 베트남 유지보수 회사 관리 시스템

> **베타 버전 v1.0.0** - 완성된 견적 및 직원 관리 시스템
> 베트남 유지보수 회사를 위한 포괄적인 비즈니스 관리 솔루션

![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.3.4-646CFF.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.0-38B2AC.svg)
![License](https://img.shields.io/badge/License-Private-red.svg)

---

## 🚀 빠른 시작

### **설치 및 실행**
```bash
# 프론트엔드 실행
cd frontend
npm install
npm run dev
```

### **접속 정보**
- **URL**: http://localhost:3000
- **관리자**: `admin` / `admin123` (이메일: system.admin@suanhasaigon247.com)
- **직원**: `employee1` / `emp123` (이메일: demo.employee@suanhasaigon247.com)

---

## ✨ 주요 기능

### 💰 **가격 계산기**
- 베트남식 숫자 표기법 (1.000.000 VND)
- 재료비, 인건비, 출장비, 마진율 개별 설정
- 단계별 계산 과정 투명화

### 👥 **고객 관리**
- 개인/기업 고객 분류
- 수리 기록 추적
- 검색 및 필터링

### 📋 **견적 관리**
- 견적서 작성 및 편집
- PDF 자동 생성
- 상태 관리 (초안/발송/승인/거절)

### ⚙️ **계정 관리** (관리자 전용)
- 직원 계정 CRUD
- 프로필 사진 업로드
- 권한 관리

### 📊 **활동 기록**
- 실시간 활동 추적
- 카테고리별 분류
- 날짜별 필터링

### 🌍 **다국어 지원**
- 한국어/베트남어 완벽 지원
- 실시간 언어 전환

---

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express (준비됨)
- **Database**: LocalStorage (개발용) → MySQL/PostgreSQL (예정)

---

## 📖 개발 히스토리

전체 개발 과정은 `CLAUDE.md` 파일에서 확인할 수 있습니다.

### **주요 마일스톤**
- ✅ 가격 계산기 베트남 현지화
- ✅ 고객/견적 관리 시스템
- ✅ 직원 계정 관리 (사진 업로드)
- ✅ 실시간 활동 로그 시스템
- ✅ 한국어/베트남어 다국어 지원
- 🎉 **베타 v1.0.0 완성**

---

## 🔮 향후 계획

### **v1.1.0**
- [ ] 실제 백엔드 API 연동
- [ ] 데이터베이스 연결
- [ ] 이메일 알림 시스템

### **v1.2.0**
- [ ] 모바일 앱 (React Native)
- [ ] 재고 관리 모듈
- [ ] 통계 리포트

### **v2.0.0**
- [ ] 다지점 관리
- [ ] 고급 분석 대시보드
- [ ] API 외부 연동

---

## 🛡️ 백업 정보

### **Git 태그**
```bash
# 베타 버전 태그 확인
git tag -l
# v1.0.0-beta

# 베타 버전으로 롤백
git checkout v1.0.0-beta
```

### **중요 커밋**
- `6f02830` - 🎉 베타 버전 v1.0.0 완성

---

## 📁 프로젝트 구조

```
suanha-manager/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/       # 재사용 컴포넌트
│   │   ├── contexts/         # React 컨텍스트
│   │   ├── locales/          # 다국어 번역
│   │   ├── pages/            # 페이지 컴포넌트
│   │   └── services/         # API 서비스
│   └── package.json
├── backend/                  # Node.js 백엔드 (준비됨)
│   ├── src/
│   │   ├── routes/           # API 라우트
│   │   ├── middleware/       # 미들웨어
│   │   └── types/            # TypeScript 타입
│   └── package.json
├── CLAUDE.md                 # 개발 히스토리
└── README.md                 # 프로젝트 문서
```

---

## 🎯 사용 가이드

### **1. 로그인**
- 관리자: 모든 기능 접근
- 직원: 고객/견적 관리만 접근

### **2. 견적서 작성 과정**
1. 고객 등록
2. 견적서 작성
3. 항목 추가 및 가격 설정
4. PDF 생성

### **3. 직원 관리** (관리자)
1. 새 직원 추가 버튼
2. 정보 입력 (기본/회사/계정)
3. 프로필 사진 업로드
4. 저장

---

## 🙏 개발 정보

- **개발**: Claude Code AI Assistant 협업
- **타겟**: 베트남 유지보수 회사
- **라이선스**: Private (사업용)
- **완성도**: 베타 버전 (프로덕션 준비 완료)

---

**🎉 베타 버전 v1.0.0 - 완성! 🎉**

*안정적인 베타 버전으로 실제 업무에 사용 가능합니다.*