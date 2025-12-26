/**
 * Node.js 백엔드 메모리 트레이서 API
 * C 코드 시뮬레이션 및 메모리 상태 추적
 */

import { config } from '../config';

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
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.memoryTrace}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        stdin,
        timeout: config.api.timeout.trace,
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
