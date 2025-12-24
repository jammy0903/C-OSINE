import { useState, useEffect } from 'react';
import { useStore } from '../stores/store';
import { loadProblems } from '../services/problems';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, Circle, AlertCircle } from 'lucide-react';
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

const ITEMS_PER_PAGE = 30;
const DIFFICULTIES = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum'] as const;

export function ProblemList() {
  const { selectProblem, solvedProblems, attemptedProblems } = useStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProblems = filteredProblems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDifficulty]);

  const getUserStatus = (problemId: string): 'solved' | 'attempted' | null => {
    if (solvedProblems.includes(problemId)) return 'solved';
    if (attemptedProblems.includes(problemId)) return 'attempted';
    return null;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <StatCard title="Total" value={stats.total} variant="primary" />
        <StatCard title="Solved" value={stats.solved} variant="success" percent={stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0} />
        <StatCard title="Attempted" value={stats.attempted} variant="warning" />
        <StatCard title="Remaining" value={stats.remaining} variant="info" />
      </div>

      {/* Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium">Problems</h3>
            <Badge variant="secondary" className="text-xs">
              {filteredProblems.length} items
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Difficulty Filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
              {DIFFICULTIES.map((diff) => (
                <Button
                  key={diff}
                  variant={(diff === 'All' && !selectedDifficulty) || selectedDifficulty === diff.toLowerCase() ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs whitespace-nowrap"
                  onClick={() => setSelectedDifficulty(diff === 'All' ? null : diff.toLowerCase())}
                >
                  {diff}
                </Button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-44 pl-9 h-8"
                aria-label="Search problems"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-16">No.</TableHead>
                    <TableHead className="w-48">Title</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-24">Level</TableHead>
                    <TableHead className="w-20 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProblems.map((problem) => {
                    const status = getUserStatus(problem.id);
                    const diffInfo = getDifficultyInfo(problem.difficulty);
                    return (
                      <TableRow
                        key={problem.id}
                        onClick={() => selectProblem(problem)}
                        className="cursor-pointer group"
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          {problem.number}
                        </TableCell>
                        <TableCell className="font-medium group-hover:text-primary transition-colors">
                          {problem.title}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: diffInfo.bg, color: diffInfo.color }}
                          >
                            {diffInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {status === 'solved' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : status === 'attempted' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-500">
                              <AlertCircle className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-border text-muted-foreground">
                              <Circle className="h-3 w-3" />
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredProblems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No problems found
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProblems.length)} of {filteredProblems.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      aria-label="Go to first page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>

                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'ghost'}
                            size="icon"
                            className="h-8 w-8 text-xs"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Go to next page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      aria-label="Go to last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
