from __future__ import annotations

import base64
import os
import sys
from pathlib import Path

import streamlit as st
import torch
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from durianguard.data import build_eval_transform  # noqa: E402
from durianguard.model import load_checkpoint  # noqa: E402


APP_TITLE = "AI បែងចែកជម្ងឺទុរេន"
OFFLINE_MODE = os.getenv("DURIANGUARD_OFFLINE", "0").strip() == "1"
LOGO_IMAGE = ROOT / "assets" / "ai_durian_tree_logo.png"

KHMER_FONT_CSS = """
<style>
:root {
    --khmer-font-family: "Noto Sans Khmer", "Khmer OS Siemreap",
        "Khmer OS Battambang", "Battambang", "Kantumruy Pro",
        "Hanuman", "Leelawadee UI", Arial, sans-serif;
}

[data-testid="stAppViewContainer"] {
    font-family: var(--khmer-font-family) !important;
    letter-spacing: 0 !important;
}

[data-testid="stMarkdownContainer"],
[data-testid="stMarkdownContainer"] p,
[data-testid="stMarkdownContainer"] li,
[data-testid="stWidgetLabel"],
[data-testid="stWidgetLabel"] *,
[data-testid="stAlert"] *,
[data-testid="stMetric"] *,
input,
textarea {
    font-family: var(--khmer-font-family) !important;
    letter-spacing: 0 !important;
}

[data-testid="stMarkdownContainer"] p,
[data-testid="stMarkdownContainer"] li,
[data-testid="stAlert"] *,
[data-testid="stCaptionContainer"] {
    line-height: 1.75 !important;
}

h1 {
    font-family: var(--khmer-font-family) !important;
    font-size: clamp(2.2rem, 5vw, 3.4rem) !important;
    line-height: 1.25 !important;
    letter-spacing: 0 !important;
}

h2, h3, h4 {
    font-family: var(--khmer-font-family) !important;
    line-height: 1.45 !important;
    letter-spacing: 0 !important;
}

[data-testid="stExpander"] summary,
[data-testid="stExpander"] summary p {
    font-family: var(--khmer-font-family) !important;
    line-height: 1.45 !important;
}

[data-testid="stFileUploaderDropzone"] {
    min-height: 92px !important;
    padding: 1rem 1.25rem !important;
    align-items: center !important;
}

[data-testid="stFileUploaderDropzone"] button {
    min-height: 42px !important;
    overflow: hidden !important;
    font-family: var(--khmer-font-family) !important;
    font-size: 0 !important;
    line-height: 1.2 !important;
}

[data-testid="stFileUploaderDropzone"] button span,
[data-testid="stFileUploaderDropzone"] button p {
    display: none !important;
}

[data-testid="stFileUploaderDropzone"] button::after {
    content: "ជ្រើសរូប";
    font-family: var(--khmer-font-family) !important;
    font-size: 1rem !important;
    line-height: 1.2 !important;
}

[data-testid="stFileUploaderDropzone"] small,
[data-testid="stFileUploaderDropzone"] span,
[data-testid="stFileUploaderDropzone"] div {
    line-height: 1.45 !important;
}

[data-testid="stMetricValue"] {
    line-height: 1.35 !important;
}

.app-logo-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0.4rem 0 0.75rem;
}

.app-logo-mark {
    position: relative;
    width: 92px;
    height: 92px;
    flex: 0 0 92px;
    border-radius: 18px;
    background: #050806;
    border: 1px solid rgba(134, 239, 172, 0.55);
    box-shadow: 0 10px 30px rgba(34, 197, 94, 0.12);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
}

.app-logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 8px 14px rgba(34, 197, 94, 0.18));
}

.app-logo-ai {
    position: absolute;
    left: 7px;
    bottom: 7px;
    color: #052e16;
    background: #dcfce7;
    font-weight: 800;
    font-size: 0.96rem;
    letter-spacing: 0 !important;
    line-height: 1;
    padding: 0.28rem 0.34rem;
    border-radius: 8px;
    border: 1px solid rgba(134, 239, 172, 0.8);
    z-index: 5;
}

.app-logo-canopy {
    position: absolute;
    left: 20px;
    top: 8px;
    width: 48px;
    height: 40px;
    border-radius: 58% 58% 46% 46%;
    background: #16a34a;
    box-shadow:
        -14px 10px 0 #15803d,
        14px 10px 0 #22c55e,
        -3px -7px 0 #86efac,
        4px 17px 0 #4ade80;
    z-index: 2;
}

.app-logo-branch {
    position: absolute;
    left: 32px;
    top: 39px;
    width: 32px;
    height: 3px;
    border-radius: 999px;
    background: #854d0e;
    transform: rotate(-13deg);
    z-index: 3;
}

.app-logo-trunk {
    position: absolute;
    left: 42px;
    top: 40px;
    width: 10px;
    height: 30px;
    border-radius: 8px 8px 4px 4px;
    background: linear-gradient(90deg, #713f12, #a16207 55%, #854d0e);
    z-index: 1;
}

.app-logo-durian {
    position: absolute;
    width: 19px;
    height: 19px;
    border-radius: 50%;
    background: #d9f99d;
    border: 2px solid #65a30d;
    z-index: 4;
}

.app-logo-durian-one {
    right: 14px;
    bottom: 18px;
}

.app-logo-durian-two {
    right: 31px;
    bottom: 30px;
    transform: scale(0.82);
}

.app-logo-durian::before {
    content: "";
    position: absolute;
    left: -4px;
    top: 7px;
    width: 24px;
    height: 2px;
    background: repeating-linear-gradient(
        90deg,
        #65a30d 0 2px,
        transparent 2px 5px
    );
    transform: rotate(35deg);
}

.app-logo-ground {
    position: absolute;
    left: 17px;
    bottom: 7px;
    width: 52px;
    height: 5px;
    border-radius: 999px;
    background: rgba(134, 239, 172, 0.5);
}

.app-logo-title {
    color: #f8fafc;
    font-size: clamp(2.15rem, 5vw, 3.35rem);
    font-weight: 800;
    line-height: 1.2;
}

.app-logo-subtitle {
    color: #cbd5e1;
    line-height: 1.65;
    margin-top: 0.15rem;
}

.farmer-status {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.75rem;
    margin: 0.25rem 0 0.75rem;
    border: 1px solid rgba(120, 144, 156, 0.35);
    border-radius: 999px;
    color: #cbd5e1;
    background: rgba(15, 23, 42, 0.35);
    font-size: 0.9rem;
}

.farmer-dot {
    width: 0.62rem;
    height: 0.62rem;
    border-radius: 999px;
    background: #22c55e;
}

.sign-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.65rem;
    margin: 1rem 0 1.1rem;
}

.sign-card {
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-left: 4px solid #22c55e;
    border-radius: 8px;
    padding: 0.85rem;
    background: rgba(30, 41, 59, 0.34);
}

.sign-number {
    color: #86efac;
    font-size: 0.82rem;
    font-weight: 700;
    margin-bottom: 0.2rem;
}

.sign-title {
    color: #f8fafc;
    font-weight: 700;
    margin-bottom: 0.2rem;
}

.sign-detail {
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.65;
}

.workflow-title {
    margin-top: 0.35rem;
    color: #f8fafc;
    font-size: 1.1rem;
    font-weight: 700;
}

.workflow-note {
    color: #cbd5e1;
    line-height: 1.7;
}

@media (max-width: 900px) {
    .sign-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 560px) {
    .sign-grid {
        grid-template-columns: 1fr;
    }

    .app-logo-row {
        align-items: flex-start;
    }

    .app-logo-mark {
        width: 58px;
        height: 58px;
        flex-basis: 58px;
    }
}
</style>
"""


CLASS_LABELS_KH = {
    "ALGAL_LEAF_SPOT": "ជំងឺអុចស្លឹកដោយសារសារាយ",
    "ALLOCARIDARA_ATTACK": "ការវាយប្រហារពីសត្វល្អិត",
    "HEALTHY_LEAF": "ស្លឹកមានសុខភាពល្អ",
    "LEAF_BLIGHT": "ជំងឺរលាកស្លឹក",
    "PHOMOPSIS_LEAF_SPOT": "ជំងឺអុចស្លឹកប្រភេទហ្វូម៉ុបស៊ីស",
}


RECOMMENDATIONS = {
    "ALGAL_LEAF_SPOT": {
        "title": "អាចជាជំងឺអុចស្លឹកដោយសារសារាយ",
        "urgency": "medium",
        "urgency_label": "មធ្យម",
        "summary": "រោគសញ្ញានេះច្រើនកើតឡើងពេលសំណើមខ្ពស់ និងខ្យល់ចេញចូលក្នុងមែកស្លឹកមិនល្អ។",
        "why_important": "ជំងឺនេះធ្វើឲ្យផ្ទៃស្លឹកខូច កាត់បន្ថយការធ្វើរស្មីសំយោគ ហើយអាចកើតច្រើនក្នុងចម្ការដែលសើម និងស្ទះខ្យល់។",
        "actions": [
            "ពិនិត្យស្លឹកជិតខាង ដើម្បីរកមើលចំណុចពណ៌ទឹកក្រូច បៃតង ឬត្នោត។",
            "កាត់តម្រឹមមែកដែលស្ទះ ដើម្បីឲ្យខ្យល់ចេញចូលបានល្អ។",
            "ដក ឬប្រមូលស្លឹកដែលឆ្លងខ្លាំង ប្រសិនបើរោគសញ្ញាកំពុងរាលដាល។",
            "សួរអ្នកជំនាញកសិកម្មមុនប្រើថ្នាំព្យាបាល។",
        ],
        "prevention": "កុំឲ្យស្លឹកសើមយូរ ហើយរក្សាមែកស្លឹកឲ្យមានខ្យល់ចេញចូលល្អ។",
        "chemical_guidance": [
            "បើរោគសញ្ញាតិច សូមកែសម្រួលសំណើម កាត់មែកស្ទះ និងតាមដានមុនប្រើថ្នាំ។",
            "រូបថ្នាំ NO COPPER ខាងក្រោមជារូបដែលអ្នកបានផ្តល់សម្រាប់ករណី ALGAL_LEAF_SPOT។ សូមសួរអ្នកជំនាញកសិកម្ម និងប្រើតាមស្លាកផលិតផលប៉ុណ្ណោះ។",
            "ពាក់សម្ភារៈការពារ ហើយកុំបាញ់ពេលខ្យល់ខ្លាំង ពេលភ្លៀង ឬពេលថ្ងៃក្តៅខ្លាំង។",
        ],
    },
    "ALLOCARIDARA_ATTACK": {
        "title": "អាចជាការវាយប្រហារពីសត្វល្អិត",
        "urgency": "medium",
        "urgency_label": "មធ្យម",
        "summary": "លទ្ធផលនេះបង្ហាញថាស្លឹកអាចរងការខូចខាតពីសត្វល្អិត មិនមែនជំងឺផ្សិតទេ។",
        "why_important": "សត្វល្អិតប្រភេទនេះអាចជញ្ជក់ទឹកពីស្លឹកខ្ចី និងត្រួយ ធ្វើឲ្យស្លឹករួញ ខូចទ្រង់ទ្រាយ និងប៉ះពាល់ដល់ការលូតលាស់ថ្មី។",
        "actions": [
            "ពិនិត្យស្លឹកខ្ចី ត្រួយ និងផ្នែកក្រោមស្លឹក។",
            "រកមើលសត្វល្អិត ពងសត្វល្អិត ស្លឹករួញ ឬស្នាមស៊ីតូចៗ។",
            "ពិនិត្យដើមជាច្រើន មុនសម្រេចចិត្តព្យាបាល។",
            "ប្រើវិធីគ្រប់គ្រងសត្វល្អិតតាមការណែនាំរបស់អ្នកជំនាញក្នុងតំបន់។",
        ],
        "prevention": "តាមដានស្លឹកខ្ចីឲ្យបានញឹកញាប់ ព្រោះស្លឹកខ្ចីងាយរងការខូចខាតពីសត្វល្អិត។",
        "chemical_guidance": [
            "បាញ់ថ្នាំសត្វល្អិតតែពេលរកឃើញសត្វល្អិត ឬស្នាមវាយប្រហារច្បាស់លាស់លើស្លឹកខ្ចី។",
            "រូបថ្នាំ U-T ខាងក្រោមជារូបដែលអ្នកបានផ្តល់សម្រាប់ករណីនេះ។ សូមអានស្លាកឲ្យច្បាស់ និងប្រើតាមកម្រិតណែនាំលើស្លាកផលិតផល។",
            "កុំបាញ់នៅពេលមានភ្លៀង ខ្យល់ខ្លាំង ឬពេលមានឃ្មុំ/សត្វមានប្រយោជន៍កំពុងច្រើន។ ពាក់ម៉ាស់ ស្រោមដៃ និងសម្លៀកបំពាក់ការពារ។",
        ],
    },
    "HEALTHY_LEAF": {
        "title": "ស្លឹកមើលទៅមានសុខភាពល្អ",
        "urgency": "low",
        "urgency_label": "ទាប",
        "summary": "ម៉ូដែលមិនបានរកឃើញរោគសញ្ញាជំងឺច្បាស់ពីរូបនេះទេ។",
        "why_important": "ការស្គាល់ស្លឹកដែលមានសុខភាពល្អជួយឲ្យកសិករមិនចំណាយថ្នាំ ឬកម្លាំងព្យាបាលដោយមិនចាំបាច់។",
        "actions": [
            "បន្តតាមដានដើមជាធម្មតា។",
            "ថតរូបម្ដងទៀត ប្រសិនបើមានរោគសញ្ញាលើស្លឹកផ្សេងៗ។",
            "កត់ត្រាទីតាំងដើម កាលបរិច្ឆេទ និងអាកាសធាតុ។",
        ],
        "prevention": "ថែរក្សាប្រព័ន្ធស្រោចស្រព បង្ហូរទឹក កាត់តម្រឹមមែក និងពិនិត្យចម្ការឲ្យបានទៀងទាត់។",
        "chemical_guidance": [
            "មិនចាំបាច់ប្រើថ្នាំបើស្លឹកមើលទៅមានសុខភាពល្អ និងមិនមានរោគសញ្ញាផ្សេងទៀត។",
            "បន្តថត និងកត់ត្រាប្រសិនបើមានការផ្លាស់ប្តូរពណ៌ ស្នាមអុច ឬស្លឹករួញ។",
        ],
    },
    "LEAF_BLIGHT": {
        "title": "អាចជាជំងឺរលាកស្លឹក",
        "urgency": "high",
        "urgency_label": "ខ្ពស់",
        "summary": "ជំងឺរលាកស្លឹកអាចរាលដាលលឿនពេលសើម ហើយអាចប៉ះពាល់ដល់សុខភាពស្លឹក។",
        "why_important": "ជំងឺនេះអាចបន្ថយផ្ទៃស្លឹកដែលធ្វើអាហារ ធ្វើឲ្យដើមខ្សោយ និងបង្កឲ្យការលូតលាស់ ឬទិន្នផលធ្លាក់ចុះបើមិនគ្រប់គ្រងទាន់ពេល។",
        "actions": [
            "ពិនិត្យដើមដដែល និងដើមជិតខាង ដើម្បីមើលថារោគសញ្ញារាលដាលឬអត់។",
            "ដក ឬបំបែកស្លឹកដែលឆ្លងខ្លាំង ប្រសិនបើអាចធ្វើបាន។",
            "បង្កើនខ្យល់ចេញចូល និងកុំឲ្យស្លឹកសើមដោយមិនចាំបាច់។",
            "បញ្ជាក់ជាមួយអ្នកជំនាញកសិកម្ម ប្រសិនបើមានស្លឹក ឬដើមជាច្រើនរងផលប៉ះពាល់។",
        ],
        "prevention": "រក្សាអនាម័យចម្ការ បង្ហូរទឹកឲ្យល្អ និងបើកមែកស្លឹកឲ្យខ្យល់ចេញចូល ជាពិសេសរដូវភ្លៀង។",
        "chemical_guidance": [
            "ដកស្លឹកដែលខូចខ្លាំង និងកាត់បន្ថយសំណើមជុំវិញដើម មុនពិចារណាប្រើថ្នាំ។",
            "រូបថ្នាំ NO COPPER ខាងក្រោមជារូបដែលអ្នកបានផ្តល់សម្រាប់ករណី LEAF_BLIGHT។ បើជំងឺរាលដាល សូមសួរអ្នកជំនាញ និងប្រើតាមស្លាកផលិតផលប៉ុណ្ណោះ។",
            "កត់ត្រាថ្ងៃបាញ់ថ្នាំ ឈ្មោះថ្នាំ និងស្ថានភាពអាកាសធាតុ ដើម្បីតាមដានលទ្ធផល។",
        ],
    },
    "PHOMOPSIS_LEAF_SPOT": {
        "title": "អាចជាជំងឺអុចស្លឹកប្រភេទហ្វូម៉ុបស៊ីស",
        "urgency": "medium",
        "urgency_label": "មធ្យម",
        "summary": "រោគសញ្ញានេះអាចបង្ហាញជាចំណុចតូចៗលើស្លឹក ហើយអាចរាលដាលពេលចម្ការមានសំណើមខ្ពស់។",
        "why_important": "Phomopsis អាចបង្កជាស្នាមអុចលើស្លឹក និងរាលដាលនៅពេលសើម ធ្វើឲ្យស្លឹកបាត់បង់សុខភាព និងបង្កើនហានិភ័យឆ្លងទៅផ្នែកផ្សេងៗ។",
        "actions": [
            "តាមដានមើលថាចំណុចលើស្លឹកកើនឡើងក្នុងរយៈពេលប៉ុន្មានថ្ងៃឬអត់។",
            "កាត់មែកដែលឆ្លង ឬមែកដែលស្ទះ ប្រសិនបើអ្នកជំនាញណែនាំ។",
            "កុំយកសំណល់ស្លឹកដែលឆ្លងទៅកន្លែងផ្សេងក្នុងចម្ការ។",
            "សួរអ្នកជំនាញកសិកម្ម ប្រសិនបើរោគសញ្ញារាលដាលច្រើន។",
        ],
        "prevention": "កាត់បន្ថយសំណើមជុំវិញមែកស្លឹក និងប្រមូលសំណល់រុក្ខជាតិដែលឆ្លងចេញពីចម្ការ។",
        "chemical_guidance": [
            "រូបថ្នាំ COPTRIL ខាងក្រោមជារូបដែលអ្នកបានផ្តល់សម្រាប់ករណី PHOMOPSIS_LEAF_SPOT។ សូមផ្ទៀងផ្ទាត់ឈ្មោះជំងឺ និងអានស្លាកមុនប្រើ។",
            "ប្រើថ្នាំតាមកម្រិត និងចន្លោះពេលដែលមានលើស្លាកផលិតផល ឬតាមការណែនាំរបស់អ្នកជំនាញកសិកម្ម។",
            "ពាក់សម្ភារៈការពារ កុំបាញ់ពេលភ្លៀង ឬខ្យល់ខ្លាំង ហើយរក្សាទុកថ្នាំឲ្យឆ្ងាយពីកុមារ និងសត្វចិញ្ចឹម។",
        ],
    },
}


KHMER_REFERENCES = [
    {
        "label": "វីដេអូ: របៀបមើលទុរេនមានជំងឺ",
        "url": "https://www.youtube.com/watch?v=EK01gMghtIo",
        "source": "យូធូប",
    },
    {
        "label": "អត្ថបទ: របៀបមើលទុរេនមានជំងឺ",
        "url": "https://angkorgreen.com.kh/km/growing-guide/%E1%9E%9A%E1%9E%94%E1%9F%80%E1%9E%94%E1%9E%98%E1%9E%BE%E1%9E%9B%E1%9E%91%E1%9E%BB%E1%9E%9A%E1%9F%81%E1%9E%93%E1%9E%98%E1%9E%B6%E1%9E%93%E1%9E%87%E1%9F%86%E1%9E%84%E1%9E%BA/",
        "source": "អង្គរ ហ្គ្រីន",
    },
    {
        "label": "អត្ថបទ: ជំងឺ និងដំណោះស្រាយលើដំណាំធុរេននៅរដូវវស្សា",
        "url": "https://kaksekam-time.com/?p=1757",
        "source": "កសិកម្ម ថាម",
    },
    {
        "label": "ឯកសារ PDF: ការដាំធូរេន",
        "url": "https://elibrary.maff.gov.kh/assets/files/books/fe44d62fc5ba63ed1430ac85d3605e3c1534992179.pdf",
        "source": "បណ្ណាល័យអេឡិចត្រូនិក MAFF",
    },
    {
        "label": "ឯកសារ PDF: វិធានការទប់ស្កាត់ និងកម្ចាត់សមាសភាពចង្រៃលើដំណាំទុរេន",
        "url": "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf",
        "source": "បណ្ណាល័យអេឡិចត្រូនិក MAFF",
    },
    {
        "label": "មគ្គុទ្ទេសក៍: ស្លាកសញ្ញាណែនាំពីថ្នាំកសិកម្ម",
        "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
        "source": "East-West Seed GrowHow",
    },
    {
        "label": "មគ្គុទ្ទេសក៍: ការគ្រប់គ្រងកត្តាចង្រៃ និងសុវត្ថិភាពក្នុងកសិកម្ម",
        "url": "https://growhow.eastwestseed.com/kh/kh/download-crop-guide/10",
        "source": "East-West Seed GrowHow",
    },
]


REFERENCE_IMAGES = {
    "ALLOCARIDARA_ATTACK": {
        "path": ROOT / "assets" / "allocarsidara_malayensis_psyllid.jpg",
        "caption": "រូបគំរូសត្វល្អិត Durian psyllid (Allocarsidara malayensis) ដែលអាចវាយប្រហារស្លឹកទុរេន",
        "credit": "(c) ChuahTC, CC BY-NC, via iNaturalist",
        "source_url": "https://www.inaturalist.org/observations/373787765",
    },
}


PRODUCT_IMAGES = {
    "ALGAL_LEAF_SPOT": [
        {
            "product_key": "NO_COPPER",
            "path": ROOT / "assets" / "no_copper_front.png",
            "caption": "រូបថ្នាំ NO COPPER សម្រាប់ ALGAL_LEAF_SPOT - ផ្នែកខាងមុខ",
        },
        {
            "product_key": "NO_COPPER",
            "path": ROOT / "assets" / "no_copper_back.png",
            "caption": "រូបថ្នាំ NO COPPER សម្រាប់ ALGAL_LEAF_SPOT - ផ្នែកខាងក្រោយ/ស្លាកណែនាំ",
        },
        {
            "product_key": "AG_COP_TRI",
            "path": ROOT / "assets" / "product_references" / "ag_cop_tri.png",
            "caption": "COP TRI - ប្រភពរូបភាព Angkor Green",
        },
    ],
    "ALLOCARIDARA_ATTACK": [
        {
            "product_key": "U_T_INSECTICIDE",
            "path": ROOT / "assets" / "ut_insecticide_allocaridara.png",
            "caption": "រូបថ្នាំ U-T សម្រាប់ការវាយប្រហារពីសត្វល្អិត",
        },
        {
            "product_key": "AG_KON_NEAK6",
            "path": ROOT / "assets" / "product_references" / "ag_kon_neak6_front.png",
            "caption": "KON NEAK6 - ផ្នែកខាងមុខ ប្រភពរូបភាព Angkor Green",
        },
        {
            "product_key": "AG_KON_NEAK6",
            "path": ROOT / "assets" / "product_references" / "ag_kon_neak6_back.png",
            "caption": "KON NEAK6 - ផ្នែកខាងក្រោយ ប្រភពរូបភាព Angkor Green",
        },
        {
            "product_key": "AG_SRAKAR_NEAK",
            "path": ROOT / "assets" / "product_references" / "ag_srakar_neak.png",
            "caption": "SRAKAR NEAK - ប្រភពរូបភាព Angkor Green",
        },
        {
            "product_key": "AG_BUTA",
            "path": ROOT / "assets" / "product_references" / "ag_buta.png",
            "caption": "BUTA - ប្រភពរូបភាព Angkor Green",
        },
    ],
    "LEAF_BLIGHT": [
        {
            "product_key": "NO_COPPER",
            "path": ROOT / "assets" / "no_copper_front.png",
            "caption": "រូបថ្នាំ NO COPPER សម្រាប់ LEAF_BLIGHT - ផ្នែកខាងមុខ",
        },
        {
            "product_key": "NO_COPPER",
            "path": ROOT / "assets" / "no_copper_back.png",
            "caption": "រូបថ្នាំ NO COPPER សម្រាប់ LEAF_BLIGHT - ផ្នែកខាងក្រោយ/ស្លាកណែនាំ",
        },
        {
            "product_key": "AG_PERFECT_72WP",
            "path": ROOT / "assets" / "product_references" / "ag_perfect_72wp.png",
            "caption": "PERFECT 72%WP - ប្រភពរូបភាព Angkor Green",
        },
        {
            "product_key": "AG_REVUS_OPTI",
            "path": ROOT / "assets" / "product_references" / "ag_revus_opti.png",
            "caption": "REVUS OPTI 440SC - ប្រភពរូបភាព Angkor Green",
        },
        {
            "product_key": "AG_FOLU",
            "path": ROOT / "assets" / "product_references" / "ag_folu.png",
            "caption": "FOLU - ប្រភពរូបភាព Angkor Green",
        },
    ],
    "PHOMOPSIS_LEAF_SPOT": [
        {
            "product_key": "COPTRIL",
            "path": ROOT / "assets" / "coptril_phomopsis_leaf_spot.png",
            "caption": "រូបថ្នាំ COPTRIL សម្រាប់ PHOMOPSIS_LEAF_SPOT",
        },
        {
            "product_key": "AG_COP_TRI",
            "path": ROOT / "assets" / "product_references" / "ag_cop_tri.png",
            "caption": "COP TRI - ប្រភពរូបភាព Angkor Green",
        },
        {
            "product_key": "AG_ANUMANCO_80WP",
            "path": ROOT / "assets" / "product_references" / "ag_anumanco.png",
            "caption": "ANUMANCO 80%WP - ប្រភពរូបភាព Angkor Green",
        },
        {
            "product_key": "AG_TILT_SUPER_300EC",
            "path": ROOT / "assets" / "product_references" / "ag_tilt_super.png",
            "caption": "TILT SUPER 300EC - ប្រភពរូបភាព Angkor Green",
        },
    ],
}


MEDICINE_INFO = {
    "NO_COPPER": {
        "name": "NO COPPER",
        "maker": "Haktore Golden Harvest Co., Ltd - អានបានពីស្លាកខាងក្រោយនៃផលិតផល",
        "photo_credit": "រូបថ្នាំផ្តល់ដោយក្រុមគម្រោង/អ្នកប្រើ",
        "label_reading": [
            "ឈ្មោះផលិតផល: NO COPPER",
            "បរិមាណលើដប: 1L",
            "ខាងក្រោយស្លាកអានបាន: Haktore Golden Harvest Co., Ltd",
            "សារធាតុសកម្មមិនអានបានច្បាស់ពីរូប ដូច្នេះត្រូវពិនិត្យស្លាក/QR មុនប្រើ។",
        ],
        "active": "សារធាតុសកម្មក្នុងរូបមិនអានបានច្បាស់។ សូមផ្ទៀងផ្ទាត់លើស្លាក ឬ QR មុនប្រើ។ សម្រាប់អុចស្លឹកដោយសារសារាយ និងស្នាមរលាកស្លឹក ការស្រាវជ្រាវជាច្រើនណែនាំក្រុមថ្នាំការពារផ្ទៃស្លឹក ដូចជា copper-based/contact protectant តាមស្លាកផលិតផល។",
        "function": "ជួយការពារផ្ទៃស្លឹក និងកាត់បន្ថយការរាលដាលនៅពេលសំណើមខ្ពស់។ ថ្នាំប្រភេទការពារមិនអាចធ្វើឲ្យស្លឹកដែលខូចខ្លាំងត្រឡប់មកល្អវិញបានទេ។",
        "responsible_use": [
            "ប្រើតែបើស្លាកផលិតផលអនុញ្ញាតសម្រាប់ទុរេន និងរោគសញ្ញាដែលកំពុងឃើញ។",
            "ពាក់ម៉ាស់ ស្រោមដៃ អាវដៃវែង និងវ៉ែនតាការពារ ពេលលាយ ឬបាញ់ថ្នាំ។",
            "កុំបាញ់ពេលភ្លៀង ខ្យល់ខ្លាំង ឬថ្ងៃក្តៅខ្លាំង ហើយកុំលាយជាមួយថ្នាំផ្សេងៗ ប្រសិនបើស្លាកមិនណែនាំ។",
        ],
        "sources": [
            {
                "label": "Clemson HGIC - algal leaf spot and copper sprays",
                "url": "https://hgic.clemson.edu/factsheet/algal-leaf-spot/",
            },
            {
                "label": "PNW Handbook - copper-based bactericides and fungicides",
                "url": "https://pnwhandbooks.org/plantdisease/pesticide-articles/copper-based-bactericides-fungicides",
            },
            {
                "label": "MAFF Khmer PDF - durian pest management",
                "url": "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "COPTRIL": {
        "name": "COPTRIL",
        "maker": "ម៉ាក COPTRIL - ក្រុមហ៊ុនផលិត/ចែកចាយមិនអានបានច្បាស់ពីរូប។ សូមផ្ទៀងផ្ទាត់លើស្លាក ឬ QR មុនប្រើ។",
        "photo_credit": "រូបថ្នាំផ្តល់ដោយក្រុមគម្រោង/អ្នកប្រើ",
        "label_reading": [
            "ឈ្មោះផលិតផល: COPTRIL",
            "សារធាតុសកម្មដែលអានបាន: Copper oxychloride + Kasugamycin WP",
            "តារាងលើស្លាកបង្ហាញកម្រិតប្រើសម្រាប់ជំងឺមួយចំនួន ប៉ុន្តែលេខ g/kg និងកម្រិតប្រើមិនអានបានពេញលេញពីរូប។",
            "មាន QR code និងលេខទូរស័ព្ទលើស្លាក សម្រាប់ផ្ទៀងផ្ទាត់ព័ត៌មានផលិតផល។",
        ],
        "active": "រូបស្លាកបង្ហាញថាជាក្រុម Copper oxychloride + Kasugamycin WP ប៉ុន្តែភាគរយ/g/kg មិនអានបានច្បាស់។ សូមយកភាគរយពិតពីស្លាកផលិតផល ឬ QR។",
        "function": "Copper oxychloride ជាថ្នាំការពារផ្ទៃស្លឹកប្រភេទ contact/multi-site។ Kasugamycin ជួយរារាំងការលូតលាស់របស់មេរោគខ្លះៗ។ សម្រាប់ PHOMOPSIS_LEAF_SPOT វាជាជម្រើសពិចារណាបន្ទាប់ពីកាត់បន្ថយសំណើម និងដកស្លឹកឆ្លង។",
        "responsible_use": [
            "ប្រើតាមកម្រិត ចន្លោះពេល និងដំណាំដែលមានលើស្លាកផលិតផលប៉ុណ្ណោះ។",
            "កុំប្រើជាបន្តបន្ទាប់ដោយគ្មានការតាមដាន ព្រោះអាចបង្កហានិភ័យធន់ថ្នាំ និងសំណល់ថ្នាំ។",
            "បន្ទាប់ពីបាញ់ សូមគោរពរយៈពេលចូលចម្ការឡើងវិញ និងរយៈពេលមុនប្រមូលផលតាមស្លាក។",
        ],
        "sources": [
            {
                "label": "Research on Phomopsis durionis leaf spot on durian",
                "url": "https://actavia.mendelu.cz/pdfs/acu/2016/01/22.pdf",
            },
            {
                "label": "Kasugamycin + Copper oxychloride label example",
                "url": "https://ppqs.gov.in/sites/default/files/kasugamycin_5_copper_oxychloride_45_wp93fdhanuka_agritech_limited_1.pdf",
            },
            {
                "label": "MAFF Khmer PDF - durian pest management",
                "url": "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "U_T_INSECTICIDE": {
        "name": "U-T",
        "maker": "ម៉ាក U-T - ក្រុមហ៊ុនផលិត/ចែកចាយមិនអានបានច្បាស់ពីរូប។ សូមផ្ទៀងផ្ទាត់លើស្លាក ឬ QR មុនប្រើ។",
        "photo_credit": "រូបថ្នាំផ្តល់ដោយក្រុមគម្រោង/អ្នកប្រើ",
        "label_reading": [
            "ឈ្មោះផលិតផល: U-T",
            "សារធាតុសកម្មដែលអានបាន: Dinotefuran 20% + Pymetrozine 50% WDG",
            "ប្រភេទប្រើប្រាស់: ថ្នាំកម្ចាត់សត្វល្អិតជញ្ជក់ទឹក/បំផ្លាញស្លឹកខ្ចី",
            "លេខ/កូដលើស្លាកដែលអានបាន: FR01 9074/0923 UT-GDA",
            "មាន QR code លើស្លាក សម្រាប់ផ្ទៀងផ្ទាត់កម្រិតប្រើ និងព័ត៌មានចុះបញ្ជី។",
        ],
        "active": "Dinotefuran 20% + Pymetrozine 50% WDG - អានបានពីស្លាករូបថ្នាំ។",
        "function": "Dinotefuran ជាក្រុម neonicotinoid មានសកម្មភាព systemic សម្រាប់សត្វល្អិតជញ្ជក់ទឹករុក្ខជាតិ។ Pymetrozine ជា feeding blocker ដែលធ្វើឲ្យសត្វល្អិតជញ្ជក់ទឹកបញ្ឈប់ការចិញ្ចឹម។ សមស្របសម្រាប់ការពិចារណាពេលរកឃើញសត្វល្អិត/ស្នាមវាយប្រហារ ALLOCARIDARA_ATTACK ច្បាស់។",
        "responsible_use": [
            "បាញ់តែពេលមានសត្វល្អិត ឬស្នាមវាយប្រហារច្បាស់ មិនបាញ់ជាការពារដោយគ្មានមូលហេតុ។",
            "កុំបាញ់ពេលដើមកំពុងចេញផ្កា ឬពេលមានឃ្មុំ និងសត្វមានប្រយោជន៍ច្រើន។",
            "ប្តូរក្រុមថ្នាំតាមការណែនាំអ្នកជំនាញ ដើម្បីកាត់បន្ថយហានិភ័យធន់ថ្នាំ។",
        ],
        "sources": [
            {
                "label": "IRAC - Dinotefuran in Group 4A neonicotinoids",
                "url": "https://irac-online.org/mode-of-action/",
            },
            {
                "label": "LSU AgCenter - Pymetrozine feeding blocker",
                "url": "https://www.lsuagcenter.com/profiles/aiverson/articles/page1548277240641",
            },
            {
                "label": "MAFF Khmer PDF - durian pest management",
                "url": "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_COP_TRI": {
        "name": "COP TRI",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: China",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: COP TRI",
            "សារធាតុសកម្មលើទំព័រ: Copper oxychloride 650g/kg + Kasugamycin 20g/kg WP",
            "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ជំងឺបាក់តេរី Canker និង Blast disease លើដំណាំផ្លែឈើមួយចំនួន។",
            "សូមផ្ទៀងផ្ទាត់ស្លាកពិត/QR ថាអនុញ្ញាតសម្រាប់ទុរេន និងរោគសញ្ញាដែលកំពុងឃើញ។",
        ],
        "active": "Copper oxychloride + Kasugamycin WP - ក្រុម copper/contact protectant បន្ថែមជាមួយ Kasugamycin។",
        "function": "ជួយការពារផ្ទៃស្លឹក និងកាត់បន្ថយការរាលដាលរបស់ជំងឺចំណុចស្លឹក/រលាកស្លឹកខ្លះៗ។ សម្រាប់ ALGAL_LEAF_SPOT និង PHOMOPSIS_LEAF_SPOT គួរប្រើជាជម្រើសពិចារណា បន្ទាប់ពីកាត់ស្លឹកឆ្លង និងកាត់បន្ថយសំណើមក្នុងមែក។",
        "responsible_use": [
            "ប្រើតែបើស្លាកពិតអនុញ្ញាតសម្រាប់ទុរេន ឬដំណាំផ្លែឈើដែលពាក់ព័ន្ធ។",
            "កុំបន្ថែមកម្រិតលាយដោយខ្លួនឯង; អានកម្រិតលាយ ចន្លោះពេលបាញ់ និងរយៈពេលមុនប្រមូលផលលើស្លាក។",
            "ពាក់សម្ភារៈការពារ និងជៀសវាងបាញ់ពេលភ្លៀង ខ្យល់ខ្លាំង ឬពេលមានពន្លឺថ្ងៃក្តៅខ្លាំង។",
        ],
        "sources": [
            {
                "label": "Angkor Green - COP TRI product page",
                "url": "https://angkorgreen.com.kh/product/cop-tri/",
            },
            {
                "label": "Kasugamycin + Copper oxychloride label example",
                "url": "https://ppqs.gov.in/sites/default/files/kasugamycin_5_copper_oxychloride_45_wp93fdhanuka_agritech_limited_1.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_PERFECT_72WP": {
        "name": "PERFECT 72%WP",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: China",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: PERFECT 72%WP",
            "សារធាតុសកម្មលើទំព័រ: Metalaxyl 80g/kg + Mancozeb 640g/kg WP",
            "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ Downy mildew, Phytophthora និង Late blight។",
            "សម្រាប់ LEAF_BLIGHT លើទុរេន សូមផ្ទៀងផ្ទាត់ស្លាក/អ្នកជំនាញថាត្រូវនឹងមូលហេតុជំងឺ។",
        ],
        "active": "Metalaxyl + Mancozeb WP - Metalaxyl មានសកម្មភាព systemic សម្រាប់ក្រុម oomycete; Mancozeb ជា contact protectant។",
        "function": "ជាជម្រើសពិចារណាពេលស្នាមរលាកស្លឹកសង្ស័យពាក់ព័ន្ធ Phytophthora/oomycete។ វាមិនជំនួសការកាត់ស្លឹកឆ្លង ការបើកមែកឲ្យខ្យល់ចេញចូល និងការគ្រប់គ្រងទឹកជ្រាបទេ។",
        "responsible_use": [
            "ប្រើតាមស្លាកពិត ហើយកុំប្រើបន្តបន្ទាប់ក្រុម Metalaxyl ដោយគ្មានការប្តូរក្រុមថ្នាំ។",
            "កុំបាញ់លើស្លឹកខ្ចីពេលថ្ងៃក្តៅខ្លាំង ប្រសិនបើស្លាកមិនណែនាំ។",
            "គោរពរយៈពេលចូលចម្ការឡើងវិញ និងរយៈពេលមុនប្រមូលផលតាមស្លាក។",
        ],
        "sources": [
            {
                "label": "Angkor Green - PERFECT 72%WP product page",
                "url": "https://angkorgreen.com.kh/product/perfect-72wp/",
            },
            {
                "label": "MAFF Khmer PDF - durian pest management",
                "url": "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_REVUS_OPTI": {
        "name": "REVUS OPTI 440SC",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: China",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: REVUS OPTI 440SC",
            "សារធាតុសកម្មលើទំព័រ: Mandipropamid 40g/l + Chlorothalonil 400g/l SC",
            "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ Downy mildew, Phytophthora និង Late blight។",
            "សូមអានស្លាកពិត ដើម្បីបញ្ជាក់ដំណាំ កម្រិតប្រើ និងការព្រមានសុវត្ថិភាព។",
        ],
        "active": "Mandipropamid + Chlorothalonil SC - Mandipropamid ផ្តោតលើ oomycete; Chlorothalonil ជា contact protectant។",
        "function": "ជាជម្រើសពិចារណាសម្រាប់ស្នាមរលាកស្លឹកដែលពាក់ព័ន្ធ oomycete/Phytophthora និងស្ថានភាពសំណើមខ្ពស់។ គួរប្រើជាមួយការកែលម្អទឹក សំណើម និងខ្យល់ក្នុងដើម។",
        "responsible_use": [
            "ពិនិត្យថាស្លាកអនុញ្ញាតសម្រាប់ទុរេន មុនយកទៅប្រើនៅចម្ការ។",
            "កុំលាយជាមួយផលិតផលផ្សេង ប្រសិនបើស្លាកមិនបញ្ជាក់ថាអាចលាយបាន។",
            "រក្សាទុកឲ្យឆ្ងាយពីកុមារ អាហារ ទឹកស្អាត និងសត្វចិញ្ចឹម។",
        ],
        "sources": [
            {
                "label": "Angkor Green - REVUS OPTI 440SC product page",
                "url": "https://angkorgreen.com.kh/product/rivus-oti/",
            },
            {
                "label": "MAFF Khmer PDF - durian pest management",
                "url": "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_FOLU": {
        "name": "FOLU",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: China",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: FOLU",
            "សារធាតុសកម្មលើទំព័រ: Fosetyl Aluminium 800g/kg WP",
            "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ Downy mildew, Phytophthora និង Late blight។",
            "សូមផ្ទៀងផ្ទាត់លើស្លាកពិត មុនប្រើលើទុរេន។",
        ],
        "active": "Fosetyl Aluminium WP - ក្រុម phosphonate/oomycete management។",
        "function": "ជាជម្រើសពិចារណាសម្រាប់ LEAF_BLIGHT ដែលសង្ស័យមកពី Phytophthora/oomycete។ វាជួយគាំទ្រការគ្រប់គ្រងជំងឺ តែត្រូវភ្ជាប់ជាមួយការគ្រប់គ្រងទឹក កាត់ស្លឹកឆ្លង និងកាត់បន្ថយសំណើម។",
        "responsible_use": [
            "ពិនិត្យស្លាកពិត និងការចុះបញ្ជីក្នុងតំបន់ មុនប្រើ។",
            "ប្តូរក្រុមថ្នាំតាមការណែនាំ ដើម្បីកាត់បន្ថយហានិភ័យធន់ថ្នាំ។",
            "បញ្ឈប់ប្រើ ប្រសិនបើស្លឹកឆេះ ឬមានរោគសញ្ញាខុសធម្មតា ហើយសួរអ្នកជំនាញ។",
        ],
        "sources": [
            {
                "label": "Angkor Green - FOLU product page",
                "url": "https://angkorgreen.com.kh/product/folu/",
            },
            {
                "label": "MAFF Khmer PDF - durian pest management",
                "url": "https://elibrary.maff.gov.kh/assets/files/books/f9bb05bf6cfbf8fe8b2223623d5458be1702973176.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_ANUMANCO_80WP": {
        "name": "ANUMANCO 80%WP",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: India",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: ANUMANCO 80%WP",
            "សារធាតុសកម្មលើទំព័រ: Mancozeb 800g/kg WP",
            "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ Downy mildew, Phytophthora និង Late blight។",
            "សម្រាប់ PHOMOPSIS_LEAF_SPOT ត្រូវផ្ទៀងផ្ទាត់ស្លាកថាត្រូវនឹងជំងឺចំណុចស្លឹកលើទុរេន។",
        ],
        "active": "Mancozeb WP - contact/multi-site protectant សម្រាប់ក្រុមជំងឺផ្សិតមួយចំនួន។",
        "function": "ជួយការពារផ្ទៃស្លឹកមុនឆ្លងខ្លាំង និងកាត់បន្ថយការរាលដាលនៅពេលសំណើមខ្ពស់។ សម្រាប់ PHOMOPSIS_LEAF_SPOT គួរប្រើជាមួយការដកស្លឹកឆ្លង និងកាត់មែកឲ្យខ្យល់ចេញចូល។",
        "responsible_use": [
            "ប្រើតែបើស្លាកអនុញ្ញាតសម្រាប់ដំណាំ និងរោគសញ្ញាដែលកំពុងឃើញ។",
            "ពាក់ PPE ពេលលាយ/បាញ់ ហើយលាងដៃ និងសម្លៀកបំពាក់បន្ទាប់ពីប្រើ។",
            "កុំបាញ់ជិតប្រភពទឹក ឬពេលខ្យល់បក់ទៅផ្ទះ អាហារ ឬសត្វចិញ្ចឹម។",
        ],
        "sources": [
            {
                "label": "Angkor Green - ANUMANCO 80%WP product page",
                "url": "https://angkorgreen.com.kh/product/anumanco-80wp-2/",
            },
            {
                "label": "Research on Phomopsis durionis leaf spot on durian",
                "url": "https://actavia.mendelu.cz/pdfs/acu/2016/01/22.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_TILT_SUPER_300EC": {
        "name": "TILT SUPER 300EC",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: Vietnam",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: TILT SUPER 300EC",
            "សារធាតុសកម្មលើទំព័រ: Difenoconazole 150g/l + Propiconazole 150g/l EC",
            "ទំព័រផលិតផលបង្ហាញថាប្រើសម្រាប់ជំងឺផ្សិតលើស្រូវ។",
            "សម្រាប់ PHOMOPSIS_LEAF_SPOT លើទុរេន សូមប្រើតែបើស្លាកពិត/អ្នកជំនាញអនុញ្ញាត។",
        ],
        "active": "Difenoconazole + Propiconazole EC - ក្រុម triazole/DMI systemic fungicide។",
        "function": "ជាជម្រើសសម្រាប់សួរអ្នកជំនាញពេលសង្ស័យជំងឺផ្សិតចំណុចស្លឹក។ មិនគួរប្រើដោយស្វ័យប្រវត្តិលើទុរេន ប្រសិនបើស្លាកមិនបញ្ជាក់ដំណាំទុរេន ឬដំណាំផ្លែឈើ។",
        "responsible_use": [
            "កុំប្រើលើទុរេន ប្រសិនបើស្លាកពិតមិនអនុញ្ញាត។",
            "ប្តូរក្រុមថ្នាំ និងកុំបាញ់ DMI ជាបន្តបន្ទាប់ ដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
            "ពិនិត្យរយៈពេលមុនប្រមូលផល និងសំណល់ថ្នាំលើស្លាក។",
        ],
        "sources": [
            {
                "label": "Angkor Green - TILT SUPER 300EC product page",
                "url": "https://angkorgreen.com.kh/product/tilt-super-300ec/",
            },
            {
                "label": "Research on Phomopsis durionis leaf spot on durian",
                "url": "https://actavia.mendelu.cz/pdfs/acu/2016/01/22.pdf",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_KON_NEAK6": {
        "name": "KON NEAK6",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: China",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: KON NEAK6",
            "សារធាតុសកម្មលើទំព័រ: Pymetrozine 200g/kg + Thiamethoxam 150g/kg WDG",
            "ទំព័រផលិតផលបង្ហាញថាមានប្រសិទ្ធភាពលើសត្វល្អិតស្លាបរឹង និង sucking insects មួយចំនួន។",
            "សម្រាប់ ALLOCARIDARA_ATTACK ត្រូវពិនិត្យថាមានសត្វល្អិត/ស្នាមជញ្ជក់ច្បាស់ មុនប្រើ។",
        ],
        "active": "Pymetrozine + Thiamethoxam WDG - feeding blocker បន្ថែមជាមួយ neonicotinoid systemic។",
        "function": "អាចជួយបញ្ឈប់ការចិញ្ចឹមរបស់សត្វល្អិតជញ្ជក់ទឹក និងកាត់បន្ថយការខូចស្លឹកខ្ចី។ គួរប្រើតែពេលមានការវាយប្រហារច្បាស់ និងបន្ទាប់ពីពិនិត្យក្រោមស្លឹក។",
        "responsible_use": [
            "កុំបាញ់ពេលដើមកំពុងចេញផ្កា ឬពេលមានឃ្មុំ/សត្វមានប្រយោជន៍ច្រើន។",
            "ប្រើតាមស្លាកពិត និងប្តូរក្រុមថ្នាំ ដើម្បីកាត់បន្ថយធន់ថ្នាំ។",
            "កុំបាញ់ជាការពាររៀងរាល់សប្តាហ៍ ប្រសិនបើមិនមានសត្វល្អិត។",
        ],
        "sources": [
            {
                "label": "Angkor Green - KON NEAK6 product page",
                "url": "https://angkorgreen.com.kh/product/kon-neak-6/",
            },
            {
                "label": "IRAC - insecticide mode of action groups",
                "url": "https://irac-online.org/mode-of-action/",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_SRAKAR_NEAK": {
        "name": "SRAKAR NEAK",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: China",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: SRAKAR NEAK",
            "សារធាតុសកម្មលើទំព័រ: Lambda cyhalothrin 40g/kg + Thiamethoxam 120g/kg WP",
            "ទំព័រផលិតផលបង្ហាញប្រសិទ្ធភាពលើ aphid, white fly, plant hopper និងសត្វល្អិតស្លាបរឹងមួយចំនួន។",
            "សម្រាប់ស្លឹកទុរេន ត្រូវប្រើតែបើស្លាកពិតអនុញ្ញាត និងមានសត្វល្អិតវាយប្រហារច្បាស់។",
        ],
        "active": "Lambda cyhalothrin + Thiamethoxam WP - pyrethroid knockdown បន្ថែមជាមួយ neonicotinoid systemic។",
        "function": "អាចកាត់បន្ថយសត្វល្អិតជញ្ជក់ទឹក និងសត្វល្អិតមួយចំនួនបានលឿន ប៉ុន្តែអាចប៉ះពាល់សត្វមានប្រយោជន៍ ដូច្នេះគួរប្រើដោយប្រុងប្រយ័ត្ន។",
        "responsible_use": [
            "ជៀសវាងបាញ់ពេលមានផ្កា ឬពេលមានឃ្មុំ ព្រោះក្រុមថ្នាំនេះអាចប៉ះពាល់ pollinator។",
            "កុំបាញ់ជិតប្រភពទឹក ឬពេលខ្យល់បក់ខ្លាំង។",
            "ប្រើតាមកម្រិតលើស្លាកពិត ហើយកុំប្រើជំនួសការត្រួតពិនិត្យសត្វល្អិតនៅចម្ការ។",
        ],
        "sources": [
            {
                "label": "Angkor Green - SRAKAR NEAK product page",
                "url": "https://angkorgreen.com.kh/product/srakar-neak/",
            },
            {
                "label": "IRAC - insecticide mode of action groups",
                "url": "https://irac-online.org/mode-of-action/",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
    "AG_BUTA": {
        "name": "BUTA",
        "maker": "ប្រភពផលិតផល: Angkor Green; ប្រទេសផលិតផលលើទំព័រ: India",
        "photo_credit": "រូបភាព និងព័ត៌មានផលិតផលពី Angkor Green",
        "label_reading": [
            "ឈ្មោះផលិតផល: BUTA",
            "សារធាតុសកម្មលើទំព័រ: Buprofezin 250g/kg WP",
            "ទំព័រផលិតផលបង្ហាញថាប្រើលើ white fly, aphid, rice hispa និង plant hopper។",
            "សម្រាប់ ALLOCARIDARA_ATTACK ត្រូវពិនិត្យសត្វល្អិត និងស្លាកពិតថាសមស្របសម្រាប់ទុរេន។",
        ],
        "active": "Buprofezin WP - insect growth regulator សម្រាប់សត្វល្អិតជញ្ជក់ទឹកមួយចំនួន។",
        "function": "ជួយរារាំងការលូតលាស់/ប្តូរសំបករបស់សត្វល្អិតជញ្ជក់ទឹកមួយចំនួន។ វាធ្វើការយឺតជាងថ្នាំ knockdown ដូច្នេះត្រូវតាមដានស្ថានភាពសត្វល្អិតបន្ទាប់ពីប្រើ។",
        "responsible_use": [
            "ប្រើតែពេលសង្កេតឃើញសត្វល្អិតជាក់ស្តែង និងស្លាកអនុញ្ញាត។",
            "កុំលាយជាមួយថ្នាំផ្សេង ប្រសិនបើស្លាកមិនបានណែនាំ។",
            "រក្សាទុកក្នុងកន្លែងសុវត្ថិភាព ឆ្ងាយពីកុមារ អាហារ និងចំណីសត្វ។",
        ],
        "sources": [
            {
                "label": "Angkor Green - BUTA product page",
                "url": "https://angkorgreen.com.kh/product/buta/",
            },
            {
                "label": "IRAC - insecticide mode of action groups",
                "url": "https://irac-online.org/mode-of-action/",
            },
            {
                "label": "East-West Seed Khmer - pesticide label guide",
                "url": "https://growhow.eastwestseed.com/kh/kh/download-tech-guide/296",
            },
        ],
    },
}


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="centered")
    apply_khmer_font()
    show_app_header()
    st.write("ថត ឬនាំចូលរូបស្លឹកទុរេនឲ្យច្បាស់ ដើម្បីឲ្យប្រព័ន្ធជួយវាយតម្លៃរោគសញ្ញា និងណែនាំជំហានបន្ទាប់។")

    show_farmer_signs()

    uploaded, image_caption = choose_leaf_image()
    model_path = get_default_model_path()

    if not uploaded:
        st.info("សូមថតរូប ឬនាំចូលរូបស្លឹកទុរេនមួយ ដើម្បីចាប់ផ្តើមពិនិត្យ។")
        return

    image = Image.open(uploaded).convert("RGB")
    st.image(image, caption=image_caption, width="stretch")

    if not model_path.exists():
        st.error(f"រកមិនឃើញឯកសារម៉ូដែល៖ {model_path}")
        return

    with st.spinner("កំពុងវិភាគរូបស្លឹក..."):
        predictions = predict(image, model_path)

    top = predictions[0]
    st.metric(
        "លទ្ធផលព្យាករ",
        display_class_name(top["class_name"]),
        f"{top['probability'] * 100:.1f}%",
    )

    show_recommendation(top["class_name"], top["probability"])

    st.subheader("កម្រិតជឿជាក់")
    for item in predictions:
        st.progress(
            item["probability"],
            text=f"{display_class_name(item['class_name'])}: {item['probability'] * 100:.1f}%",
        )


def show_farmer_signs() -> None:
    st.markdown(
        """
        <div class="sign-grid">
            <div class="sign-card">
                <div class="sign-number">សញ្ញា ១</div>
                <div class="sign-title">ពន្លឺច្បាស់</div>
                <div class="sign-detail">ថតនៅកន្លែងមានពន្លឺល្អ កុំឲ្យស្រមោលគ្របលើស្លឹក។</div>
            </div>
            <div class="sign-card">
                <div class="sign-number">សញ្ញា ២</div>
                <div class="sign-title">ស្លឹកពេញរូប</div>
                <div class="sign-detail">ឲ្យស្លឹកដែលមានរោគសញ្ញាមើលឃើញច្បាស់ និងមិនតូចពេក។</div>
            </div>
            <div class="sign-card">
                <div class="sign-number">សញ្ញា ៣</div>
                <div class="sign-title">រូបមិនព្រិល</div>
                <div class="sign-detail">កាន់ទូរស័ព្ទឲ្យនឹង ហើយថតឡើងវិញ បើរូបមើលមិនច្បាស់។</div>
            </div>
            <div class="sign-card">
                <div class="sign-number">សញ្ញា ៤</div>
                <div class="sign-title">ពិនិត្យច្រើនស្លឹក</div>
                <div class="sign-detail">បើលទ្ធផលធ្ងន់ សូមពិនិត្យស្លឹក និងដើមជិតខាងមុនប្រើថ្នាំ។</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def choose_leaf_image():
    st.markdown('<div class="workflow-title">ជំហានទី ១៖ បញ្ចូលរូបស្លឹក</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="workflow-note">ជ្រើសរើសថតរូបថ្មីពីកាមេរ៉ា ឬនាំចូលរូបដែលមានស្រាប់ពីទូរស័ព្ទ/កុំព្យូទ័រ។</div>',
        unsafe_allow_html=True,
    )

    source = st.radio(
        "ប្រភពរូបភាព",
        ["ថតរូបថ្មី", "នាំចូលរូបភាព"],
        horizontal=True,
        label_visibility="collapsed",
    )

    if source == "ថតរូបថ្មី":
        st.caption("ប្រើកាមេរ៉ាដើម្បីថតស្លឹកទុរេននៅកន្លែងមានពន្លឺល្អ។")
        captured = st.camera_input("ថតរូបស្លឹកទុរេន")
        return captured, "រូបស្លឹកដែលបានថត"

    st.caption("ជ្រើសរូបស្លឹកទុរេនពីឯកសារ JPG, JPEG, PNG ឬ WEBP។")
    uploaded = st.file_uploader(
        "នាំចូលរូបស្លឹកទុរេន",
        type=["jpg", "jpeg", "png", "webp"],
    )
    return uploaded, "រូបស្លឹកដែលបាននាំចូល"


def get_default_model_path() -> Path:
    deployment_model = ROOT / "deployment" / "best_model.pt"
    experiment_model = ROOT / "outputs" / "efficientnet_b0" / "best_model.pt"
    return deployment_model if deployment_model.exists() else experiment_model


def image_data_uri(image_path: Path) -> str:
    if not image_path.exists():
        return ""
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def show_app_header() -> None:
    logo_src = image_data_uri(LOGO_IMAGE)
    logo_image = (
        f'<img class="app-logo-image" src="{logo_src}" alt="AI durian tree logo">'
        if logo_src
        else ""
    )
    st.markdown(
        f"""
        <div class="app-logo-row">
            <div class="app-logo-mark">
                {logo_image}
                <div class="app-logo-ai">AI</div>
            </div>
            <div>
                <div class="app-logo-title">{APP_TITLE}</div>
                <div class="app-logo-subtitle">ជំនួយការកសិករ សម្រាប់ពិនិត្យស្លឹកទុរេន និងទទួលការណែនាំបន្ទាប់</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def display_class_name(class_name: str) -> str:
    return CLASS_LABELS_KH.get(class_name.upper(), class_name)


def apply_khmer_font() -> None:
    st.markdown(KHMER_FONT_CSS, unsafe_allow_html=True)


def show_recommendation(class_name: str, probability: float) -> None:
    recommendation = RECOMMENDATIONS.get(class_name.upper())
    if recommendation is None:
        st.info("មិនទាន់មានអនុសាសន៍សម្រាប់ប្រភេទនេះនៅឡើយទេ។")
        return

    confidence = probability * 100
    st.subheader("អនុសាសន៍សម្រាប់កសិករ")

    if confidence < 60:
        st.warning(
            "កម្រិតជឿជាក់ទាប។ សូមថតរូបម្ដងទៀតឲ្យច្បាស់នៅកន្លែងមានពន្លឺល្អ "
            "ហើយពិនិត្យដើមផ្ទាល់ មុនសម្រេចចិត្តព្យាបាល។"
        )
    elif recommendation["urgency"] == "high":
        st.error(
            f"{recommendation['title']} - កម្រិតប្រញាប់៖ "
            f"{recommendation['urgency_label']}"
        )
    elif recommendation["urgency"] == "medium":
        st.warning(
            f"{recommendation['title']} - កម្រិតប្រញាប់៖ "
            f"{recommendation['urgency_label']}"
        )
    else:
        st.success(
            f"{recommendation['title']} - កម្រិតប្រញាប់៖ "
            f"{recommendation['urgency_label']}"
        )

    st.write(recommendation["summary"])

    st.markdown("**ហេតុអ្វីសំខាន់**")
    st.write(recommendation["why_important"])

    show_reference_image(class_name)

    st.markdown("**សកម្មភាពបន្ទាប់**")
    for action in recommendation["actions"]:
        st.markdown(f"- {action}")

    st.markdown("**វិធីការពារ**")
    st.write(recommendation["prevention"])

    st.markdown("**ការណែនាំប្រើប្រាស់ថ្នាំ**")
    for guidance in recommendation["chemical_guidance"]:
        st.markdown(f"- {guidance}")

    show_product_images(class_name)


def show_reference_image(class_name: str) -> None:
    reference = REFERENCE_IMAGES.get(class_name.upper())
    if reference is None:
        return

    image_path = reference["path"]
    if image_path.exists():
        st.image(
            image_path,
            caption=reference["caption"],
            width="stretch",
        )

    st.caption(f"{reference['credit']} | ប្រភព៖ {reference['source_url']}")


def show_product_images(class_name: str) -> None:
    products = PRODUCT_IMAGES.get(class_name.upper(), [])
    if not products:
        return

    st.markdown("**ថ្នាំប្រើប្រាស់ (ប្រើដោយទទួលខុសត្រូវ)**")
    for product_key, product_images in group_product_images(products).items():
        info = MEDICINE_INFO.get(product_key)
        if info is None:
            continue

        st.markdown(f"**{info['name']}**")
        columns = st.columns(min(len(product_images), 3))
        for index, product in enumerate(product_images):
            image_path = product["path"]
            if not image_path.exists():
                continue
            with columns[index % len(columns)]:
                st.image(
                    image_path,
                    caption=product["caption"],
                    width=150,
                )

        st.markdown(f"- **អ្នកផលិត/ម្ចាស់ផលិតផល:** {info['maker']}")
        st.markdown(f"- **Credit រូបភាព:** {info['photo_credit']}")
        st.markdown("**ព័ត៌មានដែលអានបានពីស្លាក**")
        for label_item in info["label_reading"]:
            st.markdown(f"- {label_item}")
        st.markdown(f"- **សារធាតុសកម្ម/ក្រុមថ្នាំ:** {info['active']}")
        st.markdown(f"- **មុខងារ:** {info['function']}")
        st.markdown("**ប្រើដោយទទួលខុសត្រូវ**")
        for item in info["responsible_use"]:
            st.markdown(f"- {item}")

        with st.expander("ប្រភពស្រាវជ្រាវ និងការផ្ទៀងផ្ទាត់", expanded=False):
            for source in info["sources"]:
                st.markdown(f"- [{source['label']}]({source['url']})")

    st.caption(
        "ព័ត៌មានថ្នាំនេះជាជំនួយសម្រេចចិត្តប៉ុណ្ណោះ។ សូមផ្ទៀងផ្ទាត់ស្លាកផលិតផល "
        "ការចុះបញ្ជីក្នុងតំបន់ និងសួរអ្នកជំនាញកសិកម្ម មុនលាយ ឬបាញ់ថ្នាំ។"
    )


def group_product_images(products: list[dict[str, object]]) -> dict[str, list[dict[str, object]]]:
    grouped: dict[str, list[dict[str, object]]] = {}
    for product in products:
        product_key = str(product.get("product_key", product["caption"]))
        grouped.setdefault(product_key, []).append(product)
    return grouped


@st.cache_resource
def cached_model(model_path: str):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, checkpoint = load_checkpoint(model_path, map_location=device)
    model.to(device)
    model.eval()
    return model, checkpoint, device


@torch.no_grad()
def predict(image: Image.Image, model_path: Path) -> list[dict[str, float | str]]:
    model, checkpoint, device = cached_model(str(model_path))
    transform = build_eval_transform(int(checkpoint.get("img_size", 224)))
    class_names = checkpoint["class_names"]

    tensor = transform(image).unsqueeze(0).to(device)
    probabilities = torch.softmax(model(tensor), dim=1).squeeze(0)
    scores, indices = torch.topk(probabilities, k=min(5, len(class_names)))

    return [
        {
            "class_name": class_names[index],
            "probability": float(score),
        }
        for score, index in zip(scores.cpu(), indices.cpu())
    ]


if __name__ == "__main__":
    main()
