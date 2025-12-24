/**
 * MemorySegment
 * 메모리 세그먼트 컴포넌트 (CODE, DATA, HEAP, STACK)
 */

import { motion } from 'framer-motion';
import type { SegmentType, MemoryBlock } from '../types';
import { SEGMENT_COLORS } from '../constants';

interface MemorySegmentProps {
  type: SegmentType;
  label: string;
  blocks?: MemoryBlock[];
  onClick?: () => void;
  className?: string;
}

export function MemorySegment({
  type,
  label,
  blocks = [],
  onClick,
  className = '',
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
      <div className="p-2 min-h-[32px]">
        {hasBlocks ? (
          <div className="space-y-1">
            {blocks.slice(0, 3).map((block) => (
              <div
                key={block.address}
                className="flex items-center gap-2 px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                <span className="font-mono text-muted-foreground w-10 text-right">
                  {block.address.slice(-4)}
                </span>
                <span className="font-medium truncate flex-1" style={{ color: colors.main }}>
                  {block.name}
                </span>
                <span className="text-muted-foreground truncate max-w-[50px]">
                  {block.value}
                </span>
              </div>
            ))}
            {blocks.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{blocks.length - 3} more
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-1">
            Empty
          </div>
        )}
      </div>
    </motion.div>
  );
}
