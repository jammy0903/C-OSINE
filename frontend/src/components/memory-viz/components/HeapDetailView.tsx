/**
 * HeapDetailView
 * 힙 메모리 상세 뷰 - malloc 블록 시각화
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryBlock } from '../types';
import { ANIMATION_DURATION } from '../constants';
import { formatAddress, sortBlocksByAddress } from '../utils';

interface HeapDetailViewProps {
  blocks: MemoryBlock[];
  onClose?: () => void;
  changedBlocks?: string[];
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export function HeapDetailView({
  blocks,
  onClose,
  changedBlocks = [],
  animationSpeed = 'normal',
}: HeapDetailViewProps) {
  const duration = ANIMATION_DURATION[animationSpeed] / 1000;
  const sortedBlocks = sortBlocksByAddress(blocks, false); // 낮은 주소 -> 높은 주소

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-medium text-foreground">Heap Detail</h3>
          <span className="text-xs text-muted-foreground">
            {blocks.length} allocations
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close heap detail view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Heap Visualization */}
      <div className="flex-1 overflow-auto p-4">
        {blocks.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {sortedBlocks.map((block, index) => {
                const isChanged = changedBlocks.includes(block.address);
                const isFreed = block.value === 'freed';

                return (
                  <motion.div
                    key={block.address}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: isFreed ? 0.5 : 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration, delay: index * 0.05 }}
                    className={`
                      relative rounded-lg border-2 overflow-hidden
                      ${isFreed
                        ? 'border-dashed border-danger/50 bg-danger/5'
                        : isChanged
                          ? 'border-primary bg-primary/10'
                          : 'border-emerald-500/50 bg-emerald-500/10'
                      }
                    `}
                  >
                    {/* Block Header */}
                    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatAddress(block.address, false)}
                        </span>
                        <span className="font-mono text-sm font-medium text-emerald-400">
                          {block.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {block.size} bytes
                        </span>
                        {isFreed && (
                          <span className="px-2 py-0.5 text-xs rounded bg-danger/20 text-danger">
                            FREED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Block Content */}
                    <div className="px-3 py-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Type</div>
                          <div className="font-mono text-sm text-foreground">{block.type}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Value</div>
                          <div className="font-mono text-sm text-foreground">{block.value}</div>
                        </div>
                      </div>

                      {/* Memory Bytes Visualization */}
                      {block.bytes && block.bytes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-muted-foreground mb-2">Memory Content</div>
                          <div className="flex flex-wrap gap-1">
                            {block.bytes.slice(0, 16).map((byte, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 flex items-center justify-center rounded bg-black/30 font-mono text-xs text-muted-foreground"
                              >
                                {byte.toString(16).padStart(2, '0').toUpperCase()}
                              </div>
                            ))}
                            {block.bytes.length > 16 && (
                              <div className="w-6 h-6 flex items-center justify-center text-muted-foreground text-xs">
                                ...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Size Bar */}
                    <div className="h-1 bg-emerald-500/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-full ${isFreed ? 'bg-danger/50' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="text-center">
              <div className="text-3xl mb-2">🗄️</div>
              <div className="text-sm">No heap allocations</div>
              <div className="text-xs mt-1">Use malloc() to allocate memory</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Heap Growth Direction */}
      <div className="px-4 py-2 border-t border-border bg-background flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Lower Address</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <span>Higher Address (Heap grows up)</span>
      </div>
    </motion.div>
  );
}
