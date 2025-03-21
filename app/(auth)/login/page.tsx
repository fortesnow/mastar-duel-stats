'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '../../../lib/auth';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../../../components/AuthProvider';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showCookieInfo, setShowCookieInfo] = useState(false);
  const router = useRouter();
  const { authError, firebaseUser, clearAuthError } = useAuth();

  // マウント時にエラーをクリア
  useEffect(() => {
    clearAuthError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AuthProviderからのエラーを表示
  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsRedirecting(false);
      
      // サードパーティCookie関連のエラーかチェック
      if (authError.includes('サードパーティCookie') || 
          authError.includes('Cookie')) {
        setShowCookieInfo(true);
      }
    }
  }, [authError]);
  
  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (firebaseUser) {
      console.log('既にログイン済み - duelsにリダイレクト');
      router.push('/duels');
    }
  }, [firebaseUser, router]);

  // モバイルデバイス検出
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof window !== 'undefined' ? window.navigator.userAgent : ''
  );
  
  // Chromeブラウザ検出
  const isChrome = typeof window !== 'undefined' && 
    /Chrome/.test(navigator.userAgent) && 
    /Google Inc/.test(navigator.vendor);

  // リダイレクト中かどうかのチェック
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // セッションストレージとローカルストレージを確認
    const redirectInProgressSession = sessionStorage.getItem('auth_redirect_in_progress');
    const redirectInProgressLocal = localStorage.getItem('auth_redirect_in_progress');
    
    if (redirectInProgressSession === 'true' || redirectInProgressLocal === 'true') {
      setIsRedirecting(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setShowCookieInfo(false);
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
        
        // サードパーティCookie関連のエラーかチェック
        if (result.error.includes('サードパーティCookie') || 
            result.error.includes('Cookie')) {
          setShowCookieInfo(true);
        }
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
          case 'auth/third-party-cookies-blocked':
          case 'auth/cookies-blocked':
            errorMessage = 'ブラウザでサードパーティCookieがブロックされています。ブラウザの設定を確認して、もう一度お試しください。';
            setShowCookieInfo(true);
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
    setError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect_in_progress');
      sessionStorage.removeItem('auth_redirect_from');
      localStorage.removeItem('auth_redirect_in_progress');
      localStorage.removeItem('auth_redirect_from');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <div className={`w-full ${isMobileDevice ? 'max-w-[95%]' : 'max-w-md'} p-5 sm:p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl`}>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">ログイン</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-300">マスターデュエル統計アプリへようこそ</p>
        </div>

        {error && (
          <div className="p-3 sm:p-4 my-3 text-sm text-red-100 bg-red-500 rounded-lg flex items-center justify-between" role="alert">
            <span className="flex-1 mr-2">{error}</span>
            <button 
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700"
              onClick={() => setError(null)}
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        )}
        
        {showCookieInfo && (
          <div className="p-3 sm:p-4 my-3 text-sm text-yellow-100 bg-yellow-600 rounded-lg">
            <div className="flex items-center mb-1">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <p className="font-bold">サードパーティCookieが必要です</p>
            </div>
            <p className="mb-2 ml-7">Googleログインにはサードパーティのクッキーが必要です。</p>
            {isChrome && (
              <div className="ml-7 p-2 bg-yellow-700 rounded text-xs">
                <p className="font-semibold mb-1">Chrome設定手順:</p>
                <ol className="list-decimal list-inside">
                  <li>設定を開く</li>
                  <li>プライバシーとセキュリティを選択</li>
                  <li>Cookieと他のサイトデータを選択</li>
                  <li>サードパーティCookieをブロックしないに設定</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {isRedirecting ? (
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 p-3 sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="text-base sm:text-lg text-white text-center">Googleアカウントにリダイレクトしています...</p>
            <p className="text-xs sm:text-sm text-gray-400 text-center">ブラウザの認証画面に移動します。しばらくお待ちください。</p>
            <button
              onClick={handleCancelRedirect}
              className="px-4 py-2 mt-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 active:bg-red-800 active:scale-95 transition-all"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div className="mt-6 sm:mt-8 space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-blue-800 active:scale-[0.98] transition-all shadow-lg"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-blue-400 group-hover:text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
              </span>
              <span className="ml-4">Googleでログイン</span>
            </button>
            
            {isMobileDevice && (
              <p className="text-xs text-center text-gray-400 mt-3">
                モバイルデバイスでは認証後に自動的にアプリに戻ります
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* モバイルデバイス向けのフッター */}
      {isMobileDevice && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 text-center text-xs text-gray-400">
          マスターデュエル統計アプリ © 2023
        </div>
      )}
    </div>
  );
} 