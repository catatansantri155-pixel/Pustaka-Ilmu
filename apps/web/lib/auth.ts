import type { User } from "@pustaka/shared-types";
export const TOKEN_KEY = "pustaka_token";
export const USER_KEY = "pustaka_user";
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string) {
  try { window.localStorage.setItem(TOKEN_KEY, token); } catch {}
}
export function clearToken() {
  try { window.localStorage.removeItem(TOKEN_KEY); window.localStorage.removeItem(USER_KEY); } catch {}
}
export function isLoggedIn(): boolean { return !!getToken(); }
export function setUser(user: User) {
  try { window.localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
}
export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try { const v = window.localStorage.getItem(USER_KEY); return v ? (JSON.parse(v) as User) : null; } catch { return null; }
}
