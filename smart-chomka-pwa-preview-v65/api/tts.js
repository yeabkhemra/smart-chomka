const DEFAULT_REGION = "southeastasia";
const DEFAULT_VOICE = "km-KH-SreymomNeural";
const DEFAULT_OUTPUT_FORMAT = "audio-24khz-96kbitrate-mono-mp3";
let cachedSpeechRegion = "";

const VOICE_TEXT_FIXES = [
  [/\*\*([^*]+)\*\*/g, "$1"],
  [/<br\s*\/?>/gi, "។ "],
  [/<[^>]+>/g, " "],
  [/\s*\|\s*/g, "។ "],
  [/^[\s>*•\-–—]+/gm, ""],
  [/\bCOP\s+TRI\b/gi, "កុប ត្រី"],
  [/\bNO\s+COPPER\b/gi, "ណូ កុបភើ"],
  [/\bANUMANCO\s*80%?\s*WP\b/gi, "អានុម៉ង់កូ"],
  [/\bREVUS\s+OPTI\s*440SC\b/gi, "រីវុស អុបទី"],
  [/\bPERFECT\s*72%?\s*WP\b/gi, "ភើហ្វេក ចិតសិបពីរ"],
  [/\bKON\s+NEAK6\b/gi, "កូននាគប្រាំមួយ"],
  [/\bU\s*-\s*T\b/gi, "យូធី"],
  [/\bMancozeb\b/gi, "ម៉ាន់កូសែប"],
  [/\bMetalaxyl\b/gi, "មេតាឡាក់ស៊ីល"],
  [/\bCopper\b/gi, "កុបភើ"],
  [/\bKasugamycin\b/gi, "កាស៊ូហ្គាមីស៊ីន"],
  [/\bDinotefuran\b/gi, "ឌីណូតេហ្វូរ៉ាន"],
  [/\bPymetrozine\b/gi, "ពីមេត្រូហ្ស៊ីន"],
  [/\bAI\b/g, "អេ អាយ"],
  [/\bPPE\b/g, "សម្ភារៈការពារខ្លួន"],
  [/\bQR\b/g, "ឃ្យូ អារ"],
  [/\bPHI\b/g, "ភី អេច អាយ"],
  [/\bREI\b/g, "អារ អ៊ី អាយ"],
  [/\bPhomopsis\b/gi, "ហ្វូម៉ុបស៊ីស"],
  [/\bPhytophthora\b/gi, "ផៃថុបថូរ៉ា"],
  [/\bAnthracnose\b/gi, "អាន់ត្រាក់ណូស"],
  [/\bAllocaridara\b/gi, "អាឡូការីដារ៉ា"],
  [/សំភារៈ/g, "សម្ភារៈ"],
  [/(\d)\.(\d)/g, "$1 ចុច $2"],
  [/(^|\s)[0-9០-៩]+[.)។]\s*/g, "$1"],
  [/(\d+)\s*%/g, "$1 ភាគរយ"],
  [/(\d+)\s*°\s*C/gi, "$1 អង្សាសេ"],
  [/(\d+)\s*mm/gi, "$1 មីលីម៉ែត្រ"],
  [/(\d+)\s*cm/gi, "$1 សង់ទីម៉ែត្រ"],
  [/(\d+)\s*kg/gi, "$1 គីឡូក្រាម"],
  [/(\d+)\s*g\b/gi, "$1 ក្រាម"],
  [/(\d+)\s*l\b/gi, "$1 លីត្រ"],
  [/\s*[-–—]\s*/g, "។ "],
  [/[,:;：]/g, "។ "],
  [/[.!?]+/g, "។ "],
  [/[()"'“”‘’]+/g, " "],
  [/\s*\/\s*/g, " ឬ "],
];

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET" || req.query?.health) {
    return res.status(200).json({
      ok: true,
      provider: "Azure Speech with Khmer web fallback",
      voice: process.env.AZURE_SPEECH_VOICE || DEFAULT_VOICE,
      region: process.env.AZURE_SPEECH_REGION || DEFAULT_REGION,
      configured: true,
      azureConfigured: Boolean(process.env.AZURE_SPEECH_KEY),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = cleanSecret(process.env.AZURE_SPEECH_KEY);
  const body = await readJsonBody(req);
  const text = normalizeText(body.text || body.message || body.answer);
  if (!text) {
    return res.status(400).json({ error: "Text is required." });
  }

  const preferredRegion = cleanToken(body.region || process.env.AZURE_SPEECH_REGION || DEFAULT_REGION);
  const voice = cleanVoiceName(body.voice || process.env.AZURE_SPEECH_VOICE || DEFAULT_VOICE);
  const outputFormat = cleanOutputFormat(process.env.AZURE_SPEECH_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT);
  const ssml = buildSsml(text, voice);

  let azureError = null;
  try {
    if (apiKey) {
      const { audio, region } = await synthesizeSpeech({
        apiKey,
        ssml,
        outputFormat,
        preferredRegion,
      });
      cachedSpeechRegion = region;
      return sendAudio(res, audio, {
        provider: "azure",
        region,
      });
    }
  } catch (error) {
    azureError = error;
  }

  try {
    const audio = await synthesizeGoogleKhmerSpeech(text);
    return sendAudio(res, audio, {
      provider: "google-translate",
      region: "web",
    });
  } catch (fallbackError) {
    return res.status(fallbackError.status || azureError?.status || 502).json({
      error:
        fallbackError?.message ||
        azureError?.message ||
        "Text-to-speech request failed.",
    });
  }
};

function sendAudio(res, audio, { provider, region }) {
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Smart-Chomka-TTS-Provider", provider);
  res.setHeader("X-Smart-Chomka-TTS-Region", region);
  res.setHeader("Content-Length", String(audio.length));
  return res.status(200).send(audio);
}

async function synthesizeSpeech({ apiKey, ssml, outputFormat, preferredRegion }) {
  let lastAuthError = "";
  let lastNetworkError = "";
  for (const region of getCandidateRegions(preferredRegion)) {
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": outputFormat,
          "User-Agent": "SmartChomka",
          "Accept": "audio/mpeg",
        },
        body: ssml,
      });
    } catch (error) {
      lastNetworkError = `${region}: ${error?.message || "network error"}`;
      continue;
    }

    if (response.ok) {
      return {
        audio: Buffer.from(await response.arrayBuffer()),
        region,
      };
    }

    const detail = await response.text().catch(() => "");
    if ([401, 403, 404, 429, 500, 502, 503, 504].includes(response.status)) {
      lastAuthError = detail || `Azure Speech returned ${response.status} in ${region}`;
      continue;
    }

    const error = new Error(detail || `Azure Speech returned ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const error = new Error(
    lastAuthError ||
      lastNetworkError ||
      "Azure Speech key did not match the configured/common regions. Check AZURE_SPEECH_REGION."
  );
  error.status = 401;
  throw error;
}

function getCandidateRegions(preferredRegion) {
  const regions = [
    cachedSpeechRegion,
    preferredRegion,
    DEFAULT_REGION,
    "eastasia",
    "australiaeast",
    "australiasoutheast",
    "japaneast",
    "japanwest",
    "koreacentral",
    "centralindia",
    "southindia",
    "eastus",
    "eastus2",
    "westus",
    "westus2",
    "westus3",
    "centralus",
    "northcentralus",
    "southcentralus",
    "westeurope",
    "northeurope",
    "uksouth",
    "francecentral",
    "germanywestcentral",
    "swedencentral",
    "canadacentral",
    "brazilsouth",
  ].filter(Boolean);

  return [...new Set(regions.map(cleanToken).filter(Boolean))];
}

async function synthesizeGoogleKhmerSpeech(text) {
  const audioParts = [];
  for (const chunk of chunkTextForGoogleTts(text)) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=km&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "audio/mpeg,*/*",
        "User-Agent": "Mozilla/5.0 SmartChomka/1.0",
      },
    });

    if (!response.ok) {
      const error = new Error(`Khmer web TTS returned ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const audio = Buffer.from(await response.arrayBuffer());
    if (audio.length) {
      audioParts.push(audio);
    }
  }

  if (!audioParts.length) {
    const error = new Error("Khmer web TTS returned empty audio.");
    error.status = 502;
    throw error;
  }

  return Buffer.concat(audioParts);
}

function chunkTextForGoogleTts(text = "") {
  const maxLength = 180;
  const sentences = String(text)
    .split(/(?<=[។!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const chunks = [];
  let current = "";

  for (const sentence of sentences.length ? sentences : [String(text).trim()]) {
    if (sentence.length > maxLength) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(...splitLongText(sentence, maxLength));
      continue;
    }

    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.slice(0, 8);
}

function splitLongText(text = "", maxLength = 180) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return {};
  }
}

function normalizeText(value = "") {
  let text = String(value || "");
  for (const [pattern, replacement] of VOICE_TEXT_FIXES) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/\s*។\s*/g, "។ ")
    .replace(/(?:។\s*){2,}/g, "។ ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);
}

function cleanToken(value = "") {
  return String(value || DEFAULT_REGION).replace(/[^a-z0-9-]/gi, "").toLowerCase() || DEFAULT_REGION;
}

function cleanSecret(value = "") {
  return String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

function cleanVoiceName(value = "") {
  const candidate = String(value || DEFAULT_VOICE).trim();
  return /^[A-Za-z0-9-]+$/.test(candidate) ? candidate : DEFAULT_VOICE;
}

function cleanOutputFormat(value = "") {
  const candidate = String(value || DEFAULT_OUTPUT_FORMAT).trim();
  return /^[A-Za-z0-9-]+$/.test(candidate) ? candidate : DEFAULT_OUTPUT_FORMAT;
}

function buildSsml(text, voice) {
  return [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="km-KH">',
    `  <voice xml:lang="km-KH" name="${escapeXml(voice)}">`,
    `    <prosody rate="-18%" pitch="+0%">${escapeXml(text)}</prosody>`,
    "  </voice>",
    "</speak>",
  ].join("");
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
