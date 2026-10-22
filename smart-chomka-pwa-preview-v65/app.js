import './customer-account.js?v=116';
const PRIMARY_MODEL = {
  key: "efficientnet-b0-5class-original",
  label: "EfficientNetB0 5-class Smart Chomka model",
  url: "./model/durianguard.onnx?v=88",
  metadataUrl: "./model/model_metadata.json?v=88",
};

const MODEL_URL = PRIMARY_MODEL.url;
const METADATA_URL = PRIMARY_MODEL.metadataUrl;
const PREDICTION_CONFIDENCE_THRESHOLD = 0.75;
const MAFF_DURIAN_PDF_URL =
  "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf";

const liveTalkModelRecommendation = {
  primary: "Smart Chomka Guide AI",
  realtime: "Browser voice",
  note: "No-backend mode uses the guide knowledge packaged inside the app. Cloud AI can be added later with a safe server.",
};

const realtimeSessionUrl =
  typeof window !== "undefined" ? String(window.SMART_CHOMKA_REALTIME_SESSION_URL || "").trim() : "";
const cloudApiBaseUrl =
  typeof window !== "undefined"
    ? String(window.SMART_CHOMKA_CLOUD_API_BASE_URL || "https://smart-chomka.vercel.app").replace(/\/+$/, "")
    : "https://smart-chomka.vercel.app";
const defaultOnlineAiAskUrl =
  typeof window !== "undefined" && /^https?:$/.test(window.location?.protocol || "")
    ? isLocalPreviewHost(window.location.hostname)
      ? `${cloudApiBaseUrl}/api/farm-ai`
      : new URL("/api/farm-ai", window.location.origin).href
    : `${cloudApiBaseUrl}/api/farm-ai`;
const defaultCloudTtsUrl =
  typeof window !== "undefined" && /^https?:$/.test(window.location?.protocol || "")
    ? isLocalPreviewHost(window.location.hostname)
      ? `${cloudApiBaseUrl}/api/tts`
      : new URL("/api/tts", window.location.origin).href
    : `${cloudApiBaseUrl}/api/tts`;

const onlineAiAskUrlStorageKey = "smart-chomka-online-ai-ask-url-v2";
let onlineAiAskUrl = resolveOnlineAiAskUrl();
let cloudVoiceAudio = null;
let cloudVoiceObjectUrl = "";
let cloudVoiceController = null;
let activeVoiceToken = 0;

function isLocalPreviewHost(hostname = "") {
  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(String(hostname).toLowerCase());
}

function resolveOnlineAiAskUrl() {
  const savedUrl = readSavedOnlineAiUrl();
  if (savedUrl) {
    return savedUrl;
  }

  const configuredUrl =
    typeof window !== "undefined" ? normalizeOnlineAiUrl(window.SMART_CHOMKA_ONLINE_AI_ASK_URL) : "";
  if (configuredUrl) {
    return configuredUrl;
  }

  return defaultOnlineAiAskUrl;
}

function readSavedOnlineAiUrl() {
  try {
    return normalizeOnlineAiUrl(localStorage.getItem(onlineAiAskUrlStorageKey));
  } catch {
    return "";
  }
}

function normalizeOnlineAiUrl(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.href;
  } catch {
    return "";
  }
}

const pdfGuideKnowledge = {
  title: "មគ្គុទ្ទេសក៍សមាសភាពចង្រៃលើដំណាំទុរេន និងអាវ៉ូកាដូ",
  localFile: "./assets/references/durian_avocado_pest_guide_kh.pdf",
  source: "MAFF eLibrary / ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ",
  facts: [
    "មគ្គុទ្ទេសក៍នេះផ្តោតលើសមាសភាពចង្រៃលើទុរេន និងអាវ៉ូកាដូ ដូចជា សត្វល្អិត ជំងឺស្លឹក ជំងឺផ្លែ និងរោគសញ្ញាឫស។",
    "ការគ្រប់គ្រងគួរចាប់ផ្តើមពីការសម្អាតចម្ការ កាត់ស្លឹកឬមែកឆ្លង កាត់បន្ថយសំណើម និងពិនិត្យជាប្រចាំ មុនប្រើថ្នាំ។",
    "ពេលប្រើថ្នាំ ត្រូវអានស្លាក ប្រើកម្រិតតាមណែនាំ ពាក់សម្ភារៈការពារខ្លួន និងគោរពរយៈពេលចូលចម្ការវិញ និងរយៈពេលប្រមូលផល។",
  ],
  safety: "កុំបាញ់ថ្នាំពេលខ្យល់ខ្លាំង ភ្លៀង ឬថ្ងៃក្តៅខ្លាំង។ ពាក់ម៉ាស់ ស្រោមដៃ វ៉ែនតា អាវដៃវែង និងស្បែកជើងកវែង។",
};

const pdfGuideTopics = [
  {
    title: "Thrips / សត្វល្អិតតូចៗលើត្រួយខ្ចី",
    pages: "PDF pages 4-5",
    keywords: ["thrips", "ត្រីប", "សត្វល្អិតតូច", "ត្រួយខ្ចី", "ស្លឹកខ្ចី", "ស្លឹកកោង", "ប្រាក់", "ស្នាមប្រាក់"],
    symptoms: "ជាញឹកញាប់ប៉ះពាល់ត្រួយខ្ចី ស្លឹកខ្ចី និងផ្កា។ ស្លឹកអាចកោង មានស្នាមប្រាក់ ឬស្នាមខ្មៅតូចៗ។",
    actions: "ពិនិត្យខាងក្រោមស្លឹក និងត្រួយខ្ចីជាប្រចាំ។ កុំបាញ់ថ្នាំបើមិនឃើញសត្វល្អិតច្បាស់។ បើរាលដាលខ្លាំង សូមប្រើថ្នាំតាមស្លាក និងប្តូរក្រុមថ្នាំដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
  },
  {
    title: "Mealybug / សត្វល្អិតម្សៅ",
    pages: "PDF page 6",
    keywords: ["mealybug", "mealy bug", "ម្សៅ", "សត្វល្អិតម្សៅ", "សស្អិត", "ស្រមោច", "sooty mold"],
    symptoms: "ឃើញសត្វពណ៌សដូចម្សៅលើស្លឹក ត្រួយ ឬផ្លែ។ អាចមានទឹកផ្អែម ស្រមោច និងផ្សិតខ្មៅលើផ្ទៃស្លឹក/ផ្លែ។",
    actions: "កាត់ផ្នែកដែលឆ្លងខ្លាំង សម្អាតស្រមោចជុំវិញដើម និងពិនិត្យផ្លែជាប្រចាំ។ ប្រើថ្នាំតែពេលមានសត្វល្អិតច្បាស់ ហើយអានស្លាកមុនប្រើ។",
  },
  {
    title: "Swarming leaf beetle / សត្វល្អិតស៊ីស្លឹក",
    pages: "PDF pages 8-9",
    keywords: ["leaf beetle", "beetle", "ស៊ីស្លឹក", "ស្លឹករន្ធ", "ដង្កូវស៊ីស្លឹក", "សត្វល្អិតស៊ីស្លឹក"],
    symptoms: "ស្លឹកអាចមានរន្ធ ឬខូចជាចំណុចៗ ព្រោះសត្វពេញវ័យ ឬដង្កូវស៊ីផ្ទៃស្លឹក។",
    actions: "ពិនិត្យពេលព្រឹក ឬល្ងាច រកសត្វលើស្លឹក និងកាត់បន្ថយស្មៅជុំវិញដើម។ ប្រើថ្នាំតែពេលការខូចខាតច្រើន និងតាមស្លាក។",
  },
  {
    title: "African red mite / ចៃក្រហម",
    pages: "PDF pages 10-11",
    keywords: ["mite", "red mite", "ចៃ", "ចៃក្រហម", "ស្លឹកលឿង", "ស្លឹកស្ងួត", "ស្នាមលឿង"],
    symptoms: "ស្លឹកអាចមានស្នាមលឿងតូចៗ បាត់ពណ៌ ស្ងួត ឬជ្រុះ នៅពេលចៃក្រហមច្រើន។ ជាញឹកញាប់កើតនៅអាកាសធាតុក្តៅស្ងួត។",
    actions: "ពិនិត្យខាងក្រោមស្លឹកដោយប្រើកែវពង្រីក បង្កើនសំណើមដីឲ្យសមស្រប និងជៀសវាងបាញ់ថ្នាំសម្លាប់សត្វល្អិតដោយមិនចាំបាច់ ព្រោះអាចបំផ្លាញសត្វមានប្រយោជន៍។",
  },
  {
    title: "Durian fruit borer / ដង្កូវចោះផ្លែទុរេន",
    pages: "PDF pages 12-13",
    keywords: ["fruit borer", "ចោះផ្លែ", "ដង្កូវចោះផ្លែ", "ផ្លែមានរន្ធ", "ជ័រ", "សំបកផ្លែ"],
    symptoms: "ផ្លែអាចមានរន្ធតូចៗ ស្នាមជ័រ ឬសំណល់លាមកដង្កូវលើសំបក។ ខូចខាតខ្លាំងអាចធ្វើឲ្យផ្លែជ្រុះ ឬគុណភាពធ្លាក់។",
    actions: "ប្រមូលផ្លែខូច ឬជ្រុះចេញពីចម្ការ ពិនិត្យផ្លែជិតដល់ពេលទុំ និងប្រើអន្ទាក់/ថង់ការពារផ្លែបើអាចធ្វើបាន។ ប្រើថ្នាំតាមស្លាក និងគោរព PHI មុនប្រមូលផល។",
  },
  {
    title: "Durian seed borer / ដង្កូវចោះគ្រាប់ទុរេន",
    pages: "PDF pages 14-15",
    keywords: ["seed borer", "ចោះគ្រាប់", "ដង្កូវចោះគ្រាប់", "គ្រាប់", "ផ្លែជ្រុះ", "Mudaria"],
    symptoms: "ដង្កូវអាចចូលទៅក្នុងផ្លែ និងគ្រាប់ ធ្វើឲ្យផ្លែខូចពីខាងក្នុង។ ខាងក្រៅពេលខ្លះមើលមិនឃើញច្បាស់។",
    actions: "ប្រមូល និងកម្ចាត់ផ្លែជ្រុះ/ផ្លែឆ្លង កុំទុកជាប្រភពរាលដាល។ ពិនិត្យចម្ការជាប្រចាំនៅរដូវផ្លែ និងសួរអ្នកជំនាញបើការខូចខាតច្រើន។",
  },
  {
    title: "Stem/branch borer / ដង្កូវចោះដើម ឬមែក",
    pages: "PDF pages 16-17",
    keywords: ["stem borer", "branch borer", "ចោះដើម", "ចោះមែក", "ដើមមានរន្ធ", "មែកស្ងួត", "Batocera"],
    symptoms: "ដើម ឬមែកអាចមានរន្ធ សំណល់ឈើ ឬជ័រ ហើយមែកអាចស្ងួត ឬបាក់។",
    actions: "កាត់មែកខូចចេញ ដកសំណល់ឈើដែលមានដង្កូវ និងពិនិត្យដើមជុំវិញរន្ធ។ ករណីធ្ងន់ត្រូវសួរអ្នកជំនាញ ព្រោះការចោះដើមអាចប៉ះពាល់ដល់ជីវិតដើម។",
  },
  {
    title: "Phytophthora / ជំងឺរលួយផ្លែ-ដើម-ឫស",
    pages: "PDF pages 18-19 and 23-25",
    keywords: ["phytophthora", "root rot", "fruit rot", "រលួយឫស", "រលួយផ្លែ", "រលួយដើម", "ជ័រដើម", "សំបកដើម", "ទឹកជាំ"],
    symptoms: "អាចបង្ករលួយផ្លែ ស្នាមជ័រលើដើម សំបកដើមខូច ឫសរលួយ និងដើមស្លេកស្លាំង។ ជំងឺនេះកើតងាយនៅដីទឹកជាំ និងសំណើមខ្ពស់។",
    actions: "កែលម្អការបង្ហូរទឹក កុំឲ្យទឹកជាំជុំវិញគល់ កាត់ផ្នែកឆ្លង និងសម្អាតស្លឹក/ផ្លែខូច។ ប្រើថ្នាំប្រឆាំង oomycete ឬ copper តែបន្ទាប់ពីផ្ទៀងផ្ទាត់ស្លាក និងសួរអ្នកជំនាញ។",
  },
  {
    title: "Phomopsis leaf blight / ជំងឺអុចស្លឹកដោយសារផ្សិត",
    pages: "PDF pages 20-21",
    keywords: ["phomopsis", "leaf blight", "អុចស្លឹក", "រលាកស្លឹក", "ចំណុចស្លឹក", "ស្លឹកមានអុច"],
    symptoms: "ស្លឹកមានចំណុច ឬស្នាមរលាក ហើយអាចរាលដាលនៅពេលសំណើមខ្ពស់។ ស្លឹកខូចធ្វើឲ្យដើមបាត់កម្លាំង។",
    actions: "ដកស្លឹកឆ្លង កុំទុកស្លឹកជ្រុះក្រោមដើម កាត់មែកឲ្យខ្យល់ចេញចូល និងកុំស្រោចទឹកលើស្លឹកពេលល្ងាច។ ថ្នាំត្រូវប្រើតែតាមស្លាក។",
  },
  {
    title: "Pink disease / ជំងឺផ្កាឈូកលើមែក",
    pages: "PDF page 22",
    keywords: ["pink disease", "ផ្កាឈូក", "មែកពណ៌ផ្កាឈូក", "មែកស្ងួត", "Erythricium", "salmonicolor"],
    symptoms: "មែក ឬសំបកអាចមានស្រទាប់ពណ៌ផ្កាឈូក/ស សំបកខូច ហើយមែកអាចស្ងួត។ កើតងាយនៅកន្លែងសើម និងមែកជិតគ្នា។",
    actions: "កាត់មែកឆ្លងឲ្យលើសស្នាមឆ្លង សម្អាតឧបករណ៍កាត់ បើកគុម្ពឲ្យមានខ្យល់ និងកុំឲ្យសំណើមកកកុញ។",
  },
  {
    title: "Colletotrichum / Anthracnose-like disease",
    pages: "PDF pages 26-27",
    keywords: ["colletotrichum", "anthracnose", "អាន់ត្រាក់ណូស", "ស្នាមខ្មៅ", "ចំណុចខ្មៅ", "ស្លឹកខ្មៅ", "ផ្លែខ្មៅ"],
    symptoms: "អាចបង្កស្នាមខ្មៅ ឬចំណុចលើស្លឹក ត្រួយ ឬផ្លែ ជាពិសេសពេលសើម និងមានភ្លៀង។",
    actions: "កាត់ផ្នែកឆ្លង សម្អាតសំណល់រុក្ខជាតិ បើកខ្យល់ក្នុងគុម្ព និងបាញ់ថ្នាំការពារផ្ទៃស្លឹកតែតាមស្លាក/ការណែនាំអ្នកជំនាញ។",
  },
  {
    title: "Soil and leaf nutrition / ជី និងការថែដី",
    pages: "Published durian nutrition and orchard notes",
    source: "Smart Chomka agronomy guide + published durian nutrition studies",
    keywords: ["fertilizer", "npk", "ជី", "ដាក់ជី", "អាហារ", "ដី", "សំណើមដី", "soil", "organic", "nutrition", "leaf analysis", "តេស្តដី", "វិភាគស្លឹក"],
    symptoms: "បើស្លឹកលឿង ដើមលូតលាស់យឺត ផ្កា/ផ្លែជ្រុះ ឬដើមខ្សោយ អាចពាក់ព័ន្ធនឹងទឹក ដី pH ឫស ឬជីមិនសមស្រប មិនមែនជំងឺតែមួយមុខទេ។",
    actions: "ធ្វើ soil test ឬ leaf analysis បើអាចបាន បន្ថែមជីសរីរាង្គ រក្សាសំណើមដីស្មើៗ និងកុំដាក់ NPK ខ្លាំងពេលដើមខ្សោយ ឬដីស្ងួត។",
    medicine: "ផែនការជីគួរមាន NPK មូលដ្ឋាន និង Ca/Mg/B/trace elements តាមលទ្ធផលដី។ កុំផ្តល់កម្រិតជាក់លាក់ដោយគ្មានអាយុដើម ទំហំដើម និងលទ្ធផលដី។",
  },
  {
    title: "Phytophthora integrated management / គ្រប់គ្រងរលួយឫស-គល់",
    pages: "Queensland DPI/ACIAR field guidance",
    source: "Queensland DPI/ACIAR durian Phytophthora management notes",
    keywords: ["phytophthora", "root rot", "foot rot", "soil health", "drainage", "mulch", "phosphonate", "ទឹកជាំ", "បង្ហូរទឹក", "រលួយឫស", "រលួយគល់", "ជ័រដើម"],
    symptoms: "ដីទឹកជាំ គល់មានជ័រ សំបកខូច ឫសខ្មៅ/រលួយ ស្លឹកស្លេក ឬផ្លែរលួយ អាចជាសញ្ញា Phytophthora ដែលធ្ងន់លើទុរេន។",
    actions: "កែលម្អបង្ហូរទឹក កុំឲ្យទឹកជាំជុំវិញគល់ ដកសំណល់ឆ្លងចេញ បើកខ្យល់ក្នុងគុម្ព និងពិនិត្យគល់/ឫសជាប្រចាំ។",
    medicine: "Phosphonate ឬថ្នាំក្រុម oomycete អាចពិចារណាតាមស្លាក។ Copper អាចជួយការពារស្នាមលើសំបក ប៉ុន្តែការកែលម្អទឹកជាំសំខាន់ជាងថ្នាំ។",
  },
  {
    title: "Weather disease risk / អាកាសធាតុ និងហានិភ័យជំងឺ",
    pages: "weather risk guide",
    source: "Durian disease epidemiology and extension notes",
    keywords: ["weather", "rain", "humidity", "សំណើម", "ភ្លៀង", "អាកាសធាតុ", "disease risk", "wet canopy", "ខ្យល់", "រាលដាល"],
    symptoms: "សំណើមខ្ពស់ ភ្លៀងច្រើន និងស្លឹកសើមយូរ ធ្វើឲ្យ Phytophthora, Anthracnose, Phomopsis និង Algal leaf spot រាលដាលងាយ។",
    actions: "ពេល app ព្រមានសំណើម/ភ្លៀងខ្ពស់ សូមពិនិត្យស្លឹកខាងក្នុងគុម្ព ផ្លែជិតដី និងគល់។ កាត់មែកឲ្យខ្យល់ចូល និងកុំបាញ់ថ្នាំមុនភ្លៀង។",
    medicine: "បើមានរោគសញ្ញាច្បាស់ និងភ្លៀងបន្ត អាចពិចារណាថ្នាំការពារផ្ទៃស្លឹកតាមស្លាក។ កុំបាញ់ពេលភ្លៀង ឬខ្យល់ខ្លាំង។",
  },
  {
    title: "Orchard scouting / ការពិនិត្យចម្ការជាប្រចាំ",
    pages: "IPM scouting checklist",
    source: "Integrated pest management field practice",
    keywords: ["scout", "inspection", "ពិនិត្យ", "តាមដាន", "រូបភាព", "ថតរូប", "ប្រវត្តិ", "ស្លឹក", "ផ្លែ", "មែក", "គល់", "confidence", "ភាពជឿជាក់"],
    symptoms: "រូបតែមួយអាចមិនគ្រប់គ្រាន់ ដោយសាររោគសញ្ញាអាចស្រដៀងគ្នា ឬបណ្ដាលពីទឹក ជី កំដៅ និងរបួសមេកានិច។",
    actions: "ថត 3-5 រូបពីស្លឹក ផ្លែ គល់ ឬមែកដែលខូច កត់ទីតាំងដើម និងប្រៀបធៀបបន្ទាប់ពី 5-7 ថ្ងៃ។ បើ confidence ក្រោម 75% សូមថតរូបថ្មីឲ្យច្បាស់។",
    medicine: "មុនប្រើថ្នាំ ត្រូវផ្ទៀងផ្ទាត់ថារោគសញ្ញាដូចគ្នាច្រើនកន្លែង មិនមែនខូចដោយកំដៅ ខ្វះទឹក ខ្វះជី ឬស្នាមប៉ះទង្គិច។",
  },
  {
    title: "Canopy pruning and sanitation / កាត់មែក បើកខ្យល់",
    pages: "canopy management notes",
    source: "Durian orchard sanitation and IPM guidance",
    keywords: ["prune", "pruning", "canopy", "airflow", "sanitation", "កាត់មែក", "ខ្យល់", "គុម្ព", "ស្លឹកជ្រុះ", "មែកស្ងួត", "សម្អាត"],
    symptoms: "គុម្ពក្រាស់ ស្លឹកសើមយូរ និងសំណល់ស្លឹក/ផ្លែជ្រុះក្រោមដើម ជួយឲ្យផ្សិត សារាយ និងសត្វល្អិតរាលដាលងាយ។",
    actions: "កាត់មែកស្ងួត មែកជាន់គ្នា និងមែកឆ្លង។ សម្អាតស្លឹក/ផ្លែជ្រុះក្រោមដើម ហើយសម្លាប់មេរោគឧបករណ៍កាត់មុនទៅដើមបន្ទាប់។",
    medicine: "កាត់មែក និង sanitation គួរធ្វើមុនពិចារណាថ្នាំ។ បើបាញ់ថ្នាំក្រោយកាត់ ត្រូវអានស្លាក និងប្រើ PPE។",
  },
  {
    title: "Flower and fruit stage care / ចេញផ្កា និងកាន់ផ្លែ",
    pages: "flowering and fruiting care notes",
    source: "Durian orchard production guidance",
    keywords: ["flower", "fruit set", "harvest", "ផ្កា", "ចេញផ្កា", "កាន់ផ្លែ", "ជ្រុះផ្លែ", "ប្រមូលផល", "phi", "pollination"],
    symptoms: "ពេលចេញផ្កា និងកាន់ផ្លែ ដើមងាយស្ត្រេស ប្រសិនបើទឹកមិនស្មើ ជីមិនសមស្រប ឬមានសត្វល្អិត/ជំងឺលើផ្លែ។",
    actions: "រក្សាទឹកមិនឲ្យខ្វះ ឬលើស កាត់មែកអស់ប្រយោជន៍ ពិនិត្យផ្លែជិតគល់ និងដកផ្លែឆ្លង/ជ្រុះចេញពីចម្ការ។",
    medicine: "ជិតប្រមូលផល ត្រូវគោរព PHI លើស្លាកថ្នាំ។ កុំបាញ់ថ្នាំលើផ្កាដោយមិនចាំបាច់ ព្រោះអាចប៉ះពាល់សត្វជួយលំអង។",
  },
];

const safetyGuide = {
  image: "./assets/pesticide_safety_farmer.jpg",
  credit: "រូបភាពសុវត្ថិភាពបង្កើតសម្រាប់គម្រោង Smart Chomka",
  whatNeeded: [
    "អាវដៃវែង ខោវែង ឬអាវការពារថ្នាំ",
    "ស្រោមដៃកៅស៊ូ ស្បែកជើងកវែង មួក និងវ៉ែនតាការពារ",
    "ម៉ាស់ ឬ respirator ដែលសមស្របសម្រាប់ថ្នាំកសិកម្ម",
    "ធុងលាយ/ឧបករណ៍វាស់ថ្នាំ ទឹកស្អាត សាប៊ូ និងកន្លែងលាងដៃ",
    "ស្លាកផលិតផល ឬ QR ដើម្បីពិនិត្យកម្រិតលាយ PHI និងពេលចូលចម្ការវិញ",
  ],
  rules: [
    "អានស្លាកមុនលាយ និងប្រើតាមកម្រិតលើស្លាកប៉ុណ្ណោះ។",
    "កុំបាញ់ពេលខ្យល់ខ្លាំង ភ្លៀង ឬថ្ងៃក្តៅខ្លាំង។ ឈរឲ្យខ្យល់បក់ចេញពីខ្លួន។",
    "កុំញ៉ាំ ផឹក ឬជក់បារីពេលលាយ/បាញ់ថ្នាំ ហើយកុំឲ្យកុមារ និងសត្វចិញ្ចឹមនៅជិត។",
    "បន្ទាប់ពីបាញ់ សូមលាងដៃ ងូតទឹក ប្តូរសម្លៀកបំពាក់ និងបោកសម្លៀកបំពាក់បាញ់ថ្នាំដាច់ដោយឡែក។",
    "រក្សាទុកថ្នាំនៅកន្លែងចាក់សោ ឆ្ងាយពីអាហារ ទឹកស្អាត កុមារ និងសត្វចិញ្ចឹម។",
  ],
};

const referenceLinks = [
  {
    label: "វីដេអូ: របៀបមើលទុរេនមានជំងឺ",
    url: "https://www.youtube.com/watch?v=EK01gMghtIo",
    source: "YouTube",
  },
  {
    label: "អត្ថបទ: របៀបមើលទុរេនមានជំងឺ",
    url: "https://angkorgreen.com.kh/km/growing-guide/%E1%9E%9A%E1%9E%94%E1%9F%80%E1%9E%94%E1%9E%98%E1%9E%BE%E1%9E%9B%E1%9E%91%E1%9E%BB%E1%9E%9A%E1%9F%81%E1%9E%93%E1%9E%98%E1%9E%B6%E1%9E%93%E1%9E%87%E1%9F%86%E1%9E%84%E1%9E%BA/",
    source: "Angkor Green",
  },
  {
    label: "PDF: វិធានការទប់ស្កាត់សមាសភាពចង្រៃលើដំណាំទុរេន",
    url: MAFF_DURIAN_PDF_URL,
    localFile: "./assets/references/maff_durian_pest_management.pdf",
    source: "MAFF eLibrary",
  },
  {
    label: "មគ្គុទ្ទេសក៍ Khmer: អានស្លាកថ្នាំកសិកម្ម",
    url: "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
    source: "East-West Seed GrowHow",
  },
];

const farmerSummaries = {
  ALGAL_LEAF_SPOT: {
    tone: "warning",
    title: "ស្លឹកមានអុចដោយសារាយ",
    message: "កុំប្រញាប់បាញ់ថ្នាំភ្លាមៗ។ មើលច្រើនស្លឹក និងបន្ថយសំណើមជាមុន។",
    action: "កាត់ស្លឹកឆ្លង បើកមែកឲ្យខ្យល់ចេញចូល ហើយសួរអ្នកជំនាញមុនប្រើថ្នាំ។",
  },
  ALLOCARIDARA_ATTACK: {
    tone: "danger",
    title: "អាចមានសត្វល្អិតជញ្ជក់ស្លឹក",
    message: "នេះមិនមែនជាជំងឺផ្សិតទេ។ ត្រូវរកសត្វល្អិតនៅខាងក្រោមស្លឹក និងត្រួយខ្ចី។",
    action: "បាញ់ថ្នាំតែពេលឃើញសត្វល្អិត ឬស្នាមវាយប្រហារច្បាស់។",
  },
  HEALTHY_LEAF: {
    tone: "healthy",
    title: "ស្លឹកមើលទៅល្អ",
    message: "មិនចាំបាច់បាញ់ថ្នាំ ប្រសិនបើមិនមានរោគសញ្ញាផ្សេង។",
    action: "បន្តតាមដានស្លឹកខ្ចី និងរក្សាខ្យល់ចេញចូលក្នុងដើម។",
  },
  LEAF_BLIGHT: {
    tone: "danger",
    title: "មានស្នាមរលាកស្លឹក",
    message: "ស្លឹកខូចអាចធ្វើឲ្យដើមបាត់កម្លាំង និងរាលដាលនៅពេលសើម។",
    action: "ដកស្លឹកឆ្លង កុំទុកស្លឹកជ្រុះក្រោមដើម និងកែលម្អការបង្ហូរទឹក។",
  },
  PHOMOPSIS_LEAF_SPOT: {
    tone: "warning",
    title: "ជំងឺអុចស្លឹកដោយសារផ្សិត",
    message: "ជំងឺចំណុចស្លឹកអាចរាលដាលនៅពេលសំណើមខ្ពស់។",
    action: "ដកស្លឹកឆ្លង កាត់មែកឲ្យមានខ្យល់ និងប្រើថ្នាំតែបន្ទាប់ពីពិនិត្យស្លាក។",
  },
  ANTHRACNOSE: {
    tone: "danger",
    title: "ជំងឺអាន់ត្រាក់ណូស",
    message: "ជំងឺផ្សិតនេះអាចធ្វើឲ្យស្លឹក ផ្កា ឬផ្លែមានស្នាមខ្មៅ និងរាលដាលពេលភ្លៀងសើម។",
    action: "កាត់ផ្នែកឆ្លង សម្អាតផ្លែ/ស្លឹកជ្រុះ និងពិចារណាថ្នាំផ្សិតតែបន្ទាប់ពីអានស្លាក។",
  },
  CANKER_DISEASE: {
    tone: "danger",
    title: "ជំងឺ Canker",
    message: "ស្នាម canker លើដើម ឬមែកអាចធ្វើឲ្យជ័រហូរ មែកខ្សោយ និងបាត់កម្លាំងដើម។",
    action: "កុំឲ្យទឹកជាំ កាត់ផ្នែកឆ្លងដោយឧបករណ៍ស្អាត ហើយសួរអ្នកជំនាញបើស្នាមធ្ងន់។",
  },
  FRUIT_ROT: {
    tone: "danger",
    title: "ផ្លែទុរេនរលួយ",
    message: "ផ្លែរលួយអាចធ្វើឲ្យខាតទិន្នផល និងរាលដាលពីផ្លែឆ្លងទៅផ្លែជិតខាង។",
    action: "ប្រមូលផ្លែឆ្លងចេញ កុំទុកផ្លែរលួយក្រោមដើម និងកាត់បន្ថយសំណើមក្នុងចម្ការ។",
  },
  MEALYBUG_INFESTATION: {
    tone: "danger",
    title: "សត្វល្អិតម្សៅ",
    message: "សត្វល្អិតម្សៅជញ្ជក់ទឹករុក្ខជាតិ និងអាចបង្កផ្សិតខ្មៅលើស្លឹក ឬផ្លែ។",
    action: "ពិនិត្យក្រោមស្លឹក កន្លែងភ្ជាប់ផ្លែ និងមែកខ្ចី។ ប្រើថ្នាំសត្វល្អិតតែពេលឃើញសត្វច្បាស់។",
  },
  PINK_DISEASE: {
    tone: "warning",
    title: "ជំងឺផ្សិតពណ៌ផ្កាឈូក",
    message: "ជំងឺនេះវាយប្រហារលើមែក ឬដើម ហើយកើតខ្លាំងពេលអាកាសធាតុសើម។",
    action: "កាត់មែកឆ្លង បើកខ្យល់ក្នុងគុម្ព និងសម្អាតឧបករណ៍កាត់មុនទៅដើមផ្សេង។",
  },
};

const medicineDetails = {
  NO_COPPER: {
    credit: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល NO COPPER (Haktore Golden Harvest Co., Ltd)",
    labelReading: [
      "ឈ្មោះផលិតផល: NO COPPER",
      "បរិមាណលើដប: 1L",
      "ខាងក្រោយស្លាកអានបាន: Haktore Golden Harvest Co., Ltd",
      "សារធាតុសកម្មមិនអានបានច្បាស់ពីរូប ដូច្នេះត្រូវពិនិត្យស្លាក/QR មុនប្រើ។",
    ],
    function:
      "ជួយការពារផ្ទៃស្លឹក និងកាត់បន្ថយការរាលដាលនៅពេលសំណើមខ្ពស់។ ថ្នាំប្រភេទការពារមិនអាចធ្វើឲ្យស្លឹកខូចខ្លាំងត្រឡប់មកល្អវិញបានទេ។",
    cautions: [
      "ប្រើតែបើស្លាកផលិតផលអនុញ្ញាតសម្រាប់ទុរេន និងរោគសញ្ញាដែលកំពុងឃើញ។",
      "ពាក់ PPE ពេលលាយ ឬបាញ់ថ្នាំ។",
      "កុំលាយជាមួយថ្នាំផ្សេងៗ ប្រសិនបើស្លាកមិនណែនាំ។",
    ],
    links: [
      {
        label: "Clemson HGIC - algal leaf spot and copper sprays",
        url: "https://hgic.clemson.edu/factsheet/algal-leaf-spot/",
      },
      {
        label: "PNW Handbook - copper-based fungicides",
        url: "https://pnwhandbooks.org/plantdisease/pesticide-articles/copper-based-bactericides-fungicides",
      },
      {
        label: "MAFF Khmer PDF - durian pest management",
        url: MAFF_DURIAN_PDF_URL,
        localFile: "./assets/references/maff_durian_pest_management.pdf",
      },
    ],
  },
  U_T_INSECTICIDE: {
    credit: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល U-T",
    labelReading: [
      "ឈ្មោះផលិតផល: U-T",
      "សារធាតុសកម្មដែលអានបាន: Dinotefuran 20% + Pymetrozine 50% WDG",
      "ប្រភេទប្រើប្រាស់: ថ្នាំកម្ចាត់សត្វល្អិតជញ្ជក់ទឹក/បំផ្លាញស្លឹកខ្ចី",
      "លេខ/កូដលើស្លាកដែលអានបាន: FR01 9074/0923 UT-GDA",
    ],
    function:
      "Dinotefuran ជាក្រុម neonicotinoid មានសកម្មភាព systemic សម្រាប់សត្វល្អិតជញ្ជក់ទឹក។ Pymetrozine ជា feeding blocker ដែលធ្វើឲ្យសត្វល្អិតបញ្ឈប់ការចិញ្ចឹម។",
    cautions: [
      "បាញ់តែពេលមានសត្វល្អិត ឬស្នាមវាយប្រហារច្បាស់។",
      "កុំបាញ់ពេលដើមកំពុងចេញផ្កា ឬពេលមានឃ្មុំ និងសត្វមានប្រយោជន៍ច្រើន។",
      "ប្តូរក្រុមថ្នាំតាមការណែនាំអ្នកជំនាញ ដើម្បីកាត់បន្ថយហានិភ័យធន់ថ្នាំ។",
    ],
    links: [
      {
        label: "IRAC - insecticide mode of action groups",
        url: "https://irac-online.org/mode-of-action/",
      },
      {
        label: "LSU AgCenter - Pymetrozine feeding blocker",
        url: "https://www.lsuagcenter.com/profiles/aiverson/articles/page1548277240641",
      },
    ],
  },
  AG_PERFECT_72WP: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: PERFECT 72%WP",
      "សារធាតុសកម្មលើទំព័រ: Metalaxyl 80g/kg + Mancozeb 640g/kg WP",
      "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ Downy mildew, Phytophthora និង Late blight។",
    ],
    function:
      "ជាជម្រើសពិចារណាពេលស្នាមរលាកស្លឹកសង្ស័យពាក់ព័ន្ធ Phytophthora/oomycete។ វាមិនជំនួសការកាត់ស្លឹកឆ្លង និងការកែលម្អសំណើមទេ។",
    cautions: [
      "ប្រើតាមស្លាកពិត ហើយកុំប្រើបន្តបន្ទាប់ក្រុម Metalaxyl ដោយគ្មានការប្តូរក្រុមថ្នាំ។",
      "គោរពរយៈពេលចូលចម្ការឡើងវិញ និងរយៈពេលមុនប្រមូលផលតាមស្លាក។",
    ],
    links: [
      {
        label: "Angkor Green - PERFECT 72%WP product page",
        url: "https://angkorgreen.com.kh/product/perfect-72wp/",
      },
      {
        label: "MAFF Khmer PDF - durian pest management",
        url: MAFF_DURIAN_PDF_URL,
        localFile: "./assets/references/maff_durian_pest_management.pdf",
      },
    ],
  },
  AG_REVUS_OPTI: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: REVUS OPTI 440SC",
      "សារធាតុសកម្មលើទំព័រ: Mandipropamid 40g/l + Chlorothalonil 400g/l SC",
      "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ Downy mildew, Phytophthora និង Late blight។",
    ],
    function:
      "Mandipropamid ផ្តោតលើ oomycete ហើយ Chlorothalonil ជា contact protectant។ គួរប្រើជាមួយការកែលម្អទឹក សំណើម និងខ្យល់ក្នុងដើម។",
    cautions: [
      "ពិនិត្យថាស្លាកអនុញ្ញាតសម្រាប់ទុរេន មុនយកទៅប្រើនៅចម្ការ។",
      "កុំលាយជាមួយផលិតផលផ្សេង ប្រសិនបើស្លាកមិនបញ្ជាក់ថាអាចលាយបាន។",
    ],
    links: [
      {
        label: "Angkor Green - REVUS OPTI 440SC product page",
        url: "https://angkorgreen.com.kh/product/rivus-oti/",
      },
      {
        label: "MAFF Khmer PDF - durian pest management",
        url: MAFF_DURIAN_PDF_URL,
        localFile: "./assets/references/maff_durian_pest_management.pdf",
      },
    ],
  },
  AG_FOLU: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: FOLU",
      "សារធាតុសកម្មលើទំព័រ: Fosetyl Aluminium 800g/kg WP",
      "ទំព័រផលិតផលបង្ហាញការប្រើលើស្លឹក ផ្កា ផ្លែ និងប្រព័ន្ធស្រោចទឹក។",
    ],
    function:
      "Fosetyl-Al ជាថ្នាំប្រឆាំង oomycete/systemic ដែលអាចពិចារណាសម្រាប់រោគក្រុម Phytophthora នៅពេលសំណើមខ្ពស់។ វាត្រូវប្រើជាមួយការបង្ហូរទឹកល្អ កុំឲ្យទឹកជាំជុំវិញគល់។",
    cautions: [
      "សូមផ្ទៀងផ្ទាត់ស្លាកពិតថាអនុញ្ញាតសម្រាប់ទុរេន និងរោគសញ្ញាដែលកំពុងឃើញ។",
      "កុំប្រើជំនួសការកែលម្អការបង្ហូរទឹក ព្រោះ Phytophthora កើតខ្លាំងនៅដីទឹកជាំ។",
      "គោរព PHI/REI និងកុំលាយជាមួយផលិតផលផ្សេង ប្រសិនបើស្លាកមិនបញ្ជាក់។",
    ],
    links: [
      {
        label: "Angkor Green - FOLU product page",
        url: "https://angkorgreen.com.kh/product/folu/",
      },
      {
        label: "MAFF Khmer PDF - durian pest management",
        url: MAFF_DURIAN_PDF_URL,
        localFile: "./assets/references/maff_durian_pest_management.pdf",
      },
    ],
  },
  AG_PHYTAB_M_350ES: {
    credit: "ព័ត៌មានផលិតផលពី Angkor Green; រូបក្នុង App ប្រើ FOLU ជារូបជំនួស ដោយសារមិនទាន់មានរូប PHYTAB",
    labelReading: [
      "ឈ្មោះផលិតផល: PHYTAB M 350ES",
      "សារធាតុសកម្មលើទំព័រ: Metalaxyl-M 350g/L ES",
      "ទំព័រផលិតផលបង្ហាញថាជា Mefenoxam/Metalaxyl-M ដែលស្រូបចូលរុក្ខជាតិលឿន។",
    ],
    function:
      "Metalaxyl-M/Mefenoxam ជាក្រុម phenylamide សម្រាប់រោគ oomycete មួយចំនួន។ ប្រើតែពេលសង្ស័យ Phytophthora/រោគទឹកជាំ និងតាមស្លាកពិត។",
    cautions: [
      "កុំប្រើក្រុម Metalaxyl/Metalaxyl-M ដដែលៗជាប់គ្នា ព្រោះអាចបង្កហានិភ័យធន់ថ្នាំ។",
      "បើមានស្នាមជ័រគល់ ឫសរលួយ ឬដើមស្លេកធ្ងន់ សូមសួរអ្នកជំនាញចម្ការទុរេន។",
    ],
    links: [
      {
        label: "Angkor Green - PHYTAB M 350ES product page",
        url: "https://angkorgreen.com.kh/product/phytab-m-35-fs/",
      },
      {
        label: "MAFF Khmer PDF - durian pest management",
        url: MAFF_DURIAN_PDF_URL,
        localFile: "./assets/references/maff_durian_pest_management.pdf",
      },
    ],
  },
  AG_ANUMANCO_80WP: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: ANUMANCO 80%WP",
      "សារធាតុសកម្មលើទំព័រ: Mancozeb 800g/kg WP",
      "សម្រាប់ Phomopsis ត្រូវផ្ទៀងផ្ទាត់ស្លាកថាត្រូវនឹងជំងឺចំណុចស្លឹកលើទុរេន។",
    ],
    function:
      "Mancozeb ជា contact/multi-site protectant សម្រាប់ក្រុមជំងឺផ្សិតមួយចំនួន។ គួរប្រើជាមួយការដកស្លឹកឆ្លង និងកាត់មែកឲ្យខ្យល់ចេញចូល។",
    cautions: [
      "ប្រើតែបើស្លាកអនុញ្ញាតសម្រាប់ដំណាំ និងរោគសញ្ញាដែលកំពុងឃើញ។",
      "កុំបាញ់ជិតប្រភពទឹក ឬពេលខ្យល់បក់ទៅផ្ទះ អាហារ ឬសត្វចិញ្ចឹម។",
    ],
    links: [
      {
        label: "Angkor Green - ANUMANCO 80%WP product page",
        url: "https://angkorgreen.com.kh/product/anumanco-80wp-2/",
      },
      {
        label: "Research - Phomopsis durionis leaf spot on durian",
        url: "https://actavia.mendelu.cz/pdfs/acu/2016/01/22.pdf",
      },
    ],
  },
  AG_TILT_SUPER: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: TILT SUPER 300EC",
      "សារធាតុសកម្មលើទំព័រ: Propiconazole 150g/L + Difenoconazole 150g/L EC",
      "ជាថ្នាំផ្សិតប្រភេទ systemic/DMI។ សូមផ្ទៀងផ្ទាត់ស្លាកពិតមុនប្រើលើទុរេន។",
    ],
    function:
      "ជួយរារាំងការលូតលាស់របស់ផ្សិតមួយចំនួន ប៉ុន្តែត្រូវប្រើជាមួយការកាត់ផ្នែកឆ្លង និងបន្ថយសំណើម មិនមែនជាដំណោះស្រាយតែមួយមុខទេ។",
    cautions: [
      "ប្រើតែបើស្លាកអនុញ្ញាតសម្រាប់ដំណាំទុរេន និងរោគសញ្ញាដែលកំពុងឃើញ។",
      "កុំប្រើក្រុមថ្នាំ DMI ដដែលៗជាប់គ្នា ដើម្បីកាត់បន្ថយហានិភ័យធន់ថ្នាំ។",
      "ពាក់ PPE និងគោរពពេលចូលចម្ការវិញ/ពេលប្រមូលផល។",
    ],
    links: [
      {
        label: "Angkor Green - TILT SUPER 300EC product page",
        url: "https://angkorgreen.com.kh/product/tilt-super-300ec/",
      },
      {
        label: "FRAC - fungicide resistance guidance",
        url: "https://www.frac.info/",
      },
    ],
  },
  AG_KON_NEAK6: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: KON NEAK6",
      "សារធាតុសកម្មលើទំព័រ: Pymetrozine 200g/kg + Thiamethoxam 150g/kg WDG",
      "សម្រាប់ Allocarsidara ត្រូវពិនិត្យថាមានសត្វល្អិត/ស្នាមជញ្ជក់ច្បាស់ មុនប្រើ។",
    ],
    function:
      "ជួយបញ្ឈប់ការចិញ្ចឹមរបស់សត្វល្អិតជញ្ជក់ទឹក និងកាត់បន្ថយការខូចស្លឹកខ្ចី។",
    cautions: [
      "កុំបាញ់ពេលដើមកំពុងចេញផ្កា ឬពេលមានឃ្មុំ/សត្វមានប្រយោជន៍ច្រើន។",
      "ប្រើតាមស្លាកពិត និងប្តូរក្រុមថ្នាំ ដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
    ],
    links: [
      {
        label: "Angkor Green - KON NEAK6 product page",
        url: "https://angkorgreen.com.kh/product/kon-neak-6/",
      },
      {
        label: "IRAC - insecticide mode of action groups",
        url: "https://irac-online.org/mode-of-action/",
      },
    ],
  },
  AG_SRAKAR_NEAK: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: SRAKAR NEAK",
      "សារធាតុសកម្មលើទំព័រ: Lambda cyhalothrin 40g/kg + Thiamethoxam 120g/kg WP",
      "ប្រើតែបើស្លាកពិតអនុញ្ញាត និងមានសត្វល្អិតវាយប្រហារច្បាស់។",
    ],
    function:
      "អាចកាត់បន្ថយសត្វល្អិតជញ្ជក់ទឹកបានលឿន ប៉ុន្តែអាចប៉ះពាល់សត្វមានប្រយោជន៍ ដូច្នេះគួរប្រើដោយប្រុងប្រយ័ត្ន។",
    cautions: [
      "ជៀសវាងបាញ់ពេលមានផ្កា ឬពេលមានឃ្មុំ ព្រោះអាចប៉ះពាល់ pollinator។",
      "កុំបាញ់ជិតប្រភពទឹក ឬពេលខ្យល់បក់ខ្លាំង។",
    ],
    links: [
      {
        label: "Angkor Green - SRAKAR NEAK product page",
        url: "https://angkorgreen.com.kh/product/srakar-neak/",
      },
      {
        label: "IRAC - insecticide mode of action groups",
        url: "https://irac-online.org/mode-of-action/",
      },
    ],
  },
  AG_BUTA: {
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    labelReading: [
      "ឈ្មោះផលិតផល: BUTA (អាសេតាប្រូ)",
      "សារធាតុសកម្មលើទំព័រ: Buprofezin 150g + Acetamiprid 150g WP",
      "ទំព័រផលិតផលបង្ហាញថាប្រើលើសត្វល្អិតជញ្ជក់ និងសត្វល្អិតសំបករឹងមួយចំនួន។",
    ],
    function:
      "Buprofezin ជួយរារាំងការលូតលាស់របស់សត្វល្អិតខ្លះៗ ហើយ Acetamiprid ជាក្រុម neonicotinoid សម្រាប់សត្វល្អិតជញ្ជក់ទឹក។ សម្រាប់ផ្សិតខ្មៅ ត្រូវគ្រប់គ្រងសត្វល្អិតបង្កទឹកផ្អែមជាមុន។",
    cautions: [
      "កុំបាញ់ពេលមានផ្កា ឬពេលមានឃ្មុំ/សត្វមានប្រយោជន៍ច្រើន។",
      "ប្រើតែពេលឃើញសត្វល្អិតច្បាស់ មិនមែនប្រើសម្រាប់ជំងឺផ្សិតដោយផ្ទាល់ទេ។",
      "ប្តូរក្រុមថ្នាំ និងអានស្លាក/QR មុនប្រើ។",
    ],
    links: [
      {
        label: "Angkor Green - BUTA product page",
        url: "https://angkorgreen.com.kh/product/buta-%E1%9E%A2%E1%9E%B6%E1%9E%9F%E1%9F%81%E1%9E%8F%E1%9E%B6%E1%9E%94%E1%9F%92%E1%9E%9A%E1%9E%BC/",
      },
      {
        label: "IRAC - insecticide mode of action groups",
        url: "https://irac-online.org/mode-of-action/",
      },
    ],
  },
  PHYTOPHTHORA_ROOT_FOOT_ROT: {
    title: "ជំងឺ Phytophthora រលួយគល់/ឫស",
    why: "Phytophthora គឺជាជំងឺគ្រោះថ្នាក់សម្រាប់ទុរេន ព្រោះវាអាចធ្វើឲ្យគល់មានជ័រ ឫសរលួយ ដើមស្លេក និងផ្លែរលួយ។ វាកើតខ្លាំងនៅដីទឹកជាំ និងរដូវភ្លៀង។",
    actions: [
      "កែលម្អការបង្ហូរទឹកជុំវិញគល់ កុំឲ្យទឹកជាំ ឬដីបិទគល់ខ្ពស់ពេក។",
      "កាត់ផ្នែកឆ្លង ឬផ្លែរលួយចេញ ហើយកុំទុកសំណល់ឆ្លងក្រោមដើម។",
      "បើមានជ័រហូរ ឫសរលួយ ឬដើមស្លេកធ្ងន់ សូមសួរអ្នកជំនាញមុនប្រើថ្នាំ។",
    ],
    medicines: [
      {
        key: "AG_FOLU",
        name: "FOLU",
        image: "./assets/products/ag_folu.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Fosetyl Aluminium 800g/kg WP",
        use: "ជម្រើសប្រឆាំង oomycete/Phytophthora ដែលត្រូវប្រើជាមួយការបង្ហូរទឹកល្អ និងតាមស្លាកពិត។",
      },
      {
        key: "AG_PERFECT_72WP",
        name: "PERFECT 72%WP",
        image: "./assets/products/ag_perfect_72wp.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Metalaxyl 80g/kg + Mancozeb 640g/kg WP",
        use: "ពិចារណាសម្រាប់រោគក្រុម Phytophthora/oomycete បើស្លាកអនុញ្ញាត។ កុំប្រើជំនួសការបង្ហូរទឹក។",
      },
      {
        key: "AG_REVUS_OPTI",
        name: "REVUS OPTI 440SC",
        image: "./assets/products/ag_revus_opti.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mandipropamid 40g/l + Chlorothalonil 400g/l SC",
        use: "ជម្រើសសម្រាប់ស្ថានភាពសើម និងរោគ oomycete មួយចំនួន។ ត្រូវផ្ទៀងផ្ទាត់ស្លាកសម្រាប់ទុរេន។",
      },
    ],
  },
  SOOTY_MOLD: {
    title: "សត្វល្អិតម្សៅ/ផ្សិតខ្មៅ",
    why: "ផ្សិតខ្មៅជារឿយៗកើតពីទឹកផ្អែមដែលសត្វល្អិតជញ្ជក់ទឹក ដូចជា mealybug ឬ scale បញ្ចេញ។ វាបិទផ្ទៃស្លឹក ធ្វើឲ្យស្លឹកទទួលពន្លឺតិច និងផ្លែមានរូបរាងមិនស្អាត។",
    actions: [
      "រក និងគ្រប់គ្រងសត្វល្អិតជញ្ជក់ទឹកជាមុន មិនមែនបាញ់ថ្នាំផ្សិតតែម្ខាង។",
      "កាត់បន្ថយស្រមោច និងសម្អាតផ្នែកដែលមានផ្សិតខ្មៅខ្លាំង។",
      "បើកខ្យល់ក្នុងគុម្ព និងពិនិត្យកន្លែងក្រោមស្លឹក/ក្បាលផ្លែជាប្រចាំ។",
    ],
    medicines: [
      {
        key: "AG_BUTA",
        name: "BUTA",
        image: "./assets/products/ag_buta.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Buprofezin 150g + Acetamiprid 150g WP",
        use: "ពិចារណាសម្រាប់សត្វល្អិតជញ្ជក់ទឹក/scale ប្រសិនបើឃើញសត្វច្បាស់។ មិនមែនថ្នាំសម្លាប់ផ្សិតខ្មៅដោយផ្ទាល់។",
      },
      {
        key: "AG_KON_NEAK6",
        name: "KON NEAK6",
        image: "./assets/products/ag_kon_neak6_front.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Pymetrozine 200g/kg + Thiamethoxam 150g/kg WDG",
        use: "ជួយលើសត្វល្អិតជញ្ជក់ទឹកមួយចំនួន។ ប្រើតែពេលមានសត្វល្អិតច្បាស់ និងតាមស្លាក។",
      },
      {
        key: "U_T_INSECTICIDE",
        name: "U-T",
        image: "./assets/products/ut_insecticide.webp",
        maker: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល U-T",
        active: "Dinotefuran 20% + Pymetrozine 50% WDG",
        use: "ជម្រើសសម្រាប់សត្វល្អិតជញ្ជក់ទឹក។ ជៀសវាងបាញ់ពេលមានផ្កា ឬសត្វមានប្រយោជន៍ច្រើន។",
      },
    ],
  },
  STEM_BORER_DAMAGE: {
    title: "ដង្កូវចោះដើម/មែក",
    why: "ដង្កូវចោះដើម ឬមែកអាចធ្វើឲ្យមានរន្ធ សំណល់ឈើ ជ័រហូរ និងមែកស្ងួត។ បើធ្ងន់ វាអាចប៉ះពាល់ដល់ជីវិតដើមទុរេន។",
    actions: [
      "ពិនិត្យរន្ធ សំណល់ឈើ និងជ័រលើដើម/មែក ជាពិសេសពេលព្រឹក។",
      "កាត់មែកខូច ឬសម្អាតរន្ធដោយប្រុងប្រយ័ត្ន ហើយយកសំណល់ឆ្លងចេញពីចម្ការ។",
      "ករណីចោះដើមធំ សូមសួរអ្នកជំនាញ មុនចាក់ ឬបាញ់ថ្នាំទៅលើដើម។",
    ],
    medicines: [
      {
        key: "AG_SRAKAR_NEAK",
        name: "SRAKAR NEAK",
        image: "./assets/products/ag_srakar_neak.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Lambda cyhalothrin 40g/kg + Thiamethoxam 120g/kg WP",
        use: "ជម្រើសសម្រាប់សត្វល្អិតមួយចំនួន ប៉ុន្តែដង្កូវក្នុងដើមត្រូវការការបញ្ជាក់ និងវិធីគ្រប់គ្រងត្រឹមត្រូវ។",
      },
    ],
  },
  FRUIT_BORER_DAMAGE: {
    title: "ដង្កូវចោះផ្លែ/គ្រាប់",
    why: "ដង្កូវចោះផ្លែ ឬគ្រាប់អាចធ្វើឲ្យផ្លែមានរន្ធ ជ័រ ឬខូចពីខាងក្នុង។ ផ្លែខូចអាចធ្វើឲ្យបាត់តម្លៃលក់ និងក្លាយជាប្រភពរាលដាល។",
    actions: [
      "ប្រមូលផ្លែជ្រុះ ឬផ្លែមានរន្ធចេញពីចម្ការ មិនទុកក្រោមដើម។",
      "ពិនិត្យផ្លែជាប្រចាំ ហើយប្រើថង់ការពារផ្លែ ឬអន្ទាក់ ប្រសិនបើអាចធ្វើបាន។",
      "គោរព PHI យ៉ាងតឹងរឹង ប្រសិនបើត្រូវប្រើថ្នាំជិតពេលប្រមូលផល។",
    ],
    medicines: [
      {
        key: "AG_SRAKAR_NEAK",
        name: "SRAKAR NEAK",
        image: "./assets/products/ag_srakar_neak.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Lambda cyhalothrin 40g/kg + Thiamethoxam 120g/kg WP",
        use: "ប្រើតែបើស្លាកអនុញ្ញាត សត្វល្អិតច្បាស់ និងមិនបំពាន PHI មុនប្រមូលផល។",
      },
    ],
  },
  THRIPS_MITE_DAMAGE: {
    title: "ត្រីប/ចៃក្រហមលើត្រួយខ្ចី",
    why: "ត្រីប និងចៃក្រហមអាចធ្វើឲ្យស្លឹកខ្ចីកោង មានស្នាមប្រាក់ លឿង ឬស្ងួត។ ការខូចត្រួយខ្ចីធ្វើឲ្យដើមលូតលាស់យឺត។",
    actions: [
      "ពិនិត្យខាងក្រោមស្លឹកខ្ចី និងត្រួយថ្មី។ ចៃក្រហមត្រូវការកែវពង្រីកដើម្បីមើលឲ្យច្បាស់។",
      "កុំបាញ់ថ្នាំសត្វល្អិតទូលំទូលាយដោយមិនចាំបាច់ ព្រោះអាចបំផ្លាញសត្វមានប្រយោជន៍។",
      "បើរាលដាលខ្លាំង សូមពិភាក្សាជាមួយអ្នកលក់/មន្រ្តីកសិកម្ម ដើម្បីជ្រើសថ្នាំត្រូវក្រុមសត្វល្អិត។",
    ],
    medicines: [
      {
        key: "U_T_INSECTICIDE",
        name: "U-T",
        image: "./assets/products/ut_insecticide.webp",
        maker: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល U-T",
        active: "Dinotefuran 20% + Pymetrozine 50% WDG",
        use: "អាចពិចារណាសម្រាប់សត្វល្អិតជញ្ជក់ទឹកខ្លះៗ តែចៃក្រហមអាចត្រូវការថ្នាំក្រុមផ្សេង។",
      },
      {
        key: "AG_BUTA",
        name: "BUTA",
        image: "./assets/products/ag_buta.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Buprofezin 150g + Acetamiprid 150g WP",
        use: "ពិចារណាសម្រាប់សត្វល្អិតជញ្ជក់/scale ប្រសិនបើឃើញសត្វច្បាស់។",
      },
    ],
  },
  RHIZOCTONIA_LEAF_BLIGHT: {
    title: "រលាកស្លឹកផ្សិត (មគ្គុទ្ទេសក៍)",
    why: "រលាកស្លឹកពីក្រុមផ្សិតអាចកើតខ្លាំងនៅស្ថានភាពសើម និងគុម្ពក្រាស់។ រោគសញ្ញាអាចស្រដៀងជំងឺស្លឹកផ្សេង ដូច្នេះត្រូវពិនិត្យច្រើនរូប និងបរិស្ថានចម្ការ មុនសម្រេចប្រើថ្នាំ។",
    actions: [
      "ដកស្លឹកឆ្លង និងកុំឲ្យសំណល់ស្លឹកសើមកកក្រោមដើម។",
      "កាត់មែកឲ្យខ្យល់ចេញចូល និងកុំស្រោចទឹកលើស្លឹកពេលល្ងាច។",
      "ប្រើថ្នាំផ្សិតតែបន្ទាប់ពីផ្ទៀងផ្ទាត់រោគសញ្ញា និងស្លាកផលិតផល។",
    ],
    medicines: [
      {
        key: "AG_ANUMANCO_80WP",
        name: "ANUMANCO 80%WP",
        image: "./assets/products/ag_anumanco.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mancozeb 800g/kg WP",
        use: "contact protectant សម្រាប់ជំងឺផ្សិតមួយចំនួន។ ប្រើជាមួយការសម្អាតសំណល់ឆ្លង។",
      },
    ],
  },
  COLLETOTRICHUM_LEAF_SPOT: {
    title: "ចំណុចស្លឹក Colletotrichum",
    why: "Colletotrichum ជាក្រុមផ្សិតពាក់ព័ន្ធនឹង anthracnose ដែលអាចបង្កស្នាមខ្មៅលើស្លឹក ត្រួយ ឬផ្លែ។ វារាលដាលងាយពេលភ្លៀង និងសំណើមខ្ពស់។",
    actions: [
      "កាត់ផ្នែកឆ្លង និងសម្អាតស្លឹក/ផ្លែខូចចេញពីចម្ការ។",
      "បើកខ្យល់ក្នុងគុម្ព និងកាត់បន្ថយទឹកបាញ់លើស្លឹក។",
      "ប្តូរក្រុមថ្នាំប្រសិនបើត្រូវប្រើជាច្រើនដង ដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
    ],
    medicines: [
      {
        key: "AG_ANUMANCO_80WP",
        name: "ANUMANCO 80%WP",
        image: "./assets/products/ag_anumanco.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mancozeb 800g/kg WP",
        use: "contact protectant សម្រាប់ជំងឺផ្សិតមួយចំនួន។ ប្រើតែបើស្លាកអនុញ្ញាត។",
      },
      {
        key: "AG_TILT_SUPER",
        name: "TILT SUPER 300EC",
        image: "./assets/products/ag_tilt_super.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Propiconazole 150g/L + Difenoconazole 150g/L EC",
        use: "ជម្រើស systemic/DMI សម្រាប់ផ្សិតមួយចំនួន។ កុំប្រើក្រុមថ្នាំដដែលៗជាប់គ្នា។",
      },
    ],
  },
};

const khmerLabels = {
  ALGAL_LEAF_SPOT: "អុចស្លឹកដោយសារាយ",
  ALLOCARIDARA_ATTACK: "សត្វល្អិតជញ្ជក់ស្លឹក",
  ANTHRACNOSE: "ជំងឺអាន់ត្រាក់ណូស",
  CANKER_DISEASE: "ជំងឺ Canker",
  FRUIT_ROT: "ផ្លែទុរេនរលួយ",
  HEALTHY_LEAF: "ស្លឹកមានសុខភាពល្អ",
  LEAF_BLIGHT: "រលាកស្លឹក",
  MEALYBUG_INFESTATION: "សត្វល្អិតម្សៅ",
  PHOMOPSIS_LEAF_SPOT: "ជំងឺអុចស្លឹកដោយសារផ្សិត",
  PINK_DISEASE: "ជំងឺផ្សិតពណ៌ផ្កាឈូក",
  PHYTOPHTHORA_ROOT_FOOT_ROT: "ជំងឺ Phytophthora រលួយគល់/ឫស",
  SOOTY_MOLD: "សត្វល្អិតម្សៅ/ផ្សិតខ្មៅ",
  STEM_BORER_DAMAGE: "ដង្កូវចោះដើម/មែក",
  FRUIT_BORER_DAMAGE: "ដង្កូវចោះផ្លែ/គ្រាប់",
  THRIPS_MITE_DAMAGE: "ត្រីប/ចៃក្រហម",
  RHIZOCTONIA_LEAF_BLIGHT: "រលាកស្លឹកផ្សិត",
  COLLETOTRICHUM_LEAF_SPOT: "ចំណុចស្លឹក Colletotrichum",
};

const diseaseSampleImages = {
  ALGAL_LEAF_SPOT: "./assets/disease_samples/algal_leaf_spot.jpg",
  ALLOCARIDARA_ATTACK: "./assets/disease_samples/allocaridara_attack.jpg",
  ANTHRACNOSE: "./assets/disease_samples/anthracnose.jpg",
  CANKER_DISEASE: "./assets/disease_samples/canker_disease.jpg",
  FRUIT_ROT: "./assets/disease_user/durian_fruit_rot_user.png",
  HEALTHY_LEAF: "./assets/disease_samples/healthy_leaf.jpg",
  LEAF_BLIGHT: "./assets/disease_samples/leaf_blight.jpg",
  MEALYBUG_INFESTATION: "./assets/disease_samples/mealybug_infestation.jpg",
  PHOMOPSIS_LEAF_SPOT: "./assets/disease_samples/phomopsis_leaf_spot.jpg",
  PINK_DISEASE: "./assets/disease_samples/pink_disease.jpg",
  PHYTOPHTHORA_ROOT_FOOT_ROT: "./assets/disease_guides_real/phytophthora_root_foot_rot.jpg",
  SOOTY_MOLD: "./assets/disease_guides_real/sooty_mold_mealybug_risk.jpg",
  STEM_BORER_DAMAGE: "./assets/disease_guides_real/stem_borer_damage.jpg",
  FRUIT_BORER_DAMAGE: "./assets/disease_guides_real/fruit_borer_damage.jpg",
  THRIPS_MITE_DAMAGE: "./assets/disease_guides_real/thrips_mite_damage.jpg",
  RHIZOCTONIA_LEAF_BLIGHT: "./assets/disease_guides_real/leaf_blight_fungal_reference.jpg",
  COLLETOTRICHUM_LEAF_SPOT: "./assets/disease_guides_real/colletotrichum_leaf_spot.jpg",
};

const diseaseExampleImages = {
  ALGAL_LEAF_SPOT: [
    "./assets/disease_examples/algal_leaf_spot/ALGAL_LEAF_SPOT_test_1.jpg",
    "./assets/disease_examples/algal_leaf_spot/ALGAL_LEAF_SPOT_test_2.jpg",
    "./assets/disease_examples/algal_leaf_spot/ALGAL_LEAF_SPOT_test_3.jpg",
  ],
  ALLOCARIDARA_ATTACK: [
    "./assets/disease_examples/allocaridara_attack/ALLOCARIDARA_ATTACK_test_1.jpg",
    "./assets/disease_examples/allocaridara_attack/ALLOCARIDARA_ATTACK_test_2.jpg",
    "./assets/disease_examples/allocaridara_attack/ALLOCARIDARA_ATTACK_test_3.jpg",
  ],
  ANTHRACNOSE: [
    "./assets/disease_examples/anthracnose/ANTHRACNOSE_test_1.jpg",
    "./assets/disease_examples/anthracnose/ANTHRACNOSE_test_2.jpg",
    "./assets/disease_examples/anthracnose/ANTHRACNOSE_test_3.jpg",
  ],
  CANKER_DISEASE: [
    "./assets/disease_examples/canker_disease/CANKER_DISEASE_test_1.jpg",
    "./assets/disease_examples/canker_disease/CANKER_DISEASE_test_2.jpg",
    "./assets/disease_examples/canker_disease/CANKER_DISEASE_test_3.jpg",
  ],
  FRUIT_ROT: [
    "./assets/disease_user/durian_fruit_rot_user.png",
    "./assets/disease_examples/fruit_rot/FRUIT_ROT_test_1.jpg",
    "./assets/disease_examples/fruit_rot/FRUIT_ROT_test_2.jpg",
  ],
  HEALTHY_LEAF: [
    "./assets/disease_examples/healthy_leaf/HEALTHY_LEAF_test_1.jpg",
    "./assets/disease_examples/healthy_leaf/HEALTHY_LEAF_test_2.jpg",
    "./assets/disease_examples/healthy_leaf/HEALTHY_LEAF_test_3.jpg",
  ],
  LEAF_BLIGHT: [
    "./assets/disease_examples/leaf_blight/LEAF_BLIGHT_test_1.jpg",
    "./assets/disease_examples/leaf_blight/LEAF_BLIGHT_test_2.jpg",
    "./assets/disease_examples/leaf_blight/LEAF_BLIGHT_test_3.jpg",
  ],
  MEALYBUG_INFESTATION: [
    "./assets/disease_examples/mealybug_infestation/MEALYBUG_INFESTATION_test_1.jpg",
    "./assets/disease_examples/mealybug_infestation/MEALYBUG_INFESTATION_test_2.jpg",
    "./assets/disease_examples/mealybug_infestation/MEALYBUG_INFESTATION_test_3.jpg",
  ],
  PHOMOPSIS_LEAF_SPOT: [
    "./assets/disease_examples/phomopsis_leaf_spot/PHOMOPSIS_LEAF_SPOT_test_1.jpg",
    "./assets/disease_examples/phomopsis_leaf_spot/PHOMOPSIS_LEAF_SPOT_test_2.jpg",
    "./assets/disease_examples/phomopsis_leaf_spot/PHOMOPSIS_LEAF_SPOT_test_3.jpg",
  ],
  PINK_DISEASE: [
    "./assets/disease_examples/pink_disease/PINK_DISEASE_test_1.jpg",
    "./assets/disease_examples/pink_disease/PINK_DISEASE_test_2.jpg",
    "./assets/disease_examples/pink_disease/PINK_DISEASE_test_3.jpg",
  ],
  PHYTOPHTHORA_ROOT_FOOT_ROT: [
    "./assets/disease_guides_real/phytophthora_root_foot_rot.jpg",
    "./assets/products/ag_folu.webp",
    "./assets/products/ag_perfect_72wp.webp",
  ],
  SOOTY_MOLD: [
    "./assets/disease_guides_real/sooty_mold_mealybug_risk.jpg",
    "./assets/products/ag_buta.webp",
    "./assets/products/ag_kon_neak6_front.webp",
  ],
  STEM_BORER_DAMAGE: [
    "./assets/disease_guides_real/stem_borer_damage.jpg",
    "./assets/products/ag_srakar_neak.webp",
    "./assets/disease_samples/canker_disease.jpg",
  ],
  FRUIT_BORER_DAMAGE: [
    "./assets/disease_guides_real/fruit_borer_damage.jpg",
    "./assets/products/ag_srakar_neak.webp",
    "./assets/disease_user/durian_fruit_rot_user.png",
  ],
  THRIPS_MITE_DAMAGE: [
    "./assets/disease_guides_real/thrips_mite_damage.jpg",
    "./assets/products/ut_insecticide.webp",
    "./assets/products/ag_buta.webp",
  ],
  RHIZOCTONIA_LEAF_BLIGHT: [
    "./assets/disease_guides_real/leaf_blight_fungal_reference.jpg",
    "./assets/products/ag_anumanco.webp",
  ],
  COLLETOTRICHUM_LEAF_SPOT: [
    "./assets/disease_guides_real/colletotrichum_leaf_spot.jpg",
    "./assets/products/ag_tilt_super.webp",
    "./assets/products/ag_anumanco.webp",
  ],
};

const guideImageCredits = {
  PHYTOPHTHORA_ROOT_FOOT_ROT: "រូបភាពយោងពី PDF មគ្គុទ្ទេសក៍សមាសភាពចង្រៃលើដំណាំទុរេន/អាវ៉ូកាដូ (MAFF eLibrary)",
  SOOTY_MOLD: "រូបភាពយោងពី PDF មគ្គុទ្ទេសក៍សមាសភាពចង្រៃលើដំណាំទុរេន/អាវ៉ូកាដូ (MAFF eLibrary)",
  STEM_BORER_DAMAGE: "រូបភាពយោងពី PDF មគ្គុទ្ទេសក៍សមាសភាពចង្រៃលើដំណាំទុរេន/អាវ៉ូកាដូ (MAFF eLibrary)",
  FRUIT_BORER_DAMAGE: "រូបភាពយោងពី PDF មគ្គុទ្ទេសក៍សមាសភាពចង្រៃលើដំណាំទុរេន/អាវ៉ូកាដូ (MAFF eLibrary)",
  THRIPS_MITE_DAMAGE: "រូបភាពយោងពី PDF មគ្គុទ្ទេសក៍សមាសភាពចង្រៃលើដំណាំទុរេន/អាវ៉ូកាដូ (MAFF eLibrary)",
  RHIZOCTONIA_LEAF_BLIGHT: "រូបភាពយោងពី dataset រូបស្លឹកទុរេនក្នុងគម្រោង Smart Chomka",
  COLLETOTRICHUM_LEAF_SPOT: "រូបភាពយោងពី PDF មគ្គុទ្ទេសក៍សមាសភាពចង្រៃលើដំណាំទុរេន/អាវ៉ូកាដូ (MAFF eLibrary)",
};

const diseaseTypes = {
  ALGAL_LEAF_SPOT: "ជំងឺសារាយលើស្លឹក",
  ALLOCARIDARA_ATTACK: "សត្វល្អិតជញ្ជក់ទឹកស្លឹក",
  ANTHRACNOSE: "មគ្គុទ្ទេសក៍បន្ថែម: ជំងឺផ្សិតលើស្លឹក/ផ្លែ",
  CANKER_DISEASE: "មគ្គុទ្ទេសក៍បន្ថែម: ជំងឺលើដើម/មែក",
  FRUIT_ROT: "មគ្គុទ្ទេសក៍បន្ថែម: ជំងឺលើផ្លែ",
  HEALTHY_LEAF: "ស្លឹកធម្មតា",
  LEAF_BLIGHT: "រោគសញ្ញារលាកស្លឹក",
  MEALYBUG_INFESTATION: "មគ្គុទ្ទេសក៍បន្ថែម: សត្វល្អិតជញ្ជក់ទឹករុក្ខជាតិ",
  PHOMOPSIS_LEAF_SPOT: "ជំងឺអុចស្លឹកដោយសារផ្សិត",
  PINK_DISEASE: "មគ្គុទ្ទេសក៍បន្ថែម: ជំងឺផ្សិតលើមែក/ដើម",
  PHYTOPHTHORA_ROOT_FOOT_ROT: "មគ្គុទ្ទេសក៍បន្ថែម: រោគឫស/គល់",
  SOOTY_MOLD: "មគ្គុទ្ទេសក៍បន្ថែម: ផ្សិតខ្មៅពីសត្វល្អិត",
  STEM_BORER_DAMAGE: "មគ្គុទ្ទេសក៍បន្ថែម: សត្វល្អិតចោះដើម",
  FRUIT_BORER_DAMAGE: "មគ្គុទ្ទេសក៍បន្ថែម: សត្វល្អិតចោះផ្លែ",
  THRIPS_MITE_DAMAGE: "មគ្គុទ្ទេសក៍បន្ថែម: សត្វល្អិតតូច/ចៃ",
  RHIZOCTONIA_LEAF_BLIGHT: "មគ្គុទ្ទេសក៍បន្ថែម: ជំងឺរលាកស្លឹក",
  COLLETOTRICHUM_LEAF_SPOT: "មគ្គុទ្ទេសក៍បន្ថែម: Anthracnose-like",
};

const guideOnlyDiseaseKeys = new Set([
  "ANTHRACNOSE",
  "CANKER_DISEASE",
  "FRUIT_ROT",
  "MEALYBUG_INFESTATION",
  "PINK_DISEASE",
  "PHYTOPHTHORA_ROOT_FOOT_ROT",
  "SOOTY_MOLD",
  "STEM_BORER_DAMAGE",
  "FRUIT_BORER_DAMAGE",
  "THRIPS_MITE_DAMAGE",
  "RHIZOCTONIA_LEAF_BLIGHT",
  "COLLETOTRICHUM_LEAF_SPOT",
]);

const scanHistoryKey = "smart-chomka-scan-history-v1";
const farmerAccountKey = "smart-chomka-farmer-account-v1";
const farmProfileKey = "smart-chomka-farm-profile-v1";
const farmerLogoutKey = "smart-chomka-farmer-logged-out-v1";
const farmCareKey = "smart-chomka-farm-care-v1";
const localAiSkillKey = "smart-chomka-local-ai-skills-v1";
const weatherLocationKey = "smart-chomka-weather-location-v1";
const weatherNotificationsKey = "smart-chomka-weather-notifications-v1";
const weatherNotificationStampKey = "smart-chomka-weather-notification-stamp-v1";
const weatherApiBaseUrl = "https://api.open-meteo.com/v1/forecast";
const weatherLocations = [
  { id: "kampot", name: "កំពត", note: "តំបន់ទុរេនសំខាន់", latitude: 10.6104, longitude: 104.1815 },
  { id: "kep", name: "កែប", note: "ជិតតំបន់កំពត", latitude: 10.4829, longitude: 104.3167 },
  { id: "kampong-cham", name: "កំពង់ចាម", note: "ចម្ការទុរេនក្បែរមេគង្គ", latitude: 12.0, longitude: 105.45 },
  { id: "tbong-khmum", name: "ត្បូងឃ្មុំ", note: "តំបន់ដំណាំចម្រុះ", latitude: 11.889, longitude: 105.876 },
  { id: "battambang", name: "បាត់ដំបង", note: "តំបន់ខាងលិច", latitude: 13.0957, longitude: 103.2022 },
  { id: "pailin", name: "ប៉ៃលិន", note: "តំបន់ជិតព្រំដែន", latitude: 12.8489, longitude: 102.6093 },
  { id: "kampong-thom", name: "កំពង់ធំ", note: "តំបន់កណ្តាល", latitude: 12.7111, longitude: 104.8887 },
  { id: "siem-reap", name: "សៀមរាប", note: "តំបន់ជើងបឹងទន្លេសាប", latitude: 13.3671, longitude: 103.8448 },
  { id: "kratie", name: "ក្រចេះ", note: "តំបន់មេគង្គ", latitude: 12.4881, longitude: 106.0188 },
  { id: "mondulkiri", name: "មណ្ឌលគិរី", note: "តំបន់ខ្ពង់រាប", latitude: 12.4558, longitude: 107.1881 },
  { id: "ratanakiri", name: "រតនគិរី", note: "តំបន់ខ្ពង់រាប", latitude: 13.7394, longitude: 106.9873 },
  { id: "koh-kong", name: "កោះកុង", note: "តំបន់សើមជិតសមុទ្រ", latitude: 11.6153, longitude: 102.9849 },
  { id: "pursat", name: "ពោធិ៍សាត់", note: "តំបន់ខាងលិច", latitude: 12.5388, longitude: 103.9192 },
  { id: "kampong-speu", name: "កំពង់ស្ពឺ", note: "តំបន់ជិតភ្នំ", latitude: 11.4533, longitude: 104.5209 },
  { id: "takeo", name: "តាកែវ", note: "តំបន់ខាងត្បូង", latitude: 10.9908, longitude: 104.785 },
  { id: "preah-sihanouk", name: "ព្រះសីហនុ", note: "តំបន់សើមជិតសមុទ្រ", latitude: 10.6275, longitude: 103.5221 },
  { id: "phnom-penh", name: "ភ្នំពេញ", note: "ទីតាំងសាកល្បង", latitude: 11.5564, longitude: 104.9282 },
];

const irrigationStateKey = "smart-chomka-irrigation-state-v1";
const irrigationProfiles = [
  {
    id: "standard-8v2p",
    name: "ចម្ការស្តង់ដារ - 8 Valve / 2 Pump",
    subtitle: "សម្រាប់ចម្ការទុរេនមធ្យម",
    zones: Array.from({ length: 8 }, (_, index) => ({
      id: `V${index + 1}`,
      name: `Zone ${index + 1}`,
      crop: index < 4 ? "ទុរេនធំ" : "ទុរេនខ្ចី",
    })),
    pumps: [
      { id: "P1", name: "Pump 1", role: "Main irrigation" },
      { id: "P2", name: "Pump 2", role: "High pressure" },
    ],
    tanks: ["T1"],
    defaultStatus: {
      tankLevel: 74,
      soilMoisture: 38,
      nodeBattery: 82,
      remainingSeconds: 522,
      activeZoneId: "V2",
      activeValves: ["V1", "V3", "V8"],
      activePumpId: "P2",
      totalSeconds: 1100,
    },
  },
  {
    id: "large-9v3p",
    name: "ចម្ការធំ - 9 Valve / 3 Pump",
    subtitle: "គាំទ្រ V9 និង Pump 3 សម្រាប់ client ដែលមានប្រព័ន្ធធំ",
    zones: Array.from({ length: 9 }, (_, index) => ({
      id: `V${index + 1}`,
      name: `Zone ${index + 1}`,
      crop: index === 8 ? "បន្ទប់បណ្តុះ" : "ទុរេន",
    })),
    pumps: [
      { id: "P1", name: "Pump 1", role: "Main line" },
      { id: "P2", name: "Pump 2", role: "Zone booster" },
      { id: "P3", name: "Pump 3", role: "Fertilizer/backup" },
    ],
    tanks: ["T1", "T2"],
    defaultStatus: {
      tankLevel: 63,
      soilMoisture: 31,
      nodeBattery: 77,
      remainingSeconds: 690,
      activeZoneId: "V9",
      activeValves: ["V2", "V5", "V9"],
      activePumpId: "P3",
      totalSeconds: 1400,
    },
  },
  {
    id: "small-4v1p",
    name: "ចម្ការតូច - 4 Valve / 1 Pump",
    subtitle: "សម្រាប់ demo ឬចម្ការតូច",
    zones: Array.from({ length: 4 }, (_, index) => ({
      id: `V${index + 1}`,
      name: `Zone ${index + 1}`,
      crop: "ទុរេន",
    })),
    pumps: [{ id: "P1", name: "Pump 1", role: "Main irrigation" }],
    tanks: ["T1"],
    defaultStatus: {
      tankLevel: 86,
      soilMoisture: 44,
      nodeBattery: 91,
      remainingSeconds: 360,
      activeZoneId: "V1",
      activeValves: ["V1"],
      activePumpId: "P1",
      totalSeconds: 900,
    },
  },
];

const naturalVoice = {
  lang: "km-KH",
  rate: 0.78,
  cloudPlaybackRate: 1.03,
  pitch: 1,
  volume: 1,
  pauseMs: 120,
  longPauseMs: 220,
};

const recommendations = {
  ALGAL_LEAF_SPOT: {
    title: "អុចស្លឹកដោយសារាយ",
    why: "ជំងឺនេះកើតងាយនៅចម្ការសើម ខ្យល់ចេញចូលតិច និងមានម្លប់ច្រើន។ វាធ្វើឲ្យផ្ទៃស្លឹកខូច និងបន្ថយការធ្វើរស្មីសំយោគ។",
    actions: [
      "កាត់ស្លឹកឆ្លងធ្ងន់ និងសម្អាតស្លឹកជ្រុះក្រោមដើម។",
      "កាត់មែកឲ្យខ្យល់ចេញចូល និងបន្ថយសំណើមក្នុងគុម្ព។",
      "ពិនិត្យច្រើនស្លឹក មុនសម្រេចចិត្តប្រើថ្នាំ។",
    ],
    medicines: [
      {
        key: "NO_COPPER",
        name: "NO COPPER",
        image: "./assets/products/no_copper_front.webp",
        maker: "Haktore Golden Harvest Co., Ltd - អានបានពីស្លាករូបថ្នាំ",
        active: "សារធាតុសកម្មមិនអានបានច្បាស់ពីរូប។ ផ្ទៀងផ្ទាត់ស្លាក/QR មុនប្រើ។",
        use: "ជម្រើស copper/contact protectant សម្រាប់ជួយការពារផ្ទៃស្លឹក តែត្រូវប្រើតាមស្លាកពិត។",
      },
    ],
  },
  ALLOCARIDARA_ATTACK: {
    title: "សត្វល្អិតជញ្ជក់ស្លឹក",
    why: "ALLOCARIDARA_ATTACK គឺសត្វល្អិត មិនមែនជាជំងឺផ្សិតទេ។ វាអាចបំផ្លាញស្លឹកខ្ចី ដោយជញ្ជក់ទឹកស្លឹក និងធ្វើឲ្យស្លឹកកោង ឬក្រហមត្នោត។",
    actions: [
      "ពិនិត្យខាងក្រោមស្លឹក និងត្រួយខ្ចី ដើម្បីរកសត្វល្អិត ឬសំណល់ជញ្ជក់។",
      "កុំបាញ់ថ្នាំបើមិនឃើញសត្វល្អិត ឬស្នាមវាយប្រហារច្បាស់។",
      "ជៀសវាងបាញ់ពេលដើមមានផ្កា ឬពេលមានឃ្មុំច្រើន។",
    ],
    medicines: [
      {
        key: "U_T_INSECTICIDE",
        name: "U-T",
        image: "./assets/products/ut_insecticide.webp",
        maker: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល U-T",
        active: "Dinotefuran 20% + Pymetrozine 50% WDG",
        use: "សម្រាប់សត្វល្អិតជញ្ជក់ទឹក។ ប្រើតែពេលមានសត្វល្អិតច្បាស់ និងតាមស្លាក។",
      },
      {
        key: "AG_KON_NEAK6",
        name: "KON NEAK6",
        image: "./assets/products/ag_kon_neak6_front.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Pymetrozine 200g/kg + Thiamethoxam 150g/kg WDG",
        use: "ជួយបញ្ឈប់ការចិញ្ចឹមរបស់សត្វល្អិតជញ្ជក់ទឹក។ ត្រូវប្តូរក្រុមថ្នាំដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
      },
      {
        key: "AG_SRAKAR_NEAK",
        name: "SRAKAR NEAK",
        image: "./assets/products/ag_srakar_neak.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Lambda cyhalothrin 40g/kg + Thiamethoxam 120g/kg WP",
        use: "មានសកម្មភាពលឿនលើសត្វល្អិតមួយចំនួន តែអាចប៉ះពាល់សត្វមានប្រយោជន៍។ ប្រើដោយប្រុងប្រយ័ត្ន។",
      },
    ],
  },
  HEALTHY_LEAF: {
    title: "ស្លឹកមានសុខភាពល្អ",
    why: "លទ្ធផលនេះជួយកសិករមិនប្រើថ្នាំដោយមិនចាំបាច់។ ការប្រើថ្នាំពេលមិនមានរោគសញ្ញាអាចបង្កថ្លៃចំណាយ និងប៉ះពាល់សុវត្ថិភាព។",
    actions: [
      "បន្តតាមដានស្លឹកខ្ចី និងស្លឹកចាស់រៀងរាល់សប្តាហ៍។",
      "រក្សាខ្យល់ចេញចូល កុំឲ្យសំណើមកកកុញក្នុងគុម្ព។",
      "មិនចាំបាច់ប្រើថ្នាំ ប្រសិនបើមិនឃើញរោគសញ្ញាផ្សេង។",
    ],
    medicines: [],
  },
  LEAF_BLIGHT: {
    title: "រលាកស្លឹក",
    why: "រលាកស្លឹកធ្វើឲ្យផ្ទៃស្លឹកខូច និងបន្ថយសមត្ថភាពចិញ្ចឹមផ្លែ។ នៅពេលសំណើមខ្ពស់ វាអាចរាលដាលទៅស្លឹកជិតខាង។",
    actions: [
      "ដកស្លឹកឆ្លងធ្ងន់ និងកុំទុកស្លឹកជ្រុះនៅក្រោមដើម។",
      "កាត់មែកបិទជិត និងកែលម្អការបង្ហូរទឹក។",
      "ថតរូបស្លឹកច្រើនមុំ ប្រសិនបើលទ្ធផលជឿជាក់ទាប។",
    ],
    medicines: [
      {
        key: "NO_COPPER",
        name: "NO COPPER",
        image: "./assets/products/no_copper_front.webp",
        maker: "Haktore Golden Harvest Co., Ltd - អានបានពីស្លាករូបថ្នាំ",
        active: "សារធាតុសកម្មមិនអានបានច្បាស់ពីរូប។ ផ្ទៀងផ្ទាត់ស្លាក/QR មុនប្រើ។",
        use: "ជម្រើសការពារផ្ទៃស្លឹក។ ស្លឹកខូចខ្លាំងមិនអាចត្រឡប់ល្អវិញដោយថ្នាំបានទេ។",
      },
      {
        key: "AG_PERFECT_72WP",
        name: "PERFECT 72%WP",
        image: "./assets/products/ag_perfect_72wp.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Metalaxyl 80g/kg + Mancozeb 640g/kg WP",
        use: "ពិចារណាពេលសង្ស័យ Phytophthora/oomycete។ ត្រូវប្រើតែបើស្លាកអនុញ្ញាតសម្រាប់ទុរេន។",
      },
      {
        key: "AG_REVUS_OPTI",
        name: "REVUS OPTI 440SC",
        image: "./assets/products/ag_revus_opti.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mandipropamid 40g/l + Chlorothalonil 400g/l SC",
        use: "ជម្រើសសម្រាប់សំណើមខ្ពស់ និងរោគសញ្ញា oomycete។ កុំលាយជាមួយថ្នាំផ្សេង បើស្លាកមិនណែនាំ។",
      },
    ],
  },
  PHOMOPSIS_LEAF_SPOT: {
    title: "ជំងឺអុចស្លឹកដោយសារផ្សិត",
    why: "Phomopsis ជាជំងឺចំណុចស្លឹកដែលអាចរាលដាលលឿននៅស្ថានភាពសើម។ វាបង្កស្នាមអុច និងធ្វើឲ្យស្លឹកខូចបន្តិចម្តងៗ។",
    actions: [
      "ដកស្លឹកដែលមានចំណុចឆ្លងច្រើន និងដាក់ឲ្យឆ្ងាយពីចម្ការ។",
      "កាត់បន្ថយសំណើមក្នុងគុម្ព និងកុំស្រោចទឹកលើស្លឹកពេលល្ងាច។",
      "ប្រើថ្នាំតែបន្ទាប់ពីផ្ទៀងផ្ទាត់ស្លាក និងរោគសញ្ញា។",
    ],
    medicines: [
      {
        key: "AG_ANUMANCO_80WP",
        name: "ANUMANCO 80%WP",
        image: "./assets/products/ag_anumanco.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mancozeb 800g/kg WP",
        use: "contact protectant សម្រាប់ជំងឺផ្សិតមួយចំនួន។ ប្រើជាមួយការដកស្លឹកឆ្លង និងបើកខ្យល់។",
      },
    ],
  },
  ANTHRACNOSE: {
    title: "ជំងឺអាន់ត្រាក់ណូស",
    why: "Anthracnose ជាជំងឺផ្សិតដែលកើតខ្លាំងនៅអាកាសធាតុសើម និងអាចប៉ះពាល់ស្លឹក ផ្កា ឬផ្លែ។ ស្នាមខ្មៅអាចធ្វើឲ្យផ្លែខូច និងបាត់តម្លៃលក់។",
    actions: [
      "កាត់ផ្នែកឆ្លង ឬប្រមូលផ្លែខូចចេញពីចម្ការ។",
      "បើកមែកឲ្យខ្យល់ចេញចូល និងកុំឲ្យសំណើមកកនៅក្នុងគុម្ព។",
      "ប្រើថ្នាំផ្សិតតែបើរោគសញ្ញាច្បាស់ ហើយត្រូវអានស្លាក/QR ជាមុន។",
    ],
    medicines: [
      {
        key: "AG_ANUMANCO_80WP",
        name: "ANUMANCO 80%WP",
        image: "./assets/products/ag_anumanco.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mancozeb 800g/kg WP",
        use: "contact protectant សម្រាប់ជំងឺផ្សិតមួយចំនួន។ គួរប្រើជាមួយការកាត់ផ្នែកឆ្លង និងបន្ថយសំណើម។",
      },
      {
        key: "AG_TILT_SUPER",
        name: "TILT SUPER 300EC",
        image: "./assets/products/ag_tilt_super.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Propiconazole + Difenoconazole - ត្រូវផ្ទៀងផ្ទាត់លើស្លាកពិត",
        use: "ជម្រើសប្រព័ន្ធសម្រាប់ជំងឺផ្សិតមួយចំនួន។ កុំប្រើជាប់ៗគ្នាដោយក្រុមថ្នាំដដែល។",
      },
    ],
  },
  CANKER_DISEASE: {
    title: "ជំងឺ Canker",
    why: "Canker អាចធ្វើឲ្យមែក ឬដើមមានស្នាមរបួស ជ័រហូរ និងបាត់កម្លាំង។ ប្រសិនបើទុកយូរ វាអាចប៉ះពាល់ដល់ផ្នែកធំៗរបស់ដើម។",
    actions: [
      "កុំឲ្យទឹកជាំជុំវិញគល់ និងកែលម្អការបង្ហូរទឹក។",
      "កាត់ ឬសម្អាតផ្នែកឆ្លងដោយឧបករណ៍ស្អាត ហើយសម្លាប់មេរោគឧបករណ៍បន្ទាប់ពីប្រើ។",
      "បើស្នាមធំ ឬជ័រហូរច្រើន សូមសួរអ្នកជំនាញមុនប្រើថ្នាំ។",
    ],
    medicines: [
      {
        key: "AG_PERFECT_72WP",
        name: "PERFECT 72%WP",
        image: "./assets/products/ag_perfect_72wp.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Metalaxyl 80g/kg + Mancozeb 640g/kg WP",
        use: "ពិចារណាពេលសង្ស័យរោគក្រុម Phytophthora/oomycete ជាមួយស្នាមជ័រ ឬរលួយគល់។ ត្រូវផ្ទៀងផ្ទាត់ស្លាកសម្រាប់ទុរេន។",
      },
    ],
  },
  FRUIT_ROT: {
    title: "ផ្លែទុរេនរលួយ",
    why: "Fruit rot ធ្វើឲ្យខាតទិន្នផល និងប៉ះពាល់ការលក់។ ផ្លែឆ្លងដែលជ្រុះអាចជាប្រភពរោគសម្រាប់ផ្លែ និងដើមជិតខាង។",
    actions: [
      "ប្រមូលផ្លែរលួយ និងកាកសំណល់ឆ្លងចេញពីចម្ការ។",
      "កុំឲ្យផ្លែប៉ះដីសើម និងបន្ថយសំណើមជុំវិញគល់។",
      "ពិនិត្យផ្លែជិតខាង និងថតរូបបន្ថែម ប្រសិនបើ AI មិនប្រាកដ។",
    ],
    medicines: [
      {
        key: "AG_REVUS_OPTI",
        name: "REVUS OPTI 440SC",
        image: "./assets/products/ag_revus_opti.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mandipropamid 40g/l + Chlorothalonil 400g/l SC",
        use: "ពិចារណាពេលសង្ស័យរោគក្រុម oomycete នៅសំណើមខ្ពស់។ ត្រូវគោរព PHI និងស្លាក។",
      },
      {
        key: "AG_PERFECT_72WP",
        name: "PERFECT 72%WP",
        image: "./assets/products/ag_perfect_72wp.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Metalaxyl 80g/kg + Mancozeb 640g/kg WP",
        use: "ជម្រើសសម្រាប់រោគសំណើមខ្ពស់មួយចំនួន។ ប្រើតែបើស្លាកអនុញ្ញាតសម្រាប់ទុរេន។",
      },
      {
        key: "AG_ANUMANCO_80WP",
        name: "ANUMANCO 80%WP",
        image: "./assets/products/ag_anumanco.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mancozeb 800g/kg WP",
        use: "ជួយការពារផ្ទៃផ្លែ/ស្លឹក មិនអាចព្យាបាលផ្លែរលួយធ្ងន់ឲ្យល្អវិញបានទេ។",
      },
    ],
  },
  MEALYBUG_INFESTATION: {
    title: "សត្វល្អិតម្សៅ",
    why: "Mealybug ជាសត្វល្អិតជញ្ជក់ទឹករុក្ខជាតិ។ វាអាចធ្វើឲ្យស្លឹក ឬផ្លែខ្សោយ មានទឹកផ្អែម និងបង្កផ្សិតខ្មៅ។",
    actions: [
      "ពិនិត្យក្រោមស្លឹក មែកខ្ចី និងកន្លែងភ្ជាប់ផ្លែ។",
      "កាត់បន្ថយស្រមោច ព្រោះស្រមោចអាចជួយការពារ និងផ្លាស់ទី mealybug។",
      "ប្រើថ្នាំសត្វល្អិតតែពេលឃើញសត្វច្បាស់ និងជៀសវាងបាញ់ពេលមានផ្កា។",
    ],
    medicines: [
      {
        key: "U_T_INSECTICIDE",
        name: "U-T",
        image: "./assets/products/ut_insecticide.webp",
        maker: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល U-T",
        active: "Dinotefuran 20% + Pymetrozine 50% WDG",
        use: "សម្រាប់សត្វល្អិតជញ្ជក់ទឹក។ ប្រើតែពេលមានសត្វល្អិតច្បាស់ និងតាមស្លាក។",
      },
      {
        key: "AG_KON_NEAK6",
        name: "KON NEAK6",
        image: "./assets/products/ag_kon_neak6_front.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Pymetrozine 200g/kg + Thiamethoxam 150g/kg WDG",
        use: "ជួយបញ្ឈប់ការចិញ្ចឹមរបស់សត្វល្អិតជញ្ជក់ទឹក។ ត្រូវប្តូរក្រុមថ្នាំ ដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
      },
      {
        key: "AG_SRAKAR_NEAK",
        name: "SRAKAR NEAK",
        image: "./assets/products/ag_srakar_neak.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Lambda cyhalothrin 40g/kg + Thiamethoxam 120g/kg WP",
        use: "មានសកម្មភាពលឿន តែអាចប៉ះពាល់សត្វមានប្រយោជន៍។ ប្រើដោយប្រុងប្រយ័ត្ន។",
      },
    ],
  },
  PINK_DISEASE: {
    title: "ជំងឺផ្សិតពណ៌ផ្កាឈូក",
    why: "Pink disease ជាជំងឺផ្សិតលើមែក ឬដើមដែលកើតងាយនៅចម្ការសើម និងដើមក្រាស់។ វាអាចធ្វើឲ្យមែកងាប់ពីខាងក្រៅចូលក្នុង។",
    actions: [
      "កាត់មែកឆ្លងឲ្យលើសពីស្នាមឆ្លង ហើយយកចេញពីចម្ការ។",
      "សម្អាតឧបករណ៍កាត់មុនទៅដើមផ្សេង ដើម្បីកុំឲ្យរាលដាល។",
      "បើកគុម្ពឲ្យខ្យល់ចេញចូល និងបន្ថយសំណើមជាប្រចាំ។",
    ],
    medicines: [
      {
        key: "AG_ANUMANCO_80WP",
        name: "ANUMANCO 80%WP",
        image: "./assets/products/ag_anumanco.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Mancozeb 800g/kg WP",
        use: "contact protectant សម្រាប់ជំងឺផ្សិតមួយចំនួន។ ប្រើជាមួយការកាត់មែកឆ្លង និងបើកខ្យល់ក្នុងគុម្ព។",
      },
      {
        key: "AG_TILT_SUPER",
        name: "TILT SUPER 300EC",
        image: "./assets/products/ag_tilt_super.webp",
        maker: "ប្រភពរូបភាព/ព័ត៌មាន: Angkor Green",
        active: "Propiconazole + Difenoconazole - ត្រូវផ្ទៀងផ្ទាត់លើស្លាកពិត",
        use: "ជម្រើសប្រព័ន្ធសម្រាប់ជំងឺផ្សិតមួយចំនួន។ ត្រូវប្តូរក្រុមថ្នាំតាមស្លាក។",
      },
    ],
  },
};

let session;
let metadata;
let selectedFile;
let lastVoiceText = "";
let lastChatVoiceText = "";
let lastLiveTalkAnswer = "";
let lastLiveTalkQuestion = "";
let lastOnlineAdvisorProducts = [];
let liveTalkConversationHistory = [];
let liveTalkRecognizer = null;
let liveTalkListening = false;
let nativeSpeechSessionId = 0;
let nativeSpeechQuietTimer = null;
let nativeSpeechPartialHandle = null;
let nativeSpeechStateHandle = null;
let nativeSpeechCollectedText = "";
let nativeSpeechRestartCount = 0;
let nativeSpeechActivePlugin = null;
let liveTalkHoldMode = false;
let liveTalkPressActive = false;
let liveTalkSuppressNextClick = false;
let liveTalkReleaseHandler = null;
let realtimePeerConnection = null;
let realtimeDataChannel = null;
let realtimeMicrophoneStream = null;
let realtimeAudioElement = null;
let realtimeConnected = false;
let lastPredictionContext = null;
let irrigationState = readIrrigationState();
let irrigationTimer = null;
window.durianGuardReady = false;
window.durianGuardError = "";

const cameraInput = document.querySelector("#cameraInput");
const fileInput = document.querySelector("#fileInput");
const previewCard = document.querySelector("#previewCard");
const previewImage = document.querySelector("#previewImage");
const predictButton = document.querySelector("#predictButton");
const scanPanel = document.querySelector("#scanPanel");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const resultConfidence = document.querySelector("#resultConfidence");
const probabilityList = document.querySelector("#probabilityList");
const recommendationBox = document.querySelector("#recommendationBox");
const medicineSection = document.querySelector("#medicineSection");
const modeStatusPill = document.querySelector("#modeStatusPill");
const connectionStatus = document.querySelector("#connectionStatus");
const weatherForm = document.querySelector("#weatherForm");
const weatherLocationSelect = document.querySelector("#weatherLocationSelect");
const fetchWeatherButton = document.querySelector("#fetchWeatherButton");
const weatherNotifyButton = document.querySelector("#weatherNotifyButton");
const weatherNotifyLabel = document.querySelector("#weatherNotifyLabel");
const weatherMetrics = document.querySelector("#weatherMetrics");
const weatherTemperature = document.querySelector("#weatherTemperature");
const weatherRain = document.querySelector("#weatherRain");
const weatherHumidity = document.querySelector("#weatherHumidity");
const weatherRiskLevel = document.querySelector("#weatherRiskLevel");
const weatherStatus = document.querySelector("#weatherStatus");
const irrigationPanel = document.querySelector("#irrigationPanel");
const irrigationConnectionBadge = document.querySelector("#irrigationConnectionBadge");
const irrigationProfileSelect = document.querySelector("#irrigationProfileSelect");
const irrigationCommandStatus = document.querySelector("#irrigationCommandStatus");
const irrigationRunTimer = document.querySelector("#irrigationRunTimer");
const irrigationActiveZone = document.querySelector("#irrigationActiveZone");
const irrigationProgressBar = document.querySelector("#irrigationProgressBar");
const irrigationSubtitle = document.querySelector("#irrigationSubtitle");
const irrigationTankLevel = document.querySelector("#irrigationTankLevel");
const irrigationSoilMoisture = document.querySelector("#irrigationSoilMoisture");
const irrigationNodeBattery = document.querySelector("#irrigationNodeBattery");
const irrigationAutoButton = document.querySelector("#irrigationAutoButton");
const irrigationStopButton = document.querySelector("#irrigationStopButton");
const irrigationAlertCount = document.querySelector("#irrigationAlertCount");
const irrigationAlertList = document.querySelector("#irrigationAlertList");
const irrigationZoneGrid = document.querySelector("#irrigationZoneGrid");
const irrigationPumpGrid = document.querySelector("#irrigationPumpGrid");
const irrigationConfigSummary = document.querySelector("#irrigationConfigSummary");
const aiWeatherLocation = document.querySelector("#aiWeatherLocation");
const aiWeatherTemperature = document.querySelector("#aiWeatherTemperature");
const aiWeatherHumidity = document.querySelector("#aiWeatherHumidity");
const aiWeatherRain = document.querySelector("#aiWeatherRain");
const aiWeatherRisk = document.querySelector("#aiWeatherRisk");
const aiWeatherAlert = document.querySelector("#aiWeatherAlert");
const historyList = document.querySelector("#historyList");
const aiRecentReports = document.querySelector("#aiRecentReports");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const diseaseSampleGrid = document.querySelector("#diseaseSampleGrid");
const diseaseDetailPanel = document.querySelector("#diseaseDetailPanel");
const loginForm = document.querySelector("#loginForm");
const loginNameInput = document.querySelector("#loginNameInput");
const loginPhoneInput = document.querySelector("#loginPhoneInput");
const loginNote = document.querySelector("#loginNote");
const accountPanel = document.querySelector("#accountPanel");
const accountForm = document.querySelector("#accountForm");
const accountSaveAlert = document.querySelector("#accountSaveAlert");
const accountStatusBadge = document.querySelector("#accountStatusBadge");
const accountSummary = document.querySelector("#accountSummary");
const farmerNameInput = document.querySelector("#farmerNameInput");
const farmerPhoneInput = document.querySelector("#farmerPhoneInput");
const accountScanCount = document.querySelector("#accountScanCount");
const accountReportCount = document.querySelector("#accountReportCount");
const accountLastResult = document.querySelector("#accountLastResult");
const accountLastResultDate = document.querySelector("#accountLastResultDate");
const accountLastInspectTime = document.querySelector("#accountLastInspectTime");
const accountLastInspectDate = document.querySelector("#accountLastInspectDate");
const farmInfoName = document.querySelector("#farmInfoName");
const farmInfoLocation = document.querySelector("#farmInfoLocation");
const farmInfoCrop = document.querySelector("#farmInfoCrop");
const farmInfoVariety = document.querySelector("#farmInfoVariety");
const farmInfoTrees = document.querySelector("#farmInfoTrees");
const farmInfoArea = document.querySelector("#farmInfoArea");
const farmInfoAge = document.querySelector("#farmInfoAge");
const farmInfoIrrigation = document.querySelector("#farmInfoIrrigation");
const farmProfileCard = document.querySelector("#farmProfileCard");
const farmProfileForm = document.querySelector("#farmProfileForm");
const farmProfileNameInput = document.querySelector("#farmProfileNameInput");
const farmProfileLocationInput = document.querySelector("#farmProfileLocationInput");
const farmProfileCropInput = document.querySelector("#farmProfileCropInput");
const farmProfileVarietyInput = document.querySelector("#farmProfileVarietyInput");
const farmProfileTreesInput = document.querySelector("#farmProfileTreesInput");
const farmProfileAreaInput = document.querySelector("#farmProfileAreaInput");
const farmProfileAgeInput = document.querySelector("#farmProfileAgeInput");
const farmProfileIrrigationInput = document.querySelector("#farmProfileIrrigationInput");
const onlineAdvisorPanel = document.querySelector("#onlineAdvisorPanel");
const onlineAdvisorBadge = document.querySelector("#onlineAdvisorBadge");
const onlineAdvisorStatus = document.querySelector("#onlineAdvisorStatus");
const onlineAdvisorServerForm = document.querySelector("#onlineAdvisorServerForm");
const onlineAdvisorUrlInput = document.querySelector("#onlineAdvisorUrlInput");
const onlineAdvisorUrlHint = document.querySelector("#onlineAdvisorUrlHint");
const testOnlineAdvisorButton = document.querySelector("#testOnlineAdvisorButton");
const resetOnlineAdvisorButton = document.querySelector("#resetOnlineAdvisorButton");
const startLiveTalkButton = document.querySelector("#startLiveTalkButton");
const stopLiveTalkButton = document.querySelector("#stopLiveTalkButton");
const repeatLiveTalkButton = document.querySelector("#repeatLiveTalkButton");
const liveTalkPromptGrid = document.querySelector("#liveTalkPromptGrid");
const aiGuideGrid = document.querySelector("#aiGuideGrid");
const liveTalkTextForm = document.querySelector("#liveTalkTextForm");
const liveTalkTextInput = document.querySelector("#liveTalkTextInput");
const liveTalkTranscript = document.querySelector("#liveTalkTranscript");
const localSkillForm = document.querySelector("#localSkillForm");
const localSkillQuestionInput = document.querySelector("#localSkillQuestionInput");
const localSkillAnswerInput = document.querySelector("#localSkillAnswerInput");
const localSkillStatus = document.querySelector("#localSkillStatus");
const localSkillList = document.querySelector("#localSkillList");
const farmCareForm = document.querySelector("#farmCareForm");
const farmCareStatus = document.querySelector("#farmCareStatus");
const farmCareSummary = document.querySelector("#farmCareSummary");
const waterStatusInput = document.querySelector("#waterStatusInput");
const lastSprayInput = document.querySelector("#lastSprayInput");
const nextCheckInput = document.querySelector("#nextCheckInput");
const cropStageInput = document.querySelector("#cropStageInput");
const farmNoteInput = document.querySelector("#farmNoteInput");
const exportDataButton = document.querySelector("#exportDataButton");
const clearAccountHistoryButton = document.querySelector("#clearAccountHistoryButton");
const resetAccountButton = document.querySelector("#resetAccountButton");
const logoutAccountButtons = document.querySelectorAll("[data-account-logout]");
const pageViews = document.querySelectorAll("[data-page-view]");
const pageTargets = document.querySelectorAll("[data-page-target]");
const pageNames = new Set(["home", "knowledge", "history", "ai", "market", "account"]);

setup();

async function setup() {
  registerServiceWorker();
  updateOnlineStatus();
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  cameraInput.addEventListener("change", handleFileSelect);
  fileInput.addEventListener("change", handleFileSelect);
  predictButton.addEventListener("click", runPrediction);
  weatherForm?.addEventListener("submit", handleWeatherForecastSubmit);
  weatherLocationSelect?.addEventListener("change", handleWeatherLocationChange);
  weatherNotifyButton?.addEventListener("click", toggleWeatherNotifications);
  irrigationProfileSelect?.addEventListener("change", handleIrrigationProfileChange);
  irrigationAutoButton?.addEventListener("click", startIrrigationAutoMode);
  irrigationStopButton?.addEventListener("click", stopAllIrrigation);
  irrigationZoneGrid?.addEventListener("click", handleIrrigationZoneClick);
  irrigationPumpGrid?.addEventListener("click", handleIrrigationPumpClick);
  medicineSection.addEventListener("click", handleMedicineSectionClick);
  document.addEventListener("click", handleReferenceClick);
  document.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("popstate", () => showPage(getPageFromHash(), { updateHash: false }));
  pageTargets.forEach((target) => target.addEventListener("click", handlePageTargetClick));
  diseaseSampleGrid?.addEventListener("click", handleDiseaseSampleClick);
  diseaseDetailPanel?.addEventListener("click", handleDiseaseDetailClick);
  historyList?.addEventListener("click", handleHistoryItemClick);
  aiRecentReports?.addEventListener("click", handleHistoryItemClick);
  clearHistoryButton?.addEventListener("click", clearScanHistory);
  loginForm?.addEventListener("submit", saveLoginAccount);
  accountForm?.addEventListener("submit", saveFarmerAccount);
  accountPanel?.addEventListener("click", handleAccountPanelClick);
  farmProfileForm?.addEventListener("submit", saveFarmProfile);
  farmCareForm?.addEventListener("submit", saveFarmCare);
  farmCareSummary?.addEventListener("click", handleFarmCareDelete);
  bindLiveTalkButton();
  stopLiveTalkButton?.addEventListener("click", stopLiveTalk);
  repeatLiveTalkButton?.addEventListener("click", repeatLiveTalkAnswer);
  liveTalkPromptGrid?.addEventListener("click", handleLiveTalkPromptClick);
  aiGuideGrid?.addEventListener("click", handleLiveTalkPromptClick);
  liveTalkTextForm?.addEventListener("submit", handleLiveTalkTextSubmit);
  localSkillForm?.addEventListener("submit", saveLocalAiSkill);
  localSkillList?.addEventListener("click", handleLocalSkillListClick);
  onlineAdvisorServerForm?.addEventListener("submit", saveOnlineAdvisorUrl);
  testOnlineAdvisorButton?.addEventListener("click", testOnlineAdvisorConnection);
  resetOnlineAdvisorButton?.addEventListener("click", resetOnlineAdvisorUrl);
  exportDataButton?.addEventListener("click", exportFarmerData);
  clearAccountHistoryButton?.addEventListener("click", clearScanHistory);
  resetAccountButton?.addEventListener("click", resetFarmerAccount);
  logoutAccountButtons.forEach((button) => button.addEventListener("click", logoutFarmerAccount));
  showPage(getPageFromHash(), { updateHash: false, scroll: false });
  renderScanHistory();
  populateWeatherLocations();
  populateIrrigationProfiles();
  renderIrrigationDashboard();
  startIrrigationTimer();
  loadWeatherPreferences();
  loadFarmerAccount();
  loadFarmProfile();
  loadFarmCare();
  loadOnlineAdvisorSettings();
  renderLocalAiSkills();
  updateAccountDashboard();

  await loadModel();
}

async function loadModel() {
  try {
    updateOnlineStatus();
    metadata = await fetchJson(METADATA_URL);
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    session = await createOnnxSession(MODEL_URL);
    window.durianGuardReady = true;
    predictButton.disabled = !selectedFile;
    updateOnlineStatus();
  } catch (error) {
    console.error(error);
    window.durianGuardError = String(error?.message || error);
    updateOnlineStatus();
    updateAccountDashboard();
  }
}

function createOnnxSession(url) {
  return ort.InferenceSession.create(url, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Cannot load ${url}`);
  }
  return response.json();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn("Service worker registration failed", error);
  });
}

function updateOnlineStatus(customMessage) {
  const isOnline = navigator.onLine;
  document.body.dataset.network = isOnline ? "online" : "offline";
  modeStatusPill?.classList.toggle("is-online", isOnline);
  modeStatusPill?.classList.toggle("is-offline", !isOnline);

  if (connectionStatus) {
    connectionStatus.textContent = customMessage || (isOnline
      ? "Online"
      : "Offline");
  }

  updateOnlineAdvisorMode(isOnline);
  updateIrrigationConnectionStatus();
  updateAccountDashboard();
}

function populateIrrigationProfiles() {
  if (!irrigationProfileSelect) {
    return;
  }

  irrigationProfileSelect.innerHTML = irrigationProfiles
    .map((profile) => `<option value="${profile.id}">${profile.name}</option>`)
    .join("");
  irrigationProfileSelect.value = getActiveIrrigationProfile().id;
}

function readIrrigationState() {
  const fallback = makeDefaultIrrigationState(irrigationProfiles[0]);
  try {
    const saved = JSON.parse(localStorage.getItem(irrigationStateKey) || "{}");
    const profile = irrigationProfiles.find((item) => item.id === saved.profileId) || irrigationProfiles[0];
    const defaultState = makeDefaultIrrigationState(profile);
    return {
      ...defaultState,
      ...saved,
      activeValves: Array.isArray(saved.activeValves)
        ? saved.activeValves.filter((id) => profile.zones.some((zone) => zone.id === id))
        : defaultState.activeValves,
      alerts: Array.isArray(saved.alerts) ? saved.alerts.slice(0, 5) : defaultState.alerts,
    };
  } catch {
    return fallback;
  }
}

function makeDefaultIrrigationState(profile) {
  return {
    profileId: profile.id,
    mode: "auto",
    connected: navigator.onLine,
    lastCommand: "Ready",
    alerts: [
      { type: "warning", title: "T3 សំណើម 19%", detail: "5 នាទីមុន • សូមពិនិត្យសំណើមដី" },
      { type: "info", title: "ធុង T1 ទឹក 74%", detail: "ត្រៀមបំពេញទឹកបើកម្រិតធ្លាក់ចុះ" },
    ],
    ...profile.defaultStatus,
  };
}

function getActiveIrrigationProfile() {
  return irrigationProfiles.find((profile) => profile.id === irrigationState.profileId) || irrigationProfiles[0];
}

function saveIrrigationState() {
  try {
    localStorage.setItem(irrigationStateKey, JSON.stringify(irrigationState));
  } catch {
    // Local storage is optional; the dashboard still works in memory.
  }
}

function updateIrrigationConnectionStatus() {
  if (!irrigationConnectionBadge) {
    return;
  }

  const isOnline = navigator.onLine;
  irrigationState.connected = isOnline;
  irrigationConnectionBadge.classList.toggle("is-offline", !isOnline);
  irrigationConnectionBadge.innerHTML = `
    <span class="mode-dot" aria-hidden="true"></span>
    <strong>${isOnline ? "Online" : "Offline"}</strong>
  `;
}

function renderIrrigationDashboard() {
  if (!irrigationPanel) {
    return;
  }

  const profile = getActiveIrrigationProfile();
  const activeZone = profile.zones.find((zone) => zone.id === irrigationState.activeZoneId) || profile.zones[0];
  const activePump = profile.pumps.find((pump) => pump.id === irrigationState.activePumpId) || profile.pumps[0];
  const remaining = Math.max(0, Number(irrigationState.remainingSeconds) || 0);
  const total = Math.max(remaining, Number(irrigationState.totalSeconds) || 1);
  const progress = Math.max(4, Math.min(100, ((total - remaining) / total) * 100));

  if (irrigationProfileSelect) {
    irrigationProfileSelect.value = profile.id;
  }
  if (irrigationCommandStatus) {
    irrigationCommandStatus.textContent = irrigationState.lastCommand || "Ready";
  }
  if (irrigationRunTimer) {
    irrigationRunTimer.textContent = formatIrrigationTime(remaining);
  }
  if (irrigationActiveZone) {
    irrigationActiveZone.textContent = activeZone?.name || "No zone";
  }
  if (irrigationProgressBar) {
    irrigationProgressBar.style.width = `${progress}%`;
  }
  if (irrigationSubtitle) {
    const valveText = irrigationState.activeValves.length
      ? irrigationState.activeValves.map((id) => id.replace("V", "")).join(",")
      : "គ្មាន";
    irrigationSubtitle.textContent = irrigationState.mode === "stopped"
      ? "ប្រព័ន្ធបានបញ្ឈប់ • Pump និង Valve ទាំងអស់បិទ"
      : `នៅសល់ ${Math.ceil(remaining / 60)} នាទី • ${activePump?.name || "Pump"} បើក • Valve ${valveText} បើក`;
  }
  if (irrigationTankLevel) {
    irrigationTankLevel.textContent = `${irrigationState.tankLevel}%`;
  }
  if (irrigationSoilMoisture) {
    irrigationSoilMoisture.textContent = `${irrigationState.soilMoisture}%`;
  }
  if (irrigationNodeBattery) {
    irrigationNodeBattery.textContent = `${irrigationState.nodeBattery}%`;
  }
  if (irrigationAutoButton) {
    const label = irrigationAutoButton.querySelector("span");
    if (label) {
      label.textContent = irrigationState.mode === "auto" ? "Auto កំពុងដំណើរការ" : "ចាប់ផ្តើម Auto";
    }
  }
  if (irrigationAlertCount) {
    irrigationAlertCount.textContent = `${irrigationState.alerts.length} alerts`;
  }
  if (irrigationConfigSummary) {
    irrigationConfigSummary.textContent =
      `${profile.subtitle} • ${profile.zones.length} valves • ${profile.pumps.length} pumps • ${profile.tanks.length} tank(s). Profile នេះអាចផ្លាស់ប្តូរតាម client ដូចជា V9 ឬ Pump 3។`;
  }

  renderIrrigationZones(profile);
  renderIrrigationPumps(profile);
  renderIrrigationAlerts();
  updateIrrigationConnectionStatus();
}

function renderIrrigationZones(profile) {
  if (!irrigationZoneGrid) {
    return;
  }

  irrigationZoneGrid.innerHTML = profile.zones
    .map((zone) => {
      const isOn = irrigationState.activeValves.includes(zone.id);
      return `
        <button class="zone-button ${isOn ? "is-on" : ""}" type="button" data-zone-id="${zone.id}" aria-pressed="${isOn}">
          <span>${zone.id}</span>
          <small>${isOn ? "ON" : "OFF"} • ${zone.crop}</small>
        </button>
      `;
    })
    .join("");
}

function renderIrrigationPumps(profile) {
  if (!irrigationPumpGrid) {
    return;
  }

  irrigationPumpGrid.innerHTML = profile.pumps
    .map((pump) => {
      const isOn = irrigationState.activePumpId === pump.id && irrigationState.mode !== "stopped";
      return `
        <button class="pump-button ${isOn ? "is-on" : ""}" type="button" data-pump-id="${pump.id}" aria-pressed="${isOn}">
          <span>
            <strong>${pump.name}</strong>
            <small>${pump.role}</small>
          </span>
          <i class="pump-state-dot" aria-hidden="true"></i>
        </button>
      `;
    })
    .join("");
}

function renderIrrigationAlerts() {
  if (!irrigationAlertList) {
    return;
  }

  if (!irrigationState.alerts.length) {
    irrigationAlertList.innerHTML = `<article class="irrigation-alert"><span class="irrigation-alert-icon">✓</span><div><strong>ប្រព័ន្ធធម្មតា</strong><span>មិនមានការព្រមានថ្មីទេ។</span></div></article>`;
    return;
  }

  irrigationAlertList.innerHTML = irrigationState.alerts
    .map((alert) => {
      const icon = alert.type === "danger" ? "!" : alert.type === "warning" ? "⚠" : "💧";
      return `
        <article class="irrigation-alert ${alert.type}">
          <span class="irrigation-alert-icon">${icon}</span>
          <div>
            <strong>${alert.title}</strong>
            <span>${alert.detail}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function handleIrrigationProfileChange(event) {
  const nextProfile = irrigationProfiles.find((profile) => profile.id === event.target.value);
  if (!nextProfile) {
    return;
  }

  irrigationState = {
    ...makeDefaultIrrigationState(nextProfile),
    lastCommand: `Loaded ${nextProfile.name}`,
  };
  addIrrigationAlert("info", "បានប្តូរ Profile", `${nextProfile.zones.length} valve • ${nextProfile.pumps.length} pump`);
  saveIrrigationState();
  renderIrrigationDashboard();
}

function startIrrigationAutoMode() {
  const profile = getActiveIrrigationProfile();
  const defaults = profile.defaultStatus;
  irrigationState = {
    ...irrigationState,
    mode: "auto",
    activeZoneId: irrigationState.activeZoneId || defaults.activeZoneId,
    activeValves: irrigationState.activeValves.length ? irrigationState.activeValves : [...defaults.activeValves],
    activePumpId: irrigationState.activePumpId || defaults.activePumpId,
    remainingSeconds: irrigationState.remainingSeconds > 0 ? irrigationState.remainingSeconds : defaults.remainingSeconds,
    totalSeconds: defaults.totalSeconds,
    lastCommand: "CMD AUTO START sent",
  };
  addIrrigationAlert("info", "Auto irrigation started", "Command packet prepared for Main ESP32.");
  saveIrrigationState();
  renderIrrigationDashboard();
}

function stopAllIrrigation() {
  irrigationState = {
    ...irrigationState,
    mode: "stopped",
    activeValves: [],
    activePumpId: "",
    remainingSeconds: 0,
    lastCommand: "EMERGENCY STOP sent",
  };
  addIrrigationAlert("danger", "បញ្ឈប់ទាំងអស់", "Pump និង valve ទាំងអស់ត្រូវបិទ។ ESP32 ត្រូវអនុវត្ត safety delay។");
  saveIrrigationState();
  renderIrrigationDashboard();
}

function handleIrrigationZoneClick(event) {
  const button = event.target.closest("[data-zone-id]");
  if (!button) {
    return;
  }

  const zoneId = button.dataset.zoneId;
  const activeSet = new Set(irrigationState.activeValves);
  if (activeSet.has(zoneId)) {
    activeSet.delete(zoneId);
  } else {
    activeSet.add(zoneId);
  }

  irrigationState = {
    ...irrigationState,
    mode: activeSet.size ? "manual" : "stopped",
    activeZoneId: zoneId,
    activeValves: [...activeSet],
    activePumpId: activeSet.size ? (irrigationState.activePumpId || getActiveIrrigationProfile().pumps[0]?.id || "") : "",
    remainingSeconds: activeSet.size ? Math.max(irrigationState.remainingSeconds, 300) : 0,
    lastCommand: `CMD VALVE ${zoneId} ${activeSet.has(zoneId) ? "ON" : "OFF"}`,
  };
  saveIrrigationState();
  renderIrrigationDashboard();
}

function handleIrrigationPumpClick(event) {
  const button = event.target.closest("[data-pump-id]");
  if (!button) {
    return;
  }

  const pumpId = button.dataset.pumpId;
  const nextPumpId = irrigationState.activePumpId === pumpId ? "" : pumpId;
  irrigationState = {
    ...irrigationState,
    mode: nextPumpId && irrigationState.activeValves.length ? "manual" : "stopped",
    activePumpId: nextPumpId,
    lastCommand: `CMD PUMP ${pumpId} ${nextPumpId ? "ON" : "OFF"}`,
  };
  saveIrrigationState();
  renderIrrigationDashboard();
}

function startIrrigationTimer() {
  if (irrigationTimer) {
    clearInterval(irrigationTimer);
  }

  irrigationTimer = window.setInterval(() => {
    if (!irrigationPanel || irrigationPanel.classList.contains("page-hidden")) {
      return;
    }
    if (!["auto", "manual"].includes(irrigationState.mode) || irrigationState.remainingSeconds <= 0) {
      return;
    }

    irrigationState.remainingSeconds -= 1;
    if (irrigationState.remainingSeconds <= 0) {
      irrigationState.mode = "stopped";
      irrigationState.activeValves = [];
      irrigationState.activePumpId = "";
      irrigationState.lastCommand = "Cycle complete";
      addIrrigationAlert("info", "ស្រោចទឹករួចរាល់", "វគ្គស្រោចទឹកបានបញ្ចប់ដោយស្វ័យប្រវត្តិ។");
    }
    saveIrrigationState();
    renderIrrigationDashboard();
  }, 1000);
}

function addIrrigationAlert(type, title, detail) {
  irrigationState.alerts = [
    { type, title, detail },
    ...irrigationState.alerts,
  ].slice(0, 5);
}

function formatIrrigationTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function populateWeatherLocations() {
  if (!weatherLocationSelect) {
    return;
  }

  const savedLocation = readSavedWeatherLocation();
  weatherLocations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location.id;
    option.textContent = `${location.name} - ${location.note}`;
    weatherLocationSelect.appendChild(option);
  });

  if (savedLocation && weatherLocations.some((location) => location.id === savedLocation)) {
    weatherLocationSelect.value = savedLocation;
  }
}

function loadWeatherPreferences() {
  updateWeatherNotificationButton();
  const location = getSelectedWeatherLocation();
  if (location) {
    setWeatherStatus(`ទីតាំងបានជ្រើស: ${location.name}។ ចុចពិនិត្យអាកាសធាតុ ដើម្បីមើលហានិភ័យ។`);
    renderAiWeatherSummary(location);
    updateAccountDashboard();
  } else {
    renderAiWeatherSummary();
    updateAccountDashboard();
  }
}

function readSavedWeatherLocation() {
  try {
    return localStorage.getItem(weatherLocationKey) || "";
  } catch {
    return "";
  }
}

function handleWeatherLocationChange() {
  const location = getSelectedWeatherLocation();
  try {
    localStorage.setItem(weatherLocationKey, location?.id || "");
  } catch {
    // Local storage may be unavailable in very restricted browsers.
  }

  if (!location) {
    setWeatherStatus("សូមជ្រើសរើសទីតាំងចម្ការជាមុនសិន។");
    renderAiWeatherSummary();
    updateAccountDashboard();
    return;
  }

  setWeatherStatus(`បានជ្រើស ${location.name}។ ចុចពិនិត្យអាកាសធាតុ ដើម្បីទាញទិន្នន័យ Online។`);
  renderAiWeatherSummary(location);
  updateAccountDashboard();
}

async function handleWeatherForecastSubmit(event) {
  event.preventDefault();
  const location = getSelectedWeatherLocation();

  if (!location) {
    setWeatherStatus("សូមជ្រើសរើសទីតាំងចម្ការ មុនពិនិត្យអាកាសធាតុ។");
    weatherLocationSelect?.focus();
    return;
  }

  if (!navigator.onLine) {
    setWeatherStatus("មិនមានអ៊ីនធឺណិត។ ពិនិត្យអាកាសធាតុត្រូវការ Online ប៉ុន្តែ AI ពិនិត្យរូបភាពនៅតែប្រើ Offline បាន។");
    return;
  }

  setWeatherLoading(true);
  setWeatherStatus(`កំពុងទាញទិន្នន័យអាកាសធាតុសម្រាប់ ${location.name}...`);

  try {
    const forecast = await fetchWeatherForecast(location);
    const risk = analyzeWeatherRisk(forecast);
    renderWeatherForecast(location, forecast, risk);
    maybeSendWeatherNotification(location, risk);
  } catch (error) {
    console.error(error);
    setWeatherStatus("ទាញទិន្នន័យអាកាសធាតុមិនបាន។ សូមពិនិត្យអ៊ីនធឺណិត រួចសាកល្បងម្ដងទៀត។");
  } finally {
    setWeatherLoading(false);
  }
}

function getSelectedWeatherLocation() {
  const selectedId = weatherLocationSelect?.value || "";
  return weatherLocations.find((location) => location.id === selectedId);
}

async function fetchWeatherForecast(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m",
    daily: "precipitation_sum,precipitation_probability_max",
    timezone: "Asia/Bangkok",
    forecast_days: "3",
  });

  const response = await fetch(`${weatherApiBaseUrl}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }

  return response.json();
}

function analyzeWeatherRisk(forecast) {
  const current = forecast?.current || {};
  const daily = forecast?.daily || {};
  const temperature = toFiniteNumber(current.temperature_2m);
  const humidity = toFiniteNumber(current.relative_humidity_2m);
  const windSpeed = toFiniteNumber(current.wind_speed_10m);
  const currentRain = toFiniteNumber(current.rain ?? current.precipitation);
  const rainProbability = maxNumber(daily.precipitation_probability_max);
  const rainTotal = sumNumbers(daily.precipitation_sum);
  const reasons = [];
  let score = 0;

  if (humidity >= 85) {
    score += 30;
    reasons.push("សំណើមខ្ពស់ណាស់");
  } else if (humidity >= 75) {
    score += 18;
    reasons.push("សំណើមខ្ពស់");
  }

  if (rainProbability >= 70 || rainTotal >= 20 || currentRain >= 3) {
    score += 28;
    reasons.push("មានភ្លៀងច្រើន/ឱកាសភ្លៀងខ្ពស់");
  } else if (rainProbability >= 45 || rainTotal >= 5 || currentRain > 0) {
    score += 16;
    reasons.push("មានឱកាសភ្លៀង");
  }

  if (temperature >= 24 && temperature <= 32) {
    score += 15;
    reasons.push("កម្ដៅសមស្របសម្រាប់ជំងឺផ្សិត/សារាយ");
  } else if (temperature >= 20 && temperature <= 34) {
    score += 8;
    reasons.push("កម្ដៅនៅក្នុងជួរត្រូវប្រុងប្រយ័ត្ន");
  }

  if (windSpeed > 0 && windSpeed < 18) {
    score += 7;
    reasons.push("ខ្យល់មិនខ្លាំង សំណើមអាចនៅលើស្លឹកបានយូរ");
  }

  const sprayNote = windSpeed >= 20
    ? "ខ្យល់ខ្លាំង មិនគួរបាញ់ថ្នាំពេលនេះទេ។"
    : "បើត្រូវបាញ់ថ្នាំ ត្រូវពិនិត្យស្លាក និងពាក់សម្ភារៈការពារ។";

  if (score >= 65) {
    return {
      levelKey: "high",
      levelLabel: "ខ្ពស់",
      title: "ហានិភ័យជំងឺខ្ពស់",
      text: `សូមពិនិត្យស្លឹក និងផ្នែកក្រោមគុម្ពឲ្យញឹកញាប់។ ${sprayNote}`,
      reasons,
      score,
      temperature,
      humidity,
      windSpeed,
      rainProbability,
      rainTotal,
    };
  }

  if (score >= 35) {
    return {
      levelKey: "medium",
      levelLabel: "មធ្យម",
      title: "ហានិភ័យជំងឺមធ្យម",
      text: `សូមតាមដានស្លឹកខ្ចី និងកាត់មែកឲ្យខ្យល់ចេញចូល។ ${sprayNote}`,
      reasons,
      score,
      temperature,
      humidity,
      windSpeed,
      rainProbability,
      rainTotal,
    };
  }

  return {
    levelKey: "low",
    levelLabel: "ទាប",
    title: "ហានិភ័យជំងឺទាប",
    text: "អាកាសធាតុមិនសូវជំរុញជំងឺស្លឹកទេ ប៉ុន្តែគួរពិនិត្យចម្ការជាប្រចាំ។",
    reasons,
    score,
    temperature,
    humidity,
    windSpeed,
    rainProbability,
    rainTotal,
  };
}

function renderWeatherForecast(location, forecast, risk) {
  weatherMetrics?.classList.remove("hidden");
  if (weatherTemperature) {
    weatherTemperature.textContent = `${formatWeatherNumber(risk.temperature)}°C`;
  }
  if (weatherRain) {
    weatherRain.textContent = `${formatWeatherNumber(risk.rainProbability, 0)}% / ${formatWeatherNumber(risk.rainTotal)}mm`;
  }
  if (weatherHumidity) {
    weatherHumidity.textContent = `${formatWeatherNumber(risk.humidity, 0)}%`;
  }
  if (weatherRiskLevel) {
    weatherRiskLevel.textContent = risk.levelLabel;
  }

  const updateTime = forecast?.current?.time ? formatWeatherTime(forecast.current.time) : "ឥឡូវនេះ";
  setWeatherStatus(`បានធ្វើបច្ចុប្បន្នភាព: ${updateTime}។ ប្រភពទិន្នន័យ: Open-Meteo។`);
  renderAiWeatherSummary(location, risk, updateTime);
}

function renderAiWeatherSummary(location = getSelectedWeatherLocation(), risk = null, updateTime = "") {
  if (!aiWeatherLocation && !aiWeatherTemperature && !aiWeatherAlert) {
    return;
  }

  if (!location) {
    if (aiWeatherLocation) {
      aiWeatherLocation.textContent = "ជ្រើសទីតាំងនៅទំព័រដើម ដើម្បីមើលហានិភ័យជំងឺ។";
    }
    if (aiWeatherTemperature) {
      aiWeatherTemperature.textContent = "--";
    }
    if (aiWeatherHumidity) {
      aiWeatherHumidity.textContent = "--";
    }
    if (aiWeatherRain) {
      aiWeatherRain.textContent = "--";
    }
    if (aiWeatherRisk) {
      aiWeatherRisk.textContent = "--";
    }
    if (aiWeatherAlert) {
      aiWeatherAlert.textContent = "AI នឹងបង្ហាញការព្រមាននៅពេលមានទិន្នន័យអាកាសធាតុ។";
    }
    return;
  }

  if (aiWeatherLocation) {
    aiWeatherLocation.textContent = risk
      ? `${location.name} • បច្ចុប្បន្នភាព ${updateTime || "ឥឡូវនេះ"}`
      : `${location.name} • ចុចពិនិត្យអាកាសធាតុនៅទំព័រដើម`;
  }
  if (aiWeatherTemperature) {
    aiWeatherTemperature.textContent = risk ? `${formatWeatherNumber(risk.temperature)}°C` : "--";
  }
  if (aiWeatherHumidity) {
    aiWeatherHumidity.textContent = risk ? `${formatWeatherNumber(risk.humidity, 0)}%` : "--";
  }
  if (aiWeatherRain) {
    aiWeatherRain.textContent = risk ? `${formatWeatherNumber(risk.rainTotal)}mm` : "--";
  }
  if (aiWeatherRisk) {
    aiWeatherRisk.textContent = risk ? risk.levelLabel : "--";
  }
  if (aiWeatherAlert) {
    aiWeatherAlert.textContent = risk
      ? `${risk.title}: ${risk.text}`
      : "មិនទាន់មានទិន្នន័យព្យាករណ៍។ សូមទៅទំព័រដើម ហើយចុចពិនិត្យអាកាសធាតុ។";
  }
}

function setWeatherLoading(isLoading) {
  if (!fetchWeatherButton) {
    return;
  }

  fetchWeatherButton.disabled = isLoading;
  fetchWeatherButton.querySelector("span").textContent = isLoading ? "កំពុងពិនិត្យ..." : "ពិនិត្យអាកាសធាតុ";
}

function setWeatherStatus(message) {
  if (weatherStatus) {
    weatherStatus.textContent = message;
  }
}

function updateWeatherNotificationButton() {
  if (!weatherNotifyButton || !weatherNotifyLabel) {
    return;
  }

  const supported = "Notification" in window;
  const enabled = readWeatherNotificationsEnabled();
  weatherNotifyButton.classList.toggle("primary", enabled);
  weatherNotifyButton.classList.toggle("light", !enabled);

  if (!supported) {
    weatherNotifyLabel.textContent = "មិនគាំទ្រជូនដំណឹង";
    weatherNotifyButton.disabled = false;
    return;
  }

  if (Notification.permission === "denied") {
    weatherNotifyLabel.textContent = "ជូនដំណឹងត្រូវបានបិទ";
    return;
  }

  weatherNotifyLabel.textContent = enabled ? "បិទជូនដំណឹង" : "បើកជូនដំណឹង";
}

async function toggleWeatherNotifications() {
  if (!("Notification" in window)) {
    setWeatherStatus("Browser ឬ WebView នេះមិនគាំទ្រ Notification API ទេ។ App នៅតែបង្ហាញការព្រមាននៅលើអេក្រង់។");
    return;
  }

  if (readWeatherNotificationsEnabled()) {
    saveWeatherNotificationsEnabled(false);
    updateWeatherNotificationButton();
    setWeatherStatus("បានបិទការជូនដំណឹងអាកាសធាតុ។");
    return;
  }

  if (Notification.permission === "denied") {
    setWeatherStatus("ការជូនដំណឹងត្រូវបានបិទក្នុង browser/phone settings។ សូមបើក Notification permission មុន។");
    updateWeatherNotificationButton();
    return;
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission === "granted") {
    saveWeatherNotificationsEnabled(true);
    updateWeatherNotificationButton();
    setWeatherStatus("បានបើកការជូនដំណឹង។ ពេលហានិភ័យជំងឺមធ្យម ឬខ្ពស់ App នឹងជូនដំណឹង។");
    sendBrowserNotification("Smart Chomka", "បានបើកការជូនដំណឹងអាកាសធាតុចម្ការ។", "smart-chomka-weather-ready");
    return;
  }

  setWeatherStatus("មិនទាន់អនុញ្ញាតជូនដំណឹងទេ។ App នឹងបង្ហាញព្រមាននៅលើអេក្រង់ជំនួស។");
  updateWeatherNotificationButton();
}

function maybeSendWeatherNotification(location, risk) {
  if (!readWeatherNotificationsEnabled() || !["medium", "high"].includes(risk.levelKey)) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const stamp = `${today}:${location.id}:${risk.levelKey}`;
  try {
    if (localStorage.getItem(weatherNotificationStampKey) === stamp) {
      return;
    }
    localStorage.setItem(weatherNotificationStampKey, stamp);
  } catch {
    // Sending the notification is still useful even if storage fails.
  }

  sendBrowserNotification(
    `Smart Chomka: ${risk.title}`,
    `${location.name}: ${risk.text}`,
    `smart-chomka-weather-${location.id}`
  );
}

function sendBrowserNotification(title, body, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const options = {
    body,
    tag,
    icon: "./assets/icons/icon-192.png",
    badge: "./assets/icons/icon-192.png",
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.showNotification(title, options))
      .catch((error) => {
        console.warn("Service worker notification failed", error);
        try {
          new Notification(title, options);
        } catch (notificationError) {
          console.warn("Weather notification failed", notificationError);
        }
      });
    return;
  }

  try {
    new Notification(title, options);
  } catch (error) {
    console.warn("Weather notification failed", error);
  }
}

function readWeatherNotificationsEnabled() {
  try {
    return localStorage.getItem(weatherNotificationsKey) === "1";
  } catch {
    return false;
  }
}

function saveWeatherNotificationsEnabled(enabled) {
  try {
    localStorage.setItem(weatherNotificationsKey, enabled ? "1" : "0");
  } catch {
    // Ignore storage errors.
  }
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function maxNumber(values = []) {
  const numbers = Array.isArray(values) ? values.map(toFiniteNumber) : [];
  return numbers.length ? Math.max(...numbers) : 0;
}

function sumNumbers(values = []) {
  return Array.isArray(values) ? values.reduce((total, value) => total + toFiniteNumber(value), 0) : 0;
}

function formatWeatherNumber(value, digits = 1) {
  const number = toFiniteNumber(value);
  return number.toLocaleString("km-KH", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function formatWeatherTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("km-KH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleFileSelect(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }
  stopVoice();
  lastVoiceText = "";
  lastChatVoiceText = "";
  lastPredictionContext = null;
  selectedFile = file;
  showPage("home", { scroll: false });
  previewImage.src = URL.createObjectURL(file);
  scanPanel?.classList.add("has-preview");
  previewCard.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  predictButton.disabled = !session;
  updateDashboardWaitingForPrediction();
  scanPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function runPrediction() {
  if (!selectedFile || !session || !metadata) {
    return;
  }

  predictButton.disabled = true;
  setPredictButtonContent("កំពុងពិនិត្យ...");

  try {
    const ranked = await runModelPrediction(selectedFile, session, metadata);
    await showResult(ranked);
  } catch (error) {
    console.error(error);
    updateOnlineStatus();
    updateDashboardError();
  } finally {
    predictButton.disabled = false;
    setPredictButtonContent("ពិនិត្យជំងឺ");
  }
}

async function runModelPrediction(file, modelSession, modelMetadata) {
  const tensor = await imageFileToTensor(file, modelMetadata);
  const feeds = { [modelMetadata.input_name]: tensor };
  const outputs = await modelSession.run(feeds);
  const logits = outputs[modelMetadata.output_name].data;
  const probabilities = softmax(Array.from(logits));
  return probabilities
    .map((probability, index) => ({
      className: modelMetadata.class_names[index],
      probability,
    }))
    .sort((a, b) => b.probability - a.probability);
}

async function imageFileToTensor(file, modelMetadata) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const size = modelMetadata.img_size;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  const { mean, std } = modelMetadata.normalization;
  const data = new Float32Array(3 * size * size);
  const plane = size * size;

  for (let pixel = 0; pixel < plane; pixel += 1) {
    const source = pixel * 4;
    data[pixel] = (pixels[source] / 255 - mean[0]) / std[0];
    data[plane + pixel] = (pixels[source + 1] / 255 - mean[1]) / std[1];
    data[2 * plane + pixel] = (pixels[source + 2] / 255 - mean[2]) / std[2];
  }

  return new ort.Tensor("float32", data, [1, 3, size, size]);
}

function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

async function showResult(ranked, options = {}) {
  const top = ranked[0];
  await saveScanHistory(top, options);
  renderScanHistory();
  renderPredictionDetail(top, options);
  showPage("home", { scroll: false });
  resultPanel.classList.remove("hidden");
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPredictionDetail(top, detail = {}) {
  const recommendation = recommendations[top.className] || buildDefaultRecommendation(top.className);
  const summary = farmerSummaries[top.className];
  const isConfident = isPredictionConfident(top);
  lastPredictionContext = { top, recommendation, summary, isConfident };
  lastVoiceText = buildVoiceText(top, recommendation, summary);
  updateDashboardResult(top, recommendation, summary);

  const resultLabel = khmerLabels[top.className] ?? top.className;
  resultTitle.textContent = isConfident ? resultLabel : "AI មិនទាន់ប្រាកដ";
  const confidence = Math.round((top.probability || 0) * 100);
  const datePrefix = detail.date ? `បានពិនិត្យ: ${formatScanDate(detail.date)} • ` : "";
  resultConfidence.textContent = isConfident
    ? `${datePrefix}ភាពជឿជាក់ ${confidence}%`
    : `${datePrefix}រូបនេះស្រដៀង ${resultLabel} ប៉ុន្តែភាពជឿជាក់មានតែ ${confidence}%`;
  resultConfidence.classList.remove("hidden");
  probabilityList.innerHTML = "";

  recommendationBox.innerHTML = `
    ${renderHistoryDetailCard(top, detail)}
    ${renderConfidenceAdvice(top)}
    ${renderPredictionComparison(top, detail)}
    ${
      isConfident
        ? `
          ${renderFarmerSummary(top.className)}
          ${renderFieldActionPlan(top.className, recommendation)}
          <h3>ហេតុអ្វីសំខាន់</h3>
          <p>${recommendation.why}</p>
          <h3>សកម្មភាពបន្ទាប់</h3>
          <ul>${recommendation.actions.map((action) => `<li>${action}</li>`).join("")}</ul>
        `
        : renderRetakePhotoPanel(top)
    }
    ${renderVoicePanel()}
    ${renderChatbotPanel(top.className)}
  `;

  bindVoiceControls();
  bindChatbotControls();
  bindReportDetailControls();
  showMedicines(isConfident ? recommendation.medicines || [] : [], { uncertain: !isConfident });
}

function renderHistoryDetailCard(top, detail = {}) {
  if (!detail.image && !detail.date) {
    return "";
  }

  const label = khmerLabels[top.className] ?? top.className;
  const confidence = Math.round((top.probability || 0) * 100);
  const image = detail.image || diseaseSampleImages[top.className] || diseaseSampleImages.HEALTHY_LEAF;
  const recommendation = recommendations[top.className] || buildDefaultRecommendation(top.className);
  const farmerNotes = readFarmCare();
  const latestNote = farmerNotes[0];
  const treatment = isPredictionConfident(top)
    ? recommendation.actions?.[0] || recommendation.why
    : "AI មិនទាន់ប្រាកដ។ សូមថតរូបថ្មី និងប្រៀបធៀបជាមួយរូបឧទាហរណ៍ មុនសម្រេចចិត្តប្រើថ្នាំ។";

  return `
    <section class="history-detail-card">
      <img src="${escapeAttribute(image)}" alt="${escapeAttribute(label)}">
      <div class="report-detail-copy">
        <span>របាយការណ៍ពិនិត្យ</span>
        <strong>${label}</strong>
        <p>${detail.date ? formatScanDate(detail.date) : "ថ្ងៃនេះ"} • ភាពជឿជាក់ ${confidence}%</p>
        <dl class="report-detail-list">
          <div>
            <dt>ការណែនាំព្យាបាល</dt>
            <dd>${escapeHtml(treatment)}</dd>
          </div>
          <div>
            <dt>កំណត់ចំណាំកសិករ</dt>
            <dd>${latestNote?.note ? escapeHtml(latestNote.note) : "មិនទាន់មានចំណាំ។ អាចបញ្ចូលនៅទំព័ររបាយការណ៍។"}</dd>
          </div>
        </dl>
        <div class="report-detail-actions">
          <button class="action-button" type="button" id="printReportButton">ទាញយកជា PDF</button>
          <button class="action-button" type="button" id="shareReportButton">ចែករំលែក</button>
        </div>
      </div>
    </section>
  `;
}

function bindReportDetailControls() {
  document.querySelector("#printReportButton")?.addEventListener("click", () => {
    window.print();
  });
  document.querySelector("#shareReportButton")?.addEventListener("click", shareCurrentReport);
}

async function shareCurrentReport() {
  const reportText = buildCurrentReportText();
  if (!reportText) {
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Smart Chomka Report",
        text: reportText,
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  try {
    await navigator.clipboard?.writeText(reportText);
    window.alert("បានចម្លងរបាយការណ៍ទៅ Clipboard។");
  } catch {
    window.alert(reportText);
  }
}

function buildCurrentReportText() {
  if (!lastPredictionContext) {
    return "";
  }

  const { top, recommendation } = lastPredictionContext;
  const label = khmerLabels[top.className] ?? top.className;
  const confidence = Math.round((top.probability || 0) * 100);
  const note = readFarmCare()[0]?.note || "មិនទាន់មានចំណាំ";
  const treatment = isPredictionConfident(top)
    ? recommendation.actions?.[0] || recommendation.why || ""
    : "AI មិនទាន់ប្រាកដ។ សូមថតរូបថ្មី និងកុំប្រើថ្នាំដោយផ្អែកលើរូបនេះតែមួយ។";
  return [
    "Smart Chomka - របាយការណ៍ពិនិត្យស្លឹកទុរេន",
    `ជំងឺ/រោគសញ្ញា: ${label}`,
    `ភាពជឿជាក់ AI: ${confidence}%`,
    `ការណែនាំ: ${treatment}`,
    `ចំណាំកសិករ: ${note}`,
    "សូមផ្ទៀងផ្ទាត់ស្លាកថ្នាំ/QR និងសួរអ្នកជំនាញ ប្រសិនបើរោគសញ្ញាធ្ងន់។",
  ].join("\n");
}

function buildDefaultRecommendation(className) {
  const label = khmerLabels[className] ?? className;
  return {
    title: label,
    why: "សូមពិនិត្យរូបភាពបន្ថែម ឬសួរអ្នកជំនាញ ប្រសិនបើលទ្ធផលមិនច្បាស់។",
    actions: ["ថតស្លឹកពីរឬបីសន្លឹកបន្ថែម។", "ពិនិត្យរោគសញ្ញាជុំវិញដើមទុរេន។"],
    medicines: [],
  };
}

function handlePageTargetClick(event) {
  const pageName = event.currentTarget.dataset.pageTarget;
  if (!pageName) {
    return;
  }

  event.preventDefault();
  const scrollTargetId = event.currentTarget.dataset.scrollTarget;
  showPage(pageName, { scroll: !scrollTargetId });
  if (scrollTargetId) {
    window.setTimeout(() => {
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }
}

function handleDiseaseSampleClick(event) {
  const card = event.target.closest("[data-disease-key]");
  if (!card) {
    return;
  }

  renderDiseaseKnowledgeDetail(card.dataset.diseaseKey);
}

function handleDiseaseDetailClick(event) {
  const medicineZoomButton = event.target.closest("[data-medicine-zoom]");
  if (medicineZoomButton) {
    openImageLightbox({
      src: medicineZoomButton.dataset.image,
      name: medicineZoomButton.dataset.name,
      credit: medicineZoomButton.dataset.credit,
    });
    return;
  }

  if (event.target.closest("[data-close-disease-detail]")) {
    diseaseDetailPanel?.classList.add("hidden");
    return;
  }

  if (event.target.closest("[data-start-disease-scan]")) {
    showPage("home", { scroll: false });
    window.setTimeout(() => {
      document.getElementById("startScanBand")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }
}

function renderDiseaseKnowledgeDetail(className = "") {
  const recommendation = recommendations[className] || buildDefaultRecommendation(className);
  const title = khmerLabels[className] ?? recommendation.title ?? className;
  const type = diseaseTypes[className] || "រោគសញ្ញាទុរេន";
  const mainImage = diseaseSampleImages[className] || diseaseSampleImages.HEALTHY_LEAF;
  const examples = diseaseExampleImages[className] || [mainImage];
  const isGuideOnly = guideOnlyDiseaseKeys.has(className);
  const medicineNames = recommendation.medicines.length
    ? recommendation.medicines.map((item) => item.name).slice(0, 3).join(", ")
    : "មិនចាំបាច់ប្រើថ្នាំ បើស្លឹកមានសុខភាពល្អ។";
  const medicineCards = renderDiseaseMedicineCards(recommendation.medicines || []);

  if (!diseaseDetailPanel) {
    return;
  }

  diseaseDetailPanel.innerHTML = `
    <div class="disease-detail-hero">
      <img src="${mainImage}" alt="${escapeHtml(title)}">
      <div class="disease-detail-copy">
        <span class="hero-kicker">${escapeHtml(type)}</span>
        <h3>${escapeHtml(title)}</h3>
        ${isGuideOnly ? `<p class="guide-only-note"><strong>មគ្គុទ្ទេសក៍បន្ថែម:</strong> ផ្នែកនេះជាចំណេះដឹងបន្ថែម និងថ្នាំក្នុងស្រុកសម្រាប់ពិចារណា។ ម៉ូដែលរូបភាពបច្ចុប្បន្នមិនទាន់បានបង្ហាត់ឲ្យបែងចែកប្រភេទនេះដោយផ្ទាល់ទេ។</p>` : ""}
        ${guideImageCredits[className] ? `<p class="guide-image-credit">${escapeHtml(guideImageCredits[className])}</p>` : ""}
        <p>${escapeHtml(recommendation.why)}</p>
        <div>
          <strong>អ្វីត្រូវធ្វើ</strong>
          <ul>
            ${(recommendation.actions || []).map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
          </ul>
        </div>
        <p><strong>ថ្នាំប្រើប្រាស់:</strong> ${escapeHtml(medicineNames)}</p>
      </div>
    </div>
    <div class="disease-example-grid">
      ${examples
        .map((image, index) => `
          <figure>
            <img src="${image}" alt="${escapeHtml(title)} example ${index + 1}">
            <figcaption>រូបឧទាហរណ៍ ${index + 1}</figcaption>
          </figure>
        `)
        .join("")}
    </div>
    ${medicineCards}
    <div class="disease-detail-actions">
      <button class="action-button primary" type="button" data-start-disease-scan>
        ${renderSearchIcon()}
        <span>ទៅពិនិត្យស្លឹក</span>
      </button>
      <button class="action-button" type="button" data-close-disease-detail>បិទព័ត៌មាន</button>
    </div>
  `;
  diseaseDetailPanel.classList.remove("hidden");
  diseaseDetailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDiseaseMedicineCards(medicines = []) {
  if (!medicines.length) {
    return `
      <section class="disease-medicine-panel">
        <h4>ថ្នាំប្រើប្រាស់</h4>
        <p>មិនចាំបាច់ប្រើថ្នាំទេ ប្រសិនបើមិនមានរោគសញ្ញាផ្សេង។ បន្តតាមដាន និងរក្សាចម្ការឲ្យមានខ្យល់ចេញចូលល្អ។</p>
      </section>
    `;
  }

  return `
    <section class="disease-medicine-panel">
      <h4>ថ្នាំប្រើប្រាស់ (ត្រូវអានស្លាក/QR មុនប្រើ)</h4>
      <p>ខាងក្រោមជាជម្រើសក្នុងស្រុកសម្រាប់ពិចារណា។ កុំប្រើថ្នាំដោយស្វ័យប្រវត្តិ បើមិនទាន់ផ្ទៀងផ្ទាត់រោគសញ្ញា និងស្លាកផលិតផល។</p>
      <div class="medicine-grid compact">
        ${medicines.map((item) => renderMedicineCard(item)).join("")}
      </div>
    </section>
  `;
}

function showPage(pageName = "home", options = {}) {
  const { updateHash = true, scroll = true } = options;
  const activePage = pageNames.has(pageName) ? pageName : "home";

  pageViews.forEach((view) => {
    const supportedPages = (view.dataset.pageView || "").split(/\s+/);
    view.classList.toggle("page-hidden", !supportedPages.includes(activePage));
  });

  pageTargets.forEach((target) => {
    target.classList.toggle("active", target.dataset.pageTarget === activePage);
  });

  document.body.dataset.page = activePage;

  if (activePage === "irrigation") {
    renderIrrigationDashboard();
  }

  if (updateHash) {
    const nextHash = `#${activePage}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  }

  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function getPageFromHash() {
  const hash = window.location.hash.replace("#", "");
  const legacyMap = {
    scanPanel: "home",
    diagnose: "home",
    resultPanel: "home",
    knowledgePanel: "knowledge",
    historyPanel: "history",
    irrigationPanel: "home",
    sprayTips: "knowledge",
    onlineAdvisorPanel: "ai",
    aiPanel: "ai",
    accountPanel: "account",
  };

  return legacyMap[hash] || hash || "home";
}

function updateDashboardWaitingForPrediction() {
  updateAccountDashboard();
}

function updateDashboardError() {
  updateAccountDashboard();
}

function updateDashboardResult(top, recommendation, summary) {
  updateAccountDashboard();
}

async function saveScanHistory(top) {
  try {
    const history = readScanHistory();
    const image = await createScanHistoryThumbnail(selectedFile);
    const nextItem = {
      className: top.className,
      probability: top.probability,
      model: PRIMARY_MODEL.key,
      date: new Date().toISOString(),
      image,
    };
    const nextHistory = [nextItem, ...history].slice(0, 8);
    localStorage.setItem(scanHistoryKey, JSON.stringify(nextHistory));
  } catch (error) {
    console.warn("Could not save scan history", error);
  }
}

async function createScanHistoryThumbnail(file) {
  if (!file) {
    return "";
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const maxSize = 420;
    const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch (error) {
    console.warn("Could not create history thumbnail", error);
    return "";
  }
}

function readScanHistory() {
  try {
    return JSON.parse(localStorage.getItem(scanHistoryKey) || "[]");
  } catch {
    return [];
  }
}

function renderScanHistory() {
  if (!historyList) {
    updateAccountDashboard();
    renderAiRecentReports();
    return;
  }

  const history = readScanHistory();
  clearHistoryButton?.classList.toggle("hidden", !history.length);
  if (!history.length) {
    historyList.innerHTML = "<p>មិនទាន់មានរបាយការណ៍។ លទ្ធផលថ្មីៗនឹងបង្ហាញនៅទីនេះ។</p>";
    updateAccountDashboard();
    renderAiRecentReports(history);
    return;
  }

  const latestNote = readFarmCare()[0]?.note || "";
  historyList.innerHTML = history
    .map((item, index) => {
      const label = khmerLabels[item.className] ?? item.className;
      const confidence = Math.round((item.probability || 0) * 100);
      const image = item.image || diseaseSampleImages[item.className] || diseaseSampleImages.HEALTHY_LEAF;
      const recommendation = recommendations[item.className] || buildDefaultRecommendation(item.className);
      const treatment = recommendation.actions?.[0] || recommendation.why;
      return `
        <button class="history-item report-item" type="button" data-history-index="${index}" aria-label="មើលលម្អិត ${escapeAttribute(label)}">
          <img src="${escapeAttribute(image)}" alt="${escapeAttribute(label)}">
          <div class="report-item-copy">
            <strong>${label}</strong>
            <small>${formatScanDate(item.date)} • ភាពជឿជាក់ ${confidence}%</small>
            <span class="report-treatment">ការណែនាំ: ${escapeHtml(treatment)}</span>
            <span class="report-note">ចំណាំ: ${latestNote ? escapeHtml(latestNote) : "មិនទាន់មានចំណាំកសិករ"}</span>
            <small class="history-hint">មើលលម្អិត</small>
          </div>
          <span class="history-score">${confidence}%</span>
        </button>
      `;
    })
    .join("");
  updateAccountDashboard();
  renderAiRecentReports(history);
}

function renderAiRecentReports(history = readScanHistory()) {
  if (!aiRecentReports) {
    return;
  }

  if (!history.length) {
    aiRecentReports.innerHTML = "<p>មិនទាន់មានរបាយការណ៍។ ពេលពិនិត្យស្លឹករួច វានឹងបង្ហាញនៅទីនេះ។</p>";
    return;
  }

  aiRecentReports.innerHTML = history
    .slice(0, 3)
    .map((item, index) => {
      const label = khmerLabels[item.className] ?? item.className;
      const confidence = Math.round((item.probability || 0) * 100);
      const image = item.image || diseaseSampleImages[item.className] || diseaseSampleImages.HEALTHY_LEAF;
      return `
        <button class="ai-recent-item" type="button" data-history-index="${index}" aria-label="មើលរបាយការណ៍ ${escapeAttribute(label)}">
          <img src="${escapeAttribute(image)}" alt="${escapeAttribute(label)}">
          <span>
            <strong>${escapeHtml(label)}</strong>
            <small>${formatScanDate(item.date)}</small>
          </span>
          <b>${confidence}%</b>
        </button>
      `;
    })
    .join("");
}

function handleHistoryItemClick(event) {
  const button = event.target.closest("[data-history-index]");
  if (!button) {
    return;
  }

  const historyIndex = Number(button.dataset.historyIndex);
  const item = readScanHistory()[historyIndex];
  if (!item) {
    return;
  }

  const image = item.image || diseaseSampleImages[item.className] || diseaseSampleImages.HEALTHY_LEAF;
  const top = {
    className: item.className,
    probability: item.probability || 0,
  };

  renderPredictionDetail(top, {
    date: item.date,
    image,
  });
  resultPanel.classList.remove("hidden");
  showPage("history", { scroll: false });
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearScanHistory() {
  localStorage.removeItem(scanHistoryKey);
  renderScanHistory();
}

function handleAccountPanelClick(event) {
  if (event.target.closest("[data-account-edit]")) {
    showAccountEditForm();
  }
  if (event.target.closest("[data-farm-edit]")) {
    showFarmProfileForm();
  }
}

function showAccountEditForm() {
  accountForm?.classList.remove("is-saved");
  farmerNameInput?.focus();
  accountForm?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function loadFarmerAccount() {
  const account = readFarmerAccount();
  if (loginNameInput) loginNameInput.value = account.name || "";
  if (loginPhoneInput) loginPhoneInput.value = account.phone || "";
  if (farmerNameInput) farmerNameInput.value = account.name || "";
  if (farmerPhoneInput) farmerPhoneInput.value = account.phone || "";
  renderFarmerAccount(account);
  updateLoginGate(account);
  updateAccountDashboard();
}

function readFarmerAccount() {
  try {
    return JSON.parse(localStorage.getItem(farmerAccountKey) || "{}");
  } catch {
    return {};
  }
}

async function saveFarmerAccount(event) {
  event.preventDefault();
  const account = buildFarmerAccount({
    nameInput: farmerNameInput,
    phoneInput: farmerPhoneInput,
  });

  if (!validateFarmerAccount(account, farmerNameInput, farmerPhoneInput)) {
    return;
  }

  if (window.chomkaAccount?.linked) {
    try { await window.chomkaAccount.updateProfile({name:account.name}); showAccountSavedAlert(); }
    catch (error) { alert(error.message); }
    return;
  }
  saveAccountAndRefresh(account, { showSavedAlert: true });
}

function saveLoginAccount(event) {
  event.preventDefault();
  const account = buildFarmerAccount({
    nameInput: loginNameInput,
    phoneInput: loginPhoneInput,
  });

  if (!validateFarmerAccount(account, loginNameInput, loginPhoneInput, loginNote)) {
    return;
  }

  saveAccountAndRefresh(account, { showSavedAlert: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderFarmerAccount(account = {}) {
  const hasAccount = hasFarmerAccount(account);
  accountStatusBadge?.classList.toggle("registered", hasAccount);
  accountForm?.classList.toggle("is-saved", hasAccount);
  if (accountStatusBadge) {
    accountStatusBadge.textContent = hasAccount ? "បានចុះឈ្មោះ" : "មិនទាន់ចុះឈ្មោះ";
  }

  if (!accountSummary) {
    return;
  }

  if (!hasAccount) {
    accountSummary.innerHTML = `
      <span class="profile-avatar-wrap">
        ${renderProfileAvatar()}
        <button class="avatar-camera-button" type="button" data-account-edit aria-label="កែប្រែគណនី">
          ${renderCameraIcon()}
        </button>
      </span>
      <div class="profile-details">
        <strong>មិនទាន់មានព័ត៌មានកសិករ</strong>
        <p>បញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទ រួចចុចរក្សាទុក។</p>
      </div>
      <button class="account-outline-button account-edit-button" type="button" data-account-edit>
        ${renderEditIcon()}
        <span>បញ្ចូលគណនី</span>
      </button>
    `;
    return;
  }

  const name = escapeHtml(account.name || "ម្ចាស់ចម្ការ");
  const phone = escapeHtml(account.phone || "");
  const updatedAt = formatDateLong(account.updatedAt);
  const status = navigator.onLine ? "Online" : "Offline";
  accountSummary.innerHTML = `
    <span class="profile-avatar-wrap">
      ${renderProfileAvatar("filled")}
      <button class="avatar-camera-button" type="button" data-account-edit aria-label="កែប្រែគណនី">
        ${renderCameraIcon()}
      </button>
    </span>
    <div class="profile-details">
      <strong>${name}</strong>
      <div class="profile-meta-list">
        <span>${renderPhoneIcon()}លេខទូរស័ព្ទ: ${phone}</span>
        <span>${renderCalendarIcon()}បានកែចុងក្រោយ: ${updatedAt}</span>
        <span><i class="online-dot" aria-hidden="true"></i>គណនី: ${status}</span>
      </div>
    </div>
    <button class="account-outline-button account-edit-button" type="button" data-account-edit>
      ${renderEditIcon()}
      <span>កែប្រែគណនី</span>
    </button>
  `;
}

function renderProfileAvatar(extraClass = "") {
  const className = ["profile-avatar", extraClass].filter(Boolean).join(" ");
  return `
    <span class="${className}" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="7.6" r="3.25" fill="none" stroke="currentColor" stroke-width="2"></circle>
        <path d="M5.2 20c.7-4.1 3.2-6.2 6.8-6.2s6.1 2.1 6.8 6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
        <path d="M8.5 14.9c1 .7 2.2 1.1 3.5 1.1s2.5-.4 3.5-1.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>
      </svg>
    </span>
  `;
}

function buildFarmerAccount({ nameInput, phoneInput }) {
  const previous = readFarmerAccount();
  return {
    name: nameInput?.value.trim() || "",
    phone: phoneInput?.value.trim() || "",
    createdAt: previous.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function validateFarmerAccount(account, nameInput, phoneInput, noteTarget) {
  if (!account.name) {
    if (noteTarget) {
      noteTarget.textContent = "សូមបញ្ចូលឈ្មោះកសិករជាមុនសិន។";
    }
    nameInput?.focus();
    return false;
  }

  if (!account.phone) {
    if (noteTarget) {
      noteTarget.textContent = "សូមបញ្ចូលលេខទូរស័ព្ទជាមុនសិន។";
    }
    phoneInput?.focus();
    return false;
  }

  return true;
}

function saveAccountAndRefresh(account, options = {}) {
  localStorage.removeItem(farmerLogoutKey);
  localStorage.setItem(farmerAccountKey, JSON.stringify(account));
  loadFarmerAccount();
  if (options.showSavedAlert) {
    showAccountSavedAlert();
  }
}

function showAccountSavedAlert() {
  if (!accountSaveAlert) {
    return;
  }

  accountSaveAlert.classList.remove("hidden");
  window.clearTimeout(showAccountSavedAlert.timer);
  showAccountSavedAlert.timer = window.setTimeout(() => {
    accountSaveAlert.classList.add("hidden");
  }, 1900);
}

function updateAccountDashboard() {
  const history = readScanHistory();
  if (accountScanCount) {
    accountScanCount.textContent = String(history.length);
  }
  if (accountReportCount) {
    accountReportCount.textContent = String(history.length);
  }

  const last = history[0];
  if (last) {
    const label = khmerLabels[last.className] ?? last.className;
    const confidence = Math.round((last.probability || 0) * 100);
    if (accountLastResult) {
      accountLastResult.textContent = `${label} ${confidence}%`;
    }
    if (accountLastResultDate) {
      accountLastResultDate.textContent = formatScanDate(last.date);
    }
    if (accountLastInspectTime) {
      accountLastInspectTime.textContent = formatTimeOnly(last.date);
    }
    if (accountLastInspectDate) {
      accountLastInspectDate.textContent = formatDateLong(last.date);
    }
  } else {
    if (accountLastResult) {
      accountLastResult.textContent = "មិនទាន់មាន";
    }
    if (accountLastResultDate) {
      accountLastResultDate.textContent = "ចាប់ផ្តើមថតរូបស្លឹក";
    }
    if (accountLastInspectTime) {
      accountLastInspectTime.textContent = "មិនទាន់មាន";
    }
    if (accountLastInspectDate) {
      accountLastInspectDate.textContent = "ចាប់ផ្តើមពិនិត្យស្លឹក";
    }
  }

  renderFarmProfile();
}

function getDefaultFarmProfile() {
  const account = readFarmerAccount();
  const location = getSelectedWeatherLocation();
  return {
    name: hasFarmerAccount(account) ? `ចម្ការទុរេន ${account.name}` : "Smart Chomka Durian Farm",
    location: location ? `${location.name} - ${location.note}` : "ជ្រើសទីតាំងអាកាសធាតុ",
    crop: "Durian",
    variety: "Monthong",
    trees: "120",
    area: "2.5 ហិកតា",
    age: "4 ឆ្នាំ",
    irrigation: "ទឹកអូតូ / IoT",
  };
}

function readFarmProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem(farmProfileKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getFarmProfile() {
  if (window.chomkaAccount?.linked) return readFarmProfile();
  return {
    ...getDefaultFarmProfile(),
    ...readFarmProfile(),
  };
}

function loadFarmProfile() {
  const profile = getFarmProfile();
  fillFarmProfileForm(profile);
  renderFarmProfile(profile);
}

function fillFarmProfileForm(profile = getFarmProfile()) {
  if (farmProfileNameInput) farmProfileNameInput.value = profile.name || "";
  if (farmProfileLocationInput) farmProfileLocationInput.value = profile.location || "";
  if (farmProfileCropInput) farmProfileCropInput.value = profile.crop || "";
  if (farmProfileVarietyInput) farmProfileVarietyInput.value = profile.variety || "";
  if (farmProfileTreesInput) farmProfileTreesInput.value = String(profile.trees || "").replace(/[^\d.]/g, "");
  if (farmProfileAreaInput) farmProfileAreaInput.value = profile.area || "";
  if (farmProfileAgeInput) farmProfileAgeInput.value = profile.age || "";
  if (farmProfileIrrigationInput) farmProfileIrrigationInput.value = profile.irrigation || "";
}

function renderFarmProfile(profile = getFarmProfile()) {
  const empty = "មិនទាន់បញ្ចូល";
  if (farmInfoName) farmInfoName.textContent = profile.name || empty;
  if (farmInfoLocation) farmInfoLocation.textContent = profile.location || "ជ្រើសទីតាំងអាកាសធាតុ";
  if (farmInfoCrop) farmInfoCrop.textContent = profile.crop || empty;
  if (farmInfoVariety) farmInfoVariety.textContent = profile.variety || empty;
  if (farmInfoTrees) {
    const trees = String(profile.trees || "").replace(/\s*ដើម$/u, "").trim();
    farmInfoTrees.textContent = trees ? `${trees} ដើម` : empty;
  }
  if (farmInfoArea) farmInfoArea.textContent = profile.area || empty;
  if (farmInfoAge) farmInfoAge.textContent = profile.age || empty;
  if (farmInfoIrrigation) farmInfoIrrigation.textContent = profile.irrigation || empty;
}

function showFarmProfileForm() {
  fillFarmProfileForm();
  farmProfileForm?.classList.remove("hidden");
  farmProfileCard?.classList.add("is-editing");
  farmProfileForm?.scrollIntoView({ behavior: "smooth", block: "center" });
  farmProfileNameInput?.focus();
}

async function saveFarmProfile(event) {
  event.preventDefault();
  const profile = {
    name: farmProfileNameInput?.value.trim() || "",
    location: farmProfileLocationInput?.value.trim() || "",
    crop: farmProfileCropInput?.value.trim() || "Durian",
    variety: farmProfileVarietyInput?.value.trim() || "",
    trees: farmProfileTreesInput?.value.trim() || "",
    area: farmProfileAreaInput?.value.trim() || "",
    age: farmProfileAgeInput?.value.trim() || "",
    irrigation: farmProfileIrrigationInput?.value.trim() || "",
    updatedAt: new Date().toISOString(),
  };

  if (window.chomkaAccount?.linked) {
    try { await window.chomkaAccount.updateProfile({farm:profile}); }
    catch (error) { alert(error.message); return; }
  }
  localStorage.setItem(farmProfileKey, JSON.stringify(profile));
  farmProfileForm?.classList.add("hidden");
  farmProfileCard?.classList.remove("is-editing");
  renderFarmProfile({ ...getDefaultFarmProfile(), ...profile });
  showAccountSavedAlert();
}

function readFarmCare() {
  try {
    const stored = JSON.parse(localStorage.getItem(farmCareKey) || "[]");
    if (Array.isArray(stored)) {
      return stored;
    }
    if (hasFarmCareEntry(stored)) {
      return [stored];
    }
    return [];
  } catch {
    return [];
  }
}

function loadFarmCare() {
  farmCareForm?.reset();
  renderFarmCare(readFarmCare());
  renderScanHistory();
}

function saveFarmCare(event) {
  event.preventDefault();
  const care = {
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
    waterStatus: waterStatusInput?.value || "",
    lastSpray: lastSprayInput?.value || "",
    nextCheck: nextCheckInput?.value || "",
    cropStage: cropStageInput?.value || "",
    note: farmNoteInput?.value.trim() || "",
    updatedAt: new Date().toISOString(),
  };

  if (!hasFarmCareEntry(care)) {
    if (farmCareStatus) {
      farmCareStatus.classList.remove("registered");
      farmCareStatus.textContent = "សូមបញ្ចូលចំណាំ";
    }
    farmNoteInput?.focus();
    return;
  }

  const notes = [care, ...readFarmCare()].slice(0, 30);
  localStorage.setItem(farmCareKey, JSON.stringify(notes));
  farmCareForm?.reset();
  renderFarmCare(notes);
  renderScanHistory();
}

function hasFarmCareEntry(care = {}) {
  return Boolean(care.waterStatus || care.lastSpray || care.nextCheck || care.cropStage || care.note);
}

function renderFarmCare(notes = []) {
  const entries = Array.isArray(notes) ? notes : [];
  const hasCare = entries.length > 0;
  if (farmCareStatus) {
    farmCareStatus.classList.toggle("registered", hasCare);
    farmCareStatus.textContent = hasCare ? `${entries.length} កំណត់ចំណាំ` : "មិនទាន់រក្សាទុក";
  }

  if (!farmCareSummary) {
    return;
  }

  if (!hasCare) {
    farmCareSummary.innerHTML = "<p>មិនទាន់មានកំណត់ចំណាំចម្ការ។</p>";
    return;
  }

  farmCareSummary.innerHTML = `
    ${entries
      .map((care, index) => renderFarmCareNote(care, index))
      .join("")}
  `;
}

function renderFarmCareNote(care = {}, index = 0) {
  const details = [
    ["ស្ថានភាពទឹក", care.waterStatus],
    ["ថ្ងៃបាញ់ថ្នាំចុងក្រោយ", care.lastSpray],
    ["ថ្ងៃពិនិត្យបន្ទាប់", care.nextCheck],
    ["ដំណាក់កាលដំណាំ", care.cropStage],
  ].filter(([, value]) => value);

  return `
    <article class="farm-note-card">
      <div>
        <span class="farm-note-title">
          <strong>កំណត់ចំណាំ ${index + 1}</strong>
          <small>${formatScanDate(care.updatedAt)}</small>
        </span>
        <button class="note-delete-button" type="button" data-delete-note-index="${index}" aria-label="លុបកំណត់ចំណាំ ${index + 1}">
          ${renderTrashIcon()}
        </button>
      </div>
      ${care.note ? `<p>${escapeHtml(care.note)}</p>` : ""}
      ${details.length ? `<dl>${details.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}
    </article>
  `;
}

function handleFarmCareDelete(event) {
  const button = event.target.closest("[data-delete-note-index]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.deleteNoteIndex);
  const notes = readFarmCare();
  if (!Number.isInteger(index) || index < 0 || index >= notes.length) {
    return;
  }

  notes.splice(index, 1);
  localStorage.setItem(farmCareKey, JSON.stringify(notes));
  renderFarmCare(notes);
  renderScanHistory();
}

function exportFarmerData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "Smart Chomka",
    account: readFarmerAccount(),
    farmCare: readFarmCare(),
    scanHistory: readScanHistory(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `smart-chomka-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resetFarmerAccount() {
  const shouldReset = window.confirm("តើអ្នកចង់ចាកចេញ និងលុបព័ត៌មានគណនីពីទូរស័ព្ទនេះមែនទេ?");
  if (!shouldReset) {
    return;
  }

  localStorage.removeItem(farmerAccountKey);
  localStorage.removeItem(farmerLogoutKey);
  loadFarmerAccount();
  showPage("home", { scroll: false });
}

async function logoutFarmerAccount() {
  if (window.chomkaAccount?.current || window.chomkaAccount?.linked) {
    try { await window.chomkaAccount.logout(); updateLoginGate({}); }
    catch (error) { alert(error.message); }
    return;
  }
  if (!hasFarmerAccount(readFarmerAccount())) {
    updateLoginGate({});
    return;
  }

  localStorage.setItem(farmerLogoutKey, "1");
  updateLoginGate(readFarmerAccount());
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hasFarmerAccount(account = {}) {
  return Boolean(account.name && account.phone);
}

function updateLoginGate(account = {}) {
  const isLoggedOut = localStorage.getItem(farmerLogoutKey) === "1";
  const hasAccount = hasFarmerAccount(account) && !isLoggedOut;
  document.body.classList.toggle("login-required", !hasAccount);
  if (loginNote) {
    loginNote.textContent = hasAccount
      ? "គណនីបានរក្សាទុក។ អ្នកអាចប្រើ App បានហើយ។"
      : "ព័ត៌មានរក្សាទុកក្នុងទូរស័ព្ទនេះ និងអាចប្រើបាន Offline។";
  }
}

function formatScanDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "ថ្ងៃនេះ";
  }

  return new Intl.DateTimeFormat("km-KH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateLong(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "ថ្ងៃនេះ";
  }

  return new Intl.DateTimeFormat("km-KH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeOnly(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "មិនទាន់មាន";
  }

  return new Intl.DateTimeFormat("km-KH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderFarmerSummary(className) {
  const summary = farmerSummaries[className];
  if (!summary) {
    return "";
  }

  return `
    <section class="farmer-summary ${summary.tone}">
      <div class="summary-dot" aria-hidden="true"></div>
      <div>
        <strong>${summary.title}</strong>
        <p>${summary.message}</p>
        <p><b>ត្រូវធ្វើ:</b> ${summary.action}</p>
      </div>
    </section>
  `;
}

function isPredictionConfident(top) {
  return (top?.probability || 0) >= PREDICTION_CONFIDENCE_THRESHOLD;
}

function renderConfidenceAdvice(top) {
  const confidence = Math.round((top.probability || 0) * 100);
  const trustedPercent = Math.round(PREDICTION_CONFIDENCE_THRESHOLD * 100);
  const level = isPredictionConfident(top) ? "strong" : "low";
  const title = isPredictionConfident(top)
    ? "លទ្ធផលនេះអាចប្រើជាជំហានដំបូង"
    : "AI មិនទាន់ប្រាកដ";
  const message = isPredictionConfident(top)
    ? `ភាពជឿជាក់លើស ${trustedPercent}%។ សូមប្រៀបធៀបជាមួយរូបឧទាហរណ៍ និងពិនិត្យស្លាកថ្នាំមុនសម្រេចចិត្ត។`
    : `ភាពជឿជាក់ទាបជាង ${trustedPercent}%។ កុំប្រើលទ្ធផលនេះសម្រាប់បាញ់ថ្នាំភ្លាមៗ សូមថតរូបថ្មីឲ្យច្បាស់ជាងនេះ។`;

  return `
    <section class="confidence-advice ${level}">
      <div>
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <span>${confidence}%</span>
    </section>
  `;
}

function renderPredictionComparison(top, detail = {}) {
  const label = khmerLabels[top.className] ?? top.className;
  const confidence = Math.round((top.probability || 0) * 100);
  const farmerImage = detail.image || previewImage?.src || diseaseSampleImages[top.className] || diseaseSampleImages.HEALTHY_LEAF;
  const examples = diseaseExampleImages[top.className] || [diseaseSampleImages[top.className]].filter(Boolean);
  if (!farmerImage || !examples.length) {
    return "";
  }

  const confidentCopy = isPredictionConfident(top)
    ? "រូបខាងឆ្វេងគឺរូបស្លឹករបស់បង។ រូបខាងស្តាំគឺឧទាហរណ៍ពី dataset សម្រាប់ជំងឺដូចគ្នា។"
    : "AI នៅមិនទាន់ប្រាកដ។ សូមមើលថារូបរបស់បងស្រដៀងឧទាហរណ៍ទាំងនេះទេ ហើយថតរូបថ្មីបើមិនច្បាស់។";

  return `
    <section class="prediction-compare-card ${isPredictionConfident(top) ? "" : "low-confidence"}">
      <div class="prediction-compare-heading">
        <div>
          <h3>ប្រៀបធៀបរូបភាព</h3>
          <p>${confidentCopy}</p>
        </div>
        <span>${confidence}%</span>
      </div>
      <div class="prediction-compare-grid">
        <figure class="farmer-photo">
          <img src="${escapeAttribute(farmerImage)}" alt="រូបស្លឹកដែលកសិករបញ្ចូល">
          <figcaption>រូបរបស់បង</figcaption>
        </figure>
        ${examples.slice(0, 3).map((image, index) => `
          <figure>
            <img src="${escapeAttribute(image)}" alt="${escapeAttribute(label)} example ${index + 1}">
            <figcaption>ឧទាហរណ៍ ${index + 1}: ${escapeHtml(label)}</figcaption>
          </figure>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRetakePhotoPanel(top) {
  const label = khmerLabels[top.className] ?? top.className;
  return `
    <section class="retake-photo-panel">
      <h3>សូមថតរូបម្តងទៀត</h3>
      <p>AI ឃើញថារូបនេះប្រហែលស្រដៀង <b>${escapeHtml(label)}</b> ប៉ុន្តែមិនគ្រប់ ${Math.round(PREDICTION_CONFIDENCE_THRESHOLD * 100)}% ទេ។</p>
      <ul>
        <li>ថតស្លឹកឲ្យពេញរូប និងមិនព្រិល។</li>
        <li>ប្រើពន្លឺធម្មជាតិ កុំឲ្យស្រមោល ឬពន្លឺខ្លាំងពេកលើស្លឹក។</li>
        <li>ថត 2-3 សន្លឹកពីដើមដូចគ្នា៖ ស្លឹកខាងមុខ ខាងក្រោយ និងស្លឹកជុំវិញ។</li>
        <li>បើស្នាមរាលដាលលឿន ឬប៉ះពាល់ផ្លែ សូមសួរមន្ត្រីកសិកម្មមុនប្រើថ្នាំ។</li>
      </ul>
    </section>
  `;
}

function renderFieldActionPlan(className, recommendation) {
  const plan = buildFieldActionPlan(className, recommendation);
  return `
    <section class="field-action-plan">
      <div class="section-heading compact">
        <div>
          <h3>ផែនការធ្វើក្នុងចម្ការ</h3>
          <p>ជំហានងាយៗសម្រាប់កសិករធ្វើតាមបន្ទាប់ពី AI ពិនិត្យ។</p>
        </div>
      </div>
      <div class="action-step-grid">
        ${plan.map((step, index) => `
          <article>
            <span>${index + 1}</span>
            <strong>${step.title}</strong>
            <p>${step.body}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function buildFieldActionPlan(className, recommendation) {
  if (className === "HEALTHY_LEAF") {
    return [
      {
        title: "ថ្ងៃនេះ",
        body: "មិនចាំបាច់បាញ់ថ្នាំ។ រក្សាកំណត់ត្រា ហើយពិនិត្យស្លឹកខ្ចីនៅចុងមែក។",
      },
      {
        title: "ថែទាំជាប្រចាំ",
        body: "កាត់មែកដែលបិទជិត ឲ្យខ្យល់ចេញចូល និងរក្សាសំណើមដីឲ្យស្មើ។",
      },
      {
        title: "ពិនិត្យម្តងទៀត",
        body: "ថតរូបស្លឹកម្ដងទៀតក្រោយ 7 ថ្ងៃ ឬបន្ទាប់ពីភ្លៀងខ្លាំង។",
      },
    ];
  }

  const medicineNames = recommendation.medicines?.length
    ? recommendation.medicines.map((item) => item.name).slice(0, 3).join(", ")
    : "ថ្នាំមិនមែនជាជំហានដំបូង";
  const firstAction = recommendation.actions?.[0] || "ពិនិត្យស្លឹក និងរោគសញ្ញាជុំវិញដើម។";
  const secondAction = recommendation.actions?.[1] || "កាត់បន្ថយសំណើម និងរក្សាខ្យល់ចេញចូល។";
  const expertTrigger = className === "ALLOCARIDARA_ATTACK"
    ? "បើស្លឹកខ្ចីកោងច្រើន ឬឃើញសត្វល្អិតរាលដាលលើដើមជាច្រើន សូមសួរអ្នកជំនាញកសិកម្ម។"
    : "បើស្នាមរាលដាលលឿន មានស្លឹកជ្រុះច្រើន ឬប៉ះពាល់ផ្លែ សូមសួរអ្នកជំនាញកសិកម្ម។";

  return [
    {
      title: "ថ្ងៃនេះ",
      body: `${firstAction} ${secondAction}`,
    },
    {
      title: "មុនបាញ់ថ្នាំ",
      body: `ពិនិត្យថ្នាំដែល App បង្ហាញដូចជា ${medicineNames}។ អានស្លាក/QR ពាក់ PPE និងកុំបាញ់ពេលខ្យល់ ឬភ្លៀង។`,
    },
    {
      title: "ក្រោយ 3-7 ថ្ងៃ",
      body: "ថតរូបស្លឹកម្តងទៀត ប្រៀបធៀបលទ្ធផល និងកត់ចំណាំក្នុងគណនី។",
    },
    {
      title: "ពេលគួរសុំជំនួយ",
      body: expertTrigger,
    },
  ];
}

function renderVoicePanel() {
  return `
    <section class="voice-panel">
      <div>
        <h3>សំឡេងជំនួយកសិករ</h3>
        <p>សម្រាប់កសិករដែលអានមិនសូវបាន សូមចុចប៊ូតុងនេះឲ្យទូរស័ព្ទអានលទ្ធផលជាសំឡេងធម្មជាតិ។</p>
      </div>
      <div class="voice-actions">
        <button class="voice-button primary" id="speakResultButton" type="button">
          ${renderSpeakerIcon()}
          <span>ស្តាប់លទ្ធផល</span>
        </button>
        <button class="voice-button" id="stopVoiceButton" type="button">
          ${renderStopIcon()}
          <span>បញ្ឈប់សំឡេង</span>
        </button>
      </div>
      <p class="voice-status" id="voiceStatus">App នឹងជ្រើសសំឡេងខ្មែរល្អបំផុតដែលមានក្នុងទូរស័ព្ទ។</p>
    </section>
  `;
}

function bindVoiceControls() {
  document.querySelector("#speakResultButton")?.addEventListener("click", speakResult);
  document.querySelector("#stopVoiceButton")?.addEventListener("click", stopVoice);
}

function updateOnlineAdvisorMode(isOnline = navigator.onLine) {
  const hasOnlineAdvisor = Boolean(onlineAiAskUrl || realtimeSessionUrl);
  onlineAdvisorPanel?.classList.toggle("is-online", isOnline);
  onlineAdvisorPanel?.classList.toggle("is-offline", !isOnline);
  onlineAdvisorPanel?.classList.toggle("is-listening", liveTalkListening);

  if (onlineAdvisorBadge) {
    onlineAdvisorBadge.classList.toggle("registered", isOnline);
    onlineAdvisorBadge.textContent = isOnline ? "Online" : "Offline";
  }

  if (onlineAdvisorStatus) {
    onlineAdvisorStatus.textContent = isOnline && hasOnlineAdvisor
      ? "Online។ AI ចម្ការអាចឆ្លើយសំណួរទូទៅ អំពីជំងឺ ថ្នាំ ជី និងចម្ការទុរេន។"
      : isOnline
        ? "Online។ App នឹងប្រើចំណេះដឹងក្នុង App ប្រសិនបើ Cloud AI មិនទាន់ភ្ជាប់។"
        : "Offline។ Guide AI នៅតែឆ្លើយពីចំណេះដឹងក្នុង App។ មីក្រូស្គាល់សំឡេងអាចខុសគ្នាតាមទូរស័ព្ទ។";
  }

  updateOnlineAdvisorUrlHint();
}

function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function isNativeCapacitorApp() {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.())
      || window.Capacitor?.getPlatform?.() === "android";
  } catch (error) {
    return false;
  }
}

function getNativeSpeechRecognitionPlugin() {
  return window.Capacitor?.Plugins?.SpeechRecognition || null;
}

async function hasNativeSpeechPermission(plugin) {
  try {
    const current = await plugin.checkPermissions?.();
    if (current?.speechRecognition === "granted") {
      return true;
    }

    const requested = await plugin.requestPermissions?.();
    return requested?.speechRecognition === "granted";
  } catch (error) {
    console.warn("Native speech permission check failed", error);
    return false;
  }
}

function getBestNativeSpeechMatch(result) {
  if (!Array.isArray(result?.matches)) {
    return "";
  }

  return result.matches
    .map((match) => String(match || "").trim())
    .find(Boolean) || "";
}

function clearNativeSpeechQuietTimer() {
  if (nativeSpeechQuietTimer) {
    window.clearTimeout(nativeSpeechQuietTimer);
    nativeSpeechQuietTimer = null;
  }
}

async function stopNativeSpeechCapture() {
  const plugin = nativeSpeechActivePlugin || getNativeSpeechRecognitionPlugin();
  try {
    await plugin?.stop?.();
  } catch (error) {
    console.warn("Native speech recognition stop failed", error);
  }
}

function getBestNativeSpeechText(matches = []) {
  if (!Array.isArray(matches)) {
    return "";
  }

  return matches
    .map((match) => String(match || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .sort((first, second) => second.length - first.length)[0] || "";
}

function rememberNativeSpeechText(matches = []) {
  const heard = getBestNativeSpeechText(matches);
  if (!heard || heard.length < nativeSpeechCollectedText.length) {
    return nativeSpeechCollectedText;
  }

  nativeSpeechCollectedText = heard;
  setLiveTalkTranscript("អ្នក", nativeSpeechCollectedText);
  return nativeSpeechCollectedText;
}

function removeNativeSpeechListeners() {
  const handles = [nativeSpeechPartialHandle, nativeSpeechStateHandle];
  nativeSpeechPartialHandle = null;
  nativeSpeechStateHandle = null;
  handles.forEach((handle) => {
    handle?.remove?.()?.catch?.((error) => console.warn("Native speech listener cleanup failed", error));
  });
}

function scheduleNativeSpeechFinish(sessionId, delayMs = 1100) {
  clearNativeSpeechQuietTimer();
  nativeSpeechQuietTimer = window.setTimeout(() => {
    void (async () => {
      await stopNativeSpeechCapture();
      finishNativeSpeechQuestion(sessionId);
    })();
  }, delayMs);
}

function finishNativeSpeechQuestion(sessionId) {
  if (sessionId !== nativeSpeechSessionId) {
    return;
  }

  clearNativeSpeechQuietTimer();
  removeNativeSpeechListeners();
  liveTalkListening = false;
  resetLiveTalkHoldState();
  onlineAdvisorPanel?.classList.remove("is-listening");

  const question = nativeSpeechCollectedText.trim();
  nativeSpeechCollectedText = "";
  nativeSpeechRestartCount = 0;
  nativeSpeechActivePlugin = null;

  if (!question) {
    updateLiveTalkStatus("មិនទាន់ស្តាប់ឃើញសំណួរទេ។ សូមចុចមីក្រូ ហើយនិយាយម្តងទៀត។");
    return;
  }

  updateLiveTalkStatus("បានស្តាប់រួច។ AI កំពុងស្វែងរក...");
  answerLiveTalkQuestion(question);
}

async function beginNativeSpeechPass(nativeSpeechRecognition, sessionId) {
  if (sessionId !== nativeSpeechSessionId) {
    return;
  }

  try {
    await nativeSpeechRecognition.start({
      language: "km-KH",
      maxResults: 5,
      prompt: "សួរ AI ចម្ការ",
      popup: false,
      partialResults: true,
    });
  } catch (error) {
    console.warn("Native speech recognition pass failed", error);
    if (nativeSpeechCollectedText.trim()) {
      scheduleNativeSpeechFinish(sessionId, 400);
    } else {
      finishNativeSpeechQuestion(sessionId);
    }
  }
}

function loadOnlineAdvisorSettings() {
  if (onlineAdvisorUrlInput) {
    onlineAdvisorUrlInput.value = onlineAiAskUrl;
  }
  updateOnlineAdvisorUrlHint();
}

function saveOnlineAdvisorUrl(event) {
  event.preventDefault();
  const nextUrl = normalizeOnlineAiUrl(onlineAdvisorUrlInput?.value || "");
  if (!nextUrl) {
    showOnlineAdvisorUrlHint("សូមបញ្ចូល URL ដែលចាប់ផ្តើមដោយ http:// ឬ https://", true);
    return;
  }

  onlineAiAskUrl = nextUrl;
  try {
    localStorage.setItem(onlineAiAskUrlStorageKey, nextUrl);
  } catch (error) {
    console.warn("Could not save online AI URL", error);
  }

  showOnlineAdvisorUrlHint("បានរក្សាទុក Online AI URL។ សូមចុច សាកល្បង ដើម្បីពិនិត្យ backend។");
  updateOnlineAdvisorMode();
}

function resetOnlineAdvisorUrl() {
  try {
    localStorage.removeItem(onlineAiAskUrlStorageKey);
  } catch (error) {
    console.warn("Could not reset online AI URL", error);
  }

  onlineAiAskUrl = resolveOnlineAiAskUrl();
  if (onlineAdvisorUrlInput) {
    onlineAdvisorUrlInput.value = onlineAiAskUrl;
  }
  showOnlineAdvisorUrlHint("បានលុប URL ផ្ទាល់ខ្លួន។ App នឹងប្រើការកំណត់ស្វ័យប្រវត្តិវិញ។");
  updateOnlineAdvisorMode();
}

async function testOnlineAdvisorConnection() {
  const candidateUrl = normalizeOnlineAiUrl(onlineAdvisorUrlInput?.value || onlineAiAskUrl);
  if (!candidateUrl) {
    showOnlineAdvisorUrlHint("មិនទាន់មាន Online AI URL សម្រាប់សាកល្បងទេ។", true);
    return;
  }

  showOnlineAdvisorUrlHint("កំពុងពិនិត្យ backend...");
  if (testOnlineAdvisorButton) {
    testOnlineAdvisorButton.disabled = true;
  }

  try {
    const response = await fetch(getOnlineAdvisorHealthUrl(candidateUrl), {
      method: "GET",
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || `Backend returned ${response.status}`);
    }

    onlineAiAskUrl = candidateUrl;
    try {
      localStorage.setItem(onlineAiAskUrlStorageKey, candidateUrl);
    } catch {
      // Saving is helpful, but connection testing can still succeed without it.
    }
    if (onlineAdvisorUrlInput) {
      onlineAdvisorUrlInput.value = candidateUrl;
    }
    updateOnlineAdvisorMode();
    showOnlineAdvisorUrlHint(
      data.pdfGuideReady
        ? `ភ្ជាប់បាន។ PDF និង ${data.textModel || liveTalkModelRecommendation.primary} ត្រៀមរួច។`
        : "ភ្ជាប់បាន ប៉ុន្តែ backend មិនទាន់រកឃើញ PDF។",
      !data.pdfGuideReady
    );
  } catch (error) {
    console.warn("Online AI health check failed", error);
    showOnlineAdvisorUrlHint("មិនទាន់ភ្ជាប់បានទេ។ សូមបើក backend និងពិនិត្យ IP/Port/WiFi។", true);
  } finally {
    if (testOnlineAdvisorButton) {
      testOnlineAdvisorButton.disabled = false;
    }
  }
}

function getOnlineAdvisorHealthUrl(askUrl) {
  const healthUrl = new URL(askUrl);
  if (/\/api\/farm-ai\/?$/i.test(healthUrl.pathname)) {
    healthUrl.searchParams.set("health", "1");
    healthUrl.hash = "";
    return healthUrl.href;
  }
  healthUrl.pathname = healthUrl.pathname.replace(/\/ask\/?$/i, "/health");
  if (!/\/health\/?$/i.test(healthUrl.pathname)) {
    healthUrl.pathname = "/health";
  }
  healthUrl.search = "";
  healthUrl.hash = "";
  return healthUrl.href;
}

function updateOnlineAdvisorUrlHint() {
  if (onlineAdvisorUrlInput && onlineAdvisorUrlInput.value !== onlineAiAskUrl) {
    onlineAdvisorUrlInput.value = onlineAiAskUrl;
  }

  if (!onlineAdvisorUrlHint) {
    return;
  }

  const mode = onlineAiAskUrl
    ? "Online AI ត្រៀមភ្ជាប់ពេលមានអ៊ីនធឺណិត។"
    : "No-backend mode: App ប្រើ Guide AI ក្នុង APK ជំនួស Online backend។";
  showOnlineAdvisorUrlHint(mode, false);
}

function showOnlineAdvisorUrlHint(message, isError = false) {
  if (!onlineAdvisorUrlHint) {
    return;
  }

  onlineAdvisorUrlHint.textContent = message;
  onlineAdvisorUrlHint.classList.toggle("is-error", Boolean(isError));
}

function bindLiveTalkButton() {
  if (!startLiveTalkButton) {
    return;
  }

  const beginHold = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    liveTalkSuppressNextClick = true;
    try {
      startLiveTalkButton.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is only a convenience; the mic still works without it.
    }

    if (liveTalkListening) {
      stopLiveTalk();
      return;
    }

    liveTalkPressActive = true;
    liveTalkHoldMode = true;
    startLiveTalkButton.classList.add("is-pressed");
    setHoldMicButtonLabel("កំពុងបើក");
    updateLiveTalkStatus("ចុចជាប់... កំពុងបើកមីក្រូ។ លែងដៃពេលនិយាយចប់។");
    void startLiveTalk({ hold: true });
  };

  const endHold = (event) => {
    if (!liveTalkPressActive) {
      return;
    }

    event.preventDefault();
    liveTalkPressActive = false;
    startLiveTalkButton.classList.remove("is-pressed");
    setHoldMicButtonLabel("កំពុងផ្ញើ");

    if (typeof liveTalkReleaseHandler === "function") {
      liveTalkReleaseHandler();
      return;
    }

    if (liveTalkListening) {
      stopLiveTalk();
    }
  };

  const cancelHold = (event) => {
    if (!liveTalkPressActive) {
      return;
    }

    event.preventDefault();
    liveTalkPressActive = false;
    startLiveTalkButton.classList.remove("is-pressed");
    setHoldMicButtonLabel("ចុចឲ្យជាប់");
    stopLiveTalk();
  };

  startLiveTalkButton.addEventListener("pointerdown", beginHold);
  startLiveTalkButton.addEventListener("pointerup", endHold);
  startLiveTalkButton.addEventListener("pointercancel", cancelHold);
  window.addEventListener("pointerup", endHold);
  window.addEventListener("pointercancel", cancelHold);
  startLiveTalkButton.addEventListener("lostpointercapture", () => {
    startLiveTalkButton.classList.remove("is-pressed");
  });

  startLiveTalkButton.addEventListener("click", (event) => {
    if (liveTalkSuppressNextClick) {
      event.preventDefault();
      liveTalkSuppressNextClick = false;
      return;
    }

    void startLiveTalk({ hold: false });
  });

  startLiveTalkButton.addEventListener("keydown", (event) => {
    if (![" ", "Enter"].includes(event.key) || liveTalkPressActive) {
      return;
    }

    event.preventDefault();
    liveTalkPressActive = true;
    liveTalkHoldMode = true;
    startLiveTalkButton.classList.add("is-pressed");
    setHoldMicButtonLabel("កំពុងបើក");
    void startLiveTalk({ hold: true });
  });

  startLiveTalkButton.addEventListener("keyup", (event) => {
    if (![" ", "Enter"].includes(event.key) || !liveTalkPressActive) {
      return;
    }

    endHold(event);
  });
}

function setHoldMicButtonLabel(label) {
  const labelNode = startLiveTalkButton?.querySelector("span");
  if (labelNode) {
    labelNode.textContent = label;
  }
}

function resetLiveTalkHoldState() {
  liveTalkHoldMode = false;
  liveTalkPressActive = false;
  liveTalkReleaseHandler = null;
  startLiveTalkButton?.classList.remove("is-pressed");
  setHoldMicButtonLabel("ចុចឲ្យជាប់");
}

async function startLiveTalk(options = {}) {
  if (liveTalkListening) {
    stopLiveTalk();
    return;
  }

  liveTalkHoldMode = Boolean(options.hold);
  liveTalkReleaseHandler = null;
  stopVoice();

  if (realtimeConnected) {
    stopOpenAIRealtimeTalk();
  }

  if (navigator.onLine && onlineAiAskUrl) {
    updateLiveTalkStatus(liveTalkHoldMode
      ? "កំពុងត្រៀមស្តាប់។ ចុចជាប់ ហើយលែងដៃពេលនិយាយចប់។"
      : "Online AI ត្រៀមស្តាប់។ អ្នកអាចសួរទូទៅអំពីចម្ការទុរេន ឬសួរពីលទ្ធផលរូបភាព។");
  }

  startLocalLiveTalk({ hold: liveTalkHoldMode });
}

function startLocalLiveTalk(options = {}) {
  const nativeSpeechRecognition = getNativeSpeechRecognitionPlugin();
  if (isNativeCapacitorApp() && nativeSpeechRecognition) {
    void startNativeLiveTalk(nativeSpeechRecognition, options);
    return;
  }

  startBrowserLiveTalk(options);
}

async function startNativeLiveTalk(nativeSpeechRecognition, options = {}) {
  if (liveTalkListening) {
    return;
  }

  try {
    const isHoldToTalk = Boolean(options.hold);
    await stopNativeSpeechCapture();

    const availability = await nativeSpeechRecognition.available();
    if (!availability?.available) {
      updateLiveTalkStatus("ទូរស័ព្ទនេះមិនមានសេវាស្គាល់សំឡេងទេ។ សូមបើក Google app/Speech Services ឬសរសេរសំណួរ។");
      return;
    }

    const permitted = await hasNativeSpeechPermission(nativeSpeechRecognition);
    if (!permitted) {
      updateLiveTalkStatus("សូមអនុញ្ញាត Microphone ដើម្បីនិយាយជាមួយ AI។");
      return;
    }

    nativeSpeechSessionId += 1;
    const currentSessionId = nativeSpeechSessionId;
    nativeSpeechCollectedText = "";
    nativeSpeechRestartCount = 0;
    nativeSpeechActivePlugin = nativeSpeechRecognition;
    clearNativeSpeechQuietTimer();
    removeNativeSpeechListeners();
    liveTalkListening = true;
    onlineAdvisorPanel?.classList.add("is-listening");
    setHoldMicButtonLabel(isHoldToTalk ? "កំពុងស្តាប់" : "ចុចឲ្យជាប់");
    updateLiveTalkStatus(isHoldToTalk
      ? "កំពុងស្តាប់... ចុចជាប់ ហើយលែងដៃពេលនិយាយចប់។"
      : "កំពុងស្តាប់... និយាយសំណួរ ហើយផ្អាកខ្លីៗដើម្បីផ្ញើ។");

    liveTalkReleaseHandler = () => {
      if (currentSessionId !== nativeSpeechSessionId) {
        return;
      }

      updateLiveTalkStatus("លែងដៃរួច។ AI កំពុងស្វែងរក...");
      setHoldMicButtonLabel("កំពុងផ្ញើ");
      scheduleNativeSpeechFinish(currentSessionId, nativeSpeechCollectedText.trim() ? 150 : 500);
    };

    nativeSpeechPartialHandle = await nativeSpeechRecognition.addListener("partialResults", (data) => {
      if (currentSessionId !== nativeSpeechSessionId) {
        return;
      }

      const heard = rememberNativeSpeechText(data?.matches || []);
      if (heard) {
        updateLiveTalkStatus(isHoldToTalk
          ? "កំពុងស្តាប់... លែងដៃដើម្បីផ្ញើសំណួរ។"
          : "កំពុងស្តាប់... ឈប់និយាយប្រហែល ១ វិនាទី App នឹងផ្ញើសំណួរ។");
        if (!isHoldToTalk) {
          scheduleNativeSpeechFinish(currentSessionId, 1000);
        }
      }
    });

    nativeSpeechStateHandle = await nativeSpeechRecognition.addListener("listeningState", (data) => {
      if (currentSessionId !== nativeSpeechSessionId) {
        return;
      }

      if (data?.status === "started") {
        onlineAdvisorPanel?.classList.add("is-listening");
        setHoldMicButtonLabel(isHoldToTalk ? "កំពុងស្តាប់" : "ចុចឲ្យជាប់");
        updateLiveTalkStatus(isHoldToTalk
          ? "កំពុងស្តាប់... លែងដៃពេលនិយាយចប់។"
          : "កំពុងស្តាប់... អាចនិយាយយឺតៗបាន។");
        return;
      }

      if (data?.status === "stopped" && liveTalkListening) {
        if (isHoldToTalk) {
          if (liveTalkPressActive && nativeSpeechRestartCount < 2) {
            nativeSpeechRestartCount += 1;
            window.setTimeout(() => {
              void beginNativeSpeechPass(nativeSpeechRecognition, currentSessionId);
            }, 250);
            return;
          }

          scheduleNativeSpeechFinish(currentSessionId, nativeSpeechCollectedText.trim() ? 150 : 450);
          return;
        }

        if (nativeSpeechCollectedText.trim()) {
          scheduleNativeSpeechFinish(currentSessionId, 450);
          return;
        }

        if (nativeSpeechRestartCount < 2) {
          nativeSpeechRestartCount += 1;
          window.setTimeout(() => {
            void beginNativeSpeechPass(nativeSpeechRecognition, currentSessionId);
          }, 250);
        } else if (!nativeSpeechCollectedText.trim()) {
          finishNativeSpeechQuestion(currentSessionId);
        }
      }
    });

    await beginNativeSpeechPass(nativeSpeechRecognition, currentSessionId);
    if (isHoldToTalk && !liveTalkPressActive) {
      liveTalkReleaseHandler?.();
    }
  } catch (error) {
    console.warn("Native speech recognition failed", error);
    clearNativeSpeechQuietTimer();
    removeNativeSpeechListeners();
    liveTalkListening = false;
    nativeSpeechActivePlugin = null;
    resetLiveTalkHoldState();
    onlineAdvisorPanel?.classList.remove("is-listening");
    updateLiveTalkStatus("មិនអាចប្រើមីក្រូក្នុង APK បានទេ។ សូមពិនិត្យ permission របស់ App ឬសរសេរសំណួរ។");
  }
}

function startBrowserLiveTalk(options = {}) {
  const SpeechRecognition = getSpeechRecognitionConstructor();
  if (!SpeechRecognition) {
    resetLiveTalkHoldState();
    updateLiveTalkStatus("ទូរស័ព្ទនេះមិនគាំទ្រមីក្រូស្គាល់សំឡេងក្នុង WebView ទេ។ សូមប្រើប៊ូតុងសំណួររហ័សខាងក្រោម ឬបើកជា Chrome/PWA។");
    return;
  }

  if (liveTalkListening) {
    return;
  }

  liveTalkRecognizer = new SpeechRecognition();
  liveTalkRecognizer.lang = "km-KH";
  liveTalkRecognizer.interimResults = true;
  liveTalkRecognizer.continuous = false;
  const isHoldToTalk = Boolean(options.hold);
  let browserSpeechText = "";
  let browserSpeechAnswered = false;
  let browserSpeechQuietTimer = null;

  const clearBrowserQuietTimer = () => {
    if (browserSpeechQuietTimer) {
      window.clearTimeout(browserSpeechQuietTimer);
      browserSpeechQuietTimer = null;
    }
  };

  const finishBrowserSpeechQuestion = () => {
    if (browserSpeechAnswered) {
      return;
    }

    browserSpeechAnswered = true;
    clearBrowserQuietTimer();
    liveTalkListening = false;
    liveTalkRecognizer = null;
    resetLiveTalkHoldState();
    onlineAdvisorPanel?.classList.remove("is-listening");
    const question = browserSpeechText.trim();

    if (!question) {
      updateLiveTalkStatus("មិនទាន់ស្តាប់ឃើញសំណួរទេ។ សូមចុចមីក្រូ ហើយនិយាយម្តងទៀត។");
      return;
    }

    updateLiveTalkStatus("បានស្តាប់រួច។ AI កំពុងស្វែងរក...");
    answerLiveTalkQuestion(question);
  };

  const scheduleBrowserSpeechFinish = (delayMs = 1000) => {
    clearBrowserQuietTimer();
    browserSpeechQuietTimer = window.setTimeout(() => {
      try {
        liveTalkRecognizer?.stop?.();
      } catch (error) {
        console.warn("Speech recognition stop failed", error);
      }
      finishBrowserSpeechQuestion();
    }, delayMs);
  };

  liveTalkReleaseHandler = () => {
    if (browserSpeechAnswered) {
      return;
    }

    clearBrowserQuietTimer();
    updateLiveTalkStatus("លែងដៃរួច។ AI កំពុងស្វែងរក...");
    setHoldMicButtonLabel("កំពុងផ្ញើ");
    try {
      liveTalkRecognizer?.stop?.();
    } catch (error) {
      console.warn("Speech recognition stop failed", error);
    }
    window.setTimeout(finishBrowserSpeechQuestion, browserSpeechText.trim() ? 180 : 520);
  };

  liveTalkRecognizer.onstart = () => {
    liveTalkListening = true;
    onlineAdvisorPanel?.classList.add("is-listening");
    setHoldMicButtonLabel(isHoldToTalk ? "កំពុងស្តាប់" : "ចុចឲ្យជាប់");
    updateLiveTalkStatus(isHoldToTalk
      ? "កំពុងស្តាប់... ចុចជាប់ ហើយលែងដៃពេលនិយាយចប់។"
      : "កំពុងស្តាប់... និយាយសំណួរ ហើយផ្អាកខ្លីៗដើម្បីផ្ញើ។");
  };

  liveTalkRecognizer.onresult = (event) => {
    let interim = "";
    let finalText = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal) {
        finalText += result[0].transcript;
      } else {
        interim += result[0].transcript;
      }
    }

    const heard = (finalText || interim).trim();
    if (heard) {
      if (heard.length >= browserSpeechText.length) {
        browserSpeechText = heard;
      }
      setLiveTalkTranscript("អ្នក", heard);
      updateLiveTalkStatus(isHoldToTalk
        ? "កំពុងស្តាប់... លែងដៃដើម្បីផ្ញើសំណួរ។"
        : "កំពុងស្តាប់... ឈប់និយាយប្រហែល ១ វិនាទី App នឹងផ្ញើសំណួរ។");
      if (!isHoldToTalk) {
        scheduleBrowserSpeechFinish(finalText.trim() ? 450 : 1000);
      }
    }
  };

  liveTalkRecognizer.onerror = (event) => {
    clearBrowserQuietTimer();
    liveTalkListening = false;
    liveTalkRecognizer = null;
    resetLiveTalkHoldState();
    onlineAdvisorPanel?.classList.remove("is-listening");
    updateLiveTalkStatus(event.error === "not-allowed"
      ? "សូមអនុញ្ញាត Microphone ដើម្បីនិយាយជាមួយ AI។"
      : "មិនអាចស្តាប់សំឡេងបានទេ។ សូមសាកល្បងម្តងទៀត ឬប្រើសំណួររហ័ស។");
  };

  liveTalkRecognizer.onend = () => {
    clearBrowserQuietTimer();
    liveTalkListening = false;
    liveTalkRecognizer = null;
    resetLiveTalkHoldState();
    onlineAdvisorPanel?.classList.remove("is-listening");
    if (!browserSpeechAnswered && browserSpeechText.trim()) {
      finishBrowserSpeechQuestion();
    }
  };

  try {
    liveTalkRecognizer.start();
  } catch (error) {
    console.warn("Speech recognition could not start", error);
    liveTalkListening = false;
    liveTalkRecognizer = null;
    resetLiveTalkHoldState();
    onlineAdvisorPanel?.classList.remove("is-listening");
    updateLiveTalkStatus("មិនអាចចាប់ផ្តើមមីក្រូបានទេ។ សូមសាកល្បងម្តងទៀត។");
  }
}

async function startOpenAIRealtimeTalk() {
  if (realtimeConnected && realtimeDataChannel?.readyState === "open") {
    updateLiveTalkStatus("Live AI កំពុងភ្ជាប់រួចហើយ។ សូមនិយាយសំណួររបស់បង។");
    return true;
  }

  if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
    return false;
  }

  updateLiveTalkStatus(`កំពុងភ្ជាប់ទៅ ${liveTalkModelRecommendation.realtime}...`);

  try {
    stopOpenAIRealtimeTalk();

    realtimeMicrophoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    realtimePeerConnection = new RTCPeerConnection();
    realtimeAudioElement = realtimeAudioElement || document.createElement("audio");
    realtimeAudioElement.autoplay = true;
    realtimeAudioElement.playsInline = true;
    realtimeAudioElement.className = "sr-only";
    if (!realtimeAudioElement.isConnected) {
      document.body.appendChild(realtimeAudioElement);
    }

    realtimePeerConnection.ontrack = (event) => {
      realtimeAudioElement.srcObject = event.streams[0];
    };

    realtimeMicrophoneStream.getAudioTracks().forEach((track) => {
      realtimePeerConnection.addTrack(track, realtimeMicrophoneStream);
    });

    realtimeDataChannel = realtimePeerConnection.createDataChannel("oai-events");
    realtimeDataChannel.onopen = () => {
      realtimeConnected = true;
      liveTalkListening = true;
      onlineAdvisorPanel?.classList.add("is-listening");
      updateLiveTalkStatus("Live AI កំពុងស្តាប់។ និយាយជាខ្មែរបានផ្ទាល់។");
      setLiveTalkTranscript("AI", "ខ្ញុំកំពុងស្តាប់សំណួររបស់បងអំពីចម្ការទុរេន។");
      sendRealtimeSessionInstructions();
    };
    realtimeDataChannel.onmessage = handleRealtimeServerEvent;
    realtimeDataChannel.onclose = () => {
      realtimeConnected = false;
      liveTalkListening = false;
      onlineAdvisorPanel?.classList.remove("is-listening");
      updateLiveTalkStatus("Live AI បានផ្តាច់។ App នៅតែអាចឆ្លើយ Offline ពី PDF បាន។");
    };

    const offer = await realtimePeerConnection.createOffer();
    await realtimePeerConnection.setLocalDescription(offer);

    const answerResponse = await fetch(realtimeSessionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp,
    });

    if (!answerResponse.ok) {
      throw new Error(`Realtime backend returned ${answerResponse.status}`);
    }

    const contentType = answerResponse.headers.get("content-type") || "";
    const answerBody = await answerResponse.text();
    const answerSdp = contentType.includes("application/json")
      ? JSON.parse(answerBody).sdp
      : answerBody;

    if (!answerSdp) {
      throw new Error("Realtime backend did not return SDP answer");
    }

    await realtimePeerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
    return true;
  } catch (error) {
    console.warn("OpenAI Realtime connection failed", error);
    stopOpenAIRealtimeTalk();
    updateLiveTalkStatus("មិនទាន់ភ្ជាប់ Live AI បានទេ។ App នឹងប្រើសំឡេង Offline ពីទិន្នន័យក្នុង App/PDF។");
    return false;
  }
}

function sendRealtimeSessionInstructions() {
  if (realtimeDataChannel?.readyState !== "open") {
    return;
  }

  realtimeDataChannel.send(JSON.stringify({
    type: "session.update",
    session: {
      instructions: createLiveTalkInstructions(),
    },
  }));
}

function createLiveTalkInstructions() {
  const latest = lastPredictionContext
    ? `លទ្ធផលចុងក្រោយគឺ ${khmerLabels[lastPredictionContext.top.className] ?? lastPredictionContext.top.className} មានភាពជឿជាក់ ${Math.round((lastPredictionContext.top.probability || 0) * 100)} ភាគរយ។ ${lastPredictionContext.isConfident ? "អាចប្រើជាជំហានដំបូង ប៉ុន្តែត្រូវផ្ទៀងផ្ទាត់ស្លាកថ្នាំ និងសួរអ្នកជំនាញសម្រាប់ករណីធ្ងន់។" : "លទ្ធផលនេះក្រោមកម្រិត 75% ដូច្នេះត្រូវប្រាប់កសិករថតរូបថ្មី មុននិយាយអំពីថ្នាំ។"}`
    : "មិនទាន់មានលទ្ធផលពិនិត្យស្លឹកចុងក្រោយទេ។";

  return [
    "You are Smart Chomka, a live Khmer voice assistant for Cambodian durian farmers.",
    "Speak in simple Khmer. Use short sentences. Be calm, practical, and farmer-friendly.",
    "Answer general durian orchard questions even when there is no uploaded image.",
    "Only use the latest prediction when the farmer asks about the last result, this leaf, this image, or treatment for the detected class.",
    "Do not claim to replace an agronomist. Encourage farmers to verify pesticide labels and ask local agriculture officers for severe cases.",
    "Use this PDF-derived guide context:",
    pdfGuideKnowledge.title,
    pdfGuideKnowledge.facts.join(" "),
    pdfGuideKnowledge.safety,
    buildPdfGuideTopicContext(),
    latest,
    "Main image model is the user's warm-started EfficientNetB0 10-class model: algal leaf spot, Allocariadara attack, anthracnose, canker disease, fruit rot, healthy leaf, leaf blight, mealybug infestation, Phomopsis leaf spot, and pink disease.",
    "Additional guide-only topics: Phytophthora root/foot rot, sooty mold, stem borer, fruit borer, thrips/mite damage, Rhizoctonia leaf blight, and Colletotrichum leaf spot.",
  ].join("\n");
}

function handleRealtimeServerEvent(event) {
  try {
    const data = JSON.parse(event.data);
    if (data.type === "conversation.item.input_audio_transcription.completed" && data.transcript) {
      setLiveTalkTranscript("អ្នក", data.transcript);
      return;
    }

    const transcript =
      data.transcript ||
      data.delta ||
      data.response?.output_text ||
      data.item?.content?.find?.((part) => part.transcript)?.transcript;

    if (data.type?.includes("transcript") && transcript) {
      lastLiveTalkAnswer = String(transcript);
      setLiveTalkTranscript("AI", lastLiveTalkAnswer);
    }
  } catch (error) {
    console.warn("Realtime event parse failed", error);
  }
}

function sendRealtimeTextQuestion(question) {
  if (!question || realtimeDataChannel?.readyState !== "open") {
    return false;
  }

  lastLiveTalkQuestion = question;
  liveTalkListening = true;
  onlineAdvisorPanel?.classList.add("is-listening");
  setLiveTalkTranscript("អ្នក", question);
  realtimeDataChannel.send(JSON.stringify({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: question }],
    },
  }));
  realtimeDataChannel.send(JSON.stringify({
    type: "response.create",
    response: {
      instructions: createLiveTalkInstructions(),
    },
  }));
  updateLiveTalkStatus("Live AI កំពុងឆ្លើយ...");
  return true;
}

function stopOpenAIRealtimeTalk() {
  realtimeConnected = false;
  realtimeDataChannel?.close?.();
  realtimePeerConnection?.close?.();
  realtimeMicrophoneStream?.getTracks?.().forEach((track) => track.stop());
  realtimeDataChannel = null;
  realtimePeerConnection = null;
  realtimeMicrophoneStream = null;
}

function stopLiveTalk() {
  nativeSpeechSessionId += 1;
  nativeSpeechCollectedText = "";
  nativeSpeechRestartCount = 0;
  clearNativeSpeechQuietTimer();
  removeNativeSpeechListeners();
  liveTalkListening = false;
  resetLiveTalkHoldState();
  onlineAdvisorPanel?.classList.remove("is-listening");
  try {
    liveTalkRecognizer?.stop?.();
  } catch (error) {
    console.warn("Speech recognition stop failed", error);
  }
  void stopNativeSpeechCapture();
  nativeSpeechActivePlugin = null;
  stopOpenAIRealtimeTalk();
  stopVoice();
  updateLiveTalkStatus("បានបញ្ឈប់ការនិយាយ។");
}

function repeatLiveTalkAnswer() {
  const text = lastLiveTalkAnswer || "សូមចុចចាប់ផ្តើមនិយាយ ឬជ្រើសសំណួររហ័សជាមុនសិន។";
  speakText(text, updateLiveTalkStatus);
}

function handleLiveTalkPromptClick(event) {
  const button = event.target.closest("[data-live-question]");
  if (!button) {
    return;
  }

  answerLiveTalkQuestion(button.dataset.liveQuestion || button.textContent.trim());
}

function handleLiveTalkTextSubmit(event) {
  event.preventDefault();
  const question = liveTalkTextInput?.value.trim();
  if (!question) {
    updateLiveTalkStatus("សូមសរសេរសំណួរខ្លីមួយសិន។");
    return;
  }

  if (liveTalkTextInput) {
    liveTalkTextInput.value = "";
  }
  answerLiveTalkQuestion(question);
}

function saveLocalAiSkill(event) {
  event.preventDefault();
  const question = localSkillQuestionInput?.value.trim();
  const answer = localSkillAnswerInput?.value.trim();
  if (!question || !answer) {
    updateLocalSkillStatus("សូមបញ្ចូលសំណួរ និងចម្លើយជាមុន។");
    return;
  }

  const skills = readLocalAiSkills();
  const nextSkill = {
    id: window.crypto?.randomUUID?.() || `skill-${Date.now()}`,
    question: question.slice(0, 180),
    answer: answer.slice(0, 900),
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(localAiSkillKey, JSON.stringify([nextSkill, ...skills].slice(0, 20)));
    localSkillForm?.reset();
    updateLocalSkillStatus("បានបង្រៀន AI រួច។");
    renderLocalAiSkills();
  } catch (error) {
    console.warn("Could not save local AI skill", error);
    updateLocalSkillStatus("មិនអាចរក្សាទុក skill បានទេ។");
  }
}

function handleLocalSkillListClick(event) {
  const deleteButton = event.target.closest("[data-delete-local-skill]");
  if (!deleteButton) {
    return;
  }

  const skillId = deleteButton.dataset.deleteLocalSkill;
  const nextSkills = readLocalAiSkills().filter((skill) => skill.id !== skillId);
  try {
    localStorage.setItem(localAiSkillKey, JSON.stringify(nextSkills));
    updateLocalSkillStatus("បានលុប skill រួច។");
    renderLocalAiSkills();
  } catch (error) {
    console.warn("Could not delete local AI skill", error);
    updateLocalSkillStatus("មិនអាចលុប skill បានទេ។");
  }
}

function readLocalAiSkills() {
  try {
    const parsed = JSON.parse(localStorage.getItem(localAiSkillKey) || "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter((skill) => skill?.question && skill?.answer)
          .map((skill) => ({
            id: String(skill.id || `skill-${Math.random()}`),
            question: String(skill.question).slice(0, 180),
            answer: String(skill.answer).slice(0, 900),
            createdAt: skill.createdAt || "",
          }))
      : [];
  } catch {
    return [];
  }
}

function renderLocalAiSkills() {
  const skills = readLocalAiSkills();
  if (localSkillStatus) {
    localSkillStatus.textContent = `${skills.length} skill`;
  }

  if (!localSkillList) {
    return;
  }

  if (!skills.length) {
    localSkillList.innerHTML = "<p>មិនទាន់មាន skill។ បង្រៀន AI ដោយសំណួរ និងចម្លើយខ្លីៗ។</p>";
    return;
  }

  localSkillList.innerHTML = skills
    .map((skill) => `
      <article>
        <div>
          <strong>${escapeHtml(skill.question)}</strong>
          <p>${escapeHtml(skill.answer)}</p>
        </div>
        <button type="button" data-delete-local-skill="${escapeAttribute(skill.id)}" aria-label="លុប skill">
          ${renderTrashIcon()}
        </button>
      </article>
    `)
    .join("");
}

function updateLocalSkillStatus(message) {
  if (localSkillStatus) {
    localSkillStatus.textContent = message;
  }
}

function findLocalAiSkillAnswer(question) {
  const skills = readLocalAiSkills();
  if (!skills.length) {
    return "";
  }

  const best = skills
    .map((skill) => ({
      skill,
      score: scoreLocalAiSkill(question, skill.question),
    }))
    .sort((left, right) => right.score - left.score)[0];

  if (!best || best.score < 0.34) {
    return "";
  }

  return `ចម្លើយពី skill ដែលបានបង្រៀនក្នុង App: ${best.skill.answer}`;
}

function findPdfGuideTopicAnswer(question) {
  const prompt = normalizeSkillText(question);
  if (!prompt) {
    return "";
  }

  const best = pdfGuideTopics
    .map((topic) => ({ topic, score: scorePdfGuideTopic(prompt, topic) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score < 0.24) {
    return "";
  }

  const { topic } = best;
  return [
    `${topic.title} (${topic.pages})។`,
    `រោគសញ្ញា: ${topic.symptoms}`,
    `ការណែនាំ: ${topic.actions}`,
    topic.medicine ? `ថ្នាំ ឬ ជី: ${topic.medicine}` : "",
    `ប្រភពចំណេះដឹង: ${topic.source || `${pdfGuideKnowledge.title} (${pdfGuideKnowledge.source})`}។`,
    "សូមអានស្លាកថ្នាំ/QR និងសួរមន្ត្រីកសិកម្មក្នុងតំបន់ បើរោគសញ្ញាធ្ងន់ ឬមិនប្រាកដ។",
  ].filter(Boolean).join(" ");
}

function scorePdfGuideTopic(prompt, topic) {
  const terms = [topic.title, ...(topic.keywords || [])]
    .map(normalizeSkillText)
    .filter(Boolean);

  if (!terms.length) {
    return 0;
  }

  if (terms.some((term) => prompt.includes(term) || term.includes(prompt))) {
    return 1;
  }

  const promptTerms = prompt.split(" ").filter((term) => term.length >= 2);
  const hits = terms.filter((term) => {
    const words = term.split(" ").filter((word) => word.length >= 2);
    return words.some((word) => promptTerms.includes(word) || prompt.includes(word));
  }).length;

  return hits / terms.length;
}

function scoreLocalAiSkill(question, skillQuestion) {
  const prompt = normalizeSkillText(question);
  const skill = normalizeSkillText(skillQuestion);
  if (!prompt || !skill) {
    return 0;
  }

  if (prompt.includes(skill) || skill.includes(prompt)) {
    return 1;
  }

  const terms = skill.split(" ").filter((term) => term.length >= 2);
  if (!terms.length) {
    const chunk = skill.slice(0, Math.min(8, skill.length));
    return chunk && prompt.includes(chunk) ? 0.7 : 0;
  }

  const hits = terms.filter((term) => prompt.includes(term)).length;
  return hits / Math.max(terms.length, 1);
}

function normalizeSkillText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"']/g, " ")
    .replace(/[។៕៖、，]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPdfGuideTopicContext() {
  return pdfGuideTopics
    .map((topic) => `${topic.title} (${topic.pages}) symptoms: ${topic.symptoms} actions: ${topic.actions}${topic.medicine ? ` medicine/fertilizer: ${topic.medicine}` : ""}`)
    .join("\n");
}

async function answerLiveTalkQuestion(question) {
  if (!question) {
    return;
  }

  lastLiveTalkQuestion = question;
  liveTalkListening = false;
  resetLiveTalkHoldState();
  onlineAdvisorPanel?.classList.remove("is-listening");
  try {
    liveTalkRecognizer?.stop?.();
  } catch {
    // The recognizer may already be stopped after a final result.
  }
  liveTalkRecognizer = null;
  stopOpenAIRealtimeTalk();

  setLiveTalkTranscript("អ្នក", question);
  rememberLiveTalkMessage("user", question);

  lastOnlineAdvisorProducts = [];
  const onlineResult = await askOnlinePdfAdvisor(question);
  const answer = onlineResult?.answer || buildOnlineAdvisorAnswer(question);
  lastOnlineAdvisorProducts = Array.isArray(onlineResult?.products) ? onlineResult.products : [];
  lastLiveTalkAnswer = answer;
  rememberLiveTalkMessage("assistant", answer);
  setLiveTalkTranscript("AI", answer, lastOnlineAdvisorProducts);
  await speakText(answer, updateLiveTalkStatus);
}

async function askOnlinePdfAdvisor(question) {
  if (!navigator.onLine || !onlineAiAskUrl) {
    return "";
  }

  setLiveTalkAiLoading("AI កំពុងស្វែងរក");
  updateLiveTalkStatus("AI កំពុងស្វែងរក");

  try {
    const response = await fetch(onlineAiAskUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        latestPrediction: buildLatestPredictionPayload(),
        history: liveTalkConversationHistory.slice(-6),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || `Online AI returned ${response.status}`);
    }

    const answer = String(data?.answer || "").trim();
    if (!answer) {
      throw new Error("Online AI returned an empty answer.");
    }

    updateLiveTalkStatus("AI ឆ្លើយរួចរាល់។");
    return {
      answer,
      products: Array.isArray(data?.products) ? data.products.slice(0, 6) : [],
    };
  } catch (error) {
    console.warn("Online PDF advisor failed", error);
    updateLiveTalkStatus("មិនអាចភ្ជាប់ Online AI បានទេ។ App នឹងប្រើចំណេះដឹង Offline ជំនួស។");
    return "";
  }
}

function buildLatestPredictionPayload() {
  if (!lastPredictionContext) {
    return null;
  }

  const { top, recommendation, summary } = lastPredictionContext;
  return {
    className: top.className,
    label: khmerLabels[top.className] ?? top.className,
    confidence: top.probability || 0,
    summary: summary?.message || recommendation.why || "",
    action: summary?.action || recommendation.actions?.[0] || "",
    medicines: (recommendation.medicines || []).map((item) => item.name),
  };
}

function rememberLiveTalkMessage(role, text) {
  liveTalkConversationHistory.push({
    role,
    text: String(text || "").slice(0, 700),
  });
  liveTalkConversationHistory = liveTalkConversationHistory.slice(-8);
}

function setLiveTalkTranscript(sender, text, products = []) {
  if (!liveTalkTranscript) {
    return;
  }

  if (sender !== "AI") {
    lastLiveTalkQuestion = text;
  }

  const questionCard = lastLiveTalkQuestion ? renderLiveTalkUserQuestion(lastLiveTalkQuestion) : "";
  const productCards = sender === "AI" && products.length ? renderLiveTalkProductCards(products) : "";
  liveTalkTranscript.innerHTML = sender === "AI"
    ? `${questionCard}${renderLiveTalkAiAnswer(text)}${productCards}`
    : questionCard;
}

function renderLiveTalkUserQuestion(text = "") {
  return `
    <div class="ai-user-message">
      <small>អ្នកសួរ</small>
      <p>${escapeHtml(cleanAiAnswerText(text))}</p>
    </div>
  `;
}

function renderLiveTalkAiAnswer(text = "") {
  const cleaned = cleanAiAnswerText(text);
  const tableCards = parseAiTableCards(cleaned);
  const sections = tableCards.length ? [] : parseAiAnswerSections(cleaned);

  if (tableCards.length) {
    return `
      <div class="ai-response-card">
        <div class="ai-response-header">
          <strong>AI ចម្ការ</strong>
          <span>ចម្លើយសង្ខេប</span>
        </div>
        <div class="ai-response-list ai-response-list-cards">
          ${tableCards.map(renderAiTableCard).join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="ai-response-card">
      <div class="ai-response-header">
        <strong>AI ចម្ការ</strong>
        <span>ចម្លើយសម្រាប់កសិករ</span>
      </div>
      <div class="ai-response-list">
        ${sections.map(renderAiAnswerSection).join("")}
      </div>
    </div>
  `;
}

function setLiveTalkAiLoading(message = "AI កំពុងស្វែងរក", state = "loading") {
  if (!liveTalkTranscript) {
    return;
  }

  liveTalkTranscript.innerHTML = `
    ${lastLiveTalkQuestion ? renderLiveTalkUserQuestion(lastLiveTalkQuestion) : ""}
    <div class="ai-response-card is-loading-answer" aria-live="polite">
      <div class="ai-response-header">
        <strong>AI ចម្ការ</strong>
        ${renderAiHeaderActivity(state, message)}
      </div>
      <div class="ai-response-list">
        <section class="ai-response-section">
          <h4>កំពុងរៀបចំចម្លើយ</h4>
          <ul>
            <li>AI កំពុងស្វែងរកចម្លើយដែលសមស្រប។</li>
            <li>សូមរង់ចាំបន្តិច ចម្លើយនឹងបង្ហាញនៅទីនេះ។</li>
          </ul>
        </section>
      </div>
    </div>
  `;
}

function renderAiHeaderActivity(state = "loading", message = "") {
  return `
    <div class="ai-voice-loading ${state === "speaking" ? "is-speaking" : "is-loading"}">
      <i class="ai-voice-spinner" aria-hidden="true"></i>
      <b>${escapeHtml(message || "កំពុងរៀបចំចម្លើយ...")}</b>
    </div>
  `;
}

const khmerAiTextFixes = [
  [/ជម្ងឺ/g, "ជំងឺ"],
  [/ដូរីយ៉ាន|ឌូរីយ៉ាន|ដូរីយ៉ែន|ឌូរៀន|ដូរៀន|ធុរេន/g, "ទុរេន"],
  [/កសិករទុរេន/g, "កសិករដាំទុរេន"],
  [/អេអាយ|អាយអាយ/g, "AI"],
  [/ភីអេចអាយ|ភី អេច អាយ/gi, "PHI"],
  [/អារ អ៊ី អាយ/gi, "REI"],
  [/ឃ្យូ អារ/gi, "QR"],
  [/ភូមូបស៊ីស|ហ្វូម៉ុបស៊ីស|ផូម៉ុបស៊ីស/gi, "Phomopsis"],
  [/អាឡូការីដារ៉ា/gi, "Allocaridara"],
  [/អាន់ត្រាក់ណូស/gi, "Anthracnose"],
  [/ផៃថុបថូរ៉ា|ហ្វៃថុបថូរ៉ា/gi, "Phytophthora"],
  [/ទឹកកកលើស្លឹក/g, "ទឹកជាប់លើស្លឹក"],
  [/សំភារៈ/g, "សម្ភារៈ"],
];

function normalizeKhmerAiDisplayText(text = "") {
  return khmerAiTextFixes.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    String(text || "")
  );
}

function cleanAiAnswerText(text = "") {
  return normalizeKhmerAiDisplayText(text)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/^AI\s*[:：]\s*/i, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^[\s>*•]+/gm, "")
    .replace(/\r/g, "")
    .replace(/\s*\|\s*/g, "\n")
    .replace(/^\s*:?-{3,}:?\s*$/gm, "")
    .replace(/(?:^|\n)[^\n។]*(?:ព័ត៌មាន|ចម្លើយ)[^\n។]{0,45}(?:មិនគ្រប់គ្រាន់|ខ្វះ|មិនទាន់គ្រប់គ្រាន់|មិនមានគ្រប់គ្រាន់)[^\n។]*(?:។)?/g, "")
    .replace(/(?:^|\n)[^\n.]*(?:not enough information|insufficient information|cannot answer from the context)[^\n.]*(?:\.)?/gi, "")
    .replace(/(^|\n)\s*[0-9០-៩]+[.)]\s*/g, "$1")
    .replace(/\s+[–—]\s+/g, ": ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseAiTableCards(text = "") {
  if (!text.includes("|")) {
    return [];
  }

  const parts = text
    .replace(/AI\s*[:：]/gi, "")
    .split("|")
    .map((part) => cleanAiTablePart(part))
    .filter((part) => part && !isAiTableNoise(part));

  const cards = [];
  for (let index = 0; index < parts.length; index += 1) {
    if (!isAiOrdinal(parts[index])) {
      continue;
    }

    const title = parts[index + 1] || "";
    if (!title || isAiTableNoise(title) || isAiOrdinal(title)) {
      continue;
    }

    const details = [];
    index += 2;
    while (index < parts.length && !isAiOrdinal(parts[index])) {
      details.push(...splitAiAdviceLines(parts[index]));
      index += 1;
    }
    index -= 1;

    cards.push({
      title,
      details: details.slice(0, 6),
    });
  }

  return cards.slice(0, 5);
}

function cleanAiTablePart(part = "") {
  return cleanAiAnswerText(part)
    .replace(/^-+\s*/g, "")
    .replace(/\s*-+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAiTableNoise(part = "") {
  const text = part.trim();
  if (!text || /^[-\s]+$/.test(text)) {
    return true;
  }

  return [
    "លេខ",
    "ល.រ",
    "រោគ",
    "រោគសញ្ញា",
    "ថ្នាំ",
    "វិធីសាស្ត្រ",
    "ការពារ",
    "វិធីសាស្ត្រ/ការពារ",
  ].includes(text);
}

function isAiOrdinal(value = "") {
  return /^[0-9០-៩១២៣៤៥៦៧៨۹]+[.)។]?$/u.test(String(value).trim());
}

function parseAiAnswerSections(text = "") {
  const normalized = cleanAiAnswerText(text)
    .replace(/AI\s*[:：]/gi, "")
    .replace(/\s*[-–—]\s*/g, "\n")
    .replace(/\s*[|]\s*/g, "\n")
    .trim();
  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = [];
  let current = { title: "សង្ខេប", lines: [] };

  for (const line of lines.length ? lines : [normalized]) {
    const sectionMatch = line.match(/^(.{2,28}?)[៖:]\s*(.*)$/u);
    if (sectionMatch && isAiSectionTitle(sectionMatch[1])) {
      if (current.lines.length) {
        sections.push(current);
      }
      current = {
        title: sectionMatch[1].trim(),
        lines: [],
      };
      if (sectionMatch[2]) {
        current.lines.push(...splitAiAdviceLines(sectionMatch[2]));
      }
      continue;
    }

    current.lines.push(...splitAiAdviceLines(line));
  }

  if (current.lines.length) {
    sections.push(current);
  }

  return sections.length
    ? sections.slice(0, 6).map((section) => ({
        ...section,
        lines: section.lines.slice(0, 5),
      }))
    : [{ title: "សង្ខេប", lines: ["សូមសួរម្តងទៀតឲ្យច្បាស់បន្តិច។"] }];
}

function isAiSectionTitle(value = "") {
  return /សង្ខេប|អ្វី|រោគ|ធ្វើ|ជំហាន|ថ្នាំ|ជី|សុវត្ថិភាព|ការពារ|ណែនាំ|មូលហេតុ/u.test(value);
}

function splitAiAdviceLines(text = "") {
  return cleanAiAnswerText(text)
    .replace(/(?:^|\s)([0-9០-៩]+)[.)]\s*/gu, "\n")
    .replace(/\s*;\s*/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/^[-–—•\s]+/u, "").trim())
    .filter((line) => line && !isAiTableNoise(line))
    .slice(0, 8);
}

function renderAiTableCard(card) {
  return `
    <article class="ai-response-mini-card">
      <h4>${escapeHtml(card.title)}</h4>
      ${card.details.length ? `<ul>${card.details.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}
    </article>
  `;
}

function renderAiAnswerSection(section) {
  return `
    <section class="ai-response-section">
      <h4>${escapeHtml(section.title)}</h4>
      <ul>${section.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
    </section>
  `;
}

function renderLiveTalkProductCards(products = []) {
  return `
    <div class="ai-chat-product-grid" aria-label="ផលិតផលពាក់ព័ន្ធ">
      ${products
        .map((item) => `
          <article class="ai-chat-product-card${item.image ? "" : " no-image"}">
            ${item.image ? `<img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.name || "ផលិតផល")}">` : ""}
            <div>
              <strong>${escapeHtml(item.name || "ផលិតផល")}</strong>
              <small>${escapeHtml(item.purpose || item.active || "សូមអានស្លាកមុនប្រើ")}</small>
              ${item.credit ? `<em>${escapeHtml(item.credit)}</em>` : ""}
            </div>
          </article>
        `)
        .join("")}
    </div>
  `;
}

function setLiveTalkVoiceActivity(state = "", message = "") {
  if (!liveTalkTranscript) {
    return;
  }

  liveTalkTranscript.querySelector(".ai-voice-loading")?.remove();
  if (!state) {
    return;
  }

  const status = document.createElement("div");
  status.className = `ai-voice-loading ${state === "speaking" ? "is-speaking" : "is-loading"}`;
  status.innerHTML = `
    <i class="ai-voice-spinner" aria-hidden="true"></i>
    <b>${escapeHtml(message || "កំពុងរៀបចំសំឡេង...")}</b>
  `;
  const header = liveTalkTranscript.querySelector(".ai-response-header");
  if (header) {
    header.append(status);
    return;
  }

  setLiveTalkAiLoading(message || "កំពុងរៀបចំសំឡេង...", state);
}

function updateLiveTalkStatus(message) {
  if (onlineAdvisorStatus) {
    onlineAdvisorStatus.textContent = message;
  }
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function isResultSpecificQuestion(text, kind = "") {
  if (["action", "medicine", "safety", "photo"].includes(kind)) {
    return true;
  }

  return includesAny(text, [
    "លទ្ធផល",
    "result",
    "prediction",
    "confidence",
    "ភាពជឿជាក់",
    "រូបនេះ",
    "ស្លឹកនេះ",
    "ជំងឺនេះ",
    "detected",
    "scan",
  ]);
}

function buildLowConfidenceResultAnswer(top) {
  const label = khmerLabels[top.className] ?? top.className;
  const confidence = Math.round((top.probability || 0) * 100);
  return `AI ឃើញថារូបនេះប្រហែលស្រដៀង ${label} ប៉ុន្តែភាពជឿជាក់មានតែ ${confidence}% ដែលក្រោម ${Math.round(PREDICTION_CONFIDENCE_THRESHOLD * 100)}%។ សូមថតរូបថ្មីឲ្យពេញស្លឹក ពន្លឺច្បាស់ មិនព្រិល ហើយពិនិត្យម្តងទៀត។ មុនពេលប្រើថ្នាំ សូមប្រៀបធៀបជាមួយរូបឧទាហរណ៍ក្នុង App ឬសួរមន្ត្រីកសិកម្ម។`;
}

function buildOnlineAdvisorAnswer(question) {
  const text = question.toLowerCase();
  const localSkillAnswer = findLocalAiSkillAnswer(question);
  if (localSkillAnswer) {
    return localSkillAnswer;
  }

  const pdfTopicAnswer = findPdfGuideTopicAnswer(question);
  if (pdfTopicAnswer) {
    return pdfTopicAnswer;
  }

  if (text.includes("backend") || text.includes("server") || text.includes("online ai") || text.includes("api")) {
    return "កំណែនេះប្រើ Guide AI ក្នុង App ដោយមិនបាច់ backend។ វាអាចពន្យល់លទ្ធផល ជំងឺ ថ្នាំ និងសុវត្ថិភាពពីទិន្នន័យដែលបានដាក់ជាមួយ APK។ GPT Online ពិតៗត្រូវការ server ដើម្បីការពារ API key។";
  }

  if (includesAny(text, ["សួស្តី", "hello", "hi", "អ្នកជា", "who are you", "អេអាយ", "ai ចម្ការ"])) {
    return "សួស្តីបង។ ខ្ញុំជា AI ចម្ការ ក្នុង Smart Chomka។ បងអាចសួរទូទៅអំពីចម្ការទុរេន ដូចជា ទឹក ជី កាត់មែក សត្វល្អិត ជំងឺ ថ្នាំ សុវត្ថិភាព ឬសួរពីលទ្ធផលរូបភាពដែលបានពិនិត្យ។";
  }

  if (includesAny(text, ["ប្រើ app", "របៀបប្រើ", "how to use", "use app", "ថតរូប", "នាំចូល"])) {
    return "របៀបប្រើ Smart Chomka: ១) ថតរូប ឬនាំចូលរូបស្លឹក/រោគសញ្ញាឲ្យច្បាស់ ២) ចុចពិនិត្យជំងឺ ៣) មើលលទ្ធផល ភាពជឿជាក់ និងការណែនាំ ៤) ស្តាប់សំឡេង ឬសួរ AI ចម្ការ ៥) រក្សាទុករបាយការណ៍ ដើម្បីមើលការផ្លាស់ប្តូរបន្ទាប់ពី ៥-៧ ថ្ងៃ។";
  }

  if (includesAny(text, ["class", "classes", "model", "ម៉ូដែល", "១០", "10", "ជំងឺអ្វីខ្លះ", "បែងចែក"])) {
    return "Smart Chomka ប្រើម៉ូដែល EfficientNetB0 ថ្មីសម្រាប់ ១០ ប្រភេទ៖ Algal leaf spot, Allocariadara attack, Anthracnose, Canker disease, Fruit rot, Healthy leaf, Leaf blight, Mealybug infestation, Phomopsis leaf spot និង Pink disease។ ម៉ូដែលនេះបាន warm-start ពីម៉ូដែលចាស់របស់អ្នក ហើយត្រូវបានបង្ហាត់បន្ថែមលើ dataset ធំជាងមុន។";
  }

  if (text.includes("pdf") || text.includes("ឯកសារ") || text.includes("មគ្គុទ្ទេសក៍") || text.includes("ប្រភព")) {
    return `${pdfGuideKnowledge.title} ជាប្រភពចំណេះដឹងក្នុង App។ App បានបញ្ចូល ${pdfGuideTopics.length} topic ពី PDF ដូចជា Thrips, Mealybug, ចៃក្រហម, ដង្កូវចោះផ្លែ, Phytophthora, Phomopsis, Pink disease និង Colletotrichum។ សង្ខេបសំខាន់គឺ ${pdfGuideKnowledge.facts.join(" ")} ${pdfGuideKnowledge.safety}`;
  }

  if (!lastPredictionContext && isResultSpecificQuestion(text)) {
    return "មិនទាន់មានលទ្ធផលរូបភាពចុងក្រោយទេ។ បងអាចថតរូប ឬនាំចូលរូបស្លឹក/រោគសញ្ញាទុរេនមួយសន្លឹក ដើម្បីឲ្យ AI ពិនិត្យ។ ទោះយ៉ាងណា បងនៅតែអាចសួរទូទៅអំពីទឹក ជី សត្វល្អិត ជំងឺ ឬសុវត្ថិភាពបាន។";
  }

  if (includesAny(text, ["iot", "esp32", "បូម", "pump", "valve", "វ៉ាល់", "remote", "បញ្ជា", "ប្រព័ន្ធទឹក"])) {
    return "សម្រាប់ IoT ស្រោចទឹក អាចប្រើ ESP32 គ្រប់គ្រងបូម និងវ៉ាល់តាម zone បាន។ កសិករគួរមាន mode Manual សម្រាប់បើកបិទភ្លាមៗ, Auto timer សម្រាប់ zone សកម្ម, sensor កម្រិតទឹកធុង និង safety delay ការពារបូម។ AI ជួយពិនិត្យជំងឺ; IoT ជួយគ្រប់គ្រងទឹកឲ្យស្មើ និងកាត់បន្ថយសំណើមលើស។";
  }

  if (includesAny(text, ["ជី", "fertilizer", "npk", "អាហារ", "ដាក់ជី"])) {
    return "ការដាក់ជីទុរេនគួរធ្វើតាមអាយុដើម ដំណាក់កាលលូតលាស់ និងស្ថានភាពដី។ ជាទូទៅ កុំដាក់ជីខ្លាំងពេលដើមកំពុងស្ត្រេស ឬដីស្ងួតខ្លាំង។ ស្រោចទឹកសមរម្យមុន/ក្រោយដាក់ជី និងកត់ចំណាំថ្ងៃដាក់ជីក្នុង App។ សម្រាប់កម្រិតជាក់លាក់ ត្រូវយោងលទ្ធផលវិភាគដី ឬសួរអ្នកជំនាញក្នុងតំបន់។";
  }

  if (includesAny(text, ["កាត់មែក", "prune", "pruning", "ខ្យល់", "គុម្ព", "ម្លប់"])) {
    return "ការកាត់មែកជួយឲ្យខ្យល់ចេញចូល និងបន្ថយសំណើម ដែលជួយកាត់បន្ថយជំងឺផ្សិត។ សូមកាត់មែកស្ងួត មែកជាន់គ្នា និងមែកដែលឆ្លងជំងឺ។ បន្ទាប់ពីកាត់ ត្រូវសម្អាតឧបករណ៍ ហើយកុំទុកស្លឹក/មែកឆ្លងក្រោមដើម។";
  }

  if (includesAny(text, ["ផ្កា", "flower", "ចេញផ្កា", "ផ្លែ", "fruit set", "ប្រមូលផល", "harvest"])) {
    return "ពេលទុរេនចេញផ្កា ឬកាន់ផ្លែ ត្រូវរក្សាទឹកឲ្យស្មើៗ កុំឲ្យដីស្ងួតខ្លាំង ហើយកុំបាញ់ថ្នាំដោយមិនចាំបាច់លើផ្កា។ ពេលជិតប្រមូលផល ត្រូវគោរព PHI លើស្លាកថ្នាំ និងកុំប្រើថ្នាំដែលមិនច្បាស់ប្រភព។";
  }

  if ((text.includes("ថ្នាំ") || text.includes("medicine") || text.includes("spray")) && !lastPredictionContext) {
    return `មុនជ្រើសថ្នាំ សូមពិនិត្យរោគសញ្ញាជាមុនសិន ព្រោះថ្នាំខុសប្រភេទអាចខាតលុយ និងប៉ះពាល់សុវត្ថិភាព។ ជម្រើសក្នុង App មាន Phomopsis/រលាកស្លឹក អាចពិចារណា NO COPPER ឬ ANUMANCO; Anthracnose/Colletotrichum អាចពិចារណា ANUMANCO ឬ TILT SUPER; Phytophthora/រលួយគល់-ឫស អាចពិចារណា FOLU, PERFECT 72%WP ឬ REVUS OPTI; សត្វល្អិតម្សៅ/ផ្សិតខ្មៅ/សត្វជញ្ជក់ អាចពិចារណា U-T, KON NEAK6, BUTA ឬ SRAKAR NEAK។ ត្រូវអានស្លាក/QR និងពាក់ PPE ជានិច្ច។`;
  }

  if (text.includes("ថ្ងៃនេះ") || text.includes("ធ្វើអ្វី") || text.includes("next") || text.includes("action")) {
    if (lastPredictionContext) {
      const { top, recommendation, summary } = lastPredictionContext;
      if (!isPredictionConfident(top)) {
        return buildLowConfidenceResultAnswer(top);
      }
      const label = khmerLabels[top.className] ?? top.className;
      return `ថ្ងៃនេះសម្រាប់ ${label}: ${summary?.action || recommendation.actions?.[0] || "ពិនិត្យស្លឹកបន្ថែម"} បន្ទាប់មកកត់ចំណាំក្នុង App ហើយថតស្លឹកម្តងទៀតក្រោយ 3-7 ថ្ងៃ។`;
    }
    return "ថ្ងៃនេះ សូមពិនិត្យចម្ការជុំវិញដើមទុរេន៖ មើលស្លឹកខ្ចី ខាងក្រោមស្លឹក ផ្លែ គល់ និងសំណើមដី។ ដកស្លឹក/ផ្លែខូចចេញ កត់ចំណាំក្នុង App ហើយបើឃើញរោគសញ្ញាច្បាស់ សូមថតរូបឲ្យ AI ពិនិត្យបន្ថែម។";
  }

  if (text.includes("ព្យាបាល") || text.includes("ដោះស្រាយ") || text.includes("solution") || text.includes("recover")) {
    return "ជំហានសំខាន់គឺ ១) ថតស្លឹកឲ្យច្បាស់ ហើយពិនិត្យជាមួយ AI ២) ដកស្លឹកឆ្លងធ្ងន់ចេញ ៣) កាត់មែកឲ្យខ្យល់ចេញចូល និងកុំឲ្យសំណើមកក ៤) ប្រើថ្នាំតែពេលរោគសញ្ញាច្បាស់ និងអានស្លាកជាមុន ៥) ថតរូបម្តងទៀតបន្ទាប់ពី ៥-៧ ថ្ងៃ។";
  }

  if (lastPredictionContext && (text.includes("លទ្ធផល") || text.includes("ជំងឺ") || text.includes("ថ្នាំ") || text.includes("ព្យាបាល"))) {
    const { top, recommendation, summary } = lastPredictionContext;
    if (!isPredictionConfident(top)) {
      return buildLowConfidenceResultAnswer(top);
    }
    const label = khmerLabels[top.className] ?? top.className;
    const medicineNames = recommendation.medicines.map((item) => item.name).slice(0, 3).join(", ");
    if (text.includes("ថ្នាំ") || text.includes("medicine")) {
      return medicineNames
        ? `${label}: អាចមើលថ្នាំដូចជា ${medicineNames}។ តាមមគ្គុទ្ទេសក៍ PDF ត្រូវអានស្លាក ឬ QR ពាក់ PPE និងសួរអ្នកជំនាញមុនប្រើ។`
        : `${label}: មិនចាំបាច់ប្រើថ្នាំទេ។ បន្តតាមដាន និងថែទាំសំណើមក្នុងគុម្ព។`;
    }
    return `${label}: ${summary?.action || recommendation.actions[0]} សូមថតស្លឹកច្រើនសន្លឹក ប្រសិនបើមិនប្រាកដ។ ចំណេះដឹងនេះភ្ជាប់ជាមួយមគ្គុទ្ទេសក៍ PDF ក្នុង App។`;
  }

  if (text.includes("ទឹក") || text.includes("ស្រោច") || text.includes("សំណើម") || text.includes("ភ្លៀង")) {
    return "សម្រាប់ទុរេន សូមរក្សាសំណើមដីឲ្យស្មើៗ កុំឲ្យទឹកជាំ។ កុំស្រោចលើស្លឹកពេលល្ងាច ព្រោះសំណើមខ្ពស់ធ្វើឲ្យជំងឺស្លឹករាលដាលងាយ។";
  }

  if (text.includes("បាញ់") || text.includes("សុវត្ថិភាព") || text.includes("ppe")) {
    return `${pdfGuideKnowledge.safety} ត្រូវអានស្លាកថ្នាំ និងគោរពពេលចូលចម្ការវិញ និងពេលប្រមូលផល។`;
  }

  if (text.includes("phomopsis") || text.includes("ផ្សិត") || text.includes("អុចស្លឹក")) {
    const item = recommendations.PHOMOPSIS_LEAF_SPOT;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} បើត្រូវប្រើថ្នាំ សូមផ្ទៀងផ្ទាត់ស្លាកជាមុន។`;
  }

  if (text.includes("សារាយ") || text.includes("algal")) {
    const item = recommendations.ALGAL_LEAF_SPOT;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} ជំងឺនេះកើតងាយនៅកន្លែងសើម និងមានម្លប់ច្រើន។`;
  }

  if (text.includes("រលាក") || text.includes("blight")) {
    const item = recommendations.LEAF_BLIGHT;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} សូមពិនិត្យស្លឹកជិតខាងផងដែរ។`;
  }

  if (
    (text.includes("សត្វ") || text.includes("allocaridara") || text.includes("ល្អិត"))
    && !text.includes("mealybug")
    && !text.includes("ម្សៅ")
  ) {
    const item = recommendations.ALLOCARIDARA_ATTACK;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} ប្រើថ្នាំសត្វល្អិតតែពេលឃើញសត្វល្អិតច្បាស់។`;
  }

  if (text.includes("anthracnose") || text.includes("អាន់ត្រាក់") || text.includes("colletotrichum")) {
    const item = recommendations.ANTHRACNOSE;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} បើចង់ប្រើថ្នាំ សូមផ្ទៀងផ្ទាត់ស្លាក និងប្រើ PPE ជាមុន។`;
  }

  if (text.includes("canker") || text.includes("ជ័រ") || text.includes("ដើម")) {
    const item = recommendations.CANKER_DISEASE;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} បើស្នាមធ្ងន់ សូមសួរអ្នកជំនាញមុនប្រើថ្នាំ។`;
  }

  if (text.includes("fruit rot") || text.includes("ផ្លែ") || text.includes("រលួយ")) {
    const item = recommendations.FRUIT_ROT;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} កុំទុកផ្លែរលួយក្រោមដើម ព្រោះអាចរាលដាល។`;
  }

  if (text.includes("mealybug") || text.includes("ម្សៅ") || text.includes("ស្រមោច")) {
    const item = recommendations.MEALYBUG_INFESTATION;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} ប្រើថ្នាំសត្វល្អិតតែពេលឃើញសត្វច្បាស់។`;
  }

  if (text.includes("pink") || text.includes("ផ្កាឈូក") || text.includes("មែក")) {
    const item = recommendations.PINK_DISEASE;
    return `${item.title}: ${item.actions[0]} ${item.actions[1]} ការបើកខ្យល់ក្នុងគុម្ពសំខាន់ណាស់។`;
  }

  return "ខ្ញុំអាចជួយឆ្លើយសំណួរទូទៅអំពីចម្ការទុរេនបាន ដូចជា ស្រោចទឹក ដាក់ជី កាត់មែក សត្វល្អិត ជំងឺ ថ្នាំ និងសុវត្ថិភាព។ សូមសួរឲ្យច្បាស់បន្តិច ឧ. “ស្លឹកលឿងត្រូវធ្វើអ្វី?”, “គួរស្រោចទឹកប៉ុន្មាន?”, ឬ “បាញ់ថ្នាំត្រូវការពារខ្លួនដូចម្តេច?”";
}

function renderChatbotPanel(className) {
  const label = khmerLabels[className] ?? className;
  const welcome = `ខ្ញុំជាជំនួយការតូចមួយសម្រាប់កសិករ។ លទ្ធផលពេលនេះគឺ ${label}។ អ្នកអាចសួរពីលទ្ធផលនេះ ឬសួរទូទៅអំពីទឹក ជី សត្វល្អិត ថ្នាំ និងសុវត្ថិភាព។`;

  return `
    <section class="chatbot-panel" aria-label="ជំនួយការឆ្លើយសំណួរ">
      <div class="chatbot-header">
        <div>
          <h3>ជំនួយការសួរឆ្លើយ</h3>
          <p>ចុចបើក បើអ្នកចង់សួរសំណួរខ្លីៗដោយមិនបាច់ប្រើអ៊ីនធឺណិត។</p>
        </div>
        <button class="chatbot-toggle" id="toggleChatbotButton" type="button" aria-expanded="false" aria-controls="chatbotBody">
          បើកជំនួយការ
        </button>
      </div>
      <div class="chatbot-body hidden" id="chatbotBody">
        <div class="chatbot-messages" id="chatbotMessages">
          ${renderChatMessage("bot", welcome)}
        </div>
        <div class="quick-questions">
          <button type="button" data-chat-kind="action">ត្រូវធ្វើអ្វី?</button>
          <button type="button" data-chat-kind="medicine">ប្រើថ្នាំអ្វី?</button>
          <button type="button" data-chat-kind="safety">ការពារពេលបាញ់ថ្នាំ?</button>
          <button type="button" data-chat-kind="photo">ថតរូបឲ្យច្បាស់?</button>
        </div>
        <form class="chatbot-form" id="chatbotForm">
          <input id="chatbotInput" type="text" autocomplete="off" placeholder="សរសេរសំណួរខ្លីៗ...">
          <button type="submit">សួរ</button>
        </form>
        <div class="chatbot-tools">
          <button class="voice-button" id="speakChatButton" type="button">
            ${renderSpeakerIcon()}
            <span>ស្តាប់ចម្លើយ</span>
          </button>
          <p class="voice-status" id="chatbotStatus">ជំនួយការនេះឆ្លើយតាមទិន្នន័យក្នុង app មិនមែនជាវេជ្ជបណ្ឌិតរុក្ខជាតិទេ។</p>
        </div>
      </div>
    </section>
  `;
}

function renderChatMessage(sender, text) {
  return `
    <div class="chat-message ${sender}">
      <span>${sender === "bot" ? "AI" : "អ្នក"}</span>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function renderPhoneIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4h10v16H7V4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
      <path d="M10 7h4M11 17h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
    </svg>
  `;
}

function renderCalendarIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 5h14v15H5V5zM8 3v4M16 3v4M5 10h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}

function renderEditIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h4l11-11a2.5 2.5 0 0 0-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
    </svg>
  `;
}

function renderCameraIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.5 7.2 9.1 5h5.8l1.6 2.2H19a2 2 0 0 1 2 2v8.1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.2a2 2 0 0 1 2-2h2.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
      <circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="2"></circle>
    </svg>
  `;
}

function renderSpeakerIcon() {
  return `
    <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"></path>
      <path d="M16 8.5a4 4 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
      <path d="M18.5 6a7 7 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
    </svg>
  `;
}

function renderSearchIcon() {
  return `
    <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" stroke-width="2"></circle>
      <path d="m15.2 15.2 4.8 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
    </svg>
  `;
}

function renderStopIcon() {
  return `
    <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"></circle>
      <path d="M6.2 17.8 17.8 6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>
    </svg>
  `;
}

function renderTrashIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
      <path d="M9 7V5h6v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
      <path d="M10 11v5M14 11v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
    </svg>
  `;
}

function setPredictButtonContent(label) {
  predictButton.innerHTML = `${renderSearchIcon()}<span>${label}</span>`;
}

function bindChatbotControls() {
  const toggleButton = document.querySelector("#toggleChatbotButton");
  const chatbotBody = document.querySelector("#chatbotBody");
  toggleButton?.addEventListener("click", () => {
    const isOpening = chatbotBody?.classList.contains("hidden");
    chatbotBody?.classList.toggle("hidden", !isOpening);
    toggleButton.textContent = isOpening ? "បិទជំនួយការ" : "បើកជំនួយការ";
    toggleButton.setAttribute("aria-expanded", String(Boolean(isOpening)));
  });

  document.querySelectorAll("[data-chat-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      askChatbot(button.textContent.trim(), button.dataset.chatKind);
    });
  });

  document.querySelector("#chatbotForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#chatbotInput");
    const question = input?.value.trim();
    if (!question) {
      return;
    }

    askChatbot(question);
    input.value = "";
  });

  document.querySelector("#speakChatButton")?.addEventListener("click", speakLatestChatAnswer);
}

function askChatbot(question, kind = "") {
  const messages = document.querySelector("#chatbotMessages");
  if (!messages) {
    return;
  }

  const answer = buildChatbotAnswer(question, kind);
  lastChatVoiceText = answer;
  messages.insertAdjacentHTML("beforeend", renderChatMessage("user", question));
  messages.insertAdjacentHTML("beforeend", renderChatMessage("bot", answer));
  messages.scrollTop = messages.scrollHeight;
  updateChatbotStatus("បានឆ្លើយហើយ។ ចុច “ស្តាប់ចម្លើយ” បើចង់ឲ្យទូរស័ព្ទអាន។");
}

function buildChatbotAnswer(question, kind = "") {
  const text = question.toLowerCase();

  if (!lastPredictionContext) {
    if (kind === "action") {
      return "ថ្ងៃនេះ សូមពិនិត្យស្លឹកខ្ចី ខាងក្រោមស្លឹក ផ្លែ គល់ និងសំណើមដី។ បើឃើញស្លឹក ឬផ្លែខូច សូមថតរូបឲ្យ AI ពិនិត្យ ហើយកត់ចំណាំក្នុង App។";
    }

    if (kind === "medicine") {
      return buildOnlineAdvisorAnswer("ប្រើថ្នាំអ្វី?");
    }

    if (kind === "safety") {
      return buildOnlineAdvisorAnswer("ការពារពេលបាញ់ថ្នាំ");
    }

    if (kind === "photo") {
      return "ថតរូបឲ្យច្បាស់ ដាក់ស្លឹកពេញកាមេរ៉ា មានពន្លឺល្អ កុំឲ្យព្រិល និងថតពីរ-បីសន្លឹកបើរោគសញ្ញាតូច។ អាចនាំចូលរូបពីទូរស័ព្ទក៏បាន។";
    }

    return buildOnlineAdvisorAnswer(question);
  }

  const { top, recommendation, summary } = lastPredictionContext;
  const label = khmerLabels[top.className] ?? top.className;

  if (!isResultSpecificQuestion(text, kind)) {
    return buildOnlineAdvisorAnswer(question);
  }

  if (!isPredictionConfident(top)) {
    return buildLowConfidenceResultAnswer(top);
  }

  if (kind === "action" || text.includes("ធ្វើ") || text.includes("ព្យាបាល")) {
    return `${label}: ${summary?.action || recommendation.actions[0]} សូមមើលស្លឹកច្រើនជាងមួយ និងកុំបាញ់ថ្នាំបើមិនប្រាកដ។`;
  }

  if (kind === "medicine" || text.includes("ថ្នាំ") || text.includes("medicine")) {
    if (!recommendation.medicines.length) {
      return "ស្លឹកមើលទៅល្អ។ មិនចាំបាច់ប្រើថ្នាំទេ បន្តតាមដាន និងថែទាំខ្យល់ចេញចូលក្នុងដើម។";
    }

    const names = recommendation.medicines.map((item) => item.name).slice(0, 3).join(", ");
    return `អាចពិនិត្យផ្នែក “ថ្នាំប្រើប្រាស់” ខាងក្រោម: ${names}។ ត្រូវអានស្លាក/QR ពាក់សម្ភារៈការពារ និងសួរអ្នកជំនាញមុនប្រើ។`;
  }

  if (kind === "safety" || text.includes("សុវត្ថិភាព") || text.includes("បាញ់")) {
    return "ពេលបាញ់ថ្នាំ ត្រូវពាក់ម៉ាស់ ស្រោមដៃ វ៉ែនតា អាវដៃវែង និងស្បែកជើងកវែង។ កុំបាញ់ពេលខ្យល់ខ្លាំង ភ្លៀង ឬថ្ងៃក្តៅខ្លាំង។ កុំឲ្យកុមារ និងសត្វចិញ្ចឹមនៅជិត។";
  }

  if (kind === "photo" || text.includes("ថត") || text.includes("រូប")) {
    return "ថតស្លឹកឲ្យពេញរូប មានពន្លឺច្បាស់ កុំឲ្យស្រមោលគ្របស្លឹក ហើយកុំឲ្យរូបព្រិល។ បើលទ្ធផលមិនច្បាស់ សូមថតស្លឹកមួយទៀតពីដើមដូចគ្នា។";
  }

  if (text.includes("ជំងឺ") || text.includes("អ្វី") || text.includes("លទ្ធផល")) {
    return `លទ្ធផល AI បង្ហាញថា ${label}។ ${summary?.message || recommendation.why}`;
  }

  return `សម្រាប់ ${label} សូមចាប់ផ្តើមពីនេះ: ${summary?.action || recommendation.actions[0]} បើចង់សួរងាយៗ សូមចុច “ត្រូវធ្វើអ្វី?”, “ប្រើថ្នាំអ្វី?” ឬ “ការពារពេលបាញ់ថ្នាំ?”។`;
}

async function speakLatestChatAnswer() {
  const text = lastChatVoiceText || "សូមសួរសំណួរជាមុនសិន។";
  await speakText(text, updateChatbotStatus);
}

function buildVoiceText(top, recommendation, summary) {
  const label = khmerLabels[top.className] ?? top.className;
  const confidence = Math.round((top.probability || 0) * 100);
  if (!isPredictionConfident(top)) {
    return [
      "សួស្តីបង។ ខ្ញុំបានពិនិត្យរូបស្លឹករួចហើយ ប៉ុន្តែ AI មិនទាន់ប្រាកដទេ។",
      `រូបនេះប្រហែលស្រដៀង ${label} ប៉ុន្តែភាពជឿជាក់មានតែប្រហែល ${confidence} ភាគរយ។`,
      "សូមកុំប្រើថ្នាំដោយផ្អែកលើលទ្ធផលនេះភ្លាមៗ។",
      "សូមថតរូបស្លឹកថ្មី ឲ្យពេញរូប មានពន្លឺច្បាស់ និងមិនព្រិល។",
      "បើអាច សូមថតពីរ ឬបីសន្លឹកពីដើមដូចគ្នា ហើយពិនិត្យម្តងទៀត។",
    ].join(" ");
  }

  const medicineLine = recommendation.medicines.length
    ? "បើបងត្រូវប្រើថ្នាំ សូមអានស្លាកឲ្យច្បាស់ ពាក់សម្ភារៈការពារ ហើយសួរអ្នកជំនាញជាមុនសិន។"
    : "ពេលនេះ មិនចាំបាច់ប្រើថ្នាំទេ បើបងមិនឃើញរោគសញ្ញាផ្សេង។";

  return [
    "សួស្តីបង។ ខ្ញុំបានពិនិត្យរូបស្លឹករួចហើយ។",
    `លទ្ធផលបង្ហាញថា ស្លឹកនេះអាចជា ${label}។`,
    `ភាពជឿជាក់ ប្រហែល ${confidence} ភាគរយ។`,
    summary?.message || "",
    summary?.action ? `ជំហានបន្ទាប់ សូម ${summary.action}` : "",
    medicineLine,
    "ពេលបាញ់ថ្នាំ សូមពាក់ម៉ាស់ ស្រោមដៃ វ៉ែនតា និងកុំបាញ់ពេលខ្យល់ខ្លាំង។",
    "បើបងមិនប្រាកដ សូមថតស្លឹកពីរ ឬបីសន្លឹកបន្ថែម ហើយពិនិត្យម្តងទៀត។",
  ]
    .filter(Boolean)
    .join(" ");
}

async function speakResult() {
  await speakText(lastVoiceText, updateVoiceStatus);
}

function beginVoicePlayback() {
  activeVoiceToken += 1;
  if (cloudVoiceController) {
    cloudVoiceController.abort();
    cloudVoiceController = null;
  }
  stopCloudVoiceAudio(false);
  window.speechSynthesis?.cancel?.();
  try {
    const nativeStop = window.Capacitor?.Plugins?.FarmerVoice?.stop?.();
    nativeStop?.catch?.((error) => console.warn("Native text-to-speech stop failed", error));
  } catch (error) {
    console.warn("Native text-to-speech stop failed", error);
  }
  return activeVoiceToken;
}

function isCurrentVoiceToken(voiceToken) {
  return voiceToken === activeVoiceToken;
}

async function speakText(text, updateStatus) {
  if (!text) {
    return;
  }

  const naturalText = prepareNaturalVoiceText(text);
  const voiceToken = beginVoicePlayback();
  const showInlineVoiceState = updateStatus === updateLiveTalkStatus;
  if (showInlineVoiceState) {
    setLiveTalkVoiceActivity("loading", "កំពុងរៀបចំសំឡេងខ្មែរ...");
  }

  updateStatus("កំពុងបង្កើតសំឡេងខ្មែរ...");
  const cloudSpoken = await speakWithCloudKhmerVoice(naturalText, updateStatus, voiceToken);
  if (!isCurrentVoiceToken(voiceToken)) {
    return;
  }
  if (cloudSpoken) {
    return;
  }

  updateStatus("កំពុងអានជាសំឡេងខ្មែរ...");
  const nativeSpoken = await speakWithNativeVoice(naturalText, updateStatus, voiceToken);
  if (!isCurrentVoiceToken(voiceToken)) {
    return;
  }
  if (nativeSpoken) {
    if (showInlineVoiceState) {
      setLiveTalkVoiceActivity("", "");
    }
    return;
  }

  if (!("speechSynthesis" in window)) {
    updateStatus("ទូរស័ព្ទនេះមិនគាំទ្រសំឡេងអានទេ។ សូមបើក Khmer Text-to-Speech ក្នុង Settings។");
    if (showInlineVoiceState) {
      setLiveTalkVoiceActivity("", "");
    }
    return;
  }

  const browserSpoken = await speakWithBrowserVoice(naturalText, updateStatus, voiceToken);
  if (!isCurrentVoiceToken(voiceToken)) {
    return;
  }
  if (!browserSpoken) {
    updateStatus("មិនមានសំឡេងខ្មែរក្នុងទូរស័ព្ទនេះទេ។ សូមប្រើ Online voice ឬដំឡើង Khmer Text-to-Speech។");
    if (showInlineVoiceState) {
      setLiveTalkVoiceActivity("", "");
    }
  }
}

async function speakWithCloudKhmerVoice(text, updateStatus = updateVoiceStatus, voiceToken = activeVoiceToken) {
  if (!navigator.onLine || !defaultCloudTtsUrl) {
    return false;
  }

  let controller = null;
  try {
    if (!isCurrentVoiceToken(voiceToken)) {
      return false;
    }
    updateStatus("កំពុងបង្កើតសំឡេងខ្មែរ Online...");
    controller = new AbortController();
    cloudVoiceController = controller;

    const response = await fetch(defaultCloudTtsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        text: String(text || "").slice(0, 1800),
        voice: "km-KH-SreymomNeural",
      }),
    });
    if (cloudVoiceController === controller) {
      cloudVoiceController = null;
    }
    if (!isCurrentVoiceToken(voiceToken)) {
      return false;
    }

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail?.error || `TTS returned ${response.status}`);
    }

    const audioBlob = await response.blob();
    if (!isCurrentVoiceToken(voiceToken)) {
      return false;
    }
    if (!audioBlob.size) {
      throw new Error("Empty TTS audio.");
    }

    cloudVoiceObjectUrl = URL.createObjectURL(audioBlob);
    cloudVoiceAudio = new Audio(cloudVoiceObjectUrl);
    cloudVoiceAudio.preload = "auto";
    cloudVoiceAudio.playbackRate = naturalVoice.cloudPlaybackRate;
    cloudVoiceAudio.preservesPitch = true;
    cloudVoiceAudio.mozPreservesPitch = true;
    cloudVoiceAudio.webkitPreservesPitch = true;
    cloudVoiceAudio.onended = () => {
      if (!isCurrentVoiceToken(voiceToken)) {
        return;
      }
      stopCloudVoiceAudio(true);
      setLiveTalkVoiceActivity("", "");
      updateStatus("អានចប់ហើយ។");
    };
    cloudVoiceAudio.onerror = () => {
      if (!isCurrentVoiceToken(voiceToken)) {
        return;
      }
      stopCloudVoiceAudio(true);
      setLiveTalkVoiceActivity("", "");
      updateStatus("សំឡេង Online មិនអាចចាក់បានទេ។ App នឹងប្រើសំឡេងក្នុងទូរស័ព្ទ។");
    };

    await cloudVoiceAudio.play();
    if (!isCurrentVoiceToken(voiceToken)) {
      return false;
    }
    if (updateStatus === updateLiveTalkStatus) {
      setLiveTalkVoiceActivity("speaking", "កំពុងអានចម្លើយ...");
    }
    updateStatus("កំពុងអានដោយសំឡេងខ្មែរ Online...");
    return true;
  } catch (error) {
    if (cloudVoiceController === controller) {
      cloudVoiceController = null;
    }
    if (error?.name === "AbortError" || !isCurrentVoiceToken(voiceToken)) {
      return false;
    }
    console.warn("Cloud Khmer text-to-speech failed", error);
    stopCloudVoiceAudio(true);
    updateStatus("សំឡេង Online មិនទាន់ដំណើរការ។ App នឹងប្រើសំឡេងក្នុងទូរស័ព្ទ។");
    return false;
  }
}

async function speakWithNativeVoice(text, updateStatus = updateVoiceStatus, voiceToken = activeVoiceToken) {
  const plugin = window.Capacitor?.Plugins?.FarmerVoice;
  if (!plugin?.speak) {
    return false;
  }

  try {
    if (!isCurrentVoiceToken(voiceToken)) {
      return false;
    }
    await plugin.speak({
      text,
      lang: naturalVoice.lang,
      rate: naturalVoice.rate,
      pitch: naturalVoice.pitch,
      pauseMs: naturalVoice.pauseMs,
      longPauseMs: naturalVoice.longPauseMs,
    });
    if (!isCurrentVoiceToken(voiceToken)) {
      return false;
    }
    updateStatus("កំពុងអានជាសំឡេងខ្មែរ ដោយចន្លោះឃ្លាធម្មជាតិ...");
    return true;
  } catch (error) {
    console.warn("Native text-to-speech failed", error);
    return false;
  }
}

async function speakWithBrowserVoice(text, updateStatus, voiceToken = activeVoiceToken) {
  if (!isCurrentVoiceToken(voiceToken)) {
    return false;
  }
  window.speechSynthesis.cancel();
  const voices = await getBrowserVoices();
  if (!isCurrentVoiceToken(voiceToken)) {
    return false;
  }
  const voice = chooseKhmerVoice(voices);
  const chunks = splitVoiceText(text);

  if (!voice) {
    updateStatus("មិនមានសំឡេងខ្មែរនៅក្នុង browser ទេ។ App បានបញ្ឈប់ ដើម្បីកុំឲ្យអានជាសំឡេងអង់គ្លេស។");
    return false;
  }

  let index = 0;
  const speakNext = () => {
    if (!isCurrentVoiceToken(voiceToken)) {
      return;
    }
    if (index >= chunks.length) {
      setLiveTalkVoiceActivity("", "");
      updateStatus("អានចប់ហើយ។");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    const voiceStyle = getHumanVoiceStyle(index, chunks.length, chunks[index]);
    utterance.lang = naturalVoice.lang;
    utterance.rate = voiceStyle.rate;
    utterance.pitch = voiceStyle.pitch;
    utterance.volume = naturalVoice.volume;
    if (voice) {
      utterance.voice = voice;
    }

    index += 1;
    utterance.onend = () => {
      if (isCurrentVoiceToken(voiceToken)) {
        window.setTimeout(speakNext, voiceStyle.pauseMs);
      }
    };
    utterance.onerror = () =>
      isCurrentVoiceToken(voiceToken)
        ? updateStatus("មិនអាចអានសំឡេងបានទេ។ សូមពិនិត្យ Text-to-Speech ក្នុង Settings។")
        : undefined;
    if (updateStatus === updateLiveTalkStatus) {
      setLiveTalkVoiceActivity("speaking", "កំពុងអានចម្លើយ...");
    }
    window.speechSynthesis.speak(utterance);
  };

  speakNext();
  return true;
}

function getHumanVoiceStyle(index, total, chunk = "") {
  const isOpening = index === 0;
  const isEnding = index >= total - 1;
  const hasSoftPause = /[,،;៖]/u.test(chunk);
  const hasFinalPause = /[។!?]$/u.test(chunk.trim());

  return {
    rate: isOpening ? naturalVoice.rate - 0.02 : naturalVoice.rate,
    pitch: isEnding ? naturalVoice.pitch - 0.02 : naturalVoice.pitch,
    pauseMs: hasFinalPause
      ? naturalVoice.longPauseMs
      : hasSoftPause
        ? Math.round((naturalVoice.pauseMs + naturalVoice.longPauseMs) / 2)
        : naturalVoice.pauseMs,
  };
}

function getBrowserVoices() {
  if (!("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    return Promise.resolve(voices);
  }

  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", done);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    window.setTimeout(done, 900);
  });
}

function chooseKhmerVoice(voices = []) {
  const khmerVoices = voices.filter((voice) => {
    const info = `${voice.name} ${voice.lang}`;
    return voice.lang?.toLowerCase().startsWith("km") || /khmer|cambodia/i.test(info);
  });

  const scoreVoice = (voice) => {
    const info = `${voice.name} ${voice.lang}`.toLowerCase();
    let score = 0;
    if (voice.lang?.toLowerCase() === "km-kh") score += 60;
    if (/natural|enhanced|premium|neural|wavenet/i.test(info)) score += 45;
    if (/google|samsung|microsoft/i.test(info)) score += 20;
    if (/female|male/i.test(info)) score += 8;
    if (voice.localService) score += 18;
    if (/compact|low|robot|espeak/i.test(info)) score -= 28;
    if (/default/i.test(info)) score -= 6;
    return score;
  };

  return khmerVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

function prepareNaturalVoiceText(text = "") {
  return cleanAiAnswerText(text)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^[\s>*•\-–—]+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[_*#~[\]{}<>|\\]+/g, " ")
    .replace(/\bCOP\s+TRI\b/gi, "កុប ត្រី")
    .replace(/\bNO\s+COPPER\b/gi, "ណូ កុបភើ")
    .replace(/\bANUMANCO\s*80%?\s*WP\b/gi, "អានុម៉ង់កូ")
    .replace(/\bREVUS\s+OPTI\s*440SC\b/gi, "រីវុស អុបទី")
    .replace(/\bPERFECT\s*72%?\s*WP\b/gi, "ភើហ្វេក ចិតសិបពីរ")
    .replace(/\bKON\s+NEAK6\b/gi, "កូននាគប្រាំមួយ")
    .replace(/\bU\s*-\s*T\b/gi, "យូធី")
    .replace(/\bMancozeb\b/gi, "ម៉ាន់កូសែប")
    .replace(/\bMetalaxyl\b/gi, "មេតាឡាក់ស៊ីល")
    .replace(/\bCopper\b/gi, "កុបភើ")
    .replace(/\bKasugamycin\b/gi, "កាស៊ូហ្គាមីស៊ីន")
    .replace(/\bDinotefuran\b/gi, "ឌីណូតេហ្វូរ៉ាន")
    .replace(/\bPymetrozine\b/gi, "ពីមេត្រូហ្ស៊ីន")
    .replace(/ឧ\./g, "ឧទាហរណ៍ ")
    .replaceAll("AI", "អេ អាយ")
    .replaceAll("Offline", "អុហ្វឡាញ")
    .replaceAll("Online", "អនឡាញ")
    .replaceAll("PPE", "សម្ភារៈការពារខ្លួន")
    .replaceAll("QR", "ឃ្យូ អារ")
    .replaceAll("PHI", "ភី អេច អាយ")
    .replaceAll("REI", "អារ អ៊ី អាយ")
    .replaceAll("Phomopsis", "ហ្វូម៉ុបស៊ីស")
    .replaceAll("ALLOCARIDARA", "អាឡូការីដារ៉ា")
    .replaceAll("Open-Meteo", "អូផិន មេតេអូ")
    .replaceAll("EfficientNetB0", "អេហ្វីស្យិន ណេត")
    .replace(/(\d)\.(\d)/g, "$1 ចុច $2")
    .replace(/(^|\s)[0-9០-៩]+[.)។]\s*/g, "$1")
    .replace(/(\d+)\s*%/g, "$1 ភាគរយ")
    .replace(/(\d+)\s*°\s*C/gi, "$1 អង្សាសេ")
    .replace(/(\d+)\s*mm/gi, "$1 មីលីម៉ែត្រ")
    .replace(/(\d+)\s*cm/gi, "$1 សង់ទីម៉ែត្រ")
    .replace(/(\d+)\s*kg/gi, "$1 គីឡូក្រាម")
    .replace(/(\d+)\s*g\b/gi, "$1 ក្រាម")
    .replace(/(\d+)\s*l\b/gi, "$1 លីត្រ")
    .replace(/\s*[-–—]\s*/g, "។ ")
    .replace(/[,:;：]/g, "។ ")
    .replace(/[.!?]+/g, "។ ")
    .replace(/[()"'“”‘’]+/g, " ")
    .replace(/\s*\/\s*/g, " ឬ ")
    .replace(/\s*។\s*/g, "។ ")
    .replace(/(?:។\s*){2,}/g, "។ ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitVoiceText(text = "") {
  const chunks = prepareNaturalVoiceText(text)
    .split(/(?<=[។!?])\s+/u)
    .flatMap(splitLongVoiceChunk)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.length ? chunks : [prepareNaturalVoiceText(text)];
}

function splitLongVoiceChunk(chunk = "") {
  const maxLength = 88;
  if (chunk.length <= maxLength) {
    return [chunk];
  }

  const parts = chunk
    .split(/(?<=[,،;៖])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1 && parts.every((part) => part.length <= maxLength)) {
    return parts;
  }

  const words = chunk.split(/\s+/);
  const chunks = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

async function stopVoice() {
  activeVoiceToken += 1;
  if (cloudVoiceController) {
    cloudVoiceController.abort();
    cloudVoiceController = null;
  }
  stopCloudVoiceAudio(false);
  setLiveTalkVoiceActivity("", "");
  const plugin = window.Capacitor?.Plugins?.FarmerVoice;
  try {
    await plugin?.stop?.();
  } catch (error) {
    console.warn("Native text-to-speech stop failed", error);
  }

  window.speechSynthesis?.cancel?.();
  updateVoiceStatus("បានបញ្ឈប់សំឡេង។");
}

function stopCloudVoiceAudio(revokeOnly = true) {
  if (cloudVoiceAudio && !revokeOnly) {
    cloudVoiceAudio.pause();
    cloudVoiceAudio.removeAttribute("src");
    cloudVoiceAudio.load?.();
  }

  cloudVoiceAudio = null;
  if (cloudVoiceObjectUrl) {
    URL.revokeObjectURL(cloudVoiceObjectUrl);
    cloudVoiceObjectUrl = "";
  }
}

function updateVoiceStatus(message) {
  const status = document.querySelector("#voiceStatus");
  if (status) {
    status.textContent = message;
  }
}

function updateChatbotStatus(message) {
  const status = document.querySelector("#chatbotStatus");
  if (status) {
    status.textContent = message;
  }
}

function showMedicines(medicines, options = {}) {
  if (options.uncertain) {
    medicineSection.innerHTML = `
      <h3>ថ្នាំប្រើប្រាស់</h3>
      <p>AI មិនទាន់ប្រាកដលើរូបនេះ ដូច្នេះ App មិនណែនាំថ្នាំនៅពេលនេះទេ។ សូមថតរូបថ្មី ប្រៀបធៀបជាមួយរូបឧទាហរណ៍ ហើយសួរអ្នកជំនាញប្រសិនបើរោគសញ្ញាធ្ងន់។</p>
      ${renderSafetyGuide()}
      ${renderReferenceLinks()}
    `;
    return;
  }

  if (!medicines.length) {
    medicineSection.innerHTML = `
      <h3>ថ្នាំប្រើប្រាស់</h3>
      <p>មិនចាំបាច់ប្រើថ្នាំទេ ប្រសិនបើស្លឹកមានសុខភាពល្អ និងមិនមានរោគសញ្ញាផ្សេង។</p>
      ${renderSafetyGuide()}
      ${renderReferenceLinks()}
    `;
    return;
  }

  medicineSection.innerHTML = `
    <h3>ថ្នាំប្រើប្រាស់ (ប្រើដោយទទួលខុសត្រូវ)</h3>
    <div class="medicine-grid">
      ${medicines.map((item) => renderMedicineCard(item)).join("")}
    </div>
    ${renderSafetyGuide()}
    ${renderReferenceLinks()}
  `;
}

function renderMedicineCard(item) {
  const detail = medicineDetails[item.key] || {};
  const credit = detail.credit || item.maker;

  return `
    <article class="medicine-card">
      <button class="medicine-image-button" type="button" data-medicine-zoom data-image="${escapeAttribute(item.image)}" data-name="${escapeAttribute(item.name)}" data-credit="${escapeAttribute(credit)}" aria-label="មើលរូប ${escapeAttribute(item.name)} ឲ្យធំ">
        <img src="${item.image}" alt="${item.name}">
        <span>មើលធំ</span>
      </button>
      <div>
        <strong>${item.name}</strong>
        <small>${item.maker}</small>
        <ul>
          <li><b>សារធាតុសកម្ម:</b> ${item.active}</li>
          <li><b>មុខងារ:</b> ${item.use}</li>
          <li>អានស្លាក/QR ពាក់ PPE និងសួរអ្នកជំនាញមុនប្រើថ្នាំ។</li>
        </ul>
        <details class="medicine-details">
          <summary>ព័ត៌មានលម្អិត និងប្រភព</summary>
          <p><b>ឥណទានរូបភាព:</b> ${credit}</p>
          ${renderList("អ្វីអានបានពីស្លាក", detail.labelReading)}
          <p><b>មុខងារលម្អិត:</b> ${detail.function || item.use}</p>
          ${renderList("ប្រើដោយទទួលខុសត្រូវ", detail.cautions)}
          ${renderLinks(detail.links)}
        </details>
      </div>
    </article>
  `;
}

function renderSafetyGuide() {
  return `
    <section class="spray-safety" id="spraySafety">
      <div>
        <h3>ការការពារពេលបាញ់ថ្នាំ</h3>
        <p>ផ្នែកនេះជាការរំលឹកសុវត្ថិភាពសម្រាប់កសិករ។ ថ្នាំនីមួយៗត្រូវប្រើតាមស្លាកពិត និងការណែនាំអ្នកជំនាញ។</p>
      </div>
      <img src="${safetyGuide.image}" alt="កសិករពាក់សម្ភារៈការពារពេលបាញ់ថ្នាំ">
      <div class="safety-columns">
        <div>
          <h4>ត្រូវមានអ្វីខ្លះ</h4>
          <ul>${safetyGuide.whatNeeded.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
        <div>
          <h4>វិធីការពារខ្លួន</h4>
          <ul>${safetyGuide.rules.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
      </div>
      <small>${safetyGuide.credit}</small>
    </section>
  `;
}

function renderReferenceLinks() {
  return `
    <section class="reference-links">
      <h3>វីដេអូ និងតំណភ្ជាប់យោង</h3>
      <p>តំណភ្ជាប់ខាងក្រោមត្រូវការអ៊ីនធឺណិត។ ពេល Offline អ្នកនៅតែអាចប្រើ AI ពិនិត្យរូបបានធម្មតា។</p>
      <div class="link-grid">
        ${referenceLinks
          .map(
            (item) => `
              <a href="${getReadableReferenceUrl(item)}"${getReferenceTargetAttribute(item)} data-open-reference>
                <span>${item.label}</span>
                <small>${item.source}</small>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderList(title, items = []) {
  if (!items.length) {
    return "";
  }

  return `
    <div class="detail-block">
      <b>${title}</b>
      <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </div>
  `;
}

function renderLinks(links = []) {
  if (!links.length) {
    return "";
  }

  return `
    <div class="source-links">
      <b>តំណព័ត៌មានលម្អិត</b>
      ${links
        .map(
          (link) => `
            <a href="${getReadableReferenceUrl(link)}"${getReferenceTargetAttribute(link)} data-open-reference>${link.label}</a>
          `
        )
        .join("")}
    </div>
  `;
}

function handleMedicineSectionClick(event) {
  const button = event.target.closest("[data-medicine-zoom]");
  if (!button) {
    return;
  }

  openImageLightbox({
    src: button.dataset.image,
    name: button.dataset.name,
    credit: button.dataset.credit,
  });
}

function handleReferenceClick(event) {
  const link = event.target.closest("[data-open-reference]");
  if (!link) {
    return;
  }

  event.preventDefault();
  window.open(link.href, "_blank", "noopener,noreferrer");
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    closeImageLightbox();
  }
}

function openImageLightbox({ src, name, credit }) {
  if (!src) {
    return;
  }

  const lightbox = ensureImageLightbox();
  lightbox.querySelector("img").src = src;
  lightbox.querySelector("img").alt = name || "រូបថ្នាំ";
  lightbox.querySelector("[data-lightbox-title]").textContent = name || "រូបថ្នាំ";
  lightbox.querySelector("[data-lightbox-credit]").textContent = credit || "";
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeImageLightbox() {
  const lightbox = document.querySelector("#imageLightbox");
  if (!lightbox) {
    return;
  }

  lightbox.classList.add("hidden");
  document.body.style.overflow = "";
}

function ensureImageLightbox() {
  let lightbox = document.querySelector("#imageLightbox");
  if (lightbox) {
    return lightbox;
  }

  lightbox = document.createElement("div");
  lightbox.id = "imageLightbox";
  lightbox.className = "image-lightbox hidden";
  lightbox.innerHTML = `
    <div class="lightbox-card" role="dialog" aria-modal="true" aria-labelledby="lightboxTitle">
      <div class="lightbox-header">
        <strong id="lightboxTitle" data-lightbox-title>រូបថ្នាំ</strong>
        <button type="button" data-close-lightbox aria-label="បិទ">X</button>
      </div>
      <img alt="រូបថ្នាំ">
      <small data-lightbox-credit></small>
    </div>
  `;

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest("[data-close-lightbox]")) {
      closeImageLightbox();
    }
  });

  document.body.append(lightbox);
  return lightbox;
}

function getReadableReferenceUrl(reference) {
  const ref = typeof reference === "string" ? { url: reference } : reference;
  const url = ref.url;
  if (ref.localFile) {
    const title = ref.label || "ឯកសារយោង";
    return `./pdf-viewer.html?file=${encodeURIComponent(ref.localFile)}&source=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  }

  if (!isPdfLikeUrl(url)) {
    return url;
  }

  return url;
}

function getReferenceTargetAttribute(reference) {
  const ref = typeof reference === "string" ? { url: reference } : reference;
  if (ref.localFile) {
    return "";
  }

  return ' target="_blank" rel="noopener noreferrer"';
}

function isPdfLikeUrl(url) {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith(".pdf") ||
    lowerUrl.includes(".pdf?") ||
    lowerUrl.includes("/download-tech-guide/")
  );
}

function escapeAttribute(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}






window.addEventListener('chomka-account-changed', () => {
  loadFarmerAccount(); loadFarmProfile();
  if (farmerPhoneInput) farmerPhoneInput.readOnly = !!window.chomkaAccount?.linked;
});
window.chomkaAccount?.ready.then(() => {
  loadFarmerAccount(); loadFarmProfile();
  if (farmerPhoneInput) farmerPhoneInput.readOnly = !!window.chomkaAccount?.linked;
});
