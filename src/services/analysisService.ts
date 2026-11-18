import { supabase } from './supabase';
import { apiConfig, isAnalysisModelConfigured } from './config';
import { createAnalysis, listAnalysisRegions } from './api';
import type { AnalysisRegionResult, AcneSeverity } from '@/types';

/**
 * Calls the configured skin-analysis AI endpoint with the uploaded image.
 *
 * Contract (your FastAPI model must return this JSON shape):
 * {
 *   "severity": "mild" | "moderate" | "severe" | "very_severe",   // optional
 *   "concerns": ["acne", "redness"],                              // optional
 *   "summary": "text",                                            // optional
 *   "suggestions": ["text", "text"],                              // optional
 *   "affected_area": { "region": "forehead", "extent": "…" },     // optional
 *   "regions": [                                                  // optional, 5 facial regions
 *     { "region": "forehead", "findings": "…", "severity": "mild",
 *       "confidence": 0.87, "spots": 3 }, ...
 *   ]
 * }
 *
 * If no endpoint is configured or the call fails, the analysis row keeps its
 * honest "pending" status — nothing is fabricated.
 */

interface ModelRegion {
  region: string;
  findings?: string | null;
  severity?: string | null;
  confidence?: number | null;
  spots?: number | null;
}

interface ModelResponse {
  severity?: string;
  concerns?: string[];
  summary?: string;
  suggestions?: string[];
  affected_area?: { region: string; extent: string } | null;
  regions?: ModelRegion[];
}

const VALID_SEVERITIES: AcneSeverity[] = ['mild', 'moderate', 'severe', 'very_severe'];
const VALID_REGIONS = ['forehead', 'left_cheek', 'right_cheek', 'nose', 'chin'];

export { isAnalysisModelConfigured };

export async function runAnalysis(
  analysisId: string,
  imagePath: string,
  file: File,
): Promise<{ status: 'complete' | 'pending'; regions?: AnalysisRegionResult[] }> {
  if (!isAnalysisModelConfigured()) {
    return { status: 'pending' };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const form = new FormData();
    form.append('image', file);
    form.append('analysis_id', analysisId);
    form.append('image_path', imagePath);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    const response = await fetch(apiConfig.skinAnalysisModelUrl, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return { status: 'pending' };

    const raw = (await response.json()) as ModelResponse;
    const severity = VALID_SEVERITIES.includes(raw.severity as AcneSeverity)
      ? (raw.severity as AcneSeverity)
      : null;

    const regions = (raw.regions ?? [])
      .filter((r) => VALID_REGIONS.includes(r.region))
      .map((r) => ({
        region: r.region as AnalysisRegionResult['region'],
        findings: r.findings ?? null,
        severity: VALID_SEVERITIES.includes(r.severity as AcneSeverity)
          ? (r.severity as AcneSeverity)
          : null,
        confidence: typeof r.confidence === 'number' ? r.confidence : null,
        spots: typeof r.spots === 'number' ? r.spots : null,
      }));

    const { error: updateError } = await supabase
      .from('skin_analyses')
      .update({
        status: 'complete',
        acne_severity: severity,
        detected_concerns: Array.isArray(raw.concerns) ? raw.concerns : null,
        summary: typeof raw.summary === 'string' ? raw.summary : null,
        suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : null,
        affected_area: raw.affected_area ?? null,
      })
      .eq('id', analysisId);
    if (updateError) throw updateError;

    if (regions.length > 0) {
      const { error: regionError } = await supabase
        .from('skin_analysis_regions')
        .insert(regions.map((r) => ({ ...r, analysis_id: analysisId })));
      if (regionError) throw regionError;
    }

    const saved = await listAnalysisRegions(analysisId);
    return { status: 'complete', regions: saved };
  } catch {
    return { status: 'pending' };
  }
}
