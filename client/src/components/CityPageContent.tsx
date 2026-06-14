"use client";

import { useState } from "react";
import Link from "next/link";
import { CityGroup, Article } from "@/lib/db";
import MapWrapper from "@/components/MapWrapper";
import { CustomMarker } from "@/components/MapComponent";

interface CityPageContentProps {
  group: CityGroup;
  articles: Article[];
}

export default function CityPageContent({ group, articles }: CityPageContentProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [address, setAddress] = useState("");
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [customMarker, setCustomMarker] = useState<CustomMarker | null>(null);

  const handleGeocodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAddress = address.trim();
    if (!trimmedAddress) return;

    setGeocodeLoading(true);
    setGeocodeError(null);

    try {
      // Contextualize search to current city
      const query = `${trimmedAddress}, ${group.name}`;
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Address not found.");
      }

      const data = await res.json();
      setCustomMarker({
        lat: data.lat,
        lon: data.lon,
        label: trimmedAddress,
      });
      setSelectedArticle(null); // Shift map focus to geocoded marker
      setAddress("");
    } catch (err: any) {
      setGeocodeError(err.message || "Failed to locate address.");
    } finally {
      setGeocodeLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[var(--background)] overflow-hidden">
      {/* Sidebar - Left Section */}
      <aside className="w-full md:w-[35%] flex flex-col border-r border-[var(--muted-border)] bg-[var(--card)] h-[45vh] md:h-screen shadow-sm z-10">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-[var(--muted-border)] flex-shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-500 hover:text-blue-600 mb-4 transition-colors"
          >
            ← Back to Destinations
          </Link>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] leading-tight mb-2">
            {group.name}
          </h1>
          <p className="text-sm text-[var(--muted)] line-clamp-3">
            {group.description || "Discover points of interest and landmarks."}
          </p>

          {/* Location-Input Utility */}
          <form onSubmit={handleGeocodeSubmit} className="mt-5 pt-4 border-t border-[var(--muted-border)] flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
              <span>📍</span> Locate Custom Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={geocodeLoading}
                  placeholder="e.g. Hotel, Station, Restaurant..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--muted-border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
                {geocodeLoading && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={geocodeLoading || !address.trim()}
                className="px-3 py-2 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {geocodeLoading ? "Searching..." : "Search"}
              </button>
            </div>
            
            {geocodeError && (
              <p className="text-[10px] text-rose-500 font-medium mt-0.5">⚠️ {geocodeError}</p>
            )}
            
            {customMarker && (
              <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/10 rounded-lg p-2.5 mt-1 animate-fadeIn">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-semibold text-rose-600 truncate">📍 {customMarker.label}</span>
                  <span className="text-[9px] text-[var(--muted)] font-mono">({customMarker.lat.toFixed(4)}, {customMarker.lon.toFixed(4)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomMarker(null)}
                  className="text-[9px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider pl-2"
                >
                  Clear
                </button>
              </div>
            )}
          </form>
        </div>

        {/* POI List Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
            Points of Interest ({articles.length})
          </h3>
          
          {articles.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted)] text-sm">
              No points of interest available.
            </div>
          ) : (
            articles.map((article) => {
              const isSelected = selectedArticle?.pageid === article.pageid;
              return (
                <button
                  key={article.pageid}
                  onClick={() => {
                    setSelectedArticle(article);
                    setCustomMarker(null); // Clear custom search focus
                  }}
                  className={`flex gap-3 text-left p-3 rounded-xl transition-all border outline-none ${
                    isSelected
                      ? "bg-blue-500/5 border-blue-500 shadow-sm"
                      : "bg-[var(--card)] border-[var(--muted-border)] hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {article.thumbnail && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--muted-border)]">
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[var(--foreground)] truncate">
                      {article.title}
                    </h4>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">
                      {article.extract || "No description available."}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        ({article.lat.toFixed(4)}, {article.lon.toFixed(4)})
                      </span>
                      <Link
                        href={`/article/${article.pageid}?cityId=${group.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-wider"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Map View - Right Section */}
      <main className="flex-1 h-[55vh] md:h-screen p-4 md:p-6 relative">
        <MapWrapper
          articles={articles}
          selectedArticle={selectedArticle}
          cityId={group.id}
          customMarker={customMarker}
        />
      </main>
    </div>
  );
}
