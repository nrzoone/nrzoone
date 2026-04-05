// DEPLOYMENT TRIGGER: 2026-04-05 11:39
import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  X,
  Box,
  Scissors,
  Search,
  CheckCircle,
  AlertCircle,
  Save,
  Minus,
  Printer,
  ArrowLeft,
  LayoutGrid,
  Activity,
  Package,
  Layers,
  ChevronRight,
  TrendingDown,
  Clock,
  Check,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStock, getSewingStock } from "../../utils/calculations";
import { syncToSheet } from "../../utils/syncUtils";
import NRZLogo from "../NRZLogo";
import UniversalSlip from "../UniversalSlip";

const CuttingPanel = ({
  masterData,
  setMasterData,
  showNotify,
  user,
  setActivePanel,
  logAction,
}) => {
  const [activeTab, setActiveTab] = useState("Cutting Queue");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Derived Stats
  const stats = useMemo(() => {
    const totalIssued = (masterData.cuttingStock || []).reduce((sum, item) => sum + (item.borka || 0) + (item.hijab || 0), 0);
    const receivedPieces = (masterData.productions || [])
      .filter(p => p.status === 'Received')
      .reduce((sum, item) => sum + (item.receivedBorka || 0) + (item.receivedHijab || 0), 0);
    const inProduction = totalIssued - receivedPieces;
    const pendingCount = (masterData.productions || []).filter(p => !p.receivedBorka && !p.receivedHijab).length;
    
    return {
      totalIssued,
      inProduction: Math.max(0, inProduction),
      received: receivedPieces,
      pending: pendingCount
    };
  }, [masterData]);

  // Form State for New Cutting Entry
  const [entryData, setEntryData] = useState({
    design: "",
    color: "",
    cutterName: "",
    lotNo: "",
    date: new Date().toISOString().split("T")[0],
    sizes: [{ size: "", borka: "", hijab: "" }],
  });

  const [printSlip, setPrintSlip] = useState(null);

  const nextLotNo = useMemo(() => {
    const numbers = (masterData.cuttingStock || [])
      .map((l) => parseInt(l.lotNo))
      .filter((n) => !isNaN(n));
    return numbers.length > 0 ? (Math.max(...numbers) + 1).toString() : "101";
  }, [masterData.cuttingStock]);

  React.useEffect(() => {
    if (!entryData.lotNo) {
      setEntryData((prev) => ({ ...prev, lotNo: nextLotNo }));
    }
  }, [nextLotNo]);

  const handleAddCutting = (shouldPrint) => {
    const validSizes = entryData.sizes.filter(
      (s) => s.size && (Number(s.borka || 0) > 0 || Number(s.hijab || 0) > 0)
    );

    if (validSizes.length === 0) {
      showNotify("অন্তত একটি সাইজ এবং সঠিক সংখ্যা দিন!", "error");
      return;
    }

    const newEntries = validSizes.map((s, idx) => ({
      id: `cut_${Date.now()}_${idx}_${Math.random()}`,
      date: new Date(entryData.date).toLocaleDateString("en-GB"),
      design: entryData.design || "N/A",
      color: entryData.color || "N/A",
      size: s.size,
      cutterName: entryData.cutterName || "N/A",
      lotNo: entryData.lotNo || "N/A",
      borka: Number(s.borka || 0),
      hijab: Number(s.hijab || 0),
      status: "Ready",
      timestamp: new Date().toISOString()
    }));

    setMasterData((prev) => ({
      ...prev,
      cuttingStock: [...newEntries, ...(prev.cuttingStock || [])],
    }));

    logAction(user, 'CUTTING_ENTRY', `Lot #${entryData.lotNo} added. Total items: ${newEntries.length}`);
    showNotify("কাটিং রেকর্ড সফলভাবে যোগ করা হয়েছে!");
    
    if (shouldPrint) setPrintSlip(newEntries[0]);
    setShowModal(false);
    
    setEntryData({
      design: "",
      color: "",
      cutterName: "",
      lotNo: (parseInt(entryData.lotNo) + 1).toString(),
      date: new Date().toISOString().split("T")[0],
      sizes: [{ size: "", borka: "", hijab: "" }],
    });
  };

  const handleDelete = (id) => {
    if (user?.role?.toLowerCase() === 'worker') {
      showNotify("আপনার তথ্য ডিলিট করার অনুমতি নেই!", "error");
      return;
    }
    if (!window.confirm("Are you sure? This node will be purged.")) return;
    setMasterData(prev => ({
      ...prev,
      cuttingStock: (prev.cuttingStock || []).filter(item => item.id !== id)
    }));
    logAction(user, 'CUTTING_DELETE', `Deleted node ID: ${id}`);
    showNotify("কাটিং রেকর্ড মুছে ফেলা হয়েছে!", "info");
  };

  if (printSlip) {
    return (
      <div className="min-h-screen bg-white p-10 font-outfit italic animate-fade-up">
        <div className="no-print flex justify-between items-center mb-10 max-w-5xl mx-auto">
            <button onClick={() => setPrintSlip(null)} className="neu-button px-10 py-5">Cancel</button>
            <button onClick={() => window.print()} className="action-btn-primary px-16">
                <Printer size={20} /> PRINT SLIP (PDF)
            </button>
        </div>
        <div className="w-[210mm] mx-auto bg-white border border-slate-100 shadow-2xl p-1 relative">
            <UniversalSlip data={printSlip} type="CUTTING" copyTitle="MASTER ARCHIVE" />
            <div className="h-4 border-t-2 border-dashed border-slate-300 my-10"></div>
            <UniversalSlip data={printSlip} type="CUTTING" copyTitle="FACTORY COPY" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-outfit italic uppercase text-[#0f172a] pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 animate-fade-up">
        <div className="space-y-4">
          <h1 className="section-header !mb-0 text-7xl md:text-8xl">Cutting <span className="text-slate-400">Panel</span></h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-black rounded-full"></div>
            <p className="text-[11px] font-black tracking-[0.6em] text-slate-500 uppercase">Production Protocol Stable V4.0.2</p>
          </div>
        </div>
        <div className="flex gap-6">
          <button 
             onClick={() => setShowModal(true)}
             className="action-btn-primary !py-7 !px-12 flex items-center gap-4 shadow-black/10"
          >
            <Plus size={24} strokeWidth={3} /> INITIALIZE CUTTING
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 animate-fade-up">
        {[
          { label: "Total Issued", value: stats.totalIssued, icon: Package, color: "text-black" },
          { label: "In-Production", value: stats.inProduction, icon: Activity, color: "text-blue-600" },
          { label: "Total Received", value: stats.received, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Pending Items", value: stats.pending, icon: Clock, color: stats.pending > 0 ? "text-rose-600" : "text-slate-400" },
        ].map((s, i) => (
          <div key={i} className="premium-card group hover:scale-[1.02] transition-all cursor-default border-none shadow-[var(--neu-convex)]">
            <div className="flex justify-between items-start mb-8">
              <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-3xl group-hover:bg-black group-hover:text-white transition-all shadow-inner">
                <s.icon size={28} strokeWidth={2.5} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-2">{s.label}</p>
                <h2 className={`text-6xl font-black italic tracking-tighter leading-none ${s.color}`}>{s.value.toLocaleString()}</h2>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
               <TrendingDown size={14} className="opacity-20" />
               <p className="text-[8px] font-bold tracking-widest">Real-Time Core Metrics</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="pill-nav mb-16 p-4 animate-fade-up bg-white/50 backdrop-blur-3xl border border-white/20">
        {["Design Registration", "Cutting Queue", "Production Status"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pill-tab !px-14 !py-6 ${activeTab === tab ? 'pill-tab-active shadow-2xl scale-105' : 'pill-tab-inactive'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-up">
        {activeTab === "Cutting Queue" && (
          <div className="premium-card !p-12 !rounded-[4rem]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
              <div className="space-y-4">
                <h3 className="text-4xl font-black italic tracking-tighter uppercase">Cutting <span className="text-slate-400">Queue Flow</span></h3>
                <p className="text-[10px] font-bold tracking-[0.5em] text-slate-400">Active Material Pipeline</p>
              </div>
              <div className="relative w-full lg:w-[32rem] group">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-slate-400 group-focus-within:text-black transition-colors">
                  <Search size={22} />
                </div>
                <input 
                  type="text" 
                  placeholder="Scan Lot or Design Sequence..." 
                  className="premium-input !pl-20 !py-8 !rounded-[2.5rem] !text-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

                            <div className="overflow-x-auto no-scrollbar">
                              <table className="w-full text-left border-separate border-spacing-y-6">
                                <thead>
                                  <tr className="text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase">
                                    <th className="px-10 py-4">সিরিয়াল</th>
                                    <th className="px-10 py-4">লট নম্বর</th>
                                    <th className="px-10 py-4">ডিজাইন</th>
                                    <th className="px-10 py-4">রঙ</th>
                                    <th className="px-10 py-4">পরিমাণ (QTY)</th>
                                    <th className="px-10 py-4 text-center">অ্যাকশন</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(masterData.cuttingStock || [])
                                    .filter(item => 
                                      item.lotNo?.toString().includes(searchTerm) || 
                                      item.design?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      item.color?.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((item, index) => (
                                    <tr key={item.id} className="group hover:scale-[1.005] transition-all">
                                      <td className="px-10 py-10 bg-slate-50/50 rounded-l-[3rem] font-black text-2xl text-slate-300">
                                        {(index + 1).toString().padStart(2, '0')}
                                      </td>
                                      <td className="px-10 py-10 bg-slate-50/50 font-black italic">
                                        <span className="badge-standard !px-6 !py-3 !text-lg !rounded-2xl shadow-sm">#{item.lotNo}</span>
                                      </td>
                                      <td className="px-10 py-10 bg-slate-50/50">
                                        <h4 className="text-3xl font-black italic leading-none">{item.design}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-2">ডিজাইন মডেল ভেক্টর</p>
                                      </td>
                                      <td className="px-10 py-10 bg-slate-50/50 font-black text-xl text-slate-500 opacity-80">{item.color}</td>
                                      <td className="px-10 py-10 bg-slate-50/50">
                                        <div className="flex gap-10">
                                          <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-400 mb-2">বোরকা</p>
                                            <p className="font-black text-4xl leading-none italic">{item.borka}</p>
                                          </div>
                                          <div className="w-0.5 h-12 bg-slate-200 self-center"></div>
                                          <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-400 mb-2">হিজাব</p>
                                            <p className="font-black text-4xl leading-none italic text-slate-400">{item.hijab}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-10 py-10 bg-slate-50/50 rounded-r-[3rem] text-center">
                                         <div className="flex items-center justify-center gap-6">
                                            <button 
                                              onClick={() => setActivePanel('Swing')}
                                              className="px-10 py-4 bg-black text-white rounded-2xl text-[10px] font-black tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-black/5 active:scale-95"
                                            >কাজে পাঠান</button>
                                            <button 
                                              onClick={() => setPrintSlip(item)}
                                              className="px-10 py-4 bg-white text-black border border-black/10 rounded-2xl text-[10px] font-black tracking-[0.2em] hover:bg-black hover:text-white transition-all shadow-sm active:scale-95"
                                            >স্লিপ প্রিন্ট</button>
                                            <button 
                                               onClick={() => handleDelete(item.id)}
                                               className="p-4 bg-white text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                                            >
                                              <Trash2 size={20} />
                                            </button>
                                         </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {(masterData.cuttingStock || []).length === 0 && (
                                    <tr>
                                      <td colSpan="6" className="py-32 text-center text-slate-200 font-black uppercase tracking-[0.8em] italic text-xl">ম্যাটেরিয়াল কিউ খালি</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
          </div>
        )}

        {/* Tab 2 Content */}
        {activeTab === "Design Registration" && (
           <div className="premium-card flex flex-col items-center justify-center py-48 !rounded-[5rem] space-y-12">
              <div className="p-12 bg-slate-50 rounded-[3rem] animate-pulse">
                <Box size={80} className="text-slate-300" strokeWidth={1} />
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase">Ready to <span className="text-slate-400">Initialize</span></h2>
                <p className="text-[11px] font-black tracking-[0.6em] text-slate-400 max-w-sm leading-relaxed">
                  Design Management Hub is operational. Select parameters to begin material injection.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="action-btn-primary !py-8 !px-20 text-lg"
              >
                Launch Registration Terminal
              </button>
           </div>
        )}

        {/* Tab 3 Content */}
        {activeTab === "Production Status" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 premium-card !p-12 space-y-12">
                <div className="flex justify-between items-end">
                   <div>
                      <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Yield <span className="text-slate-400">Optimizer V2</span></h3>
                      <p className="text-[10px] font-black tracking-[0.4em] text-slate-400">Advanced Pattern Utilization Analytics</p>
                   </div>
                   <TrendingDown className="text-emerald-500 opacity-20" size={64} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {[
                     { label: "Global Utilization", value: "96.4%", sub: "Above Standard", icon: Layers, color: "text-emerald-500" },
                     { label: "Fabric Waste Factor", value: "3.6%", sub: "Minimal Loss", icon: Scissors, color: "text-black" },
                     { label: "Production Velocity", value: "142 U/H", sub: "Operational Peak", icon: Activity, color: "text-blue-500" },
                     { label: "Queue Latency", value: "0.0s", sub: "Instant Process", icon: Clock, color: "text-rose-500" }
                   ].map((a, i) => (
                     <div key={i} className="p-8 bg-slate-50/50 rounded-[3rem] border border-black/5 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                           <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:bg-black group-hover:text-white transition-all">
                              <a.icon size={20} />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-50">Node 0{i+1}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{a.label}</p>
                        <h4 className={`text-5xl font-black italic mb-3 ${a.color}`}>{a.value}</h4>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">{a.sub}</p>
                     </div>
                   ))}
                </div>
              </div>

              <div className="premium-card !bg-black !text-white !p-12 flex flex-col justify-between items-center text-center group">
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full border-[10px] border-white/5 border-t-white animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Activity size={40} className="animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <h4 className="text-4xl font-black italic tracking-tighter uppercase">Live Matrix</h4>
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] leading-relaxed">
                         Synchronizing with Factory Ground Nodes...
                       </p>
                    </div>
                    <div className="flex justify-center gap-2">
                       {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }}></div>)}
                    </div>
                  </div>
                  <div className="w-full pt-12 border-t border-white/10 flex justify-between items-center font-black italic">
                     <span className="text-[10px] tracking-widest opacity-40">AUTO-SYNC: ON</span>
                     <span className="text-emerald-500 text-[10px] tracking-widest">ENCRYPTED</span>
                  </div>
              </div>
           </div>
        )}
      </div>

      {/* Entry Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-3xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-6xl bg-white rounded-[4rem] shadow-[0_100px_150px_-50px_rgba(0,0,0,0.5)] p-16 relative overflow-hidden font-outfit uppercase italic"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-12 right-12 p-5 hover:bg-slate-50 rounded-full transition-all text-slate-300 hover:text-black"
              >
                <X size={32} />
              </button>

              <div className="space-y-16">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-24 h-24 bg-black text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rotate-6">
                    <Scissors size={48} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-6xl font-black italic tracking-tighter">Initialize <span className="text-slate-400">Cut Hub</span></h2>
                    <p className="text-[11px] font-black text-slate-400 tracking-[0.8em] mt-2">Primary Material Registration Protocol</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-6 flex items-center gap-3">
                        <Package size={12} /> Design Model Identifier
                      </label>
                      <select 
                        className="premium-input !bg-slate-50 !py-7 !px-10 !text-xl font-black uppercase"
                        value={entryData.design}
                        onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}
                      >
                        <option value="">Select Master Design...</option>
                        {(masterData.designs || []).map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-6 flex items-center gap-3">
                        <Activity size={12} /> Fabric Color Spectrum
                      </label>
                      <select 
                        className="premium-input !bg-slate-50 !py-7 !px-10 !text-xl font-black uppercase"
                        value={entryData.color}
                        onChange={(e) => setEntryData(p => ({ ...p, color: e.target.value }))}
                      >
                        <option value="">Mapping Color Node...</option>
                        {(masterData.colors || []).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-6">Lot Identifier</label>
                        <input 
                            className="premium-input !bg-black text-white !py-7 !px-10 !text-2xl font-black text-center shadow-2xl"
                            value={entryData.lotNo}
                            onChange={(e) => setEntryData(p => ({ ...p, lotNo: e.target.value }))}
                        />
                        </div>
                        <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-6">Injection Date</label>
                        <input 
                            type="date"
                            className="premium-input !bg-slate-50 !py-7 !px-10 !text-xs font-black text-center"
                            value={entryData.date}
                            onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))}
                        />
                        </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-slate-50/50 p-12 rounded-[4rem] border border-black/5 group flex flex-col">
                     <div className="flex justify-between items-center mb-10">
                        <div className="space-y-2">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Size Matrix Distribution</h4>
                           <p className="text-[8px] font-bold text-slate-300 tracking-widest uppercase">Multi-Pattern Multipliers</p>
                        </div>
                        <button 
                          onClick={() => setEntryData(p => ({ ...p, sizes: [...p.sizes, { size: "", borka: "", hijab: "" }] }))}
                          className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all active:scale-95"
                        >
                          <Plus size={24} strokeWidth={3} />
                        </button>
                     </div>
                     
                     <div className="flex-1 max-h-[30rem] overflow-y-auto pr-6 custom-scrollbar space-y-6">
                        {entryData.sizes.map((s, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-6 items-center animate-fade-up">
                             <div className="col-span-3">
                                <select 
                                    className="premium-input !py-6 !px-6 w-full !rounded-2xl font-black uppercase text-xs"
                                    value={s.size}
                                    onChange={(e) => {
                                    const newSizes = [...entryData.sizes];
                                    newSizes[idx].size = e.target.value;
                                    setEntryData(p => ({ ...p, sizes: newSizes }));
                                    }}
                                >
                                    <option value="">Size</option>
                                    {(masterData.sizes || []).map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                </select>
                             </div>
                             <div className="col-span-4 relative group/input">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 group-focus-within/input:text-black transition-colors">B</span>
                                <input 
                                    placeholder="0" type="number"
                                    className="premium-input !py-6 !pl-12 !pr-6 !rounded-2xl font-black text-2xl text-center"
                                    value={s.borka}
                                    onChange={(e) => {
                                        const newSizes = [...entryData.sizes];
                                        newSizes[idx].borka = e.target.value;
                                        setEntryData(p => ({ ...p, sizes: newSizes }));
                                    }}
                                />
                             </div>
                             <div className="col-span-4 relative group/input">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 group-focus-within/input:text-black transition-colors">H</span>
                                <input 
                                    placeholder="0" type="number"
                                    className="premium-input !py-6 !pl-12 !pr-6 !rounded-2xl font-black text-2xl text-center text-slate-400"
                                    value={s.hijab}
                                    onChange={(e) => {
                                        const newSizes = [...entryData.sizes];
                                        newSizes[idx].hijab = e.target.value;
                                        setEntryData(p => ({ ...p, sizes: newSizes }));
                                    }}
                                />
                             </div>
                             <div className="col-span-1 flex justify-end">
                                {entryData.sizes.length > 1 && (
                                    <button 
                                        onClick={() => setEntryData(p => ({ ...p, sizes: p.sizes.filter((_, i) => i !== idx) }))}
                                        className="p-4 text-slate-300 hover:text-rose-500 hover:bg-white rounded-2xl transition-all"
                                    >
                                    <Trash2 size={24} />
                                    </button>
                                )}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="flex gap-8 pt-8">
                   <button 
                     onClick={() => setShowModal(false)}
                     className="flex-1 py-10 rounded-[2.5rem] bg-slate-50 text-slate-400 font-black uppercase text-[12px] tracking-[0.4em] hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-[0.98]"
                   >
                     Void Operation
                   </button>
                   <button 
                     onClick={() => handleAddCutting(true)}
                     className="action-btn-primary flex-1 !rounded-[2.5rem] !py-10 text-xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] active:scale-[0.98]"
                   >
                     Finalize Protocol & Print
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CuttingPanel;
