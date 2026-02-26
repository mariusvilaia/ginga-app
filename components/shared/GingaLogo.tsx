
import React from 'react';

interface GingaLogoProps {
  size?: 'sm' | 'lg';
  collapsed?: boolean;
}

export const GingaLogo: React.FC<GingaLogoProps> = ({ size = 'lg', collapsed = false }) => {
  // URL for the official logo in Firebase Storage
  const imgUrl = "https://firebasestorage.googleapis.com/v0/b/ginga-app.appspot.com/o/logo-text-black-border%401x.png?alt=media&token=f7fd420b-d3b2-41fb-b64e-e8070b098b17";

  // Height classes based on size prop
  const sizeClass = size === 'lg' ? 'h-24' : 'h-10';

  if (collapsed) {
      return (
        <div className="flex items-center justify-center select-none w-10 h-10 transition-transform hover:scale-110" title="Ginga">
           {/* Ginga Mosaic Heart Symbol */}
           <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Stroke */}
              <path d="M50 92L15 55C-5 35 10 5 35 20L50 30L65 20C90 5 105 35 85 55L50 92Z" fill="black"/>
              
              {/* Inner White Background for spacing */}
              <path d="M50 86L18 52C0 34 14 8 36 22L50 32L64 22C86 8 100 34 82 52L50 86Z" fill="white"/>

              {/* Mosaic Shards */}
              {/* Top Left - Yellow */}
              <path d="M50 32L36 22C30 18 20 20 18 28L30 40L50 32Z" fill="#F4B400"/>
              {/* Mid Left - Red */}
              <path d="M18 28C10 35 12 45 18 52L35 55L30 40L18 28Z" fill="#E53935"/>
              {/* Bottom Left - Green */}
              <path d="M18 52L50 86L45 60L35 55L18 52Z" fill="#84cc16"/>
              
              {/* Top Right - Green */}
              <path d="M50 32L64 22C70 18 80 20 82 28L70 40L50 32Z" fill="#84cc16"/>
              {/* Mid Right - Yellow */}
              <path d="M82 28C90 35 88 45 82 52L65 55L70 40L82 28Z" fill="#F4B400"/>
              {/* Bottom Right - Red */}
              <path d="M82 52L50 86L55 60L65 55L82 52Z" fill="#E53935"/>
              
              {/* Center Diamond - Black/Dark */}
              <path d="M50 32L30 40L35 55L50 65L65 55L70 40L50 32Z" fill="#111827"/>
           </svg>
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
