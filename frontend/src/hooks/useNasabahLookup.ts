"use client";

import { useEffect, useState } from "react";
import { notify } from "@/store/notifyStore";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import type { Nasabah } from "@/lib/types";

export function useNasabahLookup() {
  const [noRekening, setNoRekening] = useState("");
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Nasabah[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [kelasFilter, setKelasFilter] = useState("");
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);

  useEffect(() => {
    api
      .get<Nasabah[]>("/nasabah", { params: { jenis: "kelas" } })
      .then(({ data }) => {
        const names = data
          .map((n) => n.kelas)
          .filter((k): k is string => !!k)
          .sort((a, b) => a.localeCompare(b));
        setKelasOptions(names);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const hasSearch = noRekening.trim().length >= 2;
    if (nasabah || (!hasSearch && !kelasFilter)) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const { data } = await api.get<Nasabah[]>("/nasabah", {
          params: {
            search: hasSearch ? noRekening.trim() : undefined,
            jenis: kelasFilter ? "siswa" : undefined,
            kelas: kelasFilter || undefined,
          },
        });
        setSuggestions(data.slice(0, kelasFilter ? 50 : 6));
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [noRekening, nasabah, kelasFilter]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!noRekening) return;
    setSearching(true);
    setNasabah(null);
    setSuggestions([]);
    try {
      const { data } = await api.get<Nasabah>(
        `/nasabah/no-rekening/${noRekening.trim()}`,
      );
      setNasabah(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Nasabah tidak ditemukan"));
    } finally {
      setSearching(false);
    }
  }

  function selectSuggestion(selected: Nasabah) {
    setNasabah(selected);
    setNoRekening(selected.noRekening);
    setSuggestions([]);
  }

  function changeKelasFilter(value: string) {
    // Ganti kelas berarti mau cari siswa lain - lepas nasabah yang
    // sedang terpilih supaya daftar siswa kelas baru langsung muncul,
    // bukan diam karena effect suggestion berhenti selama masih ada
    // nasabah terpilih.
    setKelasFilter(value);
    setNasabah(null);
    setNoRekening("");
  }

  function reset() {
    // kelasFilter sengaja tidak direset - teller sering memproses satu
    // kelas berurutan, jadi daftar siswa kelas yang sama langsung
    // muncul lagi untuk transaksi berikutnya.
    setNoRekening("");
    setNasabah(null);
    setSuggestions([]);
  }

  return {
    noRekening,
    setNoRekening,
    nasabah,
    searching,
    suggestions,
    suggestionsLoading,
    selectSuggestion,
    handleSearch,
    reset,
    kelasFilter,
    setKelasFilter: changeKelasFilter,
    kelasOptions,
  };
}
