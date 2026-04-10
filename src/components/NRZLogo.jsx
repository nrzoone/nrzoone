import React from 'react';

const NRZLogo = ({ size = "md", white = true, customUrl = null }) => {
  const sizes = {
    sm: "w-24",
    md: "w-48",
    lg: "w-72",
    xl: "w-96",
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center ${s}`}>
      <img 
        src={customUrl || "/logo_main.png"} 
        alt="NRZOONE Logo" 
        className={`w-full h-auto transition-transform duration-500 hover:scale-105 ${white ? "brightness-0 invert p-2" : "brightness-0"}`}
        style={{ filter: white ? "brightness(0) invert(1)" : "brightness(0)" }}
        onError={(e) => {
            // Fallback if image not found
            e.target.style.display = 'none';
        }}
      />
      {!customUrl && (
          <div className="hidden">
              {/* Keeping the SEO title hidden but present */}
              <h1>NRZOONE</h1>
          </div>
      )}
    </div>
  );
};

export default NRZLogo;
