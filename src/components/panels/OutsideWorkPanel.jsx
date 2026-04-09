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
  Box,
  Clock
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

    const role = user?.role?.toLowerCase();
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const isWorker = role !== 'admin' && role !== 'manager';


    const [entryData, setEntryData] = useState({
        worker: '',
        client: 'FACTORY',
        design: '',
        task: '',
        borkaQty: '',
        hijabQty: '',
        rate: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSaveIssue = async (shouldPrint) => {
        if (!entryData.worker || !entryData.task || (!entryData.borkaQty && !entryData.hijabQty)) {
            return showNotify('কারিগর, কাজ এবং পরিমাণ আবশ্যক!', 'error');
        }

        try {
            const newEntry = {
                id: `outside_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: entryData.date ? new Date(entryData.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                worker: entryData.worker,
                client: entryData.client || 'FACTORY',
                design: entryData.design || 'N/A',
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

            await syncToSheet({
                type: "OUTSIDE_ISSUE",
                worker: newEntry.worker,
                detail: `${newEntry.task} - B:${newEntry.borkaQty} H:${newEntry.hijabQty}`,
                amount: 0
            }).catch(e => console.warn("Sync deferred:", e));

            if (shouldPrint) {
                setPrintSlip(newEntry);
            }
            logAction(user, 'OUTSIDE_ISSUE', `${newEntry.worker} - ${newEntry.task}. Qty: B:${newEntry.borkaQty} H:${newEntry.hijabQty}`);
            setShowModal(false);
            setEntryData({ worker: '', client: 'FACTORY', design: '', task: '', borkaQty: '', hijabQty: '', rate: '', note: '', date: new Date().toISOString().split('T')[0] });
            showNotify('বাইরের কাজ সফলভাবে ইস্যু হয়েছে!');
        } catch (error) {
            console.error("Save error:", error);
            showNotify("সংরক্ষণ করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।", "error");
        }
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

        // B2B Conditional Billing Logic
        if (receiveModal.client && receiveModal.client !== "FACTORY") {
            const designObj = (masterData.designs || []).find(d => d.name === receiveModal.design);
            const outworkRate = designObj?.clientRates?.[receiveModal.client]?.outwork;

            if (outworkRate && Number(outworkRate) > 0) {
                const billAmount = (rBorka + rHijab) * Number(outworkRate);
                if (billAmount > 0) {
                    const b2bBill = {
                        id: `b2b_out_${Date.now()}`,
                        date: new Date().toLocaleDateString("en-GB"),
                        client: receiveModal.client,
                        type: 'BILL',
                        amount: billAmount,
                        note: `O-BILL: OUTWORK (${receiveModal.task}) of ${rBorka + rHijab} PCS (${receiveModal.design})`
                    };
                    setMasterData(prev => ({
                        ...prev,
                        clientTransactions: [b2bBill, ...(prev.clientTransactions || [])]
                    }));
                }
            }
        }

        setReceiveModal(null);
        logAction(user, 'OUTSIDE_RECEIVE', `Received from ${receiveModal.worker}: ${receiveModal.task}. Total Bill: ${totalAmount}৳`);
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
        logAction(user, 'OUTSIDE_PAYMENT', `Paid ${payModal.worker} ${paymentAmount}৳ for ${payModal.task}`);
        showNotify('পেমেন্ট সফলভাবে রেকর্ড হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন ডিলিট করতে পারবেন!', 'error');
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: (prev.outsideWorkEntries || []).filter(item => item.id !== id)
        }));
        logAction(user, 'OUTSIDE_DELETE', `Deleted outside entry ID: ${id}`);
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
            <div className="min-h-screen bg-white text-black dark:text-white italic font-outfit py-10 print:py-0 print:bg-white overflow-hidden">
                <style>{`
                    @media print { 
                        .no-print { display: none !important; } 
                        body { background: white !important; margin: 0; padding: 0; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
                <div className="no-print flex justify-between items-center mb-6 w-[210mm] mx-auto bg-white p-6 rounded-3xl shadow-xl border border-slate-100 font-bold">
                    <button onClick={() => setPrintSlip(null)} className="bg-slate-50 text-black dark:text-white px-10 py-5 uppercase text-xs rounded-2xl hover:bg-black hover:text-white transition-all">Cancel</button>
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
        <div className="space-y-10 pb-32 animate-fade-up px-1 md:px-4">
            {/* SaaS Operational HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => setView('active')}
                  className={`bg-white dark:bg-slate-900 p-6 rounded-xl border flex items-center gap-6 group transition-all text-left shadow-sm ${view === 'active' ? 'border-amber-500 bg-amber-50/10' : 'border-slate-100 dark:border-slate-800'}`}
                >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${view === 'active' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white dark:text-white'}`}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold tracking-tight text-black dark:text-white dark:text-white leading-none mb-1">{activeEntries.length}</p>
                        <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none">চলমান কাজ (Running Tasks)</p>
                    </div>
                </button>

                <button 
                  onClick={() => setView('history')}
                  className={`bg-white dark:bg-slate-900 p-6 rounded-xl border flex items-center gap-6 group transition-all text-left shadow-sm ${view === 'history' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 dark:border-slate-800'}`}
                >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${view === 'history' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white dark:text-white'}`}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold tracking-tight text-black dark:text-white dark:text-white leading-none mb-1">{historyEntries.length}</p>
                        <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none">জমা হওয়া কাজ (History)</p>
                    </div>
                </button>

                <div className="bg-slate-950 p-6 rounded-xl text-white shadow-xl flex items-center justify-between group overflow-hidden relative">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-14 h-14 bg-white/10 text-white rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold tracking-tight leading-none mb-1">৳{historyEntries.reduce((acc, curr) => acc + (curr.totalAmount - (curr.paidAmount || 0)), 0).toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">মোট বকেয়া (Total Due)</p>
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

            {/* Control Bar - SaaS Pill Navigation */}
            <div className="bg-white dark:bg-slate-900 !p-1.5 flex flex-col lg:flex-row items-center justify-between gap-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex flex-wrap gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'active', label: 'চলমান কাজ (Running)' },
                        { id: 'history', label: 'জমা হওয়া কাজ (History)' }
                    ].map(v => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === v.id ? 'bg-slate-950 text-white shadow-lg' : 'text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white'}`}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative group flex-1 lg:flex-none">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white dark:text-white" />
                        <input
                            placeholder="কারিগর বা কাজ..."
                            className="premium-input !pl-11 !h-11 !text-[10px] !bg-slate-50 dark:!bg-slate-800/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {(isAdmin || isManager) && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="w-11 h-11 bg-blue-600 text-white rounded-xl shadow-lg border border-blue-500 flex items-center justify-center hover:bg-blue-700 transition-all"
                            title="নতুন কাজ ইস্যু করুন"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>
            </div>


            {/* Main Deployment Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(view === 'active' ? activeEntries : historyEntries).length === 0 ? (
                    <div className="col-span-full h-80 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 italic">
                        <Box size={40} className="text-slate-200 mb-4" />
                        <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none">বর্তমানে কোনো রেকর্ড পাওয়া যায়নি</p>
                    </div>
                ) : (
                    (view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                        <div key={item.id || idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-slate-950 transition-all flex flex-col group animate-fade-up">
                             <div className="p-6 space-y-6 flex-1">
                                 <div className="flex justify-between items-start">
                                     <div className="space-y-1">
                                         <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none">বাইরের কারিগর (Contractor)</p>
                                         <h4 className="text-2xl font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none">{item.worker}</h4>
                                     </div>
                                     <div className={`w-12 h-12 ${item.status === 'Pending' ? 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white dark:text-white' : 'bg-emerald-100 text-emerald-600'} rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                         <ExternalLink size={18} />
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                         <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-1 italic">কাজের ধরন (Task)</p>
                                         <p className="text-sm font-bold text-black dark:text-white dark:text-white truncate uppercase">{item.task}</p>
                                     </div>
                                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                         <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-1 italic">পরিমাণ (Quantity)</p>
                                         <p className="text-sm font-bold text-black dark:text-white dark:text-white truncate uppercase">বোরকা:{item.borkaQty} | হিজাব:{item.hijabQty}</p>
                                     </div>
                                 </div>
                                
                                <div className="flex justify-between items-center py-5 border-y border-slate-100 dark:border-slate-800 border-dashed">
                                    <div className="flex flex-col">
                                         <span className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-1 leading-none">মোট বিল (Total Bill)</span>
                                         <span className="text-2xl font-bold text-black dark:text-white dark:text-white leading-none">৳{((item.borkaQty + item.hijabQty) * item.rate).toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                         <span className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-1 leading-none">ইস্যুর তারিখ</span>
                                         <p className="text-[11px] font-bold text-black dark:text-white dark:text-white italic mt-1">{item.date}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="flex gap-3 p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => setPrintSlip(item)} className="w-11 h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-black dark:text-white dark:text-white hover:bg-slate-950 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="স্লিপ প্রিন্ট">
                                    <Printer size={16} />
                                </button>
                                {item.status === 'Pending' ? (
                                    <>
                                        {(isAdmin || isManager) && <button onClick={() => handleReceive(item)} className="flex-1 bg-slate-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">কাজ জমা নিন (Receive)</button>}
                                    </>
                                ) : (
                                    <>
                                        {(isAdmin || isManager) && (
                                            <button onClick={() => setPayModal(item)} className="flex-1 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">বকেয়া পরিশোধ (Pay)</button>
                                        )}
                                    </>
                                )}
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditModal(item)} className="w-11 h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="এডিট">
                                            <Settings size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="w-11 h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="ডিলিট">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl p-8 md:p-12 space-y-10 animate-fade-up relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-black dark:text-white dark:text-white"><X size={24} /></button>
                        <div className="text-center space-y-3">
                            <div className="mx-auto w-16 h-16 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-xl mb-4">
                                <Plus size={32} />
                            </div>
                            <h3 className="text-3xl font-bold uppercase tracking-tight text-black dark:text-white dark:text-white">নতুন কাজ <span className="text-blue-600">ইস্যু করুন</span></h3>
                            <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest italic leading-none">External Unit Deployment Protocol</p>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-1 uppercase tracking-widest">কারিগর (Contractor)</label>
                                    <select className="premium-input !h-12 text-sm uppercase" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                                        <option value="">কারিগর নির্বাচন করুন...</option>
                                        {(masterData.outsideWorkers || []).map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-1 uppercase tracking-widest">মালিকানা (Client Owner)</label>
                                    <select className="premium-input !h-12 text-sm uppercase" value={entryData.client} onChange={(e) => setEntryData(p => ({ ...p, client: e.target.value }))}>
                                        <option value="FACTORY">ফ্যাক্টরি নিজস্ব (FACTORY)</option>
                                        {(masterData.clients || []).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-1 uppercase tracking-widest">ডিজাইন স্টাইল (Design/Style)</label>
                                    <select className="premium-input !h-12 text-sm uppercase" value={entryData.design} onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}>
                                        <option value="">ডিজাইন নির্বাচন করুন...</option>
                                        {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-1 uppercase tracking-widest">কাজের ধরন (Task Type)</label>
                                    <select className="premium-input !h-12 text-sm uppercase" value={entryData.task} onChange={(e) => setEntryData(p => ({ ...p, task: e.target.value }))}>
                                        <option value="">কাজের ধরন নির্বাচন করুন...</option>
                                        {(masterData.outsideTasks || []).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-1 uppercase tracking-widest">রেট (Rate)</label>
                                        <input type="number" className="premium-input !h-12 text-sm text-center text-emerald-600" placeholder="৳0" value={entryData.rate} onChange={(e) => setEntryData(p => ({ ...p, rate: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-1 uppercase tracking-widest">তারিখ (Date)</label>
                                        <input type="date" className="premium-input !h-12 text-sm text-center !bg-slate-950 !text-white !border-none" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest text-center block mb-2">সংখ্যার বিবরণ (Quantities)</label>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-inner text-center">
                                        <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase mb-2">বোরকা (Borka)</p>
                                        <input type="number" className="w-full text-center text-4xl font-bold bg-transparent outline-none text-black dark:text-white dark:text-white" placeholder="0" value={entryData.borkaQty} onChange={(e) => setEntryData(p => ({ ...p, borkaQty: e.target.value }))} />
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-inner text-center">
                                        <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase mb-2">হিজাব (Hijab)</p>
                                        <input type="number" className="w-full text-center text-4xl font-bold bg-transparent outline-none text-black dark:text-white dark:text-white" placeholder="0" value={entryData.hijabQty} onChange={(e) => setEntryData(p => ({ ...p, hijabQty: e.target.value }))} />
                                    </div>
                                </div>
                                <textarea className="premium-input !h-24 !pt-4 !rounded-xl !bg-white dark:!bg-slate-900" placeholder="মন্তব্য (Optional)..." value={entryData.note} onChange={(e) => setEntryData(p => ({ ...p, note: e.target.value }))} />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl bg-white border-2 border-black text-black dark:text-white font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-lg">বাতিল করুন</button>
                            <button onClick={() => handleSaveIssue(false)} className="flex-[2] py-4 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">কাজ ইস্যু করুন</button>
                            <button onClick={() => handleSaveIssue(true)} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                <Printer size={16} /> প্রিন্ট (Slip)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settlement Modal */}
            {payModal && (
                <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl p-8 md:p-12 space-y-10 animate-fade-up relative">
                        <div className="text-center space-y-3">
                           <div className="mx-auto w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                            <DollarSign size={24} />
                          </div>
                          <h3 className="text-2xl font-bold uppercase text-black dark:text-white dark:text-white leading-none">বকেয়া <span className="text-blue-600">পরিশোধProtocol</span></h3>
                          <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-2">{payModal.worker} - AUDIT SETTLEMENT</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl shadow-inner space-y-6 border border-slate-100 dark:border-slate-800">
                            <div className="text-center space-y-2 border-b border-slate-200 dark:border-slate-700 pb-6">
                                <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest block">পেমেন্ট পরিমাণ (Amount)</label>
                                <input type="number" autoFocus className="w-full text-center text-6xl font-bold bg-transparent border-none text-black dark:text-white dark:text-white outline-none leading-none h-16" placeholder="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                            </div>
                            <div className="text-center space-y-2">
                                <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest block">পরিশোধের তারিখ</label>
                                <input type="date" className="w-full text-center text-sm font-bold bg-transparent border-none text-black dark:text-white dark:text-white outline-none" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setPayModal(null)} className="flex-1 py-4 rounded-xl bg-white border-2 border-black text-black dark:text-white font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-lg">বাতিল</button>
                            <button onClick={handlePayment} className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all">পেমেন্ট নিশ্চিত করুন</button>
                        </div>
                    </div>
                </div>
            )}


            {/* Receive Modal */}
            {receiveModal && (
                <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl shadow-2xl p-8 md:p-10 animate-fade-up relative">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-bold uppercase text-black dark:text-white dark:text-white">কাজ জমা <span className="text-blue-600">নিন (Receive)</span></h3>
                            <button onClick={() => setReceiveModal(null)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-black dark:text-white dark:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleConfirmReceive} className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest block mb-4">বোরকা জমা (Borka)</label>
                                    <input type="number" className="w-full text-center text-5xl font-bold bg-transparent border-none outline-none text-black dark:text-white dark:text-white h-16" value={receiveModal.rBorkaQty} onChange={(e) => setReceiveModal({ ...receiveModal, rBorkaQty: e.target.value })} autoFocus />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest block mb-4">হিজাব জমা (Hijab)</label>
                                    <input type="number" className="w-full text-center text-5xl font-bold bg-transparent border-none outline-none text-black dark:text-white dark:text-white h-16" value={receiveModal.rHijabQty} onChange={(e) => setReceiveModal({ ...receiveModal, rHijabQty: e.target.value })} />
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest text-center block mb-3">জমা দেওয়ার তারিখ</label>
                                <input type="date" className="premium-input !h-12 font-bold !bg-white dark:!bg-slate-950 text-center" value={receiveModal.receiveDate} onChange={(e) => setReceiveModal({ ...receiveModal, receiveDate: e.target.value })} />
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                                <button type="submit" className="flex-[2] py-4 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                                    নিশ্চিত করুন (Confirm)
                                </button>
                                <button name="print" type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                    <Printer size={16} /> প্রিন্ট (Slip)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Final Return Controller */}
            <div className="pt-24 pb-12 flex justify-center">
                <button
                    onClick={() => setActivePanel("Overview")}
                    className="group relative flex items-center gap-6 bg-white dark:bg-slate-900 px-12 md:px-16 py-7 md:py-8 rounded-[var(--radius-saas)] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:border-slate-950 transition-all duration-500"
                >
                    <div className="p-3 bg-slate-950 text-white rounded-xl transition-transform shadow-lg group-hover:scale-110">
                        <ArrowLeft size={20} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none">
                        ড্যাশবোর্ডে ফিরে যান
                    </span>
                </button>
            </div>

        </div>
    );
};

export default OutsideWorkPanel;
