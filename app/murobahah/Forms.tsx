"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { BuktiUpload } from "@/components/Bukti";

type TemplateOption = { id: number; nama: string; archivedAt?: Date | null };

export function MurobahahForm({ templates }: { templates: TemplateOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namaPartner, setNamaPartner] = useState("");
  const [pokok, setPokok] = useState(0);
  const [totalImbalHasil, setTotalImbalHasil] = useState(0);
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().slice(0, 10));
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [catatan, setCatatan] = useState("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [buktiPath, setBuktiPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/murobahah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaPartner,
          pokok,
          totalImbalHasil,
          tanggalMulai,
          jatuhTempo,
          catatan,
          buktiPath,
          templateId: templateId === "" ? null : templateId,
        }),
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
      setTemplateId("");
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
        <div>
          <div className="mb-1 ml-0.5 text-[0.65rem] uppercase font-semibold tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            Pokok pinjaman
          </div>
          <input
            type="number"
            value={pokok}
            onChange={(e) => setPokok(Number(e.target.value))}
            min={0}
            step="1000"
            placeholder="Jumlah pokok"
            className="form-input"
          />
        </div>
        <div>
          <div className="mb-1 ml-0.5 text-[0.65rem] uppercase font-semibold tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            Margin / imbal hasil
          </div>
          <input
            type="number"
            value={totalImbalHasil}
            onChange={(e) => setTotalImbalHasil(Number(e.target.value))}
            min={0}
            step="1000"
            placeholder="Jumlah margin / imbal"
            className="form-input"
          />
        </div>
        <p
          className="md:col-span-2 -mt-1 ml-0.5 text-[0.7rem]"
          style={{ color: "var(--text-muted)" }}
        >
          Pokok = dana yang keluar. Margin / imbal hasil = yang dihitung zakat 2.5%. Total diterima = pokok + margin.
        </p>
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
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
          className="form-input md:col-span-2"
        >
          <option value="">— Pakai template default —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}{t.archivedAt ? " (ARSIP)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full mt-2">
        <BuktiUpload value={buktiPath} onChange={setBuktiPath} label="Bukti TF" />
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

export function MurobahahEditForm({
  murobahahId,
  initial,
  templates,
}: {
  murobahahId: number;
  initial: {
    namaPartner: string;
    pokok: number;
    totalImbalHasil: number;
    tanggalMulai: string;
    jatuhTempo: string;
    catatan: string;
    templateId: number | null;
  };
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namaPartner, setNamaPartner] = useState(initial.namaPartner);
  const [pokok, setPokok] = useState(initial.pokok);
  const [totalImbalHasil, setTotalImbalHasil] = useState(initial.totalImbalHasil);
  const [tanggalMulai, setTanggalMulai] = useState(initial.tanggalMulai);
  const [jatuhTempo, setJatuhTempo] = useState(initial.jatuhTempo);
  const [catatan, setCatatan] = useState(initial.catatan);
  const [templateId, setTemplateId] = useState<number | "">(initial.templateId ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/murobahah/${murobahahId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaPartner,
          pokok,
          totalImbalHasil,
          tanggalMulai,
          jatuhTempo,
          catatan,
          templateId: templateId === "" ? null : templateId,
        }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[0.7rem] font-medium transition-colors"
        style={{
          borderColor: "var(--bg-border)",
          color: "var(--text-muted)",
          backgroundColor: "transparent",
        }}
        title="Edit murobahah"
      >
        <PencilLine className="h-3 w-3" />
        Edit
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md p-3 text-[0.8rem]" style={{ border: "1px solid var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Edit Murobahah</div>
        <button onClick={() => setOpen(false)} className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>✕ Tutup</button>
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <input value={namaPartner} onChange={(e) => setNamaPartner(e.target.value)} placeholder="Nama partner" className="form-input md:col-span-2" />
        <div>
          <div className="mb-1 ml-0.5 text-[0.65rem] uppercase font-semibold tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            Pokok / modal
          </div>
          <input type="number" value={pokok} onChange={(e) => setPokok(Number(e.target.value))} placeholder="Jumlah pokok / modal" className="form-input" />
        </div>
        <div>
          <div className="mb-1 ml-0.5 text-[0.65rem] uppercase font-semibold tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            Margin / imbal hasil
          </div>
          <input type="number" value={totalImbalHasil} onChange={(e) => setTotalImbalHasil(Number(e.target.value))} placeholder="Jumlah margin / imbal" className="form-input" />
        </div>
        <p className="md:col-span-2 -mt-1 ml-0.5 text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
          Kolom pertama isi pokok/modal. Kolom kedua isi margin/imbal hasil.
        </p>
        <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="form-input" />
        <input type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} className="form-input" />
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan (opsional)" className="form-input md:col-span-2" />
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
          className="form-input md:col-span-2"
        >
          <option value="">— Pakai template default —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}{t.archivedAt ? " (ARSIP)" : ""}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-2 text-[0.75rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={submit} disabled={isPending} className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50">
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost px-3 py-1.5 text-[0.8rem]">Batal</button>
      </div>
    </div>
  );
}

export function ImbalHasilForm({ murobahahId }: { murobahahId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [pokokDiterima, setPokokDiterima] = useState(0);
  const [jumlah, setJumlah] = useState(0);
  const [buktiPath, setBuktiPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/imbal-hasil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ murobahahId, tanggal, pokokDiterima, jumlah, buktiPath }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setPokokDiterima(0);
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
        + Catat Penerimaan
      </button>
    );
  }

  return (
    <div className="rounded-md p-2.5" style={{ border: "1px solid var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="grid gap-2 md:grid-cols-[auto_1fr_1fr_auto_auto]">
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="form-input"
          style={{ width: "auto" }}
        />
        <input
          type="number"
          value={pokokDiterima}
          onChange={(e) => setPokokDiterima(Number(e.target.value))}
          placeholder="Pokok diterima"
          className="form-input"
        />
        <input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
          placeholder="Imbal diterima"
          className="form-input"
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
      <div className="mt-2">
        <BuktiUpload value={buktiPath} onChange={setBuktiPath} label="Bukti TF" />
      </div>
      <p className="mt-2 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
        Pokok yang kembali dicatat terpisah. Zakat dihitung dari kolom imbal diterima dan hanya 97.5% imbal yang dialokasikan ke pos.
      </p>
      {error && <p className="mt-1.5 text-[0.75rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
    </div>
  );
}
