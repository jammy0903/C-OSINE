import { useState, useEffect } from 'react';
import { useStore } from '../stores/store';
import { loadProblems } from '../services/problems';
import type { Problem } from '../types';

// Tag color mapping - comprehensive coverage
const TAG_COLORS: Record<string, { text: string }> = {
  // 알고리즘 분류
  '구현': { text: '#a78bfa' },
  '시뮬레이션': { text: '#a78bfa' },
  '브루트포스': { text: '#ef4444' },
  '완전탐색': { text: '#ef4444' },

  // 수학 계열
  '수학': { text: '#fbbf24' },
  '산수': { text: '#fbbf24' },
  '기하': { text: '#fbbf24' },
  '기하학': { text: '#fbbf24' },
  '정수론': { text: '#fbbf24' },

  // 문자열
  '문자열': { text: '#34d399' },
  '파싱': { text: '#34d399' },

  // 자료구조
  '자료구조': { text: '#60a5fa' },
  '배열': { text: '#60a5fa' },
  '스택': { text: '#60a5fa' },
  '큐': { text: '#60a5fa' },
  '해시': { text: '#60a5fa' },
  '트리': { text: '#60a5fa' },

  // 정렬/탐색
  '정렬': { text: '#fb923c' },
  '탐색': { text: '#f472b6' },
  '이분탐색': { text: '#f472b6' },
  '이진탐색': { text: '#f472b6' },

  // 그래프
  '그래프': { text: '#2dd4bf' },
  'bfs': { text: '#2dd4bf' },
  'dfs': { text: '#2dd4bf' },

  // DP/그리디
  'dp': { text: '#818cf8' },
  '다이나믹': { text: '#818cf8' },
  '동적계획': { text: '#818cf8' },
  '그리디': { text: '#a3e635' },
  '탐욕': { text: '#a3e635' },

  // 기초
  '입출력': { text: '#9ca3af' },
  '조건문': { text: '#9ca3af' },
  '반복문': { text: '#9ca3af' },
  '사칙연산': { text: '#9ca3af' },

  // 고급
  '재귀': { text: '#ec4899' },
  '분할정복': { text: '#ec4899' },
  '백트래킹': { text: '#ec4899' },
};

const FALLBACK_COLORS = ['#8b5cf6', '#0ea5e9', '#a855f7', '#22c55e', '#f97316'];

function getTagColor(tag: string, index: number): string {
  const lowerTag = tag.toLowerCase();
  for (const [key, value] of Object.entries(TAG_COLORS)) {
    if (lowerTag.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTag)) {
      return value.text;
    }
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function ProblemList() {
  const { selectProblem, solvedProblems, attemptedProblems } = useStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.number.toString().includes(search) ||
    p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#252525]">
        <h2 className="font-title text-2xl tracking-[0.15em] text-white mb-4">PROBLEMS</h2>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-0 py-3 bg-transparent border-b border-[#252525] placeholder-neutral-600 focus:outline-none focus:border-white transition-colors text-sm tracking-wide"
          style={{ color: '#ffffff' }}
        />
      </div>

      {/* Table Header */}
      <div className="px-8 py-3 border-b border-[#252525] bg-[#0d0d0d]">
        <div className="grid grid-cols-[40px_60px_1fr_1fr] gap-4 items-center">
          <span className="font-title text-neutral-600 text-[0.65rem] tracking-widest text-center">ST</span>
          <span className="font-title text-neutral-600 text-[0.65rem] tracking-widest text-center">NO</span>
          <span className="font-title text-neutral-600 text-[0.65rem] tracking-widest">TITLE</span>
          <span className="font-title text-neutral-600 text-[0.65rem] tracking-widest">TAGS</span>
        </div>
      </div>

      {/* Problem List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-title text-neutral-600 text-sm tracking-widest">LOADING...</span>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-title text-neutral-600 text-sm tracking-widest">NO RESULTS</span>
          </div>
        ) : (
          <div>
            {filteredProblems.map((problem, idx) => {
              const status = getUserStatus(problem.id);
              return (
                <div
                  key={problem.id}
                  onClick={() => selectProblem(problem)}
                  className={`px-8 py-4 hover:bg-[#151515] cursor-pointer transition-all duration-200 group border-b border-[#1a1a1a] ${
                    idx % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0e0e0e]'
                  }`}
                >
                  <div className="grid grid-cols-[40px_60px_1fr_1fr] gap-4 items-center">
                    {/* Status */}
                    <div className="text-center">
                      {status === 'solved' && (
                        <span className="text-[#4ade80] text-sm">✓</span>
                      )}
                      {status === 'attempted' && (
                        <span className="text-[#fbbf24] text-sm">○</span>
                      )}
                      {!status && (
                        <span className="text-neutral-700 text-sm">·</span>
                      )}
                    </div>

                    {/* Number */}
                    <div className="text-center">
                      <span className="font-mono text-neutral-500 text-xs">
                        {problem.number}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white text-sm font-light tracking-wide group-hover:text-neutral-300 transition-colors truncate">
                      {problem.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex items-center gap-4 overflow-hidden">
                      {problem.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs tracking-wide whitespace-nowrap"
                          style={{ color: getTagColor(tag, i) }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-[#252525]">
        <span className="font-title text-neutral-600 text-xs tracking-[0.15em]">
          {filteredProblems.length} / {problems.length} PROBLEMS
        </span>
      </div>
    </div>
  );
}
