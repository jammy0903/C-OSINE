/**
 * Judge0 CE API - C 코드 실행
 * 무료: 50회/일
 * https://rapidapi.com/judge0-official/api/judge0-ce
 */

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';

// C (GCC 9.2.0) = language_id 50
const C_LANGUAGE_ID = 50;

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

export async function runCode(
  code: string,
  stdin = ''
): Promise<{
  success: boolean;
  output: string;
  time?: string;
  memory?: string;
}> {
  // API 키 체크
  if (!API_KEY) {
    return {
      success: false,
      output: '⚠️ VITE_RAPIDAPI_KEY가 설정되지 않았습니다.\n.env 파일에 API 키를 추가하세요.',
    };
  }

  try {
    // 코드 제출 (wait=true로 결과까지 한번에)
    const response = await fetch(`${JUDGE0_URL}/submissions?wait=true&base64_encoded=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: btoa(unescape(encodeURIComponent(code))), // UTF-8 safe base64
        language_id: C_LANGUAGE_ID,
        stdin: stdin ? btoa(stdin) : '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        output: `API 오류 (${response.status}): ${errorText}`,
      };
    }

    const result: Judge0Response = await response.json();

    // 결과 디코딩
    const stdout = result.stdout ? decodeBase64(result.stdout) : '';
    const stderr = result.stderr ? decodeBase64(result.stderr) : '';
    const compileOutput = result.compile_output ? decodeBase64(result.compile_output) : '';

    // 상태 체크 (3 = Accepted)
    const success = result.status?.id === 3;

    // 출력 조합
    let output = '';
    if (compileOutput) {
      output = `[컴파일 오류]\n${compileOutput}`;
    } else if (stderr) {
      output = stdout ? `${stdout}\n[stderr]\n${stderr}` : stderr;
    } else if (stdout) {
      output = stdout;
    } else {
      output = success ? '(출력 없음)' : `실행 실패: ${result.status?.description || 'Unknown'}`;
    }

    return {
      success,
      output,
      time: result.time ? `${result.time}s` : undefined,
      memory: result.memory ? `${result.memory} KB` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      output: `네트워크 오류: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

// Base64 디코딩 (UTF-8 지원)
function decodeBase64(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return atob(str);
  }
}

// 테스트 케이스 결과 타입
export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  time?: string;
  memory?: string;
  error?: string;
}

// 출력 비교 (공백/개행 정규화)
function normalizeOutput(str: string): string {
  return str.trim().replace(/\r\n/g, '\n').replace(/\s+$/gm, '');
}

// 테스트 케이스 채점
export async function runTestCases(
  code: string,
  testCases: { input: string; output: string }[]
): Promise<{
  results: TestCaseResult[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}> {
  const results: TestCaseResult[] = [];

  for (const tc of testCases) {
    const result = await runCode(code, tc.input);

    const actual = normalizeOutput(result.output);
    const expected = normalizeOutput(tc.output);
    const passed = result.success && actual === expected;

    results.push({
      input: tc.input,
      expected: tc.output,
      actual: result.output,
      passed,
      time: result.time,
      memory: result.memory,
      error: result.success ? undefined : result.output,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;

  return {
    results,
    allPassed: passedCount === testCases.length,
    passedCount,
    totalCount: testCases.length,
  };
}
