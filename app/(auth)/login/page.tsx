'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn, signInWithGoogle } from '../../../lib/auth';
import { FirebaseError } from 'firebase/app';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // モバイルデバイス検出
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof window !== 'undefined' ? window.navigator.userAgent : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await signIn(email, password);
      router.push('/duels');
    } catch (err) {
      console.error('ログインエラー:', err);
      
      if (err instanceof FirebaseError) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else {
          setError('ログイン中にエラーが発生しました。もう一度お試しください');
        }
      } else {
        setError('予期せぬエラーが発生しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      
      // モバイルデバイスではリダイレクト中であることを表示
      if (isMobileDevice) {
        setIsRedirecting(true);
      }
      
      const result = await signInWithGoogle();
      
      if (result.success) {
        router.push('/duels');
      } else if (result.error) {
        setError(result.error);
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      
      if (error instanceof FirebaseError) {
        let errorMessage = 'ログイン中にエラーが発生しました。';
        
        // エラーコードに基づいてユーザーフレンドリーなメッセージを設定
        switch(error.code) {
          case 'auth/unauthorized-domain':
            errorMessage = 'このドメインはFirebaseで承認されていません。管理者に連絡してください。';
            break;
          case 'auth/invalid-credential':
            errorMessage = '認証情報が無効です。もう一度お試しください。';
            if (isMobileDevice) {
              errorMessage += ' (モバイルでの認証に問題がある場合は、PCからお試しください)';
            }
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = 'ログインがキャンセルされました。もう一度お試しください。';
            break;
          default:
            errorMessage = `ログイン中にエラーが発生しました: ${error.code}`;
        }
        
        setError(errorMessage);
      } else {
        setError('不明なエラーが発生しました。もう一度お試しください。');
      }
      
      setIsRedirecting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">ログイン</h1>
          <p className="mt-2 text-gray-300">マスターデュエル統計アプリへようこそ</p>
        </div>

        {error && (
          <div className="p-4 my-4 text-sm text-red-100 bg-red-500 rounded-lg" role="alert">
            {error}
          </div>
        )}

        {isRedirecting ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-4">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="text-white">Googleアカウントにリダイレクトしています...</p>
            <p className="text-gray-400 text-sm">ブラウザの認証画面に移動します。しばらくお待ちください。</p>
            <button
              onClick={() => setIsRedirecting(false)}
              className="px-4 py-2 mt-4 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <button
              onClick={handleGoogleSignIn}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-blue-400 group-hover:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C17.14 18.163 20 14.417 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                </svg>
              </span>
              Googleでログイン
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 