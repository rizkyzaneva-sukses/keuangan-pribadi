"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";

export function BuktiUpload({
  value,
  onChange,
  label = "Bukti TF",
}: {
  value?: string | null;
  onChange: (path: string | null) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        throw new Error(b?.message || "Gagal upload");
      }
      const data = await res.json();
      setPreview(data.path);
      onChange(data.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[0.72rem] font-medium transition-colors"
          style={{
            borderColor: "var(--accent-gold)",
            color: "var(--accent-gold)",
            backgroundColor: "rgba(212, 168, 67, 0.08)",
          }}
          disabled={uploading}
        >
          <Receipt className="h-3.5 w-3.5" />
          {uploading ? "Mengunggah..." : preview ? "Ganti Bukti" : `+ ${label}`}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange(null);
            }}
            className="btn-ghost px-2 py-1 text-[0.7rem]"
            style={{ color: "var(--accent-red)" }}
          >
            Hapus
          </button>
        )}
      </div>
      {preview && (
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="mt-1.5 block rounded-md border p-0 overflow-hidden"
          style={{ borderColor: "var(--bg-border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Bukti"
            className="h-16 w-16 object-cover"
          />
        </button>
      )}
      {showPreview && preview && (
        <Lightbox src={preview} onClose={() => setShowPreview(false)} />
      )}
      {error && (
        <p className="mt-1 text-[0.7rem]" style={{ color: "var(--accent-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-lg text-white/80 transition-colors hover:bg-black/70 hover:text-white"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Bukti"
        className="max-h-[90vh] max-w-[90vw] rounded-lg border object-contain"
        style={{ borderColor: "var(--bg-border)" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function BuktiThumb({ path, size = 14 }: { path: string; size?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Lihat bukti"
        className="inline-block overflow-hidden rounded border p-0 align-middle"
        style={{ height: size, width: size, borderColor: "var(--bg-border)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={path}
          alt="Bukti"
          className="h-full w-full object-cover"
        />
      </button>
      {open && <Lightbox src={path} onClose={() => setOpen(false)} />}
    </>
  );
}

type BuktiTipe = "Deviden" | "TrxInvestasi" | "Murobahah" | "ImbalHasilDiterima" | "UtangPiutang" | "PembayaranUtangPiutang";

export function BuktiField({
  tipe,
  id,
  buktiPath,
  size = 14,
}: {
  tipe: BuktiTipe;
  id: number;
  buktiPath?: string | null;
  size?: number;
}) {
  const router = useRouter();
  const [path, setPath] = useState<string | null>(buktiPath || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const persist = async (next: string | null) => {
    const res = await fetch("/api/bukti", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipe, id, buktiPath: next }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      throw new Error(b?.message || "Gagal menyimpan bukti");
    }
    setPath(next);
    router.refresh();
  };

  const onFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        throw new Error(b?.message || "Gagal upload");
      }
      const data = await res.json();
      await persist(data.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  };

  if (!path) {
    return (
      <span className="inline-flex flex-col items-center gap-0.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.68rem] font-medium transition-colors disabled:opacity-50"
          style={{
            borderColor: "var(--accent-gold)",
            color: "var(--accent-gold)",
            backgroundColor: "rgba(212, 168, 67, 0.08)",
          }}
          disabled={uploading}
        >
          <Receipt className="h-3 w-3" />
          {uploading ? "..." : "+ Bukti"}
        </button>
        {error && (
          <span className="text-[0.62rem]" style={{ color: "var(--accent-red)" }}>
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <BuktiThumb path={path} size={size} />
      <span className="inline-flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[0.62rem] hover:underline"
          style={{ color: "var(--text-muted)" }}
          disabled={uploading}
        >
          {uploading ? "..." : "Ganti"}
        </button>
        <button
          type="button"
          onClick={async () => {
            setError("");
            try {
              await persist(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Gagal");
            }
          }}
          className="text-[0.62rem] hover:underline"
          style={{ color: "var(--accent-red)" }}
        >
          Hapus
        </button>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {error && (
        <span className="text-[0.62rem]" style={{ color: "var(--accent-red)" }}>
          {error}
        </span>
      )}
    </span>
  );
}
