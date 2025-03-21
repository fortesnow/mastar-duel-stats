# 遊戯王マスターデュエル 統計アプリ

デュエリストカップの対戦データを記録・分析し、パフォーマンス向上を支援するアプリケーションです。

## 機能

- 対戦結果の記録（勝敗、先行/後攻、使用デッキ、対戦相手のデッキ）
- 統計データの視覚化・分析
- 過去の対戦履歴の閲覧・検索
- デッキ管理機能

## 技術スタック

- フロントエンド: Next.js, TypeScript, Tailwind CSS
- バックエンド: Firebase Authentication, Firestore
- データ可視化: Chart.js

## セットアップ

### 前提条件

- Node.js 18.0.0以上
- npm 8.0.0以上
- Firebaseアカウント

### インストール手順

1. リポジトリをクローンする
   ```
   git clone https://github.com/yourusername/master-duel-stats.git
   cd master-duel-stats
   ```

2. 依存パッケージをインストールする
   ```
   npm install
   ```

3. Firebase設定
   - Firebaseコンソール(https://console.firebase.google.com/)でプロジェクトを作成
   - Authentication機能を有効化し、メール/パスワード認証を有効にする
   - Firestoreデータベースを作成する
   - プロジェクト設定から必要な設定値を取得する

4. 環境変数の設定
   - `.env.local.example`ファイルを`.env.local`にコピーする
   - Firebase設定値を`.env.local`ファイルに入力する

5. 開発サーバーを起動する
   ```
   npm run dev
   ```

6. ブラウザで`http://localhost:3000`にアクセスする

## デプロイ

Vercelを使用したデプロイ：

1. [Vercel](https://vercel.com/)にアカウントを作成する
2. プロジェクトをGitHubにプッシュする
3. Vercelでプロジェクトをインポートする
4. 環境変数を設定する
5. デプロイする

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。
