import React from 'react';

interface CopyrightProps {
  companyName: string;
}

export const Copyright: React.FC<CopyrightProps> = ({ companyName }) => {
  return (
    <div className="pt-6 sm:pt-8 border-t border-gray-800">
      <p className="text-center text-gray-400 text-xs sm:text-sm">
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </p>
    </div>
  );
}; 