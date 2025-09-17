"use client";
import Link from "next/link";
import { useState } from "react";
import api from "@/services/api";
import { setToken } from "@/services/auth";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      router.push("/employees");
    } catch (ex: any) {
      setErr(ex?.response?.data?.message ?? "Login failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "1.5rem 0", maxWidth: 420 }}>
        <h1 style={{ margin: 0, marginBottom: ".5rem" }}>Sign in</h1>
        <p style={{ marginTop: 0, color: "#374151" }}>
          Use the test credentials once the API is running.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: ".75rem" }}>
          <input
            className="input"
            type="email"
            placeholder="E-mail"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {err && (
          <div style={{ marginTop: ".75rem", color: "#b00020", fontSize: ".9rem" }}>
            {err}
          </div>
        )}

        <p style={{ marginTop: "1rem", fontSize: ".9rem" }}>
          <Link href="/">Back to home</Link>
        </p>
      </main>
    </>
  );
}
