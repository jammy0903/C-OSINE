#!/bin/bash

# C-OSINE Docker 실행 스크립트
# 다른 컴퓨터에서 이것만 실행하면 됨

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════╗"
echo "║        C-OSINE Docker Runner          ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 1. 최신 이미지 받기
echo -e "${YELLOW}[1/3] 최신 이미지 다운로드...${NC}"
docker-compose pull

# 2. 컨테이너 실행
echo -e "${YELLOW}[2/3] 컨테이너 시작...${NC}"
docker-compose up -d

# 3. GCC 이미지 확인
echo -e "${YELLOW}[3/3] GCC 이미지 확인...${NC}"
docker pull gcc:latest 2>/dev/null || true

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║            실행 완료!                  ║"
echo "╠═══════════════════════════════════════╣"
echo "║  Frontend: http://localhost           ║"
echo "║  Backend:  http://localhost:3000      ║"
echo "╠═══════════════════════════════════════╣"
echo "║  Ollama도 실행해주세요:                ║"
echo "║  ollama serve                         ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 로그 보기
echo -e "${CYAN}로그 보기: docker-compose logs -f${NC}"
