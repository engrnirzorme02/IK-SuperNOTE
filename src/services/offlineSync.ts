import { NoteItem, SyncQueueItem } from "../types";
import { db } from "../firebase";
import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { sendPushNotification } from "./notificationService";

const NOTES_STORAGE_KEY = "ik_supernote_offline_notes";
const QUEUE_STORAGE_KEY = "ik_supernote_sync_queue";
const LAST_SYNC_KEY = "ik_supernote_last_sync";

const INITIAL_DEMO_NOTES: NoteItem[] = [
  {
    id: "note-welcome",
    title: "স্বাগতম: অফলাইন মোড ব্যবহারের নিয়মাবলী",
    content: "এই অ্যাপ্লিকেশনটি অফলাইনেও পুরোপুরি কার্যকর। ইন্টারনেট সংযোগ না থাকলেও আপনি যেকোনো নোট বা আইডিয়া সেভ করতে পারবেন। পুনরায় কানেকশন ফিরে এলে এটি স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হয়ে যাবে।",
    category: "Notes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: true,
    syncedAt: new Date().toISOString(),
  },
  {
    id: "note-study-summary",
    title: "ক্লাউড আর্কিটেকচার ও মাইন্ড ম্যাপ নোটস",
    content: "১. মাইক্রোসার্ভিসেস ডিজাইন প্যাটার্নস\n২. ইভেন্ট-ড্রিভেন আর্কিটেকচার ও কাফকা স্ট্রিম\n৩. অফলাইন ফার্স্ট ডাটাবেস রেপ্লিকেশন ও সিঙ্কিং মেকানিজম।",
    category: "Study",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    synced: false,
  }
];

export function getOfflineNotes(): NoteItem[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_NOTES));
      return INITIAL_DEMO_NOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading offline notes:", e);
    return INITIAL_DEMO_NOTES;
  }
}

export function saveOfflineNotes(notes: NoteItem[]) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("Error saving offline notes:", e);
  }
}

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading sync queue:", e);
    return [];
  }
}

export function saveSyncQueue(queue: SyncQueueItem[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Error saving sync queue:", e);
  }
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSyncTime(isoDate: string) {
  localStorage.setItem(LAST_SYNC_KEY, isoDate);
}

export function enqueueSyncAction(action: SyncQueueItem["action"], payload: any) {
  const queue = getSyncQueue();
  const newItem: SyncQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    action,
    payload,
    timestamp: new Date().toISOString(),
    retries: 0,
  };
  queue.push(newItem);
  saveSyncQueue(queue);
  return queue.length;
}

export async function processSyncQueue(userId?: string): Promise<{ success: boolean; count: number }> {
  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { success: true, count: 0 };
  }

  if (!navigator.onLine) {
    console.warn("Cannot sync: device is offline");
    return { success: false, count: 0 };
  }

  let syncedCount = 0;
  const remainingQueue: SyncQueueItem[] = [];
  const notes = getOfflineNotes();

  for (const item of queue) {
    try {
      if (userId) {
        if (item.action === "CREATE_NOTE" || item.action === "UPDATE_NOTE") {
          const note: NoteItem = item.payload;
          const noteRef = doc(db, "users", userId, "notes", note.id);
          await setDoc(noteRef, {
            ...note,
            userId,
            synced: true,
            syncedAt: new Date().toISOString(),
          });

          // Mark as synced locally
          const idx = notes.findIndex((n) => n.id === note.id);
          if (idx !== -1) {
            notes[idx].synced = true;
            notes[idx].syncedAt = new Date().toISOString();
          }
        } else if (item.action === "DELETE_NOTE") {
          const noteId: string = item.payload.id;
          const noteRef = doc(db, "users", userId, "notes", noteId);
          await deleteDoc(noteRef);
        }
      }
      syncedCount++;
    } catch (err) {
      console.error("Failed to sync item:", item, err);
      item.retries += 1;
      if (item.retries < 3) {
        remainingQueue.push(item);
      }
    }
  }

  saveOfflineNotes(notes);
  saveSyncQueue(remainingQueue);
  const now = new Date().toISOString();
  setLastSyncTime(now);

  if (syncedCount > 0) {
    sendPushNotification(
      "ডাটা সিঙ্ক সফল হয়েছে",
      `${syncedCount} টি অফলাইন নোট ও পরিবর্তন ক্লাউডে সুরক্ষিতভাবে সিঙ্ক করা হয়েছে।`,
      "update"
    );
  }

  return { success: true, count: syncedCount };
}

export async function pullCloudNotes(userId: string): Promise<NoteItem[]> {
  try {
    if (!navigator.onLine) return getOfflineNotes();
    const notesRef = collection(db, "users", userId, "notes");
    const snapshot = await getDocs(notesRef);
    const cloudNotes: NoteItem[] = [];
    snapshot.forEach((docSnap) => {
      cloudNotes.push(docSnap.data() as NoteItem);
    });

    if (cloudNotes.length > 0) {
      const localNotes = getOfflineNotes();
      // Merge: keep local unsynced or newer
      const map = new Map<string, NoteItem>();
      cloudNotes.forEach((cn) => map.set(cn.id, { ...cn, synced: true }));
      localNotes.forEach((ln) => {
        if (!ln.synced || !map.has(ln.id)) {
          map.set(ln.id, ln);
        }
      });
      const merged = Array.from(map.values());
      saveOfflineNotes(merged);
      return merged;
    }
    return getOfflineNotes();
  } catch (err) {
    console.error("Error pulling cloud notes:", err);
    return getOfflineNotes();
  }
}
