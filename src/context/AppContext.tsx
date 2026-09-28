import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NoteItem, NotificationItem, UserProfile } from "../types";
import {
  getOfflineNotes,
  saveOfflineNotes,
  getSyncQueue,
  enqueueSyncAction,
  processSyncQueue,
  getLastSyncTime,
  pullCloudNotes,
} from "../services/offlineSync";
import {
  getStoredNotifications,
  saveStoredNotifications,
  sendPushNotification,
  requestNotificationPermission,
} from "../services/notificationService";

interface AppContextType {
  // Auth
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAuthModalOpen: boolean;
  authModalTab: "signin" | "signup" | "forgot";
  openAuth: (tab?: "signin" | "signup" | "forgot") => void;
  closeAuth: () => void;

  // Offline & Sync
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;

  // Notes
  notes: NoteItem[];
  createNote: (title: string, content: string, category: NoteItem["category"]) => void;
  updateNote: (id: string, title: string, content: string, category: NoteItem["category"]) => void;
  deleteNote: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  sendTestAlert: () => void;
  requestPushPermission: () => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup" | "forgot">("signin");

  // Network & Sync states
  const [realOnline, setRealOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const isOnline = realOnline && !isSimulatedOffline;

  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getSyncQueue().length);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getLastSyncTime());
  const [isSyncing, setIsSyncing] = useState(false);

  // Notes & Notifications
  const [notes, setNotes] = useState<NoteItem[]>(() => getOfflineNotes());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStoredNotifications());
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => {
      setRealOnline(true);
      if (!isSimulatedOffline) {
        // Auto sync when connection is restored
        triggerSync();
        sendPushNotification(
          "ইন্টারনেট কানেকশন পুনরায় সক্রিয়",
          "আপনার ডিভাইস এখন অনলাইন আছে। অফলাইন ডাটা স্বয়ংক্রিয়ভাবে সিঙ্ক হচ্ছে।",
          "update"
        );
      }
    };

    const handleOffline = () => {
      setRealOnline(false);
      sendPushNotification(
        "অফলাইন মোড সক্রিয়",
        "ইন্টারনেট বিচ্ছিন্ন হয়েছে। আপনার কাজ সুরক্ষিতভাবে লোকাল স্টোরেজে সেভ থাকবে।",
        "alert"
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isSimulatedOffline, user]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create profile doc in Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "User",
              photoURL: firebaseUser.photoURL,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              notificationPreferences: {
                studyAlerts: true,
                syncUpdates: true,
                newContent: true,
                pushEnabled: true,
              },
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
          // Pull cloud notes on login
          if (navigator.onLine) {
            const cloudNotes = await pullCloudNotes(firebaseUser.uid);
            setNotes(cloudNotes);
            triggerSync();
          }
        } catch (e) {
          console.error("Error setting up user profile in Firestore:", e);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const openAuth = (tab: "signin" | "signup" | "forgot" = "signin") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuth = () => {
    setIsAuthModalOpen(false);
  };

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      if (next) {
        sendPushNotification(
          "অফলাইন মোড সক্রিয় (সিমুলেশন)",
          "আপনি ম্যানুয়ালি অফলাইন মোড অন করেছেন। এখন অফলাইন সেভ ও কিউ ফিচার টেস্ট করতে পারেন।",
          "alert"
        );
      } else {
        sendPushNotification(
          "অনলাইন মোড সক্রিয় (সিমুলেশন)",
          "কানেকশন রিস্টোর করা হয়েছে। পেন্ডিং ডাটা স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।",
          "update"
        );
        setTimeout(() => triggerSync(), 500);
      }
      return next;
    });
  };

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await processSyncQueue(user?.uid);
      setPendingSyncCount(getSyncQueue().length);
      setLastSyncedAt(getLastSyncTime());
      setNotes(getOfflineNotes());
      setNotifications(getStoredNotifications());
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const createNote = (title: string, content: string, category: NoteItem["category"]) => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      userId: user?.uid,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    saveOfflineNotes(updated);

    // Enqueue for cloud sync
    const queueLen = enqueueSyncAction("CREATE_NOTE", newNote);
    setPendingSyncCount(queueLen);

    // If online, auto sync immediately
    if (isOnline && user) {
      triggerSync();
    } else {
      sendPushNotification(
        "নোট অফলাইনে সেভ করা হয়েছে",
        `"${title}" নিরাপদে লোকাল মেমরিতে জমা হয়েছে। অনলাইনে এলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।`,
        "content"
      );
      setNotifications(getStoredNotifications());
    }
  };

  const updateNote = (id: string, title: string, content: string, category: NoteItem["category"]) => {
    const updated = notes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          title,
          content,
          category,
          updatedAt: new Date().toISOString(),
          synced: false,
        };
      }
      return n;
    });
    setNotes(updated);
    saveOfflineNotes(updated);

    const changedNote = updated.find((n) => n.id === id);
    if (changedNote) {
      const queueLen = enqueueSyncAction("UPDATE_NOTE", changedNote);
      setPendingSyncCount(queueLen);
      if (isOnline && user) {
        triggerSync();
      }
    }
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveOfflineNotes(updated);

    const queueLen = enqueueSyncAction("DELETE_NOTE", { id });
    setPendingSyncCount(queueLen);
    if (isOnline && user) {
      triggerSync();
    }
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveStoredNotifications([]);
  };

  const sendTestAlert = () => {
    const types: Array<"content" | "update" | "alert"> = ["alert", "update", "content"];
    const titles = [
      "দৈনিক স্টাডি নোটিফিকেশন",
      "নতুন AI ইউটিউব সামারি প্রস্তুত!",
      "অফলাইন সিঙ্ক রিমাইন্ডার",
      "পাসওয়ার্ড ও অ্যাকাউন্ট সিকিউরিটি অ্যালার্ট",
    ];
    const messages = [
      "আপনার রিভিশন লিস্টে ২টি অফলাইন নোট বাকি আছে।",
      "NoteGPT ইন্টেলিজেন্স দ্বারা আপনার লেকচার ফাইল প্রসেস সম্পন্ন হয়েছে।",
      "সবগুলো অফলাইন পরিবর্তন ব্যাকআপ করার জন্য সিঙ্ক চেক করুন।",
      "আপনার প্রোফাইল সফলভাবে ভেরিফাই ও সুরক্ষিত হয়েছে।",
    ];
    const rand = Math.floor(Math.random() * titles.length);
    sendPushNotification(titles[rand], messages[rand], types[rand % 3]);
    setNotifications(getStoredNotifications());
  };

  const requestPushPermission = async () => {
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      sendPushNotification(
        "পুশ নোটিফিকেশন চালু হয়েছে!",
        "এখন থেকে নতুন কন্টেন্ট এবং গুরুত্বপূর্ণ সব আপডেট সরাসরি পাবেন।",
        "update"
      );
      setNotifications(getStoredNotifications());
    }
    return perm;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        isAuthModalOpen,
        authModalTab,
        openAuth,
        closeAuth,
        isOnline,
        isSimulatedOffline,
        toggleSimulatedOffline,
        pendingSyncCount,
        lastSyncedAt,
        isSyncing,
        triggerSync,
        notes,
        createNote,
        updateNote,
        deleteNote,
        notifications,
        unreadCount,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        sendTestAlert,
        requestPushPermission,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
