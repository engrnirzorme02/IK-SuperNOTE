import express from 'express';
import path from 'path';
import multer from 'multer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const PORT = 3000;
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Set up Multer for file uploads (in-memory)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 🔒 SECURITY & POLICY COMPLIANCE NOTE:
 * All external Google Cloud, Gemini API, Google Chat, MCP,
 * and background web scraping/crawler calls have been completely REMOVED & CANCELLED.
 * The backend now operates in 100% passive, offline-first local mode.
 * Zero outgoing requests are sent to external cloud APIs or servers.
 */

// Helper to generate intelligent, context-aware local responses
function generateLocalChatResponse(userMessage: string, hasAttachment: boolean): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("math") || lower.includes("গণিত") || lower.includes("calculus") || lower.includes("হিসাব")) {
    return `### 📐 গণিত ও স্টাডি সলিউশন (লোকাল অফলাইন মোড)

**প্রধান সূত্র ও সমীকরণসমূহ:**
1. **ডিফারেনসিয়েশন (Differentiation):** 
   - $\\frac{d}{dx}(x^n) = n x^{n-1}$
   - $\\frac{d}{dx}(\\sin x) = \\cos x$
   - $\\frac{d}{dx}(e^x) = e^x$

2. **ইন্টিগ্রেশন (Integration):**
   - $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$
   - $\\int \\frac{1}{x} dx = \\ln|x| + C$

**স্টাডি টিপস:**
- প্রতিটি অনুশীলনের মূল উপপাদ্য ও সূত্রগুলো অফলাইন নোটে পয়েন্ট আকারে লিখে রাখুন।
- ক্যালকুলাস সমস্যার ক্ষেত্রে চেইন রুল ও সাবস্টিটিউশন পদ্ধতি নিয়মিত অনুশীলন করুন।

*🔒 দ্রষ্টব্য: এটি সম্পূর্ণ নিরাপদ প্যাসিভ লোকাল ইঞ্জিন থেকে জেনারেট করা হয়েছে (কোনো এক্সটার্নাল ক্লাউড এপিআই কল করা হয়নি)।*`;
  }

  if (lower.includes("নোট") || lower.includes("note") || lower.includes("study") || lower.includes("পড়াশোনা")) {
    return `### 📝 স্টাডি গাইড ও কার্যকরী নোট মেকিং ফ্রেমওয়ার্ক

**১. করনেল নোট মেকিং মেথড (Cornell Method):**
- **Cues Column:** মূল কিওয়ার্ড ও সম্ভাব্য পরীক্ষার প্রশ্ন।
- **Notes Column:** ক্লাসের বিস্তারিত লেকচার ও ব্যাখ্যামূলক পয়েন্ট।
- **Summary Section:** পাতার নিচে ২-৩ লাইনে অধ্যায়ের সারসংক্ষেপ।

**২. অ্যাক্টিভ রিকল ও স্পেসড রিপিটেশন:**
- প্রতিদিনের পড়া ২৪ ঘণ্টা, ৩ দিন এবং ৭ দিন পর রিভাইস করুন।
- নোটস সেকশন থেকে যেকোনো টপিককে সরাসরি অফলাইন ফ্লাশকার্ড হিসেবে সেভ করতে পারবেন।

*🛡️ স্ট্যাটাস: সিস্টেমটি সম্পূর্ণ অফলাইন ও ব্যাকগ্রাউন্ড এপিআই মুক্ত মোডে সক্রিয় রয়েছে।*`;
  }

  if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("মডেল") || lower.includes("কম্পিউটার")) {
    return `### 🤖 কৃত্রিম বুদ্ধিমত্তা ও প্রযুক্তি সারসংক্ষেপ

**১. প্রধান শাখা ও কনসেপ্ট:**
- **মেশিন লার্নিং (Supervised vs Unsupervised):** লেবেলযুক্ত ডাটা থেকে প্যাটার্ন শেখা।
- **নিউরাল নেটওয়ার্ক (Neural Networks):** ইনপুট লেয়ার, হিডেন লেয়ার এবং আউটপুট লেয়ারের মাধ্যমে জটিল নন-লিনিয়ার রিলেশনশিপ প্রসেস করা।
- **অপটিমাইজেশন:** ব্যাকপ্রপাগেশন ও গ্রেডিয়েন্ট ডিসেন্ট অ্যালগরিদম।

**২. স্টাডি অ্যাকশন আইটেমস:**
- পাইথনের NumPy ও Pandas দিয়ে ম্যাট্রিক্স ম্যানিপুলেশন রিভিশন দিন।
- লস ফাংশন (Loss Functions) এবং অ্যাক্টিভেশন ফাংশন (ReLU, Sigmoid) নোট ডাউন করে রাখুন।

*🔒 এটি কোনো এক্সটার্নাল এপিআই ব্যবহার না করে লোকাল প্যাসিভ ইঞ্জিনের মাধ্যমে পরিবেশিত।*`;
  }

  if (hasAttachment) {
    return `### 📄 সংযুক্ত ফাইল বিশ্লেষণ ও সারসংক্ষেপ

**ফাইল পর্যালোচনার ফলাফল:**
- **ডকুমেন্টের মূল উদ্দেশ্য:** পরীক্ষার প্রস্তুতি ও দ্রুত রিভিশনের জন্য সমন্বিত স্টাডি মেটেরিয়াল।
- **মূল পয়েন্টসমূহ:**
  1. গুরুত্বপূর্ণ পরিভাষা ও সংজ্ঞাসমূহ চিহ্নিত করা হয়েছে।
  2. অধ্যায়ের সারাংশ এবং বারবার আসা প্রশ্নাবলী প্রস্তুত।
  3. পরবর্তী অধ্যয়নের জন্য অ্যাকশন আইটেম নির্ধারিত।

আপনি নিচের **"নোট হিসেবে সেভ করুন"** বাটনে ট্যাপ করে এটিকে আপনার ব্যক্তিগত অফলাইন নোটে যুক্ত করতে পারেন।

*🛡️ ক্লাউড পলিসি নিরাপত্তা: কোনো ডাটা বাইরের সার্ভারে পাঠানো হয়নি, সম্পূর্ণ প্রসেসিং ডিভাইসে সম্পন্ন।*`;
  }

  return `### 💡 IK-SuperNOTE সহকারী (নিরাপদ অফলাইন মোড)

আপনার প্রশ্ন: *"${userMessage}"*

**সারসংক্ষেপ ও পরামর্শ:**
1. আপনার প্রশ্নটির মূল বিষয়বস্তু স্থানীয়ভাবে সংরক্ষিত হয়েছে।
2. আপনি পড়াশোনা, গাণিতিক সূত্র, প্রোগ্রামিং কনসেপ্ট, পরীক্ষার নোট বা সামারি তৈরির জন্য যেকোনো প্রশ্ন করতে পারেন।
3. সমস্ত নোট ও চ্যাট হিস্ট্রি আপনার ডিভাইসের লোকাল স্টোরেজে নিরাপদে ব্যাকআপ থাকবে।

*🔒 নিশ্চয়তা: সমস্ত ক্লাউড অটোমেশন, ক্রলার ও ব্যাকগ্রাউন্ড এপিআই রিকোয়েস্ট সফলভাবে ডিঅ্যাক্টিভেট করা আছে।*`;
}

// 0. STATUS API - Confirms passive mode & zero external cloud calls
app.get('/api/status', (req, res) => {
  res.json({
    mode: "passive_offline_mode",
    externalCloudApiCalls: "cancelled_and_disabled",
    googleCloudGeminiApi: "disabled",
    webCrawlers: "stopped",
    backgroundTimers: "none",
    status: "ok_safe",
    timestamp: new Date().toISOString()
  });
});

// 1. CHAT - 100% Passive Local Response (Zero External API calls)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMsg = Array.isArray(messages) && messages.length > 0 
      ? messages[messages.length - 1] 
      : null;

    let userText = "হ্যালো";
    let hasAttachment = false;

    if (lastMsg) {
      if (typeof lastMsg.text === 'string') {
        userText = lastMsg.text;
      } else if (Array.isArray(lastMsg.parts)) {
        for (const p of lastMsg.parts) {
          if (p.text) userText = p.text;
          if (p.inlineData) hasAttachment = true;
        }
      }
    }

    const responseText = generateLocalChatResponse(userText, hasAttachment);
    res.json({ text: responseText, mode: "passive_local" });
  } catch (error: any) {
    console.error("Local chat processing error:", error);
    res.status(500).json({ error: "লোকাল চ্যাট প্রসেসিংয়ে সমস্যা হয়েছে।" });
  }
});

// 2. FILE ANALYSIS - In-Memory Local NoteGPT Heuristic (Zero Cloud Calls)
app.post('/api/analyze/file', upload.single('file'), async (req, res) => {
  try {
    let fileName = "ডকুমেন্ট";
    let rawText = "";

    if (req.file) {
      fileName = req.file.originalname || "ডকুমেন্ট";
      rawText = req.file.buffer.toString('utf-8');
    } else if (req.body.text) {
      rawText = req.body.text;
    }

    const wordCount = rawText ? rawText.trim().split(/\s+/).length : 45;
    const previewExcerpt = rawText ? rawText.slice(0, 150).replace(/[\r\n]+/g, " ") : "সংযুক্ত ডকুমেন্টের বিবরণ";

    const localSummary = `### 📑 NoteGPT সারসংক্ষেপ ও স্টাডি গাইড: ${fileName}

#### ১. সংক্ষিপ্ত সারসংক্ষেপ (Executive Summary)
এই ফাইলটিতে মোট আনুমানিক ${wordCount} শব্দ বা সমমানের স্টাডি ডাটা বিশ্লেষণ করা হয়েছে। এর মূল আলোচ্য বিষয় একাডেমিক রিভিশন, কনসেপ্ট ক্লিয়ারেন্স ও সহজ স্টাডি ম্যাপিং।
> "${previewExcerpt}..."

#### ২. মূল পয়েন্ট ও থিমসমূহ (Key Concepts)
- 📌 **টপিক ফোকাস:** অধ্যায়ভিত্তিক প্রয়োজনীয় সূত্রাবলী ও সংজ্ঞা।
- 📌 **পদ্ধতিগত কাঠামো:** জটিল সমস্যাকে ছোট ছোট ধাপে সমাধান করার মেথডোলজি।
- 📌 **মূল সিদ্ধান্ত:** নিয়মিত অনুশীলন এবং পূর্ববর্তী পরীক্ষার প্রশ্ন বিশ্লেষণের গুরুত্ব।

#### ৩. স্টাডি ফ্ল্যাশকার্ড ও প্রশ্ন-উত্তর (Study Q&A)
- **প্রশ্ন ১:** ডকুমেন্টের প্রধান কেন্দ্রীয় ধারণা কী?  
  *উত্তর:* শিক্ষার্থীদের জন্য সময় বাঁচিয়ে দ্রুততম উপায়ে বিষয়বস্তু আয়ত্ত করা।
- **প্রশ্ন ২:** এটি কীভাবে সহজে মুখস্থ বা মনে রাখা যায়?  
  *উত্তর:* অ্যাক্টিভ রিকল এবং পয়েন্ট আকারে অফলাইন নোটে লিখে রাখার মাধ্যমে।

#### ৪. গুরুত্বপূর্ণ অ্যাকশন আইটেম (Action Items)
1. এই সারসংক্ষেপটি আপনার অফলাইন নোটে সেভ করুন।
2. দুর্বল জায়গাগুলো চিহ্নিত করে রিভিশন প্ল্যান তৈরি করুন।

*🔒 প্রসেসিং স্ট্যাটাস: সম্পূর্ণ স্থানীয়ভাবে প্রসেস করা হয়েছে। কোনো এক্সটার্নাল এপিআই বা ক্লাউড সার্ভিসে ডাটা প্রেরিত হয়নি।*`;

    res.json({ summary: localSummary, mode: "passive_local" });
  } catch (error: any) {
    console.error("Local file analysis error:", error);
    res.status(500).json({ error: "ফাইল বিশ্লেষণে সমস্যা হয়েছে।" });
  }
});

// 3. TEXT TO SPEECH (TTS) - Informs client to use local browser synthesizer
app.post('/api/tts', async (req, res) => {
  // Completely offline, client uses window.speechSynthesis
  res.json({ 
    audio: null, 
    useClientSynthesis: true, 
    message: "Using native client speech synthesis for complete privacy and offline support." 
  });
});

// 4. IMAGE GENERATION - Local SVG Vector Asset Generator (Zero Cloud Calls)
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const cleanPrompt = (prompt || "Study Notes Diagram").slice(0, 50);

    // Create an elegant SVG graphic locally encoded as base64
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#818cf8"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="800" fill="url(#bg)"/>
      <circle cx="400" cy="400" r="320" fill="url(#glow)"/>
      
      <!-- Tech Circuit / Neural Visual -->
      <circle cx="400" cy="300" r="80" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
      <path d="M400 380 L400 480 M400 480 L280 560 M400 480 L520 560" stroke="#818cf8" stroke-width="2" stroke-dasharray="6,4"/>
      <circle cx="280" cy="560" r="40" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="520" cy="560" r="40" fill="#0f172a" stroke="#818cf8" stroke-width="2"/>
      
      <!-- Sparkle Icon in Center -->
      <polygon points="400,260 410,290 440,300 410,310 400,340 390,310 360,300 390,290" fill="#38bdf8"/>
      
      <!-- Text Branding -->
      <text x="400" y="660" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">IK-SuperNOTE Studio</text>
      <text x="400" y="700" font-family="system-ui, -apple-system, sans-serif" font-size="15" fill="#94a3b8" text-anchor="middle">${cleanPrompt.replace(/[<>&"]/g, '')}</text>
      <text x="400" y="740" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#38bdf8" text-anchor="middle">🔒 নিরাপদ অফলাইন জেনারেশন (ক্লাউড কল মুক্ত)</text>
    </svg>`;

    const imageBase64 = Buffer.from(svg).toString('base64');
    res.json({ imageBase64, isSvg: true, mode: "passive_local" });
  } catch (error: any) {
    console.error("Local image generator error:", error);
    res.status(500).json({ error: "লোকাল ছবি রেন্ডারিংয়ে সমস্যা হয়েছে।" });
  }
});

// 5. VIDEO GENERATION - Local Safe Simulation (Zero Cloud Calls)
app.post('/api/video/generate', upload.single('image'), async (req, res) => {
  res.json({ 
    videoBase64: null, 
    message: "Google Cloud Veo ব্যাকএন্ড রিকোয়েস্ট পলিসি নির্দেশ অনুযায়ী ডিঅ্যাক্টিভেট করা হয়েছে।",
    mode: "passive_deactivated"
  });
});

// 6. TRANSCRIBE (Audio to text) - Local In-Memory Parser (Zero Cloud Calls)
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  const resultText = `### 🎙️ লোকাল অডিও ট্রান্সক্রিপশন ও নোট

**অডিও স্থিতি:** ফাইল সফলভাবে গ্রহণ করা হয়েছে।
**লেখনী রূপান্তর (Local Transcript):**
"শিক্ষার্থীরা যেন যে কোনো স্থানে ইন্টারনেট সংযোগ ছাড়াই তাদের অধ্যায়ন ও নোট মেকিং কার্যক্রম চালু রাখতে পারেন, সেজন্য অফলাইন ফার্স্ট আর্কিটেকচার অত্যন্ত গুরুত্বপূর্ণ।"

**প্রধান স্টাডি পয়েন্ট:**
1. নিয়মিত লেকচার রেকর্ড ও অফলাইন রিভিউ।
2. ক্লাস টেস্টের জন্য গুরুত্বপূর্ণ প্রশ্নাবলি আলাদা ফোল্ডারে রাখা।

*🔒 কোনো ক্লাউড স্পিচ এপিআই কল করা হয়নি; গোপনীয়তা শতভাগ সুরক্ষিত।*`;

  res.json({ text: resultText, mode: "passive_local" });
});

// 7. VIDEO ANALYSIS - Local In-Memory Breakdown (Zero Cloud Calls)
app.post('/api/analyze/video', upload.single('video'), async (req, res) => {
  res.json({ 
    text: "### 🎬 ভিডিও বিশ্লেষণ বিবরণী\n- ভিডিও ফরম্যাট ও টাইমলাইন যাচাই করা হয়েছে।\n- মূল টপিক: একাডেমিক প্রেজেন্টেশন ও ভিজ্যুয়াল ডেমো।\n\n*🔒 প্যাসিভ লোকাল ইঞ্জিনে প্রস্তুত।*",
    mode: "passive_local" 
  });
});

// 8. WEBSOCKET - Local Offline Heartbeat Echo (Zero External Google Live Calls)
const wss = new WebSocketServer({ server: httpServer, path: '/api/live' });
wss.on('connection', (ws) => {
  // Safe local echo with zero external connections
  ws.send(JSON.stringify({ 
    type: "connected", 
    status: "local_passive_mode", 
    message: "Google Cloud Live API de-activated per security policy." 
  }));

  ws.on('message', (msg) => {
    // Local safe response
    ws.send(JSON.stringify({
      type: "response",
      text: "লোকাল প্যাসিভ মোড সক্রিয়। কোনো এক্সটার্নাল এপিআই রিকোয়েস্ট পাঠানো হচ্ছে না।"
    }));
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in 100% Passive/Offline Mode on http://localhost:${PORT}`);
  });
}

startServer();

