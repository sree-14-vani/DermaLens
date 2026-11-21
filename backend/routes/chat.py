"""Chat routes: send message, history."""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from database import get_supabase_admin
from schemas import ChatHistoryItem, ChatRequest, ChatResponse
from services.auth import get_current_user_id
from ai.chatbot import get_ai_reply

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])

NOT_CONFIGURED_REPLY = (
    "The AI provider is not configured on this server. Ask your administrator to set "
    "AI_PROVIDER_API_KEY in the backend environment. I cannot answer until then."
)


@router.post("", response_model=ChatResponse)
async def send_chat(
    payload: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()

    user_msg = supabase.table("chat_messages").insert({
        "user_id": user_id,
        "role": "user",
        "content": payload.message,
        "created_at": now,
    }).execute()

    history = [
        {"role": m.role, "content": m.content}
        for m in payload.history
    ]
    reply = await get_ai_reply(payload.message, history, payload.language)
    if reply is None:
        reply = NOT_CONFIGURED_REPLY

    supabase.table("chat_messages").insert({
        "user_id": user_id,
        "role": "assistant",
        "content": reply,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    # Persist/refresh the conversation title from the first user message.
    conversations = (
        supabase.table("chat_conversations")
        .select("id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not conversations.data:
        supabase.table("chat_conversations").insert({
            "user_id": user_id,
            "title": payload.message[:60],
        }).execute()

    return ChatResponse(reply=reply)


@router.get("/history", response_model=list[ChatHistoryItem])
async def chat_history(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_admin()
    response = (
        supabase.table("chat_messages")
        .select("id, role, content, created_at")
        .eq("user_id", user_id)
        .order("created_at")
        .limit(200)
        .execute()
    )
    return [ChatHistoryItem(**r) for r in response.data]
