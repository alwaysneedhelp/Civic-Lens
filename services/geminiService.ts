import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";
import { DEMO_AUDIT_RESULTS } from "./demoData";

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

const SYSTEM_INSTRUCTION = `
You are CivicLens, a STRICT autonomous auditor.

*** CRITICAL INSTRUCTION: CLOSED WORLD ASSUMPTION ***
1. You have NO knowledge of the outside world, history, or news. 
2. You ONLY know what is explicitly contained in the uploaded VIDEO and PDF.
3. If information is not in the files, it DOES NOT EXIST. Do not "fill in the blanks".

YOUR TASK:
Compare the specific claims made in the VIDEO against the text in the PDF.

PHASE 1: CONTENT MATCHING CHECK (MANDATORY)
First, determine the specific topic of the VIDEO and the specific topic of the PDF.
- If the VIDEO is about "Topic A" and the PDF is about "Topic B" (completely unrelated), you MUST STOP.
- Do not attempt to force a comparison.

IF UNRELATED:
Return an array with exactly ONE object using this structure:
{
  "timestamp": "00:00",
  "speaker_claim": "IRRELEVANT FILES DETECTED",
  "normalized_claim": {
    "video_topic": "[Insert 1-sentence summary of Video]",
    "pdf_topic": "[Insert 1-sentence summary of PDF]",
    "status": "mismatch"
  },
  "document_evidence": { 
     "page": 1, 
     "text": "The PDF covers [PDF Topic], while the Video discusses [Video Topic]. No overlap found." 
  },
  "verdict": "AMBIGUOUS",
  "confidence": 1.0,
  "reasoning": "The uploaded files are unrelated. I cannot compare [Video Topic] with [PDF Topic]."
}

PHASE 2: CLAIM VERIFICATION (Only if related)
If the topics match (e.g., both about the "Downtown Project"):
1. Transcribe factual claims from the video (Money, Dates, Status).
2. Search the PDF for the *exact* corresponding line item.
3. Compare them literaly.

VERDICT RULES:
- TRUE: The video claim matches the PDF text exactly.
- FALSE: The video claim explicitly contradicts the PDF text.
- PARTIAL: The details are mixed or partially correct.
- AMBIGUOUS: The PDF does not contain the specific data point mentioned in the video.

OUTPUT FORMAT:
Return ONLY the JSON array.
`;

const RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      timestamp: { type: Type.STRING },
      speaker_claim: { type: Type.STRING },
      normalized_claim: { 
        type: Type.OBJECT,
        properties: {
            project: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            date: { type: Type.STRING },
            status: { type: Type.STRING },
            video_topic: { type: Type.STRING },
            pdf_topic: { type: Type.STRING }
        }
      },
      document_evidence: {
        type: Type.OBJECT,
        properties: {
          page: { type: Type.INTEGER },
          text: { type: Type.STRING }
        }
      },
      verdict: { type: Type.STRING, enum: ["TRUE", "FALSE", "PARTIAL", "AMBIGUOUS"] },
      confidence: { type: Type.NUMBER },
      reasoning: { type: Type.STRING }
    },
    required: ["timestamp", "speaker_claim", "verdict", "reasoning", "confidence", "document_evidence", "normalized_claim"]
  }
};

export const analyzeContent = async (
  videoFile: File,
  pdfFile: File
): Promise<AuditResult[]> => {
  // 1. Check for API Key
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.warn("No API_KEY found. Returning DEMO data.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return DEMO_AUDIT_RESULTS;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    
    // 2. Validate File Sizes (Simple check to prevent browser crash on base64)
    if (videoFile.size > 20 * 1024 * 1024) {
        throw new Error("Video file too large for browser demo (>20MB). Please use a shorter clip.");
    }

    const videoBase64 = await fileToGenerativePart(videoFile);
    const pdfBase64 = await fileToGenerativePart(pdfFile);

    const model = "gemini-3-pro-preview"; 

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: pdfFile.type,
                data: pdfBase64
              }
            },
            {
              inlineData: {
                mimeType: videoFile.type,
                data: videoBase64
              }
            },
            {
              text: "Perform a forensic audit comparing the Video claims to the PDF text. IGNORE all external knowledge. If files are unrelated, report the mismatch immediately."
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig: { thinkingBudget: 16000 } 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const json = JSON.parse(text);
    return json as AuditResult[];

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // IMPORTANT: Re-throw the error so the UI shows the error message 
    // instead of silently falling back to demo data.
    // This fixes the 'random information' confusion.
    if (error.message && error.message.includes("400")) {
        throw new Error("API Error (400). The files might be unreadable or the request was rejected. Details: " + error.message);
    }
    throw error;
  }
};
