# Smart Chomka Vercel Deploy

## Environment variables

Set these in Vercel Project Settings > Environment Variables:

```text
OPENAI_API_KEY=your_private_key_here
OPENAI_BASE_URL=https://bedrock-mantle.ap-southeast-2.api.aws/v1
OPENAI_MODEL=openai.gpt-oss-20b
AZURE_SPEECH_KEY=your_private_azure_speech_key_here
AZURE_SPEECH_REGION=southeastasia
AZURE_SPEECH_VOICE=km-KH-SreymomNeural
```

Do not place the real OpenAI or Azure API key inside `index.html`, `app.js`, `realtime-config.js`, or APK assets.

## Deploy With Vercel CLI

From this folder:

```powershell
vercel --prod
```

If Vercel CLI is not installed:

```powershell
npm i -g vercel
vercel login
vercel --prod
```

## Local Preview

```powershell
python -m http.server 8503 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8503/index.html?v=67
```

The `/api/farm-ai` and `/api/tts` endpoints run on Vercel, not on the plain local static server.
