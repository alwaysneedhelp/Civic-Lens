# CivicLens - Media Summarizer

CivicLens is a hackathon MVP that summarizes the key factual points in a meeting video, an official PDF document, or a public YouTube link, using Gemini's multimodal reasoning.

## Setup

1.  **Clone & Install**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Get a **free** Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) — no billing account required. Create a `.env` file in the project root:
    ```
    VITE_GEMINI_API_KEY=AIzaSy...
    ```
    *Note: The app will run in "Demo Mode" with static data if no API key is detected.*

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

## Usage

1.  Open the web app.
2.  Pick a source: **Upload File** (a video or a PDF) or **YouTube Link** (a public video URL).
3.  Click **Run Autonomous Summary**.
4.  Watch as Gemini reads the source and produces an overview plus a list of factual points, each with a locator (a timestamp for video/YouTube, a page number for PDF).
5.  For video and YouTube sources, click a locator to jump to that moment.
6.  After a real (non-demo) run, the token usage for that request is shown under the overview.

## Architecture

*   **Frontend**: React + Tailwind CSS. Handles the file/URL input and displays the summary feed.
*   **AI Engine**: Google Gemini, via the `gemini-flash-latest` alias.
    *   **Free tier**: This alias tracks Google's current Flash-tier release, which stays on the no-cost AI Studio free tier (rate-limited) rather than requiring a paid/allowlisted preview model.
    *   **Reasoning**: Thinking budget enabled for deep extraction.
    *   **Multimodal**: Video (MP4), PDF, and public YouTube URLs, all via the same API.
*   **Backend**: Included in `backend/server.ts` for reference, but the React app is configured to use the Gemini SDK client-side for immediate demo reproducibility without server setup.

### File size handling

Small files (≤15MB) are sent inline in the request. Larger ones are uploaded through Gemini's [Files API](https://ai.google.dev/gemini-api/docs/files) (`ai.files.upload`), polled until Google finishes processing them server-side, then referenced by URI — this is what lets the app go past a single request's inline-payload ceiling. The app caps uploads at `FILE_API_MAX_BYTES` in `services/geminiService.ts` (200MB by default) to keep browser upload time and memory use reasonable; Google's own Files API supports up to 2GB per file, so raise that constant if you need bigger clips.

### YouTube links

A YouTube URL is passed directly to Gemini as a `fileData` part — no download or upload happens. Per [Google's docs](https://ai.google.dev/gemini-api/docs/video-understanding), only **public** videos are supported (not private/unlisted), and this is currently a preview capability, so behavior and quotas may change.

### Token usage

Gemini tokenizes uploaded media roughly as follows (at default resolution, per the [video understanding](https://ai.google.dev/gemini-api/docs/video-understanding) and [document processing](https://ai.google.dev/gemini-api/docs/document-processing) docs):
*   **Video**: ~300 tokens/second. The app shows a rough pre-run estimate for uploaded video based on its actual duration.
*   **PDF**: ~258 tokens/page.
*   After every real run, the exact token count (prompt + thinking + output) returned by the API is shown in the UI — that's the authoritative number, not the pre-run estimate.

Free-tier request/token limits are per-account and change over time, so this app doesn't hardcode them. Check your current limits at [aistudio.google.com/rate-limit](https://aistudio.google.com/rate-limit).

## Limitations (Hackathon MVP)

*   Uploads are capped at 200MB app-side (see above); larger needs a config change, not a code rewrite.
*   Video/YouTube navigation relies on the source's own player seeking (HTML5 `<video>`, or reloading the YouTube embed with a `start=` param).
*   No persistent database; results are transient.
*   Free-tier API keys are rate-limited; heavy use may need a billed key or may hit YouTube-specific preview quotas.
