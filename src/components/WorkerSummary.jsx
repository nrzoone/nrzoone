import React, { useState } from 'react';
import { UserCheck, Search, Download, TrendingUp, X, FileText, ArrowUpRight, History, MessageCircle, DollarSign, Plus, Eye, User } from 'lucide-react';
import { sendWeeklySummary } from '../utils/whatsappUtils';
import NRZLogo from "./NRZLogo";

const WorkerSummary = ({ masterData, setMasterData, showNotify }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [showPayModal, setShowPayModal] = useState(null); 

    const getAllWorkers = () => {
        const sewing = (masterData.workerCategories?.sewing || []).map(w => ({ name: w, dept: 'sewing' }));
        const stone = (masterData.workerCategories?.stone || []).map(w => ({ name: w, dept: 'stone' }));
        const pata = (masterData.workerCategories?.pata || []).map(w => ({ name: w, dept: 'pata' }));
        const cutting = (masterData.workerCategories?.cutting || masterData.cutters || []).map(w => ({ name: w, dept: 'cutting' }));
        const monthly = (masterData.workerCategories?.monthly || []).map(w => ({ name: w, dept: 'monthly' }));
        
        return [...sewing, ...stone, ...pata, ...cutting, ...monthly];
    };

    const getWorkerStats = (name, dept) => {
        const doc = masterData.workerDocs?.find(d => d.name.toUpperCase() === name.toUpperCase() && d.dept === dept);
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

        let stats = { photo: doc?.photo, password: doc?.password || '1234' };

        if (monthlySalary || dept === 'monthly' || dept === 'cutting') {
            const wage = monthlySalary || 0;
            const presentDaysCount = attendanceHistory.filter(a => a.status === 'present').length;
            const halfDaysCount = attendanceHistory.filter(a => a.status === 'half-day').length;
            const totalEffectiveDays = presentDaysCount + (halfDaysCount * 0.5);
            const totalBill = attendanceHistory.reduce((sum, r) => sum + (r.wage || 0), 0);
            return { ...stats, qty: totalEffectiveDays, bill: totalBill, paid, balance: totalBill - paid, label: 'PRESENT DAYS', subLabel: `WAGE/SALARY: ৳${wage}`, history, attendanceHistory };
        }

        if (dept === 'pata') {
            const totalBill = history.reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const actualQty = history.reduce((a, b) => a + Number(b.pataQty || 0), 0);
            return { ...stats, qty: actualQty, bill: totalBill, paid, balance: totalBill - paid, label: 'PATA PRODUCED', subLabel: 'PIECE RATE', history, attendanceHistory };
        } else {
            const totalQty = history.reduce((a, b) => a + Number(b.receivedBorka || 0) + Number(b.receivedHijab || 0), 0);
            const totalBill = history.reduce((acc, b) => {
                const design = masterData.designs.find(d => d.name === b.design);
                const netBorka = Number(b.receivedBorka || 0);
                const netHijab = Number(b.receivedHijab || 0);
                if (dept === 'sewing') {
                    const bRate = b.rate || design?.sewingRate || 0;
                    const hRate = design?.hijabRate || bRate;
                    return acc + (netBorka * bRate) + (netHijab * hRate);
                } else {
                    const rate = b.rate || design?.stoneRate || 0;
                    return acc + ((netBorka + netHijab) * rate);
                }
            }, 0);

            return { ...stats, qty: totalQty, bill: totalBill, paid, balance: totalBill - paid, label: 'FINISHED GOODS', subLabel: 'PIECE RATE', history, attendanceHistory };
        }
    };

    const filteredWorkers = getAllWorkers()
        .filter(w => (filterDept === 'all' || w.dept === filterDept) && w.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(w => ({ ...w, ...getWorkerStats(w.name, w.dept) }));

    const handleConfirmPayment = (e) => {
        e.preventDefault();
        const amount = Number(e.target.amount.value);
        const type = e.target.payType.value; 
        const note = e.target.note.value;
        const date = e.target.date.value;

        if (amount <= 0) return;

        const newPayment = {
            id: `pay_${Date.now()}`,
            date: new Date(date).toLocaleDateString('en-GB'),
            worker: showPayModal.name,
            dept: showPayModal.dept,
            amount: amount,
            type: type,
            note: note || (type === 'Dadon' ? 'অগ্রিম/দাদন' : 'বেতন পেমেন্ট')
        };

        const newExpense = {
            id: `exp_${Date.now()}`,
            date: date,
            category: 'salary',
            description: `${showPayModal.name} (${type}): ${note || ''}`,
            amount: amount
        };

        setMasterData(prev => ({
            ...prev,
            workerPayments: [newPayment, ...(prev.workerPayments || [])],
            expenses: [newExpense, ...(prev.expenses || [])]
        }));

        setShowPayModal(null);
        showNotify(`${showPayModal.name}-কে ৳${amount} (${type}) প্রদান করা হয়েছে!`);
    };

    const totalBillAll = filteredWorkers.reduce((a, b) => a + b.bill, 0);
    const totalBalanceAll = filteredWorkers.reduce((a, b) => a + b.balance, 0);

    return (
        <div className="space-y-10 pb-24 animate-fade-up px-2 italic text-black font-outfit relative">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-10">
                    <div className="bg-black rounded-3xl p-6 shadow-2xl rotate-3">
                        <NRZLogo size="sm" white />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] mb-2 px-1 italic">Enterprise Intelligence</p>
                        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none text-black italic">
                            Worker <span className="text-slate-500">Ledger</span>
                        </h2>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6 w-full lg:w-auto">
                    <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-2xl text-right flex-1 lg:min-w-[220px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">Gross Total</p>
                        <p className="text-3xl font-black italic tracking-tighter text-emerald-500">৳{totalBillAll.toLocaleString()}</p>
                    </div>
                    <div className="bg-black text-white p-8 rounded-[3rem] shadow-3xl text-right flex-1 lg:min-w-[220px]">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] mb-3 font-mono">Net Payable</p>
                        <p className="text-3xl font-black italic tracking-tighter text-white">৳{totalBalanceAll.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-[3rem] border-4 border-slate-50 shadow-inner flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-slate-50 px-10 py-6 rounded-[2rem] flex items-center gap-6 border border-white shadow-sm">
                    <Search size={22} className="text-slate-500" />
                    <input type="text" placeholder="Search Worker / Identity (কারিগর খুঁজিুন)..." className="bg-transparent font-black italic border-none outline-none w-full uppercase text-xl text-black placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="bg-black text-white px-12 py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] cursor-pointer hover:bg-zinc-800 transition-all shadow-xl" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="all">Global Workspace</option>
                    <option value="sewing">Sewing Dept</option>
                    <option value="stone">Stone Dept</option>
                    <option value="pata">Pata Dept</option>
                    <option value="cutting">Cutting/Master</option>
                    <option value="monthly">Monthly Staff</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                {filteredWorkers.map((w, idx) => (
                    <div 
                        key={idx} 
                        className="bg-white p-10 rounded-[4rem] border-4 border-slate-50 shadow-2xl relative overflow-hidden group hover:border-black transition-all flex flex-col h-[520px] isolate"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-all group-hover:scale-150 rotate-12 z-0">
                            <TrendingUp size={180} />
                        </div>
                        <div className="flex justify-between items-start mb-10 relative z-10 w-full px-2">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-inner group-hover:rotate-6 transition-all">
                                 {w.photo ? <img src={w.photo} className="w-full h-full object-cover" /> : <div className="text-slate-300 text-3xl font-black italic uppercase">{w.name.charAt(0)}</div>}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-2 italic">Identity</p>
                                <h4 className="text-3xl font-black italic uppercase leading-none text-black underline decoration-black/10 group-hover:decoration-black transition-all truncate max-w-[150px]">{w.name}</h4>
                                <span className="inline-block px-4 py-1 bg-slate-100 rounded-full text-[8px] font-black uppercase text-slate-500 tracking-widest mt-2">{w.dept}</span>
                            </div>
                        </div>

                        <div className="space-y-6 mt-auto relative z-10">
                            <div className="bg-slate-50/80 p-8 rounded-[3rem] border border-white shadow-inner flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Performance</p>
                                    <p className="text-xl font-black italic text-black">{w.qty} <span className="text-[10px] text-slate-500">{w.label.includes('DAYS') ? 'DAYS' : 'PCS'}</span></p>
                                </div>
                                <div className="flex justify-between items-center group/p">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Access Key</p>
                                    <div className="flex items-center gap-2">
                                         <p className="text-lg font-black italic text-black font-mono tracking-tighter bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm opacity-0 group-hover/p:opacity-100 transition-opacity">{w.password}</p>
                                         <Eye size={16} className="text-slate-200 group-hover/p:text-emerald-500 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 text-emerald-600 p-8 rounded-[3.5rem] border border-emerald-100 flex flex-col justify-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Total Paid</p>
                                    <p className="text-2xl font-black italic tracking-tighter font-mono">৳{w.paid.toLocaleString()}</p>
                                </div>
                                <div className={`${w.balance > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'} p-8 rounded-[3.5rem] border flex flex-col justify-center`}>
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Balance</p>
                                    <p className="text-2xl font-black italic tracking-tighter font-mono">৳{w.balance.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                 <button onClick={() => setSelectedWorker(w)} className="flex-1 bg-white border border-slate-100 text-slate-400 p-5 rounded-3xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"><History size={20} /></button>
                                 <button onClick={() => {
                                      const doc = masterData.workerDocs?.find(d => d.name.toUpperCase() === w.name.toUpperCase() && d.dept === w.dept);
                                      if (doc?.phone) sendWeeklySummary(w.name, { totalQty: w.qty, totalBill: w.bill, paid: w.paid, balance: w.balance }, doc.phone);
                                      else alert("নির্ধারিত ফোন নম্বর নেই!");
                                 }} className="flex-1 bg-emerald-50 text-emerald-600 p-5 rounded-3xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><MessageCircle size={20} /></button>
                                 <button onClick={() => setShowPayModal(w)} className="flex-[2] bg-emerald-500 text-white p-5 rounded-3xl flex items-center justify-center gap-3 font-black uppercase text-[10px] italic hover:bg-black transition-all shadow-xl active:scale-95 border-b-4 border-emerald-700 hover:border-black"><DollarSign size={18} /> দাদন / পেমেন্ট</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment / Advance Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
                    <form onSubmit={handleConfirmPayment} className="bg-white w-full max-w-lg rounded-[4rem] p-12 space-y-10 shadow-3xl">
                        <div className="text-center space-y-4">
                            <h3 className="text-4xl font-black italic uppercase">নতুন দাদন বা পেমেন্ট</h3>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{showPayModal.name} — {showPayModal.dept}</p>
                            <NRZLogo size="xs" />
                        </div>
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4 italic font-mono tracking-widest">পেমেন্ট ধরণ</label>
                                    <select name="payType" className="w-full bg-slate-50 h-16 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-slate-100 shadow-inner outline-none focus:border-black transition-all italic">
                                        <option value="Dadon">অ্যাডভান্স / দাদন (Dadon)</option>
                                        <option value="Salary">বেতন পেমেন্ট (Salary)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4 italic font-mono tracking-widest">তারিখ</label>
                                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 h-16 px-8 rounded-2xl text-[11px] font-black tracking-widest border border-slate-100 shadow-inner outline-none focus:border-black transition-all italic" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-6 italic font-mono tracking-widest">টাকার পরিমাণ (Amount)</label>
                                <input name="amount" type="number" placeholder="৳ 0.00" className="w-full bg-emerald-50 h-24 px-10 rounded-[2.5rem] text-4xl font-black italic border-2 border-emerald-100 placeholder:text-emerald-200 outline-none focus:border-emerald-500 transition-all text-emerald-600 shadow-xl" required autoFocus />
                            </div>
                            <input name="note" placeholder="নোট থাকলে এখানে লিখুন..." className="w-full bg-slate-100 h-16 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-slate-200 shadow-inner outline-none focus:border-black transition-all italic" />
                        </div>
                        <div className="flex gap-4 pt-6">
                            <button type="button" onClick={() => setShowPayModal(null)} className="flex-1 h-20 rounded-[2.5rem] bg-slate-50 text-slate-500 font-black uppercase text-[11px] italic">বাতিল</button>
                            <button type="submit" className="flex-[2] h-20 rounded-[2.5rem] bg-black text-white font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all italic">সংরক্ষণ করুন (Confirm)</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Detailed Ledger Modal */}
            {selectedWorker && (
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-fade-in no-scrollbar overflow-y-auto">
                    <div className="bg-white w-full max-w-5xl rounded-[5rem] overflow-hidden shadow-3xl flex flex-col max-h-[90vh] italic relative">
                        <button onClick={() => setSelectedWorker(null)} className="absolute top-10 right-10 p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all z-20 shadow-xl">
                            <X size={24} />
                        </button>
                        
                        <div className="p-12 md:p-20 bg-black text-white relative">
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
                                    <div className="w-32 h-32 bg-white/10 rounded-[3rem] flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                                        {selectedWorker.photo ? <img src={selectedWorker.photo} className="w-full h-full object-cover" /> : <FileText size={50} className="text-white/20" />}
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-xs font-black uppercase tracking-[0.8em] text-white/40 mb-3">Permanent Professional Ledger</p>
                                        <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">{selectedWorker.name}</h2>
                                        <div className="flex gap-4 mt-6 justify-center md:justify-start">
                                             <span className="px-5 py-2 bg-white/10 rounded-full text-[9px] font-black italic tracking-widest border border-white/10">{selectedWorker.dept.toUpperCase()} UNIT</span>
                                             <span className="px-5 py-2 bg-emerald-500 text-black rounded-full text-[9px] font-black italic tracking-widest">ACCESS KEY: {selectedWorker.password}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-16 border-t border-white/10 pt-16">
                                    <div className="group/s"><p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-black italic border-b border-white/5 pb-2">Load Capacity</p><p className="text-3xl font-black uppercase italic tracking-tighter">{selectedWorker.qty} <span className="text-xs opacity-50 font-normal">UNITS</span></p></div>
                                    <div className="group/s"><p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-black italic border-b border-white/5 pb-2">Unit Value</p><p className="text-3xl font-black uppercase italic tracking-tighter">{selectedWorker.subLabel.split(': ')[1]}</p></div>
                                    <div className="group/s"><p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-black italic border-b border-white/5 pb-2">Gross Earnings</p><p className="text-3xl font-black uppercase italic text-emerald-400 tracking-tighter">৳{selectedWorker.bill.toLocaleString()}</p></div>
                                    <div className="group/s"><p className="text-[10px] text-rose-400 uppercase tracking-widest mb-3 font-black italic border-b border-rose-900 pb-2">Net Payable</p><p className="text-3xl font-black uppercase italic text-rose-500 underline decoration-8 underline-offset-8 tracking-tighter">৳{selectedWorker.balance.toLocaleString()}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 md:p-20 space-y-16 no-scrollbar bg-[#fcfcfc]">
                             {/* Payment Trace */}
                             <div className="space-y-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-slate-500 mb-10 border-b-2 border-slate-100 pb-6 flex items-center gap-6 italic"><DollarSign size={22} className="text-emerald-500" /> Payment Distribution Matrix</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {(masterData.workerPayments || []).filter(p => p.worker === selectedWorker.name && p.dept === selectedWorker.dept).map((p, pidx) => (
                                         <div key={pidx} className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-xl flex items-center justify-between group hover:border-black transition-all relative overflow-hidden">
                                             <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-20"></div>
                                             <div className="flex items-center gap-8">
                                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic border-2 ${p.type === 'Dadon' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                     {p.type === 'Dadon' ? 'D' : 'S'}
                                                 </div>
                                                 <div>
                                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{p.date}</p>
                                                     <p className="text-xl font-black uppercase italic text-black">{p.type === 'Dadon' ? 'দাদন (Advance)' : 'বেতন (Direct)'} <span className="text-[11px] text-slate-400 ml-2 italic tracking-tight">— {p.note}</span></p>
                                                 </div>
                                             </div>
                                             <p className="text-3xl font-black italic text-rose-600 tracking-tighter font-mono">- ৳{p.amount.toLocaleString()}</p>
                                         </div>
                                     ))}
                                </div>
                             </div>

                             <div className="space-y-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-slate-500 mb-10 border-b-2 border-slate-100 pb-6 flex items-center gap-6 italic"><History size={22} className="text-black" /> Operational Output Log</h3>
                                <div className="space-y-6">
                                    {selectedWorker.history.length === 0 ? (
                                        <div className="py-24 text-center opacity-20 italic uppercase font-black text-3xl tracking-widest flex flex-col gap-6"><Activity size={60} className="mx-auto" /> Output Buffer Empty</div>
                                    ) : (
                                        selectedWorker.history.map((log, lidx) => (
                                            <div key={lidx} className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-50 shadow-2xl flex items-center justify-between group hover:border-black transition-all relative overflow-hidden h-36">
                                                <div className="flex items-center gap-10">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center font-black text-3xl italic border-4 border-white shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:scale-110">{log.date.split('/')[0]}</div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic tracking-[0.2em]">{log.date} • LOT #{log.lotNo || 'NZ-PRO'}</p>
                                                        <h4 className="text-2xl font-black uppercase italic text-black tracking-tight">{log.design || 'Manual Workshop'}</h4>
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">YIELD RATE: ৳{log.rate || 0} PER UNIT</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] font-black text-slate-300 uppercase italic mb-1 font-mono">Ledger Credit</p>
                                                    <p className="text-4xl font-black italic text-emerald-600 tracking-tighter">+ ৳{((Number(log.receivedBorka || 1) + Number(log.receivedHijab || 0)) * (log.rate || 0)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </div>

                             <div className="space-y-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-slate-500 mb-10 border-b-2 border-slate-100 pb-6 flex items-center gap-6 italic"><UserCheck size={22} className="text-blue-500" /> Attendance Archive</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {(selectedWorker.attendanceHistory || []).slice(0, 18).map((a, aidx) => (
                                        <div key={aidx} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex items-center justify-between relative overflow-hidden group hover:border-black transition-all shadow-lg text-center h-32 flex-col justify-center">
                                            <div className="relative z-10">
                                                <p className="text-[9px] font-black text-slate-400 uppercase italic mb-2 tracking-widest">{a.date}</p>
                                                <p className={`text-xs font-black uppercase italic ${a.status.toLowerCase().includes('present') ? 'text-emerald-500 underline decoration-2 underline-offset-4' : 'text-rose-500'}`}>{a.status}</p>
                                            </div>
                                            <div className={`w-1.5 h-1/2 absolute right-0 top-1/4 rounded-l-full ${a.status.toLowerCase().includes('present') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
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
