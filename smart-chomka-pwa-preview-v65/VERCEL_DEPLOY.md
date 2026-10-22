# Smart Chomka Vercel Deploy

## Environment variables

Set these in Vercel Project Settings > Environment Variables:

```text
BEDROCK_API_KEY=your_private_bedrock_key_here
OPENAI_BASE_URL=https://bedrock-mantle.ap-southeast-2.api.aws/v1
OPENAI_MODEL=openai.gpt-oss-120b
AZURE_SPEECH_KEY=your_private_azure_speech_key_here
AZURE_SPEECH_REGION=southeastasia
AZURE_SPEECH_VOICE=km-KH-SreymomNeural
```

The Bedrock key belongs only in Vercel Project Settings > Environment Variables. Set it for the environments that run `/api/farm-ai`, then redeploy. The endpoint also accepts the older `OPENAI_API_KEY` variable during migration.

Never place the real Bedrock or Azure API key inside `index.html`, `app.js`, `realtime-config.js`, or APK assets. AWS recommends short-term credentials or IAM roles for production; long-term Bedrock keys are intended for development and expire on the date selected in AWS.

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
