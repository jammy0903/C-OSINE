/**
 * Memory Visualization Module
 * 메모리 시각화 컴포넌트 내보내기
 */

export { ProcessMemoryVisualization } from './ProcessMemoryVisualization';

// Components
export { ProcessMemoryView } from './components/ProcessMemoryView';
export { StackDetailView } from './components/StackDetailView';
export { HeapDetailView } from './components/HeapDetailView';
export { MemorySegment } from './components/MemorySegment';

// Hooks
export { useStepTransition } from './hooks/useStepTransition';

// Types
export type {
  Step,
  MemoryBlock,
  ViewMode,
  AnimationSpeed,
  CPURegisters,
  SegmentType,
  MemorySegment as MemorySegmentType,
  StackFrame,
  AnimationState,
  PointerConnection,
} from './types';

// Utils
export {
  formatAddress,
  parseAddress,
  toHexAddress,
  getChangedBlocks,
  getNewBlocks,
  getRemovedBlocks,
  getPointerConnections,
  bytesToHex,
  getRegisterDelta,
  isPointerType,
  isArrayType,
  sortBlocksByAddress,
} from './utils';

// Constants
export {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  SEGMENT_COLORS,
  MEMORY_ADDRESSES,
  REGISTER_COLORS,
  POINTER_COLORS,
  BLOCK_STATES,
  LAYOUT,
  DEFAULT_CODE,
} from './constants';
