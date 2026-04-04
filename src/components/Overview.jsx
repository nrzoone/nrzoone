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
    ];    return (
        <div className="space-y-10 animate-fade-up pb-24 px-2">
            
            {/* Header: Identity Node */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 px-4">
                <div>
                     <h1 className="section-header !mb-1 uppercase">
                        NRZONE <span className="text-slate-400">OPERATIONAL</span> HUB
                    </h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                        Neural Dashboard v2.4 // Synchronized Primary Node
                    </p>
                </div>
                <div className="flex items-center bg-[var(--bg-secondary)] shadow-[var(--neu-button)] p-1.5 rounded-2xl border border-[var(--border)]">
                    {["Daily", "Weekly", "Monthly"].map((tf) => (
                        <button 
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${timeframe === tf ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:text-black'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid: Neural Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {kpiData.map((kpi, idx) => (
                    <div key={idx} className="premium-card group hover:shadow-premium transition-all duration-500 !p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-[var(--bg-primary)] rounded-2xl shadow-[var(--neu-button)] group-hover:bg-black group-hover:text-white transition-all duration-500">
                                <kpi.icon size={20} />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-bold tracking-widest">
                                <ArrowUpRight size={10} />
                                {kpi.trend}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider font-outfit">{kpi.label}</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-[var(--text-primary)] leading-none">{kpi.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
                
                {/* Secondary Node: Analytics & Trends */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="premium-card !p-8 bg-[var(--bg-secondary)]">
                        <h3 className="text-sm font-bold uppercase mb-8 tracking-widest flex items-center gap-3 text-[var(--text-primary)]">
                            <TrendingUp size={18} />
                            Production Velocity
                        </h3>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 pt-6 border-t border-[var(--border)]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">7-Day Projection</span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">+18.2% Growth</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden shadow-[var(--neu-concave)]">
                                <div className="h-full bg-black w-[72%] rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card !p-8 bg-black text-white relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold opacity-40 uppercase tracking-[0.3em]">Strategic Metrics</p>
                                <h4 className="text-xl font-black italic tracking-tighter uppercase leading-tight">Fiscal Stability & <br/> Resource Allocation</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Labor Efficiency</p>
                                    <p className="text-lg font-black italic tracking-tighter">94.2%</p>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Node Latency</p>
                                    <p className="text-lg font-black italic tracking-tighter">12ms</p>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-white text-black rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl italic">
                                DOWNLOAD ANALYTICS
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    </div>
                </div>

                {/* Live Activity Table */}
                <div className="lg:col-span-8 premium-card !p-0 overflow-hidden flex flex-col bg-[var(--bg-secondary)]">
                    <div className="p-8 md:p-10 flex justify-between items-center border-b border-[var(--border)]">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-black rounded-full"></div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Operational Node Activity</h3>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-600">Live Feedback</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                                    <th className="px-10 py-6 border-b border-[var(--border)]">Identity</th>
                                    <th className="px-10 py-6 border-b border-[var(--border)]">Process Hub</th>
                                    <th className="px-10 py-6 border-b border-[var(--border)] text-center">Load</th>
                                    <th className="px-10 py-6 border-b border-[var(--border)] text-right">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {stats.activeJobs?.slice(0, 6).map((job, i) => (
                                    <tr key={i} className="group hover:bg-[var(--bg-primary)] transition-all">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 bg-[var(--bg-primary)] shadow-[var(--neu-button)] text-slate-600 rounded-xl flex items-center justify-center font-bold text-[10px] group-hover:bg-black group-hover:text-white transition-all">
                                                    #{job.lotNo}
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 uppercase">/ {job.worker || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-sm font-bold text-[var(--text-primary)] uppercase">{job.design}</p>
                                            <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{job.activityType} Sector</p>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="text-sm font-black italic">{job.issueBorka || job.pataQty || 0}</span>
                                            <span className="text-[8px] text-slate-400 ml-2 font-bold uppercase">Units</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button 
                                                onClick={() => setActivePanel(job.activityType === 'Pata' ? 'Pata' : job.activityType === 'Sewing' ? 'Swing' : 'Stone')}
                                                className="w-10 h-10 bg-[var(--bg-primary)] shadow-[var(--neu-button)] rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all text-slate-400"
                                            >
                                                <ChevronRight size={16} />
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
;
};

export default Overview;
