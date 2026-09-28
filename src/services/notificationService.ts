import { NotificationItem } from "../types";

const NOTIFICATIONS_STORAGE_KEY = "ik_supernote_notifications";
const NOTIF_PREFS_KEY = "ik_supernote_notif_prefs";

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "স্বাগতম IK-SuperNOTE এ!",
    message: "আপনার AI লার্নিং স্টুডিও প্রস্তুত। ইন্টারনেট ছাড়াই নোট লিখুন এবং অনলাইন হলে সিঙ্ক করুন।",
    type: "update",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "notif-2",
    title: "দৈনিক স্টাডি গোল রিমাইন্ডার",
    message: "আপনি ৪ দিনের স্টাডি স্ট্রিকে আছেন! আজ আপনার সেভ করা নোটগুলো একবার রিভাইস দিন।",
    type: "alert",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "notif-3",
    title: "নতুন AI কন্টেন্ট আপডেট",
    message: "Gemini 3.5 Flash ও 3.1 Pro দিয়ে নতুন থিংকিং মোড এবং অফলাইন নোট ড্রাফটিং চালু হয়েছে।",
    type: "content",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  }
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
  actionUrl?: string
): NotificationItem {
  // 1. Trigger Native Web Push / Notification if allowed
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: message,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "ik-supernote-alert",
      });
    } catch (err) {
      console.warn("Native notification display failed:", err);
    }
  }

  // 2. Persist in local in-app notification center
  const newItem: NotificationItem = {
    id: `notif-${Date.now()}`,
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

  return newItem;
}
