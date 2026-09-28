import express from 'express';
import path from 'path';
import multer from 'multer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const PORT = 3000;
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Set up Multer for file uploads (in-memory for simple processing)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini Client
// We use dynamic initialization to allow the key to be injected at runtime
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({ apiKey });
}

// 1. CHAT (with Grounding, Thinking, and Attachments)
app.post('/api/chat', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { messages, model, systemInstruction, useThinking, useGrounding } = req.body;
    
    const config: any = {
      systemInstruction: systemInstruction || "You are IK-SuperNOTE AI, a helpful, fast, Android-optimized study and productivity assistant. Respond clearly and concisely with markdown formatting.",
    };
    
    if (useThinking) {
      config.thinkingConfig = { thinkingBudgetTokens: 1024 };
    }

    if (useGrounding === 'search') {
      config.tools = [{ googleSearch: {} }];
    } else if (useGrounding === 'maps') {
      config.tools = [{ googleMaps: {} }];
    }

    const targetModel = model || (useThinking ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash');

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: messages,
      config,
    });
    
    res.json({ text: response.text || "উত্তর পাওয়া যায়নি।" });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "চ্যাট প্রসেস করতে সমস্যা হয়েছে।" });
  }
});

// 2. FILE ANALYSIS (NoteGPT Study Summary, Flashcards, Key Points)
app.post('/api/analyze/file', upload.single('file'), async (req, res) => {
  try {
    const ai = getGeminiClient();
    let contents: any[] = [];
    const prompt = req.body.prompt || "এই ডকুমেন্টের মূল বিষয়বস্তু বিশ্লেষণ করে: ১. সংক্ষেপিত সামারি (Executive Summary), ২. বুলেট পয়েন্টে মূল পয়েন্টসমূহ (Key Concepts), ৩. স্টাডি ফ্ল্যাশকার্ড ও প্রশ্ন-উত্তর (Study Q&A) এবং ৪. গুরুত্বপূর্ণ সিদ্ধান্ত বা অ্যাকশন আইটেম তৈরি করুন। বাংলা ও প্রয়োজনীয় ক্ষেত্রে ইংরেজি পরিভাষা ব্যবহার করুন।";

    if (req.file) {
      const mime = req.file.mimetype;
      // If text or json or md
      if (mime.startsWith('text/') || mime === 'application/json') {
        const textContent = req.file.buffer.toString('utf-8');
        contents = [
          { role: 'user', parts: [{ text: `${prompt}\n\nডকুমেন্ট কন্টেন্ট:\n${textContent}` }] }
        ];
      } else {
        // binary files (PDF, image, audio)
        contents = [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: req.file.buffer.toString('base64'),
                  mimeType: mime,
                }
              },
              { text: prompt }
            ]
          }
        ];
      }
    } else if (req.body.text) {
      contents = [
        { role: 'user', parts: [{ text: `${prompt}\n\nডকুমেন্ট কন্টেন্ট:\n${req.body.text}` }] }
      ];
    } else {
      throw new Error("কোনো ফাইল বা টেক্সট প্রদান করা হয়নি।");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("File analysis error:", error);
    res.status(500).json({ error: error.message || "ফাইল বিশ্লেষণে ত্রুটি হয়েছে।" });
  }
});

// 3. TEXT TO SPEECH (TTS)
app.post('/api/tts', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { text } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: text,
    });
    
    let audioBase64 = null;
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
        audioBase64 = part.inlineData.data;
        break;
      }
    }
    
    res.status(200).json({ audio: audioBase64 });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 4. IMAGE GENERATION
app.post('/api/image/generate', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { prompt, aspectRatio, model } = req.body;
    
    const response = await ai.models.generateImages({
      model: model || 'gemini-3.1-flash-image',
      prompt,
      config: {
        aspectRatio: aspectRatio || '1:1',
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
      }
    });
    
    const imageBase64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBase64) {
      throw new Error("ইমেজ জেনারেট করা সম্ভব হয়নি।");
    }
    res.json({ imageBase64 });
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. VIDEO GENERATION (VEO)
app.post('/api/video/generate', upload.single('image'), async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { prompt, aspectRatio } = req.body;
    
    const response: any = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt || 'A high quality cinematic scene',
      config: {
        aspectRatio: aspectRatio || '16:9',
      }
    });
    
    const videoBytes = response.generatedVideos?.[0]?.video?.videoBytes;
    res.json({ videoBase64: videoBytes });
  } catch (error: any) {
    console.error("Video generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. TRANSCRIBE (Audio to text)
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!req.file) throw new Error("No audio file provided");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype || 'audio/mp3' } },
            { text: "এই অডিওর বক্তব্য স্পষ্ট ও নির্ভুলভাবে বাংলায়/প্রাসঙ্গিক ভাষায় ট্রান্সক্রাইব (Transcribe) করুন এবং প্রধান বিষয়গুলোর একটি সংক্ষিপ্ত সারসংক্ষেপ দিন।" }
          ]
        }
      ]
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Transcribe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. VIDEO ANALYSIS (Video understanding)
app.post('/api/analyze/video', upload.single('video'), async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!req.file) throw new Error("No video file provided");
    const { prompt } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        { role: 'user', parts: [ { inlineData: { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype } }, { text: prompt || "Analyze this video" } ] }
      ]
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// WEBSOCKET PROXY for Gemini Live API
const wss = new WebSocketServer({ server: httpServer, path: '/api/live' });
wss.on('connection', async (ws) => {
  try {
    const ai = getGeminiClient();
    let session: any = null;
    try {
      session = await (ai.live as any).connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onMessage: (serverMsg: any) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify(serverMsg));
            }
          },
          onError: (err: any) => console.error("Live session error:", err),
          onClose: () => ws.close(),
        }
      });
    } catch {
      // Fallback
    }

    // When client sends a message, forward to Gemini
    ws.on('message', (clientMsg: any) => {
      try {
        if (session && typeof session.send === 'function') {
          const data = JSON.parse(clientMsg.toString());
          session.send(data);
        }
      } catch (err) {
        console.error("Error parsing client message:", err);
      }
    });

    ws.on('close', () => {
      if (session && typeof session.close === 'function') {
        session.close();
      }
    });
  } catch (error) {
    console.error("Live API connection error:", error);
    ws.close();
  }
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
