/**
 * CPURegistersPanel
 * CPU 레지스터 (RSP, RBP, RIP) 표시 패널
 */

import { motion } from 'framer-motion';
import { REGISTER_COLORS, ANIMATION_DURATION } from '../constants';
import { formatAddress } from '../utils';

interface CPURegistersPanelProps {
  rsp: string;
  rbp: string;
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export function CPURegistersPanel({
  rsp,
  rbp,
  animationSpeed = 'normal',
}: CPURegistersPanelProps) {
  const duration = ANIMATION_DURATION[animationSpeed] / 1000;

  return (
    <div className="w-40 shrink-0 border-r border-border bg-card p-3 flex flex-col gap-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        CPU Registers
      </h3>

      <div className="space-y-2">
        {/* RSP */}
        <RegisterRow
          name="RSP"
          value={rsp}
          color={REGISTER_COLORS.rsp}
          description="Stack Top"
          duration={duration}
        />

        {/* RBP */}
        <RegisterRow
          name="RBP"
          value={rbp}
          color={REGISTER_COLORS.rbp}
          description="Frame Base"
          duration={duration}
        />
      </div>
    </div>
  );
}

interface RegisterRowProps {
  name: string;
  value: string;
  color: string;
  description: string;
  duration: number;
}

function RegisterRow({ name, value, color, description, duration }: RegisterRowProps) {
  return (
    <div className="bg-background rounded-md p-2 border border-border">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium" style={{ color }}>{name}</span>
        <span className="text-xs text-muted-foreground">· {description}</span>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
        className="font-mono text-xs truncate"
        style={{ color }}
        title={value}
      >
        {formatAddress(value, true)}
      </motion.div>
    </div>
  );
}

