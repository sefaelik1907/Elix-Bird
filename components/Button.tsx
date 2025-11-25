import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  icon,
  className = '',
  ...props 
}) => {
  
  // Base styles
  const baseStyles = "relative flex items-center justify-center font-bold rounded-full transition-all active:translate-y-1 active:shadow-none select-none";
  
  // Variants
  const variants = {
    primary: "bg-gradient-to-b from-pink-400 to-purple-600 text-white shadow-3d-pink border-t border-pink-300",
    secondary: "bg-gradient-to-b from-yellow-300 to-orange-500 text-white shadow-3d-yellow border-t border-yellow-200",
    neutral: "bg-white text-brand-secondary shadow-3d-white border-t border-white",
    outline: "bg-transparent border-2 border-white text-white hover:bg-white/10"
  };

  // Sizes
  const sizes = {
    sm: "px-4 py-2 text-sm h-10",
    md: "px-6 py-3 text-base h-14",
    lg: "px-8 py-4 text-xl h-16"
  };

  // Glossy Overlay for 3D buttons
  const Gloss = () => (
    variant !== 'outline' ? (
      <div className="absolute top-1 left-2 right-2 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-full pointer-events-none opacity-80" />
    ) : null
  );

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      <Gloss />
      <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
        {icon}
        {children}
      </span>
    </button>
  );
};

export default Button;