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
  ArrowUpRight,
  Users,
  Activity,
  Share2,
  ShieldCheck,
  Database
} from "lucide-react";
import WorkerSummary from "../WorkerSummary";
import BusinessIntel from "../BusinessIntel";
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
  onSyncGoogle,
}) => {
  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const [editExpense, setEditExpense] = useState(null);
  const [receivePaymentModal, setReceivePaymentModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientLedger, setSelectedClientLedger] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "treasury");
  const [cashSubTab, setCashSubTab] = useState("daily");
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split("T")[0]);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const expenses = masterData.expenses || [];
  const cashEntries = masterData.cashEntries || [];

  const totalClientPayments = (masterData.clientTransactions || [])
    .filter(t => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalCashIn = (cashEntries || []).reduce((sum, entry) => sum + Number(entry.amount), 0) + totalClientPayments;
  
  const workerPaymentTotal = (masterData.workerTransactions || [])
    .filter(t => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = (expenses || []).reduce((sum, entry) => sum + Number(entry.amount), 0) + Number(workerPaymentTotal);
  const currentBalance = totalCashIn - totalExpenses;

  const filteredExpenses = expenses.filter((e) => {
    const matchesDate = cashSubTab === "daily" ? e.date === summaryDate : true;
    const matchesSearch = !searchTerm || e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const dailyTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
    const updated = { ...editExpense, date: f.date.value, category: f.category.value, description: f.description.value, amount: Number(f.amount.value) };
    setMasterData((prev) => ({ ...prev, expenses: (prev.expenses || []).map((exp) => exp.id === updated.id ? updated : exp) }));
    logAction(user, 'EXPENSE_EDIT', `Updated expense: ${updated.description} (৳${updated.amount})`);
    setEditExpense(null);
    showNotify("খরচ আপডেট করা হয়েছে!");
  };

  const handleDeleteExpense = (id) => {
    if (!isAdmin) return;
    const exp = (masterData.expenses || []).find(e => e.id === id);
    setMasterData(prev => ({ ...prev, expenses: (prev.expenses || []).filter(e => e.id !== id) }));
    logAction(user, 'EXPENSE_DELETE', `Deleted expense: ${exp?.description} (৳${exp?.amount})`);
    showNotify("খরচটি মুছে ফেলা হয়েছে!");
  };

  const handleDeleteCash = (id) => {
    if (!isAdmin) return;
    const cash = (masterData.cashEntries || []).find(c => c.id === id);
    setMasterData(prev => ({ ...prev, cashEntries: (prev.cashEntries || []).filter(c => c.id !== id) }));
    logAction(user, 'CASH_DELETE', `Deleted cash entry: ${cash?.description} (৳${cash?.amount})`);
    showNotify("ক্যাশ এন্টি মুছে ফেলা হয়েছে!");
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const f = e.target;
    const newExp = { id: "EXP-" + Date.now(), date: f.date.value, category: f.category.value, description: f.description.value, amount: Number(f.amount.value) };
    setMasterData((prev) => ({ ...prev, expenses: [newExp, ...(prev.expenses || [])] }));
    logAction(user, 'EXPENSE_ADD', `Added expense: ${newExp.description} (৳${newExp.amount})`);
    f.reset();
    setCashSubTab("daily");
    showNotify("নতুন খরচ সফলভাবে যোগ করা হয়েছে!");
  };

  const handleAddCash = (e) => {
    e.preventDefault();
    const f = e.target;
    const newCash = { id: "CASH-" + Date.now(), date: f.date.value, description: f.description.value, amount: Number(f.amount.value) };
    setMasterData((prev) => ({ ...prev, cashEntries: [newCash, ...(prev.cashEntries || [])] }));
    logAction(user, 'CASH_ADD', `Added cash injection: ${newCash.description} (৳${newCash.amount})`);
    f.reset();
    setCashSubTab("all");
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
    showNotify(`${client} থেকে ৳${amt.toLocaleString()} পেমেন্ট ফাণ্ডে যুক্ত করা হয়েছে!`);
  };

  if (showPrint) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-12 text-black font-outfit uppercase italic animate-fade-in">
        <style>{`@media print { .no-print { display: none !important; } @page { margin: 10mm; size: A4 portrait; } }`}</style>
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="no-print flex justify-between items-center bg-slate-50 p-10 rounded-[2.5rem] shadow-xl border-2 border-slate-100">
             <div className="space-y-1"><h2 className="text-3xl font-black italic">FINANCIAL AUDIT</h2><p className="text-[10px] font-bold opacity-40 tracking-widest uppercase">Verified Factory Liquidity Report</p></div>
             <div className="flex gap-4"><button onClick={() => setShowPrint(false)} className="px-10 py-5 bg-white border-4 border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest">CANCEL</button><button onClick={() => window.print()} className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><Printer size={18} /> PRINT RECORD</button></div>
          </div>
          <div className="border-[15px] border-black p-16 rounded-[4rem] relative overflow-hidden bg-white shadow-4xl text-black">
            <div className="flex justify-between items-start border-b-[10px] border-black pb-14 mb-14">
              <div className="space-y-4">
                <div className="w-20 h-2 bg-blue-600"></div>
                <div><h1 className="text-5xl font-black italic tracking-tighter leading-none mb-3">NRZOONE FACTORY HUB</h1><p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400">Global Operational Treasury Ledger</p></div>
              </div>
              <div className="text-right italic"><p className="text-4xl font-black leading-none">{summaryDate}</p><span className="inline-block bg-black text-white px-6 py-2 rounded-full text-[10px] font-black mt-4">VERIFIED AUDIT</span></div>
            </div>
            <div className="space-y-10">
              {filteredExpenses.map((exp, i) => (
                <div key={i} className="flex justify-between items-end py-10 border-b-4 border-slate-50"><div className="space-y-3"><p className="text-3xl font-black leading-none uppercase italic">{exp.description}</p><p className="text-[11px] font-bold text-blue-600 tracking-widest">[{exp.category}] // REF#{exp.id?.slice(-6)}</p></div><p className="text-5xl font-black">৳{exp.amount.toLocaleString()}</p></div>
              ))}
              {filteredExpenses.length === 0 && <div className="py-24 text-center opacity-20 text-xs font-black uppercase tracking-[0.5em]">No activity detected within the selected cycle</div>}
            </div>
            <div className="mt-20 pt-16 border-t-[10px] border-black flex justify-between items-center bg-slate-50 p-12 rounded-[3rem]">
              <div><p className="text-[12px] font-black uppercase tracking-widest opacity-40">Grand Total Consumption</p><p className="text-3xl font-black italic uppercase">Verified Audit Balance</p></div>
              <p className="text-7xl font-black">৳{dailyTotal.toLocaleString()}</p>
            </div>
            <div className="mt-24 flex justify-between items-center opacity-40 italic font-black text-[12px] uppercase">
               <div className="space-y-2"><p className="mb-4">Authorized Signature</p><div className="w-64 h-1 bg-black"></div></div>
               <p className="tracking-[0.8em]">Elite ERP v5.2 // Factory Hub Secure</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in no-scrollbar transition-all duration-1000">
      {/* 🚀 Master Navigation Hub */}
      <div className="bg-white dark:bg-slate-900 !p-2 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-3xl flex flex-wrap gap-2 sticky top-0 z-50 backdrop-blur-3xl bg-white/80 dark:bg-slate-900/80">
         {[
            { id: 'treasury', label: 'Treasury (ক্যাশ)', icon: Wallet },
            { id: 'partners', label: 'Partners (বি২বি)', icon: Users },
            { id: 'workforce', label: 'Workforce (শ্রমিক)', icon: UserCheck },
            { id: 'analytics', label: 'Analytics (রিপোর্ট)', icon: TrendingUp },
            { id: 'system', label: 'System (নিরাপত্তা)', icon: ShieldCheck }
         ].map(tab => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all duration-700 ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-2xl scale-105 -rotate-1' : 'text-slate-400 hover:text-black dark:hover:text-white'}`}
            >
               <tab.icon size={18} className={activeTab === tab.id ? 'animate-pulse' : ''} /> {tab.label}
            </button>
         ))}
      </div>

      {/* 💰 1. Treasury Module (Financial Hub) */}
      {activeTab === 'treasury' && (
        <div className="space-y-10 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="saas-card !p-12 flex flex-col justify-between group h-80 relative overflow-hidden bg-white dark:bg-slate-900 shadow-4xl border-emerald-500/10 hover:border-emerald-500/30">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-1000"><TrendingUp size={240} /></div>
              <div className="w-18 h-18 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-33xl shadow-emerald-500/30 rotate-3 group-hover:rotate-12 transition-transform"><Wallet size={32} /></div>
              <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] mb-4 italic">Factory Liquid Capital</p>
                <h2 className="text-6xl font-black tracking-tighter text-black dark:text-white leading-none italic">৳{currentBalance.toLocaleString()}</h2>
              </div>
            </div>

            <div className="saas-card !p-12 flex flex-col justify-between group h-80 relative overflow-hidden bg-white dark:bg-slate-900 shadow-4xl border-rose-500/10 hover:border-rose-500/30">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-1000"><TrendingDown size={240} /></div>
              <div className="w-18 h-18 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-33xl shadow-rose-500/30 -rotate-3 group-hover:rotate-0 transition-transform"><DollarSign size={32} /></div>
              <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] mb-4 italic">Operational Burn Rate</p>
                <h2 className="text-6xl font-black tracking-tighter text-black dark:text-white leading-none italic">৳{totalExpenses.toLocaleString()}</h2>
              </div>
            </div>

            <button onClick={() => setShowPrint(true)} className="saas-card !p-12 flex flex-col justify-between group h-80 relative overflow-hidden bg-slate-950 text-white border-none shadow-5xl hover:scale-105 active:scale-95 transition-all">
              <div className="w-18 h-18 bg-white/10 text-white rounded-[2rem] flex items-center justify-center shadow-inner group-hover:bg-blue-600 transition-all"><Printer size={32} /></div>
              <div className="text-left relative z-10">
                <h2 className="text-5xl font-black text-white italic uppercase mb-3 leading-none italic tracking-tighter">GENERATE AUDIT</h2>
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em] italic">Official Financial Transcript Registry</p>
              </div>
            </button>
          </div>

          <div className="saas-card !p-6 flex flex-col lg:flex-row items-center justify-between gap-8 border-slate-100 dark:border-slate-800 shadow-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl">
            <div className="flex gap-4 overflow-x-auto no-scrollbar w-full lg:w-auto">
              {['daily', 'all', 'new', isAdmin && 'cashIn'].filter(Boolean).map(v => (
                <button key={v} onClick={() => setCashSubTab(v)} className={`px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 italic ${cashSubTab === v ? 'bg-black text-white shadow-2xl scale-105' : 'bg-slate-50 text-slate-400 hover:text-black'}`}>
                  {v === 'daily' ? ' DAILY LOG ' : v === 'all' ? ' INJECTION HISTORY ' : v === 'new' ? ' BURN $(-)$ ' : ' INJECT $(+)$ '}
                </button>
              ))}
            </div>
            <div className="flex gap-6 w-full lg:w-auto items-center">
              <div className="relative flex-1 lg:w-96"><Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input placeholder="SEARCH GLOBAL AUDIT..." className="premium-input !pl-20 !h-20 !text-[13px] !bg-slate-50 !border-none font-black italic shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              {cashSubTab === 'daily' && <input type="date" className="premium-input !h-20 !w-56 !bg-slate-950 !text-white !border-none text-center !rounded-[1.5rem] font-bold shadow-4xl" value={summaryDate} onChange={e => setSummaryDate(e.target.value)} />}
            </div>
          </div>

          {cashSubTab === 'daily' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredExpenses.map((exp, idx) => (
                <div key={exp.id || idx} className="saas-card !p-12 h-96 flex flex-col justify-between group hover:shadow-5xl hover:-translate-y-4 transition-all duration-700 relative overflow-hidden bg-white shadow-3xl animate-fade-up border-b-[15px] border-b-slate-100 italic" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:opacity-10 transition-opacity"><DollarSign size={200} /></div>
                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-12">
                      <span className="px-6 py-2.5 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-3xl">{exp.category}</span>
                      <div className="flex gap-4">
                        <button onClick={() => setEditExpense(exp)} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-black hover:text-white transition-all shadow-xl"><Edit2 size={18} /></button>
                        {isAdmin && <button onClick={() => handleDeleteExpense(exp.id)} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-rose-600 hover:text-white transition-all shadow-xl"><Trash2 size={18} /></button>}
                      </div>
                    </div>
                    <h5 className="text-4xl font-black uppercase leading-none italic text-slate-950 mb-8 tracking-tighter truncate">{exp.description}</h5>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4"><Calendar size={16} className="text-blue-600" /> {exp.date} // {exp.id?.slice(-8)}</p>
                  </div>
                  <div className="relative z-10 mt-auto flex justify-between items-end"><p className="text-5xl font-black italic tracking-tighter text-slate-950">৳{exp.amount.toLocaleString()}</p><ArrowUpRight className="text-blue-600 opacity-20 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" size={32} /></div>
                </div>
              ))}
              {filteredExpenses.length === 0 && <div className="col-span-full py-52 saas-card bg-white border-4 border-dashed opacity-20 flex flex-col items-center justify-center italic font-black uppercase tracking-[1em]"><Archive size={100} strokeWidth={1} className="mb-10" /> NO AUDIT RECORD FOUND</div>}
            </div>
          )}

          {cashSubTab === 'all' && (
            <div className="saas-card !p-0 overflow-hidden shadow-4xl border-emerald-500/10 bg-white">
              <div className="p-12 border-b-8 border-slate-50 flex justify-between items-center bg-emerald-50/20 backdrop-blur-xl">
                <div><h3 className="text-3xl font-black italic uppercase text-emerald-600 leading-none mb-3">Capital Flow Registry</h3><p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Historical Inflow Sequence Records</p></div>
                <TrendingUp size={44} className="text-emerald-500 animate-pulse" />
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="text-[12px] font-black uppercase text-slate-400 tracking-[0.4em] border-b-6 border-slate-50 bg-slate-50/30 font-mono"><th className="px-12 py-10">Historical Timeline</th><th className="px-12 py-10">Source Entity Node</th><th className="px-12 py-10 text-right">Inflow Value</th>{isAdmin && <th className="px-12 py-10 text-center">Global Action</th>}</tr></thead><tbody className="divide-y-4 divide-slate-50">{cashEntries.map((cash, i) => (<tr key={cash.id || i} className="group hover:bg-emerald-50/10 transition-all duration-500"><td className="px-12 py-10 font-black uppercase italic text-sm tabular-nums">{cash.date}</td><td className="px-12 py-10 font-black uppercase text-slate-900 leading-none italic">{cash.description}</td><td className="px-12 py-10 text-right font-black text-4xl text-emerald-600 italic tracking-tighter">৳{cash.amount.toLocaleString()}</td>{isAdmin && (<td className="px-12 py-10 text-center"><button onClick={() => handleDeleteCash(cash.id)} className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-slate-300 hover:bg-rose-600 hover:text-white shadow-2xl transition-all mx-auto active:scale-95"><Trash2 size={24} /></button></td>)}</tr>))}</tbody></table></div>
            </div>
          )}

          {(cashSubTab === 'new' || cashSubTab === 'cashIn') && (
            <div className="flex justify-center"><form onSubmit={cashSubTab === 'new' ? handleAddExpense : handleAddCash} className="saas-card w-full max-w-4xl !p-24 space-y-16 animate-fade-up border-[15px] border-slate-50 shadow-5xl relative overflow-hidden italic"><div className="text-center space-y-8"><div className={`mx-auto w-32 h-32 text-white rounded-[3.5rem] flex items-center justify-center shadow-5xl rotate-12 mb-12 animate-bounce ${cashSubTab === 'new' ? 'bg-rose-600' : 'bg-emerald-600'}`}>{cashSubTab === 'new' ? <TrendingDown size={52} /> : <TrendingUp size={52} />}</div><h3 className="text-7xl font-black text-black uppercase italic leading-none tracking-tighter">{cashSubTab === 'new' ? 'CONSUMPTION' : 'INJECTION'}</h3><p className="text-[13px] font-black text-slate-400 uppercase tracking-[1em] italic leading-none">{cashSubTab === 'new' ? 'Operational Burn Sequence' : 'Capital Growth Protocol'}</p></div><div className="grid grid-cols-2 gap-12">{cashSubTab === 'new' && <div className="space-y-6"><label className="text-[13px] font-black text-slate-400 ml-10 uppercase italic tracking-widest leading-none">Category Node</label><select name="category" className="premium-input !h-24 !text-sm font-black uppercase italic bg-slate-50 rounded-[2rem] shadow-inner" required>{["teaSnacks", "transport", "material", "utilities", "salary", "bonus", "others"].map(c => <option key={c} value={c}>{t(c)}</option>)}</select></div>}<div className="space-y-6"><label className="text-[13px] font-black text-slate-400 ml-10 uppercase italic tracking-widest leading-none">Timeline Protocol</label><input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input !h-24 !bg-slate-950 !text-white !border-none text-center rounded-[2rem] shadow-4xl text-xl" required /></div></div><div className="space-y-6"><label className="text-[13px] font-black text-slate-400 ml-10 uppercase italic tracking-widest leading-none">Transaction Memo Registry</label><input name="description" placeholder="ENTER TRANSACTION METADATA..." className="premium-input !h-24 !text-sm font-black italic uppercase bg-slate-50 rounded-[2rem] shadow-inner" required /></div><div className="bg-slate-950 p-24 rounded-[4.5rem] shadow-5xl text-center relative overflow-hidden"><div className="absolute top-0 right-0 p-16 opacity-10 text-white"><DollarSign size={200} /></div><label className="text-[15px] font-black text-white/30 uppercase tracking-[1.5em] mb-12 block italic leading-none">LIQUIDITY VALUE</label><div className="flex items-center justify-center text-white"><span className="text-7xl font-black text-white/20 mr-12 italic">৳</span><input name="amount" type="number" placeholder="0" className="w-full text-center text-[12rem] font-black bg-transparent border-none text-white outline-none leading-none h-48 italic tracking-tighter" required autoFocus /></div></div><button type="submit" className={`w-full py-12 rounded-[3.5rem] shadow-5xl border-b-[15px] transition-all text-5xl font-black uppercase italic active:scale-95 leading-none ${cashSubTab === 'new' ? 'bg-rose-600 border-rose-900 text-white' : 'bg-emerald-600 border-emerald-900 text-white'}`}>{cashSubTab === 'new' ? 'EXECUTE BURN' : 'COMMIT CAPITAL'}</button></form></div>
          )}
        </div>
      )}

      {/* 🤝 2. Partners Module (B2B Ledger) */}
      {activeTab === "partners" && (
        <div className="space-y-12 animate-fade-up">
          <div className="saas-card !p-8 flex flex-col lg:flex-row justify-between items-center gap-10 bg-white/80 backdrop-blur-3xl shadow-4xl border-2 border-slate-50">
              <div className="flex-1 w-full relative"><Search size={28} className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" /><input placeholder="SEARCH GLOBAL B2B ENTITIES..." className="premium-input !h-24 !pl-28 !text-[15px] !bg-transparent !border-none font-black italic" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              <div className="flex items-center gap-8 px-12 border-l-8 border-slate-50"><div className="text-right"><p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic leading-none underline decoration-blue-500 decoration-4 mb-3">{clientBalances.length} PARTNERS Online</p><p className="text-3xl font-black text-slate-950 tracking-tighter italic">LEDGER SYNCED</p></div><div className="w-6 h-6 bg-emerald-500 rounded-full animate-pulse shadow-33xl shadow-emerald-500/40"></div></div>
          </div>

          {!selectedClientLedger ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {clientBalances.filter(c => c.client.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                <div key={idx} onClick={() => setSelectedClientLedger(item.client)} className="saas-card bg-white shadow-4xl flex flex-col justify-between h-[380px] border-l-[15px] border-l-slate-950 hover:border-l-blue-600 transition-all duration-700 group cursor-pointer relative overflow-hidden !p-12 italic hover:scale-105">
                  <div className="absolute -top-10 -right-10 p-24 opacity-[0.03] group-hover:opacity-10 transition-opacity"><UserCheck size={280} /></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="space-y-3"><p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none underline decoration-blue-500 decoration-4 mb-2">B2B NODE</p><h3 className="text-4xl font-black italic tracking-tighter text-slate-950 leading-none uppercase truncate max-w-[200px]">{item.client}</h3></div>
                    <button onClick={e => { e.stopPropagation(); setReceivePaymentModal(item.client); }} className="w-20 h-20 bg-white text-emerald-600 rounded-[2rem] shadow-4xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all scale-90 group-hover:scale-110 active:scale-95"><Plus size={36} /></button>
                  </div>
                  <div className="space-y-8 relative z-10">
                    <div className="flex justify-between items-end border-b-6 border-slate-50 pb-6"><p className="text-[13px] font-black text-slate-400 uppercase">Active Debt</p><p className={`text-4xl font-black italic tracking-tighter tabular-nums ${item.due > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>৳{item.due.toLocaleString()}</p></div>
                    <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2.5rem] shadow-inner"><div className="text-center flex-1 border-r-4 border-slate-200"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Billed</p><p className="text-2xl font-black text-slate-950 tabular-nums">{item.billed.toLocaleString()}</p></div><div className="text-center flex-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Paid</p><p className="text-2xl font-black text-emerald-600 tabular-nums">{item.paid.toLocaleString()}</p></div></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="saas-card bg-white animate-fade-in relative !p-20 shadow-5xl border-[20px] border-slate-50 rounded-[5rem] italic">
              <button onClick={() => setSelectedClientLedger(null)} className="absolute top-16 right-16 w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center hover:bg-black hover:scale-110 transition-all shadow-4xl"><ArrowLeft size={40} /></button>
              <div className="mb-24 flex items-center gap-12"><div className="w-32 h-32 bg-blue-600 text-white rounded-[3rem] flex items-center justify-center shadow-5xl rotate-12 animate-pulse"><UserCheck size={64} /></div><div><h3 className="text-8xl font-black italic tracking-tighter text-black uppercase leading-none mb-4">{selectedClientLedger}</h3><p className="text-sm font-black text-slate-400 uppercase tracking-[1em] leading-none underline decoration-blue-600 decoration-[12px] underline-offset-[16px]">Neural Ledger Audit Registry Sequence</p></div></div>
              <div className="overflow-x-auto no-scrollbar rounded-[3rem] shadow-inner"><table className="w-full text-left border-collapse"><thead><tr className="text-[14px] font-black uppercase text-slate-400 tracking-[0.5em] border-b-10 border-slate-50 bg-slate-50/30 font-mono"><th className="py-14 px-12">Audit Timeline</th><th className="py-14 px-12">Node Type</th><th className="py-14 px-12">Memo</th><th className="py-14 px-12 text-right">Liquidity Change</th></tr></thead><tbody className="divide-y-6 divide-slate-50 bg-white">{(masterData.clientTransactions || []).filter(t => t.client === selectedClientLedger).sort((a,b) => new Date(b.date?.split('/').reverse().join('-')) - new Date(a.date?.split('/').reverse().join('-'))).map((t, idx) => (<tr key={idx} className="group hover:bg-slate-50 transition-all duration-500"><td className="py-12 px-12 font-black uppercase italic tabular-nums text-lg">{t.date}</td><td className="py-12 px-12"><span className={`px-8 py-3 rounded-2xl text-[12px] font-black tracking-[0.3em] uppercase shadow-4xl ${t.type === 'BILL' ? 'bg-rose-600 text-white shadow-rose-500/30' : 'bg-emerald-600 text-white shadow-emerald-500/30 animate-pulse'}`}>{t.type}</span></td><td className="py-12 px-12 text-sm font-black uppercase text-slate-400 italic max-w-lg truncate leading-none">{t.note}</td><td className={`py-12 px-12 text-right font-black text-5xl tabular-nums tracking-tighter italic ${t.type === 'BILL' ? 'text-rose-600' : 'text-emerald-500'}`}>{t.type === 'BILL' ? '-' : '+'} ৳{t.amount?.toLocaleString()}</td></tr>))}</tbody></table></div>
            </div>
          )}
        </div>
      )}

      {/* 👷 3. Workforce Module */}
      {activeTab === "workforce" && (
        <div className="animate-fade-up">
           <WorkerSummary 
              masterData={masterData} 
              setMasterData={setMasterData} 
              showNotify={showNotify} 
              user={user} 
              t={t} 
              logAction={logAction} 
              setActivePanel={setActivePanel} 
           />
        </div>
      )}

      {/* 📊 4. Analytics Module */}
      {activeTab === "analytics" && (
        <div className="space-y-12 animate-fade-up">
           <div className="saas-card !p-16 bg-white flex flex-col md:flex-row justify-between items-center gap-12 border-emerald-500/20 shadow-5xl relative overflow-hidden group rounded-[4rem] italic">
              <div className="absolute -top-10 -right-10 p-32 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-1000"><Share2 size={300} className="text-emerald-600" /></div>
              <div className="space-y-4 relative z-10"><h4 className="text-5xl font-black uppercase text-emerald-600 leading-none italic tracking-tighter">CLOUD ARCHITECTURE</h4><p className="text-[13px] font-black text-slate-400 uppercase tracking-[1em] italic leading-none">Global Registry Sync to Google Cloud Infrastructure</p></div>
              <button 
                onClick={() => { if(window.confirm("COMMIT ALL LOCAL DATA TO GOOGLE CLOUD?")) onSyncGoogle(); }}
                className="px-20 py-10 bg-emerald-600 text-white rounded-[3rem] text-sm font-black uppercase tracking-[0.4em] flex items-center gap-8 shadow-4xl hover:bg-slate-950 transition-all border-b-[15px] border-emerald-900 active:scale-95 group relative z-10"
              >
                <Database size={32} className="group-hover:animate-spin" /> GOOGLE SHEETS SYNC
              </button>
           </div>
           <BusinessIntel masterData={masterData} />
           <div className="saas-card !p-20 bg-slate-950 text-white flex flex-col items-center justify-center gap-16 rounded-[6rem] relative overflow-hidden shadow-5xl">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:60px_60px] opacity-40"></div>
              <Activity size={100} className="text-blue-600 animate-pulse" />
              <div className="text-center space-y-6 relative z-10"><h4 className="text-6xl font-black italic tracking-tighter uppercase leading-none">Neural Insights Active</h4><p className="text-[14px] text-white/30 font-black uppercase tracking-[1.2em] leading-none italic">Live Factory Reporting Sequence in Synchronized Motion</p></div>
           </div>
        </div>
      )}

      {/* 🛡️ 5. System Module (Master Control) */}
      {activeTab === "system" && (
        <div className="space-y-12 animate-fade-up">
           <div className="saas-card !p-20 bg-white border-4 border-slate-50 shadow-5xl rounded-[5rem] italic">
              <div className="flex items-center gap-12 mb-24">
                <div className="w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-5xl rotate-12 scale-110 animate-pulse"><ShieldCheck size={44} /></div>
                <div><h3 className="text-6xl font-black uppercase italic tracking-tighter text-slate-950 leading-none mb-4">SYSTEM ENVIRONMENT</h3><p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] italic decoration-blue-600 underline underline-offset-[12px] decoration-[10px]">High Forensic Neural Node Architecture v5.2A</p></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-24">
                <div className="space-y-12">
                   <div className="flex items-center justify-between border-b-[10px] border-slate-50 pb-10"><h4 className="text-3xl font-black uppercase tracking-widest text-black italic">Neural Activity Pulse</h4><Activity size={40} className="text-blue-600 animate-bounce" /></div>
                   <div className="space-y-6 max-h-[800px] overflow-y-auto pr-10 no-scrollbar">
                      {(masterData.auditLogs || []).slice(0, 100).map((log, i) => (
                        <div key={i} className="p-8 bg-slate-50 rounded-[3rem] border-2 border-white shadow-3xl hover:border-black transition-all group flex flex-col gap-6 scale-95 hover:scale-100 duration-500">
                           <div className="flex justify-between items-center"><span className="px-6 py-2.5 bg-slate-950 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-4xl group-hover:bg-blue-600 transition-colors">{log.action}</span><p className="text-xs font-black text-slate-400 font-mono tracking-tighter italic tabular-nums">{new Date(log.timestamp).toLocaleString()}</p></div>
                           <p className="text-2xl font-black text-slate-900 uppercase italic leading-none tracking-tighter">{log.details}</p>
                           <div className="flex items-center gap-4 mt-2 pt-8 border-t-2 border-white"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-xl italic">{log.user?.[0]?.toUpperCase() || 'A'}</div><p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">{log.user.toUpperCase()} // ROLE: {log.role} // CID#{log.timestamp?.toString()?.slice(-6)}</p></div>
                        </div>
                      ))}
                      {(masterData.auditLogs || []).length === 0 && <div className="py-40 text-center opacity-10 flex flex-col items-center italic font-black uppercase tracking-[1em]"><ShieldCheck size={100} className="mb-10" /> VAULT EMPTY</div>}
                   </div>
                </div>

                <div className="space-y-12">
                   <div className="bg-rose-50 p-16 rounded-[5rem] border-6 border-rose-100 relative overflow-hidden group shadow-4xl">
                      <div className="absolute -top-10 -right-10 p-32 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000"><Trash2 size={300} className="text-rose-600" /></div>
                      <h4 className="text-4xl font-black uppercase tracking-widest text-rose-600 flex items-center gap-8 italic mb-12"><TrendingDown size={48} /> FATAL OVERRIDE</h4>
                      <p className="text-sm font-bold text-rose-500/80 italic leading-relaxed mb-20 max-w-md underline decoration-rose-600 decoration-4 underline-offset-8">DANGER: These protocols bypass neural encryption and result in irreversible total data loss within the production cluster hierarchy.</p>
                      <div className="space-y-8 relative z-10">
                         <button onClick={() => { if(window.confirm("FATAL ERROR: ERASE ENTIRE PRODUCTION LEDGER?")) setMasterData(p => ({...p, productions: []})); }} className="w-full py-10 bg-white border-b-[15px] border-rose-200 hover:border-b-0 hover:translate-y-4 text-rose-600 rounded-[2.5rem] text-[15px] font-black uppercase tracking-[0.5em] shadow-4xl transition-all">[RESET] Production Cluster</button>
                         <button onClick={() => { if(window.confirm("FATAL ERROR: ERASE COMPLETE AUDIT ARCHIVES?")) setMasterData(p => ({...p, auditLogs: []})); }} className="w-full py-10 bg-white border-b-[15px] border-slate-200 hover:border-b-0 hover:translate-y-4 text-slate-300 rounded-[2.5rem] text-[15px] font-black uppercase tracking-[0.5em] shadow-4xl transition-all">[RESET] Forensic Audit Trail</button>
                         <button onClick={() => { if(window.confirm("SYSTEM WIPE: RESET ALL GLOBAL FINANCIAL NODES?")) setMasterData(p => ({...p, expenses: [], cashEntries: [], clientTransactions: []})); }} className="w-full py-12 bg-rose-600 border-b-[20px] border-rose-900 hover:border-b-0 hover:translate-y-4 text-white rounded-[3.5rem] text-[15px] font-black uppercase tracking-[0.5em] shadow-5xl transition-all">SYSTEM FINANCIAL WIPE</button>
                      </div>
                   </div>
                   <div className="saas-card !p-16 border-8 border-slate-50 bg-slate-50/50 rounded-[5rem] group hover:bg-slate-950 transition-all duration-1000"><div className="flex justify-between items-center mb-12"><h4 className="text-[14px] font-black uppercase tracking-[1em] text-slate-400 italic">Core Environment Nodes</h4><Database size={32} className="opacity-20 group-hover:text-white group-hover:animate-spin" /></div><div className="space-y-8"><div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] shadow-2xl group-hover:scale-95 transition-transform"><p className="text-sm font-black uppercase tracking-widest italic leading-none">Database Architecture</p><p className="text-lg font-black text-blue-600 font-mono italic">SUPABASE.CLOUD v2.4X</p></div><div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] shadow-2xl group-hover:scale-105 transition-transform"><p className="text-sm font-black uppercase tracking-widest italic leading-none">Cluster Intelligence</p><p className="text-lg font-black text-emerald-600 font-mono italic">NRZ-OPR-2026.S52X</p></div></div></div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* 🏡 Master HUD Controller (Safe Return) */}
      <div className="flex justify-center pt-40 pb-32">
        <button onClick={() => setActivePanel("Overview")} className="group relative flex items-center gap-16 bg-white px-24 md:px-32 py-12 rounded-[5rem] border-[10px] border-slate-50 shadow-5xl hover:scale-110 active:scale-90 transition-all duration-1000 hover:rotate-2 hover:bg-slate-950 hover:text-white">
          <div className="w-24 h-24 bg-slate-950 text-white group-hover:bg-white group-hover:text-black rounded-[2.5rem] group-hover:rotate-[360deg] transition-all duration-1000 shadow-5xl flex items-center justify-center rotate-6"><ArrowLeft size={44} strokeWidth={5} /></div>
          <span className="text-5xl font-black uppercase italic tracking-[0.5em] leading-none">RETURN MASTER HUD</span>
        </button>
      </div>

      {/* 🚀 Modals Deployment Cluster */}
      {editExpense && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-[1000] flex items-center justify-center p-8 overflow-y-auto no-scrollbar pt-32 pb-32">
           <div className="bg-white w-full max-w-3xl rounded-[6rem] p-20 md:p-32 space-y-20 animate-fade-up shadow-5xl relative border-[20px] border-slate-50 italic">
                <button onClick={() => setEditExpense(null)} className="absolute top-16 right-16 w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-4xl"><X size={36} /></button>
                <div className="text-center space-y-8"><div className="mx-auto w-32 h-32 bg-black text-white rounded-[4rem] flex items-center justify-center shadow-5xl rotate-12 mb-12"><Edit2 size={48} /></div><h3 className="text-6xl font-black uppercase italic leading-none text-black tracking-tighter">REVISE AUDIT</h3><p className="text-[14px] font-black text-slate-400 uppercase tracking-[1em] leading-none mb-10 italic">Internal Global Ledger Adjustment Protocol</p></div>
                <form onSubmit={handleUpdateExpense} className="space-y-16">
                   <div className="grid grid-cols-2 gap-12"><div className="space-y-6"><label className="text-[13px] font-black text-slate-400 ml-12 uppercase italic tracking-widest">Timeline Registry</label><input name="date" type="date" defaultValue={editExpense.date} className="premium-input !h-24 font-black !bg-slate-950 text-white border-none text-center rounded-[2.5rem] shadow-5xl text-xl" required /></div><div className="space-y-6"><label className="text-[13px] font-black text-slate-400 ml-12 uppercase italic tracking-widest">Node Category</label><select name="category" defaultValue={editExpense.category} className="premium-input !h-24 !text-sm font-black uppercase italic bg-slate-50 rounded-[2.5rem] shadow-inner" required>{["teaSnacks", "transport", "material", "utilities", "salary", "bonus", "others"].map(c => <option key={c} value={c}>{t(c)}</option>)}</select></div></div>
                   <div className="space-y-6"><label className="text-[13px] font-black text-slate-400 ml-12 uppercase italic tracking-widest font-mono italic">Audit Memo Signature</label><input name="description" defaultValue={editExpense.description} className="premium-input !h-24 !text-sm font-black uppercase italic bg-slate-50 rounded-[2.5rem] shadow-inner" required /></div>
                   <div className="bg-slate-950 p-24 rounded-[5rem] shadow-5xl text-center relative overflow-hidden"><div className="absolute top-0 right-0 p-16 opacity-10 text-white"><DollarSign size={240} /></div><label className="text-[15px] font-black text-white/30 uppercase tracking-[1.5em] mb-12 block italic leading-none">REVISED LIQUIDITY VALUE</label><div className="flex items-center justify-center text-white"><span className="text-7xl font-black text-white/20 mr-12 italic">৳</span><input name="amount" type="number" defaultValue={editExpense.amount} className="w-full text-center text-[10rem] font-black bg-transparent border-none text-white outline-none leading-none h-40 italic tracking-tighter" required /></div></div>
                   <div className="flex gap-8"><button type="button" onClick={() => setEditExpense(null)} className="flex-1 py-12 rounded-[3.5rem] font-black text-[15px] uppercase tracking-[0.4em] bg-slate-50 text-slate-400 hover:text-black hover:bg-slate-100 transition-all italic leading-none">ABORT</button><button type="submit" className="flex-[2] py-12 rounded-[3.5rem] font-black text-[15px] uppercase tracking-[0.4em] bg-blue-600 text-white shadow-5xl border-b-[20px] border-blue-900 active:scale-95 transition-all italic leading-none">COMMIT ADJUSTMENT</button></div>
                </form>
           </div>
        </div>
      )}

      {receivePaymentModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[1000] flex items-center justify-center p-8">
           <div className="saas-card bg-white w-full max-w-3xl rounded-[7rem] shadow-5xl p-24 md:p-32 animate-fade-up relative border-[25px] border-slate-50 italic">
                <button onClick={() => setReceivePaymentModal(null)} className="absolute top-16 right-16 w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-5xl"><X size={44} /></button>
                <div className="text-center space-y-10 mb-20"><div className="mx-auto w-36 h-36 bg-emerald-600 text-white rounded-[4.5rem] flex items-center justify-center shadow-5xl rotate-12 mb-16 animate-pulse"><Wallet size={64} /></div><h3 className="text-7xl font-black uppercase italic leading-none text-black tracking-tighter">B2B INFLOW</h3><p className="text-[15px] font-black text-slate-400 uppercase tracking-[0.8em] leading-none mb-12 italic">Global B2B Capital Injection Authorization Sequence</p><div className="inline-block bg-blue-600 text-white py-6 px-16 rounded-[2.5rem] text-lg font-black uppercase tracking-[0.4em] shadow-4xl rotate-1 transform scale-110">NODE: {receivePaymentModal}</div></div>
                <form onSubmit={handleReceiveClientPayment} className="space-y-16">
                   <div className="bg-slate-950 p-24 rounded-[6rem] shadow-5xl text-center relative overflow-hidden"><div className="absolute top-0 right-0 p-16 opacity-10 text-white"><TrendingUp size={240} /></div><label className="text-[17px] font-black text-white/30 uppercase tracking-[1.5em] mb-16 block italic leading-none">LIQUID DEPOSIT VALUE</label><div className="flex items-center justify-center text-white"><span className="text-8xl font-black text-white/20 mr-12 italic">৳</span><input name="amount" type="number" placeholder="0" className="w-full text-center text-[12rem] font-black bg-transparent border-none text-white outline-none leading-none h-48 italic tracking-tighter" required autoFocus /></div></div>
                   <div className="space-y-6"><label className="text-[13px] font-black text-slate-400 ml-16 uppercase italic tracking-widest font-mono italic leading-none">Deposit Authorization Signature / Memo</label><input name="note" placeholder="E.G. NEFT / RTGS / PHYSICAL CASH NODES" className="premium-input !h-28 !p-12 uppercase text-sm font-black bg-slate-50 text-center rounded-[3rem] shadow-inner" required /></div>
                   <div className="flex gap-8 pt-12"><button type="button" onClick={() => setReceivePaymentModal(null)} className="flex-1 py-14 rounded-[4rem] font-black uppercase text-sm tracking-[0.5em] text-slate-400 hover:text-black transition-all italic leading-none">ABORT</button><button type="submit" className="flex-[4] py-14 bg-emerald-600 text-white rounded-[4rem] shadow-5xl font-black uppercase text-sm tracking-[0.5em] border-b-[25px] border-emerald-900 active:scale-95 transition-all italic leading-none">AUTHORIZE CAPITAL DEPOSIT</button></div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePanel;
