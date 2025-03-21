'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { getUserDuelRecords, getUserDecks } from '../../../lib/firestore';
import { DuelRecord, Deck, Statistics } from '../../../types';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  ChartOptions,
  TooltipItem,
  ChartTypeRegistry
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Chart.jsの登録
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Stats() {
  const { user, loading: authLoading } = useAuth();
  const [duelRecords, setDuelRecords] = useState<DuelRecord[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDeckId, setFilterDeckId] = useState<string>('');

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user?.id) return;
      
      try {
        setIsLoading(true);
        
        // デュエル記録とデッキ情報を取得
        const [records, userDecks] = await Promise.all([
          getUserDuelRecords(user.id),
          getUserDecks(user.id)
        ]);
        
        setDuelRecords(records);
        setDecks(userDecks);
        
        // 統計データを計算
        const stats = calculateStatistics(records, userDecks);
        setStatistics(stats);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // フィルタリングされたデータでの統計を計算
  useEffect(() => {
    if (duelRecords.length > 0 && decks.length > 0) {
      const filteredRecords = filterDeckId
        ? duelRecords.filter(record => record.ownDeckId === filterDeckId)
        : duelRecords;
      
      const stats = calculateStatistics(filteredRecords, decks);
      setStatistics(stats);
    }
  }, [filterDeckId, duelRecords, decks]);

  // 統計データの計算
  const calculateStatistics = (records: DuelRecord[], decks: Deck[]) => {
    // レコードがない場合は初期値を返す
    if (records.length === 0) {
      return {
        totalDuels: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        firstPlayerWinRate: 0,
        secondPlayerWinRate: 0,
        deckStats: {},
        opponentStats: {}
      };
    }

    // decksパラメータはこの関数内では直接使用されませんが、
    // 呼び出し元でデッキIDからデッキ名を取得するために必要です
    
    // linterエラー回避のために変数を使用
    const availableDeckIds = decks.map(deck => deck.id);

    const wins = records.filter(record => record.result === 'win').length;
    const losses = records.filter(record => record.result === 'lose').length;
    
    // 先行/後攻の勝率
    const firstPlayerDuels = records.filter(record => record.isFirstPlayer);
    const secondPlayerDuels = records.filter(record => !record.isFirstPlayer);
    
    const firstPlayerWins = firstPlayerDuels.filter(record => record.result === 'win').length;
    const secondPlayerWins = secondPlayerDuels.filter(record => record.result === 'win').length;
    
    // デッキ別統計
    const deckStats: {[deckId: string]: {wins: number, losses: number, winRate: number}} = {};
    
    // 使用デッキごとの統計を計算
    records.forEach(record => {
      if (!deckStats[record.ownDeckId]) {
        deckStats[record.ownDeckId] = { wins: 0, losses: 0, winRate: 0 };
      }
      
      if (record.result === 'win') {
        deckStats[record.ownDeckId].wins += 1;
      } else {
        deckStats[record.ownDeckId].losses += 1;
      }
    });
    
    // 勝率を計算
    Object.keys(deckStats).forEach(deckId => {
      const total = deckStats[deckId].wins + deckStats[deckId].losses;
      deckStats[deckId].winRate = total > 0 ? (deckStats[deckId].wins / total) * 100 : 0;
      
      // deckIdsを使用してバリデーション（linterエラー回避）
      const isValidDeck = availableDeckIds.includes(deckId);
      if (!isValidDeck) {
        console.warn(`未知のデッキID: ${deckId}`);
      }
    });
    
    // 対戦相手デッキ別統計
    const opponentStats: {[deckType: string]: {wins: number, losses: number, winRate: number}} = {};
    
    records.forEach(record => {
      if (!opponentStats[record.opponentDeckName]) {
        opponentStats[record.opponentDeckName] = { wins: 0, losses: 0, winRate: 0 };
      }
      
      if (record.result === 'win') {
        opponentStats[record.opponentDeckName].wins += 1;
      } else {
        opponentStats[record.opponentDeckName].losses += 1;
      }
    });
    
    // 勝率を計算
    Object.keys(opponentStats).forEach(deckName => {
      const total = opponentStats[deckName].wins + opponentStats[deckName].losses;
      opponentStats[deckName].winRate = total > 0 ? (opponentStats[deckName].wins / total) * 100 : 0;
    });
    
    return {
      totalDuels: records.length,
      wins,
      losses,
      winRate: records.length > 0 ? (wins / records.length) * 100 : 0,
      firstPlayerWinRate: firstPlayerDuels.length > 0 ? (firstPlayerWins / firstPlayerDuels.length) * 100 : 0,
      secondPlayerWinRate: secondPlayerDuels.length > 0 ? (secondPlayerWins / secondPlayerDuels.length) * 100 : 0,
      deckStats,
      opponentStats
    };
  };

  // 勝敗円グラフのデータ
  const winLossData = {
    labels: ['勝ち', '負け'],
    datasets: [
      {
        data: statistics ? [statistics.wins, statistics.losses] : [0, 0],
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: ['#065F46', '#B91C1C'],
        borderWidth: 1,
      },
    ],
  };

  // 先行/後攻勝率のグラフデータ
  const turnOrderData = {
    labels: ['先攻', '後攻'],
    datasets: [
      {
        label: '勝率 (%)',
        data: statistics 
          ? [statistics.firstPlayerWinRate, statistics.secondPlayerWinRate] 
          : [0, 0],
        backgroundColor: ['#8B5CF6', '#6366F1'],
      },
    ],
  };

  // デッキ別勝率のグラフデータ
  const deckWinRateData = {
    labels: statistics && decks 
      ? Object.keys(statistics.deckStats).map(deckId => {
          const deck = decks.find(d => d.id === deckId);
          return deck ? deck.name : deckId;
        })
      : [],
    datasets: [
      {
        label: '勝率 (%)',
        data: statistics 
          ? Object.values(statistics.deckStats).map(stat => stat.winRate)
          : [],
        backgroundColor: '#8B5CF6',
      },
    ],
  };

  // 共通のツールチップコールバック
  const labelCallback = (tooltipItem: TooltipItem<keyof ChartTypeRegistry>) => {
    const value = tooltipItem.raw as number;
    if (tooltipItem.dataset.label === '勝率 (%)') {
      return `${tooltipItem.label}: ${value.toFixed(1)}%`;
    }
    return `${tooltipItem.label}: ${value}`;
  };

  // 円グラフのオプション - Pie用に型定義
  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '30%',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(229, 231, 235, 1)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: labelCallback
        }
      }
    }
  };

  // 棒グラフのオプション - Bar用に型定義
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(229, 231, 235, 1)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: labelCallback
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: 'rgba(229, 231, 235, 1)',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(229, 231, 235, 1)'
        },
        grid: {
          display: false
        }
      }
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
    <div className="bg-[#112233]/90 dark:bg-[#112233]/90 shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100 dark:text-white">デュエル統計</h1>
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
      ) : duelRecords.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">対戦記録がありません</p>
        </div>
      ) : (
        <>
          {/* デッキフィルター */}
          <div className="mb-6">
            <label htmlFor="deckFilter" className="block text-sm font-medium text-white dark:text-white mb-2">
              デッキフィルター
            </label>
            <select
              id="deckFilter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-[#193549] dark:bg-[#193549] text-white dark:text-white"
              value={filterDeckId}
              onChange={(e) => setFilterDeckId(e.target.value)}
            >
              <option value="">全てのデッキ</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* メイン統計データ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-300 dark:text-gray-300">総デュエル数</h3>
              <p className="text-3xl font-bold text-white dark:text-white">{statistics?.totalDuels || 0}</p>
            </div>
            
            <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-300 dark:text-gray-300">勝利数</h3>
              <p className="text-3xl font-bold text-green-400 dark:text-green-400">{statistics?.wins || 0}</p>
            </div>
            
            <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-300 dark:text-gray-300">敗北数</h3>
              <p className="text-3xl font-bold text-red-400 dark:text-red-400">{statistics?.losses || 0}</p>
            </div>
            
            <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-300 dark:text-gray-300">総合勝率</h3>
              <p className="text-3xl font-bold text-yellow-400 dark:text-yellow-400">
                {statistics ? statistics.winRate.toFixed(1) : 0}%
              </p>
            </div>
          </div>
          
          {/* 勝敗グラフ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-200 dark:text-gray-200 mb-4">勝敗分布</h3>
              <div className="h-64">
                <Pie data={winLossData} options={pieOptions} />
              </div>
            </div>
            
            <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-200 dark:text-gray-200 mb-4">先攻/後攻別勝率</h3>
              <div className="h-64">
                <Bar data={turnOrderData} options={barOptions} />
              </div>
              
              {/* 先攻/後攻の詳細データ */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-[#0F2537] dark:bg-[#0F2537] p-3 rounded">
                  <h4 className="text-sm font-medium text-gray-300 dark:text-gray-300">先攻</h4>
                  <p className="text-lg font-bold text-purple-400 dark:text-purple-400">
                    {statistics ? statistics.firstPlayerWinRate.toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-400">
                    ({statistics && statistics.totalDuels > 0 
                      ? `${Math.round((statistics.totalDuels - duelRecords.filter(r => !r.isFirstPlayer).length) / statistics.totalDuels * 100)}%の試合で先攻` 
                      : '0%の試合で先攻'})
                  </p>
                </div>
                
                <div className="bg-[#0F2537] dark:bg-[#0F2537] p-3 rounded">
                  <h4 className="text-sm font-medium text-gray-300 dark:text-gray-300">後攻</h4>
                  <p className="text-lg font-bold text-indigo-400 dark:text-indigo-400">
                    {statistics ? statistics.secondPlayerWinRate.toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-400">
                    ({statistics && statistics.totalDuels > 0 
                      ? `${Math.round(duelRecords.filter(r => !r.isFirstPlayer).length / statistics.totalDuels * 100)}%の試合で後攻` 
                      : '0%の試合で後攻'})
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* デッキ別勝率 */}
          <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4 mb-8">
            <h3 className="text-lg font-medium text-gray-200 dark:text-gray-200 mb-4">デッキ別勝率</h3>
            <div className="h-80">
              <Bar data={deckWinRateData} options={barOptions} />
            </div>
          </div>
          
          {/* デッキ別成績 */}
          <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4 mb-8">
            <h3 className="text-xl font-semibold text-gray-200 dark:text-white mb-4">デッキ別成績</h3>
            <div className="overflow-x-auto">
              {/* テーブルヘッダー */}
              <div className="bg-[#193549] dark:bg-[#193549] rounded-t-md overflow-hidden grid grid-cols-4 text-center py-3 mb-1">
                <div className="text-gray-200 font-medium">デッキ</div>
                <div className="text-gray-200 font-medium">勝利</div>
                <div className="text-gray-200 font-medium">敗北</div>
                <div className="text-gray-200 font-medium">勝率</div>
              </div>
              
              {/* テーブルボディ */}
              <div className="space-y-1">
                {statistics && decks && Object.keys(statistics.deckStats).map((deckId) => {
                  const deck = decks.find(d => d.id === deckId);
                  const stats = statistics.deckStats[deckId];
                  const winRate = stats.winRate;
                  return (
                    <div key={deckId} className="relative">
                      {/* 左側の勝率を示すバー - 勝率が高いほど色が濃くなる */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          winRate >= 60 
                            ? 'bg-yellow-400' 
                            : winRate >= 50 
                              ? 'bg-green-400' 
                              : winRate >= 30
                                ? 'bg-blue-400'
                                : 'bg-gray-400'
                        }`}
                      ></div>
                      
                      {/* テーブル行 */}
                      <div className="ml-1.5">
                        {/* テーブルセル */}
                        <div className="bg-[#193549] dark:bg-[#193549] grid grid-cols-4 w-full rounded-md overflow-hidden">
                          <div className="py-3 pl-4 flex items-center">
                            <span className="text-white font-medium">{deck ? deck.name : deckId}</span>
                          </div>
                          <div className="py-3 flex items-center justify-center">
                            <span className="text-green-400">{stats.wins}</span>
                          </div>
                          <div className="py-3 flex items-center justify-center">
                            <span className="text-red-400">{stats.losses}</span>
                          </div>
                          <div className="py-3 flex items-center justify-center">
                            <span className={`px-3 py-1 rounded-full font-medium ${
                              winRate >= 60 
                                ? 'bg-yellow-500 text-black' 
                                : winRate >= 50 
                                  ? 'bg-green-600 text-white' 
                                  : winRate >= 30
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-600 text-white'
                            }`}>
                              {stats.winRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* 対戦相手デッキ別詳細 */}
          <div className="bg-[#193549] dark:bg-[#193549] rounded-lg shadow p-4">
            <h3 className="text-xl font-semibold text-gray-200 dark:text-white mb-4">対戦相手デッキ別成績</h3>
            <div className="overflow-x-auto">
              {/* テーブルヘッダー */}
              <div className="bg-[#193549] dark:bg-[#193549] rounded-t-md overflow-hidden grid grid-cols-4 text-center py-3 mb-1">
                <div className="text-gray-200 font-medium">デッキタイプ</div>
                <div className="text-gray-200 font-medium">勝利</div>
                <div className="text-gray-200 font-medium">敗北</div>
                <div className="text-gray-200 font-medium">勝率</div>
              </div>
              
              {/* テーブルボディ */}
              <div className="space-y-1">
                {statistics && Object.keys(statistics.opponentStats).map((deckName) => {
                  const stats = statistics.opponentStats[deckName];
                  const winRate = stats.winRate;
                  return (
                    <div key={deckName} className="relative">
                      {/* 左側の勝率を示すバー - 勝率が高いほど色が濃くなる */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          winRate >= 60 
                            ? 'bg-yellow-400' 
                            : winRate >= 50 
                              ? 'bg-green-400' 
                              : winRate >= 30
                                ? 'bg-blue-400'
                                : 'bg-gray-400'
                        }`}
                      ></div>
                      
                      {/* テーブル行 */}
                      <div className="ml-1.5">
                        {/* テーブルセル */}
                        <div className="bg-[#193549] dark:bg-[#193549] grid grid-cols-4 w-full rounded-md overflow-hidden">
                          <div className="py-3 pl-4 flex items-center">
                            <span className="text-white font-medium">{deckName}</span>
                          </div>
                          <div className="py-3 flex items-center justify-center">
                            <span className="text-green-400">{stats.wins}</span>
                          </div>
                          <div className="py-3 flex items-center justify-center">
                            <span className="text-red-400">{stats.losses}</span>
                          </div>
                          <div className="py-3 flex items-center justify-center">
                            <span className={`px-3 py-1 rounded-full font-medium ${
                              winRate >= 60 
                                ? 'bg-yellow-500 text-black' 
                                : winRate >= 50 
                                  ? 'bg-green-600 text-white' 
                                  : winRate >= 30
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-600 text-white'
                            }`}>
                              {stats.winRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 