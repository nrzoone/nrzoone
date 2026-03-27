import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, Star, CheckCircle, ArrowUpRight, ArrowDownRight, Activity, Grid, Database, ArrowLeft } from 'lucide-react';
import { getPataStockSummary } from '../utils/calculations';
import logoWhite from '../assets/logo_white.png';
import logoBlack from '../assets/logo_black.png';

const BusinessIntel = ({ masterData }) => {
    const stats = useMemo(() => {
        // 1. Production vs Sales
        const totalProduced = (masterData.productions || []).filter(p => p.status === 'Received').reduce((s, p) => s + (p.issueBorka || 0) + (p.issueHijab || 0), 0);
        const totalPata = (masterData.pataEntries || []).filter(e => e.status === 'Received').reduce((s, e) => s + (e.pataQty || 0), 0);

        // 3. Low Stock Check
        const stockLogs = masterData.rawInventory || [];
        const rawStock = {};
        stockLogs.forEach(log => {
            const key = log.color ? `${log.item} (${log.color})` : log.item;
            if (!rawStock[key]) rawStock[key] = { name: log.item, color: log.color, qty: 0 };
            if (log.type === 'in') rawStock[key].qty += Number(log.qty);
            else if (log.type === 'out') rawStock[key].qty -= Number(log.qty);
        });
        const lowStockItems = Object.values(rawStock).filter(i => i.qty <= 5);

        // 4. Top Designs
        const designCounts = {};
        (masterData.productions || []).forEach(p => {
            designCounts[p.design] = (designCounts[p.design] || 0) + (p.issueBorka || 0) + (p.issueHijab || 0);
        });
        const topDesigns = Object.entries(designCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        // 5. Work Efficiency
        const pendingWork = (masterData.productions || []).filter(p => p.status === 'Pending').length;
        const totalWork = (masterData.productions || []).length;
        const efficiency = totalWork > 0 ? Math.round(((totalWork - pendingWork) / totalWork) * 100) : 0;

        const pataSummary = getPataStockSummary(masterData);

        return { totalProduced, totalPata, lowStockItems, topDesigns, efficiency, pendingWork, pataSummary };
    }, [masterData]);

    return (
        <div className="space-y-6 md:space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6 md:gap-10">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('setActivePanel', { detail: 'Overview' }))}
                        className="p-4 md:p-6 bg-white text-black rounded-[2rem] border-4 border-slate-50 shadow-2xl hover:bg-black hover:text-white transition-all group active:scale-95"
                    >
                        <ArrowLeft size={24} strokeWidth={3} className="group-hover:-translate-x-2 transition-transform" />
                    </button>
                    <div className="flex items-center gap-6 md:gap-10">
                        <div className="bg-black rounded-[2.5rem] p-6 shadow-2xl border border-white/10 transition-transform hover:scale-110 active:scale-95 overflow-hidden group">
                           <img src={logoWhite} alt="NRZO0NE" className="w-24 h-24 md:w-32 md:h-32 object-contain group-hover:rotate-6 transition-transform duration-500" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-[0.4em] mb-3 italic">STRATEGIC ANALYTICS</p>
                            <h2 className="text-4xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-none text-black">Business <span className="text-slate-300">Intel</span></h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                <div className="bg-white p-10 rounded-[4rem] border-4 border-slate-50 shadow-xl relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Production Output</p>
                    <h3 className="text-5xl font-black italic tracking-tighter text-black mb-2">{(stats.totalProduced + stats.totalPata).toLocaleString()}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-200">Total Finished Units</p>
                    <TrendingUp className="absolute bottom-[-10%] right-[-5%] text-slate-100 opacity-50" size={120} />
                </div>

                <div className="bg-white p-10 rounded-[4rem] border-4 border-slate-50 shadow-xl relative overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Work Efficiency</p>
                    <div className="flex items-end gap-4">
                        <h3 className="text-7xl font-black italic tracking-tighter text-black">{stats.efficiency}%</h3>
                        <div className="mb-4 space-y-1">
                            <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-black" style={{ width: `${stats.efficiency}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-2">Active Completion Rate</p>
                </div>

                <div className={`p-10 rounded-[4rem] border-4 shadow-xl relative overflow-hidden transition-all ${stats.lowStockItems.length > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${stats.lowStockItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Material Status</p>
                    <h3 className={`text-5xl font-black italic tracking-tighter mb-2 ${stats.lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{stats.lowStockItems.length > 0 ? 'CRITICAL' : 'OPTIMAL'}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{stats.lowStockItems.length} Items needing restock</p>
                    <AlertTriangle className={`absolute bottom-[-10%] right-[-5%] opacity-10 ${stats.lowStockItems.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} size={120} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-2xl overflow-hidden p-12">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-black">
                            <Star className="text-amber-500" fill="currentColor" /> Top Performing Designs
                        </h4>
                    </div>
                    <div className="space-y-6">
                        {stats.topDesigns.map(([name, qty], idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-black hover:text-white transition-all">
                                <div className="flex items-center gap-6">
                                    <span className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-black font-black text-xs shadow-sm">#{idx + 1}</span>
                                    <p className="text-xl font-black uppercase italic">{name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black italic tracking-tighter">+{qty.toLocaleString()}</p>
                                    <p className="text-[9px] font-black uppercase opacity-40">Total Yield</p>
                                </div>
                            </div>
                        ))}
                        {stats.topDesigns.length === 0 && <p className="text-center py-20 text-slate-200 font-black uppercase tracking-[0.5em] italic">No production data yet</p>}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-2xl p-12 h-full">
                        <div className="flex justify-between items-center mb-10">
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-black">
                                <Grid size={24} className="text-amber-500" /> Prepared Pata Stock
                            </h4>
                            <span className="px-6 py-2 bg-emerald-50 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">{stats.pataSummary.length} Varieties</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {stats.pataSummary.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-6 border-2 border-slate-50 rounded-3xl bg-slate-50/50 italic group hover:border-black transition-all">
                                    <div>
                                        <p className="text-xl font-black text-black uppercase">{item.design}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{item.color} • {item.type}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-200 uppercase">Balance</p>
                                            <p className={`text-4xl font-black italic tracking-tighter leading-none ${item.balance > 0 ? 'text-black' : 'text-rose-500'}`}>{item.balance}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.pataSummary.length === 0 && (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-100 gap-6">
                                    <Database size={80} strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.6em]">No Pata Stock Data</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-2xl p-12 h-full">
                        <div className="flex justify-between items-center mb-10">
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-black">
                                <AlertTriangle className="text-rose-500" /> Stock Alert Center
                            </h4>
                            <span className="px-6 py-2 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest">{stats.lowStockItems.length} Warnings</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {stats.lowStockItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-6 border-2 border-rose-50 rounded-3xl bg-rose-50/20 italic">
                                    <div>
                                        <p className="text-xl font-black text-black uppercase">{item.name}</p>
                                        <p className="text-[10px] font-black text-rose-300 uppercase mt-1">{item.color || 'Standard Material'}</p>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-rose-600 italic tracking-tighter">{item.qty}</span>
                                        <span className="text-[10px] font-black text-rose-400 uppercase">Left</span>
                                    </div>
                                </div>
                            ))}
                            {stats.lowStockItems.length === 0 && (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-100 gap-6">
                                    <CheckCircle size={80} strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.6em]">All Stock Levels Healthy</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessIntel;
