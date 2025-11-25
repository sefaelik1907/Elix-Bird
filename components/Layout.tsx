import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-sky-200 flex justify-center items-center font-sans overflow-hidden">
      {/* Mobile container - restricts width on desktop */}
      <div className="relative w-full max-w-md h-[100dvh] overflow-hidden bg-gradient-to-b from-sky-300 via-blue-400 to-blue-500 shadow-2xl relative">
        
        {/* Animated Background Elements - REMOVED BLUR FOR SHARPNESS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Sun Glow - Made into a sharp gradient circle */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-100/30 rounded-full opacity-60 mix-blend-screen"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 bg-white/10 rounded-full opacity-30 mix-blend-overlay"></div>
          
          {/* Clouds (Sharp CSS Shapes) */}
          <div className="absolute top-[15%] left-[10%] w-24 h-8 bg-white/40 rounded-full animate-float"></div>
          <div className="absolute top-[25%] right-[15%] w-32 h-10 bg-white/30 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-[20%] left-[20%] w-40 h-12 bg-white/20 rounded-full animate-float"></div>
          <div className="absolute top-[50%] left-[50%] w-36 h-12 bg-white/25 rounded-full animate-float-delayed transform -translate-x-1/2"></div>
        </div>

        {/* Content Layer */}
        <div className="relative h-full z-10 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;