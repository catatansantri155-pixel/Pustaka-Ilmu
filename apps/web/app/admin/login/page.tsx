"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const res = await api.login(email, password);
      if (res.mfa_required) {
        if (!res.mfa_token) throw new Error("Server meminta MFA tetapi tidak mengirim token MFA.");
        setMfaToken(res.mfa_token);
        return;
      }
      if (!res.access_token) throw new Error("Login gagal: server tidak mengirim token akses.");
      setToken(res.access_token); if (res.user) setUser(res.user);
      router.replace("/admin");
    } catch (err) { setError(err instanceof Error ? err.message : "Login gagal."); }
    finally { setBusy(false); }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!mfaToken) throw new Error("Sesi MFA tidak ditemukan. Silakan masuk ulang.");
      const res = await api.mfaVerify(mfaToken, code.trim());
      setToken(res.access_token); if (res.user) setUser(res.user);
      router.replace("/admin");
    } catch (err) { setError(err instanceof Error ? err.message : "Verifikasi MFA gagal."); }
    finally { setBusy(false); }
  }

  if (mfaToken) {
    return (
      <div className="pattern-islamic-light flex min-h-screen items-center justify-center px-4">
        <form onSubmit={onVerify} className="card w-full max-w-md p-8">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-deep text-xl text-gold">✦</div>
          <h1 className="text-2xl font-extrabold text-emerald-deep">Verifikasi Dua Langkah</h1>
          <p className="mt-1 text-sm text-stone-600">Masukkan kode 6 digit dari aplikasi authenticator Anda untuk menyelesaikan proses masuk.</p>
          <label className="mt-5 block text-sm font-semibold">Kode verifikasi
            <input className="input mt-1 text-center text-lg tracking-[0.3em]" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
          </label>
          {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
          <button className="btn-primary mt-6 w-full" disabled={busy || code.length !== 6}>{busy ? "Memverifikasi…" : "Verifikasi & Masuk"}</button>
          <button type="button" className="mt-3 w-full text-center text-sm font-semibold text-emerald underline" onClick={() => { setMfaToken(null); setCode(""); setError(null); }}>Kembali ke formulir masuk</button>
        </form>
      </div>
    );
  }

  return (
    <div className="pattern-islamic-light flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-deep text-xl text-gold">✦</div>
        <h1 className="text-2xl font-extrabold text-emerald-deep">Masuk Admin</h1>
        <p className="mt-1 text-sm text-stone-600">Masuk dengan akun admin Maktabah Al-'Ilmiyyah untuk mengelola materi, sumber, dan publikasi.</p>
        <label className="mt-5 block text-sm font-semibold">Email<input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@contoh.id" autoComplete="username" /></label>
        <label className="mt-4 block text-sm font-semibold">Kata sandi<input className="input mt-1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi" autoComplete="current-password" /></label>
        {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button>
        <p className="mt-4 text-center text-xs text-stone-500">Akun pengembangan diatur di sisi server (lihat README proyek). Kata sandi tidak pernah ditampilkan di aplikasi ini.</p>
      </form>
    </div>
  );
}
