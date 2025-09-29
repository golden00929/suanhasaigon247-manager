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

---
*최종 업데이트: 2025-01-19*
*주요 기능: 직원 관리, 견적 계산, 팝업 시스템*