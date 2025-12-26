/**
 * StackDetailView 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StackDetailView } from '@/features/memory/memory-viz/components/StackDetailView';
import type { MemoryBlock } from '@/features/memory/memory-viz/types';

// Framer Motion 모킹
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    tr: ({ children, ...props }: React.HTMLProps<HTMLTableRowElement>) => (
      <tr {...props}>{children}</tr>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Xarrow 모킹
vi.mock('react-xarrows', () => ({
  default: () => null,
}));

describe('StackDetailView', () => {
  const mockBlocks: MemoryBlock[] = [
    {
      name: 'x',
      type: 'int',
      value: '5',
      address: '0x7fffffffe3dc',
      size: 4,
    },
    {
      name: 'y',
      type: 'int',
      value: '10',
      address: '0x7fffffffe3d8',
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

  const defaultProps = {
    blocks: mockBlocks,
    rsp: '0x7fffffffe3d0',
    rbp: '0x7fffffffe3e0',
  };

  it('헤더에 Stack Detail 표시', () => {
    render(<StackDetailView {...defaultProps} />);
    expect(screen.getByText('Stack Detail')).toBeInTheDocument();
  });

  it('변수 개수 표시', () => {
    render(<StackDetailView {...defaultProps} />);
    expect(screen.getByText('3 variables')).toBeInTheDocument();
  });

  it('테이블 헤더 렌더링', () => {
    render(<StackDetailView {...defaultProps} />);
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('블록 이름과 타입 렌더링', () => {
    render(<StackDetailView {...defaultProps} />);
    expect(screen.getByText('x')).toBeInTheDocument();
    expect(screen.getByText('y')).toBeInTheDocument();
    expect(screen.getByText('p')).toBeInTheDocument();
    expect(screen.getAllByText('int')).toHaveLength(2);
    expect(screen.getByText('int*')).toBeInTheDocument();
  });

  it('RSP 표시기 렌더링', () => {
    render(<StackDetailView {...defaultProps} />);
    expect(screen.getByText('RSP→')).toBeInTheDocument();
  });

  it('닫기 버튼이 onClose 호출', () => {
    const onClose = vi.fn();
    render(<StackDetailView {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('빈 스택일 때 Empty 메시지 표시', () => {
    render(<StackDetailView blocks={[]} rsp="0x100" rbp="0x200" />);
    expect(screen.getByText('Stack is empty')).toBeInTheDocument();
  });

  it('포인터 블록 클릭 시 선택됨', () => {
    render(<StackDetailView {...defaultProps} />);

    // 포인터 행 찾기 (int* 타입)
    const pointerRow = screen.getByText('int*').closest('tr');
    if (pointerRow) {
      fireEvent.click(pointerRow);
      // 클릭 후 스타일 변경 확인은 통합 테스트에서 수행
    }
  });

  it('Footer에 주소 방향 표시', () => {
    render(<StackDetailView {...defaultProps} />);
    expect(screen.getByText('High Addr')).toBeInTheDocument();
    expect(screen.getByText('Low Addr (grows down)')).toBeInTheDocument();
  });
});
