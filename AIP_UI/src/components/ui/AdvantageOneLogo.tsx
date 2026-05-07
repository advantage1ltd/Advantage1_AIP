import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const AdvantageOneLogo: React.FC<LogoProps> = ({ 
  className = "", 
  width = 40, 
  height = 40 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Black diamond shape */}
      <path 
        d="M100 0L200 100L100 200L0 100L100 0Z" 
        fill="#000000" 
      />
      
      {/* White lines inside diamond */}
      <path 
        d="M65 90L135 160" 
        stroke="#FFFFFF" 
        strokeWidth="18" 
      />
      <path 
        d="M65 160L135 90" 
        stroke="#FFFFFF" 
        strokeWidth="18" 
      />
      
      {/* Red "one" text */}
      <g transform="translate(0, -40) scale(0.9)">
        {/* "o" letter */}
        <path 
          d="M80 40C80 29 89 20 100 20C111 20 120 29 120 40C120 51 111 60 100 60C89 60 80 51 80 40Z" 
          fill="#E5193B" 
        />
        <path 
          d="M90 40C90 34.5 94.5 30 100 30C105.5 30 110 34.5 110 40C110 45.5 105.5 50 100 50C94.5 50 90 45.5 90 40Z" 
          fill="#000000" 
        />
        
        {/* "n" letter */}
        <path 
          d="M125 20L125 60" 
          stroke="#E5193B" 
          strokeWidth="20" 
          strokeLinecap="round" 
        />
        <path 
          d="M125 30C125 30 135 20 145 20" 
          stroke="#E5193B" 
          strokeWidth="20" 
          strokeLinecap="round" 
        />
        <path 
          d="M145 20L145 60" 
          stroke="#E5193B" 
          strokeWidth="20" 
          strokeLinecap="round" 
        />
        
        {/* "e" letter */}
        <path 
          d="M170 40C170 51 161 60 150 60C139 60 130 51 130 40C130 29 139 20 150 20" 
          stroke="#E5193B" 
          strokeWidth="20" 
          strokeLinecap="round" 
        />
        <path 
          d="M130 40L170 40" 
          stroke="#E5193B" 
          strokeWidth="20" 
          strokeLinecap="round" 
        />
      </g>
    </svg>
  );
};

export default AdvantageOneLogo; 