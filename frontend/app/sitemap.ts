import { MetadataRoute } from "next";

const BASE = "https://bumdesmartnukita.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,              lastModified: new Date(), changeFrequency: "daily",   priority: 1 },
    { url: `${BASE}/produk`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/toko`,    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/mitra`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tentang`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/login`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/daftar`,  lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
  ];
}
