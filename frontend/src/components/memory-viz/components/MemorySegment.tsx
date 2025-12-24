/**
 * MemorySegment
 * 메모리 세그먼트 컴포넌트 (CODE, DATA, HEAP, STACK)
 * 포인터 하이라이트 지원
 */

import { motion } from 'framer-motion';
import type { SegmentType, MemoryBlock } from '../types';
import { SEGMENT_COLORS, POINTER_COLORS } from '../constants';

// 펄스 애니메이션 variants
const pulseVariants = {
  idle: {},
  pulse: {
    boxShadow: [
      `0 0 0 0 ${POINTER_COLORS.glow}`,
      `0 0 0 6px transparent`,
    ],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeOut' as const,
    },
  },
};

interface MemorySegmentProps {
  type: SegmentType;
  label: string;
  blocks?: MemoryBlock[];
  onClick?: () => void;
  className?: string;
  // 포인터 하이라이트 props
  onPointerClick?: (e: React.MouseEvent, block: MemoryBlock) => void;
  isBlockHighlighted?: (block: MemoryBlock) => boolean;
}

export function MemorySegment({
  type,
  label,
  blocks = [],
  onClick,
  className = '',
  onPointerClick,
  isBlockHighlighted,
}: MemorySegmentProps) {
  const colors = SEGMENT_COLORS[type];
  const hasBlocks = blocks.length > 0;

  return (
    <motion.div
      className={`relative rounded-lg overflow-hidden cursor-pointer ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {/* Header */}
      <div
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: colors.headerBg }}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: colors.main }}
        >
          {label}
        </span>
        {hasBlocks && (
          <span className="text-xs text-muted-foreground">
            {blocks.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 min-h-[60px]">
        {hasBlocks ? (
          <div className="space-y-1.5">
            {blocks.slice(0, 3).map((block) => {
              const hasPointer = !!block.points_to;
              const highlighted = isBlockHighlighted?.(block) ?? false;

              return (
                <motion.div
                  key={block.address}
                  className="flex items-center gap-2 px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: highlighted ? POINTER_COLORS.bg : 'rgba(0,0,0,0.2)',
                    border: highlighted ? `2px solid ${POINTER_COLORS.border}` : '2px solid transparent',
                    cursor: hasPointer ? 'pointer' : 'default',
                  }}
                  variants={pulseVariants}
                  animate={highlighted ? 'pulse' : 'idle'}
                  onClick={(e) => {
                    if (hasPointer && onPointerClick) {
                      onPointerClick(e, block);
                    }
                  }}
                >
                  <span className="font-mono text-muted-foreground w-10 text-right">
                    {block.address.slice(-4)}
                  </span>
                  <span className="font-medium truncate flex-1" style={{ color: colors.main }}>
                    {block.name}
                  </span>
                  <span className="text-muted-foreground truncate max-w-[50px] flex items-center gap-1">
                    {hasPointer && (
                      <span style={{ color: POINTER_COLORS.main }}>→</span>
                    )}
                    {block.value}
                  </span>
                </motion.div>
              );
            })}
            {blocks.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{blocks.length - 3} more
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">
            Empty
          </div>
        )}
      </div>
    </motion.div>
  );
}
