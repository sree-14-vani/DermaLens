/**
 * Central API configuration.
 *
 * Every external service URL lives here. To connect your deployed FastAPI
 * server or AI models later, set these environment variables — no other
 * frontend file needs to change.
 *
 * .env:
 *   VITE_FASTAPI_BASE_URL=https://your-api.example.com   (optional backend)
 *   VITE_SKIN_ANALYSIS_MODEL_URL=https://your-colab-model/analyze
 *   VITE_IMAGE_ENHANCEMENT_MODEL_URL=https://your-enhancer/enhance
 */

export const apiConfig = {
  /** FastAPI base URL. Empty when running Supabase-only (default mode). */
  fastapiBaseUrl: (import.meta.env.VITE_FASTAPI_BASE_URL as string | undefined) ?? '',
  /** Skin analysis model endpoint (FastAPI proxy or direct Colab/ngrok URL). */
  skinAnalysisModelUrl: (import.meta.env.VITE_SKIN_ANALYSIS_MODEL_URL as string | undefined) ?? '',
  /** Image enhancement model endpoint. */
  imageEnhancementModelUrl: (import.meta.env.VITE_IMAGE_ENHANCEMENT_MODEL_URL as string | undefined) ?? '',
  /** Request timeout in milliseconds. */
  timeoutMs: 30_000,
};

export function isBackendConfigured(): boolean {
  return apiConfig.fastapiBaseUrl.length > 0;
}

export function isAnalysisModelConfigured(): boolean {
  return apiConfig.skinAnalysisModelUrl.length > 0;
}

export function isEnhancementModelConfigured(): boolean {
  return apiConfig.imageEnhancementModelUrl.length > 0;
}
