import { StarIcon } from "@/components/ui/StarIcon";

const DEFAULT_KATEGORI = [
  "Semua Kategori",
  "Makanan & Minuman",
  "Pertanian",
  "Kerajinan",
  "Fashion",
  "Elektronik",
  "Lainnya",
];

interface FilterContentProps {
  kategori: string;
  onKategoriChange: (value: string) => void;
  hargaMax: number;
  onHargaChange: (value: number) => void;
  minRating: number;
  onRatingChange: (value: number) => void;
  onReset: () => void;
  categories?: string[];
}

export function FilterContent({
  kategori,
  onKategoriChange,
  hargaMax,
  onHargaChange,
  minRating,
  onRatingChange,
  onReset,
  categories,
}: FilterContentProps) {
  const kategoriList = categories ?? DEFAULT_KATEGORI;
  return (
    <div className="space-y-6">
      {/* Kategori */}
      <div>
        <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Kategori
        </p>
        <div className="space-y-2">
          {kategoriList.map((k) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="kategori"
                checked={kategori === k}
                onChange={() => onKategoriChange(k)}
                className="w-3.5 h-3.5 accent-green-600"
              />
              <span
                className={`text-sm ${
                  kategori === k ? "font-semibold text-green-700" : "text-gray-600"
                }`}
              >
                {k}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Harga */}
      <div>
        <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Rentang Harga
        </p>
        <input
          type="range"
          min={5000}
          max={10000000}
          step={10000}
          value={hargaMax}
          onChange={(e) => onHargaChange(Number(e.target.value))}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Rp 5.000</span>
          <span>Rp {hargaMax.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* Rating */}
      <div>
        <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Rating
        </p>
        <div className="space-y-1.5">
          {[4.5, 4.0, 3.5, 0].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => onRatingChange(r)}
                className="w-3.5 h-3.5 accent-green-600"
              />
              <span className="flex items-center gap-0.5">
                {r > 0 ? (
                  <>
                    <span className="text-xs text-gray-600">{r}+</span>
                    <StarIcon size="sm" />
                  </>
                ) : (
                  <span className="text-xs text-gray-600">Semua</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
        style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
      >
        Reset Filter
      </button>
    </div>
  );
}
