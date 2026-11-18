import { apiConfig } from './config';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper for the FastAPI backend.
 * Sends the Supabase access token so the backend can verify identity.
 */
export async function fastApiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string; formData?: FormData } = {},
): Promise<T> {
  const { method = 'GET', body, token, formData } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${apiConfig.fastapiBaseUrl}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const data = await response.json();
        if (typeof data?.detail === 'string') message = data.detail;
        else if (Array.isArray(data?.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
      } catch {
        /* keep default message */
      }
      throw new ApiError(message, response.status);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 408);
    }
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  } finally {
    clearTimeout(timer);
  }
}
