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
        {!imgError ? (
          <img 
            src={logoPath} 
            alt="Company Logo" 
            onError={() => setImgError(true)}
            style={{ 
              width: s.iconSize, 
              height: 'auto', 
              maxHeight: s.iconSize * 0.8,
              objectFit: 'contain',
              filter: white ? 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,0.2))' : 'none'
            }} 
            className="mb-2"
          />
        ) : (
          <div className={`mb-4 flex items-center justify-center rounded-2xl ${white ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`} style={{ width: s.iconSize, height: s.iconSize * 0.6 }}>
             <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">Logo Error</p>
          </div>
        )}
        <div className="text-center relative">
          <h1 className={`font-black uppercase italic tracking-[-0.06em] leading-none ${s.text}`} style={{ fontFamily: "serif" }}>
            NRZO<span className="opacity-70 mx-[-0.05em]">O</span>NE
          </h1>
          <p className={`font-black uppercase tracking-[0.45em] opacity-75 italic ${s.sub} mt-1 whitespace-nowrap`}>
            WOMEN'S CLOTHING
          </p>
        </div>
    </div>
  );
};

export default NRZLogo;
