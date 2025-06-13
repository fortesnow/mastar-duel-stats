import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateDefaultEvent } from './firestore';

// 既存のデュエル記録をデフォルトイベントに移行
export const migrateExistingDuelsToDefaultEvent = async (userId: string) => {
  try {
    // デフォルトイベントを取得または作成
    const defaultEvent = await getOrCreateDefaultEvent(userId);
    
    // eventIdフィールドが無い既存のデュエル記録を検索
    const duelsRef = collection(db, `users/${userId}/duels`);
    const duelsSnapshot = await getDocs(duelsRef);
    
    const migrationPromises: Promise<void>[] = [];
    
    duelsSnapshot.docs.forEach(duelDoc => {
      const data = duelDoc.data();
      
      // eventIdフィールドが存在しない場合は移行対象
      if (!data.eventId) {
        const updatePromise = updateDoc(doc(db, `users/${userId}/duels`, duelDoc.id), {
          eventId: defaultEvent.id
        });
        migrationPromises.push(updatePromise);
      }
    });
    
    // 全ての更新を並行実行
    await Promise.all(migrationPromises);
    
    console.log(`${migrationPromises.length}件のデュエル記録をデフォルトイベントに移行しました`);
    return migrationPromises.length;
    
  } catch (error) {
    console.error('データ移行中にエラーが発生しました:', error);
    throw error;
  }
};

// ユーザーがデータ移行が必要かどうかをチェック
export const checkMigrationNeeded = async (userId: string): Promise<boolean> => {
  try {
    const duelsRef = collection(db, `users/${userId}/duels`);
    const duelsSnapshot = await getDocs(duelsRef);
    
    // eventIdフィールドが無いデュエル記録があるかチェック
    const needsMigration = duelsSnapshot.docs.some(doc => {
      const data = doc.data();
      return !data.eventId;
    });
    
    return needsMigration;
  } catch (error) {
    console.error('移行チェック中にエラーが発生しました:', error);
    return false;
  }
};

// 移行が必要なデュエル記録の数を取得
export const getMigrationCount = async (userId: string): Promise<number> => {
  try {
    const duelsRef = collection(db, `users/${userId}/duels`);
    const duelsSnapshot = await getDocs(duelsRef);
    
    const migrationCount = duelsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.eventId;
    }).length;
    
    return migrationCount;
  } catch (error) {
    console.error('移行カウント取得中にエラーが発生しました:', error);
    return 0;
  }
}; 