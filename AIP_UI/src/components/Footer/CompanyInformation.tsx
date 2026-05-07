import React from 'react';
import { CompanyInfo } from './types';
import { FooterSection } from './FooterSection';

interface CompanyInformationProps {
  info: CompanyInfo;
}

export const CompanyInformation: React.FC<CompanyInformationProps> = ({ info }) => {
  return (
    <FooterSection title="Our Company">
      <div className="space-y-2 sm:space-y-3">
        <p className="text-gray-300 text-base sm:text-lg font-medium">{info.name}</p>
        <div className="space-y-1 sm:space-y-2">
          {info.address.map((line, index) => (
            <p key={index} className="text-gray-300 text-sm sm:text-base">
              {line}
            </p>
          ))}
        </div>
      </div>
    </FooterSection>
  );
}; 