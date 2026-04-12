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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-5 mb-6 md:mb-8 px-1 md:px-2">
                <div className="space-y-0.5">
                     <h1 className="text-xl md:text-2xl font-black text-black dark:text-white">
                        এনআরজোন <span className="text-blue-600">ফ্যাক্টরি ড্যাশবোর্ড</span>
                    </h1>
                    <p className="text-[8.5px] md:text-[9.5px] font-black text-black/50 dark:text-white/40 uppercase tracking-widest italic leading-none">
                        INDUSTRIAL ERP // LIVE OPERATIONAL HUB v5.2
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    {[
                        { id: "Daily", label: "দৈনিক" },
                        { id: "Weekly", label: "সাপ্তাহিক" },
                        { id: "Monthly", label: "মাসিক" }
                    ].map((tf) => (
                        <button 
                            key={tf.id}
                            onClick={() => setTimeframe(tf.id)}
                            className={`px-3 md:px-5 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9.5px] md:text-[10.5px] font-black transition-all ${timeframe === tf.id ? 'bg-blue-600 text-white shadow-lg' : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
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
                ].map((kpi, idx) => (
                    <div key={idx} className="saas-card group cursor-pointer !p-3 md:!p-4 border border-slate-100 dark:border-slate-800 shadow-sm" onClick={() => setActivePanel(kpi.id)}>
                        <div className="flex justify-between items-start mb-1 md:mb-2">
                            <div className={`w-6 h-6 md:w-8 md:h-8 ${kpi.bg} ${kpi.color} rounded flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                                <kpi.icon size={12} className="md:w-[16px] md:h-[16px]" />
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 rounded-full text-[6.5px] md:text-[8px] font-black italic">
                                {kpi.trend}
                            </div>
                        </div>
                        <div className="space-y-0">
                            <p className="text-[7.5px] md:text-[8.5px] font-black uppercase text-black/50 dark:text-white/40 tracking-wider leading-none italic">{kpi.label}</p>
                            <h3 className="text-sm md:text-xl font-black text-black dark:text-white leading-tight tracking-tighter italic">{kpi.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 md:mt-8">
                <div className="space-y-3 md:space-y-4">
                    <div className="saas-card bg-white dark:bg-slate-900 !p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-[9px] font-black uppercase mb-4 tracking-widest flex items-center gap-2 text-black dark:text-white italic">
                            <TrendingUp size={14} className="text-blue-600" />
                            উৎপাদন গতি (Velocity)
                        </h3>
                        <div className="h-28 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[8.5px] font-black text-black/40 dark:text-white/40 uppercase tracking-wider italic">প্রজেকশন</span>
                                <span className="text-[8.5px] font-black text-emerald-600 uppercase tracking-wider italic">১৮.২%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 w-[72%] rounded-full shadow-lg shadow-blue-500/20"></div>
                            </div>
                        </div>
                    </div>

                    <div className="saas-card bg-slate-950 text-white border-none shadow-xl !p-6">
                        <div className="space-y-8">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">BI Metrics</p>
                                <h4 className="text-lg font-black uppercase tracking-tight leading-tight">সিস্টেম আর্কিটেকচার <br/><span className="text-white/60 font-medium">V5.2 ELITE</span></h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-white/30">এনক্রিপশন</p>
                                    <p className="text-xs font-black">AES-256 SECURE</p>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-white/30">সার্ভার স্ট্যাটাস</p>
                                    <p className="text-xs font-black text-emerald-400 italic">OPTIMAL NODE</p>
                                </div>
                            </div>
                            <button className="w-full py-3.5 bg-white text-black rounded-xl font-black uppercase text-[9px] tracking-widest hover:opacity-90 active:scale-[0.98] transition-all">
                                রিপোর্ট ডাউনলোড (PDF)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Activity Table */}
                <div className="lg:col-span-2 saas-card !p-0 overflow-hidden flex flex-col">
                    <div className="p-5 md:p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                            <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-tight">লাইভ প্রোডাকশন ফিড</h3>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600">LIVE FEED</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[8px] text-black/40 dark:text-white/40 uppercase tracking-widest font-black italic">
                                    <th className="px-5 py-3 border-b border-slate-50 dark:border-slate-800">লট / কারিগর</th>
                                    <th className="px-5 py-3 border-b border-slate-50 dark:border-slate-800">ডিজাইন</th>
                                    <th className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 text-center">পরিমাণ</th>
                                    <th className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 text-right">মডিউল</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {(stats.activeJobs || []).slice(0, 10).map((job, i) => (
                                    <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={() => setActivePanel(job.activityType === 'Pata' ? 'Pata' : job.activityType === 'Sewing' ? 'Swing' : 'Stone')}>
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 bg-slate-950 text-white rounded flex items-center justify-center font-black text-[8px] shadow-sm">
                                                    #{job.lotNo}
                                                </div>
                                                <span className="text-[0.65rem] font-black text-black dark:text-white uppercase italic">/ {job.worker?.split(' ')[0] || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <p className="text-[11px] font-black text-black dark:text-white uppercase leading-none mb-0.5 italic">{job.design}</p>
                                            <p className="text-[7.5px] text-black/40 dark:text-white/30 uppercase tracking-wider font-bold italic">{job.activityType === 'Pata' ? 'Logistics' : job.activityType === 'Sewing' ? 'Factory' : 'Stone Unit'}</p>
                                        </td>
                                        <td className="px-5 py-2.5 text-center">
                                            <span className="text-base font-black text-black dark:text-white italic">{job.issueBorka || job.pataQty || job.borka || 0}</span>
                                            <span className="text-[8px] text-black/30 dark:text-white/30 ml-1 font-black uppercase">U</span>
                                        </td>
                                        <td className="px-5 py-2.5 text-right">
                                            <div className="flex justify-end">
                                               <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded flex items-center justify-center text-slate-200 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all border border-slate-100 dark:border-slate-800 shadow-inner">
                                                   <ChevronRight size={12} />
                                               </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!stats.activeJobs || stats.activeJobs.length === 0) && (
                            <div className="py-24 text-center italic opacity-30 text-xs font-bold text-black dark:text-white uppercase tracking-widest">সিস্টেমে কোনো তথ্য পাওয়া যায়নি</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
