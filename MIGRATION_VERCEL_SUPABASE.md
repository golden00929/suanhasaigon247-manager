# Vercel + Supabase 완전 무료 마이그레이션 가이드

## 📊 최종 아키텍처

```
┌──────────────────┐
│  프론트엔드       │
│  Netlify         │  ← 변경 없음
│  (무료)          │
└────────┬─────────┘
         │
         │ HTTPS 요청
         ↓
┌──────────────────┐
│  백엔드 API      │
│  Vercel          │  ← 새로운 호스팅
│  Serverless      │
│  (무료)          │
└────────┬─────────┘
         │
         │ PostgreSQL 연결
         ↓
┌──────────────────┐
│  데이터베이스     │
│  Supabase        │  ← 새로운 DB
│  PostgreSQL      │
│  (무료)          │
└──────────────────┘
```

---

## 💰 비용 비교

| 항목 | 현재 (Render) | 이후 (Vercel + Supabase) | 절감 |
|------|--------------|-------------------------|------|
| 데이터베이스 | $7/월 | **무료** | $7 |
| 백엔드 호스팅 | $7/월 | **무료** | $7 |
| 프론트엔드 | 무료 | 무료 | $0 |
| **월 총계** | **$14** | **$0** | **$14** |
| **연 총계** | **$168** | **$0** | **$168** |

---

## 🎯 무료 플랜 제한 사항

### Vercel (Hobby 플랜)
- ✅ Serverless Functions: 100GB bandwidth/월
- ✅ 함수 실행: 100GB-Hours/월
- ✅ 동시 빌드: 1개
- ⚠️ 함수 실행 시간: 10초 (충분함)
- ⚠️ 함수 메모리: 1024MB (충분함)

### Supabase (Free 플랜)
- ✅ 데이터베이스: 500MB 저장공간
- ✅ 대역폭: 2GB/월
- ✅ API 요청: 무제한
- ✅ 동시 연결: 100개
- ⚠️ 1주일 비활성 시 일시 중지 (쉽게 재활성화)

**결론: 소규모 비즈니스에 충분합니다!**

---

## 🔧 마이그레이션 방법

### 방법 1: Express 앱 전체를 Serverless로 래핑 (추천 ⭐)

**장점:**
- ✅ 코드 수정 최소화 (95% 그대로)
- ✅ 기존 라우팅 구조 유지
- ✅ 30분 작업

**단점:**
- Cold Start 약간 느림 (2-3초)

**필요한 변경:**
```javascript
// 기존: backend/src/app.ts
app.listen(PORT, () => {...});

// 변경: backend/api/index.ts
export default app;  // Vercel이 자동으로 처리
```

---

### 방법 2: 각 라우트를 개별 Serverless Function으로 분리

**장점:**
- ✅ Cold Start 빠름 (1초 미만)
- ✅ 최적화된 성능

**단점:**
- ❌ 코드 대대적 수정 필요
- ❌ 미들웨어 구조 변경
- ❌ 4-6시간 작업

---

## 🚀 추천: 방법 1로 진행

**이유:**
- 현재 앱이 정상 작동 중
- Cold Start 2-3초는 허용 가능
- 빠른 마이그레이션

---

## 📝 단계별 마이그레이션 절차

### Step 1: Supabase 프로젝트 생성 (5분)

1. https://supabase.com 접속 → GitHub 로그인
2. "New Project" 클릭
3. 프로젝트 설정:
   - **Name**: `suanha-manager`
   - **Database Password**: 강력한 비밀번호 (저장 필수!)
   - **Region**: Singapore
   - **Plan**: Free
4. "Create new project" 클릭 (1-2분 대기)

5. Connection String 복사:
   - Settings → Database → Connection string → URI
   - **포맷**: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

---

### Step 2: 백엔드 코드 Vercel 형식으로 수정 (15분)

#### 2-1. Vercel 설정 파일 생성

**파일: `backend/vercel.json`** (새 파일)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.ts"
    }
  ]
}
```

#### 2-2. API 엔트리 포인트 생성

**파일: `backend/api/index.ts`** (새 파일)
```typescript
import app from '../src/app';

// Vercel serverless handler
export default app;
```

#### 2-3. Express 앱 수정

**파일: `backend/src/app.ts`** (기존 파일 수정)

**변경 전:**
```typescript
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

**변경 후:**
```typescript
// Vercel에서는 listen() 사용 안 함
// 로컬 개발 시에만 사용
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
```

#### 2-4. Package.json 업데이트

**파일: `backend/package.json`**

**추가:**
```json
{
  "scripts": {
    "vercel-build": "prisma generate"
  }
}
```

---

### Step 3: Prisma 스키마를 Supabase에 적용 (5분)

```bash
# 로컬 .env 업데이트
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...supabase.com:6543/postgres"

# 백엔드 디렉토리로 이동
cd "2. suanha manager/backend"

# Prisma 스키마를 Supabase DB에 푸시
npx prisma db push

# 초기 데이터 시드
npm run db:seed

# 확인
npx prisma studio
```

---

### Step 4: Vercel에 배포 (5분)

#### 4-1. Vercel CLI 설치

```bash
npm install -g vercel
```

#### 4-2. Vercel 로그인 및 배포

```bash
# 백엔드 디렉토리에서
cd "2. suanha manager/backend"

# Vercel 로그인
vercel login

# 첫 배포 (설정)
vercel

# 질문 응답:
# - Set up and deploy? Yes
# - Which scope? (계정 선택)
# - Link to existing project? No
# - Project name? suanha-manager-backend
# - Directory? ./
# - Override settings? No

# 프로덕션 배포
vercel --prod
```

#### 4-3. 환경변수 설정

Vercel 대시보드에서:

1. 프로젝트 선택 → Settings → Environment Variables
2. 다음 변수 추가:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@...supabase.com:6543/postgres
JWT_SECRET=suanha-saigon-247-super-secret-jwt-key-for-production-2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://suanhasaigon247-manager.netlify.app
```

3. 재배포: `vercel --prod`

---

### Step 5: 프론트엔드 API URL 업데이트 (2분)

**파일: `frontend/.env`**

```bash
# Vercel 백엔드 URL로 변경 (배포 후 받은 URL)
VITE_API_URL=https://suanha-manager-backend.vercel.app/api
```

**Netlify 재배포:**
```bash
cd "2. suanha manager/frontend"
git add .
git commit -m "Update API URL to Vercel backend"
git push
```

또는 Netlify 대시보드에서:
- Site settings → Environment variables
- `VITE_API_URL` 업데이트
- Trigger deploy

---

### Step 6: 테스트 및 검증 (5분)

#### 6-1. 백엔드 헬스 체크

브라우저에서:
```
https://suanha-manager-backend.vercel.app/api/health
```

**예상 응답:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-23T..."
}
```

#### 6-2. 프론트엔드 로그인 테스트

1. https://suanhasaigon247-manager.netlify.app
2. 로그인:
   - `system.admin@suanhasaigon247.com` / `admin123`
3. 모든 기능 테스트:
   - ✅ 대시보드
   - ✅ 고객 관리
   - ✅ 견적 관리
   - ✅ 가격 계산기

---

## 🔍 주의사항 및 해결책

### 문제 1: Prisma Client 생성 오류

**증상:** Vercel 빌드 실패

**해결:**
```json
// backend/package.json
"scripts": {
  "vercel-build": "prisma generate"
}
```

### 문제 2: Cold Start 느림

**증상:** 첫 요청이 5-10초 소요

**해결:**
- Vercel Cron Jobs로 5분마다 핑 (무료 플랜에서 사용 가능)
- 또는 그냥 수용 (이후 요청은 빠름)

### 문제 3: Supabase 연결 오류

**해결:** Connection string 형식 확인
```bash
# 올바른 형식 (pooler 사용)
postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# pgbouncer=true 파라미터 제거
```

---

## 📊 마이그레이션 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] DATABASE_URL 복사 및 저장
- [ ] `backend/vercel.json` 생성
- [ ] `backend/api/index.ts` 생성
- [ ] `backend/src/app.ts` 수정
- [ ] 로컬 `.env` 업데이트
- [ ] `npx prisma db push` 실행
- [ ] `npm run db:seed` 실행
- [ ] Vercel CLI 설치
- [ ] `vercel` 명령으로 배포
- [ ] Vercel 환경변수 설정
- [ ] `vercel --prod` 재배포
- [ ] Vercel URL 확인
- [ ] 프론트엔드 `.env` 업데이트
- [ ] Netlify 재배포
- [ ] 헬스 체크 테스트
- [ ] 로그인 테스트
- [ ] 모든 기능 테스트
- [ ] Render 서비스 정지

---

## 🎉 완료 후 상태

- ✅ 월 $14 절감 (연 $168)
- ✅ 완전 무료 운영
- ✅ 코드 수정 최소화
- ✅ 동일한 기능 유지
- ✅ 글로벌 CDN (빠른 속도)

---

## 📞 다음 단계

이 가이드를 참고하여 마이그레이션을 진행하시겠습니까?

1. **직접 진행** - 위 가이드 따라 단계별 실행
2. **자동화 요청** - 필요한 파일 자동 생성
3. **한 단계씩** - 각 단계마다 확인하며 진행

원하시는 방법을 알려주세요!
