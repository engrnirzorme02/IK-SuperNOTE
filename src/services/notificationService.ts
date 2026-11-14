import { NotificationItem, NotificationPreferences } from "../types";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const NOTIFICATIONS_STORAGE_KEY = "ik_supernote_notifications";
const NOTIF_PREFS_KEY = "ik_supernote_notif_prefs";

type NotificationListener = (item: NotificationItem) => void;
const listeners: Set<NotificationListener> = new Set();

export function subscribeToNotifications(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const DEFAULT_PREFS: NotificationPreferences = {
  studyAlerts: true,
  syncUpdates: true,
  newContent: true,
  pushEnabled: true,
};

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences) {
  try {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Error saving notification preferences:", e);
  }
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "স্বাগতম IK-SuperNOTE এ!",
    message: "আপনার AI লার্নিং ও স্টাডি ড্যাশবোর্ড প্রস্তুত। ইন্টারনেট ছাড়াই নোট লিখুন এবং অনলাইন হলে সিঙ্ক করুন।",
    type: "update",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actionUrl: "/",
  },
  {
    id: "notif-2",
    title: "দৈনিক স্টাডি গোল রিমাইন্ডার",
    message: "আপনি ৪ দিনের স্টাডি স্ট্রিকে আছেন! আজ আপনার সেভ করা নোটগুলো একবার রিভাইস দিন।",
    type: "alert",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actionUrl: "/files",
  },
  {
    id: "notif-3",
    title: "নতুন স্টাডি সামারি প্রস্তুত",
    message: "হায়ার ম্যাথ ক্যালকুলাস ও মেশিন লার্নিং নোটস অফলাইন লাইব্রেরিতে যুক্ত হয়েছে।",
    type: "content",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actionUrl: "/files",
  },
];

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading stored notifications:", e);
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifs: NotificationItem[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error("Error saving notifications:", e);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (e) {
    console.error("Error requesting notification permission:", e);
    return "denied";
  }
}

export function sendPushNotification(
  title: string,
  message: string,
  type: "content" | "update" | "alert" = "alert",
  actionUrl?: string,
  userId?: string
): NotificationItem {
  const prefs = getNotificationPreferences();

  // 1. Trigger Native Web Push / Notification if allowed and pushEnabled
  if (prefs.pushEnabled && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: message,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: `ik-supernote-${Date.now()}`,
      });
    } catch (err) {
      console.warn("Native notification display failed:", err);
    }
  }

  // 2. Persist in local in-app notification center
  const newItem: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl,
  };

  const existing = getStoredNotifications();
  const updated = [newItem, ...existing];
  saveStoredNotifications(updated);

  // 3. Notify in-app real-time listeners (Android heads-up toast banner)
  listeners.forEach((listener) => listener(newItem));

  // 4. Optional Firestore cloud persistence for authenticated user
  if (userId && navigator.onLine) {
    const notifRef = doc(db, "users", userId, "notifications", newItem.id);
    setDoc(notifRef, {
      ...newItem,
      userId,
    }).catch((err) => {
      console.warn("Could not sync notification to Firestore:", err);
    });
  }

  return newItem;
}

