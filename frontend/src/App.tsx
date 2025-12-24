import { useEffect } from 'react';
import { useStore } from './stores/store';
import { Chat } from './components/Chat';
import { CodeEditor } from './components/CodeEditor';
import { ProcessMemoryVisualization } from './components/memory-viz';
import { ProblemList } from './components/ProblemList';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
import { onAuthChange, loginWithGoogle, logout } from './services/firebase';
import { getUserSolvedStatus } from './services/submissions';
import { registerUser, getUserRole } from './services/users';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Cpu, MessageCircle, LogOut } from 'lucide-react';
import type { TabType } from './types';

export default function App() {
  const { activeTab, setActiveTab, selectedProblem, user, setUser, setSolvedStatus, isAdmin, setIsAdmin } = useStore();

  // 테마 초기화 (훅 호출로 자동 적용)
  useTheme();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      if (user) {
        await registerUser({
          firebaseUid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'User'
        });
        const [status, roleInfo] = await Promise.all([
          getUserSolvedStatus(user.uid),
          getUserRole(user.uid)
        ]);
        setSolvedStatus(status.solved, status.attempted);
        setIsAdmin(roleInfo.isAdmin);
      } else {
        setSolvedStatus([], []);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [setUser, setSolvedStatus, setIsAdmin]);

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'problems',
      label: 'Problems',
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      id: 'memory',
      label: 'Memory',
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      id: 'chat',
      label: 'AI Tutor',
      icon: <MessageCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="h-14 bg-card border-b flex items-center justify-between px-4 sm:px-6 shrink-0">
        {/* Left - Logo */}
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-logo text-base font-semibold tracking-wide hidden sm:inline">OSINE</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                aria-current={activeTab === item.id ? 'page' : undefined}
                className="h-8 px-3"
              >
                {item.icon}
                <span className="hidden sm:inline ml-1.5">{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* Right - Theme & User */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Current Page Title - hidden on mobile */}
          {selectedProblem && activeTab === 'problems' && (
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <Badge variant="outline" className="mr-2 font-mono">
                #{selectedProblem.number}
              </Badge>
              <span className="text-foreground">{selectedProblem.title}</span>
            </div>
          )}

          {/* User */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.photoURL || undefined} alt="" />
                  <AvatarFallback className="text-xs">
                    {(user.displayName || user.email)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm text-muted-foreground max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              {isAdmin && (
                <a
                  href="/manajammy"
                  className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium"
                  aria-label="Admin console"
                >
                  Admin
                </a>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                aria-label="Logout"
              >
                <span className="hidden sm:inline">Logout</span>
                <LogOut className="sm:hidden h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={loginWithGoogle}
              aria-label="Sign in with Google"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="mr-1.5">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          {activeTab === 'problems' && (
            selectedProblem ? <CodeEditor /> : <ProblemList />
          )}
          {activeTab === 'memory' && <ProcessMemoryVisualization />}
          {activeTab === 'chat' && <Chat />}
        </div>
      </main>
    </div>
  );
}
