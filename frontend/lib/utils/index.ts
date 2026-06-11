// Format angka ke Rupiah
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format tanggal ke Indonesia
export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

// Format tanggal + jam
export const formatDateTime = (date: string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Singkat angka besar (1.2rb, 5jt, dll)
export const formatShortNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}jt`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}rb`
  return String(num)
}

// Slug dari string
export const toSlug = (str: string): string =>
  str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
