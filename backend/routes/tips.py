"""Tips route: shared tip library."""
import logging

from fastapi import APIRouter, Depends

from database import get_supabase_admin
from schemas import TipOut
from services.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tips", tags=["tips"])


@router.get("", response_model=list[TipOut])
async def list_tips(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = supabase.table("beauty_tips").select("*").order("category").execute()
    return [TipOut(**r) for r in response.data]
