"use client";

/**
 * OrderRouteMap.tsx
 *
 * Komponen peta interaktif untuk menampilkan rute pengiriman:
 *   - 📍 Lokasi driver saat ini (biru)
 *   - 🟢 Titik jemput (pickup) — toko UMKM (hijau)
 *   - 🔴 Titik antar (delivery) — alamat customer (merah)
 *
 * Menggunakan Leaflet via react-leaflet (sudah tersedia di project).
 */

import { useEffect, useRef } from "react";

interface Point {
  lat: number;
  lng: number;
  label: string;
  color: "blue" | "green" | "red";
  info?: string;
}

interface OrderRouteMapProps {
  /** Titik-titik yang akan ditampilkan di peta */
  points: Point[];
  /** Tinggi peta, default 320px */
  height?: string;
}

function createColoredMarker(color: "blue" | "green" | "red"): string {
  if (color === "blue") {
    // Google Maps style blue dot dengan pulse ring berdenyut
    return `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <!-- Denyut transparan luar -->
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: rgba(59, 130, 246, 0.4);
          animation: map-pulse 2s infinite ease-out;
        "></div>
        <!-- Dot biru inti dengan border putih -->
        <div style="
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: #2563EB;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        "></div>
        <style>
          @keyframes map-pulse {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(2.4); opacity: 0; }
          }
        </style>
      </div>
    `;
  }

  const colors = {
    green: { bg: "#22C55E", border: "#15803D" },
    red:   { bg: "#EF4444", border: "#B91C1C" },
  };
  const { bg, border } = colors[color as "green" | "red"];
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
            fill="${bg}" stroke="${border}" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
    </svg>
  `;
}

export function OrderRouteMap({ points, height = "320px" }: OrderRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const container = containerRef.current;
    let mapInstance: any = null;
    let cancelled = false;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css" as any);

      // Komponen di-unmount sebelum leaflet selesai load
      if (cancelled || !container) return;

      // Bersihkan Leaflet state yang tertinggal di container (strict mode double-invoke)
      // @ts-ignore
      if (container._leaflet_id != null) return;

      // Fix default icon path
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      mapInstance = L.map(container, {
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstance);

      const latlngs: [number, number][] = [];

      points.forEach((point) => {
        const iconSvg = createColoredMarker(point.color);
        const isBlueDot = point.color === "blue";

        const icon = L.divIcon({
          html: iconSvg,
          className: "",
          iconSize: isBlueDot ? [24, 24] : [28, 36],
          iconAnchor: isBlueDot ? [12, 12] : [14, 36],
          popupAnchor: isBlueDot ? [0, -12] : [0, -36],
        });

        const marker = L.marker([point.lat, point.lng], { icon }).addTo(mapInstance);

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 150px;">
            <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">${point.label}</p>
            ${point.info ? `<p style="font-size: 12px; color: #6B7280; margin: 0;">${point.info}</p>` : ""}
          </div>
        `;
        marker.bindPopup(popupContent);
        latlngs.push([point.lat, point.lng]);
      });

      // Dapatkan titik-titik berdasarkan tipe warnanya
      const driverPt = points.find(p => p.color === "blue");
      const pickupPt = points.find(p => p.color === "green");
      const deliverPt = points.find(p => p.color === "red");

      // ─── FUNGSI HELPER UNTUK MENGGAMBAR RUTE OSRM CAR ───
      const drawRoute = (start: Point, end: Point, color: string, isDash = false) => {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=false`;

        fetch(osrmUrl)
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;
            if (data.code === "Ok" && data.routes && data.routes[0]) {
              const geojson = data.routes[0].geometry;
              const routeLatLngs = geojson.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
              
              L.polyline(routeLatLngs, {
                color: color,
                weight: 6,
                opacity: 0.85,
                dashArray: isDash ? "6, 6" : undefined
              }).addTo(mapInstance);
            } else {
              // Fallback garis lurus jika OSRM gagal
              L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
                color: color,
                weight: 4,
                opacity: 0.7,
                dashArray: "8, 6"
              }).addTo(mapInstance);
            }
          })
          .catch(() => {
            if (cancelled) return;
            L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
              color: color,
              weight: 4,
              opacity: 0.7,
              dashArray: "8, 6"
            }).addTo(mapInstance);
          });
      };

      // ─── GAMBAR RUTE BERDASARKAN SEGMEN PERJALANAN ───
      
      // 1. Segmen Driver ke Toko (Jalur Jemput - Hijau Emerald)
      if (driverPt && pickupPt) {
        drawRoute(driverPt, pickupPt, "#10B981"); // Hijau Emerald
      }

      // 2. Segmen Toko ke Customer (Jalur Antar - Biru Google Maps)
      if (pickupPt && deliverPt) {
        drawRoute(pickupPt, deliverPt, "#1C64F2"); // Biru Google Maps
      } else if (driverPt && deliverPt && !pickupPt) {
        // Fallback jika tidak ada toko (langsung driver ke customer)
        drawRoute(driverPt, deliverPt, "#1C64F2");
      }

      // Fit bounds ke semua titik
      if (latlngs.length > 0) {
        mapInstance.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      }
    };

    initMap();

    // Cleanup: hapus instance peta agar container bisa dipakai ulang
    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    };
  // Hanya jalankan ulang saat titik berubah
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: "12px", overflow: "hidden" }}
      className="z-0"
    />
  );
}

export type { Point as MapPoint };
