import { useState } from 'react';
import { useStore } from '../stores/store';
import { loginWithGoogle, logout } from '../services/firebase';

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
      <div className="flex items-center gap-4">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="font-body text-xs tracking-wide text-neutral-400">
          {user.displayName || user.email}
        </span>
        <button
          onClick={handleLogout}
          className="font-title text-xs tracking-[0.15em] text-neutral-500 hover:text-white transition-colors duration-300"
        >
          LOGOUT
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleLogin}
        className="font-title px-4 py-2 text-xs tracking-[0.15em] border border-[#252525] text-neutral-400 hover:border-white hover:text-white transition-all duration-300"
      >
        LOGIN
      </button>
      {error && (
        <span className="text-neutral-500 text-xs">{error}</span>
      )}
    </div>
  );
}
