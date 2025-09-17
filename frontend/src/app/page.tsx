"use client";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding:"1.5rem 0" }}>
        <h1 style={{ margin:0, marginBottom:".5rem" }}>Ambev Challenge</h1>
      </main>
    </>
  );
}