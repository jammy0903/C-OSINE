# 11. 진짜 MVP 설계 (Real MVP - 2주 완성)

> 이전 설계 전부 버리고, **진짜 최소한**으로 다시 시작

---

## 🎯 원칙

```
1. 무료 서비스만 사용
2. 2주 안에 배포 가능
3. 파일 15개 이하
4. 복잡한 건 나중에
5. 일단 돌아가게 만들고, 그 다음에 개선
```

---

## 💰 무료 서비스 스택

| 용도 | 서비스 | 무료 한도 |
|------|--------|-----------|
| C 코드 실행 | **Judge0 CE** (RapidAPI) | 50회/일 |
| AI 튜터 | **Groq** (무료 tier) | 무제한 (rate limit) |
| 프론트 호스팅 | **Vercel** | 무제한 |
| 백엔드 호스팅 | **필요 없음** | - |
| DB | **필요 없음** | - |

### 왜 백엔드가 필요 없나?

```
기존 설계: 프론트 → 백엔드 → 외부 API
새 설계:   프론트 → 외부 API (직접)

Judge0, Groq 모두 CORS 지원 + API 키만 있으면 됨
백엔드 = 불필요한 중간 레이어
```

---

## 📁 파일 구조 (12개)

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── Chat.tsx           # AI 채팅 (입력 + 메시지 목록)
│   │   ├── CodeEditor.tsx     # 코드 에디터 + 실행 버튼 + 결과
│   │   └── MemoryViz.tsx      # 메모리 시각화 (프론트 전용)
│   │
│   ├── stores/
│   │   └── store.ts           # Zustand 스토어 (전체)
│   │
│   ├── services/
│   │   ├── judge0.ts          # C 코드 실행 API
│   │   └── groq.ts            # AI API
│   │
│   └── types.ts               # 타입 정의 (전체)
│
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

**이전: 58개 → 지금: 12개**

---

## 🔧 기술 스택 (최소화)

```
프론트엔드:
- React 18
- Zustand (상태)
- Tailwind CSS (스타일)
- CodeMirror 6 (에디터) ← Monaco보다 가벼움
- 그게 끝

백엔드: 없음

호스팅: Vercel (무료)
```

---

## 1. 타입 정의 (types.ts)

```typescript
// 채팅
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 코드 실행 결과
export interface RunResult {
  success: boolean;
  output: string;    // stdout + stderr 합침
  time?: string;
  memory?: string;
}

// 메모리 블록 (프론트 전용)
export interface MemBlock {
  id: string;
  name: string;
  size: number;
  address: number;
}
```

**이전: 4개 파일, 200줄 → 지금: 1개 파일, 20줄**

---

## 2. Zustand 스토어 (store.ts)

```typescript
import { create } from 'zustand';
import { Message, RunResult, MemBlock } from './types';

interface Store {
  // 탭
  activeTab: 'chat' | 'code' | 'memory';
  setActiveTab: (tab: 'chat' | 'code' | 'memory') => void;

  // 채팅
  messages: Message[];
  isAiLoading: boolean;
  addMessage: (msg: Message) => void;
  setAiLoading: (loading: boolean) => void;
  clearMessages: () => void;

  // 코드
  code: string;
  setCode: (code: string) => void;
  result: RunResult | null;
  setResult: (result: RunResult | null) => void;
  isRunning: boolean;
  setRunning: (running: boolean) => void;

  // 메모리 (프론트 전용 시뮬레이션)
  memBlocks: MemBlock[];
  nextAddress: number;
  malloc: (name: string, size: number) => void;
  free: (name: string) => void;
  resetMemory: () => void;
}

export const useStore = create<Store>((set, get) => ({
  // 탭
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // 채팅
  messages: [],
  isAiLoading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
  clearMessages: () => set({ messages: [] }),

  // 코드
  code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  setCode: (code) => set({ code }),
  result: null,
  setResult: (result) => set({ result }),
  isRunning: false,
  setRunning: (running) => set({ isRunning: running }),

  // 메모리 (프론트에서 직접 계산 - 백엔드 필요 없음!)
  memBlocks: [],
  nextAddress: 0x1000,
  malloc: (name, size) => set((s) => {
    const block: MemBlock = {
      id: crypto.randomUUID(),
      name,
      size,
      address: s.nextAddress,
    };
    return {
      memBlocks: [...s.memBlocks, block],
      nextAddress: s.nextAddress + size,
    };
  }),
  free: (name) => set((s) => ({
    memBlocks: s.memBlocks.filter((b) => b.name !== name),
  })),
  resetMemory: () => set({ memBlocks: [], nextAddress: 0x1000 }),
}));
```

**이전: atoms.ts + selectors.ts + 4개 hooks → 지금: 1개 파일**

---

## 3. API 서비스

### services/judge0.ts (C 코드 실행)

```typescript
const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

export async function runCode(code: string, stdin = ''): Promise<{
  success: boolean;
  output: string;
  time?: string;
  memory?: string;
}> {
  // 1. 제출
  const submitRes = await fetch(`${JUDGE0_URL}/submissions?wait=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: btoa(code),      // base64
      language_id: 50,               // C (GCC 9.2.0)
      stdin: btoa(stdin),
    }),
  });

  const result = await submitRes.json();

  // 2. 결과 파싱
  const stdout = result.stdout ? atob(result.stdout) : '';
  const stderr = result.stderr ? atob(result.stderr) : '';
  const compile_output = result.compile_output ? atob(result.compile_output) : '';

  const success = result.status?.id === 3; // Accepted
  const output = compile_output || stderr || stdout || '(출력 없음)';

  return {
    success,
    output,
    time: result.time,
    memory: result.memory ? `${result.memory} KB` : undefined,
  };
}
```

### services/groq.ts (AI 튜터)

```typescript
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `당신은 C 언어와 운영체제 전문 튜터입니다.
- 간결하고 이해하기 쉽게 설명하세요
- 코드 예제는 \`\`\`c 블록으로 제공하세요
- 한국어로 답변하세요`;

export async function askAI(
  message: string,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6), // 최근 6개만 (토큰 절약)
    { role: 'user', content: message },
  ];

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile', // 무료, 빠름
      messages,
      max_tokens: 1024,
    }),
  });

  const data = await res.json();
  return data.choices[0]?.message?.content || '응답을 받지 못했습니다.';
}
```

**이전: client.ts + aiApi.ts + runnerApi.ts + memoryApi.ts → 지금: 2개**

---

## 4. 컴포넌트

### components/Chat.tsx

```tsx
import { useState } from 'react';
import { useStore } from '../stores/store';
import { askAI } from '../services/groq';

export function Chat() {
  const [input, setInput] = useState('');
  const { messages, isAiLoading, addMessage, setAiLoading } = useStore();

  const send = async () => {
    if (!input.trim() || isAiLoading) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: input };
    addMessage(userMsg);
    setInput('');
    setAiLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await askAI(input, history);
      addMessage({ id: crypto.randomUUID(), role: 'assistant', content: response });
    } catch (e) {
      addMessage({ id: crypto.randomUUID(), role: 'assistant', content: '오류가 발생했습니다.' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${
              m.role === 'user' ? 'bg-blue-600 ml-auto' : 'bg-gray-700'
            } max-w-[80%]`}
          >
            <pre className="whitespace-pre-wrap">{m.content}</pre>
          </div>
        ))}
        {isAiLoading && <div className="text-gray-400">생각 중...</div>}
      </div>

      {/* 입력 */}
      <div className="p-4 border-t border-gray-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="C나 OS에 대해 질문하세요..."
          className="flex-1 bg-gray-800 rounded px-4 py-2"
        />
        <button
          onClick={send}
          disabled={isAiLoading}
          className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
```

### components/CodeEditor.tsx

```tsx
import { useStore } from '../stores/store';
import { runCode } from '../services/judge0';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

export function CodeEditor() {
  const { code, setCode, result, setResult, isRunning, setRunning } = useStore();

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await runCode(code);
      setResult(res);
    } catch (e) {
      setResult({ success: false, output: '실행 오류가 발생했습니다.' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 에디터 */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={[cpp()]}
          theme={vscodeDark}
          height="100%"
        />
      </div>

      {/* 툴바 */}
      <div className="p-2 border-t border-gray-700 flex gap-2">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="bg-green-600 px-4 py-2 rounded disabled:opacity-50"
        >
          {isRunning ? '실행 중...' : '▶ 실행'}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div className={`p-4 border-t ${result.success ? 'border-green-600' : 'border-red-600'}`}>
          <div className="text-sm text-gray-400 mb-2">
            {result.success ? '✅ 성공' : '❌ 실패'}
            {result.time && ` | ${result.time}s`}
            {result.memory && ` | ${result.memory}`}
          </div>
          <pre className="bg-gray-900 p-3 rounded overflow-x-auto">{result.output}</pre>
        </div>
      )}
    </div>
  );
}
```

### components/MemoryViz.tsx

```tsx
import { useState } from 'react';
import { useStore } from '../stores/store';

export function MemoryViz() {
  const { memBlocks, malloc, free, resetMemory } = useStore();
  const [name, setName] = useState('');
  const [size, setSize] = useState(64);

  const handleMalloc = () => {
    if (!name.trim()) return;
    malloc(name.trim(), size);
    setName('');
  };

  return (
    <div className="flex h-full">
      {/* 컨트롤 */}
      <div className="w-64 p-4 border-r border-gray-700 space-y-4">
        <div>
          <label className="block text-sm mb-1">변수명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
            placeholder="ptr1"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">크기 (bytes)</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(+e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2"
          />
        </div>
        <button onClick={handleMalloc} className="w-full bg-purple-600 py-2 rounded">
          malloc()
        </button>
        <button onClick={resetMemory} className="w-full bg-gray-600 py-2 rounded">
          초기화
        </button>

        {/* 할당된 블록 목록 */}
        <div className="mt-4">
          <h3 className="text-sm text-gray-400 mb-2">할당된 블록</h3>
          {memBlocks.map((b) => (
            <div key={b.id} className="flex justify-between items-center py-1">
              <span>{b.name} ({b.size}B)</span>
              <button
                onClick={() => free(b.name)}
                className="text-red-400 text-sm"
              >
                free
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 시각화 */}
      <div className="flex-1 p-4">
        <h2 className="text-lg mb-4">Heap Memory</h2>
        <div className="space-y-2">
          {memBlocks.map((b) => (
            <div
              key={b.id}
              className="bg-purple-600 rounded p-3 flex justify-between"
              style={{ width: `${Math.min(100, b.size / 10 + 20)}%` }}
            >
              <span>{b.name}</span>
              <span className="text-sm opacity-70">
                0x{b.address.toString(16)} | {b.size}B
              </span>
            </div>
          ))}
          {memBlocks.length === 0 && (
            <div className="text-gray-500">할당된 메모리가 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. App.tsx (메인)

```tsx
import { useStore } from './stores/store';
import { Chat } from './components/Chat';
import { CodeEditor } from './components/CodeEditor';
import { MemoryViz } from './components/MemoryViz';

export default function App() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* 헤더 */}
      <header className="p-4 border-b border-gray-700 flex items-center gap-4">
        <h1 className="text-xl font-bold">COSLAB</h1>
        <nav className="flex gap-2">
          {(['chat', 'code', 'memory'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              {tab === 'chat' && '💬 AI 튜터'}
              {tab === 'code' && '💻 코드 실행'}
              {tab === 'memory' && '🧠 메모리'}
            </button>
          ))}
        </nav>
      </header>

      {/* 메인 */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'code' && <CodeEditor />}
        {activeTab === 'memory' && <MemoryViz />}
      </main>
    </div>
  );
}
```

---

## 📦 package.json

```json
{
  "name": "coslab",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "@uiw/react-codemirror": "^4.21.21",
    "@codemirror/lang-cpp": "^6.0.2",
    "@uiw/codemirror-theme-vscode": "^4.21.21"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

---

## 🔑 환경 변수 (.env)

```env
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here
```

**무료 API 키 받는 법:**
1. **Judge0**: https://rapidapi.com/judge0-official/api/judge0-ce → Subscribe (Basic = 무료)
2. **Groq**: https://console.groq.com → API Keys → Create

---

## 📊 비교: 이전 vs 지금

| 항목 | 이전 설계 | 진짜 MVP |
|------|-----------|----------|
| 파일 수 | 58개 | 12개 |
| 백엔드 | FastAPI + Docker | 없음 |
| 호스팅 비용 | VPS $40+/월 | $0 |
| AI 비용 | Ollama (GPU 필요) | Groq 무료 |
| 코드 실행 | 자체 Docker | Judge0 무료 |
| 예상 개발 기간 | 2-3개월 | 1-2주 |
| 상태 관리 | Recoil + hooks 4개 | Zustand 1개 |

---

## 🚀 배포 (Vercel)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 배포
vercel

# 3. 환경 변수 설정 (Vercel 대시보드에서)
VITE_RAPIDAPI_KEY=xxx
VITE_GROQ_API_KEY=xxx
```

---

## ⚠️ 한계 (알고 시작하기)

| 한계 | 이유 | 나중에 |
|------|------|--------|
| Judge0 50회/일 | 무료 tier | 유료 전환 or 자체 서버 |
| Groq rate limit | 무료 tier | OpenAI로 전환 |
| 메모리 시뮬 단순 | 프론트 전용 | 백엔드 추가 |
| 로그인 없음 | MVP | 나중에 추가 |

---

## ✅ 구현 순서 (1주일)

```
Day 1-2: 기본 구조
├── Vite + React + Tailwind 세팅
├── Zustand 스토어
└── 탭 네비게이션

Day 3-4: AI 튜터
├── Groq API 연동
├── Chat 컴포넌트
└── 테스트

Day 5-6: 코드 실행기
├── Judge0 API 연동
├── CodeMirror 설정
└── 결과 표시

Day 7: 메모리 + 배포
├── 메모리 시각화
├── Vercel 배포
└── 테스트
```
