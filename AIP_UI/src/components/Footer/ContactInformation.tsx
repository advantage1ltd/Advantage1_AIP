import React from 'react';
import { ContactInfo } from './types';
import { FooterSection } from './FooterSection';

interface ContactInformationProps {
  info: ContactInfo;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({ info }) => {
  return (
    <FooterSection title="Contact Us">
      <div className="space-y-2 sm:space-y-3">
        <p className="text-gray-300 text-sm sm:text-base">
          Phone:{' '}
          <a
            href={`tel:${info.phone.replace(/\s/g, '')}`}
            className="hover:text-blue-400 transition-colors inline-block py-1"
            aria-label={`Call us at ${info.phone}`}
          >
            {info.phone}
          </a>
        </p>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
          {info.supportText}
        </p>
      </div>
    </FooterSection>
  );
}; 