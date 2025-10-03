'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../auth';
import { apiClient } from '../../api-client';

interface User {
  id: string;
  name: string;
  role: string;
  preferred_lang: string;
}

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Load users from database on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setError('');
        
        const response = await apiClient.getUsers();
        if (response.success && response.data) {
          setUsers(response.data);
          console.log(`Loaded ${response.data.length} users from database`);
        } else {
          throw new Error(response.error || 'Failed to load users');
        }
      } catch (err) {
        console.error('Failed to load users:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users from database');
        
        // Fallback to demo users if API fails
        const fallbackUsers: User[] = [
          { id: '1', name: 'Admin User', role: 'admin', preferred_lang: 'en' },
          { id: '2', name: 'Ana Rodriguez', role: 'patient', preferred_lang: 'es' },
          { id: '3', name: 'Ben Smith', role: 'nurse', preferred_lang: 'en' }
        ];
        setUsers(fallbackUsers);
        setError('Using demo users (database not available)');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleLogin = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For demo purposes, we'll simulate login by setting the user directly
      // In a real app, this would make an API call to authenticate
      const loginResult = await authService.login(selectedUser.id, 'demo-password');
      
      if (loginResult.success) {
        console.log('Login successful, redirecting...');
        
        // Redirect based on user role
        if (selectedUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/chat');
        }
      } else {
        throw new Error(loginResult.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'text-purple-400';
      case 'patient': return 'text-blue-400';
      case 'nurse': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'patient': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'nurse': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4"
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Select your account to continue</p>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="ml-2 text-gray-300">Loading users...</span>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {users.map((user) => (
                <motion.button
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedUser?.id === user.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:border-indigo-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-sm text-gray-400">
                        Language: {user.preferred_lang.toUpperCase()}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${getRoleBadge(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4"
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm">{error}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={!selectedUser || loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing In...' : 'Sign In'}
            </motion.button>
          </>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Demo Mode - Select any user to continue
          </p>
        </div>
      </motion.div>
    </div>
  );
} 