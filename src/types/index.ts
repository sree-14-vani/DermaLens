export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
export type Sensitivity = 'low' | 'medium' | 'high';
export type AcneSeverity = 'mild' | 'moderate' | 'severe' | 'very_severe';
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface SkinProfile {
  id: string;
  full_name: string | null;
  skin_type: SkinType | null;
  concerns: string[] | null;
  sensitivity: Sensitivity | null;
  preferences: string[] | null;
  date_of_birth: string | null;
  food_preference: 'vegetarian' | 'non-vegetarian' | null;
  language: string;
  avatar_path: string | null;
  age_range: string | null;
  privacy_settings: Record<string, boolean> | null;
}

export interface SkinAnalysis {
  id: string;
  user_id: string;
  image_path: string;
  status: AnalysisStatus;
  detected_concerns: string[] | null;
  acne_severity: AcneSeverity | null;
  affected_area: { region: string; extent: string } | null;
  summary: string | null;
  suggestions: string[] | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  day: string;
  period: 'morning' | 'night';
  label: string;
  done: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export type AnalysisRegion = 'forehead' | 'left_cheek' | 'right_cheek' | 'nose' | 'chin';

export interface AnalysisRegionResult {
  region: AnalysisRegion;
  findings: string | null;
  severity: AcneSeverity | null;
  confidence: number | null;
  spots: number | null;
}

export interface EnhancementRecord {
  id: string;
  original_path: string;
  enhanced_path: string | null;
  status: 'pending' | 'complete' | 'failed';
  created_at: string;
}

export interface RoutineStep {
  name: string;
  detail: string;
}

export interface Routine {
  id: string;
  period: 'morning' | 'night';
  steps: RoutineStep[];
  source: 'default' | 'personalized' | 'custom';
  active: boolean;
}

export interface RoutineCompletion {
  routine_id: string;
  step_index: number;
  day: string;
  done: boolean;
}

export interface BeautyTip {
  id: string;
  category: string;
  title: string;
  body: string;
  ingredients: string[] | null;
}

export interface DietPlan {
  id: string;
  preference: 'vegetarian' | 'non-vegetarian';
  day_label: string | null;
  plan: Record<string, string[]>;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: 'morning_reminder' | 'night_reminder' | 'water_reminder' | 'meal_reminder' | 'general_reminder';
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  type: NotificationItem['type'];
  enabled: boolean;
  preferred_time: string;
}

