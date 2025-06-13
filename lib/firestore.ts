import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Deck, DuelRecord, Event } from '../types';

// ユーザーIDに基づくコレクションパスの生成
const getUserDecksPath = (userId: string) => `users/${userId}/decks`;
const getUserDuelsPath = (userId: string) => `users/${userId}/duels`;
const getUserEventsPath = (userId: string) => `users/${userId}/events`;

// イベント関連の操作

// イベントの追加
export const addEvent = async (userId: string, eventData: Omit<Event, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  const eventsRef = collection(db, getUserEventsPath(userId));
  const timestamp = serverTimestamp();
  const data = {
    ...eventData,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  return addDoc(eventsRef, data);
};

// イベントの更新
export const updateEvent = async (userId: string, eventId: string, eventData: Partial<Omit<Event, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
  const eventRef = doc(db, getUserEventsPath(userId), eventId);
  const data = {
    ...eventData,
    updatedAt: serverTimestamp()
  };
  
  return updateDoc(eventRef, data);
};

// イベントの削除
export const deleteEvent = async (userId: string, eventId: string) => {
  const eventRef = doc(db, getUserEventsPath(userId), eventId);
  return deleteDoc(eventRef);
};

// ユーザーのイベント一覧を取得
export const getUserEvents = async (userId: string) => {
  const eventsRef = collection(db, getUserEventsPath(userId));
  const eventsQuery = query(eventsRef, orderBy('createdAt', 'desc'));
  const eventsSnapshot = await getDocs(eventsQuery);
  
  return eventsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate ? (data.startDate as Timestamp).toDate() : new Date(),
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
    } as Event;
  });
};

// アクティブなイベントを取得
export const getActiveEvent = async (userId: string) => {
  const eventsRef = collection(db, getUserEventsPath(userId));
  const eventsQuery = query(eventsRef, where('isActive', '==', true));
  const eventsSnapshot = await getDocs(eventsQuery);
  
  if (eventsSnapshot.empty) {
    return null;
  }
  
  const doc = eventsSnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    startDate: data.startDate ? (data.startDate as Timestamp).toDate() : new Date(),
    endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
  } as Event;
};

// デフォルトイベントを取得または作成
export const getOrCreateDefaultEvent = async (userId: string) => {
  const eventsRef = collection(db, getUserEventsPath(userId));
  const defaultEventsQuery = query(eventsRef, where('isDefault', '==', true));
  const defaultEventsSnapshot = await getDocs(defaultEventsQuery);
  
  if (!defaultEventsSnapshot.empty) {
    const doc = defaultEventsSnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate ? (data.startDate as Timestamp).toDate() : new Date(),
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
    } as Event;
  }
  
  // デフォルトイベントが存在しない場合は作成
  const defaultEventData = {
    name: '通常対戦',
    description: 'デフォルトの対戦記録',
    startDate: serverTimestamp(),
    isActive: true,
    isDefault: true
  };
  
  const docRef = await addEvent(userId, defaultEventData);
  return {
    id: docRef.id,
    userId,
    name: '通常対戦',
    description: 'デフォルトの対戦記録',
    startDate: new Date(),
    isActive: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Event;
};

// デッキの追加
export const addDeck = async (userId: string, deckData: Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  const decksRef = collection(db, getUserDecksPath(userId));
  const timestamp = serverTimestamp();
  const data = {
    ...deckData,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  return addDoc(decksRef, data);
};

// デッキの更新
export const updateDeck = async (userId: string, deckId: string, deckData: Partial<Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
  const deckRef = doc(db, getUserDecksPath(userId), deckId);
  const data = {
    ...deckData,
    updatedAt: serverTimestamp()
  };
  
  return updateDoc(deckRef, data);
};

// デッキの削除
export const deleteDeck = async (userId: string, deckId: string) => {
  const deckRef = doc(db, getUserDecksPath(userId), deckId);
  return deleteDoc(deckRef);
};

// ユーザーのデッキ一覧を取得
export const getUserDecks = async (userId: string) => {
  const decksRef = collection(db, getUserDecksPath(userId));
  const decksSnapshot = await getDocs(decksRef);
  
  return decksSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
    } as Deck;
  });
};

// デュエル記録の追加（イベントIDを含む）
export const addDuelRecord = async (userId: string, duelData: Omit<DuelRecord, 'id' | 'userId' | 'timestamp'>) => {
  const duelsRef = collection(db, getUserDuelsPath(userId));
  const timestamp = serverTimestamp();
  const data = {
    ...duelData,
    userId,
    timestamp
  };
  
  return addDoc(duelsRef, data);
};

// デュエル記録の更新
export const updateDuelRecord = async (userId: string, duelId: string, duelData: Partial<Omit<DuelRecord, 'id' | 'userId' | 'timestamp'>>) => {
  const duelRef = doc(db, getUserDuelsPath(userId), duelId);
  return updateDoc(duelRef, duelData);
};

// デュエル記録の削除
export const deleteDuelRecord = async (userId: string, duelId: string) => {
  const duelRef = doc(db, getUserDuelsPath(userId), duelId);
  return deleteDoc(duelRef);
};

// ユーザーのデュエル記録一覧を取得
export const getUserDuelRecords = async (userId: string) => {
  const duelsRef = collection(db, getUserDuelsPath(userId));
  const duelsQuery = query(duelsRef, orderBy('timestamp', 'desc'));
  const duelsSnapshot = await getDocs(duelsQuery);
  
  return duelsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date()
    } as DuelRecord;
  });
};

// 特定のイベントのデュエル記録を取得
export const getEventDuelRecords = async (userId: string, eventId: string) => {
  const duelsRef = collection(db, getUserDuelsPath(userId));
  const duelsQuery = query(
    duelsRef, 
    where('eventId', '==', eventId),
    orderBy('timestamp', 'desc')
  );
  const duelsSnapshot = await getDocs(duelsQuery);
  
  return duelsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date()
    } as DuelRecord;
  });
};

// 特定のデッキのデュエル記録を取得
export const getDeckDuelRecords = async (userId: string, deckId: string) => {
  const duelsRef = collection(db, getUserDuelsPath(userId));
  const duelsQuery = query(
    duelsRef, 
    where('ownDeckId', '==', deckId),
    orderBy('timestamp', 'desc')
  );
  const duelsSnapshot = await getDocs(duelsQuery);
  
  return duelsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date()
    } as DuelRecord;
  });
};

// 特定のイベントの特定のデッキのデュエル記録を取得
export const getEventDeckDuelRecords = async (userId: string, eventId: string, deckId: string) => {
  const duelsRef = collection(db, getUserDuelsPath(userId));
  const duelsQuery = query(
    duelsRef, 
    where('eventId', '==', eventId),
    where('ownDeckId', '==', deckId),
    orderBy('timestamp', 'desc')
  );
  const duelsSnapshot = await getDocs(duelsQuery);
  
  return duelsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date()
    } as DuelRecord;
  });
};

// 過去に登録された対戦相手のデッキ名を取得（重複なし）
export const getOpponentDeckNames = async (userId: string, eventId?: string) => {
  const duelsRef = collection(db, getUserDuelsPath(userId));
  let duelsQuery;
  
  if (eventId) {
    duelsQuery = query(duelsRef, where('eventId', '==', eventId));
  } else {
    duelsQuery = duelsRef;
  }
  
  const duelsSnapshot = await getDocs(duelsQuery);
  
  // 対戦相手のデッキ名を抽出し、重複を除去
  const deckNames = duelsSnapshot.docs
    .map(doc => doc.data().opponentDeckName)
    .filter((value, index, self) => 
      value && self.indexOf(value) === index
    );
  
  return deckNames;
};

// 特定のデュエル記録を取得
export const getDuelRecord = async (userId: string, duelId: string) => {
  const duelRef = doc(db, getUserDuelsPath(userId), duelId);
  const duelSnapshot = await getDoc(duelRef);
  
  if (!duelSnapshot.exists()) {
    throw new Error('デュエル記録が見つかりません');
  }
  
  const data = duelSnapshot.data();
  return {
    id: duelSnapshot.id,
    ...data,
    timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date()
  } as DuelRecord;
}; 