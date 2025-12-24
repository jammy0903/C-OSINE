/**
 * StackDetailView
 * 스택 메모리 상세 뷰 - 스택 프레임 시각화
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryBlock } from '../types';
import { REGISTER_COLORS, ANIMATION_DURATION, ANIMATION_COLORS } from '../constants';
import { formatAddress, isPointerType, sortBlocksByAddress } from '../utils';

interface StackDetailViewProps {
  blocks: MemoryBlock[];
  rsp: string;
  rbp: string;
  onClose?: () => void;
  changedBlocks?: string[];
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export function StackDetailView({
  blocks,
  rsp,
  rbp,
  onClose,
  changedBlocks = [],
  animationSpeed = 'normal',
}: StackDetailViewProps) {
  const duration = ANIMATION_DURATION[animationSpeed] / 1000;
  const sortedBlocks = sortBlocksByAddress(blocks, true); // 높은 주소 -> 낮은 주소

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <h3 className="text-sm font-medium text-text">Stack Detail</h3>
          <span className="text-xs text-muted-foreground">
            {blocks.length} variables
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close stack detail view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Stack Visualization */}
      <div className="flex-1 overflow-auto p-4">
        {/* Column Headers */}
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border mb-2">
          <div className="w-20">Address</div>
          <div className="w-24">Name</div>
          <div className="w-16">Type</div>
          <div className="flex-1">Value</div>
          <div className="w-12">Ptr</div>
        </div>

        {/* Stack Blocks */}
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {sortedBlocks.map((block, index) => {
              const isRspHere = block.address === rsp;
              const isRbpHere = block.address === rbp;
              const isChanged = changedBlocks.includes(block.address);
              const isPointer = isPointerType(block.type);

              return (
                <motion.div
                  key={block.address}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration, delay: index * 0.02 }}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-lg
                    border transition-colors
                    ${isChanged ? 'border-primary bg-primary/10' : 'border-border bg-background'}
                    ${isPointer ? 'border-l-4 border-l-info' : ''}
                  `}
                >
                  {/* RSP/RBP Indicator */}
                  {(isRspHere || isRbpHere) && (
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                      {isRspHere && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1"
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: REGISTER_COLORS.rsp }}
                          >
                            RSP
                          </span>
                          <div
                            className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent"
                            style={{ borderLeftColor: REGISTER_COLORS.rsp }}
                          />
                        </motion.div>
                      )}
                      {isRbpHere && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1"
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: REGISTER_COLORS.rbp }}
                          >
                            RBP
                          </span>
                          <div
                            className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent"
                            style={{ borderLeftColor: REGISTER_COLORS.rbp }}
                          />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  <div className="w-20 font-mono text-xs text-muted-foreground">
                    {formatAddress(block.address, true)}
                  </div>

                  {/* Name */}
                  <div className="w-24 font-mono text-sm text-foregroundfont-medium truncate">
                    {block.name}
                  </div>

                  {/* Type */}
                  <div className="w-16 text-xs text-muted-foreground truncate">
                    {block.type}
                  </div>

                  {/* Value */}
                  <motion.div
                    key={block.value}
                    initial={isChanged ? { scale: 1.1, color: ANIMATION_COLORS.highlight } : {}}
                    animate={{ scale: 1, color: ANIMATION_COLORS.text }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 font-mono text-sm text-foreground"
                  >
                    {isPointer && block.points_to ? (
                      <span className="text-info">
                        → {formatAddress(block.points_to, true)}
                      </span>
                    ) : (
                      block.value
                    )}
                  </motion.div>

                  {/* Pointer Indicator */}
                  <div className="w-12 flex justify-center">
                    {isPointer && (
                      <div className="w-2 h-2 rounded-full bg-info" title="Pointer" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {blocks.length === 0 && (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="text-center">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-sm">Stack is empty</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Stack Growth Direction */}
      <div className="px-4 py-2 border-t border-border bg-backgroundflex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Higher Address</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <span>Lower Address (Stack grows down)</span>
      </div>
    </motion.div>
  );
}
