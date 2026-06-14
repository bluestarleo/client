import Link from "next/link";
import { db, CityGroup } from "@/lib/db";
import Footer from "@/components/Footer";

// Force Next.js to not static cache this since SQLite data changes via worker script
export const dynamic = "force-dynamic";

export default function Home() {
  // Fetch city groups with count of articles
  const groups: CityGroup[] = db.prepare(`
    SELECT g.*, COUNT(a.id) as article_count 
    FROM groups g 
    LEFT JOIN articles a ON g.id = a.group_id 
    GROUP BY g.id
    ORDER BY g.name ASC
  `).all() as CityGroup[];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--background)] pt-12 pb-8 px-6 md:px-12 lg:px-24">
      <div className="flex-grow">
      {/* Header section */}
      <header className="max-w-6xl mx-auto mb-16 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-semibold mb-4 border border-blue-500/20">
          📍 AI Travel Companion
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-4">
          Explore Your Next Adventure
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl">
          Browse active travel destinations, discover historical points of interest, and explore detailed article briefs pulled directly from Wikipedia.
        </p>
      </header>

      {/* Main content area */}
      <main className="max-w-6xl mx-auto">
        {groups.length === 0 ? (
          <div className="text-center py-20 bg-[var(--card)] rounded-2xl border border-[var(--muted-border)] p-8">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold mb-2">No Destinations Found</h3>
            <p className="text-[var(--muted)] mb-6">
              It looks like your travel database is currently empty. Run the worker agent to populate destinations!
            </p>
            <div className="bg-slate-800/50 rounded-lg p-3 inline-block font-mono text-sm border border-[var(--muted-border)] text-left">
              &amp; python worker/agent.py "Rome"
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/city/${group.id}`}
                className="group flex flex-col justify-between bg-[var(--card)] border border-[var(--muted-border)] hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-[var(--muted)]">
                      Destination #{group.id}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/10">
                      {group.article_count} POIs
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)] group-hover:text-blue-500 transition-colors mb-2">
                    {group.name}
                  </h2>
                  <p className="text-sm text-[var(--muted)] line-clamp-3">
                    {group.description || "Explore details and key attractions in this area."}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-blue-500 group-hover:gap-2.5 transition-all">
                  <span>Explore City</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      </div>

      <Footer />
    </div>
  );
}
