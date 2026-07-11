"use client";

import { useState, useRef } from "react";

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
          className="btn-ghost px-2.5 py-1 text-[0.7rem]"
          disabled={uploading}
        >
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
        <a href={preview} target="_blank" rel="noreferrer" className="mt-1.5 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Bukti"
            className="h-16 w-16 rounded-md border object-cover"
            style={{ borderColor: "var(--bg-border)" }}
          />
        </a>
      )}
      {error && (
        <p className="mt-1 text-[0.7rem]" style={{ color: "var(--accent-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function BuktiThumb({ path, size = 14 }: { path: string; size?: number }) {
  return (
    <a href={path} target="_blank" rel="noreferrer" title="Lihat bukti">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={path}
        alt="Bukti"
        className="inline-block rounded border object-cover"
        style={{ height: size, width: size, borderColor: "var(--bg-border)" }}
      />
    </a>
  );
}
