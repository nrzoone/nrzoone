import React, { useMemo } from 'react';
import { Activity, Scissors, Layers, Hammer, Package, Truck, LayoutGrid, Plus, Bell, MoreHorizontal, ArrowUpRight, PlusCircle, TrendingUp, TrendingDown, Clock, MousePointer2, ChevronRight, UserCheck, Share2, AlertTriangle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ProductionTrend = ({ data }) => {
    const chartData = (data || []).map((val, i) => ({
      name: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i] || i,
      value: val
    }));

    return (
        <div className="h-44 w-full mt-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700, fill: 'var(--text-secondary)'}}
                        dy={10}
                    />
                    <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: 'var(--premium-shadow)', fontSize: '11px', fontWeight: 'bold'}}
                        cursor={{stroke: '#10b981', strokeWidth: 1}}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorVal)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const DashboardCard = ({ children, isDark = false, className = '' }) => (
    <div className={`premium-card ${isDark ? 'bg-black text-white' : ''} ${className}`}>
        {children}
    </div>
);

const Overview = ({ masterData, setMasterData, setActivePanel, user, t }) => {
    const stats = useMemo(() => {
        try {
            const role = user?.role?.toLowerCase();
            const isWorker = role !== 'admin' && role !== 'manager';
            const workerName = user?.name?.toLowerCase();

            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - i);
                return d.toLocaleDateString('en-GB');
            }).reverse();

            // Filter data based on role
            const allProds = (masterData?.productions || []).filter(p => !isWorker || p.worker?.toLowerCase() === workerName);
            const allPata = (masterData?.pataEntries || []).filter(p => !isWorker || p.worker?.toLowerCase() === workerName);
            const allOutside = (masterData?.outsideWorkEntries || []).filter(p => !isWorker || p.worker?.toLowerCase() === workerName);

            const trendData = last7Days.map(date => allProds.filter(p => p.date === date).length);
            const totalProduction = allProds.length;
            const totalPata = allPata.length;

            const pendingSewing = allProds.filter(p => p.type === 'sewing' && p.status !== 'Received').length;
            const pendingStone = allProds.filter(p => p.type === 'stone' && p.status !== 'Received').length;
            const pendingOutside = allOutside.filter(p => p.status !== 'Received').length;
            
            const completions = allProds.filter(p => p.status === 'Received').length;
            
            const totalStock = (masterData?.inventory || []).reduce((sum, item) => {
                const sizes = item.sizes || {};
                const itemTotal = Object.values(sizes).reduce((s, qty) => s + (Number(qty) || 0), 0);
                return sum + itemTotal;
            }, 0);

            const todayDate = new Date().toISOString().split('T')[0];
            const todayAttendance = (masterData?.attendance || []).filter(a => a.date === todayDate);
            
            // For workers, check only their own attendance
            const myAttendance = isWorker 
                ? todayAttendance.filter(a => a.worker?.toLowerCase() === workerName)
                : todayAttendance;

            const presentCount = myAttendance.filter(a => a.status === 'present').length;
            const absentCount = myAttendance.filter(a => a.status === 'absent').length;
            const halfDayCount = myAttendance.filter(a => a.status === 'half-day').length;

            // Individual earnings for worker or total for admin
            const calculateWorkerEarnings = (name) => {
                const sewingEarnings = (masterData?.productions || []).filter(p => p.worker?.toLowerCase() === name?.toLowerCase() && p.status === 'Received').reduce((acc, b) => {
                    const design = masterData?.designs?.find(d => d.name === b.design);
                    return acc + (Number(b.receivedBorka || 0) * (design?.sewingRate || 0));
                }, 0);
                const pataEarnings = (masterData?.pataEntries || []).filter(e => e.worker?.toLowerCase() === name?.toLowerCase() && e.status === 'Received').reduce((s, e) => s + Number(e.amount || 0), 0);
                const outsideEarnings = (masterData?.outsideWorkEntries || []).filter(e => e.worker?.toLowerCase() === name?.toLowerCase() && e.status === 'Received').reduce((s, e) => s + Number(e.totalAmount || 0), 0);
                return sewingEarnings + pataEarnings + outsideEarnings;
            };

            const totalPayable = isWorker ? calculateWorkerEarnings(user.name) : (masterData?.workerCategories?.sewing || []).reduce((sum, w) => sum + calculateWorkerEarnings(w), 0);

            const financialIntel = (() => {
                if (isWorker) return { revenue: 0, productionCosts: 0, materialCosts: 0, totalCosts: 0, netProfit: 0, margin: 0 };
                
                const revenue = (masterData?.deliveries || []).reduce((acc, d) => {
                    const design = masterData?.designs?.find(ds => ds.name === d.design);
                    const price = Number(design?.sellingPrice || 0);
                    return acc + (Number(d.borka || 0) * price) + (Number(d.hijab || 0) * price);
                }, 0);

                const productionCosts = (masterData?.productions || []).filter(p => p.status === 'Received').reduce((acc, p) => {
                    const design = masterData?.designs?.find(ds => ds.name === p.design);
                    const multiplier = masterData?.multipliers?.[p.type] || 1.0;
                    let rate = 0;
                    if (p.type === 'sewing') rate = (design?.sewingRate || 0) * multiplier;
                    else if (p.type === 'stone') rate = (design?.stoneRate || 0) * multiplier;
                    return acc + ((Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)) * rate);
                }, 0);

                const materialCosts = (masterData?.productions || []).reduce((acc, p) => {
                    const design = masterData?.designs?.find(ds => ds.name === p.design);
                    const cost = Number(design?.materialCost || 0);
                    return acc + ((Number(p.issueBorka || 0) + Number(p.issueHijab || 0)) * cost);
                }, 0);

                const miscellaneousExpenses = (masterData?.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
                
                const totalCosts = productionCosts + materialCosts + miscellaneousExpenses;
                const netProfit = revenue - totalCosts;
                const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

                return { revenue, productionCosts, materialCosts, totalCosts, netProfit, margin };
            })();

            const activeJobs = [
                ...allProds.filter(p => p.status === 'Pending').map(p => ({ ...p, activityType: p.type === 'sewing' ? 'Sewing' : 'Stone' })),
                ...allPata.filter(p => p.status === 'Pending').map(p => ({ ...p, activityType: 'Pata' }))
            ].sort((a, b) => (b.id || 0) - (a.id || 0));

            return { totalProduction, totalPata, pendingSewing, pendingStone, pendingOutside, completions, totalStock, trendData, activeJobs, presentCount, absentCount, halfDayCount, totalPayable, financialIntel };
        } catch (err) {
            console.error("Stats calculation error:", err);
            return { 
                totalProduction: 0, totalPata: 0, pendingSewing: 0, pendingStone: 0, pendingOutside: 0, completions: 0, 
                totalStock: 0, trendData: [], activeJobs: [], presentCount: 0, absentCount: 0, halfDayCount: 0, 
                totalPayable: 0, financialIntel: { revenue: 0, totalCosts: 0, netProfit: 0, margin: 0 } 
            };
        }
    }, [masterData, user]);

    const shareEOD = () => {
        const today = new Date().toLocaleDateString('en-GB');
        const prods = (masterData?.productions || []).filter(p => p.date === today);
        const received = prods.filter(p => p.status === 'Received');
        const pending = prods.filter(p => p.status === 'Pending');
        
        const summary = `*NRZOONE EOD REPORT - ${today}*\n\n` +
            `📊 *Production Summary:*\n` +
            `• Jobs Issued: ${prods.length}\n` +
            `• Jobs Received: ${received.length}\n` +
            `• Currently Pending: ${pending.length}\n\n` +
            `👷 *Attendance:*\n` +
            `• Present Today: ${stats.presentCount}\n` +
            `• Absent: ${stats.absentCount}\n\n` +
            `💰 *Financial Intel:*\n` +
            `• Daily Net Profit: ৳${stats.financialIntel.netProfit.toLocaleString()}\n` +
            `• Daily Wage Load: ৳${stats.totalPayable.toLocaleString()}\n\n` +
            `_Sent via NRZOONE Factory Suite_`;
            
        window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`);
    };

    return (
        <div className="font-outfit pb-24 animate-fade-up max-w-[1500px] mx-auto min-h-screen px-6 pt-10">
            {/* Pill Navigation */}
            <div className="flex justify-center mb-16 px-4">
                 <div className="pill-nav flex-wrap justify-center dark:bg-zinc-900 dark:border-zinc-800">
                     <button className="pill-item pill-item-active">Dashboard</button>
                     <button className="pill-item dark:text-zinc-500" onClick={()=>setActivePanel('Inventory')}>Inventory</button>
                     <button className="pill-item dark:text-zinc-500" onClick={()=>setActivePanel('Reports')}>Reports</button>
                     <button className="pill-item dark:text-zinc-500" onClick={()=>setActivePanel('Settings')}>System</button>
                 </div>
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16 animate-fade-up">
                <div className="space-y-4">
                     <h1 className="section-header !mb-0 tracking-tightest">Dashboard <span className="text-slate-300 dark:text-slate-700 font-light">Overview</span></h1>
                     <div className="flex flex-wrap gap-3 items-center">
                         <span className="px-5 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg">v3.0 PRO</span>
                         <span className="px-5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-widest">Real-time Node</span>
                         { (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
                            <button onClick={shareEOD} className="ml-2 action-btn-primary !py-2 !px-6 flex items-center gap-2">
                                <Share2 size={14} /> Export Report
                            </button>
                         )}
                     </div>
                </div>
                <div className="flex flex-wrap gap-8 items-center bg-[var(--bg-secondary)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><UserCheck size={20} /></div>
                        <div>
                             <p className="text-3xl font-bold leading-none dark:text-white tracking-tight">{stats.presentCount}</p>
                             <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Present Today</p>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-[var(--border)]"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500"><Activity size={20} /></div>
                        <div>
                             <p className="text-3xl font-bold leading-none dark:text-white tracking-tight">{stats.totalPayable.toLocaleString()}৳</p>
                             <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Work Volume</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Strategic Fiscal Hub */}
            { (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') ? (
                <div className="mb-16 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-3 bg-black text-white p-12 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
                        <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-10">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-bold tracking-tight uppercase leading-none">Net Tactical Worth</h3>
                                <p className="text-[9px] font-bold uppercase text-white/40 tracking-widest">Real-time Liquidity & Production Yield Analysis</p>
                                <div className="flex gap-3 pt-6">
                                <button onClick={() => setActivePanel('Accounts')} className="px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-[9px] font-bold uppercase tracking-widest border border-white/10 transition-all">Audit Expenses</button>
                                <button onClick={() => setActivePanel('Inventory')} className="px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-[9px] font-bold uppercase tracking-widest border border-white/10 transition-all">Vault Stock</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-7xl font-bold tracking-tighter leading-none mb-3 text-white">৳{stats.financialIntel.netProfit.toLocaleString()}</p>
                                <div className="flex items-center gap-3 justify-end">
                                    <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${stats.financialIntel.margin > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-500'}`}>
                                        {stats.financialIntel.margin.toFixed(1)}% PROFIT MARGIN
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-[-10%] right-[-5%] text-white opacity-[0.05] pointer-events-none">
                            <TrendingUp size={240} strokeWidth={4} />
                        </div>
                    </div>
                    <div className="premium-card flex flex-col justify-between bg-[var(--bg-secondary)] group hover:border-black/20 dark:hover:border-white/20 transition-all">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Operational Cost</p>
                            <TrendingDown size={16} className="text-rose-500" />
                            </div>
                            <h4 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">৳{stats.financialIntel.totalCosts.toLocaleString()}</h4>
                        </div>
                        <div className="space-y-4 pt-8">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <span>Production %</span>
                                <span className="text-[var(--text-primary)]">{((stats.financialIntel.productionCosts / Math.max(1, stats.financialIntel.totalCosts)) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-black dark:bg-white transition-all duration-1000" style={{ width: `${(stats.financialIntel.productionCosts / Math.max(1, stats.financialIntel.totalCosts)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-16 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-3 bg-indigo-600 text-white p-12 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
                        <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-10">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-bold tracking-tight uppercase leading-none">Personal Ledger</h3>
                                <p className="text-[9px] font-bold uppercase text-white/40 tracking-widest">Real-time Performance & Shared Earnings</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest mb-3">Total Payable (৳)</p>
                                <p className="text-7xl font-bold tracking-tighter leading-none text-white">৳{stats.totalPayable.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card flex flex-col justify-between bg-[var(--bg-secondary)] border-[var(--border)]">
                        <div>
                           <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-4">Availability status</p>
                           <h4 className={`text-3xl font-bold tracking-tight ${stats.presentCount > 0 ? "text-emerald-500" : "text-rose-500"}`}> {stats.presentCount > 0 ? "PRESENT" : "ABSENT"}</h4>
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                             Official Log Verified
                        </div>
                    </div>
                </div>
            )}

            {/* Command Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16">
                 {[
                    { label: 'Cutting Unit', panel: 'Cutting', icon: <Scissors size={18} />, color: 'bg-black text-white dark:bg-white dark:text-black shadow-lg hover:bg-slate-900' },
                    { label: 'Sewing Node', panel: 'Swing', icon: <Layers size={18} />, color: 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' },
                    { label: 'Stone Unit', panel: 'Stone', icon: <Hammer size={18} />, color: 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' },
                    { label: 'Pata Hub', panel: 'Pata', icon: <Activity size={18} />, color: 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' },
                    { label: 'Outside Ops', panel: 'Outside', icon: <Truck size={18} />, color: 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' }
                 ].map((cmd, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setActivePanel(cmd.panel)}
                        className={`p-8 rounded-2xl ${cmd.color} border border-[var(--border)] hover:translate-y-[-4px] transition-all shadow-sm group text-left relative overflow-hidden`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-110 ${cmd.color.includes('bg-black') ? 'bg-white/10 text-white' : 'bg-[var(--bg-primary)] text-black dark:text-white'}`}>
                            {cmd.icon}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">{cmd.label}</p>
                    </button>
                 ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Profile Widget */}
                <div className="md:col-span-3 premium-card flex flex-col items-center text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-[40px] overflow-hidden shadow-2xl border-6 border-white mb-8 group overflow-hidden">
                         <img 
                            src={`https://ui-avatars.com/api/?name=${user?.name || 'Worker'}&background=121212&color=fff&bold=true&length=1`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                         />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight mb-2 italic uppercase">{user?.name || 'Authorized'}</h3>
                    <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] mb-10 italic">{user?.role || 'Personnel'}</p>

                    <div className="w-full space-y-4">
                         <div className="p-6 bg-slate-50/50 rounded-[32px] border border-white text-left">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Primary Access</p>
                              <p className="text-sm font-black italic">Dhaka HQ Terminal</p>
                         </div>
                         <div className="p-6 bg-slate-50/50 rounded-[32px] border border-white text-left">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Shift Domain</p>
                              <p className="text-sm font-black italic">Strategic Unit Ops</p>
                         </div>
                    </div>
                </div>

                {/* Gauge Performance Widget */}
                <div className="md:col-span-4 premium-card flex flex-col items-center border-[var(--border)]">
                    <div className="flex justify-between w-full mb-12">
                        <h3 className="font-black text-xl italic uppercase tracking-tighter">Yield Analytics</h3>
                        <div className="flex flex-col items-end">
                             <div className="flex items-center gap-1 text-emerald-500 font-black bg-emerald-500/10 px-4 py-2 rounded-full text-[10px] tracking-widest italic">
                                <TrendingUp size={14} /> +12.5% EFFICIENCY
                             </div>
                        </div>
                    </div>

                    <div className="relative w-full h-80 flex items-center justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { value: stats.completions || 1 },
                                        { value: Math.max(0, stats.totalProduction - stats.completions) || 1 }
                                    ]}
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={110}
                                    outerRadius={150}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="var(--text-primary)" />
                                    <Cell fill="var(--border)" />
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-x-0 bottom-16 flex flex-col items-center">
                              <p className="text-8xl font-black italic tracking-tighter leading-none text-[var(--text-primary)]">{stats.totalProduction}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-4 italic">Total Points</p>
                         </div>
                    </div>

                    <div className="w-full mt-10 bg-indigo-600 text-white p-12 rounded-[4rem] text-left relative overflow-hidden group hover:scale-[1.02] transition-all shadow-2xl">
                         <div className="relative z-10">
                            <h4 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">Task Progress</h4>
                            <p className="opacity-40 text-[10px] font-black uppercase tracking-[0.4em] italic leading-relaxed">
                                {stats.completions} jobs completed out of {stats.totalProduction} assigned.
                            </p>
                         </div>
                         <div className="absolute top-10 right-10 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black group-hover:scale-110 transition-all cursor-pointer shadow-2xl">
                              <ArrowUpRight size={28} />
                         </div>
                    </div>
                </div>

                {/* Analytics & Pulse Widget */}
                <div className="md:col-span-5 premium-card">
                    <div className="flex justify-between items-center mb-10">
                         <h3 className="font-bold text-lg uppercase tracking-tight text-slate-500">Live Intelligence</h3>
                         <div className="pill-nav !bg-slate-50/50 dark:!bg-slate-800/50">
                             <button className="pill-item !px-5 !py-2 !text-[9px] pill-item-active">WEEKLY</button>
                             <button className="pill-item !px-5 !py-2 !text-[9px]">MONTHLY</button>
                         </div>
                    </div>

                    <div className="h-56 mt-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100/50 dark:border-white/5">
                         <ProductionTrend data={stats.trendData} />
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-12">
                         <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100/50 dark:border-white/5 hover:border-black/5 transition-all">
                              <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm mb-4"><Layers size={18} className="text-rose-500" /></div>
                              <p className="text-2xl font-bold mb-1 text-black dark:text-white">{stats.pendingSewing}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sewing</p>
                         </div>
                         <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100/50 dark:border-white/5 hover:border-black/5 transition-all">
                              <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm mb-4"><Hammer size={18} className="text-rose-500" /></div>
                              <p className="text-2xl font-bold mb-1 text-black dark:text-white">{stats.pendingStone}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Stone</p>
                         </div>
                         <div className="bg-emerald-500 p-6 rounded-2xl text-white shadow-lg group cursor-pointer hover:bg-black transition-all">
                              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-all"><Package size={18} /></div>
                              <p className="text-2xl font-bold mb-1">{stats.totalStock}</p>
                              <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest">Stock</p>
                         </div>
                    </div>

                    { (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
                        <div className="mt-10 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl border border-slate-100/50 dark:border-white/5 flex justify-between items-center group cursor-pointer hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm text-amber-500"><AlertTriangle size={20} /></div>
                                <div>
                                    <h4 className="text-lg font-bold uppercase leading-none text-black dark:text-white">Audit Required</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">Critical stock nodes found</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-slate-400 group-hover:text-emerald-500 transition-all" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Overview;
