"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import styles from "./signup.module.css";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function cookieSecureSuffix() {
  return typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
}

type RegisterResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  accessToken: string;
  refreshToken: string;
};

function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 3);
}

const strengthMeta = [
  { label: "Too short", className: "strengthWeak" },
  { label: "Weak", className: "strengthWeak" },
  { label: "Medium", className: "strengthMedium" },
  { label: "Strong", className: "strengthStrong" }
];

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const strength = useMemo(() => (password ? scorePassword(password) : 0), [password]);
  const meta = strengthMeta[strength];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.get("email"),
          fullName: form.get("fullName"),
          password: form.get("password"),
          role: "Developer"
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Sign-ups are invite-only. Ask your workspace owner to add you.");
        }
        if (response.status === 409) {
          throw new Error("An account with this email already exists.");
        }
        const detail = await response.text();
        throw new Error(detail || `Sign up failed with ${response.status}`);
      }

      const user = (await response.json()) as RegisterResponse;
      window.localStorage.setItem("devcloud_token", user.accessToken);
      window.localStorage.setItem("devcloud_authenticated", "true");
      window.localStorage.setItem("devcloud_user", JSON.stringify({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }));
      document.cookie = `devcloud_portal_session=1; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${cookieSecureSuffix()}`;

      router.push("/dashboard" as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.signupShell}>
      <section className={styles.formPanel}>
        <div className={styles.brand}>DevCloud</div>
        <div className={styles.formGlow} />
        <form className={styles.signupCard} onSubmit={submit}>
          <div className={styles.copyBlock}>
            <h1>Create your workspace</h1>
            <p>Get started free. No credit card required.</p>
          </div>

          <label className={styles.field}>
            <span>Full name</span>
            <input name="fullName" type="text" autoComplete="name" placeholder="Ada Lovelace" required />
          </label>

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
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
            {password ? (
              <div className={styles.strengthRow}>
                <div className={styles.strengthTrack}>
                  <div
                    className={`${styles.strengthBar} ${styles[meta.className]}`}
                    style={{ width: `${((strength + 1) / 4) * 100}%` }}
                  />
                </div>
                <span className={`${styles.strengthLabel} ${styles[meta.className]}`}>{meta.label}</span>
              </div>
            ) : null}
          </label>

          {error ? <div className={styles.errorLine}>{error}</div> : null}

          <button className={styles.submitButton} disabled={loading} type="submit">
            {loading ? "Creating account" : "Create Account"}
          </button>

          <Link className={styles.altLink} href="/login">
            Already have an account? Sign in &rarr;
          </Link>

          <span className={styles.poweredBy}>Powered by Codewithmonk Technology</span>
        </form>
      </section>

      <section className={styles.terminalPanel} aria-label="DevCloud setup preview">
        <div className={styles.terminalAura} />
        <div className={styles.terminalWindow}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalDots}>
              <span />
              <span />
              <span />
            </div>
            <strong>devcloud - provisioning</strong>
          </div>
          <div className={styles.terminalBody}>
            <span className={styles.typeLine}>$ creating workspace for you...</span>
            <span className={styles.typeLine}>{"\u2713 Tailscale mesh configured"}</span>
            <span className={styles.typeLine}>$ setting up your first environment...</span>
            <span className={styles.typeLine}>{"\u2713 .NET 8 environment ready"}</span>
            <span className={styles.typeLine}>$ importing your GitHub repos...</span>
            <span className={styles.typeLine}>{"\u2713 3 repositories synced"}</span>
            <span className={styles.typeLine}>{"Welcome to DevCloud! \uD83D\uDE80"}</span>
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

