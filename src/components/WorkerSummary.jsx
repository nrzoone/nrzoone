import React, { useState } from 'react';
import { UserCheck, Search, Download, TrendingUp, X, FileText, ArrowUpRight, History } from 'lucide-react';
import NRZLogo from "./NRZLogo";

const WorkerSummary = ({ masterData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [selectedWorker, setSelectedWorker] = useState(null);

    const getAllWorkers = () => {
        const sewing = (masterData.workerCategories?.sewing || []).map(w => ({ name: w, dept: 'sewing' }));
        const stone = (masterData.workerCategories?.stone || []).map(w => ({ name: w, dept: 'stone' }));
        const pata = (masterData.workerCategories?.pata || []).map(w => ({ name: w, dept: 'pata' }));
        return [...sewing, ...stone, ...pata];
    };

    const getWorkerStats = (name, dept) => {
        const paid = (masterData.workerPayments || [])
            .filter(p => p.worker === name && p.dept === dept)
            .reduce((s, e) => s + Number(e.amount || 0), 0);

        const monthlySalary = masterData.workerWages?.[dept]?.[name];
        
        let history = [];
        if (dept === 'pata') {
            history = (masterData.pataEntries || []).filter(e => e.worker === name && e.status === 'Received');
        } else {
            history = (masterData.productions || []).filter(p => p.worker === name && p.type === dept && p.status === 'Received');
        }
        const attendanceHistory = (masterData.attendance || []).filter(a => a.worker === name && a.department === dept);

        if (monthlySalary) {
            const presentDaysCount = attendanceHistory.filter(a => a.status === 'present').length;
            const halfDaysCount = attendanceHistory.filter(a => a.status === 'half-day').length;
            const totalEffectiveDays = presentDaysCount + (halfDaysCount * 0.5);
            const totalBill = attendanceHistory.reduce((sum, r) => sum + (r.wage || 0), 0);
            return { qty: totalEffectiveDays, bill: totalBill, paid, balance: totalBill - paid, label: 'PRESENT DAYS', subLabel: `SALARY: ৳${monthlySalary}`, history, attendanceHistory };
        }

        if (dept === 'pata') {
            const totalBill = history.reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const actualQty = history.reduce((a, b) => a + Number(b.pataQty || 0), 0);
            return { qty: actualQty, bill: totalBill, paid, balance: totalBill - paid, label: 'PATA PRODUCED', subLabel: 'PIECE RATE', history, attendanceHistory };
        } else {
            const totalQty = history.reduce((a, b) => a + Number(b.receivedBorka || 0) + Number(b.receivedHijab || 0), 0);
            const totalBill = history.reduce((acc, b) => {
                const design = masterData.designs.find(d => d.name === b.design);
                const netBorka = Number(b.receivedBorka || 0);
                const netHijab = Number(b.receivedHijab || 0);
                if (dept === 'sewing') {
                    const bRate = design?.sewingRate || 0;
                    const hRate = design?.hijabRate || bRate;
                    return acc + (netBorka * bRate) + (netHijab * hRate);
                } else {
                    const rate = design?.stoneRate || 0;
                    return acc + ((netBorka + netHijab) * rate);
                }
            }, 0);

            return { qty: totalQty, bill: totalBill, paid, balance: totalBill - paid, label: 'FINISHED GOODS', subLabel: 'PIECE RATE', history, attendanceHistory };
        }
    };

    const filteredWorkers = getAllWorkers()
        .filter(w => (filterDept === 'all' || w.dept === filterDept) && w.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(w => ({ ...w, ...getWorkerStats(w.name, w.dept) }));

    const totalBillAll = filteredWorkers.reduce((a, b) => a + b.bill, 0);

    return (
        <div className="space-y-6 pb-24 animate-fade-up px-2 italic text-black font-outfit relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-black rounded-3xl p-4 shadow-2xl rotate-3">
                        <NRZLogo size="sm" white />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mb-1">Performance Intelligence</p>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-black italic">
                            Worker <span className="text-slate-400">Ledger</span>
                        </h2>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-2xl text-right min-w-[300px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total Net Payable</p>
                    <p className="text-4xl font-black italic tracking-tighter text-black">৳{totalBillAll.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-inner flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-slate-50 px-8 py-5 rounded-2xl flex items-center gap-4 border border-white shadow-sm">
                    <Search size={20} className="text-slate-300" />
                    <input type="text" placeholder="Search Identity..." className="bg-transparent font-black italic border-none outline-none w-full uppercase text-lg text-black placeholder:text-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="bg-black text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer hover:bg-zinc-800 transition-colors" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="all">Global Domain</option>
                    <option value="sewing">Sewing Dept</option>
                    <option value="stone">Stone Dept</option>
                    <option value="pata">Pata Dept</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {filteredWorkers.map((w, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setSelectedWorker(w)}
                        className="bg-white p-10 rounded-[4rem] border-4 border-slate-50 shadow-2xl relative overflow-hidden group hover:border-black transition-all text-left flex flex-col h-[450px]"
                    >
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-20 transition-all group-hover:scale-150 rotate-12">
                            <TrendingUp size={120} />
                        </div>
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] mb-2 italic">Entity Identity</p>
                                <h4 className="text-3xl font-black italic uppercase leading-none text-black">{w.name}</h4>
                            </div>
                        </div>
                        <div className="space-y-6 mt-auto relative z-10">
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-white shadow-inner">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{w.label}</p>
                                    <p className="text-xl font-black italic text-black">{w.qty} <span className="text-[10px] text-slate-300">{w.label === 'PRESENT DAYS' ? 'DAYS' : 'PCS'}</span></p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Bill</p>
                                    <p className="text-xl font-black italic text-black">৳{w.bill.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest mb-1">Paid</p>
                                    <p className="text-xl font-black italic">৳{w.paid.toLocaleString()}</p>
                                </div>
                                <div className="bg-black text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-center">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Balance</p>
                                    <p className="text-xl font-black italic">৳{w.balance.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="pt-4 flex items-center justify-between text-slate-400 group-hover:text-black transition-colors">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Open Ledger History</span>
                                <ArrowUpRight size={16} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Detailed Ledger Modal */}
            {selectedWorker && (
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-fade-in no-scrollbar overflow-y-auto">
                    <div className="bg-white w-full max-w-5xl rounded-[5rem] overflow-hidden shadow-3xl flex flex-col max-h-[90vh] italic relative">
                        <button onClick={() => setSelectedWorker(null)} className="absolute top-10 right-10 p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all z-20">
                            <X size={24} />
                        </button>
                        
                        <div className="p-12 md:p-20 bg-black text-white relative">
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10">
                                        <FileText size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.8em] text-white/40 mb-2">Worker Audit Journal</p>
                                        <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">{selectedWorker.name}</h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-12 border-t border-white/10 pt-12">
                                    <div><p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-black italic underline">Section</p><p className="text-2xl font-black uppercase italic">{selectedWorker.dept}</p></div>
                                    <div><p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-black italic underline">{selectedWorker.label}</p><p className="text-2xl font-black uppercase italic">{selectedWorker.qty}</p></div>
                                    <div><p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-black italic underline">Total Bill</p><p className="text-2xl font-black uppercase italic text-emerald-400">৳{selectedWorker.bill.toLocaleString()}</p></div>
                                    <div><p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-black italic underline">Net Balance</p><p className="text-2xl font-black uppercase italic text-rose-500 underline decoration-4">৳{selectedWorker.balance.toLocaleString()}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 md:p-20 space-y-12 no-scrollbar bg-[#fcfcfc]">
                             <div className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-300 mb-8 border-b border-slate-100 pb-4 flex items-center gap-4 italic"><History size={16} /> Production Logs (কাজের বিবরণ)</h3>
                                <div className="space-y-4">
                                    {selectedWorker.history.length === 0 ? (
                                        <div className="py-20 text-center opacity-30 italic uppercase font-black tracking-widest">No production records found for this unit.</div>
                                    ) : (
                                        selectedWorker.history.map((log, lidx) => (
                                            <div key={lidx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-black transition-all">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black italic border border-slate-100 group-hover:bg-black group-hover:text-white transition-all">{log.date.split('-')[2]}</div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{log.date}</p>
                                                        <h4 className="text-xl font-black uppercase italic text-black">{log.design || 'Pata Work'} <span className="text-[10px] text-slate-300 ml-2">#{log.lotNo || 'N/A'}</span></h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black italic text-black">+{log.receivedBorka || log.pataQty || 0} Pcs</p>
                                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic leading-none">Yield Verified</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </div>

                             <div className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-300 mb-8 border-b border-slate-100 pb-4 flex items-center gap-4 italic"><UserCheck size={16} /> Attendance Log (হাজিরা রেকর্ড)</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(selectedWorker.attendanceHistory || []).slice(0, 12).map((a, aidx) => (
                                        <div key={aidx} className="bg-white p-6 rounded-2xl border border-slate-50 flex items-center justify-between relative overflow-hidden group hover:border-black transition-all">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-300 uppercase italic mb-1">{a.date}</p>
                                                <p className={`text-[10px] font-black uppercase italic ${a.status === 'present' ? 'text-emerald-500' : 'text-rose-500'}`}>{a.status}</p>
                                            </div>
                                            <div className={`w-2 h-full absolute right-0 top-0 ${a.status === 'present' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerSummary;
