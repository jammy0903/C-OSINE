import { useState, useEffect } from 'react';
import { useStore } from '../stores/store';
import { loadProblems } from '../services/problems';
import type { Problem } from '../types';

// 티어별 색상 (C-ode-to-you 스타일)
const tierColors: Record<string, string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-slate-500',
  gold: 'bg-yellow-500',
  platinum: 'bg-emerald-400',
  diamond: 'bg-sky-400',
  ruby: 'bg-rose-500',
};

const tierTextColors: Record<string, string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-400',
  gold: 'text-yellow-500',
  platinum: 'text-emerald-400',
  diamond: 'text-sky-400',
  ruby: 'text-rose-500',
};

function getTierInfo(difficulty: string) {
  const [tier, level] = difficulty.split('_');
  return { tier, level };
}

function getTierColorClass(difficulty: string) {
  const { tier } = getTierInfo(difficulty);
  return tierColors[tier] || 'bg-gray-500';
}

function getTierTextColorClass(difficulty: string) {
  const { tier } = getTierInfo(difficulty);
  return tierTextColors[tier] || 'text-gray-500';
}

function formatDifficulty(difficulty: string) {
  const { tier, level } = getTierInfo(difficulty);
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)} ${level}`;
}

export function ProblemList() {
  const { selectProblem } = useStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // JSON에서 문제 로드
  useEffect(() => {
    loadProblems()
      .then(setProblems)
      .finally(() => setLoading(false));
  }, []);

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.number.toString().includes(search);
    const matchesTier = !selectedTier || p.difficulty.includes(selectedTier);
    return matchesSearch && matchesTier;
  });

  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'ruby'];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* 검색바 */}
      <div className="p-4 bg-[#1a1a1a] border-b border-gray-800">
        <input
          type="text"
          placeholder="문제 번호 또는 제목 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* 필터 */}
      <div className="px-4 py-3 bg-[#1a1a1a] border-b border-gray-800 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedTier(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            selectedTier === null
              ? 'bg-blue-600 text-white'
              : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
          }`}
        >
          전체
        </button>
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedTier === tier
                ? `${tierColors[tier]} text-white`
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
            }`}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>

      {/* 문제 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            문제 로딩 중...
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            문제를 찾을 수 없습니다
          </div>
        ) : (
          filteredProblems.map((problem) => (
            <div
              key={problem.id}
              onClick={() => selectProblem(problem)}
              className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer transition-colors group"
            >
              {/* 상단: 번호 + 티어 + 상태 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm font-medium">
                    #{problem.number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${getTierColorClass(
                      problem.difficulty
                    )}`}
                  >
                    {formatDifficulty(problem.difficulty)}
                  </span>
                  {problem.source && (
                    <span className="text-gray-600 text-xs">
                      {problem.source}
                    </span>
                  )}
                </div>
                {problem.userStatus && (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      problem.userStatus === 'solved'
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {problem.userStatus === 'solved' ? '✓' : '○'}
                  </div>
                )}
              </div>

              {/* 제목 */}
              <h3 className="text-white font-medium text-lg mb-2 group-hover:text-blue-400 transition-colors">
                {problem.title}
              </h3>

              {/* 태그 */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {problem.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-[#2a2a2a] text-gray-400 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 테스트케이스 개수 */}
              {problem.testCases && (
                <div className="text-xs text-gray-500">
                  테스트케이스: <span className={getTierTextColorClass(problem.difficulty)}>{problem.testCases.length}개</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 푸터: 문제 수 */}
      <div className="px-4 py-2 bg-[#1a1a1a] border-t border-gray-800 text-center text-gray-500 text-sm">
        총 {problems.length}개 문제 | 필터: {filteredProblems.length}개
      </div>
    </div>
  );
}
