import React, { useState } from 'react';

const NRZLogo = ({ size = "md", white = true }) => {
  const [imgError, setImgError] = useState(false);
  
  const sizes = {
    sm: { w: 100, h: 50, iconSize: 45, text: "text-xl", sub: "text-[5px]" },
    md: { w: 220, h: 110, iconSize: 85, text: "text-4xl", sub: "text-[9px]" },
    lg: { w: 350, h: 180, iconSize: 140, text: "text-6xl", sub: "text-[12px]" },
    xl: { w: 500, h: 260, iconSize: 200, text: "text-8xl", sub: "text-[16px]" },
  };

  const s = sizes[size] || sizes.md;
  const logoPath = white ? "/logo_white.png" : "/logo_black.png";

  return (
    <div className={`flex flex-col items-center justify-center ${white ? "text-white" : "text-black"}`} style={{ width: s.w }}>
      {imgError ? (
        /* Original SVG Fallback if Image fails to load */
        <svg 
          width={s.iconSize} 
          height={s.iconSize * 0.7} 
          viewBox="0 0 120 80" 
          fill="none" 
          style={{ filter: `drop-shadow(0 0 8px ${white ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'})` }}
        >
          <path 
              d="M20 60 C20 60, 100 60, 100 60 M30 60 C30 20, 90 20, 90 55 L85 55 M80 35 L100 35 C105 35, 105 45, 100 45 L80 45 M35 45 L35 65 M32 68 L38 68" 
              stroke={white ? "white" : "black"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" 
          />
          <path 
              d="M50 20 Q40 30 35 45 M60 20 Q75 30 85 45 M35 45 Q55 35 75 45" 
              stroke={white ? "white" : "black"} strokeWidth="0.8" opacity="0.4" strokeDasharray="2 2"
          />
          <circle cx="100" cy="40" r="4.5" stroke={white ? "white" : "black"} strokeWidth="1.2" />
        </svg>
      ) : (
        <img 
          src={logoPath} 
          alt="NRZOONE Logo" 
          onError={() => setImgError(true)}
          style={{ 
            width: s.iconSize, 
            height: 'auto', 
            objectFit: 'contain',
            filter: white ? 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' : 'none'
          }} 
          className="transition-all duration-500"
        />
      )}
      
      {/* If using Image, we might hide the text if the image already contains "NRZOONE" */}
      {!imgError && size !== "sm" ? null : (
        <div className="text-center relative mt-4">
          <h1 className={`font-black uppercase italic tracking-[-0.06em] leading-none ${s.text}`} style={{ fontFamily: "serif" }}>
            NRZO<span className="opacity-70 mx-[-0.05em]">O</span>NE
          </h1>
          <div className="h-[1.5px] w-full bg-current mt-2 mb-2 opacity-20"></div>
          <p className={`font-black uppercase tracking-[0.45em] opacity-75 italic ${s.sub}`}>
            WOMEN'S CLOTHING
          </p>
        </div>
      )}
    </div>
  );
};

export default NRZLogo;
