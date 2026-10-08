from __future__ import annotations

import argparse
import csv
import json
import random
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import torch
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from torch import nn
from tqdm import tqdm

from durianguard.data import class_weights_for, make_dataloaders
from durianguard.model import SUPPORTED_MODELS, create_model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a durian leaf disease neural network."
    )
    parser.add_argument("--data-dir", required=True, help="Dataset root folder.")
    parser.add_argument("--output-dir", default="outputs/efficientnet_b0")
    parser.add_argument("--model", default="efficientnet_b0", choices=SUPPORTED_MODELS)
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--img-size", type=int, default=224)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--patience", type=int, default=7)
    parser.add_argument("--freeze-backbone", action="store_true")
    parser.add_argument("--class-weights", action="store_true")
    parser.add_argument("--no-pretrained", action="store_true")
    parser.add_argument("--val-split", type=float, default=0.15)
    parser.add_argument("--test-split", type=float, default=0.15)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    set_seed(args.seed)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    data = make_dataloaders(
        data_dir=args.data_dir,
        img_size=args.img_size,
        batch_size=args.batch_size,
        num_workers=args.num_workers,
        seed=args.seed,
        val_split=args.val_split,
        test_split=args.test_split,
    )

    print(f"Classes: {data.class_names}")
    print(
        "Dataset sizes: "
        f"train={data.train_size}, val={data.val_size}, test={data.test_size}"
    )

    model = create_model(
        model_name=args.model,
        num_classes=len(data.class_names),
        pretrained=not args.no_pretrained,
        freeze_backbone=args.freeze_backbone,
    ).to(device)

    weight_tensor = None
    if args.class_weights:
        weight_tensor = class_weights_for(
            data.train_loader.dataset,
            num_classes=len(data.class_names),
        ).to(device)

    criterion = nn.CrossEntropyLoss(weight=weight_tensor)
    optimizer = torch.optim.AdamW(
        [parameter for parameter in model.parameters() if parameter.requires_grad],
        lr=args.lr,
        weight_decay=args.weight_decay,
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=max(args.epochs, 1),
    )

    best_val_f1 = -1.0
    epochs_without_improvement = 0
    history: list[dict[str, float]] = []
    started_at = time.time()

    for epoch in range(1, args.epochs + 1):
        train_metrics = run_epoch(
            model=model,
            loader=data.train_loader,
            criterion=criterion,
            device=device,
            optimizer=optimizer,
            train=True,
        )
        val_metrics = run_epoch(
            model=model,
            loader=data.val_loader,
            criterion=criterion,
            device=device,
            optimizer=None,
            train=False,
        )
        scheduler.step()

        row = {
            "epoch": epoch,
            "lr": optimizer.param_groups[0]["lr"],
            "train_loss": train_metrics["loss"],
            "train_accuracy": train_metrics["accuracy"],
            "train_f1_macro": train_metrics["f1_macro"],
            "val_loss": val_metrics["loss"],
            "val_accuracy": val_metrics["accuracy"],
            "val_f1_macro": val_metrics["f1_macro"],
        }
        history.append(row)
        save_history(output_dir / "history.csv", history)

        print(
            f"Epoch {epoch:03d}/{args.epochs} "
            f"train_loss={row['train_loss']:.4f} "
            f"train_acc={row['train_accuracy']:.4f} "
            f"val_loss={row['val_loss']:.4f} "
            f"val_acc={row['val_accuracy']:.4f} "
            f"val_f1={row['val_f1_macro']:.4f}"
        )

        if val_metrics["f1_macro"] > best_val_f1:
            best_val_f1 = val_metrics["f1_macro"]
            epochs_without_improvement = 0
            save_checkpoint(
                output_dir / "best_model.pt",
                model=model,
                args=args,
                class_names=data.class_names,
                metrics={"best_val_f1_macro": best_val_f1, **val_metrics},
            )
        else:
            epochs_without_improvement += 1

        if epochs_without_improvement >= args.patience:
            print(f"Early stopping after {args.patience} epochs without improvement.")
            break

    save_checkpoint(
        output_dir / "last_model.pt",
        model=model,
        args=args,
        class_names=data.class_names,
        metrics={"last_val_f1_macro": history[-1]["val_f1_macro"]},
    )

    write_json(output_dir / "class_names.json", data.class_names)
    plot_training_curves(history, output_dir / "training_curves.png")

    eval_loader = data.test_loader if data.test_loader is not None else data.val_loader
    eval_name = "test" if data.test_loader is not None else "validation"
    final_metrics = evaluate_with_report(
        model=model,
        loader=eval_loader,
        criterion=criterion,
        device=device,
        class_names=data.class_names,
        output_dir=output_dir,
        split_name=eval_name,
    )
    final_metrics["training_seconds"] = round(time.time() - started_at, 2)
    write_json(output_dir / "metrics.json", final_metrics)

    print(f"Done. Best checkpoint: {output_dir / 'best_model.pt'}")
    print(f"Final {eval_name} accuracy: {final_metrics[f'{eval_name}_accuracy']:.4f}")
    print(f"Final {eval_name} macro F1: {final_metrics[f'{eval_name}_f1_macro']:.4f}")


def run_epoch(
    model: nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device,
    optimizer: torch.optim.Optimizer | None,
    train: bool,
) -> dict[str, float]:
    model.train(mode=train)
    running_loss = 0.0
    labels_all: list[int] = []
    preds_all: list[int] = []
    amp_enabled = device.type == "cuda"
    scaler = make_grad_scaler(enabled=amp_enabled)

    loop = tqdm(loader, leave=False, desc="train" if train else "eval")
    for images, labels in loop:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        if train:
            optimizer.zero_grad(set_to_none=True)

        with torch.set_grad_enabled(train):
            with autocast_cuda(enabled=amp_enabled):
                logits = model(images)
                loss = criterion(logits, labels)

            if train:
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

        running_loss += loss.item() * images.size(0)
        preds = torch.argmax(logits, dim=1)
        labels_all.extend(labels.detach().cpu().tolist())
        preds_all.extend(preds.detach().cpu().tolist())

    loss_value = running_loss / max(len(loader.dataset), 1)
    return {
        "loss": loss_value,
        "accuracy": accuracy_score(labels_all, preds_all),
        "f1_macro": f1_score(labels_all, preds_all, average="macro", zero_division=0),
    }


@torch.no_grad()
def evaluate_with_report(
    model: nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device,
    class_names: list[str],
    output_dir: Path,
    split_name: str,
) -> dict[str, float | dict[str, dict[str, float]]]:
    model.eval()
    labels_all: list[int] = []
    preds_all: list[int] = []
    running_loss = 0.0

    for images, labels in tqdm(loader, leave=False, desc=f"{split_name} report"):
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        logits = model(images)
        loss = criterion(logits, labels)
        running_loss += loss.item() * images.size(0)
        preds = torch.argmax(logits, dim=1)
        labels_all.extend(labels.cpu().tolist())
        preds_all.extend(preds.cpu().tolist())

    report = classification_report(
        labels_all,
        preds_all,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(labels_all, preds_all)
    plot_confusion_matrix(matrix, class_names, output_dir / "confusion_matrix.png")

    return {
        f"{split_name}_loss": running_loss / max(len(loader.dataset), 1),
        f"{split_name}_accuracy": accuracy_score(labels_all, preds_all),
        f"{split_name}_f1_macro": f1_score(
            labels_all,
            preds_all,
            average="macro",
            zero_division=0,
        ),
        "classification_report": report,
    }


def save_checkpoint(
    path: Path,
    model: nn.Module,
    args: argparse.Namespace,
    class_names: list[str],
    metrics: dict[str, float],
) -> None:
    torch.save(
        {
            "model_name": args.model,
            "img_size": args.img_size,
            "class_names": class_names,
            "model_state": model.state_dict(),
            "metrics": metrics,
        },
        path,
    )


def save_history(path: Path, rows: list[dict[str, float]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, data: object) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def plot_training_curves(history: list[dict[str, float]], path: Path) -> None:
    epochs = [row["epoch"] for row in history]
    plt.figure(figsize=(11, 4))

    plt.subplot(1, 2, 1)
    plt.plot(epochs, [row["train_loss"] for row in history], label="train")
    plt.plot(epochs, [row["val_loss"] for row in history], label="validation")
    plt.xlabel("epoch")
    plt.ylabel("loss")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(epochs, [row["train_accuracy"] for row in history], label="train")
    plt.plot(epochs, [row["val_accuracy"] for row in history], label="validation")
    plt.xlabel("epoch")
    plt.ylabel("accuracy")
    plt.legend()

    plt.tight_layout()
    plt.savefig(path, dpi=180)
    plt.close()


def plot_confusion_matrix(matrix: np.ndarray, class_names: list[str], path: Path) -> None:
    plt.figure(figsize=(max(8, len(class_names) * 1.5), 6))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="YlGnBu",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(path, dpi=180)
    plt.close()


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def make_grad_scaler(enabled: bool):
    if hasattr(torch, "amp") and hasattr(torch.amp, "GradScaler"):
        try:
            return torch.amp.GradScaler("cuda", enabled=enabled)
        except TypeError:
            pass
    return torch.cuda.amp.GradScaler(enabled=enabled)


def autocast_cuda(enabled: bool):
    if hasattr(torch, "amp") and hasattr(torch.amp, "autocast"):
        try:
            return torch.amp.autocast("cuda", enabled=enabled)
        except TypeError:
            pass
    return torch.cuda.amp.autocast(enabled=enabled)


if __name__ == "__main__":
    main()
