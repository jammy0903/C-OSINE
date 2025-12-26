/**
 * Memory Viz Constants 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  SEGMENT_COLORS,
  POINTER_PALETTE,
  getPointerColor,
  getRoleLabel,
  ANIMATION_DURATION,
  REGISTER_COLORS,
} from '@/features/memory/memory-viz/constants';

describe('SEGMENT_COLORS', () => {
  it('모든 세그먼트 색상이 정의됨', () => {
    expect(SEGMENT_COLORS.stack).toBeDefined();
    expect(SEGMENT_COLORS.heap).toBeDefined();
    expect(SEGMENT_COLORS.data).toBeDefined();
    expect(SEGMENT_COLORS.code).toBeDefined();
  });

  it('각 세그먼트는 main, bg, headerBg, border 색상을 가짐', () => {
    const segments = ['stack', 'heap', 'data', 'code'] as const;
    segments.forEach((seg) => {
      expect(SEGMENT_COLORS[seg].main).toBeDefined();
      expect(SEGMENT_COLORS[seg].bg).toBeDefined();
      expect(SEGMENT_COLORS[seg].headerBg).toBeDefined();
      expect(SEGMENT_COLORS[seg].border).toBeDefined();
    });
  });
});

describe('POINTER_PALETTE', () => {
  it('최소 6개의 색상 팔레트', () => {
    expect(POINTER_PALETTE.length).toBeGreaterThanOrEqual(6);
  });

  it('각 색상은 main, bg, border, glow 속성을 가짐', () => {
    POINTER_PALETTE.forEach((color) => {
      expect(color.main).toBeDefined();
      expect(color.bg).toBeDefined();
      expect(color.border).toBeDefined();
      expect(color.glow).toBeDefined();
    });
  });
});

describe('getPointerColor', () => {
  it('인덱스에 따라 색상 반환', () => {
    expect(getPointerColor(0)).toBe(POINTER_PALETTE[0]);
    expect(getPointerColor(1)).toBe(POINTER_PALETTE[1]);
  });

  it('인덱스가 팔레트 길이를 초과하면 순환', () => {
    const len = POINTER_PALETTE.length;
    expect(getPointerColor(len)).toBe(POINTER_PALETTE[0]);
    expect(getPointerColor(len + 1)).toBe(POINTER_PALETTE[1]);
  });
});

describe('getRoleLabel', () => {
  it('힙 세그먼트는 동적 할당 반환', () => {
    expect(getRoleLabel('int', 'heap')).toBe('동적 할당');
    expect(getRoleLabel('char*', 'heap')).toBe('동적 할당');
  });

  it('데이터 세그먼트는 전역 변수 반환', () => {
    expect(getRoleLabel('int', 'data')).toBe('전역 변수');
  });

  it('코드 세그먼트는 프로그램 반환', () => {
    expect(getRoleLabel('int', 'code')).toBe('프로그램');
  });

  it('스택 배열은 배열 반환', () => {
    expect(getRoleLabel('int[10]', 'stack')).toBe('배열');
    expect(getRoleLabel('char[]', 'stack')).toBe('배열');
  });

  it('스택 포인터는 포인터 반환', () => {
    expect(getRoleLabel('int*', 'stack')).toBe('포인터');
    expect(getRoleLabel('char**', 'stack')).toBe('포인터');
  });

  it('스택 구조체는 구조체 반환', () => {
    expect(getRoleLabel('struct foo', 'stack')).toBe('구조체');
  });

  it('일반 스택 변수는 변수 반환', () => {
    expect(getRoleLabel('int', 'stack')).toBe('변수');
    expect(getRoleLabel('char', 'stack')).toBe('변수');
  });
});

describe('ANIMATION_DURATION', () => {
  it('세 가지 속도가 정의됨', () => {
    expect(ANIMATION_DURATION.slow).toBeDefined();
    expect(ANIMATION_DURATION.normal).toBeDefined();
    expect(ANIMATION_DURATION.fast).toBeDefined();
  });

  it('slow > normal > fast 순서', () => {
    expect(ANIMATION_DURATION.slow).toBeGreaterThan(ANIMATION_DURATION.normal);
    expect(ANIMATION_DURATION.normal).toBeGreaterThan(ANIMATION_DURATION.fast);
  });
});

describe('REGISTER_COLORS', () => {
  it('RSP, RBP, RIP 색상이 정의됨', () => {
    expect(REGISTER_COLORS.rsp).toBeDefined();
    expect(REGISTER_COLORS.rbp).toBeDefined();
    expect(REGISTER_COLORS.rip).toBeDefined();
  });

  it('모든 색상이 hex 형식', () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    expect(REGISTER_COLORS.rsp).toMatch(hexPattern);
    expect(REGISTER_COLORS.rbp).toMatch(hexPattern);
    expect(REGISTER_COLORS.rip).toMatch(hexPattern);
  });
});
