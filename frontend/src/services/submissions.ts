/**
 * Submissions API 서비스
 * 사용자 제출 기록 및 풀이 상태 조회
 */

import { env } from '../config/env';

const API_URL = env.VITE_API_URL;

export interface SolvedStatus {
  solved: string[];   // 정답 처리된 문제 ID 목록
  attempted: string[]; // 시도했지만 아직 못 푼 문제 ID 목록
}

/**
 * 사용자의 풀이 상태 조회
 */
export async function getUserSolvedStatus(firebaseUid: string): Promise<SolvedStatus> {
  try {
    const response = await fetch(`${API_URL}/api/submissions/solved/${firebaseUid}`);
    if (!response.ok) {
      throw new Error('Failed to fetch solved status');
    }
    return await response.json();
  } catch (error) {
    console.error('풀이 상태 조회 실패:', error);
    return { solved: [], attempted: [] };
  }
}

/**
 * 제출 기록 생성
 */
export async function createSubmission(data: {
  firebaseUid: string;
  problemId: string;
  code: string;
  verdict: 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'time_limit';
  executionTime?: number;
}): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (error) {
    console.error('제출 기록 실패:', error);
    return false;
  }
}
