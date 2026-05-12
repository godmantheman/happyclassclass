import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export async function logAction(action: string, details: string) {
  try {
    await addDoc(collection(db, 'system_logs'), {
      userId: auth.currentUser?.uid || 'SYSTEM',
      userEmail: auth.currentUser?.email || 'N/A',
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Log error:", error);
  }
}
