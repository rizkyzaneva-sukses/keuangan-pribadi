"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TemanForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namaTeman, setNamaTeman] = useState("");
  const [modal, setModal] = useState(0);
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/teman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaTeman, modal, tanggalMulai, catatan }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setNamaTeman("");
      setModal(0);
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
        + Tambah Investasi Teman
      </button>
    );
  }

  return (
    <div className="card">
      <div className="section-title mb-3">Investasi Teman Baru</div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <input
          value={namaTeman}
          onChange={(e) => setNamaTeman(e.target.value)}
          placeholder="Nama teman/partner"
          className="form-input"
        />
        <input
          type="number"
          value={modal}
          onChange={(e) => setModal(Number(e.target.value))}
          placeholder="Modal"
          className="form-input"
        />
        <input
          type="date"
          value={tanggalMulai}
          onChange={(e) => setTanggalMulai(e.target.value)}
          className="form-input"
        />
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan (opsional)"
          className="form-input"
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

export function DevidenForm({ investasiTemanId }: { investasiTemanId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlah, setJumlah] = useState(0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/deviden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investasiTemanId, tanggal, jumlah }),
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
        + Catat Deviden
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
          placeholder="Jumlah deviden"
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
