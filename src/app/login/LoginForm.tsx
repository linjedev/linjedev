"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isDemo } from "@/core/edition";
import { loginAction } from "./actions";
import styles from "../setup/setup.module.css";

/** Allow relative paths or same-origin URLs only (local edition is self-contained). */
function getSafeRedirect(url: string | null): string {
    if (!url) return "/";
    if (url.startsWith("/") && url[1] !== "/" && url[1] !== "\\") return url;
    try {
        const parsed = new URL(url);
        if (parsed.origin === window.location.origin) return url;
    } catch { /* invalid URL — fall through */ }
    return "/";
}

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);

        if (result.success) {
            const target = getSafeRedirect(next);
            if (target === "/") {
                router.push("/");
                router.refresh();
            } else {
                window.location.href = target;
            }
        } else {
            setError(result.error ?? "Login failed.");
            setLoading(false);
        }
    }

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>L</div>
          <h1 className={styles.title}>Sign in to Linje.track</h1>
          <p className={styles.subtitle}>Approved users can enter the workspace</p>

          <form onSubmit={handleSubmit} method="post" className={styles.form}>
            <label className={styles.label} htmlFor="email">
              {isDemo ? "Username" : "Email"}
              <input
                id="email"
                name="email"
                type={isDemo ? "text" : "email"}
                required
                className={styles.input}
                placeholder={isDemo ? "admin" : "admin@example.com"}
              />
            </label>

            <label className={styles.label} htmlFor="password">
              Password
              <input
                id="password"
                name="password"
                type="password"
                required
                className={styles.input}
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className={styles.footer}>
            Need access? <Link className={styles.link} href="/register">Request approval</Link>
          </p>
        </div>
      </div>
    );
}
