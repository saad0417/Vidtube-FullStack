import React from 'react';

export const PageHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
    <div className="flex items-center gap-3.5 min-w-0">
      {Icon && (
        <div className="p-2.5 rounded-xl bg-brand/10 text-brand shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);
