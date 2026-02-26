
import React from 'react';

interface GingaLogoProps {
  size?: 'sm' | 'lg';
  collapsed?: boolean;
}

export const GingaLogo: React.FC<GingaLogoProps> = ({ size = 'lg', collapsed = false }) => {
  // URL for the official logo in Firebase Storage
  const imgUrl = "https://firebasestorage.googleapis.com/v0/b/ginga-app/o/logo-text-black-border%401x.png?alt=media&token=98d327bf-1b6e-425a-bfba-b3e9f3b99d78";

  // Height classes based on size prop
  const sizeClass = size === 'lg' ? 'h-24' : 'h-10';

  if (collapsed) {
      return (
        <div className="flex items-center justify-center select-none w-10 h-10 overflow-hidden" title="Ginga">
           <img 
              src={imgUrl} 
              alt="G"
              className="h-full max-w-none w-auto object-cover object-left" 
              style={{ width: '250%' }} 
           />
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center select-none" title="Ginga">
      <img 
        src={imgUrl} 
        alt="Ginga Logo" 
        className={`${sizeClass} w-auto object-contain drop-shadow-sm`}
      />
    </div>
  );
};
