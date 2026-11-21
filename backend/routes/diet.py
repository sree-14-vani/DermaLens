"""Diet plan routes: get latest, create/save."""
import logging

from fastapi import APIRouter, Depends, HTTPException

from database import get_supabase_admin
from schemas import DietPlanCreate, DietPlanOut
from services.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/diet-plan", tags=["diet"])


@router.get("", response_model=list[DietPlanOut])
async def get_diet_plans(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = (
        supabase.table("diet_plans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )
    return [DietPlanOut(**r) for r in response.data]


@router.post("", response_model=DietPlanOut, status_code=201)
async def create_diet_plan(
    payload: DietPlanCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_admin()
    row = {
        "user_id": user_id,
        "preference": payload.preference,
        "day_label": payload.day_label,
        "plan": payload.plan.model_dump(),
    }
    inserted = supabase.table("diet_plans").insert(row).execute()
    return DietPlanOut(**inserted.data[0])
