# COSLAB → C-ode-to-you 통합 계획

## 개요

COSLAB의 **메모리 시각화 기능**을 C-ode-to-you 모바일 앱에 통합하는 계획.

---

## 현재 상태

### C-ode-to-you
- **프론트엔드**: Expo (React Native) 모바일 앱
- **백엔드**: Node.js + Express + TypeScript
- **DB**: Prisma (PostgreSQL)
- **기능**: 인증, 문제 풀이, 코드 제출 (Judge0), AI 튜터 (Ollama)

### COSLAB
- **프론트엔드**: React + Vite 웹 앱
- **백엔드**: FastAPI (Python)
- **기능**: AI 튜터 (xAI), 코드 실행 (Judge0), 메모리 시각화

---

## 통합 후 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                 C-ode-to-you (통합 후)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📱 모바일 앱 (Expo)                                         │
│  ├── 로그인 (Kakao/Google)                                  │
│  ├── 문제 목록                                               │
│  ├── 코드 에디터 + 제출                                      │
│  ├── AI 튜터 채팅                                            │
│  └── 🆕 메모리 시각화 (WebView)                              │
│                                                              │
│  🖥️ 백엔드 (Node.js)                                        │
│  ├── /auth/*       - 인증                                   │
│  ├── /problems/*   - 문제                                   │
│  ├── /submissions/* - 제출 (Judge0)                         │
│  ├── /ai/*         - AI 튜터                                │
│  └── 🆕 /memory/*  - 메모리 시뮬레이터                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 작업 목록

### Phase 1: 백엔드 통합

#### 1.1 메모리 시뮬레이터 TypeScript 포팅
- [ ] `simulator.py` → `simulator.ts` 변환
- [ ] 정규식 패턴 그대로 유지
- [ ] 타입 정의 (Step, MemoryBlock)
- [ ] 테스트 작성

**파일 위치**: `backend/src/modules/memory/`

```typescript
// memory.types.ts
interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to: string | null;
  explanation: string;
}

interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  explanation: string;
  rsp: string;
  rbp: string;
}
```

#### 1.2 API 라우트 추가
- [ ] `POST /memory/simulate` 엔드포인트
- [ ] 요청/응답 validation
- [ ] 에러 핸들링

```typescript
// memory.routes.ts
router.post('/simulate', validateSimulateRequest, simulateCode);
```

---

### Phase 2: 프론트엔드 통합

#### 2.1 메모리 시각화 컴포넌트
- [ ] React 컴포넌트 → React Native 호환으로 변환
- [ ] 또는 WebView로 React 컴포넌트 래핑

**옵션 A: WebView (쉬움)**
```tsx
// MemoryVisualizerScreen.tsx
<WebView source={{ uri: 'https://coslab.app/memory' }} />
```

**옵션 B: 네이티브 (권장)**
```tsx
// MemoryVisualizerScreen.tsx
<ScrollView>
  <CodeEditor value={code} onChange={setCode} />
  <Button onPress={simulate}>실행 & 추적</Button>
  <StepNavigator steps={steps} current={currentStep} />
  <ExplanationCard explanation={step.explanation} />
  <StackView stack={step.stack} />
  <HeapView heap={step.heap} />
</ScrollView>
```

#### 2.2 네비게이션 추가
- [ ] Bottom Tab에 "메모리" 탭 추가
- [ ] 문제 풀이 화면에서 "메모리 보기" 버튼

---

### Phase 3: 통합 테스트

- [ ] 시뮬레이터 단위 테스트
- [ ] API 통합 테스트
- [ ] E2E 테스트 (앱에서 메모리 시각화)

---

## 지원 기능 (COSLAB에서 가져옴)

```
✅ 지원
├── int x = 5;           (정수 선언)
├── int *p = &x;         (포인터)
├── *p = 20;             (역참조)
├── int arr[5];          (배열)
├── arr[0] = 10;         (배열 접근)
├── malloc/free          (동적 할당)
└── 교육용 설명          (한글)

❌ 미지원
├── for/while/if         (제어문)
├── 연산식 (x = y + 5)
├── struct               (구조체)
└── 함수 호출
```

---

## 일정 (예상)

| 작업 | 예상 시간 |
|------|----------|
| simulator.ts 포팅 | 2-3시간 |
| API 라우트 추가 | 1시간 |
| 프론트엔드 컴포넌트 | 3-4시간 |
| 네비게이션 통합 | 1시간 |
| 테스트 | 2시간 |
| **총계** | **~10시간** |

---

## 참고 파일

### COSLAB (소스)
- `backend/simulator.py` - 메모리 시뮬레이터 로직
- `frontend/src/components/MemoryViz.tsx` - UI 컴포넌트
- `frontend/src/services/tracer.ts` - API 호출

### C-ode-to-you (대상)
- `backend/src/modules/` - 모듈 추가 위치
- `frontend/src/features/` - 기능 추가 위치

---

## 결정 사항

- [ ] WebView vs 네이티브 구현 선택
- [ ] AI 튜터 통합 (Ollama vs xAI)
- [ ] 메모리 시각화 접근 경로 (탭 vs 문제 화면 내)
