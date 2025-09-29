# Suanha Manager Frontend - 개발 히스토리 및 학습자료

## 프로젝트 개요
베트남 유지보수 회사를 위한 견적 및 직원 관리 시스템

## 주요 기능 개발 과정

### 1. 초기 가격 계산기 개선
- **요청**: 금액 천단위 구분을 쉼표(,) 대신 점(.) 사용
- **구현**: `formatNumber` 함수로 베트남식 숫자 표기법 적용
- **파일**: `src/pages/PriceCalculator.tsx`

### 2. 계산 과정 투명화
- **요청**: 원가 → 판매단가 계산시 중간 과정과 요율 표시
- **구현**: 단계별 계산 과정 UI 추가, 실시간 계산
- **특징**: 재료비, 인건비, 출장비, 마진율 개별 설정 가능

### 3. UI 개선
- **카테고리 레이아웃**: 한 줄에 4개씩 배치
- **불필요한 버튼 제거**: "전체 카테고리" 버튼 삭제
- **반응형 디자인**: Tailwind CSS 활용

### 4. 직원 관리 시스템 구축
#### 4-1. 기본 구조
- **파일**: `src/pages/AccountManagement.tsx`
- **기능**: 직원 정보 CRUD, 검색, 필터링

#### 4-2. 확장된 직원 정보 구조
```typescript
interface UserAccount {
  // 기본 계정 정보
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isActive: boolean;

  // 개인 정보
  fullName: string;
  phone: string;
  birthDate?: string;
  address?: string;
  profileImage?: string;

  // 회사 정보
  department: string;
  position: string;
  hireDate: string;
  notes?: string;

  // 시스템 정보
  createdAt: string;
  lastLoginAt?: string;
}
```

#### 4-3. 프로필 사진 업로드
- **구현**: Base64 인코딩으로 이미지 저장
- **UI**: 드래그앤드롭 또는 클릭 업로드
- **미리보기**: 실시간 이미지 프리뷰

### 5. 팝업 시스템 구현
#### 5-1. 새 직원 추가 팝업
- **방식**: `window.open()` 사용한 별도 창
- **통신**: `postMessage` API로 부모-자식 창 데이터 교환
- **특징**: 완전한 HTML 문서를 동적 생성

#### 5-2. 직원 상세보기/수정 팝업
- **기능**: 읽기/수정 모드 토글
- **레이아웃**: 섹션별 정보 구분 (기본정보, 회사정보, 계정정보)

### 6. 날짜 형식 표준화
- **형식**: dd/mm/yyyy (베트남 표준)
- **변환 함수**: 입력 검증 및 포맷 변환
- **적용**: 생년월일, 입사일, 최종 로그인 등

### 7. 주요 기술적 해결사항

#### 7-1. React Hook 의존성 배열 오류
```javascript
// 문제: 객체 참조로 인한 무한 렌더링
useEffect(() => {
  // 계산 로직
}, [formData]); // 객체 전체 참조

// 해결: 개별 속성 참조
useEffect(() => {
  // 계산 로직
}, [formData.materialCost, formData.laborCost, formData.travelCost, formData.marginRate]);
```

#### 7-2. 문자열 메서드 에러 방지
```javascript
// 문제: undefined에서 charAt 호출
user.fullName.charAt(0)

// 해결: 조건부 체이닝
user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)
```

#### 7-3. Z-index 모달 문제
```css
/* 해결: 인라인 스타일로 높은 z-index 적용 */
style={{zIndex: 999999}}
```

#### 7-4. 팝업 창 데이터 전송 및 닫기
```javascript
// 데이터 전송 후 확실한 창 닫기
window.opener.postMessage(data, '*');
setTimeout(() => window.close(), 100);
```

### 8. 테이블 UI 개선
#### 8-1. 센터 정렬 및 고정 너비
- **헤더**: 모든 컬럼 헤더 센터 정렬
- **너비**: `table-fixed` 클래스로 고정 너비 적용
- **열 너비**: 각 컬럼별 적절한 너비 설정

#### 8-2. 버튼 텍스트 수직 배치 문제 해결
```css
/* 문제: 한글 텍스트가 세로로 표시됨 */
/* 해결책 */
.whitespace-nowrap  /* 텍스트 줄바꿈 방지 */
.min-w-[50px]      /* 최소 너비 보장 */
.inline-flex       /* 플렉스 레이아웃 */
```

### 9. 검색 및 필터링
```javascript
const filteredUsers = users.filter(user => {
  const searchLower = searchTerm.toLowerCase();
  return user.fullName.toLowerCase().includes(searchLower) ||
         user.username.toLowerCase().includes(searchLower) ||
         user.email.toLowerCase().includes(searchLower) ||
         user.department.toLowerCase().includes(searchLower) ||
         user.position.toLowerCase().includes(searchLower);
});
```

## 코드 패턴 및 컨벤션

### 1. 상태 관리
```javascript
// 객체 상태 업데이트
setFormData(prev => ({
  ...prev,
  [field]: value
}));
```

### 2. 에러 처리
```javascript
try {
  // 로직 실행
  setError('✅ 성공 메시지');
  setTimeout(() => setError(null), 3000);
} catch (err) {
  setError('❌ 오류 메시지');
}
```

### 3. 조건부 렌더링
```javascript
{user.profileImage ? (
  <img src={user.profileImage} alt={user.fullName} />
) : (
  <div className="placeholder">
    {user.fullName?.charAt(0) || user.username.charAt(0)}
  </div>
)}
```

## 개발 명령어
```bash
# 프론트엔드 개발 서버
cd frontend && npm run dev

# 백엔드 개발 서버
cd backend && npm run dev

# 빌드
npm run build

# 린트 체크
npm run lint
```

## 향후 개선 사항
1. 실제 백엔드 API 연동
2. 사용자 권한별 기능 제한
3. 데이터 검증 강화
4. 반응형 디자인 개선
5. 다국어 지원 확장

## 디버깅 팁
1. 브라우저 개발자 도구 Console 확인
2. 팝업 창 통신 시 `postMessage` 로그 확인
3. React Hook 의존성 배열 주의
4. CSS 클래스명 오타 확인
5. 날짜 형식 변환 시 유효성 검사 필수

## 배포 및 오류 해결 히스토리

### 이메일 중복 오류 해결 (2025-01-21)
- **문제**: 새 직원 추가 시 "Email already exists" 400 에러 발생
- **원인**: 시드 데이터의 일반적인 이메일 주소로 인한 중복
- **해결책**:
  - 시드 데이터 이메일을 고유하게 변경
    - `admin@suanha.com` → `system.admin@suanhasaigon247.com`
    - `employee@suanha.com` → `demo.employee@suanhasaigon247.com`
  - README.md에 새로운 로그인 정보 반영
- **배포**: Render.com 자동 배포로 적용됨

### 배포 환경
- **프론트엔드**: Netlify (https://suanhasaigon247-manager.netlify.app)
- **백엔드**: Render.com (https://suanhasaigon247-manager.onrender.com)
- **데이터베이스**: PostgreSQL (Render.com 관리형)

## 최신 개발 이력

### 고객 생성 API 오류 해결 (2025-09-25)
- **문제**: 새 고객 추가 시 데이터베이스에 저장되지 않는 오류 발생
- **원인**: Backend API에서 `customerData.addresses.map()` 실행 시 `addresses`가 `undefined`인 경우 TypeError 발생
- **해결책**:
  ```typescript
  // 수정 전
  addresses: {
    create: customerData.addresses.map(addr => ({ ... }))
  }

  // 수정 후 - 안전한 배열 처리
  const addresses = customerData.addresses || [];
  addresses: {
    create: addresses.map(addr => ({ ... }))
  }
  ```
- **파일**: `backend/src/routes/customers.ts` (라인 115-116)
- **테스트**: curl을 통한 API 테스트로 고객 생성 성공 확인

### 로그인 인증 시스템 통합 완료 (2025-09-25)
- **배경**: 기존 Mock 인증에서 실제 API 연동으로 전환
- **변경사항**:
  - `AppFinal.tsx`의 MockAuthProvider에서 실제 API 호출 구현
  - JWT 토큰 기반 인증 및 localStorage 저장
  - 자동 리다이렉트 로직 추가
- **주요 수정 파일**:
  - `src/AppFinal.tsx`: MockAuthProvider 실제 로그인 기능 구현
  - `src/pages/Login.tsx`: 인증된 사용자 자동 리다이렉트
  - `src/main.tsx`: React StrictMode 제거로 중복 렌더링 방지

### 디버그 모드 정리 (2025-09-25)
- **작업**: 프로덕션 준비를 위한 디버그 코드 제거
- **변경사항**:
  - 빨간색 디버그 배너 제거
  - 과도한 console.log 정리
  - 개발자 도구 콘솔 출력 최적화

### 데이터베이스 연동 최적화 (2025-09-25)
- **완료**: Mock 데이터 완전 제거, 실제 API 데이터만 사용
- **검증**: 고객 CRUD 기능 정상 작동 확인
- **서버 환경**:
  - Frontend: http://localhost:3000 (Vite)
  - Backend: http://localhost:8000 (Express + Prisma)

## 개발 환경 설정
```bash
# 백엔드 서버 실행
cd backend && npm run dev

# 프론트엔드 서버 실행
cd frontend && npm run dev

# 데이터베이스 관리
cd backend && npx prisma studio --port 5555
```

## 현재 로그인 정보
- **관리자**: system.admin@suanhasaigon247.com / admin123
- **직원**: demo.employee@suanhasaigon247.com / emp123

## 서버 주소 자동 대응 시스템 (2025-09-28)

### 문제 해결: 서버 포트 변경 시 로그인 오류
- **배경**: 프론트엔드가 다른 포트(3001)로 실행되면 하드코딩된 API URL로 인해 로그인 실패
- **해결책**:
  1. **환경변수 활용**: `frontend/.env`의 `VITE_API_URL` 사용
  2. **API 설정 수정**: `src/services/api.ts`에서 환경변수 우선 사용
  3. **Vite 프록시 수정**: `vite.config.ts`의 프록시 타겟을 8000번 포트로 수정

```javascript
// 수정 전
const API_BASE_URL = 'http://localhost:8000/api';

// 수정 후 - 환경변수 우선 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

```typescript
// vite.config.ts 수정
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // 5000 → 8000 수정
    changeOrigin: true,
  },
},
```

### 현재 서버 환경
- **Frontend**: http://localhost:3001 (포트 3000 사용 중으로 자동 변경)
- **Backend**: http://localhost:8000 (고정)
- **API 통신**: 환경변수 기반 자동 설정

## 견적서 데이터 저장/로드 문제 해결 (2025-09-28)

### 문제 현상
1. **견적 관리/설명 필드 누락**: 저장 후 수정 시 입력한 내용이 사라짐
2. **메모 내용 누락**: 저장된 메모가 편집 시 표시되지 않음
3. **항목 소계와 견적요약 소계 불일치**: 계산 로직 차이로 인한 금액 불일치

### 근본 원인 분석
- **데이터베이스 스키마 누락**: `description`과 `notes` 필드가 Quotation 모델에 없음
- **백엔드 API 미지원**: API에서 해당 필드들을 처리하지 않음
- **프론트엔드 계산 로직 오류**: `item.total` vs `item.amount` 필드 혼용

### 해결 과정

#### 1. 데이터베이스 스키마 수정
```sql
-- Prisma schema.prisma 수정
model Quotation {
  // ... 기존 필드들
  description       String?       // 견적 관리/설명
  notes             String?       // 메모
  // ... 나머지 필드들
}
```

#### 2. 백엔드 API 업데이트
```typescript
// quotations.ts - Create 함수
const quotation = await prisma.quotation.create({
  data: {
    // ... 기존 필드들
    description: quotationData.description || null,
    notes: quotationData.notes || null,
    // ... 나머지 필드들
  }
});

// quotations.ts - Update 함수
let updateData: any = {
  // ... 기존 필드들
  description: quotationData.description,
  notes: quotationData.notes,
  // ... 나머지 필드들
};
```

#### 3. 프론트엔드 데이터 로딩 수정
- `handleEdit` 함수에서 저장된 모든 필드 로딩하도록 개선
- `calculateTotals` 함수의 필드명 통일 (`item.amount` 사용)

#### 4. 데이터베이스 마이그레이션 적용
```bash
npx prisma db push
```

### 검증 완료 사항
✅ 견적 관리/설명 필드 저장 및 로드 정상 작동
✅ 메모 내용 저장 및 편집 시 표시 정상
✅ 항목 소계와 견적요약 소계 일치
✅ VAT 부가세율 8% 유지 (기존 수정사항)
✅ PDF 다운로드 현재 폼 데이터 반영
✅ 고객 정보 연결 및 유지

---
*최종 업데이트: 2025-09-28*
*주요 기능: 직원 관리, 견적 계산, 고객 관리, JWT 인증, 서버 주소 자동 대응*
*최근 해결: 견적서 데이터 저장/로드 문제, 소계 계산 불일치, description/notes 필드 누락*