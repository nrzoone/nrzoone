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
  t,
  logAction,
  SafeText,
}) => {
  const [activeTab, setActiveTab] = useState("Incoming Orders"); // Incoming Orders, Cutting Queue, History

  const incomingOrders = useMemo(() => {
    return (masterData.productionRequests || []).filter(r => r.status === 'Pending Review' || r.status === 'In Cutting');
  }, [masterData.productionRequests]);

  const handleAcceptOrder = (order) => {
    const lotNo = prompt("এ অর্ডারের জন্য লট নাম্বার দিন (Enter Lot Number):", order.lotNo || nextLotNo);
    if (!lotNo) return;

    setMasterData(prev => {
        const color = order.color || 'MIX';
        
        // Map each size from the order to a separate cutting stock entry
        const newEntries = (order.sizes || []).map((s, idx) => ({
            id: `B2B_${order.id}_${idx}`,
            lotNo,
            date: new Date().toLocaleDateString("en-GB"),
            design: order.design,
            client: order.client,
            color: color,
            size: s.size,
            borka: Number(s.borka || 0),
            hijab: Number(s.hijab || 0),
            fabricGoj: idx === 0 ? (order.fabricGoj || 0) : 0, // Only put fabric on the first row of the lot
            status: 'Ready', // Important: status 'Ready' makes it available for FactoryPanel
            stage: 'Cutting'
        }));

        return {
            ...prev,
            cuttingStock: [...newEntries, ...(prev.cuttingStock || [])],
            productionRequests: (prev.productionRequests || []).map(r => r.id === order.id ? { ...r, status: 'In Cutting', lotNo } : r)
        };
    });
    showNotify(`B2B অর্ডার লট #${lotNo}-এ যুক্ত হয়েছে এবং সাইজ অনুযায়ী বিভক্ত হয়েছে!`, "success");
    logAction(user, 'B2B_ORDER_ACCEPT', `${order.client} এর (${order.design}) অর্ডারটি লট #${lotNo}-এ এক্সেপ্ট করা হয়েছে।`);
  };
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
    client: "",
    lotNo: "",
    materialName: "ফেব্রিক রোল (Fabric)",
    totalYards: "",
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

  const rawStockByClient = useMemo(() => {
    const stocks = {};
    (masterData.rawInventory || []).forEach(log => {
        const c = log.client || 'FACTORY';
        if (!stocks[c]) stocks[c] = {};
        if (!stocks[c][log.item]) stocks[c][log.item] = 0;
        if (log.type === 'in') stocks[c][log.item] += Number(log.qty);
        else stocks[c][log.item] -= Number(log.qty);
    });
    return stocks;
  }, [masterData.rawInventory]);

  const clientStock = useMemo(() => {
    const c = entryData.client || 'FACTORY';
    const item = entryData.materialName;
    if (!item) return 0;
    return rawStockByClient[c]?.[item] || 0;
  }, [rawStockByClient, entryData.client, entryData.materialName]);

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
      client: entryData.client || "FACTORY",
      lotNo: entryData.lotNo || "N/A",
      borka: Number(s.borka || 0),
      hijab: Number(s.hijab || 0),
      status: "Ready",
      timestamp: new Date().toISOString()
    }));

    const rawDeduction = Number(entryData.totalYards) > 0 ? {
      id: Date.now() + 1,
      date: new Date(entryData.date).toLocaleDateString("en-GB"),
      item: entryData.materialName,
      client: entryData.client || "FACTORY",
      qty: Number(entryData.totalYards),
      type: "out",
      note: `CUTTING LOT #${entryData.lotNo} - ${entryData.design}`
    } : null;

    setMasterData((prev) => {
      const updatedRequests = (prev.productionRequests || []).map(req => {
        if (req.id === entryData.requestRef) {
          return { ...req, status: 'In Cutting', lotNo: entryData.lotNo };
        }
        return req;
      });

      return {
        ...prev,
        productionRequests: updatedRequests,
        cuttingStock: [...newEntries, ...(prev.cuttingStock || [])],
        rawInventory: rawDeduction ? [rawDeduction, ...(prev.rawInventory || [])] : (prev.rawInventory || [])
      };
    });

    logAction(user, 'CUTTING_ENTRY', `Lot #${entryData.lotNo} added. Total items: ${newEntries.length} | B2B Ref: ${entryData.requestRef || 'N/A'}`);
    showNotify("কাটিং রেকর্ড সফলভাবে যোগ করা হয়েছে!");
    
    if (shouldPrint) setPrintSlip(newEntries[0]);
    setShowModal(false);
    
    setEntryData({
      design: "",
      color: "",
      cutterName: "",
      client: "",
      lotNo: (parseInt(entryData.lotNo) + 1).toString(),
      materialName: "ফেব্রিক রোল (Fabric)",
      totalYards: "",
      date: new Date().toISOString().split("T")[0],
      sizes: [{ size: "", borka: "", hijab: "" }],
      requestRef: null
    });
  };

  const handleDelete = (id) => {
    if (user?.role?.toLowerCase() !== 'admin') {
      showNotify("শুধুমাত্র এডমিন ডিলিট করার অনুমতি আছে!", "error");
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
            <UniversalSlip data={printSlip} type="CUTTING" copyTitle="MASTER ARCHIVE" SafeText={SafeText} />
            <div className="h-4 border-t-2 border-dashed border-slate-300 my-10"></div>
            <UniversalSlip data={printSlip} type="CUTTING" copyTitle="FACTORY COPY" SafeText={SafeText} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-fade-up px-1 md:px-4 text-[var(--text-primary)]">
      {/* SaaS Operational HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="saas-card bg-slate-950 text-white border-none shadow-2xl flex flex-col justify-between group overflow-hidden relative !p-5">
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="w-9 h-9 bg-white/10 text-white rounded-xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                    <Package size={18} />
                </div>
                <div className="text-right">
                    <p className="text-xl font-black tracking-tight leading-none italic">{stats.totalIssued.toLocaleString()}</p>
                    <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] mt-1.5 leading-none">TOTAL ISSUED</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-white/30 border-t border-white/10 pt-3 relative z-10">
                <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-0.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }}></div>)}
                </div>
                <p className="text-[6.5px] font-black tracking-widest uppercase">PRODUCTION PROTOCOL ACTIVE</p>
            </div>
        </div>

        <div className="saas-card flex items-center justify-between group !p-5 border-b-2 border-b-blue-600">
            <div className="text-left space-y-0.5">
                <p className="text-subtitle !text-[7px]">IN PRODUCTION</p>
                <p className="text-2xl font-black tracking-tighter text-[var(--text-primary)] leading-none italic">{stats.inProduction.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 dark:bg-blue-900/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Activity size={18} />
            </div>
        </div>

        <div className="saas-card flex items-center justify-between group !p-5 border-b-2 border-b-emerald-600">
            <div className="text-left space-y-0.5">
                <p className="text-subtitle !text-[7px]">TOTAL RECEIVED</p>
                <p className="text-2xl font-black tracking-tighter text-[var(--text-primary)] leading-none italic">{stats.received.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <CheckCircle size={18} />
            </div>
        </div>

        <div className="saas-card flex items-center justify-between group !p-5 border-b-2 border-b-rose-600">
            <div className="text-left space-y-0.5">
                <p className="text-subtitle !text-[7px] text-rose-600">PENDING LOTS</p>
                <p className="text-2xl font-black tracking-tighter text-rose-600 leading-none italic">{stats.pending.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Clock size={18} />
            </div>
        </div>
      </div>

      {/* Control Bar - SaaS Pill Navigation */}
      <div className="bg-white dark:bg-slate-900 !p-1 flex flex-col lg:flex-row items-center justify-between gap-4 rounded-xl border border-[var(--border)] shadow-sm">
        <div className="flex flex-wrap gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: "Incoming Orders", label: "ইনকামিং অর্ডার" },
            { id: "Design Registration", label: "ডিজাইন এন্ট্রি" },
            { id: "Cutting Queue", label: "কাটিং কিউ" },
            { id: "Production Status", label: "সিস্টেম স্ট্যাটাস" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-md dark:bg-white dark:text-black' : 'text-[var(--text-muted)] hover:text-black dark:hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto px-1">
          <div className="relative group flex-1 lg:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              placeholder="সার্চ..."
              className="premium-input !pl-10 !h-9 !text-[9px] !w-full lg:!w-44"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
             onClick={() => setShowModal(true)}
             className="action-btn-primary !w-9 !h-9 !p-0 !rounded-lg"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>


      {/* Main Tab Content */}
      <div className="animate-fade-up">
        {activeTab === "Incoming Orders" && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(masterData.productionRequests || [])
                .filter(r => r.status !== 'In Cutting' && r.status !== 'Approved')
                .map((req, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-500 transition-all flex flex-col group p-4 space-y-3">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest mb-0.5 italic">B2B INCOMING</p>
                              <h4 className="text-base font-black uppercase italic leading-none text-[var(--text-primary)]"><SafeText data={req.design} /></h4>
                          </div>
                          <div className="text-right">
                              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase"><SafeText data={req.client} /></p>
                              <p className="text-[8px] font-bold text-[var(--text-muted)] opacity-60 font-mono mt-0.5"><SafeText data={req.date} /></p>
                          </div>
                      </div>
                      
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                          <div className="flex justify-between items-end">
                              <div>
                                  <p className="text-[7px] font-black uppercase text-slate-400 mb-0.5">Total Pieces</p>
                                  <p className="text-lg font-black italic">{Number(req.totalBorka || 0) + Number(req.totalHijab || 0)} <span className="text-[9px]">PCS</span></p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[7px] font-black uppercase text-slate-400 mb-0.5">Fabric Consumed</p>
                                  <p className="text-sm font-black italic text-rose-500">{req.fabricGoj} <span className="text-[9px]">YDS</span></p>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                          <p className="text-[8px] font-bold text-[var(--text-muted)] line-clamp-1 italic uppercase leading-none">Note: <SafeText data={req.note} fallback="None" /></p>
                          <button 
                            onClick={() => {
                                setEntryData({
                                    ...entryData,
                                    design: req.design,
                                    client: req.client,
                                    totalYards: req.fabricGoj,
                                    sizes: req.sizes || [{ size: "", borka: "", hijab: "" }],
                                    requestRef: req.id
                                });
                                setShowModal(true);
                            }}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                          >
                             অর্ডার গ্রহণ ও প্রসেসিং
                          </button>
                      </div>
                  </div>
                ))}
           </div>
        )}

        {activeTab === "Cutting Queue" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(masterData.cuttingStock || [])
              .filter(item => 
                item.lotNo?.toString().includes(searchTerm) || 
                item.design?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.color?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="col-span-full h-80 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 italic">
                    <Box size={32} className="text-[var(--text-muted)] opacity-20 mb-4" />
                    <p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">কোনো রেকর্ড পাওয়া যায়নি</p>
                </div>
              ) : (
                (masterData.cuttingStock || [])
                  .filter(item => 
                    item.lotNo?.toString().includes(searchTerm) || 
                    item.design?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.color?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((item, idx) => (
                    <div key={item.id || idx} className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:border-slate-950 transition-all group animate-fade-up">
                        <div className="p-3.5 space-y-3.5 flex-1">
                            <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">ডিজাইন আইডি (Design)</p>
                                    <h4 className="text-base font-black tracking-tight text-[var(--text-primary)] uppercase leading-none"><SafeText data={item.design} /></h4>
                                </div>
                                <div className="w-8 h-8 bg-slate-950 text-white rounded-lg flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform font-black text-[9px] flex-col leading-none text-center">
                                    <span>#<SafeText data={item.lotNo} /></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5 italic">রঙ</p>
                                    <p className="text-[9px] font-black text-[var(--text-primary)] truncate uppercase"><SafeText data={item.color} /></p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5 italic">তারিখ</p>
                                    <p className="text-[9px] font-black text-[var(--text-primary)] truncate italic"><SafeText data={item.date} /></p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5 italic">ক্লায়েন্ট</p>
                                    <p className="text-[9px] font-black text-[var(--text-primary)] truncate uppercase"><SafeText data={item.client} fallback="FACTORY" /></p>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center py-3 border-y border-slate-100 dark:border-slate-800 border-dashed">
                                <div className="flex flex-col">
                                     <span className="text-[7px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest mb-0.5 leading-none">বোরকা (Borka)</span>
                                     <span className="text-xl font-black text-black dark:text-white leading-none"><SafeText data={item.borka} /></span>
                                </div>
                                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
                                <div className="text-right">
                                     <span className="text-[7px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest mb-0.5 leading-none">হিজাব (Hijab)</span>
                                     <span className="text-xl font-black text-black dark:text-white leading-none"><SafeText data={item.hijab} /></span>
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 mt-auto">
                            <button onClick={() => setPrintSlip(item)} className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-[var(--text-primary)] hover:bg-slate-950 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="স্লিপ প্রিন্ট">
                                <Printer size={13} />
                            </button>
                            <button 
                                onClick={() => setActivePanel('Swing')} 
                                className="flex-1 bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 transition-all font-outfit"
                            >
                                সুইং (Swing)
                            </button>
                            {user?.role === 'admin' && (
                                <button 
                                    onClick={() => handleDelete(item.id)} 
                                    className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700" title="ডিলিট">
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                  ))
              )}
          </div>

        )}

        {activeTab === "Design Registration" && (
           <div className="bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center py-24 space-y-6 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-xl rounded-2xl flex items-center justify-center animate-bounce text-slate-200">
                <Box size={32} strokeWidth={1} />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">নতুন কাটিং <span className="text-blue-600">এন্ট্রি করুন</span></h2>
                <p className="text-[8px] font-black tracking-[0.4em] text-slate-400 max-w-sm mx-auto uppercase italic">
                  Launch the registration protocol to initialize a new lot. 
                </p>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-slate-950 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
              >
                প্রোটোকল চালু করুন (Launch)
              </button>
           </div>

        )}

        {activeTab === "Production Status" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-8 md:p-10 space-y-10">
                <div className="flex justify-between items-end">
                   <div>
                      <h3 className="text-2xl font-black tracking-tight text-black dark:text-white uppercase mb-1">Yield <span className="text-blue-600">Optimizer</span></h3>
                      <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase italic">Advanced Pattern Utilization Analytics</p>
                   </div>
                   <Activity className="text-blue-500 opacity-20" size={48} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { label: "Fabric Usage", value: "96.4%", icon: Layers, color: "text-emerald-500" },
                     { label: "Waste Factor", value: "3.6%", icon: Scissors, color: "text-[var(--text-primary)]" },
                     { label: "Velocity", value: "142 U/H", icon: Activity, color: "text-blue-500" },
                     { label: "Queue Sync", value: "0.0s", icon: Clock, color: "text-rose-500" }
                   ].map((a, i) => (
                     <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-3">
                           <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm flex items-center justify-center text-[var(--text-primary)]">
                              <a.icon size={14} />
                           </div>
                           <span className="text-[7.5px] font-bold uppercase tracking-widest text-slate-300">NODE 0{i+1}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none"><SafeText data={a.label} /></p>
                        <h4 className={`text-2xl font-bold italic leading-none ${a.color}`}><SafeText data={a.value} /></h4>
                     </div>
                   ))}
                </div>
              </div>

              <div className="bg-slate-950 p-8 rounded-xl text-white flex flex-col justify-between items-center text-center group relative overflow-hidden">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-[8px] border-white/5 border-t-blue-500 animate-[spin_3s_linear_infinite]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Activity size={24} className="animate-pulse text-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-3">
                     <div className="space-y-1">
                        <h4 className="text-2xl font-bold uppercase tracking-tight">Live Matrix</h4>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] italic">
                          Synchronizing Ground Nodes...
                        </p>
                     </div>
                  </div>
                  <div className="w-full pt-6 border-t border-white/10 flex justify-between items-center">
                     <span className="text-[8px] font-bold tracking-widest opacity-40">AUTO-SYNC: ON</span>
                     <span className="text-emerald-500 text-[8px] font-bold tracking-widest">SYSTEM CLEAR</span>
                  </div>
              </div>
           </div>

        )}
      </div>

      {/* Return Home Link */}
      <div className="flex justify-center pt-20 pb-10">
        <button
            onClick={() => setActivePanel("Overview")}
            className="group relative flex items-center gap-3 bg-white dark:bg-slate-900 px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-950 transition-all duration-300"
        >
            <div className="p-2 bg-slate-950 text-white rounded-lg transition-transform shadow-lg group-hover:scale-110">
                <ArrowLeft size={16} />
            </div>
            <span className="text-xs font-bold tracking-tight text-black dark:text-white uppercase">
                ড্যাশবোর্ডে ফিরে যান (Return)
            </span>
        </button>
      </div>

      {/* Entry Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto pt-10 pb-20 no-scrollbar">
            <div className="w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-5 md:p-8 relative overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-up max-h-[90vh] overflow-y-auto no-scrollbar">
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-950 hover:text-white transition-all text-black dark:text-white"
              >
                <X size={16} />
              </button>

              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-lg"><Scissors size={20} /></div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-black dark:text-white uppercase leading-none">নতুন কাটিং <span className="text-blue-600">এন্ট্রি করুন</span></h2>
                    <p className="text-[9px] font-black text-[var(--text-muted)] tracking-widest mt-1.5 uppercase italic leading-none">Primary Material Injection Protocol</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest ml-1">ডিজাইন (Design)</label>
                      <select 
                        className="premium-input !h-10 text-xs font-bold uppercase" 
                        value={entryData.design} 
                        onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}
                      >
                        <option value="">ডিজাইন নির্বাচন করুন...</option>
                        {(masterData.designs || []).map(d => <option key={d.name} value={d.name}><SafeText data={d.name} /></option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-black dark:text-white dark:text-white tracking-widest ml-1">রঙ (Color Mapping)</label>
                      <select 
                        className="premium-input !h-12 text-sm font-bold uppercase" 
                        value={entryData.color} 
                        onChange={(e) => setEntryData(p => ({ ...p, color: e.target.value }))}
                      >
                        <option value="">রঙ নির্বাচন করুন...</option>
                        {(masterData.colors || []).map(c => <option key={c} value={c}><SafeText data={c} /></option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-black dark:text-white dark:text-white tracking-widest ml-1">লট নম্বর (Lot)</label>
                            <input 
                                className="premium-input !bg-slate-950 !text-white !h-12 text-lg font-bold text-center border-none" 
                                value={entryData.lotNo} 
                                onChange={(e) => setEntryData(p => ({ ...p, lotNo: e.target.value }))} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-black dark:text-white dark:text-white tracking-widest ml-1">তারিখ (Date)</label>
                            <input 
                                type="date" 
                                className="premium-input !h-12 text-xs font-bold text-center !bg-slate-50 dark:!bg-slate-800/50 border-slate-200 dark:border-slate-700" 
                                value={entryData.date} 
                                onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-black dark:text-white dark:text-white tracking-widest ml-1">কাটার এর নাম (Cutter)</label>
                          <select 
                            className="premium-input !h-12 text-sm font-bold uppercase" 
                            value={entryData.cutterName} 
                            onChange={(e) => setEntryData(p => ({ ...p, cutterName: e.target.value }))}
                          >
                            <option value="">মাস্টার নির্বাচন করুন...</option>
                            {(masterData.workerCategories?.cutting || []).map(m => <option key={m} value={m}>{m}</option>)}
                            <option value="EXTERNAL">বাইরের কারিগর (OTHER)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-black dark:text-white dark:text-white tracking-widest ml-1">ক্লায়েন্ট (Client Ownership)</label>
                          <select 
                            className="premium-input !h-12 text-sm font-bold uppercase" 
                            value={entryData.client} 
                            onChange={(e) => setEntryData(p => ({ ...p, client: e.target.value }))}
                          >
                            <option value="FACTORY">FACTORY (নিজস্ব)</option>
                            {(masterData.clients || []).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                    </div>

                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <div className="flex justify-between items-center mb-1">
                             <label className="text-[10px] font-bold uppercase text-black dark:text-white dark:text-white tracking-widest ml-1">কাপড় / মেটেরিয়াল</label>
                             {entryData.client && (
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${clientStock <= 0 ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                 স্টক: {clientStock} গজ
                               </span>
                             )}
                           </div>
                           <input 
                             list="material-list"
                             className="premium-input !h-12 text-sm font-bold uppercase" 
                             placeholder="কাপড় নির্বাচন করুন..."
                             value={entryData.materialName} 
                             onChange={(e) => setEntryData(p => ({ ...p, materialName: e.target.value }))}
                           />
                           <datalist id="material-list">
                              <option value="ফেব্রিক রোল (Fabric)" />
                              <option value="লি linen (Fabric)" />
                              <option value="দুবাই চেরি (Fabric)" />
                           </datalist>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold uppercase text-rose-500 tracking-widest ml-1 animate-pulse">মোট কত গজ লেগেছে?</label>
                           <input 
                             type="number"
                             className="premium-input !h-12 text-lg font-black !text-rose-600 bg-rose-50 dark:bg-rose-900/10 border-rose-200" 
                             placeholder="0.00 গজ"
                             value={entryData.totalYards} 
                             onChange={(e) => setEntryData(p => ({ ...p, totalYards: e.target.value }))}
                           />
                        </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col shadow-inner">
                     <div className="flex justify-between items-center mb-6">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white">সাইজ লিস্ট (Size Matrix)</label>
                        <button 
                            onClick={() => setEntryData(p => ({ ...p, sizes: [...p.sizes, { size: "", borka: "", hijab: "" }] }))} 
                            className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center hover:scale-110 shadow-lg transition-all"
                        >
                            <Plus size={18} />
                        </button>
                     </div>
                     
                     <div className="flex-1 max-h-[20rem] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                        {entryData.sizes.map((s, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                             <div className="col-span-3">
                                <select 
                                    className="w-full bg-transparent h-10 text-[10px] font-black uppercase outline-none" 
                                    value={s.size} 
                                    onChange={(e) => { const newSizes = [...entryData.sizes]; newSizes[idx].size = e.target.value; setEntryData(p => ({ ...p, sizes: newSizes })); }}
                                >
                                    <option value="">SIZE</option>
                                    {(masterData.sizes || []).map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                </select>
                             </div>
                             <div className="col-span-4 relative border-l border-slate-100 dark:border-slate-800 px-3">
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300 uppercase">B</span>
                                <input 
                                    placeholder="0" type="number" 
                                    className="w-full bg-transparent h-10 text-xl font-bold text-center outline-none" 
                                    value={s.borka} 
                                    onChange={(e) => { const newSizes = [...entryData.sizes]; newSizes[idx].borka = e.target.value; setEntryData(p => ({ ...p, sizes: newSizes })); }} 
                                />
                             </div>
                             <div className="col-span-4 relative border-l border-slate-100 dark:border-slate-800 px-3">
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300 uppercase">H</span>
                                <input 
                                    placeholder="0" type="number" 
                                    className="w-full bg-transparent h-10 text-xl font-bold text-center text-black dark:text-white dark:text-white outline-none" 
                                    value={s.hijab} 
                                    onChange={(e) => { const newSizes = [...entryData.sizes]; newSizes[idx].hijab = e.target.value; setEntryData(p => ({ ...p, sizes: newSizes })); }} 
                                />
                             </div>
                             <div className="col-span-1 flex justify-end">
                                {entryData.sizes.length > 1 && (
                                    <button 
                                        onClick={() => setEntryData(p => ({ ...p, sizes: p.sizes.filter((_, i) => i !== idx) }))} 
                                        className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                   <button 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-4 rounded-xl bg-white border-2 border-black text-black dark:text-white font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-lg"
                   >
                    বাতিল (Close)
                   </button>
                   <button 
                    onClick={() => handleAddCutting(true)} 
                    className="flex-[2] py-4 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                   >
                     <Printer size={16} /> সংরক্ষণ ও প্রিন্ট (Commit & Print)
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CuttingPanel;

