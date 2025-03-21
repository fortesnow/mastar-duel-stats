'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleRedirectResult } from '../lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // リダイレクト結果を処理する関数
  const processRedirectResult = async () => {
    console.log('リダイレクト結果の処理を開始');
    try {
      const result = await handleRedirectResult();
      console.log('リダイレクト結果処理完了:', result);

      // ユーザーが認証されていて、ログインページまたはサインアップページにいる場合、duelsページにリダイレクト
      if (result.success && result.user) {
        // リダイレクト元があれば、そこに戻る（なければduelsページへ）
        const redirectTo = result.redirectFrom || '/duels';
        console.log('リダイレクト先:', redirectTo);
        router.push(redirectTo);
      }
    } catch (error) {
      console.error('リダイレクト結果処理エラー:', error);
    }
  };

  useEffect(() => {
    // コンポーネントマウント時にリダイレクト結果を処理
    processRedirectResult();
    
    // ユーザー認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('認証状態変更:', currentUser ? `ユーザー: ${currentUser.uid}` : 'ログアウト状態');
      setFirebaseUser(currentUser);
      
      // Firebaseユーザーをアプリケーションのユーザー型に変換
      if (currentUser) {
        // 完全なUser型オブジェクトを作成
        const appUser: User = {
          id: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          createdAt: new Date(),
          settings: {
            theme: 'dark',
            defaultDeck: ''
          }
        };
        setUser(appUser);
        
        // ユーザーがログイン済みで認証ページにいる場合はduelsにリダイレクト
        if (pathname === '/login' || pathname === '/signup') {
          router.push('/duels');
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider; 