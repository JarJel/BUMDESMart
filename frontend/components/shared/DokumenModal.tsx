"use client";

import { useEffect, useState, useRef } from "react";
import type { Dokumen, DokumenType } from "@/lib/data/dummy";
import { DOKUMEN_META } from "@/lib/data/dummy";

type Props = {
  doc: Dokumen;
  onClose: () => void;
};

function buildWatermarkUrl(text: string): string {
  const lines = [text.slice(0, 30), text.slice(30)].filter(Boolean);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='110'>
    <g transform='rotate(-35 140 55)' opacity='0.13' font-family='sans-serif' font-size='11' font-weight='700' fill='%23000'>
      ${lines.map((l, i) => `<text x='10' y='${52 + i * 16}'>${l}</text>`).join("")}
    </g>
  </svg>`;
  return `data:image/svg+xml,${svg}`;
}

export function DokumenModal({ doc, onClose }: Props) {
  const meta = DOKUMEN_META[doc.type as DokumenType];
  const [blurred, setBlurred] = useState(false);
  const [userLabel, setUserLabel] = useState("BumdesMart User");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    const ts = new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
    setUserLabel(email ? `${email} · ${ts}` : `Pembeli BumdesMart · ${ts}`);
  }, []);

  // Blur saat user pindah tab
  useEffect(() => {
    const onVisibility = () => setBlurred(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Block print + keyboard shortcuts
  useEffect(() => {
    const originalPrint = window.print.bind(window);
    window.print = () => {};

    const blockKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "a", "c"].includes(key)) {
        e.preventDefault();
      }
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard?.writeText("").catch(() => {});
      }
    };

    const blockBeforePrint = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", blockKey);
    window.addEventListener("beforeprint", blockBeforePrint);
    return () => {
      window.print = originalPrint;
      window.removeEventListener("keydown", blockKey);
      window.removeEventListener("beforeprint", blockBeforePrint);
    };
  }, []);

  // Escape untuk close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const watermarkUrl = buildWatermarkUrl(userLabel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      {/* Tambahkan style print di head */}
      <style>{`@media print { .dokumen-modal-container { display: none !important; } }`}</style>

      <div
        className="dokumen-modal-container relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">{meta?.nama}</p>
            <p className="text-xs text-gray-400">{meta?.penerbit}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dokumen body */}
        <div
          ref={contentRef}
          className="relative select-none"
          style={{ userSelect: "none", WebkitUserSelect: "none" } as React.CSSProperties}
        >
          {/* Konten dokumen */}
          <div
            className={`transition-all duration-200 ${blurred ? "blur-md pointer-events-none" : ""}`}
          >
            {/* Placeholder dokumen — diganti dengan <img> atau <iframe> saat sudah ada file */}
            <div
              className="bg-gray-50 flex flex-col items-center justify-center py-16 px-6 gap-4 relative overflow-hidden"
              style={{ minHeight: "340px" }}
            >
              {/* Watermark repeating */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url("${watermarkUrl}")`,
                  backgroundRepeat: "repeat",
                  zIndex: 5,
                }}
              />

              {/* Icon dokumen */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center mb-5 shadow-sm">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div className="space-y-2 w-full max-w-xs">
                  {[
                    { label: "No. Dokumen", val: doc.nomor },
                    { label: "Penerbit", val: meta?.penerbit },
                    { label: "Tanggal Terbit", val: doc.tanggalTerbit },
                    { label: "Berlaku Hingga", val: doc.berlakuHingga ?? "Permanen" },
                    ...(doc.cakupan ? [{ label: "Cakupan", val: doc.cakupan }] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="font-semibold text-gray-800 text-right ml-4">{row.val}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 px-3 py-1.5 rounded-full text-xs font-semibold text-green-700 bg-green-100">
                  Dokumen Terverifikasi
                </div>
              </div>
            </div>
          </div>

          {/* Blur overlay saat pindah tab */}
          {blurred && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <p className="text-sm font-semibold text-gray-700">Kembali ke halaman untuk melihat dokumen</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer warning */}
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700 text-center">
            Dokumen ini dilindungi. Dilarang menyalin, mendistribusikan, atau merekam layar.
          </p>
        </div>
      </div>
    </div>
  );
}
