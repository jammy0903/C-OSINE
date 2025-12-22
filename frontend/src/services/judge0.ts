/**
 * C 코드 실행 API (자체 백엔드)
 * Judge0 CE 대체 - 무제한, 빠른 응답
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 테스트 케이스 결과 타입 (기존 유지)
export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  time?: string;
}

/**
 * C 코드 실행 (기존 시그니처 유지)
 */
export async function runCode(
  code: string,
  stdin = ''
): Promise<{
  success: boolean;
  output: string;
  time?: string;
  memory?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        stdin,
        timeout: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        output: errorData.detail || `API 오류 (${response.status})`,
      };
    }

    const result = await response.json();

    return {
      success: result.success,
      output: result.output || (result.success ? '(출력 없음)' : result.error || '실행 실패'),
    };
  } catch (error) {
    return {
      success: false,
      output: `네트워크 오류: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * 테스트 케이스 채점 (기존 시그니처 유지)
 */
export async function runTestCases(
  code: string,
  testCases: { input: string; output: string }[]
): Promise<{
  results: TestCaseResult[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}> {
  try {
    const response = await fetch(`${API_URL}/api/judge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        testCases,
        timeout: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // 에러 시 모든 테스트케이스 실패로 처리
      return {
        results: testCases.map((tc) => ({
          input: tc.input,
          expected: tc.output,
          actual: errorData.detail || 'API 오류',
          passed: false,
          error: errorData.detail,
        })),
        allPassed: false,
        passedCount: 0,
        totalCount: testCases.length,
      };
    }

    return await response.json();
  } catch (error) {
    // 네트워크 오류
    return {
      results: testCases.map((tc) => ({
        input: tc.input,
        expected: tc.output,
        actual: error instanceof Error ? error.message : 'Unknown error',
        passed: false,
        error: 'network_error',
      })),
      allPassed: false,
      passedCount: 0,
      totalCount: testCases.length,
    };
  }
}
