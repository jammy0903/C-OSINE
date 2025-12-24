/**
 * ProcessMemoryVisualization
 * 메모리 시각화 메인 컨테이너
 */

import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Step, ViewMode, AnimationSpeed } from './types';
import { DEFAULT_CODE } from './constants';
import { CPURegistersPanel } from './components/CPURegistersPanel';
import { ProcessMemoryView } from './components/ProcessMemoryView';
import { StackDetailView } from './components/StackDetailView';
import { HeapDetailView } from './components/HeapDetailView';
import { useStepTransition } from './hooks/useStepTransition';
import { traceCode } from '../../services/tracer';
import { Button } from '@/components/ui/button';

export function ProcessMemoryVisualization() {
  // State
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('normal');

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Current step
  const currentStep = steps[currentStepIndex] || null;

  // Animation hook
  const { changedBlocks, isAnimating } = useStepTransition(currentStep);

  // Handlers
  const handleTrace = async () => {
    setIsLoading(true);
    setError('');
    setSteps([]);
    setCurrentStepIndex(0);
    setViewMode('overview');

    const result = await traceCode(code, stdin);

    if (result.success) {
      setSteps(result.steps);
    } else {
      setError(result.message || 'Execution error');
    }

    setIsLoading(false);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handlePrevStep = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextStep = () => {
    setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
  };

  const lines = code.split('\n');

  return (
    <div className="flex h-full bg-background rounded-xl overflow-hidden">
      {/* Left: Code Editor */}
      <div className="w-[400px] flex flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-sm font-medium text-foreground">C Code</h2>
          {currentStep && (
            <span className="text-xs text-primary">Line {currentStep.line}</span>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            className="bg-background text-muted-foreground font-mono text-sm select-none overflow-hidden border-r border-border"
            style={{ minWidth: '3rem' }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = currentStep?.line === lineNum;
              return (
                <div
                  key={idx}
                  className={`h-6 flex items-center justify-end pr-2 ${
                    isCurrentLine ? 'bg-primary/20 text-primary font-medium' : ''
                  }`}
                >
                  <span className="text-xs">{lineNum}</span>
                </div>
              );
            })}
          </div>

          {/* Code Area */}
          <div className="flex-1 relative bg-background">
            {/* Highlight Layer */}
            <div className="absolute inset-0 font-mono text-sm pointer-events-none">
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isCurrentLine = currentStep?.line === lineNum;
                return (
                  <div
                    key={idx}
                    className={`h-6 px-3 ${isCurrentLine ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                  />
                );
              })}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              className="w-full h-full bg-transparent font-mono text-sm px-3 resize-none focus:outline-none relative z-10 text-text"
              placeholder="Enter C code..."
              spellCheck={false}
              style={{ lineHeight: '1.5rem' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 border-t border-border bg-card shrink-0 space-y-3">
          {/* Stdin */}
          <div>
            <label htmlFor="viz-stdin" className="text-muted-foreground text-xs font-medium mb-1 block">
              Input (stdin)
            </label>
            <input
              id="viz-stdin"
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="e.g., 3 5"
              className="w-full bg-background border border-border rounded-lg font-mono text-sm px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleTrace}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </Button>

            {steps.length > 0 && (
              <>
                <Button
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0 || isAnimating}
                  variant="secondary"
                  size="sm"
                >
                  ◀ Prev
                </Button>
                <span className="text-muted-foreground text-sm min-w-[50px] text-center">
                  {currentStepIndex + 1}/{steps.length}
                </span>
                <Button
                  onClick={handleNextStep}
                  disabled={currentStepIndex === steps.length - 1 || isAnimating}
                  variant="secondary"
                  size="sm"
                >
                  Next ▶
                </Button>
              </>
            )}
          </div>

          {/* Speed Control */}
          {steps.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Speed:</span>
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <button
                  key={speed}
                  onClick={() => setAnimationSpeed(speed)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    animationSpeed === speed
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-danger text-sm bg-danger/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Explanation */}
        {currentStep?.explanation && (
          <div className="px-4 py-3 border-t border-border bg-info/5 max-h-40 overflow-auto shrink-0">
            <h3 className="text-xs font-medium text-info mb-1">Explanation</h3>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {currentStep.explanation}
            </pre>
          </div>
        )}
      </div>

      {/* Middle: CPU Registers */}
      <CPURegistersPanel
        rsp={currentStep?.rsp || '0x0'}
        rbp={currentStep?.rbp || '0x0'}
        animationSpeed={animationSpeed}
      />

      {/* Right: Memory Visualization */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">Memory</h2>
            {viewMode !== 'overview' && (
              <button
                onClick={() => setViewMode('overview')}
                className="text-xs text-primary hover:underline"
              >
                ← Back to Overview
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {viewMode === 'overview' && 'Process Memory Layout'}
              {viewMode === 'stack-detail' && 'Stack Detail View'}
              {viewMode === 'heap-detail' && 'Heap Detail View'}
            </span>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'overview' && (
            <ProcessMemoryView
              key="overview"
              step={currentStep}
              onViewChange={setViewMode}
            />
          )}
          {viewMode === 'stack-detail' && currentStep && (
            <StackDetailView
              key="stack"
              blocks={currentStep.stack}
              rsp={currentStep.rsp}
              rbp={currentStep.rbp}
              onClose={() => setViewMode('overview')}
              changedBlocks={changedBlocks}
              animationSpeed={animationSpeed}
            />
          )}
          {viewMode === 'heap-detail' && currentStep && (
            <HeapDetailView
              key="heap"
              blocks={currentStep.heap}
              onClose={() => setViewMode('overview')}
              changedBlocks={changedBlocks}
              animationSpeed={animationSpeed}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
