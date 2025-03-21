'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';
import { getUserDecks, deleteDeck } from '../../../lib/firestore';
import { Deck } from '../../../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function Decks() {
  const { user, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // デッキデータの取得
  useEffect(() => {
    const fetchDecks = async () => {
      if (authLoading || !user?.id) return;
      
      try {
        setIsLoading(true);
        const userDecks = await getUserDecks(user.id);
        setDecks(userDecks);
      } catch (err) {
        console.error('デッキ取得エラー:', err);
        setError('デッキ情報の取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, [user, authLoading]);

  // デッキの削除
  const handleDeleteDeck = async (deckId: string) => {
    if (!user?.id) return;
    
    if (!confirm('このデッキを削除してもよろしいですか？関連する対戦記録は削除されません。')) {
      return;
    }
    
    try {
      await deleteDeck(user.id, deckId);
      // デッキ一覧を更新
      setDecks(decks.filter(deck => deck.id !== deckId));
    } catch (err) {
      console.error('デッキ削除エラー:', err);
      setError('デッキの削除中にエラーが発生しました');
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
    <div className="dark:bg-gray-800 shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">デッキ管理</h1>
        <Link 
          href="/decks/new" 
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
        >
          新規デッキ
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">デッキが登録されていません</p>
          <Link 
            href="/decks/new" 
            className="text-purple-600 hover:text-purple-500 font-medium"
          >
            最初のデッキを登録する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div 
              key={deck.id}
              className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{deck.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{deck.archetype}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {deck.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {deck.notes && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                    {deck.notes}
                  </p>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  作成日: {format(deck.createdAt, 'yyyy/MM/dd', { locale: ja })}
                </div>
                
                <div className="flex justify-between">
                  <Link 
                    href={`/decks/${deck.id}`}
                    className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                  >
                    詳細
                  </Link>
                  <div className="space-x-2">
                    <Link 
                      href={`/decks/${deck.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      編集
                    </Link>
                    <button 
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 