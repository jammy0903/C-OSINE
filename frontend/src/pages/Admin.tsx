import { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/ThemeToggle';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Search, Users, Code, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { env } from '../config/env';

const API_URL = env.VITE_API_URL;

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

  // 테마 초기화
  useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
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

  const stats = {
    totalUsers: users.length,
    totalSubmissions: users.reduce((acc, u) => acc + u.totalSubmissions, 0),
    problemsSolved: users.reduce((acc, u) => acc + u.solvedCount, 0),
    activeDrafts: users.reduce((acc, u) => acc + u.draftsCount, 0),
  };

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-12 bg-card/80 backdrop-blur-sm border-b border-border/50 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <a href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </a>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-semibold text-sm">Admin Console</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">
            {users.length} users
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            variant="primary"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            variant="info"
            icon={<Code className="h-5 w-5" />}
          />
          <StatCard
            title="Problems Solved"
            value={stats.problemsSolved}
            variant="success"
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatCard
            title="Active Drafts"
            value={stats.activeDrafts}
            variant="warning"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Search users"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Solved</TableHead>
                    <TableHead className="text-center">Submissions</TableHead>
                    <TableHead className="text-center">Drafts</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, idx) => (
                    <TableRow key={user.id}>
                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">#{idx + 1}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-mono">{user.email}</span>
                      </TableCell>

                      {/* Solved */}
                      <TableCell className="text-center">
                        <Badge variant={user.solvedCount > 0 ? 'default' : 'secondary'} className={user.solvedCount > 0 ? 'bg-emerald-600' : ''}>
                          {user.solvedCount}
                        </Badge>
                      </TableCell>

                      {/* Submissions */}
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">{user.totalSubmissions}</span>
                      </TableCell>

                      {/* Drafts */}
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">{user.draftsCount}</span>
                      </TableCell>

                      {/* Joined */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No users found
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}
