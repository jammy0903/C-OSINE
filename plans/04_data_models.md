# 04. 데이터 모델 설계 (Data Models)

---

## 1. 메모리 시뮬레이터 모델

### 1.1 전체 메모리 상태
```typescript
interface MemoryState {
  session_id: string;
  heap: HeapState;
  stack: StackState;
  created_at: timestamp;
}
```

### 1.2 힙 (Heap)
```typescript
interface HeapState {
  total_size: number;        // 전체 힙 크기
  used_size: number;         // 사용 중인 크기
  blocks: HeapBlock[];       // 할당된 블록들
  free_list: FreeBlock[];    // 빈 블록 리스트
}

interface HeapBlock {
  address: number;           // 시작 주소
  size: number;              // 블록 크기
  var_name: string;          // 변수명 (예: ptr1)
  status: 'allocated' | 'freed';
  allocated_at: timestamp;
}

interface FreeBlock {
  start: number;             // 시작 주소
  size: number;              // 블록 크기
}
```

### 1.3 스택 (Stack)
```typescript
interface StackState {
  total_size: number;        // 전체 스택 크기
  sp: number;                // 스택 포인터 (현재 위치)
  frames: StackFrame[];      // 스택 프레임들
}

interface StackFrame {
  id: number;                // 프레임 ID
  function_name: string;     // 함수명
  base_pointer: number;      // 베이스 포인터
  variables: StackVariable[];// 지역 변수들
  return_address: number;    // 리턴 주소 (시뮬레이션)
}

interface StackVariable {
  name: string;              // 변수명
  type: string;              // 타입 (int, char*, etc)
  address: number;           // 스택 주소
  size: number;              // 크기 (bytes)
  value: any;                // 값
}
```

### 1.4 포인터 참조
```typescript
interface PointerReference {
  from_var: string;          // 포인터 변수명
  from_address: number;      // 포인터 주소
  to_address: number;        // 가리키는 주소
  to_var: string | null;     // 가리키는 변수명 (있으면)
}
```

---

## 2. OS 스케줄러 모델

### 2.1 프로세스
```typescript
interface Process {
  pid: number;               // 프로세스 ID
  name: string;              // 프로세스 이름
  arrival_time: number;      // 도착 시간
  burst_time: number;        // 실행 시간
  priority: number;          // 우선순위 (낮을수록 높음)
  remaining_time: number;    // 남은 실행 시간
  state: ProcessState;       // 현재 상태
}

type ProcessState = 'new' | 'ready' | 'running' | 'waiting' | 'terminated';
```

### 2.2 스케줄링 결과
```typescript
interface ScheduleResult {
  algorithm: SchedulingAlgorithm;
  time_quantum?: number;     // RR인 경우
  gantt_chart: GanttEntry[];
  metrics: ScheduleMetrics;
  per_process: ProcessMetrics[];
  timeline: TimelineEvent[]; // 애니메이션용
}

type SchedulingAlgorithm = 'fcfs' | 'sjf' | 'srtf' | 'rr' | 'priority';

interface GanttEntry {
  pid: number;
  start: number;
  end: number;
}

interface ScheduleMetrics {
  avg_waiting_time: number;
  avg_turnaround_time: number;
  avg_response_time: number;
  cpu_utilization: number;   // 0-100
  throughput: number;        // processes per unit time
}

interface ProcessMetrics {
  pid: number;
  waiting_time: number;
  turnaround_time: number;
  response_time: number;
  completion_time: number;
}
```

### 2.3 타임라인 이벤트 (애니메이션)
```typescript
interface TimelineEvent {
  time: number;
  type: 'arrive' | 'schedule' | 'preempt' | 'complete' | 'context_switch';
  pid: number;
  description: string;
  ready_queue: number[];     // 현재 Ready Queue
}
```

---

## 3. 페이징 시뮬레이터 모델 (MVP 이후)

### 3.1 페이지 테이블
```typescript
interface PageTable {
  entries: PageTableEntry[];
  page_size: number;         // 페이지 크기 (예: 4KB)
}

interface PageTableEntry {
  page_number: number;
  frame_number: number | null;  // null이면 not present
  valid: boolean;
  dirty: boolean;
  accessed: boolean;
  protection: 'r' | 'rw' | 'rx' | 'rwx';
}
```

### 3.2 물리 메모리 (프레임)
```typescript
interface PhysicalMemory {
  total_frames: number;
  frames: Frame[];
}

interface Frame {
  frame_number: number;
  page_number: number | null;  // null이면 free
  process_id: number | null;
}
```

### 3.3 TLB
```typescript
interface TLB {
  size: number;
  entries: TLBEntry[];
  hit_count: number;
  miss_count: number;
}

interface TLBEntry {
  page_number: number;
  frame_number: number;
  valid: boolean;
  last_accessed: timestamp;
}
```

---

## 4. 학습 통계 모델 (MVP 이후)

### 4.1 사용자 (인증 구현 후)
```typescript
interface User {
  id: string;
  email: string;
  nickname: string;
  created_at: timestamp;
  last_active: timestamp;
}
```

### 4.2 학습 세션
```typescript
interface LearningSession {
  id: string;
  user_id: string | null;    // 익명이면 null
  started_at: timestamp;
  ended_at: timestamp | null;
  events: LearningEvent[];
}
```

### 4.3 학습 이벤트
```typescript
interface LearningEvent {
  id: string;
  session_id: string;
  type: EventType;
  timestamp: timestamp;
  metadata: Record<string, any>;
}

type EventType =
  | 'question_asked'         // AI 질문
  | 'code_submitted'         // 코드 제출
  | 'compile_success'        // 컴파일 성공
  | 'compile_error'          // 컴파일 에러
  | 'runtime_error'          // 런타임 에러
  | 'memory_sim_action'      // 메모리 시뮬레이션
  | 'scheduler_sim_action';  // 스케줄러 시뮬레이션
```

### 4.4 통계 집계
```typescript
interface UserStats {
  user_id: string | null;
  total_questions: number;
  total_code_runs: number;
  compile_success_count: number;
  compile_error_count: number;
  topics_studied: TopicCount[];
  streak_days: number;
  last_study_date: date;
}

interface TopicCount {
  topic: string;             // pointers, memory, arrays, etc
  count: number;
}
```

---

## 5. API Request/Response 스키마 (Pydantic)

### 5.1 AI Tutor
```python
# requests.py
class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: list[ChatMessage] = Field(default=[], max_items=10)

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

# responses.py
class AskResponse(BaseModel):
    success: bool
    data: AskData | None
    error: ErrorInfo | None

class AskData(BaseModel):
    response: str
    code_examples: list[CodeExample] = []

class CodeExample(BaseModel):
    language: str
    code: str
```

### 5.2 C Runner
```python
class RunCodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000)
    stdin: str = Field(default="", max_length=10000)
    timeout: int = Field(default=10, ge=1, le=30)

class RunCodeResponse(BaseModel):
    success: bool
    data: RunResult | None
    error: ErrorInfo | None

class RunResult(BaseModel):
    compiled: bool
    executed: bool
    stdout: str
    stderr: str
    exit_code: int | None
    execution_time_ms: int | None
    memory_used_kb: int | None
```

### 5.3 Memory Simulator
```python
class MemoryInitRequest(BaseModel):
    heap_size: int = Field(default=1024, ge=64, le=65536)
    stack_size: int = Field(default=256, ge=32, le=8192)

class MallocRequest(BaseModel):
    session_id: str
    size: int = Field(..., ge=1, le=65536)
    var_name: str = Field(..., min_length=1, max_length=50)

class FreeRequest(BaseModel):
    session_id: str
    var_name: str
```

---

## 6. 프론트엔드 상태 모델 (Recoil)

### 6.1 Atoms
```typescript
// 채팅 상태
const chatMessagesAtom = atom<ChatMessage[]>({
  key: 'chatMessages',
  default: [],
});

// 코드 에디터 상태
const codeEditorAtom = atom<string>({
  key: 'codeEditor',
  default: '#include <stdio.h>\n\nint main() {\n    return 0;\n}',
});

// 실행 결과 상태
const runResultAtom = atom<RunResult | null>({
  key: 'runResult',
  default: null,
});

// 메모리 시뮬레이터 상태
const memoryStateAtom = atom<MemoryState | null>({
  key: 'memoryState',
  default: null,
});

// 현재 탭
const activeTabAtom = atom<'tutor' | 'runner' | 'memory' | 'scheduler'>({
  key: 'activeTab',
  default: 'tutor',
});
```

### 6.2 Selectors
```typescript
// 힙 사용률
const heapUsageSelector = selector({
  key: 'heapUsage',
  get: ({get}) => {
    const state = get(memoryStateAtom);
    if (!state) return 0;
    return (state.heap.used_size / state.heap.total_size) * 100;
  },
});

// 컴파일 성공률
const compileSuccessRateSelector = selector({
  key: 'compileSuccessRate',
  get: ({get}) => {
    const stats = get(userStatsAtom);
    const total = stats.compile_success_count + stats.compile_error_count;
    if (total === 0) return 0;
    return (stats.compile_success_count / total) * 100;
  },
});
```
