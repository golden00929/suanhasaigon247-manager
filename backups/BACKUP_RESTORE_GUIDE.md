# Suanha Manager 백업 및 복원 가이드

## 백업 현황 (2025-09-21)

### 생성된 백업
- **Git 태그**: `v1.1.0-stable` - 현재 안정 버전 코드베이스
- **데이터베이스 백업**: `backups/20250921/production_users_backup_2025-09-21_*.json`
  - 총 사용자: 8명 (관리자 3명, 직원 5명)
  - 백업 시간: 2025-09-21
  - 포함 데이터: 전체 사용자 정보, 권한, 프로필 데이터

## 백업 파일 구조

```
backups/
├── 20250921/
│   ├── backup_users.js                           # 백업 스크립트
│   ├── production_users_backup_2025-09-21_*.json # 백업된 사용자 데이터
│   ├── package.json                              # 의존성
│   └── node_modules/                             # 라이브러리
└── BACKUP_RESTORE_GUIDE.md                       # 이 가이드
```

## 복원 방법

### 1. 코드 복원 (Git 태그 사용)

```bash
# 현재 안정 버전으로 되돌리기
git checkout v1.1.0-stable

# 또는 새 브랜치 생성
git checkout -b restore-stable v1.1.0-stable
```

### 2. 데이터베이스 복원

#### 2-1. 수동 복원 (관리자 페이지 사용)

1. **백업 파일 확인**
   ```bash
   cat backups/20250921/production_users_backup_2025-09-21_*.json
   ```

2. **관리자 로그인**
   - URL: https://suanhasaigon247-manager.netlify.app/login
   - 이메일: `system.admin@suanhasaigon247.com`
   - 비밀번호: `admin123`

3. **사용자 데이터 수동 입력**
   - 계정 관리 페이지에서 백업 파일의 사용자 정보를 참조하여 수동 재생성

#### 2-2. API를 통한 자동 복원

```javascript
// restore_users.js 스크립트 생성 필요
const axios = require('axios');
const fs = require('fs');

async function restoreUsers() {
  // 1. 관리자 로그인
  const loginResponse = await axios.post('https://suanhasaigon247-manager.onrender.com/api/auth/login', {
    email: 'system.admin@suanhasaigon247.com',
    password: 'admin123'
  });

  const token = loginResponse.data.data.token;

  // 2. 백업 파일 읽기
  const backupData = JSON.parse(fs.readFileSync('production_users_backup_2025-09-21_*.json'));

  // 3. 각 사용자 복원 (기존 사용자는 건너뛰기)
  for (const user of backupData.users) {
    try {
      await axios.post('https://suanhasaigon247-manager.onrender.com/api/users', {
        ...user,
        password: 'temp123' // 임시 비밀번호
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.log(`사용자 ${user.email} 복원 실패 (이미 존재할 가능성)`);
    }
  }
}
```

## 백업 스케줄링

### 주간 자동 백업 (권장)

```bash
# crontab 설정 (매주 일요일 02:00)
0 2 * * 0 cd /path/to/project/backups && node create_weekly_backup.js
```

### 수동 백업 실행

```bash
cd "backups/$(date +%Y%m%d)"
mkdir -p .
cp ../20250921/backup_users.js .
cp ../20250921/package.json .
npm install
node backup_users.js
```

## 중요 주의사항

### 보안
- 백업 파일에는 민감한 정보가 포함되어 있습니다
- 백업 파일을 안전한 장소에 보관하세요
- 백업 스크립트의 관리자 비밀번호를 정기적으로 변경하세요

### 데이터 무결성
- 복원 전 현재 데이터를 백업하세요
- 테스트 환경에서 먼저 복원을 테스트하세요
- 복원 후 데이터 검증을 수행하세요

## 백업 검증

```bash
# 백업 파일 유효성 검사
node -e "
const data = JSON.parse(require('fs').readFileSync('production_users_backup_2025-09-21_*.json'));
console.log('백업 검증:');
console.log('- 사용자 수:', data.total_users);
console.log('- 백업 날짜:', data.backup_date);
console.log('- Git 태그:', data.git_tag);
console.log('- 관리자 수:', data.users.filter(u => u.role === 'ADMIN').length);
console.log('- 직원 수:', data.users.filter(u => u.role === 'EMPLOYEE').length);
"
```

## 문제 해결

### 일반적인 문제들

1. **로그인 실패**
   - 관리자 계정 비밀번호 확인
   - API 서버 상태 확인

2. **백업 파일 손상**
   - JSON 형식 검증
   - 파일 크기 확인

3. **권한 오류**
   - 관리자 권한으로 로그인했는지 확인
   - API 토큰 유효성 확인

## 연락처

- 개발팀: 기술적 문제 발생 시
- 시스템 관리자: 서버 접근 권한 필요 시

---
**마지막 업데이트**: 2025-09-21
**백업 버전**: v1.1.0-stable
**검증 상태**: ✅ 완료 (8명 사용자 백업됨)