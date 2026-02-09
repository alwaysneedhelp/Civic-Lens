# CivicLens - Autonomous Auditor

CivicLens is a hackathon MVP designed to automatically verify spoken claims in meeting videos against official PDF documents using Gemini 3's multimodal reasoning.

## Setup

1.  **Clone & Install**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file (or use your bundler's method) and add your Gemini API Key:
    ```
    API_KEY=AIzaSy...
    ```
    *Note: The app will run in "Demo Mode" with static data if no API key is detected.*

3.  **Run Development Server**
    ```bash
    npm start
    ```

## Usage

1.  Open the web app.
2.  Upload a **short video** (e.g., a city council meeting clip) in the Video slot.
3.  Upload a **PDF** (e.g., a budget report) in the PDF slot.
4.  Click **Run Autonomous Audit**.
5.  Watch as Gemini 3 analyzes the audio/visuals and the text to generate verdicts.

## Architecture

*   **Frontend**: React + Tailwind CSS. Handles file inputs and displays the audit feed.
*   **AI Engine**: Google Gemini 3 Pro (`gemini-3-pro-preview`).
    *   **Reasoning**: High thinking budget enabled for deep verification.
    *   **Multimodal**: Direct ingestion of Video (MP4) and Document (PDF) via the API.
*   **Backend**: Included in `backend/server.ts` for reference, but the React app is configured to use the Gemini SDK client-side for immediate demo reproducibility without server setup.

## Limitations (Hackathon MVP)

*   Files must be small enough to fit in the API payload (Client-side limitation).
*   Video navigation relies on standard HTML5 player seek.
*   No persistent database; results are transient.
