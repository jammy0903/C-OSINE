// 채팅 메시지
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 코드 실행 결과
export interface RunResult {
  success: boolean;
  output: string;
  time?: string;
  memory?: string;
}

// 메모리 블록
export interface MemBlock {
  id: string;
  name: string;
  size: number;
  address: number;
}

// 탭 타입
export type TabType = 'problems' | 'chat' | 'code' | 'memory';

// 문제 타입
export interface Problem {
  id: string;
  number: number;
  title: string;
  description?: string;
  difficulty: string;
  tags: string[];
  acceptedCount: number;
  submissionCount: number;
  userStatus?: 'solved' | 'attempted';
  testCases?: { input: string; output: string }[];
}
