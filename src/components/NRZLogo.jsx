import React from 'react';

const NRZLogo = ({ size = "md", white = true }) => {
  const sizes = {
    sm: { w: 100, h: 50, icon: 45, text: "text-xl", sub: "text-[5px]" },
    md: { w: 220, h: 120, icon: 90, text: "text-4xl", sub: "text-[9px]" },
    lg: { w: 350, h: 180, icon: 140, text: "text-6xl", sub: "text-[12px]" },
    xl: { w: 500, h: 260, icon: 200, text: "text-8xl", sub: "text-[16px]" },
  };

  const s = sizes[size] || sizes.md;
  const color = white ? "white" : "black";

  return (
    <div className={`flex flex-col items-center justify-center font-serif ${white ? "text-white" : "text-black"}`} style={{ width: s.w }}>
      {/* High-Fidelity Branded Sewing Machine SVG */}
      <svg 
        width={s.icon} 
        height={s.icon * 0.7} 
        viewBox="0 0 120 80" 
        fill="none" 
        style={{ filter: `drop-shadow(0 0 8px ${white ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'})` }}
      >
        {/* Main Machine Body - stylized smooth curves */}
        <path 
            d="M20 60 C20 60, 100 60, 100 60 M30 60 C30 20, 90 20, 90 55 L85 55 M80 35 L100 35 C105 35, 105 45, 100 45 L80 45 M35 45 L35 65 M32 68 L38 68" 
            stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" 
        />
        {/* Stylized nervous thread lines */}
        <path 
            d="M50 20 Q40 30 35 45 M60 20 Q75 30 85 45 M35 45 Q55 35 75 45" 
            stroke={color} strokeWidth="0.8" opacity="0.4" strokeDasharray="2 2"
        />
        {/* Detail icons */}
        <circle cx="100" cy="40" r="4.5" stroke={color} strokeWidth="1.2" />
        <path d="M50 22 L70 22" stroke={color} strokeWidth="1.2" />
        <rect x="52" y="14" width="16" height="8" rx="1.5" fill={color} opacity="0.3" />
      </svg>
      
      <div className="text-center relative mt-4">
        <h1 className={`font-black uppercase italic tracking-[-0.06em] leading-none ${s.text}`} style={{ fontFamily: "serif" }}>
          NRZO<span className="opacity-70 mx-[-0.05em]">O</span>NE
        </h1>
        <div className="h-[1.5px] w-full bg-current mt-2 mb-2 opacity-20"></div>
        <p className={`font-black uppercase tracking-[0.45em] opacity-50 italic ${s.sub}`}>
          WOMEN'S CLOTHING
        </p>
      </div>
    </div>
  );
};

export default NRZLogo;
