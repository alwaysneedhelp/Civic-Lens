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

const getSystemInstruction = (sourceType: 'video' | 'pdf') => `
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

app.post('/api/summarize', upload.single('file'), async (req, res) => {
    try {
        const uploaded = req.file;

        if (!uploaded) {
            return res.status(400).json({ error: "Missing file" });
        }

        const sourceType: 'video' | 'pdf' = uploaded.mimetype === 'application/pdf' ? 'pdf' : 'video';
        const fileBuffer = fs.readFileSync(uploaded.path);

        // Free-tier Flash alias — see services/geminiService.ts for rationale.
        const model = "gemini-flash-latest";

        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: uploaded.mimetype,
                                data: fileBuffer.toString('base64')
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

        fs.unlinkSync(uploaded.path);

        const text = response.text;
        if (!text) throw new Error("No response");

        res.json({ sourceType, ...JSON.parse(text) });

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