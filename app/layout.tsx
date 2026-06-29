import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beforest KMS Prototype",
  description: "Beforest knowledge management system frontend prototype"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
