/**
 * Serve storage files via /api/v1/files/ to bypass nginx /storage block.
 */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export function getFileUrl(rawPath: string | null | undefined): string | null {
  if (!rawPath) return null;
  if (rawPath.startsWith("http") || rawPath.startsWith("data:")) return rawPath;
  // Strip leading slash and optional "storage/" prefix (handles both DB-stored relative paths
  // and full-path strings like "/storage/products/xxx.jpg")
  const clean = rawPath.replace(/^\//, "").replace(/^storage\//, "");
  return `${API_URL}/files/${clean}`;
}

export function getProductImgUrl(product: any): string | null {
  const path =
    product?.primary_image?.file_path ??
    product?.images?.[0]?.file_path ??
    product?.images?.[0]?.image_path ??
    product?.image_path ??
    null;
  return getFileUrl(path);
}
