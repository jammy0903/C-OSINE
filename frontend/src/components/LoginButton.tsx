import { useState } from 'react';
import { useStore } from '../stores/store';
import { loginWithGoogle, logout } from '../services/firebase';

// 프사 크기 - 여기서만 관리
const AVATAR_SIZE = 16;

export function LoginButton() {
  const { user } = useStore();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      setError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt=""
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%' }}
          />
        )}
        <span className="text-[11px] text-neutral-400 max-w-[80px] truncate">
          {user.displayName || user.email?.split('@')[0]}
        </span>
        <button
          onClick={handleLogout}
          className="text-[10px] text-neutral-500 hover:text-white"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleLogin}
        className="text-[11px] rounded-full text-white"
        style={{ padding: '7px 14px', backgroundColor: '#3182f6' }}
      >
        로그인
      </button>
      {error && <span className="text-red-400 text-[10px]">{error}</span>}
    </div>
  );
}
