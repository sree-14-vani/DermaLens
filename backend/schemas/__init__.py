"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

Severity = Literal["mild", "moderate", "severe", "very_severe"]
RegionName = Literal["forehead", "left_cheek", "right_cheek", "nose", "chin"]


# ---------- Analysis ----------
class RegionResult(BaseModel):
    region: RegionName
    findings: Optional[str] = None
    severity: Optional[Severity] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    spots: Optional[int] = Field(default=None, ge=0)


class AnalysisResult(BaseModel):
    severity: Optional[Severity] = None
    concerns: list[str] = []
    summary: Optional[str] = None
    suggestions: list[str] = []
    affected_area: Optional[dict] = None
    regions: list[RegionResult] = []


class AnalysisCreateResponse(BaseModel):
    id: str
    user_id: str
    image_path: str
    status: str
    created_at: datetime
    result: Optional[AnalysisResult] = None


class AnalysisDetail(BaseModel):
    id: str
    user_id: str
    image_path: str
    status: str
    detected_concerns: Optional[list[str]] = None
    acne_severity: Optional[Severity] = None
    affected_area: Optional[dict] = None
    summary: Optional[str] = None
    suggestions: Optional[list] = None
    created_at: datetime
    regions: list[RegionResult] = []


class AnalysisHistoryItem(BaseModel):
    id: str
    image_path: str
    status: str
    acne_severity: Optional[Severity] = None
    created_at: datetime


# ---------- Enhancement ----------
class EnhancementCreateResponse(BaseModel):
    id: str
    user_id: str
    original_path: str
    enhanced_path: Optional[str] = None
    status: str
    created_at: datetime


class EnhancementHistoryItem(BaseModel):
    id: str
    original_path: str
    enhanced_path: Optional[str] = None
    status: str
    created_at: datetime


# ---------- Routines ----------
class RoutineStepIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    detail: str = Field(default="", max_length=500)


class RoutineCreate(BaseModel):
    period: Literal["morning", "night"]
    steps: list[RoutineStepIn] = Field(min_length=1, max_length=20)
    source: Literal["default", "personalized", "custom"] = "custom"


class RoutineUpdate(BaseModel):
    steps: list[RoutineStepIn] = Field(min_length=1, max_length=20)


class RoutineOut(BaseModel):
    id: str
    period: str
    steps: list[dict]
    source: str
    active: bool
    created_at: datetime
    updated_at: datetime


# ---------- Tips ----------
class TipOut(BaseModel):
    id: str
    category: str
    title: str
    body: str
    ingredients: Optional[list[str]] = None


# ---------- Diet ----------
class MealPlan(BaseModel):
    breakfast: list[str] = []
    lunch: list[str] = []
    snacks: list[str] = []
    dinner: list[str] = []


class DietPlanCreate(BaseModel):
    preference: Literal["vegetarian", "non-vegetarian"]
    day_label: Optional[str] = Field(default=None, max_length=40)
    plan: MealPlan


class DietPlanOut(BaseModel):
    id: str
    preference: str
    day_label: Optional[str] = None
    plan: dict
    created_at: datetime


# ---------- Chat ----------
class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    language: Literal["en", "kn", "hi", "te"] = "en"
    history: list[ChatMessageIn] = Field(default_factory=list, max_length=40)


class ChatResponse(BaseModel):
    reply: str


class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime


# ---------- Profile ----------
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    skin_type: Optional[Literal["normal", "dry", "oily", "combination", "sensitive"]] = None
    sensitivity: Optional[Literal["low", "medium", "high"]] = None
    concerns: Optional[list[str]] = None
    preferences: Optional[list[str]] = None
    food_preference: Optional[Literal["vegetarian", "non-vegetarian"]] = None
    language: Optional[Literal["en", "kn", "hi", "te"]] = None
    age_range: Optional[Literal["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"]] = None
    privacy_settings: Optional[dict] = None


class ProfileOut(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    skin_type: Optional[str] = None
    sensitivity: Optional[str] = None
    concerns: Optional[list[str]] = None
    preferences: Optional[list[str]] = None
    food_preference: Optional[str] = None
    language: str = "en"
    age_range: Optional[str] = None
    privacy_settings: dict = {}


# ---------- Health ----------
class HealthResponse(BaseModel):
    status: str
    analysis_model_configured: bool
    enhancement_model_configured: bool
    ai_provider_configured: bool
