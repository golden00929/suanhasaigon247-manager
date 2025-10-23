# 🚀 다음 단계: 사용자가 직접 실행할 작업

백엔드 코드 수정이 완료되었습니다! 이제 사용자가 직접 실행해야 할 단계입니다.

---

## ✅ 완료된 작업

1. ✅ `backend/vercel.json` - Vercel 설정 파일 생성
2. ✅ `backend/api/index.ts` - Serverless 엔트리 포인트 생성
3. ✅ `backend/src/app.ts` - Vercel 환경에 맞게 수정
4. ✅ `backend/package.json` - vercel-build 스크립트 추가

---

## 📋 Step 1: Supabase 프로젝트 생성 (5분)

### 1-1. Supabase 가입 및 프로젝트 생성

1. 브라우저에서 https://supabase.com 접속
2. **"Start your project"** 클릭
3. **GitHub 계정**으로 로그인
4. **"New Project"** 클릭
5. 다음 정보 입력:
   ```
   Name: suanha-manager
   Database Password: [강력한 비밀번호 생성 및 저장!]
   Region: Singapore (ap-southeast-1)
   Pricing Plan: Free
   ```
6. **"Create new project"** 클릭 (1-2분 대기)

### 1-2. DATABASE_URL 복사

프로젝트 생성 완료 후:

1. 좌측 메뉴에서 **⚙️ Settings** 클릭
2. **Database** 클릭
3. **Connection string** 섹션에서 다음 선택:
   - **Transaction pooler** 모드
   - **URI** 형식 선택
4. **Connection string 복사** 버튼 클릭
5. 메모장에 붙여넣기

**예시:**
```
postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

6. `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체

**⚠️ 중요:** 이 연결 문자열을 안전하게 보관하세요!

---

## 📋 Step 2: 로컬 환경변수 업데이트 (2분)

### 2-1. 백엔드 .env 수정

**파일: `backend/.env`**

다음 내용으로 교체:

```bash
# Supabase PostgreSQL (위에서 복사한 연결 문자열)
DATABASE_URL="postgresql://postgres.xxx:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# 기존 설정 유지
JWT_SECRET="suanha-saigon-247-super-secret-jwt-key-for-development-2024"
JWT_EXPIRES_IN="7d"
PORT=8000
NODE_ENV="development"
```

---

## 📋 Step 3: Prisma 마이그레이션 (5분)

터미널에서 다음 명령어 실행:

```bash
# 백엔드 디렉토리로 이동
cd "/mnt/d/development/projects/2. suanha manager/backend"

# Prisma 스키마를 Supabase DB에 적용
npx prisma db push

# 초기 데이터 시드 (관리자 계정 등)
npm run db:seed

# Prisma Studio로 데이터 확인 (선택사항)
npx prisma studio
```

**예상 출력:**
```
✔ Your database is now in sync with your Prisma schema
✔ Seeding completed successfully
```

**확인사항:**
- Supabase 대시보드 → Table Editor에서 테이블 생성 확인
- users, customers, quotations 등 7개 테이블 생성되어야 함

---

## 📋 Step 4: Vercel 프로젝트 생성 및 배포 (10분)

### 4-1. Vercel CLI 설치

```bash
npm install -g vercel
```

### 4-2. Vercel 로그인

```bash
vercel login
```

이메일 주소 입력 후 받은 이메일에서 확인 클릭

### 4-3. 백엔드 배포

```bash
# 백엔드 디렉토리에서
cd "/mnt/d/development/projects/2. suanha manager/backend"

# 첫 배포 (설정)
vercel
```

**질문 응답:**
```
? Set up and deploy "~/backend"? [Y/n] y
? Which scope? [본인 계정 선택]
? Link to existing project? [N/y] n
? What's your project's name? suanha-manager-backend
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

### 4-4. 환경변수 설정

1. 터미널에서 표시된 Vercel 대시보드 URL 클릭
2. 또는 https://vercel.com/dashboard 접속
3. **suanha-manager-backend** 프로젝트 클릭
4. **Settings** 탭 → **Environment Variables** 클릭
5. 다음 환경변수 추가:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres.xxx:pass@...supabase.com:6543/postgres` (Supabase 연결 문자열) |
| `JWT_SECRET` | `suanha-saigon-247-super-secret-jwt-key-for-production-2024` |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://suanhasaigon247-manager.netlify.app` |

6. **Save** 클릭

### 4-5. 프로덕션 배포

```bash
# 환경변수 설정 후 프로덕션 배포
vercel --prod
```

**성공 시 출력:**
```
✅ Production: https://suanha-manager-backend.vercel.app [복사!]
```

**이 URL을 복사하여 저장하세요!**

---

## 📋 Step 5: 백엔드 헬스 체크 (1분)

브라우저에서 다음 URL 접속:

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

✅ 이 응답이 보이면 백엔드 배포 성공!

---

## 📋 Step 6: 프론트엔드 API URL 업데이트 (3분)

### 6-1. 프론트엔드 .env 수정

**파일: `frontend/.env`**

```bash
# Vercel 백엔드 URL로 변경 (위에서 복사한 URL)
VITE_API_URL=https://suanha-manager-backend.vercel.app/api
```

### 6-2. Netlify 환경변수 업데이트

**옵션 A: Git 푸시 (권장)**

```bash
cd "/mnt/d/development/projects/2. suanha manager"
git add .
git commit -m "Migrate to Vercel + Supabase"
git push
```

Netlify가 자동으로 재배포합니다 (2-3분 소요).

**옵션 B: Netlify 대시보드**

1. https://app.netlify.com 접속
2. suanhasaigon247-manager 사이트 클릭
3. **Site settings** → **Environment variables** 클릭
4. `VITE_API_URL` 값 수정:
   ```
   https://suanha-manager-backend.vercel.app/api
   ```
5. **Save** → **Deploys** → **Trigger deploy** → **Deploy site**

---

## 📋 Step 7: 최종 테스트 (5분)

### 7-1. 프론트엔드 접속

```
https://suanhasaigon247-manager.netlify.app
```

### 7-2. 로그인 테스트

- 이메일: `system.admin@suanhasaigon247.com`
- 비밀번호: `admin123`

### 7-3. 기능 테스트

- ✅ 대시보드 로딩
- ✅ 고객 관리
- ✅ 견적 관리
- ✅ 가격 계산기
- ✅ 직원 관리

**모든 기능이 정상 작동하면 마이그레이션 완료!**

---

## 🎉 완료 후

### Render 서비스 정지

마이그레이션이 완전히 성공하고 며칠간 안정적으로 작동하면:

1. https://dashboard.render.com 접속
2. 기존 서비스 정지 또는 삭제

### 비용 절감 확인

- **이전**: $14/월
- **이후**: $0/월
- **연간 절감**: $168

---

## 🆘 문제 발생 시

### 문제 1: Vercel 빌드 실패

```bash
# 로컬에서 먼저 테스트
cd backend
npm run vercel-build
```

### 문제 2: DATABASE_URL 오류

- Supabase 연결 문자열 확인
- `pooler.supabase.com` 사용 확인
- 포트 `6543` 사용 확인

### 문제 3: CORS 오류

`backend/src/app.ts`에서 CORS 설정 확인:
```typescript
app.use(cors({
  origin: 'https://suanhasaigon247-manager.netlify.app',
  credentials: true
}));
```

---

## 📞 각 단계 완료 시

각 단계를 완료하시면 저에게 알려주세요. 다음 단계로 안내하거나 문제 해결을 도와드리겠습니다!

**지금 Step 1 (Supabase 프로젝트 생성)부터 시작하세요!**
