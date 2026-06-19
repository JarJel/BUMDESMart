"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children, footer }: BottomSheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
