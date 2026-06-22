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

      <div className={`min-w-0 ${compact ? "p-2" : "p-3"}`}>
        <p className="text-xs text-gray-400 truncate mb-0.5 leading-none">{product.tokNama}</p>
        <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-green-700 transition-colors leading-snug">
          {product.nama}
        </h3>
        <div className="flex items-center gap-0.5 mb-1">
          <StarIcon size="sm" />
          <span className="text-xs text-gray-500">{product.rating}</span>
        </div>
        <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>
          Rp {product.harga.toLocaleString("id-ID")}
        </p>
      </div>
    </Link>
  );
}
