import { Navbar } from "@/components/Navbar";
import EmployeeForm from "@/components/EmployeeForm";
import { cookies } from "next/headers";

type Params = { id: string };

async function tryFetch(url: string, token: string) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  return res.json();
}

function candidateBases(): string[] {
  const bases = new Set<string>();
  const envBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envBase) {
    bases.add(envBase);
    if (envBase.startsWith("https://") && /localhost|127\.0\.0\.1/.test(envBase)) {
      bases.add(envBase.replace(/^https:\/\//, "http://"));
    }
  }
  bases.add("http://localhost:44313");
  return Array.from(bases);
}

async function loadEmployee(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  for (const base of candidateBases()) {
    const url = `${base.replace(/\/+$/, "")}/employees/${id}`;
    try {
      const data = await tryFetch(url, token);
      if (data) return data;
    } catch {
    }
  }
  return null;
}

export default async function EditEmployeePage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const { id } =
    "then" in (params as any)
      ? await (params as Promise<Params>)
      : (params as Params);

  const data = await loadEmployee(id);

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "1.5rem 0", maxWidth: 900 }}>
        <h1>Edit Employee</h1>
        <EmployeeForm editMode initialData={data ?? undefined} />
      </main>
    </>
  );
}
