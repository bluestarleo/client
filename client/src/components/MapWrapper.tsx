import dynamic from "next/dynamic";
import { Article } from "@/lib/db";

// Dynamic import prevents rendering on server where 'window' is undefined
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--card)] rounded-xl border border-[var(--muted-border)] min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[var(--muted)] text-sm font-medium">Loading Interactive Map...</span>
      </div>
    </div>
  ),
});

import { CustomMarker, NearbyPoi } from "./MapComponent";

interface MapWrapperProps {
  articles: Article[];
  selectedArticle: Article | null;
  cityId: number;
  customMarker: CustomMarker | null;
  pois: NearbyPoi[];
}

export default function MapWrapper({ articles, selectedArticle, cityId, customMarker, pois }: MapWrapperProps) {
  return (
    <DynamicMap
      articles={articles}
      selectedArticle={selectedArticle}
      cityId={cityId}
      customMarker={customMarker}
      pois={pois}
    />
  );
}
