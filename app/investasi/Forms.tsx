"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { BuktiUpload } from "@/components/Bukti";

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
          onChange={(e) => setTipe(e.target.value as (typeof TIPE)[number])}
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

export function InvestasiEditForm({
  investasiId,
  initial,
  templates,
}: {
  investasiId: number;
  initial: {
    nama: string;
    partner: string;
    tipe: (typeof TIPE)[number];
    catatan: string;
    templateId: number | null;
  };
  templates: { id: number; nama: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState(initial.nama);
  const [partner, setPartner] = useState(initial.partner);
  const [tipe, setTipe] = useState<(typeof TIPE)[number]>(initial.tipe);
  const [catatan, setCatatan] = useState(initial.catatan);
  const [templateId, setTemplateId] = useState<number | "">(initial.templateId ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/investasi/${investasiId}`, {
        method: "PUT",
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
        title="Edit investasi dan assign template"
      >
        <PencilLine className="h-3 w-3" />
        Edit
      </button>
    );
  }

  return (
    <div
      className="mt-3 rounded-md p-3 text-[0.8rem]"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Edit Investasi
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-[0.75rem]"
          style={{ color: "var(--text-muted)" }}
        >
          ✕ Tutup
        </button>
      </div>

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
          onChange={(e) => setTipe(e.target.value as (typeof TIPE)[number])}
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

export function TrxForm({
  investasiId,
  metodeBayarOptions,
  akunOptions,
}: {
  investasiId: number;
  metodeBayarOptions: string[];
  akunOptions: string[];
}) {
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
  const [buktiPath, setBuktiPath] = useState<string | null>(null);
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
          buktiPath,
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
        <input
          value={metodeBayar}
          onChange={(e) => setMetodeBayar(e.target.value)}
          placeholder="Metode bayar"
          list={`metode-bayar-options-${investasiId}`}
          className="form-input"
        />
        <input
          value={akun}
          onChange={(e) => setAkun(e.target.value)}
          placeholder="Akun"
          list={`akun-options-${investasiId}`}
          className="form-input"
        />
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan" className="form-input" />
        <datalist id={`metode-bayar-options-${investasiId}`}>
          {metodeBayarOptions.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <datalist id={`akun-options-${investasiId}`}>
          {akunOptions.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>
      <div className="mt-1">
        <BuktiUpload value={buktiPath} onChange={setBuktiPath} label="Bukti TF" />
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

export function TrxEditForm({
  trxId,
  initial,
  metodeBayarOptions,
  akunOptions,
}: {
  trxId: number;
  initial: {
    tanggal: string;
    arah: "IN" | "OUT";
    kategori: string;
    principal: number;
    profit: number;
    total: number;
    metodeBayar: string;
    akun: string;
    catatan: string;
    buktiPath: string | null;
  };
  metodeBayarOptions: string[];
  akunOptions: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(initial.tanggal);
  const [arah, setArah] = useState<"IN" | "OUT">(initial.arah);
  const [kategori, setKategori] = useState(initial.kategori);
  const [principal, setPrincipal] = useState(initial.principal);
  const [profit, setProfit] = useState(initial.profit);
  const [metodeBayar, setMetodeBayar] = useState(initial.metodeBayar);
  const [akun, setAkun] = useState(initial.akun);
  const [catatan, setCatatan] = useState(initial.catatan);
  const [buktiPath, setBuktiPath] = useState<string | null>(initial.buktiPath);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const opts = arah === "IN" ? KAT_IN : KAT_OUT;
  const total = principal + profit;

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/trx-investasi/${trxId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal,
          arah,
          kategori,
          principal,
          profit,
          total,
          metodeBayar,
          akun,
          catatan,
          buktiPath,
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
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost px-2 py-0.5 text-[0.7rem]"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md p-2.5 text-[0.78rem]" style={{ border: "1px solid var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Edit Transaksi</div>
        <button onClick={() => setOpen(false)} className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>✕ Tutup</button>
      </div>
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
        <input
          value={metodeBayar}
          onChange={(e) => setMetodeBayar(e.target.value)}
          placeholder="Metode bayar"
          list={`metode-bayar-edit-options-${trxId}`}
          className="form-input"
        />
        <input
          value={akun}
          onChange={(e) => setAkun(e.target.value)}
          placeholder="Akun"
          list={`akun-edit-options-${trxId}`}
          className="form-input"
        />
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan" className="form-input" />
        <datalist id={`metode-bayar-edit-options-${trxId}`}>
          {metodeBayarOptions.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <datalist id={`akun-edit-options-${trxId}`}>
          {akunOptions.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>
      <div className="mt-1">
        <BuktiUpload value={buktiPath} onChange={setBuktiPath} label="Bukti TF" />
      </div>
      {error && <p className="mt-1.5 text-[0.72rem]" style={{ color: "var(--accent-red)" }}>{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="btn-primary px-3 py-1.5 text-[0.8rem] font-medium disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost px-3 py-1.5 text-[0.8rem]">Batal</button>
      </div>
    </div>
  );
}
