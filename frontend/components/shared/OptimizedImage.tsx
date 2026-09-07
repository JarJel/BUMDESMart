'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  thumbnailSrc?: string;
  mediumSrc?: string;
  alt: string;
  fallbackSrc?: string;
}

// Light SVG blur placeholder (< 1KB)
const blurSvg = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3C/svg%3E`;

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  thumbnailSrc,
  mediumSrc,
  alt,
  fallbackSrc = '/images/placeholder.png',
  className = '',
  priority = false,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const { isSlowConnection } = useNetworkQuality();

  // Pilih resolusi paling efisien jika koneksi internet pengguna lambat
  React.useEffect(() => {
    if (isSlowConnection) {
      if (thumbnailSrc) {
        setImgSrc(thumbnailSrc);
      } else if (mediumSrc) {
        setImgSrc(mediumSrc);
      } else {
        setImgSrc(src);
      }
    } else {
      setImgSrc(src);
    }
  }, [isSlowConnection, src, thumbnailSrc, mediumSrc]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 p-4 rounded ${className}`}>
        <ImageIcon className="w-8 h-8 opacity-50" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className}
      priority={priority}
      placeholder="blur"
      blurDataURL={blurSvg}
      onError={() => {
        if (imgSrc !== fallbackSrc && fallbackSrc) {
          setImgSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      }}
      {...props}
    />
  );
};

export default OptimizedImage;
