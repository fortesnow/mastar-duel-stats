'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import { addDeck } from '../../../../lib/firestore';

export default function NewDeck() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // フォームの状態
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [archetype, setArchetype] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  
  // 送信状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // デッキの送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    if (!name) {
      setError('デッキ名を入力してください');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // タグを分割して配列に変換（カンマ区切り）
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      await addDeck(user.id, {
        name,
        type,
        archetype,
        tags,
        notes
      });
      
      router.push('/decks');
    } catch (err) {
      console.error('デッキ追加エラー:', err);
      setError('デッキの保存中にエラーが発生しました');
      setIsSubmitting(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">新規デッキ登録</h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* デッキ名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            デッキ名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 青眼白龍デッキ"
            disabled={isSubmitting}
            required
          />
        </div>
        
        {/* デッキタイプ */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            デッキタイプ
          </label>
          <select
            id="type"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">選択してください</option>
            <option value="アグレッシブ">アグレッシブ</option>
            <option value="コントロール">コントロール</option>
            <option value="コンボ">コンボ</option>
            <option value="ミッドレンジ">ミッドレンジ</option>
            <option value="その他">その他</option>
          </select>
        </div>
        
        {/* アーキタイプ */}
        <div>
          <label htmlFor="archetype" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            アーキタイプ
          </label>
          <input
            type="text"
            id="archetype"
            className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
            placeholder="例: ブルーアイズ"
            disabled={isSubmitting}
          />
        </div>
        
        {/* タグ */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            タグ（カンマ区切り）
          </label>
          <input
            type="text"
            id="tags"
            className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例: ドラゴン, 融合, 高攻撃力"
            disabled={isSubmitting}
          />
        </div>
        
        {/* メモ */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            メモ
          </label>
          <textarea
            id="notes"
            rows={4}
            className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="デッキの戦略や特徴についてのメモ"
            disabled={isSubmitting}
          />
        </div>
        
        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="button"
            className="mr-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
} 