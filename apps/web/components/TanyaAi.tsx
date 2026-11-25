"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type AskResponse } from "@/lib/api";
import { LoadingState } from "@/components/ui";
import { IconChat, IconChevronRight, IconExternal } from "@/components/icons";

/** Panel Jawaban AI di halaman Cari: SATU kolom pencarian untuk dua fitur
 *  (keputusan user 25 Nov 2026). Setiap pencarian yang dikirim dari kolom
 *  pencarian katalog juga ditanyakan ke AI; panel ini menampilkan ringkasan
 *  dari fatwa terbit lengkap dengan sumbernya, di atas hasil katalog.
 *  Jawaban ditampilkan sebagai paragraf-paragraf rapi (teks polos dari
 *  backend, tanpa markdown). Bila layanan AI gagal, panel tidak tampil
 *  agar hasil pencarian biasa tidak terganggu. */
export function AiAnswerPanel({ question }: { question: string }) {
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);
    setResponse(null);
    api
      .ask(question)
      .then((r) => {
        if (alive) setResponse(r);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [question]);

  if (failed) return null;

  return (
    <section aria-label="Jawaban AI" className="space-y-3">
      <h2 className="section-heading flex items-center gap-2">
        <IconChat className="h-5 w-5 text-emerald" /> Jawaban AI
      </h2>
      {loading || !response ? (
        <div className="card p-4 sm:p-5">
          <LoadingState label="Mencari fatwa dan menyusun ringkasan…" />
        </div>
      ) : (
        <>
          <div className="card p-4 sm:p-5">
            <div className="space-y-3.5">
              {response.answer
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
              {response.label}
            </p>
          </div>
          {response.sources.length > 0 && (
            <div className="space-y-2.5">
              {response.sources.map((s, idx) => (
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
          )}
        </>
      )}
    </section>
  );
}
