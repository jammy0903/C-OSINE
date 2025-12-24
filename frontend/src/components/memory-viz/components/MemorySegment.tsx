/**
 * MemorySegment
 * 재사용 가능한 메모리 세그먼트 컴포넌트 (CODE, DATA, HEAP, STACK)
 */

import { motion } from 'framer-motion';
import type { SegmentType, MemoryBlock } from '../types';
import { SEGMENT_COLORS } from '../constants';

interface MemorySegmentProps {
  type: SegmentType;
  label: string;
  blocks?: MemoryBlock[];
  isExpanded?: boolean;
  onClick?: () => void;
  showPointer?: 'rsp' | 'rbp' | null;
  className?: string;
}

export function MemorySegment({
  type,
  label,
  blocks = [],
  isExpanded = false,
  onClick,
  showPointer,
  className = '',
}: MemorySegmentProps) {
  const colors = SEGMENT_COLORS[type];
  const hasBlocks = blocks.length > 0;

  return (
    <motion.div
      layout
      className={`
        relative border rounded-lg overflow-hidden cursor-pointer
        transition-colors duration-200
        ${colors.bg} ${colors.border}
        ${isExpanded ? 'flex-1' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.01 : 1 }}
      whileTap={{ scale: onClick ? 0.99 : 1 }}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b ${colors.border} bg-black/20`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
            {label}
          </span>
          {hasBlocks && (
            <span className="text-xs text-muted-foreground">
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-2 min-h-[40px]">
        {hasBlocks ? (
          <div className="space-y-1">
            {blocks.slice(0, isExpanded ? undefined : 3).map((block) => (
              <SegmentBlock key={block.address} block={block} type={type} />
            ))}
            {!isExpanded && blocks.length > 3 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                +{blocks.length - 3} more...
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">
            {type === 'heap' ? 'No allocations' : 'Empty'}
          </div>
        )}
      </div>

      {/* Pointer Indicator */}
      {showPointer && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`
            absolute right-0 top-1/2 -translate-y-1/2
            flex items-center gap-1 pr-2
          `}
        >
          <div
            className="w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent"
            style={{
              borderRightColor: showPointer === 'rsp' ? '#ef4444' : '#22c55e',
            }}
          />
          <span
            className="text-xs font-bold"
            style={{ color: showPointer === 'rsp' ? '#ef4444' : '#22c55e' }}
          >
            {showPointer.toUpperCase()}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

interface SegmentBlockProps {
  block: MemoryBlock;
  type: SegmentType;
}

function SegmentBlock({ block, type }: SegmentBlockProps) {
  const isPointer = block.type.includes('*');
  const colors = SEGMENT_COLORS[type];

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1 rounded text-xs
        bg-black/20 border border-white/5
        ${isPointer ? 'border-info/50' : ''}
      `}
    >
      <span className="font-mono text-muted-foreground w-12 truncate text-right">
        {block.address.slice(-4)}
      </span>
      <span className={`font-medium ${colors.text} truncate flex-1`}>
        {block.name}
      </span>
      <span className="text-muted-foreground truncate max-w-[60px]">
        {isPointer && block.points_to ? `→${block.points_to.slice(-4)}` : block.value}
      </span>
    </div>
  );
}
