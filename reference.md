# COSLAB Reference Document

> C + OS Learning Lab - 다음 세션에서 바로 이해할 수 있는 프로젝트 레퍼런스

---

## 🎯 한 줄 요약

**C 언어 + 운영체제를 "코드 실행 + 메모리 시각화 + AI 설명"으로 배우는 웹 플랫폼**

---

## 📦 MVP (최소 기능 제품) - 3가지만 구현하면 됨

| 순위 | 기능 | 설명 | API |
|------|------|------|-----|
| ⭐1 | AI Tutor | C/포인터/메모리/OS 개념 질문 → AI 답변 | `/ai/ask` |
| ⭐2 | C Code Runner | C 코드 컴파일/실행 → 결과 반환 | `/c/run` |
| ⭐3 | Memory Visualizer | 힙/스택 메모리 모델 애니메이션 | `/os/sim/memory` |

---

## 🏗️ 기술 스택

```
Frontend: React + Recoil + TypeScript + Tailwind + Monaco Editor + D3.js
Backend:  FastAPI + Python + Uvicorn + Pydantic
Execution: gcc + Docker/WSL sandbox (리소스 제한, 격리 실행)
```

---

## 🔌 API 엔드포인트

| Endpoint | Method | 기능 |
|----------|--------|------|
| `/ai/ask` | POST | AI 튜터에게 질문 |
| `/c/run` | POST | C 코드 컴파일 & 실행 |
| `/os/sim/memory` | POST | 메모리 시뮬레이션 |
| `/os/sim/cpu` | POST | CPU 스케줄링 시뮬레이션 |
| `/track/stats` | GET/POST | 학습 진도 추적 |
| `/health` | GET | 서버 상태 확인 |

---

## 🔄 핵심 로직 플로우

### 1. AI Tutor
```
사용자 질문 → /ai/ask → LLM API 호출 → 답변 반환 → 프론트 표시
```

### 2. C Runner
```
C 코드 제출 → 임시 파일 저장 → gcc 컴파일
  ├─ 실패 → 에러 로그 반환
  └─ 성공 → 실행 → stdout/stderr 반환
```

### 3. Memory Simulator
```
alloc/free 이벤트 → 메모리 상태 변경 → JSON 상태 반환 → 프론트 애니메이션
```

### 4. OS Scheduler
```
프로세스 리스트 + 알고리즘 선택 → 스케줄링 계산 → 타임라인 데이터 → 프론트 렌더링
```

---

## 📁 디렉토리 구조

```
/backend
  ├── main.py              # FastAPI 진입점
  ├── ai/
  │     └── handler.py     # AI 튜터 로직
  ├── runner/
  │     └── c_runner.py    # C 컴파일/실행
  ├── os/
  │     └── simulator.py   # OS 시뮬레이션 (스케줄링, 메모리)
  └── tracking/
        └── progress.py    # 학습 진도 추적

/frontend
  ├── src/
  │     ├── components/    # 재사용 컴포넌트
  │     ├── pages/         # 페이지별 뷰
  │     ├── visualizers/   # 메모리/OS 시각화
  │     └── api/           # API 호출 함수
  └── public/
```

---

## 🛡️ 보안 원칙

- ❌ 사용자 코드에서 직접 시스템 콜 금지
- ❌ 네트워킹 금지 (컨테이너 내부)
- ✅ CPU/메모리 타임아웃 적용
- ✅ 샌드박스 파일시스템
- ✅ 입력값 sanitization

---

## 🎓 OS 시뮬레이션 기능 (MVP 이후)

### CPU 스케줄링
- FCFS (First Come First Serve)
- SJF (Shortest Job First)
- Round Robin
- Priority Scheduling

### 메모리 관리
- Paging 시뮬레이션
- TLB 캐시
- Page Fault 시각화
- Page Replacement (FIFO / LRU)

### 파일 시스템
- 가상 디렉토리 트리
- I-node 메타데이터
- Read/Write/Seek 시뮬레이션

---

## 📊 학습 트래킹 항목

- 질문 수
- 실행한 C 코드 수
- 컴파일 성공/실패 비율
- 학습 주제 (포인터, 메모리, 스레드, 파일 등)
- 뱃지/업적

---

## 🚀 개발 순서 (로드맵)

| 단계 | 작업 | 산출물 |
|------|------|--------|
| 1 | FastAPI 기본 서버 | `/health` |
| 2 | AI 튜터 구현 | `/ai/ask` |
| 3 | C 실행기 구현 | `/c/run` |
| 4 | 메모리 시각화 | `/os/sim/memory` |
| 5 | 스케줄링 시각화 | `/os/sim/cpu` |
| 6 | 프론트 UI 통합 | Web UI |
| 7 | 학습 트래커 | `/track/stats` |
| 8 | 디자인/UX | 최종 배포 |

---

## ❓ 왜 pwndbg 안 쓰나?

| 항목 | pwndbg | COSLAB |
|------|--------|--------|
| 실제 메모리 뷰 | ✅ | ❌ |
| 교육용 추상화 | ❌ | ✅ |
| 웹 시각화 | ❌ | ✅ |
| 브라우저 실행 | ❌ | ✅ |
| 초보자 친화적 | ❌ | ✅ |

→ **교육 목적이므로 실제 디버거 대신 추상화된 시뮬레이터 사용**

---

## 📝 다음 세션 시작 시 체크리스트

1. 현재 어디까지 구현됐는지 확인
2. `/backend`, `/frontend` 폴더 존재 여부 확인
3. 위 로드맵 기준 현재 단계 파악
4. MVP 3가지 (AI Tutor, C Runner, Memory Viz) 완성 여부 확인

---

## 🔗 관련 파일

- `CLAUDE.md` - 상세 프로젝트 기획서 (영문)
- `reference.md` - 이 파일 (빠른 참조용)
