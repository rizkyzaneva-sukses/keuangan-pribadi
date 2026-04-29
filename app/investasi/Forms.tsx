"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const TIPE = ["BISNIS", "TEMAN", "MUROBAHAH"] as const;

export function InvestasiForm({ templates }: { templates: { id: number; nama: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [partner, setPartner] = useState("");
  const [tipe, setTipe] = useState<(typeof TIPE)[number]>("BISNIS");
  const [catatan, setCatatan] = useState("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/investasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          partner,
          tipe,
          catatan,
          templateId: templateId === "" ? null : templateId,
        }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setNama("");
      setPartner("");
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
        + Tambah Investasi
      </button>
    );
  }

  return (
    <div className="card">
      <div className="section-title mb-3">Investasi Baru</div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama investasi *"
          className="form-input md:col-span-2"
        />
        <input
          value={partner}
          onChange={(e) => setPartner(e.target.value)}
          placeholder="Partner (opsional)"
          className="form-input"
        />
        <select
          value={tipe}
          onChange={(e) => setTipe(e.target.value as any)}
          className="form-input"
        >
          {TIPE.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
          className="form-input md:col-span-2"
        >
          <option value="">— Pakai template default —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}
            </option>
          ))}
        </select>
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan (opsional)"
          className="form-input md:col-span-2"
        />
      </div>
      {error && (
        <p className="mt-2 text-[0.75rem]" style={{ color: "var(--accent-red)" }}>
          {error}
        </p>
      )}
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

const KAT_IN = [
  "IN_DIVIDEND",
  "IN_CAPITAL_RETURN",
  "IN_CAPITAL_RETURN_PLUS_PROFIT",
  "IN_OTHER",
] as const;
const KAT_OUT = ["OUT_BUSINESS_CAPITAL", "OUT_TOPUP_CAPITAL", "OUT_OTHER"] as const;

export function TrxForm({ investasiId }: { investasiId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [arah, setArah] = useState<"IN" | "OUT">("IN");
  const [kategori, setKategori] = useState<string>(KAT_IN[0]);
  const [principal, setPrincipal] = useState(0);
  const [profit, setProfit] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState("");
  const [akun, setAkun] = useState("");
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const opts = arah === "IN" ? KAT_IN : KAT_OUT;
  const total = principal + profit;

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/trx-investasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investasiId,
          tanggal,
          arah,
          kategori,
          principal,
          profit,
          total,
          metodeBayar,
          akun,
          catatan,
        }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setPrincipal(0);
      setProfit(0);
      setMetodeBayar("");
      setAkun("");
      setCatatan("");
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost px-2.5 py-1 text-[0.75rem] font-medium"
        style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
      >
        + Catat Transaksi
      </button>
    );
  }

  return (
    <div
      className="rounded-md p-3"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--bg-border)",
      }}
    >
      <div className="section-title mb-2.5">Transaksi Baru</div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="form-input" />
        <select
          value={arah}
          onChange={(e) => {
            const v = e.target.value as "IN" | "OUT";
            setArah(v);
            setKategori(v === "IN" ? KAT_IN[0] : KAT_OUT[0]);
          }}
          className="form-input"
        >
          <option value="IN">IN (Masuk)</option>
          <option value="OUT">OUT (Keluar)</option>
        </select>
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="form-input">
          {opts.map((k) => (
            <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
          ))}
        </select>
        <input
          type="number"
          value={principal || ""}
          onChange={(e) => setPrincipal(Number(e.target.value))}
          placeholder="Principal"
          className="form-input"
        />
        <input
          type="number"
          value={profit || ""}
          onChange={(e) => setProfit(Number(e.target.value))}
          placeholder="Profit"
          className="form-input"
        />
        <input
          readOnly
          value={total}
          placeholder="Total (auto)"
          className="form-input"
          style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-muted)", cursor: "default" }}
        />
        <input value={metodeBayar} onChange={(e) => setMetodeBayar(e.target.value)} placeholder="Metode bayar" className="form-input" />
        <input value={akun} onChange={(e) => setAkun(e.target.value)} placeholder="Akun" className="form-input" />
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan" className="form-input" />
      </div>
      {error && (
        <p className="mt-2 text-[0.75rem]" style={{ color: "var(--accent-red)" }}>{error}</p>
      )}
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50"
        >
          {isPending ? "..." : "Simpan"}
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
