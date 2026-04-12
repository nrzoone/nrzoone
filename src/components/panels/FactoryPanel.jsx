import React, { useState, useMemo, useEffect } from "react";
import {
  Scissors,
  Database,
  Plus,
  X,
  Archive,
  DollarSign,
  History,
  Printer,
  CheckCircle,
  ExternalLink,
  Clock,
  ArrowLeft,
  AlertCircle,
  User,
  Layers,
  Search,
  Camera,
  Box,
  Trash2,
  Settings,
  ChevronRight,
  ShieldCheck,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRScanner from "../QRScanner";
import UniversalSlip from "../UniversalSlip";
import { syncToSheet } from "../../utils/syncUtils";
import { getPataStockItem } from "../../utils/calculations";
import NRZLogo from "../NRZLogo";

const FactoryPanel = ({ type, masterData, setMasterData, showNotify, user, setActivePanel, t, logAction }) => {
  const [view, setView] = useState("active");
  const [lotSearch, setLotSearch] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [ledgerModal, setLedgerModal] = useState(null);
  const [printSlip, setPrintSlip] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [receiveState, setReceiveState] = useState({ rBorka: 0, rHijab: 0, penalty: 0, date: new Date().toISOString().split("T")[0] });
  const [paymentAmount, setPaymentAmount] = useState('');

  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isWorker = role !== "admin" && role !== "manager";

  const workers = (masterData.workerCategories || {})[type] || [];

  const [selection, setSelection] = useState({
    worker: "",
    design: "",
    color: "",
    lotNo: "",
    rate: "",
    date: new Date().toISOString().split("T")[0],
    pataType: "Single",
    client: "FACTORY"
  });

  const [issueSizes, setIssueSizes] = useState([{ size: "", borka: "", hijab: "", pataQty: "" }]);

  const filteredProductions = (masterData.productions || []).filter(p => {
    if (p.type !== type) return false;
    if (isWorker && p.worker?.toLowerCase() !== user?.name?.toLowerCase()) return false;
    return (p.worker?.toLowerCase() || '').includes(lotSearch.toLowerCase()) ||
           (p.design?.toLowerCase() || '').includes(lotSearch.toLowerCase()) ||
           (p.lotNo?.toLowerCase() || '').includes(lotSearch.toLowerCase());
  });

  const activeEntries = filteredProductions.filter(p => p.status === "Pending");
  const historyEntries = filteredProductions.filter(p => p.status === "Received");

  const handleLotSelect = (lotKey) => {
    if (!lotKey) return;
    const [design, color, lotNo] = lotKey.split("|");
    const dObj = (masterData.designs || []).find(d => d.name === design);
    const defaultRate = type === "sewing" ? dObj?.sewingRate || 0 : dObj?.stoneRate || 0;
    
    // Auto-fill sizes from cuttingStock
    const lotSizes = (masterData.cuttingStock || [])
      .filter(l => l.design === design && l.color === color && l.lotNo === lotNo)
      .map(l => ({
          size: l.size || "",
          borka: l.borka || "",
          hijab: l.hijab || "",
          pataQty: 0
      }));

    setSelection(prev => ({
      ...prev,
      design,
      color,
      lotNo,
      rate: defaultRate,
      client: (masterData.cuttingStock || []).find(l => l.design === design && l.color === color && l.lotNo === lotNo)?.client || 'FACTORY'
    }));

    if (lotSizes.length > 0) {
        setIssueSizes(lotSizes);
    }
  };

  const handleIssue = () => {
    const { worker, design, color, lotNo, rate, date } = selection;
    if (!worker || !lotNo) return showNotify("কারিগর ও লট নির্বাচন করুন!", "error");
    
    const validSizes = issueSizes.filter(s => Number(s.borka || 0) > 0 || Number(s.hijab || 0) > 0);
    if (validSizes.length === 0) return showNotify("অন্তত একটি পরিমাণ দিন!", "error");

    const newEntries = validSizes.map(s => ({
      id: `prod_${Date.now()}_${Math.random()}`,
      date: new Date(date).toLocaleDateString("en-GB"),
      type,
      worker,
      design,
      color,
      lotNo,
      size: s.size,
      issueBorka: Number(s.borka || 0),
      issueHijab: Number(s.hijab || 0),
      pataType: type === "stone" ? selection.pataType : null,
      pataQty: type === "stone" ? Number(s.pataQty || 0) : 0,
      status: "Pending",
      rate: Number(rate),
      receivedBorka: 0,
      receivedHijab: 0,
      client: selection.client || 'FACTORY'
    }));

    setMasterData(prev => ({
      ...prev,
      productions: [...newEntries, ...(prev.productions || [])]
    }));

    setShowIssueModal(false);
    showNotify("কাজ সফলভাবে ইস্যু হয়েছে!");
  };

  const handleConfirmReceive = (e) => {
    e.preventDefault();
    const rBorka = Number(receiveState.rBorka);
    const rHijab = Number(receiveState.rHijab);
    const penalty = Number(receiveState.penalty || 0);

    setMasterData(prev => {
      const updatedProductions = prev.productions.map(p => p.id === receiveModal.id ? {
        ...p,
        status: "Received",
        receivedBorka: rBorka,
        receivedHijab: rHijab,
        penalty: penalty,
        receiveDate: new Date(receiveState.date).toLocaleDateString("en-GB")
      } : p);

      const newFinishedStock = {
        id: `FIN_${Date.now()}`,
        date: new Date(receiveState.date).toLocaleDateString("en-GB"),
        design: receiveModal.design,
        color: receiveModal.color,
        size: receiveModal.size,
        lotNo: receiveModal.lotNo,
        client: receiveModal.client || 'FACTORY',
        borka: rBorka,
        hijab: rHijab,
        source: type.toUpperCase()
      };

      return {
        ...prev,
        productions: updatedProductions,
        finishedStock: [newFinishedStock, ...(prev.finishedStock || [])]
      };
    });

    // Generate Client Bill if applicable
    if (receiveModal.client && receiveModal.client !== 'FACTORY') {
        const dObj = (masterData.designs || []).find(d => d.name === receiveModal.design);
        // Priority: Per-client override > Default client rate > Legacy field > 0
        const perClientRate = dObj?.clientRates?.[receiveModal.client];
        let clientRate = 0;
        if (type === "sewing") {
            clientRate = perClientRate?.sewing || dObj?.defaultClientRates?.sewing || dObj?.clientSewingRate || 0;
        } else {
            clientRate = perClientRate?.stone || dObj?.defaultClientRates?.stone || dObj?.clientStoneRate || 0;
        }
        const totalPcs = rBorka + rHijab;
        const billAmount = totalPcs * clientRate;

        if (billAmount > 0) {
            const deptTag = type === 'sewing' ? 'SEWING' : 'STONE';
            const billEntry = {
                id: `BILL_${Date.now()}`,
                date: new Date(receiveState.date).toLocaleDateString("en-GB"),
                client: receiveModal.client,
                amount: billAmount,
                type: 'BILL',
                dept: deptTag,
                note: `${deptTag} BILL: ${receiveModal.design} (${totalPcs} pcs @ ${clientRate}tk)`
            };
            setMasterData(prev => ({
                ...prev,
                clientTransactions: [billEntry, ...(prev.clientTransactions || [])]
            }));
            logAction(user, 'CLIENT_BILL_AUTO', `${receiveModal.client} billed ${billAmount}tk for ${receiveModal.design}`);
        }
    }

    setReceiveModal(null);
    showNotify("কাজ জমা নেওয়া হয়েছে!");
  };

  const handlePayment = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    const amount = Number(paymentAmount);

    setMasterData(prev => ({
      ...prev,
      workerPayments: [
        {
          id: `pay_${Date.now()}`,
          date: new Date().toLocaleDateString("en-GB"),
          worker: payModal,
          dept: type,
          amount,
          note: `Manual Payment (${type})`
        },
        ...(prev.workerPayments || [])
      ],
      expenses: [
        {
          id: `exp_w_${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          category: "salary",
          description: `PMT: ${payModal} (${type})`,
          amount
        },
        ...(prev.expenses || [])
      ]
    }));

    setPayModal(null);
    setPaymentAmount('');
    showNotify("পেমেন্ট সফলভাবে ব্যালেন্সে যুক্ত হয়েছে!");
  };

  const getWorkerDue = (name) => {
    const earned = (masterData.productions || [])
      .filter(p => p.worker === name && p.status === "Received" && p.type === type)
      .reduce((s, p) => s + (p.receivedBorka + p.receivedHijab) * (p.rate || 0), 0);
    const paid = (masterData.workerPayments || [])
      .filter(p => p.worker === name && p.dept === type)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return earned - paid;
  };

  if (printSlip) {
    return (
      <div className="min-h-screen bg-white p-10 font-outfit italic animate-fade-up">
        <style>{`@media print { .no-print { display: none !important; } }`}</style>
        <div className="no-print flex justify-between items-center mb-10 max-w-5xl mx-auto">
          <button onClick={() => setPrintSlip(null)} className="px-8 py-4 bg-slate-50 rounded-2xl font-black uppercase text-[10px] hover:bg-black hover:text-white transition-all">Cancel</button>
          <button onClick={() => window.print()} className="action-btn-primary !px-12 !py-4 shadow-xl"><Printer size={18} /> Print Job Slip</button>
        </div>
        <div className="w-[210mm] mx-auto bg-white border border-slate-100 shadow-2xl p-1 relative">
          <UniversalSlip data={printSlip} type="ISSUE" copyTitle="WORKER COPY" />
          <div className="h-4 border-t-2 border-dashed border-slate-300 my-10"></div>
          <UniversalSlip data={printSlip} type="ISSUE" copyTitle="OFFICE COPY" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32 animate-fade-up px-1 md:px-2 italic font-outfit text-black dark:text-white">
      {/* SaaS Operational HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        <div className="bg-slate-950 p-3.5 md:p-5 rounded-xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:scale-150 transition-transform"><Layers size={50} /></div>
          <p className="text-[7.5px] font-black uppercase tracking-widest opacity-40 mb-0.5">ইউনিট টাইপ</p>
          <p className="text-lg md:text-xl font-black tracking-tighter italic">{type.toUpperCase()} UNIT</p>
        </div>

        <button onClick={() => setView('active')} className={`bg-white dark:bg-slate-900 p-3.5 md:p-5 rounded-xl border flex items-center justify-between group transition-all text-left shadow-md ${view === 'active' ? 'border-amber-500 bg-amber-50/10' : 'border-slate-100 dark:border-slate-800'}`}>
          <div>
            <p className="text-xl md:text-2xl font-black tracking-tighter leading-none mb-0.5">{activeEntries.length}</p>
            <p className="text-[7.5px] font-black uppercase tracking-widest opacity-40">চলমান কাজ</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform"><Clock size={18} /></div>
        </button>

        <button onClick={() => setView('history')} className={`bg-white dark:bg-slate-900 p-3.5 md:p-5 rounded-xl border flex items-center justify-between group transition-all text-left shadow-md ${view === 'history' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 dark:border-slate-800'}`}>
          <div>
            <p className="text-xl md:text-2xl font-black tracking-tighter leading-none mb-0.5">{historyEntries.length}</p>
            <p className="text-[7.5px] font-black uppercase tracking-widest opacity-40">পুরাতন রেকর্ড</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform"><CheckCircle size={18} /></div>
        </button>

        <div className="bg-white dark:bg-slate-900 p-3.5 md:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between group overflow-hidden relative">
          <div>
            <p className="text-lg md:text-xl font-black tracking-tighter leading-none mb-0.5">৳{(workers.reduce((s,w) => s + getWorkerDue(w), 0)).toLocaleString()}</p>
            <p className="text-[7.5px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">মোট বকেয়া মজুরি</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-slate-950 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all"><DollarSign size={18} /></div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-1 md:p-1.5 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg w-full md:w-auto">
          {['active', 'history', 'payments'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 md:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400'}`}>
              {v === 'active' ? 'চলমান' : v === 'history' ? 'পুরাতন' : 'পেমেন্ট'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3 px-2 w-full md:w-auto">
          <div className="relative group flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="খুঁজুন..." className="bg-slate-50 dark:bg-slate-800 h-9 md:h-10 pl-9 pr-4 rounded-xl text-[9px] font-black uppercase outline-none w-full md:w-40 border border-transparent focus:border-black transition-all italic" value={lotSearch} onChange={(e) => setLotSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowQR(true)} className="w-9 h-9 md:w-10 md:h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all"><Camera size={14} /></button>
          {!isWorker && (
            <button onClick={() => setShowIssueModal(true)} className="h-9 md:h-10 bg-slate-950 text-white px-4 md:px-5 rounded-xl flex items-center gap-2 shadow-md font-black uppercase text-[8.5px] tracking-widest italic active:scale-95 transition-all">
              <Plus size={14} /> নতুন কাজ
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {view === 'payments' ? (
          workers.map((w, idx) => {
            const due = getWorkerDue(w);
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-md hover:border-black transition-all group animate-fade-up">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none italic">{type.toUpperCase()} SPECIALIST</p>
                    <h4 className="text-xl font-black tracking-tighter uppercase italic">{w}</h4>
                  </div>
                  <div className={`w-10 h-10 ${due > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'} rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-inner`}><User size={18} /></div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-white dark:border-slate-700 shadow-inner">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">বকেয়া মজুরি (DUE)</p>
                   <p className={`text-3xl font-black tracking-tighter italic ${due > 0 ? 'text-black dark:text-white' : 'text-slate-200'}`}>৳{due.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setLedgerModal(w)} className="py-2.5 bg-slate-50 dark:bg-white rounded-xl font-black uppercase text-[9px] tracking-widest italic">লেজার</button>
                  <button onClick={() => setPayModal(w)} className="py-2.5 bg-slate-950 text-white rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-md">পেমেন্ট দিন</button>
                </div>
              </div>
            );
          })
        ) : (view === 'active' ? activeEntries : historyEntries).length === 0 ? (
          <div className="col-span-full h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 italic">
            <Activity size={48} strokeWidth={1} className="text-slate-100 mb-4" />
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">রেকর্ড পাওয়া যায়নি</p>
          </div>
        ) : (
          (view === 'active' ? activeEntries : historyEntries).map((item) => (
            <div key={item.id} className="flex flex-col h-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:border-black transition-all group animate-fade-up">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">কারিগর</p>
                  <h4 className="text-lg md:text-xl font-black tracking-tighter uppercase italic truncate max-w-[150px] md:max-w-[200px]">{item.worker}</h4>
                </div>
                <div className={`w-9 h-9 md:w-10 md:h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-inner font-black text-[10px]`}>#{item.lotNo.slice(-3)}</div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-3 md:mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 md:p-3 rounded-xl border border-white dark:border-slate-700">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">রঙ</p>
                  <p className="text-[11px] font-black uppercase italic truncate">{item.color}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 md:p-3 rounded-xl border border-white dark:border-slate-700">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">সাইজ</p>
                  <p className="text-[11px] font-black uppercase italic truncate">{item.size}</p>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 md:py-4 border-y border-slate-50 dark:border-slate-800 border-dashed mb-3 md:mb-4">
                <div>
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">পরিমাণ</p>
                  <p className="text-xl md:text-2xl font-black italic tracking-tighter">{item.issueBorka + item.issueHijab} <span className="text-[9px] opacity-40">PCS</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">মজুরি</p>
                  <p className="text-lg md:text-xl font-black italic text-emerald-500 tracking-tighter">৳{item.rate}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => setPrintSlip(item)} className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 rounded-xl flex items-center justify-center shadow-md hover:border-black transition-all"><Printer size={18} /></button>
                {item.status === 'Pending' ? (
                  <button onClick={() => setReceiveModal(item)} className="flex-1 h-12 bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-xl font-black uppercase tracking-widest text-[9px] italic shadow-md hover:bg-emerald-500 transition-all">কাজ জমা নিন (REC)</button>
                ) : (
                  <div className="flex-1 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl flex items-center justify-center font-black uppercase text-[9px] tracking-widest italic border border-emerald-100">RECEIVED ON {item.receiveDate}</div>
                )}
                {isAdmin && (
                  <button 
                  onClick={() => {
                    if (window.confirm('মুছে ফেলতে চান?')) {
                      setMasterData(prev => ({ ...prev, productions: prev.productions.filter(p => p.id !== item.id) }));
                      showNotify('রেকর্ড মুছে ফেলা হয়েছে!');
                    }
                  }}
                  className="w-16 h-16 bg-rose-50 text-rose-500 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center shadow-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={24} /></button>
                )}
              </div>
            </div>
          ))
        )}

      </div>

      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-10 relative border border-slate-100 dark:border-slate-800 my-auto"
             >
                <button onClick={() => setShowIssueModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black dark:hover:text-white transition-colors"><X size={20} /></button>
                <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">নতুন {type === 'sewing' ? 'সেলাই' : 'স্টোন'} কাজ <span className="text-blue-600 underline">ইস্যু করুন</span></h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-5">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">লট সিলেক্ট (Master Lot) *</label>
                      <select className="premium-input !h-12 !text-[11px] font-black uppercase italic" value={`${selection.design}|${selection.color}|${selection.lotNo}`} onChange={(e) => handleLotSelect(e.target.value)}>
                        <option value="">-- SELECT LOT --</option>
                        {Array.from(new Set((masterData.cuttingStock || [])
                          .filter(l => l.status === 'Ready') // Only show lots available for sewing
                          .map(l => `${l.design}|${l.color}|${l.lotNo}`)))
                          .map(key => {
                            const [d, c, ln] = key.split("|");
                            return <option key={key} value={key}>{d} | {c} | #{ln}</option>;
                          })
                        }
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">কারিগর নির্বাচন *</label>
                      <select className="premium-input !h-12 !text-[11px] font-black uppercase italic" value={selection.worker} onChange={(e) => setSelection(p => ({ ...p, worker: e.target.value, rate: (masterData.workerWages || {})[type]?.[e.target.value] || p.rate }))}>
                        <option value="">-- SELECT WORKER --</option>
                        {workers.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">মজুরি রেট (প্রতি পিস)</label>
                      <input type="number" className="premium-input !h-14 font-black !text-emerald-600 italic" value={selection.rate} onChange={(e) => setSelection(p => ({ ...p, rate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">তারিখ</label>
                      <input type="date" className="premium-input !h-14 font-black italic" value={selection.date} onChange={(e) => setSelection(p => ({ ...p, date: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-white dark:border-slate-700 space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                    {issueSizes.map((row, idx) => (
                      <div key={idx} className="flex gap-3 md:gap-4 items-center animate-fade-up">
                        <select className="flex-1 premium-input !h-11 text-[11px] font-black" value={row.size} onChange={(e) => { const n = [...issueSizes]; n[idx].size = e.target.value; setIssueSizes(n); }}>
                          <option value="">SIZE...</option>
                          {(masterData.sizes || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input className="w-20 md:w-24 premium-input !h-11 text-center font-black" placeholder="BORKA" type="number" value={row.borka} onChange={(e) => { const n = [...issueSizes]; n[idx].borka = e.target.value; setIssueSizes(n); }} />
                        <input className="w-20 md:w-24 premium-input !h-11 text-center font-black" placeholder="HIJAB" type="number" value={row.hijab} onChange={(e) => { const n = [...issueSizes]; n[idx].hijab = e.target.value; setIssueSizes(n); }} />
                        {issueSizes.length > 1 && <button onClick={() => setIssueSizes(issueSizes.filter((_, i) => i !== idx))} className="text-rose-500"><X size={18} /></button>}
                      </div>
                    ))}
                    <button onClick={() => setIssueSizes([...issueSizes, { size: "", borka: "", hijab: "", pataQty: "" }])} className="w-full py-3 border border-dashed rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-black transition-all">+ Add Size Row</button>
                </div>

                <button onClick={handleIssue} className="w-full mt-8 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase italic shadow-xl hover:bg-black transition-all">কাজ নিশ্চিত করুন (DEPLOY JOB)</button>
             </motion.div>
          </div>
        )}

        {receiveModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-10 relative border border-slate-100 dark:border-slate-800 my-auto"
             >
                 <button onClick={() => setReceiveModal(null)} className="absolute top-6 right-6 text-slate-400"><X size={20} /></button>
                 <h2 className="text-xl font-black uppercase italic mb-8 text-center">{receiveModal.worker} <span className="text-emerald-500">জমা দিন</span></h2>
                 <form onSubmit={handleConfirmReceive} className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center shadow-inner border border-white dark:border-slate-700">
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-3">বোরকা (REC)</p>
                          <input type="number" className="w-full text-3xl font-black text-center bg-transparent outline-none italic" value={receiveState.rBorka} onChange={(e) => setReceiveState(p => ({ ...p, rBorka: e.target.value }))} autoFocus />
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center shadow-inner border border-white dark:border-slate-700">
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-3">হিজাব (REC)</p>
                          <input type="number" className="w-full text-3xl font-black text-center bg-transparent outline-none italic" value={receiveState.rHijab} onChange={(e) => setReceiveState(p => ({ ...p, rHijab: e.target.value }))} />
                        </div>
                     </div>
                     <div className="p-5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl text-center border border-rose-100 dark:border-rose-900/20">
                        <p className="text-[9px] font-black uppercase mb-1.5">জরিমানা / Fine (৳)</p>
                        <input type="number" className="w-full text-2xl font-black text-center bg-transparent outline-none italic" placeholder="0" value={receiveState.penalty} onChange={(e) => setReceiveState(p => ({ ...p, penalty: e.target.value }))} />
                     </div>
                     <button type="submit" className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all">জমা নিশ্চিত করুন</button>
                 </form>
             </motion.div>
          </div>
        )}

        {payModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-10 relative border border-slate-100 dark:border-slate-800 my-auto"
             >
                 <button onClick={() => setPayModal(null)} className="absolute top-6 right-6 text-slate-400"><X size={20} /></button>
                 <h2 className="text-xl font-black uppercase italic mb-8 text-center">{payModal} <span className="text-emerald-500">পেমেন্ট</span></h2>
                 <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center mb-8 shadow-inner border border-white dark:border-slate-700">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-4">টাকার পরিমাণ (৳)</p>
                     <input type="number" className="w-full text-4xl font-black text-center bg-transparent outline-none italic" placeholder="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} autoFocus />
                 </div>
                 <button onClick={handlePayment} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest italic shadow-lg hover:bg-black active:scale-95 transition-all">পেমেন্ট নিশ্চিত করুন</button>
             </motion.div>
          </div>
        )}

        {ledgerModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-10 relative border border-slate-100 dark:border-slate-800 my-auto"
             >
                <button onClick={() => setLedgerModal(null)} className="absolute top-6 right-6 text-slate-400"><X size={20} /></button>
                <h2 className="text-xl font-black uppercase italic mb-8 text-center font-outfit">{ledgerModal} <span className="text-blue-600">লেজার</span></h2>
                <div className="space-y-3">
                   {(masterData.productions || []).filter(p => p.worker === ledgerModal && p.status === 'Received' && p.type === type).map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-white dark:border-slate-700 italic">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{p.receiveDate}</p>
                            <h4 className="text-[11px] font-black uppercase leading-tight">{p.design} | #{p.lotNo.slice(-3)} ({p.receivedBorka + p.receivedHijab} PCS)</h4>
                         </div>
                         <p className="text-base font-black text-emerald-600">৳{((p.receivedBorka + p.receivedHijab) * p.rate).toLocaleString()}</p>
                      </div>
                   ))}
                   {(masterData.workerPayments || []).filter(pay => pay.worker === ledgerModal && pay.dept === type).map((pay, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 italic">
                         <div>
                            <p className="text-[9px] font-black text-rose-400 uppercase leading-none mb-1">{pay.date}</p>
                            <h4 className="text-[11px] font-black uppercase leading-tight">মজুরি পরিশোধ (DISBURSEMENT)</h4>
                         </div>
                         <p className="text-base font-black text-rose-600">- ৳{pay.amount.toLocaleString()}</p>
                      </div>
                   ))}
                </div>
                <div className="mt-8 p-6 bg-slate-950 text-white rounded-2xl flex justify-between items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">LEDGER BALANCE</p>
                   <p className="text-3xl font-black italic tracking-tighter">৳{getWorkerDue(ledgerModal).toLocaleString()}</p>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Button */}
      <div className="pt-24 pb-12 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group flex items-center gap-6 bg-white dark:bg-slate-900 px-10 md:px-12 py-5 md:py-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl hover:border-black transition-all duration-500"
        >
          <div className="p-3 bg-slate-950 text-white rounded-xl transition-transform shadow-lg group-hover:-translate-x-2">
            <ArrowLeft size={18} strokeWidth={3} />
          </div>
          <span className="text-lg font-black tracking-tight text-black dark:text-white uppercase leading-none italic">RETURN TO HUB</span>
        </button>
      </div>
    </div>
  );
};

export default FactoryPanel;
