import React from 'react';
import { 
  Scissors, Layers, Hammer, Activity, Truck, Package, 
  DollarSign, FileText, Settings, Shield, UserCheck, 
  BarChart2, X, LayoutGrid, ChevronRight, Share2 
} from 'lucide-react';

const MenuPanel = ({ setActivePanel, user, t }) => {
    const categories = [
        {
            title: "মুখ্য হাব (CORE HUB)",
            items: [
                { id: 'Overview', label: 'ড্যাশবোর্ড', icon: <Activity size={32} />, color: 'bg-black', desc: 'লাইভ সিস্টেম মনিটর' },
                { id: 'Attendance', label: 'হাজিরা', icon: <UserCheck size={32} />, color: 'bg-rose-500', desc: 'দৈনিক বায়োমেট্রিক হাজিরা' }
            ]
        },
        {
            title: "উৎপাদন লাইন (PRODUCTION)",
            items: [
                { id: 'Cutting', label: 'কাটিং', icon: <Scissors size={32} />, color: 'bg-rose-500', desc: 'র-কাট লট ম্যানেজমেন্ট' },
                { id: 'Swing', label: 'সেলাই', icon: <Layers size={32} />, color: 'bg-blue-500', desc: 'ফ্যাক্টরি ফ্লোর অপারেশন' },
                { id: 'Stone', label: 'স্টোন', icon: <Hammer size={32} />, color: 'bg-amber-500', desc: 'স্টোন ইউনিট কন্ট্রোল' },
                { id: 'Pata', label: 'পাতা', icon: <Package size={32} />, color: 'bg-emerald-500', desc: 'লজিস্টিকস এবং স্টোরেজ' }
            ]
        },
        {
            title: "অপারেশন ও মজুরি (OPERATIONS)",
            items: [
                { id: 'Outside', label: 'বাইরের কাজ', icon: <Truck size={32} />, color: 'bg-indigo-500', desc: 'এক্সটার্নাল ইউনিট প্রোডাকশন' },
                { id: 'Accounts', label: 'হিসাব', icon: <DollarSign size={32} />, color: 'bg-emerald-600', desc: 'ক্যাশ এবং লেজার বুক' },
                { id: 'Reports', label: 'রিপোর্ট', icon: <BarChart2 size={32} />, color: 'bg-slate-600', desc: 'বিভাগীয় রিপোর্ট এবং এনালাইসিস' }
            ]
        },
        {
            title: "সিস্টেম অডিট (AUDIT)",
            items: [
                { id: 'Settings', label: 'সেটিংস', icon: <Settings size={32} />, color: 'bg-slate-600', desc: 'মাস্টার সেটআপ কন্ট্রোল' },
                { id: 'Security', label: 'নিরাপত্তা', icon: <Shield size={32} />, color: 'bg-black', desc: 'সিকিউরিটি এবং অডিট ভল্ট' }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[500] bg-white/40 dark:bg-black/40 backdrop-blur-3xl p-6 md:p-24 overflow-y-auto mesh-bg animate-fade-in font-outfit text-black">
            <div className="max-w-7xl mx-auto pb-48">
                <div className="flex justify-between items-end mb-24 md:mb-32 animate-elite">
                    <div className="flex items-center gap-10">
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-black text-white rounded-[2.5rem] md:rounded-[4rem] flex items-center justify-center shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border-8 border-white/10">
                            <LayoutGrid size={48} className="md:w-16 md:h-16" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-6xl md:text-9xl font-black italic tracking-tightest uppercase leading-[0.8] text-black dark:text-white">মেনু হাব</h1>
                            <p className="text-[11px] md:text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] italic">NRZONE NEURAL INTERFACE V5.0 — ELITE ACCESS</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActivePanel('Overview')}
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-black text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-8 border-white/20"
                    >
                        <X size={40} className="group-hover:rotate-90 transition-transform duration-700" />
                    </button>
                </div>

                <div className="space-y-24">
                    {categories.map((cat, i) => {
                        const filteredItems = cat.items.filter(item => {
                            const role = user?.role?.toLowerCase();
                            if (role === 'admin') return true;
                            if (role === 'manager') return !['Settings', 'Security'].includes(item.id);
                            return ['Cutting', 'Swing', 'Stone', 'Pata', 'Outside', 'Attendance'].includes(item.id);
                        });

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={i} className="animate-elite" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="flex items-center gap-10 mb-12 md:mb-16 opacity-40">
                                    <h3 className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.8em] text-slate-600 whitespace-nowrap italic">{cat.title}</h3>
                                    <div className="h-px bg-black flex-1 opacity-20"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-14">
                                    {filteredItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePanel(item.id)}
                                            className="glass-card group hover:scale-[1.05] active:scale-[0.95] transition-all text-left flex items-center justify-between !p-12 md:!p-16 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-black/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                                            <div className="flex items-center gap-10 md:gap-14 relative z-10">
                                                <div className={`w-20 h-20 md:w-28 md:h-28 ${item.color} text-white rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-all duration-700 border-8 border-white/20`}>
                                                    {item.icon}
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-3xl md:text-5xl font-black italic uppercase tracking-tightest text-black leading-none">{item.label}</h4>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none italic">{item.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={32} className="text-slate-200 group-hover:text-black group-hover:translate-x-4 transition-all shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-48 pt-20 border-t border-black/5 flex flex-col md:flex-row justify-between items-center opacity-20 gap-10 italic">
                    <p className="text-[11px] font-black uppercase tracking-[0.6em]">NRZONE NEURAL ENGINE V5.2 // SECURE BOOTH</p>
                    <div className="flex gap-16">
                        <button className="text-[11px] font-black uppercase tracking-[0.6em] hover:opacity-100 italic">SYSTEM LOGS</button>
                        <button className="text-[11px] font-black uppercase tracking-[0.6em] hover:opacity-100 italic">GATEWAY STATUS</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuPanel;
