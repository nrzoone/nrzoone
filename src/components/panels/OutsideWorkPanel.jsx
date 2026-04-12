import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  X,
  Printer,
  ArrowLeft,
  Settings,
  Search,
  Camera,
  CheckCircle,
  ExternalLink,
  DollarSign,
  Box,
  Clock,
  Activity,
  User,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncToSheet } from '../../utils/syncUtils';
import NRZLogo from "../NRZLogo";
import QRScanner from '../QRScanner';
import UniversalSlip from '../UniversalSlip';

const OutsideWorkPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, t, logAction }) => {
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('active'); // 'active', 'history', 'b2b_incoming'
    const [searchTerm, setSearchTerm] = useState('');
    const [lotSearch, setLotSearch] = useState('');
    const [payModal, setPayModal] = useState(null);
    const [receiveModal, setReceiveModal] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [printSlip, setPrintSlip] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const role = user?.role?.toLowerCase();
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const isWorker = role !== 'admin' && role !== 'manager';

    const [entryData, setEntryData] = useState({
        worker: '',
        client: 'FACTORY',
        design: '',
        size: '',
        task: '',
        borkaQty: '',
        hijabQty: '',
        rate: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleLotSearch = (lotNo) => {
        setLotSearch(lotNo);
        const lotInfo = (masterData.cuttingStock || []).find(l => String(l.lotNo) === String(lotNo));
        if (lotInfo) {
            setEntryData(prev => ({
                ...prev,
                lotNo: lotInfo.lotNo,
                design: lotInfo.design,
                client: lotInfo.client || 'FACTORY',
                borkaQty: lotInfo.borka || 0,
                hijabQty: lotInfo.hijab || 0
            }));
            showNotify(`Lot #${lotNo} synchronized!`, "success");
        }
    };

    const incomingOrders = useMemo(() => {
        return (masterData.productionRequests || []).filter(r => r.status === 'Pending Review');
    }, [masterData.productionRequests]);

    const handleAcceptB2BOrder = (order) => {
        const worker = prompt("Enter Contractor/Worker Name:", "");
        if (!worker) return;
        
        const rate = prompt("Enter Rate (Tk):", "0");
        if (rate === null) return;

        const newEntry = {
            id: `outside_b2b_${Date.now()}`,
            date: new Date().toLocaleDateString('en-GB'),
            worker: worker,
            client: order.client || 'FACTORY',
            design: order.design || 'N/A',
            task: 'B2B ORDER',
            borkaQty: Number(order.totalBorka || 0),
            hijabQty: Number(order.totalHijab || 0),
            rate: Number(rate),
            note: `B2B ORDER: ${order.design}`,
            status: 'Pending',
            receivedDate: null,
            totalAmount: 0,
            paidAmount: 0
        };

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: [newEntry, ...(prev.outsideWorkEntries || [])],
            productionRequests: (prev.productionRequests || []).map(r => r.id === order.id ? { ...r, status: 'In Production (Outside)', lotNo: newEntry.id } : r)
        }));
        showNotify(`B2B Order assigned to ${worker}`);
    };

    const handleSaveIssue = (shouldPrint) => {
        if (!entryData.worker || !entryData.task || (!entryData.borkaQty && !entryData.hijabQty)) {
            return showNotify('কারিগর, কাজ এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: `outside_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lotNo: entryData.lotNo || 'N/A',
            date: entryData.date ? new Date(entryData.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            worker: entryData.worker,
            client: entryData.client || 'FACTORY',
            design: entryData.design || 'N/A',
            size: entryData.size || 'N/A',
            task: entryData.task,
            borkaQty: Number(entryData.borkaQty || 0),
            hijabQty: Number(entryData.hijabQty || 0),
            rate: Number(entryData.rate || 0),
            note: entryData.note,
            status: 'Pending',
            totalAmount: 0,
            paidAmount: 0
        };

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: [newEntry, ...(prev.outsideWorkEntries || [])]
        }));

        if (shouldPrint) setPrintSlip(newEntry);
        logAction(user, 'OUTSIDE_ISSUE', `${newEntry.worker} - ${newEntry.task}`);
        setShowModal(false);
        setEntryData({ worker: '', client: 'FACTORY', design: '', task: '', borkaQty: '', hijabQty: '', rate: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('কাজ সফলভাবে ইস্যু হয়েছে!');
    };

    const handleConfirmReceive = (e) => {
        e.preventDefault();
        const rBorka = Number(receiveModal.rBorkaQty) || 0;
        const rHijab = Number(receiveModal.rHijabQty) || 0;
        const totalAmount = (rBorka + rHijab) * Number(receiveModal.rate);

        setMasterData(prev => {
            const updatedEntries = prev.outsideWorkEntries.map(entry => entry.id === receiveModal.id ? {
                ...entry,
                borkaQty: rBorka,
                hijabQty: rHijab,
                status: 'Received',
                receivedDate: receiveModal.receiveDate ? new Date(receiveModal.receiveDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                totalAmount: totalAmount
            } : entry);

            const newFinishedStock = {
                id: `FIN_OUT_${Date.now()}`,
                date: new Date().toLocaleDateString('en-GB'),
                design: receiveModal.design,
                color: 'N/A',
                size: receiveModal.size || 'N/A',
                lotNo: receiveModal.lotNo,
                client: receiveModal.client || 'FACTORY',
                borka: rBorka,
                hijab: rHijab,
                source: 'OUTSIDE'
            };

            // Generate Client Bill for Outside Work if applicable
            let updatedClientTransactions = [...(prev.clientTransactions || [])];
            if (receiveModal.client && receiveModal.client !== 'FACTORY') {
                const dObj = (masterData.designs || []).find(d => d.name === receiveModal.design);
                // Priority: Per-client override > Default client rate > Legacy field > 0
                const perClientRate = dObj?.clientRates?.[receiveModal.client]?.outwork;
                const clientRate = perClientRate || dObj?.defaultClientRates?.outwork || dObj?.clientOutsideRate || 0; 
                const totalPcs = rBorka + rHijab;
                const billAmount = totalPcs * clientRate;
                
                if (billAmount > 0) {
                    updatedClientTransactions = [{
                        id: `BILL_OUT_${Date.now()}`,
                        date: new Date().toLocaleDateString('en-GB'),
                        client: receiveModal.client,
                        amount: billAmount,
                        type: 'BILL',
                        dept: 'OUTSIDE',
                        note: `OUTSIDE BILL: ${receiveModal.design} (${totalPcs} pcs @ ${clientRate}tk)`
                    }, ...updatedClientTransactions];
                    logAction(user, 'CLIENT_BILL_AUTO_OUTSIDE', `${receiveModal.client} billed ${billAmount}tk for Outside Work: ${receiveModal.design}`);
                }
            }

            return {
                ...prev,
                outsideWorkEntries: updatedEntries,
                finishedStock: [newFinishedStock, ...(prev.finishedStock || [])],
                clientTransactions: updatedClientTransactions
            };
        });

        setReceiveModal(null);
        showNotify('কাজ জমা নেওয়া হয়েছে!');
    };

    const handlePayment = () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) return;

        const amount = Number(paymentAmount);
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(e => e.id === payModal.id ? {
                ...e,
                paidAmount: Number(e.paidAmount || 0) + amount
            } : e),
            expenses: [
                {
                    id: `exp_out_${Date.now()}`,
                    date: paymentDate || new Date().toISOString().split('T')[0],
                    category: 'salary',
                    description: `OUTSIDE PMT: ${payModal.worker} - ${payModal.task}`,
                    amount: amount
                },
                ...(prev.expenses || [])
            ]
        }));

        setPayModal(null);
        setPaymentAmount('');
        showNotify('পেমেন্ট সফলভাবে ব্যালেন্সে যুক্ত হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন রেকর্ড মুছতে পারবেন!', 'error');
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: (prev.outsideWorkEntries || []).filter(item => item.id !== id)
        }));
        showNotify('এন্ট্রি মুছে ফেলা হয়েছে!');
    };

    const filteredEntries = (masterData.outsideWorkEntries || []).filter(e => {
        if (isWorker && e.worker?.toLowerCase() !== user?.name?.toLowerCase()) return false;
        return (e.worker?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (e.task?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    });

    const activeEntries = filteredEntries.filter(e => e.status === 'Pending');
    const historyEntries = filteredEntries.filter(e => e.status === 'Received');

    if (printSlip) {
        return (
            <div className="min-h-screen bg-white p-10 font-outfit italic animate-fade-up">
                <div className="no-print flex justify-between items-center mb-10 max-w-5xl mx-auto">
                    <button onClick={() => setPrintSlip(null)} className="px-8 py-4 bg-slate-50 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">বাতিল (Cancel)</button>
                    <button onClick={() => window.print()} className="action-btn-primary !px-12 !py-4 shadow-xl">
                        <Printer size={18} /> স্লিপ প্রিন্ট করুন (PDF)
                    </button>
                </div>
                <div className="w-[210mm] mx-auto bg-white border border-slate-100 shadow-2xl p-1 relative">
                    <UniversalSlip data={printSlip} type="ISSUE" copyTitle="কারিগর কপি (RECIPIENT)" />
                    <div className="h-4 border-t-2 border-dashed border-slate-300 my-10"></div>
                    <UniversalSlip data={printSlip} type="ISSUE" copyTitle="অফিস কপি (OFFICE)" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-32 animate-fade-up px-1 md:px-2 italic font-outfit text-black dark:text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => setView('active')}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border flex items-center gap-6 group transition-all text-left shadow-md ${view === 'active' ? 'border-amber-500 bg-amber-50/10' : 'border-slate-100 dark:border-slate-800'}`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:rotate-3 ${view === 'active' ? 'bg-amber-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black tracking-tighter leading-none mb-1">{activeEntries.length}</p>
                        <p className="text-[7.5px] font-black uppercase tracking-widest leading-none opacity-40">চলমান কাজ</p>
                    </div>
                </button>

                <button 
                  onClick={() => setView('history')}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border flex items-center gap-6 group transition-all text-left shadow-md ${view === 'history' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 dark:border-slate-800'}`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:rotate-3 ${view === 'history' ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black tracking-tighter leading-none mb-1">{historyEntries.length}</p>
                        <p className="text-[7.5px] font-black uppercase tracking-widest leading-none opacity-40">জমা হওয়া রেকর্ড</p>
                    </div>
                </button>

                <div className="bg-slate-950 p-5 rounded-2xl text-white shadow-xl flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-2xl font-black tracking-tighter leading-none mb-1">৳{(activeEntries.reduce((s,e)=>s+(Number(e.borkaQty)+Number(e.hijabQty))*Number(e.rate), 0)).toLocaleString()}</p>
                        <p className="text-[7.5px] font-black uppercase tracking-widest leading-none opacity-40">চলমান কাজের ভ্যালু</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Activity size={24} className="text-blue-400" /></div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-1 md:p-1.5 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg w-full md:w-auto">
                    {['active', 'history', 'b2b_incoming'].map(v => (
                        <button key={v} onClick={() => setView(v)} className={`flex-1 md:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400 dark:text-slate-500'}`}>
                            {v === 'active' ? 'চলমান' : v === 'history' ? 'পুরাতন' : 'B2B ইনকামিং'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 md:gap-3 px-2 w-full md:w-auto">
                    <div className="relative group flex-1">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input placeholder="কারিগর বা কাজ..." className="bg-slate-50 dark:bg-slate-800 h-9 md:h-10 pl-9 pr-4 rounded-xl text-[9px] font-black uppercase outline-none w-full md:w-40 border border-transparent focus:border-black transition-all italic" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    {!isWorker && (
                        <button onClick={() => setShowModal(true)} className="h-9 md:h-10 bg-slate-950 text-white px-4 md:px-5 rounded-xl flex items-center gap-2 shadow-md font-black uppercase text-[8.5px] tracking-widest italic transition-all active:scale-95">
                            <Plus size={14} /> নতুন ইস্যু
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                    <div key={item.id} className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:border-black transition-all group animate-fade-up">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-0.5">
                                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none italic">চুক্তিভিত্তিক কারিগর</p>
                                <h4 className="text-xl font-black tracking-tighter text-black dark:text-white uppercase leading-none italic truncate max-w-[150px]">{item.worker}</h4>
                            </div>
                            <div className={`w-10 h-10 ${item.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} rounded-xl flex items-center justify-center shadow-inner`}>
                                <ExternalLink size={18} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-white dark:border-slate-700">
                                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">ডিজাইন</p>
                                <p className="text-[11px] font-black text-black dark:text-white truncate uppercase italic">{item.design}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-white dark:border-slate-700">
                                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">কাজ/টাস্ক</p>
                                <p className="text-[11px] font-black text-black dark:text-white truncate uppercase italic">{item.task}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-4 border-y border-slate-100 dark:border-slate-800 border-dashed mb-4">
                             <div>
                                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 block leading-none italic">অর্জিত বিল</span>
                                <span className="text-2xl font-black text-emerald-500 tracking-tighter italic leading-none">৳{((Number(item.borkaQty) + Number(item.hijabQty)) * Number(item.rate)).toLocaleString()}</span>
                             </div>
                             <div className="text-right">
                                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1 block leading-none italic">পরিমাণ</span>
                                <p className="text-xl font-black text-black dark:text-white italic leading-none tracking-tighter">{Number(item.borkaQty) + Number(item.hijabQty)} <span className="text-[9px] opacity-40 uppercase">Pcs</span></p>
                             </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button onClick={() => setPrintSlip(item)} className="w-11 h-11 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 hover:border-black transition-all">
                                <Printer size={16} />
                            </button>
                            {item.status === 'Pending' ? (
                                <button onClick={() => setReceiveModal({ ...item, rBorkaQty: item.borkaQty, rHijabQty: item.hijabQty, receiveDate: new Date().toISOString().split('T')[0] })} className="flex-1 h-11 bg-slate-950 text-white dark:bg-white dark:text-black rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-md">কাজ জমা নিন</button>
                            ) : (
                                <button onClick={() => setPayModal(item)} className="flex-1 h-11 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-md">পেমেন্ট দিন</button>
                            )}
                            {isAdmin && (
                                <button onClick={() => handleDelete(item.id)} className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-10 relative border border-slate-100 dark:border-slate-800">
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black dark:hover:text-white"><X size={24} /></button>
                            <h2 className="text-xl font-black uppercase italic mb-8 text-center">নতুন কাজ <span className="text-blue-600">ইস্যু করুন</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">কারিগর</label>
                                        <input className="premium-input !h-10 font-black uppercase !text-[11px]" placeholder="NAME..." value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">কাজ</label>
                                        <input className="premium-input !h-10 font-black uppercase !text-[11px]" placeholder="TASK..." value={entryData.task} onChange={(e) => setEntryData(p => ({ ...p, task: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">বোরকা</label>
                                            <input type="number" className="premium-input !h-10 font-black text-center !text-[11px]" placeholder="0" value={entryData.borkaQty} onChange={(e) => setEntryData(p => ({ ...p, borkaQty: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">হিজাব</label>
                                            <input type="number" className="premium-input !h-10 font-black text-center !text-[11px]" placeholder="0" value={entryData.hijabQty} onChange={(e) => setEntryData(p => ({ ...p, hijabQty: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">রেট (৳ প্রতি পিস)</label>
                                        <input type="number" className="premium-input !h-10 font-black !text-emerald-600 !text-[11px]" placeholder="0.00" value={entryData.rate} onChange={(e) => setEntryData(p => ({ ...p, rate: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">তারিখ</label>
                                        <input type="date" className="premium-input !h-10 font-black !text-[11px]" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                    <textarea className="premium-input !h-24 pt-3 font-black uppercase !text-[11px]" placeholder="NOTE..." value={entryData.note} onChange={(e) => setEntryData(p => ({ ...p, note: e.target.value }))} />
                                </div>
                            </div>
                            <button onClick={() => handleSaveIssue(false)} className="w-full mt-8 py-4 bg-slate-950 text-white rounded-xl font-black uppercase tracking-widest italic shadow-lg hover:bg-black transition-all text-xs">নিশ্চিত করুন (DEPLOY)</button>
                        </motion.div>
                    </div>
                )}

                {receiveModal && (
                    <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 relative border border-slate-100 dark:border-slate-800">
                            <button onClick={() => setReceiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={24} /></button>
                            <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter text-center">{receiveModal.worker} <span className="text-emerald-500">জমা নিন</span></h2>
                            <div className="grid grid-cols-2 gap-4 mb-8 text-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-white dark:border-slate-700">
                                <div><p className="text-[10px] font-black uppercase text-slate-400 opacity-60">বোরকা</p><input type="number" className="w-full text-center text-3xl font-black bg-transparent outline-none" value={receiveModal.rBorkaQty} onChange={(e) => setReceiveModal(p => ({ ...p, rBorkaQty: e.target.value }))} /></div>
                                <div><p className="text-[10px] font-black uppercase text-slate-400 opacity-60">হিজাব</p><input type="number" className="w-full text-center text-3xl font-black bg-transparent outline-none" value={receiveModal.rHijabQty} onChange={(e) => setReceiveModal(p => ({ ...p, rHijabQty: e.target.value }))} /></div>
                            </div>
                            <button onClick={handleConfirmReceive} className="w-full py-5 bg-slate-950 text-white dark:bg-white dark:text-black rounded-2xl font-black uppercase tracking-widest italic shadow-xl hover:scale-[1.02] active:scale-95 transition-all">জমা নেওয়া নিশ্চিত করুন (RECEIVE)</button>
                        </motion.div>
                    </div>
                )}

                {payModal && (
                    <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 relative border border-slate-100 dark:border-slate-800">
                            <button onClick={() => setPayModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={24} /></button>
                            <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter text-center">{payModal.worker} <span className="text-blue-500">পেমেন্ট</span></h2>
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center mb-8 border border-white dark:border-slate-700">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-4 opacity-60 tracking-widest">টাকার পরিমাণ (৳)</p>
                                <input type="number" className="w-full text-4xl font-black text-center bg-transparent outline-none text-blue-600" placeholder="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                            </div>
                            <button onClick={handlePayment} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl hover:scale-[1.02] active:scale-95 transition-all">কনফার্ম পেমেন্ট</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="pt-24 pb-12 flex justify-center">
                <button
                    onClick={() => setActivePanel("Overview")}
                    className="group flex items-center gap-6 bg-white dark:bg-slate-900 px-10 md:px-12 py-5 md:py-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl hover:border-black transition-all duration-500"
                >
                    <div className="p-3 bg-slate-950 text-white rounded-xl transition-transform shadow-lg group-hover:-translate-x-2">
                        <ArrowLeft size={18} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black tracking-tighter text-black dark:text-white uppercase leading-none italic">EXIT TO HUB</span>
                </button>
            </div>
        </div>
    );
};

export default OutsideWorkPanel;
