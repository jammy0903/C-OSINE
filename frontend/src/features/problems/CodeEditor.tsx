import { useState } from 'react';
import { useStore } from '../../stores/store';
import { runCode, runTestCases, type TestCaseResult } from '../../services/crunner';
import { createSubmission } from '../../services/submissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, Gavel, RotateCcw, ChevronDown, ChevronUp, X, Check, XCircle } from 'lucide-react';
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
    <div className="flex h-full rounded-xl overflow-hidden">
      {/* Problem Panel */}
      {selectedProblem && (
        <Card className="w-1/2 flex flex-col min-w-0 rounded-none border-r">
          <CardHeader className="py-3 px-5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <Badge variant="outline" className="mb-1 font-mono">
                  #{selectedProblem.number}
                </Badge>
                <CardTitle className="text-sm truncate">{selectedProblem.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                aria-label="Close problem panel"
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
          </CardHeader>

          <Separator />

          <ScrollArea className="flex-1">
            <CardContent className="py-4">
              <pre className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-sm">
                {selectedProblem.description}
              </pre>

              {selectedProblem.testCases && selectedProblem.testCases.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Test Cases
                  </h3>
                  <div className="space-y-3">
                    {selectedProblem.testCases.map((tc, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="p-3 border-b">
                          <span className="text-muted-foreground text-xs">Input</span>
                          <pre className="mt-1.5 font-mono text-sm">{tc.input || '(none)'}</pre>
                        </div>
                        <div className="p-3">
                          <span className="text-muted-foreground text-xs">Output</span>
                          <pre className="mt-1.5 font-mono text-sm">{tc.output}</pre>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      )}

      {/* Code Editor Area */}
      <div className={`flex flex-col ${selectedProblem ? 'w-1/2' : 'w-full'}`}>
        {/* Editor */}
        <div className={`${isTerminalOpen ? 'h-1/2' : 'flex-1'} overflow-auto border-b`}>
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
        <div className="px-5 py-3 bg-card border-t shrink-0">
          {/* Stdin */}
          <div className="mb-3">
            <label htmlFor="stdin-input" className="text-muted-foreground text-xs font-medium mb-1.5 block">
              Input (stdin)
            </label>
            <Input
              id="stdin-input"
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="e.g., 3 5"
              className="font-mono"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRun}
              disabled={isRunning || isJudging}
            >
              <Play className="h-4 w-4 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>

            {selectedProblem && (
              <Button
                onClick={handleJudge}
                disabled={isRunning || isJudging}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Gavel className="h-4 w-4 mr-1" />
                {isJudging ? 'Judging...' : 'Judge'}
              </Button>
            )}

            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            >
              {isTerminalOpen ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Hide Output
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Output
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Output */}
        {isTerminalOpen && (
          <ScrollArea className="h-1/2 px-5 py-4">
            {/* Judge Results */}
            {judgeResults && (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</span>
                  <Badge variant={judgeResults.allPassed ? 'default' : 'destructive'} className={judgeResults.allPassed ? 'bg-emerald-600' : ''}>
                    {judgeResults.allPassed ? 'ACCEPTED' : 'WRONG ANSWER'}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {judgeResults.passedCount}/{judgeResults.totalCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {judgeResults.results.map((tc, i) => (
                    <Card
                      key={i}
                      className={tc.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {tc.passed ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={`text-sm font-medium ${tc.passed ? 'text-emerald-500' : 'text-destructive'}`}>
                              Test {i + 1}: {tc.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          {tc.time && <span className="text-muted-foreground text-xs">{tc.time}</span>}
                        </div>

                        {!tc.passed && (
                          <div className="text-sm space-y-1 mt-2 ml-6">
                            <div className="flex gap-3">
                              <span className="text-muted-foreground text-xs w-16">Input</span>
                              <code className="font-mono text-xs">{tc.input || '(none)'}</code>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-muted-foreground text-xs w-16">Expected</span>
                              <code className="text-emerald-500 font-mono text-xs">{tc.expected}</code>
                            </div>
                            <div className="flex gap-3">
                              <span className="text-muted-foreground text-xs w-16">Actual</span>
                              <code className="text-destructive font-mono text-xs">{tc.actual}</code>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Run Result */}
            {!judgeResults && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Output</span>
                  {result && (
                    <Badge variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-emerald-600' : ''}>
                      {result.success ? 'SUCCESS' : 'ERROR'}
                    </Badge>
                  )}
                  {result?.time && <span className="text-muted-foreground text-xs">{result.time}</span>}
                </div>

                {result ? (
                  <Card>
                    <CardContent className="p-3">
                      <pre className="font-mono text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {result.output}
                      </pre>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {isRunning ? 'Running...' : isJudging ? 'Judging...' : 'Click Run to execute your code.'}
                  </p>
                )}
              </>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
