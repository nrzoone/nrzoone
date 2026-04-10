import React from 'react';

const NRZLogo = ({ size = "md", white = true, customUrl = null }) => {
  const sizes = {
    sm: { container: "w-24", icon: 32, text: "text-lg", sub: "text-[5px]", gap: "gap-1" },
    md: { container: "w-48", icon: 64, text: "text-3xl", sub: "text-[9px]", gap: "gap-2" },
    lg: { container: "w-72", icon: 120, text: "text-5xl", sub: "text-[12px]", gap: "gap-3" },
    xl: { container: "w-96", icon: 180, text: "text-7xl", sub: "text-[16px]", gap: "gap-4" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center ${s.container} ${white ? "text-white" : "text-slate-950"}`}>
      <div className="relative group">
        {/* Premium Sewing Machine SVG */}
        <svg 
          width={s.icon} 
          height={s.icon} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
        >
          {/* Main Body */}
          <path d="M4 18h16" />
          <path d="M6 18V7c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3" />
          <path d="M14 10h6v2" />
          <path d="M12 12h10" />
          {/* Needle & Stylized Thread Loop */}
          <path d="M11 5v11" className="animate-pulse" />
          <circle cx="17" cy="14" r="2" />
          <path 
            d="M2 14c4-6 8-6 12 0s8 6 12 0" 
            stroke="currentColor"
            strokeWidth="0.5"
            className="opacity-40" 
            style={{ strokeDasharray: '2, 2' }}
          />
        </svg>
        <div className={`absolute -inset-4 bg-current opacity-[0.03] blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700`}></div>
      </div>

      <div className={`text-center space-y-1 ${s.gap} mt-4`}>
        <h1 className={`${s.text} font-black uppercase italic tracking-tighter leading-none`}>
          NRZO<span className="text-blue-500">O</span>NE
        </h1>
        <div className="flex items-center justify-center gap-2">
          <div className="h-[1px] flex-1 bg-current opacity-20"></div>
          <p className={`${s.sub} font-black uppercase tracking-[0.4em] opacity-60 whitespace-nowrap`}>
            WOMEN'S CLOTHING
          </p>
          <div className="h-[1px] flex-1 bg-current opacity-20"></div>
        </div>
      </div>
    </div>
  );
};

export default NRZLogo;
