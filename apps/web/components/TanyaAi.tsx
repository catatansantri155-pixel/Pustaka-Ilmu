"use client";
import { useState } from "react";
import Link from "next/link";
import { api, type AskResponse } from "@/lib/api";
import { ErrorState, LoadingState } from "@/components/ui";
import { IconChevronRight, IconExternal, IconSend } from "@/components/icons";

const EXAMPLES = [
  "Bagaimana tata cara wudhu yang benar menurut sunnah?",
  "Apa saja hal yang membatalkan shalat?",
  "Bagaimana cara shalat bagi orang yang sakit?",
  "Apa hukum berpuasa bagi ibu menyusui?",
];

interface Turn {
  question: string;
  response: AskResponse;
}

/** Pencarian AI di dalam halaman Cari: AI mencari fatwa terbit yang
 *  membahas pertanyaan lalu merangkumnya lengkap dengan sumber.
 *  Jawaban ditampilkan sebagai paragraf-paragraf rapi (teks polos dari
 *  backend, tanpa markdown). */
export default function TanyaAi() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (raw?: string) => {
    const q = (raw ?? question).trim();
    if (q.length < 5 || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.ask(q);
      setTurns((prev) => [{ question: q, response }, ...prev]);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghubungi layanan Tanya AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="rounded-2xl border border-line bg-card p-3.5 shadow-lift sm:p-4"
      >
        <label htmlFor="tanya-input" className="mb-2 block text-sm font-semibold text-emerald-deep">
          Pertanyaanmu
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="tanya-input"
            className="input min-w-0 flex-1 resize-none"
            rows={2}
            maxLength={500}
            placeholder="Misalnya: bagaimana tata cara wudhu yang benar?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button className="btn-gold inline-flex shrink-0 items-center gap-1.5" type="submit" disabled={loading || question.trim().length < 5}>
            <IconSend className="h-4 w-4" /> Tanyakan
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => void submit(ex)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-emerald-deep transition hover:bg-white disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {loading && <LoadingState label="Mencari fatwa dan menyusun ringkasan…" />}
      {error && <ErrorState message={error} onRetry={() => void submit(turns[0]?.question)} />}

      <div className="space-y-8">
        {turns.map((turn, i) => (
          <article key={`${turn.question}-${i}`} className="space-y-3">
            <h2 className="text-[15px] font-bold text-emerald-deep">{turn.question}</h2>
            <div className="card p-4 sm:p-5">
              <div className="space-y-3.5">
                {turn.response.answer
                  .split(/\n\s*\n/)
                  .map((para) => para.replace(/\s*\n\s*/g, " ").trim())
                  .filter(Boolean)
                  .map((para, pi) => (
                    <p key={pi} className="text-[15px] leading-[1.85] text-emerald-deep/90">
                      {para}
                    </p>
                  ))}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
                {turn.response.label}
              </p>
            </div>
            {turn.response.sources.length > 0 && (
              <section aria-label="Sumber fatwa">
                <h3 className="section-heading mb-3">Sumber fatwa</h3>
                <div className="space-y-2.5">
                  {turn.response.sources.map((s, idx) => (
                    <div key={s.id} className="card flex items-center gap-4 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald text-sm font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-[15px] text-emerald-deep">{s.title_id}</strong>
                        <span className="mt-0.5 block text-sm text-muted">
                          {s.scholar}
                          {s.topics && s.topics.length > 0 ? ` · ${s.topics.join(", ")}` : ""}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-2">
                          <Link
                            href={s.app_path}
                            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-surface px-3 text-xs font-semibold text-emerald-deep transition hover:bg-white"
                          >
                            Baca di aplikasi <IconChevronRight className="h-3.5 w-3.5" />
                          </Link>
                          {s.source_url && (
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-surface px-3 text-xs font-semibold text-emerald-deep transition hover:bg-white"
                            >
                              Sumber asli <IconExternal className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
