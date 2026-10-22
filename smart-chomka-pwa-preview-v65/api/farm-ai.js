const DEFAULT_BASE_URL = "https://bedrock-mantle.ap-southeast-2.api.aws/v1";
const DEFAULT_MODEL = "openai.gpt-oss-20b";

const PDF_GUIDE_CONTEXT = [
  "Source: MAFF eLibrary Khmer guide for pest and disease management on durian and avocado.",
  "Core guidance: inspect regularly, remove infected leaves/fruit, prune dense branches, reduce wet humid canopy conditions, and use pesticides only after checking the label or QR code.",
  "Safety: wear mask/respirator, gloves, goggles, long sleeves, long pants, boots, and respect REI/PHI on the label.",
  "Durian topics covered: thrips, mealybug, red mite, fruit borer, Phytophthora/root-foot rot, Phomopsis leaf spot, pink disease, Colletotrichum/anthracnose, leaf blight, fruit rot, canker, and pesticide safety.",
].join("\n");

const GUIDE_KNOWLEDGE_BASE = [
  {
    id: "pdf-safety",
    source: "MAFF eLibrary Khmer guide",
    title: "ការប្រើថ្នាំ និងសុវត្ថិភាព",
    pages: "general safety section",
    keywords: ["safety", "ppe", "phi", "rei", "ថ្នាំ", "បាញ់ថ្នាំ", "សុវត្ថិភាព", "ម៉ាស់", "ស្រោមដៃ", "វ៉ែនតា", "ពេលចូលចម្ការវិញ", "ពេលប្រមូលផល"],
    summary: "អានស្លាក និង QR មុនប្រើថ្នាំ។ ពាក់ម៉ាស់ ឬ respirator ស្រោមដៃ វ៉ែនតា អាវដៃវែង ខោវែង និងស្បែកជើងកវែង។",
    actions: "កុំបាញ់ពេលខ្យល់ខ្លាំង ភ្លៀង ឬថ្ងៃក្តៅខ្លាំង។ កុំឲ្យកុមារ និងសត្វចិញ្ចឹមនៅជិត។ លាងខ្លួន និងបោកសម្លៀកបំពាក់បន្ទាប់ពីបាញ់។",
    medicine: "កុំបង្កើតកម្រិតលាយដោយខ្លួនឯង។ ប្រើតែតាមស្លាកផលិតផល និងគោរព PHI/REI។",
  },
  {
    id: "phomopsis-leaf-spot",
    source: "MAFF eLibrary Khmer guide",
    title: "Phomopsis leaf spot / ជំងឺអុចស្លឹកដោយសារផ្សិត",
    pages: "PDF pages 20-21",
    modelClasses: ["PHOMOPSIS_LEAF_SPOT"],
    keywords: ["phomopsis", "leaf spot", "អុចស្លឹក", "ផ្សិត", "ស្លឹកមានអុច", "ស្លឹកមានចំណុច", "ចំណុចស្លឹក"],
    summary: "ស្លឹកមានចំណុច ឬស្នាមរលាក ហើយកើតងាយនៅពេលសំណើមខ្ពស់ ឬគុម្ពស្លឹកទុកឲ្យសើមយូរ។",
    actions: "ដកស្លឹកឆ្លងចេញ កុំទុកស្លឹកជ្រុះក្រោមដើម កាត់មែកឲ្យខ្យល់ចេញចូល និងជៀសវាងឲ្យទឹកជាប់លើស្លឹកពេលល្ងាច។",
    medicine: "ពិចារណាថ្នាំក្រុម copper ឬ fungicide ដូចជា NO COPPER ឬ ANUMANCO តែបន្ទាប់ពីផ្ទៀងផ្ទាត់ស្លាកថាអាចប្រើលើទុរេន និងរោគសញ្ញានេះ។",
  },
  {
    id: "leaf-blight",
    source: "MAFF eLibrary Khmer guide + Smart Chomka local product cards",
    title: "Leaf blight / រលាកស្លឹក",
    pages: "leaf disease guidance",
    modelClasses: ["LEAF_BLIGHT"],
    keywords: ["leaf blight", "រលាកស្លឹក", "ស្លឹករលាក", "ស្លឹកស្ងួត", "ចុងស្លឹកឆេះ", "ស្លឹកខូច"],
    summary: "ស្លឹកអាចមានស្នាមឆេះ រលាក ឬស្ងួតជាផ្នែកៗ។ បើស្លឹកខូចច្រើន ដើមបាត់កម្លាំង និងការលូតលាស់ធ្លាក់។",
    actions: "ដកស្លឹកឆ្លង កាត់មែកទ្រុឌទ្រោម ធ្វើឲ្យខ្យល់ចូលល្អ និងពិនិត្យជីវជាតិដី ព្រោះស្លឹកខ្សោយអាចធ្វើឲ្យរោគចូលងាយ។",
    medicine: "ពិចារណា NO COPPER ឬ ANUMANCO តាមស្លាក។ ប្រសិនបើស្នាមមិនដូចរោគផ្សិត សូមពិនិត្យទឹក ជី និងកម្តៅជាមុន។",
  },
  {
    id: "algal-leaf-spot",
    source: "MAFF eLibrary Khmer guide + Smart Chomka local product cards",
    title: "Algal leaf spot / អុចស្លឹកដោយសារាយ",
    pages: "humid orchard disease guidance",
    modelClasses: ["ALGAL_LEAF_SPOT"],
    keywords: ["algal", "algae", "សារាយ", "អុចស្លឹកដោយសារាយ", "ស្លឹកមានអុចពណ៌ទឹកក្រូច", "សំណើមខ្ពស់"],
    summary: "ជាញឹកញាប់កើតនៅចម្ការសើម គុម្ពស្លឹកក្រាស់ និងខ្យល់ចេញចូលតិច។ ស្លឹកអាចមានអុចពណ៌លឿង ទឹកក្រូច ឬត្នោត។",
    actions: "កាត់មែកបើកខ្យល់ បន្ថយសំណើមក្នុងគុម្ព កុំឲ្យស្លឹកសើមយូរ និងសម្អាតស្លឹកឆ្លងខ្លាំង។",
    medicine: "ផលិតផល copper ដូចជា NO COPPER អាចជួយការពារផ្ទៃស្លឹក ប៉ុន្តែត្រូវប្រើតាមស្លាក និងកុំបាញ់លើសកម្រិត។",
  },
  {
    id: "allocaridara-attack",
    source: "MAFF eLibrary Khmer guide + local pest guidance",
    title: "Allocaridara attack / សត្វល្អិតជញ្ជក់ត្រួយខ្ចី",
    pages: "pest management section",
    modelClasses: ["ALLOCARIDARA_ATTACK"],
    keywords: ["allocaridara", "សត្វល្អិត", "ជញ្ជក់", "ត្រួយខ្ចី", "ស្លឹកកោង", "ស្លឹកខ្ចីខូច", "insect"],
    summary: "ជាសត្វល្អិត មិនមែនជំងឺផ្សិត។ វាអាចជញ្ជក់ទឹកលើត្រួយខ្ចី ធ្វើឲ្យស្លឹកកោង ខូច និងដើមលូតលាស់យឺត។",
    actions: "ពិនិត្យត្រួយខ្ចី និងខាងក្រោមស្លឹក។ បើឃើញសត្វតិច អាចកាត់ផ្នែកខូច និងតាមដាន។ កុំបាញ់ថ្នាំបើមិនឃើញសត្វច្បាស់។",
    medicine: "U-T ឬថ្នាំសត្វល្អិតដែលស្លាកអនុញ្ញាតអាចពិចារណា។ កុំបាញ់ពេលមានឃ្មុំ ឬពេលខ្យល់ខ្លាំង។",
  },
  {
    id: "thrips",
    source: "MAFF eLibrary Khmer guide",
    title: "Thrips / ត្រីបលើត្រួយខ្ចី",
    pages: "PDF pages 4-5",
    keywords: ["thrips", "ត្រីប", "ស្នាមប្រាក់", "ស្លឹកខ្ចី", "ត្រួយខ្ចី", "ផ្កា", "ស្លឹកកោង"],
    summary: "ប៉ះពាល់ស្លឹកខ្ចី ត្រួយខ្ចី និងផ្កា។ ស្លឹកអាចកោង មានស្នាមប្រាក់ ឬស្នាមខ្មៅតូចៗ។",
    actions: "ពិនិត្យពេលព្រឹក ឬល្ងាច ជាពិសេសត្រួយខ្ចី។ ថែឲ្យដើមមានទឹក និងជីសមស្រប។",
    medicine: "ប្រើថ្នាំសត្វល្អិតតែពេលឃើញសត្វច្បាស់ និងត្រូវប្តូរក្រុមថ្នាំ។ អាចពិចារណា U-T ឬ KON NEAK6 តាមស្លាក។",
  },
  {
    id: "mealybug",
    source: "MAFF eLibrary Khmer guide",
    title: "Mealybug / សត្វល្អិតម្សៅ",
    pages: "PDF page 6",
    keywords: ["mealybug", "mealy bug", "ម្សៅ", "សត្វល្អិតម្សៅ", "សស្អិត", "ស្រមោច", "sooty mold", "ផ្សិតខ្មៅ"],
    summary: "ឃើញសត្វពណ៌សដូចម្សៅលើស្លឹក ត្រួយ ឬផ្លែ។ អាចមានទឹកផ្អែម ស្រមោច និងផ្សិតខ្មៅ។",
    actions: "កាត់ផ្នែកឆ្លងខ្លាំង គ្រប់គ្រងស្រមោច និងសម្អាតផ្លែ/ស្លឹកដែលមានសត្វ។",
    medicine: "ប្រើថ្នាំសត្វល្អិតតាមស្លាកប៉ុណ្ណោះ។ U-T ឬ KON NEAK6 អាចពិចារណាប្រសិនបើស្លាកសមស្រប។",
  },
  {
    id: "red-mite",
    source: "MAFF eLibrary Khmer guide",
    title: "Red mite / ចៃក្រហម",
    pages: "PDF pages 10-11",
    keywords: ["mite", "red mite", "ចៃ", "ចៃក្រហម", "ស្លឹកលឿង", "ស្លឹកស្ងួត", "ស្នាមលឿង"],
    summary: "ស្លឹកមានស្នាមលឿងតូចៗ បាត់ពណ៌ ស្ងួត ឬជ្រុះ។ ច្រើនកើតពេលក្តៅស្ងួត។",
    actions: "ពិនិត្យខាងក្រោមស្លឹកដោយកែវពង្រីក។ រក្សាទឹកដីឲ្យសមស្រប និងកុំបំផ្លាញសត្វមានប្រយោជន៍ដោយបាញ់ថ្នាំមិនចាំបាច់។",
    medicine: "ប្រើថ្នាំកម្ចាត់ចៃដែលស្លាកអនុញ្ញាត។ កុំប្រើថ្នាំសត្វល្អិតទូទៅដោយមិនចាំបាច់។",
  },
  {
    id: "fruit-borer",
    source: "MAFF eLibrary Khmer guide",
    title: "Fruit borer / ដង្កូវចោះផ្លែទុរេន",
    pages: "PDF pages 12-13",
    keywords: ["fruit borer", "ចោះផ្លែ", "ដង្កូវចោះផ្លែ", "ផ្លែមានរន្ធ", "ជ័រ", "សំបកផ្លែ"],
    summary: "ផ្លែអាចមានរន្ធ ស្នាមជ័រ ឬសំណល់លាមកដង្កូវលើសំបក។ អាចធ្វើឲ្យផ្លែជ្រុះ ឬគុណភាពធ្លាក់។",
    actions: "ប្រមូលផ្លែខូច និងផ្លែជ្រុះចេញពីចម្ការ ពិនិត្យផ្លែជិតទុំ និងប្រើថង់ការពារផ្លែបើអាចធ្វើបាន។",
    medicine: "ប្រើថ្នាំតាមស្លាក និងគោរព PHI មុនប្រមូលផល។ កុំបាញ់ខ្លាំងពេកនៅជិតថ្ងៃប្រមូលផល។",
  },
  {
    id: "stem-borer",
    source: "MAFF eLibrary Khmer guide",
    title: "Stem or branch borer / ដង្កូវចោះដើម ឬមែក",
    pages: "PDF pages 16-17",
    keywords: ["stem borer", "branch borer", "ចោះដើម", "ចោះមែក", "ដើមមានរន្ធ", "មែកស្ងួត", "ជ័រដើម"],
    summary: "ដើម ឬមែកមានរន្ធ សំណល់ឈើ ឬជ័រ ហើយមែកអាចស្ងួត ឬបាក់។",
    actions: "កាត់មែកខូចចេញ ដកសំណល់ឈើដែលមានដង្កូវ និងពិនិត្យជុំវិញរន្ធ។ ករណីធ្ងន់ត្រូវសួរអ្នកជំនាញ។",
    medicine: "មិនគួរប្រើថ្នាំដោយស្មាន។ ត្រូវផ្ទៀងផ្ទាត់សត្វក្នុងរន្ធ និងប្រើតាមការណែនាំអ្នកជំនាញ។",
  },
  {
    id: "phytophthora",
    source: "MAFF eLibrary Khmer guide",
    title: "Phytophthora / រលួយឫស រលួយគល់ រលួយផ្លែ",
    pages: "PDF pages 18-19 and 23-25",
    keywords: ["phytophthora", "root rot", "foot rot", "fruit rot", "រលួយឫស", "រលួយគល់", "រលួយផ្លែ", "ទឹកជាំ", "ជ័រដើម"],
    summary: "ជំងឺនេះធ្ងន់លើទុរេន។ អាចបង្កឫសរលួយ គល់រលួយ សំបកដើមមានជ័រ និងផ្លែរលួយ ជាពិសេសពេលដីទឹកជាំ។",
    actions: "កែលម្អការបង្ហូរទឹក កុំឲ្យទឹកជាំជុំវិញគល់ កាត់ផ្នែកឆ្លង និងសម្អាតផ្លែ/ស្លឹកខូច។",
    medicine: "ពិចារណា REVUS OPTI, PERFECT 72WP ឬថ្នាំក្រុម oomycete តាមស្លាក និងសួរអ្នកជំនាញបើដើមធ្ងន់។",
  },
  {
    id: "pink-disease",
    source: "MAFF eLibrary Khmer guide",
    title: "Pink disease / ជំងឺផ្កាឈូកលើមែក",
    pages: "PDF page 22",
    keywords: ["pink disease", "ផ្កាឈូក", "មែកពណ៌ផ្កាឈូក", "មែកស្ងួត", "សំបកមែក", "salmonicolor"],
    summary: "មែក ឬសំបកមានស្រទាប់ពណ៌ផ្កាឈូក/ស ហើយមែកអាចស្ងួត។ កើតងាយនៅកន្លែងសើម។",
    actions: "កាត់មែកឆ្លងឲ្យលើសស្នាមឆ្លង សម្អាតឧបករណ៍កាត់ និងបើកគុម្ពឲ្យខ្យល់ចេញចូល។",
    medicine: "ពិចារណាថ្នាំ copper/fungicide ដែលស្លាកអនុញ្ញាត ឬ ANUMANCO តាមស្លាក។ កុំបាញ់ដោយមិនកាត់មែកឆ្លង។",
  },
  {
    id: "anthracnose",
    source: "MAFF eLibrary Khmer guide",
    title: "Colletotrichum / Anthracnose",
    pages: "PDF pages 26-27",
    keywords: ["colletotrichum", "anthracnose", "អាន់ត្រាក់ណូស", "ស្នាមខ្មៅ", "ចំណុចខ្មៅ", "ស្លឹកខ្មៅ", "ផ្លែខ្មៅ"],
    summary: "បង្កស្នាមខ្មៅ ឬចំណុចលើស្លឹក ត្រួយ ឬផ្លែ ជាពិសេសពេលសើម និងមានភ្លៀង។",
    actions: "កាត់ផ្នែកឆ្លង សម្អាតសំណល់រុក្ខជាតិ និងបើកខ្យល់ក្នុងគុម្ព។",
    medicine: "ANUMANCO 80%WP, TILT SUPER ឬ fungicide ក្រុមផ្សេងអាចពិចារណាតាមស្លាក។ ត្រូវប្តូរក្រុមថ្នាំដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
  },
  {
    id: "fertilizer",
    source: "Smart Chomka agronomy guide + published durian nutrition studies",
    title: "ជី និងការថែដី",
    pages: "soil/leaf diagnosis and orchard nutrition notes",
    keywords: ["fertilizer", "npk", "ជី", "ដាក់ជី", "អាហារ", "ដី", "សំណើមដី", "soil", "organic", "nutrition", "leaf analysis", "តេស្តដី", "វិភាគស្លឹក"],
    summary: "ជីត្រូវផ្អែកលើអាយុដើម លទ្ធផលតេស្តដី/វិភាគស្លឹក ស្ថានភាពស្លឹក និងដំណាក់កាលលូតលាស់ ចេញផ្កា កាន់ផ្លែ ឬក្រោយប្រមូលផល។",
    actions: "ធ្វើ soil test ឬ leaf analysis បើអាចបាន បន្ថែមជីសរីរាង្គ កែលម្អ pH/សារធាតុសរីរាង្គ និងរក្សាសំណើមដីសមស្រប។ កុំដាក់ NPK ច្រើនពេកពេលដើមខ្សោយ ឬដីស្ងួត។",
    medicine: "ផែនការជីគួរបែងចែកជា NPK មូលដ្ឋាន + Ca/Mg/B/trace elements តាមលទ្ធផលដី។ កុំផ្តល់កម្រិតជីជាក់លាក់ដោយគ្មានអាយុដើម ទំហំដើម និងលទ្ធផលដី។",
  },
  {
    id: "phytophthora-integrated-management",
    source: "Queensland DPI/ACIAR durian Phytophthora management notes",
    title: "Phytophthora integrated management / ការគ្រប់គ្រងរលួយឫស-គល់ជារួម",
    pages: "field guide and best-practice notes",
    keywords: ["phytophthora", "root rot", "foot rot", "soil health", "drainage", "mulch", "phosphonate", "ទឹកជាំ", "បង្ហូរទឹក", "រលួយឫស", "រលួយគល់", "ជ័រដើម"],
    summary: "Phytophthora មិនគួរពឹងតែថ្នាំទេ។ វាត្រូវការគ្រប់គ្រងទឹក ដី ឫស និងសំណល់ឆ្លងជាមួយគ្នា ព្រោះដីទឹកជាំធ្វើឲ្យរាលដាលលឿន។",
    actions: "បើកប្រព័ន្ធបង្ហូរទឹក កុំឲ្យទឹកនៅជុំវិញគល់ បន្ថែម mulch ឲ្យសមរម្យដោយមិនគ្របជាប់គល់ ពិនិត្យឫស/សំបកជ័រ និងដកសំណល់ឆ្លងចេញ។",
    medicine: "Phosphonate ឬថ្នាំក្រុម oomycete អាចជួយបង្ការ/គ្រប់គ្រងតាមស្លាក។ Copper អាចជួយការពារស្នាមលើសំបក ប៉ុន្តែការកែលម្អទឹកជាំគឺសំខាន់ជាងថ្នាំ។",
  },
  {
    id: "weather-disease-risk",
    source: "Durian disease epidemiology and extension notes",
    title: "អាកាសធាតុ និងហានិភ័យជំងឺ",
    pages: "weather risk guide",
    keywords: ["weather", "rain", "humidity", "សំណើម", "ភ្លៀង", "អាកាសធាតុ", "disease risk", "wet canopy", "ខ្យល់", "រាលដាល"],
    summary: "សំណើមខ្ពស់ ភ្លៀងច្រើន និងស្លឹកសើមយូរ បង្កើនហានិភ័យ Phytophthora, Anthracnose, Phomopsis និង Algal leaf spot។",
    actions: "ពេល app ព្រមានសំណើម/ភ្លៀងខ្ពស់ សូមពិនិត្យស្លឹកខាងក្នុងគុម្ព ផ្លែជិតដី និងគល់។ កាត់មែកឲ្យខ្យល់ចូល និងកុំបាញ់ថ្នាំមុនភ្លៀង។",
    medicine: "បើមានរោគសញ្ញាច្បាស់ និងភ្លៀងបន្ត អាចពិចារណាថ្នាំការពារផ្ទៃស្លឹកតាមស្លាក។ កុំបាញ់ថ្នាំពេលភ្លៀង ឬខ្យល់ខ្លាំង។",
  },
  {
    id: "orchard-scouting",
    source: "Integrated pest management field practice",
    title: "ការពិនិត្យចម្ការជាប្រចាំ",
    pages: "IPM scouting checklist",
    keywords: ["scout", "inspection", "ពិនិត្យ", "តាមដាន", "រូបភាព", "ថតរូប", "ប្រវត្តិ", "ស្លឹក", "ផ្លែ", "មែក", "គល់"],
    summary: "ការពិនិត្យជាប្រចាំជួយរកជំងឺមុនពេលរាលដាល។ រូបមួយសន្លឹកមិនគ្រប់គ្រាន់សម្រាប់សម្រេចថ្នាំទេ។",
    actions: "ថត 3-5 រូបពីស្លឹក/ផ្លែ/គល់ផ្សេងៗ គូសទីតាំងដើម កត់ថ្ងៃ និងប្រៀបធៀបបន្ទាប់ពី 5-7 ថ្ងៃ។ បើ confidence ក្រោម 75% ត្រូវថតរូបថ្មីឲ្យច្បាស់។",
    medicine: "មុនប្រើថ្នាំ ត្រូវផ្ទៀងផ្ទាត់ថារោគសញ្ញាដូចគ្នាច្រើនកន្លែង មិនមែនខូចដោយកំដៅ ខ្វះទឹក ខ្វះជី ឬរបួសមេកានិច។",
  },
  {
    id: "canopy-pruning-airflow",
    source: "Durian orchard sanitation and IPM guidance",
    title: "កាត់មែក បើកខ្យល់ និងសម្អាតចម្ការ",
    pages: "canopy management notes",
    keywords: ["prune", "pruning", "canopy", "airflow", "sanitation", "កាត់មែក", "ខ្យល់", "គុម្ព", "ស្លឹកជ្រុះ", "មែកស្ងួត", "សម្អាត"],
    summary: "គុម្ពក្រាស់ និងស្លឹកសើមយូរ បង្កើនជំងឺផ្សិត សារាយ និងសត្វល្អិតលាក់ខ្លួន។ ការកាត់មែកជួយបន្ថយសំណើម និងធ្វើឲ្យបាញ់ថ្នាំមានប្រសិទ្ធភាពជាងមុន។",
    actions: "កាត់មែកស្ងួត មែកជាន់គ្នា និងមែកឆ្លង។ សម្អាតស្លឹក/ផ្លែជ្រុះក្រោមដើម ហើយសម្លាប់មេរោគឧបករណ៍កាត់មុនទៅដើមបន្ទាប់។",
    medicine: "កាត់មែក និង sanitation គួរធ្វើមុនពិចារណាថ្នាំ។ បើបាញ់ថ្នាំក្រោយកាត់ ត្រូវរង់ចាំស្លាកណែនាំ និងប្រើ PPE។",
  },
  {
    id: "flower-fruit-stage-care",
    source: "Durian orchard production guidance",
    title: "ការថែទាំពេលចេញផ្កា និងកាន់ផ្លែ",
    pages: "flowering and fruiting care notes",
    keywords: ["flower", "fruit set", "harvest", "ផ្កា", "ចេញផ្កា", "កាន់ផ្លែ", "ជ្រុះផ្លែ", "ប្រមូលផល", "phi", "pollination"],
    summary: "ពេលចេញផ្កា និងកាន់ផ្លែ ដើមត្រូវការទឹកស្មើៗ សុខភាពស្លឹកល្អ និងការពារផ្លែពីសត្វល្អិត/ជំងឺដោយប្រុងប្រយ័ត្ន។",
    actions: "រក្សាទឹកមិនឲ្យខ្វះ ឬលើស កាត់មែកអស់ប្រយោជន៍ ពិនិត្យផ្លែជិតគល់ និងដកផ្លែឆ្លង/ជ្រុះចេញពីចម្ការ។",
    medicine: "ជិតប្រមូលផល ត្រូវគោរព PHI លើស្លាកថ្នាំ។ កុំបាញ់ថ្នាំលើផ្កាដោយមិនចាំបាច់ ព្រោះអាចប៉ះពាល់សត្វជួយលំអង។",
  },
];

const GENERAL_KNOWLEDGE_CHUNK_IDS = [
  "orchard-scouting",
  "fertilizer",
  "phytophthora-integrated-management",
  "weather-disease-risk",
  "pdf-safety",
];

const KHMER_TEXT_FIXES = [
  [/ជម្ងឺ/g, "ជំងឺ"],
  [/ឌូរៀន|ដូរៀន|ធុរេន/g, "ទុរេន"],
  [/អេអាយ|អាយអាយ/g, "AI"],
  [/ភីអេចអាយ/gi, "PHI"],
  [/ភី អេច អាយ/gi, "PHI"],
  [/អារ អ៊ី អាយ/gi, "REI"],
  [/ឃ្យូ អារ/gi, "QR"],
  [/ភូមូបស៊ីស|ហ្វូម៉ុបស៊ីស|ផូម៉ុបស៊ីស/gi, "Phomopsis"],
  [/អាឡូការីដារ៉ា/gi, "Allocaridara"],
  [/អាន់ត្រាក់ណូស/gi, "Anthracnose"],
  [/ផៃថុបថូរ៉ា|ហ្វៃថុបថូរ៉ា/gi, "Phytophthora"],
  [/បង្កើតឡើងដោយសារពីបាក់តេរៀន និងស្វីស/gi, "ជារោគសញ្ញាដែលភាគច្រើនពាក់ព័ន្ធនឹងផ្សិត ឬសំណើមខ្ពស់"],
  [/បាក់តេរៀន និងស្វីស/gi, "ផ្សិត ឬសំណើមខ្ពស់"],
  [/ដោយសារពី/g, "ដោយសារ"],
  [/ស្វីស/g, "ផ្សិត"],
  [/ព័ត៌មានខ្វះ\s*[:：]/g, "ពិនិត្យបន្ថែម៖"],
  [/ព័ត៌មានមិនគ្រប់គ្រាន់\s*[:：]?/g, ""],
  [/ចម្លើយមិនគ្រប់គ្រាន់\s*[:：]?/g, ""],
  [/មិនមានព័ត៌មានគ្រប់គ្រាន់/g, "សូមប្រើជំហានសុវត្ថិភាពខាងក្រោម"],
  [/not enough information/gi, "use these safe next steps"],
  [/ទឹកកកលើស្លឹក/g, "ទឹកជាប់លើស្លឹក"],
  [/សំភារៈ/g, "សម្ភារៈ"],
  [/ដៃដុយ/g, "ស្រោមដៃ"],
  [/សំពត់/g, "អាវដៃវែង"],
  [/បិទផ្លូវចេញពីផ្ទះ[^\n។]*(?:។)?/g, "កុំឲ្យកុមារ និងសត្វចិញ្ចឹមនៅជិតពេលប្រើថ្នាំ។"],
  [/អ្នកជំនាញស្រែដូរ/g, "មន្រ្តីកសិកម្មក្នុងតំបន់"],
];

const PRODUCT_DATABASE = [
  {
    key: "NO_COPPER",
    name: "NO COPPER",
    type: "copper protectant",
    image: "./assets/products/no_copper_front.webp",
    active: "Copper product; verify label/QR before use",
    purpose: "ជួយការពារផ្ទៃស្លឹកក្នុងស្ថានភាពសើម និងរោគសញ្ញាអុចស្លឹក។",
    credit: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល NO COPPER (Haktore Golden Harvest Co., Ltd)",
    keywords: ["algal", "សារាយ", "leaf spot", "copper", "no copper"],
  },
  {
    key: "ANUMANCO",
    name: "ANUMANCO 80%WP",
    type: "fungicide",
    image: "./assets/products/ag_anumanco.webp",
    active: "Mancozeb 80% WP",
    purpose: "ថ្នាំការពារជំងឺផ្សិតមួយចំនួន ត្រូវប្រើតាមស្លាក និងប្តូរក្រុមថ្នាំ។",
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    keywords: ["mancozeb", "anthracnose", "colletotrichum", "fruit rot", "leaf blight", "ផ្សិត"],
  },
  {
    key: "REVUS_OPTI",
    name: "REVUS OPTI 440SC",
    type: "oomycete fungicide",
    image: "./assets/products/ag_revus_opti.webp",
    active: "Mandipropamid + Chlorothalonil; verify label",
    purpose: "ពិចារណាសម្រាប់ Phytophthora/រលួយគល់-ឫស ឬរោគសញ្ញាដែលស្លាកអនុញ្ញាត។",
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    keywords: ["phytophthora", "root rot", "foot rot", "រលួយគល់", "រលួយឫស"],
  },
  {
    key: "PERFECT_72WP",
    name: "PERFECT 72%WP",
    type: "oomycete fungicide",
    image: "./assets/products/ag_perfect_72wp.webp",
    active: "Metalaxyl + Mancozeb; verify label",
    purpose: "ជម្រើសសម្រាប់រោគសញ្ញា Phytophthora/រលួយគល់-ឫស តាមស្លាក។",
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    keywords: ["phytophthora", "root rot", "foot rot", "metalaxyl", "រលួយ"],
  },
  {
    key: "U_T",
    name: "U-T",
    type: "insecticide",
    image: "./assets/products/ut_insecticide.webp",
    active: "Dinotefuran 20% + Pymetrozine 50% WDG",
    purpose: "សម្រាប់សត្វល្អិតជញ្ជក់ទឹក/បំផ្លាញត្រួយខ្ចី តែពេលឃើញសត្វច្បាស់។",
    credit: "ប្រភពព័ត៌មាន: ស្លាកផលិតផល U-T",
    keywords: ["allocaridara", "mealybug", "thrips", "mite", "សត្វល្អិត", "ជញ្ជក់", "u-t"],
  },
  {
    key: "KON_NEAK6",
    name: "KON NEAK6",
    type: "insecticide",
    image: "./assets/products/ag_kon_neak6_front.webp",
    active: "Verify active ingredient on label",
    purpose: "ជម្រើសសត្វល្អិតខ្លះៗ ត្រូវអានស្លាក និងកុំបាញ់ពេលមានឃ្មុំ។",
    credit: "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
    keywords: ["mealybug", "thrips", "mite", "borer", "សត្វល្អិត"],
  },
  {
    key: "SOIL_TEST",
    name: "Soil test + NPK plan",
    type: "fertilizer guidance",
    image: "",
    active: "Fertilizer plan based on soil test, tree age, and crop stage",
    purpose: "សម្រាប់សំណួរអំពីជី: ពិនិត្យដីជាមុន បន្ទាប់មករៀបចំ NPK/ជីសរីរាង្គតាមអាយុដើម។",
    credit: "Smart Chomka agronomy guide",
    keywords: ["fertilizer", "npk", "ជី", "ដាក់ជី", "ដី", "អាហារ"],
  },
  {
    key: "ORGANIC_MATTER",
    name: "ជីសរីរាង្គ + Mulch",
    type: "soil care guidance",
    image: "",
    active: "Compost, organic matter, mulch, and soil moisture care",
    purpose: "ជួយកែលម្អដី រក្សាសំណើម និងធ្វើឲ្យឫសទុរេនមានកម្លាំង មិនមែនថ្នាំសម្លាប់ជំងឺទេ។",
    credit: "Smart Chomka agronomy guide",
    keywords: ["organic", "compost", "mulch", "ជីសរីរាង្គ", "សរីរាង្គ", "ដី", "សំណើម"],
  },
  {
    key: "CALCIUM_MAG_BORON",
    name: "Ca/Mg/B trace element plan",
    type: "nutrition guidance",
    image: "",
    active: "Calcium, Magnesium, Boron, and trace element correction after soil/leaf test",
    purpose: "សម្រាប់កែសម្រួលជីបន្ទាប់បន្សំក្រោយពិនិត្យដី ឬវិភាគស្លឹក។ កុំប្រើកម្រិតខ្ពស់ដោយគ្មានលទ្ធផលតេស្ត។",
    credit: "Smart Chomka agronomy guide",
    keywords: ["calcium", "magnesium", "boron", "ca", "mg", "b", "trace", "កាល់ស្យូម", "ម៉ាញេស្យូម", "បូរ៉ុន", "វិភាគស្លឹក"],
  },
];

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET" || req.query?.health) {
    return res.status(200).json({
      ok: true,
      pdfGuideReady: true,
      textModel: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      products: PRODUCT_DATABASE.length,
      knowledgeChunks: GUIDE_KNOWLEDGE_BASE.length,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.BEDROCK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "BEDROCK_API_KEY is not configured on the server.",
    });
  }

  const body = await readJsonBody(req);
  const question = String(body.question || "").trim().slice(0, 1400);
  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  const guideMode = shouldUseGuideContext(question, body.latestPrediction);
  const structuredMode = shouldUseStructuredFarmAnswer(question, body.latestPrediction);
  const products = shouldUseProductContext(question, body.latestPrediction)
    ? selectProducts(question, body.latestPrediction)
    : [];
  const relevantKnowledge = guideMode ? selectKnowledgeChunks(question, body.latestPrediction) : [];
  const knowledgeContext = buildKnowledgeContext(relevantKnowledge);
  const productContext = buildProductContext(products);
  const includePrediction = referencesLatestPrediction(question);
  const latestPrediction = includePrediction && body.latestPrediction
    ? JSON.stringify(body.latestPrediction).slice(0, 1200)
    : "No latest image prediction for this question.";
  const history = guideMode && Array.isArray(body.history)
    ? body.history.slice(-6).map((item) => `${item.role}: ${item.text}`).join("\n")
    : "";

  const messages = [
    {
      role: "system",
      content: [
        "You are Smart Chomka AI, a friendly agricultural assistant for Cambodian durian farmers.",
        "Answer in natural Khmer by default. Use short practical steps. The farmer may ask general questions, not only image questions.",
        "You can discuss durian disease, pests, fertilizer, irrigation, weather risk, pesticide safety, and app usage.",
        guideMode
          ? "For this question, use the selected PDF guide sections and selected product database below. Do not invent exact pesticide dose, PHI, or REI if it is not provided; tell the farmer to read the label/QR and ask a local agriculture officer for severe cases."
          : "For this question, do not use or mention the PDF guide. Answer as a normal helpful AI assistant in Khmer.",
        "When recommending medicine or fertilizer, explain purpose, responsible use, PPE, and why it may fit. Mention product examples by name when selected products are available.",
        "If the farmer asks only about fertilizer, soil, NPK, or nutrition, do not recommend pesticide, fungicide, insecticide, or copper products unless the farmer also mentions disease, pest, spray medicine, or a scan result.",
        "For PPE, use only clear Khmer words: ម៉ាស់/respirator, ស្រោមដៃ, វ៉ែនតាការពារ, អាវដៃវែង, ខោវែង, ស្បែកជើងកវែង. Do not invent strange PPE words.",
        guideMode
          ? "If the selected PDF sections are limited, never write phrases such as ព័ត៌មានមិនគ្រប់គ្រាន់, មិនមានព័ត៌មានគ្រប់គ្រាន់, not enough information, or I cannot answer. Give the best safe answer from selected context, then add practical checking steps inside the answer. Never pretend to be certain."
          : "For general questions, answer directly in 2-5 short natural sentences. Do not use disease-report headings.",
        "If the farmer asks for more medicine, give 2-5 examples from the selected product database and explain which disease/pest group each product is for. Do not give exact dose unless it is on the label.",
        "Use these Khmer spellings: ជំងឺ, រោគសញ្ញា, ថ្នាំ, ជី, សុវត្ថិភាព, សំណើម, ទុរេន, ចម្ការ, កសិករ.",
        "Important Khmer accuracy: translate fungus as ផ្សិត. Never write ស្វីស for fungus. Do not claim bacteria as the cause unless the selected source clearly says it.",
        "Avoid mixing English except product names, model names, disease names in parentheses, PPE, PHI, REI, QR, and common chemical names.",
        "Plain text only. Do not use Markdown headings, Markdown tables, pipe characters, HTML tags, code blocks, stars, or **bold** markers.",
        structuredMode
          ? "For disease, pest, medicine, fertilizer, safety, or scan-result questions, write short sections exactly like this when relevant: សង្ខេប៖ ... ធ្វើឥឡូវនេះ៖ ... ថ្នាំ ឬ ជី៖ ... សុវត្ថិភាព៖ ... ពិនិត្យបន្ថែម៖ ..."
          : "For general chat, do not use these headings: ធ្វើឥឡូវនេះ, ថ្នាំ ឬ ជី, សុវត្ថិភាព, ពិនិត្យបន្ថែម.",
        "Keep each section to 1-4 short lines. No table. No long paragraph. Use farmer-friendly Khmer.",
        "",
        knowledgeContext,
        "",
        productContext,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `Farmer question: ${question}`,
        `Latest image prediction: ${latestPrediction}`,
        history ? `Recent conversation:\n${history}` : "",
      ].filter(Boolean).join("\n\n"),
    },
  ];

  try {
    const baseUrl = String(process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/g, "");
    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.25,
        max_tokens: 900,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.error || `AI provider returned ${response.status}`,
      });
    }

    const answer = ensureHelpfulAnswer({
      answer: cleanAnswerForClient(data?.choices?.[0]?.message?.content || ""),
      question,
      products,
      relevantKnowledge,
      guideMode,
      structuredMode,
    });
    return res.status(200).json({
      answer: answer || "សូមសួរម្តងទៀតឲ្យច្បាស់បន្តិច។",
      products,
      knowledgeSources: relevantKnowledge.map(({ id, title, pages, source }) => ({ id, title, pages, source })),
      model,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "AI request failed.",
    });
  }
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function cleanAnswerForClient(value = "") {
  let text = String(value || "");
  for (const [pattern, replacement] of KHMER_TEXT_FIXES) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/^AI\s*[:：]\s*/i, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^[\s>*•]+/gm, "")
    .replace(/\s*\|\s*/g, "\n")
    .replace(/^\s*:?-{3,}:?\s*$/gm, "")
    .replace(/(?:^|\n)[^\n។]*(?:ព័ត៌មាន|ចម្លើយ)[^\n។]{0,45}(?:មិនគ្រប់គ្រាន់|ខ្វះ|មិនទាន់គ្រប់គ្រាន់|មិនមានគ្រប់គ្រាន់)[^\n។]*(?:។)?/g, "")
    .replace(/(?:^|\n)[^\n.]*(?:not enough information|insufficient information|cannot answer from the context)[^\n.]*(?:\.)?/gi, "")
    .replace(/(^|\n)\s*[0-9០-៩]+[.)]\s*/g, "$1")
    .replace(/\s+[–—]\s+/g, ": ")
    .replace(/\n\s*[-–—]\s*/g, "\n")
    .replace(/\s+([។៕])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureHelpfulAnswer({ answer = "", question = "", products = [], relevantKnowledge = [], guideMode = true, structuredMode = true }) {
  const medicineQuestion = isMedicineOrFertilizerQuestion(question);
  let output = cleanAnswerForClient(answer);

  if (medicineQuestion && products.length) {
    const mentionedProducts = products.filter((product) =>
      output.toLowerCase().includes(String(product.name || "").toLowerCase())
    );

    if (mentionedProducts.length < Math.min(2, products.length)) {
      const examples = products
        .slice(0, 5)
        .map((product) => `${product.name}: ${product.purpose || product.active || "សូមអានស្លាកមុនប្រើ។"}`)
        .join("\n");

      output = [
        output,
        "ថ្នាំ ឬ ជីបន្ថែម៖",
        examples,
        "ចំណាំ៖ ជម្រើសទាំងនេះគ្រាន់តែជាឧទាហរណ៍ក្នុង App។ មុនប្រើ សូមអានស្លាក/QR បញ្ជាក់ដំណាំទុរេន រោគសញ្ញា កម្រិតលាយ PHI និង REI។",
      ].filter(Boolean).join("\n");
    }
  }

  if (guideMode && output.length < 160 && relevantKnowledge.length) {
    const best = relevantKnowledge[0];
    output = [
      output,
      "ពិនិត្យបន្ថែម៖ ដើម្បីឲ្យការណែនាំកាន់តែច្បាស់ សូមថតរូបស្លឹក ផ្លែ គល់ ឬឫសដែលមានរោគសញ្ញា។",
      best?.actions ? `ធ្វើឥឡូវនេះ៖ ${best.actions}` : "",
    ].filter(Boolean).join("\n");
  }

  if (!structuredMode) {
    output = simplifyGeneralAnswer(output);
  }

  return cleanAnswerForClient(output);
}

function isMedicineOrFertilizerQuestion(text = "") {
  return /(ថ្នាំ|បាញ់|ព្យាបាល|ជី|ដាក់ជី|medicine|pesticide|fungicide|insecticide|fertilizer|treat|spray)/i.test(
    normalizeSearchText(text)
  );
}

function isFertilizerOnlyQuestion(text = "") {
  const normalized = normalizeSearchText(text);
  const asksNutrition = /(ជី|ដាក់ជី|npk|fertilizer|nutrition|soil|ដី|អាហារ|សារធាតុចិញ្ចឹម|តេស្តដី|វិភាគស្លឹក)/i.test(normalized);
  const asksDiseaseOrMedicine = /(ជំងឺ|រោគ|រោគសញ្ញា|សត្វល្អិត|ចៃ|ដង្កូវ|ម្សៅ|ថ្នាំ|បាញ់|ព្យាបាល|medicine|pesticide|fungicide|insecticide|spray|disease|pest|phomopsis|phytophthora|anthracnose|canker|blight|rot)/i.test(normalized);
  return asksNutrition && !asksDiseaseOrMedicine;
}

function shouldUseGuideContext(question = "", latestPrediction = null) {
  const text = getQuestionContextText(question, latestPrediction);
  return /(ជំងឺ|រោគ|រោគសញ្ញា|ស្លឹក|ផ្លែ|ឫស|គល់|មែក|ផ្សិត|សារាយ|រលាក|អុច|រលួយ|សត្វល្អិត|ចៃ|ដង្កូវ|ម្សៅ|ជញ្ជក់|ថ្នាំ|បាញ់|ព្យាបាល|សុវត្ថិភាព|ជី|ដាក់ជី|ដី|សំណើម|ភ្លៀង|អាកាសធាតុ|ស្រោច|ទឹក|ចេញផ្កា|កាន់ផ្លែ|ប្រមូលផល|តាមដាន|ពិនិត្យ|កាត់មែក|ខ្យល់|គុម្ព|សម្អាត|ppe|phi|rei|qr|disease|symptom|leaf|fruit|root|stem|fungus|fungal|pest|insect|mite|borer|mealybug|phomopsis|phytophthora|anthracnose|canker|blight|rot|medicine|pesticide|fungicide|insecticide|spray|treat|safety|fertilizer|nutrition|soil|water|irrigation|weather|rain|humidity|flower|harvest|scout|prune|pruning|canopy|airflow|sanitation)/i.test(text);
}

function shouldUseProductContext(question = "", latestPrediction = null) {
  const text = getQuestionContextText(question, latestPrediction);
  return isMedicineOrFertilizerQuestion(text) || /(ផលិតផល|product|copper|mancozeb|metalaxyl|ថ្នាំ|ជី|សត្វល្អិត|ផ្សិត)/i.test(text);
}

function shouldUseStructuredFarmAnswer(question = "", latestPrediction = null) {
  const text = getQuestionContextText(question, latestPrediction);
  return /(ជំងឺ|រោគ|រោគសញ្ញា|ស្លឹក|ផ្លែ|ឫស|គល់|ផ្សិត|សារាយ|រលាក|អុច|រលួយ|សត្វល្អិត|ចៃ|ដង្កូវ|ម្សៅ|ថ្នាំ|បាញ់|ព្យាបាល|ជី|ដាក់ជី|សុវត្ថិភាព|សំណើម|ភ្លៀង|អាកាសធាតុ|ស្រោច|ទឹក|ចេញផ្កា|កាន់ផ្លែ|ប្រមូលផល|តាមដាន|កាត់មែក|ខ្យល់|គុម្ព|ppe|phi|rei|disease|symptom|leaf|fruit|root|fungus|pest|medicine|pesticide|fertilizer|spray|safety|weather|rain|humidity|water|irrigation|flower|harvest|prune|canopy|result|scan|prediction)/i.test(text);
}

function getQuestionContextText(question = "", latestPrediction = null) {
  return normalizeSearchText([
    question,
    referencesLatestPrediction(question) ? getPredictionText(latestPrediction) : "",
  ].filter(Boolean).join(" "));
}

function referencesLatestPrediction(question = "") {
  const text = normalizeSearchText(question);
  return /(លទ្ធផល|រូបនេះ|ស្លឹកនេះ|ជំងឺនេះ|រោគនេះ|ដែលបានពិនិត្យ|scan|scanned|result|prediction|detected|this leaf|this picture|photo)/i.test(text);
}

function simplifyGeneralAnswer(answer = "") {
  return cleanAnswerForClient(answer)
    .replace(/^(សង្ខេប|ធ្វើឥឡូវនេះ|ថ្នាំ ឬ ជី|សុវត្ថិភាព|ពិនិត្យបន្ថែម)\s*[:：]\s*/gmu, "")
    .replace(/\n(ធ្វើឥឡូវនេះ|ថ្នាំ ឬ ជី|សុវត្ថិភាព|ពិនិត្យបន្ថែម)\s*[:：]\s*/gmu, "\n")
    .replace(/ធ្វើឥឡូវនេះ\s*[:：]?\s*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

function selectKnowledgeChunks(question, latestPrediction) {
  const predictionText = referencesLatestPrediction(question) ? getPredictionText(latestPrediction) : "";
  const prompt = normalizeSearchText(`${question} ${predictionText}`);
  const scored = GUIDE_KNOWLEDGE_BASE
    .map((chunk) => ({ chunk, score: scoreKnowledgeChunk(prompt, chunk, predictionText) }))
    .sort((left, right) => right.score - left.score);

  const selected = scored
    .filter((item) => item.score >= 2)
    .slice(0, 5)
    .map((item) => item.chunk);

  if (selected.length) {
    const hasSafety = selected.some((chunk) => chunk.id === "pdf-safety");
    if (!hasSafety && /(ថ្នាំ|បាញ់|medicine|pesticide|fungicide|insecticide|safety|ppe|phi|rei)/i.test(prompt)) {
      selected.push(GUIDE_KNOWLEDGE_BASE.find((chunk) => chunk.id === "pdf-safety"));
    }
    return selected.filter(Boolean).slice(0, 5);
  }

  return GENERAL_KNOWLEDGE_CHUNK_IDS
    .map((id) => GUIDE_KNOWLEDGE_BASE.find((chunk) => chunk.id === id))
    .filter(Boolean);
}

function scoreKnowledgeChunk(prompt, chunk, predictionText = "") {
  if (!prompt) {
    return 0;
  }

  const searchable = normalizeSearchText([
    chunk.title,
    chunk.summary,
    chunk.actions,
    chunk.medicine,
    ...(chunk.keywords || []),
  ].join(" "));
  const promptTerms = tokenizeSearchText(prompt);
  let score = 0;

  for (const keyword of chunk.keywords || []) {
    const term = normalizeSearchText(keyword);
    if (!term) {
      continue;
    }
    if (prompt.includes(term)) {
      score += term.length > 5 ? 7 : 4;
    } else if (term.includes(prompt) && prompt.length >= 4) {
      score += 3;
    }
  }

  for (const term of promptTerms) {
    if (searchable.includes(term)) {
      score += term.length > 4 ? 1.25 : 0.65;
    }
  }

  const normalizedPrediction = normalizeSearchText(predictionText);
  for (const className of chunk.modelClasses || []) {
    if (normalizedPrediction.includes(normalizeSearchText(className))) {
      score += 10;
    }
  }

  if (/(ថ្នាំ|បាញ់|medicine|fungicide|insecticide|copper|mancozeb)/i.test(prompt) && chunk.medicine) {
    score += 1.5;
  }
  if (/(ជី|npk|fertilizer|ដី|soil)/i.test(prompt) && chunk.id === "fertilizer") {
    score += 8;
  }
  if (/(សំណើម|ភ្លៀង|weather|rain|humidity|អាកាសធាតុ|disease risk)/i.test(prompt) && chunk.id === "weather-disease-risk") {
    score += 8;
  }
  if (/(ស្រោច|ទឹក|irrigation|water|drainage|បង្ហូរទឹក|ទឹកជាំ)/i.test(prompt) && chunk.id === "phytophthora-integrated-management") {
    score += 6;
  }
  if (/(ពិនិត្យ|តាមដាន|ថតរូប|រូបភាព|confidence|ភាពជឿជាក់|scan|scout|inspection)/i.test(prompt) && chunk.id === "orchard-scouting") {
    score += 7;
  }
  if (/(កាត់មែក|ខ្យល់|គុម្ព|សម្អាត|មែកស្ងួត|prune|pruning|canopy|airflow|sanitation)/i.test(prompt) && chunk.id === "canopy-pruning-airflow") {
    score += 8;
  }
  if (/(ផ្កា|ចេញផ្កា|កាន់ផ្លែ|ប្រមូលផល|flower|fruit set|harvest)/i.test(prompt) && chunk.id === "flower-fruit-stage-care") {
    score += 8;
  }
  if (/(សុវត្ថិភាព|ppe|phi|rei|ម៉ាស់|ស្រោមដៃ|label|ស្លាក)/i.test(prompt) && chunk.id === "pdf-safety") {
    score += 8;
  }

  return score;
}

function buildKnowledgeContext(chunks = []) {
  if (!chunks.length) {
    return "Selected searchable PDF guide sections: none for this general conversation. Do not mention the PDF guide.";
  }

  return [
    "Selected searchable PDF guide sections. Use only these sections unless giving general non-dosage advice:",
    ...chunks.map((chunk, index) => [
      `${index + 1}. ${chunk.title} (${chunk.pages}; ${chunk.source})`,
      `Summary: ${chunk.summary}`,
      `Actions: ${chunk.actions}`,
      `Medicine/fertilizer: ${chunk.medicine}`,
    ].join("\n")),
  ].join("\n");
}

function buildProductContext(products = []) {
  if (!products.length) {
    return "Selected product database: none selected for this question.";
  }

  return [
    "Selected product database:",
    JSON.stringify(products.map((product) => ({
      name: product.name,
      purpose: product.purpose,
      active: product.active,
      credit: product.credit,
    }))),
  ].join("\n");
}

function getPredictionText(latestPrediction) {
  if (!latestPrediction) {
    return "";
  }

  if (typeof latestPrediction === "string") {
    return latestPrediction;
  }

  return [
    latestPrediction.className,
    latestPrediction.label,
    latestPrediction.summary,
    latestPrediction.confidence,
    ...(latestPrediction.medicines || []),
  ].filter(Boolean).join(" ");
}

function normalizeSearchText(value = "") {
  let text = String(value || "").toLowerCase();
  for (const [pattern, replacement] of KHMER_TEXT_FIXES) {
    text = text.replace(pattern, String(replacement).toLowerCase());
  }
  return text
    .replace(/[_/|+]/g, " ")
    .replace(/[.,!?;:()[\]{}"'`*#<>-]/g, " ")
    .replace(/[។៕៖、，]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(value = "") {
  return normalizeSearchText(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function selectProducts(question, latestPrediction) {
  const fertilizerOnly = isFertilizerOnlyQuestion(question);
  const text = normalizeSearchText([
    question,
    referencesLatestPrediction(question) ? latestPrediction?.className : "",
    referencesLatestPrediction(question) ? latestPrediction?.label : "",
    ...(referencesLatestPrediction(question) ? latestPrediction?.medicines || [] : []),
  ]
    .filter(Boolean)
    .join(" "));

  if (fertilizerOnly) {
    return PRODUCT_DATABASE
      .filter((product) => ["SOIL_TEST", "ORGANIC_MATTER", "CALCIUM_MAG_BORON"].includes(product.key))
      .map((product) => ({
        name: product.name,
        image: product.image,
        purpose: product.purpose,
        active: product.active,
        credit: product.credit,
      }));
  }

  const scored = PRODUCT_DATABASE
    .map((product) => ({
      product,
      score: product.keywords.reduce((total, keyword) => total + (text.includes(normalizeSearchText(keyword)) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ product }) => ({
      name: product.name,
      image: product.image,
      purpose: product.purpose,
      active: product.active,
      credit: product.credit,
    }));

  if (isMedicineOrFertilizerQuestion(question) && scored.length < 3) {
    const fallbackProducts = PRODUCT_DATABASE
      .filter((product) => product.key !== "SOIL_TEST" || /(ជី|fertilizer|npk|ដី)/i.test(text))
      .map((product) => ({
        name: product.name,
        image: product.image,
        purpose: product.purpose,
        active: product.active,
        credit: product.credit,
      }));

    return dedupeProducts([...scored, ...fallbackProducts]).slice(0, 6);
  }

  return scored.slice(0, 6);
}

function dedupeProducts(products = []) {
  const seen = new Set();
  return products.filter((product) => {
    const key = String(product.name || "").toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
