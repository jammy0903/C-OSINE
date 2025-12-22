import { useState } from 'react';
import { useStore } from '../stores/store';
import { runCode, runTestCases, type TestCaseResult } from '../services/judge0';
import { createSubmission } from '../services/submissions';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

export function CodeEditor() {
  const { code, setCode, result, setResult, isRunning, setRunning, selectedProblem, clearProblem, setActiveTab, user, setSolvedStatus, solvedProblems, attemptedProblems } = useStore();

  const handleClose = () => {
    clearProblem();
    setActiveTab('problems');
  };

  const [stdin, setStdin] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
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
        output: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
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

  const handleJudge = async () => {
    if (!selectedProblem?.testCases || selectedProblem.testCases.length === 0) {
      setResult({ success: false, output: 'No test cases available.' });
      return;
    }

    setIsJudging(true);
    setJudgeResults(null);
    setResult(null);

    try {
      const results = await runTestCases(code, selectedProblem.testCases);
      setJudgeResults(results);

      if (user) {
        const verdict = results.allPassed ? 'accepted' : 'wrong_answer';
        await createSubmission({
          firebaseUid: user.uid,
          problemId: selectedProblem.id,
          code,
          verdict
        });

        if (results.allPassed && !solvedProblems.includes(selectedProblem.id)) {
          setSolvedStatus(
            [...solvedProblems, selectedProblem.id],
            attemptedProblems.filter(id => id !== selectedProblem.id)
          );
        } else if (!results.allPassed && !solvedProblems.includes(selectedProblem.id) && !attemptedProblems.includes(selectedProblem.id)) {
          setSolvedStatus(solvedProblems, [...attemptedProblems, selectedProblem.id]);
        }
      }
    } catch (error) {
      setResult({
        success: false,
        output: `Judge error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <div className="flex h-full bg-[#161618] overflow-hidden">
      {/* Problem Panel */}
      {selectedProblem && (
        <div className="w-1/2 flex flex-col border-r border-[#1a1a1a] min-w-0">
          {/* Problem Header */}
          <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-neutral-600 text-[10px]">#{selectedProblem.number}</span>
              <h2 className="text-base font-light text-white truncate">{selectedProblem.title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-[10px] text-neutral-500 hover:text-white ml-2 shrink-0"
            >
              닫기
            </button>
          </div>

          {/* Problem Description */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <pre className="font-body whitespace-pre-wrap text-neutral-400 leading-relaxed text-sm">
              {selectedProblem.description}
            </pre>

            {/* Test Cases */}
            {selectedProblem.testCases && selectedProblem.testCases.length > 0 && (
              <div className="mt-8">
                <h3 className="font-title text-xs tracking-[0.2em] text-neutral-500 mb-4 uppercase">TEST CASES</h3>
                {selectedProblem.testCases.map((tc, i) => (
                  <div key={i} className="mb-4 border border-[#252525] p-4">
                    <div className="mb-3">
                      <span className="font-title text-neutral-600 text-xs tracking-wide">INPUT</span>
                      <pre className="mt-2 p-3 bg-[#111] text-neutral-300 font-mono text-sm">
                        {tc.input || '(none)'}
                      </pre>
                    </div>
                    <div>
                      <span className="font-title text-neutral-600 text-xs tracking-wide">OUTPUT</span>
                      <pre className="mt-2 p-3 bg-[#111] text-neutral-300 font-mono text-sm">
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

      {/* Code Editor Area */}
      <div className={`flex flex-col ${selectedProblem ? 'w-1/2' : 'w-full'}`}>
        {/* Editor */}
        <div className={`${isTerminalOpen ? 'h-1/2' : 'flex-1'} overflow-auto border-b border-[#252525]`}>
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

        {/* Toolbar */}
        <div className="px-4 py-3 bg-[#111] border-t border-[#1a1a1a] shrink-0">
          {/* Stdin */}
          <div className="mb-3">
            <label className="text-neutral-500 text-[10px] mb-1 block">입력 (stdin)</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="scanf 입력값..."
              className="w-full h-10 bg-[#1a1a1a] rounded-lg font-mono text-xs p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#3182f6] placeholder-neutral-600 text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isRunning || isJudging}
              className="text-[11px] rounded-full text-white disabled:opacity-40"
              style={{ padding: '8px 18px', backgroundColor: '#3182f6' }}
            >
              {isRunning ? '실행중...' : '실행'}
            </button>

            {selectedProblem && (
              <button
                onClick={handleJudge}
                disabled={isRunning || isJudging}
                className="text-[11px] rounded-full text-white disabled:opacity-40"
                style={{ padding: '8px 18px', backgroundColor: '#20c997' }}
              >
                {isJudging ? '채점중...' : '채점'}
              </button>
            )}

            <button
              onClick={handleReset}
              className="text-[11px] rounded-full hover:text-white"
              style={{ padding: '8px 16px', backgroundColor: '#252530', color: '#999' }}
            >
              초기화
            </button>

            <div className="flex-1" />

            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className="text-[10px] text-neutral-500 hover:text-white"
            >
              {isTerminalOpen ? '출력 숨기기' : '출력 보기'}
            </button>
          </div>
        </div>

        {/* Output */}
        {isTerminalOpen && (
          <div className="h-1/2 overflow-y-auto bg-[#0a0a0a] px-6 py-4">
            {/* Judge Results */}
            {judgeResults && (
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-title text-xs tracking-[0.2em] text-neutral-500">RESULT</span>
                  <span className={`font-title text-sm tracking-wide ${judgeResults.allPassed ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                    {judgeResults.allPassed ? 'ACCEPTED' : 'WRONG ANSWER'}
                  </span>
                  <span className="text-neutral-600 text-xs">
                    {judgeResults.passedCount}/{judgeResults.totalCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {judgeResults.results.map((tc, i) => (
                    <div
                      key={i}
                      className={`p-4 border ${tc.passed ? 'border-[#4ade80]/30 bg-[#4ade80]/5' : 'border-[#f87171]/30 bg-[#f87171]/5'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-title text-xs tracking-wide ${tc.passed ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                          TEST {i + 1}: {tc.passed ? 'PASS' : 'FAIL'}
                        </span>
                        {tc.time && <span className="text-neutral-600 text-xs">{tc.time}</span>}
                      </div>

                      {!tc.passed && (
                        <div className="text-sm space-y-2 mt-3">
                          <div className="flex gap-4">
                            <span className="font-title text-neutral-600 text-xs w-16">INPUT</span>
                            <code className="text-neutral-400">{tc.input || '(none)'}</code>
                          </div>
                          <div className="flex gap-4">
                            <span className="font-title text-neutral-600 text-xs w-16">EXPECTED</span>
                            <code className="text-[#4ade80]">{tc.expected}</code>
                          </div>
                          <div className="flex gap-4">
                            <span className="font-title text-neutral-600 text-xs w-16">ACTUAL</span>
                            <code className="text-[#f87171]">{tc.actual}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Run Result */}
            {!judgeResults && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-title text-xs tracking-[0.2em] text-neutral-500">OUTPUT</span>
                  {result && (
                    <span className={`font-title text-xs tracking-wide ${result.success ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                      {result.success ? 'SUCCESS' : 'ERROR'}
                    </span>
                  )}
                  {result?.time && <span className="text-neutral-600 text-xs">{result.time}</span>}
                </div>

                {result ? (
                  <pre className="font-mono text-sm whitespace-pre-wrap text-neutral-300 leading-relaxed">
                    {result.output}
                  </pre>
                ) : (
                  <p className="font-body text-neutral-600 text-sm tracking-wide">
                    {isRunning ? 'Running...' : isJudging ? 'Judging...' : '실행 버튼을 눌러 코드를 실행하세요.'}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
