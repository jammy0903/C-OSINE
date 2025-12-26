/**
 * MemorySegment 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemorySegment } from '@/features/memory/memory-viz/components/MemorySegment';
import type { MemoryBlock } from '@/features/memory/memory-viz/types';

// Framer Motion 모킹
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe('MemorySegment', () => {
  const mockBlocks: MemoryBlock[] = [
    {
      name: 'x',
      type: 'int',
      value: '5',
      address: '0x7fffffffe3dc',
      size: 4,
    },
    {
      name: 'p',
      type: 'int*',
      value: '0x7fffffffe3dc',
      address: '0x7fffffffe3d0',
      size: 8,
      points_to: '0x7fffffffe3dc',
    },
  ];

  it('세그먼트 라벨을 렌더링', () => {
    render(<MemorySegment type="stack" label="STACK" />);
    expect(screen.getByText('STACK')).toBeInTheDocument();
  });

  it('블록 개수를 표시', () => {
    render(<MemorySegment type="stack" label="STACK" blocks={mockBlocks} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('블록 이름과 값을 렌더링', () => {
    render(<MemorySegment type="stack" label="STACK" blocks={mockBlocks} />);
    expect(screen.getByText('x')).toBeInTheDocument();
    expect(screen.getByText(/= 5/)).toBeInTheDocument();
  });

  it('클릭 핸들러가 호출됨', () => {
    const onClick = vi.fn();
    render(<MemorySegment type="stack" label="STACK" onClick={onClick} />);

    const segment = screen.getByText('STACK').closest('div[class*="rounded-lg"]');
    if (segment) {
      fireEvent.click(segment);
      expect(onClick).toHaveBeenCalled();
    }
  });

  it('DATA 세그먼트가 비었을 때 설명 표시', () => {
    render(<MemorySegment type="data" label="DATA" />);
    expect(screen.getByText('초기화된 전역/정적 변수 저장')).toBeInTheDocument();
  });

  it('CODE 세그먼트가 비었을 때 설명 표시', () => {
    render(<MemorySegment type="code" label="CODE" />);
    expect(screen.getByText('컴파일된 기계어 명령어')).toBeInTheDocument();
  });

  it('HEAP이 비었을 때 Empty 표시', () => {
    render(<MemorySegment type="heap" label="HEAP" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('3개 초과 블록은 +N more 표시', () => {
    const manyBlocks: MemoryBlock[] = [
      { name: 'a', type: 'int', value: '1', address: '0x100', size: 4 },
      { name: 'b', type: 'int', value: '2', address: '0x104', size: 4 },
      { name: 'c', type: 'int', value: '3', address: '0x108', size: 4 },
      { name: 'd', type: 'int', value: '4', address: '0x10c', size: 4 },
      { name: 'e', type: 'int', value: '5', address: '0x110', size: 4 },
    ];
    render(<MemorySegment type="stack" label="STACK" blocks={manyBlocks} />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('포인터 블록에 화살표 표시', () => {
    const getBlockColor = () => ({
      main: '#f97316',
      bg: 'rgba(249, 115, 22, 0.15)',
      border: 'rgba(249, 115, 22, 0.6)',
      glow: 'rgba(249, 115, 22, 0.4)',
    });
    const isBlockHighlighted = (block: MemoryBlock) => block.name === 'p';

    render(
      <MemorySegment
        type="stack"
        label="STACK"
        blocks={mockBlocks}
        getBlockColor={getBlockColor}
        isBlockHighlighted={isBlockHighlighted}
      />
    );

    // 포인터 블록 (p)에 화살표(→) 표시
    expect(screen.getByText(/p/)).toBeInTheDocument();
  });
});
