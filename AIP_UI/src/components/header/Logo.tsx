import { Link } from "react-router-dom";
import { LOGO_SIZES } from "@/constants/header";

interface LogoProps {
  variant: keyof typeof LOGO_SIZES;
  className?: string;
  containerClassName?: string;
}

export const Logo = ({ variant, className = "", containerClassName = "" }: LogoProps) => (
  <Link to="/" className="flex items-center">
    <div className={`relative flex items-center justify-center ${containerClassName}`}>
      <img 
        src="/AdvantageOne.svg" 
        alt="Advantage One"
        className={`${LOGO_SIZES[variant]} w-auto max-w-[240px] object-contain ${className}`}
      />
    </div>
  </Link>
); 