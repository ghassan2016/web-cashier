"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("admin@cahier.test");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginId, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      {/* Branded backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(45rem 30rem at 80% -10%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%)," +
            "radial-gradient(40rem 30rem at 10% 110%, color-mix(in srgb, var(--info) 14%, transparent), transparent 55%)",
        }}
      />
      <form
        onSubmit={onSubmit}
        className="card w-full max-w-sm space-y-5 p-8 shadow-xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[var(--primary-light)] to-[var(--primary)] text-2xl text-white shadow-lg shadow-emerald-600/30">
            🛒
          </div>
          <h1 className="text-2xl font-bold text-slate-800">كاهييه</h1>
          <p className="mt-1 text-sm text-slate-500">نظام نقاط البيع وإدارة المطاعم</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
            <span aria-hidden>⚠️</span>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">البريد أو اسم المستخدم</label>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="input"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            dir="ltr"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </main>
  );
}
