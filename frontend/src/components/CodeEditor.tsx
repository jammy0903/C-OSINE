import { useState } from 'react';
import { useStore } from '../stores/store';
import { runCode, runTestCases, type TestCaseResult } from '../services/judge0';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

export function CodeEditor() {
  const { code, setCode, result, setResult, isRunning, setRunning, selectedProblem, clearProblem } = useStore();
  const [stdin, setStdin] = useState('');
  const [isJudging, setIsJudging] = useState(false);
  const [judgeResults, setJudgeResults] = useState<{
    results: TestCaseResult[];
    allPassed: boolean;
    passedCount: number;
    totalCount: number;
  } | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);

    try {
      const res = await runCode(code, stdin);
      setResult(res);
    } catch (error) {
      setResult({
        success: false,
        output: `오류: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setCode(`#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`);
    setResult(null);
    setJudgeResults(null);
  };

  // 채점 기능
  const handleJudge = async () => {
    if (!selectedProblem?.testCases || selectedProblem.testCases.length === 0) {
      setResult({
        success: false,
        output: '테스트 케이스가 없습니다.',
      });
      return;
    }

    setIsJudging(true);
    setJudgeResults(null);
    setResult(null);

    try {
      const results = await runTestCases(code, selectedProblem.testCases);
      setJudgeResults(results);
    } catch (error) {
      setResult({
        success: false,
        output: `채점 오류: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* 문제 설명 패널 (선택된 문제가 있을 때만 표시) */}
      {selectedProblem && (
        <div className="w-1/2 flex flex-col border-r border-gray-700 bg-[#0a0a0a]">
          {/* 문제 헤더 */}
          <div className="p-4 bg-[#1a1a1a] border-b border-gray-700 flex items-center justify-between">
            <div>
              <span className="text-gray-500 text-sm">#{selectedProblem.number}</span>
              <h2 className="text-xl font-bold text-white">{selectedProblem.title}</h2>
            </div>
            <button
              onClick={clearProblem}
              className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              ✕ 닫기
            </button>
          </div>

          {/* 문제 설명 */}
          <div className="flex-1 overflow-y-auto p-4">
            <pre className="whitespace-pre-wrap text-gray-300 font-sans leading-relaxed">
              {selectedProblem.description}
            </pre>

            {/* 테스트 케이스 */}
            {selectedProblem.testCases && selectedProblem.testCases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">테스트 케이스</h3>
                {selectedProblem.testCases.map((tc, i) => (
                  <div key={i} className="mb-4 bg-[#1a1a1a] rounded-lg p-3 border border-gray-700">
                    <div className="mb-2">
                      <span className="text-gray-500 text-sm">입력</span>
                      <pre className="mt-1 p-2 bg-[#0a0a0a] rounded text-green-400 font-mono text-sm">
                        {tc.input || '(없음)'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">출력</span>
                      <pre className="mt-1 p-2 bg-[#0a0a0a] rounded text-blue-400 font-mono text-sm">
                        {tc.output}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 코드 에디터 영역 */}
      <div className={`flex flex-col ${selectedProblem ? 'w-1/2' : 'w-full'}`}>
        {/* 에디터 */}
        <div className="flex-1 overflow-hidden border-b border-gray-700">
          <CodeMirror
            value={code}
            onChange={setCode}
            extensions={[cpp()]}
            theme={vscodeDark}
            height="100%"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
            }}
          />
        </div>

        {/* stdin 입력 + 툴바 */}
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          {/* stdin 입력 영역 */}
          <div className="mb-3">
            <label className="text-gray-400 text-sm flex items-center gap-2 mb-1">
              📥 입력 (stdin)
              <span className="text-gray-500 text-xs">- scanf 등에서 읽을 데이터</span>
            </label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="예: 3 5&#10;프로그램 실행 시 입력으로 사용됩니다"
              className="w-full h-16 bg-gray-900 text-green-400 font-mono text-sm p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isRunning || isJudging}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Spinner /> 실행 중...
                </>
              ) : (
                <>▶ 실행</>
              )}
            </button>

            {/* 채점 버튼 (문제 선택 시만 표시) */}
            {selectedProblem && (
              <button
                onClick={handleJudge}
                disabled={isRunning || isJudging}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isJudging ? (
                  <>
                    <Spinner /> 채점 중...
                  </>
                ) : (
                  <>✓ 채점</>
                )}
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              초기화
            </button>

            <div className="flex-1" />

            <span className="text-gray-500 text-sm">
              Judge0 CE (무료 50회/일)
            </span>
          </div>
        </div>

        {/* 결과 */}
        <div className="h-64 overflow-y-auto bg-gray-900 p-4">
          {/* 채점 결과 */}
          {judgeResults && (
            <div className="mb-4">
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                📝 채점 결과
                <span className={judgeResults.allPassed ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {judgeResults.allPassed ? '🎉 정답!' : '❌ 오답'}
                </span>
                <span className="text-gray-500">
                  ({judgeResults.passedCount}/{judgeResults.totalCount} 통과)
                </span>
              </h3>

              <div className="space-y-2">
                {judgeResults.results.map((tc, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      tc.passed
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-red-900/20 border-red-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        테스트 {i + 1}: {tc.passed ? '✓ 통과' : '✗ 실패'}
                      </span>
                      {tc.time && <span className="text-gray-500 text-xs">{tc.time}</span>}
                    </div>

                    {!tc.passed && (
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-400">입력: </span>
                          <code className="text-yellow-400">{tc.input || '(없음)'}</code>
                        </div>
                        <div>
                          <span className="text-gray-400">예상: </span>
                          <code className="text-green-400">{tc.expected}</code>
                        </div>
                        <div>
                          <span className="text-gray-400">출력: </span>
                          <code className="text-red-400">{tc.actual}</code>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 일반 실행 결과 */}
          {!judgeResults && (
            <>
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                📤 실행 결과
                {result && (
                  <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                    {result.success ? '✓ 성공' : '✗ 실패'}
                  </span>
                )}
                {result?.time && <span className="text-gray-500">| {result.time}</span>}
                {result?.memory && <span className="text-gray-500">| {result.memory}</span>}
              </h3>

              {result ? (
                <pre className="font-mono text-sm whitespace-pre-wrap">
                  {result.output}
                </pre>
              ) : (
                <p className="text-gray-500">
                  {isRunning ? '코드 실행 중...' : isJudging ? '채점 중...' : '실행 버튼을 눌러 코드를 실행하세요.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 로딩 스피너
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
