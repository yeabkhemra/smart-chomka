from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
from PIL import Image

from durianguard.data import build_eval_transform
from durianguard.model import load_checkpoint


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict durian leaf disease.")
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--top-k", type=int, default=3)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = predict_image(
        model_path=Path(args.model_path),
        image_path=Path(args.image),
        top_k=args.top_k,
    )
    print(json.dumps(result, indent=2))


@torch.no_grad()
def predict_image(model_path: Path, image_path: Path, top_k: int = 3) -> dict[str, object]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, checkpoint = load_checkpoint(model_path, map_location=device)
    model.to(device)

    img_size = int(checkpoint.get("img_size", 224))
    class_names = checkpoint["class_names"]
    transform = build_eval_transform(img_size)

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)
    logits = model(tensor)
    probabilities = torch.softmax(logits, dim=1).squeeze(0)

    top_k = min(top_k, len(class_names))
    scores, indices = torch.topk(probabilities, k=top_k)
    predictions = [
        {
            "class_name": class_names[index],
            "probability": float(score),
        }
        for score, index in zip(scores.cpu(), indices.cpu())
    ]

    return {
        "image": str(image_path),
        "top_prediction": predictions[0],
        "predictions": predictions,
    }


if __name__ == "__main__":
    main()
