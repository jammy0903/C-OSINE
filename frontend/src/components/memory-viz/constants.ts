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

// 메모리 세그먼트 색상
export const SEGMENT_COLORS = {
  code: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-400',
    fill: '#3b82f6',
  },
  data: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-400',
    fill: '#f59e0b',
  },
  heap: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    fill: '#10b981',
  },
  stack: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    text: 'text-purple-400',
    fill: '#8b5cf6',
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
  rsp: '#ef4444', // red
  rbp: '#22c55e', // green
  rip: '#3b82f6', // blue
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
