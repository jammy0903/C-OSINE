/**
 * Router Configuration
 * URL 기반 라우팅 + Protected Routes
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './layouts';
import { Chat, CodeEditor, ProblemList, ProcessMemoryVisualization } from './features';
import { Admin } from './pages/Admin';
import { useStore } from './stores/store';
import { loginWithGoogle, onAuthChange } from './services/firebase';
import { getUserSolvedStatus } from './services/submissions';
import { registerUser, getUserRole } from './services/users';
import { useTheme } from './hooks/useTheme';

/**
 * 인증 상태 초기화 컴포넌트
 * 모든 라우트에서 공유되는 인증 로직
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSolvedStatus, setIsAdmin } = useStore();

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

  return <>{children}</>;
}

/**
 * 메인 레이아웃 래퍼
 * AuthProvider + MainLayout + Outlet
 */
function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </AuthProvider>
  );
}

/**
 * Problems 페이지
 * 선택된 문제가 있으면 CodeEditor, 없으면 ProblemList
 */
function ProblemsPage() {
  const { selectedProblem } = useStore();
  return selectedProblem ? <CodeEditor /> : <ProblemList />;
}

/**
 * Admin 전용 보호 라우트
 * - 로그인 안됨 → Google 로그인 팝업
 * - 로그인됨 but Admin 아님 → /problems로 리다이렉트
 * - Admin → Admin 페이지 렌더링
 */
function AdminRoute() {
  const { user, isAdmin } = useStore();

  // 로그인 안됨 → 로그인 시도
  if (!user) {
    // 로그인 팝업 트리거 (비동기)
    loginWithGoogle().catch(console.error);
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">로그인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인됨 but Admin 아님 → 홈으로
  if (!isAdmin) {
    return <Navigate to="/problems" replace />;
  }

  // Admin 페이지 렌더링
  return (
    <AuthProvider>
      <Admin />
    </AuthProvider>
  );
}

/**
 * 라우터 설정
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/problems" replace /> },
      { path: 'problems', element: <ProblemsPage /> },
      { path: 'memory', element: <ProcessMemoryVisualization /> },
      { path: 'chat', element: <Chat /> },
    ],
  },
  { path: '/admin', element: <AdminRoute /> },
  // 하위호환: /manajammy → /admin
  { path: '/manajammy', element: <Navigate to="/admin" replace /> },
]);
