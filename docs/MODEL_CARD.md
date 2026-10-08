# Model card — Durian leaf classifier

## Model and task

EfficientNet-B0, five-class image classification. Input: RGB leaf image, resized to 224 × 224 and normalized with ImageNet mean/std. Browser deployment uses the included ONNX model via ONNX Runtime Web.

Classes: ALGAL_LEAF_SPOT, ALLOCARIDARA_ATTACK, HEALTHY_LEAF, LEAF_BLIGHT, PHOMOPSIS_LEAF_SPOT.

## Training implementation

PyTorch/torchvision transfer learning; random crops, flips, rotation and color jitter; AdamW; cosine LR scheduling; optional class weighting; early stopping; best checkpoint chosen by validation macro-F1. Script defaults are not asserted to be the settings of every historical run.

## Reported evaluation

The earlier project presentation records 95.61% test accuracy and 95.36% test F1 for EfficientNet-B0, using a dataset reported as 4,436 cleaned images. Original evaluation CSV/logs are not included here. Exact split counts, runtime hardware, and field performance are not independently established by this repository.

The detailed project report includes comparison results and their provenance. The exported ONNX model is present, but its exact numerical equivalence to the historical checkpoint has not been re-benchmarked here.

## Intended use and limitations

Educational demonstration and agricultural decision support. The model covers five categories, not all durian conditions. Confidence is not a calibrated probability of a correct diagnosis. Lighting, background, camera quality, multiple simultaneous conditions, and unfamiliar images can affect results. Use an independent field test set and expert review before operational deployment.

Some legacy conversational text mentions ten classes; the active configuration and metadata specify five. The reference library is broader than the classifier.

## Data rights

Dataset source is identified in the ML README. Download it from its original source and follow the dataset owner's terms. Third-party reference photos and supplier imagery are not covered by a repository-wide license.
