import React from 'react';
import { ChevronRight, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';

export const DashboardCard = ({ title, pending, finished, bill, color, label2 = "Finished" }) => {
    return (
        <div className="bg-white p-12 rounded-[4.5rem] border-4 border-gray-100 shadow-2xl space-y-10 hover:border-black transition-all duration-500 group relative overflow-hidden italic active:scale-[0.98] text-black">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 mb-2 italic">OPERATIONAL NODE</p>
                    <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{title}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform">
                    <TrendingUp size={24} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner group-hover:bg-gray-100 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 italic">IN PROGRESS</p>
                    <p className="text-5xl font-black text-black tracking-tighter leading-none italic">{pending}</p>
                </div>
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner group-hover:bg-gray-100 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4 italic">{label2.toUpperCase()}</p>
                    <p className="text-5xl font-black text-black tracking-tighter leading-none italic">{finished}</p>
                </div>
            </div>

            {bill > 0 && (
                <div className="pt-10 border-t border-gray-100 relative z-10">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 mb-4 italic">ACCUMULATED REVENUE</p>
                    <div className="flex items-baseline gap-4">
                        <span className="text-4xl font-black text-emerald-500 italic">৳</span>
                        <p className="text-7xl font-black text-black tracking-tighter leading-none italic">{bill.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 p-24 bg-gray-50 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
            <div className="absolute bottom-0 left-0 p-16 bg-gray-50 blur-2xl rounded-full -translate-x-10 translate-y-10 group-hover:bg-gray-100 transition-all"></div>
        </div>
    );
};

export const MenuButton = ({ title, sub, onClick, icon, color }) => {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-10 rounded-[3.5rem] bg-white border-4 border-gray-100 shadow-2xl hover:border-black hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 cursor-pointer group italic overflow-hidden text-black"
        >
            <div className="flex items-center gap-10 text-left relative z-10">
                <div className="p-7 rounded-[2.2rem] bg-black text-white group-hover:rotate-6 transition-all duration-500 shadow-2xl border-b-8 border-gray-800">
                    {icon && React.cloneElement(icon, { size: 32, strokeWidth: 3 })}
                </div>
                <div>
                    <h4 className="font-black text-black leading-none uppercase tracking-tighter text-5xl mb-3 transition-colors italic">
                        {title}
                    </h4>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">{sub}</span>
                </div>
            </div>

            <div className="p-6 rounded-[1.8rem] bg-black text-white group-hover:translate-x-2 transition-all shadow-xl border-b-6 border-gray-800">
                <ArrowUpRight size={28} strokeWidth={4} />
            </div>

            <div className="absolute top-0 right-0 p-16 bg-gray-50 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
        </button>
    );
};

export const Toast = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
        audio.play().catch(() => {});
        if (onClose) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [onClose]);

    const styles = {
        success: "bg-black text-white border-2 border-black shadow-2xl",
        error: "bg-rose-500 text-white shadow-[0_40px_80px_-20px_rgba(244,63,94,0.4)]",
        info: "bg-black text-white border-2 border-black shadow-2xl"
    };

    return (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000] px-14 py-8 rounded-full animate-fade-slide-up flex items-center gap-8 whitespace-nowrap italic backdrop-blur-3xl ${styles[type] || styles.info}`}>
            <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_15px_white]"></div>
            <p className="font-black uppercase text-sm tracking-[0.6em] leading-none text-white">{message}</p>
        </div>
    );
};
