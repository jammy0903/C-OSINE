# 15. Memory Visualizer Roadmap

> 메모리 시각화 확장 계획 및 아키텍처 설계

---

## 1. Current State

### Implemented (Level 1)
- int variable declaration/assignment
- Array declaration/access
- Basic pointer (`int *p = &x`, `*p = value`)
- Dynamic memory (malloc/free)
- scanf/printf

### Problem
- No visual pointer arrows (text only: `→`)
- Not extensible (if-else chain in simulator.ts)
- Hard to add new features

---

## 2. Phase 1: Pointer Arrows

### Goal
Visual arrows connecting pointer variables to their targets.

### Implementation
```
Stack                    Heap
┌─────────────┐         ┌─────────────┐
│ p ──────────┼────────▶│ *arr        │
└─────────────┘         └─────────────┘
```

### Tasks
- [ ] Install react-xarrows
- [ ] Add unique ID to each memory block (`id="mem-{address}"`)
- [ ] Render Xarrow for blocks with `points_to`
- [ ] Style arrows (color, animation)

### Files to Modify
- `frontend/package.json` - add dependency
- `frontend/src/components/memory-viz/components/ProcessMemoryView.tsx`
- `frontend/src/components/memory-viz/components/StackDetailView.tsx`
- `frontend/src/components/memory-viz/components/HeapDetailView.tsx`

---

## 3. Phase 2: Plugin Architecture

### Goal
Modular handler system for easy feature addition.

### Current Structure (Bad)
```
simulator.ts (685 lines)
└── analyzeLine()
    ├── if (int declaration) → handleIntDecl()
    ├── if (pointer) → handlePtrDecl()
    ├── if (malloc) → handleMalloc()
    └── ... if-else hell
```

### Proposed Structure (Good)
```
/modules/memory/
├── simulator.ts          (core engine, ~100 lines)
├── types.ts
└── handlers/
    ├── index.ts          (handler registry)
    ├── base.handler.ts   (interface)
    ├── int.handler.ts
    ├── pointer.handler.ts
    ├── array.handler.ts
    ├── struct.handler.ts     ← new
    ├── string.handler.ts     ← new
    └── function.handler.ts   ← new
```

### Handler Interface
```typescript
interface CodeHandler {
  name: string;
  patterns: RegExp[];
  priority: number;
  canHandle(code: string): boolean;
  handle(ctx: SimContext, code: string): Step;
}
```

### Benefits
- New feature = new file only
- Independent testing
- Parallel development
- Easy enable/disable

---

## 4. Feature Roadmap

### Level 1: Basics (Done)
| Feature | Status |
|---------|--------|
| int variable | Done |
| Array | Done |
| Basic pointer | Done |
| malloc/free | Done |
| scanf/printf | Done |

### Level 2: Intermediate
| Feature | Priority | Complexity |
|---------|----------|------------|
| char/float/double types | High | Low |
| String (char array + \0) | High | Medium |
| struct | High | Medium |
| struct pointer (→) | High | Medium |
| Function call (call stack) | Medium | High |
| Recursion visualization | Medium | High |

### Level 3: Advanced
| Feature | Priority | Complexity |
|---------|----------|------------|
| Double pointer (**pp) | Medium | Medium |
| Array-pointer relationship | Medium | Medium |
| Two pointers | Low | Medium |
| Linked list | Low | High |
| Memory padding/alignment | Low | Medium |

### Level 4: System (Optional)
| Feature | Priority | Complexity |
|---------|----------|------------|
| Process memory layout | Low | Medium |
| Stack overflow simulation | Low | High |
| Buffer overflow | Low | High |
| Function pointer | Low | High |

---

## 5. Implementation Order

```
Phase 1: Pointer Arrows
    └── Current focus

Phase 2: Architecture Refactor
    ├── Extract handlers from simulator.ts
    ├── Create handler registry
    └── Add tests

Phase 3: Level 2 Features
    ├── char/float/double
    ├── String visualization
    ├── struct
    └── Function call stack

Phase 4: Level 3 Features
    ├── Double pointer
    ├── Two pointers
    └── Linked list

Phase 5: Level 4 (Optional)
    └── System-level features
```

---

## 6. Technical Notes

### Pointer Arrow Implementation
- Library: react-xarrows
- Connection: DOM element IDs
- Styling: Purple color (#8b5cf6), smooth curve

### Struct Visualization
```
┌─────────────────────────┐
│ struct Point p          │
├─────────────────────────┤
│ .x : int    = 10        │
│ .y : int    = 20        │
└─────────────────────────┘
```

### Call Stack Visualization
```
┌─────────────────┐
│ main()          │ ← RBP
│   result: ?     │
├─────────────────┤
│ add(3, 5)       │ ← Current frame
│   a: 3          │
│   b: 5          │
│   return: 8     │ ← RSP
└─────────────────┘
```

### Linked List Visualization
```
head
  │
  ▼
┌─────┬───┐   ┌─────┬───┐   ┌─────┬──────┐
│  1  │ ──┼──▶│  2  │ ──┼──▶│  3  │ NULL │
└─────┴───┘   └─────┴───┘   └─────┴──────┘
```

---

## 7. Dependencies

| Package | Purpose | Phase |
|---------|---------|-------|
| react-xarrows | Pointer arrows | 1 |
| (none) | Architecture refactor | 2 |
| (none) | New handlers | 3-5 |

---

## 8. Success Criteria

### Phase 1
- [ ] Pointer arrows visible between stack and heap
- [ ] Arrows animate on step change
- [ ] Click pointer to highlight connection

### Phase 2
- [ ] simulator.ts < 150 lines
- [ ] Each handler in separate file
- [ ] All existing tests pass

### Phase 3+
- [ ] Each new feature has its own handler
- [ ] Visual representation matches diagram above
