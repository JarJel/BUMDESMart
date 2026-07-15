"use client";

interface VariantOption {
  id: number;
  product_variant_id: number;
  value: string;
  price: number | string;
  stock: number;
}

interface Variant {
  id: number;
  product_id: number;
  name: string;
  options: VariantOption[];
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

export function VariantSelector({ variants, selectedId, onChange }: VariantSelectorProps) {
  return (
    <div className="space-y-4 mt-4">
      {variants.map((v) => (
        <div key={v.id}>
          <p className="text-xs font-semibold text-gray-500 mb-2">{v.name}</p>
          <div className="flex flex-wrap gap-2">
            {(v.options || []).map((opt) => {
              const isSelected = selectedId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChange(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "text-white border-transparent shadow-sm"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                  }`}
                  style={isSelected ? { background: "var(--primary)" } : {}}
                >
                  {opt.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
