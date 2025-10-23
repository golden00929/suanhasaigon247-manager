# Supabase 마이그레이션 가이드

## 📋 마이그레이션 개요

Render.com (유료) → Supabase (무료) + Railway (무료)로 이전

**변경 사항:**
- 데이터베이스: Render PostgreSQL → Supabase PostgreSQL
- 백엔드 호스팅: Render.com → Railway.app (무료)
- 프론트엔드: Netlify (유지)

---

## 🚀 Step 1: Supabase 프로젝트 생성

### 1-1. Supabase 계정 생성 및 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭하여 계정 생성 (GitHub 계정으로 가능)
3. "New Project" 클릭
4. 프로젝트 정보 입력:
   - **Name**: `suanha-manager`
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수!)
   - **Region**: Singapore (가장 가까운 지역)
   - **Pricing Plan**: Free (무료)
5. "Create new project" 클릭 (1-2분 소요)

### 1-2. 데이터베이스 연결 정보 얻기

프로젝트 생성 후:

1. 좌측 메뉴에서 **"Settings"** (톱니바퀴 아이콘) 클릭
2. **"Database"** 클릭
3. **"Connection string"** 섹션에서 **"URI"** 선택
4. **Connection string** 복사 (형식: `postgresql://postgres:[YOUR-PASSWORD]@...`)
5. `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체

**예시:**
```
postgresql://postgres.abcdefghijk:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**중요**: 이 연결 문자열을 안전한 곳에 저장하세요!

---

## 🗄️ Step 2: 데이터베이스 스키마 마이그레이션

### 2-1. 로컬 환경변수 업데이트

**파일: `backend/.env`**

```bash
# Supabase PostgreSQL (새로 생성한 연결 문자열로 교체)
DATABASE_URL="postgresql://postgres.abcdefghijk:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# 기존 설정 유지
JWT_SECRET="suanha-saigon-247-super-secret-jwt-key-for-development-2024"
JWT_EXPIRES_IN="7d"
PORT=8000
NODE_ENV="development"
```

### 2-2. Prisma 마이그레이션 실행

```bash
# 백엔드 디렉토리로 이동
cd "2. suanha manager/backend"

# Prisma 스키마를 Supabase DB에 적용
npx prisma db push

# 초기 데이터 시드 (관리자 계정 등)
npm run db:seed

# Prisma Studio로 데이터 확인
npx prisma studio
```

**성공 확인:**
- 터미널에 "Your database is now in sync with your Prisma schema" 메시지 확인
- Prisma Studio에서 테이블 생성 확인 (users, customers, quotations 등)

---

## 🚂 Step 3: Railway에 백엔드 배포

### 3-1. Railway 계정 생성

1. https://railway.app 접속
2. "Login" → GitHub 계정으로 로그인
3. "Start a New Project" 클릭

### 3-2. 프로젝트 배포

1. "Deploy from GitHub repo" 선택
2. GitHub 저장소 연결 (suanha manager 레포지토리)
3. 배포할 디렉토리 선택: **`backend`**
4. 자동으로 빌드 및 배포 시작

### 3-3. 환경변수 설정

Railway 대시보드에서:

1. 배포된 서비스 클릭
2. "Variables" 탭 클릭
3. 다음 환경변수 추가:

```bash
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://postgres.abcdefghijk:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
JWT_SECRET=suanha-saigon-247-super-secret-jwt-key-for-production-2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://suanhasaigon247-manager.netlify.app
```

4. "Deploy" 클릭하여 재배포

### 3-4. 도메인 확인

1. "Settings" 탭 클릭
2. "Domains" 섹션에서 자동 생성된 URL 확인
   - 예: `https://suanha-manager-backend.up.railway.app`
3. 이 URL을 복사하여 저장 (프론트엔드에서 사용)

---

## 🎨 Step 4: 프론트엔드 업데이트

### 4-1. API URL 변경

**파일: `frontend/.env`**

```bash
# Railway 백엔드 URL로 변경 (/api 제외)
VITE_API_URL=https://suanha-manager-backend.up.railway.app/api
```

### 4-2. Netlify 재배포

```bash
# 프론트엔드 디렉토리로 이동
cd "2. suanha manager/frontend"

# 빌드 테스트
npm run build

# Git에 커밋 및 푸시 (Netlify 자동 배포)
git add .
git commit -m "Update API URL to Railway backend"
git push
```

또는 Netlify 대시보드에서:
1. Site settings → Environment variables
2. `VITE_API_URL` 값을 Railway URL로 변경
3. "Deploy" → "Trigger deploy" 클릭

---

## ✅ Step 5: 마이그레이션 검증

### 5-1. 백엔드 헬스 체크

브라우저에서 접속:
```
https://suanha-manager-backend.up.railway.app/api/health
```

**예상 응답:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-23T...",
  "memory": { ... }
}
```

### 5-2. 프론트엔드 로그인 테스트

1. https://suanhasaigon247-manager.netlify.app 접속
2. 관리자 계정으로 로그인:
   - 이메일: `system.admin@suanhasaigon247.com`
   - 비밀번호: `admin123`
3. 대시보드, 고객 관리, 견적 관리 기능 테스트

### 5-3. 데이터 확인

- Supabase 대시보드 → Table Editor에서 데이터 확인
- 기존 Render 데이터는 수동 마이그레이션 필요 (아래 참조)

---

## 📊 Step 6: 기존 데이터 마이그레이션 (선택)

### 옵션 1: pg_dump 사용 (권장)

```bash
# Render DB 덤프 생성
pg_dump "postgresql://suanha_user:49iR7Mc9cRC9KFTk1GZGeaOlNtKSinEA@dpg-d37bbnbuibrs738tjbf0-a.singapore-postgres.render.com/suanhasaigon247_manager" > render_backup.sql

# Supabase DB에 복원
psql "postgresql://postgres.xxx:your_password@...supabase.com:6543/postgres" < render_backup.sql
```

### 옵션 2: Supabase 대시보드 사용

1. Render DB에서 데이터 Export (CSV)
2. Supabase → Table Editor → Import data

---

## 🔧 트러블슈팅

### 문제 1: Railway 빌드 실패
**해결**: `backend/package.json`의 `build` 스크립트 확인
```json
"build": "prisma generate && tsc"
```

### 문제 2: Supabase 연결 오류
**해결**: Connection string의 `?pgbouncer=true` 제거 또는 포트 5432 사용

### 문제 3: CORS 오류
**해결**: `backend/src/app.ts`의 CORS 설정 확인
```typescript
app.use(cors({
  origin: 'https://suanhasaigon247-manager.netlify.app',
  credentials: true
}));
```

---

## 💰 비용 비교

| 서비스 | 이전 (Render) | 이후 (Supabase + Railway) |
|--------|--------------|---------------------------|
| DB | $7/월 | **무료** (500MB, 2GB bandwidth) |
| 백엔드 | $7/월 | **무료** (512MB RAM, 500h/월) |
| 프론트엔드 | 무료 (Netlify) | 무료 (Netlify) |
| **총 비용** | **$14/월** | **$0/월** |

---

## 📝 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] DATABASE_URL 복사 및 저장
- [ ] 로컬 `.env` 업데이트
- [ ] `npx prisma db push` 실행
- [ ] `npm run db:seed` 실행
- [ ] Railway 프로젝트 생성
- [ ] Railway 환경변수 설정
- [ ] Railway 도메인 확인
- [ ] 프론트엔드 `.env` 업데이트
- [ ] Netlify 재배포
- [ ] 로그인 테스트
- [ ] 모든 기능 테스트
- [ ] (선택) 기존 데이터 마이그레이션

---

## 🆘 도움이 필요하면

각 단계를 진행하면서 막히는 부분이 있으면 언제든 말씀해주세요!
