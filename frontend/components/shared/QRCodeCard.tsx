"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export default function QRCodeCard({ slug, namaToko }: { slug: string; namaToko: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://bumdesmart.id/${slug}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">QR Code Toko</p>
      <div className="flex justify-center mb-3">
        <div className="p-3 rounded-xl border border-gray-100">
          <QRCodeSVG
            value={url}
            size={140}
            bgColor="#ffffff"
            fgColor="#1B4332"
            level="H"
            includeMargin={false}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-1 leading-relaxed break-all">{url}</p>
      <p className="text-xs text-gray-400 mb-3">Scan untuk kunjungi toko ini</p>
      <button
        onClick={copy}
        className="w-full text-xs font-semibold py-2 rounded-lg border transition-colors"
        style={{ borderColor: "var(--primary)", color: copied ? "white" : "var(--primary)", background: copied ? "var(--primary)" : "transparent" }}
      >
        {copied ? "✓ Link Disalin!" : "Salin Link Toko"}
      </button>
    </div>
  );
}
