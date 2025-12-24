/**
 * ProcessMemoryView
 * 전체 프로세스 메모리 레이아웃 (CODE, DATA, HEAP, STACK)
 */

import { motion } from 'framer-motion';
import type { Step, ViewMode } from '../types';
import { MemorySegment } from './MemorySegment';
import { REGISTER_COLORS } from '../constants';
import { formatAddress } from '../utils';

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
    <div className="flex-1 flex gap-4 p-4 overflow-hidden">
      {/* Memory Layout */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Header */}
        <div className="text-center text-xs text-muted-foreground py-1">
          High Address (0x7fffffff...)
        </div>

        {/* STACK - 클릭 시 확대 */}
        <motion.div
          className="flex-[2] min-h-0"
          whileHover={{ scale: 1.01 }}
        >
          <MemorySegment
            type="stack"
            label="STACK"
            blocks={step.stack}
            onClick={() => onViewChange('stack-detail')}
            className="h-full"
          />
        </motion.div>

        {/* RSP/RBP Indicators */}
        <div className="flex items-center justify-between px-2 py-1 bg-card rounded border border-border">
          <RegisterIndicator name="RSP" value={step.rsp} color={REGISTER_COLORS.rsp} />
          <div className="flex-1 mx-4 border-t border-dashed border-border" />
          <RegisterIndicator name="RBP" value={step.rbp} color={REGISTER_COLORS.rbp} />
        </div>

        {/* FREE SPACE indicator */}
        <div className="flex items-center justify-center py-2 border border-dashed border-border rounded-lg bg-background/50">
          <span className="text-xs text-muted-foreground">FREE SPACE</span>
          <svg className="w-4 h-4 mx-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="text-xs text-muted-foreground">Stack↓ Heap↑</span>
        </div>

        {/* HEAP - 클릭 시 확대 */}
        <motion.div
          className="flex-[2] min-h-0"
          whileHover={{ scale: 1.01 }}
        >
          <MemorySegment
            type="heap"
            label="HEAP"
            blocks={step.heap}
            onClick={() => onViewChange('heap-detail')}
            className="h-full"
          />
        </motion.div>

        {/* DATA & CODE segments */}
        <div className="flex gap-2">
          <MemorySegment
            type="data"
            label="DATA"
            className="flex-1"
          />
          <MemorySegment
            type="code"
            label="CODE"
            className="flex-1"
          />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-1">
          Low Address (0x00400000)
        </div>
      </div>

      {/* Right Side - Current Step Info */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        {/* Current Line */}
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground mb-1">Current Line</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{step.line}</span>
            <code className="text-xs text-muted-foreground truncate flex-1">
              {step.code}
            </code>
          </div>
        </div>

        {/* Register Values */}
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground mb-2">Registers</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: REGISTER_COLORS.rsp }}>RSP</span>
              <code className="font-mono text-xs text-foreground">{formatAddress(step.rsp, true)}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: REGISTER_COLORS.rbp }}>RBP</span>
              <code className="font-mono text-xs text-foreground">{formatAddress(step.rbp, true)}</code>
            </div>
          </div>
        </div>

        {/* Memory Stats */}
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground mb-2">Memory Usage</div>
          <div className="space-y-2">
            <StatRow label="Stack Variables" value={step.stack.length} color="text-purple-400" />
            <StatRow label="Heap Blocks" value={step.heap.length} color="text-emerald-400" />
            <StatRow
              label="Pointers"
              value={[...step.stack, ...step.heap].filter(b => b.points_to).length}
              color="text-info"
            />
          </div>
        </div>

        {/* Tips */}
        <div className="bg-info/10 rounded-lg border border-info/30 p-3 mt-auto">
          <div className="text-xs text-info font-medium mb-1">Tip</div>
          <p className="text-xs text-muted-foreground">
            Click on STACK or HEAP sections to see detailed view with individual memory blocks.
          </p>
        </div>
      </div>
    </div>
  );
}

interface RegisterIndicatorProps {
  name: string;
  value: string;
  color: string;
}

function RegisterIndicator({ name, value, color }: RegisterIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium" style={{ color }}>{name}</span>
      <code className="font-mono text-xs text-muted-foreground">{formatAddress(value, true)}</code>
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
