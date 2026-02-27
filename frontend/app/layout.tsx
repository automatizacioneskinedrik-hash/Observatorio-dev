import type { Metadata } from "next";
import "./globals.css";
import { neueMontreal } from "./fonts";

export const metadata: Metadata = {
  title: "AECCO IA",
  description: "AECCO IA conversacional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={neueMontreal.variable}>
      <body>{children}</body>
    </html>
  );
}
