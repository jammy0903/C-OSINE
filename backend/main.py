"""
COSLAB Backend - C 코드 메모리 트레이서 API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from simulator import simulate_code  # GDB 대신 교육용 시뮬레이터
from tracer import run_c_code, judge_c_code  # 코드 실행 및 채점

app = FastAPI(
    title="COSLAB API",
    description="C 코드 실행 및 메모리 트레이싱",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에선 특정 도메인만
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TraceRequest(BaseModel):
    code: str
    timeout: int = 10

class TraceResponse(BaseModel):
    success: bool
    steps: list = []
    source_lines: List[str] = []
    error: str = ""
    message: str = ""

    class Config:
        arbitrary_types_allowed = True

# 코드 실행 요청 (Judge0 대체)
class RunRequest(BaseModel):
    code: str
    stdin: str = ""
    timeout: int = 5

class RunResponse(BaseModel):
    success: bool
    output: str
    error: Optional[str] = None

# 채점 요청
class TestCase(BaseModel):
    input: str = ""
    output: str

class JudgeRequest(BaseModel):
    code: str
    testCases: List[TestCase]
    timeout: int = 5

class TestCaseResult(BaseModel):
    input: str
    expected: str
    actual: str
    passed: bool
    error: Optional[str] = None

class JudgeResponse(BaseModel):
    results: List[TestCaseResult]
    allPassed: bool
    passedCount: int
    totalCount: int

# 사용자 등록 요청
class RegisterUserRequest(BaseModel):
    firebaseUid: str
    email: str
    name: str

# 제출 기록 요청
class SubmissionRequest(BaseModel):
    firebaseUid: str
    problemId: str
    code: str
    verdict: str  # accepted, wrong_answer, compile_error, runtime_error, time_limit

# 간단한 인메모리 저장소 (나중에 DB로 교체)
users_db: dict = {}
submissions_db: list = []

# 보안 체크 헬퍼 (재사용)
DANGEROUS_PATTERNS = [
    "system(", "exec(", "popen(", "fork(",
    "unlink(", "remove(", "rmdir(",
    "#include <sys/", "asm(", "__asm__"
]

def check_code_security(code: str) -> None:
    """코드 보안 검사 - 위험 패턴 발견시 예외"""
    if not code.strip():
        raise HTTPException(status_code=400, detail="코드가 비어있습니다")

    for pattern in DANGEROUS_PATTERNS:
        if pattern in code:
            raise HTTPException(
                status_code=400,
                detail=f"보안상 허용되지 않는 코드: {pattern}"
            )


@app.get("/")
def root():
    return {"status": "ok", "service": "COSLAB API"}

@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/run", response_model=RunResponse)
def run(request: RunRequest):
    """
    C 코드 컴파일 및 실행 (Judge0 대체)

    - **code**: C 소스 코드
    - **stdin**: 표준 입력
    - **timeout**: 최대 실행 시간 (초, 최대 10초)
    """
    check_code_security(request.code)

    result = run_c_code(
        request.code,
        stdin=request.stdin,
        timeout=min(request.timeout, 10)
    )

    return RunResponse(
        success=result.get("success", False),
        output=result.get("output", ""),
        error=result.get("error")
    )


@app.post("/api/judge", response_model=JudgeResponse)
def judge(request: JudgeRequest):
    """
    테스트케이스로 C 코드 채점 (Judge0 대체)

    - **code**: C 소스 코드
    - **testCases**: 테스트 케이스 목록 [{input, output}, ...]
    - **timeout**: 케이스당 최대 실행 시간 (초)
    """
    check_code_security(request.code)

    if not request.testCases:
        raise HTTPException(status_code=400, detail="테스트 케이스가 없습니다")

    # Pydantic 모델 → dict 변환
    test_cases = [{"input": tc.input, "output": tc.output} for tc in request.testCases]

    result = judge_c_code(
        request.code,
        test_cases,
        timeout=min(request.timeout, 10)
    )

    return JudgeResponse(
        results=[TestCaseResult(**r) for r in result["results"]],
        allPassed=result["allPassed"],
        passedCount=result["passedCount"],
        totalCount=result["totalCount"]
    )


@app.post("/api/users/register")
def register_user(request: RegisterUserRequest):
    """사용자 등록 (Firebase 로그인 후)"""
    users_db[request.firebaseUid] = {
        "email": request.email,
        "name": request.name
    }
    return {"success": True, "message": "사용자 등록 완료"}


@app.post("/api/submissions")
def create_submission(request: SubmissionRequest):
    """제출 기록 생성"""
    submissions_db.append({
        "firebaseUid": request.firebaseUid,
        "problemId": request.problemId,
        "code": request.code,
        "verdict": request.verdict
    })
    return {"success": True}


@app.get("/api/submissions/solved/{firebase_uid}")
def get_solved_status(firebase_uid: str):
    """사용자의 풀이 상태 조회"""
    user_submissions = [s for s in submissions_db if s["firebaseUid"] == firebase_uid]

    solved = list(set(s["problemId"] for s in user_submissions if s["verdict"] == "accepted"))
    attempted = list(set(s["problemId"] for s in user_submissions if s["verdict"] != "accepted" and s["problemId"] not in solved))

    return {"solved": solved, "attempted": attempted}


@app.post("/api/trace", response_model=TraceResponse)
def trace(request: TraceRequest):
    """
    C 코드를 실행하고 각 스텝의 메모리 상태를 반환

    - **code**: C 소스 코드
    - **timeout**: 최대 실행 시간 (초)

    Returns:
        각 실행 스텝의 메모리 상태 (스택, 힙, 변수 값)
    """
    check_code_security(request.code)

    result = simulate_code(request.code, timeout=min(request.timeout, 30))

    return TraceResponse(
        success=result.get("success", False),
        steps=result.get("steps", []),
        source_lines=result.get("source_lines", []),
        error=result.get("error", ""),
        message=result.get("message", "")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
