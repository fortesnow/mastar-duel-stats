'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import { getUserDecks, addDuelRecord } from '../../../../lib/firestore';
import { Deck } from '../../../../types';

export default function NewDuelRecord() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // フォームの状態
  const [isFirstPlayer, setIsFirstPlayer] = useState(true);
  const [result, setResult] = useState<'win' | 'lose'>('win');
  const [ownDeckId, setOwnDeckId] = useState('');
  const [opponentDeckName, setOpponentDeckName] = useState('');
  const [notes, setNotes] = useState('');
  
  // ユーザーのデッキ一覧
  const [decks, setDecks] = useState<Deck[]>([]);
  
  // 送信状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // ユーザーのデッキ一覧を取得
  useEffect(() => {
    const fetchDecks = async () => {
      if (authLoading || !user?.id) return;
      
      try {
        const userDecks = await getUserDecks(user.id);
        setDecks(userDecks);
        
        // デッキがあれば最初のデッキをデフォルト選択
        if (userDecks.length > 0) {
          setOwnDeckId(userDecks[0].id);
        }
      } catch (err) {
        console.error('デッキ取得エラー:', err);
        setError('デッキ情報の取得中にエラーが発生しました');
      }
    };
    
    fetchDecks();
  }, [user, authLoading]);
  
  // 対戦記録の送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    if (!ownDeckId) {
      setError('使用デッキを選択してください');
      return;
    }
    
    if (!opponentDeckName) {
      setError('対戦相手のデッキを入力してください');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      await addDuelRecord(user.id, {
        isFirstPlayer,
        result,
        ownDeckId,
        opponentDeckId: '', // 対戦相手のデッキIDは空でも可
        opponentDeckName,
        notes
      });
      
      router.push('/duels');
    } catch (err) {
      console.error('記録追加エラー:', err);
      setError('対戦記録の保存中にエラーが発生しました');
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">新規対戦記録</h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 先攻/後攻 選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            先攻/後攻
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="isFirstPlayer"
                checked={isFirstPlayer}
                onChange={() => setIsFirstPlayer(true)}
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">先攻</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="isFirstPlayer"
                checked={!isFirstPlayer}
                onChange={() => setIsFirstPlayer(false)}
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">後攻</span>
            </label>
          </div>
        </div>
        
        {/* 勝敗結果 選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            勝敗結果
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="result"
                checked={result === 'win'}
                onChange={() => setResult('win')}
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">勝利</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="result"
                checked={result === 'lose'}
                onChange={() => setResult('lose')}
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">敗北</span>
            </label>
          </div>
        </div>
        
        {/* 使用デッキ 選択 */}
        <div>
          <label htmlFor="ownDeck" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            使用デッキ
          </label>
          {decks.length === 0 ? (
            <div className="text-yellow-600 dark:text-yellow-400 mb-2">
              デッキが登録されていません。先にデッキを登録してください。
            </div>
          ) : (
            <select
              id="ownDeck"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={ownDeckId}
              onChange={(e) => setOwnDeckId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="" disabled>選択してください</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* 対戦相手のデッキ 入力 */}
        <div>
          <label htmlFor="opponentDeck" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            対戦相手のデッキ
          </label>
          <input
            type="text"
            id="opponentDeck"
            className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={opponentDeckName}
            onChange={(e) => setOpponentDeckName(e.target.value)}
            placeholder="例: 青眼白龍"
            disabled={isSubmitting}
          />
        </div>
        
        {/* メモ 入力 */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            メモ（任意）
          </label>
          <textarea
            id="notes"
            rows={3}
            className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="対戦の特記事項があれば記入してください"
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
            disabled={isSubmitting || decks.length === 0}
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
} 