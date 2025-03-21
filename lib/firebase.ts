// Firebase設定
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebaseの設定値
// 実際の値は環境変数から取得するか、プロジェクト設定から取得します
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 環境変数が設定されているか確認
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.error('Firebase API Keyが設定されていません。.env.localファイルを確認してください。');
}

if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  console.error('Firebase Auth Domainが設定されていません。.env.localファイルを確認してください。');
}

// Firebaseの初期化
let app;
let db: Firestore;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // 認証の永続性をLOCALに設定（ブラウザを閉じても認証状態を保持）
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase認証永続性設定成功: ログイン状態が保持されます');
    })
    .catch((error) => {
      console.error('Firebase認証永続性設定エラー:', error);
    });
  
  // 開発環境の場合、Firebase Auth Emulatorに接続（必要に応じて）
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    console.log('Firebase Auth Emulatorに接続します');
    connectAuthEmulator(auth, 'http://localhost:9099');
  }

  console.log('Firebase初期化成功');
} catch (error) {
  console.error('Firebase初期化エラー:', error);
  throw new Error('Firebase初期化に失敗しました。設定を確認してください。');
}

export { app, db, auth }; 