"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-xl p-6 text-center"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
        }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(248, 113, 113, 0.1)" }}
        >
          <span className="text-2xl">⚠️</span>
        </div>
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Terjadi Kesalahan
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {error.message || "Maaf, terjadi kesalahan yang tidak terduga."}
        </p>
        <button
          onClick={reset}
          className="btn-primary px-4 py-2 text-sm font-medium"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
