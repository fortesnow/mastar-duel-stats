'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../components/AuthProvider';
import { getDuelRecord, getUserDecks, updateDuelRecord, getOpponentDeckNames } from '../../../../../lib/firestore';
import { Deck, DuelRecord } from '../../../../../types';
import { MdArrowBack, MdCheckCircle, MdCancel, MdHistory, MdSave } from 'react-icons/md';

export default function EditDuelRecord() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const duelId = params.id as string;
  
  // フォームの状態
  const [isFirstPlayer, setIsFirstPlayer] = useState(true);
  const [result, setResult] = useState<'win' | 'lose'>('win');
  const [ownDeckId, setOwnDeckId] = useState('');
  const [opponentDeckName, setOpponentDeckName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSelectingPastDeck, setIsSelectingPastDeck] = useState(false);
  
  // データの状態
  const [decks, setDecks] = useState<Deck[]>([]);
  const [duelRecord, setDuelRecord] = useState<DuelRecord | null>(null);
  const [pastOpponentDecks, setPastOpponentDecks] = useState<string[]>([]);
  const [filteredOpponentDecks, setFilteredOpponentDecks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // データ取得
  useEffect(() => {
    const fetchDuelAndDecks = async () => {
      if (authLoading || !user?.id) return;
      
      try {
        setIsLoading(true);
        const [duel, userDecks, opponentDecks] = await Promise.all([
          getDuelRecord(user.id, duelId),
          getUserDecks(user.id),
          getOpponentDeckNames(user.id)
        ]);
        
        setDuelRecord(duel);
        setDecks(userDecks);
        setPastOpponentDecks(opponentDecks);
        setFilteredOpponentDecks(opponentDecks);
        
        // フォームの初期値を設定
        setIsFirstPlayer(duel.isFirstPlayer);
        setResult(duel.result);
        setOwnDeckId(duel.ownDeckId);
        setOpponentDeckName(duel.opponentDeckName);
        setNotes(duel.notes || '');
        
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDuelAndDecks();
  }, [user, authLoading, duelId]);
  
  // 対戦相手デッキの検索フィルタリング
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOpponentDecks(pastOpponentDecks);
    } else {
      const filtered = pastOpponentDecks.filter(
        deck => deck.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOpponentDecks(filtered);
    }
  }, [searchQuery, pastOpponentDecks]);
  
  // 対戦相手のデッキを選択する
  const selectOpponentDeck = (deckName: string) => {
    setOpponentDeckName(deckName);
    setIsSelectingPastDeck(false);
    setSearchQuery('');
  };
  
  // フォーム送信
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
      
      await updateDuelRecord(user.id, duelId, {
        isFirstPlayer,
        result,
        ownDeckId,
        opponentDeckName,
        notes
      });
      
      router.push('/duels');
    } catch (err) {
      console.error('記録更新エラー:', err);
      setError('対戦記録の更新中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
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
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-6 flex items-center border-l-4 border-red-600 dark:border-red-400">
          <MdCancel className="text-red-600 dark:text-red-400 text-xl mr-2" />
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
        対戦記録の編集
      </h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-6 flex items-center border-l-4 border-red-600 dark:border-red-400">
          <MdCancel className="text-red-600 dark:text-red-400 text-xl mr-2" />
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 使用デッキ選択 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
          <label htmlFor="ownDeck" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
            使用デッキを選択
          </label>
          {decks.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md text-yellow-700 dark:text-yellow-300 flex items-center">
              <MdCancel className="text-yellow-600 dark:text-yellow-400 text-xl mr-2" />
              デッキが登録されていません。先にデッキを登録してください。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {decks.map((deck) => (
                <div 
                  key={deck.id}
                  className={`${
                    ownDeckId === deck.id 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } border-2 rounded-lg p-4 cursor-pointer transition-all duration-200`}
                  onClick={() => setOwnDeckId(deck.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {deck.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {deck.archetype || deck.type}
                      </p>
                    </div>
                    {ownDeckId === deck.id && (
                      <MdCheckCircle className="text-purple-600 dark:text-purple-400 text-xl" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 先攻/後攻選択 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
          <label className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
            先攻/後攻
          </label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div
              className={`${
                isFirstPlayer 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center`}
              onClick={() => setIsFirstPlayer(true)}
            >
              <div className="font-medium text-gray-900 dark:text-white">先攻</div>
              {isFirstPlayer && (
                <MdCheckCircle className="text-purple-600 dark:text-purple-400 text-xl mx-auto mt-1" />
              )}
            </div>
            <div
              className={`${
                !isFirstPlayer 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center`}
              onClick={() => setIsFirstPlayer(false)}
            >
              <div className="font-medium text-gray-900 dark:text-white">後攻</div>
              {!isFirstPlayer && (
                <MdCheckCircle className="text-purple-600 dark:text-purple-400 text-xl mx-auto mt-1" />
              )}
            </div>
          </div>
        </div>
        
        {/* 勝敗選択 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
          <label className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
            対戦結果
          </label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div
              className={`${
                result === 'win' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center`}
              onClick={() => setResult('win')}
            >
              <div className="font-medium text-gray-900 dark:text-white">勝利</div>
              {result === 'win' && (
                <MdCheckCircle className="text-purple-600 dark:text-purple-400 text-xl mx-auto mt-1" />
              )}
            </div>
            <div
              className={`${
                result === 'lose' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center`}
              onClick={() => setResult('lose')}
            >
              <div className="font-medium text-gray-900 dark:text-white">敗北</div>
              {result === 'lose' && (
                <MdCheckCircle className="text-purple-600 dark:text-purple-400 text-xl mx-auto mt-1" />
              )}
            </div>
          </div>
        </div>
        
        {/* 対戦相手のデッキ入力 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
          <label htmlFor="opponentDeck" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
            対戦相手のデッキ
          </label>
          
          <div className="relative">
            <input
              type="text"
              id="opponentDeck"
              value={opponentDeckName}
              onChange={(e) => setOpponentDeckName(e.target.value)}
              onFocus={() => setIsSelectingPastDeck(true)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="対戦相手のデッキ名を入力"
            />
            
            {pastOpponentDecks.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSelectingPastDeck(!isSelectingPastDeck)}
                className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <MdHistory className="text-xl" />
              </button>
            )}
          </div>
          
          {/* 過去の対戦相手デッキリスト */}
          {isSelectingPastDeck && pastOpponentDecks.length > 0 && (
            <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg">
              <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700"
                  placeholder="デッキ名で検索..."
                />
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {filteredOpponentDecks.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                    該当するデッキがありません
                  </div>
                ) : (
                  <ul>
                    {filteredOpponentDecks.map((deck, index) => (
                      <li 
                        key={index}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => selectOpponentDeck(deck)}
                      >
                        {deck}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* メモ入力 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
          <label htmlFor="notes" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
            メモ（任意）
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="対戦に関するメモを入力（任意）"
          />
        </div>
        
        {/* 送信ボタン */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
            onClick={() => router.back()}
          >
            <MdArrowBack className="mr-1" />
            戻る
          </button>
          
          <button
            type="submit"
            className="bg-purple-600 text-white px-5 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400 flex items-center"
            disabled={isSubmitting || decks.length === 0 || !ownDeckId || !opponentDeckName}
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                更新中...
              </>
            ) : (
              <>
                <MdSave className="mr-1" />
                保存
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 