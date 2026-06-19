import Link from "next/link";
import { StarIcon } from "@/components/ui/StarIcon";
import type { Produk } from "@/lib/data/dummy";

type Product = Produk & { tokoSlug: string; tokNama: string; tokoPemilik: string };

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const fotoBg = product.foto
    ? `url('${product.foto}')`
    : `linear-gradient(135deg, var(--primary-muted), #B7E4C7)`;

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 min-w-0"
    >
      <div
        className="aspect-square relative overflow-hidden"
        style={{
          backgroundImage: fotoBg,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!compact && product.terjual > 300 && (
          <span
            className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: "var(--accent-dark)" }}
          >
            TERLARIS
          </span>
        )}
      </div>

      <div className="p-3 min-w-0">
        <p className="text-xs text-gray-400 truncate mb-0.5">{product.tokNama}</p>
        <h3
          className={`font-semibold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-green-700 transition-colors leading-snug ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {product.nama}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <StarIcon size={compact ? "sm" : "md"} />
          <span className="text-xs text-gray-500">{product.rating}</span>
          {!compact && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                {product.terjual.toLocaleString("id")} terjual
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
            Rp {product.harga.toLocaleString("id-ID")}
          </p>
          {!compact && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-lg font-light shrink-0"
              style={{ background: "var(--primary)" }}
            >
              +
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
