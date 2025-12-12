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
export type TabType = 'chat' | 'code' | 'memory';
