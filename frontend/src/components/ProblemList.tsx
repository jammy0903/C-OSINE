import { useState, useEffect } from 'react';
import { useStore } from '../stores/store';
import { loadProblems } from '../services/problems';
import type { Problem } from '../types';

// Tag color mapping
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  '구현': { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
  '시뮬레이션': { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
  '브루트포스': { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' },
  '완전탐색': { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' },
  '수학': { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  '문자열': { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399' },
  '자료구조': { bg: 'rgba(34, 211, 238, 0.15)', text: '#22d3ee' },
  '정렬': { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c' },
  '탐색': { bg: 'rgba(244, 114, 182, 0.15)', text: '#f472b6' },
  'dp': { bg: 'rgba(167, 139, 250, 0.15)', text: '#a78bfa' },
  '그리디': { bg: 'rgba(163, 230, 53, 0.15)', text: '#a3e635' },
  '그래프': { bg: 'rgba(45, 212, 191, 0.15)', text: '#2dd4bf' },
};

const FALLBACK_COLORS = [
  { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' },
  { bg: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9' },
];

function getTagColor(tag: string, index: number) {
  const lowerTag = tag.toLowerCase();
  for (const [key, value] of Object.entries(TAG_COLORS)) {
    if (lowerTag.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTag)) {
      return value;
    }
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Difficulty config
const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  bronze: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)', label: 'Bronze' },
  silver: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', label: 'Silver' },
  gold: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', label: 'Gold' },
  platinum: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', label: 'Platinum' },
  diamond: { color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.15)', label: 'Diamond' },
  ruby: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', label: 'Ruby' },
};

function getDifficultyInfo(diff: string) {
  const lower = diff.toLowerCase();
  for (const [key, value] of Object.entries(DIFFICULTY_CONFIG)) {
    if (lower.includes(key)) return value;
  }
  return { color: '#a1a1a6', bg: 'rgba(161, 161, 166, 0.15)', label: diff };
}

export function ProblemList() {
  const { selectProblem, solvedProblems, attemptedProblems } = useStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  useEffect(() => {
    loadProblems()
      .then(setProblems)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: problems.length,
    solved: solvedProblems.length,
    attempted: attemptedProblems.length,
    remaining: problems.length - solvedProblems.length,
  };

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.number.toString().includes(search) ||
      p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesDifficulty = !selectedDifficulty ||
      p.difficulty.toLowerCase().includes(selectedDifficulty);
    return matchesSearch && matchesDifficulty;
  });

  const getUserStatus = (problemId: string): 'solved' | 'attempted' | null => {
    if (solvedProblems.includes(problemId)) return 'solved';
    if (attemptedProblems.includes(problemId)) return 'attempted';
    return null;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <StatCard title="Total" value={stats.total} color="primary" />
        <StatCard title="Solved" value={stats.solved} color="success" percent={stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0} />
        <StatCard title="Attempted" value={stats.attempted} color="warning" />
        <StatCard title="Remaining" value={stats.remaining} color="info" />
      </div>

      {/* Table Card */}
      <div className="flex-1 bg-bg-elevated rounded-xl overflow-hidden flex flex-col min-h-0">
        {/* Table Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium text-text">Problems</h3>
            <span className="text-xs text-text-tertiary">{filteredProblems.length} items</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Difficulty Filter */}
            <div className="flex items-center gap-1 bg-bg rounded-lg p-1">
              {['All', 'Bronze', 'Silver', 'Gold', 'Platinum'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff === 'All' ? null : diff.toLowerCase())}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    (diff === 'All' && !selectedDifficulty) || selectedDifficulty === diff.toLowerCase()
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text hover:bg-bg-hover'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <svg width="14" height="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 bg-bg border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-bg-elevated z-10">
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-tertiary uppercase tracking-wider w-16">No.</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-tertiary uppercase tracking-wider w-48">Title</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">Tags</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-text-tertiary uppercase tracking-wider w-24">Level</th>
                  <th className="text-center px-5 py-2.5 text-xs font-medium text-text-tertiary uppercase tracking-wider w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.slice(0, 30).map((problem) => {
                  const status = getUserStatus(problem.id);
                  const diffInfo = getDifficultyInfo(problem.difficulty);
                  return (
                    <tr
                      key={problem.id}
                      onClick={() => selectProblem(problem)}
                      className="border-b border-border-light hover:bg-bg-hover transition-colors cursor-pointer group"
                    >
                      {/* Number */}
                      <td className="px-5 py-3">
                        <span className="text-text-tertiary text-sm font-mono">{problem.number}</span>
                      </td>
                      {/* Title */}
                      <td className="px-5 py-3">
                        <span className="text-text font-medium text-sm group-hover:text-primary transition-colors">
                          {problem.title}
                        </span>
                      </td>
                      {/* Tags - 전체 나열 */}
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.map((tag, i) => {
                            const color = getTagColor(tag, i);
                            return (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: color.bg, color: color.text }}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      {/* Difficulty */}
                      <td className="px-5 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: diffInfo.bg, color: diffInfo.color }}
                        >
                          {diffInfo.label}
                        </span>
                      </td>
                      {/* Status - 아이콘만 */}
                      <td className="px-5 py-3 text-center">
                        {status === 'solved' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : status === 'attempted' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning/15 text-warning">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-border-dark text-text-muted">
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProblems.length === 0 && (
              <div className="text-center py-12 text-text-secondary text-sm">
                No problems found
              </div>
            )}

            {/* Pagination hint */}
            {filteredProblems.length > 30 && (
              <div className="px-5 py-3 border-t border-border text-center">
                <span className="text-xs text-text-tertiary">
                  Showing 1-30 of {filteredProblems.length} problems
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  percent,
}: {
  title: string;
  value: number;
  color: 'primary' | 'success' | 'warning' | 'info';
  percent?: number;
}) {
  const colorMap = {
    primary: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/20' },
    success: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20' },
    warning: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/20' },
    info: { bg: 'bg-info/15', text: 'text-info', border: 'border-info/20' },
  };

  const colors = colorMap[color];

  return (
    <div className={`${colors.bg} rounded-xl p-4 border ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-xs font-medium mb-1">{title}</p>
          <p className={`text-2xl font-semibold ${colors.text}`}>{value.toLocaleString()}</p>
        </div>
        {percent !== undefined && (
          <span className={`text-xs font-medium ${colors.text}`}>{percent}%</span>
        )}
      </div>
    </div>
  );
}
