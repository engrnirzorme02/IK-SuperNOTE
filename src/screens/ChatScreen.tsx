import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Paperclip,
  Loader2,
  Brain,
  Search,
  Map,
  Clock,
  Plus,
  Volume2,
  Copy,
  Check,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import Markdown from "react-markdown";
import { cn } from "../Layout";
import { useApp } from "../context/AppContext";

const CHAT_STORAGE_KEY = "ik_supernote_chat_history";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  isOfflineQueued?: boolean;
  attachmentName?: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: "model",
    text: "হ্যালো! আমি **IK-SuperNOTE AI**। আমি আপনার নোট তৈরি, যেকোনো ফাইল ও ডকুমেন্টের সামারি, পরীক্ষার প্রশ্নপত্র তৈরি এবং অফলাইন স্টাডি গাইড তৈরিতে সাহায্য করতে পারি। আজ আপনি কী নিয়ে পড়াশোনা করতে চান?",
  },
];

export default function ChatScreen() {
  const { isOnline, createNote } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_MESSAGES;
    } catch {
      return DEFAULT_MESSAGES;
    }
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [grounding, setGrounding] = useState<"none" | "search" | "maps">("none");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  // File attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    content?: string;
    base64?: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("Chat save error:", e);
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Handle Voice Input (Speech Recognition)
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback
      setInput("অফলাইন স্টাডি টেকনিক এবং নোট তৈরির নিয়ম কী?");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "bn-BD";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition could not start:", err);
      setIsListening(false);
    }
  };

  // Handle Standard File Picker for Chat Attachment
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isText = file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json");
    const reader = new FileReader();

    if (isText) {
      reader.onload = () => {
        setAttachment({
          name: file.name,
          type: file.type || "text/plain",
          content: reader.result as string,
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachment({
          name: file.name,
          type: file.type || "application/octet-stream",
          base64,
        });
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  // Text-To-Speech (TTS)
  const handlePlayTTS = (text: string, index: number) => {
    if ("speechSynthesis" in window) {
      if (isPlayingTTS === index) {
        window.speechSynthesis.cancel();
        setIsPlayingTTS(null);
        return;
      }

      window.speechSynthesis.cancel();
      const plainText = text.replace(/[*#`_\[\]]/g, "");
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlayingTTS(null);
      utterance.onerror = () => setIsPlayingTTS(null);

      setIsPlayingTTS(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy message
  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Send message
  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    const userText = input.trim() || (attachment ? `অনুগ্রহ করে সংযুক্ত "${attachment.name}" ফাইলটি পর্যালোচনা করুন।` : "");
    const attachedFile = attachment;
    setInput("");
    setAttachment(null);

    // If offline
    if (!isOnline) {
      const queuedMessages: ChatMessage[] = [
        ...messages,
        {
          role: "user",
          text: userText,
          isOfflineQueued: true,
          attachmentName: attachedFile?.name,
        },
        {
          role: "model",
          text: `📡 **অফলাইন মোড সক্রিয়**\n\nআপনার প্রশ্নটি অফলাইন কিউতে সংরক্ষিত হয়েছে: *"${userText}"*।\n\nবর্তমানে ইন্টারনেট সংযোগ নেই বিধায় ক্লাউড Gemini মডেল কল করা যায়নি। সংযোগ পুনরায় চালু হলে লাইভ রেসপন্স পাবেন। চাইলে আপনি সরাসরি এই আলোচনা থেকে একটি **অফলাইন নোট** তৈরি করতে পারেন।`,
        },
      ];
      setMessages(queuedMessages);
      return;
    }

    const currentMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        text: userText,
        attachmentName: attachedFile?.name,
      },
    ];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      // Build API contents payload
      const formattedMessages = currentMessages.map((m, idx) => {
        const parts: any[] = [];

        // If this is the last user message and had attachment
        if (idx === currentMessages.length - 1 && attachedFile) {
          if (attachedFile.content) {
            parts.push({
              text: `[সংযুক্ত ফাইল: ${attachedFile.name}]\n${attachedFile.content}\n\n[ব্যবহারকারীর প্রশ্ন]:\n${m.text}`,
            });
          } else if (attachedFile.base64) {
            parts.push({
              inlineData: {
                data: attachedFile.base64,
                mimeType: attachedFile.type,
              },
            });
            parts.push({ text: m.text });
          } else {
            parts.push({ text: m.text });
          }
        } else {
          parts.push({ text: m.text });
        }

        return {
          role: m.role,
          parts,
        };
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "চ্যাট সার্ভারে সমস্যা হয়েছে।");
      }

      setMessages([
        ...currentMessages,
        { role: "model", text: data.text || "উত্তর পাওয়া যায়নি।" },
      ]);
    } catch (e: any) {
      console.error(e);
      setMessages([
        ...currentMessages,
        {
          role: "model",
          text: `দুঃখিত, সংযোগে সমস্যা হয়েছে: ${e.message || "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"}\n\nনোট বা প্রশ্নটি অফলাইন মেমরিতে সংরক্ষিত আছে।`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsNote = (text: string) => {
    const title = text.slice(0, 35).replace(/[#*`\n]/g, "") + "...";
    createNote(title, text, "Summary");
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Hidden file input for attachment */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg,.mp3,.wav"
        onChange={handleFileAttach}
      />

      {/* App Bar Controls */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900/40 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white">IK-SuperNOTE সহকারী</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={10} /> প্যাসিভ লোকাল মোড
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-700/60 flex items-center gap-1">
            🔒 ক্লাউড কল বন্ধ
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-4 py-3 shadow-xs",
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-xs"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-xs"
              )}
            >
              {msg.attachmentName && (
                <div className="flex items-center gap-1 text-[11px] bg-blue-700/60 px-2 py-0.5 rounded-md mb-1.5 w-fit">
                  <FileText size={11} />
                  <span className="truncate max-w-[180px]">{msg.attachmentName}</span>
                </div>
              )}

              {msg.isOfflineQueued && (
                <div className="flex items-center gap-1 text-[10px] text-blue-200 mb-1 font-medium">
                  <Clock size={11} /> অফলাইন কিউতে সংরক্ষিত
                </div>
              )}

              {msg.role === "model" ? (
                <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed">
                  <Markdown>{msg.text}</Markdown>
                </div>
              ) : (
                <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>

            {/* AI Action toolbar */}
            {msg.role === "model" && i > 0 && (
              <div className="flex items-center gap-3 mt-1.5 px-1">
                <button
                  onClick={() => handleSaveAsNote(msg.text)}
                  className="text-[10px] text-neutral-400 hover:text-blue-400 flex items-center gap-1 transition"
                  title="অফলাইন নোটবুক-এ সেভ করুন"
                >
                  <Plus size={11} /> নোট হিসেবে সেভ
                </button>

                <button
                  onClick={() => handlePlayTTS(msg.text, i)}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                  title="শুনে নিন (TTS)"
                >
                  <Volume2 size={11} className={isPlayingTTS === i ? "text-blue-400 animate-pulse" : ""} />
                  <span>{isPlayingTTS === i ? "থামুন" : "শুনুন"}</span>
                </button>

                <button
                  onClick={() => handleCopyMessage(msg.text, i)}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                  title="কপি করুন"
                >
                  {copiedIndex === i ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedIndex === i ? "কপি হয়েছে" : "কপি"}</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-2xl rounded-bl-xs flex gap-2 items-center">
              <Loader2 className="animate-spin text-blue-400" size={16} />
              <span className="text-xs text-neutral-400">Gemini বিশ্লেষণ করছে...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-1.5 bg-neutral-950/80 border-t border-neutral-900 flex gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => setInput("এই চ্যাপ্টারের মূল পয়েন্টগুলো দিয়ে একটি স্টাডি নোট তৈরি কর।")}
          className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white whitespace-nowrap transition"
        >
          📝 স্টাডি নোট তৈরি
        </button>
        <button
          onClick={() => setInput("পরীক্ষার প্রস্তুতির জন্য ৫টি গুরুত্বপূর্ণ প্রশ্ন ও উত্তর দাও।")}
          className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white whitespace-nowrap transition"
        >
          🎯 পরীক্ষার প্রশ্নোত্তর
        </button>
        <button
          onClick={() => setInput("মাইন্ড ম্যাপ ফ্রেমওয়ার্কে মূল শাখাগুলো ব্যাখ্যা কর।")}
          className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white whitespace-nowrap transition"
        >
          🧠 মাইন্ড ম্যাপ
        </button>
      </div>

      {/* Attachment Chip if file selected */}
      {attachment && (
        <div className="px-3 pt-2 bg-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs text-white">
            <FileText size={14} className="text-blue-400" />
            <span className="truncate max-w-[200px]">{attachment.name}</span>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 hover:text-red-400 rounded-full text-neutral-400 transition ml-1"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800">
        <div className="flex items-center gap-1.5 bg-neutral-950 rounded-full pl-2 pr-1.5 py-1 border border-neutral-800 focus-within:border-blue-500 transition">
          {/* Standard Paperclip File Attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition shrink-0"
            title="ফাইল বা ডকুমেন্ট সংযুক্ত করুন"
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isListening
                ? "কথা বলুন, শুনছি..."
                : !isOnline
                ? "অফলাইন প্রশ্ন লিখুন (লোকালি সেভ থাকবে)..."
                : "NoteGPT কে যেকোনো প্রশ্ন করুন..."
            }
            className="flex-1 bg-transparent border-none outline-hidden text-xs px-1 text-white placeholder-neutral-500"
          />

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={cn(
              "p-2 rounded-full transition shrink-0",
              isListening
                ? "bg-red-600 text-white animate-pulse"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            )}
            title={isListening ? "ভয়েস ইনপুট বন্ধ করুন" : "ভয়েস দিয়ে প্রশ্ন করুন"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() && !attachment}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 p-2 rounded-full text-white transition shadow-xs shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
