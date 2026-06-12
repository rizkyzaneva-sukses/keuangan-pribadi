import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-xl p-6 text-center"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
        }}
      >
        <div
          className="text-5xl font-bold"
          style={{ color: "var(--accent-gold)" }}
        >
          404
        </div>
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary inline-block px-4 py-2 text-sm font-medium"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
