/**
 * useProblems Hook
 * 문제 목록 로딩, 필터링, 페이지네이션 관리
 */

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../../stores/store';
import { loadProblems } from '../../../services/problems';
import { config } from '../../../config';
import type { Problem } from '../../../types';

const ITEMS_PER_PAGE = config.ui.problemsPerPage;

export function useProblems() {
  const { solvedProblems, attemptedProblems, user } = useStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 문제 로딩
  useEffect(() => {
    loadProblems()
      .then(setProblems)
      .finally(() => setLoading(false));
  }, []);

  // 통계
  const stats = useMemo(() => ({
    total: problems.length,
    solved: solvedProblems.length,
    attempted: attemptedProblems.length,
    remaining: problems.length - solvedProblems.length,
  }), [problems.length, solvedProblems.length, attemptedProblems.length]);

  // 필터링된 문제
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch = search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.number.toString().includes(search) ||
        p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesDifficulty = !selectedDifficulty ||
        p.difficulty.toLowerCase().includes(selectedDifficulty);
      return matchesSearch && matchesDifficulty;
    });
  }, [problems, search, selectedDifficulty]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProblems = filteredProblems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 필터 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDifficulty]);

  // 사용자 상태 확인
  const getUserStatus = (problemId: string): 'solved' | 'attempted' | null => {
    if (solvedProblems.includes(problemId)) return 'solved';
    if (attemptedProblems.includes(problemId)) return 'attempted';
    return null;
  };

  return {
    // 데이터
    problems: paginatedProblems,
    filteredCount: filteredProblems.length,
    stats,
    loading,
    user,

    // 필터
    search,
    setSearch,
    selectedDifficulty,
    setSelectedDifficulty,

    // 페이지네이션
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    itemsPerPage: ITEMS_PER_PAGE,

    // 유틸리티
    getUserStatus,
  };
}
