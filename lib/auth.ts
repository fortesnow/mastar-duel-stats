import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';
import { FirebaseError } from 'firebase/app';

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

// Googleでサインイン
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // 追加のスコープを要求
    provider.addScope('profile');
    provider.addScope('email');
    
    // プロンプト動作をモバイルフレンドリーな設定に変更
    // 常に選択画面を表示し、サイレント認証を避ける
    provider.setCustomParameters({
      // select_accountは問題を引き起こす可能性があるため、同意画面を常に表示する設定に変更
      prompt: 'consent',
      // モバイルフレンドリーなUIを要求
      mobile: '1',
      // 新しいタブではなく同じウィンドウで認証を行う
      ...(typeof window !== 'undefined' && { redirect_uri: window.location.origin + '/login' })
    });
    
    // モバイルデバイスの検出
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof window !== 'undefined' ? window.navigator.userAgent : ''
    );
    
    let user;
    
    if (isMobile) {
      // モバイルデバイスではリダイレクト認証を使用
      console.log('モバイルデバイスを検出: リダイレクト認証を使用');
      // リダイレクト前にローカルストレージに状態を保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('authRedirectInProgress', 'true');
      }
      await signInWithRedirect(auth, provider);
      // リダイレクト認証では、この後のコードは実行されません
      return null;
    } else {
      // デスクトップではポップアップ認証を使用
      console.log('デスクトップデバイスを検出: ポップアップ認証を使用');
      try {
        const userCredential = await signInWithPopup(auth, provider);
        user = userCredential.user;
      } catch (popupError) {
        console.error('ポップアップ認証エラー:', popupError);
        // ポップアップでエラーが発生した場合、リダイレクト認証にフォールバック
        console.log('リダイレクト認証にフォールバック');
        await signInWithRedirect(auth, provider);
        return null;
      }
    }
    
    // デバッグ情報
    console.log('Google認証成功:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    try {
      // Firestoreにユーザーデータが存在するか確認
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // ユーザーデータが存在しない場合は新規作成
      if (!userDoc.exists()) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            createdAt: serverTimestamp(),
            settings: {
              theme: 'dark',
              defaultDeck: ''
            }
          });
          console.log('新規ユーザーをFirestoreに保存しました:', user.uid);
        } catch (firestoreError) {
          console.error('Firestoreへのユーザー作成エラー:', firestoreError);
          // Firestoreエラーがあっても認証は成功したので、エラーは投げずに続行
          console.warn('ユーザーデータの保存に失敗しましたが、ログインは続行します');
        }
      } else {
        console.log('既存ユーザーが見つかりました:', user.uid);
      }
    } catch (firestoreError) {
      console.error('Firestoreアクセスエラー:', firestoreError);
      // Firestoreエラーがあっても認証は成功したので、エラーは投げずに続行
      console.warn('Firestoreへのアクセスに失敗しましたが、ログインは続行します');
    }
    
    return user;
  } catch (error) {
    console.error('Googleサインインエラー:', error);
    
    // エラー情報の詳細な分析
    if (error instanceof FirebaseError) {
      console.error('Firebase ErrorCode:', error.code);
      console.error('Firebase ErrorMessage:', error.message);
      
      // 特定のエラーケースに対応
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('認証ポップアップが閉じられました。もう一度お試しください。');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('ポップアップがブロックされました。ブラウザの設定を確認してください。');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('認証リクエストがキャンセルされました。もう一度お試しください。');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('このメールアドレスは既に別の認証方法で登録されています。');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('このドメインは認証操作を許可されていません。管理者に連絡してください。');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('認証情報が無効です。Google認証の設定を確認してください。');
      } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
        throw new Error('お使いの環境ではこの認証方法がサポートされていません。別の方法でログインしてください。');
      } else if (error.code === 'permission-denied') {
        throw new Error('Firebaseデータベースへのアクセス権限がありません。管理者に連絡してください。');
      }
    }
    
    throw error;
  }
};

// リダイレクト認証の結果を処理
export const handleRedirectResult = async () => {
  try {
    // リダイレクト認証が進行中かチェック
    const isRedirecting = typeof window !== 'undefined' && 
      localStorage.getItem('authRedirectInProgress') === 'true';
    
    if (isRedirecting) {
      // 処理中フラグをクリア
      localStorage.removeItem('authRedirectInProgress');
    }
    
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      
      // デバッグ情報
      console.log('リダイレクト認証成功:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      try {
        // Firestoreにユーザーデータが存在するか確認
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        // ユーザーデータが存在しない場合は新規作成
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            createdAt: serverTimestamp(),
            settings: {
              theme: 'dark',
              defaultDeck: ''
            }
          });
          console.log('リダイレクト後に新規ユーザーを保存しました:', user.uid);
        } else {
          console.log('リダイレクト後に既存ユーザーを確認しました:', user.uid);
        }
      } catch (firestoreError) {
        console.error('リダイレクト後のFirestoreアクセスエラー:', firestoreError);
      }
      
      return user;
    } else if (isRedirecting) {
      // リダイレクトが進行中だったにもかかわらず結果がない場合はエラー
      console.error('リダイレクト認証が完了しましたが、ユーザー情報が取得できませんでした');
      throw new Error('認証に失敗しました。もう一度お試しください。');
    }
    return null;
  } catch (error) {
    console.error('リダイレクト結果処理エラー:', error);
    
    // エラー情報の詳細な分析
    if (error instanceof FirebaseError) {
      console.error('リダイレクト Firebase ErrorCode:', error.code);
      console.error('リダイレクト Firebase ErrorMessage:', error.message);
      
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Google認証の資格情報が無効です。もう一度お試しください。');
      }
    }
    
    throw error;
  }
};

// サインアウト（ログアウト）
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('サインアウトエラー:', error);
    throw error;
  }
};

// Firebaseユーザーをアプリケーションのユーザー型に変換
export const formatUser = (user: FirebaseUser): Partial<User> => {
  return {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
  };
}; 