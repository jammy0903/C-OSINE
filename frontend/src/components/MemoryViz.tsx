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
    <div className="flex h-full bg-[#161618] overflow-hidden">
      {/* Left: Code Editor */}
      <div className="w-1/2 px-8 py-6 border-r border-[#252525] flex flex-col">
        <h2 className="font-title text-xs tracking-[0.2em] text-neutral-500 mb-4">CODE</h2>

        {/* Code Editor */}
        <div className="flex-1 flex border border-[#252525] overflow-hidden min-h-0">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            className="bg-[#111] text-neutral-600 font-mono text-sm py-3 select-none overflow-hidden border-r border-[#252525]"
            style={{ minWidth: '3rem' }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = step && step.line === lineNum;
              return (
                <div
                  key={idx}
                  className={`px-2 text-right leading-6 ${
                    isCurrentLine ? 'bg-white/10 text-white' : ''
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          {/* Code Area */}
          <div className="flex-1 relative bg-[#0a0a0a]">
            {/* Highlight Layer */}
            <div className="absolute inset-0 py-3 font-mono text-sm z-20 pointer-events-none">
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isCurrentLine = step && step.line === lineNum;
                return (
                  <div
                    key={idx}
                    className={`px-3 leading-6 ${
                      isCurrentLine ? 'bg-white/10 border-l-2 border-white' : ''
                    }`}
                  >
                    {isCurrentLine && (
                      <span className="font-title absolute right-3 text-neutral-500 text-xs tracking-wide">CURRENT</span>
                    )}
                    &nbsp;
                  </div>
                );
              })}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              className="w-full h-full bg-transparent font-mono text-sm p-3 resize-none focus:outline-none leading-6 relative z-10 text-neutral-300"
              placeholder="Enter C code..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Stdin */}
        <div className="mt-3">
          <label className="text-neutral-500 text-[10px] mb-1 block">입력 (stdin)</label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="예: 3 5"
            className="w-full h-10 bg-[#1a1a1a] rounded-lg font-mono text-xs p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#3182f6] text-white placeholder-neutral-600"
          />
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleTrace}
            disabled={isLoading}
            className="text-[11px] rounded-full text-white disabled:opacity-40"
            style={{ padding: '8px 18px', backgroundColor: '#3182f6' }}
          >
            {isLoading ? '분석중...' : '분석'}
          </button>

          {steps.length > 0 && (
            <>
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="text-[11px] rounded-full hover:text-white disabled:opacity-30"
                style={{ padding: '8px 16px', backgroundColor: '#252530', color: '#999' }}
              >
                이전
              </button>
              <span className="text-neutral-500 text-[11px] min-w-[50px] text-center">
                {currentStep + 1} / {steps.length}
              </span>
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
                className="text-[11px] rounded-full hover:text-white disabled:opacity-30"
                style={{ padding: '8px 16px', backgroundColor: '#252530', color: '#999' }}
              >
                다음
              </button>
            </>
          )}
        </div>

        {error && <p className="font-body mt-3 text-neutral-500 text-sm">{error}</p>}

        {/* Explanation */}
        {step && step.explanation && (
          <div className="mt-4 border border-[#252525] p-4 max-h-[25%] overflow-auto">
            <h3 className="font-title text-xs tracking-[0.2em] text-neutral-500 mb-3">EXPLANATION</h3>
            <pre className="font-body text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">
              {step.explanation}
            </pre>
          </div>
        )}
      </div>

      {/* Right: Memory Visualization */}
      <div className="w-1/2 px-8 py-6 overflow-auto">
        <h2 className="font-title text-xs tracking-[0.2em] text-neutral-500 mb-4">MEMORY</h2>

        {!step ? (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="font-body text-neutral-600 text-sm tracking-wide">Run trace to visualize memory</p>
          </div>
        ) : (
          <Xwrapper>
            <MemoryGrid stack={step.stack || []} heap={step.heap || []} />
          </Xwrapper>
        )}
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
    <div className="space-y-6">
      {/* Memory Container */}
      <div className="border border-[#252525] p-6">
        <div className="font-title text-center text-neutral-600 text-xs tracking-[0.2em] mb-6">
          VIRTUAL MEMORY
        </div>

        {/* STACK */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-title text-xs tracking-[0.2em] text-neutral-400">STACK</span>
            <span className="font-body text-neutral-600 text-xs">high → low</span>
          </div>

          {stack.length === 0 ? (
            <div className="font-title border border-dashed border-[#252525] p-4 text-center text-neutral-600 text-xs">
              EMPTY
            </div>
          ) : (
            <div className="border border-[#252525] p-4">
              <div className="grid grid-cols-4 gap-3">
                {stack.map((block) => (
                  <MemoryCell key={block.address} block={block} allBlocks={allBlocks} />
                ))}
                {stack.length < 4 && Array.from({ length: 4 - stack.length }).map((_, i) => (
                  <EmptyCell key={`empty-stack-${i}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center my-4">
          <div className="flex-1 border-t border-dashed border-[#252525]"></div>
          <span className="font-title px-4 text-neutral-700 text-xs tracking-wide">FREE SPACE</span>
          <div className="flex-1 border-t border-dashed border-[#252525]"></div>
        </div>

        {/* HEAP */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-title text-xs tracking-[0.2em] text-neutral-400">HEAP</span>
            <span className="font-body text-neutral-600 text-xs">low → high</span>
          </div>

          {heap.length === 0 ? (
            <div className="font-title border border-dashed border-[#252525] p-4 text-center text-neutral-600 text-xs">
              EMPTY (before malloc)
            </div>
          ) : (
            <div className="border border-[#252525] p-4">
              <div className="grid grid-cols-4 gap-3">
                {heap.map((block) => (
                  <MemoryCell key={block.address} block={block} allBlocks={allBlocks} />
                ))}
                {heap.length < 4 && Array.from({ length: 4 - heap.length }).map((_, i) => (
                  <EmptyCell key={`empty-heap-${i}`} />
                ))}
              </div>
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
          color="#ffffff"
          strokeWidth={1}
          headSize={4}
          curveness={0.5}
          dashness={false}
          path="smooth"
        />
      ))}

      {/* Legend */}
      <div className="border border-[#252525] p-4">
        <div className="font-title text-xs tracking-[0.2em] text-neutral-500 mb-3">LEGEND</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-neutral-500"></div>
            <span className="font-body text-neutral-400">Stack variable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-neutral-600 bg-neutral-800"></div>
            <span className="font-body text-neutral-400">Heap memory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white"></div>
            <span className="font-body text-neutral-400">Pointer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t border-white"></div>
            <span className="font-body text-neutral-400">Points to</span>
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
      className={`border p-3 text-center transition-all hover:border-white ${
        isPointer ? 'border-white border-2' : 'border-[#252525]'
      }`}
    >
      {/* Variable Name */}
      <div className="font-mono text-white text-sm truncate" title={block.name}>
        {block.name}
      </div>

      {/* Value */}
      <div className="text-lg font-light text-white my-2">
        {isPointer && pointsToBlock ? (
          <span className="text-neutral-400 text-sm">→ {pointsToBlock.name}</span>
        ) : isPointer && block.points_to ? (
          <span className="text-neutral-500 text-xs font-mono">{block.points_to}</span>
        ) : (
          block.value
        )}
      </div>

      {/* Address */}
      <div className="text-xs text-neutral-600 font-mono truncate" title={block.address}>
        {formatAddress(block.address)}
      </div>

      {/* Type */}
      <div className="text-xs text-neutral-500 mt-1">{block.type}</div>
    </div>
  );
}

function EmptyCell() {
  return (
    <div className="border border-dashed border-[#252525] p-3 text-center">
      <div className="text-neutral-700 text-xs">-</div>
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
