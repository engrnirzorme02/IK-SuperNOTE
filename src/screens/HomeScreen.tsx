import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Bell,
  ShieldCheck,
  Plus,
  RefreshCw,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Send,
  UserCheck,
  UserPlus,
  KeyRound,
  FolderOpen,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { NoteItem } from "../types";

export default function HomeScreen() {
  const navigate = useNavigate();
  const {
    user,
    openAuth,
    isOnline,
    pendingSyncCount,
    lastSyncedAt,
    isSyncing,
    triggerSync,
    notes,
    createNote,
    notifications,
    unreadCount,
    setIsNotificationCenterOpen,
    sendTestAlert,
  } = useApp();

  // Quick Note Composer state on Dashboard
  const [quickTitle, setQuickTitle] = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [quickCategory, setQuickCategory] = useState<NoteItem["category"]>("Study");
  const [isQuickNoteExpanded, setIsQuickNoteExpanded] = useState(false);

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    createNote(
      quickTitle.trim(),
      quickContent.trim() || "ড্যাশবোর্ড থেকে দ্রুত সংরক্ষিত নোট।",
      quickCategory
    );
    setQuickTitle("");
    setQuickContent("");
    setIsQuickNoteExpanded(false);
  };

  const studyNotesCount = notes.filter((n) => n.category === "Study" || n.category === "Summary").length;
  const syncedNotesCount = notes.filter((n) => n.synced).length;
  const recentNotes = notes.slice(0, 3);
  const recentNotifications = notifications.slice(0, 2);

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 1. HERO WELCOME & AUTHENTICATION STATUS CARD */}
        <section className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <span>অ্যান্ড্রয়েড স্মার্ট ওয়ার্কস্পেস</span>
                <span aria-hidden="true">·</span>
                <span className={isOnline ? "text-emerald-400" : "text-amber-400"}>
                  {isOnline ? "অনলাইন মোড" : "অফলাইন মোড"}
                </span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight mt-0.5 truncate">
                {user ? `স্বাগতম, ${user.displayName || "ব্যবহারকারী"}` : "IK-SuperNOTE ড্যাশবোর্ড"}
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                {user
                  ? `${user.email} · SHA-256 ক্রেডেনশিয়াল ও ক্লাউড ব্যাকআপ সক্রিয়`
                  : "নোটস, ফাইল সামারি, পুশ অ্যালার্ট ও সিকিউর ক্লাউড সিঙ্কের সমন্বিত হাব"}
              </p>
            </div>

            {user ? (
              <button
                onClick={() => openAuth("signin")}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 shrink-0 transition"
              >
                <UserCheck size={14} className="text-emerald-400" />
                <span>প্রোফাইল</span>
              </button>
            ) : (
              <button
                onClick={() => openAuth("signin")}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition shadow-xs"
              >
                <UserPlus size={14} />
                <span>লগইন / সাইন আপ</span>
              </button>
            )}
          </div>

          {/* Quick Auth & Recovery Bar for immediate access */}
          {!user && (
            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                <span>ইমেইল/পাসওয়ার্ড রেজিস্ট্রেশন ও রিকভারি সাপোর্ট</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openAuth("signup")}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                >
                  রেজিস্ট্রেশন
                </button>
                <span className="text-neutral-700">·</span>
                <button
                  onClick={() => openAuth("forgot")}
                  className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition"
                >
                  <KeyRound size={11} />
                  <span>পাসওয়ার্ড রিসেট</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2. SUMMARY METRICS GRID (4 CARDS) */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              সারসংক্ষেপ ও স্ট্যাটাস
            </h2>
            <span className="text-[11px] text-neutral-500">
              {lastSyncedAt
                ? `সর্বশেষ সিঙ্ক: ${new Date(lastSyncedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "লোকাল স্টোরেজ সক্রিয়"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Total Notes Summary */}
            <button
              onClick={() => navigate("/files")}
              className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 text-left transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <ArrowUpRight size={14} className="text-neutral-500" />
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-white tabular-nums">{notes.length}</p>
                <p className="text-xs font-medium text-neutral-300 mt-0.5">মোট স্টাডি নোটস</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  {studyNotesCount} স্টাডি · {syncedNotesCount} সিঙ্কড
                </p>
              </div>
            </button>

            {/* Push Notifications Summary */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 text-left transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <span className="text-[11px] font-semibold text-amber-400">
                  {unreadCount > 0 ? `${unreadCount} নতুন` : "সব পড়া হয়েছে"}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-white tabular-nums">{notifications.length}</p>
                <p className="text-xs font-medium text-neutral-300 mt-0.5">পুশ নোটিফিকেশন</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  অ্যালার্ট · আপডেট · রিমাইন্ডার
                </p>
              </div>
            </button>

            {/* Offline & Cloud Sync Summary */}
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 text-left transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {pendingSyncCount === 0 ? "100% Synced" : `${pendingSyncCount} Pending`}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold text-white">
                  {isSyncing ? "সিঙ্ক হচ্ছে..." : "অফলাইন ও ক্লাউড সিঙ্ক"}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  ট্যাপ করে তাৎক্ষণিক ডাটা সিঙ্ক করুন
                </p>
              </div>
            </button>

            {/* Account Security Summary */}
            <button
              onClick={() => openAuth(user ? "signin" : "signup")}
              className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 text-left transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-[11px] text-sky-400 font-medium">
                  {user ? "Verified" : "Setup"}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold text-white">
                  {user ? "সিকিউর অ্যাকাউন্ট" : "অ্যাকাউন্ট নিরাপত্তা"}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  {user ? "SHA-256 ও ফায়ারবেস সুরক্ষিত" : "লগইন ও পাসওয়ার্ড রিকভারি"}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* 3. CORE FUNCTIONALITIES QUICK ACCESS LAUNCHPAD */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              কোর ফিচার ও দ্রুত অ্যাক্সেস
            </h2>
            <span className="text-[11px] text-neutral-500">ওয়ান-ট্যাপ শর্টকাট</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate("/chat")}
              className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex flex-col items-center text-center gap-2 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">স্টাডি চ্যাট</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">প্রশ্ন ও সমাধান</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/files")}
              className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex flex-col items-center text-center gap-2 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <FolderOpen size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">নোট ও ফাইল</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">সামারি ও আপলোড</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/media")}
              className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex flex-col items-center text-center gap-2 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <ImageIcon size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">ভিজ্যুয়াল স্টুডিও</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">ডায়াগ্রাম তৈরি</p>
              </div>
            </button>
          </div>
        </section>

        {/* 4. INSTANT QUICK NOTE COMPOSER ON DASHBOARD */}
        <section className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              <h2 className="text-xs font-semibold text-white">দ্রুত নোট লিখুন (Quick Note)</h2>
            </div>
            {isQuickNoteExpanded && (
              <button
                type="button"
                onClick={() => setIsQuickNoteExpanded(false)}
                className="text-[11px] text-neutral-400 hover:text-white"
              >
                সংক্ষিপ্ত করুন
              </button>
            )}
          </div>

          <form onSubmit={handleQuickNoteSubmit} className="space-y-2.5">
            <input
              type="text"
              value={quickTitle}
              onFocus={() => setIsQuickNoteExpanded(true)}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="নতুন আইডিয়া, সূত্র বা পরীক্ষার টপিক লিখুন..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-hidden focus:border-blue-500 transition"
              required
            />

            {isQuickNoteExpanded && (
              <>
                <textarea
                  value={quickContent}
                  onChange={(e) => setQuickContent(e.target.value)}
                  placeholder="বিস্তারিত বিবরণ বা পয়েন্টসমূহ..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-hidden focus:border-blue-500 resize-none transition"
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    {(["Study", "Notes", "Summary", "Idea"] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setQuickCategory(cat)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition ${
                          quickCategory === cat
                            ? "bg-blue-600 text-white"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1 transition"
                  >
                    <Plus size={14} />
                    <span>সেভ করুন</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </section>

        {/* 5. RECENT NOTES & SUMMARIES */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              সাম্প্রতিক নোটস ও সামারি
            </h2>
            <button
              onClick={() => navigate("/files")}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition"
            >
              সব দেখুন →
            </button>
          </div>

          <div className="space-y-2">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => navigate("/files")}
                className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-semibold text-white line-clamp-1">{note.title}</h3>
                  <CheckCircle2
                    size={14}
                    className={note.synced ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"}
                  />
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                  {note.content}
                </p>
                {/* Clean unboxed metadata per frontend-design discipline */}
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-2">
                  <span>{note.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  <span aria-hidden="true">·</span>
                  <span>{note.synced ? "ক্লাউড সিঙ্কড" : "অফলাইন লোকাল"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. PUSH NOTIFICATION ENGAGEMENT & LIVE FEED */}
        <section className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-amber-400" />
              <h2 className="text-xs font-semibold text-white">পুশ নোটিফিকেশন ও অ্যালার্ট ফীড</h2>
            </div>
            <button
              onClick={sendTestAlert}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
            >
              <Send size={11} />
              <span>পুশ পাঠান</span>
            </button>
          </div>

          <div className="space-y-2">
            {recentNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => setIsNotificationCenterOpen(true)}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 cursor-pointer transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                  {!item.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{item.message}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-xs font-medium text-neutral-200 transition"
          >
            নোটিফিকেশন সেন্টার ও কাস্টম পুশ খুলুন
          </button>
        </section>
      </div>
    </div>
  );
}
