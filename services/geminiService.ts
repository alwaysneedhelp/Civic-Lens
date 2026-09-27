import { GoogleGenAI, Type } from "@google/genai";
import { SourceType, SummaryResult } from "../types";
import { DEMO_VIDEO_SUMMARY, DEMO_PDF_SUMMARY } from "./demoData";

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<string> => {
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

const getSystemInstruction = (sourceType: SourceType) => `
You are CivicLens, an autonomous summarizer for civic meeting media.

*** CRITICAL INSTRUCTION: CLOSED WORLD ASSUMPTION ***
1. You have NO knowledge of the outside world, history, or news.
2. You ONLY know what is explicitly contained in the uploaded ${sourceType === 'video' ? 'VIDEO' : 'PDF'}.
3. If information is not in the file, it DOES NOT EXIST. Do not "fill in the blanks".

YOUR TASK:
Produce a concise, factual summary of the uploaded ${sourceType === 'video' ? 'VIDEO' : 'PDF'}.
1. Write a 2-4 sentence overview of what the file covers.
2. Extract concrete factual points: decisions, dollar amounts, dates, project statuses, votes.
3. For each point, include a locator:
   ${sourceType === 'video'
     ? '- The approximate timestamp where it is said, formatted "MM:SS".'
     : '- The page number it appears on, formatted "Page N".'}

OUTPUT FORMAT:
Return ONLY the JSON object.
`;

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

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    // 2. Validate File Size (Simple check to prevent browser crash on base64)
    if (file.size > 20 * 1024 * 1024) {
        throw new Error("File too large for browser demo (>20MB). Please use a shorter clip or smaller document.");
    }

    const fileBase64 = await fileToGenerativePart(file);

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
            {
              inlineData: {
                mimeType: file.type,
                data: fileBase64
              }
            },
            {
              text: `Summarize this ${sourceType === 'video' ? 'VIDEO' : 'PDF'}. IGNORE all external knowledge.`
            }
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
    return { sourceType, ...json } as SummaryResult;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);

    // IMPORTANT: Re-throw the error so the UI shows the error message
    // instead of silently falling back to demo data.
    if (error.message && error.message.includes("400")) {
        throw new Error("API Error (400). The file might be unreadable or the request was rejected. Details: " + error.message);
    }
    throw error;
  }
};
