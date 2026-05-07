import React from 'react';

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ title, children }) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
      {children}
    </div>
  );
}; 