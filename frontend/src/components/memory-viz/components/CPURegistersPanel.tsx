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
  rip?: string;
  currentLine?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export function CPURegistersPanel({
  rsp,
  rbp,
  rip,
  currentLine,
  animationSpeed = 'normal',
}: CPURegistersPanelProps) {
  const duration = ANIMATION_DURATION[animationSpeed] / 1000;

  return (
    <div className="w-44 shrink-0 border-r bg-card p-4 flex flex-col">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        CPU Registers
      </h3>

      <div className="space-y-3 flex-1">
        {/* RSP */}
        <RegisterRow
          name="RSP"
          value={rsp}
          color={REGISTER_COLORS.rsp}
          description="Stack Pointer"
          duration={duration}
        />

        {/* RBP */}
        <RegisterRow
          name="RBP"
          value={rbp}
          color={REGISTER_COLORS.rbp}
          description="Base Pointer"
          duration={duration}
        />

        {/* RIP (optional) */}
        {rip && (
          <RegisterRow
            name="RIP"
            value={rip}
            color={REGISTER_COLORS.rip}
            description="Instruction Ptr"
            duration={duration}
          />
        )}
      </div>

      {/* Current Line */}
      {currentLine !== undefined && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground mb-1">Current Line</div>
          <motion.div
            key={currentLine}
            initial={{ scale: 1.2, color: '#6366f1' }}
            animate={{ scale: 1, color: '#ffffff' }}
            className="text-2xl font-mono font-bold"
          >
            {currentLine}
          </motion.div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-muted-foreground mb-2">Legend</div>
        <div className="space-y-1.5">
          <LegendItem color={REGISTER_COLORS.rsp} label="RSP" description="Stack Top" />
          <LegendItem color={REGISTER_COLORS.rbp} label="RBP" description="Frame Base" />
        </div>
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
    <div className="bg-background rounded-lg p-2.5 border">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium">{name}</span>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.5, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration }}
        className="font-mono text-sm text-primary truncate"
        title={value}
      >
        {formatAddress(value, true)}
      </motion.div>
      <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  description: string;
}

function LegendItem({ color, label, description }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="w-3 h-0.5 rounded"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">- {description}</span>
    </div>
  );
}
