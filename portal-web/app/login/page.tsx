"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

type LoginResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  accessToken: string;
  refreshToken: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Login failed with ${response.status}`);
      }

      const user = (await response.json()) as LoginResponse;
      window.localStorage.setItem("devcloud_authenticated", "true");
      window.localStorage.setItem("devcloud_user", JSON.stringify({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }));
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ width: "min(380px, 100%)", display: "grid", gap: 14 }}>
        <div style={{ textAlign: "center", color: "var(--brand)", fontWeight: 800, fontSize: 28 }}>DevCloud</div>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        {error ? <div className="error-line">{error}</div> : null}
        <button disabled={loading}>{loading ? "Signing in" : "Sign in"}</button>
      </form>
    </main>
  );
}
