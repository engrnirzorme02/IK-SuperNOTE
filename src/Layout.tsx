import { Outlet, NavLink, useNavigate } from "react-router";
import {
  Home,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useApp } from "./context/AppContext";
import AuthModal from "./components/AuthModal";
import NotificationCenter from "./components/NotificationCenter";
import OfflineBanner from "./components/OfflineBanner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const navigate = useNavigate();
  const {
    user,
    openAuth,
    isOnline,
    toggleSimulatedOffline,
    unreadCount,
    setIsNotificationCenterOpen,
    activeToastNotification,
    dismissToastNotification,
    pendingSyncCount,
    isSyncing,
    triggerSync,
  } = useApp();

  return (
    <div className="flex justify-center items-center h-screen w-full bg-neutral-950 text-white overflow-hidden">
      <div className="flex flex-col h-full w-full max-w-[480px] bg-neutral-950 relative shadow-2xl border-x border-neutral-800/60">
        {/* Android Top App Bar */}
        <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-3.5 flex items-center justify-between shrink-0 z-40">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-sm shadow-xs text-white">
              SN
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">SuperNOTE</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSimulatedOffline();
                  }}
                  title="ক্লিক করে অফলাইন মোড টেস্ট করুন"
                  className={`flex items-center gap-1 text-[10px] font-medium transition ${
                    isOnline ? "text-emerald-400 hover:text-emerald-300" : "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                  <span>{isOnline ? "Online" : "Offline"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sync button */}
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              title={isOnline ? "ক্লাউডে সিঙ্ক করুন" : "অফলাইন অবস্থায় সিঙ্ক কিউ সেভ থাকবে"}
              className="relative p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin text-blue-400" : ""} />
              {pendingSyncCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[9px] font-bold bg-amber-500 text-black rounded-full flex items-center justify-center">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
              title="নোটিফিকেশন সেন্টার"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>

            {/* User Account Button */}
            {user ? (
              <button
                onClick={() => openAuth("signin")}
                className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center hover:border-blue-500 transition ml-1"
                title={user.email || "প্রোফাইল"}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-blue-400">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => openAuth("signin")}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl transition shadow-xs ml-1"
              >
                লগইন
              </button>
            )}
          </div>
        </header>

        {/* Android Real-Time Heads-Up Push Notification Toast Banner */}
        {activeToastNotification && (
          <div className="absolute top-16 left-3 right-3 z-50 bg-neutral-900/95 backdrop-blur-md border border-blue-500/40 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top duration-200">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bell size={16} />
            </div>
            <div
              onClick={() => {
                if (activeToastNotification.actionUrl) {
                  navigate(activeToastNotification.actionUrl);
                } else {
                  setIsNotificationCenterOpen(true);
                }
                dismissToastNotification();
              }}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium">
                <span>PUSH NOTIFICATION</span>
                <span>·</span>
                <span>এখনই</span>
              </div>
              <h4 className="text-xs font-bold text-white truncate mt-0.5">
                {activeToastNotification.title}
              </h4>
              <p className="text-xs text-neutral-300 line-clamp-2 mt-0.5 leading-snug">
                {activeToastNotification.message}
              </p>
            </div>
            <button
              onClick={dismissToastNotification}
              className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition shrink-0"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Dynamic Offline / Sync Notice */}
        <OfflineBanner />

        {/* Screen Content */}
        <main className="flex-1 overflow-y-auto pb-[72px]">
          <Outlet />
        </main>

        {/* Android Bottom Navigation (5 Core Tabs including Home Dashboard) */}
        <nav className="absolute bottom-0 w-full h-[72px] bg-neutral-900 border-t border-neutral-800 flex items-center justify-around px-1.5 z-40">
          <NavItem to="/" icon={<Home size={20} />} label="Home" />
          <NavItem to="/chat" icon={<MessageSquare size={20} />} label="Chat" />
          <NavItem to="/files" icon={<FileText size={20} />} label="Notes" />
          <NavItem to="/media" icon={<ImageIcon size={20} />} label="Studio" />
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>

        {/* Global Modals */}
        <AuthModal />
        <NotificationCenter />
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-16 h-14 gap-1 rounded-2xl transition-colors",
          isActive ? "text-blue-400 bg-blue-400/10 font-semibold" : "text-neutral-400 hover:text-neutral-300"
        )
      }
    >
      {icon}
      <span className="text-[10px] tracking-tight">{label}</span>
    </NavLink>
  );
}
