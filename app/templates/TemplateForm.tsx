"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Pos = { nama: string; persentase: number };

export function TemplateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [pos, setPos] = useState<Pos[]>([{ nama: "", persentase: 0 }]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalPersen = pos.reduce((s, p) => s + Number(p.persentase || 0), 0);

  const addPos = () => setPos([...pos, { nama: "", persentase: 0 }]);
  const removePos = (i: number) => setPos(pos.filter((_, idx) => idx !== i));
  const updatePos = (i: number, field: keyof Pos, value: string) => {
    const next = [...pos];
    next[i] = { ...next[i], [field]: field === "persentase" ? Number(value) : value };
    setPos(next);
  };

  const submit = () => {
    setError("");
    if (totalPersen !== 100) {
      setError("Total persentase pos harus 100%");
      return;
    }
    if (pos.some((p) => !p.nama)) {
      setError("Semua pos harus memiliki nama");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, catatan, isDefault, pos }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setNama("");
      setCatatan("");
      setIsDefault(false);
      setPos([{ nama: "", persentase: 0 }]);
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
        + Tambah Template
      </button>
    );
  }

  return (
    <div className="card">
      <div className="section-title mb-3">Template Baru</div>
      <div className="space-y-2.5">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama template"
          className="form-input"
        />
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan (opsional)"
          className="form-input"
        />
        <label className="flex items-center gap-2 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded" />
          Jadikan template default
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.8rem] font-medium" style={{ color: "var(--text-primary)" }}>Pos Alokasi</span>
            <span className="text-[0.8rem]" style={{ color: totalPersen === 100 ? "var(--accent-green)" : "var(--accent-gold)" }}>
              Total: {totalPersen}%
            </span>
          </div>
          <div className="space-y-2">
            {pos.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={p.nama}
                  onChange={(e) => updatePos(i, "nama", e.target.value)}
                  placeholder="Nama pos"
                  className="form-input flex-1"
                />
                <input
                  type="number"
                  value={p.persentase}
                  onChange={(e) => updatePos(i, "persentase", e.target.value)}
                  placeholder="%"
                  className="form-input"
                  style={{ width: "5rem" }}
                />
                {pos.length > 1 && (
                  <button
                    onClick={() => removePos(i)}
                    className="btn-danger px-2.5 text-[0.8rem]"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addPos}
            className="mt-2 text-[0.8rem] font-medium"
            style={{ color: "var(--accent-gold)" }}
          >
            + Tambah Pos
          </button>
        </div>

        {error && <p className="text-[0.8rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}

        <div className="flex gap-2 pt-1">
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
    </div>
  );
}
