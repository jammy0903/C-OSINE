# 09. 프론트엔드 코드 설계 (Frontend Code Design)

> 실제로 작성할 파일, 컴포넌트, 함수 단위의 상세 설계

---

## 1. 파일 구조

```
frontend/
├── src/
│   ├── main.tsx                 # 앱 진입점
│   ├── App.tsx                  # 루트 컴포넌트
│   ├── index.css                # 전역 스타일 (Tailwind)
│   │
│   ├── components/              # 재사용 컴포넌트
│   │   ├── common/              # 공통 UI
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorMessage.tsx
│   │   │
│   │   ├── layout/              # 레이아웃
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   └── SplitPane.tsx
│   │   │
│   │   ├── chat/                # AI 튜터 채팅
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── CodeBlock.tsx
│   │   │
│   │   ├── editor/              # 코드 에디터
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   └── OutputPanel.tsx
│   │   │
│   │   └── visualizer/          # 메모리 시각화
│   │       ├── MemoryVisualizer.tsx
│   │       ├── HeapView.tsx
│   │       ├── StackView.tsx
│   │       ├── PointerArrow.tsx
│   │       └── MemoryControls.tsx
│   │
│   ├── pages/                   # 페이지 컴포넌트
│   │   ├── HomePage.tsx         # 메인 (탭 통합)
│   │   ├── TutorPage.tsx        # AI 튜터 전체화면
│   │   ├── RunnerPage.tsx       # 코드 실행기 전체화면
│   │   └── MemoryPage.tsx       # 메모리 시뮬레이터 전체화면
│   │
│   ├── hooks/                   # 커스텀 훅
│   │   ├── useChat.ts           # AI 채팅 로직
│   │   ├── useCodeRunner.ts     # 코드 실행 로직
│   │   ├── useMemorySimulator.ts# 메모리 시뮬레이션
│   │   └── useTheme.ts          # 다크모드
│   │
│   ├── api/                     # API 호출 함수
│   │   ├── client.ts            # axios 인스턴스
│   │   ├── aiApi.ts             # /ai/* 엔드포인트
│   │   ├── runnerApi.ts         # /c/* 엔드포인트
│   │   └── memoryApi.ts         # /os/sim/* 엔드포인트
│   │
│   ├── store/                   # 상태 관리 (Recoil)
│   │   ├── atoms.ts             # 전역 상태
│   │   └── selectors.ts         # 파생 상태
│   │
│   ├── types/                   # TypeScript 타입
│   │   ├── chat.ts              # 채팅 관련 타입
│   │   ├── runner.ts            # 코드 실행 관련 타입
│   │   ├── memory.ts            # 메모리 시뮬레이터 타입
│   │   └── api.ts               # API 응답 타입
│   │
│   └── utils/                   # 유틸리티
│       ├── constants.ts         # 상수
│       └── helpers.ts           # 헬퍼 함수
│
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 2. 타입 정의 (types/)

### 2.1 types/chat.ts
```typescript
// 채팅 메시지
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
}

// AI 요청/응답
export interface AskRequest {
  message: string;
  context?: ChatMessage[];
}

export interface AskResponse {
  success: boolean;
  data?: {
    response: string;
    code_examples?: CodeBlock[];
  };
  error?: ApiError;
}
```

### 2.2 types/runner.ts
```typescript
// 코드 실행 요청/응답
export interface RunCodeRequest {
  code: string;
  stdin?: string;
  timeout?: number;
}

export interface RunCodeResponse {
  success: boolean;
  data?: RunResult;
  error?: ApiError;
}

export interface RunResult {
  compiled: boolean;
  executed: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
}
```

### 2.3 types/memory.ts
```typescript
// 메모리 상태
export interface MemoryState {
  session_id: string;
  heap: HeapState;
  stack: StackState;
}

export interface HeapState {
  total_size: number;
  used_size: number;
  blocks: HeapBlock[];
  free_list: FreeBlock[];
}

export interface HeapBlock {
  address: number;
  size: number;
  var_name: string;
  status: 'allocated' | 'freed';
}

export interface FreeBlock {
  start: number;
  size: number;
}

export interface StackState {
  total_size: number;
  sp: number;
  frames: StackFrame[];
}

export interface StackFrame {
  id: number;
  function_name: string;
  base_pointer: number;
  variables: StackVariable[];
}

export interface StackVariable {
  name: string;
  type: string;
  address: number;
  size: number;
  value: any;
}

// 애니메이션 데이터
export interface AnimationStep {
  action: string;
  data: Record<string, any>;
}
```

### 2.4 types/api.ts
```typescript
// 공통 API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}
```

---

## 3. API 호출 함수 (api/)

### 3.1 api/client.ts
```typescript
import axios from 'axios';

// axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 에러 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 에러 처리 로직
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

### 3.2 api/aiApi.ts
```typescript
import { apiClient } from './client';
import { AskRequest, AskResponse } from '../types/chat';

export const aiApi = {
  // AI에게 질문하기
  ask: async (request: AskRequest): Promise<AskResponse> => {
    const response = await apiClient.post('/ai/ask', request);
    return response.data;
  },
};
```

### 3.3 api/runnerApi.ts
```typescript
import { apiClient } from './client';
import { RunCodeRequest, RunCodeResponse } from '../types/runner';

export const runnerApi = {
  // C 코드 실행
  run: async (request: RunCodeRequest): Promise<RunCodeResponse> => {
    const response = await apiClient.post('/c/run', request);
    return response.data;
  },
};
```

### 3.4 api/memoryApi.ts
```typescript
import { apiClient } from './client';
import { MemoryState } from '../types/memory';
import { ApiResponse } from '../types/api';

export const memoryApi = {
  // 메모리 초기화
  init: async (heapSize?: number, stackSize?: number): Promise<ApiResponse<MemoryState>> => {
    const response = await apiClient.post('/os/sim/memory/init', {
      heap_size: heapSize,
      stack_size: stackSize,
    });
    return response.data;
  },

  // malloc
  malloc: async (sessionId: string, size: number, varName: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/os/sim/memory/malloc', {
      session_id: sessionId,
      size,
      var_name: varName,
    });
    return response.data;
  },

  // free
  free: async (sessionId: string, varName: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/os/sim/memory/free', {
      session_id: sessionId,
      var_name: varName,
    });
    return response.data;
  },
};
```

---

## 4. 상태 관리 (store/)

### 4.1 store/atoms.ts
```typescript
import { atom } from 'recoil';
import { ChatMessage } from '../types/chat';
import { RunResult } from '../types/runner';
import { MemoryState } from '../types/memory';

// 현재 활성 탭
export const activeTabAtom = atom<'tutor' | 'runner' | 'memory'>({
  key: 'activeTab',
  default: 'tutor',
});

// 테마 (다크모드)
export const themeAtom = atom<'light' | 'dark'>({
  key: 'theme',
  default: 'dark',
});

// 채팅 메시지 목록
export const chatMessagesAtom = atom<ChatMessage[]>({
  key: 'chatMessages',
  default: [],
});

// AI 로딩 상태
export const isAiLoadingAtom = atom<boolean>({
  key: 'isAiLoading',
  default: false,
});

// 코드 에디터 내용
export const codeEditorAtom = atom<string>({
  key: 'codeEditor',
  default: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
});

// 코드 실행 결과
export const runResultAtom = atom<RunResult | null>({
  key: 'runResult',
  default: null,
});

// 코드 실행 중 상태
export const isRunningAtom = atom<boolean>({
  key: 'isRunning',
  default: false,
});

// 메모리 시뮬레이터 상태
export const memoryStateAtom = atom<MemoryState | null>({
  key: 'memoryState',
  default: null,
});

// 메모리 시뮬레이터 로딩
export const isMemoryLoadingAtom = atom<boolean>({
  key: 'isMemoryLoading',
  default: false,
});
```

### 4.2 store/selectors.ts
```typescript
import { selector } from 'recoil';
import { memoryStateAtom, chatMessagesAtom } from './atoms';

// 힙 사용률 계산
export const heapUsageSelector = selector({
  key: 'heapUsage',
  get: ({ get }) => {
    const state = get(memoryStateAtom);
    if (!state) return 0;
    return (state.heap.used_size / state.heap.total_size) * 100;
  },
});

// 채팅 메시지 수
export const messageCountSelector = selector({
  key: 'messageCount',
  get: ({ get }) => {
    const messages = get(chatMessagesAtom);
    return messages.length;
  },
});

// 할당된 블록 목록
export const allocatedBlocksSelector = selector({
  key: 'allocatedBlocks',
  get: ({ get }) => {
    const state = get(memoryStateAtom);
    if (!state) return [];
    return state.heap.blocks.filter(b => b.status === 'allocated');
  },
});
```

---

## 5. 커스텀 훅 (hooks/)

### 5.1 hooks/useChat.ts
```typescript
import { useRecoilState } from 'recoil';
import { chatMessagesAtom, isAiLoadingAtom } from '../store/atoms';
import { aiApi } from '../api/aiApi';
import { ChatMessage } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

export function useChat() {
  const [messages, setMessages] = useRecoilState(chatMessagesAtom);
  const [isLoading, setIsLoading] = useRecoilState(isAiLoadingAtom);

  // 메시지 전송
  const sendMessage = async (content: string) => {
    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // AI 응답 요청
    setIsLoading(true);
    try {
      const response = await aiApi.ask({
        message: content,
        context: messages.slice(-10), // 최근 10개 컨텍스트
      });

      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          codeBlocks: response.data.code_examples,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI 요청 실패:', error);
      // 에러 메시지 표시
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅 초기화
  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}
```

### 5.2 hooks/useCodeRunner.ts
```typescript
import { useRecoilState } from 'recoil';
import { codeEditorAtom, runResultAtom, isRunningAtom } from '../store/atoms';
import { runnerApi } from '../api/runnerApi';

export function useCodeRunner() {
  const [code, setCode] = useRecoilState(codeEditorAtom);
  const [result, setResult] = useRecoilState(runResultAtom);
  const [isRunning, setIsRunning] = useRecoilState(isRunningAtom);

  // 코드 실행
  const runCode = async (stdin?: string) => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await runnerApi.run({
        code,
        stdin,
        timeout: 10,
      });

      if (response.success && response.data) {
        setResult(response.data);
      }
    } catch (error) {
      console.error('코드 실행 실패:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // 코드 초기화
  const resetCode = () => {
    setCode(`#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`);
    setResult(null);
  };

  return {
    code,
    setCode,
    result,
    isRunning,
    runCode,
    resetCode,
  };
}
```

### 5.3 hooks/useMemorySimulator.ts
```typescript
import { useRecoilState } from 'recoil';
import { memoryStateAtom, isMemoryLoadingAtom } from '../store/atoms';
import { memoryApi } from '../api/memoryApi';

export function useMemorySimulator() {
  const [memoryState, setMemoryState] = useRecoilState(memoryStateAtom);
  const [isLoading, setIsLoading] = useRecoilState(isMemoryLoadingAtom);

  // 초기화
  const initMemory = async (heapSize = 1024, stackSize = 256) => {
    setIsLoading(true);
    try {
      const response = await memoryApi.init(heapSize, stackSize);
      if (response.success && response.data) {
        setMemoryState(response.data);
      }
    } catch (error) {
      console.error('메모리 초기화 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // malloc
  const malloc = async (size: number, varName: string) => {
    if (!memoryState) return;

    setIsLoading(true);
    try {
      const response = await memoryApi.malloc(
        memoryState.session_id,
        size,
        varName
      );
      if (response.success && response.data) {
        setMemoryState((prev) => ({
          ...prev!,
          heap: response.data.state.heap,
        }));
        return response.data.animation; // 애니메이션 데이터 반환
      }
    } catch (error) {
      console.error('malloc 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // free
  const free = async (varName: string) => {
    if (!memoryState) return;

    setIsLoading(true);
    try {
      const response = await memoryApi.free(
        memoryState.session_id,
        varName
      );
      if (response.success && response.data) {
        setMemoryState((prev) => ({
          ...prev!,
          heap: response.data.state.heap,
        }));
        return response.data.animation;
      }
    } catch (error) {
      console.error('free 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 리셋
  const resetMemory = () => {
    setMemoryState(null);
  };

  return {
    memoryState,
    isLoading,
    initMemory,
    malloc,
    free,
    resetMemory,
  };
}
```

---

## 6. 컴포넌트 상세

### 6.1 공통 컴포넌트 (components/common/)

#### Button.tsx
```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

// 사용 예: <Button variant="primary" onClick={handleClick}>실행</Button>
```

#### Loading.tsx
```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

// 사용 예: <Loading text="AI가 생각 중..." />
```

#### ErrorMessage.tsx
```typescript
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

// 사용 예: <ErrorMessage message="실행 실패" onRetry={handleRetry} />
```

---

### 6.2 레이아웃 (components/layout/)

#### Header.tsx
```typescript
interface HeaderProps {
  // props 없음 (내부에서 상태 사용)
}

// 포함 요소:
// - 로고
// - 탭 네비게이션 (useRecoilState(activeTabAtom))
// - 테마 토글 버튼
```

#### TabNavigation.tsx
```typescript
interface TabNavigationProps {
  activeTab: 'tutor' | 'runner' | 'memory';
  onTabChange: (tab: 'tutor' | 'runner' | 'memory') => void;
}

// 탭 목록: AI Tutor, Code Runner, Memory
```

#### SplitPane.tsx
```typescript
interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number; // 기본 50%
}

// 좌우 패널 분할 (드래그로 크기 조절 가능)
```

---

### 6.3 채팅 컴포넌트 (components/chat/)

#### ChatContainer.tsx
```typescript
interface ChatContainerProps {
  // props 없음 (useChat 훅 사용)
}

// 구조:
// - MessageList
// - MessageInput
// - 로딩 인디케이터
```

#### MessageList.tsx
```typescript
interface MessageListProps {
  messages: ChatMessage[];
}

// 메시지 목록 렌더링 + 자동 스크롤
```

#### MessageBubble.tsx
```typescript
interface MessageBubbleProps {
  message: ChatMessage;
}

// 말풍선 스타일 (user: 오른쪽 파랑, assistant: 왼쪽 회색)
// 코드 블록이 있으면 CodeBlock 컴포넌트 렌더링
```

#### MessageInput.tsx
```typescript
interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// 텍스트 입력 + 전송 버튼
// Enter로 전송, Shift+Enter로 줄바꿈
```

#### CodeBlock.tsx
```typescript
interface CodeBlockProps {
  language: string;
  code: string;
  showCopyButton?: boolean;
}

// 구문 강조 + 복사 버튼
// highlight.js 또는 prism.js 사용
```

---

### 6.4 에디터 컴포넌트 (components/editor/)

#### CodeEditor.tsx
```typescript
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string; // 기본 'c'
  readOnly?: boolean;
}

// Monaco Editor 래퍼
// 설정: 테마, 폰트 크기, 미니맵 off
```

#### EditorToolbar.tsx
```typescript
interface EditorToolbarProps {
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
}

// 버튼: 실행(▶), 초기화(🗑)
```

#### OutputPanel.tsx
```typescript
interface OutputPanelProps {
  result: RunResult | null;
  isRunning: boolean;
}

// 표시 내용:
// - 컴파일 성공/실패
// - stdout (성공 시)
// - stderr (에러 시)
// - 실행 시간, 메모리 사용량
```

---

### 6.5 시각화 컴포넌트 (components/visualizer/)

#### MemoryVisualizer.tsx
```typescript
interface MemoryVisualizerProps {
  // props 없음 (useMemorySimulator 훅 사용)
}

// 구조:
// - MemoryControls (왼쪽)
// - StackView + HeapView (오른쪽)
```

#### HeapView.tsx
```typescript
interface HeapViewProps {
  heap: HeapState;
  onBlockClick?: (block: HeapBlock) => void;
}

// Canvas 또는 SVG로 힙 블록 렌더링
// 색상: 할당됨(보라), 빈 공간(회색)
```

#### StackView.tsx
```typescript
interface StackViewProps {
  stack: StackState;
}

// 스택 프레임 렌더링
// 각 프레임: 함수명 + 지역변수 목록
```

#### PointerArrow.tsx
```typescript
interface PointerArrowProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
}

// SVG 화살표 (포인터 참조 표시)
```

#### MemoryControls.tsx
```typescript
interface MemoryControlsProps {
  onMalloc: (size: number, varName: string) => void;
  onFree: (varName: string) => void;
  onReset: () => void;
  allocatedBlocks: HeapBlock[];
  isLoading: boolean;
}

// 입력 폼:
// - malloc: 크기 입력, 변수명 입력, 할당 버튼
// - free: 변수 선택 드롭다운, 해제 버튼
// - 리셋 버튼
```

---

## 7. 페이지 컴포넌트 (pages/)

### HomePage.tsx
```typescript
// 메인 페이지 (모든 기능 통합)

export function HomePage() {
  const [activeTab, setActiveTab] = useRecoilState(activeTabAtom);

  return (
    <div>
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'tutor' && <ChatContainer />}
      {activeTab === 'runner' && <RunnerView />}
      {activeTab === 'memory' && <MemoryVisualizer />}

      <Footer />
    </div>
  );
}
```

### RunnerView (HomePage 내부)
```typescript
// 코드 실행기 뷰

function RunnerView() {
  const { code, setCode, result, isRunning, runCode, resetCode } = useCodeRunner();

  return (
    <SplitPane
      left={
        <>
          <CodeEditor value={code} onChange={setCode} />
          <EditorToolbar onRun={runCode} onReset={resetCode} isRunning={isRunning} />
        </>
      }
      right={
        <OutputPanel result={result} isRunning={isRunning} />
      }
    />
  );
}
```

---

## 8. 구현 순서 (권장)

```
Phase 1: 기본 구조
├── 1.1 Vite + React + TypeScript 프로젝트 생성
├── 1.2 Tailwind CSS 설정
├── 1.3 Recoil 설정
├── 1.4 기본 레이아웃 (Header, Footer, TabNavigation)
└── 1.5 라우팅 설정 (react-router-dom)

Phase 2: AI 튜터 (MVP 핵심 1)
├── 2.1 types/chat.ts 작성
├── 2.2 api/client.ts + api/aiApi.ts 작성
├── 2.3 store/atoms.ts (채팅 관련)
├── 2.4 hooks/useChat.ts 작성
├── 2.5 ChatContainer, MessageList, MessageBubble 구현
├── 2.6 MessageInput 구현
└── 2.7 CodeBlock 구현 (구문 강조)

Phase 3: 코드 실행기 (MVP 핵심 2)
├── 3.1 types/runner.ts 작성
├── 3.2 api/runnerApi.ts 작성
├── 3.3 store/atoms.ts (코드 관련)
├── 3.4 hooks/useCodeRunner.ts 작성
├── 3.5 Monaco Editor 설치 및 CodeEditor 구현
├── 3.6 EditorToolbar 구현
└── 3.7 OutputPanel 구현

Phase 4: 메모리 시각화 (MVP 핵심 3)
├── 4.1 types/memory.ts 작성
├── 4.2 api/memoryApi.ts 작성
├── 4.3 store/atoms.ts (메모리 관련)
├── 4.4 hooks/useMemorySimulator.ts 작성
├── 4.5 MemoryControls 구현
├── 4.6 HeapView 구현 (Canvas)
├── 4.7 StackView 구현
└── 4.8 애니메이션 구현

Phase 5: 통합 및 다듬기
├── 5.1 HomePage 통합
├── 5.2 반응형 디자인
├── 5.3 다크모드
├── 5.4 에러 처리 개선
└── 5.5 로딩 상태 개선
```

---

## 9. 의존성 패키지

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "recoil": "^0.7.7",
    "axios": "^1.6.0",
    "@monaco-editor/react": "^4.6.0",
    "highlight.js": "^11.9.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```
