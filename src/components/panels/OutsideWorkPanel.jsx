import React, { useState } from 'react';
import { Card, Row, Col, Typography, Divider, QRCode, Tag, ConfigProvider } from 'antd';
const { Title, Text } = Typography;

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
  Box
} from "lucide-react";
import { syncToSheet } from '../../utils/syncUtils';
import NRZLogo from "../NRZLogo";
import QRScanner from '../QRScanner';
import UniversalSlip from '../UniversalSlip';

const QR_Slip_Theme = {
  token: { fontFamily: 'Inter, sans-serif', borderRadius: 4, fontSize: 12, colorTextBase: '#000000' },
};

const OutsideWorkPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, t, logAction }) => {
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('active'); // 'active' or 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [payModal, setPayModal] = useState(null);
    const [receiveModal, setReceiveModal] = useState(null);
    const [noteModal, setNoteModal] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [printSlip, setPrintSlip] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';
    const isWorker = user?.role !== 'admin' && user?.role !== 'manager';


    const [entryData, setEntryData] = useState({
        worker: '',
        task: '',
        borkaQty: '',
        hijabQty: '',
        rate: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSaveIssue = (shouldPrint) => {
        if (!entryData.worker || !entryData.task || (!entryData.borkaQty && !entryData.hijabQty)) {
            return showNotify('কারিগর, কাজ এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now() + Math.random(),
            date: entryData.date ? new Date(entryData.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            worker: entryData.worker,
            task: entryData.task,
            borkaQty: Number(entryData.borkaQty || 0),
            hijabQty: Number(entryData.hijabQty || 0),
            rate: Number(entryData.rate || 0),
            note: entryData.note,
            status: 'Pending',
            receivedDate: null,
            totalAmount: 0,
            paidAmount: 0
        };

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: [newEntry, ...(prev.outsideWorkEntries || [])]
        }));

        syncToSheet({
            type: "OUTSIDE_ISSUE",
            worker: newEntry.worker,
            detail: `${newEntry.task} - B:${newEntry.borkaQty} H:${newEntry.hijabQty}`,
            amount: 0
        });

        if (shouldPrint) {
            setPrintSlip(newEntry);
        }
        setShowModal(false);
        setEntryData({ worker: '', task: '', borkaQty: '', hijabQty: '', rate: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('বাইরের কাজ সফলভাবে ইস্যু হয়েছে!');
    };

    const handleReceive = (item) => {
        setReceiveModal({ ...item, rBorkaQty: item.borkaQty, rHijabQty: item.hijabQty, receiveDate: new Date().toISOString().split('T')[0] });
    };

    const handleConfirmReceive = (e) => {
        e.preventDefault();
        const rBorka = Number(receiveModal.rBorkaQty) || 0;
        const rHijab = Number(receiveModal.rHijabQty) || 0;
        const totalAmount = (rBorka + rHijab) * Number(receiveModal.rate);

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(entry => entry.id === receiveModal.id ? {
                ...entry,
                borkaQty: rBorka,
                hijabQty: rHijab,
                status: 'Received',
                receivedDate: receiveModal.receiveDate ? new Date(receiveModal.receiveDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                totalAmount: totalAmount
            } : entry)
        }));

        const updatedItem = {
            ...receiveModal,
            borkaQty: rBorka,
            hijabQty: rHijab,
            status: 'Received',
            receivedDate: receiveModal.receiveDate ? new Date(receiveModal.receiveDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            totalAmount: totalAmount
        };

        syncToSheet({
            type: "OUTSIDE_RECEIVE",
            worker: receiveModal.worker,
            detail: `${receiveModal.task} Received - B:${rBorka} H:${rHijab} Total: ${totalAmount}`,
            amount: totalAmount
        });

        setReceiveModal(null);
        showNotify('কাজ জমা নেওয়া হয়েছে ও বিল জেনারেট হয়েছে!');
        
        if (e.nativeEvent.submitter?.name === 'print') {
            setPrintSlip(updatedItem);
        }
    };

    const handleSaveNote = () => {
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(e => e.id === noteModal.id ? {
                ...e,
                note: noteModal.note
            } : e)
        }));
        setNoteModal(null);
        showNotify('নোট যুক্ত করা হয়েছে!');
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        const f = e.target;
        const updated = {
            ...editModal,
            worker: f.worker.value,
            task: f.task.value,
            borkaQty: Number(f.borka.value),
            hijabQty: Number(f.hijab.value),
            rate: Number(f.rate.value),
            note: f.note.value,
            status: f.status.value,
            date: f.date.value
        };
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: (prev.outsideWorkEntries || []).map(p => p.id === updated.id ? updated : p)
        }));
        setEditModal(null);
        showNotify('কাজ তথ্য আপডেট করা হয়েছে!');
    };

    const handlePayment = () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) return;

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(e => e.id === payModal.id ? {
                ...e,
                paidAmount: Number(e.paidAmount || 0) + Number(paymentAmount)
            } : e)
        }));

        syncToSheet({
            type: "OUTSIDE_PAYMENT",
            worker: payModal.worker,
            date: paymentDate ? new Date(paymentDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            detail: `Payment for ${payModal.task}`,
            amount: Number(paymentAmount)
        });

        setPayModal(null);
        setPaymentAmount('');
        showNotify('পেমেন্ট সফলভাবে রেকর্ড হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন ডিলিট করতে পারবেন!', 'error');
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
            <div className="min-h-screen bg-white text-black italic font-outfit py-10 print:py-0 print:bg-white overflow-hidden">
                <style>{`
                    @media print { 
                        .no-print { display: none !important; } 
                        body { background: white !important; margin: 0; padding: 0; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
                <div className="no-print flex justify-between items-center mb-6 w-[210mm] mx-auto bg-white p-6 rounded-3xl shadow-xl border border-slate-100 font-bold">
                    <button onClick={() => setPrintSlip(null)} className="bg-slate-50 text-slate-600 px-10 py-5 uppercase text-xs rounded-2xl hover:bg-black hover:text-white transition-all">Cancel</button>
                    <button onClick={() => window.print()} className="bg-black text-white px-10 py-5 rounded-2xl uppercase text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                        <Printer size={18} /> Print Job
                    </button>
                </div>
                
                <div className="w-[210mm] min-h-[297mm] mx-auto bg-white border border-gray-100 overflow-hidden relative">
                    <UniversalSlip data={printSlip} type="ISSUE" copyTitle="RECIPIENT COPY" />
                    <div className="h-4 w-full border-t-2 border-dashed border-slate-300"></div>
                    <UniversalSlip data={printSlip} type="ISSUE" copyTitle="OFFICE COPY" />
                </div>
            </div>
        );
    }

    return (
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 text-black font-sans">
      {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16 animate-fade-up px-2">
                <div className="space-y-4">
                     <h1 className="section-header !mb-0 tracking-tightest">Outside <span className="text-slate-300 dark:text-slate-700 font-light">Work Management</span></h1>
                     <div className="flex flex-wrap gap-3 items-center">
                         <span className="px-5 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg">OUTSIDE FACTORY v2.0</span>
                         <span className="px-5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-widest">Global Logistics</span>
                     </div>
                </div>
                <div className="flex flex-wrap gap-8 items-center bg-[var(--bg-secondary)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner group hover:scale-110 transition-all"><CheckCircle size={20} /></div>
                        <div>
                             <p className="text-3xl font-bold leading-none dark:text-white tracking-tight">{activeEntries.length}</p>
                             <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Active Tasks</p>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-[var(--border)]"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 shadow-inner group hover:scale-110 transition-all"><DollarSign size={20} /></div>
                        <div>
                             <p className="text-3xl font-bold leading-none dark:text-white tracking-tight">{historyEntries.reduce((acc, curr) => acc + (curr.totalAmount - (curr.paidAmount || 0)), 0).toLocaleString()}৳</p>
                             <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Total Payable</p>
                        </div>
                    </div>
                </div>
            </div>

      {showQR && (
        <QRScanner
          onScanSuccess={(code) => {
             const lot = (masterData.outsideWorkEntries || []).find(p => String(p.id) === String(code) && p.status === 'Pending');
             if (lot) {
                setReceiveModal({ ...lot, rBorkaQty: lot.borkaQty, rHijabQty: lot.hijabQty, receiveDate: new Date().toISOString().split('T')[0] });
                showNotify(`External ID #${code} Identified. Logistics Clear.`);
             } else {
                showNotify(`External ID #${code} not found in pending queue.`, "error");
             }
          }}
          onClose={() => setShowQR(false)}
        />
      )}

            <div className="flex flex-wrap items-center justify-between gap-8 mb-16 no-print">
                <div className="pill-nav shadow-sm">
                    <button onClick={() => setView('active')} className={`pill-tab ${view === 'active' ? 'pill-tab-active' : 'pill-tab-inactive'}`}>Active Operations ({activeEntries.length})</button>
                    <button onClick={() => setView('history')} className={`pill-tab ${view === 'history' ? 'pill-tab-active' : 'pill-tab-inactive'}`}>Activity Logs ({historyEntries.length})</button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-all" />
                        <input
                            type="text"
                            placeholder="Find Task or Worker..."
                            className="premium-input !py-4 !pl-14 !rounded-2xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {(isAdmin || isManager) && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="action-btn-primary flex items-center gap-2"
                        >
                            <Plus size={18} strokeWidth={3} /> Issue Task
                        </button>
                    )}
                </div>
            </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(view === 'active' ? activeEntries : historyEntries).length === 0 ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
                    <ExternalLink size={48} strokeWidth={1} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-6">Zero External Nodes</p>
                </div>
            ) : (
                (view === 'active' ? activeEntries : historyEntries).map((item) => (
                    <div key={item.id} className="premium-card p-0 group">
                        <div className="flex flex-col h-full">
                            {/* Top Banner */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-[var(--border)] flex justify-between items-start">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Reference</p>
                                    <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{item.worker}</h3>
                                </div>
                                <div className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {item.status}
                                </div>
                            </div>

                            {/* Details Content */}
                            <div className="p-8 space-y-6 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100/50 dark:border-white/5">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operations</p>
                                        <p className="text-sm font-bold truncate">{item.task}</p>
                                    </div>
                                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100/50 dark:border-white/5">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lot Size</p>
                                        <p className="text-sm font-bold truncate">B:{item.borkaQty} | H:{item.hijabQty}</p>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center py-4 border-y border-[var(--border)] border-dashed">
                                    <div className="flex flex-col">
                                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Financial Yield</span>
                                         <span className="text-xl font-bold text-[var(--text-primary)]">৳{((item.borkaQty + item.hijabQty) * item.rate).toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Assigned</span>
                                         <p className="text-[10px] font-semibold text-slate-500">{item.date}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="flex gap-3 p-8 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/20">
                                {item.status === 'Pending' ? (
                                    <>
                                        <button onClick={() => setPrintSlip(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm border border-[var(--border)]">
                                            <Printer size={18} />
                                        </button>
                                        {(isAdmin || isManager) && <button onClick={() => handleReceive(item)} className="bg-black text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">জমা নিন (REC)</button>}
                                        {isAdmin && (
                                            <div className="flex gap-2 ml-auto">
                                                <button onClick={() => setEditModal(item)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-[var(--border)]">
                                                    <Settings size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-[var(--border)]">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setPrintSlip(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm border border-[var(--border)]">
                                            <Printer size={18} />
                                        </button>
                                        {(isAdmin || isManager) && (
                                            <button onClick={() => setPayModal(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <div className="flex gap-2 ml-auto">
                                                <button onClick={() => setEditModal(item)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-[var(--border)]">
                                                    <Settings size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-[var(--border)]">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )))}
        </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[250] flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl my-auto rounded-3xl border-2 border-black shadow-3xl p-6 md:p-16 space-y-12 animate-fade-up text-black italic relative font-outfit uppercase">
                        <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-4 bg-slate-50 hover:bg-black hover:text-white rounded-full transition-all z-10 border border-slate-100 shadow-sm"><X size={24} /></button>
                        
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl">
                                <Plus size={32} strokeWidth={3} />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">
                                <span className="text-black">External</span> <span className="text-transparent" style={{ WebkitTextStroke: "1px #cbd5e1" }}>Task</span>
                            </h3>
                            <p className="inline-block px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest italic">
                                OUTSOURCE UNIT MODE
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-6 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-black uppercase tracking-widest">Select Contractor (কারিগর)</label>
                                    <select className="premium-input bg-black text-white px-6 py-4 rounded-2xl h-16 w-full font-black text-sm uppercase appearance-none" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                                        <option value="">-- SELECT WORKER --</option>
                                        {(masterData.outsideWorkers || []).map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-black uppercase tracking-widest">Work Type (কাজ)</label>
                                    <select className="premium-input bg-slate-50 border-slate-100 px-6 py-4 rounded-2xl h-16 w-full font-black text-sm uppercase appearance-none" value={entryData.task} onChange={(e) => setEntryData(p => ({ ...p, task: e.target.value }))}>
                                        <option value="">-- SELECT TASK --</option>
                                        {(masterData.outsideTasks || []).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rate</p>
                                        <input type="number" className="w-full bg-transparent text-xl font-black text-emerald-600 outline-none" placeholder="৳0" value={entryData.rate} onChange={(e) => setEntryData(p => ({ ...p, rate: e.target.value }))} />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date</p>
                                        <input type="date" className="w-full bg-transparent text-xs font-black outline-none" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-6 flex flex-col gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <label className="text-xs font-black text-black uppercase tracking-widest">Quantities & Notes</label>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Borka</p>
                                        <input type="number" className="w-full text-center text-4xl font-black outline-none" placeholder="0" value={entryData.borkaQty} onChange={(e) => setEntryData(p => ({ ...p, borkaQty: e.target.value }))} />
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Hijab</p>
                                        <input type="number" className="w-full text-center text-4xl font-black outline-none" placeholder="0" value={entryData.hijabQty} onChange={(e) => setEntryData(p => ({ ...p, hijabQty: e.target.value }))} />
                                    </div>
                                </div>
                                <textarea className="w-full bg-white border border-slate-200 rounded-2xl p-6 font-bold text-sm h-32 outline-none focus:border-black transition-all" placeholder="Optional Remarks..." value={entryData.note} onChange={(e) => setEntryData(p => ({ ...p, note: e.target.value }))} />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-12 border-t border-slate-100">
                            <button onClick={() => handleSaveIssue(false)} className="flex-1 py-6 bg-black text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none">
                                CONFIRM ISSUE
                            </button>
                            <button onClick={() => handleSaveIssue(true)} className="flex-1 py-6 bg-indigo-600 text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 outline-none">
                                <Printer size={24} /> & PRINT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {
                payModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-3 md:p-4">
                        <div className="bg-white rounded-[3rem] md:rounded-[4rem] w-full max-w-md p-6 md:p-12 text-center space-y-6 md:space-y-8 animate-pulse-once">
                            <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-12">
                                <DollarSign size={40} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Pay {payModal.worker}</h3>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">{payModal.task} Bill</p>
                            </div>
                            <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Payment Date</p>
                                    <input type="date" className="w-full text-center text-sm font-black bg-transparent border-none outline-none" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Enter Amount</p>
                                    <input type="number" autoFocus className="w-full text-center text-4xl font-black bg-transparent border-none outline-none tracking-tighter" placeholder="৳0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setPayModal(null)} className="flex-1 py-6 bg-slate-100 rounded-2xl font-black uppercase text-xs">Cancel</button>
                                <button onClick={handlePayment} className="flex-1 py-6 bg-black text-white rounded-2xl font-black uppercase text-xs shadow-xl">Confirm Pay</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                receiveModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-3 md:p-4 italic">
                        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] w-full max-w-2xl border-4 border-slate-50 shadow-3xl p-6 md:p-10 animate-fade-up">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Receive Work</h3>
                                <button onClick={() => setReceiveModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleConfirmReceive} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center">
                                        <label className="text-[10px] font-black text-slate-600 uppercase block mb-4">Borka Received</label>
                                        <input type="number" className="w-full text-center text-5xl font-black bg-transparent border-none outline-none text-black" value={receiveModal.rBorkaQty} onChange={(e) => setReceiveModal({ ...receiveModal, rBorkaQty: e.target.value })} autoFocus />
                                    </div>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center">
                                        <label className="text-[10px] font-black text-slate-600 uppercase block mb-4">Hijab Received</label>
                                        <input type="number" className="w-full text-center text-5xl font-black bg-transparent border-none outline-none text-black" value={receiveModal.rHijabQty} onChange={(e) => setReceiveModal({ ...receiveModal, rHijabQty: e.target.value })} />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center block">Date (তারিখ)</label>
                                    <input type="date" className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl text-lg font-black italic px-8 text-center outline-none focus:border-black" value={receiveModal.receiveDate} onChange={(e) => setReceiveModal({ ...receiveModal, receiveDate: e.target.value })} />
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" className="flex-[2] py-6 bg-black text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">
                                        CONFIRM RECEIVE
                                    </button>
                                    <button name="print" type="submit" className="flex-1 py-6 bg-indigo-600 text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                        <Printer size={24} /> & PRINT
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                editModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-start md:items-center justify-center p-3 md:p-4 text-black italic">
                        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] w-full max-w-2xl border-4 border-amber-500 shadow-3xl p-6 md:p-10 animate-fade-up max-h-[96vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl rotate-3">
                                        <Settings size={28} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Outside Override</h3>
                                </div>
                                <button onClick={() => setEditModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleEditSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-black uppercase italic">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Worker (কারিগর)</label>
                                    <input name="worker" defaultValue={editModal.worker} className="form-input italic" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Task (কাজের ধরন)</label>
                                    <input name="task" defaultValue={editModal.task} className="form-input italic" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Borka Qty</label>
                                    <input name="borka" type="number" defaultValue={editModal.borkaQty} className="form-input italic" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Hijab Qty</label>
                                    <input name="hijab" type="number" defaultValue={editModal.hijabQty} className="form-input italic" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Rate (মজুরি)</label>
                                    <input name="rate" type="number" defaultValue={editModal.rate} className="form-input italic" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Date (তারিখ)</label>
                                    <input name="date" type="date" defaultValue={editModal.date ? (editModal.date.includes('/') ? editModal.date.split('/').reverse().join('-') : editModal.date) : ''} className="form-input italic" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Status</label>
                                    <select name="status" defaultValue={editModal.status} className="form-input bg-black text-white italic">
                                        <option value="Pending">PENDING</option>
                                        <option value="Received">RECEIVED</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Note</label>
                                    <textarea name="note" defaultValue={editModal.note} className="form-input h-24 italic py-4" />
                                </div>
                                <button type="submit" className="md:col-span-2 py-6 bg-amber-500 text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl border-b-[8px] border-amber-900 active:scale-95 transition-all">SAVE MODIFICATIONS</button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OutsideWorkPanel;
