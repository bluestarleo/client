"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CityGroup, Article } from "@/lib/db";
import MapWrapper from "@/components/MapWrapper";
import { CustomMarker, NearbyPoi } from "@/components/MapComponent";

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

  // History & Nearby POI States
  const [history, setHistory] = useState<CustomMarker[]>([]);
  const [pois, setPois] = useState<NearbyPoi[]>([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [poisError, setPoisError] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`search_history_${group.id}`);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, [group.id]);

  const addToHistory = (newMarker: CustomMarker) => {
    setHistory((prev) => {
      // Remove duplicate labels (ignoring case)
      const filtered = prev.filter(
        (item) => item.label.toLowerCase() !== newMarker.label.toLowerCase()
      );
      const updated = [newMarker, ...filtered].slice(0, 10);
      localStorage.setItem(`search_history_${group.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const fetchNearbyPois = async (lat: number, lon: number) => {
    setPoisLoading(true);
    setPoisError(null);
    setPois([]);

    try {
      const res = await fetch(`/api/nearby-pois?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch nearby points of interest.");
      }
      const data = await res.json();
      setPois(data.pois || []);
    } catch (err: any) {
      setPoisError(err.message || "Failed to load points of interest.");
    } finally {
      setPoisLoading(false);
    }
  };

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
      const newMarker: CustomMarker = {
        lat: data.lat,
        lon: data.lon,
        label: trimmedAddress,
      };

      setCustomMarker(newMarker);
      addToHistory(newMarker);
      setSelectedArticle(null); // Shift map focus to geocoded marker
      setAddress("");

      // Fetch nearby POIs for this location
      await fetchNearbyPois(data.lat, data.lon);
    } catch (err: any) {
      setGeocodeError(err.message || "Failed to locate address.");
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleHistoryClick = async (marker: CustomMarker) => {
    setCustomMarker(marker);
    setSelectedArticle(null);
    setGeocodeError(null);
    addToHistory(marker); // Move to top

    // Fetch POIs for coordinates
    await fetchNearbyPois(marker.lat, marker.lon);
  };

  const handleClearSearch = () => {
    setCustomMarker(null);
    setPois([]);
    setGeocodeError(null);
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
                className="px-3 py-2 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center min-w-[70px]"
              >
                {geocodeLoading ? "Searching..." : "Search"}
              </button>
            </div>
            
            {geocodeError && (
              <p className="text-[10px] text-rose-500 font-medium mt-0.5">⚠️ {geocodeError}</p>
            )}

            {/* Search History */}
            {history.length > 0 && (
              <div className="mt-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Recent Searches
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                  {history.map((item, idx) => (
                    <button
                      key={`hist-${idx}`}
                      type="button"
                      disabled={geocodeLoading}
                      onClick={() => handleHistoryClick(item)}
                      className="text-[10px] px-2.5 py-1 bg-[var(--background)] border border-[var(--muted-border)] hover:border-blue-400 hover:text-blue-500 rounded-md transition-all text-left truncate max-w-[140px] text-[var(--foreground)] disabled:opacity-50"
                      title={item.label}
                    >
                      🕒 {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {customMarker && (
              <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/10 rounded-lg p-2.5 mt-1 animate-fadeIn">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-semibold text-rose-600 truncate">📍 {customMarker.label}</span>
                  <span className="text-[9px] text-[var(--muted)] font-mono">({customMarker.lat.toFixed(4)}, {customMarker.lon.toFixed(4)})</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
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
          {/* Nearby OSM POIs (When a custom marker search is active) */}
          {customMarker && (
            <div className="flex flex-col gap-2 mb-4 border-b border-[var(--muted-border)] pb-4">
              <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center justify-between">
                <span>📍 Nearby Places ({pois.length})</span>
                {pois.length > 0 && <span className="text-[9px] text-[var(--muted)] lowercase font-normal">within ~40 min walk</span>}
              </h3>
              
              {poisLoading ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-[var(--muted)]">Loading nearby places...</span>
                </div>
              ) : poisError ? (
                <div className="text-center py-4 text-xs text-rose-500">
                  ⚠️ {poisError}
                </div>
              ) : pois.length === 0 ? (
                <div className="text-center py-4 text-xs text-[var(--muted)]">
                  No nearby places found.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pois.map((poi) => (
                    <div
                      key={`poi-list-${poi.id}`}
                      className="flex flex-col gap-1 p-2.5 rounded-xl border border-[var(--muted-border)] bg-[var(--card)] hover:border-rose-400 dark:hover:border-rose-800 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-[var(--foreground)] leading-tight">{poi.name}</span>
                        <span className="text-[9px] font-semibold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{poi.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-[var(--muted)] mt-1">
                        <span>🚶‍♂️</span>
                        <span>{poi.walkingTime} min walk ({poi.distance}m away)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                    setPois([]); // Clear nearby OSM places
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
          pois={pois}
        />
      </main>
    </div>
  );
}
