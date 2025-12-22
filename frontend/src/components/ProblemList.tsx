import { useState, useEffect } from 'react';
import { useStore } from '../stores/store';
import { loadProblems } from '../services/problems';
import type { Problem } from '../types';

// Tag color mapping
const TAG_COLORS: Record<string, string> = {
  '구현': '#a78bfa', '시뮬레이션': '#a78bfa',
  '브루트포스': '#ef4444', '완전탐색': '#ef4444',
  '수학': '#fbbf24', '산수': '#fbbf24', '기하': '#fbbf24', '기하학': '#fbbf24', '정수론': '#fbbf24',
  '문자열': '#34d399', '파싱': '#34d399',
  '자료구조': '#60a5fa', '배열': '#60a5fa', '스택': '#60a5fa', '큐': '#60a5fa', '해시': '#60a5fa', '트리': '#60a5fa',
  '정렬': '#fb923c',
  '탐색': '#f472b6', '이분탐색': '#f472b6', '이진탐색': '#f472b6',
  '그래프': '#2dd4bf', 'bfs': '#2dd4bf', 'dfs': '#2dd4bf',
  'dp': '#818cf8', '다이나믹': '#818cf8', '동적계획': '#818cf8',
  '그리디': '#a3e635', '탐욕': '#a3e635',
  '입출력': '#9ca3af', '조건문': '#9ca3af', '반복문': '#9ca3af', '사칙연산': '#9ca3af',
  '재귀': '#ec4899', '분할정복': '#ec4899', '백트래킹': '#ec4899',
};

const FALLBACK_COLORS = ['#8b5cf6', '#0ea5e9', '#a855f7', '#22c55e', '#f97316'];

function getTagColor(tag: string, index: number): string {
  const lowerTag = tag.toLowerCase();
  for (const [key, value] of Object.entries(TAG_COLORS)) {
    if (lowerTag.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTag)) {
      return value;
    }
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Difficulty levels with colors (iOS-style hierarchy)
const DIFFICULTY_LEVELS = [
  { id: 'bronze', label: 'Bronze', color: '#cd7f32' },
  { id: 'silver', label: 'Silver', color: '#c0c0c0' },
  { id: 'gold', label: 'Gold', color: '#ffd700' },
  { id: 'platinum', label: 'Platinum', color: '#4ade80' },
  { id: 'diamond', label: 'Diamond', color: '#60a5fa' },
];

// Common tags for filter
const COMMON_TAGS = ['구현', '수학', '문자열', '자료구조', '정렬', '탐색', 'dp', '그리디', '그래프'];

function getDifficultyStyle(diff: string): { color: string; label: string } {
  const lower = diff.toLowerCase();
  if (lower.includes('bronze') || lower.includes('브론즈')) return { color: '#cd7f32', label: diff };
  if (lower.includes('silver') || lower.includes('실버')) return { color: '#c0c0c0', label: diff };
  if (lower.includes('gold') || lower.includes('골드')) return { color: '#ffd700', label: diff };
  if (lower.includes('platinum') || lower.includes('플래티넘')) return { color: '#4ade80', label: diff };
  if (lower.includes('diamond') || lower.includes('다이아')) return { color: '#60a5fa', label: diff };
  if (lower.includes('ruby') || lower.includes('루비')) return { color: '#ef4444', label: diff };
  if (lower.includes('easy') || lower.includes('쉬움') || lower === '1' || lower === '2') return { color: '#4ade80', label: diff };
  if (lower.includes('medium') || lower.includes('보통') || lower === '3' || lower === '4') return { color: '#fbbf24', label: diff };
  if (lower.includes('hard') || lower.includes('어려움') || lower === '5') return { color: '#ef4444', label: diff };
  return { color: '#737373', label: diff };
}

export function ProblemList() {
  const { selectProblem, solvedProblems, attemptedProblems } = useStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filter states
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadProblems()
      .then(setProblems)
      .finally(() => setLoading(false));
  }, []);

  const getUserStatus = (problemId: string): 'solved' | 'attempted' | null => {
    if (solvedProblems.includes(problemId)) return 'solved';
    if (attemptedProblems.includes(problemId)) return 'attempted';
    return null;
  };

  const toggleLevel = (levelId: string) => {
    setSelectedLevels(prev =>
      prev.includes(levelId)
        ? prev.filter(l => l !== levelId)
        : [...prev, levelId]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedLevels([]);
    setSelectedTags([]);
    setSearch('');
  };

  const hasActiveFilters = selectedLevels.length > 0 || selectedTags.length > 0 || search.length > 0;

  const filteredProblems = problems.filter((p) => {
    // Search filter
    const matchesSearch = search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.number.toString().includes(search) ||
      p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

    // Level filter
    const matchesLevel = selectedLevels.length === 0 ||
      selectedLevels.some(level => p.difficulty.toLowerCase().includes(level));

    // Tag filter
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag =>
        p.tags.some(pTag => pTag.toLowerCase().includes(tag.toLowerCase()))
      );

    return matchesSearch && matchesLevel && matchesTags;
  });

  return (
    <div className="h-full flex flex-col bg-[#161618] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-2.5 border-b border-[#1a1a1a]">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-title text-lg tracking-[0.15em] text-white">PROBLEMS</h2>
          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="font-title text-[0.6rem] tracking-[0.15em] text-neutral-600 hover:text-white">
                CLEAR
              </button>
            )}
            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 font-title text-[0.6rem] tracking-[0.15em] ${isFilterOpen || hasActiveFilters ? 'text-white' : 'text-neutral-600'}`}
            >
              FILTER
              {hasActiveFilters && <span className="w-1 h-1 rounded-full bg-white" />}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isFilterOpen ? 'rotate-180' : ''}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-neutral-700">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-5 py-1.5 bg-transparent border-b border-[#1a1a1a] placeholder-neutral-700 focus:outline-none focus:border-neutral-500 text-xs tracking-wide text-white"
          />
        </div>

        {/* Filters */}
        {isFilterOpen && (
          <div className="pt-3 mt-3 border-t border-[#1a1a1a] space-y-3">
            {/* Level Filter */}
            <div>
              <span className="text-[10px] text-neutral-500 mb-2 block">난이도</span>
              <div className="flex flex-wrap gap-3">
                {DIFFICULTY_LEVELS.map((level) => {
                  const isSelected = selectedLevels.includes(level.id);
                  return (
                    <button
                      key={level.id}
                      onClick={() => toggleLevel(level.id)}
                      className="rounded-full text-[11px]"
                      style={{
                        padding: '7px 14px',
                        backgroundColor: isSelected ? level.color : '#252530',
                        color: isSelected ? '#fff' : '#999'
                      }}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tag Filter */}
            <div>
              <span className="text-[10px] text-neutral-500 mb-2 block">태그</span>
              <div className="flex flex-wrap gap-3">
                {COMMON_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const color = getTagColor(tag, 0);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="rounded-full text-[11px]"
                      style={{
                        padding: '7px 14px',
                        backgroundColor: isSelected ? color : '#252530',
                        color: isSelected ? '#fff' : '#999'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Header */}
      <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#080808]">
        <div className="grid grid-cols-[24px_48px_1fr_minmax(0,0.8fr)_48px] gap-4 items-center">
          <span className="text-neutral-600 text-[10px] text-center">ST</span>
          <span className="text-neutral-600 text-[10px] text-center">NO</span>
          <span className="text-neutral-600 text-[10px]">TITLE</span>
          <span className="text-neutral-600 text-[10px]">TAGS</span>
          <span className="text-neutral-600 text-[10px] text-center">LV</span>
        </div>
      </div>

      {/* Problem List - iOS: Depth with alternating rows */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-title text-neutral-600 text-sm tracking-widest">LOADING...</span>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="font-title text-neutral-600 text-sm tracking-widest">NO RESULTS</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="font-title text-xs tracking-widest text-neutral-500 hover:text-white">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredProblems.map((problem, idx) => {
              const status = getUserStatus(problem.id);
              const diffStyle = getDifficultyStyle(problem.difficulty);
              return (
                <div
                  key={problem.id}
                  onClick={() => selectProblem(problem)}
                  className={`px-4 py-3 cursor-pointer border-b border-[#131313] hover:bg-[#151515] ${idx % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0c0c0c]'}`}
                >
                  <div className="grid grid-cols-[24px_48px_1fr_minmax(0,0.8fr)_48px] gap-4 items-center">
                    {/* Status */}
                    <div className="text-center">
                      {status === 'solved' && <span className="text-[#4ade80]">✓</span>}
                      {status === 'attempted' && <span className="text-[#fbbf24]">○</span>}
                      {!status && <span className="text-neutral-800">·</span>}
                    </div>

                    {/* Number */}
                    <div className="text-center">
                      <span className="font-mono text-neutral-500 text-xs">{problem.number}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white text-xs font-light tracking-wide truncate">
                      {problem.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex items-center gap-1 overflow-hidden min-w-0">
                      {problem.tags.slice(0, 2).map((tag, i) => {
                        const color = getTagColor(tag, i);
                        return (
                          <span
                            key={i}
                            className="text-[0.5rem] whitespace-nowrap rounded-full px-2 py-0.5 truncate"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      {problem.tags.length > 2 && (
                        <span className="text-neutral-600 text-[0.5rem]">+{problem.tags.length - 2}</span>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div className="text-center">
                      <span
                        className="text-xs font-mono tracking-wide"
                        style={{ color: diffStyle.color }}
                      >
                        {diffStyle.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Minimal */}
      <div className="px-6 py-2 border-t border-[#1a1a1a] flex items-center justify-between">
        <span className="font-title text-neutral-700 text-[0.6rem] tracking-[0.15em]">
          {filteredProblems.length} / {problems.length}
        </span>
        {hasActiveFilters && (
          <span className="font-title text-neutral-600 text-[0.6rem] tracking-wide">
            {selectedLevels.length > 0 && `${selectedLevels.length}L`}
            {selectedLevels.length > 0 && selectedTags.length > 0 && ' · '}
            {selectedTags.length > 0 && `${selectedTags.length}T`}
          </span>
        )}
      </div>
    </div>
  );
}
