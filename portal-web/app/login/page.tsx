"use client";

import { FormEvent, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { publicApiUrl } from "@/lib/config";
import styles from "./login.module.css";

const API_URL = publicApiUrl();
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function cookieSecureSuffix() {
  return typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
}

type LoginResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  accessToken: string;
  refreshToken: string;
};

async function readError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string; title?: string } | null;
    return payload?.error ?? payload?.message ?? payload?.title ?? "";
  }

  return response.text();
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        const detail = await readError(response);
        throw new Error(
          response.status === 401
            ? "Invalid email or password"
            : detail || `Login failed with ${response.status}`
        );
      }

      const user = (await response.json()) as LoginResponse;
      if (!user.accessToken) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      window.localStorage.setItem("devcloud_token", user.accessToken);
      window.localStorage.setItem("devcloud_authenticated", "true");
      window.localStorage.setItem("devcloud_user", JSON.stringify({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }));

      const secureSuffix = cookieSecureSuffix();
      document.cookie = `devcloud_portal_session=1; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${secureSuffix}`;
      document.cookie = `devcloud_token=; Path=/; Max-Age=0; SameSite=Lax${secureSuffix}`;

      const nextPath = new URLSearchParams(window.location.search).get("next");
      const redirectTo = nextPath?.startsWith("/") ? nextPath : "/dashboard";
      router.push(redirectTo as Route);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.loginShell}>
      <section className={styles.formPanel}>
        <div className={styles.brand}>DevCloud</div>
        <div className={styles.formGlow} />
        <form className={styles.loginCard} onSubmit={submit}>
          <div className={styles.copyBlock}>
            <h1>Welcome back</h1>
            <p>Sign in to your DevCloud workspace</p>
          </div>

          <label className={styles.field}>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <div className={styles.passwordWrap}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error ? <div className={styles.errorLine}>{error}</div> : null}

          <button className={styles.submitButton} disabled={loading} type="submit">
            {loading ? "Signing in" : "Sign in"}
          </button>

          <Link className={styles.altLink} href="/signup">
            Don&apos;t have an account? Sign up &rarr;
          </Link>

          <span className={styles.poweredBy}>Powered by Codewithmonk Technology</span>
        </form>
      </section>

      <section className={styles.terminalPanel} aria-label="DevCloud terminal preview">
        <div className={styles.terminalAura} />
        <div className={styles.terminalWindow}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalDots}>
              <span />
              <span />
              <span />
            </div>
            <strong>devcloud - ssh</strong>
          </div>
          <div className={styles.terminalBody}>
            <span className={styles.typeLine}>$ connecting to devcloud mesh...</span>
            <span className={styles.typeLine}>{"\u2713 Tailscale authenticated"}</span>
            <span className={styles.typeLine}>$ spinning up .NET environment...</span>
            <span className={styles.typeLine}>{"\u2713 Environment ready in 4.2s"}</span>
            <span className={styles.typeLine}>$ git clone client-project</span>
            <span className={styles.typeLine}>{"\u2713 Repository synced"}</span>
            <span className={styles.typeLine}>Welcome to DevCloud, Codemonk</span>
          </div>
        </div>

        <div className={styles.pills}>
          <span>{"\uD83D\uDD12 Zero Trust"}</span>
          <span>{"\u26A1 60s Environments"}</span>
          <span>{"\uD83D\uDCCA Full Audit Trail"}</span>
        </div>
      </section>
    </main>
  );
}


