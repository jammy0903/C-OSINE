/**
 * ProblemList Component
 * 문제 목록 테이블 + 필터 + 페이지네이션
 */

import { useStore } from '../../stores/store';
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
import { useProblems } from './hooks/useProblems';
import { getTagColor, getDifficultyInfo, DIFFICULTIES } from './constants';

export function ProblemList() {
  const { selectProblem } = useStore();
  const {
    problems,
    filteredCount,
    stats,
    loading,
    user,
    search,
    setSearch,
    selectedDifficulty,
    setSelectedDifficulty,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    itemsPerPage,
    getUserStatus,
  } = useProblems();

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Welcome Banner (when not logged in) */}
      {!user && (
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 rounded-xl p-4 border border-primary/20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🖥️</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">Welcome to C-ode to you!</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI 튜터와 함께 C 프로그래밍을 배워보세요. 로그인하면 진행 상황을 저장할 수 있어요.
              </p>
            </div>
          </div>
        </div>
      )}

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
              {filteredCount} items
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
                  {problems.map((problem) => {
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
                            {problem.tags.map((tag, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getTagColor(tag, i)}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${diffInfo.className}`}>
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

              {filteredCount === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No problems found
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  itemsPerPage={itemsPerPage}
                  filteredCount={filteredCount}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 페이지네이션 컴포넌트
function Pagination({
  currentPage,
  totalPages,
  startIndex,
  itemsPerPage,
  filteredCount,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="px-5 py-3 border-t border-border flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCount)} of {filteredCount}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                onClick={() => onPageChange(pageNum)}
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
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
