"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";

type Pos = {
  id?: number;
  nama: string;
  persentase: number;
};

export function TemplateEditForm({
  template,
}: {
  template: {
    id: number;
    nama: string;
    catatan: string | null;
    isDefault: boolean;
    pos: { id: number; nama: string; persentase: number; urutan: number }[];
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState(template.nama);
  const [catatan, setCatatan] = useState(template.catatan ?? "");
  const [isDefault, setIsDefault] = useState(template.isDefault);
  const [pos, setPos] = useState<Pos[]>(template.pos.map((item) => ({
    id: item.id,
    nama: item.nama,
    persentase: item.persentase,
  })));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalPersen = pos.reduce((sum, item) => sum + Number(item.persentase || 0), 0);

  const addPos = () => setPos((prev) => [...prev, { nama: "", persentase: 0 }]);
  const removePos = (index: number) => setPos((prev) => prev.filter((_, i) => i !== index));
  const updatePos = (index: number, field: keyof Pos, value: string) => {
    setPos((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === "persentase" ? Number(value) : value,
      } as Pos;
      return next;
    });
  };

  const submit = () => {
    setError("");
    if (!nama.trim()) {
      setError("Nama template wajib diisi");
      return;
    }
    if (totalPersen !== 100) {
      setError("Total persentase pos harus 100%");
      return;
    }
    if (pos.some((item) => !String(item.nama || "").trim())) {
      setError("Semua pos harus memiliki nama");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          catatan,
          isDefault,
          pos: pos.map((item, index) => ({
            id: item.id,
            nama: String(item.nama).trim(),
            persentase: Number(item.persentase),
            urutan: index + 1,
          })),
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
        title="Edit template"
      >
        <PencilLine className="h-3 w-3" />
        Edit
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md p-3 text-[0.8rem]" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Edit Template
        </div>
        <button onClick={() => setOpen(false)} className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
          ✕ Tutup
        </button>
      </div>

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
            <span className="text-[0.8rem] font-medium" style={{ color: "var(--text-primary)" }}>
              Pos Alokasi
            </span>
            <span className="text-[0.8rem]" style={{ color: totalPersen === 100 ? "var(--accent-green)" : "var(--accent-gold)" }}>
              Total: {totalPersen}%
            </span>
          </div>
          <div className="space-y-2">
            {pos.map((item, index) => (
              <div key={item.id ?? `new-${index}`} className="flex gap-2">
                <input
                  value={item.nama}
                  onChange={(e) => updatePos(index, "nama", e.target.value)}
                  placeholder="Nama pos"
                  className="form-input flex-1"
                />
                <input
                  type="number"
                  value={item.persentase}
                  onChange={(e) => updatePos(index, "persentase", e.target.value)}
                  placeholder="%"
                  className="form-input"
                  style={{ width: "5rem" }}
                />
                {pos.length > 1 && (
                  <button onClick={() => removePos(index)} className="btn-danger px-2.5 text-[0.8rem]">
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
          <button onClick={() => setOpen(false)} className="btn-ghost px-3 py-1.5 text-[0.8rem]">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
