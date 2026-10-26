from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path

import torch
import yaml
from roboflow import Roboflow
from ultralytics import YOLO


WORKSPACE = "kamzi-oguine"
PROJECT = "acp_merged_project-qpcug"
VERSION = 1

TARGET_CLASS_NAME = "Diaphorina citri"

DEFAULT_PROCESSED_DIR = Path(
    "datasets/citraguard_acp_oneclass"
)

MODEL_OUTPUT_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "citraguard-yolo11n.pt"
)

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".bmp",
}


def normalize_name(
    value: str
) -> str:
    return " ".join(
        value.lower()
        .replace("_", " ")
        .replace("-", " ")
        .split()
    )


def get_names(
    data_yaml: dict
) -> list[str]:
    raw_names = data_yaml.get(
        "names",
        []
    )

    if isinstance(
        raw_names,
        dict
    ):
        return [
            str(
                raw_names[index]
            )
            for index in sorted(
                raw_names,
                key=lambda value: int(value),
            )
        ]

    return [
        str(value)
        for value in raw_names
    ]


def find_target_class_index(
    names: list[str]
) -> int:
    target_normalized = normalize_name(
        TARGET_CLASS_NAME
    )

    for index, name in enumerate(
        names
    ):
        if (
            normalize_name(name)
            ==
            target_normalized
        ):
            return index

    for index, name in enumerate(
        names
    ):
        normalized = normalize_name(
            name
        )

        if (
            "diaphorina" in normalized
            and
            "citri" in normalized
        ):
            return index

    raise RuntimeError(
        "Could not find a 'Diaphorina citri' class "
        f"in dataset classes: {names}"
    )


def locate_split_directory(
    source_root: Path,
    split: str
) -> Path | None:
    candidates = [
        source_root / split,
        source_root / (
            "valid"
            if split == "val"
            else split
        ),
        source_root / (
            "val"
            if split == "valid"
            else split
        ),
    ]

    for candidate in candidates:
        if (
            candidate.exists()
            and
            (candidate / "images").exists()
        ):
            return candidate

    return None


def prepare_one_class_dataset(
    source_root: Path,
    output_root: Path,
) -> Path:
    source_yaml_path = (
        source_root /
        "data.yaml"
    )

    if not source_yaml_path.exists():
        raise FileNotFoundError(
            f"Could not find {source_yaml_path}"
        )

    with source_yaml_path.open(
        "r",
        encoding="utf-8",
    ) as handle:
        source_yaml = yaml.safe_load(
            handle
        )

    names = get_names(
        source_yaml
    )

    target_index = (
        find_target_class_index(
            names
        )
    )

    if output_root.exists():
        shutil.rmtree(
            output_root
        )

    output_root.mkdir(
        parents=True,
        exist_ok=True,
    )

    split_mapping = {
        "train": "train",
        "valid": "valid",
        "test": "test",
    }

    summary = {}

    for output_split, lookup_split in split_mapping.items():
        source_split = locate_split_directory(
            source_root,
            lookup_split,
        )

        if source_split is None:
            continue

        source_images = (
            source_split /
            "images"
        )

        source_labels = (
            source_split /
            "labels"
        )

        output_images = (
            output_root /
            output_split /
            "images"
        )

        output_labels = (
            output_root /
            output_split /
            "labels"
        )

        output_images.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_labels.mkdir(
            parents=True,
            exist_ok=True,
        )

        image_count = 0
        positive_image_count = 0
        target_box_count = 0

        for image_path in source_images.iterdir():
            if (
                not image_path.is_file()
                or
                image_path.suffix.lower()
                not in IMAGE_EXTENSIONS
            ):
                continue

            image_count += 1

            shutil.copy2(
                image_path,
                output_images /
                image_path.name,
            )

            source_label_path = (
                source_labels /
                f"{image_path.stem}.txt"
            )

            output_label_path = (
                output_labels /
                f"{image_path.stem}.txt"
            )

            kept_lines = []

            if source_label_path.exists():
                for raw_line in source_label_path.read_text(
                    encoding="utf-8"
                ).splitlines():
                    stripped = raw_line.strip()

                    if not stripped:
                        continue

                    parts = stripped.split()

                    if len(parts) < 5:
                        continue

                    try:
                        class_id = int(
                            float(parts[0])
                        )
                    except ValueError:
                        continue

                    if class_id != target_index:
                        continue

                    kept_lines.append(
                        " ".join(
                            [
                                "0",
                                *parts[1:5],
                            ]
                        )
                    )

            if kept_lines:
                positive_image_count += 1
                target_box_count += len(
                    kept_lines
                )

            output_label_path.write_text(
                "\n".join(
                    kept_lines
                ),
                encoding="utf-8",
            )

        summary[
            output_split
        ] = {
            "images": image_count,
            "positive_images":
                positive_image_count,
            "target_boxes":
                target_box_count,
        }

    output_yaml = {
        "path": str(
            output_root.resolve()
        ),
        "train": "train/images",
        "val": "valid/images",
        "test": "test/images",
        "names": {
            0:
                TARGET_CLASS_NAME,
        },
    }

    output_yaml_path = (
        output_root /
        "data.yaml"
    )

    with output_yaml_path.open(
        "w",
        encoding="utf-8",
    ) as handle:
        yaml.safe_dump(
            output_yaml,
            handle,
            sort_keys=False,
        )

    print(
        "\nPrepared one-class ACP dataset:"
    )

    for split, values in summary.items():
        print(
            f"  {split}: "
            f"{values['images']} images, "
            f"{values['positive_images']} ACP-positive images, "
            f"{values['target_boxes']} ACP boxes"
        )

    return output_yaml_path


def choose_device():
    if torch.cuda.is_available():
        return 0

    if (
        hasattr(
            torch.backends,
            "mps",
        )
        and
        torch.backends.mps.is_available()
    ):
        return "mps"

    return "cpu"


def download_dataset() -> Path:
    api_key = os.environ.get(
        "ROBOFLOW_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "ROBOFLOW_API_KEY is not set. "
            "Either set it before running this script "
            "or pass --dataset /path/to/exported/dataset."
        )

    print(
        "Downloading CitraGuard Roboflow dataset…"
    )

    rf = Roboflow(
        api_key=api_key
    )

    project = (
        rf.workspace(
            WORKSPACE
        )
        .project(
            PROJECT
        )
    )

    dataset = (
        project
        .version(
            VERSION
        )
        .download(
            "yolov11"
        )
    )

    return Path(
        dataset.location
    )


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--dataset",
        type=str,
        default=None,
        help=(
            "Optional path to an already-exported "
            "Roboflow YOLO11 dataset. If omitted, "
            "the script downloads your Roboflow "
            "project using ROBOFLOW_API_KEY."
        ),
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=120,
    )

    parser.add_argument(
        "--imgsz",
        type=int,
        default=960,
    )

    parser.add_argument(
        "--batch",
        type=int,
        default=4,
    )

    args = parser.parse_args()

    source_root = (
        Path(
            args.dataset
        ).expanduser().resolve()
        if args.dataset
        else download_dataset()
    )

    print(
        f"Source dataset: {source_root}"
    )

    processed_yaml = (
        prepare_one_class_dataset(
            source_root,
            DEFAULT_PROCESSED_DIR,
        )
    )

    device = choose_device()

    print(
        f"Training YOLO11n on device: {device}"
    )

    model = YOLO(
        "yolo11n.pt"
    )

    model.train(
        data=str(
            processed_yaml
        ),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        patience=25,
        workers=0,
        project="runs/citraguard",
        name="yolo11n_acp",
        exist_ok=True,
        plots=True,
        verbose=True,
    )

    best_weights = (
        Path(
            "runs/citraguard/yolo11n_acp/weights/best.pt"
        )
    )

    if not best_weights.exists():
        raise FileNotFoundError(
            f"Training finished, but {best_weights} was not found."
        )

    MODEL_OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    shutil.copy2(
        best_weights,
        MODEL_OUTPUT_PATH,
    )

    print(
        "\nSaved trained CitraGuard weights to:"
    )

    print(
        MODEL_OUTPUT_PATH
    )

    print(
        "\nNext command:"
    )

    print(
        "uvicorn main:app --reload --port 8000"
    )


if __name__ == "__main__":
    main()
