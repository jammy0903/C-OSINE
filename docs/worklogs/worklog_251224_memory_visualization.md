# Working Log: Memory Visualization Animation

**Date**: 2025-12-24
**Feature**: 메모리 시각화 애니메이션 시스템
**Status**: Completed

---

## 1. 목표

C 코드 실행 시 메모리 구조(레지스터, 스택, 힙)를 교육용 애니메이션으로 시각화

### 핵심 기능
- 전체 프로세스 메모리 레이아웃 (CODE, DATA, HEAP, STACK)
- Stack/Heap 클릭 시 확대 뷰
- RSP/RBP 레지스터 실시간 표시
- 단계별 실행 + 애니메이션 속도 조절

---

## 2. 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| 애니메이션 | **Framer Motion** | React 친화적, AnimatePresence로 mount/unmount 쉬움 |
| 레지스터 표기 | **64비트 (RSP/RBP)** | 현재 백엔드가 이 방식 사용 |
| 구현 방식 | **새 컴포넌트 분리** | 기존 MemoryViz.tsx 유지, 점진적 도입 |

### 라이브러리 비교 (참고)

| 라이브러리 | 번들 크기 | React 친화도 | 선택 여부 |
|-----------|----------|-------------|----------|
| Framer Motion | ~25KB | ⭐⭐⭐ | **선택** |
| CSS/Tailwind | 0 | ⭐⭐ | - |
| React Spring | ~15KB | ⭐⭐⭐ | - |
| GSAP | ~60KB | ⭐ | - |

---

## 3. 파일 구조

```
frontend/src/components/memory-viz/
├── index.tsx                      # Export point
├── ProcessMemoryVisualization.tsx # 메인 컨테이너 (코드 에디터 + 메모리 뷰)
├── types.ts                       # Step, MemoryBlock, ViewMode 등 타입
├── constants.ts                   # 애니메이션 타이밍, 색상 상수
├── utils.ts                       # 주소 포맷팅, 블록 비교 함수
│
├── components/
│   ├── CPURegistersPanel.tsx      # RSP/RBP/RIP 표시 패널
│   ├── ProcessMemoryView.tsx      # 전체 메모리 레이아웃 (개요)
│   ├── MemorySegment.tsx          # CODE/DATA/HEAP/STACK 세그먼트
│   ├── StackDetailView.tsx        # 스택 확대 뷰 (RSP/RBP 화살표)
│   └── HeapDetailView.tsx         # 힙 확대 뷰 (malloc 블록)
│
└── hooks/
    └── useStepTransition.ts       # 단계 변화 감지 + 애니메이션 트리거
```

---

## 4. 주요 컴포넌트 설명

### ProcessMemoryVisualization.tsx (메인)
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │  Code       │  │   CPU      │  │    Memory           │  │
│  │  Editor     │  │ Registers  │  │    Visualization    │  │
│  │             │  │            │  │                     │  │
│  │  - textarea │  │  RSP: ...  │  │  - Overview         │  │
│  │  - stdin    │  │  RBP: ...  │  │  - Stack Detail     │  │
│  │  - controls │  │  Line: 5   │  │  - Heap Detail      │  │
│  │             │  │            │  │                     │  │
│  └─────────────┘  └────────────┘  └─────────────────────┘  │
│  [Analyze] [◀ Prev] 3/10 [Next ▶]   [slow ○ ● fast]       │
└─────────────────────────────────────────────────────────────┘
```

### ProcessMemoryView.tsx (개요 모드)
```
┌────────────────────────────────┐
│  High Address (0x7fff...)      │
│  ┌──────────────────────────┐  │
│  │        STACK             │ ◀─ 클릭 시 StackDetailView
│  │   (함수, 지역변수)        │
│  └──────────────────────────┘  │
│  RSP: ...de00  RBP: ...de10    │
│  ┌ ─ ─ ─ FREE SPACE ─ ─ ─ ┐   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│  ┌──────────────────────────┐  │
│  │        HEAP              │ ◀─ 클릭 시 HeapDetailView
│  │   (malloc 할당)          │
│  └──────────────────────────┘  │
│  ┌────────────┐ ┌────────────┐ │
│  │   DATA     │ │   CODE     │ │
│  └────────────┘ └────────────┘ │
│  Low Address (0x00400000)      │
└────────────────────────────────┘
```

### StackDetailView.tsx (스택 확대)
```
┌────────────────────────────────────────┐
│  Address  │ Name    │ Type  │ Value   │
│───────────┼─────────┼───────┼─────────│
│  ...de10  │ main()  │       │         │
│───────────┼─────────┼───────┼─────────│
│  ...de08  │ arg: 20 │ int   │ 20      │
│  ...de04  │ arg: 10 │ int   │ 10      │
│  ...de00  │ ret_addr│       │         │ ◀─ RBP
│───────────┼─────────┼───────┼─────────│
│  ...ddfc  │ old_rbp │       │         │
│  ...ddf8  │ a       │ int   │ 5       │
│  ...ddf4  │ b       │ int   │ 3       │ ◀─ RSP
└────────────────────────────────────────┘
```

---

## 5. 데이터 흐름

```
User clicks "Analyze"
        │
        ▼
traceCode(code, stdin)  ──────▶  POST /api/memory/trace
        │                                   │
        │                                   ▼
        │                        backend simulator.ts
        │                        (C 코드 파싱, 메모리 시뮬레이션)
        │                                   │
        ▼                                   ▼
setSteps(result.steps)  ◀──────  { steps: Step[], success }
        │
        ▼
currentStep = steps[currentStepIndex]
        │
        ├──▶ CPURegistersPanel (rsp, rbp, line)
        │
        ├──▶ ProcessMemoryView (stack, heap)
        │         │
        │         ├──▶ StackDetailView (확대 시)
        │         └──▶ HeapDetailView (확대 시)
        │
        └──▶ useStepTransition (애니메이션 트리거)
```

---

## 6. 애니메이션 시나리오

| 이벤트 | RSP | RBP | 메모리 블록 |
|--------|-----|-----|------------|
| 변수 선언 (`int x = 5`) | ↓ 이동 | - | fade-in |
| 값 변경 (`x = 10`) | - | - | highlight flash |
| 포인터 선언 (`int *p = &x`) | ↓ 이동 | - | fade-in + 화살표 |
| malloc | ↓ (포인터) | - | 힙 블록 slide-in |
| free | - | - | 힙 블록 fade-out |

### Framer Motion 사용 예시

```tsx
// 블록 등장 애니메이션
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 20 }}
  transition={{ duration: 0.3 }}
>

// 값 변경 하이라이트
<motion.div
  key={block.value}
  initial={{ scale: 1.1, color: '#6366f1' }}
  animate={{ scale: 1, color: '#ffffff' }}
>

// 뷰 전환
<AnimatePresence mode="wait">
  {viewMode === 'overview' && <ProcessMemoryView />}
  {viewMode === 'stack-detail' && <StackDetailView />}
</AnimatePresence>
```

---

## 7. 주요 타입 정의

```typescript
// types.ts

interface MemoryBlock {
  name: string;        // 변수명
  address: string;     // "0x7fffffffde00"
  type: string;        // "int", "int *", "int[5]"
  size: number;        // 바이트 크기
  bytes: number[];     // 실제 바이트 배열
  value: string;       // 표시할 값
  points_to: string | null;  // 포인터가 가리키는 주소
}

interface Step {
  line: number;        // 현재 실행 라인
  code: string;        // 해당 라인 코드
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  explanation: string; // 한글 설명
  rsp: string;         // 스택 포인터
  rbp: string;         // 베이스 포인터
}

type ViewMode = 'overview' | 'stack-detail' | 'heap-detail';
type AnimationSpeed = 'slow' | 'normal' | 'fast';
```

---

## 8. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `package.json` | `framer-motion` 의존성 추가 |
| `App.tsx` | `ProcessMemoryVisualization` import 및 사용 |
| `memory-viz/*` | 새로 생성된 모든 파일 (11개) |

---

## 9. 실행 방법

```bash
cd frontend
npm run dev
```

1. Memory 탭 클릭
2. C 코드 입력 (기본 예시 제공)
3. "Analyze" 버튼 클릭
4. Prev/Next로 단계별 실행
5. STACK 또는 HEAP 클릭하여 상세 보기

---

## 10. 향후 개선 사항

- [ ] 함수 호출 시뮬레이션 (call stack)
- [ ] 포인터 화살표 애니메이션 (react-xarrows 통합)
- [ ] 키보드 단축키 (← → 키로 단계 이동)
- [ ] 코드 하이라이팅 (CodeMirror 통합)
- [ ] 모바일 반응형 레이아웃

---

## 11. 참고 다이어그램

사용자가 요청한 원본 다이어그램 (복잡도 6/10):

```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESS MEMORY                           │
│                                                             │
│  ┌───────────┐      ┌─────────────────────────────────────┐│
│  │    CPU    │      │  0xFFFFFFFF                         ││
│  │           │      │  ┌───────────────────────────────┐  ││
│  │ RSP ──────┼──────┼──┼────▶ STACK (지역변수, 함수)   │  ││
│  │ RBP ──────┼──────┼──┼──▶   ▼ 아래로 자람            │  ││
│  │ RIP ──────┼──┐   │  │                               │  ││
│  │           │  │   │  ├ ─ ─ ─ FREE SPACE ─ ─ ─ ─ ─ ─ ┤  ││
│  └───────────┘  │   │  │      ▲ 위로 자람              │  ││
│                 │   │  │      HEAP (malloc)            │  ││
│                 │   │  ├───────────────────────────────┤  ││
│                 │   │  │      DATA (전역변수)          │  ││
│                 │   │  ├───────────────────────────────┤  ││
│                 └───┼──┼──▶   CODE (실행 코드)         │  ││
│                     │  └───────────────────────────────┘  ││
│                     │  0x00000000                         ││
│                     └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

**End of Working Log**
