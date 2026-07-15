"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  defaultLat?: number | null;
  defaultLng?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function MapPicker({ defaultLat, defaultLng, onChange, height = "320px" }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState(false);

  // State untuk pencarian alamat
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const defaultCenter: [number, number] = [-6.8, 107.5]; // default: Jawa Barat

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;
    let L: any;

    const init = async () => {
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css" as any);

      // React StrictMode mounts twice — bail out if cleanup already ran
      if (cancelled || !mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startLat = defaultLat ?? defaultCenter[0];
      const startLng = defaultLng ?? defaultCenter[1];

      const map = L.map(mapRef.current!).setView([startLat, startLng], defaultLat ? 16 : 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChange(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        onChange(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setLoading(false);

      if (!defaultLat || !defaultLng) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              map.setView([latitude, longitude], 16);
              marker.setLatLng([latitude, longitude]);
              onChange(latitude, longitude);
            },
            () => setGpsError(true),
            { timeout: 8000 }
          );
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fungsi fetch auto-suggest alamat
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=id`,
          { signal: abortControllerRef.current.signal }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Gagal mencari alamat:", err);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 600);
  };

  const selectSuggestion = (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lon], 16);
      markerRef.current.setLatLng([lat, lon]);
      onChange(lat, lon);
    }

    setSearchQuery(s.display_name);
    setSuggestions([]);
  };

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setGpsError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 16);
        markerRef.current?.setLatLng([latitude, longitude]);
        onChange(latitude, longitude);
      },
      () => setGpsError(true),
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
      {/* Search Input overlay */}
      <div className="absolute top-3 left-14 right-3 z-[1000] max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex flex-col">
        <div className="flex items-center px-2 py-1">
          <svg className="w-4 h-4 text-gray-400 shrink-0 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari kelurahan, jalan, atau gedung..."
            className="w-full text-xs bg-transparent focus:outline-none text-gray-700"
          />
          {searchLoading && (
            <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin shrink-0 ml-1.5" />
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="text-gray-400 hover:text-gray-600 ml-1.5 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Suggestion list */}
        {suggestions.length > 0 && (
          <div className="border-t border-gray-100 max-h-48 overflow-y-auto py-1">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 flex items-start gap-2 border-b border-gray-50 last:border-0"
              >
                <svg className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[1001]">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-600" />
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      
      {/* GPS Button */}
      <button
        type="button"
        onClick={handleGps}
        className="absolute bottom-3 right-3 z-[1000] bg-white rounded-lg shadow-md px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 flex items-center gap-1.5 animate-bounce-subtle"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        GPS Saya
      </button>
      
      {gpsError && (
        <p className="absolute bottom-12 right-3 z-[1000] bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-200">
          GPS tidak tersedia
        </p>
      )}
    </div>
  );
}
