'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event } from '../types';
import { 
  getUserEvents, 
  addEvent, 
  updateEvent, 
  getActiveEvent 
} from '../lib/firestore';
import { 
  migrateExistingDuelsToDefaultEvent, 
  checkMigrationNeeded, 
  getMigrationCount 
} from '../lib/migration';

interface EventManagerProps {
  userId: string;
  onEventChange?: (event: Event | null) => void;
}

export default function EventManager({ userId, onEventChange }: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrationCount, setMigrationCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);

  // イベント一覧とアクティブイベントを読み込み
  const loadEvents = useCallback(async () => {
    try {
      const [eventsData, activeEventData] = await Promise.all([
        getUserEvents(userId),
        getActiveEvent(userId)
      ]);
      
      setEvents(eventsData);
      setActiveEvent(activeEventData);
      onEventChange?.(activeEventData);
    } catch (error) {
      console.error('イベントの読み込みに失敗しました:', error);
    }
  }, [userId, onEventChange]);

  // データ移行チェック
  const checkMigration = useCallback(async () => {
    try {
      const [needsMigration, count] = await Promise.all([
        checkMigrationNeeded(userId),
        getMigrationCount(userId)
      ]);
      
      setMigrationNeeded(needsMigration);
      setMigrationCount(count);
    } catch (error) {
      console.error('移行チェックに失敗しました:', error);
    }
  }, [userId]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([loadEvents(), checkMigration()]);
      setIsLoading(false);
    };

    initializeData();
  }, [userId, loadEvents, checkMigration]);

  // 新しいイベントを作成
  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;

    try {
      setIsCreating(true);
      
      // 既存のアクティブイベントを非アクティブにする
      if (activeEvent) {
        await updateEvent(userId, activeEvent.id, { isActive: false });
      }

      // 新しいイベントを作成
      await addEvent(userId, {
        name: newEventName,
        description: newEventDescription,
        startDate: new Date(),
        isActive: true,
        isDefault: false
      });

      // データを再読み込み
      await loadEvents();
      
      // フォームをリセット
      setNewEventName('');
      setNewEventDescription('');
    } catch (error) {
      console.error('イベントの作成に失敗しました:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // イベントを切り替え
  const handleSwitchEvent = async (eventId: string) => {
    try {
      // 全てのイベントを非アクティブにする
      await Promise.all(
        events.map(event => 
          updateEvent(userId, event.id, { isActive: false })
        )
      );

      // 選択されたイベントをアクティブにする
      await updateEvent(userId, eventId, { isActive: true });

      // データを再読み込み
      await loadEvents();
    } catch (error) {
      console.error('イベントの切り替えに失敗しました:', error);
    }
  };

  // イベントを終了
  const handleEndEvent = async (eventId: string) => {
    try {
      await updateEvent(userId, eventId, {
        isActive: false,
        endDate: new Date()
      });

      await loadEvents();
    } catch (error) {
      console.error('イベントの終了に失敗しました:', error);
    }
  };

  // データ移行を実行
  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      const migratedCount = await migrateExistingDuelsToDefaultEvent(userId);
      
      alert(`${migratedCount}件のデュエル記録を通常対戦に移行しました。`);
      
      // 移行後にデータを再読み込み
      await Promise.all([loadEvents(), checkMigration()]);
    } catch (error) {
      console.error('データ移行に失敗しました:', error);
      alert('データ移行に失敗しました。');
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">イベント管理</h2>

      {/* データ移行通知 */}
      {migrationNeeded && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">データ移行が必要です</h3>
          <p className="text-yellow-700 mb-3">
            {migrationCount}件の既存の対戦記録を「通常対戦」イベントに移行する必要があります。
            この操作により、既存のデータは保持されたままイベント機能を使用できるようになります。
          </p>
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {isMigrating ? '移行中...' : 'データを移行する'}
          </button>
        </div>
      )}

      {/* アクティブイベント表示 */}
      {activeEvent && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800">現在のイベント</h3>
          <p className="text-blue-700 font-medium">{activeEvent.name}</p>
          {activeEvent.description && (
            <p className="text-blue-600 text-sm">{activeEvent.description}</p>
          )}
        </div>
      )}

      {/* 新しいイベント作成 */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-3">新しいイベントを作成</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              イベント名 *
            </label>
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: デュエリストカップ2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明（任意）
            </label>
            <textarea
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="イベントの詳細や期間など"
            />
          </div>
          <button
            onClick={handleCreateEvent}
            disabled={isCreating || !newEventName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? '作成中...' : 'イベントを作成'}
          </button>
        </div>
      </div>

      {/* イベント一覧 */}
      <div>
        <h3 className="font-semibold mb-3">イベント一覧</h3>
        {events.length === 0 ? (
          <p className="text-gray-500">イベントが作成されていません。</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-4 border rounded-lg ${
                  event.isActive
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {event.name}
                      {event.isActive && (
                        <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                          アクティブ
                        </span>
                      )}
                      {event.isDefault && (
                        <span className="px-2 py-1 text-xs bg-gray-600 text-white rounded">
                          通常対戦
                        </span>
                      )}
                    </h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      開始: {event.startDate.toLocaleDateString('ja-JP')}
                      {event.endDate && ` | 終了: ${event.endDate.toLocaleDateString('ja-JP')}`}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!event.isActive && (
                      <button
                        onClick={() => handleSwitchEvent(event.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        切り替え
                      </button>
                    )}
                    {event.isActive && !event.isDefault && (
                      <button
                        onClick={() => handleEndEvent(event.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        終了
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 