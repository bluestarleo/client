"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { Article } from "@/lib/db";

// Fix for default Leaflet marker icon paths in Next.js / Webpack bundling
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper component to update map view dynamically
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

export interface CustomMarker {
  lat: number;
  lon: number;
  label: string;
}

interface MapComponentProps {
  articles: Article[];
  selectedArticle: Article | null;
  cityId: number;
  customMarker: CustomMarker | null;
}

export default function MapComponent({ articles, selectedArticle, cityId, customMarker }: MapComponentProps) {
  // Fallback center is Tokyo coordinates if no articles are present
  const defaultCenter: [number, number] = [35.6895, 139.6917];
  
  // Calculate center of map: either the custom marker, the selected article, or average coordinates of all articles
  const getMapCenter = (): [number, number] => {
    if (customMarker) {
      return [customMarker.lat, customMarker.lon];
    }
    if (selectedArticle) {
      return [selectedArticle.lat, selectedArticle.lon];
    }
    if (articles.length > 0) {
      const avgLat = articles.reduce((sum, a) => sum + a.lat, 0) / articles.length;
      const avgLon = articles.reduce((sum, a) => sum + a.lon, 0) / articles.length;
      return [avgLat, avgLon];
    }
    return defaultCenter;
  };

  const center = getMapCenter();
  const zoom = customMarker ? 16 : selectedArticle ? 15 : 13;

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-[var(--muted-border)] shadow-md">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Custom Searched Marker */}
        {customMarker && (
          <Marker
            position={[customMarker.lat, customMarker.lon]}
            icon={L.divIcon({
              html: `<div class="relative flex items-center justify-center">
                       <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-rose-400 opacity-75"></span>
                       <span class="relative flex h-4.5 w-4.5 rounded-full bg-rose-600 border-2 border-white shadow-md"></span>
                     </div>`,
              className: "custom-marker-icon-wrapper",
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <div className="p-2 max-w-[200px]">
                <h4 className="font-bold text-sm text-rose-600 flex items-center gap-1.5">
                  📍 <span>Searched Location</span>
                </h4>
                <p className="text-xs text-[var(--muted)] mt-1 font-medium">{customMarker.label}</p>
                <div className="text-[10px] font-mono text-[var(--muted)]/70 mt-1">
                  ({customMarker.lat.toFixed(4)}, {customMarker.lon.toFixed(4)})
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {articles.map((article) => (
          <Marker
            key={article.pageid}
            position={[article.lat, article.lon]}
            eventHandlers={{
              click: () => {
                // You can add interactive marker events here if needed
              },
            }}
          >
            <Popup className="leaflet-popup-custom">
              <div className="flex flex-col gap-2 p-1 max-w-[240px]">
                {article.thumbnail && (
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-28 object-cover rounded-md"
                  />
                )}
                <h4 className="font-bold text-sm text-[var(--foreground)]">{article.title}</h4>
                <p className="text-xs text-[var(--muted)] line-clamp-3">
                  {article.extract || "No description available."}
                </p>
                <Link
                  href={`/article/${article.pageid}?cityId=${cityId}`}
                  className="mt-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs font-semibold transition-colors"
                >
                  Read More
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
