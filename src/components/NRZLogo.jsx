import React from 'react';

const NRZLogo = ({ size = "md", white = true }) => {
  const sizes = {
    sm: { w: 100, h: 50, icon: 40, text: "text-xl", sub: "text-[6px]" },
    md: { w: 220, h: 120, icon: 80, text: "text-4xl", sub: "text-[10px]" },
    lg: { w: 350, h: 200, icon: 140, text: "text-6xl", sub: "text-[14px]" },
    xl: { w: 500, h: 280, icon: 200, text: "text-8xl", sub: "text-[18px]" },
  };

  const s = sizes[size] || sizes.md;
  const color = white ? "white" : "black";

  return (
    <div className={`flex flex-col items-center justify-center font-serif ${white ? "text-white" : "text-black"}`} style={{ width: s.w }}>
      {/* Hand-drawn High-Fidelity Sewing Machine SVG */}
      <svg 
        width={s.icon} 
        height={s.icon * 0.8} 
        viewBox="0 0 100 80" 
        fill="none" 
        style={{ filter: `drop-shadow(0 0 10px ${white ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'})` }}
      >
        <path 
          d="M15 65 L85 65 M25 65 C25 25, 70 25, 70 65 M65 40 L80 40 C85 40, 85 50, 80 50 L65 50 M30 45 L30 68 M28 72 L32 72" 
          stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
        />
        <path 
          d="M45 25 Q35 35 30 50 M55 25 Q70 35 75 50" 
          stroke={color} strokeWidth="0.5" opacity="0.3" 
        />
        <circle cx="80" cy="45" r="4" stroke={color} strokeWidth="1" />
        <path d="M40 25 L60 25" stroke={color} strokeWidth="1" />
        <rect x="42" y="15" width="16" height="10" rx="1" fill={color} opacity="0.4" />
      </svg>
      
      <div className="text-center relative mt-2">
        <h1 className={`font-black uppercase italic tracking-[-0.08em] leading-none ${s.text}`} style={{ fontFamily: "'Times New Roman', serif" }}>
          NRZO<span className="opacity-70 mx-[-0.05em]">O</span>NE
        </h1>
        <div className={`bg-current opacity-20 my-1 mx-auto`} style={{ height: '1px', width: '80%' }}></div>
        <p className={`font-black uppercase tracking-[0.5em] opacity-40 italic ${s.sub}`} style={{ fontFamily: "Arial, sans-serif" }}>
          WOMEN'S CLOTHING
        </p>
      </div>
    </div>
  );
};

export default NRZLogo;
