'use client';

import { useAuth } from '../../../components/AuthProvider';
import EventManager from '../../../components/EventManager';
import EventStatisticsComponent from '../../../components/EventStatistics';

export default function EventsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ログインが必要です。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">イベント管理</h1>
        <p className="text-gray-600">
          遊戯王のイベントごとに対戦記録を分けて管理・統計できます
        </p>
      </div>

      {/* イベント管理セクション */}
      <EventManager userId={user.id} />

      {/* イベント別統計セクション */}
      <EventStatisticsComponent userId={user.id} />
    </div>
  );
} 