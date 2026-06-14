"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { Article, CustomMarker, NearbyPoi } from "@/lib/db";

// Fix for default Leaflet marker icon paths in Next.js / Webpack bundling
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Controller component to update map view and fit bounds dynamically
function MapController({
  center,
  zoom,
  customMarker,
  pois
}: {
  center: [number, number];
  zoom: number;
  customMarker: CustomMarker | null;
  pois: NearbyPoi[];
}) {
  const map = useMap();

  useEffect(() => {
    if (customMarker && pois.length > 0) {
      const bounds = L.latLngBounds([L.latLng(customMarker.lat, customMarker.lon)]);
      pois.forEach((poi) => {
        bounds.extend(L.latLng(poi.lat, poi.lon));
      });
      // Add padding so all pins fit comfortably in view
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.2 });
    } else {
      map.setView(center, zoom, { animate: true, duration: 1.0 });
    }
  }, [center, zoom, customMarker, pois, map]);

  return null;
}

interface MapComponentProps {
  articles: Article[];
  selectedArticle: Article | null;
  cityId: number;
  customMarker: CustomMarker | null;
  pois: NearbyPoi[];
  onSelectArticle: (article: Article | null) => void;
}

export default function MapComponent({ articles, selectedArticle, cityId, customMarker, pois, onSelectArticle }: MapComponentProps) {
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

  // Custom pulsating amber/gold icon for the selected POI
  const selectedMarkerIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center animate-bounce">
             <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-amber-400 opacity-75"></span>
             <span class="relative flex h-4.5 w-4.5 rounded-full bg-amber-500 border-2 border-white shadow-md"></span>
           </div>`,
    className: "selected-poi-marker-icon-wrapper",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Custom default icon for POIs to avoid Leaflet default bundling issues in Next.js
  const defaultMarkerIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center hover:scale-110 transition-transform">
             <span class="relative flex h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white shadow-md"></span>
           </div>`,
    className: "default-poi-marker-icon-wrapper",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-[var(--muted-border)] shadow-md">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={center} zoom={zoom} customMarker={customMarker} pois={pois} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Custom Searched Marker */}
        {customMarker && (
          <Marker
            position={[customMarker.lat, customMarker.lon]}
            icon={L.divIcon({
              html: `<div class="relative flex items-center justify-center animate-pulse">
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

        {/* Nearby OSM POIs */}
        {customMarker && pois.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.lat, poi.lon]}
            icon={L.divIcon({
              html: `<div class="relative flex items-center justify-center hover:scale-110 transition-transform">
                       <span class="absolute inline-flex h-5 w-5 rounded-full bg-emerald-400 opacity-50"></span>
                       <span class="relative flex h-3 w-3 rounded-full bg-emerald-500 border border-white shadow-sm"></span>
                     </div>`,
              className: "poi-marker-icon-wrapper",
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="p-2 max-w-[200px]">
                <h4 className="font-bold text-xs text-emerald-600">{poi.name}</h4>
                <span className="inline-block text-[9px] font-semibold text-[var(--muted)] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-0.5">
                  {poi.category}
                </span>
                <div className="text-[10px] text-[var(--muted)] mt-2 pt-2 border-t border-[var(--muted-border)] flex items-center gap-1">
                  <span>🚶‍♂️</span>
                  <span>{poi.walkingTime} min walk ({poi.distance}m)</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {articles.map((article) => {
          const isSelected = selectedArticle?.pageid === article.pageid;
          return (
            <Marker
              key={`${article.pageid}-${isSelected ? 'selected' : 'default'}`}
              position={[article.lat, article.lon]}
              icon={isSelected ? selectedMarkerIcon : defaultMarkerIcon}
              eventHandlers={{
                click: () => {
                  onSelectArticle(article);
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
                  {article.category && (
                    <span className="inline-block text-[9px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded self-start">
                      {article.category}
                    </span>
                  )}
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
          );
        })}
      </MapContainer>
    </div>
  );
}
