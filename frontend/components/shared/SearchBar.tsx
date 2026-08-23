'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api/axios';

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  price: number;
  foto_url?: string | null;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onCloseMobile?: () => void;
}

export default function SearchBar({
  placeholder = 'Cari produk desa...',
  className = '',
  onCloseMobile,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 350);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch data dari API Laravel
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/products/search', {
          params: { q: debouncedQuery },
          signal: controller.signal,
        });

        if (response.data && response.data.success) {
          setResults(response.data.data || []);
        }
      } catch (error: any) {
        if (error.name !== 'CanceledError' && error.message !== 'canceled') {
          console.error('Search error:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  // 2. Click outside untuk menutup panel dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 3. Penanganan navigasi Keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelectItem(results[activeIndex]);
      } else if (query.trim().length > 0) {
        // Jika tekan Enter tanpa highlight item, arahkan ke page produk dengan query
        router.push(`/produk?search=${encodeURIComponent(query)}`);
        setIsOpen(false);
        if (onCloseMobile) onCloseMobile();
      }
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: SearchResult) => {
    setQuery(item.name);
    setIsOpen(false);
    router.push(`/produk/${item.slug || item.id}`);
    if (onCloseMobile) onCloseMobile();
  };

  // Helper render highlight teks yang match
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-yellow-900 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          className="w-full pl-4 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-600/10 transition-all text-gray-700 placeholder-gray-400"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {/* Search Icon */}
        <button
          type="button"
          onClick={() => {
            if (query.trim().length > 0) {
              router.push(`/produk?search=${encodeURIComponent(query)}`);
              setIsOpen(false);
              if (onCloseMobile) onCloseMobile();
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 cursor-pointer transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-left">
          {/* Skeleton Loading */}
          {isLoading && results.length === 0 && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List Hasil Pencarian */}
          <div
            className={`max-h-80 overflow-y-auto divide-y divide-gray-100 transition-opacity duration-200 ${
              isLoading ? 'opacity-50' : 'opacity-100'
            }`}
          >
            {results.length > 0 ? (
              results.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors duration-150 ${
                    index === activeIndex ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Thumbnail Produk */}
                  {item.foto_url ? (
                    <img
                      src={item.foto_url}
                      alt={item.name}
                      className="w-8 h-8 rounded object-cover mr-3 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center mr-3 shrink-0">
                      <span className="text-green-700 font-bold text-xs">P</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">
                      {highlightMatch(item.name, query)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              !isLoading && (
                <div className="p-4 text-center text-xs text-gray-500">
                  Tidak ditemukan hasil untuk <span className="font-semibold">"{query}"</span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
