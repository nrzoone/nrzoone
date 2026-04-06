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

const Overview = ({ masterData, stats: propStats, setActivePanel, t }) => {
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
                const parts = d.split('/');
                if (parts.length !== 3) return 0;
                const [day, month, year] = parts;
                return new Date(`${year}-${month}-${day}`).getTime();
            };
            return parseDate(b.date) - parseDate(a.date);
        })
    };

    const trendData = [
        { name: 'Mon', value: 45 }, { name: 'Tue', value: 52 },
        { name: 'Wed', value: 48 }, { name: 'Thu', value: 61 },
        { name: 'Fri', value: 55 }, { name: 'Sat', value: 67 },
        { name: 'Sun', value: 59 },
    ];

    return (
        <div className="space-y-12 animate-fade-up pb-32">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 px-2">
                <div className="space-y-1">
                     <h1 className="text-3xl font-extrabold text-black dark:text-white">
                        এনআরজোন <span className="text-blue-600">ফ্যাক্টরি ড্যাশবোর্ড</span>
                    </h1>
                    <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest italic">
                        INDUSTRIAL ERP // LIVE OPERATIONAL HUB v5.2
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    {[
                        { id: "Daily", label: "দৈনিক" },
                        { id: "Weekly", label: "সাপ্তাহিক" },
                        { id: "Monthly", label: "মাসিক" }
                    ].map((tf) => (
                        <button 
                            key={tf.id}
                            onClick={() => setTimeframe(tf.id)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${timeframe === tf.id ? 'bg-blue-600 text-white shadow-lg' : 'text-black dark:text-white hover:text-black'}`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "মোট কারিগর", value: (masterData.workerDocs || []).length, trend: "+4.2%", icon: Users, id: "Settings", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10" },
                    { label: "চলমান কাজ", value: (masterData.productions || []).length + (masterData.pataEntries || []).length, trend: "+12.1%", icon: Activity, id: "Cutting", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
                    { label: "আর্থিক হিসাব (৳)", value: `${((masterData.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0) / 1000).toFixed(1)}k`, trend: "+8.4%", icon: DollarSign, id: "Accounts", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/10" },
                    { label: "পেন্ডিং লট", value: (masterData.productions || []).filter(p => p.status === 'Pending').length, trend: "-2.1%", icon: Package, id: "Cutting", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" }
                ].map((kpi, idx) => (
                    <div key={idx} className="saas-card group cursor-pointer" onClick={() => setActivePanel(kpi.id)}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                                <kpi.icon size={22} />
                            </div>
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 rounded-full text-[10px] font-bold">
                                {kpi.trend}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-black dark:text-white tracking-wider leading-none">{kpi.label}</p>
                            <h3 className="text-3xl font-bold text-black dark:text-white leading-tight">{kpi.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
                <div className="space-y-6">
                    <div className="saas-card bg-white dark:bg-slate-900">
                        <h3 className="text-[11px] font-bold uppercase mb-8 tracking-widest flex items-center gap-3 text-black dark:text-white">
                            <TrendingUp size={18} className="text-blue-600" />
                            উৎপাদন গতি (Velocity)
                        </h3>
                        <div className="h-40 w-full">
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
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">সাপ্তাহিক প্রজেকশন</span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">+১৮.২% উন্নতি</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 w-[72%] rounded-full shadow-lg shadow-blue-500/20"></div>
                            </div>
                        </div>
                    </div>

                    <div className="saas-card bg-slate-950 text-white border-none shadow-xl">
                        <div className="space-y-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest">BI Metrics</p>
                                <h4 className="text-xl font-bold uppercase tracking-tight">সিস্টেম আর্কিটেকচার <br/><span className="text-black dark:text-white">V5.2 ELITE</span></h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/5 pb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white">এনক্রিপশন</p>
                                    <p className="text-sm font-bold">AES-256 SECURE</p>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white">সার্ভার স্ট্যাটাস</p>
                                    <p className="text-sm font-bold text-emerald-400 italic">OPTIMAL NODE</p>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-[10px] tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-white/5">
                                রিপোর্ট ডাউনলোড (PDF)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Activity Table */}
                <div className="lg:col-span-2 saas-card !p-0 overflow-hidden flex flex-col">
                    <div className="p-8 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                            <h3 className="text-xl font-bold text-black dark:text-white">লাইভ প্রোডাকশন ফিড</h3>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">LIVE FEED</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] text-black dark:text-white uppercase tracking-widest font-bold">
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800">লট নম্বর / কারিগর</th>
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800">ডিজাইন ও প্রসেস</th>
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 text-center">পরিমাণ</th>
                                    <th className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 text-right">মডিউল</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {(stats.activeJobs || []).slice(0, 8).map((job, i) => (
                                    <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={() => setActivePanel(job.activityType === 'Pata' ? 'Pata' : job.activityType === 'Sewing' ? 'Swing' : 'Stone')}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-bold text-[10px] shadow-sm">
                                                    #{job.lotNo}
                                                </div>
                                                <span className="text-xs font-bold text-black dark:text-black dark:text-white uppercase">/ {job.worker || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-black dark:text-white uppercase leading-none mb-1">{job.design}</p>
                                            <p className="text-[9px] text-black dark:text-white uppercase tracking-wider font-bold">{job.activityType === 'Pata' ? 'Logistics HUB' : job.activityType === 'Sewing' ? 'Factory Line' : 'Stone Unit'}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-xl font-bold text-black dark:text-white">{job.issueBorka || job.pataQty || job.borka || 0}</span>
                                            <span className="text-[10px] text-black dark:text-white ml-2 font-bold uppercase tracking-wider">UNIT</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end">
                                               <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-all border border-slate-100 dark:border-slate-800">
                                                   <ChevronRight size={18} />
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
