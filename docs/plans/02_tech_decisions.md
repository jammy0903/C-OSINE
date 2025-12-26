# 02. 기술 결정 (Technical Decisions)

---

## 1. 결정 요약

| 항목 | 결정 | 이유 |
|------|------|------|
| Frontend Framework | React + TypeScript | 컴포넌트 기반, 타입 안정성 |
| State Management | Recoil | 간단한 API, React 친화적 |
| CSS | Tailwind CSS | 빠른 개발, 일관된 디자인 |
| Code Editor | Monaco Editor | VSCode와 동일, 풍부한 기능 |
| Visualization | D3.js + Canvas | 유연한 커스터마이징 |
| Backend Framework | FastAPI | 빠름, 자동 문서화, 타입 힌트 |
| LLM | 로컬 LLM (Ollama) | 비용 없음, 프라이버시 |
| LLM Model | Qwen2.5-Coder / DeepSeek-Coder-V2 | 2025년 기준 최고 코드 모델 |
| Sandbox | Docker | 격리, 이식성, 리소스 제한 |
| Database | SQLite (MVP) → PostgreSQL (확장) | MVP는 간단하게, 나중에 확장 |
| Deployment | VPS (Docker Compose) | Docker 실행 가능, 유연함 |

---

## 2. Frontend 상세

### 2.1 React + TypeScript
```
이유:
- 컴포넌트 기반 아키텍처
- TypeScript로 타입 안정성 확보
- 풍부한 생태계
- 채용 시장에서 수요 높음

버전: React 18+, TypeScript 5+
```

### 2.2 Recoil
```
이유:
- Redux보다 간단한 API
- React와 자연스러운 통합
- atom/selector 패턴으로 상태 관리
- 비동기 상태 처리 용이

대안 고려:
- Redux: 보일러플레이트 많음
- Zustand: 더 간단하지만 Recoil이 더 구조적
- Jotai: 비슷하지만 Recoil이 문서 풍부
```

### 2.3 Tailwind CSS
```
이유:
- 유틸리티 퍼스트 접근
- 커스텀 CSS 최소화
- 일관된 디자인 시스템
- 빠른 프로토타이핑

설정:
- tailwind.config.js에 커스텀 테마 정의
- 다크모드 지원 (class 기반)
```

### 2.4 Monaco Editor
```
이유:
- VSCode와 동일한 에디터
- C 언어 구문 강조 기본 지원
- 자동 완성, 에러 표시
- 다양한 테마

설정:
- 언어: C
- 테마: vs-dark
- 폰트 크기: 14px
- 미니맵: 비활성화 (공간 절약)
```

### 2.5 D3.js + Canvas
```
이유:
- SVG보다 Canvas가 대량 렌더링에 유리
- D3.js로 데이터 바인딩/애니메이션
- 메모리 블록 시각화에 적합

대안 고려:
- Three.js: 3D 불필요
- Pixi.js: 게임 엔진, 오버스펙
- 순수 Canvas: D3.js 유틸리티 활용
```

---

## 3. Backend 상세

### 3.1 FastAPI
```
이유:
- 고성능 (Starlette + Pydantic 기반)
- 자동 OpenAPI 문서 생성
- 타입 힌트 기반 검증
- 비동기 지원

버전: FastAPI 0.100+
```

### 3.2 프로젝트 구조
```
/backend
├── main.py              # 진입점, CORS 설정
├── config.py            # 환경 설정
├── routers/
│   ├── ai.py           # /ai/* 라우터
│   ├── runner.py       # /c/* 라우터
│   ├── simulator.py    # /os/* 라우터
│   └── stats.py        # /track/* 라우터
├── services/
│   ├── llm_service.py  # Ollama 연동
│   ├── compiler.py     # gcc 컴파일
│   ├── executor.py     # Docker 실행
│   └── memory_sim.py   # 메모리 시뮬레이션
├── models/
│   ├── requests.py     # 요청 스키마
│   └── responses.py    # 응답 스키마
└── utils/
    ├── docker_utils.py # Docker 헬퍼
    └── sanitizer.py    # 입력 검증
```

---

## 4. LLM 상세

### 4.1 Ollama + 코드 특화 모델
```
선택지 (2025년 12월 기준):
1. Qwen2.5-Coder-32B - 코드 특화, 한국어 지원
2. DeepSeek-Coder-V2 - 코드 설명에 강함
3. CodeLlama-34B - Meta 코드 모델

추천: Qwen2.5-Coder (한국어 + 코드 둘 다 강함)
```

### 4.2 Ollama 설정
```bash
# 설치
curl -fsSL https://ollama.com/install.sh | sh

# 모델 다운로드
ollama pull qwen2.5-coder:32b

# API 엔드포인트
http://localhost:11434/api/generate
```

### 4.3 프롬프트 템플릿
```
시스템 프롬프트:
"당신은 C 언어와 운영체제 전문 튜터입니다.
학생이 이해하기 쉽게 설명하고, 예제 코드를 제공하세요.
답변은 한국어로 작성하세요."

사용자 프롬프트:
"{user_question}"
```

---

## 5. Sandbox (Docker) 상세

### 5.1 Docker 이미지
```dockerfile
FROM gcc:latest

# 보안: 비특권 사용자
RUN useradd -m sandbox
USER sandbox
WORKDIR /home/sandbox

# 리소스 제한은 docker run에서 설정
```

### 5.2 실행 명령
```bash
docker run \
  --rm \
  --network none \           # 네트워크 차단
  --memory=128m \            # 메모리 제한
  --cpus=0.5 \               # CPU 제한
  --pids-limit=50 \          # 프로세스 수 제한
  --read-only \              # 읽기 전용 파일시스템
  --tmpfs /tmp:size=10m \    # 쓰기 가능 임시 공간
  -v /code:/code:ro \        # 코드 마운트 (읽기 전용)
  coslab-sandbox \
  timeout 10 sh -c "gcc /code/main.c -o /tmp/a.out && /tmp/a.out"
```

### 5.3 리소스 제한
| 리소스 | 제한 |
|--------|------|
| 메모리 | 128MB |
| CPU | 0.5 코어 |
| 실행 시간 | 10초 |
| 프로세스 수 | 50개 |
| 디스크 | 10MB (tmpfs) |
| 네트워크 | 없음 |

---

## 6. Database (확장용)

### 6.1 MVP: SQLite
```
이유:
- 설정 필요 없음
- 파일 하나로 관리
- 소규모 사용자에 충분

스키마 (나중에):
- users: 사용자 정보
- sessions: 학습 세션
- stats: 학습 통계
```

### 6.2 확장: PostgreSQL
```
마이그레이션 조건:
- 동시 사용자 50명 이상
- 복잡한 쿼리 필요
- 데이터 분석 필요
```

---

## 7. Deployment

### 7.1 VPS 스펙 (권장)
| 항목 | 최소 | 권장 |
|------|------|------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4GB | 8GB (LLM용) |
| Storage | 20GB | 50GB |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |

### 7.2 Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  ollama_data:
```

---

## 8. 미결정 사항

| 항목 | 옵션 | 결정 시점 |
|------|------|----------|
| 인증 방식 | JWT vs Session | MVP 이후 |
| CDN | Cloudflare vs 없음 | 배포 시 |
| 모니터링 | Prometheus vs 없음 | 배포 시 |
| 로깅 | ELK vs 파일 | 배포 시 |
