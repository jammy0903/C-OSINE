# 03. API 상세 스펙 (API Specification)

---

## Base URL

```
Development: http://localhost:8000/api/v1
Production:  https://api.coslab.example.com/v1
```

---

## 공통 사항

### Headers
```
Content-Type: application/json
```

### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### 에러 코드
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| COMPILATION_ERROR | 400 | C 코드 컴파일 실패 |
| EXECUTION_TIMEOUT | 408 | 실행 시간 초과 |
| RUNTIME_ERROR | 400 | 런타임 에러 |
| LLM_ERROR | 503 | LLM 서비스 오류 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## 1. Health Check

### GET /health
서버 상태 확인

**Response 200**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "services": {
    "llm": "ok",
    "docker": "ok"
  }
}
```

---

## 2. AI Tutor API

### POST /ai/ask
AI 튜터에게 질문

**Request Body**
```json
{
  "message": "포인터가 뭐야?",
  "context": [
    {
      "role": "user",
      "content": "이전 질문"
    },
    {
      "role": "assistant",
      "content": "이전 답변"
    }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| message | string | ✅ | 사용자 질문 (1-2000자) |
| context | array | ❌ | 이전 대화 내역 (최대 10개) |

**Response 200**
```json
{
  "success": true,
  "data": {
    "response": "포인터는 메모리 주소를 저장하는 변수입니다...",
    "code_examples": [
      {
        "language": "c",
        "code": "int *ptr = &x;"
      }
    ]
  }
}
```

**Response 503 (LLM 오류)**
```json
{
  "success": false,
  "error": {
    "code": "LLM_ERROR",
    "message": "AI 서비스에 연결할 수 없습니다"
  }
}
```

---

## 3. C Runner API

### POST /c/run
C 코드 컴파일 및 실행

**Request Body**
```json
{
  "code": "#include <stdio.h>\nint main() {\n  printf(\"Hello\");\n  return 0;\n}",
  "stdin": "",
  "timeout": 10
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| code | string | ✅ | C 소스 코드 (1-50000자) |
| stdin | string | ❌ | 표준 입력 (기본: 빈 문자열) |
| timeout | integer | ❌ | 타임아웃 초 (기본: 10, 최대: 30) |

**Response 200 (성공)**
```json
{
  "success": true,
  "data": {
    "compiled": true,
    "executed": true,
    "stdout": "Hello",
    "stderr": "",
    "exit_code": 0,
    "execution_time_ms": 15,
    "memory_used_kb": 1024
  }
}
```

**Response 200 (컴파일 에러)**
```json
{
  "success": true,
  "data": {
    "compiled": false,
    "executed": false,
    "stdout": "",
    "stderr": "main.c:3:5: error: expected ';' before 'return'",
    "exit_code": null,
    "execution_time_ms": null,
    "memory_used_kb": null
  }
}
```

**Response 200 (런타임 에러)**
```json
{
  "success": true,
  "data": {
    "compiled": true,
    "executed": true,
    "stdout": "",
    "stderr": "Segmentation fault (core dumped)",
    "exit_code": 139,
    "execution_time_ms": 5,
    "memory_used_kb": 512
  }
}
```

**Response 408 (타임아웃)**
```json
{
  "success": false,
  "error": {
    "code": "EXECUTION_TIMEOUT",
    "message": "실행 시간이 10초를 초과했습니다"
  }
}
```

---

## 4. Memory Simulator API

### POST /os/sim/memory/init
메모리 시뮬레이터 초기화

**Request Body**
```json
{
  "heap_size": 1024,
  "stack_size": 256
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| heap_size | integer | ❌ | 힙 크기 (기본: 1024) |
| stack_size | integer | ❌ | 스택 크기 (기본: 256) |

**Response 200**
```json
{
  "success": true,
  "data": {
    "session_id": "mem_abc123",
    "state": {
      "heap": {
        "size": 1024,
        "blocks": [],
        "free_list": [{"start": 0, "size": 1024}]
      },
      "stack": {
        "size": 256,
        "frames": [],
        "sp": 256
      }
    }
  }
}
```

---

### POST /os/sim/memory/malloc
메모리 할당

**Request Body**
```json
{
  "session_id": "mem_abc123",
  "size": 64,
  "var_name": "ptr1"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "address": 0,
    "size": 64,
    "state": {
      "heap": {
        "blocks": [
          {"address": 0, "size": 64, "var_name": "ptr1", "status": "allocated"}
        ],
        "free_list": [{"start": 64, "size": 960}]
      }
    },
    "animation": {
      "type": "malloc",
      "steps": [
        {"action": "search_free", "block": {"start": 0, "size": 1024}},
        {"action": "split", "allocated": {"start": 0, "size": 64}},
        {"action": "update_free_list"}
      ]
    }
  }
}
```

---

### POST /os/sim/memory/free
메모리 해제

**Request Body**
```json
{
  "session_id": "mem_abc123",
  "var_name": "ptr1"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "freed_address": 0,
    "freed_size": 64,
    "state": {
      "heap": {
        "blocks": [],
        "free_list": [{"start": 0, "size": 1024}]
      }
    },
    "animation": {
      "type": "free",
      "steps": [
        {"action": "mark_free", "block": {"start": 0, "size": 64}},
        {"action": "coalesce", "merged": {"start": 0, "size": 1024}}
      ]
    }
  }
}
```

---

### POST /os/sim/memory/stack/push
스택 프레임 추가

**Request Body**
```json
{
  "session_id": "mem_abc123",
  "function_name": "main",
  "variables": [
    {"name": "x", "type": "int", "value": 10, "size": 4},
    {"name": "y", "type": "int", "value": 20, "size": 4}
  ]
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "frame_id": 0,
    "state": {
      "stack": {
        "frames": [
          {
            "id": 0,
            "function": "main",
            "base": 256,
            "variables": [
              {"name": "x", "address": 252, "size": 4, "value": 10},
              {"name": "y", "address": 248, "size": 4, "value": 20}
            ]
          }
        ],
        "sp": 248
      }
    }
  }
}
```

---

## 5. OS Scheduler Simulator API

### POST /os/sim/cpu/schedule
CPU 스케줄링 시뮬레이션

**Request Body**
```json
{
  "algorithm": "rr",
  "time_quantum": 2,
  "processes": [
    {"pid": 1, "arrival": 0, "burst": 5, "priority": 1},
    {"pid": 2, "arrival": 1, "burst": 3, "priority": 2},
    {"pid": 3, "arrival": 2, "burst": 4, "priority": 1}
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| algorithm | string | ✅ | fcfs, sjf, rr, priority |
| time_quantum | integer | ❌ | RR 타임 퀀텀 (기본: 2) |
| processes | array | ✅ | 프로세스 목록 |

**Response 200**
```json
{
  "success": true,
  "data": {
    "gantt_chart": [
      {"pid": 1, "start": 0, "end": 2},
      {"pid": 2, "start": 2, "end": 4},
      {"pid": 3, "start": 4, "end": 6},
      {"pid": 1, "start": 6, "end": 8},
      {"pid": 2, "start": 8, "end": 9},
      {"pid": 3, "start": 9, "end": 11},
      {"pid": 1, "start": 11, "end": 12}
    ],
    "metrics": {
      "avg_waiting_time": 4.33,
      "avg_turnaround_time": 8.33,
      "cpu_utilization": 100
    },
    "per_process": [
      {"pid": 1, "waiting": 7, "turnaround": 12},
      {"pid": 2, "waiting": 5, "turnaround": 8},
      {"pid": 3, "waiting": 5, "turnaround": 9}
    ]
  }
}
```

---

## 6. Learning Stats API (MVP 이후)

### GET /track/stats
학습 통계 조회

**Response 200**
```json
{
  "success": true,
  "data": {
    "questions_asked": 42,
    "code_executed": 28,
    "compile_success_rate": 0.75,
    "topics": {
      "pointers": 15,
      "memory": 10,
      "arrays": 8,
      "structs": 5,
      "os_scheduling": 4
    },
    "streak_days": 7
  }
}
```

### POST /track/event
이벤트 기록

**Request Body**
```json
{
  "event_type": "code_run",
  "metadata": {
    "success": true,
    "topic": "pointers"
  }
}
```

---

## Rate Limiting

| Endpoint | 제한 |
|----------|------|
| /ai/ask | 10 req/min |
| /c/run | 20 req/min |
| /os/sim/* | 60 req/min |
| 기타 | 100 req/min |

**Rate Limit 초과 응답 (429)**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "요청 제한을 초과했습니다. 1분 후 다시 시도하세요.",
    "retry_after": 60
  }
}
```
