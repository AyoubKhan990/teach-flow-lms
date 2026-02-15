import React from 'react';

export const Card = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`
        surface rounded-[var(--radius-card)]
        ${hover ? 'transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
