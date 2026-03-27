import React, { useState } from 'react';
import { UserCheck, Search, Download, TrendingUp } from 'lucide-react';
import logoWhite from '../assets/logo_white.png';
import logoBlack from '../assets/logo_black.png';

const WorkerSummary = ({ masterData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('all');

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
        if (monthlySalary) {
            const workerRecords = (masterData.attendance || []).filter(a => a.worker === name && a.department === dept);
            const presentDaysCount = workerRecords.filter(a => a.status === 'present').length;
            const halfDaysCount = workerRecords.filter(a => a.status === 'half-day').length;
            const totalEffectiveDays = presentDaysCount + (halfDaysCount * 0.5);
            const totalBill = workerRecords.reduce((sum, r) => sum + (r.wage || 0), 0);
            return { qty: totalEffectiveDays, bill: totalBill, paid, balance: totalBill - paid, label: 'PRESENT DAYS', subLabel: `SALARY: ৳${monthlySalary}` };
        }

        if (dept === 'pata') {
            const entries = (masterData.pataEntries || []).filter(e => e.worker === name && e.status === 'Received');
            const totalBill = entries.reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const actualQty = entries.reduce((a, b) => a + Number(b.pataQty || 0), 0);
            return { qty: actualQty, bill: totalBill, paid, balance: totalBill - paid, label: 'PATA PRODUCED', subLabel: 'PIECE RATE' };
        } else {
            const entries = (masterData.productions || []).filter(p => p.worker === name && p.type === dept && p.status === 'Received');
            const totalQty = entries.reduce((a, b) => a + Number(b.receivedBorka || 0) + Number(b.receivedHijab || 0), 0);
            const totalBill = entries.reduce((acc, b) => {
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

            return { qty: totalQty, bill: totalBill, paid, balance: totalBill - paid, label: 'FINISHED GOODS', subLabel: 'PIECE RATE' };
        }
    };

    const filteredWorkers = getAllWorkers()
        .filter(w => (filterDept === 'all' || w.dept === filterDept) && w.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(w => ({ ...w, ...getWorkerStats(w.name, w.dept) }));

    const totalBillAll = filteredWorkers.reduce((a, b) => a + b.bill, 0);

    return (
        <div className="space-y-4 pb-24 animate-fade-up px-2 italic text-black font-outfit">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-black rounded-2xl p-2.5 shadow-xl shrink-0">
                        <img src={logoWhite} alt="NRZO0NE" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Performance Analytics</p>
                        <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none text-black italic">
                            Worker <span className="text-slate-400">Stats</span>
                        </h2>
                    </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right shrink-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Payable</p>
                    <p className="text-xl font-black italic tracking-tighter text-black">৳{totalBillAll.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex gap-3">
                <div className="flex-1 bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-100">
                    <Search size={16} className="text-slate-300" />
                    <input type="text" placeholder="কর্মী খুঁজুন..." className="bg-transparent font-black italic border-none outline-none w-full uppercase text-sm text-black placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="bg-slate-50 text-black px-4 py-2 rounded-lg font-black uppercase text-[9px] tracking-widest border border-slate-100" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="all">All Dept</option>
                    <option value="sewing">Sewing</option>
                    <option value="stone">Stone</option>
                    <option value="pata">Pata</option>
                </select>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {filteredWorkers.map((w, idx) => (
                    <div key={idx} className="bg-white p-12 rounded-[4rem] border-4 border-slate-50 shadow-2xl relative overflow-hidden group hover:border-black transition-all flex flex-col h-96">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h4 className="text-3xl font-black italic uppercase leading-none mb-3 text-black">{w.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{w.dept} DEPT</p>
                            </div>
                        </div>
                        <div className="space-y-6 mt-auto">
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{w.label}</p>
                                    <p className="text-2xl font-black italic text-black">{w.qty} <span className="text-[10px] text-slate-300">{w.label === 'PRESENT DAYS' ? 'DAYS' : 'PCS'}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payable</p>
                                    <p className="text-2xl font-black italic text-black">৳{w.bill.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-1">Paid</p>
                                    <p className="text-2xl font-black italic">৳{w.paid.toLocaleString()}</p>
                                </div>
                                <div className="bg-black text-white p-6 rounded-[2.5rem] shadow-xl">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Balance</p>
                                    <p className="text-2xl font-black italic">৳{w.balance.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkerSummary;
