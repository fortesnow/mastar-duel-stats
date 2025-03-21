import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
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
    
    // プロンプト動作をカスタマイズ（アカウント選択画面を必要な場合のみ表示）
    provider.setCustomParameters({
      prompt: 'none'
    });
    
    // リダイレクト認証に変更（ポップアップの代わり）
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
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
    } catch (authError) {
      console.error('Google認証エラー:', authError);
      throw authError;
    }
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
      } else if (error.code === 'permission-denied') {
        throw new Error('Firebaseデータベースへのアクセス権限がありません。管理者に連絡してください。');
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