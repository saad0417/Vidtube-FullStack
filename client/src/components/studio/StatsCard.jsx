import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, color = 'text-brand', bgColor = 'bg-brand/10' }) => {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-dark-card border border-dark-border/60 shadow-sm">
      <div className={`p-2.5 sm:p-3.5 rounded-xl ${bgColor} ${color} shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-2xl font-bold text-white tracking-tight mt-0.5 truncate">
          {value !== undefined && value !== null ? value.toLocaleString() : 0}
        </span>
      </div>
    </div>
  );
};
