import { useState } from "react";
import {
  User,
  LogOut,
  Shield,
  Database,
  ChevronRight,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { auth } from "../firebase";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { useApp } from "../context/AppContext";

export default function SettingsScreen() {
  const {
    user,
    openAuth,
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingSyncCount,
    lastSyncedAt,
    isSyncing,
    triggerSync,
    notes,
    sendTestAlert,
    requestPushPermission,
  } = useApp();

  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Notification toggles
  const [studyAlerts, setStudyAlerts] = useState(true);
  const [syncAlerts, setSyncAlerts] = useState(true);
  const [contentAlerts, setContentAlerts] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setResetError(null);
      await sendPasswordResetEmail(auth, user.email);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setResetError("পাসওয়ার্ড রিসেট লিঙ্ক পাঠাতে সমস্যা হয়েছে।");
    }
  };

  const hasPushPermission = "Notification" in window && Notification.permission === "granted";

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-neutral-800 bg-neutral-900/40 backdrop-blur">
        <h1 className="font-semibold text-sm text-white">সেটিংস ও অ্যাকাউন্ট</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. AUTHENTICATION & PROFILE CARD */}
        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 shadow-xs">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border border-neutral-700" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-lg border border-blue-500/30">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm text-white">{user.displayName || "ব্যবহারকারী"}</h3>
                    <p className="text-xs text-neutral-400 truncate max-w-[190px]">{user.email}</p>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full inline-block mt-1 font-medium">
                      ভেরিফাইড অ্যাকাউন্ট
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 bg-neutral-800 text-neutral-400 hover:text-red-400 rounded-xl hover:bg-neutral-750 transition"
                  title="লগআউট করুন"
                >
                  <LogOut size={18} />
                </button>
              </div>

              {/* Password reset action */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={handlePasswordReset}
                  className="text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <KeyRound size={14} className="text-blue-400" />
                  পাসওয়ার্ড রিসেট ইমেইল পাঠান
                </button>
                {resetSuccess && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> পাঠানো হয়েছে
                  </span>
                )}
                {resetError && <span className="text-[11px] text-red-400">{resetError}</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-2 border border-blue-500/20">
                <User size={24} />
              </div>
              <h3 className="font-semibold text-sm text-white mb-0.5">অ্যাকাউন্টে সাইন ইন করুন</h3>
              <p className="text-xs text-neutral-400 max-w-[240px] mb-3.5 leading-relaxed">
                ইমেইল/পাসওয়ার্ড দিয়ে লগইন করে ক্লাউড ব্যাকআপ, ডিভাইস সিঙ্কিং এবং অফলাইন নোট স্টোরেজ পরিচালনা করুন।
              </p>
              <div className="flex gap-2 w-full max-w-[280px]">
                <button
                  onClick={() => openAuth("signin")}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs"
                >
                  সাইন ইন
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold py-2.5 rounded-xl transition border border-neutral-700"
                >
                  নতুন অ্যাকাউন্ট
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. OFFLINE MODE & DATA SYNC */}
        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              {isOnline ? <Wifi size={18} className="text-emerald-400" /> : <WifiOff size={18} className="text-amber-400" />}
              <span className="text-xs font-semibold">অফলাইন মোড ও ডাটা সিঙ্ক</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div className="bg-neutral-950 p-3 rounded-xl space-y-2 border border-neutral-800/80 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>মোট অফলাইন নোট:</span>
              <span className="text-white font-medium">{notes.length} টি</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>সিঙ্কের অপেক্ষায়:</span>
              <span className="text-amber-400 font-medium">{pendingSyncCount} টি পরিবর্তন</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>সর্বশেষ সিঙ্ক:</span>
              <span className="text-neutral-300">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : "এখনো হয়নি"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={triggerSync}
              disabled={isSyncing || !isOnline}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium py-2 rounded-xl transition"
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "সিঙ্ক হচ্ছে..." : "এখন ক্লাউডে সিঙ্ক করুন"}
            </button>

            <button
              onClick={toggleSimulatedOffline}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                isSimulatedOffline
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-neutral-800 text-neutral-400 border-neutral-750 hover:text-white"
              }`}
              title="অফলাইন মোড টেস্ট করার জন্য সুইচ করুন"
            >
              {isSimulatedOffline ? "অনলাইনে ফিরুন" : "অফলাইন টেস্ট"}
            </button>
          </div>
        </div>

        {/* 3. PUSH NOTIFICATIONS & PERSONALIZED ALERTS */}
        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bell size={18} className="text-blue-400" />
              <span className="text-xs font-semibold">পুশ নোটিফিকেশন ও অ্যালার্ট</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">
              {hasPushPermission ? "অনুমোদিত" : "ডিফল্ট"}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            নতুন AI কন্টেন্ট, ডাটা সিঙ্ক কমপ্লিট এবং দৈনিক স্টাডি স্ট্রিকের নোটিফিকেশন সরাসরি আপনার ডিভাইসে পান।
          </p>

          {/* Toggle Switches */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-neutral-800/60">
              <span className="text-neutral-300">দৈনিক স্টাডি রিমাইন্ডার ও স্ট্রিক</span>
              <input
                type="checkbox"
                checked={studyAlerts}
                onChange={(e) => setStudyAlerts(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-neutral-800/60">
              <span className="text-neutral-300">ডাটা ও অফলাইন সিঙ্ক নোটিফিকেশন</span>
              <input
                type="checkbox"
                checked={syncAlerts}
                onChange={(e) => setSyncAlerts(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-neutral-300">নতুন কন্টেন্ট ও AI আপডেট অ্যালার্ট</span>
              <input
                type="checkbox"
                checked={contentAlerts}
                onChange={(e) => setContentAlerts(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-neutral-800">
            {!hasPushPermission && (
              <button
                onClick={requestPushPermission}
                className="flex-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium py-2 rounded-xl transition"
              >
                ব্রাউজার পারমিশন দিন
              </button>
            )}
            <button
              onClick={sendTestAlert}
              className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium py-2 rounded-xl transition"
            >
              টেস্ট নোটিফিকেশন পাঠান
            </button>
          </div>
        </div>

        {/* 4. SECURITY & STORAGE USAGE */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800/50">
            <div className="flex items-center gap-3 text-neutral-300">
              <Shield size={18} className="text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-white">সিকিউরিটি ও এনক্রিপশন</p>
                <p className="text-[10px] text-neutral-500">Firebase Auth & Firestore ABAC সুরক্ষিত</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Secure</span>
          </div>

          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3 text-neutral-300">
              <Database size={18} className="text-neutral-500" />
              <div>
                <p className="text-xs font-medium text-white">লোকাল ও ক্লাউড স্টোরেজ</p>
                <p className="text-[10px] text-neutral-500">অফলাইন স্টোরেজ ব্যাকআপ সচল</p>
              </div>
            </div>
            <span className="text-xs text-neutral-400">~ 2.4 MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
