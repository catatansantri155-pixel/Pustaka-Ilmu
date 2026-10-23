"use client";
import { useEffect, useState } from "react";
import type { MfaEnrollResponse, SystemInfo } from "@pustaka/shared-types";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
function fmtDate(v?: string | null) { return v ? new Date(v).toLocaleString("id-ID") : "—"; }

export default function SettingsPage() {
  const [sys, setSys] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [enroll, setEnroll] = useState<MfaEnrollResponse | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMsg, setMfaMsg] = useState<string | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);

  async function loadSystem() {
    try { setSys(await api.system()); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat status sistem."); }
  }
  async function loadMe() {
    try { const me = await api.me(); setMfaEnabled(!!me.mfa_enabled); }
    catch { setMfaEnabled(false); }
  }
  useEffect(() => { Promise.all([loadSystem(), loadMe()]).finally(() => setLoading(false)); }, []);

  async function doBackup() {
    setBackupBusy(true); setBackupMsg(null); setError(null);
    try {
      const r = await api.createBackup();
      setBackupMsg(`Backup dibuat: ${r.file} (${fmtBytes(r.size_bytes)}).`);
      await loadSystem();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal membuat backup."); }
    finally { setBackupBusy(false); }
  }

  async function doEnroll() {
    setMfaBusy(true); setMfaMsg(null); setMfaError(null);
    try { setEnroll(await api.mfaEnroll()); }
    catch (e) { setMfaError(e instanceof Error ? e.message : "Gagal memulai pendaftaran MFA."); }
    finally { setMfaBusy(false); }
  }

  async function doActivate(e: React.FormEvent) {
    e.preventDefault(); setMfaBusy(true); setMfaMsg(null); setMfaError(null);
    try {
      await api.mfaActivate(mfaCode.trim());
      setEnroll(null); setMfaCode("");
      setMfaEnabled(true);
      setMfaMsg("MFA berhasil diaktifkan untuk akun Anda.");
      await loadMe();
    } catch (err) { setMfaError(err instanceof Error ? err.message : "Aktivasi MFA gagal."); }
    finally { setMfaBusy(false); }
  }

  async function doDisable(e: React.FormEvent) {
    e.preventDefault(); setMfaBusy(true); setMfaMsg(null); setMfaError(null);
    try {
      await api.mfaDisable(disableCode.trim());
      setDisableCode("");
      setMfaEnabled(false);
      setMfaMsg("MFA berhasil dinonaktifkan.");
      await loadMe();
    } catch (err) { setMfaError(err instanceof Error ? err.message : "Penonaktifan MFA gagal."); }
    finally { setMfaBusy(false); }
  }

  if (loading) return <LoadingState label="Memuat pengaturan sistem…" />;
  return (
    <div>
      <h1 className="text-2xl font-bold text-emerald-deep">System Settings</h1>
      <p className="mt-1 text-sm text-stone-600">Kesehatan sistem, cadangan data, dan keamanan akun (MFA) dari API admin.</p>
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}

      <section className="card mt-5 p-6">
        <h2 className="font-bold text-emerald-deep">Kesehatan Sistem</h2>
        {sys ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-ivory px-4 py-3"><p className="text-xs font-semibold uppercase text-stone-500">Versi Aplikasi</p><p className="mt-1 font-bold text-emerald-deep">{sys.app_version || "—"}</p></div>
            <div className="rounded-2xl bg-ivory px-4 py-3"><p className="text-xs font-semibold uppercase text-stone-500">Database</p><p className="mt-1 font-bold text-emerald-deep">{sys.database?.ok ? "OK" : "Bermasalah"}{sys.database?.dialect ? ` · ${sys.database.dialect}` : ""}</p></div>
            <div className="rounded-2xl bg-ivory px-4 py-3"><p className="text-xs font-semibold uppercase text-stone-500">Mode Worker</p><p className="mt-1 font-bold text-emerald-deep">{sys.worker_mode || "—"}</p></div>
            <div className="rounded-2xl bg-ivory px-4 py-3"><p className="text-xs font-semibold uppercase text-stone-500">Jumlah Backup</p><p className="mt-1 font-bold text-emerald-deep">{sys.backups?.length ?? 0}</p></div>
          </div>
        ) : <p className="mt-2 text-sm text-stone-600">Status sistem tidak tersedia dari API.</p>}
      </section>

      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-emerald-deep">Backup</h2>
          <button className="btn-primary" disabled={backupBusy} onClick={doBackup}>{backupBusy ? "Membuat Backup…" : "Buat Backup Sekarang"}</button>
        </div>
        {backupMsg ? <p className="mt-3 rounded-2xl bg-emerald/5 px-4 py-2 text-sm text-emerald-deep">{backupMsg}</p> : null}
        {sys && (!sys.backups || sys.backups.length === 0) ? <div className="mt-4"><EmptyState title="Belum ada backup" body="Buat backup pertama dengan tombol di atas." /></div> : sys ? (
          <table className="mt-4 w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-stone-500"><th className="py-2 pr-3">Nama File</th><th className="py-2 pr-3">Ukuran</th><th className="py-2">Dibuat</th></tr></thead>
            <tbody>{sys.backups.map((b) => (
              <tr key={b.name} className="border-b last:border-0"><td className="py-2 pr-3 font-medium break-all">{b.name}</td><td className="py-2 pr-3 whitespace-nowrap">{fmtBytes(b.size_bytes)}</td><td className="py-2 whitespace-nowrap">{fmtDate(b.created_at)}</td></tr>
            ))}</tbody>
          </table>
        ) : null}
      </section>

      <section className="card mt-6 p-6">
        <h2 className="font-bold text-emerald-deep">Autentikasi Dua Faktor (MFA)</h2>
        <p className="mt-1 text-sm text-stone-600">Status saat ini: <span className="font-bold text-emerald-deep">{mfaEnabled ? "Aktif" : "Belum aktif"}</span></p>
        {mfaMsg ? <p className="mt-3 rounded-2xl bg-emerald/5 px-4 py-2 text-sm text-emerald-deep">{mfaMsg}</p> : null}
        {mfaError ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{mfaError}</p> : null}

        {!mfaEnabled && !enroll ? (
          <button className="btn-primary mt-4" disabled={mfaBusy} onClick={doEnroll}>{mfaBusy ? "Menyiapkan…" : "Aktifkan MFA"}</button>
        ) : null}

        {!mfaEnabled && enroll ? (
          <div className="mt-4">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-bold">Simpan secret ini SEKARANG — hanya ditampilkan sekali di langkah ini.</p>
              <p className="mt-1">Masukkan secret berikut ke aplikasi authenticator Anda (atau buka URI otpauth), lalu masukkan kode 6 digit untuk mengaktifkan. Jika halaman ditutup sebelum aktivasi, ulangi proses pendaftaran.</p>
            </div>
            <p className="mt-3 text-sm font-semibold">Secret</p>
            <p className="mt-1 break-all rounded-2xl bg-ivory px-4 py-3 font-mono text-sm">{enroll.secret}</p>
            <p className="mt-3 text-sm font-semibold">URI otpauth</p>
            <p className="mt-1 break-all rounded-2xl bg-ivory px-4 py-3 font-mono text-xs">{enroll.otpauth_uri}</p>
            <form onSubmit={doActivate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1 text-sm font-semibold">Kode 6 digit dari authenticator
                <input className="input mt-1" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
              </label>
              <button className="btn-primary" disabled={mfaBusy || mfaCode.length !== 6}>{mfaBusy ? "Mengaktifkan…" : "Aktifkan"}</button>
              <button type="button" className="btn-outline" disabled={mfaBusy} onClick={() => { setEnroll(null); setMfaCode(""); }}>Batal</button>
            </form>
          </div>
        ) : null}

        {mfaEnabled ? (
          <form onSubmit={doDisable} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1 text-sm font-semibold">Kode 6 digit untuk menonaktifkan MFA
              <input className="input mt-1" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
            </label>
            <button className="btn-outline border-red-300 text-red-700" disabled={mfaBusy || disableCode.length !== 6}>{mfaBusy ? "Memproses…" : "Nonaktifkan MFA"}</button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
