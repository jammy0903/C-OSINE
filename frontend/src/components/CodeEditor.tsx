import { useStore } from '../stores/store';
import { runCode } from '../services/judge0';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

export function CodeEditor() {
  const { code, setCode, result, setResult, isRunning, setRunning } = useStore();

  const handleRun = async () => {
    setRunning(true);
    setResult(null);

    try {
      const res = await runCode(code);
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
  };

  return (
    <div className="flex flex-col h-full">
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

      {/* 툴바 */}
      <div className="p-3 bg-gray-800 flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={isRunning}
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

      {/* 결과 */}
      <div className="h-48 overflow-y-auto bg-gray-900 p-4">
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
            {isRunning ? '코드 실행 중...' : '실행 버튼을 눌러 코드를 실행하세요.'}
          </p>
        )}
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
