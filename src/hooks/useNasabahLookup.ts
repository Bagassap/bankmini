"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import type { Nasabah } from "@/lib/types";

export function useNasabahLookup() {
  const [noRekening, setNoRekening] = useState("");
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!noRekening) return;
    setSearching(true);
    setNasabah(null);
    try {
      const { data } = await api.get<Nasabah>(
        `/nasabah/no-rekening/${noRekening}`,
      );
      setNasabah(data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Nasabah tidak ditemukan"));
    } finally {
      setSearching(false);
    }
  }

  function reset() {
    setNoRekening("");
    setNasabah(null);
  }

  return { noRekening, setNoRekening, nasabah, searching, handleSearch, reset };
}
