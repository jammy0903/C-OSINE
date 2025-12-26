/**
 * useCodeEditor Hook
 * 코드 실행, 채점, 리셋 로직 관리
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { runCode, runTestCases, type TestCaseResult } from '@/services/crunner';
import { createSubmission } from '@/services/submissions';

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`;

interface JudgeResults {
  results: TestCaseResult[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

export function useCodeEditor() {
  const navigate = useNavigate();
  const {
    code,
    setCode,
    result,
    setResult,
    isRunning,
    setRunning,
    selectedProblem,
    clearProblem,
    user,
    setSolvedStatus,
    solvedProblems,
    attemptedProblems,
  } = useStore();

  const [stdin, setStdin] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isJudging, setIsJudging] = useState(false);
  const [judgeResults, setJudgeResults] = useState<JudgeResults | null>(null);

  // 문제 패널 닫기
  const handleClose = useCallback(() => {
    clearProblem();
    navigate('/problems');
  }, [clearProblem, navigate]);

  // 코드 실행
  const handleRun = useCallback(async () => {
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
  }, [code, stdin, setRunning, setResult]);

  // 코드 리셋
  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setResult(null);
    setJudgeResults(null);
  }, [setCode, setResult]);

  // 채점
  const handleJudge = useCallback(async () => {
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
  }, [code, selectedProblem, user, solvedProblems, attemptedProblems, setResult, setSolvedStatus]);

  // 터미널 토글
  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, []);

  return {
    // 상태
    code,
    setCode,
    result,
    stdin,
    setStdin,
    isRunning,
    isJudging,
    isTerminalOpen,
    judgeResults,
    selectedProblem,

    // 액션
    handleRun,
    handleReset,
    handleJudge,
    handleClose,
    toggleTerminal,
  };
}
