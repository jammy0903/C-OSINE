/**
 * ProcessMemoryView
 * 전체 프로세스 메모리 레이아웃 (CODE, DATA, HEAP, STACK)
 * 포인터 연결 시각화: 탭/클릭 시 색상 매칭 + 펄스 애니메이션
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Step, ViewMode, MemoryBlock } from '../types';
import { MemorySegment } from './MemorySegment';
import { REGISTER_COLORS, POINTER_COLORS } from '../constants';

interface ProcessMemoryViewProps {
  step: Step | null;
  onViewChange: (view: ViewMode) => void;
}

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

export function ProcessMemoryView({ step, onViewChange }: ProcessMemoryViewProps) {
  // 선택된 포인터 주소 (탭/클릭 시 하이라이트)
  const [selectedPointer, setSelectedPointer] = useState<string | null>(null);

  // 모든 블록에서 포인터 연결 정보 추출
  const allBlocks = useMemo(() => {
    if (!step) return [];
    return [...step.stack, ...step.heap];
  }, [step]);

  // 블록이 하이라이트 대상인지 확인
  const isBlockHighlighted = (block: MemoryBlock) => {
    if (!selectedPointer) return false;
    const selectedBlock = allBlocks.find((b) => b.address === selectedPointer);
    return block.address === selectedPointer || block.address === selectedBlock?.points_to;
  };

  // 포인터 블록 클릭 핸들러
  const handlePointerClick = (e: React.MouseEvent, block: MemoryBlock) => {
    e.stopPropagation();
    if (block.points_to) {
      setSelectedPointer((prev) => (prev === block.address ? null : block.address));
    }
  };

  if (!step) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Click "Analyze" to visualize memory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-auto" onClick={() => setSelectedPointer(null)}>
      {/* Memory Layout */}
      <div className="max-w-sm mx-auto flex flex-col gap-2">
        <div className="text-center text-xs text-muted-foreground">High Address</div>

        {/* STACK with label column */}
        <motion.div whileHover={{ scale: 1.01 }}>
          <div
            className="rounded-lg overflow-hidden cursor-pointer"
            style={{
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
            }}
            onClick={() => onViewChange('stack-detail')}
          >
            {/* Header */}
            <div
              className="px-3 py-1.5 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(168, 85, 247, 0.25)' }}
            >
              <span className="text-sm font-bold" style={{ color: '#a855f7' }}>STACK</span>
              <span className="text-xs text-muted-foreground">{step.stack.length} vars</span>
            </div>

            {/* Stack Content - 3 column grid */}
            <div className="p-3 text-xs flex flex-col">
              {/* Grid: Label | Name | Address */}
              <div className="grid gap-y-1.5" style={{ gridTemplateColumns: '5.5rem 1fr 3rem' }}>
                {/* RBP Row - 맨 위 */}
                <div className="text-right pr-2 text-muted-foreground flex items-center justify-end font-mono text-[10px]">Frame Base →</div>
                <div
                  className="flex items-center gap-1 px-2 py-1.5 rounded"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REGISTER_COLORS.rbp }} />
                  <span className="font-medium" style={{ color: REGISTER_COLORS.rbp }}>RBP</span>
                </div>
                <div className="font-mono text-muted-foreground flex items-center justify-end">{step.rbp.slice(-4)}</div>

                {/* Stack Variables */}
                {step.stack.slice(0, 4).map((block) => {
                  const hasPointer = !!block.points_to;
                  const highlighted = isBlockHighlighted(block);

                  return (
                    <>
                      {/* Empty label column */}
                      <div key={`${block.address}-label`} />
                      {/* Name column */}
                      <motion.div
                        key={block.address}
                        className="flex items-center gap-1 px-2 py-1.5 rounded"
                        style={{
                          backgroundColor: highlighted ? POINTER_COLORS.bg : 'rgba(0,0,0,0.2)',
                          cursor: hasPointer ? 'pointer' : 'default',
                        }}
                        variants={pulseVariants}
                        animate={highlighted ? 'pulse' : 'idle'}
                        onClick={(e) => hasPointer && handlePointerClick(e, block)}
                      >
                        <span className="font-medium" style={{ color: '#a855f7' }}>
                          {block.name}
                          {hasPointer && <span style={{ color: POINTER_COLORS.main }}> →</span>}
                        </span>
                        <span className="text-muted-foreground text-[10px]">= {block.value}</span>
                      </motion.div>
                      {/* Address column */}
                      <div key={`${block.address}-addr`} className="font-mono text-muted-foreground flex items-center justify-end">
                        {block.address.slice(-4)}
                      </div>
                    </>
                  );
                })}

                {step.stack.length > 4 && (
                  <>
                    <div />
                    <div className="text-muted-foreground text-center py-1">+{step.stack.length - 4} more</div>
                    <div />
                  </>
                )}

                {/* RSP Row - 맨 아래 */}
                <div className="text-right pr-2 text-muted-foreground flex items-center justify-end font-mono text-[10px]">Stack Top →</div>
                <div
                  className="flex items-center gap-1 px-2 py-1.5 rounded"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REGISTER_COLORS.rsp }} />
                  <span className="font-medium" style={{ color: REGISTER_COLORS.rsp }}>RSP</span>
                </div>
                <div className="font-mono text-muted-foreground flex items-center justify-end">{step.rsp.slice(-4)}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* HEAP */}
        <motion.div whileHover={{ scale: 1.01 }}>
          <MemorySegment
            type="heap"
            label="HEAP"
            blocks={step.heap}
            onClick={() => onViewChange('heap-detail')}
            onPointerClick={handlePointerClick}
            isBlockHighlighted={isBlockHighlighted}
          />
        </motion.div>

        {/* DATA & CODE */}
        <div className="flex gap-2">
          <MemorySegment type="data" label="DATA" className="flex-1" />
          <MemorySegment type="code" label="CODE" className="flex-1" />
        </div>

        <div className="text-center text-xs text-muted-foreground">Low Address</div>
      </div>
    </div>
  );
}
