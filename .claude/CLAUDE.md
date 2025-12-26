# COSLAB: C & Operating System Learning Platform

A modular, AI-assisted environment for learning C programming and OS internals through visualization, experimentation, and guided practice.

---

## 1. Overview

COSLAB is a web-based learning environment designed to help developers understand:

- C language fundamentals
- Memory models and pointer behavior
- Operating system concepts
- Compiler/runtime behavior
- Debugging principles (conceptual level)

The platform integrates interactive visualization, an isolated C execution environment, and an AI tutor to guide learners step-by-step.

---

## 2. Motivation

Traditional C/OS learning relies on textbooks or static diagrams.
COSLAB provides a more practical approach:

- Write and run C code in the browser
- Observe memory behavior through visual models
- Experiment with OS mechanisms (scheduling, allocation, paging)
- Receive explanations from an AI tutor
- Track learning progress over time

This creates a bridge between theory and hands-on understanding.

---

## 3. MVP Scope

The minimum viable product includes the following three modules:

### 3.1 AI Tutor

- Explain C syntax, memory layout, pointers, structs, system calls
- Explain OS concepts (process, scheduling, paging, virtual memory)
- Provide hints and step-by-step reasoning
- Answer questions conversationally

### 3.2 C Code Runner

- Execute user-provided C code inside a sandbox
- Return:
  - program output
  - compile errors
- Safe, isolated execution using WSL/Docker/gcc

### 3.3 Memory Visualizer

A simplified virtual memory model that shows:

- heap allocation
- stack growth
- pointer references
- fragmentation
- free/allocated blocks
- variable locations

This model is educational, not a literal GDB/pwndbg view.

---

## 4. Full Feature Roadmap

### 4.1 C Execution Engine

- Online compiler (gcc)
- Time-limited execution
- Error capture (stdout/stderr)
- Security sandbox
- Build logs and warnings
- Run statistics

---

### 4.2 Memory & Pointer Simulator

An abstract visualization engine to represent:

- virtual memory blocks
- stack growth direction
- heap expansion
- pointer references
- malloc/free animations
- segmentation faults (conceptual)

This is not a real debugger but a teaching simulator.

---

### 4.3 OS Simulation Module

High-level simulations:

**Process Scheduling**
- FCFS
- SJF
- Round Robin
- Priority scheduling

**Memory Management**
- Paging simulation
- Simple TLB cache
- Page faults visualized
- Page replacement (FIFO / LRU)

**File System**
- Virtual directory tree
- I-node-like metadata
- Read/write/seek simulation

---

### 4.4 AI Tutor (Advanced)

- Step-wise code explanation
- Detection of common C mistakes
- Personalized learning path
- Concept mapping (what user understands)
- Recommended exercises

---

### 4.5 Learning Progress Tracking

Track per-user:

- questions asked
- C programs executed
- success/failure compilation ratio
- topics studied (pointers, memory, threads, files)
- badges/achievements

---

## 5. System Architecture

```
┌──────────────────────────────────────────────┐
│                   FRONTEND                   │
│                (React + Zustand)             │
│                                              │
│  • C Editor (Monaco)                         │
│  • Memory Visualizer                         │
│  • OS Simulator UI                           │
│  • AI Chat Interface                         │
└───────────────────────────┬──────────────────┘
                            │ REST API
┌───────────────────────────▼──────────────────┐
│                  BACKEND                     │
│             (Node.js + Express)              │
│                                              │
│  • /ai/ask      → AI Tutor                   │
│  • /c/run       → Compile & Execute C        │
│  • /os/sim      → OS Simulation Engine       │
│  • /track/stats → Learning Analytics         │
│                                              │
└───────────────────────────┬──────────────────┘
                            │
┌───────────────────────────▼──────────────────┐
│               EXECUTION LAYER                │
│         (WSL or Docker Sandbox)              │
│                                              │
│  • gcc compiler                              │
│  • isolated runtime                          │
│  • resource-limited execution                │
└──────────────────────────────────────────────┘
```

---

## 6. Backend Logic Flow

### 6.1 AI Tutor Flow

1. User sends question
2. Backend forwards to LLM interface
3. LLM returns structured, educational response
4. Response displayed in chat window

---

### 6.2 C Runner Flow

1. User writes C code
2. API receives code
3. Temporary file created
4. gcc compiles it
5. If successful → run
6. Return stdout or compile/error logs

---

### 6.3 Memory Simulator Flow

1. Backend receives "memory operation event"
2. Logic engine updates simplified memory state
3. Return JSON state to frontend
4. Frontend animates blocks & pointers

---

### 6.4 OS Simulator Flow

1. User selects scheduling or memory algorithm
2. API runs algorithm on given input
3. Step-by-step events returned
4. Frontend animates timeline, queues, or pages

---

## 7. Technology Stack

### Frontend

- React 18 + TypeScript
- Zustand (state management)
- Tailwind CSS + shadcn/ui
- Monaco Editor (C code input)
- Framer Motion (animations)
- Zod (runtime validation)
- Vitest + Playwright (testing)

### Backend

- Node.js + Express + TypeScript
- Prisma (SQLite)
- Zod (schema validation)
- Docker sandbox (gcc execution)

### Execution Layer

- gcc (compilation)
- Docker container with resource limits
- Isolated network + filesystem

---

## 8. Security Considerations

- No raw shell access
- No direct system calls from user code
- CPU/memory timeouts
- Sandboxed file system
- Code execution in container only
- Input sanitization
- No networking allowed inside container

---

## 9. Future Extensions

- Thread simulator
- System call trace simulator
- Real GDB integration (optional expert mode)
- Coding exercise auto-grader
- Multiplayer lab mode (pair learning)
- Community-made "labs" catalog

---

## 10. Why We Don't Use pwndbg Here

pwndbg is excellent for real binary exploitation, not for beginner-friendly learning visualization.

COSLAB uses abstraction, not raw process memory:

| Task | pwndbg | COSLAB Simulator |
|------|--------|------------------|
| Real stack/heap view | Yes | No |
| Pedagogical memory model | No | Yes |
| Web visualization | No | Yes |
| Runs on browser | No | Yes |
| Safe for beginners | Low | Very high |

Therefore:

> COSLAB does not require pwndbg for its design.
> A simplified educational memory model is more appropriate.

---

## 11. MVP Delivery Summary

To deliver the MVP, implement:

1. AI tutor API
2. C compiler/execution API
3. Basic memory model & visualization
4. Frontend UI for chat, code, visualizer

Everything else can be built incrementally.

---

## 12. Project Structure

```
backend-node/
├── src/
│   ├── config/
│   │   └── env.ts              # Zod schema for all env vars
│   ├── modules/
│   │   ├── c/
│   │   │   ├── executor.ts     # Docker-based C execution
│   │   │   └── routes.ts
│   │   ├── memory/
│   │   │   ├── simulator.ts    # Memory trace simulation
│   │   │   └── handlers/       # Modular operation handlers
│   │   ├── problems/           # Problem management
│   │   ├── submissions/        # Submission management
│   │   └── users/              # User management
│   └── app.ts
├── prisma/
│   └── schema.prisma
└── .env.example

frontend/
├── src/
│   ├── config/
│   │   └── env.ts              # Zod schema for all env vars
│   ├── features/               # Feature-based modules
│   │   ├── chat/               # AI tutor chat
│   │   ├── memory/             # Memory visualization
│   │   │   └── memory-viz/
│   │   └── problems/           # Problem list + code editor
│   ├── components/             # Shared UI components
│   │   └── ui/                 # shadcn/ui components
│   ├── layouts/                # Page layouts
│   ├── pages/                  # Route pages
│   ├── services/               # API clients
│   ├── stores/                 # Zustand stores
│   └── hooks/                  # Custom React hooks
├── tests/
│   ├── unit/
│   ├── component/
│   └── e2e/
└── .env.example

docs/
├── plans/                      # Design/planning documents
│   ├── 01_requirements.md
│   ├── 02_tech_decisions.md
│   ├── ...
│   └── 15_memory_viz_roadmap.md
├── reference/                  # Reference documents
│   ├── CURRICULUM.md
│   ├── folder-structure.md
│   ├── reference.md
│   └── syntax-reference.md
└── worklogs/                   # Work logs
    ├── SESSION_STATUS.md
    └── worklog_*.md
```

---

## 13. Commit Guidelines

- 커밋 메시지에 Claude 서명 금지
- `🤖 Generated with [Claude Code]` 금지
- `Co-Authored-By: Claude` 금지

---

## 14. Repository Info

- GitHub: jammy0903
- Email: fuso3367@kakao.com

---

## 15. Reference Documents

| Folder | Purpose |
|--------|---------|
| `docs/plans/` | Design/planning documents (01~15, IMPLEMENTATION_PLAN, INTEGRATION_PLAN) |
| `docs/reference/` | Reference documents (CURRICULUM, folder-structure, syntax-reference) |
| `docs/worklogs/` | Work logs (SESSION_STATUS, worklog_*.md) |

| Key Files | Purpose |
|-----------|---------|
| `docs/reference/reference.md` | Quick reference for all project specs |
| `docs/reference/syntax-reference.md` | JS/TS/React syntax concepts already explained. Check before re-explaining. |

---

## 16. Development Workflow

### Adding Environment Variables

All configuration is centralized using **Zod schemas**. Never use raw `process.env` or `import.meta.env`.

**Backend** (`backend-node/src/config/env.ts`):
```typescript
// 1. Add to schema
const envSchema = z.object({
  // ... existing
  NEW_VAR: z.string().default('default-value'),
});

// 2. Use in code
import { env } from '../config/env';
console.log(env.NEW_VAR);  // Type-safe!
```

**Frontend** (`frontend/src/config/env.ts`):
```typescript
// 1. Add to schema (must be VITE_ prefixed)
const envSchema = z.object({
  // ... existing
  VITE_NEW_VAR: z.string().default('default'),
});

// 2. Add to getEnv() mapping
VITE_NEW_VAR: import.meta.env.VITE_NEW_VAR,

// 3. Use in code
import { env } from '../config/env';
console.log(env.VITE_NEW_VAR);
```

**Remember**: Update `.env.example` files when adding new variables.

---

### Adding a New Feature

Follow the **feature-based** module pattern:

```
frontend/src/features/
└── new-feature/
    ├── index.ts           # Public exports
    ├── NewFeature.tsx     # Main component
    ├── components/        # Internal components
    ├── hooks/             # Feature-specific hooks
    ├── types.ts           # TypeScript types
    └── utils.ts           # Helper functions
```

**Steps:**
1. Create feature folder under `src/features/`
2. Export public API from `index.ts`
3. Import in parent via `@/features/new-feature`
4. Add tests in `tests/component/new-feature/`

---

### Adding Backend Handlers

For modular backend logic (e.g., memory operations):

```
backend-node/src/modules/memory/handlers/
├── index.ts              # Handler registry
├── types.ts              # Shared types
├── int.handler.ts        # int operations
├── pointer.handler.ts    # pointer operations
└── new.handler.ts        # Add new handler here
```

**Pattern:**
```typescript
// new.handler.ts
import { OperationHandler } from './types';

export const newHandler: OperationHandler = {
  canHandle: (op) => op.type === 'new_type',
  handle: (op, state) => {
    // Process operation, return updated state
  },
};

// index.ts - register handler
import { newHandler } from './new.handler';
export const handlers = [...existingHandlers, newHandler];
```

---

### Testing

```bash
# Unit + Component tests
cd frontend && npm run test:run

# E2E tests (requires backend running)
cd frontend && npm run test:e2e

# Type check
cd frontend && npx tsc --noEmit
cd backend-node && npx tsc --noEmit
```

---

## 17. Code Style Guidelines

- **No hardcoded values**: Use `config/env.ts`
- **No barrel exports abuse**: Only export what's needed from `index.ts`
- **Colocate related code**: Keep component + hooks + types together
- **Prefer composition**: Small, focused components over large monoliths
- **Type everything**: No `any` unless absolutely necessary
- **Use path alias**: `@/` instead of relative paths (`../../../`)

---

## 18. API Documentation & Testing

### Swagger UI
```
http://localhost:3000/api-docs       # Interactive UI
http://localhost:3000/api-docs.json  # OpenAPI 3.0 spec
```

### API Endpoints

| Tag | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| **Problems** | GET | `/api/problems` | 문제 목록 |
| | GET | `/api/problems/:id` | 문제 상세 |
| **Submissions** | POST | `/api/submissions` | 제출 생성 |
| | GET | `/api/submissions/user/:uid` | 사용자 제출 기록 |
| | GET | `/api/submissions/solved/:uid` | 푼 문제 목록 |
| **Users** | GET | `/api/users` | 전체 사용자 (Admin) |
| | POST | `/api/users/register` | 사용자 등록 |
| | GET | `/api/users/:uid` | 사용자 정보 |
| | GET | `/api/users/:uid/role` | 사용자 role |
| **C Runner** | POST | `/api/c/run` | C 코드 실행 |
| | POST | `/api/c/judge` | 테스트케이스 채점 |
| **Memory** | POST | `/api/memory/trace` | 메모리 시뮬레이션 |

### curl 테스트 예시

```bash
# 문제 목록 조회
curl http://localhost:3000/api/problems

# 문제 상세 조회
curl http://localhost:3000/api/problems/<problem-id>

# C 코드 실행
curl -X POST http://localhost:3000/api/c/run \
  -H "Content-Type: application/json" \
  -d '{"code": "#include <stdio.h>\nint main() { printf(\"Hello\"); return 0; }", "stdin": ""}'

# 채점
curl -X POST http://localhost:3000/api/c/judge \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "testCases": [{"input": "1 2", "output": "3"}]}'

# 메모리 트레이스
curl -X POST http://localhost:3000/api/memory/trace \
  -H "Content-Type: application/json" \
  -d '{"code": "int main() { int x = 10; return 0; }"}'

# 사용자 등록
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"firebaseUid": "test123", "email": "test@example.com", "name": "Test"}'
```

### Path Alias

```typescript
// Before (상대경로)
import { useStore } from '../../../stores/store';

// After (@/ alias)
import { useStore } from '@/stores/store';
import { config } from '@/config';
import { Button } from '@/components/ui/button';
```

설정: `tsconfig.json` + `vite.config.ts`에서 `@/*` → `src/*` 매핑
