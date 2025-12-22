import { useEffect } from 'react';
import { useStore } from './stores/store';
import { Chat } from './components/Chat';
import { CodeEditor } from './components/CodeEditor';
import { MemoryViz } from './components/MemoryViz';
import { LoginButton } from './components/LoginButton';
import { ProblemList } from './components/ProblemList';
import { onAuthChange } from './services/firebase';
import { getUserSolvedStatus } from './services/submissions';
import { registerUser } from './services/users';
import type { TabType } from './types';

export default function App() {
  const { activeTab, setActiveTab, selectedProblem, setUser, setSolvedStatus } = useStore();

  // Firebase 인증 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      if (user) {
        // 백엔드에 사용자 등록
        await registerUser({
          firebaseUid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'User'
        });
        // 풀이 상태 조회
        const status = await getUserSolvedStatus(user.uid);
        setSolvedStatus(status.solved, status.attempted);
      } else {
        setSolvedStatus([], []);
      }
    });
    return () => unsubscribe();
  }, [setUser, setSolvedStatus]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'problems', label: '문제', icon: '📋' },
    { id: 'memory', label: '메모리', icon: '🧠' },
    { id: 'chat', label: 'AI 튜터', icon: '💬' },
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

        {/* 로그인 버튼 */}
        <LoginButton />

        {/* GitHub 링크 */}
        <a
          href="https://github.com/jammy0903/C-OSINE"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors ml-4"
        >
          GitHub
        </a>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'problems' && (
          selectedProblem ? <CodeEditor /> : <ProblemList />
        )}
        {activeTab === 'memory' && <MemoryViz />}
        {activeTab === 'chat' && <Chat />}
      </main>

      {/* 푸터 */}
      <footer className="px-4 py-2 border-t border-gray-700 text-center text-gray-500 text-sm">
        C & OS Learning Platform • AI: Groq
      </footer>
    </div>
  );
}
