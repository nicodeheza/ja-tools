# ja-tools

## Overview

This project offers different tools to help with the study of the Japanese language, especially with reading. It includes AI-powered text generation, a text analyzer with furigana and dictionary support, and a PDF OCR tool for scanned documents.

> **Try it live → [jatools.cc](https://jatools.cc)**

## Features

- **AI-Powered Text Generation:** Generates Japanese text based on user prompts, with selectable difficulty level, furigana annotation, streaming responses, and dictionary definitions on word click.
- **Text Analyzer:** Accepts any Japanese text and returns a tokenized, annotated version. Furigana can be displayed above each word, and clicking on a word shows its dictionary definition (kana, kanji, part-of-speech, and English glosses).
- **PDF OCR:** Upload a scanned PDF document and run OCR on any selected page (horizontal text only). Hovering over detected text regions displays an analyzed overlay with the same furigana and dictionary features as the Text Analyzer.

## Technologies Used

- **Backend:**
  - Node.js
  - Express
  - TypeScript
  - Google GenAI
  - @enjoyjs/node-mecab
  - better-sqlite3
  - Drizzle orm
- **Frontend:**
  - React
  - TanStack Router
  - Vite
  - Zustand
  - **UI:** Radix UI Popover, react-icons
  - **PDF / OCR:** PDF.js, Gutenye OCR (@gutenye/ocr-browser), ONNX Runtime Web

## Use of AI Features

This application uses a **bring your own API key** model. The AI features are powered by **Google Gemini** (`gemini-3.5-flash`), which offers a free tier, so you can use the app without paying for API credits.

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/api-keys)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### Security

Your API key is encrypted (AES-256-GCM) and stored in an **HTTP-only cookie** in your browser. The encryption key is derived from a secret that only the server knows. Your key never leaves your browser except when making requests directly to Google's AI services.

## Prerequisites

You need to have [MeCab](https://taku910.github.io/mecab/) installed. On Ubuntu/Debian, install it with:

```bash
sudo apt-get install mecab libmecab-dev mecab-ipadic-utf8
```

For other platforms, see the [MeCab installation guide](https://taku910.github.io/mecab/#install).

Also, you need to set up the dictionary

1. Create a directory in the root called `jmDict`
2. Add a Japanese JSON dictionary from [jmdict-simplified](https://github.com/scriptin/jmdict-simplified/releases)
3. Run the script to generate the dictionary database

```bash
pnpm --filter api dict:push
pnpm --filter api dict:setup
```

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nicodeheza/ja-tools.git
   cd ja-tools
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   - Create an `api/.env` file with a secret key for encrypting user-provided API keys:

     ```
     AI_KEY_SECRET=<your_64_char_hex_secret_key>
     ```

   The secret key must be a 64-character hex string (256-bit). Generate one with:

   ```bash
   openssl rand -hex 32
   ```

   Note: This app uses a "bring your own API key" model. Users provide their own Google Gemini API key which is encrypted (AES-256-GCM) and stored securely in an HTTP-only cookie in their browser. You only need the secret key above to encrypt/decrypt user keys.

   Optional variables:
   - `FRONTEND_URL` - Frontend URL (defaults to `http://localhost:5173`)
   - `LOG_LEVEL` - Logging level (defaults to `info`)
   - `PORT` - Server port (defaults to `4000` in development)

   - Create a `frontend/.env` file and add the backend API base URL used during development:

     ```
      VITE_API=http://localhost:4000/api
     ```

4. **Run the application:**

   ```bash
   pnpm dev
   ```

This starts both the backend (API) and frontend in development mode.
