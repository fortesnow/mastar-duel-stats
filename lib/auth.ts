import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getAuth,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';
import { User } from '../types';
import { FirebaseError } from 'firebase/app';

export const auth = getAuth(app);

// サインアップ（新規ユーザー登録）
export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    // Firebaseで認証アカウントを作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // ユーザー表示名を設定
    await updateProfile(user, { displayName });
    
    // Firestoreにユーザーデータを保存
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: user.email,
      displayName,
      createdAt: serverTimestamp(),
      settings: {
        theme: 'dark',
        defaultDeck: ''
      }
    });
    
    return user;
  } catch (error) {
    console.error('サインアップエラー:', error);
    throw error;
  }
};

// サインイン（ログイン）
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('サインインエラー:', error);
    throw error;
  }
};

// モバイルデバイス検出
const isMobileDevice = () => {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    );
  }
  return false;
};

// Googleでサインイン
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  
  // スコープを追加
  provider.addScope('profile');
  provider.addScope('email');
  
  // プロンプト設定を変更
  provider.setCustomParameters({
    prompt: 'select_account',
    login_hint: '',
  });

  try {
    // モバイルデバイスの場合はリダイレクト認証を使用
    if (isMobileDevice()) {
      console.log('モバイルデバイスを検出: リダイレクト認証を使用');
      
      // リダイレクト前の状態をクリア
      if (typeof window !== 'undefined') {
        console.log('リダイレクト前の状態をクリア');
        sessionStorage.removeItem('auth_redirect_in_progress');
        sessionStorage.removeItem('auth_redirect_from');
        
        // 新しい状態を設定
        console.log('新しいリダイレクト状態を設定:', window.location.pathname);
        sessionStorage.setItem('auth_redirect_in_progress', 'true');
        sessionStorage.setItem('auth_redirect_from', window.location.pathname);
      }
      
      console.log('signInWithRedirect を呼び出し中...');
      try {
        // リダイレクト認証を実行
        await signInWithRedirect(auth, provider).catch(e => {
          console.error('リダイレクト中のエラー:', e);
          throw e;
        });
        
        // この行は通常実行されない（リダイレクトが成功した場合）
        console.log('リダイレクト後のコード - これは通常表示されません');
      } catch (redirectError) {
        console.error('リダイレクト実行エラー:', redirectError);
        throw redirectError;
      }
      
      return { success: true, redirectStarted: true };
    } else {
      console.log('デスクトップデバイスを検出: ポップアップ認証を使用');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('認証成功:', user);
      return { success: true, user };
    }
  } catch (error) {
    console.error('Google認証エラー:', error);
    if (error instanceof FirebaseError) {
      // 詳細なエラーメッセージをログに記録
      console.error(`Firebase エラーコード: ${error.code}`);
      console.error(`Firebase エラーメッセージ: ${error.message}`);
      
      let errorMessage = 'ログイン中にエラーが発生しました。';
      
      // エラーコードに基づいてユーザーフレンドリーなメッセージを設定
      switch(error.code) {
        case 'auth/unauthorized-domain':
          errorMessage = 'このドメインはFirebaseで承認されていません。管理者に連絡してください。';
          break;
        case 'auth/invalid-credential':
          errorMessage = '認証情報が無効です。もう一度お試しください。';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'ログインがキャンセルされました。もう一度お試しください。';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'ログインリクエストがキャンセルされました。もう一度お試しください。';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'この認証方法は現在無効になっています。管理者に連絡してください。';
          break;
        default:
          errorMessage = `ログインエラー: ${error.code}`;
          break;
      }
      
      return { success: false, error: errorMessage, code: error.code };
    }
    
    return { success: false, error: '不明なエラーが発生しました。もう一度お試しください。' };
  }
};

// リダイレクト結果を処理する関数
export const handleRedirectResult = async () => {
  // ページロード時に常にリダイレクト結果を確認
  console.log('リダイレクト状態チェック');
  
  try {
    // sessionStorageの状態に関わらず、常に結果を確認
    console.log('getRedirectResult を実行...');
    const result = await getRedirectResult(auth);
    
    // リダイレクト元のパスを取得
    const redirectFrom = typeof window !== 'undefined' ? 
      sessionStorage.getItem('auth_redirect_from') : null;
    
    console.log('リダイレクト元:', redirectFrom);
    
    // リダイレクト中フラグを取得
    const redirectInProgress = typeof window !== 'undefined' ? 
      sessionStorage.getItem('auth_redirect_in_progress') : null;
    
    console.log('リダイレクト中フラグ:', redirectInProgress);
    
    // セッションストレージをクリア
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect_in_progress');
      sessionStorage.removeItem('auth_redirect_from');
    }
    
    if (result) {
      // 認証情報が取得できた場合
      const user = result.user;
      console.log('リダイレクト認証成功:', user.uid);
      return { success: true, user, redirectFrom };
    } else {
      // 認証情報がない場合
      if (redirectInProgress === 'true') {
        console.log('リダイレクト中だが結果がない - リダイレクトが失敗した可能性');
        return { 
          success: false, 
          error: 'ログイン処理が正常に完了しませんでした。もう一度お試しください。', 
          redirectFrom 
        };
      }
      
      console.log('リダイレクト結果がありません（初回ロードまたはリダイレクト前）');
      return { success: false, error: null, redirectFrom };
    }
  } catch (error) {
    console.error('リダイレクト認証エラー:', error);
    
    // リダイレクトプロセスが失敗してもフラグをクリア
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect_in_progress');
      sessionStorage.removeItem('auth_redirect_from');
    }
    
    if (error instanceof FirebaseError) {
      console.error(`Firebase リダイレクトエラーコード: ${error.code}`);
      console.error(`Firebase リダイレクトエラーメッセージ: ${error.message}`);
      
      let errorMessage = 'ログイン中にエラーが発生しました。';
      
      switch(error.code) {
        case 'auth/unauthorized-domain':
          errorMessage = 'このドメインはFirebaseで承認されていません。管理者に連絡してください。';
          break;
        case 'auth/invalid-credential':
          errorMessage = '認証情報が無効です。もう一度お試しください。';
          break;
        case 'auth/missing-or-invalid-nonce':
          errorMessage = '認証セッションが無効です。もう一度ログインしてください。';
          break;
        default:
          errorMessage = `認証エラー: ${error.code}`;
          break;
      }
      
      return { success: false, error: errorMessage, code: error.code };
    }
    
    return { success: false, error: '不明なエラーが発生しました。もう一度お試しください。' };
  }
};

// サインアウト（ログアウト）
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return { success: false, error: 'ログアウト中にエラーが発生しました。' };
  }
};

// エイリアスとしてsignOutもエクスポート
export { signOutUser as signOut };

// 現在のユーザーを取得
export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Firebaseユーザーをアプリケーションのユーザー型に変換
export const formatUser = (user: FirebaseUser): Partial<User> => {
  return {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
  };
}; 