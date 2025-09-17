"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/services/api";
import type { Employee } from "@/types/employee";

type UIEmployee = Employee & { managerName?: string | null };

function normalize(items: any[]): UIEmployee[] {
  return (items ?? []).map((e: any) => ({
    ...e,
    phones: (e.phones ?? []).map((p: any) => (typeof p === "string" ? p : p?.number ?? "")),
    role:
      typeof e.role === "number"
        ? e.role === 3
          ? "director"
          : e.role === 2
          ? "leader"
          : "employee"
        : (e.role ?? "employee"),
  }));
}

function fullName(e: Pick<Employee, "firstName" | "lastName" | "email">) {
  const n = [e.firstName, e.lastName].filter(Boolean).join(" ").trim();
  if (n) return n;
  return e.email?.split("@")[0] ?? "(sem nome)";
}

function roleTag(role: string) {
  const colors: Record<string, string> = {
    employee: "#2563eb",
    leader: "#9333ea",
    director: "#0f766e",
  };
  const label = role === "director" ? "Director" : role === "leader" ? "Leader" : "Employee";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".35rem",
        fontSize: ".85rem",
        padding: ".15rem .5rem",
        borderRadius: "999px",
        color: "#fff",
        background: colors[role] ?? "#374151",
        whiteSpace: "nowrap",
      }}
      title={label}
    >
      {label}
    </span>
  );
}

function matches(e: any, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const bucket = [
    e.firstName,
    e.lastName,
    `${e.firstName ?? ""} ${e.lastName ?? ""}`,
    e.email,
    e.docNumber,
    e.managerName,
    String(e.role),
    ...(e.phones ?? []).map(String),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return bucket.includes(s);
}

type Props = {
  initialItems?: UIEmployee[];
  initialQuery?: string;
};

export default function EmployeesClient({ initialItems, initialQuery = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<UIEmployee[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItems) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/employees");
        setItems(normalize(res.data ?? []));
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Failed to load employees.");
      } finally {
        setLoading(false);
      }
    })();
  }, [initialItems]);

  useEffect(() => {
    const spQ = searchParams?.get("q") ?? "";
    if (spQ !== q) setQ(spQ);
  }, [searchParams]);

  useEffect(() => {
    const currentQ = searchParams?.get("q") ?? "";
    if (q === currentQ) return;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.replace(`/employees${q ? `?${params.toString()}` : ""}`);
  }, [q]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this employee? This action cannot be undone.")) return;
    try {
      await api.delete(`/employees/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      const data = e?.response?.data;
      const msg = typeof data === "string" ? data : data?.message || data?.title || "You don't have permission.";
      alert(msg);
    }
  };

  const displayed = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter((e) => matches(e, q));
  }, [items, q]);

  return (
    <main className="container" style={{ padding: "2rem 0", maxWidth: "1100px" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: ".75rem",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, flex: "0 0 auto" }}>Employees</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            flex: "1 1 420px",
            minWidth: 0,
          }}
        >
          <input
            className="input"
            placeholder="Search by name, email, doc..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: "1 1 220px", minWidth: 0 }}
          />
          <Link className="btn" href="/employees/new" style={{ whiteSpace: "nowrap" }}>
            New
          </Link>
        </div>
      </header>

      {error && <div style={{ color: "#b00020", marginBottom: "1rem" }}>{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : displayed.length === 0 ? (
        <p>No employees found.</p>
      ) : (
        <table className="table" style={{ width: "100%" }}>
          <thead>
            <tr><th style={{ textAlign: "left" }}>Name</th><th style={{ textAlign: "left" }}>Email</th><th style={{ textAlign: "left" }}>Doc</th><th style={{ textAlign: "left" }}>Phones</th><th style={{ textAlign: "left" }}>Role</th><th style={{ textAlign: "left" }}>Manager</th><th style={{ textAlign: "right" }}>Actions</th></tr>
          </thead>
          <tbody>
            {displayed.map((e) => (
              <tr key={e.id}>
                <td>{fullName(e)}</td>
                <td>{e.email}</td>
                <td>{e.docNumber}</td>
                <td style={{ verticalAlign: "top" }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {(e.phones ?? []).filter(Boolean).map((p, idx) => (
                      <li key={idx} style={{ whiteSpace: "nowrap" }}>{String(p)}</li>
                    ))}
                  </ul>
                </td>
                <td>{roleTag(String(e.role))}</td>
                <td title={e.managerName ?? ""}>{e.managerName?.trim() || "-"}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: ".5rem" }}>
                    <Link className="btn--outline" href={`/employees/${e.id}`}>
                      Edit
                    </Link>
                    <button className="btn" onClick={() => onDelete(e.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
