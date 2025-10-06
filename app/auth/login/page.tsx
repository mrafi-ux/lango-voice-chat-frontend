'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Loader2, User, ArrowRight } from 'lucide-react';
import { authService } from '../../auth';
import { Button } from '../../../src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../src/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
     
      authService.clearToken();
      
      const result = await authService.login(email, password);
    
      if (result.success && result.user && result.token) {
        
        
        // Double-check that the token was set correctly
        authService.setToken(result.token);
        authService.setCurrentUser(result.user);
        
    
        // Add a small delay to ensure state is saved
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force a full page reload to ensure all state is properly initialized
        if (result.user.role === 'admin') {
         
          window.location.href = '/admin';
        } else {
       
          window.location.href = '/conversations';
        }
      } else {
        
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center"
            >
              <User className="w-10 h-10 text-white" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
           
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-input rounded-md py-2 pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none">Password</label>
                
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-input rounded-md py-2 pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full mt-4 bg-primary/90 hover:bg-primary/90 group"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {loading ? 'Signing In...' : 'Sign In'}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account?{' '}
                <Link 
                  href="/auth/register" 
                  className="font-medium text-primary/80 hover:text-primary transition-colors "
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}