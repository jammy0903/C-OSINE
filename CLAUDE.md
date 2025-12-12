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
│                (React + Recoil)              │
│                                              │
│  • C Editor (Monaco)                         │
│  • Memory Visualizer                         │
│  • OS Simulator UI                           │
│  • AI Chat Interface                         │
└───────────────────────────┬──────────────────┘
                            │ REST API
┌───────────────────────────▼──────────────────┐
│                  BACKEND                     │
│                 (FastAPI)                    │
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

- React
- Recoil (state)
- TypeScript
- Tailwind
- Monaco Editor (C code input)
- D3.js or custom canvas for visualization

### Backend

- FastAPI
- Python
- Uvicorn
- pydantic
- Docker/WSL sandbox

### Execution Layer

- gcc (compilation)
- linux container with resource limits
- isolated file system

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

## 12. File Structure (Suggested)

```
/backend
  ├── main.py
  ├── ai/
  │     └── handler.py
  ├── runner/
  │     └── c_runner.py
  ├── os/
  │     └── simulator.py
  ├── tracking/
  │     └── progress.py

/frontend
  ├── src/
  │     ├── components/
  │     ├── pages/
  │     ├── visualizers/
  │     └── api/
  ├── public/
```
