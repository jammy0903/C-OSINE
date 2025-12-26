# 10. 백엔드 코드 설계 (Backend Code Design)

> 실제로 작성할 파일, 라우터, 서비스 함수 단위의 상세 설계

---

## 1. 파일 구조

```
backend/
├── main.py                      # FastAPI 앱 진입점
├── config.py                    # 환경 설정
├── requirements.txt             # 의존성
│
├── routers/                     # API 라우터 (엔드포인트)
│   ├── __init__.py
│   ├── health.py               # /health
│   ├── ai.py                   # /ai/*
│   ├── runner.py               # /c/*
│   └── memory.py               # /os/sim/memory/*
│
├── services/                    # 비즈니스 로직
│   ├── __init__.py
│   ├── llm_service.py          # Ollama 연동
│   ├── compiler_service.py     # gcc 컴파일
│   ├── executor_service.py     # Docker 실행
│   └── memory_service.py       # 메모리 시뮬레이션
│
├── models/                      # Pydantic 모델
│   ├── __init__.py
│   ├── requests.py             # 요청 스키마
│   ├── responses.py            # 응답 스키마
│   └── memory.py               # 메모리 상태 모델
│
├── utils/                       # 유틸리티
│   ├── __init__.py
│   ├── sanitizer.py            # 코드 검증
│   ├── docker_utils.py         # Docker 헬퍼
│   └── exceptions.py           # 커스텀 예외
│
├── tests/                       # 테스트
│   ├── __init__.py
│   ├── test_ai.py
│   ├── test_runner.py
│   └── test_memory.py
│
└── docker/                      # Docker 관련
    ├── Dockerfile.sandbox      # 샌드박스 이미지
    └── seccomp-profile.json    # Seccomp 프로파일
```

---

## 2. 설정 (config.py)

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # 앱 설정
    APP_NAME: str = "COSLAB"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # LLM (Ollama)
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"
    LLM_TIMEOUT: int = 60

    # 샌드박스
    SANDBOX_IMAGE: str = "coslab-sandbox"
    SANDBOX_TIMEOUT: int = 10
    SANDBOX_MEMORY_LIMIT: str = "128m"
    SANDBOX_CPU_LIMIT: float = 0.5

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_AI: str = "10/minute"
    RATE_LIMIT_RUNNER: str = "20/minute"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 3. 메인 앱 (main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from routers import health, ai, runner, memory
from utils.exceptions import setup_exception_handlers

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 초기화
    print(f"Starting {settings.APP_NAME}...")
    yield
    # 종료 시 정리
    print("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    description="C/OS 학습 플랫폼 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 예외 핸들러 설정
setup_exception_handlers(app)

# 라우터 등록
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=f"{settings.API_PREFIX}/ai", tags=["AI Tutor"])
app.include_router(runner.router, prefix=f"{settings.API_PREFIX}/c", tags=["Code Runner"])
app.include_router(memory.router, prefix=f"{settings.API_PREFIX}/os/sim/memory", tags=["Memory Simulator"])
```

---

## 4. 모델 정의 (models/)

### 4.1 models/requests.py
```python
from pydantic import BaseModel, Field
from typing import Optional, Literal

# === AI 튜터 ===
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="사용자 질문")
    context: list[ChatMessage] = Field(default=[], max_length=10, description="이전 대화")


# === 코드 실행 ===
class RunCodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000, description="C 소스 코드")
    stdin: str = Field(default="", max_length=10000, description="표준 입력")
    timeout: int = Field(default=10, ge=1, le=30, description="타임아웃(초)")


# === 메모리 시뮬레이터 ===
class MemoryInitRequest(BaseModel):
    heap_size: int = Field(default=1024, ge=64, le=65536, description="힙 크기")
    stack_size: int = Field(default=256, ge=32, le=8192, description="스택 크기")

class MallocRequest(BaseModel):
    session_id: str = Field(..., description="세션 ID")
    size: int = Field(..., ge=1, le=65536, description="할당 크기")
    var_name: str = Field(..., min_length=1, max_length=50, description="변수명")

class FreeRequest(BaseModel):
    session_id: str = Field(..., description="세션 ID")
    var_name: str = Field(..., description="해제할 변수명")

class StackPushRequest(BaseModel):
    session_id: str
    function_name: str
    variables: list[dict]  # [{name, type, value, size}]
```

### 4.2 models/responses.py
```python
from pydantic import BaseModel
from typing import Optional, Any

# === 공통 ===
class ErrorInfo(BaseModel):
    code: str
    message: str

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorInfo] = None


# === AI 튜터 ===
class CodeExample(BaseModel):
    language: str
    code: str

class AskData(BaseModel):
    response: str
    code_examples: list[CodeExample] = []


# === 코드 실행 ===
class RunResult(BaseModel):
    compiled: bool
    executed: bool
    stdout: str
    stderr: str
    exit_code: Optional[int]
    execution_time_ms: Optional[int]
    memory_used_kb: Optional[int]


# === 헬스체크 ===
class HealthData(BaseModel):
    status: str
    version: str
    services: dict[str, str]
```

### 4.3 models/memory.py
```python
from pydantic import BaseModel
from typing import Optional, Literal

class FreeBlock(BaseModel):
    start: int
    size: int

class HeapBlock(BaseModel):
    address: int
    size: int
    var_name: str
    status: Literal["allocated", "freed"]

class HeapState(BaseModel):
    total_size: int
    used_size: int
    blocks: list[HeapBlock]
    free_list: list[FreeBlock]

class StackVariable(BaseModel):
    name: str
    type: str
    address: int
    size: int
    value: Any

class StackFrame(BaseModel):
    id: int
    function_name: str
    base_pointer: int
    variables: list[StackVariable]

class StackState(BaseModel):
    total_size: int
    sp: int  # Stack Pointer
    frames: list[StackFrame]

class MemoryState(BaseModel):
    session_id: str
    heap: HeapState
    stack: StackState

class AnimationStep(BaseModel):
    action: str
    data: dict
```

---

## 5. 라우터 (routers/)

### 5.1 routers/health.py
```python
from fastapi import APIRouter
from models.responses import ApiResponse, HealthData
from services.llm_service import check_ollama_health
from utils.docker_utils import check_docker_health

router = APIRouter()

@router.get("/health", response_model=ApiResponse)
async def health_check():
    """서버 상태 확인"""
    return ApiResponse(
        success=True,
        data=HealthData(
            status="ok",
            version="1.0.0",
            services={
                "llm": await check_ollama_health(),
                "docker": await check_docker_health(),
            }
        )
    )
```

### 5.2 routers/ai.py
```python
from fastapi import APIRouter, HTTPException
from models.requests import AskRequest
from models.responses import ApiResponse, AskData, ErrorInfo
from services.llm_service import ask_llm

router = APIRouter()

@router.post("/ask", response_model=ApiResponse)
async def ask_ai(request: AskRequest):
    """AI 튜터에게 질문"""
    try:
        response_text, code_examples = await ask_llm(
            message=request.message,
            context=request.context
        )

        return ApiResponse(
            success=True,
            data=AskData(
                response=response_text,
                code_examples=code_examples
            )
        )

    except Exception as e:
        return ApiResponse(
            success=False,
            error=ErrorInfo(
                code="LLM_ERROR",
                message="AI 서비스에 연결할 수 없습니다"
            )
        )
```

### 5.3 routers/runner.py
```python
from fastapi import APIRouter, HTTPException
from models.requests import RunCodeRequest
from models.responses import ApiResponse, RunResult, ErrorInfo
from services.compiler_service import compile_code
from services.executor_service import execute_code
from utils.sanitizer import validate_code

router = APIRouter()

@router.post("/run", response_model=ApiResponse)
async def run_code(request: RunCodeRequest):
    """C 코드 컴파일 및 실행"""

    # 1. 코드 검증
    is_valid, error_msg = validate_code(request.code)
    if not is_valid:
        return ApiResponse(
            success=False,
            error=ErrorInfo(
                code="VALIDATION_ERROR",
                message=error_msg
            )
        )

    # 2. 컴파일
    compile_success, compile_output, temp_dir = await compile_code(request.code)

    if not compile_success:
        return ApiResponse(
            success=True,
            data=RunResult(
                compiled=False,
                executed=False,
                stdout="",
                stderr=compile_output,
                exit_code=None,
                execution_time_ms=None,
                memory_used_kb=None
            )
        )

    # 3. 실행
    try:
        result = await execute_code(
            temp_dir=temp_dir,
            stdin=request.stdin,
            timeout=request.timeout
        )

        return ApiResponse(
            success=True,
            data=RunResult(
                compiled=True,
                executed=True,
                stdout=result["stdout"],
                stderr=result["stderr"],
                exit_code=result["exit_code"],
                execution_time_ms=result["execution_time_ms"],
                memory_used_kb=result["memory_used_kb"]
            )
        )

    except TimeoutError:
        return ApiResponse(
            success=False,
            error=ErrorInfo(
                code="EXECUTION_TIMEOUT",
                message=f"실행 시간이 {request.timeout}초를 초과했습니다"
            )
        )
```

### 5.4 routers/memory.py
```python
from fastapi import APIRouter
from models.requests import MemoryInitRequest, MallocRequest, FreeRequest
from models.responses import ApiResponse, ErrorInfo
from models.memory import MemoryState
from services.memory_service import MemorySimulator

router = APIRouter()

# 세션별 메모리 시뮬레이터 저장
memory_sessions: dict[str, MemorySimulator] = {}


@router.post("/init", response_model=ApiResponse)
async def init_memory(request: MemoryInitRequest):
    """메모리 시뮬레이터 초기화"""
    simulator = MemorySimulator(
        heap_size=request.heap_size,
        stack_size=request.stack_size
    )

    memory_sessions[simulator.session_id] = simulator

    return ApiResponse(
        success=True,
        data={
            "session_id": simulator.session_id,
            "state": simulator.get_state()
        }
    )


@router.post("/malloc", response_model=ApiResponse)
async def malloc(request: MallocRequest):
    """메모리 할당"""
    simulator = memory_sessions.get(request.session_id)
    if not simulator:
        return ApiResponse(
            success=False,
            error=ErrorInfo(code="INVALID_SESSION", message="세션을 찾을 수 없습니다")
        )

    try:
        address, animation = simulator.malloc(request.size, request.var_name)
        return ApiResponse(
            success=True,
            data={
                "address": address,
                "size": request.size,
                "state": simulator.get_state(),
                "animation": animation
            }
        )
    except MemoryError as e:
        return ApiResponse(
            success=False,
            error=ErrorInfo(code="MEMORY_ERROR", message=str(e))
        )


@router.post("/free", response_model=ApiResponse)
async def free(request: FreeRequest):
    """메모리 해제"""
    simulator = memory_sessions.get(request.session_id)
    if not simulator:
        return ApiResponse(
            success=False,
            error=ErrorInfo(code="INVALID_SESSION", message="세션을 찾을 수 없습니다")
        )

    try:
        freed_address, freed_size, animation = simulator.free(request.var_name)
        return ApiResponse(
            success=True,
            data={
                "freed_address": freed_address,
                "freed_size": freed_size,
                "state": simulator.get_state(),
                "animation": animation
            }
        )
    except KeyError:
        return ApiResponse(
            success=False,
            error=ErrorInfo(code="INVALID_VAR", message="변수를 찾을 수 없습니다")
        )
```

---

## 6. 서비스 (services/)

### 6.1 services/llm_service.py
```python
import httpx
from typing import Optional
from config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """당신은 C 언어와 운영체제 전문 튜터입니다.
- 학생이 이해하기 쉽게 설명하세요
- 예제 코드가 필요하면 ```c 코드블록으로 제공하세요
- 답변은 한국어로 작성하세요
- 간결하고 핵심적으로 설명하세요"""


async def check_ollama_health() -> str:
    """Ollama 서버 상태 확인"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.OLLAMA_HOST}/api/tags",
                timeout=5.0
            )
            return "ok" if response.status_code == 200 else "error"
    except:
        return "error"


async def ask_llm(
    message: str,
    context: list[dict] = None
) -> tuple[str, list[dict]]:
    """
    Ollama에 질문하고 응답 받기

    Returns:
        tuple: (응답 텍스트, 코드 예제 리스트)
    """
    # 프롬프트 구성
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # 컨텍스트 추가
    if context:
        for msg in context[-10:]:  # 최근 10개만
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

    # 현재 질문 추가
    messages.append({"role": "user", "content": message})

    # Ollama API 호출
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.OLLAMA_HOST}/api/chat",
            json={
                "model": settings.OLLAMA_MODEL,
                "messages": messages,
                "stream": False
            },
            timeout=settings.LLM_TIMEOUT
        )

        if response.status_code != 200:
            raise Exception("LLM 요청 실패")

        result = response.json()
        response_text = result["message"]["content"]

        # 코드 블록 추출
        code_examples = extract_code_blocks(response_text)

        return response_text, code_examples


def extract_code_blocks(text: str) -> list[dict]:
    """마크다운 코드 블록 추출"""
    import re

    pattern = r"```(\w+)?\n(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL)

    return [
        {"language": lang or "c", "code": code.strip()}
        for lang, code in matches
    ]
```

### 6.2 services/compiler_service.py
```python
import os
import uuid
import asyncio
import tempfile
from config import get_settings

settings = get_settings()


async def compile_code(code: str) -> tuple[bool, str, str]:
    """
    C 코드 컴파일

    Returns:
        tuple: (성공여부, 출력/에러, 임시디렉토리)
    """
    # 임시 디렉토리 생성
    session_id = str(uuid.uuid4())
    temp_dir = os.path.join(tempfile.gettempdir(), "coslab", session_id)
    os.makedirs(temp_dir, exist_ok=True)

    # 코드 파일 저장
    code_path = os.path.join(temp_dir, "main.c")
    with open(code_path, "w") as f:
        f.write(code)

    # gcc 컴파일 (Docker 내부)
    output_path = os.path.join(temp_dir, "a.out")

    cmd = [
        "docker", "run", "--rm",
        "-v", f"{temp_dir}:/code:ro",
        "-v", f"{temp_dir}:/output",
        settings.SANDBOX_IMAGE,
        "gcc", "/code/main.c", "-o", "/output/a.out",
        "-Wall", "-Wextra"
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    stdout, stderr = await process.communicate()

    success = process.returncode == 0
    output = stderr.decode() if stderr else stdout.decode()

    # 경로 정보 제거 (보안)
    output = sanitize_compiler_output(output, temp_dir)

    return success, output, temp_dir


def sanitize_compiler_output(output: str, temp_dir: str) -> str:
    """컴파일러 출력에서 경로 정보 제거"""
    output = output.replace(temp_dir, "")
    output = output.replace("/code/", "")
    output = output.replace("/output/", "")
    return output
```

### 6.3 services/executor_service.py
```python
import os
import asyncio
import time
from config import get_settings

settings = get_settings()


async def execute_code(
    temp_dir: str,
    stdin: str = "",
    timeout: int = 10
) -> dict:
    """
    컴파일된 코드 실행 (Docker 샌드박스)

    Returns:
        dict: {stdout, stderr, exit_code, execution_time_ms, memory_used_kb}
    """
    cmd = [
        "docker", "run", "--rm",
        "--network", "none",                    # 네트워크 차단
        "--memory", settings.SANDBOX_MEMORY_LIMIT,
        "--cpus", str(settings.SANDBOX_CPU_LIMIT),
        "--pids-limit", "50",
        "--read-only",
        "--tmpfs", "/tmp:size=10m",
        "-v", f"{temp_dir}:/code:ro",
        settings.SANDBOX_IMAGE,
        "timeout", str(timeout), "/code/a.out"
    ]

    start_time = time.time()

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE if stdin else None,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(input=stdin.encode() if stdin else None),
            timeout=timeout + 5  # Docker timeout + 여유
        )
    except asyncio.TimeoutError:
        process.kill()
        raise TimeoutError(f"실행 시간 초과 ({timeout}초)")

    execution_time = int((time.time() - start_time) * 1000)

    return {
        "stdout": stdout.decode(errors="replace"),
        "stderr": stderr.decode(errors="replace"),
        "exit_code": process.returncode,
        "execution_time_ms": execution_time,
        "memory_used_kb": None  # TODO: 실제 메모리 측정
    }


async def cleanup_temp_dir(temp_dir: str):
    """임시 디렉토리 정리"""
    import shutil
    try:
        shutil.rmtree(temp_dir)
    except:
        pass
```

### 6.4 services/memory_service.py
```python
import uuid
from typing import Optional
from models.memory import (
    HeapState, StackState, HeapBlock, FreeBlock,
    StackFrame, StackVariable, AnimationStep
)


class MemorySimulator:
    """교육용 메모리 시뮬레이터"""

    def __init__(self, heap_size: int = 1024, stack_size: int = 256):
        self.session_id = str(uuid.uuid4())
        self.heap_size = heap_size
        self.stack_size = stack_size

        # 힙 상태
        self.heap_blocks: list[HeapBlock] = []
        self.free_list: list[FreeBlock] = [FreeBlock(start=0, size=heap_size)]

        # 스택 상태
        self.stack_frames: list[StackFrame] = []
        self.sp = stack_size  # 스택은 위에서 아래로

    def get_state(self) -> dict:
        """현재 메모리 상태 반환"""
        used_size = sum(b.size for b in self.heap_blocks if b.status == "allocated")

        return {
            "heap": {
                "total_size": self.heap_size,
                "used_size": used_size,
                "blocks": [b.model_dump() for b in self.heap_blocks],
                "free_list": [f.model_dump() for f in self.free_list]
            },
            "stack": {
                "total_size": self.stack_size,
                "sp": self.sp,
                "frames": [f.model_dump() for f in self.stack_frames]
            }
        }

    def malloc(self, size: int, var_name: str) -> tuple[int, list[dict]]:
        """
        메모리 할당 (First-Fit 알고리즘)

        Returns:
            tuple: (할당된 주소, 애니메이션 스텝)
        """
        animation = []

        # 1. 적합한 빈 블록 찾기
        for i, free_block in enumerate(self.free_list):
            animation.append({
                "action": "search_free",
                "block": free_block.model_dump()
            })

            if free_block.size >= size:
                # 2. 블록 할당
                address = free_block.start

                new_block = HeapBlock(
                    address=address,
                    size=size,
                    var_name=var_name,
                    status="allocated"
                )
                self.heap_blocks.append(new_block)

                animation.append({
                    "action": "allocate",
                    "block": new_block.model_dump()
                })

                # 3. Free list 업데이트
                if free_block.size == size:
                    # 정확히 맞으면 제거
                    self.free_list.pop(i)
                else:
                    # 남은 공간으로 분할
                    self.free_list[i] = FreeBlock(
                        start=free_block.start + size,
                        size=free_block.size - size
                    )

                animation.append({
                    "action": "update_free_list",
                    "free_list": [f.model_dump() for f in self.free_list]
                })

                return address, animation

        # 빈 공간 없음
        raise MemoryError("메모리 부족: 할당할 수 있는 공간이 없습니다")

    def free(self, var_name: str) -> tuple[int, int, list[dict]]:
        """
        메모리 해제

        Returns:
            tuple: (해제된 주소, 해제된 크기, 애니메이션 스텝)
        """
        animation = []

        # 1. 해당 변수 찾기
        block_idx = None
        for i, block in enumerate(self.heap_blocks):
            if block.var_name == var_name and block.status == "allocated":
                block_idx = i
                break

        if block_idx is None:
            raise KeyError(f"변수 '{var_name}'를 찾을 수 없습니다")

        block = self.heap_blocks[block_idx]
        freed_address = block.address
        freed_size = block.size

        animation.append({
            "action": "mark_free",
            "block": block.model_dump()
        })

        # 2. 블록 제거
        self.heap_blocks.pop(block_idx)

        # 3. Free list에 추가
        new_free = FreeBlock(start=freed_address, size=freed_size)
        self.free_list.append(new_free)

        # 4. 인접 블록 병합 (Coalescing)
        self.free_list.sort(key=lambda x: x.start)
        merged = self._coalesce_free_list()

        if merged:
            animation.append({
                "action": "coalesce",
                "free_list": [f.model_dump() for f in self.free_list]
            })

        return freed_address, freed_size, animation

    def _coalesce_free_list(self) -> bool:
        """인접한 빈 블록 병합"""
        merged = False
        i = 0
        while i < len(self.free_list) - 1:
            current = self.free_list[i]
            next_block = self.free_list[i + 1]

            if current.start + current.size == next_block.start:
                # 병합
                self.free_list[i] = FreeBlock(
                    start=current.start,
                    size=current.size + next_block.size
                )
                self.free_list.pop(i + 1)
                merged = True
            else:
                i += 1

        return merged

    def stack_push(self, function_name: str, variables: list[dict]) -> int:
        """스택 프레임 추가"""
        frame_id = len(self.stack_frames)
        base_pointer = self.sp

        stack_vars = []
        for var in variables:
            self.sp -= var["size"]
            stack_vars.append(StackVariable(
                name=var["name"],
                type=var["type"],
                address=self.sp,
                size=var["size"],
                value=var["value"]
            ))

        frame = StackFrame(
            id=frame_id,
            function_name=function_name,
            base_pointer=base_pointer,
            variables=stack_vars
        )
        self.stack_frames.append(frame)

        return frame_id

    def stack_pop(self) -> Optional[StackFrame]:
        """스택 프레임 제거"""
        if not self.stack_frames:
            return None

        frame = self.stack_frames.pop()
        self.sp = frame.base_pointer
        return frame
```

---

## 7. 유틸리티 (utils/)

### 7.1 utils/sanitizer.py
```python
import re

# 금지된 패턴
FORBIDDEN_PATTERNS = [
    (r'#\s*include\s*<\s*sys/', "시스템 헤더 사용 불가"),
    (r'#\s*include\s*<\s*unistd\.h', "unistd.h 사용 불가"),
    (r'#\s*include\s*<\s*pthread\.h', "pthread.h 사용 불가"),
    (r'#\s*include\s*<\s*signal\.h', "signal.h 사용 불가"),
    (r'#\s*include\s*<\s*netinet/', "네트워크 헤더 사용 불가"),
    (r'#\s*include\s*<\s*arpa/', "네트워크 헤더 사용 불가"),
    (r'\bsystem\s*\(', "system() 사용 불가"),
    (r'\bexec[lvpe]*\s*\(', "exec 계열 함수 사용 불가"),
    (r'\bfork\s*\(', "fork() 사용 불가"),
    (r'\bpopen\s*\(', "popen() 사용 불가"),
    (r'__asm__', "인라인 어셈블리 사용 불가"),
    (r'\basm\s*\(', "asm 사용 불가"),
]


def validate_code(code: str) -> tuple[bool, str]:
    """
    C 코드 검증

    Returns:
        tuple: (통과 여부, 에러 메시지)
    """
    # 길이 제한
    if len(code) > 50000:
        return False, "코드가 너무 깁니다 (최대 50KB)"

    if len(code) < 10:
        return False, "코드가 너무 짧습니다"

    # 금지 패턴 검사
    for pattern, message in FORBIDDEN_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            return False, message

    return True, None
```

### 7.2 utils/docker_utils.py
```python
import asyncio

async def check_docker_health() -> str:
    """Docker 서비스 상태 확인"""
    try:
        process = await asyncio.create_subprocess_exec(
            "docker", "info",
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )
        await process.wait()
        return "ok" if process.returncode == 0 else "error"
    except:
        return "error"


async def check_sandbox_image_exists() -> bool:
    """샌드박스 이미지 존재 확인"""
    from config import get_settings
    settings = get_settings()

    process = await asyncio.create_subprocess_exec(
        "docker", "image", "inspect", settings.SANDBOX_IMAGE,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL
    )
    await process.wait()
    return process.returncode == 0
```

### 7.3 utils/exceptions.py
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from models.responses import ApiResponse, ErrorInfo


class CoslabException(Exception):
    """커스텀 예외 기본 클래스"""
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code


class ValidationError(CoslabException):
    def __init__(self, message: str):
        super().__init__("VALIDATION_ERROR", message, 400)


class ExecutionTimeoutError(CoslabException):
    def __init__(self, timeout: int):
        super().__init__("EXECUTION_TIMEOUT", f"실행 시간이 {timeout}초를 초과했습니다", 408)


def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(CoslabException)
    async def coslab_exception_handler(request: Request, exc: CoslabException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiResponse(
                success=False,
                error=ErrorInfo(code=exc.code, message=exc.message)
            ).model_dump()
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        # 로깅
        import logging
        logging.error(f"Unhandled exception: {exc}", exc_info=True)

        return JSONResponse(
            status_code=500,
            content=ApiResponse(
                success=False,
                error=ErrorInfo(
                    code="INTERNAL_ERROR",
                    message="서버 오류가 발생했습니다"
                )
            ).model_dump()
        )
```

---

## 8. 구현 순서 (권장)

```
Phase 1: 기본 구조
├── 1.1 프로젝트 초기화 (requirements.txt)
├── 1.2 config.py 작성
├── 1.3 main.py 기본 구조
├── 1.4 models/ 전체 작성
├── 1.5 utils/exceptions.py 작성
└── 1.6 /health 엔드포인트

Phase 2: 코드 실행기 (MVP 핵심)
├── 2.1 Docker 샌드박스 이미지 빌드
├── 2.2 utils/sanitizer.py 작성
├── 2.3 services/compiler_service.py
├── 2.4 services/executor_service.py
├── 2.5 routers/runner.py
└── 2.6 테스트

Phase 3: AI 튜터
├── 3.1 Ollama 설치 및 모델 다운로드
├── 3.2 services/llm_service.py
├── 3.3 routers/ai.py
└── 3.4 테스트

Phase 4: 메모리 시뮬레이터
├── 4.1 services/memory_service.py
├── 4.2 routers/memory.py
└── 4.3 테스트

Phase 5: 통합 및 다듬기
├── 5.1 Rate Limiting 추가
├── 5.2 로깅 설정
├── 5.3 전체 테스트
└── 5.4 문서화 (OpenAPI)
```

---

## 9. 의존성 패키지 (requirements.txt)

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0
httpx==0.26.0
python-multipart==0.0.6

# 테스트
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0

# 개발
ruff==0.1.11
```

---

## 10. 프론트엔드 ↔ 백엔드 연결 요약

| 프론트엔드 훅 | 호출하는 API | 백엔드 라우터 |
|--------------|-------------|--------------|
| `useChat().sendMessage()` | `POST /ai/ask` | `routers/ai.py` |
| `useCodeRunner().runCode()` | `POST /c/run` | `routers/runner.py` |
| `useMemorySimulator().initMemory()` | `POST /os/sim/memory/init` | `routers/memory.py` |
| `useMemorySimulator().malloc()` | `POST /os/sim/memory/malloc` | `routers/memory.py` |
| `useMemorySimulator().free()` | `POST /os/sim/memory/free` | `routers/memory.py` |
