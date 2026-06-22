"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";

export function BayarSemuaZakatButton({
  totalSisa,
  jumlahItem,
}: {
  totalSisa: number;
  jumlahItem: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("Dilunasi sekaligus");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/zakat/bayar-semua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, keterangan }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Gagal melunasi semua zakat");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  if (jumlahItem === 0 || totalSisa <= 0) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary px-3 py-1.5 text-[0.8rem]"
      >
        Bayar Semua
      </button>
    );
  }

  return (
    <div className="card mt-3">
      <div className="section-title mb-3">Bayar Semua Zakat</div>
      <div className="space-y-2.5">
        <p className="text-[0.78rem]" style={{ color: "var(--text-secondary)" }}>
          {jumlahItem} kewajiban akan dilunasi dengan total {formatRupiah(totalSisa)}.
        </p>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="form-input"
        />
        <input
          type="text"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Keterangan pembayaran"
          className="form-input"
        />
        {error && <p className="text-[0.8rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50"
          >
            {isPending ? "Memproses..." : "Lunasi Semua"}
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
    </div>
  );
}
