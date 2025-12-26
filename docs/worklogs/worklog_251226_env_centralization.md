# 환경변수 중앙화 + Zod 스키마 작업

**날짜:** 2025-12-26
**작업자:** Claude + jammy

---

## 목표

하드코딩된 설정값들을 환경변수로 이동하고, **Zod 스키마**로 타입 안전하게 중앙 관리

---

## 발견된 문제점

| 카테고리 | 개수 | 상태 |
|----------|------|------|
| Firebase Config | 7개 | 🔴 코드에 하드코딩 (보안 위험) |
| Docker 리소스 제한 | 5개 | 🔴 하드코딩 |
| Timeout 설정 | 10개 | 🔴 하드코딩 |
| CORS Origins | 1개 | 🔴 하드코딩 |
| AI Tutor 설정 | 4개 | 🟡 일부만 환경변수 |
| API Endpoints | 8개 | ✅ 이미 환경변수 사용 |

---

## 해결 방법

### 1. Zod 스키마 기반 Config 중앙화

**Backend:** `backend-node/src/config/env.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DOCKER_MEMORY_LIMIT: z.string().default('128m'),
  // ...
});

export const env = envSchema.parse(process.env);
```

**Frontend:** `frontend/src/config/env.ts`
```typescript
const envSchema = z.object({
  VITE_API_URL: z.string().default('http://localhost:3000'),
  VITE_FIREBASE_API_KEY: z.string().min(1),
  // ...
});

export const env = getEnv();
```

### 2. 서비스 파일 수정

**Before:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

**After:**
```typescript
import { env } from '../config/env';
const API_URL = env.VITE_API_URL;
```

---

## 수정/생성된 파일

### Backend (6개)
| 파일 | 작업 |
|------|------|
| `src/config/env.ts` | 🆕 Zod 스키마 생성 |
| `.env.example` | 🆕 템플릿 생성 |
| `.gitignore` | 🆕 .env 무시 추가 |
| `src/app.ts` | ✏️ env import 사용 |
| `src/modules/c/executor.ts` | ✏️ Docker 설정 환경변수화 |
| `src/modules/c/routes.ts` | ✏️ timeout 환경변수화 |

### Frontend (11개)
| 파일 | 작업 |
|------|------|
| `src/config/env.ts` | 🆕 Zod 스키마 생성 |
| `.env.example` | ✏️ Firebase 변수 추가 |
| `.env.local` | 🆕 실제 값 (gitignore) |
| `src/services/firebase.ts` | ✏️ 하드코딩 → env |
| `src/services/crunner.ts` | ✏️ env import |
| `src/services/users.ts` | ✏️ env import |
| `src/services/problems.ts` | ✏️ env import |
| `src/services/submissions.ts` | ✏️ env import |
| `src/services/tracer.ts` | ✏️ env import |
| `src/services/ollama.ts` | ✏️ env import |
| `src/pages/Admin.tsx` | ✏️ env import |

---

## 환경변수 목록

### Frontend (.env.local)
```bash
# API
VITE_API_URL=http://localhost:3000

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# Ollama
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen2.5-coder:7b
VITE_OLLAMA_TEMPERATURE=0.7
VITE_OLLAMA_NUM_PREDICT=1024

# Timeouts
VITE_C_RUN_TIMEOUT=10
VITE_C_JUDGE_TIMEOUT=5
VITE_TRACER_TIMEOUT=10

# UI
VITE_PROBLEMS_PER_PAGE=30
```

### Backend (.env)
```bash
# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Docker
DOCKER_IMAGE=gcc:latest
DOCKER_MEMORY_LIMIT=128m
DOCKER_CPU_LIMIT=0.5
DOCKER_PID_LIMIT=50
DOCKER_TMPFS_SIZE=10m

# Timeouts
C_RUN_DEFAULT_TIMEOUT=10
C_RUN_MAX_TIMEOUT=30
C_JUDGE_TIMEOUT=5

# Limits
CODE_MAX_LENGTH=50000
JSON_BODY_LIMIT=1mb
```

---

## 테스트 결과

```
✅ TypeScript 타입 체크 통과 (Frontend + Backend)
✅ Vitest 66개 테스트 모두 통과
```

---

## 주의사항

1. **`.env.local` 절대 커밋 금지** (Firebase 키 포함)
2. 신규 개발자는 `.env.example` 복사 후 값 채우기
3. 프로덕션 배포 시 환경변수 별도 설정 필요

---

## 효과

- ✅ **보안:** Firebase 키가 코드에서 완전 제거됨
- ✅ **타입 안전:** Zod로 런타임 검증
- ✅ **중앙화:** 모든 설정이 `config/env.ts` 한 곳에서 관리
- ✅ **문서화:** `.env.example`로 필요한 변수 명확화
- ✅ **환경별 설정:** dev/staging/prod 분리 가능
- ✅ **IDE 지원:** TypeScript 자동완성
