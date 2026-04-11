import React from 'react';
import { 
  Scissors, Layers, Hammer, Activity, Truck, Package, 
  DollarSign, FileText, Settings, Shield, UserCheck, 
  BarChart2, X, LayoutGrid, ChevronRight, Share2 
} from 'lucide-react';

const MenuPanel = ({ setActivePanel, user, t, showNotify }) => {
    const categories = [
        {
            title: "মুখ্য হাব (CORE HUB)",
            items: [
                { id: 'Overview', label: 'ড্যাশবোর্ড', icon: <Activity size={32} />, color: 'bg-black dark:bg-white', desc: 'লাইভ সিস্টেম মনিটর' },
                { id: 'Attendance', label: 'হাজিরা', icon: <UserCheck size={32} />, color: 'bg-black dark:bg-white', desc: 'দৈনিক বায়োমেট্রিক হাজিরা' }
            ]
        },
        {
            title: "উৎপাদন লাইন (PRODUCTION)",
            items: [
                { id: 'Cutting', label: 'কাটিং', icon: <Scissors size={32} />, color: 'bg-black dark:bg-white', desc: 'র-কাট লট ম্যানেজমেন্ট' },
                { id: 'Swing', label: 'সেলাই', icon: <Layers size={32} />, color: 'bg-black dark:bg-white', desc: 'ফ্যাক্টরি ফ্লোর অপারেশন' },
                { id: 'Stone', label: 'স্টোন', icon: <Hammer size={32} />, color: 'bg-black dark:bg-white', desc: 'স্টোন ইউনিট কন্ট্রোল' },
                { id: 'Pata', label: 'পাতা', icon: <Package size={32} />, color: 'bg-black dark:bg-white', desc: 'লজিস্টিকস এবং স্টোরেজ' }
            ]
        },
        {
            title: "অপারেশন ও মজুরি (OPERATIONS)",
            items: [
                { id: 'Outside', label: 'বাইরের কাজ', icon: <Truck size={32} />, color: 'bg-black dark:bg-white', desc: 'এক্সটার্নাল ইউনিট প্রোডাকশন' },
                { id: 'ClientLedger', label: 'Client Hub', icon: <UserCheck size={32} />, color: 'bg-black dark:bg-white', desc: 'বি২বি ক্লায়েন্ট এবং বিলিং হাব' },
                { id: 'Accounts', label: 'হিসাব', icon: <DollarSign size={32} />, color: 'bg-black dark:bg-white', desc: 'ক্যাশ এবং লেজার বুক' },
                { id: 'Reports', label: 'রিপোর্ট', icon: <BarChart2 size={32} />, color: 'bg-black dark:bg-white', desc: 'বিভাগীয় রিপোর্ট এবং এনালাইসিস' }
            ]
        },
        {
            title: "সিস্টেম অডিট (AUDIT)",
            items: [
                { id: 'Settings', label: 'সেটিংস', icon: <Settings size={32} />, color: 'bg-black dark:bg-white', desc: 'মাস্টার সেটআপ কন্ট্রোল' },
                { id: 'Security', label: 'নিরাপত্তা', icon: <Shield size={32} />, color: 'bg-black dark:bg-white', desc: 'সিকিউরিটি এবং অডিট ভল্ট' }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 p-6 md:p-24 overflow-y-auto animate-fade-in font-outfit text-black">
            <div className="max-w-7xl mx-auto pb-48">
                <div className="flex justify-between items-end mb-24 md:mb-32 animate-elite">
                    <div className="flex items-center gap-10">
                        <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-950 text-white dark:bg-white dark:text-black rounded-[2.5rem] md:rounded-[4rem] flex items-center justify-center shadow-2xl border-2 border-slate-200 dark:border-slate-800">
                            <LayoutGrid size={48} className="md:w-16 md:h-16" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-normal leading-none text-slate-950 dark:text-white">মেনু হাব</h1>
                            <p className="text-[10px] md:text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">NRZOONE WOMEN'S CLOTHING — ELITE ACCESS</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActivePanel('Overview')}
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-slate-950 text-white dark:bg-white dark:text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
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
                                <div className="flex items-center gap-6 mb-10">
                                    <h3 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.4em] text-slate-950 dark:text-white whitespace-nowrap">{cat.title}</h3>
                                    <div className="h-[2px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-14">
                                    {filteredItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePanel(item.id)}
                                            className="bg-white dark:bg-slate-900 rounded-[var(--radius-saas)] shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex items-center justify-between p-10 md:p-12 border border-slate-100 dark:border-slate-800"
                                        >
                                            <div className="flex items-center gap-10 md:gap-14 relative z-10">
                                                <div className={`w-16 h-16 md:w-24 md:h-24 ${item.color} text-white dark:text-black rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-3 transition-all duration-700`}>
                                                    {item.icon}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xl md:text-3xl font-black uppercase tracking-tight text-slate-950 dark:text-white leading-tight">{item.label}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">{item.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={24} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-950 dark:group-hover:text-white transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-48 pt-20 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center opacity-60 gap-10 text-slate-600 dark:text-slate-400">
                    <p className="text-[11px] font-bold uppercase tracking-[0.6em]">NRZOONE COUTURE ENGINE V5.2 // SECURE BOOTH</p>
                    <div className="flex gap-16">
                        <button onClick={() => setActivePanel('Security')} className="text-[11px] font-bold uppercase tracking-[0.6em] hover:text-slate-950 dark:hover:text-white">SYSTEM LOGS</button>
                        <button onClick={() => showNotify('NRZONE NEURAL ENGINE: STATUS ONLINE')} className="text-[11px] font-bold uppercase tracking-[0.6em] hover:text-slate-950 dark:hover:text-white">GATEWAY STATUS</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuPanel;
