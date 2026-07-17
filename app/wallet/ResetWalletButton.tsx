"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import { RotateCcw } from "lucide-react";

export function ResetWalletButton({ totalSaldo }: { totalSaldo: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [akun, setAkun] = useState("Kas/Bank");
  const [keterangan, setKeterangan] = useState("RESET dari 0");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/wallet/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, akun, keterangan }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Gagal mereset wallet");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  if (totalSaldo <= 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.7rem] font-medium transition-colors"
        style={{
          borderColor: "var(--accent-red)",
          color: "var(--accent-red)",
          backgroundColor: "rgba(248, 113, 113, 0.08)",
        }}
      >
        <RotateCcw className="h-3 w-3" />
        Reset ke 0
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              width: "min(400px, 90vw)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--accent-red)", marginBottom: "0.25rem" }}>
                Reset Semua Wallet
              </h3>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Semua saldo wallet akan ditarik jadi 0. Total saat ini{" "}
                <span style={{ color: "var(--accent-gold)" }}>{formatRupiah(totalSaldo)}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label className="label">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="label">Akun Tujuan</label>
                <input
                  type="text"
                  value={akun}
                  onChange={(e) => setAkun(e.target.value)}
                  placeholder="Kas/Bank"
                  className="form-input"
                />
              </div>
              <div>
                <label className="label">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Keterangan penarikan"
                  className="form-input"
                />
              </div>
              {error && <p style={{ fontSize: "0.75rem", color: "var(--accent-red)" }}>{error}</p>}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-ghost px-4 py-2"
                  style={{ fontSize: "0.8rem" }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isPending}
                  className="px-4 py-2 text-[0.8rem] font-medium rounded-md transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--accent-red)",
                    color: "white",
                  }}
                >
                  {isPending ? "Memproses..." : "Reset Sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
