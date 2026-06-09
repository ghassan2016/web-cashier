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
    <main className="flex flex-1 items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">كاهييه</h1>
          <p className="mt-1 text-sm text-slate-500">نظام نقاط البيع وإدارة المطاعم</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">البريد أو اسم المستخدم</label>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
            dir="ltr"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </main>
  );
}
