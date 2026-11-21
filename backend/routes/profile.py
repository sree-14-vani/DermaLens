"""Profile routes: get, update."""
import logging

from fastapi import APIRouter, Depends, HTTPException

from database import get_supabase_admin
from schemas import ProfileOut, ProfileUpdate
from services.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not response.data:
        # Return a default profile for new users.
        return ProfileOut(id=user_id)
    row = response.data[0]

    # Email lives in auth.users; fetch it separately.
    user = supabase.auth.admin.get_user_by_id(user_id)
    email = user.user.email if user and user.user else None
    return ProfileOut(**{**row, "email": email})


@router.put("", response_model=ProfileOut)
async def update_profile(
    payload: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_admin()
    existing = supabase.table("profiles").select("id").eq("id", user_id).execute()

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if existing.data:
        response = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    else:
        response = supabase.table("profiles").insert({**updates, "id": user_id}).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Could not save the profile")
    return ProfileOut(**response.data[0])
