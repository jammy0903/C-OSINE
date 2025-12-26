import { Router, Request, Response, NextFunction } from 'express';
import { runCCode, judgeCode } from './executor';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

export const cRoutes = Router();

/**
 * 코드 필드 검증 미들웨어
 */
function validateCode(req: Request, res: Response, next: NextFunction) {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: 'code 필드가 필요합니다'
    });
  }

  if (code.length > env.CODE_MAX_LENGTH) {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: `코드가 너무 깁니다 (최대 ${env.CODE_MAX_LENGTH}자)`
    });
  }

  next();
}

/**
 * POST /api/c/run
 * C 코드 컴파일 및 실행
 */
cRoutes.post('/run', validateCode, async (req, res) => {
  try {
    const { code, stdin = '', timeout = env.C_RUN_DEFAULT_TIMEOUT } = req.body;
    const timeoutSec = Math.min(Math.max(1, timeout), env.C_RUN_MAX_TIMEOUT);
    const result = await runCCode(code, stdin, timeoutSec);

    res.json({
      success: result.success,
      data: {
        compiled: result.compiled,
        executed: result.executed,
        stdout: result.stdout,
        stderr: result.stderr,
        exit_code: result.exitCode,
        execution_time_ms: result.executionTimeMs
      },
      error: result.error
    });
  } catch (error: any) {
    console.error('C run error:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

/**
 * POST /api/c/judge
 * 문제 채점 (테스트케이스 기반)
 */
cRoutes.post('/judge', validateCode, async (req, res) => {
  try {
    const { code, problemId, firebaseUid, testCases } = req.body;

    // testCases가 직접 제공되면 사용, 아니면 DB에서 조회
    let cases = testCases;

    if (!cases && problemId) {
      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        select: { testCases: true }
      });

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'not_found',
          message: '문제를 찾을 수 없습니다'
        });
      }

      try {
        cases = JSON.parse(problem.testCases) as Array<{ input: string; output: string }>;
      } catch {
        cases = [];
      }
    }

    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: '테스트케이스가 필요합니다'
      });
    }

    // 채점 실행
    const result = await judgeCode(code, cases, env.C_JUDGE_TIMEOUT);

    // 제출 기록 저장 (로그인된 사용자만)
    if (firebaseUid && problemId) {
      try {
        const user = await prisma.user.findUnique({
          where: { firebaseUid }
        });

        if (user) {
          await prisma.submission.create({
            data: {
              userId: user.id,
              problemId,
              code,
              verdict: result.verdict,
              executionTime: result.executionTimeMs
            }
          });
        }
      } catch (dbError) {
        console.error('Failed to save submission:', dbError);
        // 제출 저장 실패해도 채점 결과는 반환
      }
    }

    res.json({
      success: result.success,
      data: {
        verdict: result.verdict,
        passed: result.passed,
        total: result.total,
        execution_time_ms: result.executionTimeMs,
        details: result.details
      }
    });
  } catch (error: any) {
    console.error('Judge error:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error.message
    });
  }
});
