export type LegacyImportTarget = "INVESTASI" | "TEMAN" | "MUROBAHAH" | "SKIP";

export type LegacyInvestment = {
  id: string;
  name: string;
  type: string;
  partner?: string | null;
  start_date?: string | null;
  tenor_months?: number | null;
  status?: string | null;
  closed_date?: string | null;
  archived?: boolean | null;
  notes?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
};

export type LegacyTransaction = {
  id: string;
  investment_id?: string | null;
  date?: string | null;
  direction?: string | null;
  category?: string | null;
  principal_amount?: number | null;
  profit_amount?: number | null;
  total_amount?: number | null;
  payment_method?: string | null;
  account?: string | null;
  note?: string | null;
  allocation_log?: string | null;
  is_allocated?: boolean | null;
  created_date?: string | null;
  updated_date?: string | null;
};

export type LegacyTemplate = {
  id: string;
  name: string;
  is_default?: boolean | null;
  effective_month?: string | null;
  allocations?: string | null;
  investment_id?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
};

export type LegacyWallet = {
  id: string;
  label?: string | null;
  saldo?: number | null;
  total_withdrawn?: number | null;
  total_in_all?: number | null;
  rekening?: string | null;
  pos_id?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
};

export type LegacyWalletWithdrawal = {
  id: string;
  pos_id?: string | null;
  label?: string | null;
  date?: string | null;
  tanggal?: string | null;
  nominal?: number | null;
  amount?: number | null;
  jumlah?: number | null;
  account?: string | null;
  akun?: string | null;
  rekening?: string | null;
  note?: string | null;
  keterangan?: string | null;
  description?: string | null;
  created_date?: string | null;
  updated_date?: string | null;
};

export type LegacyArbitraryRecord = {
  id?: string | null;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  detail?: string | null;
  [key: string]: unknown;
};

export type LegacyBackup = {
  exported_at?: string | null;
  investments?: LegacyInvestment[];
  transactions?: LegacyTransaction[];
  murabahah_schedules?: LegacyArbitraryRecord[];
  allocation_wallets?: LegacyWallet[];
  wallet_withdrawals?: LegacyWalletWithdrawal[];
  allocation_templates?: LegacyTemplate[];
  notes?: LegacyArbitraryRecord[];
  revisions?: LegacyArbitraryRecord[];
};

export type LegacyInvestmentMapping = {
  legacyInvestmentId: string;
  target: LegacyImportTarget;
};

export function summarizeLegacyBackup(backup: LegacyBackup) {
  return {
    investments: backup.investments?.length ?? 0,
    transactions: backup.transactions?.length ?? 0,
    templates: backup.allocation_templates?.length ?? 0,
    wallets: backup.allocation_wallets?.length ?? 0,
    withdrawals: backup.wallet_withdrawals?.length ?? 0,
    notes: backup.notes?.length ?? 0,
    revisions: backup.revisions?.length ?? 0,
    murabahahSchedules: backup.murabahah_schedules?.length ?? 0,
  };
}

export function guessLegacyInvestmentTarget(
  investment: LegacyInvestment,
  transactions: LegacyTransaction[],
): LegacyImportTarget {
  if (investment.type === "MURABAHAH") {
    return "MUROBAHAH";
  }

  const haystack = `${investment.name} ${investment.partner ?? ""}`.toLowerCase();
  const hasDividend = transactions.some((tx) => tx.category === "IN_DIVIDEND");

  if (
    hasDividend &&
    /(kmp|synergy|his|iyan|nurdin|teman|partner)/.test(haystack)
  ) {
    return "TEMAN";
  }

  return "INVESTASI";
}
