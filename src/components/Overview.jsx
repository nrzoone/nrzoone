import React, { useState } from "react";
import { 
    Activity, 
    TrendingUp, 
    Users, 
    ArrowUpRight, 
    DollarSign,
    ChevronRight,
    Package,
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
} from 'recharts';

const Overview = ({ masterData, stats: propStats, setActivePanel, t, user, syncStatus }) => {
    const [timeframe, setTimeframe] = useState("Weekly");

    const stats = propStats || {
        activeJobs: [
            ...(masterData?.cuttingStock || []).map(e => ({ ...e, activityType: 'Cutting' })),
            ...(masterData?.productions || [])
                .filter(p => p.type === 'sewing')
                .map(e => ({ ...e, activityType: 'Sewing' })),
            ...(masterData?.productions || [])
                .filter(p => p.type === 'stone')
                .map(e => ({ ...e, activityType: 'Stone' })),
            ...(masterData?.pataEntries || [])
                .map(e => ({ ...e, activityType: 'Pata' }))
        ].sort((a, b) => {
            const parseDate = (d) => {
                if (!d) return 0;
                // Handle ISO strings (yyyy-mm-dd)
                if (d.includes('-')) return new Date(d).getTime();
                // Handle dd/mm/yyyy
                const parts = d.split('/');
                if (parts.length !== 3) return 0;
                const [day, month, year] = parts;
                return new Date(`${year}-${month}-${day}`).getTime();
            };
            return (parseDate(b.date) || b.id || 0) - (parseDate(a.date) || a.id || 0);
        })
    };

    const trendData = [
        { name: 'Mon', value: 45 }, { name: 'Tue', value: 52 },
        { name: 'Wed', value: 48 }, { name: 'Thu', value: 61 },
        { name: 'Fri', value: 55 }, { name: 'Sat', value: 67 },
        { name: 'Sun', value: 59 },
    ];

    return (
        <div className="space-y-6 animate-fade-up pb-24">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-5 mb-8 px-1 md:px-2">
                <div className="space-y-1.5">
                     <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase">
                        এনআরজোন <span className="text-blue-600">ড্যাশবোর্ড</span>
                    </h1>
                    <p className="text-subtitle">
                        INDUSTRIAL ERP // LIVE OPERATIONAL HUB v5.2 ELITE
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    {[
                        { id: "Daily", label: "দৈনিক" },
                        { id: "Weekly", label: "সাপ্তাহিক" },
                        { id: "Monthly", label: "মাসিক" }
                    ].map((tf) => (
                        <button 
                            key={tf.id}
                            onClick={() => setTimeframe(tf.id)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${timeframe === tf.id ? 'bg-slate-950 text-white shadow-xl dark:bg-white dark:text-black' : 'text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                {[
                    { label: "মোট কারিগর", value: (masterData.workerDocs || []).length, trend: "+4.2%", icon: Users, id: "Settings", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10" },
                    { label: "চলমান কাজ", value: (masterData.productions || []).length + (masterData.pataEntries || []).length, trend: "+12.1%", icon: Activity, id: "Cutting", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
                    { 
                        label: "ফ্যাক্টরি ব্যালেন্স (৳)", 
                        value: (() => {
                            const totalCashIn = (masterData.cashEntries || []).reduce((acc, c) => acc + Number(c.amount || 0), 0);
                            const totalExp = (masterData.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
                            const bal = totalCashIn - totalExp;
                            return bal >= 1000 ? `${(bal / 1000).toFixed(1)}k` : bal.toLocaleString();
                        })(),
                        trend: "+8.4%", 
                        icon: DollarSign, 
                        id: "Accounts", 
                        color: "text-indigo-600", 
                        bg: "bg-indigo-50 dark:bg-indigo-900/10" 
                    },
                    { label: "পেন্ডিং লট", value: (masterData.productions || []).filter(p => p.status === 'Pending').length, trend: "-2.1%", icon: Package, id: "Cutting", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" }
                ].concat([
                    { 
                        label: "মোট ফেব্রিক স্টক (গজ)", 
                        value: (() => {
                            if (!masterData || !masterData.rawInventory) return "0.0";
                            const logs = masterData.rawInventory || [];
                            const total = logs.reduce((acc, curr) => 
                                curr.type === 'in' ? acc + parseFloat(curr.qty || 0) : acc - parseFloat(curr.qty || 0), 0
                            );
                            return total.toFixed(1);
                        })(), 
                        trend: "Inventory", 
                        icon: Scissors, 
                        id: "Cutting", 
                        color: "text-amber-600", 
                        bg: "bg-amber-50 dark:bg-amber-900/10" 
                    },
                    { 
                        label: "তৈরি মাল স্টক (পিস)", 
                        value: masterData?.finishedStock ? masterData.finishedStock.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0) : 0, 
                        trend: "Ready", 
                        icon: Package, 
                        id: "ClientLedger", 
                        color: "text-emerald-600", 
                        bg: "bg-emerald-50 dark:bg-emerald-900/10" 
                    }
                ]).map((kpi, idx) => (
                    <div key={idx} className="saas-card group cursor-pointer !p-5" onClick={() => setActivePanel(kpi.id)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                                <kpi.icon size={20} />
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 rounded-full text-[9px] font-black italic border border-emerald-100 dark:border-emerald-500/20">
                                {kpi.trend}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-subtitle">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] leading-tight tracking-tighter italic">{kpi.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="space-y-4">
                    <div className="saas-card bg-white dark:bg-slate-900 !p-6">
                        <h3 className="text-[10px] font-black uppercase mb-6 tracking-widest flex items-center gap-3 text-[var(--text-primary)] italic">
                            <TrendingUp size={16} className="text-blue-600" />
                            উৎপাদন গতি (Velocity)
                        </h3>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2.5">
                                <span className="text-subtitle">প্রজেকশন আউটপুট</span>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider italic">১৮.২%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 w-[72%] rounded-full shadow-lg shadow-blue-500/20"></div>
                            </div>
                        </div>
                    </div>

                    <div className="saas-card bg-slate-950 text-white border-none shadow-2xl !p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <Activity size={150} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Core Analytics</p>
                                <h4 className="text-2xl font-black uppercase tracking-tight leading-tight">সিস্টেম আর্কিটেকচার <br/><span className="text-blue-400">V5.2 ELITE</span></h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-white/30 italic">এনক্রিপশন স্তর</p>
                                    <p className="text-xs font-black">AES-256 SECURE</p>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-white/30 italic">বুটলিঙ্ক নোড</p>
                                    <p className="text-xs font-black text-emerald-400 italic">OPTIMAL STATE</p>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 active:scale-[0.98] transition-all shadow-xl">
                                রিপোর্ট জেনারেট করুন (PDF)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Activity Table */}
                <div className="lg:col-span-2 saas-card !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-sm"></div>
                            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">লাইভ প্রোডাকশন ফিড</h3>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 italic">ACTIVE TRANSMISSION</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[9px] text-black/40 dark:text-white/40 uppercase tracking-[0.2em] font-black italic bg-slate-50/50 dark:bg-slate-800/10">
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800">লট / কারিগর</th>
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800">ডিজাইন আইডেন্টিটি</th>
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 text-center">পরিমাণ</th>
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 text-right">মডিউল</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {(stats.activeJobs || []).slice(0, 10).map((job, i) => (
                                    <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer" onClick={() => setActivePanel(job.activityType === 'Pata' ? 'Pata' : job.activityType === 'Sewing' ? 'Swing' : 'Stone')}>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 bg-slate-950 text-white rounded-xl flex items-center justify-center font-black text-[10px] shadow-lg group-hover:scale-110 transition-transform">
                                                    #{job.lotNo}
                                                </div>
                                                <span className="text-xs font-black text-[var(--text-primary)] uppercase italic tracking-tighter">/ {job.worker?.split(' ')[0] || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="text-sm font-black text-[var(--text-primary)] uppercase leading-none mb-1 italic tracking-tight">{job.design}</p>
                                            <p className="text-subtitle">{job.activityType === 'Pata' ? 'Logistics Node' : job.activityType === 'Sewing' ? 'Factory Line' : 'Stone Decor'}</p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="text-xl font-black text-[var(--text-primary)] italic tracking-tighter">{job.issueBorka || job.pataQty || job.borka || 0}</span>
                                            <span className="text-[9px] text-black/30 dark:text-white/30 ml-1.5 font-black uppercase tracking-widest italic">units</span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end">
                                               <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all border border-slate-100 dark:border-slate-800 shadow-sm">
                                                   <ChevronRight size={14} />
                                               </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!stats.activeJobs || stats.activeJobs.length === 0) && (
                            <div className="py-24 text-center italic opacity-30 text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">সিস্টেমে কোনো তথ্য পাওয়া যায়নি</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
