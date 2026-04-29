"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function KasForm({ kategoriList }: { kategoriList: { id: number; nama: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jenis, setJenis] = useState<"MASUK" | "KELUAR">("KELUAR");
  const [kategoriNama, setKategoriNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [jumlah, setJumlah] = useState(0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, jenis, kategoriNama, keterangan, jumlah }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setKeterangan("");
      setJumlah(0);
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
        + Tambah Kas
      </button>
    );
  }

  return (
    <div className="card">
      <div className="section-title mb-3">Transaksi Kas Baru</div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="form-input"
        />
        <select
          value={jenis}
          onChange={(e) => setJenis(e.target.value as "MASUK" | "KELUAR")}
          className="form-input"
        >
          <option value="MASUK">MASUK</option>
          <option value="KELUAR">KELUAR</option>
        </select>
        <input
          type="text"
          value={kategoriNama}
          onChange={(e) => setKategoriNama(e.target.value)}
          placeholder="Kategori (Ketik atau Pilih)"
          className="form-input"
          list="kategori-list"
        />
        <datalist id="kategori-list">
          {kategoriList.map((k) => (
            <option key={k.id} value={k.nama} />
          ))}
        </datalist>
        <input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
          placeholder="Jumlah"
          className="form-input"
        />
        <input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Keterangan"
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
