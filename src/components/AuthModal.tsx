import React, { useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useApp } from "../context/AppContext";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuth, authModalTab, openAuth } = useApp();

  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "forgot">(authModalTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync tab with external caller
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setError(null);
    setSuccessMsg(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError(null);
    setSuccessMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("দয়া করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      resetForm();
      closeAuth();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।");
      } else if (err.code === "auth/wrong-password") {
        setError("ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিন।");
      } else if (err.code === "auth/invalid-email") {
        setError("ইমেইল অ্যাড্রেসের ফরম্যাট সঠিক নয়।");
      } else {
        setError(err.message || "লগইনে সমস্যা হয়েছে।");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError("সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন।");
      return;
    }
    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(newUser, { displayName: name.trim() });

      // Securely store profile in Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: name.trim(),
        photoURL: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        notificationPreferences: {
          studyAlerts: true,
          syncUpdates: true,
          newContent: true,
          pushEnabled: true,
        },
      });

      resetForm();
      closeAuth();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে। দয়া করে লগইন করুন।");
      } else if (err.code === "auth/weak-password") {
        setError("পাসওয়ার্ড দুর্বল। একটু শক্তিশালী পাসওয়ার্ড দিন।");
      } else {
        setError(err.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("পাসওয়ার্ড রিসেট করতে আপনার ইমেইল প্রদান করুন।");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg("আপনার ইমেইলে পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setError("এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।");
      } else {
        setError(err.message || "পাসওয়ার্ড রিসেট রিকোয়েস্ট ব্যর্থ হয়েছে।");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Zero extra cloud/workspace scopes requested
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      // Upsert profile in Firestore
      await setDoc(
        doc(db, "users", loggedUser.uid),
        {
          uid: loggedUser.uid,
          email: loggedUser.email,
          displayName: loggedUser.displayName || "Google User",
          photoURL: loggedUser.photoURL,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );

      resetForm();
      closeAuth();
    } catch (err: any) {
      console.error(err);
      setError("গুগল সাইন-ইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs px-0 sm:px-4">
      <div className="w-full max-w-[480px] bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeTab === "signin" && "অ্যাকাউন্টে প্রবেশ করুন"}
              {activeTab === "signup" && "নতুন অ্যাকাউন্ট তৈরি"}
              {activeTab === "forgot" && "পাসওয়ার্ড রিসেট"}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {activeTab === "signin" && "আপনার নোট ও ডেটা সিঙ্ক করতে লগইন করুন"}
              {activeTab === "signup" && "অফলাইন স্টোরেজ ও ক্লাউড ব্যাকআপের জন্য সাইন আপ করুন"}
              {activeTab === "forgot" && "ইমেইল দিয়ে রিসেট লিঙ্ক সংগ্রহ করুন"}
            </p>
          </div>
          <button
            onClick={closeAuth}
            className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800/80 hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switchers */}
        {activeTab !== "forgot" && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl my-4 border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === "signin"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              সাইন ইন (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === "signup"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              সাইন আপ (Register)
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 my-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 my-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">ইমেইল অ্যাড্রেস</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition">
                <Mail size={18} className="text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent text-sm w-full text-white placeholder-neutral-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-neutral-300">পাসওয়ার্ড</label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("forgot");
                    setError(null);
                  }}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition">
                <Lock size={18} className="text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-sm w-full text-white placeholder-neutral-500 outline-hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition disabled:opacity-50 text-sm shadow-md"
            >
              {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {activeTab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">পূর্ণ নাম</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition">
                <User size={18} className="text-neutral-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম"
                  className="bg-transparent text-sm w-full text-white placeholder-neutral-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">ইমেইল অ্যাড্রেস</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition">
                <Mail size={18} className="text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent text-sm w-full text-white placeholder-neutral-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition">
                <Lock size={18} className="text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-sm w-full text-white placeholder-neutral-500 outline-hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition">
                <Lock size={18} className="text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-sm w-full text-white placeholder-neutral-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition disabled:opacity-50 text-sm shadow-md"
            >
              {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "সাইন আপ করুন"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {activeTab === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">অ্যাকাউন্টের ইমেইল</label>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition">
                <Mail size={18} className="text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent text-sm w-full text-white placeholder-neutral-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition disabled:opacity-50 text-sm shadow-md"
            >
              {loading ? "পাঠানো হচ্ছে..." : "রিসেট লিঙ্ক পাঠান"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                ← লগইনে ফিরে যান
              </button>
            </div>
          </form>
        )}

        {/* Alternative Google Sign-in */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-neutral-900 px-3 text-neutral-500">অথবা</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 py-3 rounded-xl text-sm font-medium transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Google দিয়ে সাইন ইন করুন
        </button>
      </div>
    </div>
  );
}
