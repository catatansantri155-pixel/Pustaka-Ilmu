"use client";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";

export function useMaterialActions(onDone?: () => void) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  async function act(id: string, action: "approve" | "publish" | "unpublish" | "reject") {
    setBusyId(id); setMessage(null); setBlockers([]);
    try {
      await api.materialAction(id, action);
      setMessage(`Aksi ${action} berhasil untuk materi ${id}.`);
      onDone?.();
    } catch (e) {
      if (e instanceof ApiError) {
        setMessage(e.message);
        if (e.blockers.length) setBlockers(e.blockers);
        else if (e.status === 422) setBlockers([e.message]);
      } else setMessage("Aksi gagal.");
    } finally { setBusyId(null); }
  }
  async function translate(id: string) {
    setBusyId(id); setMessage(null); setBlockers([]);
    try {
      const res = await api.translate(id) as Record<string, unknown> | null;
      const run = (res?.ai_run || res?.run || res) as Record<string, unknown> | null;
      const status = run && typeof run.status === "string" ? run.status : null;
      const err = run && (typeof run.error === "string" ? run.error : typeof run.message === "string" ? run.message : null);
      setMessage(status === "FAILED" ? `Terjemahan AI GAGAL${err ? `: ${err}` : ""}` : `Permintaan terjemahan AI terkirim${status ? ` (status: ${status})` : ""}.`);
      onDone?.();
    } catch (e) { setMessage(e instanceof ApiError ? e.message : "Terjemahan gagal."); }
    finally { setBusyId(null); }
  }
  return { busyId, message, blockers, act, translate };
}

export function ActionButtons({ id, busy, onAct }: { id: string; busy: boolean; onAct: (a: "approve" | "publish" | "unpublish" | "reject") => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button disabled={busy} className="btn-outline px-3 py-1.5 text-xs" onClick={() => onAct("approve")}>Approve</button>
      <button disabled={busy} className="btn-outline px-3 py-1.5 text-xs" onClick={() => onAct("publish")}>Publish</button>
      <button disabled={busy} className="btn-outline px-3 py-1.5 text-xs" onClick={() => onAct("unpublish")}>Unpublish</button>
      <button disabled={busy} className="btn-outline border-red-300 px-3 py-1.5 text-xs text-red-700" onClick={() => onAct("reject")}>Reject</button>
    </div>
  );
}

export function ActionFeedback({ message, blockers }: { message: string | null; blockers: string[] }) {
  if (!message && blockers.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {message ? <p className="font-medium">{message}</p> : null}
      {blockers.length > 0 && (
        <div className="mt-2">
          <p className="font-bold">Blocker publikasi (gerbang kualitas):</p>
          <ul className="mt-1 list-disc pl-5">{blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
