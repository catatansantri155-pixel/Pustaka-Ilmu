import type {
  AiRunsResponse, AiSettings, BackupCreateResponse, Bookmark, DashboardStats,
  GlossaryItem, Issue, LoginResponse, MaterialDetail, MaterialSummary, MeResponse,
  MfaEnrollResponse, MfaVerifyResponse, ProcessingResponse, PublicationResponse,
  QualityFinding, ReferenceItem, ReportsSummary, Scholar, SearchResult,
  SegmentUpdateResponse, SourceRegistryItem, SystemInfo, Topic,
} from "@pustaka/shared-types";
import { getToken } from "./auth";

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  blockers: string[];
  detailRaw: unknown;
  constructor(message: string, status: number, blockers: string[] = [], detailRaw: unknown = null) {
    super(message); this.status = status; this.blockers = blockers; this.detailRaw = detailRaw;
  }
}

function extractBlockers(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(push);
    else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.message === "string") out.push(o.message);
      else if (typeof o.msg === "string") out.push(o.msg);
      else if (typeof o.detail === "string") out.push(o.detail);
    }
  };
  push(d.blockers); push(d.blocking_reasons);
  const det = d.detail;
  if (det && typeof det === "object" && !Array.isArray(det)) {
    const dd = det as Record<string, unknown>;
    push(dd.blockers); push(dd.blocking_reasons); push(dd.reasons);
  }
  return out;
}

function errorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    if (typeof d.message === "string") return d.message;
    if (Array.isArray(d.detail)) {
      const msgs = d.detail.map((x) => {
        if (x && typeof x === "object" && "msg" in x) return String((x as { msg: unknown }).msg);
        return String(x);
      });
      if (msgs.length) return msgs.join("; ");
    }
    if (d.detail && typeof d.detail === "object") {
      const dd = d.detail as Record<string, unknown>;
      if (typeof dd.message === "string") return dd.message;
    }
  }
  return `Permintaan gagal (HTTP ${status})`;
}

export async function apiFetch<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const h: Record<string, string> = { "Content-Type": "application/json", ...(headers as Record<string, string> | undefined) };
  if (auth) { const t = getToken(); if (t) h["Authorization"] = `Bearer ${t}`; }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server API. Pastikan backend berjalan.", 0);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new ApiError(errorMessage(data, res.status), res.status, extractBlockers(data), data);
  return data as T;
}

/** Normalize list responses that may be an array or {items|results|data: []}. */
export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const k of ["items", "results", "data", "materials", "scholars", "topics", "issues", "findings", "bookmarks", "sources", "glossary", "terms"]) {
      if (Array.isArray(d[k])) return d[k] as T[];
    }
  }
  return [];
}

async function list<T>(path: string): Promise<T[]> {
  const data = await apiFetch<unknown>(path);
  return asList<T>(data);
}

export const api = {
  health: () => apiFetch<{ status?: string }>("/health", { auth: false }),
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/api/auth/login", { method: "POST", auth: false, body: JSON.stringify({ email, password }) }),
  me: () => apiFetch<MeResponse>("/api/auth/me"),
  mfaVerify: (mfaToken: string, code: string) =>
    apiFetch<MfaVerifyResponse>("/api/auth/mfa/verify", { method: "POST", auth: false, body: JSON.stringify({ mfa_token: mfaToken, code }) }),
  mfaEnroll: () => apiFetch<MfaEnrollResponse>("/api/auth/mfa/enroll", { method: "POST" }),
  mfaActivate: (code: string) =>
    apiFetch<unknown>("/api/auth/mfa/activate", { method: "POST", body: JSON.stringify({ code }) }),
  mfaDisable: (code: string) =>
    apiFetch<unknown>("/api/auth/mfa/disable", { method: "POST", body: JSON.stringify({ code }) }),
  scholars: () => list<Scholar>("/api/scholars"),
  topics: () => list<Topic>("/api/topics"),
  issues: () => list<Issue>("/api/issues"),
  materials: () => list<MaterialSummary>("/api/materials"),
  material: (id: string) => apiFetch<MaterialDetail>(`/api/materials/${encodeURIComponent(id)}`, { auth: false }),
  search: async (q: string, scholarId?: string): Promise<SearchResult[]> => {
    const qs = new URLSearchParams({ q });
    if (scholarId) qs.set("scholar_id", scholarId);
    const data = await apiFetch<unknown>(`/api/search?${qs.toString()}`, { auth: false });
    return asList<SearchResult>(data);
  },
  bookmarks: () => list<Bookmark>("/api/bookmarks"),
  addBookmark: (materialId: string) =>
    apiFetch<Bookmark>("/api/bookmarks", { method: "POST", body: JSON.stringify({ material_id: materialId }) }),
  removeBookmark: (id: string) => apiFetch<void>(`/api/bookmarks/${encodeURIComponent(id)}`, { method: "DELETE" }),
  readingHistory: (materialId: string) =>
    apiFetch<unknown>("/api/reading-history", { method: "POST", body: JSON.stringify({ material_id: materialId }) }).catch(() => null),
  // Admin
  dashboard: () => apiFetch<DashboardStats>("/api/admin/dashboard"),
  adminSources: () => list<SourceRegistryItem>("/api/admin/sources"),
  createSource: (body: Record<string, unknown>) =>
    apiFetch<SourceRegistryItem>("/api/admin/sources", { method: "POST", body: JSON.stringify(body) }),
  deleteSource: (id: string) => apiFetch<void>(`/api/admin/sources/${encodeURIComponent(id)}`, { method: "DELETE" }),
  adminMaterials: () => list<MaterialSummary>("/api/admin/materials"),
  adminMaterial: (id: string) => apiFetch<MaterialDetail>(`/api/admin/materials/${encodeURIComponent(id)}`),
  materialAction: (id: string, action: "approve" | "publish" | "unpublish" | "reject") =>
    apiFetch<unknown>(`/api/admin/materials/${encodeURIComponent(id)}/${action}`, { method: "POST" }),
  importUrl: (url: string) =>
    apiFetch<unknown>("/api/admin/acquisition/import", { method: "POST", body: JSON.stringify({ url }) }),
  translate: (id: string) =>
    apiFetch<unknown>(`/api/admin/materials/${encodeURIComponent(id)}/translate`, { method: "POST" }),
  findings: () => list<QualityFinding>("/api/admin/findings"),
  processing: () => apiFetch<ProcessingResponse>("/api/admin/processing"),
  aiRuns: () => apiFetch<AiRunsResponse>("/api/admin/ai-runs"),
  publication: () => apiFetch<PublicationResponse>("/api/admin/publication"),
  reportsSummary: () => apiFetch<ReportsSummary>("/api/admin/reports/summary"),
  aiSettings: () => apiFetch<AiSettings>("/api/admin/ai-settings"),
  glossary: () => list<GlossaryItem>("/api/admin/glossary"),
  createGlossary: (body: { term_ar: string; term_id: string; context?: string }) =>
    apiFetch<GlossaryItem>("/api/admin/glossary", { method: "POST", body: JSON.stringify(body) }),
  updateGlossary: (id: string, body: { term_ar: string; term_id: string; context?: string }) =>
    apiFetch<GlossaryItem>(`/api/admin/glossary/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteGlossary: (id: string) => apiFetch<void>(`/api/admin/glossary/${encodeURIComponent(id)}`, { method: "DELETE" }),
  system: () => apiFetch<SystemInfo>("/api/admin/system"),
  createBackup: () => apiFetch<BackupCreateResponse>("/api/admin/system/backup", { method: "POST" }),
  updateSegment: (materialId: string, textSegmentId: string, textId: string) =>
    apiFetch<SegmentUpdateResponse>(
      `/api/admin/materials/${encodeURIComponent(materialId)}/segments/${encodeURIComponent(textSegmentId)}`,
      { method: "PATCH", body: JSON.stringify({ text_id: textId }) },
    ),
  references: async (kind: "quran" | "hadith"): Promise<ReferenceItem[]> => {
    const data = await apiFetch<unknown>(`/api/references/${kind}`);
    return asList<ReferenceItem>(data);
  },
};

export function scholarName(s?: Scholar | null): string {
  if (!s) return "";
  return s.name_id || s.name || "Ulama";
}
export function materialTitle(m?: { title_id?: string | null; title?: string | null } | null): string {
  if (!m) return "(Tanpa judul)";
  return m.title_id || m.title || "(Tanpa judul)";
}
export function topicName(t?: Topic | null): string {
  if (!t) return "";
  return t.name_id || t.name || t.title || t.code || "";
}
