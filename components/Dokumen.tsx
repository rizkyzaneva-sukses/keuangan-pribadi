"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2 } from "lucide-react";

type Tipe = "INVESTASI_TEMAN" | "INVESTASI" | "MUROBAHAH";

export type DokumenItem = {
  id: number;
  nama: string;
  jenis: string;
  filePath: string;
  originalName?: string | null;
  mime?: string | null;
  size?: number | null;
};

export function DokumenList({
  tipe,
  refId,
  docs = [],
}: {
  tipe: Tipe;
  refId: number;
  docs?: DokumenItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<DokumenItem[]>(docs);
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState("PERJANJIAN");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(docs);
  }, [docs]);

  const submit = async () => {
    setError("");
    if (!file) {
      setError("Pilih file terlebih dulu");
      return;
    }
    if (!nama.trim()) {
      setError("Isi nama dokumen");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "dokumen");
      fd.append("tipe", tipe);
      fd.append("refId", String(refId));
      fd.append("nama", nama.trim());
      fd.append("jenis", jenis);
      const res = await fetch("/api/dokumen", { method: "POST", body: fd });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        throw new Error(b?.message || "Gagal upload dokumen");
      }
      const created = (await res.json()) as DokumenItem;
      setItems((prev) => [created, ...prev]);
      setNama("");
      setJenis("PERJANJIAN");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal upload dokumen");
    } finally {
      setUploading(false);
    }
  };

  const hapus = async (id: number) => {
    setError("");
    try {
      const res = await fetch(`/api/dokumen/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        throw new Error(b?.message || "Gagal menghapus");
      }
      setItems((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    }
  };

  return (
    <div className="mt-3 rounded-md border p-2.5" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="mb-2 flex items-center justify-between">
        <div className="section-title !mb-0">Dokumen</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] font-medium transition-colors"
          style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)", backgroundColor: "rgba(212,168,67,0.08)" }}
        >
          {open ? "Tutup" : "+ Tambah"}
        </button>
      </div>

      {open && (
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama dokumen (mis. Perjanjian Investasi)"
            className="form-input sm:col-span-2"
          />
          <select value={jenis} onChange={(e) => setJenis(e.target.value)} className="form-input">
            <option value="PERJANJIAN">Perjanjian</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="form-input"
          />
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={uploading}
              className="btn-primary px-3 py-1.5 text-[0.75rem] font-medium disabled:opacity-50"
            >
              {uploading ? "Mengunggah..." : "Unggah"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-2 text-[0.72rem]" style={{ color: "var(--accent-red)" }}>
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
          Belum ada dokumen.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((d) => (
            <li key={d.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ border: "1px solid var(--bg-border)" }}>
              <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-gold)" }} />
              <a
                href={d.filePath}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-0 truncate text-[0.75rem] hover:underline"
                style={{ color: "var(--text-primary)" }}
                title={d.originalName || d.nama}
              >
                {d.nama}
              </a>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium"
                style={{
                  color: d.jenis === "PERJANJIAN" ? "var(--accent-gold)" : "var(--text-muted)",
                  backgroundColor: d.jenis === "PERJANJIAN" ? "rgba(212,168,67,0.1)" : "var(--bg-surface)",
                }}
              >
                {d.jenis === "PERJANJIAN" ? "Perjanjian" : "Lainnya"}
              </span>
              <button
                type="button"
                onClick={() => hapus(d.id)}
                className="shrink-0 text-[var(--text-muted)] transition-colors hover:text-[var(--accent-red)]"
                title="Hapus dokumen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
