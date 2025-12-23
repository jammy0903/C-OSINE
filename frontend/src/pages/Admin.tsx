import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name: string;
  firebaseUid: string;
  createdAt: string;
  totalSubmissions: number;
  solvedCount: number;
  draftsCount: number;
}

export function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-white/40 hover:text-white transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <div>
              <h1 className="text-sm font-medium tracking-tight">Admin Console</h1>
              <p className="text-[10px] text-white/30 tracking-wide">COSLAB Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-[10px] font-medium">{users.length} users</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total Users"
            value={users.length}
            icon="users"
            color="blue"
          />
          <StatCard
            label="Total Submissions"
            value={users.reduce((acc, u) => acc + u.totalSubmissions, 0)}
            icon="code"
            color="purple"
          />
          <StatCard
            label="Problems Solved"
            value={users.reduce((acc, u) => acc + u.solvedCount, 0)}
            icon="check"
            color="emerald"
          />
          <StatCard
            label="Active Drafts"
            value={users.reduce((acc, u) => acc + u.draftsCount, 0)}
            icon="file"
            color="amber"
          />
        </div>

        {/* Search & Table */}
        <div className="bg-[#111113] rounded-xl border border-white/5 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <svg width="14" height="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-2.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">Email</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">Solved</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">Subs</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">Drafts</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                            <span className="text-[10px] font-medium text-white/80">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-xs">{user.name}</p>
                            <p className="text-[10px] text-white/30 font-mono">#{idx + 1}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-white/60 font-mono">{user.email}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          user.solvedCount > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/5 text-white/40'
                        }`}>
                          {user.solvedCount}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-xs text-white/60">{user.totalSubmissions}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-xs text-white/40">{user.draftsCount}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-white/40">{formatDate(user.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-white/30 text-xs">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: 'users' | 'code' | 'check' | 'file';
  color: 'blue' | 'purple' | 'emerald' | 'amber';
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
  };

  const icons = {
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    code: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    file: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl border p-3`}>
      <div className="flex items-center justify-between mb-2">
        <svg width="16" height="16" className="opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icons[icon]}
        </svg>
      </div>
      <p className="text-xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
    </div>
  );
}
