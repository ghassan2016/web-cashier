/**
 * Thin client for the Cahier POS Laravel API.
 * Stores the Sanctum token in localStorage and attaches it + tenant headers.
 */

// Local-dev fallback. Production sets NEXT_PUBLIC_API_URL (Vercel) →
// https://cashier.medcoai.online/api/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

const TOKEN_KEY = "cahier_token";
const BRANCH_KEY = "cahier_branch";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getBranchId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BRANCH_KEY);
}

export function setBranchId(id: string | number | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(BRANCH_KEY, String(id));
  else window.localStorage.removeItem(BRANCH_KEY);
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const branch = getBranchId();
  if (branch) headers["X-Branch-Id"] = branch;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.message ?? "حدث خطأ", data.errors);
  }

  return data as T;
}

// ---- Typed helpers ----
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  username: string | null;
  locale: string;
  is_super_admin: boolean;
  company_id: number | null;
  default_branch_id: number | null;
  branches: { id: number; name: string }[];
  roles: string[];
  permissions: string[];
}

export async function login(loginId: string, password: string) {
  // The API wraps payloads in { success, message, data: {...} }.
  const res = await api<{ data: { token: string; user: AuthUser } }>("/auth/login", {
    method: "POST",
    body: { login: loginId, password, device_name: "web" },
  });
  const { token, user } = res.data;
  setToken(token);
  if (user.default_branch_id) setBranchId(user.default_branch_id);
  return user;
}

export async function me() {
  const res = await api<{ data: { user: AuthUser } }>("/auth/me");
  return res.data.user;
}

export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    setToken(null);
    setBranchId(null);
  }
}
