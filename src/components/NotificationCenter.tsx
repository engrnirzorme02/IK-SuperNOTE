import React, { useState } from "react";
import { X, Bell, CheckCheck, Trash2, Sparkles, RefreshCw, AlertTriangle, Send } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function NotificationCenter() {
  const {
    notifications,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    sendTestAlert,
    requestPushPermission,
  } = useApp();

  const [filter, setFilter] = useState<"all" | "alert" | "update" | "content">("all");

  if (!isNotificationCenterOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "content":
        return <Sparkles className="text-purple-400" size={18} />;
      case "update":
        return <RefreshCw className="text-blue-400" size={18} />;
      case "alert":
      default:
        return <AlertTriangle className="text-amber-400" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs px-0 sm:px-4">
      <div className="w-full max-w-[480px] bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">নোটিফিকেশন সেন্টার</h2>
              <p className="text-[11px] text-neutral-400">আপডেট, নতুন কন্টেন্ট এবং পার্সোনালাইজড অ্যালার্ট</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationCenterOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between py-2.5 px-1">
          <div className="flex gap-1">
            {(["all", "alert", "update", "content"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-medium capitalize transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {f === "all" ? "সব" : f === "alert" ? "অ্যালার্ট" : f === "update" ? "আপডেট" : "কন্টেন্ট"}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            <button
              onClick={markAllNotificationsAsRead}
              title="সবগুলো পড়া হয়েছে মার্ক করুন"
              className="p-1.5 text-neutral-400 hover:text-blue-400 rounded-lg hover:bg-neutral-800 transition text-xs flex items-center gap-1"
            >
              <CheckCheck size={16} />
            </button>
            <button
              onClick={clearAllNotifications}
              title="সব ক্লিয়ার করুন"
              className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition text-xs"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
              <Bell size={32} className="opacity-30 mb-2" />
              <p className="text-sm font-medium">কোনো নোটিফিকেশন নেই</p>
              <p className="text-xs">নতুন কোনো আপডেট বা অ্যালার্ট আসলে এখানে দেখতে পাবেন।</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markNotificationAsRead(item.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex gap-3 ${
                  item.read
                    ? "bg-neutral-950/60 border-neutral-800/60 text-neutral-400"
                    : "bg-neutral-950 border-neutral-700/80 text-white shadow-xs"
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-neutral-500 mt-1.5 block">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions: Test alert & push permission */}
        <div className="pt-3 border-t border-neutral-800 flex gap-2">
          <button
            onClick={sendTestAlert}
            className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 py-2.5 rounded-xl text-xs font-medium transition"
          >
            <Send size={14} className="text-blue-400" />
            টেস্ট অ্যালার্ট পাঠান
          </button>
          <button
            onClick={requestPushPermission}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2.5 rounded-xl text-xs font-medium transition"
          >
            <Bell size={14} />
            পুশ পারমিশন সক্রিয় করুন
          </button>
        </div>
      </div>
    </div>
  );
}
