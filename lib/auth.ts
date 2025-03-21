import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
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
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { app } from './firebase';
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
  
  // プロンプト設定を変更（常に同意画面を表示）
  provider.setCustomParameters({
    prompt: 'consent',
    // モバイルフレンドリーなUIをリクエスト
    mobile: '1',
    ...typeof window !== 'undefined' && {
      redirect_uri: window.location.origin
    }
  });

  try {
    // モバイルデバイスの場合はリダイレクト認証を使用
    if (isMobileDevice()) {
      console.log('モバイルデバイスを検出: リダイレクト認証を使用');
      // リダイレクト中であることをローカルストレージに記録
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_redirect_in_progress', 'true');
      }
      await signInWithRedirect(auth, provider);
      return { success: true };
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
      }
      
      return { success: false, error: errorMessage, code: error.code };
    }
    
    return { success: false, error: '不明なエラーが発生しました。もう一度お試しください。' };
  }
};

// リダイレクト結果を処理する関数
export const handleRedirectResult = async () => {
  if (typeof window !== 'undefined' && localStorage.getItem('auth_redirect_in_progress') === 'true') {
    try {
      console.log('リダイレクト認証結果を処理中...');
      const result = await getRedirectResult(auth);
      
      // リダイレクトプロセスが完了したらフラグをクリア
      localStorage.removeItem('auth_redirect_in_progress');
      
      if (result) {
        const user = result.user;
        console.log('リダイレクト認証成功:', user);
        return { success: true, user };
      } else {
        console.log('リダイレクト結果がありません（初回ロードまたはリダイレクト前）');
        return { success: false, error: null };
      }
    } catch (error) {
      console.error('リダイレクト認証エラー:', error);
      // リダイレクトプロセスが失敗してもフラグをクリア
      localStorage.removeItem('auth_redirect_in_progress');
      
      if (error instanceof FirebaseError) {
        console.error(`Firebase リダイレクトエラーコード: ${error.code}`);
        let errorMessage = 'ログイン中にエラーが発生しました。';
        
        switch(error.code) {
          case 'auth/unauthorized-domain':
            errorMessage = 'このドメインはFirebaseで承認されていません。管理者に連絡してください。';
            break;
          case 'auth/invalid-credential':
            errorMessage = '認証情報が無効です。もう一度お試しください。';
            break;
        }
        
        return { success: false, error: errorMessage, code: error.code };
      }
      
      return { success: false, error: '不明なエラーが発生しました。もう一度お試しください。' };
    }
  }
  
  return { success: false, error: null };
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

// 現在のユーザーを取得
export const getCurrentUser = (): Promise<User | null> => {
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