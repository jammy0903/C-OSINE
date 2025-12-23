#!/bin/bash

# C-OSINE Docker 빌드 & 푸시 스크립트
# 사용법: ./build-and-push.sh [버전태그]

set -e

VERSION=${1:-latest}
DOCKER_USER="jamm2ic"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════╗"
echo "║     C-OSINE Docker Build & Push       ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 1. Backend 빌드 (TypeScript → JavaScript)
echo -e "${CYAN}[1/4] Backend TypeScript 빌드...${NC}"
cd backend-node
npm run build
cd ..

# 2. Docker 이미지 빌드
echo -e "${CYAN}[2/4] Docker 이미지 빌드...${NC}"
docker build -t $DOCKER_USER/cosine-backend:$VERSION ./backend-node
docker build -t $DOCKER_USER/cosine-frontend:$VERSION ./frontend

# 3. latest 태그 추가
if [ "$VERSION" != "latest" ]; then
    docker tag $DOCKER_USER/cosine-backend:$VERSION $DOCKER_USER/cosine-backend:latest
    docker tag $DOCKER_USER/cosine-frontend:$VERSION $DOCKER_USER/cosine-frontend:latest
fi

# 4. Docker Hub 푸시
echo -e "${CYAN}[3/4] Docker Hub에 푸시...${NC}"
docker push $DOCKER_USER/cosine-backend:$VERSION
docker push $DOCKER_USER/cosine-frontend:$VERSION

if [ "$VERSION" != "latest" ]; then
    docker push $DOCKER_USER/cosine-backend:latest
    docker push $DOCKER_USER/cosine-frontend:latest
fi

# 5. GCC 이미지 미리 pull (선택)
echo -e "${CYAN}[4/4] GCC 이미지 확인...${NC}"
docker pull gcc:latest

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║            빌드 완료!                  ║"
echo "╠═══════════════════════════════════════╣"
echo "║  다른 PC에서:                          ║"
echo "║  docker-compose pull                  ║"
echo "║  docker-compose up -d                 ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"
