import React, { useMemo } from 'react';
import { Activity, Scissors, Layers, Hammer, Package, Truck, LayoutGrid, Plus, Bell, MoreHorizontal, ArrowUpRight, PlusCircle, TrendingUp, TrendingDown, Clock, MousePointer2, ChevronRight, UserCheck, Share2, AlertTriangle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ProductionTrend = ({ data }) => {
    const chartData = data.map((val, i) => ({
      name: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i] || i,
      value: val
    }));

    return (
        <div className="h-44 w-full mt-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E11D48" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                        dy={10}
                    />
                    <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold'}}
                        cursor={{stroke: '#E11D48', strokeWidth: 1}}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#E11D48" 
                        strokeWidth={3}
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
        
        const completions = (masterData.productions || []).filter(p => p.status === 'Received').length;
        
        const totalStock = (masterData.inventory || []).reduce((sum, item) => {
            const sizes = item.sizes || {};
            const itemTotal = Object.values(sizes).reduce((s, qty) => s + (Number(qty) || 0), 0);
            return sum + itemTotal;
        }, 0);

        // Attendance stats for selectedDate (today)
        const todayDate = new Date().toISOString().split('T')[0];
        const todayAttendance = (masterData.attendance || []).filter(a => a.date === todayDate);
        const presentCount = todayAttendance.filter(a => a.status === 'present').length;
        const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
        const halfDayCount = todayAttendance.filter(a => a.status === 'half-day').length;

        const totalPayable = (masterData.workerCategories?.sewing || []).reduce((sum, w) => {
            const entries = (masterData.productions || []).filter(p => p.worker === w && p.status === 'Received');
            return sum + entries.reduce((acc, b) => {
                const design = masterData.designs.find(d => d.name === b.design);
                return acc + (Number(b.receivedBorka || 0) * (design?.sewingRate || 0));
            }, 0);
        }, 0) + (masterData.pataEntries || []).filter(e => e.status === 'Received').reduce((s, e) => s + Number(e.amount || 0), 0);

        // HYPER-ADVANCED FINANCIAL INTELLIGENCE
        const financialIntel = (() => {
            const revenue = (masterData.deliveries || []).reduce((acc, d) => {
                const design = masterData.designs.find(ds => ds.name === d.design);
                const price = Number(design?.sellingPrice || 0);
                return acc + (Number(d.borka || 0) * price) + (Number(d.hijab || 0) * price);
            }, 0);

            const productionCosts = (masterData.productions || []).filter(p => p.status === 'Received').reduce((acc, p) => {
                const design = masterData.designs.find(ds => ds.name === p.design);
                const multiplier = masterData.multipliers?.[p.type] || 1.0;
                let rate = 0;
                if (p.type === 'sewing') rate = (design?.sewingRate || 0) * multiplier;
                else if (p.type === 'stone') rate = (design?.stoneRate || 0) * multiplier;
                return acc + ((Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)) * rate);
            }, 0);

            const materialCosts = (masterData.productions || []).reduce((acc, p) => {
                const design = masterData.designs.find(ds => ds.name === p.design);
                const cost = Number(design?.materialCost || 0);
                return acc + ((Number(p.issueBorka || 0) + Number(p.issueHijab || 0)) * cost);
            }, 0);

            const miscellaneousExpenses = (masterData.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
            
            const totalCosts = productionCosts + materialCosts + miscellaneousExpenses;
            const netProfit = revenue - totalCosts;
            const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

            return { revenue, productionCosts, materialCosts, totalCosts, netProfit, margin };
        })();

        const activeJobs = [
            ...(masterData.productions || []).filter(p => p.status === 'Pending').map(p => ({ ...p, activityType: p.type === 'sewing' ? 'Sewing' : 'Stone' })),
            ...(masterData.pataEntries || []).filter(p => p.status === 'Pending').map(p => ({ ...p, activityType: 'Pata' }))
        ].sort((a, b) => (b.id || 0) - (a.id || 0));

        return { totalProduction, totalPata, pendingSewing, pendingStone, pendingOutside, completions, totalStock, trendData, activeJobs, presentCount, absentCount, halfDayCount, totalPayable, financialIntel };
    }, [masterData]);

    const shareEOD = () => {
        const today = new Date().toLocaleDateString('en-GB');
        const prods = (masterData.productions || []).filter(p => p.date === today);
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
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16">
                <div className="space-y-6">
                     <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#121212] leading-none mb-4 italic">
                        YOUR STATISTICS
                     </h1>
                     <div className="flex flex-wrap gap-4 items-center">
                         <span className="pill-item pill-item-active !px-6 !py-3 !text-[11px] uppercase tracking-widest">Medical Logic Tracker</span>
                         <span className="pill-item bg-gray-100 dark:bg-zinc-900 dark:text-zinc-400 !px-6 !py-3 !text-[11px] uppercase tracking-widest">Factory Analytics</span>
                         <button onClick={shareEOD} className="ml-4 flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                            <Share2 size={16} /> Share EOD Report
                         </button>
                     </div>
                </div>
                <div className="flex flex-wrap gap-6 items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[40px] border border-white dark:border-zinc-800 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shadow-inner"><UserCheck size={24} /></div>
                        <div>
                             <p className="text-3xl font-black leading-none italic dark:text-white">{stats.presentCount}</p>
                             <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.3em] mt-2">Present Today</p>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-slate-200 dark:bg-zinc-800"></div>
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shadow-inner"><Activity size={24} /></div>
                        <div>
                             <p className="text-3xl font-black leading-none italic dark:text-white">{stats.totalPayable.toLocaleString()}৳</p>
                             <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.3em] mt-2">Kajer Taka</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Strategic Fiscal Hub */}
            <div className="mb-16 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-3 bg-black text-white p-12 rounded-[4rem] relative overflow-hidden group shadow-3xl italic">
                    <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Net Strategic Worth</h3>
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Real-time Factory Liquidity & Margin Analysis</p>
                            <div className="flex gap-4 pt-4">
                               <button onClick={() => setActivePanel('Expense')} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all">Logging Expense</button>
                               <button onClick={() => setActivePanel('Inventory')} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all">Audit Stock</button>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-6xl font-black italic tracking-tighter leading-none mb-3 text-emerald-500">৳{stats.financialIntel.netProfit.toLocaleString()}</p>
                             <div className="flex items-center gap-3 justify-end">
                                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${stats.financialIntel.margin > 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                     {stats.financialIntel.margin.toFixed(1)}% MARGIN
                                 </div>
                             </div>
                        </div>
                    </div>
                    {/* Animated Profit Ticker Placeholder */}
                    <div className="absolute bottom-[-20%] left-[-10%] text-white opacity-[0.03] rotate-12 pointer-events-none">
                        <TrendingUp size={280} strokeWidth={3} />
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[4rem] border-4 border-slate-50 flex flex-col justify-between italic shadow-2xl group hover:border-black transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Fiscal Exposure</p>
                           <TrendingDown size={16} className="text-rose-500" />
                        </div>
                        <h4 className="text-3xl font-black italic tracking-tighter text-black">৳{stats.financialIntel.totalCosts.toLocaleString()}</h4>
                    </div>
                    <div className="space-y-3">
                         <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-400">
                             <span>Production</span>
                             <span className="text-black">৳{stats.financialIntel.productionCosts.toLocaleString()}</span>
                         </div>
                         <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-rose-500" style={{ width: `${(stats.financialIntel.productionCosts / stats.financialIntel.totalCosts) * 100}%` }}></div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Rapid Command Center */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16">
                 {[
                    { label: 'Issue cutting', panel: 'Cutting', icon: <Scissors size={20} />, color: 'bg-black text-white' },
                    { label: 'Sewing Node', panel: 'Sewing', icon: <Layers size={20} />, color: 'bg-slate-50' },
                    { label: 'Stone Production', panel: 'Stone', icon: <Hammer size={20} />, color: 'bg-slate-50' },
                    { label: 'Pata Workshop', panel: 'Pata', icon: <Activity size={20} />, color: 'bg-slate-50' },
                    { label: 'Outside Ops', panel: 'OutsideWork', icon: <Truck size={20} />, color: 'bg-slate-50' }
                 ].map((cmd, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setActivePanel(cmd.panel)}
                        className={`p-8 rounded-[2.5rem] ${cmd.color} border-4 border-slate-50 hover:border-black transition-all shadow-xl group text-left`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 ${cmd.color === 'bg-black text-white' ? 'bg-zinc-800' : 'bg-white'}`}>
                            {cmd.icon}
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest leading-tight italic">{cmd.label}</p>
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
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Access</p>
                              <p className="text-sm font-black italic">Dhaka HQ Terminal</p>
                         </div>
                         <div className="p-6 bg-slate-50/50 rounded-[32px] border border-white text-left">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Shift Domain</p>
                              <p className="text-sm font-black italic">Strategic Unit Ops</p>
                         </div>
                    </div>
                    
                    <button className="mt-8 w-full py-4 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all">
                        View Dossier
                    </button>
                </div>

                {/* Gauge Performance Widget */}
                <div className="md:col-span-4 premium-card flex flex-col items-center">
                    <div className="flex justify-between w-full mb-12">
                        <h3 className="font-black text-xl italic uppercase tracking-tighter">Yield Performance</h3>
                        <div className="flex flex-col items-end">
                             <div className="flex items-center gap-1 text-emerald-500 font-bold bg-emerald-50 px-4 py-2 rounded-full text-xs">
                                <TrendingUp size={14} /> +12.5%
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
                                    innerRadius={100}
                                    outerRadius={140}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#E11D48" />
                                    <Cell fill="#F4F6F9" />
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-x-0 bottom-16 flex flex-col items-center">
                              <p className="text-7xl font-black italic tracking-tighter leading-none">{stats.totalProduction}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Production Point</p>
                         </div>
                    </div>

                    <div className="w-full mt-6 bg-zinc-900 text-white p-10 rounded-[50px] text-left relative overflow-hidden group hover:bg-black transition-all">
                         <div className="relative z-10">
                            <h4 className="text-4xl font-black tracking-tighter mb-2 italic italic">YOUR REPORT</h4>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">85% More efficient than goal</p>
                         </div>
                         <div className="absolute top-10 right-10 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-rose-500 group-hover:scale-110 transition-all cursor-pointer shadow-2xl">
                              <ArrowUpRight size={28} />
                         </div>
                    </div>
                </div>

                {/* Analytics & Pulse Widget */}
                <div className="md:col-span-5 premium-card">
                    <div className="flex justify-between items-center mb-12">
                         <h3 className="font-black text-xl italic uppercase tracking-tighter">Live Intelligence</h3>
                         <div className="pill-nav !bg-gray-100 !py-1 !px-1">
                             <button className="pill-item !px-6 !py-2 !text-[10px] pill-item-active">WEEK</button>
                             <button className="pill-item !px-6 !py-2 !text-[10px]">MONTH</button>
                         </div>
                    </div>

                    <div className="h-64 mt-12 bg-white rounded-[40px] p-6 shadow-inner">
                         <ProductionTrend data={stats.trendData} />
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-16">
                         <div className="bg-gray-50/80 p-6 rounded-[32px] border border-white hover:border-black/5 transition-all shadow-sm">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6"><Layers size={20} className="text-rose-500" /></div>
                              <p className="text-3xl font-black italic mb-1 text-black">{stats.pendingSewing}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Sewing Ops</p>
                         </div>
                         <div className="bg-gray-50/80 p-6 rounded-[32px] border border-white hover:border-black/5 transition-all shadow-sm">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6"><Hammer size={20} className="text-rose-500" /></div>
                              <p className="text-3xl font-black italic mb-1 text-black">{stats.pendingStone}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Stone Ops</p>
                         </div>
                         <div className="bg-emerald-500 p-6 rounded-[32px] text-white shadow-2xl group cursor-pointer hover:bg-black transition-all">
                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-all"><Package size={20} /></div>
                              <p className="text-3xl font-black italic mb-1">{stats.totalStock}</p>
                              <p className="text-[8px] font-black text-white/60 uppercase tracking-widest italic uppercase">Sync Stock</p>
                         </div>
                    </div>

                    <div className="mt-12 bg-slate-50 p-10 rounded-[3rem] border border-white flex justify-between items-center group cursor-pointer hover:border-rose-500 transition-all italic">
                         <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-rose-500"><AlertTriangle size={24} /></div>
                             <div>
                                 <h4 className="text-xl font-black uppercase italic leading-none text-black">Material Alert</h4>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Critical low stock detected in unit B</p>
                             </div>
                         </div>
                         <ChevronRight size={24} className="text-slate-200 group-hover:text-rose-500 transition-all translate-x-0 group-hover:translate-x-2" />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Overview;
