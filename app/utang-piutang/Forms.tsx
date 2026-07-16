"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { BuktiUpload, BuktiField } from "@/components/Bukti";

export function UtangPiutangFilters({
  jenis,
  status,
  q,
}: {
  jenis: string;
  status: string;
  q: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState({ jenis, status, q });
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setFilters({ jenis, status, q });
  }, [jenis, status, q]);

  const apply = (next: { jenis: string; status: string; q: string }) => {
    const params = new URLSearchParams();
    if (next.jenis) params.set("jenis", next.jenis);
    if (next.status) params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/utang-piutang?${qs}` : "/utang-piutang");
    });
  };

  const onSelect = (key: "jenis" | "status", value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    apply(next);
  };

  const onQChange = (value: string) => {
    setFilters((prev) => ({ ...prev, q: value }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      apply({ ...filters, q: value });
    }, 400);
  };

  return (
    <form
      method="GET"
      className={`flex flex-wrap items-center gap-2 w-full md:w-auto ${isPending ? "opacity-60" : ""}`}
      onSubmit={(e) => e.preventDefault()}
    >
      <select
        name="jenis"
        value={filters.jenis}
        onChange={(e) => onSelect("jenis", e.target.value)}
        className="form-input"
        style={{ width: "auto" }}
      >
        <option value="">Semua jenis</option>
        <option value="UTANG">Utang</option>
        <option value="PIUTANG">Piutang</option>
      </select>
      <select
        name="status"
        value={filters.status}
        onChange={(e) => onSelect("status", e.target.value)}
        className="form-input"
        style={{ width: "auto" }}
      >
        <option value="">Semua status</option>
        <option value="BELUM">BELUM</option>
        <option value="SEBAGIAN">SEBAGIAN</option>
        <option value="LUNAS">LUNAS</option>
      </select>
      <input
        type="text"
        name="q"
        value={filters.q}
        onChange={(e) => onQChange(e.target.value)}
        placeholder="Cari nama pihak..."
        className="form-input w-full md:w-56"
      />
    </form>
  );
}

export function UtangPiutangForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jenis, setJenis] = useState<"UTANG" | "PIUTANG">("UTANG");
  const [namaPihak, setNamaPihak] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [jumlah, setJumlah] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [catatKas, setCatatKas] = useState(true);
  const [buktiPath, setBuktiPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/utang-piutang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis,
          namaPihak,
          tanggal,
          jatuhTempo: jatuhTempo || null,
          jumlah,
          catatan,
          catatKas,
          buktiPath,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Gagal menyimpan catatan");
        return;
      }
      setNamaPihak("");
      setJumlah(0);
      setJatuhTempo("");
      setCatatan("");
      setCatatKas(true);
      setBuktiPath(null);
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium"
      >
        + Tambah Utang / Piutang
      </button>
    );
  }

  return (
    <div className="card">
      <div className="section-title mb-3">Catatan Utang / Piutang Baru</div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <select
          value={jenis}
          onChange={(e) => setJenis(e.target.value as "UTANG" | "PIUTANG")}
          className="form-input"
        >
          <option value="UTANG">UTANG</option>
          <option value="PIUTANG">PIUTANG</option>
        </select>
        <input
          value={namaPihak}
          onChange={(e) => setNamaPihak(e.target.value)}
          placeholder="Nama pihak"
          className="form-input"
        />
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="form-input"
        />
        <input
          type="date"
          value={jatuhTempo}
          onChange={(e) => setJatuhTempo(e.target.value)}
          className="form-input"
          placeholder="Jatuh tempo"
        />
        <input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
          placeholder="Nominal"
          className="form-input"
        />
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan (opsional)"
          className="form-input"
        />
      </div>
      <div className="mt-3">
        <BuktiUpload value={buktiPath} onChange={setBuktiPath} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-[0.78rem]" style={{ color: "var(--text-secondary)" }}>
        <input
          type="checkbox"
          checked={catatKas}
          onChange={(e) => setCatatKas(e.target.checked)}
        />
        Catat juga ke Kas Harian
      </label>
      <p className="mt-2 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
        Untuk transaksi lama yang kasnya sudah pernah dicatat, hilangkan centang ini supaya tidak dobel.
      </p>
      {error && <p className="mt-2 text-[0.8rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-ghost px-3 py-1.5 text-[0.8rem]"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

interface PembayaranItem {
  id: number;
  tanggal: string | Date;
  jumlah: number;
  keterangan: string | null;
  buktiPath: string | null;
}

export function PembayaranUtangPiutangButton({
  id,
  jenis,
  namaPihak,
  jumlah,
  sudahDibayar,
  pembayaran,
}: {
  id: number;
  jenis: "UTANG" | "PIUTANG";
  namaPihak: string;
  jumlah: number;
  sudahDibayar: number;
  pembayaran: PembayaranItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [catatKas, setCatatKas] = useState(true);
  const [buktiPath, setBuktiPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const sisa = jumlah - sudahDibayar;
  const pct = jumlah > 0 ? Math.round((sudahDibayar / jumlah) * 100) : 0;

  const submit = () => {
    const nominal = Number(jumlahBayar.replace(/\D/g, ""));
    if (!nominal || nominal <= 0) {
      setError("Masukkan jumlah yang valid");
      return;
    }
    if (nominal > sisa) {
      setError(`Melebihi sisa: ${formatRupiah(sisa)}`);
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/utang-piutang/${id}/pembayaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlah: nominal,
          tanggal,
          keterangan,
          catatKas,
          buktiPath,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Gagal menyimpan pembayaran");
        return;
      }
      setOpen(false);
      setJumlahBayar("");
      setKeterangan("");
      setCatatKas(true);
      setBuktiPath(null);
      router.refresh();
    });
  };

  const isiPenuh = () => {
    setJumlahBayar(sisa.toLocaleString("id-ID"));
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "flex-end" }}>
        {sudahDibayar > 0 && (
          <div style={{ width: "7rem" }}>
            <div
              style={{
                height: "4px",
                borderRadius: "9999px",
                backgroundColor: "var(--bg-border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: "9999px",
                  backgroundColor: pct === 100 ? "var(--accent-green)" : "var(--accent-gold)",
                }}
              />
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "right", marginTop: "2px" }}>
              {pct}% - sisa {formatRupiah(sisa)}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          {pembayaran.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRiwayat(true)}
              className="btn-ghost px-2 py-1"
              style={{ fontSize: "0.65rem" }}
            >
              Riwayat
            </button>
          )}
          {sisa > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn-primary px-2.5 py-1 text-[0.7rem]"
            >
              {sudahDibayar > 0 ? "Bayar Lagi" : "Bayar"}
            </button>
          )}
        </div>
      </div>

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
              width: "min(420px, 90vw)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                {jenis === "UTANG" ? "Bayar Utang" : "Terima Piutang"}
              </h3>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {namaPihak} · sisa <span style={{ color: "var(--accent-gold)" }}>{formatRupiah(sisa)}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label className="label">Jumlah</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={jumlahBayar}
                    onChange={(e) => setJumlahBayar(e.target.value ? Number(e.target.value.replace(/\D/g, "")).toLocaleString("id-ID") : "")}
                    placeholder="Rp 0"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={isiPenuh} className="btn-ghost px-3" style={{ fontSize: "0.75rem" }}>
                    Lunas
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="label">Keterangan</label>
                <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="label">Bukti Transfer</label>
                <BuktiUpload value={buktiPath} onChange={setBuktiPath} label="Bukti TF" />
              </div>
              <label className="flex items-center gap-2 text-[0.78rem]" style={{ color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={catatKas} onChange={(e) => setCatatKas(e.target.checked)} />
                Catat juga ke Kas Harian
              </label>
              {error && <p style={{ fontSize: "0.75rem", color: "var(--accent-red)" }}>{error}</p>}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-4 py-2" style={{ fontSize: "0.8rem" }}>
                  Batal
                </button>
                <button type="button" onClick={submit} disabled={isPending} className="btn-primary px-4 py-2" style={{ fontSize: "0.8rem" }}>
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRiwayat && (
        <div
          onClick={() => setShowRiwayat(false)}
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
              width: "min(480px, 90vw)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Riwayat Cicilan
                </h3>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {namaPihak} · total {formatRupiah(jumlah)}
                </div>
              </div>
              <button type="button" onClick={() => setShowRiwayat(false)} className="btn-ghost px-2 py-1" style={{ fontSize: "0.75rem" }}>
                Tutup
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {pembayaran.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.75rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 500 }}>
                        {item.keterangan || "Pembayaran"}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {formatTanggal(item.tanggal)}
                      </div>
                    </div>
                    <BuktiField tipe="PembayaranUtangPiutang" id={item.id} buktiPath={item.buktiPath} />
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-green)", marginLeft: "0.75rem", flexShrink: 0 }}>
                    {formatRupiah(item.jumlah)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
