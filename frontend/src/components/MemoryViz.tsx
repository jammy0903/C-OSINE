import { useState, useRef, useEffect } from 'react';
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
      setError(result.message || '실행 오류');
    }

    setIsLoading(false);
  };

  // 줄 번호 스크롤 동기화
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const step = steps[currentStep];
  const lines = code.split('\n');

  return (
    <div className="flex h-full">
      {/* 왼쪽: 코드 에디터 + 설명 (통합) */}
      <div className="w-1/2 p-4 border-r border-gray-700 flex flex-col">
        <h2 className="text-lg font-bold mb-2">📝 C 코드</h2>

        {/* 코드 에디터 (줄 번호 포함) */}
        <div className="flex-1 flex bg-gray-800 rounded-lg overflow-hidden min-h-0">
          {/* 줄 번호 */}
          <div
            ref={lineNumbersRef}
            className="bg-gray-700/50 text-gray-500 font-mono text-sm py-3 select-none overflow-hidden border-r border-gray-600"
            style={{ minWidth: '3rem' }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = step && step.line === lineNum;
              return (
                <div
                  key={idx}
                  className={`px-2 text-right leading-6 ${
                    isCurrentLine ? 'bg-yellow-500/30 text-yellow-300' : ''
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          {/* 코드 입력/표시 영역 */}
          <div className="flex-1 relative">
            {/* 하이라이트 레이어 - textarea 위에 배치, 클릭은 통과 */}
            <div className="absolute inset-0 py-3 font-mono text-sm z-20 pointer-events-none">
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isCurrentLine = step && step.line === lineNum;
                return (
                  <div
                    key={idx}
                    className={`px-3 leading-6 ${
                      isCurrentLine ? 'bg-yellow-400/40 border-l-4 border-yellow-400' : ''
                    }`}
                  >
                    {isCurrentLine && (
                      <span className="absolute right-2 text-yellow-300 font-bold animate-pulse">◀ 현재</span>
                    )}
                    &nbsp;
                  </div>
                );
              })}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              className="w-full h-full bg-transparent font-mono text-sm p-3 resize-none focus:outline-none leading-6 relative z-10"
              style={{ color: '#ffffff' }}
              placeholder="C 코드를 입력하세요..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* stdin 입력 */}
        <div className="mt-3">
          <label className="text-gray-400 text-xs flex items-center gap-1 mb-1">
            📥 입력 (stdin)
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="예: 3 5"
            className="w-full h-12 bg-gray-700 text-green-400 font-mono text-sm p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* 실행 버튼 + 스텝 컨트롤 */}
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleTrace}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {isLoading ? '분석 중...' : '▶ 실행 & 추적'}
          </button>

          {steps.length > 0 && (
            <>
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
              >
                ◀
              </button>
              <span className="text-gray-400 text-sm">
                Step {currentStep + 1} / {steps.length}
              </span>
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
              >
                ▶
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}

        {/* 설명 박스 */}
        {step && step.explanation && (
          <div className="mt-3 bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 max-h-[30%] overflow-auto">
            <h3 className="text-blue-400 font-bold mb-2">💡 이 단계에서 일어나는 일</h3>
            <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
              {step.explanation}
            </pre>
          </div>
        )}
      </div>

      {/* 오른쪽: 메모리 시각화 */}
      <div className="w-1/2 p-4 overflow-auto">
        <h2 className="text-lg font-bold mb-2">🧠 메모리</h2>

        {!step ? (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-4xl mb-4">📦</p>
            <p>코드를 실행하면</p>
            <p>메모리 상태가 표시됩니다</p>
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

// 메모리 격자 시각화 컴포넌트
function MemoryGrid({ stack, heap }: { stack: MemoryBlock[]; heap: MemoryBlock[] }) {
  const allBlocks = [...stack, ...heap];

  // 포인터 연결 정보 수집
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
    <div className="space-y-4">
      {/* 전체 메모리 컨테이너 */}
      <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-600">
        <div className="text-center text-gray-400 text-xs mb-3 uppercase tracking-wider">
          Virtual Memory
        </div>

        {/* STACK 영역 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 font-bold text-sm">📚 STACK</span>
            <span className="text-gray-500 text-xs">(높은 주소 → 낮은 주소)</span>
          </div>

          {stack.length === 0 ? (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 text-center text-gray-500 text-sm">
              비어있음
            </div>
          ) : (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
              <div className="grid grid-cols-4 gap-2">
                {stack.map((block) => (
                  <MemoryCell
                    key={block.address}
                    block={block}
                    color="purple"
                    allBlocks={allBlocks}
                  />
                ))}
                {/* 빈 셀 채우기 (최소 4칸) */}
                {stack.length < 4 && Array.from({ length: 4 - stack.length }).map((_, i) => (
                  <EmptyCell key={`empty-stack-${i}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 여유 공간 표시 */}
        <div className="flex items-center justify-center my-3">
          <div className="flex-1 border-t border-dashed border-gray-600"></div>
          <span className="px-3 text-gray-500 text-xs">↕ 여유 공간</span>
          <div className="flex-1 border-t border-dashed border-gray-600"></div>
        </div>

        {/* HEAP 영역 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400 font-bold text-sm">🗄️ HEAP</span>
            <span className="text-gray-500 text-xs">(낮은 주소 → 높은 주소)</span>
          </div>

          {heap.length === 0 ? (
            <div className="bg-green-900/20 border border-green-500/30 rounded p-3 text-center text-gray-500 text-sm">
              비어있음 (malloc 전)
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
              <div className="grid grid-cols-4 gap-2">
                {heap.map((block) => (
                  <MemoryCell
                    key={block.address}
                    block={block}
                    color="green"
                    allBlocks={allBlocks}
                  />
                ))}
                {heap.length < 4 && Array.from({ length: 4 - heap.length }).map((_, i) => (
                  <EmptyCell key={`empty-heap-${i}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 포인터 화살표 */}
      {pointerConnections.map((conn, idx) => (
        <Xarrow
          key={idx}
          start={conn.from}
          end={conn.to}
          color="#f97316"
          strokeWidth={2}
          headSize={4}
          curveness={0.5}
          dashness={false}
          path="smooth"
        />
      ))}

      {/* 범례 */}
      <div className="bg-gray-800 rounded-lg p-3 text-xs">
        <div className="text-gray-400 mb-2 font-bold">범례</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500/50 border border-purple-500 rounded"></div>
            <span className="text-gray-300">스택 변수</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/50 border border-green-500 rounded"></div>
            <span className="text-gray-300">힙 메모리</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-orange-500 rounded"></div>
            <span className="text-gray-300">포인터</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-orange-500"></div>
            <span className="text-gray-300">가리킴</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 개별 메모리 셀 컴포넌트
function MemoryCell({
  block,
  color,
  allBlocks
}: {
  block: MemoryBlock;
  color: 'purple' | 'green';
  allBlocks: MemoryBlock[];
}) {
  const isPointer = block.type.includes('*');

  // 포인터가 가리키는 대상 찾기
  const pointsToBlock = block.points_to
    ? allBlocks.find(b => b.address === block.points_to)
    : null;

  const bgColor = color === 'purple' ? 'bg-purple-600/30' : 'bg-green-600/30';
  const borderColor = isPointer
    ? 'border-orange-500 border-2'
    : color === 'purple'
      ? 'border-purple-500'
      : 'border-green-500';

  return (
    <div
      id={`block-${block.address}`}
      className={`${bgColor} ${borderColor} border rounded-lg p-2 text-center transition-all hover:scale-105`}
    >
      {/* 변수명 */}
      <div className="font-mono font-bold text-blue-300 text-sm truncate" title={block.name}>
        {block.name}
      </div>

      {/* 값 */}
      <div className="text-lg font-bold text-yellow-400 my-1">
        {isPointer && pointsToBlock ? (
          <span className="text-orange-400 text-sm">
            →{pointsToBlock.name}
          </span>
        ) : isPointer && block.points_to ? (
          <span className="text-orange-400 text-xs font-mono">
            {block.points_to}
          </span>
        ) : (
          block.value
        )}
      </div>

      {/* 주소 */}
      <div className="text-xs text-gray-500 font-mono truncate" title={block.address}>
        {formatAddress(block.address)}
      </div>

      {/* 타입 표시 */}
      <div className="text-xs text-gray-400 mt-1">
        {block.type}
      </div>
    </div>
  );
}

// 빈 셀 컴포넌트
function EmptyCell() {
  return (
    <div className="bg-gray-700/20 border border-gray-600/30 border-dashed rounded-lg p-2 text-center">
      <div className="text-gray-600 text-xs">-</div>
    </div>
  );
}

// 주소 포맷팅 (긴 주소 축약)
function formatAddress(addr: string): string {
  if (!addr) return '';
  // 0x7fff... 형식이면 마지막 4자리만 표시
  if (addr.length > 8) {
    return '...' + addr.slice(-4);
  }
  return addr;
}
