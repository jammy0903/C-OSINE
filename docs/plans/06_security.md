# 06. 보안 설계 (Security Design)

---

## 1. 위협 모델 (Threat Model)

### 1.1 자산 (Assets)
| 자산 | 중요도 | 설명 |
|------|--------|------|
| 서버 시스템 | 🔴 Critical | 호스트 OS 및 파일시스템 |
| 다른 사용자 데이터 | 🔴 Critical | 다른 사용자의 코드/세션 |
| API 키/시크릿 | 🔴 Critical | LLM API 키, DB 비밀번호 |
| 서버 리소스 | 🟡 High | CPU, 메모리, 디스크 |
| 서비스 가용성 | 🟡 High | DoS 방지 |

### 1.2 위협 행위자 (Threat Actors)
| 행위자 | 동기 | 능력 |
|--------|------|------|
| 호기심 많은 사용자 | 시스템 탐색 | 기본 C 지식 |
| 악의적 사용자 | 서버 해킹, 리소스 악용 | 고급 C, 시스템 지식 |
| 자동화된 공격 | 크립토마이닝, 봇넷 | 스크립트 기반 |

### 1.3 공격 벡터
```
1. 코드 실행 공격
   ├── 시스템 콜 악용 (fork bomb, exec)
   ├── 파일 시스템 접근 (/etc/passwd 읽기)
   ├── 네트워크 접근 (리버스 쉘)
   └── 리소스 고갈 (무한 루프, 메모리 폭발)

2. 입력 검증 공격
   ├── 코드 인젝션
   ├── 경로 조작 (../../)
   └── 버퍼 오버플로우 (API 레벨)

3. DoS 공격
   ├── API 폭탄
   ├── 대용량 코드 제출
   └── 동시 다발 요청
```

---

## 2. 샌드박스 보안 (Docker)

### 2.1 컨테이너 격리
```yaml
# docker-compose.yml (sandbox 서비스)
sandbox:
  security_opt:
    - no-new-privileges:true    # 권한 상승 방지
    - seccomp:seccomp-profile.json  # syscall 필터링
  cap_drop:
    - ALL                        # 모든 capabilities 제거
  read_only: true               # 읽기 전용 루트 파일시스템
  tmpfs:
    - /tmp:size=10M,noexec      # 실행 불가 임시 공간
```

### 2.2 리소스 제한
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'               # CPU 50%
      memory: 128M              # 메모리 128MB
      pids: 50                  # 프로세스 수 50개
```

### 2.3 네트워크 격리
```yaml
network_mode: none              # 네트워크 완전 차단
```

### 2.4 Seccomp 프로파일
```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "read", "write", "open", "close", "stat", "fstat",
        "mmap", "mprotect", "munmap", "brk",
        "exit", "exit_group",
        "arch_prctl", "set_tid_address", "set_robust_list"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

**차단되는 위험한 syscall:**
- `fork`, `clone`, `vfork` → Fork bomb 방지
- `execve` → 다른 프로그램 실행 방지
- `socket`, `connect`, `bind` → 네트워크 차단
- `ptrace` → 디버깅/인젝션 방지
- `mount`, `umount` → 파일시스템 조작 방지

### 2.5 사용자 격리
```dockerfile
FROM gcc:latest

# 비특권 사용자 생성
RUN useradd -r -s /bin/false sandbox
USER sandbox
WORKDIR /sandbox
```

---

## 3. 입력 검증

### 3.1 코드 입력 검증
```python
# sanitizer.py

import re

# 금지된 패턴
FORBIDDEN_PATTERNS = [
    r'#\s*include\s*<\s*sys/',      # sys/* 헤더
    r'#\s*include\s*<\s*unistd\.h',  # unistd.h
    r'#\s*include\s*<\s*pthread\.h', # pthread
    r'#\s*include\s*<\s*signal\.h',  # signal
    r'\bsystem\s*\(',                # system()
    r'\bexec[lvpe]*\s*\(',           # exec family
    r'\bfork\s*\(',                  # fork()
    r'\bpopen\s*\(',                 # popen()
    r'__asm__',                      # 인라인 어셈블리
    r'\basm\s*\(',                   # asm()
]

def validate_code(code: str) -> tuple[bool, str | None]:
    """코드 검증. (통과, 에러메시지) 반환"""

    # 길이 제한
    if len(code) > 50000:
        return False, "코드가 너무 깁니다 (최대 50KB)"

    # 금지 패턴 검사
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            return False, f"허용되지 않는 코드 패턴이 감지되었습니다"

    return True, None
```

### 3.2 허용되는 헤더
```c
// 화이트리스트 방식 권장
#include <stdio.h>      ✅
#include <stdlib.h>     ✅
#include <string.h>     ✅
#include <math.h>       ✅
#include <ctype.h>      ✅
#include <limits.h>     ✅
#include <stdbool.h>    ✅
#include <stdint.h>     ✅

#include <unistd.h>     ❌
#include <sys/socket.h> ❌
#include <pthread.h>    ❌
```

### 3.3 API 입력 검증
```python
from pydantic import BaseModel, Field, validator

class RunCodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000)
    stdin: str = Field(default="", max_length=10000)
    timeout: int = Field(default=10, ge=1, le=30)

    @validator('code')
    def validate_code_content(cls, v):
        valid, error = validate_code(v)
        if not valid:
            raise ValueError(error)
        return v
```

---

## 4. Rate Limiting

### 4.1 구현
```python
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/c/run")
@limiter.limit("20/minute")
async def run_code(request: Request, body: RunCodeRequest):
    ...

@app.post("/ai/ask")
@limiter.limit("10/minute")
async def ask_ai(request: Request, body: AskRequest):
    ...
```

### 4.2 제한 정책
| 엔드포인트 | 제한 | 이유 |
|------------|------|------|
| `/c/run` | 20/min | 컨테이너 리소스 보호 |
| `/ai/ask` | 10/min | LLM 비용 절감 |
| `/os/sim/*` | 60/min | 계산 리소스 보호 |
| 기타 | 100/min | 기본 보호 |

---

## 5. 파일시스템 보안

### 5.1 임시 파일 관리
```python
import tempfile
import os
import uuid

def create_temp_code_file(code: str) -> str:
    """안전한 임시 파일 생성"""

    # 고유한 디렉토리 생성
    session_id = str(uuid.uuid4())
    temp_dir = f"/tmp/coslab/{session_id}"
    os.makedirs(temp_dir, mode=0o700, exist_ok=True)

    # 코드 파일 생성
    code_path = os.path.join(temp_dir, "main.c")
    with open(code_path, 'w') as f:
        f.write(code)

    return temp_dir

def cleanup_temp_dir(temp_dir: str):
    """임시 디렉토리 정리"""
    import shutil
    try:
        shutil.rmtree(temp_dir)
    except:
        pass  # 실패해도 무시 (cron으로 주기적 정리)
```

### 5.2 경로 조작 방지
```python
import os

def safe_path_join(base: str, *paths: str) -> str:
    """경로 조작 공격 방지"""
    result = os.path.join(base, *paths)
    # 결과 경로가 base 내에 있는지 확인
    if not os.path.abspath(result).startswith(os.path.abspath(base)):
        raise ValueError("Invalid path")
    return result
```

---

## 6. 에러 처리 보안

### 6.1 정보 노출 방지
```python
# 나쁜 예
@app.exception_handler(Exception)
async def bad_error_handler(request, exc):
    return {"error": str(exc)}  # ❌ 스택 트레이스 노출 가능

# 좋은 예
@app.exception_handler(Exception)
async def good_error_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "서버 오류가 발생했습니다"
            }
        }
    )
```

### 6.2 컴파일 에러 필터링
```python
def sanitize_compiler_output(output: str) -> str:
    """컴파일러 출력에서 경로 정보 제거"""
    # 절대 경로를 상대 경로로 변경
    output = re.sub(r'/tmp/coslab/[a-f0-9-]+/', '', output)
    output = re.sub(r'/sandbox/', '', output)
    return output
```

---

## 7. 로깅 및 모니터링

### 7.1 보안 이벤트 로깅
```python
import logging

security_logger = logging.getLogger("security")

def log_security_event(event_type: str, details: dict):
    security_logger.warning(f"SECURITY_EVENT: {event_type}", extra={
        "event_type": event_type,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    })

# 사용 예
log_security_event("FORBIDDEN_PATTERN", {
    "pattern": "system(",
    "ip": request.client.host
})
```

### 7.2 감지 이벤트
- 금지 패턴 시도
- Rate limit 초과
- 비정상적 대용량 요청
- 반복적 실패

---

## 8. 체크리스트

### 배포 전 보안 체크리스트
- [ ] Docker seccomp 프로파일 적용
- [ ] 네트워크 격리 확인 (`network_mode: none`)
- [ ] 리소스 제한 설정 확인
- [ ] Rate limiting 활성화
- [ ] 입력 검증 테스트
- [ ] 에러 메시지에 민감 정보 없음 확인
- [ ] HTTPS 설정 (프로덕션)
- [ ] CORS 설정 확인
- [ ] 환경 변수로 시크릿 관리
- [ ] 로깅 설정 완료
