"""Image validation service: facial photo uploads must be safe and well-formed."""
import io

from fastapi import HTTPException, UploadFile
from PIL import Image

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


async def validate_image(file: UploadFile) -> bytes:
    """
    Validates content type, extension, size and decodability.
    Returns the raw bytes on success; raises HTTPException(400) otherwise.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported format. Use JPG, JPEG, PNG or WebP.")

    name = (file.filename or "").lower()
    if name and not any(name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Unsupported file extension. Use JPG, JPEG, PNG or WebP.")

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image exceeds the 10 MB limit.")

    try:
        image = Image.open(io.BytesIO(data))
        image.verify()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="The file is not a valid image.") from exc

    return data


def is_likely_face_image(data: bytes) -> bool:
    """
    Lightweight heuristic to reject obviously non-photo files.
    Real face detection is delegated to the AI model endpoint — this only
    guards against tiny/corrupt or non-photographic uploads.
    """
    try:
        image = Image.open(io.BytesIO(data))
        width, height = image.size
        # Facial photos are photographic; require a minimum plausible resolution
        # and reasonable aspect ratio.
        if width < 200 or height < 200:
            return False
        ratio = width / height
        return 0.4 <= ratio <= 2.5
    except Exception:  # noqa: BLE001
        return False
