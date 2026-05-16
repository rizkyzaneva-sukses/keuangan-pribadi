"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  guessLegacyInvestmentTarget,
  summarizeLegacyBackup,
  type LegacyBackup,
  type LegacyImportTarget,
  type LegacyInvestmentMapping,
} from "@/lib/legacyBackup";

type PreviewState = {
  fileName: string;
  backup: LegacyBackup;
  summary: ReturnType<typeof summarizeLegacyBackup>;
};

type ImportResult = {
  summary: {
    created: Record<string, number>;
    skipped: Record<string, number>;
    archived: Record<string, number>;
    warnings: string[];
  };
};

export function LegacyImportClient() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [mappings, setMappings] = useState<LegacyInvestmentMapping[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyPreview = (backup: LegacyBackup, fileName: string) => {
    const summary = summarizeLegacyBackup(backup);
    const transactions = backup.transactions ?? [];
    const nextMappings = (backup.investments ?? []).map((investment) => ({
      legacyInvestmentId: investment.id,
      target: guessLegacyInvestmentTarget(
        investment,
        transactions.filter((tx) => tx.investment_id === investment.id),
      ),
    }));

    setPreview({ fileName, backup, summary });
    setMappings(nextMappings);
    setError("");
    setResult(null);
  };

  const parseAndPreview = (content: string, fileName: string) => {
    try {
      const parsed = JSON.parse(content) as LegacyBackup;
      if (!parsed || typeof parsed !== "object") {
        setError("File backup tidak berformat JSON object.");
        return;
      }
      applyPreview(parsed, fileName);
    } catch (parseError: unknown) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Gagal membaca JSON backup.",
      );
    }
  };

  const onFileChange = async (file: File | null) => {
    if (!file) return;
    const content = await file.text();
    setRawText(content);
    parseAndPreview(content, file.name);
  };

  const updateMapping = (legacyInvestmentId: string, target: LegacyImportTarget) => {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.legacyInvestmentId === legacyInvestmentId
          ? { ...mapping, target }
          : mapping,
      ),
    );
  };

  const applyBulkTarget = (target: LegacyImportTarget) => {
    setMappings((current) =>
      current.map((mapping) => ({ ...mapping, target })),
    );
  };

  const restoreGuess = () => {
    if (!preview) return;
    const transactions = preview.backup.transactions ?? [];
    setMappings(
      (preview.backup.investments ?? []).map((investment) => ({
        legacyInvestmentId: investment.id,
        target: guessLegacyInvestmentTarget(
          investment,
          transactions.filter((tx) => tx.investment_id === investment.id),
        ),
      })),
    );
  };

  const submit = () => {
    if (!preview) {
      setError("Pilih atau paste file backup lebih dulu.");
      return;
    }

    setError("");
    setResult(null);

    startTransition(async () => {
      const res = await fetch("/api/import-legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: preview.backup,
          mappings,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setError(payload?.message || "Import gagal dijalankan.");
        return;
      }

      setResult(payload as ImportResult);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="section-title">Sumber Backup</div>
        <div className="space-y-3">
          <input
            type="file"
            accept=".json,application/json"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="form-input"
          />
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            rows={8}
            placeholder="Atau paste isi file backup JSON lama di sini..."
            className="form-input"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => parseAndPreview(rawText, "backup-manual.json")}
              className="btn-ghost px-3 py-1.5 text-[0.8rem]"
            >
              Preview JSON
            </button>
            <button
              onClick={() => {
                setRawText("");
                setPreview(null);
                setMappings([]);
                setResult(null);
                setError("");
              }}
              className="btn-ghost px-3 py-1.5 text-[0.8rem]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "rgba(248,113,113,0.3)" }}>
          <p className="text-[0.8rem]" style={{ color: "var(--accent-red)" }}>
            {error}
          </p>
        </div>
      )}

      {preview && (
        <>
          <div className="card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="section-title">Preview Backup</div>
                <div className="text-[0.85rem] font-medium" style={{ color: "var(--text-primary)" }}>
                  {preview.fileName}
                </div>
                <p className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                  Exported at: {preview.backup.exported_at || "-"}
                </p>
              </div>
              <div className="badge-yellow">Review dulu sebelum import</div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Investments" value={preview.summary.investments} />
              <Stat label="Transactions" value={preview.summary.transactions} />
              <Stat label="Templates" value={preview.summary.templates} />
              <Stat label="Wallets" value={preview.summary.wallets} />
              <Stat label="Withdrawals" value={preview.summary.withdrawals} />
              <Stat label="Notes" value={preview.summary.notes} />
              <Stat label="Revisions" value={preview.summary.revisions} />
              <Stat label="Schedules" value={preview.summary.murabahahSchedules} />
            </div>

            <div className="mt-4 rounded-md border p-3 text-[0.78rem]" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
              `notes`, `revisions`, dan section lama yang belum punya modul baru akan tetap disimpan sebagai arsip migrasi agar tidak hilang.
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="section-title">Mapping Investasi Lama</div>
                <p className="text-[0.78rem]" style={{ color: "var(--text-muted)" }}>
                  Tebakan awal sudah diisi otomatis. Anda bisa ubah sebelum import.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={restoreGuess}
                  className="btn-ghost px-3 py-1.5 text-[0.78rem]"
                >
                  Pakai Tebakan
                </button>
                <button
                  onClick={() => applyBulkTarget("INVESTASI")}
                  className="btn-ghost px-3 py-1.5 text-[0.78rem]"
                >
                  Semua ke Portofolio
                </button>
                <button
                  onClick={() => applyBulkTarget("SKIP")}
                  className="btn-ghost px-3 py-1.5 text-[0.78rem]"
                >
                  Semua Skip
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--bg-border)]">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Tipe Lama</th>
                    <th>Partner</th>
                    <th>Status</th>
                    <th>Import Ke</th>
                  </tr>
                </thead>
                <tbody>
                  {(preview.backup.investments ?? []).map((investment) => {
                    const selected =
                      mappings.find((mapping) => mapping.legacyInvestmentId === investment.id)
                        ?.target ?? "SKIP";

                    return (
                      <tr key={investment.id}>
                        <td>
                          <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                            {investment.name}
                          </div>
                          <div className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                            ID: {investment.id}
                          </div>
                        </td>
                        <td>{investment.type}</td>
                        <td>{investment.partner || "-"}</td>
                        <td>{investment.status || "-"}</td>
                        <td>
                          <select
                            value={selected}
                            onChange={(event) =>
                              updateMapping(
                                investment.id,
                                event.target.value as LegacyImportTarget,
                              )
                            }
                            className="form-input"
                            style={{ width: "12rem" }}
                          >
                            <option value="INVESTASI">Portofolio</option>
                            <option value="TEMAN">Inv. Teman</option>
                            <option value="MUROBAHAH">Murobahah</option>
                            <option value="SKIP">Skip</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={submit}
                disabled={isPending}
                className="btn-primary px-4 py-2 text-[0.82rem] font-medium disabled:opacity-50"
              >
                {isPending ? "Mengimpor..." : "Jalankan Import"}
              </button>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className="card">
          <div className="section-title">Hasil Import</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryColumn
              title="Created"
              color="var(--accent-green)"
              values={result.summary.created}
            />
            <SummaryColumn
              title="Skipped"
              color="var(--accent-gold)"
              values={result.summary.skipped}
            />
            <SummaryColumn
              title="Archived"
              color="var(--accent-blue)"
              values={result.summary.archived}
            />
          </div>

          {result.summary.warnings.length > 0 && (
            <div className="mt-4">
              <div className="section-title">Warnings</div>
              <div className="space-y-1">
                {result.summary.warnings.map((warning, index) => (
                  <div
                    key={`${warning}-${index}`}
                    className="rounded-md border px-3 py-2 text-[0.78rem]"
                    style={{ borderColor: "rgba(212,168,67,0.25)", color: "var(--text-secondary)" }}
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function SummaryColumn({
  title,
  color,
  values,
}: {
  title: string;
  color: string;
  values: Record<string, number>;
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="mb-2 text-[0.78rem] font-semibold uppercase tracking-wide" style={{ color }}>
        {title}
      </div>
      <div className="space-y-1.5 text-[0.78rem]">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span style={{ color: "var(--text-secondary)" }}>{key}</span>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
