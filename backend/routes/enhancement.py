"""Enhancement routes: create and history."""
import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from database import get_supabase_admin
from schemas import EnhancementCreateResponse, EnhancementHistoryItem
from services.auth import get_current_user_id
from services.image_validation import validate_image
from ai.inference import call_enhancement_model

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/enhancement", tags=["enhancement"])


@router.post("", response_model=EnhancementCreateResponse, status_code=201)
async def create_enhancement(
    image: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    """Upload an original image, run the enhancement model if configured, store the result."""
    supabase = get_supabase_admin()
    data = await validate_image(image)

    ext = (image.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
    original_path = f"{user_id}/{uuid.uuid4()}-original.{ext}"
    try:
        supabase.storage.from_("face-images").upload(
            original_path, data, {"content-type": image.content_type or "image/jpeg"}
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Storage upload failed")
        raise HTTPException(status_code=502, detail="Could not store the image.") from exc

    row = {
        "user_id": user_id,
        "original_path": original_path,
        "status": "pending",
    }
    inserted = supabase.table("image_enhancements").insert(row).execute()
    record = inserted.data[0]
    record_id = record["id"]

    enhanced_bytes = await call_enhancement_model(
        data, image.filename or "photo.jpg", image.content_type or "image/jpeg"
    )

    enhanced_path = None
    if enhanced_bytes:
        enhanced_path = f"{user_id}/{uuid.uuid4()}-enhanced.{ext}"
        try:
            supabase.storage.from_("face-images").upload(
                enhanced_path, enhanced_bytes, {"content-type": image.content_type or "image/jpeg"}
            )
            supabase.table("image_enhancements").update(
                {"enhanced_path": enhanced_path, "status": "complete"}
            ).eq("id", record_id).execute()
            record["enhanced_path"] = enhanced_path
            record["status"] = "complete"
        except Exception:  # noqa: BLE001
            logger.exception("Could not store enhanced image")
            supabase.table("image_enhancements").update({"status": "failed"}).eq("id", record_id).execute()
            record["status"] = "failed"
    else:
        logger.info("Enhancement %s remains pending: model unavailable", record_id)

    return EnhancementCreateResponse(**record)


@router.get("/history", response_model=list[EnhancementHistoryItem])
async def enhancement_history(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = (
        supabase.table("image_enhancements")
        .select("id, original_path, enhanced_path, status, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [EnhancementHistoryItem(**r) for r in response.data]
