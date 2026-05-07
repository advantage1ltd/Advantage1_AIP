import { Link } from 'react-router-dom';

interface LogoProps {
  onClick?: () => void;
  className?: string;
}

export const Logo = ({ onClick, className = '' }: LogoProps) => {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} onClick={onClick}>
      <img src="/A1 logo img.png" alt="AIP Logo" className="h-8 w-8 object-contain" />
      <span className="font-semibold text-lg">AIP</span>
    </Link>
  );
}; 