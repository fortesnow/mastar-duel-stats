'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { formatUser, handleRedirectResult } from '../lib/auth';
import { User } from '../types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: Partial<User> | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // リダイレクト認証結果を処理
  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        await handleRedirectResult();
        // リダイレクト結果の処理後、onAuthStateChangedがユーザー状態を更新します
      } catch (error) {
        console.error('リダイレクト認証処理エラー:', error);
        setLoading(false);
      }
    };
    
    processRedirectResult();
  }, []);

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // ユーザーがログインしている場合
        setUser(formatUser(firebaseUser));
      } else {
        // ユーザーがログアウトしている場合
        setUser(null);
        
        // 保護されたルートへのアクセスをリダイレクト
        if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 