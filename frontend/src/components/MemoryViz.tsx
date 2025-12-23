import { useState, useRef } from 'react';
import Xarrow, { Xwrapper } from 'react-xarrows';
import { traceCode, type Step, type MemoryBlock } from '../services/tracer';

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int x = 5;
    int y = 10;
    int *p = &x;
    *p = 20;
    printf("%d\\n", x);
    return 0;
}`;

export function MemoryViz() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleTrace = async () => {
    setIsLoading(true);
    setError('');
    setSteps([]);
    setCurrentStep(0);

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

  const step = steps[currentStep];
  const lines = code.split('\n');

  return (
    <div className="flex h-full bg-bg rounded-xl overflow-hidden">
      {/* Left: Code Editor */}
      <div className="w-1/2 flex flex-col border-r border-border bg-bg-elevated">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-sm font-medium text-text">Code</h2>
          {step && (
            <span className="text-xs text-primary">Line {step.line}</span>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Line Numbers - 줄 사이에 배치 */}
          <div
            ref={lineNumbersRef}
            className="bg-bg text-text-tertiary font-mono text-sm select-none overflow-hidden border-r border-border"
            style={{ minWidth: '3.5rem' }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = step && step.line === lineNum;
              return (
                <div
                  key={idx}
                  className="relative h-7 flex items-center justify-end pr-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <span className={`text-xs ${isCurrentLine ? 'text-primary font-medium' : ''}`}>
                    {lineNum}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Code Area */}
          <div className="flex-1 relative bg-bg">
            {/* Highlight Layer */}
            <div className="absolute inset-0 font-mono text-sm z-10 pointer-events-none">
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isCurrentLine = step && step.line === lineNum;
                return (
                  <div
                    key={idx}
                    className={`h-7 px-4 flex items-center ${isCurrentLine ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    {isCurrentLine && (
                      <span className="absolute right-4 text-primary text-xs font-medium">CURRENT</span>
                    )}
                  </div>
                );
              })}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              className="w-full h-full bg-transparent font-mono text-sm px-4 resize-none focus:outline-none relative z-20 text-text"
              placeholder="Enter C code..."
              spellCheck={false}
              style={{ lineHeight: '1.75rem' }}
            />
          </div>
        </div>

        {/* Stdin & Controls */}
        <div className="px-5 py-4 border-t border-border bg-bg-elevated shrink-0">
          {/* Stdin */}
          <div className="mb-3">
            <label className="text-text-tertiary text-xs font-medium mb-1.5 block">Input (stdin)</label>
            <input
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="e.g., 3 5"
              className="w-full bg-bg border border-border rounded-lg font-mono text-sm px-3 py-2 text-text placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTrace}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>

            {steps.length > 0 && (
              <>
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-3 py-2 bg-bg-tertiary text-text-secondary text-sm font-medium rounded-lg hover:bg-bg-hover disabled:opacity-40 transition-colors"
                >
                  Prev
                </button>
                <span className="text-text-secondary text-sm min-w-[50px] text-center">
                  {currentStep + 1} / {steps.length}
                </span>
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                  className="px-3 py-2 bg-bg-tertiary text-text-secondary text-sm font-medium rounded-lg hover:bg-bg-hover disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </>
            )}
          </div>

          {error && (
            <p className="mt-3 text-danger text-sm bg-danger/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Explanation */}
        {step && step.explanation && (
          <div className="px-5 py-4 border-t border-border bg-info/5 max-h-32 overflow-auto shrink-0">
            <h3 className="text-xs font-medium text-info mb-2">Explanation</h3>
            <pre className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {step.explanation}
            </pre>
          </div>
        )}
      </div>

      {/* Right: Memory Visualization */}
      <div className="w-1/2 flex flex-col bg-bg">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-medium text-text">Memory</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {!step ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <svg width="28" height="28" className="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm">Run trace to visualize memory</p>
            </div>
          ) : (
            <Xwrapper>
              <MemoryGrid stack={step.stack || []} heap={step.heap || []} />
            </Xwrapper>
          )}
        </div>
      </div>
    </div>
  );
}

function MemoryGrid({ stack, heap }: { stack: MemoryBlock[]; heap: MemoryBlock[] }) {
  const allBlocks = [...stack, ...heap];

  const pointerConnections: { from: string; to: string }[] = [];
  allBlocks.forEach(block => {
    if (block.points_to) {
      const target = allBlocks.find(b => b.address === block.points_to);
      if (target) {
        pointerConnections.push({
          from: `block-${block.address}`,
          to: `block-${target.address}`
        });
      }
    }
  });

  return (
    <div className="space-y-5">
      {/* Memory Container */}
      <div className="border border-border rounded-xl p-5 bg-bg-elevated">
        <div className="text-center text-text-tertiary text-xs font-medium uppercase tracking-wider mb-5">
          Virtual Memory
        </div>

        {/* STACK */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-medium text-text">Stack</span>
            <span className="text-text-muted text-xs">high → low</span>
          </div>

          {stack.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-4 text-center text-text-muted text-xs">
              EMPTY
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {stack.map((block) => (
                <MemoryCell key={block.address} block={block} allBlocks={allBlocks} />
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center my-5">
          <div className="flex-1 border-t border-dashed border-border"></div>
          <span className="px-4 text-text-muted text-xs">FREE</span>
          <div className="flex-1 border-t border-dashed border-border"></div>
        </div>

        {/* HEAP */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-medium text-text">Heap</span>
            <span className="text-text-muted text-xs">low → high</span>
          </div>

          {heap.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-4 text-center text-text-muted text-xs">
              EMPTY (before malloc)
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {heap.map((block) => (
                <MemoryCell key={block.address} block={block} allBlocks={allBlocks} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pointer Arrows */}
      {pointerConnections.map((conn, idx) => (
        <Xarrow
          key={idx}
          start={conn.from}
          end={conn.to}
          color="#6366f1"
          strokeWidth={2}
          headSize={4}
          curveness={0.5}
          dashness={false}
          path="smooth"
        />
      ))}

      {/* Legend */}
      <div className="border border-border rounded-xl p-4 bg-bg-elevated">
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Legend</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-border rounded bg-bg-tertiary"></div>
            <span className="text-text-secondary">Stack variable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary rounded"></div>
            <span className="text-text-secondary">Pointer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-border rounded bg-bg"></div>
            <span className="text-text-secondary">Heap memory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-primary"></div>
            <span className="text-text-secondary">Points to</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemoryCell({ block, allBlocks }: { block: MemoryBlock; allBlocks: MemoryBlock[] }) {
  const isPointer = block.type.includes('*');
  const pointsToBlock = block.points_to
    ? allBlocks.find(b => b.address === block.points_to)
    : null;

  return (
    <div
      id={`block-${block.address}`}
      className={`border rounded-lg p-3 text-center transition-all bg-bg-tertiary ${
        isPointer ? 'border-primary border-2' : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Variable Name */}
      <div className="font-mono text-text text-sm font-medium truncate" title={block.name}>
        {block.name}
      </div>

      {/* Value */}
      <div className="text-lg font-medium text-primary my-1.5">
        {isPointer && pointsToBlock ? (
          <span className="text-info text-sm">→ {pointsToBlock.name}</span>
        ) : isPointer && block.points_to ? (
          <span className="text-text-muted text-xs font-mono">{block.points_to}</span>
        ) : (
          block.value
        )}
      </div>

      {/* Address */}
      <div className="text-xs text-text-muted font-mono truncate" title={block.address}>
        {formatAddress(block.address)}
      </div>

      {/* Type */}
      <div className="text-xs text-text-tertiary mt-1">{block.type}</div>
    </div>
  );
}

function formatAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length > 8) {
    return '...' + addr.slice(-4);
  }
  return addr;
}
