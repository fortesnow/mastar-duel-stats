'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';
import { getUserDecks, addDuelRecord, getOpponentDeckNames } from '../../../../lib/firestore';
import { Deck } from '../../../../types';
import { MdArrowForward, MdCheckCircle, MdCancel, MdAdd, MdHistory } from 'react-icons/md';

export default function NewDuelRecord() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // フォームの状態
  const [isFirstPlayer, setIsFirstPlayer] = useState(true);
  const [result, setResult] = useState<'win' | 'lose'>('win');
  const [ownDeckId, setOwnDeckId] = useState('');
  const [opponentDeckName, setOpponentDeckName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSelectingPastDeck, setIsSelectingPastDeck] = useState(false);
  
  // ユーザーのデッキ一覧
  const [decks, setDecks] = useState<Deck[]>([]);
  const [pastOpponentDecks, setPastOpponentDecks] = useState<string[]>([]);
  const [filteredOpponentDecks, setFilteredOpponentDecks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 送信状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // ステップ1: デッキ選択、ステップ2: 対戦結果
  
  // UI参照
  const opponentInputRef = useRef<HTMLInputElement>(null);
  
  // ユーザーのデッキと過去の対戦相手デッキを取得
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user?.id) return;
      
      try {
        const [userDecks, opponentDecks] = await Promise.all([
          getUserDecks(user.id),
          getOpponentDeckNames(user.id)
        ]);
        
        setDecks(userDecks);
        setPastOpponentDecks(opponentDecks);
        setFilteredOpponentDecks(opponentDecks);
        
        // デッキがあれば最初のデッキをデフォルト選択
        if (userDecks.length > 0) {
          setOwnDeckId(userDecks[0].id);
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
      }
    };
    
    fetchData();
  }, [user, authLoading]);
  
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

  // 次のステップへ進む
  const goToNextStep = () => {
    if (step === 1) {
      if (!ownDeckId) {
        setError('使用デッキを選択してください');
        return;
      }
      setError('');
      setStep(2);
    }
  };
  
  // 前のステップに戻る
  const goToPreviousStep = () => {
    setStep(1);
    setError('');
  };
  
  // 対戦相手のデッキを選択する
  const selectOpponentDeck = (deckName: string) => {
    setOpponentDeckName(deckName);
    setIsSelectingPastDeck(false);
    setSearchQuery('');
    
    // 入力フィールドにフォーカスを当てる
    if (opponentInputRef.current) {
      opponentInputRef.current.focus();
    }
  };
  
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
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <span className="bg-purple-600 text-white w-8 h-8 rounded-full inline-flex items-center justify-center mr-3 text-sm">
          {step}
        </span>
        {step === 1 ? 'デッキ選択' : '対戦結果記録'}
      </h1>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-6 flex items-center border-l-4 border-red-600 dark:border-red-400">
          <MdCancel className="text-red-600 dark:text-red-400 text-xl mr-2" />
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 ? (
          // ステップ1: デッキ選択
          <div className="space-y-6">
            {/* 使用デッキ 選択 */}
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
              <label htmlFor="ownDeck" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                あなたの使用デッキを選択
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
            
            {/* ナビゲーションボタン */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mr-3"
                onClick={() => router.back()}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="bg-purple-600 text-white px-5 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400 flex items-center"
                onClick={goToNextStep}
                disabled={decks.length === 0 || !ownDeckId}
              >
                次へ
                <MdArrowForward className="ml-1" />
              </button>
            </div>
          </div>
        ) : (
          // ステップ2: 対戦結果入力
          <div className="space-y-6">
            {/* 先攻/後攻 選択 */}
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
                    <MdCheckCircle className="text-purple-600 dark:text-purple-400 text-xl mx-auto mt-2" />
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
                    <MdCheckCircle className="text-purple-600 dark:text-purple-400 text-xl mx-auto mt-2" />
                  )}
                </div>
              </div>
            </div>
            
            {/* 勝敗結果 選択 */}
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
              <label className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                勝敗結果
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div
                  className={`${
                    result === 'win' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center`}
                  onClick={() => setResult('win')}
                >
                  <div className="font-medium text-gray-900 dark:text-white">勝利</div>
                  {result === 'win' && (
                    <MdCheckCircle className="text-green-600 dark:text-green-400 text-xl mx-auto mt-2" />
                  )}
                </div>
                <div
                  className={`${
                    result === 'lose' 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center`}
                  onClick={() => setResult('lose')}
                >
                  <div className="font-medium text-gray-900 dark:text-white">敗北</div>
                  {result === 'lose' && (
                    <MdCheckCircle className="text-red-600 dark:text-red-400 text-xl mx-auto mt-2" />
                  )}
                </div>
              </div>
            </div>
            
            {/* 対戦相手のデッキ */}
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
              <label htmlFor="opponentDeck" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                対戦相手のデッキ
              </label>
              <div className="relative">
                <div className="flex">
                  <input
                    type="text"
                    id="opponentDeck"
                    ref={opponentInputRef}
                    className="focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    value={opponentDeckName}
                    onChange={(e) => setOpponentDeckName(e.target.value)}
                    placeholder="例: 青眼白龍"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center"
                    onClick={() => setIsSelectingPastDeck(!isSelectingPastDeck)}
                  >
                    {isSelectingPastDeck ? <MdAdd /> : <MdHistory />}
                    <span className="ml-1 hidden sm:inline">
                      {isSelectingPastDeck ? '新規入力' : '過去のデッキ'}
                    </span>
                  </button>
                </div>
                
                {isSelectingPastDeck && pastOpponentDecks.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                    <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="デッキを検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    {filteredOpponentDecks.length === 0 ? (
                      <div className="p-3 text-gray-500 dark:text-gray-400 text-center">
                        該当するデッキがありません
                      </div>
                    ) : (
                      <ul>
                        {filteredOpponentDecks.map((deck, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => selectOpponentDeck(deck)}
                          >
                            {deck}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* メモ 入力 */}
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
              <label htmlFor="notes" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                メモ（任意）
              </label>
              <textarea
                id="notes"
                rows={3}
                className="focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="対戦の特記事項があれば記入してください"
                disabled={isSubmitting}
              />
            </div>
            
            {/* ナビゲーションボタン */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400 flex items-center"
                disabled={isSubmitting || !opponentDeckName}
              >
                {isSubmitting ? '保存中...' : '保存'}
                <MdCheckCircle className="ml-1" />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 