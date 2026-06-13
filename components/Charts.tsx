"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type MonthlyData = {
  month: string;
  masuk: number;
  keluar: number;
};

export function KasTrendChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-lg"
        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Belum ada data transaksi
        </p>
      </div>
    );
  }

  const formatCurrency = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
    return String(v);
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Trend Kas 6 Bulan Terakhir
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--bg-border)" }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--bg-border)" }}
            width={60}
          />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(Number(value))
            }
            contentStyle={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--bg-border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "var(--text-primary)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "var(--text-muted)" }}
          />
          <Bar
            dataKey="masuk"
            name="Pemasukan"
            fill="#34d399"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="keluar"
            name="Pengeluaran"
            fill="#f87171"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type WalletData = {
  nama: string;
  saldo: number;
};

export function WalletDistributionChart({ data }: { data: WalletData[] }) {
  if (data.length === 0 || data.every((d) => d.saldo === 0)) {
    return null;
  }

  const COLORS = [
    "#d4a843",
    "#34d399",
    "#60a5fa",
    "#f87171",
    "#a78bfa",
    "#fbbf24",
    "#fb923c",
  ];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(v);

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Distribusi Wallet Pos
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const total = data.reduce((s, d) => s + d.saldo, 0);
          const pct = total > 0 ? (item.saldo / total) * 100 : 0;
          return (
            <div key={item.nama}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {item.nama}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatCurrency(item.saldo)} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--bg-border)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
