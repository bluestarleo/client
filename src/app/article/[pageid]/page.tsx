import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ pageid: string }>;
  searchParams: Promise<{ cityId?: string }>;
}

interface WikipediaPageResponse {
  pageid: number;
  title: string;
  extract?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  coordinates?: Array<{
    lat: number;
    lon: number;
  }>;
  fullurl?: string;
}

// Fetch helper that runs on the Next.js server side
async function getWikipediaPageDetails(pageid: string): Promise<WikipediaPageResponse | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|coordinates|info&inprop=url&pageids=${pageid}&pithumbsize=1000&format=json`;
  
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AITravelCompanionClient/1.0 (contact: leo.zhu@example.com)"
      },
      next: { revalidate: 3600 } // Cache results for 1 hour
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (!data.query || !data.query.pages || !data.query.pages[pageid]) {
      return null;
    }
    
    return data.query.pages[pageid];
  } catch (error) {
    console.error("Error fetching page details from Wikipedia API:", error);
    return null;
  }
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { pageid } = await params;
  const { cityId } = await searchParams;
  
  const article = await getWikipediaPageDetails(pageid);
  
  if (!article) {
    return notFound();
  }

  // Construct back link: defaults to homepage if no cityId is provided
  const backLink = cityId ? `/city/${cityId}` : "/";
  const coordinates = article.coordinates?.[0];

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <nav className="mb-8">
          <Link
            href={backLink}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Back to Destination List
          </Link>
        </nav>

        {/* Article Container */}
        <article className="bg-[var(--card)] rounded-3xl border border-[var(--muted-border)] overflow-hidden shadow-sm">
          {/* Hero Image Banner */}
          {article.thumbnail ? (
            <div className="w-full h-[350px] md:h-[450px] relative overflow-hidden border-b border-[var(--muted-border)]">
              <img
                src={article.thumbnail.source}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 md:left-10 text-white">
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
                  {article.title}
                </h1>
                {coordinates && (
                  <p className="font-mono text-sm opacity-90">
                    📍 Coordinates: ({coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)})
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-12 border-b border-[var(--muted-border)] bg-blue-500/5">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--foreground)] mb-3">
                {article.title}
              </h1>
              {coordinates && (
                <p className="font-mono text-sm text-[var(--muted)]">
                  📍 Coordinates: ({coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)})
                </p>
              )}
            </div>
          )}

          {/* Details Body */}
          <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8">
            {/* Left Content Area */}
            <div className="flex-1">
              <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
                Article Overview
              </h2>
              
              {article.extract ? (
                // Wikipedia API extracts return structured HTML tags (<p>, <ul>, etc.)
                <div 
                  className="prose dark:prose-invert max-w-none text-base leading-relaxed text-[var(--foreground)] space-y-4"
                  dangerouslySetInnerHTML={{ __html: article.extract }}
                />
              ) : (
                <p className="text-[var(--muted)]">
                  No article overview is currently available for this location.
                </p>
              )}
            </div>

            {/* Right Meta Column */}
            <div className="w-full md:w-[280px] flex-shrink-0 flex flex-col gap-6">
              {/* Quick Info Box */}
              <div className="bg-[var(--background)] rounded-2xl border border-[var(--muted-border)] p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
                  Quick Details
                </h3>
                <ul className="flex flex-col gap-3.5 text-sm">
                  {coordinates && (
                    <>
                      <li>
                        <span className="block text-xs text-[var(--muted)]">Latitude</span>
                        <span className="font-semibold font-mono">{coordinates.lat}</span>
                      </li>
                      <li>
                        <span className="block text-xs text-[var(--muted)]">Longitude</span>
                        <span className="font-semibold font-mono">{coordinates.lon}</span>
                      </li>
                    </>
                  )}
                  {article.fullurl && (
                    <li className="pt-2 border-t border-[var(--muted-border)]">
                      <a
                        href={article.fullurl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-center text-xs transition-colors"
                      >
                        Open on Wikipedia ↗
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
