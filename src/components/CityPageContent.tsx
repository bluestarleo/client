"use client";

import { useState } from "react";
import Link from "next/link";
import { CityGroup, Article } from "@/lib/db";
import MapWrapper from "@/components/MapWrapper";

interface CityPageContentProps {
  group: CityGroup;
  articles: Article[];
}

export default function CityPageContent({ group, articles }: CityPageContentProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

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
                  onClick={() => setSelectedArticle(article)}
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
        />
      </main>
    </div>
  );
}
