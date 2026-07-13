import Link from "next/link";
import { StarIcon } from "@/components/ui/StarIcon";

export function ProductCard({ product, compact = false, storeHref, highlighted = false }: {
  product: any;
  compact?: boolean;
  storeHref?: string;
  highlighted?: boolean;
}) {
  const name = product.name || product.nama || "Nama Produk";
  const price = Number(product.price || product.harga || 0);
  const rating = product.rating || "4.8";
  
  let imageUrl = "";
  if (product.primary_image?.file_path) {
    imageUrl = product.primary_image.file_path;
  } else if (product.images?.[0]?.file_path) {
    imageUrl = product.images[0].file_path;
  } else if (product.foto) {
    imageUrl = product.foto;
  }
  
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = '/' + imageUrl;
  }
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `http://localhost:8000${imageUrl}`;
  }

  const shopName = product.tokNama || product.umkm_profile?.shop_name || "BumdesMart";
  const soldCount = product.sold_count ?? product.terjual ?? 0;
  const activeDiscount = product.active_discount ?? null;
  const finalPrice = activeDiscount ? activeDiscount.discounted_price : price;
  const discountLabel = activeDiscount
    ? activeDiscount.type === "percentage"
      ? `-${Number(activeDiscount.value).toFixed(0)}%`
      : `-Rp ${Number(activeDiscount.value).toLocaleString("id-ID")}`
    : null;


  return (
    <Link
      href={storeHref ?? `/produk/${product.slug}`}
      className={`group bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 min-w-0 ${
        highlighted
          ? "border-2 border-green-400 ring-2 ring-green-300 ring-offset-1 shadow-md"
          : "border border-gray-100"
      }`}
    >
      <div className="aspect-square relative overflow-hidden bg-gray-50 flex items-center justify-center">
        <img
          src={imageUrl || 'https://placehold.co/400x400?text=No+Image'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image';
          }}
        />
        {!compact && soldCount > 300 && (
          <span
            className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: "var(--accent-dark)" }}
          >
            TERLARIS
          </span>
        )}
        {discountLabel && (
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full text-white bg-red-500">
            {discountLabel}
          </span>
        )}
      </div>

      <div className={`min-w-0 ${compact ? "p-2" : "p-3"}`}>
        <div className="flex items-center gap-1 mb-0.5">
          <p className="text-xs text-gray-400 truncate leading-none flex-1">{shopName}</p>
          {product.umkm_profile?.has_halal_cert && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 leading-none">HALAL</span>
          )}
        </div>
        <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-green-700 transition-colors leading-snug">
          {name}
        </h3>
        <div className="flex items-center gap-0.5 mb-1">
          <StarIcon size="sm" />
          <span className="text-xs text-gray-500">{rating}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>
            Rp {Number(finalPrice).toLocaleString("id-ID")}
          </p>
          {activeDiscount && (
            <p className="text-xs text-gray-400 line-through">
              Rp {price.toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
