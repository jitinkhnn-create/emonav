import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  setDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Session, UserProfile } from '../types';

const OFFLINE_KEY = 'emonav_pending_sessions';

function getPending(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]') as Session[];
  } catch {
    return [];
  }
}

function savePending(sessions: Session[]) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(sessions));
}

export default function useSessionHistory(userId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async (days = 30) => {
    if (!userId) return;
    setLoading(true);
    try {
      const ref = collection(db, 'users', userId, 'sessions');
      const q = query(ref, orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));

      // Filter by days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const filtered = fetched.filter((s) => new Date(s.createdAt) >= cutoff);
      setSessions(filtered);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveSession = useCallback(async (session: Omit<Session, 'id' | 'userId' | 'audioUrl'>) => {
    if (!userId) return null;

    const sessionToSave = {
      ...session,
      userId,
      audioUrl: '', // not persisted
    };

    try {
      const ref = collection(db, 'users', userId, 'sessions');
      const docRef = await addDoc(ref, sessionToSave);

      // Update user profile totalSessions
      const profileRef = doc(db, 'users', userId);
      await setDoc(profileRef, { totalSessions: sessions.length + 1 }, { merge: true });

      const saved = { id: docRef.id, ...sessionToSave } as Session;
      setSessions((prev) => [saved, ...prev]);

      // Flush any pending offline sessions
      const pending = getPending();
      if (pending.length > 0) {
        for (const ps of pending) {
          try {
            await addDoc(ref, ps);
          } catch {}
        }
        savePending([]);
      }

      return saved;
    } catch (error) {
      console.error('Save failed, storing offline:', error);
      const pending = getPending();
      savePending([...pending, { ...sessionToSave, id: crypto.randomUUID() }]);
      return null;
    }
  }, [userId, sessions.length]);

  useEffect(() => {
    if (userId) fetchSessions();
  }, [userId, fetchSessions]);

  return { sessions, loading, fetchSessions, saveSession };
}
