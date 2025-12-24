import { useState, useRef } from 'react';
import Xarrow, { Xwrapper } from 'react-xarrows';
import { traceCode, type Step, type MemoryBlock } from '../services/tracer';
import { ANIMATION_COLORS } from './memory-viz/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, ChevronLeft, ChevronRight, Cpu, AlertCircle } from 'lucide-react';

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
    <div className="flex h-full rounded-xl overflow-hidden">
      {/* Left: Code Editor */}
      <Card className="w-1/2 flex flex-col min-w-0 rounded-none border-r">
        {/* Header */}
        <CardHeader className="py-3 px-5 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Code</CardTitle>
            {step && (
              <Badge variant="outline" className="text-primary">
                Line {step.line}
              </Badge>
            )}
          </div>
        </CardHeader>

        <Separator />

        {/* Code Editor */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            className="bg-background text-muted-foreground font-mono text-sm select-none overflow-hidden border-r"
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
          <div className="flex-1 relative bg-background">
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
              className="w-full h-full bg-transparent font-mono text-sm px-4 resize-none focus:outline-none relative z-20"
              placeholder="Enter C code..."
              spellCheck={false}
              style={{ lineHeight: '1.75rem' }}
            />
          </div>
        </div>

        {/* Stdin & Controls */}
        <div className="px-5 py-4 border-t bg-card shrink-0">
          {/* Stdin */}
          <div className="mb-3">
            <label htmlFor="memory-stdin" className="text-muted-foreground text-xs font-medium mb-1.5 block">
              Input (stdin)
            </label>
            <Input
              id="memory-stdin"
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="e.g., 3 5"
              className="font-mono"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button onClick={handleTrace} disabled={isLoading}>
              <Play className="h-4 w-4 mr-1" />
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </Button>

            {steps.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <span className="text-muted-foreground text-sm min-w-[50px] text-center">
                  {currentStep + 1} / {steps.length}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>

          {error && (
            <Card className="mt-3 border-destructive/30 bg-destructive/5">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Explanation */}
        {step && step.explanation && (
          <div className="px-5 py-4 border-t bg-cyan-500/5 max-h-32 overflow-auto shrink-0">
            <h3 className="text-xs font-medium text-cyan-500 mb-2">Explanation</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {step.explanation}
            </pre>
          </div>
        )}
      </Card>

      {/* Right: Memory Visualization */}
      <div className="w-1/2 flex flex-col bg-background">
        {/* Header */}
        <div className="px-5 py-3 border-b shrink-0">
          <h2 className="text-sm font-medium">Memory</h2>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-5">
          {!step ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <Cpu className="h-7 w-7 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">Run trace to visualize memory</p>
            </div>
          ) : (
            <Xwrapper>
              <MemoryGrid stack={step.stack || []} heap={step.heap || []} />
            </Xwrapper>
          )}
        </ScrollArea>
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
      <Card>
        <CardContent className="p-5">
          <div className="text-center text-muted-foreground text-xs font-medium uppercase tracking-wider mb-5">
            Virtual Memory
          </div>

          {/* STACK */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium">Stack</span>
              <span className="text-muted-foreground text-xs">high → low</span>
            </div>

            {stack.length === 0 ? (
              <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground text-xs">
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
            <div className="flex-1 border-t border-dashed"></div>
            <span className="px-4 text-muted-foreground text-xs">FREE</span>
            <div className="flex-1 border-t border-dashed"></div>
          </div>

          {/* HEAP */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium">Heap</span>
              <span className="text-muted-foreground text-xs">low → high</span>
            </div>

            {heap.length === 0 ? (
              <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground text-xs">
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
        </CardContent>
      </Card>

      {/* Pointer Arrows */}
      {pointerConnections.map((conn, idx) => (
        <Xarrow
          key={idx}
          start={conn.from}
          end={conn.to}
          color={ANIMATION_COLORS.highlight}
          strokeWidth={2}
          headSize={4}
          curveness={0.5}
          dashness={false}
          path="smooth"
        />
      ))}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Legend</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border rounded bg-muted"></div>
              <span className="text-muted-foreground">Stack variable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary rounded"></div>
              <span className="text-muted-foreground">Pointer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border rounded bg-background"></div>
              <span className="text-muted-foreground">Heap memory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0 border-t-2 border-primary"></div>
              <span className="text-muted-foreground">Points to</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MemoryCell({ block, allBlocks }: { block: MemoryBlock; allBlocks: MemoryBlock[] }) {
  const isPointer = block.type.includes('*');
  const pointsToBlock = block.points_to
    ? allBlocks.find(b => b.address === block.points_to)
    : null;

  return (
    <Card
      id={`block-${block.address}`}
      className={`text-center transition-all ${
        isPointer ? 'border-primary border-2' : 'hover:border-primary/50'
      }`}
    >
      <CardContent className="p-3">
        {/* Variable Name */}
        <div className="font-mono text-sm font-medium truncate" title={block.name}>
          {block.name}
        </div>

        {/* Value */}
        <div className="text-lg font-medium text-primary my-1.5">
          {isPointer && pointsToBlock ? (
            <span className="text-cyan-500 text-sm">→ {pointsToBlock.name}</span>
          ) : isPointer && block.points_to ? (
            <span className="text-muted-foreground text-xs font-mono">{block.points_to}</span>
          ) : (
            block.value
          )}
        </div>

        {/* Address */}
        <div className="text-xs text-muted-foreground font-mono truncate" title={block.address}>
          {formatAddress(block.address)}
        </div>

        {/* Type */}
        <div className="text-xs text-muted-foreground mt-1">{block.type}</div>
      </CardContent>
    </Card>
  );
}

function formatAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length > 8) {
    return '...' + addr.slice(-4);
  }
  return addr;
}
