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
}) => {
  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const [selectedCategory, setSelectedCategory] = useState("Tea/Snacks");
  const [editExpense, setEditExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const totalCashIn = cashEntries.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
  const totalExpenses = expenses.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
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
    setEditExpense(null);
    showNotify("খরচ আপডেট করা হয়েছে!");
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
    f.reset();
    setActiveTab("daily");
    showNotify("ক্যাশ-ইন সফলভাবে যোগ করা হয়েছে!");
  };

  if (showPrint) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8 text-black dark:text-white font-outfit uppercase italic">
        <style>{`@media print { .no-print { display: none !important; } @page { margin: 15mm; size: A4 portrait; } }`}</style>
        <div className="max-w-4xl mx-auto">
          <div className="no-print flex justify-between items-center mb-12 bg-slate-50 p-8 rounded-2xl border-2 border-slate-100">
            <button 
              type="button"
              onClick={() => setShowPrint(false)}
              className="flex-1 py-4 rounded-xl bg-white border-2 border-black text-black dark:text-white font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-lg"
            >
              বাতিল (Close)
            </button>
            <button
              onClick={() => window.print()}
              className="px-12 py-5 bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-full shadow-2xl flex items-center gap-3"
            >
              <Printer size={16} /> PRINT LEDGER
            </button>
          </div>

          <div className="border-[6px] border-black p-12 md:p-20 rounded-3xl relative overflow-hidden bg-white">
            <div className="flex justify-between items-start border-b-[6px] border-black pb-10 mb-10">
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter leading-none mb-2">
                  NRZO0NE CASH
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black dark:text-white dark:text-white">
                  Official Expense Documentation
                </p>
              </div>
              <div className="text-right italic">
                <p className="text-2xl font-black">{summaryDate}</p>
                <span className="inline-block bg-black text-white px-4 py-1 rounded-full text-[8px] font-black mt-2">
                  DAILY AUDIT
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {filteredExpenses.map((exp, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-6 border-b border-slate-100"
                >
                  <div className="space-y-1">
                    <p className="text-xl font-black leading-none">
                      {exp.description}
                    </p>
                    <p className="text-[9px] font-black text-black dark:text-white dark:text-white tracking-widest opacity-60">
                      {exp.category}
                    </p>
                  </div>
                  <p className="text-3xl font-black text-rose-600">
                    ৳{exp.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 pt-10 border-t-[6px] border-black flex justify-between items-center">
              <p className="text-2xl font-black text-black dark:text-white dark:text-white uppercase">
                Daily Outflow Total
              </p>
              <p className="text-3xl font-black text-black">
                ৳{dailyTotal.toLocaleString()}
              </p>
            </div>

            <div className="mt-24 pt-10 border-t border-slate-100 flex justify-between items-center opacity-20">
              <div className="w-48 h-px bg-black"></div>
              <p className="text-[8px] font-black uppercase tracking-widest">
                Authorized Financial Transcript
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32 animate-fade-up px-1 md:px-4">
      {/* SaaS Financial HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="saas-card !p-8 flex items-center gap-8 group transition-all hover:border-emerald-500/30">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tight text-black dark:text-white dark:text-white leading-none mb-1">৳{currentBalance.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none italic">Available Cash</p>
          </div>
        </div>
        <div className="saas-card !p-8 flex items-center gap-8 group transition-all hover:border-rose-500/30">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tight text-black dark:text-white dark:text-white leading-none mb-1">৳{totalExpenses.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none italic">Burn Rate (Total)</p>
          </div>
        </div>
        <button 
          onClick={() => setShowPrint(true)}
          className="saas-card !p-8 flex items-center gap-8 group transition-all bg-slate-950 text-white hover:bg-black border-none shadow-2xl"
        >
          <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Printer size={28} />
          </div>
          <div className="text-left">
            <p className="text-2xl font-black tracking-tight leading-none mb-1 uppercase italic">Report</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none italic italic">Daily Ledger Transcript</p>
          </div>
        </button>
      </div>

      {/* Control Bar - SaaS Pill Navigation */}
      <div className="saas-card !p-4 flex flex-col lg:flex-row items-center justify-between gap-6 mb-10 border-blue-500/10">
        <div className="pill-nav w-full lg:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'daily', label: 'ডেইলি খরচ' },
            { id: 'new', label: 'টাকা খরচ (Out)' },
            isAdmin && { id: 'cashIn', label: 'টাকা গ্রহণ (In)' },
            { id: 'worker', label: 'শিল্পী বিবরণ' }
          ].filter(Boolean).map(v => (
            <button
              key={v.id}
              onClick={() => setActiveTab(v.id)}
              className={`pill-tab ${activeTab === v.id ? 'pill-tab-active' : 'text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white dark:text-white" />
            <input
              placeholder="সার্চ খরচ বা কারণ..."
              className="premium-input !pl-12 !h-12 !text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'daily' && (
             <input
                type="date"
                className="premium-input !h-12 !w-36 !px-4 !text-[10px] !bg-slate-950 !text-white !border-none"
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
            />
          )}
        </div>
      </div>

      {activeTab === "new" && (
        <div className="flex justify-center animate-fade-up">
           <div className="saas-card w-full max-w-2xl !p-12 space-y-10">
              <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 mb-6">
                    <TrendingDown size={28} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-black dark:text-white dark:text-white leading-none italic uppercase italic">টাকা খরচ (Expense)</h3>
                  <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest italic leading-none">Record money going out of the business</p>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase italic">Category</label>
                        <select name="category" className="premium-input !h-14 !text-[11px] font-bold" required>
                             {["teaSnacks", "transport", "material", "utilities", "salary", "bonus", "others"].map(c => <option key={c} value={c}>{t(c)}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase italic">Date</label>
                        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input !h-14 !text-[11px] font-bold !bg-slate-950 !text-white !border-none" required />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase italic">Description</label>
                    <input name="description" placeholder="EXPENSE DETAILS..." className="premium-input !h-14 !text-[11px] font-bold italic uppercase" required />
                 </div>
                 <div className="bg-slate-950 p-10 rounded-2xl shadow-2xl text-center">
                    <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em] mb-4 block">NET AMOUNT</label>
                    <input name="amount" type="number" placeholder="0" className="w-full text-center text-7xl font-black bg-transparent border-none text-white outline-none leading-none h-24" required />
                 </div>
                 <button type="submit" className="w-full py-7 bg-rose-600 text-white rounded-2xl shadow-2xl border-b-[10px] border-rose-900 hover:scale-[1.02] active:scale-95 transition-all text-xl font-black uppercase italic italic">Confirm Transaction</button>
              </form>
           </div>
        </div>
      )}

      {activeTab === "cashIn" && (
        <div className="flex justify-center animate-fade-up">
           <div className="saas-card w-full max-w-2xl !p-12 space-y-10">
              <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl -rotate-3 mb-6">
                    <TrendingUp size={28} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-black dark:text-white dark:text-white leading-none italic uppercase italic">টাকা আসা (Cash In)</h3>
                  <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest italic leading-none">Record money coming into the business</p>
              </div>
              <form onSubmit={handleAddCash} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase italic">Date</label>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input !h-14 !text-[11px] font-bold !bg-slate-950 !text-white !border-none" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase italic">Source / Details</label>
                    <input name="description" placeholder="CASH SOURCE DETAILS..." className="premium-input !h-14 !text-[11px] font-bold italic uppercase" required />
                 </div>
                 <div className="bg-slate-950 p-10 rounded-2xl shadow-2xl text-center">
                    <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em] mb-4 block">RECEIVE AMOUNT</label>
                    <input name="amount" type="number" placeholder="0" className="w-full text-center text-7xl font-black bg-transparent border-none text-white outline-none leading-none h-24" required />
                 </div>
                 <button type="submit" className="w-full py-7 bg-emerald-600 text-white rounded-2xl shadow-2xl border-b-[10px] border-emerald-900 hover:scale-[1.02] active:scale-95 transition-all text-xl font-black uppercase italic italic">Receive Cash</button>
              </form>
           </div>
        </div>
      )}

      {activeTab === "daily" && (
        <div className="space-y-8 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExpenses.length === 0 ? (
              <div className="col-span-full h-80 flex flex-col items-center justify-center saas-card border-2 border-dashed border-slate-200">
                <TrendingDown size={64} strokeWidth={1} className="text-slate-200 mb-6" />
                <p className="text-[11px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest italic">No Consumption Records Audited For This Date</p>
              </div>
            ) : (
              filteredExpenses.map((exp, idx) => (
                <div key={exp.id || idx} className="saas-card !p-8 flex flex-col justify-between h-80 group hover:border-slate-900 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <DollarSign size={160} className="text-black dark:text-white dark:text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                        {exp.category}
                      </span>
                      <button onClick={() => setEditExpense(exp)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-black dark:text-white dark:text-white hover:bg-slate-950 hover:text-white transition-all shadow-sm">
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <h5 className="text-2xl font-black tracking-tight text-black dark:text-white dark:text-white uppercase leading-tight italic mb-2">
                      {exp.description}
                    </h5>
                    <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest flex items-center gap-2 italic">
                      <Calendar size={12} /> {exp.date}
                    </p>
                  </div>
                  <div className="relative z-10 flex justify-between items-end">
                    <p className="text-4xl font-black text-black dark:text-white dark:text-white italic">
                      ৳{exp.amount.toLocaleString()}
                    </p>
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "worker" && <WorkerSummary masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} />}

      <div className="flex justify-center pt-24 pb-12">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-10 bg-white dark:bg-slate-900 px-12 md:px-16 py-7 md:py-9 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-3xl hover:border-slate-950 transition-all duration-500"
        >
          <div className="p-4 bg-slate-950 text-white rounded-2xl group-hover:rotate-[-15deg] transition-transform shadow-xl">
            <ArrowLeft size={24} strokeWidth={4} />
          </div>
          <span className="text-xl font-black uppercase italic tracking-[0.2em] text-black dark:text-white dark:text-white">
            Return to Core
          </span>
        </button>
      </div>

      {editExpense && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-3xl border-4 border-slate-50 shadow-3xl p-8 md:p-12 space-y-12 animate-fade-up text-black dark:text-white italic italic">
                <div className="text-center space-y-3">
                   <div className="mx-auto w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 mb-6">
                    <Edit2 size={28} />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic leading-none">Modify Record</h3>
                  <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-[0.4em]">Audit Trail Correction</p>
                </div>
                <form onSubmit={handleUpdateExpense} className="space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase tracking-widest italic">Date</label>
                        <input name="date" type="date" defaultValue={editExpense.date} className="premium-input !h-14 font-black !bg-slate-950 text-white border-none" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase tracking-widest italic">Category</label>
                        <select name="category" defaultValue={editExpense.category} className="premium-input !h-14 font-black uppercase italic !bg-slate-50 border-slate-100" required>
                             {["teaSnacks", "transport", "material", "utilities", "salary", "bonus", "others"].map(c => <option key={c} value={c}>{t(c)}</option>)}
                        </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-black dark:text-white dark:text-white ml-4 uppercase tracking-widest italic">Description</label>
                      <input name="description" defaultValue={editExpense.description} className="premium-input !h-14 font-black uppercase italic !bg-slate-50 border-slate-100" required />
                   </div>
                   <div className="bg-slate-950 p-10 rounded-2xl shadow-2xl text-center">
                    <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em] mb-4 block">ADJUSTED AMOUNT</label>
                    <input name="amount" type="number" defaultValue={editExpense.amount} className="w-full text-center text-7xl font-black bg-transparent border-none text-white outline-none leading-none h-24" required />
                  </div>
                   <div className="flex gap-4">
                      <button type="button" onClick={() => setEditExpense(null)} className="flex-1 py-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-white border-2 border-black text-black dark:text-white hover:bg-black hover:text-white transition-all shadow-lg">বাতিল (Cancel)</button>
                      <button type="submit" className="flex-[2] py-6 rounded-full font-black text-[10px] uppercase tracking-[0.2em] bg-blue-600 text-white shadow-2xl border-b-[10px] border-blue-900 transition-all active:scale-95">Update Ledger</button>
                   </div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePanel;

