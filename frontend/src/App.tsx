import { useEffect } from 'react';
import { useStore } from './stores/store';
import { MainLayout } from './layouts';
import { Chat, CodeEditor, ProblemList, ProcessMemoryVisualization } from './features';
import { useTheme } from './hooks/useTheme';
import { onAuthChange } from './services/firebase';
import { getUserSolvedStatus } from './services/submissions';
import { registerUser, getUserRole } from './services/users';

export default function App() {
  const { activeTab, selectedProblem, setUser, setSolvedStatus, setIsAdmin } = useStore();

  // 테마 초기화
  useTheme();

  // 인증 상태 감시
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

  return (
    <MainLayout>
      {activeTab === 'problems' && (
        selectedProblem ? <CodeEditor /> : <ProblemList />
      )}
      {activeTab === 'memory' && <ProcessMemoryVisualization />}
      {activeTab === 'chat' && <Chat />}
    </MainLayout>
  );
}
