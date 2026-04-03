import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Typography, Divider, QRCode, Tag, ConfigProvider, Modal, Input, Button, Select, DatePicker } from 'antd';
import QRScanner from '../QRScanner';
import UniversalSlip from '../UniversalSlip';
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
  Clock,
  Archive,
  Database,
  Layers,
  Box,
  History,
  TrendingDown,
  MessageCircle,
  MessageSquare,
  DollarSign,
} from "lucide-react";
const { Title, Text } = Typography;

const QR_Slip_Theme = {
  token: { fontFamily: 'Inter, sans-serif', borderRadius: 8, fontSize: 12, colorTextBase: '#000000' },
  components: { Card: { paddingLG: 16 }, Typography: { fontSizeHeading4: 18, fontSizeHeading5: 14 } }
};

import { syncToSheet } from '../../utils/syncUtils';
import NRZLogo from '../NRZLogo';

const PataFactoryPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, t, logAction }) => {
    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';

    const [showModal, setShowModal] = useState(false);
    const [lotSearch, setLotSearch] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [printSlip, setPrintSlip] = useState(null);
    const [receiveModal, setReceiveModal] = useState(null);
    const [editPataModal, setEditPataModal] = useState(null);
    const [payModal, setPayModal] = useState(null);
    const [ledgerModal, setLedgerModal] = useState(null);
    const [view, setView] = useState('active');
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({
        design: '',
        color: '',
        pataType: 'Single',
        qty: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [entryData, setEntryData] = useState({
        worker: '',
        design: '',
        color: '',
        lotNo: '',
        pataType: 'Single',
        pataQty: '',
        stonePackets: '',
        paperRolls: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const workers = masterData.workerCategories?.pata || [];

    const getWorkerDue = (name) => {
        let earnings = 0;
        const prods = (masterData.pataEntries || []).filter(p => p.worker === name && p.status === 'Received');
        prods.forEach(p => {
            earnings += Number(p.amount || 0);
        });
        const paid = (masterData.workerPayments || []).filter(p => p.worker === name && p.dept === 'pata').reduce((s, p) => s + Number(p.amount), 0);
        return earnings - paid;
    };

    const handleConfirmPayment = (e) => {
        e.preventDefault();
        const amount = Number(e.target.amount.value);
        const date = e.target.date.value ? new Date(e.target.date.value).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        if (amount <= 0) return;

        const newPayment = {
            id: Date.now(),
            date,
            worker: payModal,
            dept: 'pata',
            amount,
            note: e.target.note.value
        };

        setMasterData(prev => ({
            ...prev,
            workerPayments: [newPayment, ...(prev.workerPayments || [])],
            expenses: [{
                id: Date.now() + 1,
                date: new Date().toISOString().split('T')[0],
                category: 'ভাতা',
                description: `${payModal} (pata)`,
                amount
            }, ...(prev.expenses || [])]
        }));

        syncToSheet({
            type: "WORKER_PAYMENT",
            worker: payModal,
            amount,
            detail: `Pata payment`
        });

        setPayModal(null);
        showNotify('পেমেন্ট সফল ভাবে রেকর্ড করা হয়েছে!');
    };

    const rawStock = React.useMemo(() => {
        const stock = { stone: 0, roll: 0 };
        (masterData.rawInventory || []).forEach(log => {
            if (log.item.toLowerCase().includes('stone')) {
                if (log.type === 'in') stock.stone += Number(log.qty);
                else stock.stone -= Number(log.qty);
            }
            if (log.item.toLowerCase().includes('roll')) {
                if (log.type === 'in') stock.roll += Number(log.qty);
                else stock.roll -= Number(log.qty);
            }
        });
        return stock;
    }, [masterData.rawInventory]);

    const uniqueLots = React.useMemo(() => {
        const lots = [];
        (masterData.cuttingStock || []).forEach(c => {
            const existing = lots.find(l => l.lotNo === c.lotNo);
            if (!existing) {
                lots.push({ lotNo: c.lotNo, design: c.design, color: c.color });
            }
        });
        return lots;
    }, [masterData.cuttingStock]);

    const handleSaveIssue = (shouldPrint) => {
        if (!entryData.worker || !entryData.design || !entryData.lotNo || !entryData.pataQty) {
            return showNotify('কারিগর, ডিজাইন, লট নম্বর এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now(),
            date: entryData.date ? new Date(entryData.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            worker: entryData.worker,
            design: entryData.design,
            color: entryData.color || 'N/A',
            lotNo: entryData.lotNo,
            pataType: entryData.pataType,
            pataQty: Number(entryData.pataQty),
            stonePackets: Number(entryData.stonePackets || 0),
            paperRolls: Number(entryData.paperRolls || 0),
            status: 'Pending',
            note: entryData.note
        };

        setMasterData(prev => {
            const newInventory = [...(prev.rawInventory || [])];

            if (newEntry.stonePackets > 0) {
                newInventory.unshift({
                    id: Date.now() + 1,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "Stone Packet",
                    qty: newEntry.stonePackets,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Lot: ${newEntry.lotNo})`
                });
            }
            if (newEntry.paperRolls > 0) {
                newInventory.unshift({
                    id: Date.now() + 2,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "Paper Roll",
                    qty: newEntry.paperRolls,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Lot: ${newEntry.lotNo})`
                });
            }

            const workerTaskNotification = {
                id: Date.now().toString(),
                type: 'task',
                title: 'নতুন পাতা কাজ',
                message: `${newEntry.worker}-কে ${newEntry.pataQty} পিস ${newEntry.design} (${newEntry.color}) কাজ দেওয়া হয়েছে।`,
                timestamp: new Date().toISOString(),
                read: false,
                target: 'worker'
            };

            return {
                ...prev,
                pataEntries: [newEntry, ...(prev.pataEntries || [])],
                rawInventory: newInventory,
                notifications: [workerTaskNotification, ...(prev.notifications || [])]
            };
        });

        syncToSheet({
            type: "PATA_ISSUE",
            worker: newEntry.worker,
            detail: `${newEntry.design}(${newEntry.color}) - ${newEntry.pataType}: ${newEntry.pataQty} Pcs (Stone: ${newEntry.stonePackets}, Paper: ${newEntry.paperRolls})`,
            amount: 0
        });

        setShowModal(false);
        logAction(user, 'PATA_ISSUE', `${newEntry.worker} - ${newEntry.design}(${newEntry.pataType}): ${newEntry.pataQty} Pcs. Lot #${newEntry.lotNo}`);
        if (shouldPrint) {
            setPrintSlip(newEntry);
        }
        setEntryData({ worker: '', design: '', color: '', lotNo: '', pataType: 'Single', pataQty: '', stonePackets: '', paperRolls: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('পাতা কাজ সফলভাবে ইস্যু হয়েছে এবং স্টক সমন্বয় করা হয়েছে!');
    };

    const handleReceive = (e) => {
        e.preventDefault();
        const item = receiveModal;
        const receivedQty = Number(e.target.rQty.value || item.pataQty);

        if (receivedQty > item.pataQty) {
            return showNotify(`ভুল! জমার পরিমাণ (${receivedQty}) ইস্যু পরিমাণের (${item.pataQty}) চেয়ে বেশি হতে পারে না!`, 'error');
        }

        if (receivedQty < item.pataQty) {
            if (!window.confirm(`⚠️ সতর্কতা: ইস্যু করা হয়েছিল ${item.pataQty} পিস, কিন্তু জমা হচ্ছে ${receivedQty} পিস। বাকি ${item.pataQty - receivedQty} পিস কি ওয়েস্টেজ হিসেবে গণ্য করবেন?`)) {
                return;
            }
        }

        const rate = masterData.pataRates?.[item.pataType] || 0;
        const amount = receivedQty * rate;
        const receiveDate = receiveModal.receiveDate
            ? new Date(receiveModal.receiveDate).toLocaleDateString('en-GB')
            : new Date().toLocaleDateString('en-GB');

        setMasterData(prev => ({
            ...prev,
            pataEntries: prev.pataEntries.map(e => e.id === item.id ? {
                ...e,
                status: 'Received',
                receivedQty: receivedQty,
                amount: amount,
                receiveDate: receiveDate
            } : e)
        }));

        const updatedItem = { ...item, status: 'Received', receivedQty, amount, receiveDate };

        syncToSheet({
            type: "PATA_RECEIVE",
            worker: item.worker,
            detail: `${item.design}(${item.pataType}) - ${receivedQty} Pcs`,
            amount: amount
        });

        setReceiveModal(null);
        logAction(user, 'PATA_RECEIVE', `Received from ${item.worker}: ${receivedQty} of ${item.pataQty} Pcs. (Waste: ${item.pataQty - receivedQty})`);
        showNotify('পাতা কাজ সফলভাবে জমা নেওয়া হয়েছে!');

        if (e.nativeEvent.submitter?.name === 'print') {
            setPrintSlip(updatedItem);
        }
    };

    const handleEditPataSave = (e) => {
        e.preventDefault();
        const f = e.target;
        const updated = {
            ...editPataModal,
            worker: f.worker.value,
            design: f.design.value,
            color: f.color.value,
            lotNo: f.lotNo.value,
            pataType: f.pataType.value,
            pataQty: Number(f.qty.value),
            stonePackets: Number(f.stone.value),
            paperRolls: Number(f.roll.value),
            status: f.status.value,
            date: f.date.value ? new Date(f.date.value).toLocaleDateString('en-GB') : editPataModal.date,
            note: f.note.value
        };

        setMasterData(prev => ({
            ...prev,
            pataEntries: prev.pataEntries.map(ent => ent.id === updated.id ? updated : ent)
        }));

        setEditPataModal(null);
        logAction(user, 'PATA_OVERRIDE', `Admin override on Pata record ID: ${updated.id} for ${updated.worker}`);
        showNotify(`${t('availableBalance')} ${t('received')} (Admin Mode)!`);
    };

    const handleManualStockIn = (e) => {
        e.preventDefault();
        if (!manualForm.design || !manualForm.qty) {
            return showNotify('ডিজাইন এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now(),
            date: manualForm.date ? new Date(manualForm.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            worker: 'Manual/Owner',
            design: manualForm.design,
            color: manualForm.color || 'N/A',
            lotNo: 'MANUAL',
            pataType: manualForm.pataType,
            pataQty: Number(manualForm.qty),
            status: 'Received',
            receiveDate: new Date().toLocaleDateString('en-GB'),
            note: manualForm.note || 'Manual Stock Entry'
        };

        setMasterData(prev => ({
            ...prev,
            pataEntries: [newEntry, ...(prev.pataEntries || [])]
        }));

        syncToSheet({
            type: "PATA_MANUAL_STOCK",
            worker: "Manual",
            detail: `${manualForm.design}(${manualForm.pataType}) - ${manualForm.qty} Pcs`,
            amount: 0
        });

        setShowManualModal(false);
        setManualForm({ design: '', color: '', pataType: 'Single', qty: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('সরাসরি স্টক যোগ করা হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            pataEntries: (prev.pataEntries || []).filter(item => item.id !== id)
        }));
        showNotify('এন্ট্রি মুছে ফেলা হয়েছে!');
    };

    const isWorker = user?.role !== 'admin' && user?.role !== 'manager';

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
                <div className="no-print flex justify-between items-center mb-6 w-[210mm] mx-auto bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-black font-black">
                    <button onClick={() => setPrintSlip(null)} className="bg-slate-50 text-slate-600 px-10 py-5 uppercase text-xs rounded-full hover:bg-black hover:text-white transition-all">Cancel</button>
                    <button onClick={() => window.print()} className="bg-black text-white px-10 py-5 rounded-full uppercase text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
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

    const filteredEntries = (masterData.pataEntries || []).filter(e => {
        if (isWorker && e.worker?.toLowerCase() !== user?.name?.toLowerCase()) return false;
        return e.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.design.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.lotNo.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const activeEntries = filteredEntries.filter(e => e.status === 'Pending');
    const historyEntries = filteredEntries.filter(e => e.status === 'Received');

    return (
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 italic text-black font-outfit uppercase">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActivePanel("Overview")}
            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="section-header">
                {t('pataHub')} <span className="text-slate-500">{t('productionUnit') || "Division"}</span>
            </h1>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
            </p>
        </div>
      </div>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all italic border-b-[6px] border-zinc-900 mb-6"
          >
            <Plus size={20} strokeWidth={3} />
            নতুন পাতা এন্ট্রি
          </button>
        )}
    </div>
      
      {/* Unified Floating Filter Bar */}
      <div className="floating-header-group mb-12 p-3 dark:bg-zinc-900 border-none shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-6 w-full">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/50 p-2 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                  {["active", "history", (isAdmin || isManager) && "payments", (isAdmin || isManager) && "ledger"].filter(Boolean).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === v ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg italic' : 'text-slate-500 hover:text-black dark:hover:text-white'}`}
                    >
                      {t(v)}
                    </button>
                  ))}
              </div>
              
              <div className="flex-1 relative w-full group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                      <Search size={16} />
                  </div>
                  <input
                    placeholder={t('searchPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-black/20 h-16 rounded-2xl pl-16 pr-8 text-xs font-black uppercase tracking-widest italic outline-none border border-transparent focus:border-black/10 dark:focus:border-white/10 transition-all text-black dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button 
                        onClick={() => setShowQR(true)}
                        className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                      >
                         <Camera size={16} />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-4">
        {view === 'payments' ? (
             <div className="p-4 md:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {workers.map((w, idx) => {
                    const due = getWorkerDue(w);
                    return (
                        <div key={idx} className="bg-white p-10 rounded-[4rem] border border-slate-100 flex flex-col justify-between h-72 group hover:border-black transition-all relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                <DollarSign size={140} className="text-black" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black italic uppercase leading-none mb-3 text-black group-hover:translate-x-1 transition-transform">{w}</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Due (পাওনা)</p>
                            </div>
                            <div className="flex justify-between items-end relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-5xl font-black italic tracking-tighter leading-none ${due > 0 ? 'text-amber-600' : 'text-slate-500'}`}>৳{due.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setLedgerModal(w)}
                                        className="w-14 h-14 bg-white text-black rounded-2xl border border-slate-100 hover:border-black transition-all shadow-sm flex items-center justify-center"
                                        title="View Ledger"
                                    >
                                        <History size={20} />
                                    </button>
                                    <button
                                        onClick={() => setPayModal(w)}
                                        className="w-14 h-14 bg-black text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                                        title="Make Payment"
                                    >
                                        <DollarSign size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="space-y-4">
                {(view === 'active' ? activeEntries : historyEntries).length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
                        <Box size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Production Nodes</p>
                    </div>
                ) : (
                    (view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                        <div key={item.id || idx} className="item-card flex flex-col md:flex-row justify-between items-center gap-8 group">
                            <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                                <div className={`w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6 ${item.status === 'Pending' ? 'border-amber-200' : 'border-emerald-200'}`}>
                                    {item.status === 'Pending' ? <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" /> : <div className="w-4 h-4 rounded-full bg-emerald-500" />}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-4">
                                        <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                                            • পাতা কাজ # {item.worker}
                                        </h4>
                                        <span className="badge-standard">#{item.lotNo}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500 text-[11px] font-black uppercase italic tracking-widest">
                                        <span>• {item.design}</span>
                                        <span>• {item.color}</span>
                                        <span>• {item.date}</span>
                                        {item.status === 'Received' && <span className="text-emerald-500 font-black tracking-widest pl-4 ml-2 border-l border-slate-100">• DONE {item.receiveDate}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-500">{item.pataType}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-500">{item.pataType}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">S:{item.stonePackets || 0} Pkt • P:{item.paperRolls || 0} Roll</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12 w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Total Pcs</p>
                                    <p className="text-4xl font-black italic tracking-tighter leading-none">{item.receivedQty || item.pataQty}</p>
                                </div>
                                <div className="flex gap-3">
                                    {item.status === 'Pending' ? (
                                        <>
                                            <button onClick={() => setPrintSlip(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm">
                                                <Printer size={18} />
                                            </button>
                                            {(isAdmin || isManager) && <button onClick={() => setReceiveModal(item)} className="black-button">জমা নিন (REC)</button>}
                                        </>
                                    ) : (
                                        <button onClick={() => setPrintSlip(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm">
                                            <Printer size={18} />
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditPataModal(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                                <Settings size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditPataModal(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                                <Settings size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

            {
                showModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-start md:items-center justify-center p-2 md:p-4 italic overflow-y-auto">
                        <div className="bg-white rounded-[3rem] w-full max-w-4xl border-2 border-black shadow-3xl animate-fade-up my-auto flex flex-col text-black h-auto">
                            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-gray-50 flex-shrink-0 gap-3">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-black text-white rounded-[1.5rem] shadow-xl rotate-2">
                                        <Plus size={28} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase text-3xl tracking-tighter leading-none">{t('newTask')}</h3>
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] mt-2 italic">Worker Assignment Hub</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-4 bg-white border border-slate-100 rounded-full hover:bg-black hover:text-white transition-all text-black shadow-sm"><X size={24} /></button>
                            </div>

                            <div className="px-8 pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
                                <div className={`p-6 rounded-3xl border-2 flex flex-col justify-center transition-all ${rawStock.stone < 5 ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest italic ${rawStock.stone < 5 ? 'text-rose-500' : 'text-amber-600'}`}>Stone Packets</p>
                                        {rawStock.stone < 5 && <span className="text-[7px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Low</span>}
                                    </div>
                                    <p className={`text-4xl font-black italic tracking-tighter ${rawStock.stone < 5 ? 'text-rose-600' : 'text-amber-600'}`}>{rawStock.stone}</p>
                                </div>
                                <div className={`p-6 rounded-3xl border-2 flex flex-col justify-center transition-all ${rawStock.roll < 3 ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-blue-50 border-blue-100'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest italic ${rawStock.roll < 3 ? 'text-rose-500' : 'text-blue-600'}`}>Paper Rolls</p>
                                        {rawStock.roll < 3 && <span className="text-[7px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Low</span>}
                                    </div>
                                    <p className={`text-4xl font-black italic tracking-tighter ${rawStock.roll < 3 ? 'text-rose-600' : 'text-blue-600'}`}>{rawStock.roll}</p>
                                </div>
                                <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Est. Wage Load</p>
                                    <p className="text-4xl font-black italic text-black tracking-tighter leading-none">
                                        ৳{(Number(entryData.pataQty || 0) * (masterData.pataRates?.[entryData.pataType] || 0)).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 overflow-y-auto flex-1 italic">
                                <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-50 space-y-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-1.5 h-6 bg-black rounded-full"></div>
                                        <h4 className="text-base font-black uppercase tracking-widest">১. কারিগর ও ডিজাইন (Identity)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Worker (কারিগর)</label>
                                            <select className="w-full h-16 bg-slate-50 rounded-[2rem] px-6 border border-slate-100 italic focus:border-black outline-none text-sm" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                                                <option value="">Select Worker</option>
                                                {(masterData.workerCategories?.pata || []).map(w => <option key={w} value={w}>{w}</option>)}
                                                <option value="Manual/Owner">Manual/Owner</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Design (ডিজাইন)</label>
                                            <select className="w-full h-16 bg-slate-50 rounded-[2rem] px-6 border border-slate-100 italic focus:border-black outline-none text-sm" value={entryData.design} onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}>
                                                <option value="">Select Design</option>
                                                {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Pata Type</label>
                                            <select className="w-full h-16 bg-slate-50 rounded-[2rem] px-6 border border-slate-100 italic focus:border-black outline-none text-sm" value={entryData.pataType} onChange={(e) => setEntryData(p => ({ ...p, pataType: e.target.value }))}>
                                                {(masterData.pataTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Date (তারিখ)</label>
                                            <input type="date" className="w-full h-16 bg-black text-white rounded-[2rem] px-6 border-none italic outline-none text-sm" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Color & Lot</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <select className="h-16 bg-slate-50 rounded-[2rem] px-4 border border-slate-100 italic focus:border-black outline-none text-sm" value={entryData.color} onChange={(e) => setEntryData(p => ({ ...p, color: e.target.value }))}>
                                                    <option value="">Select Color</option>
                                                    {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input list="pata-lots" className="h-16 bg-slate-50 rounded-[2rem] px-4 border border-slate-100 italic focus:border-black outline-none text-sm" placeholder="Lot No..." value={entryData.lotNo} onChange={(e) => setEntryData(p => ({ ...p, lotNo: e.target.value }))} />
                                                <datalist id="pata-lots">
                                                    {(masterData.cuttingStock || []).map(c => <option key={c.id} value={c.lotNo}>{c.design} - {c.color}</option>)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-around shadow-inner">
                                            <div className="text-center">
                                                <label className="text-[10px] text-black block mb-2 font-black">{t('qty')}</label>
                                                <input type="number" className="w-full text-center text-4xl bg-transparent outline-none font-black italic text-black" placeholder="0" value={entryData.pataQty} onChange={(e) => setEntryData(p => ({ ...p, pataQty: e.target.value }))} />
                                            </div>
                                            <div className="text-center">
                                                <label className="text-[10px] text-amber-600 block mb-2 font-black">STONE PKT</label>
                                                <input type="number" className="w-full text-center text-4xl bg-transparent outline-none font-black italic text-amber-600" placeholder="0" value={entryData.stonePackets} onChange={(e) => setEntryData(p => ({ ...p, stonePackets: e.target.value }))} />
                                            </div>
                                            <div className="text-center">
                                                <label className="text-[10px] text-indigo-600 block mb-2 font-black">PAPER ROLL</label>
                                                <input type="number" className="w-full text-center text-4xl bg-transparent outline-none font-black italic text-indigo-600" placeholder="0" value={entryData.paperRolls} onChange={(e) => setEntryData(p => ({ ...p, paperRolls: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50/30 p-6 rounded-[2rem] border-2 border-amber-50 space-y-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                        <h4 className="text-base font-black uppercase tracking-widest text-amber-600">২. কাঁচামাল প্রদান (Materials Issue)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-[1.5rem] border-2 border-slate-50 relative group overflow-hidden shadow-sm">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-3 block">পাথর প্যাকেট (Stone Packet)</label>
                                            <div className="flex items-end gap-2">
                                                <input type="number" className="bg-transparent text-5xl font-black text-black w-full outline-none italic placeholder:text-slate-100" placeholder="0" value={entryData.stonePackets} onChange={(e) => setEntryData(p => ({ ...p, stonePackets: e.target.value }))} />
                                                <span className="text-lg font-black text-slate-500 mb-2 italic uppercase">Pkt</span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-[1.5rem] border-2 border-slate-50 relative group overflow-hidden shadow-sm">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-3 block">পেপার রোল (Paper Roll)</label>
                                            <div className="flex items-end gap-2">
                                                <input type="number" className="bg-transparent text-5xl font-black text-black w-full outline-none italic placeholder:text-slate-100" placeholder="0" value={entryData.paperRolls} onChange={(e) => setEntryData(p => ({ ...p, paperRolls: e.target.value }))} />
                                                <span className="text-lg font-black text-slate-500 mb-2 italic uppercase">Roll</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black p-8 rounded-[2rem] shadow-xl text-center space-y-6 relative overflow-hidden">
                                    <label className="text-sm font-black text-amber-500 uppercase tracking-[0.5em] italic">৩. মোট পরিমাণ দিন (Total Quantity)</label>
                                    <div className="relative">
                                        <input type="number" className="w-full text-center text-7xl font-black bg-transparent border-none outline-none leading-none h-[12vh] text-white placeholder:text-zinc-800" placeholder="0" value={entryData.pataQty} onChange={(e) => setEntryData(p => ({ ...p, pataQty: e.target.value }))} />
                                        <div className="text-zinc-700 text-sm font-black uppercase tracking-widest mt-2">Total Pieces (পিস)</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-gray-50 flex gap-4 flex-shrink-0">
                                <button onClick={() => setShowModal(false)} className="py-4 bg-white border border-slate-200 rounded-full font-black text-xs uppercase text-slate-600 hover:text-black transition-all flex-1 shadow-sm">{t('cancel')}</button>
                                <button onClick={() => handleSaveIssue(false)} className="py-4 bg-amber-500 text-white rounded-full font-black text-lg uppercase tracking-[0.1em] shadow-lg hover:scale-[1.01] transition-all flex-[2]">{t('confirmOnly')}</button>
                                <button onClick={() => handleSaveIssue(true)} className="py-4 bg-indigo-600 text-white rounded-full font-black text-lg uppercase tracking-[0.1em] shadow-lg hover:bg-black transition-all flex-1 flex items-center justify-center gap-2"><Printer size={16} /> & {t('printNote')}</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                receiveModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 italic">
                        <div className="bg-white rounded-[2rem] w-full max-w-sm border-2 border-slate-50 shadow-3xl animate-fade-up p-5 space-y-6 text-black">
                            <div className="text-center">
                                <h3 className="text-2xl font-black uppercase italic mb-1">পাতা কাজ জমা</h3>
                                <p className="text-sm font-black text-slate-600 uppercase italic">কারিগর: {receiveModal.worker}</p>
                            </div>
                            <form onSubmit={handleReceive} className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-[2rem] text-center shadow-inner border border-slate-100">
                                    <label className="text-[8px] text-slate-600 font-black uppercase mb-2 block tracking-widest">Received Quantity (PCS)</label>
                                    <input name="rQty" type="number" defaultValue={receiveModal.pataQty} className="w-full text-center text-4xl font-black bg-transparent border-none text-black outline-none leading-none h-20" autoFocus />
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center block">Date (তারিখ)</label>
                                    <input name="receiveDate" type="date" className="w-full py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-black italic px-4 text-center" value={receiveModal.receiveDate || new Date().toISOString().split('T')[0]} onChange={(e) => setReceiveModal({ ...receiveModal, receiveDate: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button type="button" onClick={() => setReceiveModal(null)} className="flex-1 py-4 bg-slate-50 text-slate-600 font-black text-xs uppercase rounded-full hover:text-black transition-all">{t('cancel')}</button>
                                    <button type="submit" className="flex-1 py-4 bg-black text-white font-black text-xs uppercase rounded-full shadow-xl border-b-[4px] border-zinc-900 transition-all">{t('confirmOnly')}</button>
                                    <button name="print" type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase rounded-full shadow-xl border-b-[4px] border-indigo-900 transition-all flex items-center justify-center gap-2">
                                        <Printer size={16} /> {t('printNote')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                showManualModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 text-black italic">
                        <div className="bg-white rounded-[3rem] w-full max-w-lg border-2 border-amber-500 shadow-3xl p-8 space-y-6 animate-fade-up overflow-y-auto max-h-[96vh]">
                            <div className="text-center space-y-1">
                                <div className="mx-auto w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3 mb-2">
                                    <Box size={20} />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic">{t('directStockIn')}</h3>
                                <p className="text-[8px] font-black text-slate-600 tracking-[0.2em] uppercase italic">সরাসরি পাতা স্টক যোগ করুন</p>
                            </div>

                            <form onSubmit={handleManualStockIn} className="space-y-6 italic">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 ml-2">DESIGN (ডিজাইন)</label>
                                        <select className="w-full h-12 bg-slate-50 border border-slate-100 rounded-[1rem] px-4 font-black text-xs uppercase" value={manualForm.design} onChange={e => setManualForm(p => ({ ...p, design: e.target.value }))}>
                                            <option value="">SELECT DESIGN</option>
                                            {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 ml-2">COLOR (কালার)</label>
                                        <select className="w-full h-12 bg-slate-50 border border-slate-100 rounded-[1rem] px-4 font-black text-xs uppercase" value={manualForm.color} onChange={e => setManualForm(p => ({ ...p, color: e.target.value }))}>
                                            <option value="">SELECT COLOR</option>
                                            {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 ml-2">DATE (তারিখ)</label>
                                        <input type="date" className="w-full h-12 bg-black text-white rounded-[1rem] px-4 font-black text-xs border-none outline-none" value={manualForm.date} onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Quantity (পাক্কা পাতা পিস)</label>
                                    <input type="number" className="w-full text-center text-4xl font-black bg-transparent border-none outline-none leading-none h-20" placeholder="0" value={manualForm.qty} onChange={e => setManualForm(p => ({ ...p, qty: e.target.value }))} autoFocus />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowManualModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-full font-black text-xs uppercase">{t('cancel')}</button>
                                    <button type="submit" className="flex-[2] py-4 bg-amber-500 text-white rounded-full font-black uppercase text-sm shadow-lg border-b-[6px] border-amber-900 active:scale-95 transition-all">{t('confirmOnly')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                editPataModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 text-black italic">
                        <div className="bg-white rounded-[2rem] w-full max-w-2xl border-2 border-amber-500 shadow-3xl p-8 space-y-6 animate-fade-up max-h-[96vh] overflow-y-auto italic font-outfit my-auto">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-500 text-white rounded-[1rem] shadow-lg rotate-2">
                                        <Settings size={20} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">{t('designOverride')}</h3>
                                </div>
                                <button onClick={() => setEditPataModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={18} /></button>
                            </div>

                            <form onSubmit={handleEditPataSave} className="grid grid-cols-2 gap-6 font-black uppercase italic">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 ml-2">Worker (কারিগর)</label>
                                    <select name="worker" defaultValue={editPataModal.worker} className="w-full h-12 bg-slate-50 rounded-[1rem] px-4 border border-slate-100 italic focus:border-amber-500 outline-none text-sm">
                                        {(masterData.workerCategories?.pata || []).map(w => <option key={w} value={w}>{w}</option>)}
                                        <option value="Manual/Owner">Manual/Owner</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 ml-2">Design (ডিজাইন)</label>
                                    <select name="design" defaultValue={editPataModal.design} className="w-full h-12 bg-slate-50 rounded-[1rem] px-4 border border-slate-100 italic focus:border-amber-500 outline-none text-sm">
                                        {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 ml-2">Color & Lot</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select name="color" defaultValue={editPataModal.color} className="h-12 bg-slate-50 rounded-[1rem] px-3 border border-slate-100 italic focus:border-amber-500 outline-none text-xs">
                                            {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <input name="lotNo" defaultValue={editPataModal.lotNo} list="pata-lots" className="h-12 bg-slate-50 rounded-[1rem] px-3 border border-slate-100 italic focus:border-amber-500 outline-none text-xs" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 ml-2">Status & Date</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select name="status" defaultValue={editPataModal.status} className="h-12 bg-black text-white rounded-[1rem] px-3 italic focus:ring-2 ring-amber-500/20 outline-none text-xs">
                                            <option value="Pending">PENDING</option>
                                            <option value="Received">RECEIVED</option>
                                        </select>
                                        <input name="date" type="date" defaultValue={editPataModal.date ? new Date(editPataModal.date.split('/').reverse().join('-')).toISOString().split('T')[0] : ''} className="h-12 bg-slate-50 rounded-[1rem] px-3 border border-slate-100 italic focus:border-amber-500 outline-none text-xs" />
                                    </div>
                                </div>

                                <div className="col-span-2 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <label className="text-[10px] text-amber-600 block mb-1">PATA QTY</label>
                                        <input name="qty" type="number" defaultValue={editPataModal.pataQty} className="w-full text-center text-3xl bg-transparent outline-none font-black italic" />
                                    </div>
                                    <div className="text-center">
                                        <label className="text-[10px] text-amber-600 block mb-1">STONE PKT</label>
                                        <input name="stone" type="number" defaultValue={editPataModal.stonePackets} className="w-full text-center text-3xl bg-transparent outline-none font-black italic" />
                                    </div>
                                    <div className="text-center">
                                        <label className="text-[10px] text-amber-600 block mb-1">PAPER ROLL</label>
                                        <input name="roll" type="number" defaultValue={editPataModal.paperRolls} className="w-full text-center text-3xl bg-transparent outline-none font-black italic" />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="text-[10px] text-slate-600 ml-2">Special Note</label>
                                    <textarea name="note" defaultValue={editPataModal.note} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[1rem] p-4 italic outline-none mt-1 focus:border-amber-500 text-xs" />
                                </div>

                                <button type="submit" className="col-span-2 py-5 bg-amber-500 text-white rounded-full font-black text-lg uppercase tracking-[0.1em] shadow-lg border-b-[8px] border-amber-900 active:scale-95 transition-all">{t('saveOverride')}</button>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                payModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 italic">
                        <div className="bg-white rounded-[2rem] w-full max-w-sm border-2 border-slate-50 shadow-3xl overflow-hidden p-8 space-y-6 animate-fade-up text-black">
                            <div className="text-center">
                                <h3 className="text-3xl font-black uppercase italic text-black leading-none mb-2">বেতন প্রদান</h3>
                                <p className="text-sm font-black text-slate-600 italic uppercase tracking-widest">{payModal}</p>
                            </div>
                            <form onSubmit={handleConfirmPayment} className="space-y-6 italic">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center block">তারিখ</label>
                                            <input name="date" type="date" className="w-full py-3 bg-slate-50 border-none rounded-[1rem] text-[10px] font-black italic px-4" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center block">টাকার পরিমাণ</label>
                                            <input name="amount" type="number" className="w-full py-3 bg-black text-white border-none rounded-[1rem] text-lg font-black italic px-4 text-center shadow-lg" placeholder="৳" required autoFocus />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2 block italic">রিমার্কস (ঐচ্ছিক)</label>
                                        <input name="note" className="w-full py-3 text-[10px] font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-500 italic uppercase px-4 rounded-[1rem] border-none" placeholder="পেমেন্ট নোট লিখুন..." />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-4 rounded-full font-black text-[10px] uppercase bg-slate-50 text-slate-600 border border-slate-100 hover:text-black transition-all">{t('cancel')}</button>
                                    <button type="submit" className="flex-[2] py-4 rounded-full font-black text-[10px] uppercase bg-black text-white shadow-xl border-b-[4px] border-zinc-900 hover:scale-105 transition-all">{t('makePayment')}</button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const amount = document.querySelector('input[name="amount"]')?.value || 0;
                                        const msg = `*NRZO0NE PATA SETTLEMENT*\n--------------------------\nWorker: ${payModal}\nAmount: ৳${amount}\nDate: ${new Date().toLocaleDateString('en-GB')}\nSystem: Industrial Pata Node\n--------------------------\nStatus: DISBURSED`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                      }}
                                      className="p-5 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                                    >
                                      <MessageCircle size={20} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                ledgerModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 text-black font-outfit">
                        <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2rem] border-2 border-slate-50 shadow-3xl italic flex flex-col">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">কাজের বিবরণ ও <span className="text-slate-500">লেজার</span></h3>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">কারিগর: {ledgerModal}</p>
                                </div>
                                <button onClick={() => setLedgerModal(null)} className="p-3 bg-white border border-slate-100 hover:bg-black hover:text-white rounded-xl transition-all shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-black border-l-4 border-black pl-3">কাজের রিপোর্ট (Production)</h4>
                                        <div className="space-y-3">
                                            {(masterData.pataEntries || []).filter(p => p.worker === ledgerModal && p.status === 'Received').map((p, i) => (
                                                <div key={i} className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-lg transition-all group">
                                                    <div>
                                                        <p className="font-black text-sm uppercase leading-none mb-1">{p.design} <span className="text-[8px] text-slate-500 ml-1">#{p.lotNo}</span></p>
                                                        <p className="text-[8px] text-slate-600 uppercase font-black">{p.receiveDate || p.date}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black italic text-lg text-black">{p.receivedQty || p.pataQty} Pcs</p>
                                                        <p className="text-[8px] text-slate-600 uppercase font-black">Amount: ৳{p.amount || 0}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 border-l-4 border-amber-500 pl-3">পেমেন্ট ইতিহাস (Payments)</h4>
                                        <div className="space-y-3">
                                            {(masterData.workerPayments || []).filter(p => p.worker === ledgerModal && p.dept === 'pata').map((p, i) => (
                                                <div key={i} className="bg-amber-50/30 p-4 rounded-[1.5rem] border border-amber-50 flex justify-between items-center hover:bg-white hover:shadow-lg transition-all">
                                                    <div>
                                                        <p className="font-black text-sm uppercase leading-none mb-1 text-amber-700">Payment</p>
                                                        <p className="text-[8px] text-amber-400 uppercase font-black">{p.date}</p>
                                                        {p.note && <p className="text-[8px] text-amber-300 italic mt-1 leading-tight uppercase">{p.note}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black italic text-lg text-amber-600">৳{p.amount}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">{t('availableBalance')}</p>
                                    <p className="text-4xl font-black italic tracking-tighter text-black leading-none mt-1">৳{getWorkerDue(ledgerModal).toLocaleString()}</p>
                                </div>
                                <button onClick={() => { setLedgerModal(null); setPayModal(ledgerModal); }} className="px-8 py-4 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                                    {t('makePayment')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Back Button Bottom */}
            <div className="pt-20 pb-10 flex justify-center">
                <button
                    onClick={() => setActivePanel('Overview')}
                    className="group relative flex items-center gap-6 bg-white px-12 py-6 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
                >
                    <div className="p-3 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
                        <ArrowLeft size={20} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-widest text-black">ড্যাশবোর্ডে ফিরে যান</span>
                    <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );
};

export default PataFactoryPanel;
