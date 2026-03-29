import React, { useMemo } from 'react';
import { Activity, Scissors, Layers, Hammer, Package, Truck, LayoutGrid, Plus, Bell, MoreHorizontal, ArrowUpRight, PlusCircle } from 'lucide-react';

const ProductionTrend = ({ data }) => {
    const safeData = (data && data.length > 0) ? data : [0];
    const maxVal = Math.max(...safeData, 1);
    const points = safeData.map((d, i) => `${(i * 100) / (safeData.length > 1 ? safeData.length - 1 : 1)},${100 - (d / maxVal) * 100}`).join(' ');
    return (
        <div className="h-28 w-full mt-4">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradientO" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0,0,0,0.05)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                <path d={`M 0 100 L 0 ${100 - (safeData[0] / maxVal) * 100} L ${points} L 100 100 Z`} fill="url(#chartGradientO)" />
                <polyline
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mt-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
        </div>
    );
};

const DashboardCard = ({ children, isDark = false, className = '' }) => (
    <div className={`${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-slate-900'} rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/60 relative overflow-hidden ${className}`}>
        {children}
    </div>
);

const Overview = ({ masterData, setMasterData, setActivePanel, user, t }) => {
    const stats = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return d.toLocaleDateString('en-GB');
        }).reverse();

        const trendData = last7Days.map(date => (masterData.productions || []).filter(p => p.date === date).length);
        const totalProduction = (masterData.productions || []).length;
        const totalPata = (masterData.pataEntries || []).length;

        const pendingSewing = (masterData.productions || []).filter(p => p.type === 'sewing' && p.status !== 'Received').length;
        const pendingStone = (masterData.productions || []).filter(p => p.type === 'stone' && p.status !== 'Received').length;
        const pendingOutside = (masterData.outsideWorkEntries || []).filter(p => p.status !== 'Received').length;
        
        const completions = (masterData.productions || []).filter(p => p.status === 'Received').length + (masterData.pataEntries || []).filter(p => p.status === 'Received').length;

        const activeJobs = [
            ...(masterData.productions || []).filter(p => p.status === 'Pending').map(p => ({ ...p, activityType: p.type === 'sewing' ? 'Sewing' : 'Stone' })),
            ...(masterData.pataEntries || []).filter(p => p.status === 'Pending').map(p => ({ ...p, activityType: 'Pata' }))
        ].sort((a, b) => (b.id || 0) - (a.id || 0));

        return { totalProduction, totalPata, pendingSewing, pendingStone, pendingOutside, completions, trendData, activeJobs };
    }, [masterData]);

    const userName = user?.name || "Dilan";

    return (
        <div className="font-outfit pb-24 animate-fade-up max-w-[1400px] mx-auto min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1a1a1a]">
                    Hi, {userName}!
                </h1>
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('Swing')} className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full font-bold text-sm tracking-wide flex items-center gap-2 hover:bg-black transition-all">
                        <Plus size={16} /> Create
                    </button>
                </div>
            </div>

            {/* Top Grid - Matches iDraft top section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                
                {/* Overall Information - Dark Card */}
                <DashboardCard isDark className="md:col-span-12 lg:col-span-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-semibold text-lg">Overall Information</h3>
                        <button className="text-white/60 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="flex items-baseline gap-12 mb-10">
                        <div>
                            <p className="text-5xl font-bold tracking-tighter">{stats.totalProduction}</p>
                            <p className="text-[10px] text-white/50 uppercase font-semibold tracking-wider mt-1">Total Jobs<br/>for all time</p>
                        </div>
                        <div>
                            <p className="text-5xl font-bold tracking-tighter text-white/90">{stats.completions}</p>
                            <p className="text-[10px] text-white/50 uppercase font-semibold tracking-wider mt-1">Projects<br/>Completed</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center pt-5">
                            <Layers size={18} className="text-white/80 mb-2" />
                            <p className="text-2xl font-bold">{stats.pendingSewing}</p>
                            <span className="text-[9px] text-white/60 font-semibold tracking-wider uppercase mt-1">Sewing</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center pt-5">
                            <Hammer size={18} className="text-white/80 mb-2" />
                            <p className="text-2xl font-bold">{stats.pendingStone}</p>
                            <span className="text-[9px] text-white/60 font-semibold tracking-wider uppercase mt-1">Stone</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center pt-5">
                            <Truck size={18} className="text-white/80 mb-2" />
                            <p className="text-2xl font-bold">{stats.pendingOutside}</p>
                            <span className="text-[9px] text-white/60 font-semibold tracking-wider uppercase mt-1">Outside</span>
                        </div>
                    </div>
                </DashboardCard>

                {/* Weekly progress - Vector Chart */}
                <DashboardCard className="md:col-span-6 lg:col-span-4">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg">Weekly progress</h3>
                        <ArrowUpRight size={18} className="text-slate-400" />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-black"></div> Factory</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Logistics</span>
                    </div>
                    
                    <ProductionTrend data={stats.trendData} />
                </DashboardCard>

                {/* Month progress - Donut Chart Representation & Download */}
                <DashboardCard className="md:col-span-6 lg:col-span-3 flex flex-col justify-between items-center text-center">
                    <div className="w-full text-left">
                        <h3 className="font-semibold text-lg flex items-center justify-between">Month progress <LayoutGrid size={18} className="text-slate-400"/></h3>
                        <p className="text-[10px] font-bold text-emerald-600 tracking-wider mt-1">+20% compared to last month</p>
                    </div>
                    
                    <div className="relative w-32 h-32 flex items-center justify-center mt-6 mb-4">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="#1a1a1a" strokeWidth="8" fill="none" strokeDasharray="251" strokeDashoffset="50" className="transition-all duration-1000" />
                            <circle cx="50" cy="50" r="28" stroke="#1a1a1a" strokeWidth="1" fill="none" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-bold tracking-tight">80%</span>
                        </div>
                    </div>

                    <div className="w-full mt-auto flex gap-2">
                        <button className="bg-[#1a1a1a] text-white p-3 rounded-full hover:bg-black transition-colors">
                            <Activity size={16} />
                        </button>
                        <button onClick={()=>window.print()} className="flex-1 bg-white border-2 border-slate-100 rounded-full text-xs font-bold px-4 hover:border-black transition-colors">
                            Download Report
                        </button>
                    </div>
                </DashboardCard>
            </div>

            {/* Bottom Grid - Mixed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Check Goals */}
                <DashboardCard className="md:col-span-6 lg:col-span-4 min-h-[220px]">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-semibold text-base">Current Goals:</h3>
                        <div className="flex gap-2 text-slate-400">
                            <Activity size={16} /><Scissors size={16} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-black flex items-center justify-center"><div className="w-2 h-2 rounded-sm bg-white"></div></div>
                            <span className="text-sm font-semibold tracking-wide">Finish Pata Backlog</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-40">
                            <div className="w-4 h-4 rounded border-2 border-slate-300"></div>
                            <span className="text-sm font-semibold tracking-wide">Clear Cutting Room</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-40">
                            <div className="w-4 h-4 rounded border-2 border-slate-300"></div>
                            <span className="text-sm font-semibold tracking-wide">Update Attendance Log</span>
                        </div>
                    </div>
                </DashboardCard>

                {/* Tasks in Process Area */}
                <div className="md:col-span-6 lg:col-span-8">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <h3 className="font-semibold text-base text-slate-800 tracking-wide">Task in process ({stats.activeJobs.length})</h3>
                        <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-black transition-colors">Open archive {'>'}</button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.activeJobs.slice(0, 2).map((job, idx) => (
                            <DashboardCard key={idx} className="!p-5 !rounded-3xl flex flex-col justify-between min-h-[200px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all">
                                <div className="flex justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                        {job.activityType === 'Sewing' ? <Layers size={18} className="text-slate-600" /> : <Hammer size={18} className="text-slate-600" />}
                                    </div>
                                    <button className="text-slate-300 hover:text-black"><MoreHorizontal size={18} /></button>
                                </div>
                                <div className="mt-4 mb-6">
                                    <h4 className="font-bold text-base leading-snug">{job.design || `Lot #${job.lotNo}`}</h4>
                                    <p className="text-xs font-semibold text-slate-400 mt-1">{job.worker}</p>
                                </div>
                                <div className="flex justify-between items-end mt-auto">
                                    <span className="text-[10px] font-bold text-slate-400">{job.date}</span>
                                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center"><Bell size={12}/></div>
                                </div>
                            </DashboardCard>
                        ))}

                        {/* Add Task Button Card */}
                        <div className="border border-dashed border-slate-300 rounded-3xl flex items-center justify-center min-h-[200px] text-slate-400 hover:text-black hover:border-black hover:bg-white transition-all cursor-pointer group">
                            <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                <PlusCircle size={24} strokeWidth={1.5} />
                                <span className="text-xs font-bold tracking-widest uppercase mt-2">Add task</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Last Projects */}
            <div className="mt-8 mb-4 px-2 flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-800 tracking-wide">Last Projects</h3>
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sort by</span>
                    <LayoutGrid size={14} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard isDark className="!p-5 !rounded-[24px]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Activity size={14} className="text-white"/></div>
                        <div>
                            <h4 className="font-bold text-sm">New Schedule</h4>
                            <p className="text-[9px] text-white/50 tracking-wider font-semibold">In progress</p>
                        </div>
                    </div>
                </DashboardCard>
                
                <DashboardCard isDark className="!p-5 !rounded-[24px]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"><Hammer size={14}/></div>
                        <div>
                            <h4 className="font-bold text-sm">Stone Production</h4>
                            <p className="text-[9px] text-white/50 tracking-wider font-semibold">Completed</p>
                        </div>
                    </div>
                </DashboardCard>
                
                <DashboardCard isDark className="!p-5 !rounded-[24px]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Package size={14} className="text-white"/></div>
                        <div>
                            <h4 className="font-bold text-sm">Pata Setup</h4>
                            <p className="text-[9px] text-white/50 tracking-wider font-semibold">In progress</p>
                        </div>
                    </div>
                </DashboardCard>

                <DashboardCard isDark className="!p-5 !rounded-[24px]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Scissors size={14} className="text-white"/></div>
                        <div>
                            <h4 className="font-bold text-sm">Cutting Phase 2</h4>
                            <p className="text-[9px] text-white/50 tracking-wider font-semibold">Pending Review</p>
                        </div>
                    </div>
                </DashboardCard>
            </div>

        </div>
    );
};

export default Overview;
// End of Overview Component
