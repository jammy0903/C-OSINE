// Re-export memory types from dedicated module
export type { MemoryBlock, Step, TraceResult } from './types/memory';

// Chat message
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Code execution result
export interface RunResult {
  success: boolean;
  output: string;
  time?: string;
  memory?: string;
}

// Tab type
export type TabType = 'problems' | 'chat' | 'memory';

// 문제 타입
export interface Problem {
  id: string;
  number: number;
  title: string;
  description?: string;
  difficulty: string;
  tags: string[];
  source?: string;
  solution?: string;  // 모범답안 (AI 생성)
  testCases?: { input: string; output: string }[];
  // UI용 (선택적)
  acceptedCount?: number;
  submissionCount?: number;
  userStatus?: 'solved' | 'attempted';
}
