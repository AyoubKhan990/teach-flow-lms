import React from 'react';

const variants = {
  neutral: 'bg-black/5 text-[color:var(--color-text)]',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700'
};

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold
        ${variants[variant] || variants.neutral}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

