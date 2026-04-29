"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

type PosRow = {
  posId: number;
  posNama: string;
  urutan: number;
  defaultPersentase: number;
  overridePersentase: number | null;
  efektifPersentase: number;
};

export function OverrideForm({
  investasiId,
  investasiNama,
}: {
  investasiId: number;
  investasiNama: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PosRow[]>([]);
  const [values, setValues] = useState<Record<number, string>>({}); // posId -> persentase string
  const [useOverride, setUseOverride] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investasi/${investasiId}/override`);
      if (!res.ok) { setError("Gagal memuat data"); return; }
      const data: PosRow[] = await res.json();
      setRows(data);
      const hasOverride = data.some((r) => r.overridePersentase !== null);
      setUseOverride(hasOverride);
      const init: Record<number, string> = {};
      data.forEach((r) => {
        init[r.posId] = String(r.overridePersentase ?? r.defaultPersentase);
      });
      setValues(init);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const total = Object.values(values).reduce((s, v) => s + (Number(v) || 0), 0);

  const submit = () => {
    setError("");
    startTransition(async () => {
      if (!useOverride) {
        // Reset ke default template
        const res = await fetch(`/api/investasi/${investasiId}/override`, { method: "DELETE" });
        if (!res.ok) { setError(await res.text()); return; }
      } else {
        if (total !== 100) { setError(`Total harus 100% (sekarang ${total}%)`); return; }
        const overrides = rows.map((r) => ({
          posId: r.posId,
          persentase: Number(values[r.posId] || 0),
        }));
        const res = await fetch(`/api/investasi/${investasiId}/override`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overrides }),
        });
        if (!res.ok) { setError(await res.text()); return; }
      }
      setOpen(false);
      router.refresh();
    });
  };

  const hasExistingOverride = rows.some((r) => r.overridePersentase !== null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-0.5 text-[0.7rem] rounded font-medium transition-colors"
        style={{
          border: "1px solid " + (hasExistingOverride ? "var(--accent-blue)" : "var(--bg-border)"),
          color: hasExistingOverride ? "var(--accent-blue)" : "var(--text-muted)",
          backgroundColor: "transparent",
        }}
        title="Atur override % alokasi khusus investasi ini"
      >
        {hasExistingOverride ? "⚙ Override Aktif" : "⚙ Atur Override %"}
      </button>
    );
  }

  return (
    <div
      className="mt-3 rounded-md p-3 text-[0.8rem]"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Override Alokasi
          </span>
          <span className="ml-2 text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
            {investasiNama}
          </span>
        </div>
        <button onClick={() => setOpen(false)} className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
          ✕ Tutup
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Memuat...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          Investasi ini belum punya template. Assign template terlebih dahulu.
        </p>
      ) : (
        <>
          <label className="flex items-center gap-2 mb-3 cursor-pointer" style={{ color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={useOverride}
              onChange={(e) => setUseOverride(e.target.checked)}
              className="rounded"
            />
            Aktifkan override khusus investasi ini
          </label>

          {useOverride && (
            <>
              <div
                className="mb-2 rounded p-2 text-[0.72rem]"
                style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" }}
              >
                💡 Ubah % di bawah ini. Nilai akan menimpa persentase default dari template untuk investasi ini saja. Total harus tepat <strong>100%</strong>.
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="grid grid-cols-3 gap-2 mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>Pos</span>
                  <span className="text-right">Default</span>
                  <span className="text-right">Override %</span>
                </div>
                {rows.map((r) => (
                  <div key={r.posId} className="grid grid-cols-3 gap-2 items-center">
                    <span style={{ color: "var(--text-primary)" }}>{r.posNama}</span>
                    <span className="text-right" style={{ color: "var(--text-muted)" }}>
                      {r.defaultPersentase}%
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={values[r.posId] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [r.posId]: e.target.value }))
                      }
                      className="form-input text-right"
                      style={{ padding: "0.25rem 0.5rem" }}
                    />
                  </div>
                ))}
                <div className="flex justify-end mt-1">
                  <span
                    className="text-[0.75rem] font-semibold"
                    style={{ color: total === 100 ? "var(--accent-green)" : "var(--accent-gold)" }}
                  >
                    Total: {total}%
                  </span>
                </div>
              </div>
            </>
          )}

          {!useOverride && hasExistingOverride && (
            <div
              className="mb-3 rounded p-2 text-[0.72rem]"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--accent-gold)", border: "1px solid var(--bg-border)" }}
            >
              ⚠ Override saat ini aktif. Menonaktifkan ini akan menghapus semua override dan kembali ke default template.
            </div>
          )}

          {error && <p className="mb-2 text-[0.75rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={isPending}
              className="btn-primary px-3 py-1.5 text-[0.78rem] font-medium disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setOpen(false)} className="btn-ghost px-3 py-1.5 text-[0.78rem]">
              Batal
            </button>
          </div>
        </>
      )}
    </div>
  );
}
