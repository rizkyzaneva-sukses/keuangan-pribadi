"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MurobahahForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namaPartner, setNamaPartner] = useState("");
  const [pokok, setPokok] = useState(0);
  const [totalImbalHasil, setTotalImbalHasil] = useState(0);
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().slice(0, 10));
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/murobahah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaPartner, pokok, totalImbalHasil, tanggalMulai, jatuhTempo, catatan }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setNamaPartner("");
      setPokok(0);
      setTotalImbalHasil(0);
      setJatuhTempo("");
      setCatatan("");
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium"
      >
        + Tambah Murobahah
      </button>
    );
  }

  return (
    <div className="card">
      <div className="section-title mb-3">Murobahah Baru</div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <input
          value={namaPartner}
          onChange={(e) => setNamaPartner(e.target.value)}
          placeholder="Nama partner"
          className="form-input md:col-span-2"
        />
        <input
          type="number"
          value={pokok}
          onChange={(e) => setPokok(Number(e.target.value))}
          placeholder="Pokok"
          className="form-input"
        />
        <input
          type="number"
          value={totalImbalHasil}
          onChange={(e) => setTotalImbalHasil(Number(e.target.value))}
          placeholder="Total imbal hasil"
          className="form-input"
        />
        <input
          type="date"
          value={tanggalMulai}
          onChange={(e) => setTanggalMulai(e.target.value)}
          className="form-input"
        />
        <input
          type="date"
          value={jatuhTempo}
          onChange={(e) => setJatuhTempo(e.target.value)}
          placeholder="Jatuh tempo"
          className="form-input"
        />
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan (opsional)"
          className="form-input md:col-span-2"
        />
      </div>
      {error && <p className="mt-2 text-[0.8rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="btn-ghost px-3 py-1.5 text-[0.8rem]"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

export function ImbalHasilForm({ murobahahId }: { murobahahId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlah, setJumlah] = useState(0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/imbal-hasil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ murobahahId, tanggal, jumlah }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setJumlah(0);
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost px-2.5 py-1 text-[0.75rem] font-medium"
        style={{ borderColor: "rgba(52, 211, 153, 0.3)", color: "var(--accent-green)" }}
      >
        + Catat Imbal Hasil
      </button>
    );
  }

  return (
    <div className="rounded-md p-2.5" style={{ border: "1px solid var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="form-input"
          style={{ width: "auto" }}
        />
        <input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
          placeholder="Jumlah imbal hasil"
          className="form-input flex-1"
        />
        <button
          onClick={submit}
          disabled={isPending}
          className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-green)" }}
        >
          {isPending ? "..." : "Simpan"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="btn-ghost px-2.5 py-1.5 text-[0.8rem]"
        >
          ✕
        </button>
      </div>
      {error && <p className="mt-1.5 text-[0.75rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
    </div>
  );
}
