"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("rizky@example.com");
  const [password, setPassword] = useState("rizky123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Login gagal");
        }

        router.push("/dashboard");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Login gagal");
      }
    });
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-sm space-y-6 rounded-xl p-6"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="text-center">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--accent-gold)" }}
          >
            Keuangan Pribadi
          </h1>
          <p className="mt-1 text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
            Masuk ke akun Anda
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[0.8rem] font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="Masukkan email Anda"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[0.8rem] font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                style={{ paddingRight: "2.5rem" }}
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="rounded-md p-3"
              style={{
                backgroundColor: "rgba(248, 113, 113, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.2)",
              }}
            >
              <p className="text-[0.8rem]" style={{ color: "var(--accent-red)" }}>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full py-2.5 text-[0.85rem] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--bg-base)", borderTopColor: "transparent" }}
                />
                <span>Loading...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        <div className="text-center text-[0.8rem]" style={{ color: "var(--text-muted)" }}>
          Belum punya akun?{" "}
          <a
            href="/register"
            className="font-medium hover:underline"
            style={{ color: "var(--accent-gold)" }}
          >
            Daftar sekarang
          </a>
        </div>
      </div>
    </div>
  );
}
