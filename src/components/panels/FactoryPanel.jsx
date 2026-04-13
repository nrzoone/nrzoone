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
  Zap,
  Activity,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FactoryPanel = ({ masterData, setMasterData, isAdmin, isWorker, showNotify }) => {
  const [view, setView] = useState("active");
  const [lotSearch, setLotSearch] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [ledgerModal, setLedgerModal] = useState(null);
  const [printSlip, setPrintSlip] = useState(null);
  const [showQR, setShowQR] = useState(false);
  
  const type = masterData.type || "sewing";
  const [entryData, setEntryData] = useState({
    worker: "",
    design: "",
    lotNo: "",
    color: "",
    size: "",
    issueBorka: "",
    issueHijab: "",
    rate: "",
    date: new Date().toISOString().split('T')[0],
    note: ""
  });

  const workers = useMemo(() => {
    const list = masterData.workers || [];
    return list.filter(w => w.dept?.toLowerCase() === (type === 'sewing' ? 'sewing' : 'stone')).map(w => w.name);
  }, [masterData.workers, type]);

  const activeEntries = useMemo(() => {
    return (masterData.productions || [])
      .filter(p => p.type === type && p.status === "Pending")
      .filter(p => !lotSearch || p.lotNo.toLowerCase().includes(lotSearch.toLowerCase()) || p.worker.toLowerCase().includes(lotSearch.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [masterData.productions, type, lotSearch]);

  const historyEntries = useMemo(() => {
    return (masterData.productions || [])
      .filter(p => p.type === type && p.status === "Received")
      .filter(p => !lotSearch || p.lotNo.toLowerCase().includes(lotSearch.toLowerCase()) || p.worker.toLowerCase().includes(lotSearch.toLowerCase()))
      .sort((a, b) => new Date(b.receiveDate) - new Date(a.receiveDate));
  }, [masterData.productions, type, lotSearch]);

  const getWorkerDue = (workerName) => {
    return (masterData.productions || [])
      .filter(p => p.worker === workerName && p.status === "Received" && !p.paid && p.type === type)
      .reduce((s, p) => s + (Number(p.rate) || 0), 0);
  };

  const handleLotSearch = (val) => {
    setLotSearch(val);
    const lot = (masterData.cutting || []).find(c => c.lotNo === val);
    if (lot) {
      setEntryData(prev => ({
        ...prev,
        lotNo: lot.lotNo,
        design: lot.design,
        color: lot.color,
        size: lot.size,
        rate: (masterData.designs || []).find(d => d.name === lot.design)?.[type === 'sewing' ? 'sewingRate' : 'stoneRate'] || ""
      }));
      showNotify("মাস্টার লট পাওয়া গেছে!");
    }
  };

  const saveIssue = () => {
    if (!entryData.worker || !entryData.lotNo) return showNotify("কারিগর ও লট প্রয়োজনীয়!", "error");
    const newEntry = {
      ...entryData,
      id: Date.now(),
      status: "Pending",
      type: type,
      paid: false
    };
    setMasterData(prev => ({
      ...prev,
      productions: [newEntry, ...(prev.productions || [])]
    }));
    showNotify("কাজ সফলভাবে ইস্যু করা হয়েছে!");
    setShowIssueModal(false);
    setEntryData({ worker: "", design: "", lotNo: "", color: "", size: "", issueBorka: "", issueHijab: "", rate: "", date: new Date().toISOString().split('T')[0], note: "" });
  };

  const setReceive = (id, date) => {
    setMasterData(prev => ({
      ...prev,
      productions: prev.productions.map(p => p.id === id ? { ...p, status: "Received", receiveDate: date } : p)
    }));
    showNotify("কাজ সফলভাবে গ্রহণ করা হয়েছে!");
    setReceiveModal(null);
  };

  const setPayment = (workerName, amount) => {
    const pId = Date.now();
    setMasterData(prev => ({
      ...prev,
      productions: prev.productions.map(p => p.worker === workerName && p.status === "Received" && !p.paid && p.type === type ? { ...p, paid: true, paymentId: pId } : p),
      expenses: [...(prev.expenses || []), { 
        id: pId, 
        date: new Date().toISOString().split('T')[0], 
        category: "Worker Payment", 
        amount: Number(amount), 
        description: `${workerName} (${type.toUpperCase()}) পেমেন্ট`,
        worker: workerName,
        dept: type
      }]
    }));
    showNotify("পেমেন্ট সম্পন্ন হয়েছে!");
    setPayModal(null);
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in pb-20">
      {/* HUD Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <div className="bg-white dark:bg-slate-900 p-3.5 md:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-xl md:text-2xl font-black tracking-tighter leading-none mb-0.5">{activeEntries.length}</p>
            <p className="text-[7.5px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">चलमान কাজ (ACTIVE)</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Activity size={18} /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 md:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between group overflow-hidden relative">
          <div>
            <p className="text-xl md:text-2xl font-black tracking-tighter leading-none mb-0.5">{historyEntries.length}</p>
            <p className="text-[7.5px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">সম্পন্ন কাজ (DONE)</p>
          </div>
          <button onClick={() => setView('history')} className="w-9 h-9 md:w-10 md:h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform"><CheckCircle size={18} /></button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 md:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between group overflow-hidden relative">
          <div>
            <p className="text-xl md:text-2xl font-black tracking-tighter leading-none mb-0.5">৳{(workers.reduce((s,w) => s + getWorkerDue(w), 0)).toLocaleString()}</p>
            <p className="text-[7.5px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">মোট বকেয়া মজুরি</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-slate-950 transition-all"><DollarSign size={18} /></div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-1 md:p-1.5 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg w-full md:w-auto overflow-x-auto no-scrollbar">
          {['active', 'history', 'payments'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 md:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-slate-950 text-white shadow-md' : 'text-slate-400'}`}>
              {v === 'active' ? 'চলমান' : v === 'history' ? 'পুরাতন' : 'পেমেন্ট'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3 px-2 w-full md:w-auto">
          <div className="relative group flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="লট বা কারিগর..." className="bg-slate-50 dark:bg-slate-800 h-9 md:h-10 pl-9 pr-4 rounded-xl text-[9px] font-black uppercase outline-none w-full md:w-40 border border-transparent focus:border-black transition-all italic" value={lotSearch} onChange={(e) => setLotSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowQR(true)} className="w-9 h-9 md:w-10 md:h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-950 transition-all"><Camera size={14} /></button>
          {!isWorker && (
            <button onClick={() => setShowIssueModal(true)} className="h-9 md:h-10 bg-slate-950 text-white px-4 md:px-5 rounded-xl flex items-center gap-2 shadow-md font-black uppercase text-[8.5px] tracking-widest italic active:scale-95 transition-all">
              <Plus size={14} /> নতুন কাজ
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {(() => {
          if (view === 'payments') {
            return workers.map((w, idx) => {
              const due = getWorkerDue(w);
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-md hover:border-black transition-all group animate-fade-up">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none italic">{type.toUpperCase()} SPECIALIST</p>
                      <h4 className="text-xl font-black tracking-tighter uppercase italic">{w}</h4>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-white dark:border-slate-700 shadow-inner">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">বকেয়া মজুরি (DUE)</p>
                    <p className={`text-3xl font-black tracking-tighter italic ${due > 0 ? 'text-black dark:text-white' : 'text-slate-200'}`}>৳{due.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setLedgerModal(w)} className="py-2.5 bg-slate-50 dark:bg-white rounded-xl font-black uppercase text-[9px] tracking-widest italic">লেজার</button>
                    <button onClick={() => setPayModal(w)} className="py-2.5 bg-slate-950 text-white rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-md">পেমেন্ট দিন</button>
                  </div>
                </div>
              );
            });
          }

          const entries = view === 'active' ? activeEntries : historyEntries;
          if (entries.length === 0) {
            return (
              <div className="col-span-full h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 italic">
                <Activity size={48} strokeWidth={1} className="text-slate-100 mb-4" />
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">রেকর্ড পাওয়া যায়নি</p>
              </div>
            );
          }

          return entries.map((item) => (
            <div key={item.id} className="flex flex-col h-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:border-black transition-all group animate-fade-up">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">কারিগর</p>
                  <h4 className="text-lg md:text-xl font-black tracking-tighter uppercase italic truncate max-w-[150px] md:max-w-[200px]">{item.worker}</h4>
                </div>
                <div className={`w-9 h-9 md:w-10 md:h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-inner font-black text-[10px]`}>#{String(item.lotNo).slice(-3)}</div>
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
                  <p className="text-xl md:text-2xl font-black italic tracking-tighter">{(Number(item.issueBorka) || 0) + (Number(item.issueHijab) || 0)} <span className="text-[9px] opacity-40">PCS</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">মজুরি</p>
                  <p className="text-lg md:text-xl font-black italic text-emerald-500 tracking-tighter">৳{item.rate}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => setPrintSlip(item)} className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 rounded-xl flex items-center justify-center shadow-md hover:border-black transition-all"><Printer size={18} /></button>
                {item.status === 'Pending' ? (
                  <button onClick={() => setReceiveModal(item)} className="flex-1 h-12 bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-xl font-black uppercase tracking-widest text-[9px] italic shadow-md hover:bg-emerald-500 transition-all">কাজ জমা (REC)</button>
                ) : (
                  <div className="flex-1 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl flex items-center justify-center font-black uppercase text-[9px] tracking-widest italic border border-emerald-100">RECEIVED {item.receiveDate}</div>
                )}
                {isAdmin && (
                  <button onClick={() => { if(window.confirm('মুছে ফেলতে চান?')) setMasterData(prev => ({ ...prev, productions: prev.productions.filter(p => p.id !== item.id) })) }} className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                )}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-10 relative border border-slate-100 my-auto">
              <button onClick={() => setShowIssueModal(false)} className="absolute top-6 right-6 text-slate-400"><X size={20} /></button>
              <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter text-center">নতুন কাজ <span className="text-blue-600 underline">ইস্যু করুন</span></h2>
              
              <div className="bg-blue-600/5 p-5 rounded-2xl border border-blue-500/10 mb-8 flex flex-col items-center gap-4">
                <div className="w-full space-y-2">
                  <label className="text-[9px] font-black uppercase text-blue-600 tracking-widest ml-2 italic">মাস্টার লট সিন্ক্রোনাইজ করুন (SCAN/SEARCH)</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600" />
                    <input className="premium-input !h-14 !pl-14 !text-xl !font-black !bg-white border-blue-200" placeholder="ENTER LOT NO..." value={lotSearch} onChange={(e) => handleLotSearch(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">কারিগর</label>
                    <select className="premium-input !h-14 font-black uppercase" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                      <option value="">কারিগর নির্বাচন করুন...</option>
                      {workers.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">ডিজাইন</label>
                      <input className="premium-input !h-14 font-black uppercase" value={entryData.design} disabled />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">লট নম্বর</label>
                      <input className="premium-input !h-14 font-black uppercase" value={entryData.lotNo} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">উইথ বোরকা (PCS)</label>
                      <input type="number" className="premium-input !h-14 font-black text-center" value={entryData.issueBorka} onChange={(e) => setEntryData(p => ({ ...p, issueBorka: e.target.value }))} placeholder="0" />
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">উইথ হিজাব (PCS)</label>
                      <input type="number" className="premium-input !h-14 font-black text-center" value={entryData.issueHijab} onChange={(e) => setEntryData(p => ({ ...p, issueHijab: e.target.value }))} placeholder="0" />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">কালার</label>
                      <input className="premium-input !h-14 font-black uppercase" value={entryData.color} disabled />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">সাইজ</label>
                      <input className="premium-input !h-14 font-black uppercase" value={entryData.size} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">মজুরি হার (RATE)</label>
                      <input className="premium-input !h-14 font-black !text-emerald-500" value={entryData.rate} onChange={(e) => setEntryData(p => ({ ...p, rate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">তারিখ</label>
                      <input type="date" className="premium-input !h-14 font-black italic" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                  </div>
                  <textarea className="premium-input !h-16 pt-3 font-black uppercase italic" placeholder="বিঃ দ্রঃ / নোট..." value={entryData.note} onChange={(e) => setEntryData(p => ({ ...p, note: e.target.value }))} />
                </div>
              </div>
              <button onClick={saveIssue} className="w-full mt-8 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-xl">নিশ্চিত করুন (ISSUE TASK)</button>
            </motion.div>
          </div>
        )}

        {receiveModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
              <button onClick={() => setReceiveModal(null)} className="absolute top-6 right-6 text-slate-400"><X size={20} /></button>
              <h2 className="text-xl font-black uppercase italic mb-8 text-center">{receiveModal.worker} <span className="text-emerald-500">জমা নিন</span></h2>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">গ্রহণের তারিখ (RECEIVE DATE)</label>
                    <input type="date" id="rec_date" className="premium-input !h-14 font-black italic" defaultValue={new Date().toISOString().split('T')[0]} />
                 </div>
                 <button onClick={() => setReceive(receiveModal.id, document.getElementById('rec_date').value)} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest italic shadow-lg">জমা সম্পন্ন করুন (CONFIRM)</button>
              </div>
            </motion.div>
          </div>
        )}

        {payModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
               <button onClick={() => setPayModal(null)} className="absolute top-6 right-6 text-slate-400"><X size={20} /></button>
               <h2 className="text-xl font-black uppercase italic mb-8 text-center">{payModal} <span className="text-blue-600">পেমেন্ট দিন</span></h2>
               <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">প্রদেয় বকেয়া</p>
                    <p className="text-4xl font-black tracking-tighter italic">৳{getWorkerDue(payModal).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">পেমেন্ট অ্যামাউন্ট (৳)</label>
                    <input type="number" id="pay_amt" className="premium-input !h-16 !text-3xl font-black text-center" defaultValue={getWorkerDue(payModal)} />
                  </div>
                  <button onClick={() => setPayment(payModal, document.getElementById('pay_amt').value)} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-xl">পেমেন্ট নিশ্চিত করুন (SYNC)</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FactoryPanel;
