/**
 * StackDetailView
 * 스택 메모리 상세 뷰 - 스택 프레임 시각화
 * 포인터 탭 시 연결된 블록 하이라이트
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryBlock } from '../types';
import { REGISTER_COLORS, ANIMATION_DURATION, POINTER_COLORS } from '../constants';
import { formatAddress, isPointerType, sortBlocksByAddress } from '../utils';

interface StackDetailViewProps {
  blocks: MemoryBlock[];
  rsp: string;
  rbp: string;
  onClose?: () => void;
  changedBlocks?: string[];
  animationSpeed?: 'slow' | 'normal' | 'fast';
  // 외부에서 힙 블록 전달 (cross-panel 하이라이트용)
  heapBlocks?: MemoryBlock[];
}


export function StackDetailView({
  blocks,
  rsp,
  rbp,
  onClose,
  changedBlocks = [],
  animationSpeed = 'normal',
  heapBlocks = [],
}: StackDetailViewProps) {
  const duration = ANIMATION_DURATION[animationSpeed] / 1000;
  const sortedBlocks = sortBlocksByAddress(blocks, true);

  // 선택된 포인터 (로컬 상태)
  const [selectedPointer, setSelectedPointer] = useState<string | null>(null);

  // 모든 블록 (스택 + 힙)
  const allBlocks = useMemo(() => [...blocks, ...heapBlocks], [blocks, heapBlocks]);

  // 블록이 하이라이트 대상인지 확인
  const isHighlighted = (block: MemoryBlock) => {
    if (!selectedPointer) return false;
    const selectedBlock = allBlocks.find((b) => b.address === selectedPointer);
    return block.address === selectedPointer || block.address === selectedBlock?.points_to;
  };

  // 포인터 블록 클릭 핸들러
  const handlePointerClick = (block: MemoryBlock) => {
    if (block.points_to) {
      setSelectedPointer((prev) => (prev === block.address ? null : block.address));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden"
      onClick={() => setSelectedPointer(null)}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <h3 className="text-sm font-medium text-foreground">Stack Detail</h3>
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

      {/* Stack Visualization - Excel Style */}
      <div className="flex-1 overflow-auto p-3">
        {/* Excel-like Table */}
        <table className="w-full border-collapse text-xs">
          {/* Header */}
          <thead>
            <tr style={{ backgroundColor: '#e8d5f0' }}>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800 w-12"></th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Address</th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Name</th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Type</th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Value</th>
            </tr>
          </thead>
          {/* Body */}
          <tbody>
            <AnimatePresence mode="popLayout">
              {sortedBlocks.map((block, index) => {
                const isRspHere = block.address === rsp;
                const isRbpHere = block.address === rbp;
                const isChanged = changedBlocks.includes(block.address);
                const isPointer = isPointerType(block.type);
                const highlighted = isHighlighted(block);

                // 행 배경색 결정
                let rowBg = index % 2 === 0 ? '#faf5ff' : '#f3e8ff';
                if (isChanged && !highlighted) rowBg = '#ede9fe';
                if (highlighted) rowBg = POINTER_COLORS.bg;

                return (
                  <motion.tr
                    key={block.address}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration, delay: index * 0.02 }}
                    style={{ backgroundColor: rowBg }}
                    className={`${isPointer ? 'cursor-pointer hover:bg-purple-100' : ''}`}
                    onClick={(e) => {
                      if (isPointer) {
                        e.stopPropagation();
                        handlePointerClick(block);
                      }
                    }}
                  >
                    {/* RSP/RBP Indicator */}
                    <td className="border border-purple-200 px-2 py-2 text-right font-mono">
                      {isRbpHere && (
                        <span className="text-xs font-bold" style={{ color: REGISTER_COLORS.rbp }}>RBP→</span>
                      )}
                      {isRspHere && (
                        <span className="text-xs font-bold" style={{ color: REGISTER_COLORS.rsp }}>RSP→</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="border border-purple-200 px-3 py-2 font-mono text-gray-600">
                      {formatAddress(block.address, true)}
                    </td>

                    {/* Name */}
                    <td className="border border-purple-200 px-3 py-2 font-mono font-medium text-purple-900">
                      {block.name}
                    </td>

                    {/* Type */}
                    <td className="border border-purple-200 px-3 py-2 text-gray-500">
                      {block.type}
                    </td>

                    {/* Value */}
                    <td className="border border-purple-200 px-3 py-2 font-mono text-gray-800">
                      {isPointer && block.points_to ? (
                        <span className="flex items-center gap-1">
                          <span style={{ color: POINTER_COLORS.main }}>→</span>
                          <span style={{ color: highlighted ? POINTER_COLORS.main : undefined }}>
                            {formatAddress(block.points_to, true)}
                          </span>
                        </span>
                      ) : (
                        block.value
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Empty State */}
        {blocks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground border border-purple-200 rounded mt-2" style={{ backgroundColor: '#faf5ff' }}>
            <p className="text-sm">Stack is empty</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-purple-200 flex items-center justify-center gap-2 text-xs text-purple-600" style={{ backgroundColor: '#f3e8ff' }}>
        <span>High Addr</span>
        <span>↓</span>
        <span>Low Addr (grows down)</span>
      </div>
    </motion.div>
  );
}
