import { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Video,
  Wand2,
  Loader2,
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Upload,
  Check,
  X,
} from "lucide-react";
import { cn } from "../Layout";

const SAMPLE_PROMPTS = [
  "Future robotic study lab with glowing holographic formulas, 8k resolution, cinematic lighting",
  "Vintage Bengali library with warm morning sunlight through wooden windows, hyperrealistic",
  "Abstract neural network visualization, glowing electric synapses, dark modern aesthetic",
  "Minimalist student desk setup with notebook, coffee and smartphone, clean flat lay",
];

export default function MediaScreen() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Standard reference file input (no drag-and-drop)
  const refFileInputRef = useRef<HTMLInputElement>(null);
  const [refImage, setRefImage] = useState<{ name: string; base64: string } | null>(null);

  const handleRefImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setRefImage({ name: file.name, base64: b64 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setResultBase64(null);
    setErrorMessage(null);

    try {
      const endpoint = activeTab === "image" ? "/api/image/generate" : "/api/video/generate";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          model: activeTab === "image" ? "gemini-3.1-flash-image" : "veo-3.1-generate-preview",
          refImage: refImage?.base64,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "মিডিয়া জেনারেশনে সমস্যা হয়েছে।");
      }

      if (activeTab === "image") {
        if (data.imageBase64) {
          setResultBase64(data.imageBase64);
        } else {
          throw new Error("কোনো ছবি পাওয়া যায়নি।");
        }
      } else {
        if (data.videoBase64) {
          setResultBase64(data.videoBase64);
        } else {
          throw new Error("ভিডিও জেনারেট হতে কিছুটা সময় নেয় বা কোটা সীমাবদ্ধ।");
        }
      }
    } catch (e: any) {
      console.error("Generation failed:", e);
      setErrorMessage(e.message || "জেনারেশন সফল হয়নি। কোটা বা সংযোগ চেক করুন।");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultBase64) return;
    const link = document.createElement("a");
    if (activeTab === "image") {
      link.href = `data:image/jpeg;base64,${resultBase64}`;
      link.download = `SuperNOTE_AI_${Date.now()}.jpg`;
    } else {
      link.href = `data:video/mp4;base64,${resultBase64}`;
      link.download = `SuperNOTE_AI_${Date.now()}.mp4`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Reference Image Hidden Input */}
      <input
        ref={refFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleRefImageSelect}
      />

      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900/40 backdrop-blur">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-sm text-white">AI Studio মিডিয়া ক্রিয়েটর</h1>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
            Gemini 3.1 & Veo
          </span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="p-2.5 flex gap-1.5 border-b border-neutral-900 bg-neutral-950">
        <button
          onClick={() => {
            setActiveTab("image");
            setResultBase64(null);
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "image"
              ? "bg-neutral-800 text-white shadow-xs border border-neutral-700"
              : "text-neutral-400 hover:bg-neutral-900"
          }`}
        >
          <ImageIcon size={14} className="text-blue-400" /> ইমেজ তৈরি
        </button>
        <button
          onClick={() => {
            setActiveTab("video");
            setResultBase64(null);
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "video"
              ? "bg-neutral-800 text-white shadow-xs border border-neutral-700"
              : "text-neutral-400 hover:bg-neutral-900"
          }`}
        >
          <Video size={14} className="text-purple-400" /> Veo ভিডিও তৈরি
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Output Canvas */}
        <div className="w-full aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-center overflow-hidden relative shadow-inner">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-neutral-400 p-4 text-center">
              <Loader2 className="animate-spin text-blue-400" size={28} />
              <span className="text-xs font-medium">
                {activeTab === "image"
                  ? "Gemini 3.1 Flash ছবি তৈরি করছে..."
                  : "Veo 3.1 দিয়ে ভিডিও প্রসেস হচ্ছে..."}
              </span>
              <span className="text-[10px] text-neutral-500">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</span>
            </div>
          ) : resultBase64 ? (
            activeTab === "image" ? (
              <img
                src={`data:image/jpeg;base64,${resultBase64}`}
                alt="Generated result"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={`data:video/mp4;base64,${resultBase64}`}
                autoPlay
                loop
                controls
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-600 p-4 text-center">
              {activeTab === "image" ? <ImageIcon size={36} /> : <Video size={36} />}
              <span className="text-xs font-medium text-neutral-400">
                আপনার তৈরি করা {activeTab === "image" ? "ছবি" : "ভিডিও"} এখানে প্রদর্শিত হবে
              </span>
              <span className="text-[10px] text-neutral-500">নিচে প্রম্পট লিখে জেনারেট বাটনে ক্লিক করুন</span>
            </div>
          )}

          {/* Download button on generated media */}
          {resultBase64 && !isGenerating && (
            <button
              onClick={handleDownload}
              className="absolute top-2.5 right-2.5 bg-neutral-900/80 hover:bg-neutral-900 text-white p-2 rounded-xl backdrop-blur border border-neutral-700 transition flex items-center gap-1 text-xs"
              title="ডিভাইসে ডাউনলোড করুন"
            >
              {downloadSuccess ? <Check size={14} className="text-emerald-400" /> : <Download size={14} />}
              <span className="text-[11px]">{downloadSuccess ? "ডাউনলোড হয়েছে" : "ডাউনলোড"}</span>
            </button>
          )}
        </div>

        {/* Error message card */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">জেনারেশন মেসেজ:</p>
              <p className="text-[11px] text-red-300/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Aspect Ratio Selector */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            অ্যাসপেক্ট রেশিও (Aspect Ratio)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["1:1", "16:9", "9:16", "4:3"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`py-1.5 text-xs font-medium rounded-xl border transition ${
                  aspectRatio === ratio
                    ? "bg-blue-600 border-blue-500 text-white font-semibold"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Standard File Upload for Reference Image (NO drag-and-drop) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              রেফারেন্স ছবি (ঐচ্ছিক)
            </label>
            {refImage && (
              <button
                onClick={() => setRefImage(null)}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
              >
                <X size={11} /> মুছে ফেলুন
              </button>
            )}
          </div>

          {refImage ? (
            <div className="flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <img
                src={`data:image/jpeg;base64,${refImage.base64}`}
                alt="Reference"
                className="w-10 h-10 object-cover rounded-lg"
              />
              <span className="text-xs text-white truncate flex-1">{refImage.name}</span>
            </div>
          ) : (
            <button
              onClick={() => refFileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 text-xs font-medium py-2.5 rounded-xl transition"
            >
              <Upload size={14} className="text-blue-400" />
              <span>গ্যালারি থেকে রেফারেন্স ছবি যুক্ত করুন</span>
            </button>
          )}
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 block">
            প্রম্পট (Prompt)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`আপনি কী ধরনের ${activeTab === "image" ? "ছবি" : "ভিডিও"} তৈরি করতে চান বিস্তারিত লিখুন...`}
            className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-hidden focus:border-blue-500 resize-none transition"
          />

          {/* Preset Prompts */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {SAMPLE_PROMPTS.map((sample, i) => (
              <button
                key={i}
                onClick={() => setPrompt(sample)}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-400 hover:text-neutral-200 rounded-lg whitespace-nowrap transition"
              >
                ✨ আইডিয়া {i + 1}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>{activeTab === "image" ? "ইমেজ জেনারেট করুন" : "ভিডিও জেনারেট করুন"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
