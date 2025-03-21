'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleRedirectResult } from '../lib/auth';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // リダイレクト結果の処理
    console.log('リダイレクト結果の処理を開始');
    handleRedirectResult().then((result) => {
      console.log('リダイレクト結果処理完了:', result);

      // ユーザーが認証されていて、ログインページまたはサインアップページにいる場合、duelsページにリダイレクト
      if (result.success && result.user && (
        router.pathname === '/login' || 
        router.pathname === '/signup'
      )) {
        router.push('/duels');
      }
    }).catch(error => {
      console.error('リダイレクト結果処理エラー:', error);
    });

    // ユーザー認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 