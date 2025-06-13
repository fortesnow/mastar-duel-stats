'use client';

import { useState, useEffect } from 'react';
import { Event, EventStatistics, DuelRecord, Deck } from '../types';
import { 
  getUserEvents, 
  getEventDuelRecords, 
  getUserDecks 
} from '../lib/firestore';
import { calculateEventStatistics } from '../lib/statistics';

interface EventStatisticsProps {
  userId: string;
}

export default function EventStatisticsComponent({ userId }: EventStatisticsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<EventStatistics[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // データを読み込み
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, decksData] = await Promise.all([
        getUserEvents(userId),
        getUserDecks(userId)
      ]);
      
      setEvents(eventsData);
      setDecks(decksData);

      // 各イベントの統計を計算
      const statsPromises = eventsData.map(async (event) => {
        const duels = await getEventDuelRecords(userId, event.id);
        return calculateEventStatistics(duels, event.id, event.name);
      });

      const stats = await Promise.all(statsPromises);
      setEventStats(stats);

      // 最初のイベントを選択
      if (eventsData.length > 0) {
        setSelectedEventId(eventsData[0].id);
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // 選択されたイベントの統計を取得
  const selectedStats = eventStats.find(stat => stat.eventId === selectedEventId);

  // デッキ名を取得
  const getDeckName = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    return deck ? deck.name : '不明なデッキ';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">イベント別統計</h2>
        <p className="text-gray-500">イベントが作成されていません。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">イベント別統計</h2>

      {/* イベント選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          イベントを選択
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} ({event.isActive ? 'アクティブ' : '終了'})
            </option>
          ))}
        </select>
      </div>

      {selectedStats && (
        <div className="space-y-6">
          {/* 基本統計 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">総対戦数</h3>
              <p className="text-2xl font-bold text-blue-900">{selectedStats.totalDuels}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">勝利数</h3>
              <p className="text-2xl font-bold text-green-900">{selectedStats.wins}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">敗北数</h3>
              <p className="text-2xl font-bold text-red-900">{selectedStats.losses}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">勝率</h3>
              <p className="text-2xl font-bold text-purple-900">
                {selectedStats.totalDuels > 0 ? selectedStats.winRate.toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* 先攻/後攻勝率 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-orange-800">先攻勝率</h3>
              <p className="text-xl font-bold text-orange-900">
                {selectedStats.firstPlayerWinRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-teal-800">後攻勝率</h3>
              <p className="text-xl font-bold text-teal-900">
                {selectedStats.secondPlayerWinRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* デッキ別統計 */}
          {Object.keys(selectedStats.deckStats).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">デッキ別統計</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">デッキ名</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">勝利</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">敗北</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">勝率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(selectedStats.deckStats).map(([deckId, stats]) => (
                      <tr key={deckId}>
                        <td className="px-4 py-2 text-sm text-gray-900">{getDeckName(deckId)}</td>
                        <td className="px-4 py-2 text-sm text-green-600">{stats.wins}</td>
                        <td className="px-4 py-2 text-sm text-red-600">{stats.losses}</td>
                        <td className="px-4 py-2 text-sm font-medium">
                          {stats.winRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 相手デッキ別統計 */}
          {Object.keys(selectedStats.opponentStats).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">相手デッキ別統計</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">相手デッキ</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">勝利</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">敗北</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">勝率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(selectedStats.opponentStats)
                      .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
                      .map(([opponentDeck, stats]) => (
                        <tr key={opponentDeck}>
                          <td className="px-4 py-2 text-sm text-gray-900">{opponentDeck}</td>
                          <td className="px-4 py-2 text-sm text-green-600">{stats.wins}</td>
                          <td className="px-4 py-2 text-sm text-red-600">{stats.losses}</td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {stats.winRate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedStats.totalDuels === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">このイベントにはまだ対戦記録がありません。</p>
            </div>
          )}
        </div>
      )}

      {/* 全イベント比較 */}
      {eventStats.length > 1 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">イベント比較</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">イベント名</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">対戦数</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">勝率</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">先攻勝率</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">後攻勝率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {eventStats
                  .sort((a, b) => b.totalDuels - a.totalDuels)
                  .map((stats) => (
                    <tr key={stats.eventId}>
                      <td className="px-4 py-2 text-sm text-gray-900">{stats.eventName}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{stats.totalDuels}</td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {stats.totalDuels > 0 ? stats.winRate.toFixed(1) : 0}%
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {stats.firstPlayerWinRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {stats.secondPlayerWinRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 