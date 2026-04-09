# ja-tools

## Overview

This project offers different tools to help with the study of the Japanese language, especially with reading. It includes AI-powered text generation, a text analyzer with furigana and dictionary support, and a PDF OCR tool for scanned documents.

## Features

- **AI-Powered Text Generation:** Generates beginner-friendly Japanese text based on user prompts, with furigana annotation and streaming responses.
- **Text Analyzer:** Accepts any Japanese text and returns a tokenized, annotated version. Furigana can be displayed above each word, and clicking on a word shows its dictionary definition (kana, kanji, part-of-speech, and English glosses).
- **PDF OCR:** Upload a scanned PDF document and run OCR on any selected page. Hovering over detected text regions displays an analyzed overlay with the same furigana and dictionary features as the Text Analyzer.
- **Furigana Support:** Automatically adds furigana (reading aids) above kanji across all tools.

## Technologies Used

- **Backend:**
  - Node.js
  - Express
  - TypeScript
  - Google GenAI
  - @enjoyjs/node-mecab
  - Furigana
  - Wanakana
  - better-sqlite3
  - Drizzle orm
- **Frontend:**
  - React
  - Vite
  - Zustand
  - @radix-ui/react-popover

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
yarn push:dict
yarn setup
```

## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/nicodeheza/JLP-text-generator.git
    cd japanese-text-generator
    ```

2.  **Install dependencies:**

    ```bash
    yarn
    cd frontend
    yarn
    cd ..
    ```

3.  **Set up environment variables:**
    - Create a `.env` file in the root directory and add your AI API key:

      ```
      GEMINI_API_KEY=<your_api_key>
      ```

    - Create a `frontend/.env` file and add the backend API base URL used during development:

      ```
      VITE_DEV_API=<dev_api_base_url>
      ```

      For example: `VITE_DEV_API=http://localhost:4000/api`

4.  **Build the frontend:**

    ```bash
    cd frontend
    yarn build
    cd ..
    ```

5.  **Run the application:**

    ```bash
    yarn start
    ```
