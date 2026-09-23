import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ label = 'Loading...', className = '' }) => (
  <div className={`min-h-[50vh] flex flex-col items-center justify-center gap-3 ${className}`}>
    <Loader2 className="w-8 h-8 text-brand animate-spin" />
    {label && <p className="text-sm text-gray-400 font-medium">{label}</p>}
  </div>
);
