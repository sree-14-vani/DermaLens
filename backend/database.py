"""Supabase client factory and shared database helpers."""
from functools import lru_cache

from supabase import create_client, Client

from config import settings


@lru_cache
def get_supabase_admin() -> Client:
    """Service-role client. Bypasses RLS — server-side use ONLY."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
