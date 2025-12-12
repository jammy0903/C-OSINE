import { useState } from 'react';
import { useStore } from '../stores/store';

export function MemoryViz() {
  const { memBlocks, malloc, free, resetMemory } = useStore();
  const [name, setName] = useState('');
  const [size, setSize] = useState(64);
  const [error, setError] = useState('');

  const handleMalloc = () => {
    setError('');

    // 유효성 검사
    if (!name.trim()) {
      setError('변수명을 입력하세요');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      setError('유효한 C 변수명을 입력하세요');
      return;
    }
    if (memBlocks.some((b) => b.name === name)) {
      setError('이미 존재하는 변수명입니다');
      return;
    }
    if (size < 1 || size > 1024) {
      setError('크기는 1~1024 사이여야 합니다');
      return;
    }

    malloc(name.trim(), size);
    setName('');
  };

  const totalAllocated = memBlocks.reduce((sum, b) => sum + b.size, 0);

  return (
    <div className="flex h-full">
      {/* 왼쪽: 컨트롤 패널 */}
      <div className="w-72 p-4 border-r border-gray-700 flex flex-col">
        <h2 className="text-lg font-bold mb-4">🧠 메모리 시뮬레이터</h2>

        {/* malloc 폼 */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">변수명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMalloc()}
              placeholder="ptr1"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              크기 (bytes): {size}
            </label>
            <input
              type="range"
              min="1"
              max="256"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>256</span>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleMalloc}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            malloc({size})
          </button>

          <button
            onClick={resetMemory}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            전체 초기화
          </button>
        </div>

        {/* 할당된 블록 목록 */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm text-gray-400 mb-2">
            할당된 블록 ({memBlocks.length}개, {totalAllocated} bytes)
          </h3>

          {memBlocks.length === 0 ? (
            <p className="text-gray-500 text-sm">할당된 메모리가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {memBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between bg-gray-800 rounded p-2"
                >
                  <div>
                    <span className="font-mono text-purple-400">{block.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {block.size}B
                    </span>
                  </div>
                  <button
                    onClick={() => free(block.name)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1 hover:bg-red-900/30 rounded transition-colors"
                  >
                    free()
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 코드 미리보기 */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <h4 className="text-xs text-gray-500 mb-1">C 코드</h4>
          <pre className="text-xs font-mono text-green-400">
            {memBlocks.length > 0 ? (
              memBlocks.map((b) => `${b.name} = malloc(${b.size});`).join('\n')
            ) : (
              '// malloc() 해보세요!'
            )}
          </pre>
        </div>
      </div>

      {/* 오른쪽: 시각화 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">📊 Heap Memory</h3>

        {memBlocks.length === 0 ? (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-4xl mb-4">📦</p>
            <p>왼쪽에서 malloc()을 실행하면</p>
            <p>여기에 메모리 블록이 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memBlocks.map((block) => (
              <div
                key={block.id}
                className="memory-block memory-block-enter"
              >
                {/* 메모리 블록 */}
                <div
                  className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg p-4 shadow-lg"
                  style={{
                    width: `${Math.min(100, Math.max(30, block.size / 2.5))}%`,
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-lg">{block.name}</span>
                    <span className="text-purple-200 text-sm">
                      {block.size} bytes
                    </span>
                  </div>
                  <div className="text-purple-200 text-sm font-mono">
                    주소: 0x{block.address.toString(16).toUpperCase()}
                  </div>
                </div>

                {/* 화살표 (포인터 표시) */}
                <div className="ml-4 mt-1 text-gray-500 text-sm">
                  ↳ {block.name} = (void*)0x{block.address.toString(16)}
                </div>
              </div>
            ))}

            {/* 메모리 레이아웃 요약 */}
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm text-gray-400 mb-3">메모리 레이아웃</h4>
              <div className="flex gap-1 h-8 rounded overflow-hidden">
                {memBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="bg-purple-600 flex items-center justify-center text-xs"
                    style={{
                      width: `${(block.size / totalAllocated) * 100}%`,
                      minWidth: '20px',
                    }}
                    title={`${block.name}: ${block.size}B`}
                  >
                    {block.name}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                총 {totalAllocated} bytes 할당됨
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
