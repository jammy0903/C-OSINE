import { useStore } from './stores/store';
import { Chat } from './components/Chat';
import { CodeEditor } from './components/CodeEditor';
import { MemoryViz } from './components/MemoryViz';
import type { TabType } from './types';

export default function App() {
  const { activeTab, setActiveTab } = useStore();

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'chat', label: 'AI 튜터', icon: '💬' },
    { id: 'code', label: '코드 실행', icon: '💻' },
    { id: 'memory', label: '메모리', icon: '🧠' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* 헤더 */}
      <header className="px-4 py-3 border-b border-gray-700 flex items-center gap-4">
        <h1 className="text-xl font-bold">
          <span className="text-blue-400">C</span>
          <span className="text-gray-400">·</span>
          <span className="text-purple-400">OS</span>
          <span className="text-gray-500 text-sm ml-2">LAB</span>
        </h1>

        {/* 탭 */}
        <nav className="flex gap-1 ml-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* GitHub 링크 */}
        <a
          href="https://github.com/jammy0903/C-OSINE"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          GitHub
        </a>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'code' && <CodeEditor />}
        {activeTab === 'memory' && <MemoryViz />}
      </main>

      {/* 푸터 */}
      <footer className="px-4 py-2 border-t border-gray-700 text-center text-gray-500 text-sm">
        C & OS Learning Platform • Free APIs: Groq + Judge0
      </footer>
    </div>
  );
}
