import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function uploadStateToFirebase(state: {
  users?: any[];
  academicYears?: any[];
  classes?: any[];
  students?: any[];
  teachers?: any[];
  questions?: any[];
  exams?: any[];
  attempts?: any[];
  auditLogs?: any[];
}) {
  const syncTimestamp = new Date().toISOString();
  try {
    // 1. Sync system metadata snapshot
    await setDoc(doc(db, 'system', 'metadata'), {
      updatedAt: syncTimestamp,
      version: '1.0.0',
      syncedBy: 'admin',
      database: 'wise-compiler-761jg',
    });

    // 2. Sync main collections
    const collectionsToSync: Array<{ name: string; items?: any[] }> = [
      { name: 'academicYears', items: state.academicYears },
      { name: 'classes', items: state.classes },
      { name: 'students', items: state.students },
      { name: 'teachers', items: state.teachers },
      { name: 'questions', items: state.questions },
      { name: 'exams', items: state.exams },
      { name: 'attempts', items: state.attempts },
      { name: 'auditLogs', items: state.auditLogs?.slice(0, 50) },
    ];

    for (const col of collectionsToSync) {
      if (col.items && col.items.length > 0) {
        for (const item of col.items) {
          const docId = String(item.id || item.code || Math.random().toString(36).substring(2));
          await setDoc(doc(db, col.name, docId), { ...item, _syncedAt: syncTimestamp }, { merge: true });
        }
      }
    }

    return { success: true, timestamp: syncTimestamp };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system/metadata');
    return { success: false, error };
  }
}

export async function loadStateFromFirebase() {
  try {
    const results: Record<string, any[]> = {};
    const collectionsToLoad = ['academicYears', 'classes', 'students', 'teachers', 'questions', 'exams', 'attempts', 'auditLogs'];

    for (const colName of collectionsToLoad) {
      const snap = await getDocs(collection(db, colName));
      results[colName] = snap.docs.map((d) => d.data());
    }

    return results;
  } catch (error) {
    console.warn('Could not load from Firebase, falling back to local storage:', error);
    return null;
  }
}
