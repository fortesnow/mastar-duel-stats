'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import { getDuelRecord, getUserDecks, deleteDuelRecord } from '../../../../lib/firestore';
import { Deck, DuelRecord } from '../../../../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { MdArrowBack, MdEdit, MdDelete } from 'react-icons/md';

export default function DuelRecordDetail() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const duelId = params.id as string;
  
  // 状態
  const [duelRecord, setDuelRecord] = useState<DuelRecord | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  
  // データ取得
  useEffect(() => {
    const fetchDuelAndDecks = async () => {
      if (authLoading || !user?.id) return;
      
      try {
        setIsLoading(true);
        const [duel, userDecks] = await Promise.all([
          getDuelRecord(user.id, duelId),
          getUserDecks(user.id)
        ]);
        
        setDuelRecord(duel);
        setDecks(userDecks);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDuelAndDecks();
  }, [user, authLoading, duelId]);
  
  // デッキ名を取得する関数
  const getDeckName = (deckId: string) => {
    const deck = decks.find(deck => deck.id === deckId);
    return deck ? deck.name : 'Unknown Deck';
  };
  
  // 削除処理
  const handleDelete = async () => {
    if (!user?.id || !duelRecord) return;
    
    try {
      setIsDeleting(true);
      await deleteDuelRecord(user.id, duelId);
      router.push('/duels');
    } catch (err) {
      console.error('削除エラー:', err);
      setError('削除中にエラーが発生しました');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (!duelRecord) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-6">
          <p className="text-red-700 dark:text-red-200">対戦記録が見つかりませんでした</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            onClick={() => router.push('/duels')}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        対戦記録の詳細
      </h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-6">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <div className="space-y-6">
        {/* 結果と日時 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-12 rounded-l-md ${duelRecord.result === 'win' ? 'bg-yellow-400' : 'bg-gray-400'} mr-3`}></div>
            <div>
              <div className={`text-xl font-bold ${duelRecord.result === 'win' ? 'text-yellow-500' : 'text-gray-500'}`}>
                {duelRecord.result === 'win' ? '勝利' : '敗北'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {format(duelRecord.timestamp, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full font-medium text-white ${
            duelRecord.isFirstPlayer ? 'bg-blue-600' : 'bg-green-600'
          }`}>
            {duelRecord.isFirstPlayer ? '先攻' : '後攻'}
          </div>
        </div>
        
        {/* デッキ情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">あなたのデッキ</h3>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {getDeckName(duelRecord.ownDeckId)}
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">対戦相手のデッキ</h3>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {duelRecord.opponentDeckName}
            </p>
          </div>
        </div>
        
        {/* メモ */}
        {duelRecord.notes && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">メモ</h3>
            <p className="text-gray-900 dark:text-white whitespace-pre-line">
              {duelRecord.notes}
            </p>
          </div>
        )}
        
        {/* アクションボタン */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
            onClick={() => router.back()}
          >
            <MdArrowBack className="mr-1" />
            戻る
          </button>
          
          <div className="flex space-x-3">
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <MdDelete className="mr-1" />
              削除
            </button>
            
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              onClick={() => router.push(`/duels/${duelId}/edit`)}
            >
              <MdEdit className="mr-1" />
              編集
            </button>
          </div>
        </div>
      </div>
      
      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">削除の確認</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              この対戦記録を削除しますか？この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    削除中...
                  </>
                ) : (
                  <>
                    <MdDelete className="mr-1" />
                    削除する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 