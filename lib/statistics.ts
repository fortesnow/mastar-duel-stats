import { DuelRecord, Statistics, EventStatistics } from '../types';

// 基本的な統計を計算
export const calculateStatistics = (duels: DuelRecord[]): Statistics => {
  const totalDuels = duels.length;
  const wins = duels.filter(duel => duel.result === 'win').length;
  const losses = duels.filter(duel => duel.result === 'lose').length;
  const winRate = totalDuels > 0 ? (wins / totalDuels) * 100 : 0;

  // 先攻/後攻の勝率
  const firstPlayerDuels = duels.filter(duel => duel.isFirstPlayer);
  const firstPlayerWins = firstPlayerDuels.filter(duel => duel.result === 'win').length;
  const firstPlayerWinRate = firstPlayerDuels.length > 0 ? (firstPlayerWins / firstPlayerDuels.length) * 100 : 0;

  const secondPlayerDuels = duels.filter(duel => !duel.isFirstPlayer);
  const secondPlayerWins = secondPlayerDuels.filter(duel => duel.result === 'win').length;
  const secondPlayerWinRate = secondPlayerDuels.length > 0 ? (secondPlayerWins / secondPlayerDuels.length) * 100 : 0;

  // デッキ別統計
  const deckStats: { [deckId: string]: { wins: number; losses: number; winRate: number } } = {};
  duels.forEach(duel => {
    if (!deckStats[duel.ownDeckId]) {
      deckStats[duel.ownDeckId] = { wins: 0, losses: 0, winRate: 0 };
    }
    if (duel.result === 'win') {
      deckStats[duel.ownDeckId].wins++;
    } else {
      deckStats[duel.ownDeckId].losses++;
    }
  });

  // デッキ別勝率を計算
  Object.keys(deckStats).forEach(deckId => {
    const total = deckStats[deckId].wins + deckStats[deckId].losses;
    deckStats[deckId].winRate = total > 0 ? (deckStats[deckId].wins / total) * 100 : 0;
  });

  // 相手デッキ別統計
  const opponentStats: { [deckType: string]: { wins: number; losses: number; winRate: number } } = {};
  duels.forEach(duel => {
    const opponentDeck = duel.opponentDeckName;
    if (!opponentStats[opponentDeck]) {
      opponentStats[opponentDeck] = { wins: 0, losses: 0, winRate: 0 };
    }
    if (duel.result === 'win') {
      opponentStats[opponentDeck].wins++;
    } else {
      opponentStats[opponentDeck].losses++;
    }
  });

  // 相手デッキ別勝率を計算
  Object.keys(opponentStats).forEach(opponentDeck => {
    const total = opponentStats[opponentDeck].wins + opponentStats[opponentDeck].losses;
    opponentStats[opponentDeck].winRate = total > 0 ? (opponentStats[opponentDeck].wins / total) * 100 : 0;
  });

  return {
    totalDuels,
    wins,
    losses,
    winRate,
    firstPlayerWinRate,
    secondPlayerWinRate,
    deckStats,
    opponentStats
  };
};

// イベント別統計を計算
export const calculateEventStatistics = (duels: DuelRecord[], eventId: string, eventName: string): EventStatistics => {
  const baseStats = calculateStatistics(duels);
  return {
    ...baseStats,
    eventId,
    eventName
  };
};

// 複数のイベントの統計を計算
export const calculateMultipleEventStatistics = (
  duelsByEvent: { [eventId: string]: DuelRecord[] },
  eventNames: { [eventId: string]: string }
): EventStatistics[] => {
  return Object.keys(duelsByEvent).map(eventId => 
    calculateEventStatistics(duelsByEvent[eventId], eventId, eventNames[eventId])
  );
};

// 期間別統計（月別、週別など）
export const calculatePeriodStatistics = (
  duels: DuelRecord[],
  periodType: 'day' | 'week' | 'month'
): { [period: string]: Statistics } => {
  const periodStats: { [period: string]: DuelRecord[] } = {};

  duels.forEach(duel => {
    let periodKey: string;
    const date = duel.timestamp;
    
    switch (periodType) {
      case 'day':
        periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        periodKey = date.toISOString().split('T')[0];
    }

    if (!periodStats[periodKey]) {
      periodStats[periodKey] = [];
    }
    periodStats[periodKey].push(duel);
  });

  const result: { [period: string]: Statistics } = {};
  Object.keys(periodStats).forEach(period => {
    result[period] = calculateStatistics(periodStats[period]);
  });

  return result;
}; 