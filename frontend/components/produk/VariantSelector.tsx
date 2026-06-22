"use client";
import { useState } from "react";

export function VariantSelector({ variasi }: { variasi: string[] }) {
  const [selected, setSelected] = useState(variasi[0]);

  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-gray-500 mb-1.5">Pilih Varian</p>
      <div className="flex flex-wrap gap-1.5">
        {variasi.map((v) => (
          <button
            key={v}
            onClick={() => setSelected(v)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              selected === v
                ? "text-white border-transparent"
                : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
            }`}
            style={selected === v ? { background: "var(--primary)" } : {}}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
