import express from 'express';
import multer from 'multer';
import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import path from 'path';

// Declare Node.js globals to avoid type errors if @types/node is missing
declare const require: any;
declare const module: any;

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

app.use(express.json());

// Initialize Gemini
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

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

app.post('/api/analyze', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
    try {
        const files = req.files as any;
        
        if (!files.video || !files.pdf) {
            return res.status(400).json({ error: "Missing files" });
        }

        const videoPath = files.video[0].path;
        const pdfPath = files.pdf[0].path;

        // In a real backend, we might use the File API to upload large videos
        // For this MVP, we read to buffer
        const videoBuffer = fs.readFileSync(videoPath);
        const pdfBuffer = fs.readFileSync(pdfPath);

        const model = "gemini-3-pro-preview";

        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: pdfBuffer.toString('base64')
                            }
                        },
                        {
                            inlineData: {
                                mimeType: "video/mp4",
                                data: videoBuffer.toString('base64')
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

        fs.unlinkSync(videoPath);
        fs.unlinkSync(pdfPath);

        const text = response.text;
        if (!text) throw new Error("No response");
        
        res.json(JSON.parse(text));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`CivicLens Backend running at http://localhost:${port}`);
    });
}

export default app;