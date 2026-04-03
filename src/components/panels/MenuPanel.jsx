import React from 'react';
import { 
  Scissors, Layers, Hammer, Activity, Truck, Package, 
  DollarSign, FileText, Settings, Shield, UserCheck, 
  BarChart2, X, LayoutGrid, ChevronRight, Share2 
} from 'lucide-react';

const MenuPanel = ({ setActivePanel, user, t }) => {
    const isAdmin = user?.role === 'Admin' || user?.role === 'Manager';

    const categories = [
        {
            title: "Production Pipeline",
            items: [
                { id: 'Cutting', icon: <Scissors size={28} />, color: 'bg-rose-500', desc: 'Manage Cutting Lots' },
                { id: 'Swing', icon: <Layers size={28} />, color: 'bg-blue-500', desc: 'Sewing Workload' },
                { id: 'Stone', icon: <Hammer size={28} />, color: 'bg-amber-500', desc: 'Stone Production' },
                { id: 'Pata', icon: <Activity size={28} />, color: 'bg-emerald-500', desc: 'Pata Workshop' },
                { id: 'Outside', icon: <Truck size={28} />, color: 'bg-indigo-500', desc: 'Outside Contractors' }
            ]
        },
        {
            title: "HR & WORKFORCE (কারিগর ও হাজিরা)",
            items: [
                { id: 'Attendance', icon: <UserCheck size={28} />, color: 'bg-cyan-500', desc: 'Daily Attendance' },
                { id: 'Accounts', icon: <DollarSign size={28} />, color: 'bg-emerald-600', desc: 'Ledger & Dadon' },
                { id: 'Reports', icon: <BarChart2 size={28} />, color: 'bg-violet-600', desc: 'Performance Logs' }
            ]
        },
        {
            title: "SYSTEM AUDIT (সিস্টেম সেটআপ)",
            items: [
                { id: 'Settings', icon: <Settings size={28} />, color: 'bg-slate-600', desc: 'Worker Profiles & Info' },
                { id: 'Security', icon: <Shield size={28} />, color: 'bg-black', desc: 'Admin & Biometrics' }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[300] bg-white/80 backdrop-blur-3xl p-6 md:p-20 overflow-y-auto animate-fade-in font-outfit text-black italic">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-20">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-black text-white rounded-[2rem] flex items-center justify-center shadow-2xl">
                            <LayoutGrid size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">CORE HUB</h1>
                            <p className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] mt-3 italic">NRZO0NE ENTERPRISE INTERFACE</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActivePanel('Overview')}
                        className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-inner border-2 border-white group"
                    >
                        <X size={32} className="group-hover:rotate-90 transition-transform duration-500" />
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
                                <div className="flex items-center gap-4 mb-4 md:mb-10 opacity-40">
                                    <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] italic whitespace-nowrap">{cat.title}</h3>
                                    <div className="h-px bg-black/10 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {filteredItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePanel(item.id)}
                                            className="premium-card !p-10 group hover:border-black transition-all text-left flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-8">
                                                <div className={`w-20 h-20 ${item.color} text-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500 border-4 border-white/20`}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-1 text-black">{item.id}</h4>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={24} className="text-slate-200 group-hover:text-black group-hover:translate-x-3 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-32 pt-16 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center opacity-30 gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">OPERATIONAL V4.4 TERMINAL — SECURITY VERIFIED</p>
                    <div className="flex gap-10">
                        <button className="text-[10px] font-black uppercase tracking-[0.5em] hover:opacity-100 italic">Documentation</button>
                        <button className="text-[10px] font-black uppercase tracking-[0.5em] hover:opacity-100 italic">System Status</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuPanel;
