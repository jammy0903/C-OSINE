# COSLAB 통합 구현 계획 v2

## 핵심 원칙

1. **서버 최소화**: Node.js 1개 + PostgreSQL 1개 = 끝
2. **기존 자산 재사용**: Firebase(code2u-78d63), Prisma 스키마, Judge 서비스
3. **현실적 일정**: 버퍼 포함 22시간 (4일)

---

## 최종 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    COSLAB v2                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🌐 React 웹 앱 (Vite, localhost:5173)              │
│  ├── Firebase Auth (기존 code2u-78d63 재사용)       │
│  ├── 탭: [문제] [에디터] [메모리] [AI]              │
│  ├── Monaco Editor                                   │
│  └── TailwindCSS                                     │
│                                                      │
│  ⚙️ Node.js + Express (localhost:3000)              │
│  ├── /api/auth/verify     ← Firebase 토큰 검증      │
│  ├── /api/problems/*      ← 문제 CRUD               │
│  ├── /api/submissions/*   ← 제출 + 로컬 GCC 채점    │
│  ├── /api/memory/trace    ← 메모리 시뮬레이터 (포팅)│
│  └── Prisma ORM                                      │
│                                                      │
│  🗄️ PostgreSQL (Docker, localhost:5432)            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**변경점:**
- ~~FastAPI~~ → Node.js에 simulator.ts 통합
- ~~새 Firebase~~ → 기존 code2u-78d63 재사용
- ~~Judge0 API~~ → 로컬 GCC (이미 C-ode-to-you에 있음)

---

## Phase 0: 사전 준비 (30분)

### 0.1 기존 자산 확인
- [x] Firebase 프로젝트: `code2u-78d63`
- [x] Web Client ID: `681908599014-7cs8sm1enss3eb2i2bhigo2sq2p5t0sl.apps.googleusercontent.com`
- [x] Prisma 스키마: `~/projects/C-ode-to-you/backend/prisma/schema.prisma`
- [x] Judge 서비스: `~/projects/C-ode-to-you/backend/src/modules/submissions/judge.service.ts`
- [x] 메모리 시뮬레이터: `~/projects/cosine/C-OSINE/backend/simulator.py`

### 0.2 필요한 것
- [ ] Docker Desktop 실행 확인
- [ ] Node.js 18+ 확인
- [ ] GCC 설치 확인 (`gcc --version`)

---

## Phase 1: 백엔드 세팅 (Day 1, 6시간)

### 1.1 프로젝트 구조 생성 (30분)
```bash
# COSLAB 디렉토리에 백엔드 생성
cd ~/projects/cosine/C-OSINE
mkdir -p backend-node/src/{modules,middleware,config,utils}
mkdir -p backend-node/prisma
cd backend-node
npm init -y
```

### 1.2 의존성 설치 (15분)
```bash
npm install express cors dotenv
npm install @prisma/client firebase-admin
npm install -D typescript ts-node @types/node @types/express prisma
npx tsc --init
```

### 1.3 Prisma 스키마 복사 & 수정 (30분)
```bash
# C-ode-to-you에서 복사
cp ~/projects/C-ode-to-you/backend/prisma/schema.prisma ./prisma/

# 불필요한 모델 제거 (Kakao 관련, GitHub 관련)
# 유지: User, Problem, Submission, Draft
```

**수정된 schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id visually     String   @id @default(uuid())
  email      String   @unique
  name       String
  firebaseUid String  @unique @map("firebase_uid")
  createdAt  DateTime @default(now())

  submissions Submission[]
  drafts      Draft[]

  @@map("users")
}

model Problem {
  id          String   @id @default(uuid())
  number      Int      @unique
  title       String
  description String   @db.Text
  difficulty  String   @default("bronze_5")
  testCases   Json     @default("[]")
  createdAt   DateTime @default(now())

  submissions Submission[]
  drafts      Draft[]

  @@map("problems")
}

model Submission {
  id            String   @id @default(uuid())
  userId        String
  problemId     String
  code          String   @db.Text
  verdict       String   @default("judging")
  executionTime Int?
  createdAt     DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  problem Problem @relation(fields: [problemId], references: [id])

  @@map("submissions")
}

model Draft {
  id        String   @id @default(uuid())
  userId    String
  problemId String
  code      String   @db.Text
  savedAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  problem Problem @relation(fields: [problemId], references: [id])

  @@unique([userId, problemId])
  @@map("drafts")
}
```

### 1.4 PostgreSQL 실행 (15분)
```bash
docker run -d \
  --name coslab-db \
  -e POSTGRES_USER=coslab \
  -e POSTGRES_PASSWORD=coslab123 \
  -e POSTGRES_DB=coslab \
  -p 5432:5432 \
  postgres:15

# 확인
docker ps
```

### 1.5 환경변수 설정 (15분)
```bash
# backend-node/.env
PORT=3000
DATABASE_URL="postgresql://coslab:coslab123@localhost:5432/coslab"
FIREBASE_PROJECT_ID=code2u-78d63
```

### 1.6 Prisma 마이그레이션 (15분)
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 1.7 Firebase Admin 설정 (30분)
```typescript
// backend-node/src/config/firebase.ts
import admin from 'firebase-admin';

// Firebase Console > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성
// 다운로드한 JSON을 serviceAccountKey.json으로 저장

admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json'),
  projectId: 'code2u-78d63',
});

export const auth = admin.auth();
```

### 1.8 인증 미들웨어 (30분)
```typescript
// backend-node/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firebaseUid: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = await auth.verifyIdToken(token);

    // DB에서 사용자 찾기 또는 생성
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: decoded.email!,
          name: decoded.name || decoded.email!,
          firebaseUid: decoded.uid,
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firebaseUid: user.firebaseUid,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 1.9 Judge 서비스 복사 (30분)
```bash
# C-ode-to-you에서 복사
cp ~/projects/C-ode-to-you/backend/src/modules/submissions/judge.service.ts \
   ./src/modules/submissions/
```

### 1.10 메모리 시뮬레이터 TypeScript 포팅 (2시간)

```typescript
// backend-node/src/modules/memory/simulator.ts
// Python simulator.py를 TypeScript로 포팅

interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  pointsTo?: string;
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

export class CSimulator {
  private stackBase = 0x7fffffffde00;
  private heapBase = 0x555555559000;
  private variables: Map<string, any> = new Map();
  private heapBlocks: Map<string, any> = new Map();
  private stackOffset = 0;
  private heapOffset = 0;

  simulate(code: string): { success: boolean; steps: Step[]; sourceLines: string[] } {
    const lines = code.trim().split('\n');
    const steps: Step[] = [];
    let inMain = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('int main') || line.includes('void main')) {
        inMain = true;
        continue;
      }

      if (!inMain) continue;

      const stripped = line.trim();
      if (!stripped || stripped === '{' || stripped === '}') continue;
      if (stripped.startsWith('return')) {
        steps.push(this.createStep(i + 1, stripped, '프로그램 종료'));
        break;
      }
      if (stripped.startsWith('//')) continue;

      const step = this.analyzeLine(i + 1, stripped);
      if (step) steps.push(step);
    }

    return { success: true, steps, sourceLines: lines };
  }

  private analyzeLine(lineNum: number, code: string): Step | null {
    code = code.replace(/;$/, '').trim();

    // int x = 5;
    const intDecl = code.match(/^int\s+(\w+)\s*=\s*(-?\d+)$/);
    if (intDecl) {
      return this.handleIntDecl(lineNum, code, intDecl[1], parseInt(intDecl[2]));
    }

    // int *p = &x;
    const ptrDecl = code.match(/^int\s*\*\s*(\w+)\s*=\s*&(\w+)$/);
    if (ptrDecl) {
      return this.handlePtrDecl(lineNum, code, ptrDecl[1], ptrDecl[2]);
    }

    // *p = value;
    const ptrAssign = code.match(/^\*(\w+)\s*=\s*(-?\d+)$/);
    if (ptrAssign) {
      return this.handlePtrAssign(lineNum, code, ptrAssign[1], parseInt(ptrAssign[2]));
    }

    // printf 등
    if (code.includes('printf')) {
      return this.createStep(lineNum, code, 'printf: 화면에 출력');
    }

    return null;
  }

  private handleIntDecl(lineNum: number, code: string, name: string, value: number): Step {
    const addr = this.stackBase - this.stackOffset;
    this.stackOffset += 4;

    const bytes = this.intToBytes(value, 4);
    const explanation = `📦 정수 변수 '${name}' 선언 및 초기화

• 스택에 4바이트 공간 할당
• 주소: ${this.toHex(addr)}
• 값 ${value}를 리틀 엔디안으로 저장`;

    this.variables.set(name, {
      address: this.toHex(addr),
      type: 'int',
      size: 4,
      bytes,
      value: String(value),
    });

    return this.createStep(lineNum, code, explanation);
  }

  private handlePtrDecl(lineNum: number, code: string, ptrName: string, targetName: string): Step {
    const addr = this.stackBase - this.stackOffset;
    this.stackOffset += 8;

    const target = this.variables.get(targetName);
    if (!target) {
      return this.createStep(lineNum, code, `❌ 변수 '${targetName}'를 찾을 수 없음`);
    }

    const targetAddr = parseInt(target.address, 16);
    const bytes = this.intToBytes(targetAddr, 8);

    const explanation = `🔗 포인터 '${ptrName}' 선언 - '${targetName}'의 주소 저장

• 포인터 주소: ${this.toHex(addr)}
• 저장된 값: ${target.address} ('${targetName}'의 주소)`;

    this.variables.set(ptrName, {
      address: this.toHex(addr),
      type: 'int *',
      size: 8,
      bytes,
      value: target.address,
      pointsTo: target.address,
    });

    return this.createStep(lineNum, code, explanation);
  }

  private handlePtrAssign(lineNum: number, code: string, ptrName: string, value: number): Step {
    const ptr = this.variables.get(ptrName);
    if (!ptr) {
      return this.createStep(lineNum, code, `❌ 포인터 '${ptrName}'를 찾을 수 없음`);
    }

    // 타겟 변수 찾기
    let targetName = '';
    for (const [name, v] of this.variables) {
      if (v.address === ptr.pointsTo) {
        targetName = name;
        v.value = String(value);
        v.bytes = this.intToBytes(value, 4);
        break;
      }
    }

    const explanation = `✏️ 포인터를 통한 간접 수정!

• *${ptrName} = ${value}
• 실제로 '${targetName}'의 값이 변경됨`;

    return this.createStep(lineNum, code, explanation);
  }

  private createStep(lineNum: number, code: string, explanation: string): Step {
    const stack: MemoryBlock[] = [];
    for (const [name, v] of this.variables) {
      stack.push({
        name,
        address: v.address,
        type: v.type,
        size: v.size,
        bytes: v.bytes,
        value: v.value,
        pointsTo: v.pointsTo,
        explanation: '',
      });
    }

    return {
      line: lineNum,
      code,
      stack,
      heap: [],
      explanation,
      rsp: this.toHex(this.stackBase - this.stackOffset),
      rbp: this.toHex(this.stackBase),
    };
  }

  private intToBytes(value: number, size: number): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < size; i++) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  }

  private toHex(n: number): string {
    return '0x' + n.toString(16);
  }
}

export function simulateCode(code: string) {
  try {
    const sim = new CSimulator();
    return sim.simulate(code);
  } catch (e: any) {
    return { success: false, error: e.message, steps: [], sourceLines: [] };
  }
}
```

---

## Phase 2: 프론트엔드 Firebase 연동 (Day 2 오전, 3시간)

### 2.1 Firebase 패키지 설치 (10분)
```bash
cd ~/projects/cosine/C-OSINE/frontend
npm install firebase
```

### 2.2 Firebase 초기화 (30분)
```typescript
// frontend/src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBmLvVcgH4HQqxoH7ls2PvLCk4a_VbVj3w",
  authDomain: "code2u-78d63.firebaseapp.com",
  projectId: "code2u-78d63",
  storageBucket: "code2u-78d63.firebasestorage.app",
  messagingSenderId: "213972727628",
  appId: "1:213972727628:web:xxxxx"  // Firebase Console에서 확인
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
```

### 2.3 인증 상태 관리 (30분)
```typescript
// frontend/src/stores/authStore.ts
import { atom } from 'recoil';
import { User } from 'firebase/auth';

export const userState = atom<User | null>({
  key: 'userState',
  default: null,
});

export const isLoadingAuthState = atom<boolean>({
  key: 'isLoadingAuthState',
  default: true,
});
```

### 2.4 로그인 버튼 컴포넌트 (30분)
```typescript
// frontend/src/components/LoginButton.tsx
import { useRecoilState } from 'recoil';
import { userState } from '../stores/authStore';
import { loginWithGoogle, logout, auth } from '../services/firebase';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

export function LoginButton() {
  const [user, setUser] = useRecoilState(userState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" />
        <span className="text-sm">{user.displayName}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Google 아이콘 */}
      </svg>
      Google로 로그인
    </button>
  );
}
```

### 2.5 App.tsx 수정 (30분)
```typescript
// frontend/src/App.tsx
import { RecoilRoot } from 'recoil';
import { LoginButton } from './components/LoginButton';
// 기존 imports...

function App() {
  const [activeTab, setActiveTab] = useState<'problems' | 'editor' | 'memory' | 'ai'>('problems');

  return (
    <RecoilRoot>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="border-b border-gray-700 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">COSLAB</h1>
          <LoginButton />
        </header>

        {/* Tabs */}
        <nav className="border-b border-gray-700 px-4">
          <div className="flex gap-1">
            {(['problems', 'editor', 'memory', 'ai'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 ${
                  activeTab === tab
                    ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'problems' && '문제'}
                {tab === 'editor' && '에디터'}
                {tab === 'memory' && '메모리'}
                {tab === 'ai' && 'AI 튜터'}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1">
          {activeTab === 'problems' && <ProblemList />}
          {activeTab === 'editor' && <CodeEditor />}
          {activeTab === 'memory' && <MemoryViz />}
          {activeTab === 'ai' && <Chat />}
        </main>
      </div>
    </RecoilRoot>
  );
}
```

---

## Phase 3: 문제 UI 구현 (Day 2 오후, 3시간)

### 3.1 API 클라이언트 (30분)
```typescript
// frontend/src/services/api.ts
import { getIdToken } from './firebase';

const API_URL = 'http://localhost:3000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = await getIdToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // 문제
  getProblems: () => request('/problems'),
  getProblem: (id: string) => request(`/problems/${id}`),

  // 제출
  submitCode: (problemId: string, code: string) =>
    request('/submissions', {
      method: 'POST',
      body: JSON.stringify({ problemId, code }),
    }),

  // 메모리 시뮬레이션
  traceCode: (code: string) =>
    request('/memory/trace', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};
```

### 3.2 문제 목록 컴포넌트 (1시간)
```typescript
// frontend/src/components/ProblemList.tsx
import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Problem {
  id: string;
  number: number;
  title: string;
  difficulty: string;
}

export function ProblemList({ onSelect }: { onSelect?: (id: string) => void }) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProblems()
      .then(setProblems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">문제 목록</h2>
      <div className="space-y-2">
        {problems.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect?.(p.id)}
            className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer flex justify-between"
          >
            <span>
              <span className="text-gray-500 mr-2">#{p.number}</span>
              {p.title}
            </span>
            <span className={`text-sm ${getDifficultyColor(p.difficulty)}`}>
              {p.difficulty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDifficultyColor(d: string): string {
  if (d.includes('bronze')) return 'text-amber-600';
  if (d.includes('silver')) return 'text-gray-400';
  if (d.includes('gold')) return 'text-yellow-500';
  return 'text-gray-500';
}
```

### 3.3 에디터에 제출 기능 추가 (1시간)
```typescript
// 기존 CodeEditor.tsx에 추가

const [submitting, setSubmitting] = useState(false);
const [result, setResult] = useState<any>(null);

const handleSubmit = async () => {
  if (!selectedProblem) return alert('문제를 먼저 선택하세요');

  setSubmitting(true);
  try {
    const res = await api.submitCode(selectedProblem.id, code);
    setResult(res);
  } catch (e) {
    console.error(e);
  } finally {
    setSubmitting(false);
  }
};

// 버튼 추가
<button
  onClick={handleSubmit}
  disabled={submitting}
  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
>
  {submitting ? '채점 중...' : '제출'}
</button>
```

---

## Phase 4: 백엔드 API 완성 (Day 3 오전, 3시간)

### 4.1 Express 서버 설정 (30분)
```typescript
// backend-node/src/app.ts
import express from 'express';
import cors from 'cors';
import { problemRoutes } from './modules/problems/routes';
import { submissionRoutes } from './modules/submissions/routes';
import { memoryRoutes } from './modules/memory/routes';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/memory', memoryRoutes);

app.listen(3000, () => console.log('Server running on :3000'));
```

### 4.2 문제 라우트 (30분)
```typescript
// backend-node/src/modules/problems/routes.ts
import { Router } from 'express';
import { prisma } from '../../config/database';

export const problemRoutes = Router();

problemRoutes.get('/', async (req, res) => {
  const problems = await prisma.problem.findMany({
    select: { id: true, number: true, title: true, difficulty: true },
    orderBy: { number: 'asc' },
  });
  res.json(problems);
});

problemRoutes.get('/:id', async (req, res) => {
  const problem = await prisma.problem.findUnique({
    where: { id: req.params.id },
  });
  if (!problem) return res.status(404).json({ error: 'Not found' });
  res.json(problem);
});
```

### 4.3 제출 라우트 (1시간)
```typescript
// backend-node/src/modules/submissions/routes.ts
import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { JudgeService } from './judge.service';
import { prisma } from '../../config/database';

export const submissionRoutes = Router();
const judge = new JudgeService();

submissionRoutes.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { problemId, code } = req.body;

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  // 제출 생성
  const submission = await prisma.submission.create({
    data: {
      userId: req.user!.id,
      problemId,
      code,
      verdict: 'judging',
    },
  });

  // 채점
  const testCases = problem.testCases as { input: string; output: string }[];
  const result = await judge.judgeCode(code, testCases);

  // 결과 업데이트
  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      verdict: result.verdict,
      executionTime: result.executionTime,
    },
  });

  res.json(result);
});
```

### 4.4 메모리 시뮬레이터 라우트 (30분)
```typescript
// backend-node/src/modules/memory/routes.ts
import { Router } from 'express';
import { simulateCode } from './simulator';

export const memoryRoutes = Router();

memoryRoutes.post('/trace', (req, res) => {
  const { code } = req.body;
  const result = simulateCode(code);
  res.json(result);
});
```

---

## Phase 5: 테스트 & 마무리 (Day 3 오후 ~ Day 4, 4시간)

### 5.1 샘플 데이터 Seed (30분)
```typescript
// backend-node/prisma/seed.ts
import { prisma } from '../src/config/database';

async function main() {
  await prisma.problem.createMany({
    data: [
      {
        number: 1,
        title: 'Hello World',
        description: 'printf를 사용해서 "Hello World"를 출력하세요.',
        difficulty: 'bronze_5',
        testCases: JSON.stringify([
          { input: '', output: 'Hello World' }
        ]),
      },
      {
        number: 2,
        title: '두 수 더하기',
        description: '두 정수 A와 B를 입력받아 A+B를 출력하세요.',
        difficulty: 'bronze_5',
        testCases: JSON.stringify([
          { input: '1 2', output: '3' },
          { input: '5 7', output: '12' },
        ]),
      },
      {
        number: 3,
        title: '포인터 기초',
        description: '두 변수의 값을 포인터를 사용해서 교환하세요.',
        difficulty: 'bronze_4',
        testCases: JSON.stringify([
          { input: '3 5', output: '5 3' },
        ]),
      },
    ],
  });
}

main();
```

### 5.2 테스트 체크리스트
- [ ] Google 로그인 → 성공하면 우상단에 프로필 표시
- [ ] 문제 목록 → 3개 문제 표시
- [ ] 문제 선택 → 에디터로 이동, 설명 표시
- [ ] 코드 제출 → "맞았습니다" 또는 "틀렸습니다"
- [ ] 메모리 탭 → 기존 기능 작동
- [ ] AI 탭 → Groq API 작동

### 5.3 버그 수정 버퍼 (2시간)
(예상되는 이슈)
- CORS 에러 → 백엔드 origin 설정
- Firebase 도메인 에러 → localhost 승인 도메인 추가
- Prisma 연결 에러 → Docker 상태 확인

---

## 일정 요약

| Day | 작업 | 시간 |
|-----|------|------|
| **Day 1** | Phase 1: 백엔드 세팅 | 6시간 |
| **Day 2 오전** | Phase 2: Firebase 연동 | 3시간 |
| **Day 2 오후** | Phase 3: 문제 UI | 3시간 |
| **Day 3 오전** | Phase 4: API 완성 | 3시간 |
| **Day 3 오후** | Phase 5: 테스트 | 2시간 |
| **Day 4** | 버그 수정 + 배포 | 3시간 |
| **버퍼** | 예상치 못한 이슈 | 2시간 |
| **총계** | | **22시간** |

---

## 배포 (선택)

### Vercel (프론트엔드)
```bash
cd frontend
npx vercel
```

### Railway (백엔드 + DB)
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 배포
railway login
railway init
railway up
```

---

## 다음 단계

1. **지금 바로**: Docker PostgreSQL 실행
2. **오늘**: Phase 1 완료
3. **내일**: Phase 2-3 완료 → 로그인 + 문제 목록 작동

시작할까?
