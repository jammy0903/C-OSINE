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
    <div className="flex h-full bg-[#0a0a0a]">
      {/* Problem Panel */}
      {selectedProblem && (
        <div className="w-1/2 flex flex-col border-r border-[#252525]">
          {/* Problem Header */}
          <div className="px-8 py-6 border-b border-[#252525] flex items-center justify-between">
            <div>
              <span className="font-title text-neutral-600 text-xs tracking-[0.2em]">NO. {selectedProblem.number}</span>
              <h2 className="font-body text-xl font-light tracking-wide text-white mt-1">{selectedProblem.title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="font-title text-neutral-500 hover:text-white transition-colors duration-300 text-xs tracking-[0.15em]"
            >
              CLOSE
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
        <div className="px-6 py-4 bg-[#111] border-t border-[#252525] shrink-0">
          {/* Stdin */}
          <div className="mb-4">
            <label className="font-title text-neutral-600 text-xs tracking-[0.15em] mb-2 block">STDIN</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Input data for scanf, etc."
              className="w-full h-14 bg-transparent border-b border-[#252525] font-mono text-sm p-0 pt-2 resize-none focus:border-white transition-colors placeholder-neutral-700"
              style={{ color: '#ffffff' }}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleRun}
              disabled={isRunning || isJudging}
              className="font-title px-6 py-2 text-xs tracking-[0.15em] border border-white bg-white text-black hover:bg-transparent hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all duration-300"
            >
              {isRunning ? 'RUNNING...' : 'RUN'}
            </button>

            {selectedProblem && (
              <button
                onClick={handleJudge}
                disabled={isRunning || isJudging}
                className="font-title px-6 py-2 text-xs tracking-[0.15em] border border-[#252525] text-neutral-400 hover:border-white hover:text-white disabled:opacity-30 transition-all duration-300"
              >
                {isJudging ? 'JUDGING...' : 'JUDGE'}
              </button>
            )}

            <button
              onClick={handleReset}
              className="font-title px-4 py-2 text-xs tracking-[0.15em] text-neutral-500 hover:text-white transition-colors duration-300"
            >
              RESET
            </button>

            <div className="flex-1" />

            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className="font-title text-xs tracking-[0.15em] text-neutral-500 hover:text-white transition-colors duration-300"
            >
              {isTerminalOpen ? 'HIDE OUTPUT' : 'SHOW OUTPUT'}
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
