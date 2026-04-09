import type { Metadata } from "next";
import "./globals.css";
import { neueMontreal, inter } from "./fonts";

export const metadata: Metadata = {
  title: "AECO IA",
  description: "AECO IA conversacional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${neueMontreal.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
