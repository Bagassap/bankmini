"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getUser, isLoggedIn } from "@/lib/auth";
import logo from "@/assets/logo bank-mini1.png";

const REDIRECT_DELAY_MS = 3600;
const TITLE = "Bank Mini NUSA";
const TAGLINE = "Sahabat keuangan digital untuk siswa, guru, dan sekolah.";
const TAGLINE_WORDS = TAGLINE.split(" ");

function resolveDestination(): string {
  if (!isLoggedIn()) return "/login";
  const user = getUser();
  return user?.accountType === "nasabah" ? "/portal" : "/dashboard";
}

export default function Home() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        router.replace(resolveDestination());
      }, 500);
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router]);

  function handleSkip() {
    setLeaving(true);
    setTimeout(() => {
      router.replace(resolveDestination());
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
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-gradient-from via-gradient-via to-gradient-to"
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

        <h1 className="mt-6 flex flex-wrap justify-center text-4xl font-black tracking-tight text-white sm:text-6xl">
          {TITLE.split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 28, rotateX: -70 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.7 + i * 0.03,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block"
              style={{ transformOrigin: "bottom", perspective: 400 }}
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </h1>

        <p className="mt-5 flex max-w-lg flex-wrap justify-center gap-x-1.5 gap-y-1 text-base font-medium text-white/75 sm:text-lg">
          {TAGLINE_WORDS.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 1.8 + i * 0.055 }}
            >
              {word}
            </motion.span>
          ))}
        </p>

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
