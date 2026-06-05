"use client";

import { useEffect, useState } from "react";
import { Cs2FloatSearchPanel } from "@/components/cs2/Cs2FloatSearchPanel";
import type { Cs2CatalogResponse, Cs2FloatSearchResponse, Cs2FloatSort } from "@/lib/cs2/types";

export function Cs2FloatSearchSection() {
  const [response, setResponse] = useState<Cs2FloatSearchResponse | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("AK-47 | Redline (Field-Tested)");
  const [minFloat, setMinFloat] = useState("");
  const [maxFloat, setMaxFloat] = useState("0.18");
  const [paintSeed, setPaintSeed] = useState("");
  const [paintIndex, setPaintIndex] = useState("");
  const [sort, setSort] = useState<Cs2FloatSort>("lowest_float");

  async function loadFloatSearch() {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (query.trim()) searchParams.set("q", query.trim());
      if (minFloat.trim()) searchParams.set("minFloat", minFloat.trim());
      if (maxFloat.trim()) searchParams.set("maxFloat", maxFloat.trim());
      if (paintSeed.trim()) searchParams.set("paintSeed", paintSeed.trim());
      if (paintIndex.trim()) searchParams.set("paintIndex", paintIndex.trim());
      searchParams.set("sort", sort);
      const apiResponse = await fetch(`/api/cs2/float-search?${searchParams.toString()}`);
      if (!apiResponse.ok) throw new Error(`Float search failed with ${apiResponse.status}`);
      setResponse(await apiResponse.json() as Cs2FloatSearchResponse);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFloatSearch();
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const apiResponse = await fetch(`/api/cs2/items?q=${encodeURIComponent(normalizedQuery)}&limit=6&sort=name`, {
          signal: controller.signal,
        });
        if (!apiResponse.ok) return;
        const payload = await apiResponse.json() as Cs2CatalogResponse;
        setSuggestions(payload.items.map((item) => item.marketHashName));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <Cs2FloatSearchPanel
      response={response}
      suggestions={suggestions}
      loading={loading}
      query={query}
      minFloat={minFloat}
      maxFloat={maxFloat}
      paintSeed={paintSeed}
      paintIndex={paintIndex}
      sort={sort}
      onQueryChange={setQuery}
      onMinFloatChange={setMinFloat}
      onMaxFloatChange={setMaxFloat}
      onPaintSeedChange={setPaintSeed}
      onPaintIndexChange={setPaintIndex}
      onSortChange={setSort}
      onSearch={() => void loadFloatSearch()}
    />
  );
}
