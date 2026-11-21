"""Routine routes: list, create, update."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from database import get_supabase_admin
from schemas import RoutineCreate, RoutineOut, RoutineUpdate
from services.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/routines", tags=["routines"])


@router.get("", response_model=list[RoutineOut])
async def list_routines(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = (
        supabase.table("skincare_routines")
        .select("*")
        .eq("user_id", user_id)
        .eq("active", True)
        .order("created_at")
        .execute()
    )
    return [RoutineOut(**r) for r in response.data]


@router.post("", response_model=RoutineOut, status_code=201)
async def create_routine(
    payload: RoutineCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_admin()
    row = {
        "user_id": user_id,
        "period": payload.period,
        "steps": [s.model_dump() for s in payload.steps],
        "source": payload.source,
    }
    inserted = supabase.table("skincare_routines").insert(row).execute()
    return RoutineOut(**inserted.data[0])


@router.put("/{routine_id}", response_model=RoutineOut)
async def update_routine(
    routine_id: str,
    payload: RoutineUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_admin()
    owned = (
        supabase.table("skincare_routines")
        .select("id")
        .eq("id", routine_id)
        .eq("user_id", user_id)  # authorization: owner only
        .execute()
    )
    if not owned.data:
        raise HTTPException(status_code=404, detail="Routine not found")

    updated = (
        supabase.table("skincare_routines")
        .update({
            "steps": [s.model_dump() for s in payload.steps],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", routine_id)
        .execute()
    )
    return RoutineOut(**updated.data[0])
