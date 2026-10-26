from __future__ import annotations

import io
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO


APP_DIR = Path(__file__).resolve().parent
MODEL_PATH = APP_DIR / "models" / "citraguard-yolo11n.pt"

MODEL_NAME = "CitraGuard YOLO11n"
TARGET_CLASS = "Diaphorina citri"

CONFIDENCE_THRESHOLD = 0.20
IOU_THRESHOLD = 0.50
INFERENCE_SIZE = 960
MAX_UPLOAD_BYTES = 12 * 1024 * 1024

TARGET_ALIASES = {
    "diaphorina citri",
    "dc",
    "acp",
    "asian citrus psyllid",
}


app = FastAPI(
    title="CitraGuard Vision API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://citraguard.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model: YOLO | None = None
model_error: str | None = None


def normalize_name(value: str) -> str:
    return " ".join(
        value.lower()
        .replace("_", " ")
        .replace("-", " ")
        .split()
    )


def load_model() -> None:
    global model
    global model_error

    if not MODEL_PATH.exists():
        model = None
        model_error = (
            f"Model weights not found at {MODEL_PATH}. "
            "Run train_citraguard.py first."
        )
        return

    try:
        model = YOLO(str(MODEL_PATH))
        model_error = None
    except Exception as exc:
        model = None
        model_error = str(exc)


load_model()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_name": MODEL_NAME,
        "model_path": str(MODEL_PATH),
        "model_error": model_error,
        "target_class": TARGET_CLASS,
    }


@app.post("/predict")
async def predict(
    image: UploadFile = File(...)
):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                model_error
                or "YOLO11 model is not loaded."
            ),
        )

    contents = await image.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the 12 MB upload limit.",
        )

    try:
        pil_image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        ) from exc

    image_array = np.array(pil_image)

    results = model.predict(
        source=image_array,
        imgsz=INFERENCE_SIZE,
        conf=CONFIDENCE_THRESHOLD,
        iou=IOU_THRESHOLD,
        verbose=False,
    )

    if not results:
        raise HTTPException(
            status_code=500,
            detail="YOLO11 returned no result object.",
        )

    result = results[0]

    detections = []

    if result.boxes is not None:
        xyxy_values = (
            result.boxes.xyxy
            .detach()
            .cpu()
            .numpy()
        )

        confidence_values = (
            result.boxes.conf
            .detach()
            .cpu()
            .numpy()
        )

        class_values = (
            result.boxes.cls
            .detach()
            .cpu()
            .numpy()
            .astype(int)
        )

        for box, confidence, class_id in zip(
            xyxy_values,
            confidence_values,
            class_values,
        ):
            class_name = str(
                result.names.get(
                    int(class_id),
                    class_id,
                )
            )

            normalized_class = normalize_name(
                class_name
            )

            if (
                normalized_class
                not in TARGET_ALIASES
            ):
                continue

            x1, y1, x2, y2 = [
                float(value)
                for value in box
            ]

            detections.append({
                "class_id": int(class_id),
                "class_name": class_name,
                "confidence": round(
                    float(confidence),
                    4,
                ),
                "x1": round(x1, 2),
                "y1": round(y1, 2),
                "x2": round(x2, 2),
                "y2": round(y2, 2),
            })

    detections.sort(
        key=lambda item: item["confidence"],
        reverse=True,
    )

    height, width = image_array.shape[:2]

    return {
        "model_name": MODEL_NAME,
        "target_class": TARGET_CLASS,
        "count": len(detections),
        "detections": detections,
        "image_width": int(width),
        "image_height": int(height),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "iou_threshold": IOU_THRESHOLD,
        "inference_size": INFERENCE_SIZE,
    }
