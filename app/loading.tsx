export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: "var(--bg-border)",
            borderTopColor: "var(--accent-gold)",
          }}
        />
        <p className="text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
          Memuat...
        </p>
      </div>
    </div>
  );
}
