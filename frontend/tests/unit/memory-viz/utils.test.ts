/**
 * Memory Viz Utils 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  formatAddress,
  parseAddress,
  getChangedBlocks,
  isPointerType,
  sortBlocksByAddress,
  toBlockId,
} from '@/features/memory/memory-viz/utils';
import type { MemoryBlock, Step } from '@/features/memory/memory-viz/types';

describe('formatAddress', () => {
  it('짧은 형식으로 변환', () => {
    expect(formatAddress('0x7fffffffde00')).toBe('...de00');
    expect(formatAddress('0x7fffffffde00', true)).toBe('...de00');
  });

  it('전체 형식으로 변환', () => {
    expect(formatAddress('0x7fffffffde00', false)).toBe('0x7fffffffde00');
  });

  it('짧은 주소는 그대로 유지', () => {
    expect(formatAddress('0xde00')).toBe('0xde00');
  });

  it('빈 문자열 처리', () => {
    expect(formatAddress('')).toBe('');
  });
});

describe('parseAddress', () => {
  it('16진수 주소를 숫자로 변환', () => {
    expect(parseAddress('0x100')).toBe(256);
    expect(parseAddress('0xffff')).toBe(65535);
  });

  it('0x 접두사 없이도 동작', () => {
    expect(parseAddress('ff')).toBe(255);
  });

  it('빈 문자열은 0 반환', () => {
    expect(parseAddress('')).toBe(0);
  });
});

describe('isPointerType', () => {
  it('포인터 타입 감지', () => {
    expect(isPointerType('int*')).toBe(true);
    expect(isPointerType('char*')).toBe(true);
    expect(isPointerType('int**')).toBe(true);
  });

  it('비포인터 타입 감지', () => {
    expect(isPointerType('int')).toBe(false);
    expect(isPointerType('char')).toBe(false);
    expect(isPointerType('struct foo')).toBe(false);
  });
});

describe('toBlockId', () => {
  it('주소를 DOM ID로 변환', () => {
    expect(toBlockId('0x7fffffffde00')).toBe('mem-7fffffffde00');
  });

  it('0x 접두사 없이도 동작', () => {
    expect(toBlockId('de00')).toBe('mem-de00');
  });
});

describe('sortBlocksByAddress', () => {
  const blocks: MemoryBlock[] = [
    { name: 'a', type: 'int', value: '1', address: '0x100', size: 4 },
    { name: 'b', type: 'int', value: '2', address: '0x300', size: 4 },
    { name: 'c', type: 'int', value: '3', address: '0x200', size: 4 },
  ];

  it('내림차순 정렬 (기본값)', () => {
    const sorted = sortBlocksByAddress(blocks);
    expect(sorted[0].address).toBe('0x300');
    expect(sorted[1].address).toBe('0x200');
    expect(sorted[2].address).toBe('0x100');
  });

  it('오름차순 정렬', () => {
    const sorted = sortBlocksByAddress(blocks, false);
    expect(sorted[0].address).toBe('0x100');
    expect(sorted[1].address).toBe('0x200');
    expect(sorted[2].address).toBe('0x300');
  });

  it('원본 배열을 수정하지 않음', () => {
    const original = [...blocks];
    sortBlocksByAddress(blocks);
    expect(blocks).toEqual(original);
  });
});

describe('getChangedBlocks', () => {
  const step1: Step = {
    rip: '0x100',
    rsp: '0x200',
    rbp: '0x300',
    line: 1,
    code: '',
    stack: [
      { name: 'x', type: 'int', value: '5', address: '0x100', size: 4 },
    ],
    heap: [],
  };

  const step2: Step = {
    rip: '0x104',
    rsp: '0x200',
    rbp: '0x300',
    line: 2,
    code: '',
    stack: [
      { name: 'x', type: 'int', value: '10', address: '0x100', size: 4 }, // 값 변경
      { name: 'y', type: 'int', value: '20', address: '0x104', size: 4 }, // 새 블록
    ],
    heap: [],
  };

  it('첫 스텝은 모든 블록이 변경됨', () => {
    const changed = getChangedBlocks(null, step1);
    expect(changed).toContain('0x100');
    expect(changed).toHaveLength(1);
  });

  it('값이 변경된 블록 감지', () => {
    const changed = getChangedBlocks(step1, step2);
    expect(changed).toContain('0x100'); // 값 변경
  });

  it('새로 추가된 블록 감지', () => {
    const changed = getChangedBlocks(step1, step2);
    expect(changed).toContain('0x104'); // 새 블록
  });
});

