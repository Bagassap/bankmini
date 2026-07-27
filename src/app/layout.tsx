import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { satoshi } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank Mini NUSA",
  description: "Aplikasi perbankan mini sekolah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${satoshi.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
