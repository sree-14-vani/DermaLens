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

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}
