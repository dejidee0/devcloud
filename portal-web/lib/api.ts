const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("devcloud_token");
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("devcloud_token");
  window.localStorage.removeItem("devcloud_authenticated");
  window.localStorage.removeItem("devcloud_user");
  document.cookie = "devcloud_token=; Path=/; Max-Age=0; SameSite=Lax";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (res.status === 401 && typeof window !== "undefined") {
    clearSession();
    window.location.assign("/login");
  }

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed with ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? res.json() : (res.text() as Promise<T>);
}

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}

export function authToken() {
  return readToken();
}
