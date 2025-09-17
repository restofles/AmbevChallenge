import { setCookie, destroyCookie, parseCookies } from "nookies";
import { jwtDecode } from "jwt-decode";
import type { Role } from "@/types/employee";

type Claims = {
  sub?: string;
  email?: string;
  role?: Role | string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  firstName?: string;
  exp?: number;
  [k: string]: any;
};

const TOKEN_KEY = "token";

export function setToken(token: string) {
  setCookie(null, TOKEN_KEY, token, { path: "/", maxAge: 60 * 60 * 8 });
}

export function clearToken() {
  destroyCookie(null, TOKEN_KEY, { path: "/" });
}

export function getToken(): string | null {
  try {
    const { [TOKEN_KEY]: t } = parseCookies();
    return t ?? null;
  } catch {
    return null;
  }
}

export function getClaims(): Claims | null {
  const t = getToken();
  if (!t) return null;
  try {
    return jwtDecode<Claims>(t);
  } catch {
    return null;
  }
}

export function getEmail(): string | null {
  const c = getClaims();
  return c?.email ?? null;
}

function capitalizeWord(s: string) {
  const v = s.trim();
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}
function isRoleWord(s?: string | null) {
  if (!s) return false;
  return /^(employee|leader|director)$/i.test(s.trim());
}

export function getRole(): Role | null {
  const c = getClaims();
  const r = (c?.role ?? null) as Role | string | null;
  if (!r) return null;
  const v = String(r).toLowerCase();
  if (v === "employee" || v === "leader" || v === "director") return v as Role;
  return null;
}

export function getFirstName(): string | null {
  const c = getClaims();
  const role = getRole();
  const candidates = [
    c?.firstName,
    c?.given_name,
    c?.name?.split(" ")[0],
    c?.preferred_username,
    c?.email?.split("@")[0],
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const w = String(raw).trim();
    if (role && w.toLowerCase() === role.toLowerCase()) continue;
    if (isRoleWord(w)) continue;
    return capitalizeWord(w);
  }
  return null;
}

export function isAuthenticated(): boolean {
  const c = getClaims();
  if (!c?.exp) return !!c;
  const now = Math.floor(Date.now() / 1000);
  return c.exp > now;
}

export function logout(): boolean {
  try {
    clearToken();
    if (typeof window !== "undefined") {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
    }
    return true;
  } catch {
    return false;
  }
}
