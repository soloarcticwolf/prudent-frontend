import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { api } from "../../lib/api/client";
import { useDebounce } from "../../hooks/useDebounce";
import type { SearchResult } from "../../types/api";
import { Skeleton } from "../ui/primitives";

export function SearchBox({
  value,
  onPick,
  onQueryChange,
}: {
  value: SearchResult | null;
  onPick: (r: SearchResult | null) => void;
  /** Fired on every user edit of the query text (e.g. first backspace). */
  onQueryChange?: () => void;
}) {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 350);
  const { data, isFetching } = useQuery({
    queryKey: ["geo-search", debounced],
    queryFn: () => api.searchRegions(debounced),
    enabled: debounced.trim().length >= 3,
    staleTime: 60_000,
  });

  return (
    <div>
      <label htmlFor="geo-search" className="text-sm font-semibold text-ink">
        Geographic search
      </label>
      <div className="relative mt-1">
        <MapPin size={16} className="pointer-events-none absolute left-3 top-3 text-secondary" />
        <input
          id="geo-search"
          value={value ? value.display_name : q}
          onChange={(e) => {
            onPick(null);
            setQ(e.target.value);
            onQueryChange?.();
          }}
          placeholder="Search for a place — e.g. Kolkata"
          className="w-full rounded-md border border-line bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-forest focus:outline-none"
          autoComplete="off"
          role="combobox"
          aria-expanded={(data?.length ?? 0) > 0}
        />
      </div>
      {isFetching ? <Skeleton className="mt-2 h-16" /> : null}
      {!value && data && data.length > 0 ? (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-md border border-line bg-surface" role="listbox" aria-label="Matching regions">
          {data.map((r) => (
            <li key={r.region_id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onPick(r)}
                className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-ivory"
              >
                <span>
                  <span className="block font-medium text-ink">{r.display_name}</span>
                  <span className="block text-xs text-secondary">
                    {[r.admin_level, r.country_code].filter(Boolean).join(" · ")}
                    {r.approximate ? " · preview boundary" : ""}
                  </span>
                </span>
                <span className="mt-0.5 shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] text-secondary">
                  {r.admin_level ?? "region"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!value && debounced.trim().length >= 3 && !isFetching && data?.length === 0 ? (
        <p className="mt-2 text-sm text-secondary" role="status">
          No recognized regions found. Try a city, district, state, or country name.
        </p>
      ) : null}
      {!value && q.trim().length > 0 && q.trim().length < 3 ? (
        <p className="mt-2 text-xs text-secondary" role="status">
          Type at least 3 characters to search.
        </p>
      ) : null}
    </div>
  );
}
