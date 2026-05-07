import React from 'react';
import { CompanyInformation } from './CompanyInformation';
import { ContactInformation } from './ContactInformation';
import { QuickLinks } from './QuickLinks';
import { Copyright } from './Copyright';
import { COMPANY_INFO, CONTACT_INFO, QUICK_LINKS } from './constants';
import { FooterProps } from './types';

/**
 * Footer component that displays company information, contact details,
 * quick links, and copyright notice.
 * 
 * Responsive layout:
 * Mobile (< 640px):
 * - Company Info (50%) | Quick Links (50%)
 * - Contact Info (100%)
 * 
 * Tablet (640px - 1023px):
 * - Company Info (100%)
 * - Contact Info (50%) | Quick Links (50%)
 * 
 * Desktop (≥ 1024px):
 * - Company Info (33.33%) | Contact Info (33.33%) | Quick Links (33.33%)
 * 
 * @component
 * @example
 * return (
 *   <Footer
 *     companyInfo={COMPANY_INFO}
 *     contactInfo={CONTACT_INFO}
 *     quickLinks={QUICK_LINKS}
 *   />
 * )
 */
export const Footer: React.FC<Partial<FooterProps>> = ({
  className = '',
  companyInfo = COMPANY_INFO,
  contactInfo = CONTACT_INFO,
  quickLinks = QUICK_LINKS,
}) => {
  return (
    <footer className={`w-full bg-[#334155] lg:bg-[#1A1A1A] text-white ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile: 2 columns for Company Info and Quick Links, Contact Info below */}
        {/* Desktop: 3 equal columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          {/* Company Info - 50% on mobile, 33.33% on desktop */}
          <div className="col-span-1">
            <CompanyInformation info={companyInfo} />
          </div>

          {/* Quick Links - 50% on mobile, 33.33% on desktop */}
          <div className="col-span-1">
            <QuickLinks links={quickLinks} />
          </div>

          {/* Contact Info - 100% on mobile (new row), 33.33% on desktop */}
          <div className="col-span-2 sm:col-span-1">
            <ContactInformation info={contactInfo} />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <Copyright companyName={companyInfo.name} />
        </div>
      </div>
    </footer>
  );
};

// Export all subcomponents and types
export * from './types';
export * from './constants';
export * from './FooterSection';
export * from './CompanyInformation';
export * from './ContactInformation';
export * from './QuickLinks';
export * from './Copyright'; 