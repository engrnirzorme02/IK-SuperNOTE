import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NoteItem, NotificationItem, NotificationPreferences, UserProfile } from "../types";
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
  subscribeToNotifications,
  getNotificationPreferences,
  saveNotificationPreferences,
} from "../services/notificationService";
import {
  getActiveLocalSession,
  setActiveLocalSession,
} from "../services/authVault";

interface AppContextType {
  // Auth
  user: UserProfile | null;
  userProfile: UserProfile | null;
  isAuthModalOpen: boolean;
  authModalTab: "signin" | "signup" | "forgot";
  openAuth: (tab?: "signin" | "signup" | "forgot") => void;
  closeAuth: () => void;
  loginWithProfile: (profile: UserProfile) => void;
  logoutUser: () => Promise<void>;

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
  activeToastNotification: NotificationItem | null;
  dismissToastNotification: () => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  sendTestAlert: () => void;
  sendCustomNotification: (
    title: string,
    message: string,
    type: "content" | "update" | "alert",
    actionUrl?: string
  ) => void;
  requestPushPermission: () => Promise<string>;
  notificationPrefs: NotificationPreferences;
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth states (initialized from Secure Local Vault session for instant startup)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getActiveLocalSession());
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
  const [activeToastNotification, setActiveToastNotification] = useState<NotificationItem | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() =>
    getNotificationPreferences()
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Subscribe to real-time push notifications for Android heads-up banner
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeToNotifications((newItem) => {
      setNotifications(getStoredNotifications());
      setActiveToastNotification(newItem);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setActiveToastNotification(null);
      }, 4500);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => {
      setRealOnline(true);
      if (!isSimulatedOffline) {
        triggerSync();
        sendPushNotification(
          "ইন্টারনেট সংযোগ পুনরায় সক্রিয়",
          "আপনার ডিভাইস এখন অনলাইন আছে। অফলাইন ডাটা স্বয়ংক্রিয়ভাবে সিঙ্ক হচ্ছে।",
          "update",
          "/",
          userProfile?.uid
        );
      }
    };

    const handleOffline = () => {
      setRealOnline(false);
      sendPushNotification(
        "অফলাইন মোড সক্রিয়",
        "ইন্টারনেট বিচ্ছিন্ন হয়েছে। আপনার কাজ সুরক্ষিতভাবে লোকাল স্টোরেজে সেভ থাকবে।",
        "alert",
        "/files",
        userProfile?.uid
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isSimulatedOffline, userProfile]);

  // Firebase Auth listener synced with Local Secure Session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          let resolvedProfile: UserProfile;
          if (docSnap.exists()) {
            resolvedProfile = docSnap.data() as UserProfile;
          } else {
            resolvedProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              photoURL: firebaseUser.photoURL,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              notificationPreferences: getNotificationPreferences(),
            };
            await setDoc(userDocRef, resolvedProfile);
          }
          setUserProfile(resolvedProfile);
          setActiveLocalSession(resolvedProfile);

          if (navigator.onLine) {
            const cloudNotes = await pullCloudNotes(firebaseUser.uid);
            setNotes(cloudNotes);
            triggerSync();
          }
        } catch (e) {
          console.warn("Using local session profile:", e);
          const fallbackProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            photoURL: firebaseUser.photoURL,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            notificationPreferences: getNotificationPreferences(),
          };
          setUserProfile(fallbackProfile);
          setActiveLocalSession(fallbackProfile);
        }
      } else {
        // Keep local vault session if active
        const localSession = getActiveLocalSession();
        if (localSession) {
          setUserProfile(localSession);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    setActiveLocalSession(profile);
    if (navigator.onLine) {
      setDoc(doc(db, "users", profile.uid), profile, { merge: true }).catch(() => {
        // Offline or restricted Firestore fallback
      });
      pullCloudNotes(profile.uid)
        .then((merged) => setNotes(merged))
        .catch(() => {});
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore Firebase signout error if offline
    }
    setActiveLocalSession(null);
    setUserProfile(null);
    sendPushNotification(
      "সাইন আউট সম্পন্ন",
      "আপনি সফলভাবে অ্যাকাউন্ট থেকে লগআউট করেছেন। লোকাল নোটগুলো ডিভাইসে সংরক্ষিত আছে।",
      "alert"
    );
  };

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
          "alert",
          "/files",
          userProfile?.uid
        );
      } else {
        sendPushNotification(
          "অনলাইন মোড সক্রিয় (সিমুলেশন)",
          "কানেকশন রিস্টোর করা হয়েছে। পেন্ডিং ডাটা স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।",
          "update",
          "/",
          userProfile?.uid
        );
        setTimeout(() => triggerSync(), 400);
      }
      return next;
    });
  };

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await processSyncQueue(userProfile?.uid);
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
      userId: userProfile?.uid,
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

    const queueLen = enqueueSyncAction("CREATE_NOTE", newNote);
    setPendingSyncCount(queueLen);

    if (isOnline && userProfile) {
      triggerSync();
      sendPushNotification(
        "নতুন নোট তৈরি ও সিঙ্ক হয়েছে",
        `"${title}" আপনার ক্লাউড ও অফলাইন স্টোরেজে সংরক্ষিত হয়েছে।`,
        "content",
        "/files",
        userProfile.uid
      );
    } else {
      sendPushNotification(
        "নোট অফলাইনে সেভ করা হয়েছে",
        `"${title}" নিরাপদে লোকাল মেমরিতে জমা হয়েছে। অনলাইনে এলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।`,
        "content",
        "/files",
        userProfile?.uid
      );
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
      if (isOnline && userProfile) {
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
    if (isOnline && userProfile) {
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

  const dismissToastNotification = () => {
    setActiveToastNotification(null);
  };

  const sendCustomNotification = (
    title: string,
    message: string,
    type: "content" | "update" | "alert",
    actionUrl?: string
  ) => {
    sendPushNotification(title, message, type, actionUrl, userProfile?.uid);
    setNotifications(getStoredNotifications());
  };

  const sendTestAlert = () => {
    const presets: Array<{
      title: string;
      message: string;
      type: "content" | "update" | "alert";
      actionUrl: string;
    }> = [
      {
        title: "দৈনিক স্টাডি রিমাইন্ডার",
        message: "আপনার রিভিশন লিস্টে ২টি অফলাইন নোট ও ফ্ল্যাশকার্ড বাকি আছে। এখনই রিভিউ করুন!",
        type: "alert",
        actionUrl: "/files",
      },
      {
        title: "NoteGPT ফাইল সামারি প্রস্তুত!",
        message: "আপনার সর্বশেষ ডকুমেন্টের মূল পয়েন্ট ও প্রশ্নোত্তর তৈরি সম্পন্ন হয়েছে।",
        type: "content",
        actionUrl: "/files",
      },
      {
        title: "ক্লাউড ও অফলাইন ব্যাকআপ আপডেট",
        message: "আপনার সব নোট ও ইউজার ক্রেডেনশিয়াল SHA-256 ও ফায়ারবেসে সুরক্ষিত আছে।",
        type: "update",
        actionUrl: "/settings",
      },
    ];
    const pick = presets[Math.floor(Math.random() * presets.length)];
    sendPushNotification(pick.title, pick.message, pick.type, pick.actionUrl, userProfile?.uid);
    setNotifications(getStoredNotifications());
  };

  const requestPushPermission = async () => {
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      sendPushNotification(
        "পুশ নোটিফিকেশন চালু হয়েছে!",
        "এখন থেকে নতুন কন্টেন্ট এবং গুরুত্বপূর্ণ সব আপডেট সরাসরি পাবেন।",
        "update",
        "/",
        userProfile?.uid
      );
      setNotifications(getStoredNotifications());
    }
    return perm;
  };

  const updateNotificationPrefs = (partial: Partial<NotificationPreferences>) => {
    const updated = { ...notificationPrefs, ...partial };
    setNotificationPrefs(updated);
    saveNotificationPreferences(updated);
    if (userProfile && navigator.onLine) {
      setDoc(
        doc(db, "users", userProfile.uid),
        { notificationPreferences: updated },
        { merge: true }
      ).catch(() => {});
    }
  };

  return (
    <AppContext.Provider
      value={{
        user: userProfile,
        userProfile,
        isAuthModalOpen,
        authModalTab,
        openAuth,
        closeAuth,
        loginWithProfile,
        logoutUser,
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
        activeToastNotification,
        dismissToastNotification,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        sendTestAlert,
        sendCustomNotification,
        requestPushPermission,
        notificationPrefs,
        updateNotificationPrefs,
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
