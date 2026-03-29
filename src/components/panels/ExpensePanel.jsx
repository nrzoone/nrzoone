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
import logoWhite from "../../assets/logo_white.png";
import logoBlack from "../../assets/logo_black.png";

const ExpensePanel = ({
  masterData,
  setMasterData,
  initialTab,
  showNotify,
  user,
  setActivePanel,
  t,
}) => {
  const isAdmin = user?.role === "admin";
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
      expenses: prev.expenses.map((exp) =>
        exp.id === updated.id ? updated : exp,
      ),
    }));
    setEditExpense(null);
    showNotify("খরচ আপডেট করা হয়েছে!");
  };

  if (showPrint) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8 text-black font-outfit uppercase italic">
        <style>{`@media print { .no-print { display: none !important; } @page { margin: 15mm; size: A4 portrait; } }`}</style>
        <div className="max-w-4xl mx-auto">
          <div className="no-print flex justify-between items-center mb-12 bg-slate-50 p-8 rounded-2xl border-2 border-slate-100">
            <button
              onClick={() => setShowPrint(false)}
              className="px-5 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full border border-slate-200"
            >
              ← Back
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
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
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
                    <p className="text-[9px] font-black text-slate-400 tracking-widest opacity-60">
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
              <p className="text-2xl font-black text-slate-400 uppercase">
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
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 italic text-black font-outfit uppercase">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActivePanel("Overview")}
            className="p-4 bg-white text-black rounded-2xl border-2 border-slate-100 shadow-xl hover:bg-black hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-xl border-2 border-slate-50 shadow-2xl">
            <div className="p-4 md:p-5 bg-rose-600 text-white rounded-xl shadow-2xl rotate-3">
              <Wallet size={28} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter leading-none italic uppercase">
                Cash <span className="text-slate-400">Nexus</span>
              </h2>
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-2 md:mt-4 italic opacity-80">
                TREASURY MANAGEMENT SYSTEM
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
          <div className="bg-white p-6 rounded-xl border-2 border-slate-50 shadow-lg text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase italic">
              Cash In-Hand
            </p>
            <p className="text-xl md:text-2xl font-black text-emerald-600 italic">
              ৳{currentBalance.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-slate-50 shadow-lg text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase italic">
              Total Outflow
            </p>
            <p className="text-xl md:text-2xl font-black text-rose-500 italic">
              ৳{totalExpenses.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setShowPrint(true)}
            className="col-span-2 md:col-span-1 px-4 py-3 bg-black text-white rounded-full font-black uppercase text-xs tracking-widest shadow-2xl border-b-8 border-zinc-900 hover:scale-105 transition-all italic flex items-center justify-center gap-3"
          >
            <Printer size={18} /> Daily Report
          </button>
        </div>
      </div>

      <div className="flex bg-white p-3 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-10 gap-2">
        {["new", "daily", isAdmin && "cashIn", "worker", "invoice", isAdmin && "report"].filter(Boolean).map((v) => (
          <button
            key={v}
            onClick={() => {
                 setActiveTab(v);
            }}
            className={`flex-1 py-8 px-8 rounded-full font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap min-w-[120px] ${activeTab === v ? "bg-black text-white shadow-3xl italic scale-[1.02]" : "text-slate-400 hover:text-black hover:bg-slate-50"}`}
          >
            {v === "new" ? "নতুন এন্ট্রি" : v === "daily" ? "ডেইলি খরচ" : v === "cashIn" ? "ক্যাশ-ইন" : v === "worker" ? "শিল্পী বিবরণ" : v === "invoice" ? "ইনভয়েস" : "হিসাব বহি"}
          </button>
        ))}
      </div>

      <div className="mb-10 relative group">
        <Search
          size={24}
          className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-100 group-focus-within:text-black transition-colors"
        />
        <input
          type="text"
          placeholder="QUERY FINANCIAL RECORDS..."
          className="w-full bg-white border-4 border-slate-50 rounded-3xl px-20 py-10 md:py-12 text-3xl md:text-2xl font-black italic outline-none placeholder:text-slate-100 focus:border-black shadow-3xl transition-all uppercase"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {activeTab === "daily" && (
        <div className="space-y-8">
          <div className="flex justify-between items-center px-10">
            <h4 className="text-xl font-black italic text-slate-400">
              Entry List
            </h4>
            <input
              type="date"
              className="bg-white px-4 py-2 rounded-2xl border-2 border-slate-50 font-black italic"
              value={summaryDate}
              onChange={(e) => setSummaryDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {filteredExpenses.length === 0 ? (
              <div className="col-span-full h-[400px] flex flex-col items-center justify-center bg-white rounded-[5rem] border-4 border-dashed border-slate-50 text-slate-100 gap-10">
                <TrendingDown size={100} strokeWidth={1} />
                <p className="text-[12px] font-black tracking-[0.8em] opacity-40">
                  No Leakage Found For This Date
                </p>
              </div>
            ) : (
              filteredExpenses.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className="bg-white p-6 md:p-6 rounded-3xl border-2 border-slate-50 shadow-2xl hover:border-black transition-all group relative overflow-hidden flex flex-col justify-between h-[350px]"
                >
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <DollarSign size={200} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between mb-8">
                      <span className="px-5 py-2 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 tracking-widest border border-slate-100 shadow-sm">
                        {exp.category}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditExpense(exp)}
                          className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h5 className="text-3xl md:text-2xl font-black tracking-tighter italic leading-none uppercase mb-2">
                      {exp.description}
                    </h5>
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">
                      {exp.date}
                    </p>
                  </div>
                  <div className="relative z-10 flex justify-between items-end">
                    <p className="text-3xl font-black italic text-black">
                      ৳{exp.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Other tabs would follow similar card patterns if expanded */}
      {activeTab === "worker" && <WorkerSummary masterData={masterData} />}

      <div className="pt-24 pb-16 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-10 bg-white px-20 py-10 rounded-full border-4 border-slate-50 shadow-3xl hover:border-black transition-all duration-700 ease-out"
        >
          <div className="p-5 bg-black text-white rounded-lg group-hover:rotate-[-15deg] transition-transform shadow-2xl">
            <ArrowLeft size={32} strokeWidth={3} />
          </div>
          <span className="text-xl md:text-2xl font-black uppercase italic tracking-[0.2em] text-black">
            Nexus Return
          </span>
        </button>
      </div>
    </div>
  );
};

export default ExpensePanel;
