import React, { useState } from 'react';

const NRZLogo = ({ size = "md", white = true, customUrl = null }) => {
  const [imgError, setImgError] = useState(false);
  
  const sizes = {
    sm: { w: 100, h: 50, iconSize: 45, text: "text-xl", sub: "text-[5px]" },
    md: { w: 220, h: 110, iconSize: 85, text: "text-4xl", sub: "text-[9px]" },
    lg: { w: 350, h: 180, iconSize: 140, text: "text-6xl", sub: "text-[12px]" },
    xl: { w: 500, h: 260, iconSize: 200, text: "text-8xl", sub: "text-[16px]" },
  };

  const s = sizes[size] || sizes.md;
  const logoPath = customUrl || "/logo_main.jpg";

  return (
    <div className={`flex flex-col items-center justify-center ${white ? "text-white" : "text-black"}`} style={{ width: s.w }}>
        <img 
          src={logoPath} 
          alt="NRZOONE" 
          onError={(e) => { e.target.src = "/logo_black.png" }}
          style={{ 
            width: s.iconSize, 
            height: 'auto', 
            objectFit: 'contain',
            filter: white ? 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.2))' : 'none'
          }} 
          className="transition-all duration-500 mb-2"
        />
        <div className="text-center relative">
          <h1 className={`font-black uppercase italic tracking-[-0.06em] leading-none ${s.text}`} style={{ fontFamily: "serif" }}>
            NRZO<span className="opacity-70 mx-[-0.05em]">O</span>NE
          </h1>
          <p className={`font-black uppercase tracking-[0.45em] opacity-75 italic ${s.sub} mt-1`}>
            WOMEN'S CLOTHING
          </p>
        </div>
    </div>
  );
};

export default NRZLogo;
