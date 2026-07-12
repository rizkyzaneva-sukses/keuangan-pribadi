"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { BuktiUpload } from "@/components/Bukti";

type TemplateOption = { id: number; nama: string; archivedAt?: Date | null };

export function TemanForm({ templates }: { templates: TemplateOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namaTeman, setNamaTeman] = useState("");
  const [modal, setModal] = useState(0);
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/teman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaTeman,
          modal,
          tanggalMulai,
          catatan,
          templateId: templateId === "" ? null : templateId,
        }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setNamaTeman("");
      setModal(0);
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

export function TemanEditForm({
  investasiTemanId,
  initial,
  templates,
}: {
  investasiTemanId: number;
  initial: {
    namaTeman: string;
    modal: number;
    tanggalMulai: string;
    catatan: string;
    templateId: number | null;
  };
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namaTeman, setNamaTeman] = useState(initial.namaTeman);
  const [modal, setModal] = useState(initial.modal);
  const [tanggalMulai, setTanggalMulai] = useState(initial.tanggalMulai);
  const [catatan, setCatatan] = useState(initial.catatan);
  const [templateId, setTemplateId] = useState<number | "">(initial.templateId ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/teman/${investasiTemanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaTeman,
          modal,
          tanggalMulai,
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
        title="Edit investasi teman"
      >
        <PencilLine className="h-3 w-3" />
        Edit
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md p-3 text-[0.8rem]" style={{ border: "1px solid var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Edit Investasi Teman</div>
        <button onClick={() => setOpen(false)} className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>✕ Tutup</button>
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <input value={namaTeman} onChange={(e) => setNamaTeman(e.target.value)} placeholder="Nama teman/partner" className="form-input" />
        <input type="number" value={modal} onChange={(e) => setModal(Number(e.target.value))} placeholder="Modal" className="form-input" />
        <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="form-input" />
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan (opsional)" className="form-input" />
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

export function DevidenForm({ investasiTemanId }: { investasiTemanId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlah, setJumlah] = useState(0);
  const [buktiPath, setBuktiPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/deviden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investasiTemanId, tanggal, jumlah, buktiPath }),
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
      <div className="w-full">
        <BuktiUpload value={buktiPath} onChange={setBuktiPath} label="Bukti TF" />
      </div>
      <p className="mt-2 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
        Deviden yang dialokasikan ke pos adalah 97.5% setelah dipotong zakat 2.5%.
      </p>
      {error && <p className="mt-1.5 text-[0.75rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
    </div>
  );
}

export function DevidenEditForm({
  devidenId,
  initialTanggal,
  initialJumlah,
  initialBuktiPath,
}: {
  devidenId: number;
  initialTanggal: string;
  initialJumlah: number;
  initialBuktiPath: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(initialTanggal);
  const [jumlah, setJumlah] = useState(initialJumlah);
  const [buktiPath, setBuktiPath] = useState<string | null>(initialBuktiPath);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/deviden/${devidenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, jumlah, buktiPath }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Gagal mengubah deviden");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost px-2 py-0.5 text-[0.7rem]"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="rounded-md p-2.5" style={{ border: "1px solid var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="mb-2 text-[0.75rem]" style={{ color: "var(--text-secondary)" }}>
        Edit deviden
      </div>
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
          className="form-input"
          style={{ width: "auto" }}
        />
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
          onClick={() => {
            setTanggal(initialTanggal);
            setJumlah(initialJumlah);
            setBuktiPath(initialBuktiPath);
            setError("");
            setOpen(false);
          }}
          className="btn-ghost px-2.5 py-1.5 text-[0.8rem]"
        >
          Batal
        </button>
      </div>
      <div className="w-full mt-1">
        <BuktiUpload value={buktiPath} onChange={setBuktiPath} label="Bukti TF" />
      </div>
      {error && <p className="mt-2 text-[0.72rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
    </div>
  );
}
