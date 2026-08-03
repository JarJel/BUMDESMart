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
    <div className="space-y-4">
      {variants.map((v) => (
        <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1">
          {/* Label grup varian di kiri (ala Shopee) */}
          <span className="text-xs font-medium text-gray-500 min-w-[70px] shrink-0 uppercase tracking-wider">
            {v.name}
          </span>
          
          {/* List opsi varian horizontal */}
          <div className="flex flex-wrap gap-2">
            {(v.options || []).map((opt) => {
              const isSelected = selectedId === opt.id;
              const isOutOfStock = Number(opt.stock) <= 0;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onChange(opt.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer focus:outline-none select-none ${
                    isOutOfStock
                      ? "border-dashed border-gray-250 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                      : isSelected
                      ? "border-green-600 text-green-700 bg-green-50/55 shadow-sm font-bold"
                      : "border-gray-200 text-gray-700 bg-white hover:border-green-600 hover:text-green-600"
                  }`}
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
