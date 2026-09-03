"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

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
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showGpsPrompt, setShowGpsPrompt] = useState(false);
  const toast = useToast();

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

      // Tampilkan prompt ramah jika belum ada lokasi default
      if (!defaultLat || !defaultLng) {
        if (navigator.geolocation) {
          setShowGpsPrompt(true);
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

  const requestGps = () => {
    if (!navigator.geolocation) {
      setShowGpsPrompt(false);
      toast.warning(
        "Perangkat kamu tidak mendukung GPS. Gunakan kotak pencarian di atas peta.",
        "GPS Tidak Tersedia"
      );
      return;
    }
    setGpsLoading(true);
    setShowGpsPrompt(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 16);
        markerRef.current?.setLatLng([latitude, longitude]);
        onChange(latitude, longitude);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Aktifkan izin lokasi di pengaturan browser, lalu coba lagi.",
            "Izin Lokasi Ditolak"
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.warning(
            "GPS tidak tersedia di perangkat ini. Gunakan pencarian alamat manual.",
            "GPS Tidak Tersedia"
          );
        } else {
          toast.warning(
            "Sinyal GPS lemah atau koneksi lambat. Coba lagi atau cari alamat manual.",
            "GPS Terlalu Lambat"
          );
        }
      },
      { timeout: 10000 }
    );
  };

  const handleGps = () => {
    setShowGpsPrompt(true);
  };

  return (
    <div
      className="relative border border-gray-200 overflow-hidden"
      style={{ height, borderRadius: "0.75rem" }}
    >
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

      {/* Map loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[1001]" style={{ borderRadius: "0.75rem" }}>
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-600" />
        </div>
      )}

      <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: "0.75rem", overflow: "hidden" }} />

      {/* GPS Permission Prompt — centered floating card */}
      {showGpsPrompt && (
        <div
          className="absolute inset-0 z-[1100] flex items-center justify-center p-2.5 sm:p-4 overflow-hidden"
          style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(2px)", borderRadius: "0.75rem" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[270px] sm:max-w-xs p-3.5 sm:p-4 flex flex-col items-center gap-2.5 sm:gap-3 animate-slideUp max-h-full overflow-y-auto">

            {/* Icon gradient circle */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md shrink-0"
              style={{ background: "linear-gradient(135deg, #16a34a, #4ade80)" }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {/* Title & Description */}
            <div className="text-center">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-1">Izinkan Akses Lokasi?</h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 leading-snug">
                Kami butuh GPS kamu untuk menentukan titik pengiriman secara akurat.
                Lokasi <span className="font-medium text-gray-700">hanya dipakai saat checkout</span>.
              </p>
            </div>

            {/* Info tip */}
            <div className="w-full bg-sky-50 border border-sky-100 rounded-xl p-2 sm:px-3 sm:py-2 flex items-start gap-1.5 shrink-0">
              <svg className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-[9px] sm:text-[10px] text-sky-700 leading-tight">
                Tidak ingin pakai GPS? Cari alamat lewat <span className="font-semibold">kotak pencarian</span> di atas peta.
              </p>
            </div>

            {/* Action buttons */}
            <div className="w-full flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowGpsPrompt(false)}
                className="flex-1 text-[11px] sm:text-xs font-medium text-gray-500 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Nanti Saja
              </button>
              <button
                type="button"
                onClick={requestGps}
                className="flex-1 text-[11px] sm:text-xs font-semibold text-white rounded-xl py-2 flex items-center justify-center gap-1 transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Izinkan GPS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Button */}
      <button
        type="button"
        onClick={handleGps}
        disabled={gpsLoading}
        className="absolute bottom-3 right-3 z-[1000] bg-white rounded-lg shadow-md px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-100 hover:bg-green-50 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait transition-all hover:shadow-lg"
      >
        {gpsLoading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span>Mencari...</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>GPS Saya</span>
          </>
        )}
      </button>

    </div>
  );
}
