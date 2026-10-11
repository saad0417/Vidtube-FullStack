import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Capped at the overlay's height so the header stays put and only the body scrolls */}
      <div
        className={`w-full ${maxWidth} max-h-full flex flex-col bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-dark-border/70 shrink-0">
          <h3 className="text-lg font-semibold text-white tracking-tight truncate">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-dark-hover transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
