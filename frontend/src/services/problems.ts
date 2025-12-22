/**
 * 문제 DB 서비스
 * 현재: JSON 파일에서 로드
 * 나중에: SQLite/API로 마이그레이션 예정
 */

import type { Problem } from '../types';

// JSON 파일 경로 (개발: 상대경로, 프로덕션: API)
const PROBLEMS_URL = '/data/problems.json';

interface ProblemsDB {
  _schema: {
    version: string;
    description: string;
  };
  problems: Problem[];
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
    const response = await fetch(PROBLEMS_URL);
    if (!response.ok) {
      throw new Error(`Failed to load problems: ${response.status}`);
    }

    const data: ProblemsDB = await response.json();
    cachedProblems = data.problems;
    return cachedProblems;
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
