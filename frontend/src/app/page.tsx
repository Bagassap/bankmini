"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { resolveAuthedDestination } from "@/lib/role";
import logo from "@/assets/logo bank-mini1.png";

const REDIRECT_DELAY_MS = 3600;

async function resolveDestination(): Promise<string> {
  await useAuthStore.getState().hydrate();
  const { status, user } = useAuthStore.getState();
  if (status !== "authenticated" || !user) return "/login";
  return resolveAuthedDestination(user);
}

export default function Home() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        resolveDestination().then((dest) => router.replace(dest));
      }, 500);
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router]);

  function handleSkip() {
    setLeaving(true);
    setTimeout(() => {
      resolveDestination().then((dest) => router.replace(dest));
    }, 350);
  }

  return (
    <motion.main
      animate={{
        opacity: leaving ? 0 : 1,
        scale: leaving ? 1.04 : 1,
        filter: leaving ? "blur(10px)" : "blur(0px)",
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-primary-light via-primary to-primary-dark"
    >
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, filter: "blur(14px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={logo}
            alt="Bank Mini NUSA"
            width={220}
            height={86}
            priority
            className="h-auto w-36 sm:w-44"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/20 backdrop-blur-sm"
        >
          <Sparkles size={13} className="text-white/80" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
            Platform Perbankan Sekolah
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.4 }}
          className="mt-10 h-1 w-52 overflow-hidden rounded-full bg-white/15"
        >
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: REDIRECT_DELAY_MS / 1000,
              ease: "linear",
              delay: 0.3,
            }}
          />
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.6 }}
          onClick={handleSkip}
          className="mt-8 rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Lewati
        </motion.button>
      </div>
    </motion.main>
  );
}
