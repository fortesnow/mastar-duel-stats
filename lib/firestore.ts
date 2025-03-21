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
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Deck, DuelRecord } from '../types';

// ユーザーIDに基づくコレクションパスの生成
const getUserDecksPath = (userId: string) => `users/${userId}/decks`;
const getUserDuelsPath = (userId: string) => `users/${userId}/duels`;

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

// デュエル記録の追加
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