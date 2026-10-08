# Smart Chomka — Machine Learning and Agricultural Application Project

Prepared for a CV and project portfolio · 8 October 2026

## Project overview

Smart Chomka is a Khmer-language agricultural application designed to help durian farmers identify leaf conditions, access farming information, and browse agricultural products. The project connects a computer-vision training pipeline, DurianGuard ML, with a mobile-friendly Progressive Web App (PWA) and a local commerce backend.

The central machine-learning task is five-class image classification using transfer learning. A trained EfficientNet-B0 model is exported to ONNX and integrated into the browser through ONNX Runtime Web. Supporting application features include photo capture and upload, prediction reports, a visual disease library, Khmer AI assistance, weather information, farm profiles, and a marketplace prototype.

**Project role for a CV:** Machine Learning & Application Developer — Project Experience. Use this as a project role, not as an employment title. Adjust personal-contribution wording if parts of the project were completed by teammates.

## Problem and intended users

Durian farmers need accessible ways to inspect visible leaf symptoms and understand possible next steps. Smart Chomka brings image classification and Khmer-language reference information into a single interface that can be used on a phone. The application provides decision support; its predictions do not establish a confirmed plant-disease diagnosis.

A secondary goal is to connect farmers and buyers through durian listings and make supplier products easier to discover. The current commerce implementation is a local working prototype rather than a publicly operational online shop.

## Machine-learning work

### Dataset and preparation

The project materials identify the Kaggle Durian Leaf Disease Dataset as the training source. The earlier presentation records 4,437 valid images, removal of one exact duplicate, and 4,436 images remaining after cleaning. It describes separate training, validation, and test sets and checks of class labels and sample images.

The deployed model metadata defines these five classes:

1. Algal leaf spot.
2. Allocariadara attack (dataset identifier: ALLOCARIDARA_ATTACK).
3. Healthy leaf.
4. Leaf blight.
5. Phomopsis leaf spot.

Images are processed at 224 × 224 pixels with ImageNet channel normalization. The training code includes random resized crops, horizontal and vertical flips, rotation, and color jitter. Evaluation uses resizing and normalization without those random augmentations.

### Training and evaluation design

The project includes PyTorch training code and a Jupyter notebook for transfer-learning experiments with EfficientNet-B0, ResNet18, and MobileNetV3-Small. The script implements AdamW optimization, cross-entropy loss with optional class weights, cosine learning-rate scheduling, early stopping, and checkpoint selection by validation macro-F1.

The script defaults are 25 epochs, batch size 32, learning rate 0.0003, weight decay 0.0001, and early-stopping patience of seven epochs. These are configuration defaults, not verified settings for the particular run behind the reported scores. Exact split counts, executed epoch count, and training hardware should be recovered from the original run logs before describing them as experiment facts.

### Recorded model results

The following values are transcribed from the existing project presentation, which attributes its table to reports/model_comparison.csv:

| Model | Reported test accuracy | Reported test F1 | Reported parameters | Reported model size |
|---|---:|---:|---:|---:|
| EfficientNet-B0 | 95.61% | 95.36% | 4.0 million | 15.6 MB |
| ResNet18 | 95.50% | 95.38% | 11.2 million | 42.7 MB |
| MobileNetV3-Small | 90.33% | 90.22% | 1.5 million | 5.9 MB |

EfficientNet-B0 has the highest reported test accuracy. ResNet18 has a slightly higher reported test F1, so the results do not show EfficientNet-B0 winning every metric. The presentation identifies EfficientNet-B0 as the model selected on validation F1, and the current application configuration loads that architecture.

**Evidence qualification:** The original comparison CSV, training histories, and metrics JSON files were not present in the inspected ML output folders. The notebook did not contain saved numerical outputs. These scores are documented historical results, not a fresh independently reproduced evaluation. Do not describe test accuracy as accuracy across real Cambodian farms. The presentation also contains inference-time measurements, but the benchmark hardware was not established, so those timings are omitted from the CV.

## Model integration and application engineering

The application loads an ONNX model and class metadata and runs inference using ONNX Runtime Web with a WebAssembly execution provider. This moves the image-classification computation into the browser. A service worker supports caching of application resources and model assets; offline inference depends on those resources having been downloaded successfully first.

The app includes:

- Camera and image-upload workflows for durian leaf inspection.
- Classification results, confidence information, and locally saved scan reports.
- A Khmer disease-reference library with larger photo cards and readable labels.
- Khmer AI question entry, voice controls, and speech-service integration.
- Weather-location selection and agricultural weather information.
- Responsive home, knowledge, AI, market, and account pages.
- Supplier-product browsing and device-local farmer durian listings.

The leaf classifier and conversational AI are separate components. The custom training work concerns the image classifier; the conversational assistant uses application logic and external AI services rather than a language model trained from scratch for this project.

## Commerce and database implementation

A Python backend and SQLite database provide a local account and shopping system. Features include password-protected customer accounts, persistent farm and delivery details, an admin console, product publication, stock adjustments, delivery-inclusive checkout, private order history, and order-status updates.

Passwords use salted scrypt hashes. Customer sessions use random HttpOnly/SameSite cookies, with session tokens hashed in the database. Profile-version checks protect against overwriting newer edits. Orders use idempotency keys, current-price checks, transactional stock reservation, and cancellation logic that restores stock only once.

Payment choices are cash on delivery and a configured merchant KHQR image. KHQR payment receipt is confirmed manually by the seller after checking the bank account; there is no automatic bank-payment verification integration.

Database tables cover customers, customer sessions, admins, products, orders, order items, order events, stock movements, and settings. A SQLite backup utility supports consistent backups.

## Testing and deployment status

The local upgrade passed 12 backend test executions and browser checks covering registration, second-browser sign-in, shared farm/address persistence, delivery-inclusive checkout, private order history, cancellation, and admin delivery settings. Tests used separate databases rather than inserting test purchases into the real inventory.

Version 116 of the web interface was deployed to Vercel on 21 September 2026. The successful deployment and versioned assets were verified during that work. This report does not claim a new live-site verification on 8 October 2026.

Portfolio/demo URL: https://smart-chomka.vercel.app/

The shared-account and commerce APIs still run locally and were not deployed with the Vercel frontend. Scan reports and original farmer-listing drafts remain device-local. Android packaging exists in the workspace, but the latest web changes should not be described as included in the APK without rebuilding and checking it.

## Skills demonstrated

Python; PyTorch; torchvision; scikit-learn; transfer learning; image augmentation; multiclass evaluation; model selection; ONNX deployment; JavaScript; HTML/CSS; responsive UI; PWA/service workers; browser inference; HTTP APIs; SQLite; authentication; transaction handling; automated backend tests; Playwright browser checks; Vercel deployment.

## Evidence and CV accuracy checklist

Primary local evidence:

- durianguard-ml/src/durianguard/train.py — optimization, checkpointing, early stopping, and evaluation code.
- durianguard-ml/src/durianguard/data.py — preprocessing, augmentation, and data loaders.
- durianguard-ml/DurianGuard_Durian_Leaf_Disease_Model.ipynb — notebook workflow.
- overleaf_english_upload_20260720_150424/main.tex — recorded dataset cleaning and model-comparison results.
- smart-chomka-pwa-preview-v65/model/model_metadata.json — five-class EfficientNet-B0 deployment metadata.
- smart-chomka-pwa-preview-v65/app.js — active model selection and browser inference.
- smart-chomka-commerce/server.py and customer_accounts.py — commerce and account implementation.
- smart-chomka-commerce/test_server.py and test_accounts.py — backend tests.
- output/smart-chomka-market/ — browser-check scripts and screenshots.

Before sending a CV, confirm your personal contribution and project dates. Retain the original evaluation CSV/checkpoints if available. Some older app text claims a ten-class model, but the active model configuration and metadata both specify five classes; the CV should say five classes. Avoid claims of production-scale users, commercial revenue, automatic KHQR verification, proven field accuracy, or a fully hosted commerce backend without further evidence.
