from __future__ import annotations

from pathlib import Path
from typing import Any

import torch
from torch import nn
from torchvision import models


SUPPORTED_MODELS = ["efficientnet_b0", "mobilenet_v3_small", "resnet18"]


def create_model(
    model_name: str,
    num_classes: int,
    pretrained: bool = True,
    freeze_backbone: bool = False,
) -> nn.Module:
    model_name = model_name.lower()
    if model_name == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
        model = models.efficientnet_b0(weights=weights)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        classifier_names = ["classifier"]
    elif model_name == "mobilenet_v3_small":
        weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        model = models.mobilenet_v3_small(weights=weights)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Linear(in_features, num_classes)
        classifier_names = ["classifier"]
    elif model_name == "resnet18":
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        model = models.resnet18(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, num_classes)
        classifier_names = ["fc"]
    else:
        raise ValueError(
            f"Unsupported model '{model_name}'. Choose one of: {', '.join(SUPPORTED_MODELS)}"
        )

    if freeze_backbone:
        _freeze_except(model, classifier_names)

    return model


def load_checkpoint(
    model_path: str | Path,
    map_location: str | torch.device = "cpu",
) -> tuple[nn.Module, dict[str, Any]]:
    checkpoint = _safe_torch_load(model_path, map_location=map_location)
    model = create_model(
        model_name=checkpoint["model_name"],
        num_classes=len(checkpoint["class_names"]),
        pretrained=False,
        freeze_backbone=False,
    )
    model.load_state_dict(checkpoint["model_state"])
    model.eval()
    return model, checkpoint


def _freeze_except(model: nn.Module, trainable_prefixes: list[str]) -> None:
    for name, parameter in model.named_parameters():
        parameter.requires_grad = any(
            name.startswith(prefix) for prefix in trainable_prefixes
        )


def _safe_torch_load(
    model_path: str | Path,
    map_location: str | torch.device,
) -> dict[str, Any]:
    try:
        return torch.load(model_path, map_location=map_location, weights_only=False)
    except TypeError:
        return torch.load(model_path, map_location=map_location)
