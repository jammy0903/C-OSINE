#!/bin/bash

# WSL Docker 설치 스크립트
# 사용법: ./install-docker-wsl.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║      WSL Docker 설치 스크립트         ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 1. Docker 설치
echo -e "${YELLOW}[1/5] Docker 설치 중...${NC}"
curl -fsSL https://get.docker.com | sh

# 2. 현재 유저를 docker 그룹에 추가
echo -e "${YELLOW}[2/5] docker 그룹에 유저 추가...${NC}"
sudo usermod -aG docker $USER

# 3. Docker 서비스 시작 스크립트 생성
echo -e "${YELLOW}[3/5] Docker 시작 스크립트 생성...${NC}"
cat > ~/start-docker.sh << 'EOF'
#!/bin/bash
if ! pgrep -x "dockerd" > /dev/null; then
    sudo dockerd > /dev/null 2>&1 &
    sleep 2
    echo "Docker started"
else
    echo "Docker already running"
fi
EOF
chmod +x ~/start-docker.sh

# 4. .bashrc에 자동시작 추가 (선택)
echo -e "${YELLOW}[4/5] 자동 시작 설정...${NC}"
if ! grep -q "start-docker" ~/.bashrc; then
    echo '# Auto-start Docker' >> ~/.bashrc
    echo '~/start-docker.sh 2>/dev/null' >> ~/.bashrc
fi

# 5. Docker Hub 로그인
echo -e "${YELLOW}[5/5] Docker Hub 로그인...${NC}"
sudo dockerd > /dev/null 2>&1 &
sleep 3
echo "theoddl11!" | docker login -u jamm2ic@gmail.com --password-stdin || echo "로그인 스킵 (나중에 docker login 실행)"

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║          설치 완료!                   ║"
echo "╠═══════════════════════════════════════╣"
echo "║  터미널 재시작 또는:                  ║"
echo "║  newgrp docker                        ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 비밀번호 히스토리에서 제거
history -c 2>/dev/null || true
