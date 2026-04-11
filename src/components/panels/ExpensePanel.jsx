import React, { useState } from "react";
import {
  DollarSign,
  Truck,
  Coffee,
  AlertCircle,
  Calendar,
  Printer,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  UserCheck,
  TrendingUp,
  TrendingDown,
  X,
  ArrowLeft,
  Edit2,
  Archive,
  Search,
  Wallet,
} from "lucide-react";
import WorkerSummary from "../WorkerSummary";
import { syncToSheet } from "../../utils/syncUtils";
import NRZLogo from "../NRZLogo";

const ExpensePanel = ({
  masterData,
  setMasterData,
  initialTab,
  showNotify,
  user,
  setActivePanel,
  t,
  logAction,
}) => {
  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const [selectedCategory, setSelectedCategory] = useState("Tea/Snacks");
  const [editExpense, setEditExpense] = useState(null);
  const [receivePaymentModal, setReceivePaymentModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientLedger, setSelectedClientLedger] = useState(null);

  const getAllWorkerNames = () => {
    const cat = masterData.workerCategories || {};
    const all = [
      ...(cat.sewing || []),
      ...(cat.stone || []),
      ...(cat.pata || []),
      ...(cat.monthly || []),
    ];
    return [...new Set(all)];
  };
  const workerNames = getAllWorkerNames();
  const [showPrint, setShowPrint] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "daily");
  const [summaryDate, setSummaryDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const expenses = masterData.expenses || [];
  const cashEntries = masterData.cashEntries || [];

  const totalCashIn = (cashEntries || []).reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
  
  const workerPaymentTotal = (masterData.workerTransactions || [])
    .filter(t => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = (expenses || []).reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  ) + Number(workerPaymentTotal);

  const currentBalance = totalCashIn - totalExpenses;

  const filteredExpenses = expenses.filter((e) => {
    const matchesDate = activeTab === "daily" ? e.date === summaryDate : true;
    const matchesSearch =
      !searchTerm ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const dailyTotal = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );

  const clientBalances = (masterData.clients || []).map(client => {
     let billed = 0;
     let paid = 0;
     (masterData.clientTransactions || []).filter(t => t.client === client).forEach(t => {
        if(t.type === 'BILL') billed += Number(t.amount);
        if(t.type === 'PAYMENT') paid += Number(t.amount);
     });
     return { client, billed, paid, due: billed - paid };
  }).sort((a,b) => b.due - a.due);

  const handleUpdateExpense = (e) => {
    e.preventDefault();
    const f = e.target;
    const updated = {
      ...editExpense,
      date: f.date.value,
      category: f.category.value,
      description: f.description.value,
      amount: Number(f.amount.value),
    };
    setMasterData((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).map((exp) =>
        exp.id === updated.id ? updated : exp,
      ),
    }));
    logAction(user, 'EXPENSE_EDIT', `Updated expense: ${updated.description} (৳${updated.amount})`);
    setEditExpense(null);
    showNotify("খরচ আপডেট করা হয়েছে!");
  };

  const handleDeleteExpense = (id) => {
    if (!isAdmin) return;
    const exp = (masterData.expenses || []).find(e => e.id === id);
    setMasterData(prev => ({
      ...prev,
      expenses: (prev.expenses || []).filter(e => e.id !== id)
    }));
    logAction(user, 'EXPENSE_DELETE', `Deleted expense: ${exp?.description} (৳${exp?.amount})`);
    showNotify("খরচটি মুছে ফেলা হয়েছে!");
  };

  const handleDeleteCash = (id) => {
    if (!isAdmin) return;
    const cash = (masterData.cashEntries || []).find(c => c.id === id);
    setMasterData(prev => ({
      ...prev,
      cashEntries: (prev.cashEntries || []).filter(c => c.id !== id)
    }));
    logAction(user, 'CASH_DELETE', `Deleted cash entry: ${cash?.description} (৳${cash?.amount})`);
    showNotify("ক্যাশ এন্টি মুছে ফেলা হয়েছে!");
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const f = e.target;
    const newExp = {
      id: "EXP-" + Date.now(),
      date: f.date.value,
      category: f.category.value,
      description: f.description.value,
      amount: Number(f.amount.value),
    };
    setMasterData((prev) => ({
      ...prev,
      expenses: [newExp, ...(prev.expenses || [])],
    }));
    logAction(user, 'EXPENSE_ADD', `Added expense: ${newExp.description} (৳${newExp.amount})`);
    f.reset();
    setActiveTab("daily");
    showNotify("নতুন খরচ সফলভাবে যোগ করা হয়েছে!");
  };

  const handleAddCash = (e) => {
    e.preventDefault();
    const f = e.target;
    const newCash = {
      id: "CASH-" + Date.now(),
      date: f.date.value,
      description: f.description.value,
      amount: Number(f.amount.value),
    };
    setMasterData((prev) => ({
      ...prev,
      cashEntries: [newCash, ...(prev.cashEntries || [])],
    }));
    logAction(user, 'CASH_ADD', `Added cash injection: ${newCash.description} (৳${newCash.amount})`);
    f.reset();
    setActiveTab("daily");
    showNotify("ক্যাশ-ইন সফলভাবে যোগ করা হয়েছে!");
  };

  const handleReceiveClientPayment = (e) => {
    e.preventDefault();
    const f = e.target;
    const amt = Number(f.amount.value);
    if (amt <= 0) return;
    const client = receivePaymentModal;
    const note = f.note.value;
    const dt = new Date().toLocaleDateString("en-GB");

    const txn = { id: `txn_${Date.now()}_P`, date: dt, client, type: 'PAYMENT', amount: amt, note };
    const cash = { id: `CASH-${Date.now()}`, date: dt, description: `B2B PAYMENT: ${client} - ${note}`, amount: amt };

    setMasterData(prev => ({
      ...prev,
      clientTransactions: [txn, ...(prev.clientTransactions || [])],
      cashEntries: [cash, ...(prev.cashEntries || [])]
    }));
    logAction(user, 'CLIENT_PAYMENT_RECEIVE', `Received ৳${amt} from ${client}`);
    setReceivePaymentModal(null);
    showNotify(`${client} থেকে ৳${amt.toLocaleString()} পেমেন্ট ফাণ্ডে যুক্ত করা হয়েছে!`, 'success');
  };

  if (showPrint) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-12 text-black dark:text-white font-outfit uppercase italic animate-fade-in">
        <style>{`@media print { .no-print { display: none !important; } @page { margin: 10mm; size: A4 portrait; } }`}</style>
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="no-print flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50 p-6 md:p-10 rounded-[2rem] border-2 border-slate-100 shadow-xl">
             <div className="flex flex-col items-center md:items-start">
                 <h2 className="text-2xl font-black italic">TREASURY AUDIT</h2>
                 <p className="text-[10px] font-bold opacity-40">Verification of Global Factory Liquidity</p>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
                <button 
                type="button"
                onClick={() => setShowPrint(false)}
                className="flex-1 md:px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 text-black font-black uppercase text-[11px] tracking-widest hover:border-black transition-all"
                >
                BATIL
                </button>
                <button
                onClick={() => window.print()}
                className="flex-[2] md:px-12 py-4 bg-slate-950 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
                >
                <Printer size={18} /> PRINT NOW
                </button>
             </div>
          </div>

          <div className="border-[10px] border-black p-10 md:p-20 rounded-[3rem] relative overflow-hidden bg-white shadow-3xl">
            <div className="flex justify-between items-start border-b-[8px] border-black pb-12 mb-12">
              <div className="space-y-4">
                <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter leading-none mb-3">
                    NRZOONE ACCOUNTING
                    </h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 leading-none">
                    Global Treasury & Account Management Center
                    </p>
                </div>
              </div>
              <div className="text-right italic">
                <p className="text-3xl font-black">{summaryDate}</p>
                <span className="inline-block bg-black text-white px-5 py-1.5 rounded-full text-[9px] font-black mt-3 shadow-lg">
                  VERIFIED AUDIT
                </span>
              </div>
            </div>

            <div className="space-y-8">
              {filteredExpenses.map((exp, i) => (
                <div
                  key={i}
                  className="flex justify-between items-end py-8 border-b-2 border-slate-100"
                >
                  <div className="space-y-2">
                    <p className="text-2xl font-black leading-none uppercase">
                      {exp.description}
                    </p>
                    <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase opacity-70">
                      [{exp.category}] // REF#{exp.id?.slice(-6)}
                    </p>
                  </div>
                  <p className="text-4xl font-black text-black">
                    ৳{exp.amount.toLocaleString()}
                  </p>
                </div>
              ))}
              {filteredExpenses.length === 0 && <div className="py-20 text-center opacity-20 text-xs font-black uppercase tracking-[0.4em]">Zero consumption detected</div>}
            </div>

            <div className="mt-20 pt-12 border-t-[8px] border-black flex justify-between items-center bg-slate-50 p-10 rounded-3xl">
              <div>
                 <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Grand Total Outflow</p>
                 <p className="text-2xl font-black text-black uppercase">Balance Adjustment</p>
              </div>
              <p className="text-5xl font-black text-black">
                ৳{dailyTotal.toLocaleString()}
              </p>
            </div>

            <div className="mt-24 flex justify-between items-center opacity-40 italic">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signature</p>
                  <div className="w-48 h-[1px] bg-black"></div>
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.6em]">ELITE ERP V5.2 // FINANCIAL HUB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-fade-up px-1 md:px-4">
      {/* SaaS Financial HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="saas-card !p-6 md:!p-10 flex flex-col justify-between group h-64 relative overflow-hidden bg-white dark:bg-slate-900 shadow-2xl transition-all hover:-translate-y-2">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all">
             <TrendingUp size={160} />
          </div>
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
            <Wallet size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">TOTAL FACTORY LIQUIDITY</p>
            <h2 className="text-4xl font-black tracking-tighter text-black dark:text-white leading-none">৳{currentBalance.toLocaleString()}</h2>
          </div>
        </div>

        <div className="saas-card !p-6 md:!p-10 flex flex-col justify-between group h-64 relative overflow-hidden bg-white dark:bg-slate-900 shadow-2xl transition-all hover:-translate-y-2">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all">
             <TrendingDown size={160} />
          </div>
          <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-500/20 group-hover:rotate-6 transition-transform">
            <DollarSign size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">TOTAL BURN RATE</p>
            <h2 className="text-4xl font-black tracking-tighter text-black dark:text-white leading-none">৳{totalExpenses.toLocaleString()}</h2>
          </div>
        </div>

        <button 
          onClick={() => setShowPrint(true)}
          className="saas-card !p-6 md:!p-10 flex flex-col justify-between group h-64 relative overflow-hidden bg-slate-950 text-white border-none shadow-2xl transition-all hover:-translate-y-2"
        >
          <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
            <Printer size={24} />
          </div>
          <div className="text-left relative z-10">
            <h2 className="text-3xl font-black text-white italic uppercase mb-2">GENERATE AUDIT</h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Official Financial Transcript</p>
          </div>
        </button>
      </div>

      {/* Control Bar */}
      <div className="saas-card !p-4 flex flex-col lg:flex-row items-center justify-between gap-6 border-blue-500/10 shadow-xl">
        <div className="pill-nav w-full lg:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'daily', label: 'ডেইলি খরচ' },
            { id: 'all', label: 'ক্যাশ হিস্ট্রি' },
            { id: 'new', label: 'টাকা খরচ (-)' },
            isAdmin && { id: 'cashIn', label: 'টাকা ইন (+)' },
            isAdmin && { id: 'clientLedger', label: 'বকেয়া হিসাব' },
            { id: 'worker', label: 'শিল্পী পেমেন্ট' }
          ].filter(Boolean).map(v => (
            <button
              key={v.id}
              onClick={() => setActiveTab(v.id)}
              className={`pill-tab ${activeTab === v.id ? 'pill-tab-active' : 'text-slate-400 hover:text-black dark:hover:text-white'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="SEARCH AUDIT..."
              className="premium-input !pl-14 !h-14 !text-[11px] !bg-slate-50 dark:!bg-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'daily' && (
             <input
                type="date"
                className="premium-input !h-14 !w-44 !px-4 !text-[11px] !bg-slate-950 !text-white !border-none text-center"
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
            />
          )}
        </div>
      </div>

      {activeTab === "new" && (
        <div className="flex justify-center animate-fade-up">
           <div className="saas-card w-full max-w-2xl !p-10 md:!p-16 space-y-12">
              <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-3xl rotate-12 mb-8 animate-bounce">
                    <TrendingDown size={32} />
                  </div>
                  <h3 className="text-4xl font-black tracking-tight text-black dark:text-white uppercase italic leading-none">CONSUMPTION AUDIT</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Record operational outflow</p>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic">Category Node</label>
                        <select name="category" className="premium-input !h-16 !text-xs font-black uppercase italic bg-slate-50 dark:bg-slate-900" required>
                             {["teaSnacks", "transport", "material", "utilities", "salary", "bonus", "others"].map(c => <option key={c} value={c}>{t(c)}</option>)}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic">Timeline</label>
                        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input !h-16 !text-xs font-black !bg-slate-950 !text-white !border-none text-center" required />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic">Memo / Reason</label>
                    <input name="description" placeholder="ENTER CONSUMPTION DETAILS..." className="premium-input !h-16 !text-xs font-black italic uppercase bg-slate-50 dark:bg-slate-900" required />
                 </div>
                 <div className="bg-slate-950 p-12 rounded-[2.5rem] shadow-3xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <DollarSign size={100} className="text-white" />
                    </div>
                    <label className="text-[12px] font-black text-white/30 uppercase tracking-[0.8em] mb-6 block">LIQUID AMOUNT</label>
                    <div className="flex items-center justify-center text-white">
                        <span className="text-4xl font-black text-white/20 mr-4">৳</span>
                        <input name="amount" type="number" placeholder="0" className="w-full text-center text-8xl font-black bg-transparent border-none text-white outline-none leading-none h-24" required />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-8 bg-rose-600 text-white rounded-[2rem] shadow-3xl border-b-[8px] border-rose-900 hover:scale-[1.03] active:scale-95 transition-all text-2xl font-black uppercase italic tracking-wider">Execute Transaction</button>
              </form>
           </div>
        </div>
      )}

      {activeTab === "cashIn" && (
        <div className="flex justify-center animate-fade-up">
           <div className="saas-card w-full max-w-2xl !p-10 md:!p-16 space-y-12">
              <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-3xl -rotate-12 mb-8 animate-bounce">
                    <TrendingUp size={32} />
                  </div>
                  <h3 className="text-4xl font-black tracking-tight text-black dark:text-white uppercase italic leading-none">CASH INJECTION</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Record capital inflow</p>
              </div>
              <form onSubmit={handleAddCash} className="space-y-10">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic">Deposit Timeline</label>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input !h-16 !text-xs font-black !bg-slate-950 !text-white !border-none text-center" required />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic">Source Entity / Note</label>
                    <input name="description" placeholder="ENTER SOURCE DETAILS..." className="premium-input !h-16 !text-xs font-black italic uppercase bg-slate-50 dark:bg-slate-900" required />
                 </div>
                 <div className="bg-slate-950 p-12 rounded-[2.5rem] shadow-3xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-8 opacity-5">
                       <TrendingUp size={100} className="text-white" />
                    </div>
                    <label className="text-[12px] font-black text-white/30 uppercase tracking-[0.8em] mb-6 block">INJECTION AMOUNT</label>
                    <div className="flex items-center justify-center text-white">
                        <span className="text-4xl font-black text-white/20 mr-4">৳</span>
                        <input name="amount" type="number" placeholder="0" className="w-full text-center text-8xl font-black bg-transparent border-none text-white outline-none leading-none h-24" required />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-8 bg-emerald-600 text-white rounded-[2rem] shadow-3xl border-b-[8px] border-emerald-900 hover:scale-[1.03] active:scale-95 transition-all text-2xl font-black uppercase italic tracking-wider">Authorize Deposit</button>
              </form>
           </div>
        </div>
      )}

      {activeTab === "daily" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredExpenses.length === 0 ? (
                <div className="col-span-full py-32 flex flex-col items-center justify-center saas-card border-2 border-dashed border-slate-200 dark:border-slate-800 opacity-60">
                <Archive size={64} strokeWidth={1} className="text-slate-300 mb-8" />
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic">No active audit records found</p>
                </div>
            ) : (
                filteredExpenses.map((exp, idx) => (
                <div key={exp.id || idx} className="saas-card !p-8 flex flex-col justify-between h-80 group hover:border-slate-950 dark:hover:border-white transition-all relative overflow-hidden shadow-xl animate-fade-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <DollarSign size={160} />
                    </div>
                    <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-8 text-black dark:text-white">
                        <span className="px-4 py-1.5 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                        {exp.category}
                        </span>
                        <div className="flex gap-2">
                             <button onClick={() => setEditExpense(exp)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-950 hover:text-white transition-all">
                                <Edit2 size={14} />
                            </button>
                            {isAdmin && (
                                <button onClick={() => handleDeleteExpense(exp.id)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-rose-600 hover:text-white transition-all">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <h5 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase leading-[1.1] italic mb-4">
                        {exp.description}
                    </h5>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                        <Calendar size={13} className="text-blue-600" /> {exp.date}
                    </p>
                    </div>
                    <div className="relative z-10 mt-auto flex justify-between items-center text-black dark:text-white">
                    <p className="text-4xl font-black italic tracking-tighter">
                        ৳{exp.amount.toLocaleString()}
                    </p>
                    <ArrowUpRight size={24} className="opacity-10 group-hover:opacity-100 transition-opacity text-blue-600" />
                    </div>
                </div>
                ))
            )}
        </div>
      )}

      {activeTab === "all" && (
         <div className="saas-card !p-0 overflow-hidden shadow-2xl animate-fade-up border-emerald-500/10">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50/10">
                 <div>
                    <h3 className="text-xl font-black italic uppercase text-emerald-600">Cash Injection History</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Audit of capital inflow events</p>
                 </div>
                 <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={18} />
                 </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <th className="px-8 py-6">Timeline</th>
                            <th className="px-8 py-6">Legal Entity / Source</th>
                            <th className="px-8 py-6 text-right">Inflow Amount</th>
                            {isAdmin && <th className="px-8 py-6 text-center">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {cashEntries.map((cash, i) => (
                            <tr key={cash.id || i} className="group hover:bg-emerald-50/5 transition-colors">
                                <td className="px-8 py-6 text-[11px] font-black uppercase italic">{cash.date}</td>
                                <td className="px-8 py-6 text-sm font-bold uppercase text-slate-950 dark:text-white">{cash.description}</td>
                                <td className="px-8 py-6 text-right font-black text-xl text-emerald-600 italic">৳ {cash.amount.toLocaleString()}</td>
                                {isAdmin && (
                                    <td className="px-8 py-6 text-center">
                                         <button onClick={() => handleDeleteCash(cash.id)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-rose-600 hover:text-white transition-all shadow-sm mx-auto">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {cashEntries.length === 0 && <div className="py-24 text-center italic opacity-30 text-xs font-black uppercase tracking-widest">No capital injection logs audited</div>}
             </div>
         </div>
      )}

       {activeTab === "clientLedger" && (
         <div className="space-y-12 animate-fade-up">
            {!selectedClientLedger ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {clientBalances.map((item, idx) => (
                    <div key={idx} className="saas-card bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between group h-[320px] border-l-[12px] border-l-slate-950 hover:border-l-blue-600 transition-all cursor-pointer relative overflow-hidden" onClick={() => setSelectedClientLedger(item.client)}>
                        <div className="absolute -top-10 -right-10 p-20 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                             <UserCheck size={200} />
                        </div>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3 italic underline decoration-blue-500/50">Contract Entity</p>
                             <h3 className="text-3xl font-black italic tracking-tighter text-slate-950 dark:text-white leading-[1] uppercase max-w-[200px]">{item.client}</h3>
                          </div>
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                            <Users size={24} />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 pb-6 border-b-2 border-slate-50 dark:border-slate-800 relative z-10">
                           <div>
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Total Billed</p>
                              <p className="font-black text-xl text-slate-950 dark:text-white tabular-nums">৳ {item.billed.toLocaleString()}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Settled Fund</p>
                              <p className="font-black text-xl text-emerald-600 tabular-nums">৳ {item.paid.toLocaleString()}</p>
                           </div>
                        </div>
  
                        <div className="flex justify-between items-center mt-6 relative z-10">
                           <div>
                              <p className="text-[10px] font-black uppercase text-rose-500 tracking-[0.4em] mb-2 leading-none">REMAINING DUE</p>
                              <p className="font-black text-4xl text-rose-600 leading-none tracking-tighter italic tabular-nums">৳ {item.due.toLocaleString()}</p>
                           </div>
                           <div className="flex gap-3">
                             <button 
                                 onClick={(e) => { e.stopPropagation(); setReceivePaymentModal(item.client); }}
                                 className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
                                 title="Receive Fund"
                             >
                                 <Plus size={24} />
                             </button>
                             <button 
                                 className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                                 title="Open Ledger"
                             >
                                 <FileText size={22} />
                             </button>
                           </div>
                        </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="saas-card bg-white dark:bg-slate-900 animate-fade-in relative !p-12 shadow-3xl border-2 border-slate-100 dark:border-slate-800 rounded-[3rem]">
                <button 
                  onClick={() => setSelectedClientLedger(null)}
                  className="absolute top-10 right-10 w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-lg"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="mb-14 flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl">
                        <Users size={32} />
                    </div>
                    <div>
                        <h3 className="text-4xl font-black italic tracking-tighter text-slate-950 dark:text-white uppercase leading-none mb-2">{selectedClientLedger}</h3>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none underline decoration-blue-500/50">Full Audit Sequence Record</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] border-b-4 border-slate-100 dark:border-slate-800">
                                <th className="py-8 px-4">Timeline</th>
                                <th className="py-8 px-4">Audit Node</th>
                                <th className="py-8 px-4">Transaction Memo</th>
                                <th className="py-8 px-4 text-right">Debit / Credit Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-800">
                            {(masterData.clientTransactions || [])
                                .filter(t => t.client === selectedClientLedger)
                                .sort((a,b) => new Date(b.date?.split('/').reverse().join('-')) - new Date(a.date?.split('/').reverse().join('-')))
                                .map((t, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="py-8 px-4 text-[12px] font-black uppercase italic tabular-nums">{t.date}</td>
                                        <td className="py-8 px-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm ${t.type === 'BILL' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="py-8 px-4 text-[11px] font-bold uppercase text-slate-500 max-w-sm truncate italic opacity-80">{t.note}</td>
                                        <td className={`py-8 px-4 text-right font-black text-2xl tabular-nums ${t.type === 'BILL' ? 'text-rose-600' : 'text-emerald-600 italic'}`}>
                                            {t.type === 'BILL' ? '-' : '+'} ৳ {t.amount?.toLocaleString()}
                                        </td>
                                    </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )}
         </div>
      )}

      {activeTab === "worker" && (
          <div className="animate-fade-up">
              <WorkerSummary masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} />
          </div>
      )}

      {/* Global Secondary Return Action */}
      <div className="flex justify-center pt-24 pb-12">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-10 bg-white dark:bg-slate-900 px-12 md:px-20 py-8 rounded-[3rem] border-4 border-slate-100 dark:border-slate-800 shadow-3xl hover:border-slate-950 dark:hover:border-white transition-all duration-700"
        >
          <div className="w-14 h-14 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl group-hover:rotate-12 transition-transform shadow-2xl flex items-center justify-center">
            <ArrowLeft size={24} strokeWidth={4} />
          </div>
          <span className="text-2xl font-black uppercase italic tracking-[0.3em] text-slate-950 dark:text-white">
            MASTER HUD
          </span>
        </button>
      </div>

      {editExpense && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xl z-[400] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-10 md:p-16 space-y-12 animate-fade-up shadow-3xl relative">
                <button onClick={() => setEditExpense(null)} className="absolute top-10 right-10 text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <div className="text-center space-y-4">
                   <div className="mx-auto w-20 h-20 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] flex items-center justify-center shadow-3xl rotate-12 mb-8">
                    <Edit2 size={32} />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic leading-none text-slate-950 dark:text-white">REVISE AUDIT</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] leading-none">Internal Ledger Adjustment</p>
                </div>
                <form onSubmit={handleUpdateExpense} className="space-y-10">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic tracking-widest">Timeline</label>
                        <input name="date" type="date" defaultValue={editExpense.date} className="premium-input !h-16 font-black !bg-slate-950 text-white border-none text-center" required />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic tracking-widest">Category</label>
                        <select name="category" defaultValue={editExpense.category} className="premium-input !h-16 font-black uppercase italic bg-slate-50 dark:bg-slate-900" required>
                             {["teaSnacks", "transport", "material", "utilities", "salary", "bonus", "others"].map(c => <option key={c} value={c}>{t(c)}</option>)}
                        </select>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic tracking-widest">Audit Memo</label>
                      <input name="description" defaultValue={editExpense.description} className="premium-input !h-16 font-black uppercase italic bg-slate-50 dark:bg-slate-900" required />
                   </div>
                   <div className="bg-slate-950 p-12 rounded-[2.5rem] shadow-3xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <DollarSign size={100} className="text-white" />
                    </div>
                    <label className="text-[12px] font-black text-white/30 uppercase tracking-[0.8em] mb-6 block">ADJUSTED LIQUIDITY</label>
                    <div className="flex items-center justify-center text-white">
                        <span className="text-3xl font-black text-white/20 mr-4">৳</span>
                        <input name="amount" type="number" defaultValue={editExpense.amount} className="w-full text-center text-8xl font-black bg-transparent border-none text-white outline-none leading-none h-24" required />
                    </div>
                  </div>
                   <div className="flex gap-4">
                      <button type="button" onClick={() => setEditExpense(null)} className="flex-1 py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] bg-white border-2 border-slate-100 text-slate-400 hover:text-black hover:border-black transition-all">ABORT</button>
                      <button type="submit" className="flex-[2] py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] bg-blue-600 text-white shadow-2xl border-b-[8px] border-blue-900 transition-all active:scale-95">COMMIT REVISION</button>
                   </div>
                </form>
           </div>
        </div>
      )}

      {receivePaymentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xl z-[400] flex items-center justify-center p-4">
           <div className="saas-card bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-3xl p-12 md:p-16 animate-fade-up relative">
                <button onClick={() => setReceivePaymentModal(null)} className="absolute top-10 right-10 text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <div className="text-center space-y-4 mb-12">
                   <div className="mx-auto w-24 h-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-3xl rotate-12 mb-8 animate-pulse">
                    <Wallet size={36} />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic leading-none text-slate-950 dark:text-white">RECEIVE B2B FUND</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] leading-none mb-6">Deposit Authorization Sequence</p>
                  <div className="inline-block bg-blue-600/10 text-blue-600 py-3 px-8 rounded-full border border-blue-600/20 text-xs font-black uppercase tracking-widest shadow-sm">
                     COLLECTING FROM: {receivePaymentModal}
                  </div>
                </div>
                <form onSubmit={handleReceiveClientPayment} className="space-y-8">
                   <div className="bg-slate-950 p-12 rounded-[2.5rem] shadow-3xl text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp size={100} className="text-white" />
                        </div>
                        <label className="text-[12px] font-black text-white/30 uppercase tracking-[0.8em] mb-6 block">LIQUID DEPOSIT</label>
                        <div className="flex items-center justify-center text-white">
                            <span className="text-4xl font-black text-white/20 mr-4">৳</span>
                            <input name="amount" type="number" placeholder="0" className="w-full text-center text-8xl font-black bg-transparent border-none text-white outline-none leading-none h-24" required autoFocus />
                        </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 ml-5 uppercase italic tracking-widest">Transaction Memo</label>
                      <input name="note" placeholder="E.G. BANK TRANSFER / CASH DEPOSIT" className="premium-input !h-16 uppercase text-xs font-black bg-slate-50 dark:bg-slate-900 text-center" required />
                   </div>
                   <div className="flex gap-4 pt-6">
                      <button type="button" onClick={() => setReceivePaymentModal(null)} className="flex-1 py-6 rounded-2xl font-black uppercase text-[12px] tracking-widest text-slate-400 hover:text-black transition-all">ABORT</button>
                      <button type="submit" className="flex-[2] py-6 bg-emerald-600 text-white rounded-[2rem] shadow-3xl font-black uppercase text-[12px] tracking-[0.2em] border-b-[8px] border-emerald-900 active:scale-95 transition-all">AUTHORIZE RECEIPT</button>
                   </div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePanel;

