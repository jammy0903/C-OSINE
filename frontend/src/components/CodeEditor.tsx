import { useState } from 'react';
import { useStore } from '../stores/store';
import { runCode, runTestCases, type TestCaseResult } from '../services/crunner';
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
    <div className="flex h-full bg-bg rounded-xl overflow-hidden">
      {/* Problem Panel */}
      {selectedProblem && (
        <div className="w-1/2 flex flex-col border-r border-border min-w-0 bg-bg-elevated">
          {/* Problem Header */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <span className="text-text-tertiary text-xs font-mono">#{selectedProblem.number}</span>
              <h2 className="text-sm font-medium text-text truncate">{selectedProblem.title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-bg-hover"
            >
              Close
            </button>
          </div>

          {/* Problem Description */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <pre className="whitespace-pre-wrap text-text-secondary leading-relaxed text-sm">
              {selectedProblem.description}
            </pre>

            {/* Test Cases */}
            {selectedProblem.testCases && selectedProblem.testCases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Test Cases</h3>
                {selectedProblem.testCases.map((tc, i) => (
                  <div key={i} className="mb-3 border border-border rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border bg-bg">
                      <span className="text-text-muted text-xs">Input</span>
                      <pre className="mt-1.5 text-text font-mono text-sm">{tc.input || '(none)'}</pre>
                    </div>
                    <div className="p-3 bg-bg">
                      <span className="text-text-muted text-xs">Output</span>
                      <pre className="mt-1.5 text-text font-mono text-sm">{tc.output}</pre>
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
        <div className={`${isTerminalOpen ? 'h-1/2' : 'flex-1'} overflow-auto border-b border-border`}>
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
        <div className="px-5 py-3 bg-bg-elevated border-t border-border shrink-0">
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

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning || isJudging}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>

            {selectedProblem && (
              <button
                onClick={handleJudge}
                disabled={isRunning || isJudging}
                className="px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success-dark disabled:opacity-50 transition-colors"
              >
                {isJudging ? 'Judging...' : 'Judge'}
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-bg-tertiary text-text-secondary text-sm font-medium rounded-lg hover:bg-bg-hover transition-colors"
            >
              Reset
            </button>

            <div className="flex-1" />

            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {isTerminalOpen ? 'Hide Output' : 'Show Output'}
            </button>
          </div>
        </div>

        {/* Output */}
        {isTerminalOpen && (
          <div className="h-1/2 overflow-y-auto bg-bg px-5 py-4">
            {/* Judge Results */}
            {judgeResults && (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Result</span>
                  <span className={`text-sm font-semibold ${judgeResults.allPassed ? 'text-success' : 'text-danger'}`}>
                    {judgeResults.allPassed ? 'ACCEPTED' : 'WRONG ANSWER'}
                  </span>
                  <span className="text-text-muted text-xs">
                    {judgeResults.passedCount}/{judgeResults.totalCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {judgeResults.results.map((tc, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${tc.passed ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${tc.passed ? 'text-success' : 'text-danger'}`}>
                          Test {i + 1}: {tc.passed ? 'PASS' : 'FAIL'}
                        </span>
                        {tc.time && <span className="text-text-muted text-xs">{tc.time}</span>}
                      </div>

                      {!tc.passed && (
                        <div className="text-sm space-y-1 mt-2">
                          <div className="flex gap-3">
                            <span className="text-text-muted text-xs w-16">Input</span>
                            <code className="text-text font-mono text-xs">{tc.input || '(none)'}</code>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-text-muted text-xs w-16">Expected</span>
                            <code className="text-success font-mono text-xs">{tc.expected}</code>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-text-muted text-xs w-16">Actual</span>
                            <code className="text-danger font-mono text-xs">{tc.actual}</code>
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
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Output</span>
                  {result && (
                    <span className={`text-xs font-medium ${result.success ? 'text-success' : 'text-danger'}`}>
                      {result.success ? 'SUCCESS' : 'ERROR'}
                    </span>
                  )}
                  {result?.time && <span className="text-text-muted text-xs">{result.time}</span>}
                </div>

                {result ? (
                  <pre className="font-mono text-sm whitespace-pre-wrap text-text-secondary leading-relaxed p-3 bg-bg-elevated rounded-lg border border-border">
                    {result.output}
                  </pre>
                ) : (
                  <p className="text-text-muted text-sm">
                    {isRunning ? 'Running...' : isJudging ? 'Judging...' : 'Click Run to execute your code.'}
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
