#!/bin/bash

# 🛡️ Suanha Manager 백업 스크립트
# 베타 버전 v1.0.0 백업 도구

set -e  # 오류 발생시 스크립트 중단

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 날짜
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
PROJECT_NAME="suanha-manager"

echo -e "${BLUE}🛡️ Suanha Manager 백업 시스템${NC}"
echo -e "${BLUE}================================${NC}"

# 백업 디렉토리 생성
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}✅ 백업 디렉토리 생성: $BACKUP_DIR${NC}"
fi

# 1. Git 상태 확인
echo -e "\n${YELLOW}📊 Git 상태 확인...${NC}"
git status --porcelain
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Git 저장소 상태 확인 완료${NC}"
else
    echo -e "${RED}❌ Git 저장소가 초기화되지 않았습니다${NC}"
    exit 1
fi

# 2. 현재 변경사항 커밋 (옵션)
if [ ! -z "$(git status --porcelain)" ]; then
    echo -e "\n${YELLOW}⚠️ 커밋되지 않은 변경사항이 있습니다${NC}"
    read -p "변경사항을 커밋하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}💾 변경사항 커밋 중...${NC}"
        git add .
        git commit -m "🔄 자동 백업 전 변경사항 커밋 - $DATE

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
        echo -e "${GREEN}✅ 변경사항 커밋 완료${NC}"
    fi
fi

# 3. 태그 생성
echo -e "\n${BLUE}🏷️ 백업 태그 생성...${NC}"
BACKUP_TAG="backup-$DATE"
git tag -a "$BACKUP_TAG" -m "📦 자동 백업 - $DATE

베타 버전 v1.0.0 기반 백업
생성 시간: $(date)
백업 스크립트에 의한 자동 생성"

echo -e "${GREEN}✅ 백업 태그 생성: $BACKUP_TAG${NC}"

# 4. 프로젝트 압축
echo -e "\n${BLUE}📦 프로젝트 압축 중...${NC}"
BACKUP_FILE="$BACKUP_DIR/${PROJECT_NAME}_${DATE}.tar.gz"

tar -czf "$BACKUP_FILE" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="build" \
    --exclude=".git/objects" \
    --exclude="*.log" \
    --exclude=".cache" \
    --exclude="backups" \
    .

echo -e "${GREEN}✅ 프로젝트 압축 완료: $BACKUP_FILE${NC}"

# 5. 백업 정보 저장
echo -e "\n${BLUE}📝 백업 정보 저장...${NC}"
BACKUP_INFO="$BACKUP_DIR/backup_${DATE}.info"

cat > "$BACKUP_INFO" << EOF
# 🛡️ Suanha Manager 백업 정보
백업 날짜: $(date)
백업 파일: $BACKUP_FILE
Git 태그: $BACKUP_TAG
프로젝트 버전: 베타 v1.0.0

## Git 정보
커밋 해시: $(git rev-parse HEAD)
브랜치: $(git branch --show-current)
마지막 커밋: $(git log -1 --pretty=format:"%h - %s (%cr)")

## 백업 내용
- 프론트엔드 소스코드 (React + TypeScript)
- 백엔드 준비 코드 (Node.js)
- 설정 파일들
- 문서 (README, CLAUDE.md)
- Git 히스토리 (objects 제외)

## 복원 방법
1. 압축 해제: tar -xzf $BACKUP_FILE
2. 의존성 설치: cd frontend && npm install
3. 개발 서버 실행: npm run dev

## 태그로 복원
git checkout $BACKUP_TAG
EOF

echo -e "${GREEN}✅ 백업 정보 저장: $BACKUP_INFO${NC}"

# 6. 백업 파일 크기 확인
BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo -e "\n${BLUE}📊 백업 결과${NC}"
echo -e "파일: $BACKUP_FILE"
echo -e "크기: $BACKUP_SIZE"
echo -e "태그: $BACKUP_TAG"

# 7. 오래된 백업 정리 (30일 이상)
echo -e "\n${YELLOW}🧹 오래된 백업 정리...${NC}"
find "$BACKUP_DIR" -name "${PROJECT_NAME}_*.tar.gz" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "backup_*.info" -mtime +30 -delete 2>/dev/null || true
echo -e "${GREEN}✅ 오래된 백업 정리 완료${NC}"

# 8. 완료 메시지
echo -e "\n${GREEN}🎉 백업 완료!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "백업 파일: ${GREEN}$BACKUP_FILE${NC}"
echo -e "백업 크기: ${GREEN}$BACKUP_SIZE${NC}"
echo -e "Git 태그: ${GREEN}$BACKUP_TAG${NC}"
echo -e "\n${YELLOW}💡 복원 방법:${NC}"
echo -e "tar -xzf $BACKUP_FILE"
echo -e "cd frontend && npm install && npm run dev"
echo -e "\n${YELLOW}🏷️ 태그로 복원:${NC}"
echo -e "git checkout $BACKUP_TAG"

exit 0