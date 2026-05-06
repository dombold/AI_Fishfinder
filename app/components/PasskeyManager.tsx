"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

type Passkey = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string;
};

export default function PasskeyManager() {
  const router = useRouter();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.PublicKeyCredential) {
      setSupported(false);
      return;
    }
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(setSupported)
      .catch(() => setSupported(false));

    fetch("/api/webauthn/passkeys")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setPasskeys(data))
      .catch(() => {});
  }, []);

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      const optRes = await fetch("/api/webauthn/register/options");
      if (!optRes.ok) throw new Error("Failed to get registration options");
      const options = await optRes.json();

      const attResp = await startRegistration(options);

      const verRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...attResp, label: "This device" }),
      });
      if (!verRes.ok) {
        const data = await verRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Verification failed");
      }

      const refreshed = await fetch("/api/webauthn/passkeys").then((r) => r.json());
      if (Array.isArray(refreshed)) setPasskeys(refreshed);
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") return;
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/webauthn/credentials/${id}`, { method: "DELETE" });
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (supported === false) {
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--color-mist)" }}>
        Biometric login is not available on this device.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && (
        <div
          role="alert"
          style={{
            background: "rgba(224,92,42,0.15)",
            border: "1px solid rgba(224,92,42,0.4)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            color: "var(--color-warning)",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {passkeys.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {passkeys.map((pk) => (
            <li
              key={pk.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(107,143,163,0.2)",
                borderRadius: "0.5rem",
                padding: "0.625rem 0.875rem",
                background: "rgba(107,143,163,0.06)",
              }}
            >
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-foam)", margin: 0 }}>
                  {pk.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-mist)", margin: "0.125rem 0 0" }}>
                  Last used{" "}
                  {new Date(pk.lastUsedAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(pk.id)}
                disabled={deleting === pk.id}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--color-warning)",
                  background: "none",
                  border: "none",
                  padding: "0.25rem 0.5rem",
                  cursor: "pointer",
                  opacity: deleting === pk.id ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
                aria-label={`Remove ${pk.name}`}
              >
                {deleting === pk.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleRegister}
        disabled={loading || supported === null}
        className="btn-ghost"
        style={{ width: "100%", justifyContent: "center" }}
      >
        {loading ? (
          <span style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
            &nbsp;Setting up…
          </span>
        ) : passkeys.length > 0 ? "Add another device" : "Add Biometric Login"}
      </button>

      {passkeys.length === 0 && supported !== null && (
        <p style={{ fontSize: "0.8rem", color: "var(--color-mist)", margin: 0, lineHeight: 1.5 }}>
          Use your fingerprint or Face ID to sign in instead of your password.
        </p>
      )}
    </div>
  );
}
