import React, { useState } from 'react';
import { UserCheck, Activity, Search, Download, TrendingUp, X, FileText, ArrowUpRight, History, MessageCircle, DollarSign, Plus, Eye, User, Layers } from 'lucide-react';
import { sendWeeklySummary } from '../utils/whatsappUtils';
import NRZLogo from "./NRZLogo";

const WorkerSummary = ({ masterData, setMasterData, showNotify, user, logAction, setActivePanel, SafeText }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [showPayModal, setShowPayModal] = useState(null); 

    const getAllWorkers = () => {
        // Source of TRUTH: workerDocs
        return (masterData.workerDocs || []).map(d => ({ 
            name: d.name, 
            dept: d.dept || 'sewing' 
        }));
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
            const totalBill = (history || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const actualQty = (history || []).reduce((a, b) => a + Number(b.pataQty || 0), 0);
            const totalShortage = (history || []).reduce((a, b) => a + Number(b.shortage || 0), 0);
            return { ...stats, qty: actualQty, bill: totalBill, paid: Number(paid || 0), balance: (totalBill - Number(paid || 0)), shortage: totalShortage, label: 'PATA PRODUCED', subLabel: 'PIECE RATE', history, attendanceHistory };
        } else {
            const totalQty = (history || []).reduce((a, b) => a + Number(b.receivedBorka || 0) + Number(b.receivedHijab || 0), 0);
            const totalShortage = (history || []).reduce((a, b) => a + Number(b.totalShortage || 0), 0);
            const totalPenalty = (history || []).reduce((acc, b) => acc + Number(b.penalty || 0), 0);
            const totalBill = (history || []).reduce((acc, b) => {
                const design = (masterData.designs || []).find(d => d.name === b.design);
                const netBorka = Number(b.receivedBorka || 0);
                const netHijab = Number(b.receivedHijab || 0);
                let earnings = 0;
                if (dept === 'sewing') {
                    const bRate = Number(b.rate || design?.sewingRate || 0);
                    const hRate = Number(design?.hijabRate || bRate);
                    earnings = (netBorka * bRate) + (netHijab * hRate);
                } else {
                    const rate = Number(b.rate || design?.stoneRate || 0);
                    earnings = ((netBorka + netHijab) * rate);
                }
                return acc + (Number(earnings) || 0);
            }, 0) - totalPenalty;

            return { ...stats, qty: totalQty, bill: totalBill, paid: Number(paid || 0), balance: (totalBill - Number(paid || 0)), shortage: totalShortage, penalty: totalPenalty, label: 'PIECES PRODUCED', subLabel: 'PIECE RATE', history, attendanceHistory };
        }
    };

    const filteredWorkers = getAllWorkers()
        .filter(w => {
            const role = user?.role?.toLowerCase();
            const isWorker = role !== 'admin' && role !== 'manager';
            
            // If worker, ONLY show themselves
            if (isWorker) {
                return w.name.trim().toLowerCase() === user?.name?.trim().toLowerCase();
            }
            
            // If Admin/Manager, show based on search
            return (filterDept === 'all' || w.dept === filterDept) && w.name.toLowerCase().includes(searchTerm.toLowerCase());
        })
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

        logAction(user, 'WORKER_PAYMENT', `Paid ${showPayModal.name} ৳${amount} (${type}) for ${showPayModal.dept} Unit`);
        setShowPayModal(null);
        showNotify(`${showPayModal.name}-কে ৳${amount} (${type}) প্রদান করা হয়েছে!`);
    };

    const totalBillAll = filteredWorkers.reduce((a, b) => a + b.bill, 0);
    const totalBalanceAll = filteredWorkers.reduce((a, b) => a + b.balance, 0);

    return (
        <div className="space-y-10 pb-24 animate-fade-up px-2 italic text-black dark:text-white font-outfit relative">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-black rounded-2xl p-4 shadow-xl rotate-0">
                        <NRZLogo size="xs" white />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 px-0.5 italic">System Intelligent</p>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight text-black dark:text-white italic">
                            কারিগর <span className="text-black dark:text-white">লেজার বুক</span>
                        </h2>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-md text-right flex-1 lg:min-w-[140px]">
                        <p className="text-[8px] font-black text-black dark:text-white uppercase tracking-widest mb-1">মোট পাওনা</p>
                        <p className="text-xl font-black italic tracking-tighter text-emerald-500 leading-none">৳{totalBillAll.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-950 text-white p-4 rounded-xl shadow-md text-right flex-1 lg:min-w-[140px]">
                        <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1 font-mono">নিট প্রদেয়</p>
                        <p className="text-[10px] font-black italic tracking-tighter text-white leading-none">৳{totalBalanceAll.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="flex-1 bg-slate-50 px-5 py-2.5 rounded-lg flex items-center gap-3 border border-white shadow-inner">
                    <Search size={16} className="text-slate-400" />
                    <input type="text" placeholder="কারিগর বা আইডি..." className="bg-transparent font-black italic border-none outline-none w-full uppercase text-[11px] text-black dark:text-white placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="bg-slate-950 text-white px-5 py-2.5 rounded-lg font-black uppercase text-[8.5px] tracking-widest cursor-pointer hover:bg-zinc-800 transition-all shadow-md" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="all">সব বিভাগ (Global)</option>
                    <option value="sewing">সেলাই বিভাগ</option>
                    <option value="stone">স্টোন বিভাগ</option>
                    <option value="pata">পাতা বিভাগ</option>
                    <option value="cutting">কাটিং / মাস্টার</option>
                    <option value="monthly">মাসিক স্টাফ</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWorkers.map((w, idx) => (
                    <div 
                        key={idx} 
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-md relative overflow-hidden group hover:border-slate-950 transition-all flex flex-col h-[340px] isolate"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-all rotate-12 z-0">
                            <TrendingUp size={100} />
                        </div>
                        <div className="flex justify-between items-start mb-6 relative z-10 w-full">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner group-hover:rotate-6 transition-all">
                                 {w.photo ? <img src={w.photo} className="w-full h-full object-cover" /> : <div className="text-slate-300 text-2xl font-black italic uppercase">{w.name.charAt(0)}</div>}
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Identity</p>
                                <h4 className="text-xl font-black italic uppercase leading-none text-black dark:text-white truncate max-w-[130px]"><SafeText data={w.name} /></h4>
                                <div className="flex gap-1.5 justify-end mt-1.5">
                                    {masterData.workerDocs?.find(d => d.name.toUpperCase() === w.name.toUpperCase() && d.dept === w.dept)?.workerId && (
                                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[6.5px] font-black rounded">ID: {masterData.workerDocs?.find(d => d.name.toUpperCase() === w.name.toUpperCase() && d.dept === w.dept)?.workerId}</span>
                                    )}
                                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[6.5px] font-black uppercase text-black dark:text-white tracking-widest">{w.dept.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mt-auto relative z-10">
                            <div className="bg-slate-50/80 p-4 rounded-xl border border-white shadow-inner flex flex-col gap-2.5">
                                <div className="flex justify-between items-center">
                                    <p className="text-[8.5px] font-black text-black dark:text-white uppercase tracking-widest font-mono opacity-40">Load Status</p>
                                    <div className="text-right">
                                        <p className="text-base font-black italic text-black dark:text-white leading-none"><SafeText data={w.qty} /> <span className="text-[9px]">{w.label.includes('DAYS') ? 'DAYS' : 'PCS'}</span></p>
                                        {w.shortage > 0 && <p className="text-[7.5px] font-black text-rose-500 uppercase">Gap: {w.shortage} pcs</p>}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center group/p">
                                    <p className="text-[8.5px] font-black text-black dark:text-white uppercase tracking-widest font-mono opacity-40">Access PIN</p>
                                    <div className="flex items-center gap-1.5">
                                         <p className="text-[14px] font-black italic text-black dark:text-white font-mono tracking-tighter bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700 opacity-0 group-hover/p:opacity-100 transition-opacity leading-none"><SafeText data={w.password} fallback="N/A" /></p>
                                         <Eye size={12} className="text-slate-200 group-hover/p:text-emerald-500 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
                                    <p className="text-[7.5px] font-black uppercase tracking-widest mb-0.5 opacity-60">Payout</p>
                                    <p className="text-[15px] font-black italic tracking-tighter font-mono leading-none">৳{w.paid.toLocaleString()}</p>
                                </div>
                                <div className={`${w.balance > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-black dark:text-white border-slate-100'} p-4 rounded-xl border flex flex-col justify-center`}>
                                    <p className="text-[7.5px] font-black uppercase tracking-widest mb-0.5 opacity-60">Due</p>
                                    <p className="text-[15px] font-black italic tracking-tighter font-mono leading-none">৳{w.balance.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                 <button onClick={() => setSelectedWorker(w)} className="flex-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-black dark:text-white p-2.5 rounded-lg flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm"><History size={15} /></button>
                                 <button onClick={() => {
                                      const doc = masterData.workerDocs?.find(d => d.name.toUpperCase() === w.name.toUpperCase() && d.dept === w.dept);
                                      if (doc?.phone) sendWeeklySummary(w.name, { totalQty: w.qty, totalBill: w.bill, paid: w.paid, balance: w.balance }, doc.phone);
                                      else alert("নির্ধারিত ফোন নম্বর নেই!");
                                 }} className="flex-1 bg-emerald-50 text-emerald-600 p-2.5 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><MessageCircle size={15} /></button>
                                 { (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
                                     <button onClick={() => setShowPayModal(w)} className="flex-[2] bg-emerald-600 text-white p-2.5 rounded-lg flex items-center justify-center gap-2 font-black uppercase text-[8px] italic hover:bg-slate-950 transition-all shadow-md active:scale-95"><DollarSign size={14} /> PAYMENT</button>
                                 )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment / Advance Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
                     <form onSubmit={handleConfirmPayment} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 space-y-6 shadow-2xl border-4 border-slate-50 dark:border-slate-800 italic">
                        <div className="text-center space-y-1">
                           <div className="mx-auto w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg rotate-12 mb-3 animate-pulse"><DollarSign size={20} /></div>
                           <h3 className="text-xl font-black italic uppercase text-black dark:text-white">নতুন দাদন বা পেমেন্ট</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><SafeText data={showPayModal.name} /> — <SafeText data={showPayModal.dept} /></p>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-black dark:text-white uppercase ml-2 italic tracking-widest">পেমেন্ট ধরণ</label>
                                    <select name="payType" className="w-full bg-slate-50 dark:bg-slate-800 h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 shadow-inner outline-none focus:border-black transition-all italic text-black dark:text-white">
                                        <option value="Dadon">অ্যাডভান্স / দাদন (Dadon)</option>
                                        <option value="Salary">বেতন পেমেন্ট (Salary)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-black dark:text-white uppercase ml-2 italic tracking-widest">তারিখ</label>
                                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 dark:bg-slate-800 h-12 px-6 rounded-xl text-[10px] font-black tracking-widest border border-slate-100 dark:border-slate-700 shadow-inner outline-none focus:border-black transition-all italic text-black dark:text-white" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 ml-2 italic tracking-widest">টাকার পরিমাণ (Amount)</label>
                                <div className="bg-slate-950 p-4 rounded-xl shadow-xl text-center relative overflow-hidden">
                                   <div className="absolute top-0 right-0 p-4 opacity-10 text-white"><DollarSign size={40} /></div>
                                   <div className="flex items-center justify-center text-white"><span className="text-xl font-black text-white/20 mr-3 italic">৳</span><input name="amount" type="number" placeholder="0" className="w-full text-center text-3xl font-black bg-transparent border-none text-white outline-none leading-none h-12 italic tracking-tighter" required autoFocus /></div>
                                </div>
                             </div>
                             <input name="note" placeholder="নোট থাকলে এখানে লিখুন..." className="w-full bg-slate-50 dark:bg-slate-800 h-11 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 shadow-inner outline-none focus:border-black transition-all italic text-black dark:text-white" />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setShowPayModal(null)} className="flex-1 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-black uppercase text-[10px] italic">বাতিল</button>
                            <button type="submit" className="flex-[2] h-16 rounded-2xl bg-black dark:bg-white dark:text-black text-white font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all italic">সংরক্ষণ করুন (Confirm)</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Detailed Ledger Modal */}
            {selectedWorker && (
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-fade-in no-scrollbar overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl animate-fade-up relative flex flex-col h-[90vh] md:h-auto">
                        <div className="bg-slate-950 p-8 md:p-16 text-white relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                                style={{ 
                                    backgroundImage: `radial-gradient(circle at 2px 2px, #475569 1px, transparent 0)`,
                                    backgroundSize: '32px 32px'
                                }}>
                            </div>
                            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full"></div>
                            
                            <button onClick={() => setSelectedWorker(null)} className="absolute top-10 right-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
                                <X size={24} />
                            </button>

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row items-center gap-10">
                                    <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                                        {selectedWorker.photo ? <img src={selectedWorker.photo} className="w-full h-full object-cover" /> : <FileText size={40} className="text-white/20" />}
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Permanent Professional Ledger</p>
                                        <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight"><SafeText data={selectedWorker.name} /></h2>
                                        <div className="flex gap-3 mt-4 justify-center md:justify-start">
                                             <span className="px-4 py-1.5 bg-white/10 rounded-full text-[8px] font-black italic tracking-widest border border-white/10">{selectedWorker.dept.toUpperCase()} UNIT</span>
                                             <span className="px-4 py-1.5 bg-emerald-500 text-black rounded-full text-[8px] font-black italic tracking-widest font-mono">KEY: <SafeText data={selectedWorker.password} /></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-16 border-t border-white/10 pt-16">
                                    <div className="group/s"><p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-black italic border-b border-white/5 pb-2">Load Capacity</p><p className="text-3xl font-black uppercase italic tracking-tighter"><SafeText data={selectedWorker.qty} /> <span className="text-xs opacity-50 font-normal">UNITS</span></p></div>
                                    <div className="group/s"><p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-black italic border-b border-white/5 pb-2">Unit Value</p><p className="text-3xl font-black uppercase italic tracking-tighter">{selectedWorker.subLabel.split(': ')[1]}</p></div>
                                    <div className="group/s"><p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 font-black italic border-b border-white/5 pb-2">Gross Earnings</p><p className="text-3xl font-black uppercase italic text-emerald-400 tracking-tighter">৳{selectedWorker.bill.toLocaleString()}</p></div>
                                    <div className="group/s"><p className="text-[10px] text-rose-400 uppercase tracking-widest mb-3 font-black italic border-b border-rose-900 pb-2">Net Payable</p><p className="text-3xl font-black uppercase italic text-rose-500 underline decoration-8 underline-offset-8 tracking-tighter">৳{selectedWorker.balance.toLocaleString()}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 md:p-20 space-y-16 no-scrollbar bg-[#fcfcfc] dark:bg-slate-900">
                             {/* Payment Trace */}
                             <div className="space-y-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-black dark:text-white mb-10 border-b-2 border-slate-100 dark:border-slate-800 pb-6 flex items-center gap-6 italic"><DollarSign size={22} className="text-emerald-500" /> Payment Distribution Matrix</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {(masterData.workerPayments || []).filter(p => p.worker === selectedWorker.name && p.dept === selectedWorker.dept).map((p, pidx) => (
                                         <div key={pidx} className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border-2 border-slate-50 dark:border-slate-700 shadow-xl flex items-center justify-between group hover:border-black transition-all relative overflow-hidden">
                                             <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-20"></div>
                                             <div className="flex items-center gap-8">
                                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic border-2 ${p.type === 'Dadon' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                     {p.type === 'Dadon' ? 'D' : 'S'}
                                                 </div>
                                                 <div>
                                                     <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest mb-2 italic"><SafeText data={p.date} /></p>
                                                     <p className="text-xl font-black uppercase italic text-black dark:text-white"><SafeText data={p.type === 'Dadon' ? 'দাদন (Advance)' : 'বেতন (Direct)'} /> <span className="text-[11px] text-black dark:text-white ml-2 italic tracking-tight">— <SafeText data={p.note} /></span></p>
                                                 </div>
                                             </div>
                                             <p className="text-3xl font-black italic text-rose-600 tracking-tighter font-mono">- ৳{p.amount.toLocaleString()}</p>
                                         </div>
                                     ))}
                                     {(masterData.workerPayments || []).filter(p => p.worker === selectedWorker.name && p.dept === selectedWorker.dept).length === 0 && <div className="col-span-full py-12 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">No payment history available</div>}
                                </div>
                             </div>

                             {/* Work Logs */}
                             <div className="space-y-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-black dark:text-white mb-10 border-b-2 border-slate-100 dark:border-slate-800 pb-6 flex items-center gap-6 italic"><Layers size={22} className="text-blue-500" /> Production Registry Sequence</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(selectedWorker.history || []).length === 0 ? (
                                        <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center italic font-black uppercase text-[10px] tracking-[0.5em] opacity-40">
                                            <Activity size={48} className="mb-6" />
                                            Zero Registry Found
                                        </div>
                                    ) : (
                                        selectedWorker.history.map((log, lidx) => (
                                            <div key={lidx} className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-2 border-slate-50 dark:border-slate-700 shadow-xl flex items-center justify-between group hover:border-black transition-all relative overflow-hidden h-32">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center font-black text-xl italic border-4 border-white dark:border-slate-800 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:scale-110">{log.date.split('/')[0]}</div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-black dark:text-white uppercase tracking-widest mb-1 italic"><SafeText data={log.date} /> • LOT #<SafeText data={log.lotNo} fallback="NZ-PRO" /></p>
                                                        <h4 className="text-lg font-black uppercase italic text-black dark:text-white tracking-tight leading-none"><SafeText data={log.design} fallback="Manual Workshop" /></h4>
                                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800 inline-block font-mono italic">UNIT: ৳<SafeText data={log.rate} fallback="0" /></p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase italic mb-1 font-mono">Ledger Credit</p>
                                                    <p className="text-2xl font-black italic text-emerald-600 tracking-tighter font-mono">+ ৳{((Number(log.receivedBorka || 0) + Number(log.receivedHijab || 0) || Number(log.amount || 0))).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </div>

                             {/* Attendance Archive */}
                             <div className="space-y-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-black dark:text-white mb-10 border-b-2 border-slate-100 dark:border-slate-800 pb-6 flex items-center gap-6 italic"><UserCheck size={22} className="text-rose-500" /> Attendance Archive Trace</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {(selectedWorker.attendanceHistory || []).slice(0, 18).map((a, aidx) => (
                                        <div key={aidx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 flex items-center justify-between relative overflow-hidden group hover:border-black transition-all shadow-lg text-center h-32 flex-col justify-center">
                                            <div className="relative z-10">
                                                <p className="text-[9px] font-black text-black dark:text-white uppercase italic mb-2 tracking-widest"><SafeText data={a.date} /></p>
                                                <p className={`text-[10px] font-black uppercase italic ${String(a.status || '').toLowerCase().includes('present') ? 'text-emerald-500 decoration-2 underline-offset-4' : 'text-rose-500'}`}><SafeText data={a.status} /></p>
                                            </div>
                                            <div className={`w-1.5 h-1/2 absolute right-0 top-1/4 rounded-l-full ${a.status.toLowerCase().includes('present') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                        </div>
                                    ))}
                                    {(selectedWorker.attendanceHistory || []).length === 0 && <div className="col-span-full py-12 text-center opacity-20 text-[10px] font-black uppercase tracking-widest italic">No attendance records found</div>}
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
