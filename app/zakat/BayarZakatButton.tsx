"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, formatTanggal } from "@/lib/format";

interface Pembayaran {
  id: number;
  tanggal: string | Date;
  jumlah: number;
  keterangan: string | null;
}

interface BayarZakatButtonProps {
  id: number;
  jumlah: number;
  sudahDibayar: number;
  status: "BELUM" | "SEBAGIAN" | "SUDAH";
  pembayaran: Pembayaran[];
}

export function BayarZakatButton({ id, jumlah, sudahDibayar, status, pembayaran }: BayarZakatButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLunasPending, startLunasTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState("");

  const sisa = jumlah - sudahDibayar;
  const pct = jumlah > 0 ? Math.round((sudahDibayar / jumlah) * 100) : 0;

  const bayar = () => {
    const nominal = Number(jumlahBayar.replace(/\D/g, ""));
    if (!nominal || nominal <= 0) { setError("Masukkan jumlah yang valid"); return; }
    if (nominal > sisa) { setError(`Melebihi sisa: ${formatRupiah(sisa)}`); return; }
    setError("");

    startTransition(async () => {
      const res = await fetch(`/api/zakat/${id}/bayar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumlah: nominal, tanggal, keterangan }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setOpen(false);
      setJumlahBayar("");
      setKeterangan("");
      router.refresh();
    });
  };

  const bayarLunas = () => {
    if (sisa <= 0) return;
    if (!confirm(`Langsung lunasi sisa zakat sebesar ${formatRupiah(sisa)}?`)) return;

    startLunasTransition(async () => {
      const res = await fetch(`/api/zakat/${id}/bayar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jumlah: sisa, 
          tanggal: new Date().toISOString().slice(0, 10), 
          keterangan: "Lunas (langsung)" 
        }),
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      router.refresh();
    });
  };

  const handleJumlahChange = (val: string) => {
    const num = val.replace(/\D/g, "");
    setJumlahBayar(num ? Number(num).toLocaleString("id-ID") : "");
  };

  const isiPenuh = () => {
    setJumlahBayar(sisa.toLocaleString("id-ID"));
  };

  return (
    <>
      {/* Progress bar + tombol aksi */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "flex-end" }}>
        {/* Progress bar — hanya tampil jika sudah ada pembayaran */}
        {sudahDibayar > 0 && (
          <div style={{ width: "7rem" }}>
            <div style={{
              height: "4px",
              borderRadius: "9999px",
              backgroundColor: "var(--bg-border)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: "9999px",
                backgroundColor: pct === 100 ? "var(--accent-green)" : "var(--accent-gold)",
                transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "right", marginTop: "2px" }}>
              {pct}% — sisa {formatRupiah(sisa)}
            </div>
          </div>
        )}

        {/* Tombol */}
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          {pembayaran.length > 0 && (
            <button
              onClick={() => setShowRiwayat(true)}
              className="btn-ghost px-2 py-1"
              style={{ fontSize: "0.65rem" }}
              title="Riwayat pembayaran"
            >
              📋 {pembayaran.length}x
            </button>
          )}
          {status !== "SUDAH" && (
            <>
              <button
                onClick={bayarLunas}
                disabled={isPending || isLunasPending}
                className="btn-ghost px-2 py-1"
                style={{ fontSize: "0.9rem", color: "var(--accent-green)", padding: "0 0.5rem" }}
                title="Sekali klik lunas"
              >
                {isLunasPending ? "..." : "✓"}
              </button>
              <button
                onClick={() => setOpen(true)}
                disabled={isPending || isLunasPending}
                className="btn-primary px-2.5 py-1"
                style={{ fontSize: "0.7rem", fontWeight: 500 }}
              >
                {isPending ? "..." : status === "SEBAGIAN" ? "Bayar Lagi" : "Bayar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal Bayar */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
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
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                Bayar Zakat
              </h3>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Kewajiban: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatRupiah(jumlah)}</span>
                {sudahDibayar > 0 && (
                  <> &nbsp;·&nbsp; Sudah: <span style={{ color: "var(--accent-green)" }}>{formatRupiah(sudahDibayar)}</span>
                  &nbsp;·&nbsp; Sisa: <span style={{ color: "var(--accent-gold)" }}>{formatRupiah(sisa)}</span>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {/* Jumlah */}
              <div>
                <label className="label">Jumlah Bayar</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={jumlahBayar}
                    onChange={(e) => handleJumlahChange(e.target.value)}
                    placeholder="Rp 0"
                    className="form-input"
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={isiPenuh}
                    className="btn-ghost px-3"
                    style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                  >
                    Lunas
                  </button>
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="label">Tanggal Bayar</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="label">Keterangan <span style={{ color: "var(--text-muted)" }}>(opsional)</span></label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="mis. Warga 40 org @ Rp75.000"
                  className="form-input"
                />
              </div>

              {error && (
                <p style={{ fontSize: "0.75rem", color: "var(--accent-red)" }}>{error}</p>
              )}

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                <button onClick={() => setOpen(false)} className="btn-ghost px-4 py-2" style={{ fontSize: "0.8rem" }}>
                  Batal
                </button>
                <button
                  onClick={bayar}
                  disabled={isPending}
                  className="btn-primary px-4 py-2"
                  style={{ fontSize: "0.8rem" }}
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat Pembayaran */}
      {showRiwayat && (
        <div
          onClick={() => setShowRiwayat(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              width: "min(480px, 90vw)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Riwayat Pembayaran
                </h3>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Total: {formatRupiah(jumlah)} · Terbayar: {formatRupiah(sudahDibayar)}
                </div>
              </div>
              <button onClick={() => setShowRiwayat(false)} className="btn-ghost px-2 py-1" style={{ fontSize: "0.75rem" }}>✕</button>
            </div>

            {/* Progress bar besar */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{
                height: "6px", borderRadius: "9999px",
                backgroundColor: "var(--bg-border)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  borderRadius: "9999px",
                  backgroundColor: pct === 100 ? "var(--accent-green)" : "var(--accent-gold)",
                  transition: "width 0.4s ease",
                }} />
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {pct}% terbayar · sisa {formatRupiah(sisa)}
              </div>
            </div>

            {pembayaran.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
                Belum ada pembayaran
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pembayaran.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.625rem 0.75rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--bg-border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 500 }}>
                        {p.keterangan || `Pembayaran ke-${pembayaran.length - i}`}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {formatTanggal(p.tanggal)}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-green)" }}>
                      {formatRupiah(p.jumlah)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
