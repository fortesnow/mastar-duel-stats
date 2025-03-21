'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserDuelRecords, getUserDecks } from '../../../lib/firestore';
import { useAuth } from '../../../components/AuthProvider';
import { DuelRecord, Deck } from '../../../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function Duels() {
  const { user, loading: authLoading } = useAuth();
  const [duelRecords, setDuelRecords] = useState<DuelRecord[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // モバイルデバイスの検出
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        return window.innerWidth < 640;
      };
      
      setIsMobile(checkIsMobile());
      
      const handleResize = () => {
        setIsMobile(checkIsMobile());
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // 対戦記録データの取得
  useEffect(() => {
    const fetchDuelRecords = async () => {
      if (authLoading || !user?.id) return;
      
      try {
        setIsLoading(true);
        const [records, userDecks] = await Promise.all([
          getUserDuelRecords(user.id),
          getUserDecks(user.id)
        ]);
        setDuelRecords(records);
        setDecks(userDecks);
      } catch (err) {
        console.error('対戦記録取得エラー:', err);
        setError('対戦記録の取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDuelRecords();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const getDeckName = (deckId: string) => {
    return decks.find(deck => deck.id === deckId)?.name || deckId;
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 shadow-sm rounded-lg p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-0">対戦記録</h1>
        <Link 
          href="/duels/new" 
          className="touch-feedback bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center shadow-md"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新規記録
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-3 sm:p-4 rounded-md mb-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : duelRecords.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">対戦記録がありません</p>
          <Link 
            href="/duels/new" 
            className="text-purple-600 hover:text-purple-500 font-medium flex flex-col items-center"
          >
            <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            最初の対戦を記録する
          </Link>
        </div>
      ) : (
        <div>
          {/* テーブルヘッダー - モバイルでは非表示 */}
          <div className="hidden sm:grid bg-[#193549] dark:bg-[#193549] rounded-t-md overflow-hidden grid-cols-3 text-center py-3 mb-1">
            <div className="text-gray-200 font-medium">先攻/後攻</div>
            <div className="text-gray-200 font-medium">使用デッキ</div>
            <div className="text-gray-200 font-medium">対戦相手デッキ</div>
          </div>
          
          {/* テーブルボディ */}
          <div className="space-y-2 sm:space-y-1">
            {duelRecords.map((duel) => (
              <div key={duel.id} className="relative">
                {/* 左側の勝敗を示すバー */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${
                    duel.result === 'win' 
                      ? 'bg-yellow-400' 
                      : 'bg-gray-400'
                  }`}
                ></div>
                
                {/* PCとモバイルで異なる表示 */}
                {isMobile ? (
                  // モバイル用カードビュー
                  <div className="ml-2 bg-[#193549] dark:bg-[#193549] rounded-md p-3 relative">
                    {/* 勝敗表示 */}
                    <div className="flex justify-between items-center mb-2">
                      <div className={`font-bold text-lg ${
                        duel.result === 'win' 
                          ? 'text-yellow-400' 
                          : 'text-gray-400'
                      }`}>
                        {duel.result === 'win' ? 'WIN' : 'LOSE'}
                      </div>
                      <div className="text-gray-300 text-xs">
                        {format(duel.timestamp, 'yyyy/MM/dd HH:mm', { locale: ja })}
                      </div>
                    </div>
                    
                    {/* デッキと先攻/後攻情報 */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs mb-1">使用デッキ</span>
                        <span className="text-white">{getDeckName(duel.ownDeckId)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs mb-1">対戦相手</span>
                        <span className="text-white">{duel.opponentDeckName}</span>
                      </div>
                    </div>
                    
                    {/* 先攻/後攻とアクション */}
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        duel.isFirstPlayer 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-green-600 text-white'
                      }`}>
                        {duel.isFirstPlayer ? '先攻' : '後攻'}
                      </span>
                      
                      <div className="flex space-x-4">
                        <Link href={`/duels/${duel.id}/edit`} className="text-blue-400 hover:text-blue-300 p-1">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <Link href={`/duels/${duel.id}`} className="text-gray-200 p-1">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  // PCテーブル表示
                  <div className="flex ml-1.5">
                    {/* 勝敗表示（絶対配置） */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <div className={`font-bold text-lg ${
                        duel.result === 'win' 
                          ? 'text-yellow-400' 
                          : 'text-gray-400'
                      }`}>
                        {duel.result === 'win' ? 'WIN' : 'LOSE'}
                      </div>
                      <div className="text-gray-200 text-xs">
                        {format(duel.timestamp, 'yyyy/MM/dd HH:mm', { locale: ja })}
                      </div>
                    </div>
                    
                    {/* テーブルセル */}
                    <div className="bg-[#193549] dark:bg-[#193549] grid grid-cols-3 w-full rounded-md overflow-hidden">
                      <div className="pl-16 py-4 flex items-center justify-center">
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          duel.isFirstPlayer 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-green-600 text-white'
                        }`}>
                          {duel.isFirstPlayer ? '先攻' : '後攻'}
                        </span>
                      </div>
                      <div className="py-4 flex items-center justify-center">
                        <span className="text-white">{getDeckName(duel.ownDeckId)}</span>
                      </div>
                      <div className="py-4 flex items-center justify-center text-white">
                        {duel.opponentDeckName}
                      </div>
                    </div>
                    
                    {/* アクションボタン（絶対配置） */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex space-x-2">
                      <Link href={`/duels/${duel.id}/edit`} className="text-blue-400 hover:text-blue-300 p-1">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <Link href={`/duels/${duel.id}`} className="text-gray-200 p-1">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* モバイル用フローティングアクションボタン */}
          {isMobile && (
            <Link
              href="/duels/new"
              className="fixed right-4 bottom-4 w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 active:bg-purple-800 transition-colors"
              aria-label="新規記録"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 