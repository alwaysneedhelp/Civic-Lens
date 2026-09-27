import { GoogleGenAI, Type, Part } from "@google/genai";
import { SourceType, SummaryResult, TokenUsage } from "../types";
import { DEMO_VIDEO_SUMMARY, DEMO_PDF_SUMMARY, DEMO_YOUTUBE_SUMMARY } from "./demoData";

// Below this size, send the file inline in the request (fast, one round trip).
// Above it, use the Files API (upload -> poll until ACTIVE -> reference by URI),
// which is what lets us go past a request's inline-payload ceiling.
const INLINE_THRESHOLD_BYTES = 15 * 1024 * 1024;

// App-level ceiling, well under the Files API's own 2GB/file limit. Keeps
// browser upload time and memory use reasonable for a client-only hackathon
// MVP; raise FILE_API_MAX_BYTES if you need bigger clips.
export const FILE_API_MAX_BYTES = 200 * 1024 * 1024;

// Helper to convert a small file to base64 for inline requests.
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:application/pdf;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Uploads a large file via the Files API and waits for it to finish
// server-side processing before it can be referenced in a generateContent call.
const uploadAndAwaitActive = async (ai: GoogleGenAI, file: File) => {
  let uploaded = await ai.files.upload({ file, config: { mimeType: file.type, displayName: file.name } });

  while (uploaded.state === 'PROCESSING') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    uploaded = await ai.files.get({ name: uploaded.name! });
  }

  if (uploaded.state !== 'ACTIVE') {
    throw new Error(`File processing failed: ${uploaded.error?.message || 'unknown error'}`);
  }

  return uploaded;
};

const buildFilePart = async (ai: GoogleGenAI, file: File): Promise<Part> => {
  if (file.size <= INLINE_THRESHOLD_BYTES) {
    const base64 = await fileToBase64(file);
    return { inlineData: { mimeType: file.type, data: base64 } };
  }

  const uploaded = await uploadAndAwaitActive(ai, file);
  return { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } };
};

const getSystemInstruction = (sourceType: SourceType) => {
  const label = sourceType === 'pdf' ? 'PDF' : 'VIDEO';
  return `
You are CivicLens, an autonomous summarizer for civic meeting media.

*** CRITICAL INSTRUCTION: CLOSED WORLD ASSUMPTION ***
1. You have NO knowledge of the outside world, history, or news.
2. You ONLY know what is explicitly contained in the uploaded ${label}.
3. If information is not in the file, it DOES NOT EXIST. Do not "fill in the blanks".

YOUR TASK:
Produce a concise, factual summary of the uploaded ${label}.
1. Write a 2-4 sentence overview of what the file covers.
2. Extract concrete factual points: decisions, dollar amounts, dates, project statuses, votes.
3. For each point, include a locator:
   ${sourceType === 'pdf'
     ? '- The page number it appears on, formatted "Page N".'
     : '- The approximate timestamp where it is said, formatted "MM:SS".'}

OUTPUT FORMAT:
Return ONLY the JSON object.
`;
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    overview: { type: Type.STRING },
    points: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          locator: { type: Type.STRING },
          point: { type: Type.STRING }
        },
        required: ["locator", "point"]
      }
    }
  },
  required: ["title", "overview", "points"]
};

export const getSourceType = (file: File): SourceType | null => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'pdf';
  return null;
};

const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/i;

export const isYoutubeUrl = (url: string): boolean => YOUTUBE_URL_PATTERN.test(url.trim());

const toTokenUsage = (usageMetadata: any): TokenUsage | undefined => {
  if (!usageMetadata) return undefined;
  return {
    promptTokenCount: usageMetadata.promptTokenCount,
    thoughtsTokenCount: usageMetadata.thoughtsTokenCount,
    candidatesTokenCount: usageMetadata.candidatesTokenCount,
    totalTokenCount: usageMetadata.totalTokenCount,
  };
};

const runSummary = async (
  ai: GoogleGenAI,
  sourceType: SourceType,
  sourcePart: Part,
  promptLabel: string
): Promise<SummaryResult> => {
  // "gemini-flash-latest" tracks Google's current free-tier Flash release,
  // so this keeps working on a no-cost AI Studio key without pinning a
  // preview model that requires paid/allowlisted access.
  const model = "gemini-flash-latest";

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      {
        role: "user",
        parts: [
          sourcePart,
          { text: `Summarize this ${promptLabel}. IGNORE all external knowledge.` }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(sourceType),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      thinkingConfig: { thinkingBudget: 16000 }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  const json = JSON.parse(text);
  return { sourceType, ...json, usage: toTokenUsage(response.usageMetadata) } as SummaryResult;
};

const rethrowFriendly = (error: any): never => {
  console.error("Gemini Analysis Error:", error);
  if (error.message && error.message.includes("400")) {
      throw new Error("API Error (400). The content might be unreadable or the request was rejected. Details: " + error.message);
  }
  throw error;
};

export const summarizeContent = async (file: File): Promise<SummaryResult> => {
  const sourceType = getSourceType(file);
  if (!sourceType) {
    throw new Error("Unsupported file type. Please upload a video (MP4) or a PDF.");
  }

  // 1. Check for API Key
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.warn("No API_KEY found. Returning DEMO data.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return sourceType === 'video' ? DEMO_VIDEO_SUMMARY : DEMO_PDF_SUMMARY;
  }

  if (file.size > FILE_API_MAX_BYTES) {
      throw new Error(`File too large (>${(FILE_API_MAX_BYTES / (1024 * 1024)).toFixed(0)}MB). Please use a shorter clip or smaller document.`);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const part = await buildFilePart(ai, file);
    return await runSummary(ai, sourceType, part, sourceType === 'pdf' ? 'PDF' : 'VIDEO');
  } catch (error: any) {
    return rethrowFriendly(error);
  }
};

export const summarizeYoutubeUrl = async (url: string): Promise<SummaryResult> => {
  const trimmed = url.trim();
  if (!isYoutubeUrl(trimmed)) {
    throw new Error("Please enter a public YouTube video URL (youtube.com/watch?v=... or youtu.be/...).");
  }

  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.warn("No API_KEY found. Returning DEMO data.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return DEMO_YOUTUBE_SUMMARY;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const part: Part = { fileData: { fileUri: trimmed } };
    return await runSummary(ai, 'youtube', part, 'VIDEO');
  } catch (error: any) {
    return rethrowFriendly(error);
  }
};
