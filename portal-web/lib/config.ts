const PUBLIC_API_URL = "https://devcloud-api-s816.onrender.com";
const LOCAL_API_URL = "http://localhost:5000";

function isUnsafeProductionApiUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && (
      url.hostname === "100.105.66.71" ||
      url.hostname === "167.233.97.163" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
  } catch {
    return true;
  }
}

export function publicApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const fallback = process.env.NODE_ENV === "production" ? PUBLIC_API_URL : LOCAL_API_URL;
  const candidate = (configured || fallback).replace(/\/$/, "");

  if (process.env.NODE_ENV === "production" && isUnsafeProductionApiUrl(candidate)) {
    return PUBLIC_API_URL;
  }

  return candidate;
}
