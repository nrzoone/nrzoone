import React from 'react';
import { 
  Scissors, Layers, Hammer, Activity, Truck, Package, 
  DollarSign, FileText, Settings, Shield, UserCheck, 
  BarChart2, X, LayoutGrid, ChevronRight, Share2 
} from 'lucide-react';

const MenuPanel = ({ setActivePanel, user, t }) => {
    // Role-based navigation filtering is handled dynamically inside categories.map below

    const categories = [
        {
            title: "মুখ্য হাব (CORE HUB)",
            items: [
                { id: 'Overview', label: 'ড্যাশবোর্ড', icon: <Activity size={28} />, color: 'bg-black', desc: 'লাইভ সিস্টেম মনিটর' },
                { id: 'Attendance', label: 'হাজিরা', icon: <UserCheck size={28} />, color: 'bg-rose-500', desc: 'দৈনিক বায়োমেট্রিক হাজিরা' }
            ]
        },
        {
            title: "উৎপাদন লাইন (PRODUCTION)",
            items: [
                { id: 'Cutting', label: 'কাটিং', icon: <Scissors size={28} />, color: 'bg-rose-500', desc: 'র-কাট লট ম্যানেজমেন্ট' },
                { id: 'Swing', label: 'সেলাই', icon: <Layers size={28} />, color: 'bg-blue-500', desc: 'ফ্যাক্টরি ফ্লোর অপারেশন' },
                { id: 'Stone', label: 'স্টোন', icon: <Hammer size={28} />, color: 'bg-amber-500', desc: 'স্টোন ইউনিট কন্ট্রোল' },
                { id: 'Pata', label: 'পাতা', icon: <Package size={28} />, color: 'bg-emerald-500', desc: 'লজিস্টিকস এবং স্টোরেজ' }
            ]
        },
        {
            title: "অপারেশন ও মজুরি (OPERATIONS)",
            items: [
                { id: 'Outside', label: 'বাইরের কাজ', icon: <Truck size={28} />, color: 'bg-indigo-500', desc: 'এক্সটার্নাল ইউনিট প্রোডাকশন' },
                { id: 'Accounts', label: 'হিসাব', icon: <DollarSign size={28} />, color: 'bg-emerald-600', desc: 'ক্যাশ এবং লেজার বুক' },
                { id: 'Reports', label: 'রিপোর্ট', icon: <BarChart2 size={28} />, color: 'bg-slate-600', desc: 'বিভাগীয় রিপোর্ট এবং এনালাইসিস' }
            ]
        },
        {
            title: "সিস্টেম অডিট (AUDIT)",
            items: [
                { id: 'Settings', label: 'সেটিংস', icon: <Settings size={28} />, color: 'bg-slate-600', desc: 'মাস্টার সেটআপ কন্ট্রোল' },
                { id: 'Security', label: 'নিরাপত্তা', icon: <Shield size={28} />, color: 'bg-black', desc: 'সিকিউরিটি এবং অডিট ভল্ট' }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[300] bg-[var(--bg-primary)]/95 backdrop-blur-3xl p-6 md:p-20 overflow-y-auto animate-fade-in font-outfit text-black">
            <div className="max-w-6xl mx-auto pb-32">
                <div className="flex justify-between items-center mb-16 md:mb-24">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-black text-white rounded-3xl md:rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                            <LayoutGrid size={32} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">মুখ্য হাব</h1>
                            <p className="text-[10px] md:text-[12px] font-bold text-slate-500 uppercase tracking-[0.4em] italic">এনআরজোন এন্টারপ্রাইজ ইন্টারফেস</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActivePanel('Overview')}
                        className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-[var(--bg-secondary)] shadow-[var(--neu-button)] flex items-center justify-center hover:bg-black hover:text-white transition-all group border border-[var(--border)]"
                    >
                        <X size={28} className="group-hover:rotate-90 transition-transform duration-500 md:w-10 md:h-10" />
                    </button>
                </div>

                <div className="space-y-16">
                    {categories.map((cat, i) => {
                        // Filter items based on user role
                        const filteredItems = cat.items.filter(item => {
                            const role = user?.role?.toLowerCase();
                            const isSuperAdmin = role === 'admin';
                            const isManager = role === 'manager';
                            
                            if (isSuperAdmin) return true; // Admins see everything
                            
                            if (isManager) {
                                // Managers see everything EXCEPT Settings and Security
                                const managerRestricted = ['Settings', 'Security'];
                                return !managerRestricted.includes(item.id);
                            }
                            
                            // Workers only see Production related items and Attendance
                            const workerAllowed = ['Cutting', 'Swing', 'Stone', 'Pata', 'Outside', 'Attendance'];
                            return workerAllowed.includes(item.id);
                        });

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex items-center gap-6 mb-8 md:mb-12 opacity-60">
                                    <h3 className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.5em] text-slate-500 whitespace-nowrap">{cat.title}</h3>
                                    <div className="h-px bg-black/10 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                                    {filteredItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePanel(item.id)}
                                            className="premium-card group hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex items-center justify-between !p-8 md:!p-10"
                                        >
                                            <div className="flex items-center gap-6 md:gap-8">
                                                <div className={`w-16 h-16 md:w-20 md:h-20 ${item.color} text-white rounded-3xl md:rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500 border-4 border-white/10`}>
                                                    {React.cloneElement(item.icon, { size: 28 })}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-black leading-none">{item.label}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{item.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-black group-hover:translate-x-2 transition-all shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-32 pt-16 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center opacity-30 gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">অপারেশনাল V4.4 টার্মিনাল — সিকিউরিটি ভেরিফাইড</p>
                    <div className="flex gap-10">
                        <button className="text-[10px] font-black uppercase tracking-[0.5em] hover:opacity-100 italic">ডকুমেন্টেশন</button>
                        <button className="text-[10px] font-black uppercase tracking-[0.5em] hover:opacity-100 italic">সিস্টেম স্ট্যাটাস</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuPanel;
