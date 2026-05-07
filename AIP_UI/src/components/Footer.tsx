import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="w-full bg-[#334155] lg:bg-[#1A1A1A] text-white mb-0">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-8 md:py-10">
        {/* Responsive layout using flex */}
        <div className="flex flex-wrap pl-2 sm:pl-4">
          {/* First row on mobile, side by side on all screens */}
          <div className="flex flex-wrap w-full">
            {/* Company Information - 50% width on mobile, 33.3% on larger screens */}
            <div className="w-1/2 md:w-1/3 pr-2 sm:pr-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-4">Our Company</h3>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-gray-300 text-sm sm:text-base">Advantage One Security</p>
                <p className="text-gray-300 text-sm sm:text-base">1 Madeley Road</p>
                <p className="text-gray-300 text-sm sm:text-base">Moons Moat North Industrial Estate</p>
                <p className="text-gray-300 text-sm sm:text-base">Redditch B98 9NB</p>
              </div>
            </div>
            
            {/* Quick Links - 50% width on mobile, 33.3% on larger screens */}
            <div className="w-1/2 md:w-1/3 pl-2 sm:pl-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-4">Quick Links</h3>
              <nav className="space-y-1 sm:space-y-2">
                <Link 
                  to="/operations/incident-report" 
                  className="block text-gray-300 text-sm sm:text-base hover:text-blue-400 transition-colors"
                  aria-label="Create Incident Report"
                >
                  Incident Report
                </Link>
                <Link 
                  to="/operations/holiday-requests" 
                  className="block text-gray-300 text-sm sm:text-base hover:text-blue-400 transition-colors"
                  aria-label="Submit Holiday Request"
                >
                  Holiday Request
                </Link>
                <Link 
                  to="/operations/site-visit" 
                  className="block text-gray-300 text-sm sm:text-base hover:text-blue-400 transition-colors"
                  aria-label="View Site Visits"
                >
                  Site Visits
                </Link>
                <Link 
                  to="/operations/officer-support" 
                  className="block text-gray-300 text-sm sm:text-base hover:text-blue-400 transition-colors"
                  aria-label="Access Officer Support"
                >
                  Officer Support
                </Link>
              </nav>
            </div>
            
            {/* Contact Info - 100% width on mobile, 33.3% on larger screens */}
            <div className="w-full md:w-1/3 text-center md:text-left mt-6 md:mt-0 md:pl-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-4">Contact Us</h3>
              <div className="space-y-1 sm:space-y-3">
                <p className="text-gray-300 text-sm sm:text-base">
                  Phone:{' '}
                  <a 
                    href="tel:01218202973" 
                    className="hover:text-blue-400 transition-colors"
                    aria-label="Call us at 0121 820 2973"
                  >
                    0121 820 2973
                  </a>
                </p>
                <p className="text-gray-300 text-sm sm:text-base">For Support Call Scott or James at Head Office</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-8 border-t border-gray-800 pb-4">
          <p className="text-center text-gray-400 text-xs sm:text-sm">
            © {new Date().getFullYear()} Advantage One Security. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}; 