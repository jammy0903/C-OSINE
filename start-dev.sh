#!/bin/bash

# COSLAB 개발 서버 시작 스크립트
# 백엔드(8000) + 프론트엔드(5173) 동시 실행

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=5173

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# sudo 권한 미리 획득
ensure_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_warn "포트 정리를 위해 sudo 권한이 필요합니다"
        sudo -v
    fi
}

# 포트 점유 프로세스 kill
kill_port() {
    local port=$1
    local pids=$(sudo lsof -t -i:$port 2>/dev/null || true)

    if [ -n "$pids" ]; then
        log_warn "포트 $port 사용 중인 프로세스 발견: $pids"
        echo "$pids" | xargs -r sudo kill -9 2>/dev/null || true
        sleep 1
        log_success "포트 $port 프로세스 종료됨"
    else
        log_info "포트 $port 사용 가능"
    fi
}

# 백엔드 캐시 정리
clean_backend_cache() {
    log_info "백엔드 캐시 정리 중..."
    cd "$SCRIPT_DIR/backend"

    # Python 캐시 삭제
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    find . -type f -name "*.pyo" -delete 2>/dev/null || true
    find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true

    log_success "백엔드 캐시 정리 완료"
}

# 프론트엔드 캐시 정리
clean_frontend_cache() {
    log_info "프론트엔드 캐시 정리 중..."
    cd "$SCRIPT_DIR/frontend"

    # Vite 캐시 삭제
    rm -rf node_modules/.vite 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    rm -rf .eslintcache 2>/dev/null || true

    log_success "프론트엔드 캐시 정리 완료"
}

# 백엔드 시작
start_backend() {
    log_info "========== 백엔드 시작 =========="

    kill_port $BACKEND_PORT
    clean_backend_cache

    cd "$SCRIPT_DIR/backend"

    # 가상환경 체크 (선택사항)
    if [ -d "venv" ]; then
        source venv/bin/activate
        log_info "가상환경 활성화됨"
    fi

    log_info "백엔드 서버 시작 중... (포트 $BACKEND_PORT)"
    python3 main.py &
    BACKEND_PID=$!

    # 백엔드 준비될 때까지 대기
    log_info "백엔드 준비 대기 중..."
    local max_wait=30
    local waited=0

    while ! curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; do
        if [ $waited -ge $max_wait ]; then
            log_error "백엔드 시작 실패 (타임아웃 ${max_wait}초)"
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
        sleep 1
        waited=$((waited + 1))
        echo -n "."
    done
    echo ""

    log_success "백엔드 준비 완료 (PID: $BACKEND_PID)"
    log_success "http://localhost:$BACKEND_PORT"
}

# 프론트엔드 시작
start_frontend() {
    log_info "========== 프론트엔드 시작 =========="

    kill_port $FRONTEND_PORT
    clean_frontend_cache

    cd "$SCRIPT_DIR/frontend"

    # .env 파일 체크
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_warn ".env 파일 없음, .env.example에서 복사"
            cp .env.example .env
        else
            log_error ".env 파일이 필요합니다"
            exit 1
        fi
    fi

    # node_modules 체크
    if [ ! -d "node_modules" ]; then
        log_info "의존성 설치 중..."
        npm install
    fi

    log_info "프론트엔드 서버 시작 중... (포트 $FRONTEND_PORT)"
    npm run dev &
    FRONTEND_PID=$!

    # 프론트엔드 준비될 때까지 대기
    log_info "프론트엔드 준비 대기 중..."
    local max_wait=60
    local waited=0

    while ! curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; do
        if [ $waited -ge $max_wait ]; then
            log_error "프론트엔드 시작 실패 (타임아웃 ${max_wait}초)"
            exit 1
        fi
        sleep 1
        waited=$((waited + 1))
        echo -n "."
    done
    echo ""

    log_success "프론트엔드 준비 완료 (PID: $FRONTEND_PID)"
    log_success "http://localhost:$FRONTEND_PORT"
}

# 종료 처리
cleanup() {
    echo ""
    log_warn "서버 종료 중..."

    # 자식 프로세스 종료
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true

    # 포트 정리
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT

    log_success "정리 완료"
    exit 0
}

# Ctrl+C 핸들러
trap cleanup SIGINT SIGTERM

# 메인 실행
main() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       COSLAB 개발 서버 시작           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
    echo ""

    # sudo 권한 먼저 획득
    ensure_sudo

    # 순차 실행 (race condition 방지)
    start_backend
    echo ""
    start_frontend

    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    log_success "모든 서버 시작 완료!"
    echo ""
    echo -e "  백엔드:    ${BLUE}http://localhost:$BACKEND_PORT${NC}"
    echo -e "  프론트엔드: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo ""
    echo -e "  ${YELLOW}종료: Ctrl+C${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo ""

    # 백그라운드 프로세스 대기
    wait
}

main
