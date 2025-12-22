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

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      if (user) {
        await registerUser({
          firebaseUid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'User'
        });
        const status = await getUserSolvedStatus(user.uid);
        setSolvedStatus(status.solved, status.attempted);
      } else {
        setSolvedStatus([], []);
      }
    });
    return () => unsubscribe();
  }, [setUser, setSolvedStatus]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'problems', label: 'PROBLEMS' },
    { id: 'memory', label: 'MEMORY' },
    { id: 'chat', label: 'AI TUTOR' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="px-8 py-5 border-b border-[#252525] flex items-center">
        <h1 className="font-logo text-xl tracking-[0.2em] font-bold">
          COSLAB
        </h1>

        {/* Tabs */}
        <nav className="flex gap-8 ml-16">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-title text-sm tracking-[0.15em] py-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-white border-b border-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        <LoginButton />

        <a
          href="https://github.com/jammy0903/C-OSINE"
          target="_blank"
          rel="noopener noreferrer"
          className="font-title text-neutral-500 hover:text-white transition-colors duration-300 ml-8 text-sm tracking-[0.1em]"
        >
          GITHUB
        </a>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'problems' && (
          selectedProblem ? <CodeEditor /> : <ProblemList />
        )}
        {activeTab === 'memory' && <MemoryViz />}
        {activeTab === 'chat' && <Chat />}
      </main>

      {/* Footer */}
      <footer className="px-8 py-3 border-t border-[#252525] flex justify-between items-center">
        <span className="text-neutral-600 text-xs tracking-[0.15em]">
          C & OS LEARNING PLATFORM
        </span>
        <span className="text-neutral-600 text-xs tracking-[0.1em]">
          AI: GROQ
        </span>
      </footer>
    </div>
  );
}
