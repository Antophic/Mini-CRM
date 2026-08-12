type ApiPayload<T> = {
  data?: T;
  error?: {
    code?: string;
    details?: unknown;
  };
  message?: string;
  success: boolean;
};

export class ApiError extends Error {
  readonly code?: string;
  readonly details?: unknown;
  readonly status: number;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

const defaultBaseUrl = import.meta.env.PROD ? "/api" : "http://localhost:3000/api";
const baseUrl = (import.meta.env.VITE_API_URL?.trim() || defaultBaseUrl).replace(
  /\/$/,
  "",
);

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.method && !["GET", "HEAD", "OPTIONS"].includes(options.method)) {
    headers.set("X-CSRF-Protection", "1");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message ?? "Unable to complete the request.",
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    );
  }

  return payload.data as T;
}
