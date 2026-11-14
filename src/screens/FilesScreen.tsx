import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Plus,
  Cloud,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  X,
  Upload,
  Sparkles,
  FileCode,
  FileAudio,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Share2,
  Loader2,
  Copy,
  ExternalLink,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router";
import Markdown from "react-markdown";
import { useApp } from "../context/AppContext";
import { NoteItem, UploadedFileItem } from "../types";

const UPLOADED_FILES_KEY = "ik_supernote_uploaded_files";

const INITIAL_DEMO_FILES: UploadedFileItem[] = [
  {
    id: "file-1",
    name: "HSC_Higher_Math_Formula.pdf",
    size: 245000,
    type: "application/pdf",
    uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    content: "Higher Mathematics: Calculus, Differential Equations, Integration formulas and Trigonometric identities for HSC examination preparation.",
    category: "Study",
  },
  {
    id: "file-2",
    name: "Machine_Learning_Overview.txt",
    size: 18400,
    type: "text/plain",
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    content: "Machine Learning Concepts: Supervised Learning, Unsupervised Learning, Reinforcement Learning, Loss Functions, Gradient Descent and Neural Network Architectures.",
    category: "Notes",
  },
  {
    id: "file-3",
    name: "English_Spoken_Lecture_01.mp3",
    size: 1450000,
    type: "audio/mp3",
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    content: "Lecture on common English conversational phrases, phonetics, and daily speech practices for fluently communicating in professional environments.",
    category: "Study",
  },
];

export default function FilesScreen() {
  const { notes, createNote, updateNote, deleteNote, user, openAuth } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"notes" | "files" | "drive">("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>(() => {
    try {
      const saved = localStorage.getItem(UPLOADED_FILES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DEMO_FILES;
    } catch {
      return INITIAL_DEMO_FILES;
    }
  });

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteItem["category"]>("Notes");

  // AI Summary Modal State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingFileName, setAnalyzingFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ title: string; content: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(UPLOADED_FILES_KEY, JSON.stringify(uploadedFiles));
    } catch (e) {
      console.error("Save files error:", e);
    }
  }, [uploadedFiles]);

  // Standard File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isText = file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json");

    if (isText) {
      reader.onload = () => {
        const textContent = reader.result as string;
        const newFileItem: UploadedFileItem = {
          id: `file-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          uploadedAt: new Date().toISOString(),
          content: textContent,
          category: "Notes",
        };
        setUploadedFiles((prev) => [newFileItem, ...prev]);
        setActiveTab("files");
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const base64Data = reader.result as string;
        const newFileItem: UploadedFileItem = {
          id: `file-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString(),
          base64: base64Data.split(",")[1] || base64Data,
          category: file.type.includes("audio") ? "Study" : "Notes",
        };
        setUploadedFiles((prev) => [newFileItem, ...prev]);
        setActiveTab("files");
      };
      reader.readAsDataURL(file);
    }

    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // AI Analysis of File
  const handleAnalyzeFile = async (file: UploadedFileItem) => {
    setIsAnalyzing(true);
    setAnalyzingFileName(file.name);
    try {
      let res;
      if (file.content) {
        res = await fetch("/api/analyze/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: file.content,
            prompt: `নথি: "${file.name}"। অনুগ্রহ করে এই ডকুমেন্টের সম্পূর্ণ বিশ্লেষণ তৈরি করুন: ১. সারসংক্ষেপ (Executive Summary), ২. বুলেট পয়েন্টে প্রধান বিষয়সমূহ (Key Concepts), ৩. স্টাডি ফ্ল্যাশকার্ড ও প্রশ্ন-উত্তর (Study Q&A), ৪. গুরুত্বপূর্ণ সিদ্ধান্ত বা অ্যাকশন আইটেম। সহজ ও সাবলীল বাংলা ভাষায় লিখুন।`,
          }),
        });
      } else {
        res = await fetch("/api/analyze/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `File name: ${file.name}, type: ${file.type}. Please generate a comprehensive study guide, summary and key takeaway notes for this document.`,
          }),
        });
      }

      const data = await res.json();
      setAnalysisResult({
        title: `${file.name} - NoteGPT AI বিশ্লেষণ`,
        content: data.summary || "বিশ্লেষণ সম্পন্ন হয়েছে।",
      });
    } catch (err) {
      console.error(err);
      setAnalysisResult({
        title: `${file.name} - বিশ্লেষণ`,
        content: "ফাইলটি বিশ্লেষণে সাময়িক ত্রুটি হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে পুনরায় চেষ্টা করুন।",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysisAsNote = () => {
    if (!analysisResult) return;
    createNote(analysisResult.title, analysisResult.content, "Summary");
    setAnalysisResult(null);
    setActiveTab("notes");
  };

  const handleCopyAnalysis = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenEditor = (note?: NoteItem) => {
    if (note) {
      setEditingNoteId(note.id);
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
    } else {
      setEditingNoteId(null);
      setTitle("");
      setContent("");
      setCategory("Notes");
    }
    setIsEditorOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingNoteId) {
      updateNote(editingNoteId, title.trim(), content.trim(), category);
    } else {
      createNote(title.trim(), content.trim(), category);
    }
    setIsEditorOpen(false);
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText size={18} className="text-red-400" />;
    if (type.includes("audio")) return <FileAudio size={18} className="text-amber-400" />;
    if (type.includes("image")) return <ImageIcon size={18} className="text-emerald-400" />;
    if (type.includes("sheet") || type.includes("csv")) return <FileSpreadsheet size={18} className="text-emerald-500" />;
    return <FileCode size={18} className="text-blue-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "All" || n.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredFiles = uploadedFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Standard Android Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg,.mp3,.wav,.m4a"
        onChange={handleFileUpload}
      />

      {/* Sub Header / Android Action Bar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900/40 backdrop-blur">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-sm text-white">নোটস ও ফাইল হাব</h1>
          <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400">
            {activeTab === "notes" ? `${notes.length} নোট` : `${uploadedFiles.length} ফাইল`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Standard Android File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-full border border-neutral-700 transition"
            title="গ্যালারি বা ডিভাইস থেকে ফাইল আপলোড করুন"
          >
            <Upload size={13} className="text-blue-400" /> ফাইল আপলোড
          </button>

          {/* New Note Button */}
          <button
            onClick={() => handleOpenEditor()}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition shadow-xs"
          >
            <Plus size={14} /> নতুন নোট
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-2.5 flex gap-1.5 border-b border-neutral-900 bg-neutral-950">
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "notes"
              ? "bg-neutral-800 text-white shadow-xs border border-neutral-700"
              : "text-neutral-400 hover:bg-neutral-900"
          }`}
        >
          <FileText size={13} className="text-blue-400" /> অফলাইন নোটবুক
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "files"
              ? "bg-neutral-800 text-white shadow-xs border border-neutral-700"
              : "text-neutral-400 hover:bg-neutral-900"
          }`}
        >
          <BookOpen size={13} className="text-amber-400" /> আপলোডকৃত ফাইল
        </button>
        <button
          onClick={() => setActiveTab("drive")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "drive"
              ? "bg-neutral-800 text-white shadow-xs border border-neutral-700"
              : "text-neutral-400 hover:bg-neutral-900"
          }`}
        >
          <Cloud size={13} className="text-emerald-400" /> Google Drive
        </button>
      </div>

      {/* 1. NOTES TAB */}
      {activeTab === "notes" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Category Filter */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 bg-neutral-900/90 rounded-xl px-3 py-2 border border-neutral-800">
              <Search size={15} className="text-neutral-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নোট বা ডকুমেন্টে খুঁজুন..."
                className="bg-transparent text-xs w-full text-white placeholder-neutral-500 outline-hidden"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-neutral-300">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-xs">
              {(["All", "Notes", "Study", "Summary", "Idea"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                  }`}
                >
                  {cat === "All" ? "সব" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500">
                <FileText size={36} className="opacity-30 mb-2" />
                <p className="text-sm font-medium text-neutral-300">কোনো নোট পাওয়া যায়নি</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-[220px]">
                  ইন্টারনেট ছাড়াও আপনি যেকোনো সময় নতুন নোট লিখতে বা এডিট করতে পারেন।
                </p>
                <button
                  onClick={() => handleOpenEditor()}
                  className="mt-4 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  প্রথম নোট তৈরি করুন
                </button>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition flex flex-col gap-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                          {note.category}
                        </span>
                        {note.synced ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            <CheckCircle2 size={11} /> ক্লাউডে সিঙ্কড
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                            <Clock size={11} /> অফলাইনে সংরক্ষিত
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-white truncate">{note.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditor(note)}
                        className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
                        title="এডিট করুন"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                        title="ডিলিট করুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1.5 border-t border-neutral-800/60">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        handleAnalyzeFile({
                          id: note.id,
                          name: note.title,
                          size: note.content.length,
                          type: "text/plain",
                          uploadedAt: note.updatedAt,
                          content: note.content,
                        });
                      }}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <Sparkles size={11} /> NoteGPT সামারি
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. UPLOADED FILES TAB */}
      {activeTab === "files" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick upload alert banner */}
          <div className="p-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Upload size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">স্ট্যান্ডার্ড ফাইল আপলোডার</h4>
                  <p className="text-[11px] text-neutral-400">PDF, TXT, অডিও বা ইমেজ সরাসরি যুক্ত করুন</p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition shadow-xs"
              >
                ব্রাউজ ফাইল
              </button>
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500">
                <Upload size={36} className="opacity-30 mb-2" />
                <p className="text-sm font-medium text-neutral-300">কোনো ফাইল আপলোড করা হয়নি</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">
                  উপরে "ফাইল আপলোড" বাটনে ট্যাপ করে আপনার ফোন বা ডিভাইস থেকে সরাসরি ডকুমেন্ট যুক্ত করুন।
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  ফাইল সিলেক্ট করুন
                </button>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center shrink-0 mt-0.5">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-white truncate max-w-[210px]">{file.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                      title="ফাইল মুছে ফেলুন"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Android 1-Tap Fast Actions */}
                  <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleAnalyzeFile(file)}
                      disabled={isAnalyzing}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/20 text-[11px] font-semibold py-1.5 rounded-xl transition"
                    >
                      {isAnalyzing && analyzingFileName === file.name ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>বিশ্লেষণ হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          <span>NoteGPT সামারি</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        navigate("/chat");
                      }}
                      className="flex items-center justify-center gap-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-medium px-3 py-1.5 rounded-xl transition border border-neutral-700/60"
                      title="AI চ্যাটে আলোচনা করুন"
                    >
                      <MessageSquare size={12} />
                      <span>চ্যাট</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. GOOGLE DRIVE TAB */}
      {activeTab === "drive" && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">
            <Cloud size={32} />
          </div>
          <h3 className="font-semibold text-white text-base mb-1">অফলাইন ডকুমেন্ট হাব</h3>
          <span className="text-[11px] bg-neutral-800 text-neutral-300 border border-neutral-700/60 px-3 py-1 rounded-full mb-3 inline-block">
            🔒 Google Cloud ব্যাকএন্ড এপিআই রিকোয়েস্ট সফলভাবে নিষ্ক্রিয় (প্যাসিভ মোড)
          </span>
          <p className="text-xs text-neutral-400 max-w-[300px] mb-5 leading-relaxed">
            বাহ্যিক ক্লাউড অটোমেশন ও এপিআই কলিং বন্ধ রাখা হয়েছে। ডিভাইসের লোকাল মেমরি থেকে ফাইল ইম্পোর্ট ও অফলাইন স্টাডি নোট তৈরি করুন।
          </p>

          <div className="w-full max-w-[340px] bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">লোকাল প্রিভিউ ফাইলসমূহ:</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                Offline Safe
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-300 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="min-w-0 pr-2">
                  <p className="truncate font-medium">Higher_Math_Calculus_2026.docx</p>
                  <span className="text-[10px] text-neutral-500">Local Document • 182 KB</span>
                </div>
                <button
                  onClick={() => {
                    createNote(
                      "Higher Math Calculus Summary (লোকাল ডকুমেন্ট)",
                      "Calculus derivatives, integration techniques, and application problems for HSC.",
                      "Study"
                    );
                    setActiveTab("notes");
                  }}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-medium px-2 py-1 rounded-lg shrink-0"
                >
                  ইম্পোর্ট
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-300 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="min-w-0 pr-2">
                  <p className="truncate font-medium">AI_Neural_Networks_Slides.pdf</p>
                  <span className="text-[10px] text-neutral-500">Local Document • 2.4 MB</span>
                </div>
                <button
                  onClick={() => {
                    createNote(
                      "Neural Networks Overview (লোকাল ডকুমেন্ট)",
                      "Key concepts of perceptron, backpropagation, and deep learning architectures.",
                      "Summary"
                    );
                    setActiveTab("notes");
                  }}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-medium px-2 py-1 rounded-lg shrink-0"
                >
                  ইম্পোর্ট
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs px-0 sm:px-4">
          <div className="w-full max-w-[480px] bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white">
                {editingNoteId ? "নোট এডিট করুন" : "নতুন অফলাইন নোট লিখুন"}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-neutral-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">শিরোনাম</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="নোটের নাম..."
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-hidden focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">ক্যাটাগরি</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Notes", "Study", "Summary", "Idea"] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 text-xs font-medium rounded-xl border transition ${
                        category === cat
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">বিস্তারিত বিবরণ</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="আপনার নোট লিখুন (ইন্টারনেট না থাকলেও এটি লোকাল মেমরিতে সুরক্ষিত থাকবে)..."
                  rows={6}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-hidden focus:border-blue-500 resize-none transition"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NoteGPT AI Analysis Sheet/Modal */}
      {analysisResult && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs px-0 sm:px-4">
          <div className="w-full max-w-[480px] max-h-[85vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-xs font-bold text-white truncate">{analysisResult.title}</h3>
              </div>
              <button
                onClick={() => setAnalysisResult(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-neutral-800 transition shrink-0 ml-2"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-4 text-xs text-neutral-300 leading-relaxed space-y-3 prose prose-invert max-w-none">
              <Markdown>{analysisResult.content}</Markdown>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex gap-2">
              <button
                onClick={handleCopyAnalysis}
                className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold py-2 rounded-xl transition"
              >
                {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? "কপি হয়েছে" : "কপি করুন"}</span>
              </button>
              <button
                onClick={handleSaveAnalysisAsNote}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl transition shadow-xs"
              >
                <Plus size={14} />
                <span>অফলাইন নোটে সেভ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
