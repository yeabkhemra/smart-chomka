from __future__ import annotations

import random
from dataclasses import dataclass
from pathlib import Path

import torch
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import datasets, transforms


IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


@dataclass(frozen=True)
class DataBundle:
    train_loader: DataLoader
    val_loader: DataLoader
    test_loader: DataLoader | None
    class_names: list[str]
    class_to_idx: dict[str, int]
    train_size: int
    val_size: int
    test_size: int


def resolve_dataset_dir(data_dir: str | Path) -> Path:
    """Find the actual image-folder root, tolerating Kaggle's folder typo."""
    root = Path(data_dir).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {root}")

    candidate_names = [
        "DLD_FinalDataset_224_spit",
        "DLD_FinalDataset_224_split",
        "DLD_FinalDataset_224",
    ]
    for name in candidate_names:
        candidate = root / name
        if candidate.exists():
            return candidate

    return root


def build_train_transform(img_size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.RandomResizedCrop(img_size, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.15),
            transforms.RandomRotation(degrees=20),
            transforms.ColorJitter(
                brightness=0.18,
                contrast=0.18,
                saturation=0.15,
                hue=0.03,
            ),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )


def build_eval_transform(img_size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )


def make_dataloaders(
    data_dir: str | Path,
    img_size: int = 224,
    batch_size: int = 32,
    num_workers: int = 0,
    seed: int = 42,
    val_split: float = 0.15,
    test_split: float = 0.15,
) -> DataBundle:
    dataset_dir = resolve_dataset_dir(data_dir)
    split_dirs = _find_split_dirs(dataset_dir)

    if split_dirs["train"] and split_dirs["val"]:
        return _make_split_dataloaders(
            split_dirs=split_dirs,
            img_size=img_size,
            batch_size=batch_size,
            num_workers=num_workers,
        )

    return _make_random_split_dataloaders(
        dataset_dir=dataset_dir,
        img_size=img_size,
        batch_size=batch_size,
        num_workers=num_workers,
        seed=seed,
        val_split=val_split,
        test_split=test_split,
    )


def class_weights_for(dataset: Dataset, num_classes: int) -> torch.Tensor:
    labels = _labels_from_dataset(dataset)
    counts = torch.bincount(torch.tensor(labels), minlength=num_classes).float()
    counts = torch.clamp(counts, min=1.0)
    weights = counts.sum() / (num_classes * counts)
    return weights


def _find_split_dirs(dataset_dir: Path) -> dict[str, Path | None]:
    split_aliases = {
        "train": ["train", "training"],
        "val": ["val", "valid", "validation"],
        "test": ["test", "testing"],
    }
    lower_children = {
        child.name.lower(): child
        for child in dataset_dir.iterdir()
        if child.is_dir()
    }

    found: dict[str, Path | None] = {}
    for split_name, aliases in split_aliases.items():
        found[split_name] = None
        for alias in aliases:
            if alias in lower_children:
                found[split_name] = lower_children[alias]
                break
    return found


def _make_split_dataloaders(
    split_dirs: dict[str, Path | None],
    img_size: int,
    batch_size: int,
    num_workers: int,
) -> DataBundle:
    train_dataset = datasets.ImageFolder(
        split_dirs["train"],
        transform=build_train_transform(img_size),
    )
    val_dataset = datasets.ImageFolder(
        split_dirs["val"],
        transform=build_eval_transform(img_size),
    )
    test_dataset = None
    if split_dirs["test"]:
        test_dataset = datasets.ImageFolder(
            split_dirs["test"],
            transform=build_eval_transform(img_size),
        )

    _validate_class_order(train_dataset, val_dataset, test_dataset)

    return DataBundle(
        train_loader=_loader(train_dataset, batch_size, num_workers, shuffle=True),
        val_loader=_loader(val_dataset, batch_size, num_workers, shuffle=False),
        test_loader=(
            _loader(test_dataset, batch_size, num_workers, shuffle=False)
            if test_dataset
            else None
        ),
        class_names=list(train_dataset.classes),
        class_to_idx=dict(train_dataset.class_to_idx),
        train_size=len(train_dataset),
        val_size=len(val_dataset),
        test_size=len(test_dataset) if test_dataset else 0,
    )


def _make_random_split_dataloaders(
    dataset_dir: Path,
    img_size: int,
    batch_size: int,
    num_workers: int,
    seed: int,
    val_split: float,
    test_split: float,
) -> DataBundle:
    train_base = datasets.ImageFolder(dataset_dir, transform=build_train_transform(img_size))
    eval_base = datasets.ImageFolder(dataset_dir, transform=build_eval_transform(img_size))

    indices = list(range(len(train_base)))
    labels = train_base.targets

    if not indices:
        raise ValueError(f"No images found under {dataset_dir}")

    train_idx, holdout_idx = train_test_split(
        indices,
        test_size=val_split + test_split,
        random_state=seed,
        stratify=labels,
    )

    holdout_labels = [labels[i] for i in holdout_idx]
    if test_split > 0:
        relative_test = test_split / (val_split + test_split)
        val_idx, test_idx = train_test_split(
            holdout_idx,
            test_size=relative_test,
            random_state=seed,
            stratify=holdout_labels,
        )
    else:
        val_idx = holdout_idx
        test_idx = []

    random.Random(seed).shuffle(train_idx)

    train_dataset = Subset(train_base, train_idx)
    val_dataset = Subset(eval_base, val_idx)
    test_dataset = Subset(eval_base, test_idx) if test_idx else None

    return DataBundle(
        train_loader=_loader(train_dataset, batch_size, num_workers, shuffle=True),
        val_loader=_loader(val_dataset, batch_size, num_workers, shuffle=False),
        test_loader=(
            _loader(test_dataset, batch_size, num_workers, shuffle=False)
            if test_dataset
            else None
        ),
        class_names=list(train_base.classes),
        class_to_idx=dict(train_base.class_to_idx),
        train_size=len(train_dataset),
        val_size=len(val_dataset),
        test_size=len(test_dataset) if test_dataset else 0,
    )


def _loader(
    dataset: Dataset,
    batch_size: int,
    num_workers: int,
    shuffle: bool,
) -> DataLoader:
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
    )


def _validate_class_order(*datasets_to_check: datasets.ImageFolder | None) -> None:
    reference = None
    for dataset in datasets_to_check:
        if dataset is None:
            continue
        if reference is None:
            reference = dataset.classes
            continue
        if dataset.classes != reference:
            raise ValueError(
                "Train/validation/test class folders do not match. "
                f"Expected {reference}, got {dataset.classes}"
            )


def _labels_from_dataset(dataset: Dataset) -> list[int]:
    if isinstance(dataset, Subset):
        labels = _labels_from_dataset(dataset.dataset)
        return [labels[i] for i in dataset.indices]
    if hasattr(dataset, "targets"):
        return list(dataset.targets)
    return [int(dataset[i][1]) for i in range(len(dataset))]
