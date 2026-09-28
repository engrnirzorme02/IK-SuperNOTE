import React from "react";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function OfflineBanner() {
  const {
    isOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingSyncCount,
    isSyncing,
    triggerSync,
    lastSyncedAt,
  } = useApp();

  return (
    <div className="w-full">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-2 flex items-center justify-between text-xs text-amber-300 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-amber-400 shrink-0" />
            <span>
              <strong>অফলাইন মোড সক্রিয়</strong> • {pendingSyncCount > 0 ? `${pendingSyncCount} টি আইটেম সিঙ্কের অপেক্ষায়` : "লোকাল সেভ সচল"}
            </span>
          </div>

          <button
            onClick={toggleSimulatedOffline}
            className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/40 transition font-medium"
          >
            {isSimulatedOffline ? "অনলাইনে ফিরুন" : "চেক করুন"}
          </button>
        </div>
      )}

      {/* Sync in progress / pending bar when online */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="bg-blue-500/15 border-b border-blue-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <CloudUpload size={14} className="text-blue-400 shrink-0" />
            <span>{pendingSyncCount} টি পরিবর্তন ক্লাউডে আপলোডের অপেক্ষায়</span>
          </div>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2.5 py-0.5 rounded-md font-medium transition disabled:opacity-50"
          >
            <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "সিঙ্ক হচ্ছে..." : "এখন সিঙ্ক করুন"}
          </button>
        </div>
      )}
    </div>
  );
}
