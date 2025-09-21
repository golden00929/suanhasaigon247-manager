# 자동 백업 설정 가이드

## 개요

이 가이드는 Suanha Manager 시스템의 자동 백업을 설정하는 방법을 안내합니다.

## 파일 구조

```
backups/
├── create_automated_backup.js     # 자동 백업 스크립트 (전체 데이터)
├── backup_users.js               # 사용자 전용 백업 스크립트
├── package.json                  # 의존성 관리
├── BACKUP_RESTORE_GUIDE.md       # 백업/복원 가이드
├── AUTOMATION_SETUP.md           # 이 파일
└── [YYYYMMDD]/                   # 날짜별 백업 폴더
    └── *.json                    # 백업 파일들
```

## 설정 방법

### 1. 의존성 설치

```bash
cd backups
npm install axios
```

### 2. 수동 백업 테스트

```bash
# 전체 데이터 백업
node create_automated_backup.js

# 사용자 데이터만 백업
cd 20250921
node backup_users.js
```

### 3. 자동화 설정 옵션

#### 옵션 A: Crontab (Linux/Mac)

```bash
# crontab 편집
crontab -e

# 추가할 내용 (매일 새벽 2시)
0 2 * * * cd /path/to/project/backups && node create_automated_backup.js >> backup.log 2>&1

# 추가할 내용 (매주 일요일 새벽 3시)
0 3 * * 0 cd /path/to/project/backups && node create_automated_backup.js >> weekly_backup.log 2>&1
```

#### 옵션 B: Windows 작업 스케줄러

1. **작업 스케줄러 열기**
   - `Win + R` → `taskschd.msc`

2. **기본 작업 만들기**
   - 이름: "Suanha Manager Auto Backup"
   - 설명: "자동 데이터베이스 백업"

3. **트리거 설정**
   - 매일 또는 매주 원하는 시간 설정

4. **동작 설정**
   - 프로그램: `node.exe`
   - 인수: `create_automated_backup.js`
   - 시작 위치: `C:\path\to\project\backups`

#### 옵션 C: GitHub Actions (클라우드)

`.github/workflows/backup.yml` 파일 생성:

```yaml
name: Automated Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 매일 새벽 2시 (UTC)
  workflow_dispatch:     # 수동 실행 가능

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backups
          npm install

      - name: Run backup
        run: |
          cd backups
          node create_automated_backup.js

      - name: Commit backup files
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add backups/
          git commit -m "Automated backup $(date)" || exit 0
          git push
```

## 모니터링 설정

### 1. 로그 파일 생성

```bash
# 백업 스크립트에 로깅 추가
node create_automated_backup.js >> backup.log 2>&1
```

### 2. 이메일 알림 (Node.js)

```javascript
// email_notifier.js
const nodemailer = require('nodemailer');

async function sendBackupNotification(result) {
  const transporter = nodemailer.createTransporter({
    // 이메일 설정
  });

  const mailOptions = {
    from: 'system@suanha.com',
    to: 'admin@suanha.com',
    subject: `백업 ${result.success ? '성공' : '실패'} - ${new Date().toLocaleDateString()}`,
    text: `백업 결과: ${JSON.stringify(result, null, 2)}`
  };

  await transporter.sendMail(mailOptions);
}
```

### 3. 디스크 공간 모니터링

```bash
# 백업 폴더 크기 확인
du -sh backups/

# 오래된 백업 파일 정리 (30일 이상)
find backups/ -name "*.json" -mtime +30 -delete
```

## 백업 전략 권장사항

### 1. 3-2-1 백업 규칙
- **3개 복사본**: 원본 + 백업 2개
- **2개 다른 매체**: 로컬 + 클라우드
- **1개 오프사이트**: 외부 위치 저장

### 2. 백업 주기
- **일일 백업**: 사용자 데이터 (중요)
- **주간 백업**: 전체 데이터 (포괄적)
- **월간 백업**: 장기 보관용

### 3. 보안 고려사항
- 백업 파일 암호화
- 접근 권한 제한
- 정기적인 복원 테스트

## 실행 예시

### 즉시 백업 실행

```bash
cd backups
node create_automated_backup.js
```

**예상 출력:**
```
🤖 자동 백업 시작...
📅 백업 날짜: 20250921
📁 백업 디렉토리 생성: /path/to/backups/20250921
🔐 관리자 인증 중...
✅ 관리자 인증 완료
👥 사용자 데이터 백업 중...
🏢 고객 데이터 백업 중...
📋 견적 데이터 백업 중...
💰 가격 데이터 백업 중...
💾 백업 완료!
📄 파일명: automated_full_backup_20250921_1758440000000.json
📊 백업 통계:
   - 사용자: 8명 (관리자: 3명, 직원: 5명)
   - 고객: 15명
   - 견적: 25개
   - 가격 카테고리: 5개
🎉 자동 백업 성공!
```

## 문제 해결

### 일반적인 오류

1. **네트워크 오류**
   ```
   Error: ECONNREFUSED
   ```
   - API 서버 상태 확인
   - 인터넷 연결 확인

2. **인증 실패**
   ```
   Error: 관리자 로그인 실패
   ```
   - 관리자 계정 비밀번호 확인
   - API 엔드포인트 확인

3. **디스크 공간 부족**
   ```
   Error: ENOSPC
   ```
   - 디스크 공간 확인
   - 오래된 백업 파일 정리

### 로그 확인

```bash
# 최근 백업 로그 확인
tail -f backup.log

# 백업 실패 로그만 필터링
grep "실패\|Error" backup.log
```

## 연락처 및 지원

- **기술 지원**: 개발팀
- **시스템 관리**: IT 관리자
- **비상 연락처**: 시스템 관리자

---
**작성일**: 2025-09-21
**버전**: 1.0
**호환**: Node.js 18+, Suanha Manager v1.1.0+