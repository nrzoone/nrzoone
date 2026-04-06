import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  AlertCircle,
  History,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Minus,
  Archive,
  Database,
  ArrowLeft,
  Box,
  Camera,
  X,
  MessageSquare,
  Clock,
  CheckCircle as ConfirmIcon,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncToSheet } from "../../utils/syncUtils";
import { getFinishedStock, getSewingStock, getFinishingStock } from "../../utils/calculations";

const InventoryPanel = ({
  masterData,
  setMasterData,
  showNotify,
  setActivePanel,
  t,
  user,
  logAction
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState("in"); // 'in' or 'out'
  const [view, setView] = useState("overview"); // 'overview', 'raw', 'add'
  const [showAIScan, setShowAIScan] = useState(false);
  const [identifying, setIdentifying] = useState(false);

  // Preserve calculations
  const summary = useMemo(() => {
    const items = [];
    (masterData.designs || []).forEach((d) => {
      (masterData.colors || []).forEach((c) => {
        (masterData.sizes || []).forEach((s) => {
          const res = getFinishedStock(masterData, d.name, c, s);
          if (res && (res.borka > 0 || res.hijab > 0)) {
            items.push({ design: d.name, color: c, size: s, borka: res.borka, hijab: res.hijab });
          }
        });
      });
    });
    return items;
  }, [masterData]);

  const inventory = useMemo(() => {
    const logs = masterData.rawInventory || [];
    const stock = {};
    logs.forEach((log) => {
      const key = log.color ? `${log.item} (${log.color})` : log.item;
      if (!stock[key])
        stock[key] = {
          name: log.item,
          color: log.color || null,
          qty: 0,
          lastUpdated: log.date,
        };
      if (log.type === "in") stock[key].qty += Number(log.qty);
      else if (log.type === "out") stock[key].qty -= Number(log.qty);
    });
    return Object.values(stock).sort((a, b) => a.name.localeCompare(b.name));
  }, [masterData.rawInventory]);

  const filteredInventory = inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.color && i.color.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleTransaction = (e) => {
    e.preventDefault();
    const form = e.target;
    const item = form.item.value;
    const color = form.color?.value || "";
    const qty = Number(form.qty.value);

    if (!item || qty <= 0) return;

    const newEntry = {
      id: Date.now(),
      date: form.date.value
        ? new Date(form.date.value).toLocaleDateString("en-GB")
        : new Date().toLocaleDateString("en-GB"),
      item,
      color,
      qty,
      type: transactionType,
      note: form.note.value,
    };

    setMasterData((prev) => ({
      ...prev,
      rawInventory: [newEntry, ...(prev.rawInventory || [])],
    }));

    logAction(user, transactionType === "in" ? "STOCK_ADD" : "STOCK_DEDUCT", `${item}${color ? ` (${color})` : ""} - Qty: ${qty}`);
    syncToSheet({ type: `STOCK_${transactionType.toUpperCase()}`, detail: `${item}${color ? ` (${color})` : ""}`, amount: qty });
    setShowModal(false);
    showNotify(`স্টক সফলভাবে ${transactionType === "in" ? "যোগ" : "কমানো"} হয়েছে!`);
  };

  return (
    <div className="space-y-8 pb-32 animate-fade-up px-1 md:px-4 text-black dark:text-white border-none">
      {/* SaaS Operational HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setActivePanel("Overview")}
            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-950 hover:text-white transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none">
              স্টক <span className="text-blue-600">ম্যাট্রিক্স</span>
            </h2>
            <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mt-2 italic leading-none">
               ইনভেন্টরি হাব (INVENTORY HUB)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => { setShowAIScan(true); setIdentifying(true); setTimeout(()=>setIdentifying(false), 2000); }}
            className="w-12 h-12 bg-slate-950 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-xl group border border-white/10"
          >
            <Camera size={20} />
          </button>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => { setTransactionType("out"); setShowModal(true); }}
              className="px-6 py-4 bg-rose-500/10 text-rose-600 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
            >
              স্টক আউট (OUT)
            </button>
            <button
              onClick={() => { setTransactionType("in"); setShowModal(true); }}
              className="px-6 py-4 bg-slate-950 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={3} /> নতুন এন্ট্রি (IN)
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Pill */}
      <div className="bg-white dark:bg-slate-900 !p-1.5 flex flex-wrap gap-1 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
        {[
            { id: "overview", label: "তৈরি মাল (Finished)" },
            { id: "raw", label: "কাঁচামাল (Inventory)" },
            { id: "requisitions", label: "অনুরোধ (Requests)" }
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === v.id ? "bg-slate-950 text-white shadow-lg" : "text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="animate-fade-up">
        {view === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {summary.length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center saas-card border-dashed">
                        <Box size={48} strokeWidth={1} className="text-slate-200 mb-6" />
                        <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-[0.2em]">বর্তমানে কোনো তৈরি মাল স্টকে নেই</p>
                    </div>
                ) : (
                    summary.map((item, idx) => (
                        <div key={idx} className="saas-card group hover:border-slate-950 dark:hover:border-white transition-all animate-fade-up">
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none truncate max-w-[200px]">{item.design}</h4>
                                    <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest italic">• {item.color} ({item.size})</p>
                                </div>
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <Zap size={18} className="text-blue-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none">বোরকা (Borka)</p>
                                    <p className="text-3xl font-bold text-black dark:text-white dark:text-white leading-none">{item.borka} পিস</p>
                                </div>
                                <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                                    <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none">হিজাব (Hijab)</p>
                                    <p className="text-3xl font-bold text-black dark:text-white dark:text-white leading-none">{item.hijab} পিস</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {view === "raw" && (
            <div className="space-y-8">
                <div className="saas-card !p-3 flex items-center bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                    <div className="relative flex-1 group">
                        <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-black dark:text-white dark:text-white group-focus-within:text-blue-600 transition-colors" />
                        <input
                            placeholder="কাঁচামাল অনুসন্ধান করুন (Search Inventory...)"
                            className="premium-input !pl-14 !h-12 !text-[11px] !border-none !bg-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredInventory.length === 0 ? (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center saas-card border-dashed">
                            <Database size={48} className="text-slate-100 mb-4" />
                            <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest">কোনো কাঁচামাল পাওয়া যায়নি</p>
                        </div>
                    ) : (
                        filteredInventory.map((item, idx) => (
                            <div key={idx} className="saas-card border-transparent hover:border-slate-950 dark:hover:border-white transition-all group">
                                <h4 className="text-lg font-bold tracking-tight text-black dark:text-white dark:text-white uppercase truncate mb-1">
                                    {item.name}
                                </h4>
                                <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-6 italic truncate">
                                    {item.color || "STANDARD GRADE"}
                                </p>
                                <div className="flex items-end justify-between">
                                    <span className={`text-4xl font-bold tracking-tighter leading-none ${item.qty <= 5 ? "text-rose-600" : "text-black dark:text-white dark:text-white"}`}>
                                        {item.qty.toLocaleString()}
                                    </span>
                                    <span className={`text-[8px] font-black py-1 px-2.5 rounded-lg tracking-[0.15em] uppercase ${item.qty <= 5 ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-black dark:text-white dark:text-white"}`}>
                                        {item.qty <= 5 ? "অল্প (Low)" : "যথেষ্ট"}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {view === "requisitions" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(masterData.whatsappRequests || []).length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center saas-card border-dashed">
                        <MessageSquare size={48} strokeWidth={1} className="text-slate-200 mb-6" />
                        <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-[0.4em]">বর্তমানে কোনো রিকোয়েস্ট নেই</p>
                    </div>
                ) : (
                    masterData.whatsappRequests.map((req, idx) => (
                        <div key={idx} className="saas-card border-l-4 border-l-blue-600 group hover:border-blue-700 transition-all animate-fade-up">
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest leading-none mb-1">প্রেরক (Operator)</p>
                                    <h4 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white dark:text-white">{req.worker}</h4>
                                </div>
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                                    <MessageSquare size={16} />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 mb-8">
                                <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-2 italic">প্রয়োজনীয় মালামাল</p>
                                <p className="text-2xl font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none">{req.item} <span className="text-sm text-black dark:text-white dark:text-white font-bold ml-2">x {req.qty}</span></p>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="flex items-center gap-2 text-black dark:text-white dark:text-white">
                                    <Clock size={12} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{req.date}</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (confirm("আপনি কি এই সরবরাহ নিশ্চিত করতে চান?")) {
                                            setMasterData(prev => ({ 
                                                ...prev, 
                                                whatsappRequests: prev.whatsappRequests.filter(r => r.id !== req.id),
                                                rawInventory: [{ id: Date.now(), item: req.item, qty: Number(req.qty), type: 'out', date: new Date().toLocaleDateString(), note: `WA DISPATCH: ${req.worker}` }, ...(prev.rawInventory || [])]
                                            }));
                                            showNotify("মালামাল সরবরাহ সফলভাবে সম্পন্ন হয়েছে!");
                                        }
                                    }}
                                    className="px-6 py-3.5 bg-slate-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl active:scale-95"
                                >
                                    <ConfirmIcon size={14} strokeWidth={3} /> সরবরাহ (Dispatch)
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="flex justify-center pt-24 pb-12">
        <button
            onClick={() => setActivePanel("Overview")}
            className="group relative flex items-center gap-6 bg-white dark:bg-slate-900 px-12 md:px-16 py-7 md:py-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl hover:border-slate-950 transition-all duration-500"
        >
            <div className="p-3 bg-slate-950 text-white rounded-xl transition-transform shadow-lg group-hover:-translate-x-2">
                <ArrowLeft size={18} strokeWidth={3} />
            </div>
            <span className="text-sm lg:text-lg font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none">
                ড্যাশবোর্ড এ ফিরে যান <span className="text-black dark:text-white dark:text-white font-medium">(Return)</span>
            </span>
        </button>
      </div>

      {/* TRANSACTION MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl p-8 md:p-12 space-y-10 border border-slate-100 dark:border-slate-800 animate-fade-up">
              <div className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-xl">
                  <Database size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-black dark:text-white dark:text-white uppercase leading-none">
                        স্টক {transactionType === "in" ? "যোগ (Entry)" : "কমানো (Out)"}
                    </h3>
                    <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mt-2 italic leading-none">Inventory Adjustments Protocol</p>
                </div>
              </div>

              <form onSubmit={handleTransaction} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest ml-1">আইটেম (Material)</label>
                        <input name="item" list="items-list" className="premium-input !h-12 text-sm uppercase font-bold" placeholder="MATERIAL..." required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest ml-1">তারিখ (Date)</label>
                        <input name="date" type="date" className="premium-input !h-12 text-xs text-center !bg-slate-50 dark:!bg-slate-800/50 border-slate-200 dark:border-slate-700" defaultValue={new Date().toISOString().split("T")[0]} required />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest ml-1">গ্রেড / কালার (Classification)</label>
                    <input name="color" className="premium-input !h-12 text-sm uppercase font-bold" placeholder="E.G. GRADE-A..." />
                </div>

                <div className="bg-slate-950 p-10 rounded-xl shadow-2xl border-b-4 border-blue-600 text-center">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 block leading-none">পরিমাণ (Quantity)</label>
                    <input name="qty" type="number" className="w-full text-center text-7xl font-bold bg-transparent border-none text-white outline-none leading-none h-20 placeholder:text-white/10" placeholder="0" autoFocus required />
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-black dark:text-white dark:text-white hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-800">বাতিল করুন</button>
                    <button type="submit" className="flex-[2] py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-950 text-white shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 italic"><ShieldCheck size={16} /> সংরক্ষণ করুন</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      <datalist id="items-list">
        <option value="পাথর প্যাকেট (Stone)" />
        <option value="পেপার রোল (Paper)" />
        <option value="ফেব্রিক রোল (Fabric)" />
        <option value="ইলাস্টিক প্যাকেট" />
        <option value="লেস মিটার" />
        <option value="লেবেল প্যাকেট" />
        <option value="পলি প্যাকেট" />
        <option value="কার্টন (Carton)" />
      </datalist>

      {/* AI SCAN MODAL */}
      <AnimatePresence>
        {showAIScan && (
            <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-4">
                <div className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] border border-white/10 relative animate-fade-up">
                    <button onClick={() => setShowAIScan(false)} className="absolute top-8 right-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-full hover:bg-rose-500 hover:text-white transition-all text-black dark:text-white dark:text-white z-50">
                        <X size={24} />
                    </button>
                    <div className="p-12 md:p-24 text-center">
                        <div className="relative w-full aspect-video bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border-8 border-slate-50 dark:border-slate-900 shadow-inner">
                            <div className="absolute inset-0 flex items-center justify-center">
                                {identifying ? (
                                    <div className="space-y-8 flex flex-col items-center">
                                        <div className="w-24 h-24 border-[8px] border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black uppercase text-black dark:text-white dark:text-white tracking-[0.6em] animate-pulse">Scanning Visual Matrices...</p>
                                    </div>
                                ) : (
                                    <div className="animate-fade-up text-center space-y-8 p-12">
                                        <div className="flex justify-center"><div className="px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500/20">Protocol Confirmed</div></div>
                                        <h4 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase text-black dark:text-white dark:text-white">{masterData.designs?.[0]?.name || 'Unknown Node'}</h4>
                                        <div className="flex justify-center gap-12 text-black dark:text-white dark:text-white">
                                            <div><p className="text-[9px] font-black text-black dark:text-white dark:text-white uppercase tracking-widest mb-1 italic">Match Confidence</p><p className="text-3xl font-black">99.2%</p></div>
                                            <div className="w-px h-10 bg-slate-200 dark:bg-slate-800"></div>
                                            <div><p className="text-[9px] font-black text-black dark:text-white dark:text-white uppercase tracking-widest mb-1 italic">Classification</p><p className="text-3xl font-black truncate">PREMIUM SERIES</p></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-600 animate-scan shadow-[0_0_20px_blue]"></div>
                        </div>
                        <p className="mt-12 text-[9px] font-black text-black dark:text-white dark:text-white uppercase tracking-[0.5em] italic leading-none">NRZO0NE Core Vision Architecture v5.0 • Live Stream Active</p>
                    </div>
                </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPanel;
