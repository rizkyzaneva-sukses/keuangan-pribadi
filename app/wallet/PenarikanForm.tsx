"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function PenarikanForm({
  walletPos,
}: {
  walletPos: { id: number; nama: string; saldo: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [walletPosId, setWalletPosId] = useState(walletPos[0]?.id || 0);
  const [nominal, setNominal] = useState(0);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [akun, setAkun] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/penarikan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletPosId, nominal, tanggal, akun, keterangan }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setNominal(0);
      setAkun("");
      setKeterangan("");
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium"
        style={{ backgroundColor: "var(--accent-gold)" }}
      >
        + Tarik Saldo
      </button>
    );
  }

  return (
    <div className="card">
      <div className="section-title mb-3">Tarik Saldo Wallet</div>
      <div className="space-y-2.5">
        <select
          value={walletPosId}
          onChange={(e) => setWalletPosId(Number(e.target.value))}
          className="form-input"
        >
          {walletPos.map((w) => (
            <option key={w.id} value={w.id}>
              {w.nama} (saldo: Rp {w.saldo.toLocaleString("id-ID")})
            </option>
          ))}
        </select>
        <input
          type="number"
          value={nominal}
          onChange={(e) => setNominal(Number(e.target.value))}
          placeholder="Nominal"
          className="form-input"
        />
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="form-input"
        />
        <input
          value={akun}
          onChange={(e) => setAkun(e.target.value)}
          placeholder="Akun tujuan (opsional)"
          className="form-input"
        />
        <input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Keterangan (opsional)"
          className="form-input"
        />
        {error && <p className="text-[0.8rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={isPending}
            className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Tarik"}
          </button>
          <button
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
