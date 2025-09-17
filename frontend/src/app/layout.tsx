import type { Metadata } from "next";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Ambev Challenge",
  description: "Front-end React/Next com SSR e SCSS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="layout">{children}</body>
    </html>
  );
}