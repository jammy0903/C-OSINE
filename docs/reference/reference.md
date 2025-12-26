# C-OSINE Quick Reference

> 모든 계획 문서(plans/)에서 핵심 사항만 추출한 통합 참조 문서

---

## 1. 프로젝트 개요

**C-OSINE** = C & Operating System Interactive Education
- C 언어 학습 + OS 개념 시각화 + AI 튜터
- **100% 무료** - Ollama + Qwen2.5-Coder:7b (로컬)

### MVP 기능 (우선순위 순)
| 순위 | 기능 | 설명 | API |
|------|------|------|-----|
| 1 | AI 튜터 | C/OS 질문 답변 | `/ai/ask` |
| 2 | C 코드 실행기 | 브라우저에서 C 컴파일/실행 | `/c/run` |
| 3 | 메모리 시각화 | 스택/힙 교육용 시뮬레이터 | `/os/sim/memory/*` |

---

## 2. 기술 스택 결정

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | React + TypeScript | Tailwind |
| Editor | Monaco Editor | VSCode와 동일 |
| Visualization | Canvas | 메모리 블록 시각화 |
| Backend (채점) | Node.js + Express | Prisma ORM |
| Backend (시뮬) | FastAPI (Python) | 메모리 시각화 |
| LLM | **Ollama + Qwen2.5-Coder** | 7B 모델, 로컬, 무료 |
| Database | SQLite (Prisma) | 문제 DB |
| 배포 | VPS + Docker Compose | Ubuntu 22.04 |

---

## 3. API 엔드포인트

### 3.1 AI 튜터
```
POST /api/v1/ai/ask
Body: {
  message: string,           // 1-2000자
  context?: ChatMessage[]    // 최대 10개
}
Response: {
  success: boolean,
  data: { response: string, code_examples: [...] }
}
```

### 3.2 C 코드 실행
```
POST /api/v1/c/run
Body: {
  code: string,      // 1-50000자
  stdin?: string,    // 기본: ""
  timeout?: number   // 기본: 10, 최대: 30
}
Response: {
  success: boolean,
  data: { compiled, executed, stdout, stderr, exit_code, execution_time_ms }
}
```

### 3.3 메모리 시뮬레이터
```
POST /api/v1/os/sim/memory/init     # 초기화
POST /api/v1/os/sim/memory/malloc   # 할당
POST /api/v1/os/sim/memory/free     # 해제
POST /api/v1/os/sim/memory/stack/push  # 스택 푸시
```

### 3.4 OS 스케줄러 (MVP 이후)
```
POST /api/v1/os/sim/cpu/schedule
Body: {
  algorithm: 'fcfs'|'sjf'|'rr'|'priority',
  time_quantum?: number,
  processes: [{ pid, arrival, burst, priority }]
}
```

### Rate Limiting
| 엔드포인트 | 제한 |
|------------|------|
| /ai/ask | 10/min |
| /c/run | 20/min |
| /os/sim/* | 60/min |

### 에러 코드
| 코드 | HTTP | 설명 |
|------|------|------|
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| COMPILATION_ERROR | 400 | C 코드 컴파일 실패 |
| EXECUTION_TIMEOUT | 408 | 실행 시간 초과 |
| RUNTIME_ERROR | 400 | 런타임 에러 |
| LLM_ERROR | 503 | LLM 서비스 오류 |

### API 문서 (Swagger)
```
http://localhost:3000/api-docs       # Swagger UI (인터랙티브)
http://localhost:3000/api-docs.json  # OpenAPI 3.0 JSON
```

| Tag | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| **Problems** | GET | `/api/problems` | 문제 목록 |
| | GET | `/api/problems/:id` | 문제 상세 |
| **Submissions** | POST | `/api/submissions` | 제출 생성 |
| | GET | `/api/submissions/user/:uid` | 사용자 제출 기록 |
| | GET | `/api/submissions/solved/:uid` | solved/attempted 분리 반환 |
| **Users** | GET | `/api/users` | 전체 사용자 (Admin) |
| | POST | `/api/users/register` | 사용자 등록/조회 |
| | GET | `/api/users/:uid` | 사용자 정보 |
| | GET | `/api/users/:uid/role` | role + isAdmin |
| **C Runner** | POST | `/api/c/run` | C 코드 실행 |
| | POST | `/api/c/judge` | 테스트케이스 채점 |
| **Memory** | POST | `/api/memory/trace` | 메모리 시뮬레이션 |

---

## 4. 보안 핵심 사항

### 4.1 Docker 샌드박스 설정
```bash
docker run \
  --rm \
  --network none \           # 네트워크 차단
  --memory=128m \            # 메모리 128MB
  --cpus=0.5 \               # CPU 50%
  --pids-limit=50 \          # 프로세스 50개
  --read-only \              # 읽기 전용
  --tmpfs /tmp:size=10m \    # 쓰기용 10MB
  --security-opt no-new-privileges:true \
  --security-opt seccomp:seccomp-profile.json \
  --cap-drop ALL
```

### 4.2 금지된 코드 패턴
```python
FORBIDDEN_PATTERNS = [
    r'system\s*\(',           # system()
    r'exec[lvpe]*\s*\(',      # exec family
    r'fork\s*\(',             # fork()
    r'popen\s*\(',            # popen()
    r'__asm__',               # inline asm
    r'#\s*include\s*<\s*unistd\.h',
    r'#\s*include\s*<\s*sys/',
    r'#\s*include\s*<\s*pthread\.h',
    r'#\s*include\s*<\s*signal\.h',
]
```

### 4.3 허용되는 C 헤더
```c
// 허용
#include <stdio.h>   #include <stdlib.h>   #include <string.h>
#include <math.h>    #include <ctype.h>    #include <limits.h>
#include <stdbool.h> #include <stdint.h>

// 금지
#include <unistd.h>  #include <sys/socket.h>  #include <pthread.h>
```

### 4.4 차단되는 syscall (seccomp)
- `fork`, `clone`, `vfork` - Fork bomb 방지
- `execve` - 다른 프로그램 실행 방지
- `socket`, `connect`, `bind` - 네트워크 차단
- `ptrace` - 디버깅/인젝션 방지
- `mount`, `umount` - 파일시스템 조작 방지

---

## 5. 데이터 모델 핵심

### 5.1 메모리 상태
```typescript
interface MemoryState {
  session_id: string;
  heap: {
    total_size: number;
    used_size: number;
    blocks: Array<{ address, size, var_name, status: 'allocated'|'freed' }>;
    free_list: Array<{ start, size }>;
  };
  stack: {
    total_size: number;
    sp: number;  // 스택 포인터
    frames: Array<{
      id: number;
      function_name: string;
      base_pointer: number;
      variables: Array<{ name, type, address, size, value }>;
    }>;
  };
}
```

### 5.2 스케줄링 결과
```typescript
interface ScheduleResult {
  algorithm: 'fcfs' | 'sjf' | 'rr' | 'priority';
  gantt_chart: Array<{ pid, start, end }>;
  metrics: {
    avg_waiting_time: number;
    avg_turnaround_time: number;
    cpu_utilization: number;
  };
  per_process: Array<{ pid, waiting_time, turnaround_time }>;
}
```

### 5.3 Pydantic 스키마 (Backend)
```python
class RunCodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000)
    stdin: str = Field(default="", max_length=10000)
    timeout: int = Field(default=10, ge=1, le=30)

class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: list[ChatMessage] = Field(default=[], max_items=10)
```

---

## 6. 프로젝트 구조

```
/backend-node               # Node.js + Express + TypeScript
├── src/
│   ├── config/
│   │   └── env.ts         # Zod 환경변수 스키마
│   ├── modules/
│   │   ├── c/             # C 코드 실행
│   │   ├── memory/        # 메모리 시뮬레이션
│   │   ├── problems/      # 문제 관리
│   │   ├── submissions/   # 제출 관리
│   │   └── users/         # 사용자 관리
│   └── app.ts
├── prisma/
│   └── schema.prisma
└── .env.example

/frontend                   # React 18 + TypeScript
├── src/
│   ├── config/
│   │   └── env.ts         # Zod 환경변수 스키마
│   ├── features/          # 기능별 모듈
│   │   ├── chat/          # AI 튜터 채팅
│   │   │   ├── hooks/     # 채팅 로직 (useChat)
│   │   │   └── components/# UI 컴포넌트
│   │   ├── memory/        # 메모리 시각화
│   │   └── problems/      # 문제 목록 + 에디터
│   │       ├── hooks/     # 문제 로직 (useProblems, useCodeEditor)
│   │       └── constants.ts
│   ├── components/        # 공용 UI 컴포넌트
│   │   └── ui/            # shadcn/ui
│   ├── layouts/           # 페이지 레이아웃
│   ├── pages/             # 라우트 페이지
│   ├── services/          # API 클라이언트
│   ├── stores/            # Zustand 스토어
│   └── hooks/             # 커스텀 훅
├── tests/
│   ├── unit/
│   ├── component/
│   └── e2e/
├── tsconfig.json          # @/* → ./src/* alias
├── vite.config.ts         # path alias 설정
└── .env.example

### Path Alias
```typescript
// 상대경로 대신 @/ 사용
import { useStore } from '@/stores/store';
import { config } from '@/config';
import { Button } from '@/components/ui/button';

// 설정: tsconfig.json + vite.config.ts
// @/* → src/*
```

/docs                       # 문서
├── plans/                 # 설계/계획 문서
├── reference/             # 참조 문서
└── worklogs/              # 작업 로그
```

---

## 7. 구현 순서

```
1. 백엔드 기본 구조
   └── FastAPI + CORS + /health

2. C 코드 실행기 (핵심)
   ├── Docker 샌드박스 이미지 빌드
   ├── /c/run 엔드포인트
   └── 보안 검증 로직

3. AI 튜터
   ├── Ollama 연동
   ├── /ai/ask 엔드포인트
   └── 프롬프트 템플릿

4. 메모리 시뮬레이터
   ├── 메모리 상태 모델
   ├── /os/sim/memory/* 엔드포인트
   └── 애니메이션 데이터

5. 프론트엔드
   ├── React + TypeScript 설정
   ├── Monaco Editor 통합
   ├── 채팅 UI
   └── 메모리 시각화
```

---

## 8. 환경 변수

### Frontend (.env)
```env
# Ollama API (AI 튜터용) - 로컬, 무료
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen2.5-coder:7b

# 백엔드 API URL
VITE_API_URL=http://localhost:3000
```

### Backend-Node
```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

---

## 9. 명령어 모음

### 개발 실행
```bash
# 1. Ollama 설치 & 모델 다운로드 (최초 1회)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:7b

# 2. Ollama 서버 실행
ollama serve

# 3. Backend (Node.js - 채점/문제)
cd backend-node && npm run dev

# 4. Backend (Python - 메모리 시뮬레이션)
cd backend && uvicorn main:app --reload --port 8000

# 5. Frontend
cd frontend && npm run dev
```

### 테스트
```bash
# Backend
cd backend
pytest                           # 전체
pytest tests/unit                # 단위 테스트
pytest tests/integration         # 통합 테스트
pytest --cov=services --cov-report=html  # 커버리지

# Frontend
cd frontend
npm test                         # Vitest
npm run test:e2e                 # Playwright
```

### 배포
```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## 10. 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| API 응답시간 | < 2초 (AI 제외) |
| AI 응답시간 | < 10초 |
| C 컴파일 | < 5초 |
| 동시 사용자 | 최소 10명 (MVP) |
| 코드 실행 격리 | Docker 컨테이너 |
| 리소스 제한 | CPU 10초, RAM 128MB |
| 테스트 커버리지 | 최소 60% (핵심 로직) |

---

## 11. UI 페이지 구조

```
/              → 메인 대시보드 (모든 기능 통합)
/tutor         → AI 튜터 전체 화면
/runner        → C 코드 실행기 전체 화면
/memory        → 메모리 시뮬레이터 전체 화면
/scheduler     → OS 스케줄러 (MVP 이후)
/stats         → 학습 통계 (MVP 이후)
```

### 디자인 컬러
```css
/* Light Mode */
--accent: #3b82f6;        /* Blue */
--success: #22c55e;       /* Green */
--error: #ef4444;         /* Red */

/* Memory Visualizer */
--heap-allocated: #8b5cf6;  /* Purple */
--heap-free: #374151;       /* Gray */
--stack-frame: #06b6d4;     /* Cyan */
--pointer-arrow: #f97316;   /* Orange */
```

---

## 12. VPS 서버 스펙

| 항목 | 최소 | 권장 |
|------|------|------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4GB | 8GB (LLM용) |
| Storage | 20GB | 50GB |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |

---

## 13. 커밋 규칙

- 커밋 메시지에 Claude 서명 금지
- `Generated with [Claude Code]` 금지
- `Co-Authored-By: Claude` 금지

---

## 14. 관련 문서

```
docs/
├── plans/                          # 설계/계획 문서
│   ├── 01_requirements.md          # 요구사항 명세
│   ├── 02_tech_decisions.md        # 기술 결정
│   ├── 03_api_spec.md              # API 상세 스펙
│   ├── 04_data_models.md           # 데이터 모델
│   ├── 05_ui_design.md             # UI/UX 설계
│   ├── 06_security.md              # 보안 설계
│   ├── 07_testing.md               # 테스트 전략
│   ├── 08_devops.md                # DevOps/배포
│   ├── 09_frontend_code_design.md  # 프론트엔드 설계
│   ├── 10_backend_code_design.md   # 백엔드 설계
│   ├── 11_real_mvp.md              # MVP 정의
│   ├── 12_theme_system.md          # 테마 시스템
│   ├── 13_design_overhaul.md       # 디자인 개편
│   ├── 14_develop_rules.md         # 개발 규칙
│   ├── 15_memory_viz_roadmap.md    # 메모리 시각화 로드맵
│   ├── IMPLEMENTATION_PLAN.md      # 구현 계획
│   └── INTEGRATION_PLAN.md         # 통합 계획
│
├── reference/                      # 참조 문서
│   ├── CURRICULUM.md               # 커리큘럼
│   ├── folder-structure.md         # 폴더 구조
│   ├── reference.md                # 퀵 레퍼런스 (이 파일)
│   └── syntax-reference.md         # JS/TS/React 문법 참조
│
└── worklogs/                       # 작업 로그
    ├── SESSION_STATUS.md           # 세션 상태
    └── worklog_*.md                # 일별 작업 로그

.claude/CLAUDE.md                   # 프로젝트 전체 개요 + Claude 지침
```
