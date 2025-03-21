'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '../../../lib/auth';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../../../components/AuthProvider';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { authError } = useAuth();

  // AuthProviderからのエラーを表示
  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsRedirecting(false);
    }
  }, [authError]);

  // モバイルデバイス検出
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof window !== 'undefined' ? window.navigator.userAgent : ''
  );

  // リダイレクト中かどうかのチェック
  useEffect(() => {
    // セッションストレージを確認
    const redirectInProgress = typeof window !== 'undefined' ? 
      sessionStorage.getItem('auth_redirect_in_progress') : null;
    
    if (redirectInProgress === 'true') {
      setIsRedirecting(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      console.log('Googleログイン開始');
      
      // モバイルデバイスではリダイレクト中であることを表示
      if (isMobileDevice) {
        console.log('モバイルデバイス検出 - リダイレクトUI表示');
        setIsRedirecting(true);
      }
      
      console.log('signInWithGoogle 関数呼び出し');
      const result = await signInWithGoogle();
      console.log('signInWithGoogle 結果:', result);
      
      // モバイルのリダイレクト処理が始まった場合は、このコードは実行されない
      // （ページ遷移が発生するため）
      
      if (result.success) {
        if (!result.redirectStarted) { // デスクトップでの認証成功（ポップアップ）
          console.log('ポップアップ認証成功 - duelsにリダイレクト');
          router.push('/duels');
        }
      } else if (result.error) {
        console.error('認証エラー:', result.error);
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

  const handleCancelRedirect = () => {
    // リダイレクト状態をクリア
    setIsRedirecting(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect_in_progress');
      sessionStorage.removeItem('auth_redirect_from');
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
              onClick={handleCancelRedirect}
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
                <svg className="h-5 w-5 text-blue-400 group-hover:text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
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