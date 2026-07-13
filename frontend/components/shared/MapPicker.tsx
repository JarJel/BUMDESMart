"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  defaultLat?: number | null;
  defaultLng?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

export default function MapPicker({ defaultLat, defaultLng, onChange, height = "260px" }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState(false);

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

      const map = L.map(mapRef.current!).setView([startLat, startLng], defaultLat ? 15 : 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-600" />
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      <button
        type="button"
        onClick={handleGps}
        className="absolute bottom-3 right-3 z-[1000] bg-white rounded-lg shadow-md px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 flex items-center gap-1.5"
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
      <p className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm text-xs text-gray-600 px-2 py-1 rounded shadow-sm">
        Klik peta atau seret pin untuk atur lokasi
      </p>
    </div>
  );
}
