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
    <div className="h-screen flex flex-col bg-[#161618] text-white overflow-hidden">
      {/* Header - Ultra Minimal */}
      <header className="px-6 py-1.5 border-b border-[#1a1a1a] flex items-center">
        <h1 className="font-logo text-sm tracking-[0.2em] font-bold">
          COSLAB
        </h1>

        {/* Tabs */}
        <nav className="flex gap-6 ml-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-title text-xs tracking-[0.15em] py-1.5 ${activeTab === tab.id ? 'text-white' : 'text-neutral-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex-1" />
        <LoginButton />
        <a href="https://github.com/jammy0903/C-OSINE" target="_blank" rel="noopener noreferrer" className="font-title text-neutral-600 hover:text-white ml-6 text-xs tracking-[0.1em]">
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

    </div>
  );
}
