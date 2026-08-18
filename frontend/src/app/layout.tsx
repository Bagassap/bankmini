import type { Metadata } from "next";
import { NotifyModal } from "@/components/common/NotifyModal";
import { satoshi } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank Mini NUSA",
  description: "Aplikasi perbankan mini sekolah",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("bankmini_theme");if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${satoshi.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <NotifyModal />
      </body>
    </html>
  );
}
