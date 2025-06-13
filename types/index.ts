// ユーザーの型定義
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  settings: {
    theme: 'light' | 'dark';
    defaultDeck: string;
  };
}

// イベントの型定義
export interface Event {
  id: string;
  userId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isDefault: boolean; // デフォルトイベント（通常の対戦）かどうか
  createdAt: Date;
  updatedAt: Date;
}

// デッキの型定義
export interface Deck {
  id: string;
  userId: string;
  name: string;
  type: string;
  archetype: string;
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// 対戦記録の型定義
export interface DuelRecord {
  id: string;
  userId: string;
  eventId: string; // どのイベントに属するかを示すID
  timestamp: Date;
  isFirstPlayer: boolean;
  result: 'win' | 'lose';
  ownDeckId: string;
  opponentDeckId: string;
  opponentDeckName: string;
  notes: string;
}

// 統計データの型定義
export interface Statistics {
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  firstPlayerWinRate: number;
  secondPlayerWinRate: number;
  deckStats: {
    [deckId: string]: {
      wins: number;
      losses: number;
      winRate: number;
    };
  };
  opponentStats: {
    [deckType: string]: {
      wins: number;
      losses: number;
      winRate: number;
    };
  };
}

// イベント別統計データの型定義
export interface EventStatistics extends Statistics {
  eventId: string;
  eventName: string;
} 