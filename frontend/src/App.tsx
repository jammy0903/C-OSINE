import { useEffect } from 'react';
import { useStore } from './stores/store';
import { Chat } from './components/Chat';
import { CodeEditor } from './components/CodeEditor';
import { MemoryViz } from './components/MemoryViz';
import { ProblemList } from './components/ProblemList';
import { onAuthChange, loginWithGoogle, logout } from './services/firebase';
import { getUserSolvedStatus } from './services/submissions';
import { registerUser } from './services/users';
import type { TabType } from './types';

export default function App() {
  const { activeTab, setActiveTab, selectedProblem, user, setUser, setSolvedStatus } = useStore();

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

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'problems',
      label: 'Problems',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'memory',
      label: 'Memory',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      id: 'chat',
      label: 'AI Tutor',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-bg">
      {/* Top Navigation */}
      <header className="h-14 bg-bg-elevated border-b border-border flex items-center justify-between px-6 shrink-0">
        {/* Left - Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-logo text-base font-semibold text-text">COSLAB</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${activeTab === item.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-secondary hover:text-text hover:bg-bg-hover'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right - Search & User */}
        <div className="flex items-center gap-4">
          {/* Current Page Title */}
          {selectedProblem && activeTab === 'problems' && (
            <div className="text-sm text-text-secondary">
              <span className="text-text-tertiary">#{selectedProblem.number}</span>
              <span className="mx-2 text-text-muted">|</span>
              <span className="text-text">{selectedProblem.title}</span>
            </div>
          )}

          {/* User */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-md" />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {(user.displayName || user.email)?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-text-secondary max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary hover:bg-bg-hover rounded-lg text-sm text-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          {activeTab === 'problems' && (
            selectedProblem ? <CodeEditor /> : <ProblemList />
          )}
          {activeTab === 'memory' && <MemoryViz />}
          {activeTab === 'chat' && <Chat />}
        </div>
      </main>
    </div>
  );
}
