"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/services/api";
import { getEmail, getRole } from "@/services/auth";

type EmployeeDTO = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  docNumber: string;
  dateOfBirth?: string | null;
  role: number | "employee" | "leader" | "director";
  phones: string[];
  managerId?: string | null;
};

type Props = {
  initialData?: Partial<EmployeeDTO>;
  editMode?: boolean;
};

function ensureMinPhones(arr: string[], min = 2): string[] {
  const out = [...arr];
  while (out.length < min) out.push("");
  return out;
}

function normalizePhones(input: any): string[] {
  if (!input) return ensureMinPhones([]);
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const p of input) {
      if (typeof p === "string") {
        if (p) out.push(p);
      } else if (p && typeof p === "object") {
        const v = p.number ?? p.phone ?? p.phoneNumber ?? p.value ?? "";
        if (v) out.push(String(v));
      }
    }
    return ensureMinPhones(out);
  }
  return ensureMinPhones([]);
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const onlyDate = value.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) return onlyDate;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

function mapRoleFromApi(value: number | string | null | undefined): "employee" | "leader" | "director" {
  if (typeof value === "number") {
    if (value === 3) return "director";
    if (value === 2) return "leader";
    return "employee";
  }
  if (value === "director" || value === "leader" || value === "employee") return value;
  return "employee";
}
function mapRoleToApi(value: "employee" | "leader" | "director"): number {
  if (value === "director") return 3;
  if (value === "leader") return 2;
  return 1;
}

function fullNameLabel(e: any) {
  const n = [e.firstName, e.lastName].filter(Boolean).join(" ").trim();
  return n || e.email || e.docNumber || "(sem nome)";
}

function apiErrorMessage(err: any): string {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  return data?.message || data?.title || data?.detail || err?.message || "Save failed.";
}

export default function EmployeeForm({ initialData, editMode = false }: Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const employeeId = useMemo(
    () => (initialData?.id ?? params?.id ?? "") as string,
    [initialData?.id, params?.id]
  );

  const [firstName, setFirstName] = useState(initialData?.firstName ?? "");
  const [lastName, setLastName] = useState(initialData?.lastName ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [docNumber, setDocNumber] = useState(initialData?.docNumber ?? "");
  const [phones, setPhones] = useState<string[]>(
    initialData ? normalizePhones(initialData.phones) : ensureMinPhones([])
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    toDateInputValue(initialData?.dateOfBirth ?? null)
  );
  const [role, setRole] = useState<"employee" | "leader" | "director">(
    mapRoleFromApi(initialData?.role)
  );

  const [managerId, setManagerId] = useState<string | null>(
    initialData?.managerId ? String(initialData.managerId) : null
  );
  const [allEmployees, setAllEmployees] = useState<
    Array<{ id: string; firstName: string; lastName: string; email: string }>
  >([]);
  const [managersLoading, setManagersLoading] = useState<boolean>(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <— NEW: state to toggle visibility

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState<boolean>(Boolean(initialData && editMode));

  function hydrateFrom(e: any) {
    setFirstName(String(e.firstName ?? ""));
    setLastName(String(e.lastName ?? ""));
    setEmail(String(e.email ?? ""));
    setDocNumber(String(e.docNumber ?? ""));
    setPhones(normalizePhones(e.phones));
    setDateOfBirth(toDateInputValue(e.dateOfBirth ?? null));
    setRole(mapRoleFromApi(e.role));
    setManagerId(e.managerId ? String(e.managerId) : null);
  }

  useEffect(() => {
    if (!editMode) return;
    if (loadedOnce) return;
    if (!employeeId) return;

    (async () => {
      try {
        const res = await api.get(`/employees/${employeeId}`);
        hydrateFrom(res.data);
        setLoadedOnce(true);
      } catch (err: any) {
        setError(apiErrorMessage(err));
      }
    })();
  }, [editMode, employeeId, loadedOnce]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setManagersLoading(true);
        const res = await api.get("/employees");
        const list = (res.data ?? []) as Array<any>;
        const mapped = list
          .map((e) => ({
            id: String(e.id),
            firstName: String(e.firstName ?? ""),
            lastName: String(e.lastName ?? ""),
            email: String(e.email ?? ""),
          }))
          .sort((a, b) => fullNameLabel(a).localeCompare(fullNameLabel(b)));
        if (active) setAllEmployees(mapped);
      } catch {
      } finally {
        if (active) setManagersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!managerId) return;
    const has = allEmployees.some((e) => e.id === managerId);
    if (has) return;

    let active = true;
    (async () => {
      try {
        const res = await api.get(`/employees/${managerId}`);
        const m = res.data;
        if (!m) return;
        const one = {
          id: String(m.id),
          firstName: String(m.firstName ?? ""),
          lastName: String(m.lastName ?? ""),
          email: String(m.email ?? ""),
        };
        if (!active) return;
        setAllEmployees((prev) => {
          if (prev.some((x) => x.id === one.id)) return prev;
          const next = [...prev, one];
          next.sort((a, b) => fullNameLabel(a).localeCompare(fullNameLabel(b)));
          return next;
        });
      } catch {}
    })();

    return () => {
      active = false;
    };
  }, [managerId, allEmployees]);

  useEffect(() => {
    if (editMode) return;
    if (managerId) return;
    if (!allEmployees.length) return;

    const myEmail = getEmail();
    if (!myEmail) return;

    const me = allEmployees.find((e) => e.email?.toLowerCase() === myEmail.toLowerCase());
    if (me) setManagerId(me.id);
  }, [editMode, managerId, allEmployees]);

  const addPhone = () => setPhones((prev) => [...prev, ""]);
  const removePhone = (idx: number) =>
    setPhones((prev) => prev.filter((_, i) => i !== idx));

  function isMinor(dateStr: string): boolean {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return false;
    const dob = new Date(Date.UTC(y, m - 1, d));
    const today = new Date();
    const age =
      today.getUTCFullYear() - dob.getUTCFullYear() -
      (today.getUTCMonth() < dob.getUTCMonth() ||
        (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate())
        ? 1
        : 0);
    return age < 18;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isMinor(dateOfBirth)) {
        throw new Error("Employee must be at least 18 years old.");
      }

      const payload: any = {
        firstName,
        lastName,
        email,
        docNumber,
        dateOfBirth: dateOfBirth || null,
        role: mapRoleToApi(role),
        phones: (phones ?? []).filter(Boolean),
        managerId: managerId || null,
      };

      if (!editMode) {
        payload.password = password;
        await api.post("/employees", payload);
      } else {
        const id = employeeId;
        if (!id) throw new Error("Employee id not found for update.");
        await api.put(`/employees/${id}`, payload);
      }

      router.push("/employees");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        const myRole = getRole();
        setError(
          "You don’t have permission to save this change. " +
            "You can’t create or edit a user with a higher role than yours" +
            (myRole ? ` (your role: ${String(myRole)})` : "") +
            "."
        );
      } else {
        setError(apiErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <div>
          <label>First Name *</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div>
          <label>Last Name *</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <div>
          <label>Email *</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label>Doc Number *</label>
          <input className="input" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required />
        </div>

        <div>
          <label>Date of Birth *</label>
          <input className="input" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
        </div>

        <div>
          <label>Role *</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)} required>
            <option value="employee">Employee</option>
            <option value="leader">Leader</option>
            <option value="director">Director</option>
          </select>
        </div>

        <div>
          <label>Manager (optional)</label>
          <select
            className="input"
            value={managerId ?? ""}
            onChange={(e) => setManagerId(e.target.value ? e.target.value : null)}
            disabled={managersLoading}
          >
            <option value="">— No manager —</option>
            {allEmployees.map((m) => (
              <option key={m.id} value={m.id}>
                {fullNameLabel(m)} {m.email ? `(${m.email})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label>Phones *</label>
        {phones.map((p, idx) => (
          <div key={idx} style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
            <input
              className="input"
              value={p}
              onChange={(e) => {
                const v = e.target.value;
                setPhones((prev) => prev.map((x, i) => (i === idx ? v : x)));
              }}
              required
              placeholder={`Phone #${idx + 1}`}
            />
            <button
              type="button"
              className="btn--outline"
              onClick={() => removePhone(idx)}
              disabled={phones.length <= 2}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn--outline" onClick={addPhone}>Add phone</button>
      </div>

      {!editMode && (
        <div style={{ position: "relative" }}>
          <label>Password *</label>
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ paddingRight: "2.5rem" }}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "3.4rem",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "2.5rem",
              lineHeight: 1
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
      )}

      {error && <div style={{ color: "#b00020", marginTop: ".75rem" }}>{error}</div>}

      <button className="btn" type="submit" disabled={saving} style={{ marginTop: "1rem" }}>
        {saving ? (editMode ? "Saving..." : "Creating...") : editMode ? "Save" : "Create Employee"}
      </button>
    </form>
  );
}
