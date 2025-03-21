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
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  authError: null
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [redirectProcessed, setRedirectProcessed] = useState(false);

  // リダイレクト結果を処理する関数
  const processRedirectResult = async () => {
    // すでに処理済みの場合はスキップ
    if (redirectProcessed) return;
    
    console.log('リダイレクト結果の処理を開始');
    try {
      setRedirectProcessed(true); // 処理済みフラグを立てる
      const result = await handleRedirectResult();
      console.log('リダイレクト結果処理完了:', result);

      if (result.error) {
        setAuthError(result.error);
      }

      // ユーザーが認証されている場合
      if (result.success && result.user) {
        // リダイレクト元があれば、そこに戻る（なければduelsページへ）
        const redirectTo = result.redirectFrom || '/duels';
        console.log('認証成功後のリダイレクト先:', redirectTo);
        
        // 少し遅延を入れてリダイレクト（認証状態が更新される時間を確保）
        setTimeout(() => {
          router.push(redirectTo);
        }, 500);
      }
    } catch (error) {
      console.error('リダイレクト結果処理エラー:', error);
      setAuthError('認証処理中にエラーが発生しました。もう一度お試しください。');
    }
  };

  useEffect(() => {
    console.log('AuthProvider マウント - 現在のパス:', pathname);
    
    let authUnsubscribe: () => void;
    
    // 認証状態の監視を設定
    const setupAuthListener = () => {
      console.log('認証状態の監視を設定');
      
      authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
            console.log('認証ページにログイン済みユーザー - リダイレクト実行');
            router.push('/duels');
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      });
    };
    
    // 初期化処理
    const initialize = async () => {
      try {
        // 1. まずリダイレクト結果を処理
        await processRedirectResult();
        
        // 2. 認証リスナーをセットアップ
        setupAuthListener();
      } catch (err) {
        console.error('初期化エラー:', err);
        setLoading(false);
        setAuthError('認証システムの初期化に失敗しました。');
      }
    };
    
    initialize();
    
    // クリーンアップ関数
    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider; 