import { Navbar } from "@/components/Navbar";
import EmployeesClient from "./ui";
import type { Employee } from "@/types/employee";
import { cookies } from "next/headers";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadInitial(q?: string): Promise<Employee[] | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:44313";
  const url = new URL("/employees", base);
  if (q && q.trim()) url.searchParams.set("q", q.trim());

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return Array.isArray(data) ? (data as Employee[]) : (data.items as Employee[]) ?? null;
  } catch {
    return null;
  }
}

export default async function EmployeesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const qParam = sp?.q;
  const q = Array.isArray(qParam) ? qParam[0] ?? "" : qParam ?? "";

  const initial = await loadInitial(q);

  return (
    <>
      <Navbar />
      <EmployeesClient initialItems={initial ?? undefined} initialQuery={q} />
    </>
  );
}
