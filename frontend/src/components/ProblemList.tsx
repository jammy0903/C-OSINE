import { useState, useEffect } from 'react';
import { useStore } from '../stores/store';
import { loadProblems } from '../services/problems';
import type { Problem } from '../types';

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
    <div className="h-full flex flex-col bg-black">
      {/* 헤더 */}
      <div className="px-8 py-6 border-b border-neutral-800">
        <h2 className="text-2xl font-light tracking-wider text-white mb-4">PROBLEMS</h2>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-0 py-3 bg-transparent border-b border-neutral-700 placeholder-neutral-600 focus:outline-none focus:border-white transition-colors text-sm tracking-wide"
          style={{ color: '#ffffff', caretColor: '#ffffff' }}
        />
      </div>

      {/* 문제 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-neutral-600 text-sm tracking-widest">LOADING...</span>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-neutral-600 text-sm tracking-widest">NO RESULTS</span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                onClick={() => selectProblem(problem)}
                className="px-8 py-6 hover:bg-neutral-950 cursor-pointer transition-all duration-300 group"
              >
                {/* 상단: 번호 + 상태 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-600 text-xs tracking-[0.2em] font-medium">
                    NO. {problem.number}
                  </span>
                  {getUserStatus(problem.id) && (
                    <span className="text-sm">
                      {getUserStatus(problem.id) === 'solved' ? '✅' : '🤔'}
                    </span>
                  )}
                </div>

                {/* 제목 */}
                <h3 className="text-white text-lg font-light tracking-wide mb-4 group-hover:text-neutral-300 transition-colors">
                  {problem.title}
                </h3>

                {/* 태그 - 해시태그 스타일 */}
                <div className="flex flex-wrap gap-3">
                  {problem.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-neutral-500 text-xs tracking-wide hover:text-neutral-300 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-8 py-4 border-t border-neutral-800">
        <span className="text-neutral-600 text-xs tracking-[0.15em]">
          {filteredProblems.length} / {problems.length} PROBLEMS
        </span>
      </div>
    </div>
  );
}
