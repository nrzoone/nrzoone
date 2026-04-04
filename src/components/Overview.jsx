import React, { useState } from "react";
import { 
    Activity, 
    TrendingUp, 
    Users, 
    ArrowUpRight, 
    ArrowDownRight, 
    Clock, 
    DollarSign,
    ChevronRight,
    Search,
    Filter,
    Calendar,
    Scissors,
    Package,
    LayoutGrid,
    Truck
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const Overview = ({ masterData, stats: propStats, setActivePanel, t }) => {
    const [timeframe, setTimeframe] = useState("Weekly");

    // Internal stats calculation to prevent crashes if propStats is undefined
    const stats = propStats || {
        totalWorkers: (masterData?.workerDocs || []).length,
        totalProduction: (masterData?.cuttingEntries?.length || 0) + 
                         (masterData?.sewingEntries?.length || 0) + 
                         (masterData?.pataEntries?.length || 0),
        totalFinancials: (masterData?.workerDocs || []).reduce((acc, w) => acc + (w.balance || 0), 0),
        pendingUnits: (masterData?.cuttingEntries || []).filter(e => !e.isCompleted).length,
        activeJobs: [
            ...(masterData?.cuttingEntries || []).map(e => ({ ...e, activityType: 'Cutting' })),
            ...(masterData?.sewingEntries || []).map(e => ({ ...e, activityType: 'Sewing' })),
            ...(masterData?.pataEntries || []).map(e => ({ ...e, activityType: 'Pata' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date))
    };

    // Sample data for the chart - logic matches the stats from App.jsx
    const trendData = [
        { name: 'Mon', value: 45 },
        { name: 'Tue', value: 52 },
        { name: 'Wed', value: 48 },
        { name: 'Thu', value: 61 },
        { name: 'Fri', value: 55 },
        { name: 'Sat', value: 67 },
        { name: 'Sun', value: 59 },
    ];

    const kpiData = [
        { 
            label: "Total Personnel", 
            value: stats.totalWorkers || 0, 
            trend: "+4.2%", 
            icon: Users,
            color: "emerald"
        },
        { 
            label: "Production Load", 
            value: stats.totalProduction || 0, 
            trend: "+12.1%", 
            icon: Activity,
            color: "blue"
        },
        { 
            label: "Financial Yield", 
            value: `৳${(stats.totalFinancials || 0).toLocaleString()}`, 
            trend: "+8.4%", 
            icon: DollarSign,
            color: "amber"
        },
        { 
            label: "Pending Units", 
            value: stats.pendingUnits || 0, 
            trend: "-2.1%", 
            icon: Package,
            color: "rose"
        }
    ];

    return (
        <div className="space-y-12 animate-fade-up pb-24 italic px-2">
            
            {/* Header: Identity Node */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 px-6">
                <div>
                     <h1 className="section-header">
                        NNRZONE <span className="text-slate-500">OPERATIONAL</span> HUB
                    </h1>
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] mt-2 italic">
                        Real-time Neural Dashboard v2.4 // Synchronized Primary Node
                    </p>
                </div>
                <div className="flex items-center bg-white shadow-[var(--neu-convex)] p-3 rounded-2xl border-none">
                    <button 
                        onClick={() => setTimeframe("Daily")}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === "Daily" ? 'bg-black text-white shadow-xl scale-105' : 'text-slate-700 hover:text-black'}`}
                    >
                        Daily
                    </button>
                    <button 
                         onClick={() => setTimeframe("Weekly")}
                         className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === "Weekly" ? 'bg-black text-white shadow-xl scale-105' : 'text-slate-700 hover:text-black'}`}
                    >
                        Weekly
                    </button>
                    <button 
                         onClick={() => setTimeframe("Monthly")}
                         className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === "Monthly" ? 'bg-black text-white shadow-xl scale-105' : 'text-slate-700 hover:text-black'}`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {/* KPI Grid: Neural Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {kpiData.map((kpi, idx) => (
                    <div key={idx} className="premium-card shadow-[var(--neu-convex)] group hover:scale-[1.02] transition-all duration-500 p-10 border-none relative overflow-hidden bg-white">
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start mb-8">
                                <div className={`p-4 bg-slate-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-all duration-500`}>
                                    <kpi.icon size={24} />
                                </div>
                                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black tracking-widest">
                                    <ArrowUpRight size={10} />
                                    {kpi.trend}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-2">{kpi.label}</p>
                                <h3 className="text-4xl font-black italic tracking-tighter leading-none">{kpi.value}</h3>
                            </div>
                        </div>
                        {/* Interactive Background Glow */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-all"></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
                
                {/* Secondary Node: Analytics & Trends */}
                <div className="lg:col-span-4 space-y-12">
                    <div className="premium-card shadow-[var(--neu-convex)] p-10 border-none bg-white">
                        <h3 className="text-xl font-black uppercase mb-8 italic tracking-tighter flex items-center gap-4">
                            <TrendingUp size={20} className="text-black" />
                            Production Velocity
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">7-Day Projection</span>
                                <span className="text-xs font-black text-emerald-600 uppercase">+18.2% Growth</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-black w-[72%] rounded-full shadow-lg"></div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card shadow-[var(--neu-convex)] p-10 border-none bg-black text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.4em] mb-4">Strategic Metrics</p>
                            <h4 className="text-2xl font-black italic tracking-tighter mb-8 leading-tight">FISCAL STABILITY & <br/> RESOURCE ALLOCATION</h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Labor Efficiency</p>
                                    <p className="text-xl font-black italic tracking-tighter">94.2%</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Node Latency</p>
                                    <p className="text-xl font-black italic tracking-tighter">14ms</p>
                                </div>
                            </div>
                            <button className="w-full mt-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl italic">
                                DOWNLOAD LOGS
                            </button>
                        </div>
                        {/* Decorative Neural Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    </div>
                </div>

                {/* Live Activity Table */}
                <div className="lg:col-span-8 premium-card !p-0 shadow-[var(--neu-convex)] overflow-hidden border-none flex flex-col bg-white">
                    <div className="p-12 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-3 h-12 bg-black rounded-full shadow-lg"></div>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Operational Node Activity</h3>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-2 bg-emerald-50 rounded-full border-2 border-white shadow-sm">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Factory Live</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left font-black uppercase italic border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] text-slate-700 tracking-widest border-b-2 border-slate-50">
                                    <th className="px-12 py-8">Node Identity</th>
                                    <th className="px-12 py-8">Process Hub</th>
                                    <th className="px-12 py-8">Unit Load</th>
                                    <th className="px-12 py-8 text-right">Node Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-50/50">
                                {stats.activeJobs?.slice(0, 6).map((job, i) => (
                                    <tr key={i} className="group hover:bg-slate-50/80 transition-all text-sm text-black">
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <span className="text-[10px] font-mono">#{job.lotNo}</span>
                                                </div>
                                                <span className="text-base text-black/40">/ {job.worker || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8">
                                            <p className="text-lg leading-none">{job.design}</p>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-2">{job.activityType} Sector</p>
                                        </td>
                                        <td className="px-12 py-8">
                                            <span className="text-xl">{job.issueBorka || job.pataQty || 0}</span>
                                            <span className="text-[10px] text-slate-600 ml-2">Units</span>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <button 
                                                onClick={() => setActivePanel(job.activityType === 'Pata' ? 'Pata' : job.activityType === 'Sewing' ? 'Swing' : 'Stone')}
                                                className="w-12 h-12 bg-white shadow-[var(--neu-convex)] rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all border-none"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Overview;
