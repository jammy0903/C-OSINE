/**
 * 문제 DB 서비스
 * 백엔드 API에서 로드
 */

import type { Problem } from '../types';
import { config } from '../config';


// 백엔드에서 받은 Raw Problem (JSON 문자열 포함)
interface RawProblem extends Omit<Problem, 'tags' | 'testCases'> {
  tags: string | string[];
  testCases: string | { input: string; output: string }[];
}

let cachedProblems: Problem[] | null = null;

/**
 * 모든 문제 로드
 */
export async function loadProblems(): Promise<Problem[]> {
  if (cachedProblems) {
    return cachedProblems;
  }

  try {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.problems}`);
    if (!response.ok) {
      throw new Error(`Failed to load problems: ${response.status}`);
    }

    const data: RawProblem[] = await response.json();
    // 백엔드에서 tags, testCases가 JSON 문자열로 오므로 파싱
    cachedProblems = data.map((p) => ({
      ...p,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
      testCases: typeof p.testCases === 'string' ? JSON.parse(p.testCases) : p.testCases,
    }));
    return cachedProblems ?? [];
  } catch (error) {
    console.error('문제 로드 실패:', error);
    return [];
  }
}

/**
 * ID로 문제 찾기
 */
export async function getProblemById(id: string): Promise<Problem | null> {
  const problems = await loadProblems();
  return problems.find(p => p.id === id) || null;
}

/**
 * 난이도별 필터링
 */
export async function getProblemsByDifficulty(tier: string): Promise<Problem[]> {
  const problems = await loadProblems();
  return problems.filter(p => p.difficulty.startsWith(tier));
}

/**
 * 태그별 필터링
 */
export async function getProblemsByTag(tag: string): Promise<Problem[]> {
  const problems = await loadProblems();
  return problems.filter(p => p.tags.includes(tag));
}

/**
 * 캐시 초기화 (새로고침 시)
 */
export function clearCache(): void {
  cachedProblems = null;
}
