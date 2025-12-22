/**
 * Node.js 백엔드 메모리 트레이서 API
 * C 코드 시뮬레이션 및 메모리 상태 추적
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to: string | null;
}

export interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  explanation: string;  // 교육용 설명
  rsp: string;
  rbp: string;
}

export interface TraceResult {
  success: boolean;
  steps: Step[];
  source_lines: string[];
  error?: string;
  message?: string;
}

export async function traceCode(code: string, stdin = ''): Promise<TraceResult> {
  try {
    const response = await fetch(`${API_URL}/api/memory/trace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        stdin,
        timeout: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        steps: [],
        source_lines: [],
        error: 'api_error',
        message: errorData.detail || `HTTP ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      steps: [],
      source_lines: [],
      error: 'network_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
