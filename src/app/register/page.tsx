"use client";

import Link from "next/link";
import { useState } from "react";
import { requestAccessAction } from "./actions";
import styles from "../setup/setup.module.css";

export default function RegisterPage() {
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        const result = await requestAccessAction(new FormData(e.currentTarget));
        if (result.success) {
            setMessage(result.message ?? "Access request sent.");
            e.currentTarget.reset();
        } else {
            setError(result.error ?? "Request failed.");
        }
        setLoading(false);
    }

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>L</div>
          <h1 className={styles.title}>Request Linje.track access</h1>
          <p className={styles.subtitle}>Approved users can enter the live tracking workspace.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="name">
              Display Name
              <input id="name" name="name" type="text" required className={styles.input} />
            </label>

            <label className={styles.label} htmlFor="email">
              Email
              <input id="email" name="email" type="email" required className={styles.input} />
            </label>

            <label className={styles.label} htmlFor="password">
              Password
              <input id="password" name="password" type="password" required minLength={8} className={styles.input} />
            </label>

            <label className={styles.label} htmlFor="confirm">
              Confirm Password
              <input id="confirm" name="confirm" type="password" required minLength={8} className={styles.input} />
            </label>

            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.success}>{message}</p>}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Sending..." : "Request Access"}
            </button>
          </form>

          <p className={styles.footer}>
            Already approved? <Link className={styles.link} href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    );
}
