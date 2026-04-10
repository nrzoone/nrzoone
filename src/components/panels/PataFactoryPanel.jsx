import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Activity,
  User,
  ChevronRight,
  ShieldCheck,
  Download
} from "lucide-react";

import { syncToSheet } from '../../utils/syncUtils';
import NRZLogo from '../NRZLogo';

const PataFactoryPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, t, logAction }) => {
    const role = user?.role?.toLowerCase();
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const isWorker = role !== 'admin' && role !== 'manager';

    const [showModal, setShowModal] = useState(false);
    const [lotSearch, setLotSearch] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [printSlip, setPrintSlip] = useState(null);
    const [receiveModal, setReceiveModal] = useState(null);
    const [payModal, setPayModal] = useState(null);
    const [ledgerModal, setLedgerModal] = useState(null);
    const [view, setView] = useState('active');
    const [showRestockModal, setShowRestockModal] = useState(false);

    const [entryData, setEntryData] = useState({
        worker: '',
        design: '',
        color: '',
        lotNo: '',
        pataType: 'Single',
        pataQty: '',
        stonePackets: '',
        paperRolls: '',
        client: 'FACTORY',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Auto-generate Lot ID for Pata Factory
    useEffect(() => {
        if (showModal && !entryData.lotNo) {
            const count = masterData.pataEntries?.length || 0;
            setEntryData(prev => ({ ...prev, lotNo: `PT-${1000 + count}` }));
        }
    }, [showModal, masterData.pataEntries]);

    const handleQRScan = (data) => {
        if (data) {
            setLotSearch(data);
            setEntryData(prev => ({ ...prev, lotNo: data }));
            setShowQR(false);
            showNotify('QR কোড সফলভাবে স্ক্যান হয়েছে!', 'success');
        }
    };

    const workers = masterData.workerCategories?.pata || [];

    const getWorkerDue = (name) => {
        let earnings = 0;
        const prods = (masterData?.pataEntries || []).filter(p => p.worker === name && p.status === 'Received');
        prods.forEach(p => {
            earnings += Number(p.amount || 0);
        });
        const paid = (masterData?.workerPayments || []).filter(p => p.worker === name && p.dept === 'pata').reduce((s, p) => s + Number(p.amount || 0), 0);
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

    const rawStockByClient = useMemo(() => {
        const stocks = {};
        (masterData.rawInventory || []).forEach(log => {
            const client = log.client || 'FACTORY';
            if (!stocks[client]) stocks[client] = { stone: 0, roll: 0 };
            
            const isStone = log.item.toLowerCase().includes('stone');
            const isRoll = log.item.toLowerCase().includes('roll');
            
            if (isStone) {
                if (log.type === 'in') stocks[client].stone += Number(log.qty);
                else stocks[client].stone -= Number(log.qty);
            }
            if (isRoll) {
                if (log.type === 'in') stocks[client].roll += Number(log.qty);
                else stocks[client].roll -= Number(log.qty);
            }
        });
        return stocks;
    }, [masterData.rawInventory]);

    const rawStock = entryData.client ? (rawStockByClient[entryData.client] || { stone: 0, roll: 0 }) : { stone: 0, roll: 0 };

    const handleSaveIssue = (shouldPrint) => {
        if (!entryData.worker || !entryData.design || !entryData.lotNo || !entryData.pataQty) {
            return showNotify('কারিগর, ডিজাইন, লট নম্বর এবং পরিমাণ আবশ্যক!', 'error');
        }

        if (!isAdmin && Number(entryData.stonePackets || 0) > rawStock.stone) {
            return showNotify(`পর্যাপ্ত পাথর নেই! স্টকে আছে: ${rawStock.stone} প্যাকেট (Only Admin can bypass)`, 'error');
        }
        if (!isAdmin && Number(entryData.paperRolls || 0) > rawStock.roll) {
            return showNotify(`পর্যাপ্ত পেপার রোল নেই! স্টকে আছে: ${rawStock.roll} রোল (Only Admin can bypass)`, 'error');
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
            client: entryData.client || 'FACTORY',
            status: 'Pending',
            note: entryData.note
        };

        setMasterData(prev => {
            const newInventory = [...(prev.rawInventory || [])];
            if (newEntry.stonePackets > 0) {
                newInventory.unshift({
                    id: Date.now() + 1,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "পাথর প্যাকেট (Stone)",
                    client: newEntry.client,
                    qty: newEntry.stonePackets,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Client: ${newEntry.client})`
                });
            }
            if (newEntry.paperRolls > 0) {
                newInventory.unshift({
                    id: Date.now() + 2,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "পেপার রোল (Paper)",
                    client: newEntry.client,
                    qty: newEntry.paperRolls,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Client: ${newEntry.client})`
                });
            }
            return {
                ...prev,
                pataEntries: [newEntry, ...(prev.pataEntries || [])],
                rawInventory: newInventory
            };
        });

        syncToSheet({
            type: "PATA_ISSUE",
            worker: newEntry.worker,
            detail: `${newEntry.design}(${newEntry.color}) - ${newEntry.pataType}: ${newEntry.pataQty} Pcs`,
            amount: 0
        });

        setShowModal(false);
        logAction(user, 'PATA_ISSUE', `${newEntry.worker} - ${newEntry.design}: ${newEntry.pataQty} Pcs. Lot #${newEntry.lotNo}`);
        if (shouldPrint) setPrintSlip(newEntry);
        setEntryData({ worker: '', design: '', color: '', lotNo: '', pataType: 'Single', pataQty: '', stonePackets: '', paperRolls: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('পাতা কাজ সফলভাবে ইস্যু হয়েছে!');
    };

    const handleReceive = (e) => {
        e.preventDefault();
        const item = receiveModal;
        const receivedQty = Number(e.target.rQty.value || item.pataQty);
        const rate = masterData.pataRates?.[item.pataType] || 0;
        const amount = receivedQty * rate;
        const receiveDate = new Date().toLocaleDateString('en-GB');

        setMasterData(prev => ({
            ...prev,
            pataEntries: (prev.pataEntries || []).map(e => e.id === item.id ? {
                ...e,
                status: 'Received',
                receivedQty: receivedQty,
                amount: amount,
                shortage: Math.max(0, item.pataQty - receivedQty),
                receiveDate: receiveDate,
                receivedBy: user?.name || 'Admin'
            } : e)
        }));

        syncToSheet({
            type: "PATA_RECEIVE",
            worker: item.worker,
            detail: `${item.design} - ${receivedQty} Pcs`,
            amount: amount
        });

        // B2B Conditional Billing Logic
        if (item.client && item.client !== "FACTORY") {
            const designObj = (masterData.designs || []).find(d => d.name === item.design);
            const pataRate = designObj?.clientRates?.[item.client]?.pata;

            if (pataRate && Number(pataRate) > 0) {
                const billAmount = receivedQty * Number(pataRate);
                if (billAmount > 0) {
                    const b2bBill = {
                        id: `b2b_pata_${Date.now()}`,
                        date: new Date().toLocaleDateString("en-GB"),
                        client: item.client,
                        type: 'BILL',
                        amount: billAmount,
                        note: `P-BILL: PATA of ${receivedQty} PCS (${item.design})`
                    };
                    setMasterData(prev => ({
                        ...prev,
                        clientTransactions: [b2bBill, ...(prev.clientTransactions || [])]
                    }));
                }
            }
        }

        setReceiveModal(null);
        logAction(user, 'PATA_RECEIVE', `Received from ${item.worker}: ${receivedQty} Pcs.`);
        showNotify('পাতা কাজ সফলভাবে জমা নেওয়া হয়েছে!');
    };

    const handleRestock = (e) => {
        e.preventDefault();
        const f = e.target;
        const qty = Number(f.qty.value);
        const item = f.item.value; // "পাথর প্যাকেট (Stone)" or "পেপার রোল (Paper)"
        const client = f.client.value;
        const date = new Date().toLocaleDateString('en-GB');

        if (qty <= 0) return;

        setMasterData(prev => ({
            ...prev,
            rawInventory: [{
                id: Date.now(),
                date,
                item,
                client,
                qty,
                type: 'in',
                note: `QUICK RESTOCK: ${f.note.value || 'MANUAL ADJ'}`
            }, ...(prev.rawInventory || [])]
        }));

        setShowRestockModal(false);
        logAction(user, 'INVENTORY_RESTOCK', `Added ${qty} ${item} for ${client}`);
        showNotify(`${item} স্টকে যোগ করা হয়েছে!`);
    };

    const handleDelete = (id) => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন রেকর্ড মুছতে পারবেন!', 'error');
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            pataEntries: (prev.pataEntries || []).filter(item => item.id !== id)
        }));
        logAction(user, 'PATA_DELETE', `Deleted record ID: ${id}`);
        showNotify('এন্ট্রি মুছে ফেলা হয়েছে!');
    };

    const deleteInventoryLog = (id) => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন ইনভেন্টরি মুছতে পারবেন!', 'error');
        if (!window.confirm('ইনভেন্টরি রেকর্ডটি মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            rawInventory: (prev.rawInventory || []).filter(item => item.id !== id)
        }));
        showNotify('ইনভেন্টরি রেকর্ড মুছে ফেলা হয়েছে!');
    };

    const clearNegativeStock = () => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন স্টক ক্লিন করতে পারবেন!', 'error');
        if (!window.confirm('আপনি কি নিশ্চিত যে সব মাইনাস এন্ট্রি মুছে ফেলে স্টক ক্লিন করতে চান?')) return;
        
        setMasterData(prev => ({
            ...prev,
            rawInventory: (prev.rawInventory || []).filter(log => {
                const isMaterial = log.item.toLowerCase().includes('stone') || log.item.toLowerCase().includes('roll');
                return !isMaterial; // This clears ALL Stone/Roll logs to start fresh.
            })
        }));
        
        logAction(user, 'INVENTORY_CLEAN', 'Admin cleared all raw material logs to fix negative stock.');
        showNotify('সব পাথর এবং রোল এন্ট্রি ক্লিন করা হয়েছে! স্টক এখন ০।');
    };

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

    const filteredEntries = (masterData.pataEntries || []).filter(e => {
        if (isWorker && e.worker?.toLowerCase() !== user?.name?.toLowerCase()) return false;
        return e.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.design.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.lotNo.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const activeEntries = filteredEntries.filter(e => e.status === 'Pending');
    const historyEntries = filteredEntries.filter(e => e.status === 'Received');

    return (
    <div className="space-y-8 pb-32 animate-fade-up px-1 md:px-4 text-black">
      {/* HUD Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-950 p-6 rounded-xl text-white shadow-xl group overflow-hidden relative">
            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Database size={20} />
                </div>
                <div className="flex items-center gap-4">
                    {isAdmin && <button onClick={() => setShowRestockModal('পাথর প্যাকেট (Stone)')} className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-blue-600 transition-all"><Plus size={16} /></button>}
                    <div className="text-right">
                        <p className="text-3xl font-bold tracking-tight leading-none">{rawStock.stone}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2 leading-none">পাথর প্যাকেট (Stone)</p>
                    </div>
                </div>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
                <div className={`h-full ${rawStock.stone < 5 ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'} transition-all`} style={{ width: `${Math.min(100, (rawStock.stone / 20) * 100)}%` }}></div>
            </div>
        </div>

        <div className="saas-card bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 !p-6 flex items-center justify-between group h-full">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Layers size={24} />
                </div>
                <div>
                    <p className="text-3xl font-bold tracking-tight text-black dark:text-white leading-none mb-1">{rawStock.roll}</p>
                    <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest leading-none">পেপ্যার রোল (Rolls)</p>
                </div>
            </div>
            {isAdmin && <button onClick={() => setShowRestockModal('পেপার রোল (Paper)')} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><Plus size={16} /></button>}
        </div>

        <div className="saas-card !p-6 flex items-center gap-6 group">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Box size={24} />
            </div>
            <div>
                <p className="text-3xl font-bold tracking-tight text-black dark:text-white leading-none mb-1">{activeEntries.length}</p>
                <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest leading-none">চলমান কাজ (Tasks)</p>
            </div>
        </div>

        <div className="saas-card !p-6 flex items-center gap-6 group font-outfit italic">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
            </div>
            <div>
                <p className="text-2xl font-bold tracking-tight text-black dark:text-white leading-none mb-1">৳{(workers.reduce((s, w) => s + getWorkerDue(w), 0)).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest leading-none">মোট বকেয়া (Total Due)</p>
            </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 !p-1.5 flex flex-col lg:flex-row items-center justify-between gap-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
        <div className="flex flex-wrap gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'active', label: 'চলমান লিস্ট (Active)' },
            { id: 'history', label: 'পুরাতন রেকর্ড (History)' },
            (isAdmin || isManager) && { id: 'payments', label: 'পেমেন্ট ও লেজার' },
            isAdmin && { id: 'inventory_history', label: 'ইনভেন্টরি লগ' }
          ].filter(Boolean).map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === v.id ? 'bg-slate-950 text-white shadow-lg' : 'text-black dark:text-white hover:text-black dark:text-white dark:hover:text-white'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto px-1.5">
          <div className="relative group flex-1 lg:flex-none">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white" />
            <input
              placeholder="কারিগর বা ডিজাইন দিয়ে খুঁজুন..."
              className="premium-input !pl-11 !h-11 !text-[10px] !bg-slate-50 dark:!bg-slate-800/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
              {view === 'inventory_history' && isAdmin && (
                <button 
                  onClick={clearNegativeStock}
                  className="px-6 h-11 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center gap-2"
                >
                   <Trash2 size={16} /> এক ক্লিকে স্টক ক্লিন করুন
                </button>
              )}
              <button 
                onClick={() => setShowQR(true)}
                className="w-11 h-11 bg-white dark:bg-slate-800 text-black dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm"
                title="কিউআর স্ক্যান"
              >
                 <Camera size={18} />
              </button>
              {(isAdmin || isManager) && (
                <button 
                    onClick={() => setShowModal(true)}
                    className="action-btn-primary !w-11 !h-11 !p-0 shadow-lg"
                    title="কাজ ইস্যু করুন"
                >
                    <Plus size={20} />
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <div className="animate-fade-up">
        {view === 'inventory_history' ? (
            <div className="saas-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left order-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">তারিখ</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">আইটেম</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ধরণ</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">পরিমাণ</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ক্লায়েন্ট</th>
                                <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {(masterData.rawInventory || [])
                                .filter(log => log.item.toLowerCase().includes('stone') || log.item.toLowerCase().includes('roll'))
                                .map((log, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="p-6 text-[11px] font-black italic">{log.date}</td>
                                    <td className="p-6">
                                        <p className="text-[11px] font-bold uppercase">{log.item}</p>
                                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase italic">{log.note}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {log.type === 'in' ? 'RESTOCK (IN)' : 'ISSUE (OUT)'}
                                        </span>
                                    </td>
                                    <td className="p-6 font-black text-lg italic">{log.qty}</td>
                                    <td className="p-6"><span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-widest">{log.client}</span></td>
                                    <td className="p-6 text-right">
                                        <button onClick={() => deleteInventoryLog(log.id)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-rose-100 shadow-sm ml-auto">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(masterData.rawInventory || []).filter(log => log.item.toLowerCase().includes('stone') || log.item.toLowerCase().includes('roll')).length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-slate-400 italic font-bold uppercase text-[10px] tracking-widest">বর্তমানে কোনো ইনভেন্টরি লগ পাওয়া যায়নি</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : view === 'payments' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workers.map((w, idx) => {
                    const due = getWorkerDue(w);
                    return (
                        <div key={idx} className="saas-card flex flex-col group border-transparent hover:border-slate-950 dark:hover:border-white animate-fade-up">
                             <div className="space-y-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest leading-none">Pata Specialist</p>
                                        <h4 className="text-2xl font-bold tracking-tight text-black dark:text-white uppercase leading-none">{w}</h4>
                                    </div>
                                    <div className={`w-12 h-12 ${due > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'} rounded-xl flex items-center justify-center transition-all group-hover:scale-110`}>
                                        <DollarSign size={20} />
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                                     <span className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest mb-1 block leading-none">বকেয়া মজুরি (Payable)</span>
                                     <span className={`text-4xl font-bold leading-none ${due > 0 ? 'text-black dark:text-white' : 'text-slate-200 dark:text-slate-700'}`}>৳{due.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button onClick={() => setLedgerModal(w)} className="action-btn-secondary !text-[10px] !uppercase !py-3">
                                    লেজার (Ledger)
                                </button>
                                <button onClick={() => setPayModal(w)} className="action-btn-primary !text-[10px] !uppercase !py-3">
                                    পেমেন্ট দিন
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(view === 'active' ? activeEntries : historyEntries).length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center saas-card border-dashed">
                        <Box size={48} strokeWidth={1} className="text-slate-200 mb-4" />
                        <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-[0.2em]">বর্তমানে কোনো রেকর্ড পাওয়া যায়নি</p>
                    </div>
                ) : (
                    (view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                        <div key={item.id || idx} className="saas-card flex flex-col group border-transparent hover:border-slate-950 dark:hover:border-white animate-fade-up">
                            <div className="space-y-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest leading-none">কারিগর (Operator)</p>
                                        <h4 className="text-2xl font-bold tracking-tight text-black dark:text-white uppercase leading-none truncate max-w-[180px]">{item.worker}</h4>
                                    </div>
                                    <div className={`w-12 h-12 ${item.status === 'Pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'} rounded-xl flex items-center justify-center font-bold text-xs shadow-sm`}>
                                        #{item.lotNo}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest mb-1 italic">ডিজাইন আইডি</p>
                                        <p className="text-sm font-bold text-black dark:text-white truncate uppercase">{item.design} ({item.color})</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest mb-1 italic">লট ক্যাটাগরি</p>
                                        <p className="text-sm font-bold text-black dark:text-white truncate uppercase">{item.pataType} PATA</p>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center py-5 border-y border-slate-100 dark:border-slate-800 border-dashed">
                                    <div className="flex flex-col">
                                         <span className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest mb-1 leading-none">পরিমাণ (Output)</span>
                                         <span className="text-3xl font-bold text-black dark:text-white leading-none">{item.receivedQty || item.pataQty} পিস</span>
                                    </div>
                                    <div className="text-right">
                                         <span className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest mb-1 leading-none italic">তারিখ</span>
                                         <p className="text-[11px] font-bold text-black dark:text-white italic mt-1">{item.date}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setPrintSlip(item)} className="w-11 h-11 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-black dark:text-white hover:bg-slate-950 hover:text-white transition-all border border-slate-100 dark:border-slate-800 shadow-sm" title="স্লিপ প্রিন্ট">
                                    <Printer size={16} />
                                </button>
                                {item.status === 'Pending' ? (
                                    <button onClick={() => setReceiveModal(item)} className="flex-1 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                                        বডি জমা নিন (Receive)
                                    </button>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center bg-emerald-500/5 text-emerald-600 rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] italic border border-emerald-500/20">
                                        Received on {item.receiveDate}
                                    </div>
                                )}
                                {isAdmin && (
                                    <button onClick={() => handleDelete(item.id)} className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm" title="মুছে ফেলুন">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      <div className="pt-24 pb-12 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group flex items-center gap-6 bg-white dark:bg-slate-900 px-12 py-7 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl hover:border-slate-950 transition-all duration-500"
        >
            <div className="p-3 bg-slate-950 text-white rounded-xl transition-transform shadow-lg group-hover:-translate-x-2">
                <ArrowLeft size={20} strokeWidth={3} />
            </div>
            <span className="text-lg font-bold tracking-tight text-black dark:text-white uppercase leading-none">
                ড্যাশবোর্ডে ফিরে যান
            </span>
        </button>
      </div>

      {/* QR MODAL (Self-Managed) */}
      <AnimatePresence>
        {showQR && (
          <QRScanner 
            onScanSuccess={handleQRScan} 
            onClose={() => setShowQR(false)} 
          />
        )}
      </AnimatePresence>

      {/* ISSUE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 md:p-12 relative overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-up">
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-6 right-6 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-950 hover:text-white transition-all text-black dark:text-white"
              >
                <X size={20} />
              </button>

              <div className="space-y-10">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-14 h-14 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-lg"><Database size={24} /></div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white uppercase leading-none">নতুন কাজ <span className="text-blue-600">ইস্যু করুন</span></h2>
                    <p className="text-[10px] font-bold text-black dark:text-white tracking-widest mt-2 uppercase italic leading-none">Distributing Pata Production Units</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-black dark:text-white tracking-widest ml-1">মালিকানা (Client Owner)</label>
                        <select 
                           className="premium-input !h-12 text-sm uppercase font-bold" 
                           value={entryData.client} 
                           onChange={(e) => setEntryData(p => ({ ...p, client: e.target.value }))}
                        >
                            <option value="FACTORY">FACTORY (নিজস্ব)</option>
                            {(masterData.clients || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-black dark:text-white tracking-widest ml-1">কারিগর (Worker)</label>
                        <select className="premium-input !h-12 text-sm uppercase font-bold" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                            <option value="">কারিগর নির্বাচন করুন...</option>
                            {workers.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-black dark:text-white tracking-widest ml-1">ডিজাইন (Design)</label>
                        <select className="premium-input !h-12 text-sm uppercase font-bold" value={entryData.design} onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}>
                            <option value="">ডিজাইন নির্বাচন করুন...</option>
                            {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-black dark:text-white tracking-widest ml-1">লট নম্বর (Lot ID - Auto)</label>
                        <input className="premium-input !h-12 text-sm uppercase text-center font-black !bg-slate-950 !text-white !border-none" placeholder="LOT NO..." value={entryData.lotNo} onChange={(e) => setEntryData(p => ({ ...p, lotNo: e.target.value }))} readOnly />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-black dark:text-white tracking-widest ml-1">তারিখ (Issue Date)</label>
                        <input type="date" className="premium-input !h-12 text-xs text-center !bg-slate-50 dark:!bg-slate-800/50 border-slate-200 dark:border-slate-700" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                     <div className="space-y-2 lg:border-r border-slate-200 dark:border-slate-700 lg:pr-8">
                        <div className="flex items-start justify-between">
                            <label className="text-[10px] font-bold uppercase text-black dark:text-white tracking-widest mb-2 block">পাতার পরিমাণ (Pata Qty)</label>
                            <span className="text-[9px] font-black bg-slate-950 text-white px-2 py-0.5 rounded uppercase">Required</span>
                        </div>
                        <input placeholder="0" type="number" className="w-full text-5xl font-bold bg-transparent outline-none text-black dark:text-white" value={entryData.pataQty} onChange={(e) => setEntryData(p => ({ ...p, pataQty: e.target.value }))} />
                        <div className="flex flex-wrap gap-2 mt-4">
                            {['Single', 'Double', 'Triple'].map(pt => (
                                <button key={pt} onClick={() => setEntryData(p => ({ ...p, pataType: pt }))} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${entryData.pataType === pt ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-black dark:text-white border border-slate-100 dark:border-slate-800'}`}>{pt}</button>
                            ))}
                        </div>
                     </div>
                     <div className="space-y-2 lg:border-r border-slate-200 dark:border-slate-700 lg:px-8">
                        <div className="flex items-start justify-between">
                            <label className="text-[10px] font-bold uppercase text-amber-500 tracking-widest mb-2 block">পাথর প্যাকেট (Stone Out)</label>
                            <span className="text-[9px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase">{rawStock.stone} Avail</span>
                        </div>
                        <input placeholder="0" type="number" className="w-full text-5xl font-bold bg-transparent outline-none text-amber-500" value={entryData.stonePackets} onChange={(e) => setEntryData(p => ({ ...p, stonePackets: e.target.value }))} />
                     </div>
                     <div className="space-y-2 lg:pl-8">
                        <div className="flex items-start justify-between">
                            <label className="text-[10px] font-bold uppercase text-blue-500 tracking-widest mb-2 block">পেপার রোল (Paper Out)</label>
                            <span className="text-[9px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded uppercase">{rawStock.roll} Avail</span>
                        </div>
                        <input placeholder="0" type="number" className="w-full text-5xl font-bold bg-transparent outline-none text-blue-500" value={entryData.paperRolls} onChange={(e) => setEntryData(p => ({ ...p, paperRolls: e.target.value }))} />
                     </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                   <button 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold uppercase text-[10px] tracking-widest hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-800"
                   >
                    বাতিল (Cancel)
                   </button>
                   <button 
                    onClick={() => handleSaveIssue(false)} 
                    className="flex-1 py-4 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                   >
                    সেভ করুন (Commit)
                   </button>
                   <button 
                    onClick={() => handleSaveIssue(true)} 
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                   >
                    <Printer size={16} /> প্রিন্ট ও সেভ
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* RECEIVE MODAL */}
      <AnimatePresence>
        {receiveModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 relative overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-up">
                <div className="text-center space-y-8">
                    <div className="mx-auto w-14 h-14 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg"><CheckCircle size={28} /></div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold uppercase text-black dark:text-white leading-none">উৎপাদন জমা <span className="text-blue-600">নিন (Receive)</span></h3>
                        <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest italic mt-2 leading-none">{receiveModal.worker} - Lot #{receiveModal.lotNo}</p>
                    </div>
                    <form onSubmit={handleReceive} className="space-y-8">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-xl text-center border border-slate-100 dark:border-slate-800 shadow-inner">
                            <label className="text-[10px] font-bold uppercase text-black dark:text-white tracking-widest block mb-4">স্বাক্ষরিত পরিমাণ (Confirm Quantity)</label>
                            <input name="rQty" type="number" defaultValue={receiveModal.pataQty} className="w-full text-center text-6xl font-bold bg-transparent border-none text-black dark:text-white outline-none leading-none h-20" autoFocus />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button type="submit" className="w-full py-4 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">নিশ্চিত করুন (Confirm)</button>
                            <button type="button" onClick={() => setReceiveModal(null)} className="w-full py-4 text-black dark:text-white font-bold text-[10px] uppercase rounded-xl hover:text-rose-500 transition-all font-outfit">বাতিল করুন</button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* PAY MODAL */}
      <AnimatePresence>
        {payModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-10 relative overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-up">
                <div className="text-center space-y-8">
                    <div className="mx-auto w-14 h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><DollarSign size={28} /></div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold uppercase text-black dark:text-white leading-none">মজুরি <span className="text-blue-600">পরিশোধ করুন</span></h3>
                        <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest italic mt-2 leading-none font-outfit">{payModal}</p>
                    </div>
                    <form onSubmit={handleConfirmPayment} className="space-y-8">
                        <div className="bg-slate-950 p-10 rounded-xl text-center border-b-4 border-blue-600 shadow-2xl">
                            <label className="text-[10px] font-bold uppercase text-blue-400 tracking-widest block mb-4">পরিশোধের পরিমাণ (Amount ৳)</label>
                            <input name="amount" type="number" defaultValue={getWorkerDue(payModal)} className="w-full text-center text-7xl font-bold bg-transparent border-none text-white outline-none leading-none h-20 placeholder:text-white/10" autoFocus />
                            <p className="text-[9px] font-bold text-white/30 mt-4 italic uppercase">Pending Payable: ৳{getWorkerDue(payModal).toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase text-black dark:text-white tracking-widest ml-1">তারিখ</label>
                                <input name="date" type="date" className="premium-input !h-11 text-xs text-center !bg-slate-50 dark:!bg-slate-800/50 border-slate-200 dark:border-slate-700" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase text-black dark:text-white tracking-widest ml-1">নোট (Optional)</label>
                                <input name="note" className="premium-input !h-11 text-xs" placeholder="REMARKS..." />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><ShieldCheck size={18} /> কনফার্ম পেমেন্ট</button>
                            <button type="button" onClick={() => setPayModal(null)} className="w-full py-4 text-black dark:text-white font-bold text-[10px] uppercase rounded-xl hover:text-rose-500 transition-all font-outfit">বাতিল করুন</button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* LEDGER MODAL */}
      <AnimatePresence>
        {ledgerModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 relative overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-up">
                <div className="space-y-8">
                    <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-2xl font-bold uppercase text-black dark:text-white leading-none">কারিগর <span className="text-blue-600">লেজার (Ledger)</span></h3>
                            <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest italic mt-2 leading-none font-outfit">{ledgerModal} - Audit Log</p>
                        </div>
                        <button 
                            onClick={() => setLedgerModal(null)} 
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-black dark:text-white shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                        {(masterData.pataEntries || []).filter(e => e.worker === ledgerModal && e.status === 'Received').map((e, idx) => (
                            <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-black dark:text-white uppercase tracking-widest italic leading-none">{e.receiveDate}</p>
                                    <h4 className="text-sm font-bold uppercase text-black dark:text-white">{e.design} ({e.receivedQty || e.pataQty} পিস)</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-emerald-600">+ ৳{(e.amount || 0).toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-emerald-400/50 uppercase tracking-widest leading-none">Earned Output</p>
                                </div>
                            </div>
                        ))}
                        {(masterData.workerPayments || []).filter(p => p.worker === ledgerModal && p.dept === 'pata').map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-5 bg-rose-500/5 rounded-xl border border-rose-500/10 group hover:border-rose-500/30 transition-all">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest italic leading-none">{p.date}</p>
                                    <h4 className="text-sm font-bold uppercase text-rose-600">মজুরি পরিশোধ (Disbursed)</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-rose-600">- ৳{(p.amount || 0).toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-rose-400/50 uppercase tracking-widest leading-none">Paid Cash</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 bg-slate-950 text-white rounded-xl flex justify-between items-center shadow-2xl border-b-4 border-blue-600 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck size={80} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic leading-none mb-3">সর্বমোট বকেয়া (Audit Balance)</p>
                            <h4 className="text-4xl font-bold tracking-tight">৳{getWorkerDue(ledgerModal).toLocaleString()}</h4>
                        </div>
                        <div className="text-right relative z-10">
                             <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] leading-none mb-2">Verified System <CheckCircle size={10} className="inline ml-1" /></p>
                             <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em]">Integrated Pata Ledger V5.0</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      {/* RESTOCK MODAL */}
      <AnimatePresence>
        {showRestockModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-10 relative border border-slate-100 dark:border-slate-800">
                <button onClick={() => setShowRestockModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black dark:text-white"><X size={20} /></button>
                <div className="text-center space-y-8">
                    <div className="mx-auto w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><Download size={28} /></div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold uppercase">Quick <span className="text-indigo-600">Restock</span></h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{showRestockModal}</p>
                    </div>
                    <form onSubmit={handleRestock} className="space-y-6">
                        <input name="item" type="hidden" value={showRestockModal} />
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Client / Owner</label>
                            <select name="client" className="premium-input !h-12 text-sm font-bold uppercase">
                                <option value="FACTORY">FACTORY</option>
                                {(masterData.clients || []).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Restock Quantity</label>
                            <input name="qty" type="number" placeholder="0" className="w-full text-center text-5xl font-bold bg-slate-50 dark:bg-slate-800/50 py-6 rounded-xl border-none outline-none" autoFocus />
                        </div>
                        <input name="note" placeholder="REFERENCE / CHALLAN" className="premium-input !h-12 uppercase text-[10px] font-bold" />
                        <button type="submit" className="w-full py-4 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">কনফার্ম এন্ট্রি (Commit)</button>
                    </form>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PataFactoryPanel;
