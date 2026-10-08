/**
 * Serve storage files via /api/v1/files/ to bypass nginx /storage block.
 */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export function getFileUrl(rawPath: string | null | undefined): string | null {
  if (!rawPath) return null;
  if (rawPath.startsWith("http") || rawPath.startsWith("data:")) return rawPath;
  const clean = rawPath.replace(/^\//, "").replace(/^storage\//, "");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isPrivateDoc = clean.startsWith("private/") || clean.startsWith("umkm-documents/");
  const queryParam = isPrivateDoc && token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_URL}/files/${clean}${queryParam}`;
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
