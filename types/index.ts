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