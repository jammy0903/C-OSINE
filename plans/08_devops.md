# 08. DevOps 및 배포 계획 (DevOps & Deployment)

---

## 1. 개발 환경 설정

### 1.1 필수 도구
```bash
# Backend
Python 3.11+
pip / pipenv / poetry

# Frontend
Node.js 20+
npm / yarn / pnpm

# Infrastructure
Docker 24+
Docker Compose 2+
Git

# Optional (로컬 LLM)
Ollama
```

### 1.2 로컬 개발 환경 세팅

```bash
# 1. 저장소 클론
git clone git@github.com:jammy0903/C-OSINE.git
cd C-OSINE

# 2. Backend 설정
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .env 파일 편집

# 3. Frontend 설정
cd ../frontend
npm install
cp .env.example .env.local

# 4. Docker sandbox 이미지 빌드
cd ../docker
docker build -t coslab-sandbox .

# 5. Ollama 설정 (로컬 LLM)
ollama pull qwen2.5-coder:7b

# 6. 개발 서버 실행
# Terminal 1: Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Ollama (이미 실행 중이 아니면)
ollama serve
```

### 1.3 환경 변수

**Backend (.env)**
```env
# App
APP_ENV=development
DEBUG=true
API_PREFIX=/api/v1

# LLM
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_ENABLED=true

# Docker Sandbox
SANDBOX_IMAGE=coslab-sandbox
SANDBOX_TIMEOUT=10
SANDBOX_MEMORY_LIMIT=128m
SANDBOX_CPU_LIMIT=0.5
```

**Frontend (.env.local)**
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=COSLAB
```

---

## 2. Docker 구성

### 2.1 프로젝트 구조
```
/docker
├── Dockerfile.backend      # Backend 이미지
├── Dockerfile.frontend     # Frontend 이미지 (nginx)
├── Dockerfile.sandbox      # C 실행 샌드박스
├── docker-compose.yml      # 개발용
├── docker-compose.prod.yml # 프로덕션용
├── nginx.conf              # Frontend nginx 설정
└── seccomp-profile.json    # 샌드박스 seccomp
```

### 2.2 docker-compose.yml (개발)
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - APP_ENV=development
      - OLLAMA_HOST=http://host.docker.internal:11434
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - sandbox-builder

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1

  sandbox-builder:
    build:
      context: ./docker
      dockerfile: Dockerfile.sandbox
    image: coslab-sandbox
    command: echo "Sandbox image built"
```

### 2.3 docker-compose.prod.yml (프로덕션)
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - frontend_build:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    expose:
      - "8000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - APP_ENV=production
      - OLLAMA_HOST=http://ollama:11434
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
      target: production
    volumes:
      - frontend_build:/app/dist

  ollama:
    image: ollama/ollama
    expose:
      - "11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          devices:
            - capabilities: [gpu]  # GPU 사용 시

volumes:
  frontend_build:
  ollama_data:
```

### 2.4 Dockerfile.sandbox
```dockerfile
FROM gcc:13-bookworm

# 보안: 비특권 사용자
RUN useradd -r -s /bin/false -d /sandbox sandbox && \
    mkdir -p /sandbox && \
    chown sandbox:sandbox /sandbox

# 불필요한 도구 제거
RUN apt-get update && apt-get remove -y \
    curl wget git \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

USER sandbox
WORKDIR /sandbox

# 기본 명령 없음 (외부에서 지정)
CMD ["echo", "Ready"]
```

---

## 3. CI/CD 파이프라인

### 3.1 GitHub Actions

**.github/workflows/ci.yml**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Backend Lint
        run: |
          pip install ruff
          ruff check backend/

      - name: Frontend Lint
        run: |
          cd frontend && npm ci && npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      docker:
        image: docker:dind
        options: --privileged
    steps:
      - uses: actions/checkout@v4

      - name: Build Sandbox Image
        run: docker build -t coslab-sandbox docker/

      - name: Backend Tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=services --cov-report=xml

      - name: Frontend Tests
        run: |
          cd frontend
          npm ci
          npm test -- --coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v4

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker Images
        run: |
          docker compose -f docker-compose.prod.yml build

      - name: Push to Registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker compose -f docker-compose.prod.yml push
```

**.github/workflows/deploy.yml**
```yaml
name: Deploy

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/coslab
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

---

## 4. VPS 서버 설정

### 4.1 초기 서버 설정
```bash
# 1. 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 2. Docker 설치
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Docker Compose 설치
sudo apt install docker-compose-plugin

# 4. 방화벽 설정
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 5. 프로젝트 디렉토리 생성
sudo mkdir -p /opt/coslab
sudo chown $USER:$USER /opt/coslab

# 6. 저장소 클론
cd /opt/coslab
git clone git@github.com:jammy0903/C-OSINE.git .

# 7. 환경 변수 설정
cp .env.example .env
nano .env  # 프로덕션 값으로 수정

# 8. Ollama 모델 다운로드 (VPS에서)
docker run -d -v ollama_data:/root/.ollama ollama/ollama
docker exec -it <container_id> ollama pull qwen2.5-coder:7b
```

### 4.2 SSL 인증서 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install certbot

# 인증서 발급
sudo certbot certonly --standalone -d coslab.example.com

# 자동 갱신 설정
sudo crontab -e
# 추가: 0 0 1 * * certbot renew --quiet
```

---

## 5. 모니터링 (선택)

### 5.1 간단한 모니터링 (MVP)
```yaml
# docker-compose.prod.yml에 추가
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 5.2 고급 모니터링 (나중에)
```yaml
# Prometheus + Grafana
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

---

## 6. 백업 전략

### 6.1 데이터 백업
```bash
# 크론잡 설정
0 3 * * * /opt/coslab/scripts/backup.sh
```

**backup.sh**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/opt/backups

# SQLite 백업 (MVP)
cp /opt/coslab/data/coslab.db $BACKUP_DIR/coslab_$DATE.db

# Ollama 모델 백업 (선택)
docker run --rm -v ollama_data:/data -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/ollama_$DATE.tar.gz /data

# 오래된 백업 삭제 (30일)
find $BACKUP_DIR -mtime +30 -delete
```

---

## 7. 배포 체크리스트

### 첫 배포 전
- [ ] VPS 서버 준비
- [ ] 도메인 연결
- [ ] SSL 인증서 발급
- [ ] 환경 변수 설정
- [ ] Docker 이미지 빌드
- [ ] Ollama 모델 다운로드
- [ ] 방화벽 설정
- [ ] 백업 크론잡 설정

### 매 배포 시
- [ ] 테스트 통과 확인
- [ ] 환경 변수 변경 사항 확인
- [ ] 마이그레이션 필요 여부 확인
- [ ] 롤백 계획 준비

---

## 8. 롤백 절차

```bash
# 1. 이전 버전 태그 확인
docker images | grep coslab

# 2. 롤백
cd /opt/coslab
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml up -d

# 또는 Docker 이미지로 직접 롤백
docker compose -f docker-compose.prod.yml down
docker tag coslab-backend:previous coslab-backend:latest
docker compose -f docker-compose.prod.yml up -d
```
