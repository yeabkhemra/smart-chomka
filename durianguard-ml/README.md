# DurianGuard ML

Neural-network pipeline for classifying durian leaf disease images from the Kaggle Durian Leaf Disease Dataset.

The current pipeline uses transfer learning with PyTorch. The default model is `efficientnet_b0`, which is a good first competition baseline because it is accurate enough for image classification while staying small enough for later mobile or web deployment.

## Expected Classes

The Kaggle dataset is commonly used as a 5-class leaf classifier:

- `ALGAL_LEAF_SPOT`
- `ALLOCARIDARA_ATTACK`
- `HEALTHY_LEAF`
- `LEAF_BLIGHT`
- `PHOMOPSIS_LEAF_SPOT`

The scripts do not hard-code these labels. They read class names from the dataset folders, so the project will still work if the downloaded folder uses slightly different names.

## Setup

From this folder:

```powershell
cd "C:\Users\User\Documents\New project\durianguard-ml"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Download Dataset

Dataset page:

https://www.kaggle.com/datasets/cthng123/durian-leaf-disease-dataset?select=DLD_FinalDataset_224_spit

Option A, easiest:

1. Open the Kaggle link.
2. Download the dataset zip.
3. Extract it into:

```text
C:\Users\User\Documents\New project\durianguard-ml\data\
```

After extraction, one of these paths should exist:

```text
durianguard-ml\data\DLD_FinalDataset_224_spit
durianguard-ml\data\DLD_FinalDataset_224_split
```

Option B, Kaggle CLI:

```powershell
mkdir data
kaggle datasets download -d cthng123/durian-leaf-disease-dataset -p data --unzip
```

The Kaggle CLI needs a `kaggle.json` token from your Kaggle account settings. Put it in:

```text
C:\Users\User\.kaggle\kaggle.json
```

## Train

Notebook option:

Open `DurianGuard_Durian_Leaf_Disease_Model.ipynb` and run it cell by cell in Jupyter or Google Colab.
The notebook includes data cleaning, EDA, train/validation/test splitting, model evaluation, error analysis, and model comparison across EfficientNet-B0, MobileNetV3-Small, and ResNet18.
It also includes a `Predict Internet Disease Image and Compare` section that downloads a labeled Leaf Blight sample image, saves it under `sample_images/`, runs the trained model, and compares the expected label with the prediction.
After model comparison, the notebook saves the selected best checkpoint to `deployment/best_model.pt` for Streamlit deployment.

Script option:

```powershell
python -m durianguard.train `
  --data-dir data\DLD_FinalDataset_224_spit `
  --output-dir outputs\efficientnet_b0 `
  --model efficientnet_b0 `
  --epochs 25 `
  --batch-size 32 `
  --lr 0.0003 `
  --class-weights
```

If your extracted folder is named `DLD_FinalDataset_224_split`, use that path instead.

Recommended first run on CPU:

```powershell
python -m durianguard.train --data-dir data\DLD_FinalDataset_224_spit --output-dir outputs\quick_test --epochs 2 --batch-size 8
```

## Outputs

Training creates:

- `outputs/<run>/best_model.pt` - best validation checkpoint
- `outputs/<run>/last_model.pt` - final checkpoint
- `outputs/<run>/class_names.json` - model label order
- `outputs/<run>/history.csv` - epoch metrics
- `outputs/<run>/metrics.json` - final test/validation metrics
- `outputs/<run>/confusion_matrix.png` - class confusion matrix
- `outputs/<run>/training_curves.png` - loss and accuracy curves

## Predict One Image

```powershell
python -m durianguard.predict `
  --model-path outputs\efficientnet_b0\best_model.pt `
  --image path\to\leaf.jpg `
  --top-k 3
```

## Run Demo App

```powershell
streamlit run app\streamlit_app.py
```

Upload a durian leaf image and select `outputs\efficientnet_b0\best_model.pt`.
After running the notebook's deployment export step, use `deployment\best_model.pt`. The app chooses this deployment model automatically when it exists.
The app also shows Khmer reference links, including durian disease videos/websites and a MAFF Khmer durian growing PDF, after each prediction.

## Offline Streamlit Deployment

For offline farmer demo mode, use:

```text
run_offline.bat
```

For installing on another computer without internet, first prepare wheels while online, then copy the whole folder:

```text
offline_deploy\prepare_offline_wheels.bat
offline_deploy\install_offline.bat
run_offline.bat
```

Full instructions are in `OFFLINE_DEPLOYMENT.md`.

## Competition Notes

For a strong final submission, report more than accuracy:

- per-class precision, recall, and F1-score
- confusion matrix
- sample wrong predictions
- real farm photos tested outside Kaggle, if possible
- model size and average prediction time

The key risk is overfitting to Kaggle image backgrounds. For a farm competition, collect extra Cambodia field images with different phones, light, tree ages, and leaf positions, then evaluate the model on those images before presenting it.
