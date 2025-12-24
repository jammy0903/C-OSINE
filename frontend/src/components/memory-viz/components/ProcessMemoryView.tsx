/**
 * ProcessMemoryView
 * 전체 프로세스 메모리 레이아웃 (CODE, DATA, HEAP, STACK)
 */

import { motion } from 'framer-motion';
import type { Step, ViewMode } from '../types';
import { MemorySegment } from './MemorySegment';
import { SEGMENT_COLORS } from '../constants';

interface ProcessMemoryViewProps {
  step: Step | null;
  onViewChange: (view: ViewMode) => void;
}

export function ProcessMemoryView({ step, onViewChange }: ProcessMemoryViewProps) {
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
    <div className="flex-1 flex gap-6 p-4 overflow-hidden">
      {/* Memory Layout */}
      <div className="w-56 flex flex-col gap-2">
        <div className="text-center text-xs text-muted-foreground">High Address</div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <MemorySegment
            type="stack"
            label="STACK"
            blocks={step.stack}
            onClick={() => onViewChange('stack-detail')}
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <MemorySegment
            type="heap"
            label="HEAP"
            blocks={step.heap}
            onClick={() => onViewChange('heap-detail')}
          />
        </motion.div>

        <div className="flex gap-2">
          <MemorySegment type="data" label="DATA" className="flex-1" />
          <MemorySegment type="code" label="CODE" className="flex-1" />
        </div>

        <div className="text-center text-xs text-muted-foreground">Low Address</div>
      </div>

      {/* Memory Stats */}
      <div className="w-40 flex flex-col gap-3">
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground mb-3">Memory Usage</div>
          <div className="space-y-2">
            <StatRow label="Stack" value={step.stack.length} color={SEGMENT_COLORS.stack.main} />
            <StatRow label="Heap" value={step.heap.length} color={SEGMENT_COLORS.heap.main} />
            <StatRow
              label="Pointers"
              value={[...step.stack, ...step.heap].filter(b => b.points_to).length}
              color="#06b6d4"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground p-2 rounded border border-border bg-card/50">
          Click STACK or HEAP for details
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: number;
  color: string;
}

function StatRow({ label, value, color }: StatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}
