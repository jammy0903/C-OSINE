# 07. 테스트 전략 (Testing Strategy)

---

## 1. 테스트 피라미드

```
        ╱╲
       ╱  ╲
      ╱ E2E╲        5% - 핵심 사용자 플로우만
     ╱──────╲
    ╱        ╲
   ╱Integration╲   25% - API, 서비스 간 연동
  ╱────────────╲
 ╱              ╲
╱   Unit Tests   ╲ 70% - 개별 함수/컴포넌트
╱────────────────╲
```

---

## 2. 백엔드 테스트

### 2.1 단위 테스트 (pytest)

**테스트 구조**
```
/backend
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # fixtures
│   ├── unit/
│   │   ├── test_sanitizer.py
│   │   ├── test_memory_sim.py
│   │   └── test_scheduler.py
│   ├── integration/
│   │   ├── test_ai_endpoint.py
│   │   ├── test_runner_endpoint.py
│   │   └── test_simulator_endpoint.py
│   └── e2e/
│       └── test_full_flow.py
```

**코드 검증 테스트**
```python
# tests/unit/test_sanitizer.py
import pytest
from services.sanitizer import validate_code

class TestCodeValidation:

    def test_valid_hello_world(self):
        code = '#include <stdio.h>\nint main() { printf("Hi"); return 0; }'
        valid, error = validate_code(code)
        assert valid is True
        assert error is None

    def test_reject_system_call(self):
        code = '#include <stdlib.h>\nint main() { system("ls"); return 0; }'
        valid, error = validate_code(code)
        assert valid is False
        assert "허용되지 않는" in error

    def test_reject_fork(self):
        code = '#include <unistd.h>\nint main() { fork(); return 0; }'
        valid, error = validate_code(code)
        assert valid is False

    def test_reject_exec(self):
        code = 'int main() { execve("/bin/sh", NULL, NULL); return 0; }'
        valid, error = validate_code(code)
        assert valid is False

    def test_reject_inline_asm(self):
        code = 'int main() { __asm__("nop"); return 0; }'
        valid, error = validate_code(code)
        assert valid is False

    def test_max_length(self):
        code = "a" * 60000
        valid, error = validate_code(code)
        assert valid is False
        assert "너무 깁니다" in error
```

**메모리 시뮬레이터 테스트**
```python
# tests/unit/test_memory_sim.py
import pytest
from services.memory_sim import MemorySimulator

class TestMemorySimulator:

    def test_init_creates_free_heap(self):
        sim = MemorySimulator(heap_size=1024, stack_size=256)
        assert sim.heap.total_size == 1024
        assert len(sim.heap.free_list) == 1
        assert sim.heap.free_list[0].size == 1024

    def test_malloc_allocates_block(self):
        sim = MemorySimulator(heap_size=1024)
        address = sim.malloc(64, "ptr1")
        assert address == 0
        assert len(sim.heap.blocks) == 1
        assert sim.heap.blocks[0].size == 64

    def test_malloc_updates_free_list(self):
        sim = MemorySimulator(heap_size=1024)
        sim.malloc(64, "ptr1")
        assert sim.heap.free_list[0].start == 64
        assert sim.heap.free_list[0].size == 960

    def test_free_releases_block(self):
        sim = MemorySimulator(heap_size=1024)
        sim.malloc(64, "ptr1")
        sim.free("ptr1")
        assert len(sim.heap.blocks) == 0

    def test_free_coalesces_adjacent_blocks(self):
        sim = MemorySimulator(heap_size=1024)
        sim.malloc(64, "ptr1")
        sim.malloc(64, "ptr2")
        sim.free("ptr1")
        sim.free("ptr2")
        # 인접 블록 병합 후 free_list는 하나
        assert len(sim.heap.free_list) == 1
        assert sim.heap.free_list[0].size == 1024

    def test_malloc_fails_when_no_space(self):
        sim = MemorySimulator(heap_size=64)
        sim.malloc(64, "ptr1")
        with pytest.raises(MemoryError):
            sim.malloc(64, "ptr2")
```

**스케줄러 테스트**
```python
# tests/unit/test_scheduler.py
import pytest
from services.scheduler import Scheduler, Process

class TestScheduler:

    def test_fcfs_order(self):
        processes = [
            Process(pid=1, arrival=0, burst=3),
            Process(pid=2, arrival=1, burst=2),
            Process(pid=3, arrival=2, burst=1),
        ]
        result = Scheduler.fcfs(processes)
        # FCFS: P1 → P2 → P3 순서
        assert result.gantt_chart[0].pid == 1
        assert result.gantt_chart[1].pid == 2
        assert result.gantt_chart[2].pid == 3

    def test_sjf_shortest_first(self):
        processes = [
            Process(pid=1, arrival=0, burst=5),
            Process(pid=2, arrival=0, burst=2),
            Process(pid=3, arrival=0, burst=3),
        ]
        result = Scheduler.sjf(processes)
        # SJF: P2(2) → P3(3) → P1(5)
        assert result.gantt_chart[0].pid == 2
        assert result.gantt_chart[1].pid == 3
        assert result.gantt_chart[2].pid == 1

    def test_round_robin_preemption(self):
        processes = [
            Process(pid=1, arrival=0, burst=4),
            Process(pid=2, arrival=0, burst=3),
        ]
        result = Scheduler.round_robin(processes, quantum=2)
        # RR(q=2): P1(2) → P2(2) → P1(2) → P2(1)
        assert len(result.gantt_chart) == 4
        assert result.gantt_chart[0].pid == 1
        assert result.gantt_chart[1].pid == 2

    def test_metrics_calculation(self):
        processes = [
            Process(pid=1, arrival=0, burst=3),
        ]
        result = Scheduler.fcfs(processes)
        assert result.per_process[0].waiting_time == 0
        assert result.per_process[0].turnaround_time == 3
```

---

### 2.2 통합 테스트

**API 엔드포인트 테스트**
```python
# tests/integration/test_runner_endpoint.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestRunnerEndpoint:

    def test_successful_compilation(self):
        response = client.post("/api/v1/c/run", json={
            "code": '#include <stdio.h>\nint main() { printf("Hello"); return 0; }'
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["compiled"] is True
        assert "Hello" in data["data"]["stdout"]

    def test_compilation_error(self):
        response = client.post("/api/v1/c/run", json={
            "code": 'int main() { printf("Missing include"); }'
        })
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["compiled"] is False
        assert "error" in data["data"]["stderr"].lower()

    def test_runtime_error(self):
        response = client.post("/api/v1/c/run", json={
            "code": '#include <stdio.h>\nint main() { int *p = NULL; *p = 1; return 0; }'
        })
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["compiled"] is True
        assert data["data"]["exit_code"] != 0

    def test_forbidden_code_rejected(self):
        response = client.post("/api/v1/c/run", json={
            "code": '#include <stdlib.h>\nint main() { system("ls"); return 0; }'
        })
        assert response.status_code == 400

    def test_stdin_input(self):
        code = '''
        #include <stdio.h>
        int main() {
            int x;
            scanf("%d", &x);
            printf("%d", x * 2);
            return 0;
        }
        '''
        response = client.post("/api/v1/c/run", json={
            "code": code,
            "stdin": "5"
        })
        assert response.status_code == 200
        assert "10" in response.json()["data"]["stdout"]

    def test_timeout(self):
        code = '#include <stdio.h>\nint main() { while(1); return 0; }'
        response = client.post("/api/v1/c/run", json={
            "code": code,
            "timeout": 2
        })
        assert response.status_code == 408
```

---

### 2.3 보안 테스트

```python
# tests/integration/test_security.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestSecurityMeasures:

    @pytest.mark.parametrize("malicious_code", [
        '#include <unistd.h>\nint main() { fork(); while(1); }',  # fork bomb
        '#include <stdio.h>\nint main() { FILE *f = fopen("/etc/passwd", "r"); }',  # file read
        'int main() { __asm__("syscall"); }',  # inline asm
        '#include <stdlib.h>\nint main() { system("cat /etc/passwd"); }',  # system
    ])
    def test_malicious_code_blocked(self, malicious_code):
        response = client.post("/api/v1/c/run", json={
            "code": malicious_code
        })
        # 400 (검증 실패) 또는 실행되더라도 실패해야 함
        assert response.status_code in [400, 200]
        if response.status_code == 200:
            data = response.json()
            # 성공적으로 실행되지 않아야 함
            assert data["data"]["compiled"] is False or data["data"]["exit_code"] != 0

    def test_rate_limiting(self):
        # 21번 연속 요청 (limit: 20/min)
        for i in range(21):
            response = client.post("/api/v1/c/run", json={
                "code": 'int main() { return 0; }'
            })
        assert response.status_code == 429
```

---

## 3. 프론트엔드 테스트

### 3.1 단위 테스트 (Vitest)

```typescript
// src/components/__tests__/MessageBubble.test.tsx
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    render(<MessageBubble role="user" content="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders code blocks with syntax highlighting', () => {
    const content = '```c\nint x = 10;\n```';
    render(<MessageBubble role="assistant" content={content} />);
    expect(screen.getByText('int x = 10;')).toBeInTheDocument();
  });

  it('applies correct styles for user vs assistant', () => {
    const { rerender } = render(<MessageBubble role="user" content="test" />);
    expect(screen.getByTestId('bubble')).toHaveClass('bg-blue-500');

    rerender(<MessageBubble role="assistant" content="test" />);
    expect(screen.getByTestId('bubble')).toHaveClass('bg-gray-700');
  });
});
```

### 3.2 컴포넌트 테스트

```typescript
// src/visualizers/__tests__/HeapVisualizer.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeapVisualizer } from '../HeapVisualizer';
import { RecoilRoot } from 'recoil';

describe('HeapVisualizer', () => {
  it('displays allocated blocks', () => {
    const state = {
      heap: {
        blocks: [{ address: 0, size: 64, var_name: 'ptr1', status: 'allocated' }],
        free_list: [{ start: 64, size: 960 }]
      }
    };

    render(
      <RecoilRoot>
        <HeapVisualizer state={state} />
      </RecoilRoot>
    );

    expect(screen.getByText('ptr1')).toBeInTheDocument();
    expect(screen.getByText('64B')).toBeInTheDocument();
  });

  it('animates malloc operation', async () => {
    // ... animation test
  });
});
```

---

## 4. E2E 테스트 (Playwright)

```typescript
// e2e/code-runner.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Code Runner', () => {
  test('compiles and runs hello world', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="tab-runner"]');

    // 코드 입력
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type('#include <stdio.h>\nint main() { printf("Hello"); return 0; }');

    // 실행
    await page.click('[data-testid="run-button"]');

    // 결과 확인
    await expect(page.locator('[data-testid="output"]')).toContainText('Hello');
  });

  test('shows compilation error', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="tab-runner"]');

    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type('int main() { syntax error }');

    await page.click('[data-testid="run-button"]');

    await expect(page.locator('[data-testid="error-output"]')).toBeVisible();
  });
});
```

---

## 5. 테스트 실행 명령어

```bash
# Backend
cd backend
pytest                          # 전체 테스트
pytest tests/unit               # 단위 테스트만
pytest tests/integration        # 통합 테스트만
pytest --cov=services --cov-report=html  # 커버리지

# Frontend
cd frontend
npm test                        # Vitest 실행
npm run test:coverage           # 커버리지

# E2E
npm run test:e2e                # Playwright 실행
```

---

## 6. CI에서 테스트

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest --cov

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
```
