/**
 * ProcessMemoryView 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessMemoryView } from '@/features/memory/memory-viz/components/ProcessMemoryView';
import type { Step } from '@/features/memory/memory-viz/types';

// Framer Motion 모킹
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: React.HTMLProps<HTMLDivElement> & { whileHover?: unknown; whileTap?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Xarrow 모킹
vi.mock('react-xarrows', () => ({
  default: () => null,
}));

describe('ProcessMemoryView', () => {
  const mockStep: Step = {
    rip: '0x401130',
    rsp: '0x7fffffffe3d0',
    rbp: '0x7fffffffe3e0',
    line: 4,
    code: 'int x = 5;',
    stack: [
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
    ],
    heap: [
      {
        name: 'malloc(16)',
        type: 'void*',
        value: '16 bytes',
        address: '0x555555559260',
        size: 16,
      },
    ],
  };

  it('step이 없을 때 안내 메시지 표시', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={null} onViewChange={onViewChange} />);
    expect(screen.getByText('Click "Analyze" to visualize memory')).toBeInTheDocument();
  });

  it('STACK 세그먼트 렌더링', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('STACK')).toBeInTheDocument();
  });

  it('HEAP 세그먼트 렌더링', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('HEAP')).toBeInTheDocument();
  });

  it('DATA 세그먼트 렌더링', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('DATA')).toBeInTheDocument();
  });

  it('CODE 세그먼트 렌더링', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('CODE')).toBeInTheDocument();
  });

  it('스택 변수 개수 표시', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('2 vars')).toBeInTheDocument();
  });

  it('RSP/RBP 레지스터 표시', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('RSP')).toBeInTheDocument();
    expect(screen.getByText('RBP')).toBeInTheDocument();
  });

  it('High/Low Address 표시', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('High Address')).toBeInTheDocument();
    expect(screen.getByText('Low Address')).toBeInTheDocument();
  });

  it('STACK 클릭 시 onViewChange 호출', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);

    const stackSection = screen.getByText('STACK').closest('div[class*="rounded-lg"]');
    if (stackSection) {
      fireEvent.click(stackSection);
      expect(onViewChange).toHaveBeenCalledWith('stack-detail');
    }
  });

  it('변수 이름 렌더링', () => {
    const onViewChange = vi.fn();
    render(<ProcessMemoryView step={mockStep} onViewChange={onViewChange} />);
    expect(screen.getByText('x')).toBeInTheDocument();
    // 포인터 변수 'p'가 화살표와 함께 렌더링됨
    expect(screen.getAllByText(/^p$/).length).toBeGreaterThan(0);
  });
});
