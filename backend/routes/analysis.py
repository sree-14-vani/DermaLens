"""Analysis routes: upload, detail, history, delete."""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from database import get_supabase_admin
from schemas import (
    AnalysisCreateResponse,
    AnalysisDetail,
    AnalysisHistoryItem,
    AnalysisResult,
    RegionResult,
)
from services.auth import get_current_user_id
from services.image_validation import validate_image
from ai.inference import call_skin_analysis_model

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("", response_model=AnalysisCreateResponse, status_code=201)
async def create_analysis(
    image: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    """Upload a facial image, create an analysis, and run the AI model if configured."""
    supabase = get_supabase_admin()
    data = await validate_image(image)

    # Upload to private storage under the user's own folder.
    ext = (image.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
    storage_path = f"{user_id}/{uuid.uuid4()}.{ext}"
    try:
        supabase.storage.from_("face-images").upload(
            storage_path,
            data,
            {"content-type": image.content_type or "image/jpeg"},
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Storage upload failed")
        raise HTTPException(status_code=502, detail="Could not store the image.") from exc

    # Create the analysis row (pending until the model returns).
    now = datetime.now(timezone.utc).isoformat()
    row = {"user_id": user_id, "image_path": storage_path, "status": "pending", "created_at": now}
    inserted = supabase.table("skin_analyses").insert(row).execute()
    analysis = inserted.data[0]
    analysis_id = analysis["id"]

    # Run the real model (only when configured). Never fabricate results.
    model_output = await call_skin_analysis_model(
        data, image.filename or "photo.jpg", image.content_type or "image/jpeg"
    )

    regions_saved: list[RegionResult] = []
    if model_output:
        severity = model_output.get("severity")
        update: dict = {"status": "complete"}
        if severity in ("mild", "moderate", "severe", "very_severe"):
            update["acne_severity"] = severity
        if isinstance(model_output.get("concerns"), list):
            update["detected_concerns"] = model_output["concerns"]
        if isinstance(model_output.get("summary"), str):
            update["summary"] = model_output["summary"]
        if isinstance(model_output.get("suggestions"), list):
            update["suggestions"] = model_output["suggestions"]
        if isinstance(model_output.get("affected_area"), dict):
            update["affected_area"] = model_output["affected_area"]
        supabase.table("skin_analyses").update(update).eq("id", analysis_id).execute()

        regions = model_output.get("regions") or []
        valid_regions = [r for r in regions if r.get("region") in
                         ("forehead", "left_cheek", "right_cheek", "nose", "chin")]
        if valid_regions:
            rows = [
                {
                    "analysis_id": analysis_id,
                    "user_id": user_id,
                    "region": r["region"],
                    "findings": r.get("findings"),
                    "severity": r.get("severity") if r.get("severity") in ("mild", "moderate", "severe", "very_severe") else None,
                    "confidence": r.get("confidence"),
                    "spots": r.get("spots"),
                }
                for r in valid_regions
            ]
            saved = supabase.table("skin_analysis_regions").insert(rows).execute()
            regions_saved = [RegionResult(**r) for r in saved.data]
    else:
        logger.info("Analysis %s remains pending: model unavailable", analysis_id)

    return AnalysisCreateResponse(
        **analysis,
        result=AnalysisResult(regions=regions_saved) if regions_saved else None,
    )


@router.get("/history", response_model=list[AnalysisHistoryItem])
async def analysis_history(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = (
        supabase.table("skin_analyses")
        .select("id, image_path, status, acne_severity, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [AnalysisHistoryItem(**r) for r in response.data]


@router.get("/{analysis_id}", response_model=AnalysisDetail)
async def get_analysis(analysis_id: str, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = (
        supabase.table("skin_analyses")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", user_id)  # authorization: owner only
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = response.data[0]
    regions = (
        supabase.table("skin_analysis_regions")
        .select("region, findings, severity, confidence, spots")
        .eq("analysis_id", analysis_id)
        .execute()
    )
    return AnalysisDetail(**analysis, regions=[RegionResult(**r) for r in regions.data])


@router.delete("/{analysis_id}", status_code=204)
async def delete_analysis(analysis_id: str, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = (
        supabase.table("skin_analyses")
        .select("image_path")
        .eq("id", analysis_id)
        .eq("user_id", user_id)  # authorization: owner only
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    image_path = response.data[0]["image_path"]
    supabase.table("skin_analyses").delete().eq("id", analysis_id).execute()
    try:
        supabase.storage.from_("face-images").remove([image_path])
    except Exception:  # noqa: BLE001
        logger.warning("Could not remove storage object %s", image_path)
    return None
