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

  // Lets teller find an account by name too (not just an exact No Rekening) -
  // e.g. the pooled kelas account has no card/number anyone memorizes, so
  // typing "kelas" or the class name needs to surface it as a suggestion.
  useEffect(() => {
    if (nasabah || noRekening.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const { data } = await api.get<Nasabah[]>("/nasabah", {
          params: { search: noRekening.trim() },
        });
        setSuggestions(data.slice(0, 6));
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [noRekening, nasabah]);

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

  function reset() {
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
  };
}
