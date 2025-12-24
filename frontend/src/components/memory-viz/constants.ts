/**
 * Memory Visualization Constants
 * 애니메이션 타이밍, 색상, 레이아웃 상수
 */

// 애니메이션 타이밍 (ms)
export const ANIMATION_DURATION = {
  slow: 600,
  normal: 300,
  fast: 150,
} as const;

// 애니메이션 이징
export const ANIMATION_EASING = {
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  smooth: { type: 'tween', ease: 'easeInOut' },
  bounce: { type: 'spring', stiffness: 400, damping: 25 },
} as const;

// 메모리 세그먼트 색상 (인라인 스타일용 hex)
export const SEGMENT_COLORS = {
  stack: {
    main: '#a855f7',      // purple-500
    bg: 'rgba(168, 85, 247, 0.1)',
    headerBg: 'rgba(168, 85, 247, 0.25)',
    border: 'rgba(168, 85, 247, 0.4)',
  },
  heap: {
    main: '#22c55e',      // green-500
    bg: 'rgba(34, 197, 94, 0.1)',
    headerBg: 'rgba(34, 197, 94, 0.25)',
    border: 'rgba(34, 197, 94, 0.4)',
  },
  data: {
    main: '#f59e0b',      // amber-500
    bg: 'rgba(245, 158, 11, 0.1)',
    headerBg: 'rgba(245, 158, 11, 0.25)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  code: {
    main: '#3b82f6',      // blue-500
    bg: 'rgba(59, 130, 246, 0.1)',
    headerBg: 'rgba(59, 130, 246, 0.25)',
    border: 'rgba(59, 130, 246, 0.4)',
  },
} as const;

// 메모리 주소 범위 (64비트 가상)
export const MEMORY_ADDRESSES = {
  stackBase: 0x7fffffffde00,
  heapBase: 0x555555559000,
  codeBase: 0x400000,
  dataBase: 0x600000,
} as const;

// 레지스터 색상
export const REGISTER_COLORS = {
  rsp: '#ef4444', // red-500
  rbp: '#22c55e', // green-500
  rip: '#3b82f6', // blue-500
} as const;

// 애니메이션 색상 (Framer Motion용)
export const ANIMATION_COLORS = {
  highlight: '#6366f1', // primary (indigo-500)
  text: '#ffffff',      // foreground (dark mode)
} as const;

// 포인터 연결 색상 (디자인 doc: --pointer-arrow)
export const POINTER_COLORS = {
  main: '#f97316',      // orange-500
  bg: 'rgba(249, 115, 22, 0.15)',
  border: 'rgba(249, 115, 22, 0.6)',
  glow: 'rgba(249, 115, 22, 0.4)',
} as const;

// 블록 상태 색상
export const BLOCK_STATES = {
  normal: 'border bg-muted',
  highlighted: 'border-primary bg-primary/20',
  new: 'border-emerald-500 bg-emerald-500/20',
  freed: 'border-destructive bg-destructive/20 opacity-50',
  pointer: 'border-cyan-500 border-2',
} as const;

// 레이아웃 크기
export const LAYOUT = {
  cpuPanelWidth: 180,
  segmentMinHeight: 60,
  blockHeight: 40,
  addressWidth: 100,
  valueWidth: 120,
} as const;

// 기본 코드 예시
export const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int x = 5;
    int y = 10;
    int *p = &x;
    *p = 20;
    printf("%d\\n", x);
    return 0;
}`;
