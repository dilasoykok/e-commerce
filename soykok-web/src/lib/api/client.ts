/**
 * Backend API'ye istek atan tek fonksiyon. Hem sunucuda (Server Component,
 * Server Action) hem tarayıcıda çalışır:
 *
 *   - Tarayıcı: göreli "/api" → aynı adres (nginx /api'yi backend'e yönlendirir),
 *     oturum çerezi otomatik gider.
 *   - Sunucu:   API_URL ortam değişkeni (Docker'da http://api:8080/api,
 *     geliştirmede http://localhost/api). Çerez gerekiyorsa `cookie` verilir.
 *
 * Hatalar ApiError olarak fırlatılır; backend'in ProblemDetails cevabındaki
 * başlık ve alan hataları (ValidationProblem → errors) içinde taşınır.
 */

const isServer = typeof window === 'undefined';

export const API_BASE = isServer ? (process.env.API_URL ?? 'http://localhost/api') : '/api';

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Alan bazlı hatalar: { name: ['Ürün adı zorunlu.'] } */
    readonly fields: Record<string, string[]> = {},
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }

  /** Alan hatasını büyük/küçük harf farkı gözetmeden bulur */
  fieldError(field: string): string | undefined {
    const key = Object.keys(this.fields).find((k) => k.toLowerCase() === field.toLowerCase());
    return key ? this.fields[key]?.[0] : undefined;
  }
}

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
};

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Gönderilen bilgilerde hata var.',
  401: 'Bu işlem için giriş yapmalısınız.',
  403: 'Bu işlem için yetkiniz yok.',
  404: 'Aradığınız kayıt bulunamadı.',
  409: 'Bu kayıt zaten var.',
  429: 'Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.',
  500: 'Sunucuda bir hata oluştu. Lütfen tekrar deneyin.',
  503: 'Servis şu an kullanılamıyor. Lütfen biraz sonra tekrar deneyin.',
};

export type ApiRequestInit = Omit<RequestInit, 'body'> & {
  /** JSON olarak gönderilecek gövde */
  json?: unknown;
  /** Dosya yükleme (multipart/form-data; Content-Type tarayıcı tarafından yazılır) */
  form?: FormData;
  /** Sunucudan istek atarken tarayıcının çerezlerini iletmek için */
  cookie?: string;
  timeoutMs?: number;
  /** Next.js veri önbelleği (yalnızca sunucuda anlamlı) */
  next?: { revalidate?: number | false; tags?: string[] };
};

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { json, form, cookie, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = init;

  const h = new Headers(headers);
  h.set('Accept', 'application/json');
  if (json !== undefined) h.set('Content-Type', 'application/json');
  if (cookie) h.set('Cookie', cookie);

  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(timeoutMs),
      ...rest,
      headers: h,
      body: json !== undefined ? JSON.stringify(json) : form,
    });
  } catch (err) {
    throw new ApiError(0, 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.', {}, (err as Error)?.name);
  }

  if (res.status === 204) return undefined as T;

  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  const body: unknown = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const problem = (body ?? {}) as ProblemDetails;
    throw new ApiError(
      res.status,
      problem.title || problem.detail || STATUS_MESSAGES[res.status] || `İstek başarısız (HTTP ${res.status}).`,
      problem.errors ?? {},
      problem.code,
    );
  }

  return body as T;
}

/** { q: 'meşe', page: 2, indirim: true } → "?q=me%C5%9Fe&page=2&indirim=1" (boş değerler atlanır) */
export function toQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    sp.set(key, value === true ? '1' : String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
