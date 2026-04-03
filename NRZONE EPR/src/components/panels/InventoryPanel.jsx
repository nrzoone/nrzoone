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
  CheckCircle as ConfirmIcon
} from "lucide-react";
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

  const summary = useMemo(() => {
    const items = [];
    (masterData.designs || []).forEach((d) => {
      (masterData.colors || []).forEach((c) => {
        (masterData.sizes || []).forEach((s) => {
          const res = getFinishedStock(masterData, d.name, c, s);
          if (res && (res.borka > 0 || res.hijab > 0)) {
            items.push({
              design: d.name,
              color: c,
              size: s,
              borka: res.borka,
              hijab: res.hijab,
            });
          }
        });
      });
    });
    return items;
  }, [masterData]);

  const sewingSummary = useMemo(() => {
    const items = [];
    (masterData.designs || []).forEach((d) => {
      (masterData.colors || []).forEach((c) => {
        (masterData.sizes || []).forEach((s) => {
          const res = getSewingStock(masterData, d.name, c, s);
          if (res && (res.borka > 0 || res.hijab > 0)) {
            items.push({ design: d.name, color: c, size: s, borka: res.borka, hijab: res.hijab });
          }
        });
      });
    });
    return items;
  }, [masterData]);

  const stoneSummary = useMemo(() => {
    const items = [];
    (masterData.designs || []).forEach((d) => {
      if (Number(d.stoneRate || 0) === 0) return;
      (masterData.colors || []).forEach((c) => {
        (masterData.sizes || []).forEach((s) => {
          const res = getFinishingStock(masterData, d.name, c, s);
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

    // Audit Log Integration
    logAction(
      user,
      transactionType === "in" ? "STOCK_ADD" : "STOCK_DEDUCT",
      `${item}${color ? ` (${color})` : ""} - Qty: ${qty} - Note: ${form.note.value}`
    );

    syncToSheet({
      type: `STOCK_${transactionType.toUpperCase()}`,
      detail: `${item}${color ? ` (${color})` : ""}`,
      amount: qty,
    });

    setShowModal(false);
    showNotify(`স্টক ${transactionType === "in" ? "যোগ" : "কমানো"} হয়েছে! (Logged)`);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 italic text-black font-outfit uppercase">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActivePanel("Overview")}
            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="section-header">
              {t('stockMatrix')} <span className="text-slate-500">Matrix</span>
            </h2>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
               {t('inventoryHub')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          <button 
            onClick={() => { setShowAIScan(true); setIdentifying(true); setTimeout(()=>setIdentifying(false), 2000); }}
            className="neu-button w-14 h-14 bg-indigo-600 text-white hover:scale-110 transition-all shadow-xl"
            title="AI Visual Identity Probe"
          >
            <Camera size={20} />
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm hidden md:block">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Finished Assets</p>
            <p className="text-2xl font-black italic text-black leading-none uppercase">
                {(masterData.productions || []).filter((p) => p.status === "Received").length.toLocaleString()}{" "}
                <span className="text-[10px] text-slate-500 ml-1">BATCHES</span>
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => { setTransactionType("out"); setShowModal(true); }}
              className="px-6 py-4 bg-rose-50 text-rose-600 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center flex-1 md:flex-none"
            >
              <Minus size={14} strokeWidth={3} className="mr-2" /> {t('deduct')}
            </button>
            <button
              onClick={() => { setTransactionType("in"); setShowModal(true); }}
              className="black-button px-8 py-4 text-[11px] flex-1 md:flex-none justify-center"
            >
              <Plus size={16} strokeWidth={4} className="mr-2" /> {t('addStock')}
            </button>
          </div>
        </div>
      </div>
      
      {showAIScan && (
          <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl p-12 flex items-center justify-center animate-fade-in italic">
              <div className="w-full max-w-4xl bg-white rounded-[5rem] overflow-hidden shadow-3xl relative">
                  <button onClick={() => setShowAIScan(false)} className="absolute top-12 right-12 p-6 hover:rotate-90 transition-transform"><X size={32} /></button>
                  <div className="p-20 text-center">
                       <div className="relative w-full h-[500px] bg-slate-50 rounded-[4rem] overflow-hidden border-8 border-slate-50 group shadow-inner">
                            <div className="absolute inset-0 flex items-center justify-center">
                                {identifying ? (
                                    <div className="space-y-10 flex flex-col items-center">
                                        <div className="w-40 h-40 border-[12px] border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.8em] text-slate-500 animate-pulse">Analyzing Visual Nodes...</p>
                                    </div>
                                ) : (
                                    <div className="animate-fade-up text-center space-y-8 p-12">
                                        <div className="px-8 py-4 bg-emerald-500 text-white rounded-full text-[12px] font-black uppercase tracking-[0.4em] inline-block shadow-2xl">Identity Confirmed</div>
                                        <h4 className="text-8xl font-black italic tracking-tighter uppercase">{masterData.designs?.[0]?.name || 'Unknown Design'}</h4>
                                        <div className="flex justify-center gap-10">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 font-outfit">Match Confidence</p>
                                                <p className="text-3xl font-black italic">98.4%</p>
                                            </div>
                                            <div className="w-px h-12 bg-slate-200"></div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Category</p>
                                                <p className="text-3xl font-black italic">PREMIUM BORKA</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 animate-scan"></div>
                       </div>
                       <p className="mt-12 text-[10px] font-black uppercase text-slate-500 tracking-[0.5em] italic">NRZO0NE Core Vision Architecture v1.0</p>
                  </div>
              </div>
          </div>
      )}

      <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-10">
        {["overview", "sewing", "stone", "raw", "requisitions", "add"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`pill-tab flex-1 whitespace-nowrap px-4 ${view === v ? "pill-tab-active" : "pill-tab-inactive hover:text-black"}`}
          >
            {v === "overview" ? t('finishedGoods') : v === "sewing" ? t('sewingStock') : v === "stone" ? t('stoneStock') : v === "raw" ? t('rawMaterials') : v === "requisitions" ? "Requisitions" : t('addStock')}
          </button>
        ))}
      </div>

      {view === "requisitions" && (
        <div className="space-y-10">
             <div className="flex justify-between items-center px-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">
                    Incoming <span className="text-slate-500">Requisitions</span>
                </h3>
                <button 
                   onClick={() => {
                       const mock = { id: Date.now(), worker: "SABBIR", item: "Stone Packet", qty: "5", date: new Date().toLocaleTimeString(), status: "Incoming" };
                       setMasterData(prev => ({ ...prev, whatsappRequests: [mock, ...(prev.whatsappRequests || [])] }));
                       showNotify("MOCK WhatsApp Request Received!");
                   }}
                   className="px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-full opacity-50 hover:opacity-100 transition-all border-none italic"
                >
                    Simulate WhatsApp Request (#StoneRequest 5pkt)
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(masterData.whatsappRequests || []).length === 0 ? (
                    <div className="lg:col-span-3 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
                        <MessageSquare size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Active Requests Detected</p>
                    </div>
                ) : (
                    masterData.whatsappRequests.map((req, idx) => (
                        <div key={idx} className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-2xl relative overflow-hidden group hover:border-indigo-600 transition-all italic">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Source Identity</p>
                                    <h4 className="text-xl font-black italic uppercase leading-none">{req.worker}</h4>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><MessageSquare size={16} /></div>
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-white shadow-inner">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Requested Resource</p>
                                    <p className="text-xl font-black italic">{req.item} <span className="text-sm opacity-50 ml-2">x {req.qty}</span></p>
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">{req.date}</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (confirm("Confirm dispatch for this requisition?")) {
                                                setMasterData(prev => ({ 
                                                    ...prev, 
                                                    whatsappRequests: prev.whatsappRequests.filter(r => r.id !== req.id),
                                                    rawInventory: [{ id: Date.now(), item: req.item, qty: Number(req.qty), type: 'out', date: new Date().toLocaleDateString(), note: `WA DISPATCH: ${req.worker}` }, ...(prev.rawInventory || [])]
                                                }));
                                                showNotify("Material Dispatched & Stock Updated!");
                                            }
                                        }}
                                        className="h-10 px-6 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 italic"
                                    >
                                        <ConfirmIcon size={12} strokeWidth={3} /> Dispatch
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
             </div>
        </div>
      )}

      {view === "overview" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">
              Finished <span className="text-slate-500">Goods</span>
            </h3>
            <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest italic text-slate-500">
              {summary.length} Items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {summary.length === 0 ? (
              <div className="md:col-span-2 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
                <Box size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Assets Detected</p>
              </div>
            ) : (
              summary.map((item, idx) => (
                <div
                  key={idx}
                  className="item-card flex justify-between items-center gap-8 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Package size={120} className="text-black" />
                  </div>

                  <div className="flex items-center gap-8 flex-1 relative z-10">
                    <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                      {String(item.size)[0]}
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                        <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                          {item.design}
                        </h4>
                        <span className="badge-standard">{item.size}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-black uppercase italic tracking-widest leading-none">• {item.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-slate-50 pl-8 relative z-10">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.borka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Hijab</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.hijab}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === "sewing" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">
              Sewing <span className="text-slate-500">Stock</span>
            </h3>
            <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest italic text-slate-500">
              {sewingSummary.length} Items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {sewingSummary.length === 0 ? (
              <div className="md:col-span-2 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
                <Box size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Assets Detected</p>
              </div>
            ) : (
              sewingSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="item-card flex justify-between items-center gap-8 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Package size={120} className="text-black" />
                  </div>

                  <div className="flex items-center gap-8 flex-1 relative z-10">
                    <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                      {String(item.size)[0]}
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                        <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                          {item.design}
                        </h4>
                        <span className="badge-standard">{item.size}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-black uppercase italic tracking-widest leading-none">• {item.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-slate-50 pl-8 relative z-10">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.borka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Hijab</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.hijab}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === "stone" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">
              Stone <span className="text-slate-500">Stock</span>
            </h3>
            <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest italic text-slate-500">
              {stoneSummary.length} Items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {stoneSummary.length === 0 ? (
              <div className="md:col-span-2 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
                <Box size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Assets Detected</p>
              </div>
            ) : (
              stoneSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="item-card flex justify-between items-center gap-8 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Package size={120} className="text-black" />
                  </div>

                  <div className="flex items-center gap-8 flex-1 relative z-10">
                    <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                      {String(item.size)[0]}
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                        <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                          {item.design}
                        </h4>
                        <span className="badge-standard">{item.size}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-black uppercase italic tracking-widest leading-none">• {item.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-slate-50 pl-8 relative z-10">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.borka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Hijab</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.hijab}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === "raw" && (
        <div className="space-y-10">
            <div className="floating-header-group mb-12 p-2 dark:bg-zinc-900 border-none shadow-2xl">
                <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
                    <div className="flex-1 relative w-full group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                            <Search size={16} />
                        </div>
                        <input
                            placeholder={t('searchPlaceholder')}
                            className="w-full bg-slate-50 dark:bg-black/20 h-14 rounded-2xl pl-16 pr-8 text-xs font-black uppercase tracking-widest italic outline-none border border-transparent focus:border-black/10 dark:focus:border-white/10 transition-all text-black dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredInventory.length === 0 ? (
                 <div className="lg:col-span-3 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
                    <Database size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Materials Detected</p>
                </div>
            ) : (
              filteredInventory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-10 rounded-[4rem] border border-slate-100 flex flex-col justify-between h-72 group hover:border-black transition-all relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Database size={140} className="text-black" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-3xl font-black italic uppercase leading-none mb-3 text-black group-hover:translate-x-1 transition-transform">
                      {item.name}
                    </h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                      TYPE: {item.color || "STANDARD"}
                    </p>
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <p
                      className={`text-6xl font-black italic tracking-tighter leading-none ${item.qty <= 5 ? "text-rose-500" : "text-black"}`}
                    >
                      {item.qty}
                    </p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">
                      PACKETS / UNITS
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === "add" && (
        <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 gap-6">
          <Package size={100} strokeWidth={1} className="opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-[0.8em]">
            Entry Protocol Ready • উপরে বাটন দেখুন
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-3 md:p-4 text-black italic">
          <div className="bg-white w-full max-w-lg rounded-[3rem] border-4 border-slate-50 shadow-2xl overflow-y-auto max-h-[96vh] p-8 md:p-16 space-y-8 md:space-y-12 animate-fade-up">
            <div className="text-center">
               <div className="mx-auto w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3 mb-6">
                <Package size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase italic mb-2 text-black">
                স্টক {transactionType === "in" ? "যোগ" : "বিয়োগ"}
              </h3>
              <p className="text-[10px] font-black tracking-widest text-slate-500 italic uppercase">
                Inventory Adjustment Protocol
              </p>
            </div>
            <form
              onSubmit={handleTransaction}
              className="space-y-8 md:space-y-10 uppercase"
            >
            <div className="floating-header-group mb-12 p-2 dark:bg-zinc-900 border-none shadow-2xl">
                <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/50 p-1.5 rounded-2xl w-full lg:w-auto">
                        <button className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black shadow-lg">চলমান</button>
                    </div>
                </div>
            </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-600 ml-4 font-black">Material</label>
                    <input
                      name="item"
                      list="items-list"
                      className="form-input py-4 md:py-5 text-sm font-black bg-slate-50 border-slate-100 placeholder:text-slate-500"
                      placeholder="Material Name..."
                      required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-600 ml-4 font-black">Date</label>
                    <input
                      name="date"
                      type="date"
                      className="form-input py-4 md:py-5 text-sm font-black bg-black text-white border-none"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                    />
                </div>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] text-slate-600 ml-4 font-black">Color (Optional)</label>
                  <input
                    name="color"
                    className="form-input py-4 md:py-5 text-sm font-black bg-slate-50 border-slate-100 placeholder:text-slate-500"
                    placeholder="Physical Property..."
                  />
              </div>

              <div className="bg-slate-50 border border-slate-100 p-8 md:p-12 rounded-[2.5rem] text-center shadow-inner">
                <label className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic tracking-widest inline-block mb-6 shadow-lg">
                  Quantity
                </label>
                <input
                  name="qty"
                  type="number"
                  className="w-full text-center text-5xl md:text-8xl font-black bg-transparent border-none text-black outline-none leading-none h-24 md:h-32"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] text-slate-600 ml-4 font-black">Reference Note</label>
                  <input
                    name="note"
                    className="form-input py-4 md:py-5 text-sm font-black bg-slate-50 border-slate-100 placeholder:text-slate-500"
                    placeholder="Log details..."
                  />
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-5 md:py-6 rounded-full font-black text-xs md:text-sm uppercase bg-white border border-slate-100 text-slate-500 hover:text-black transition-all order-2 md:order-1 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="black-button py-5 md:py-6 text-sm flex-[2] order-1 md:order-2 justify-center"
                >
                   {t('updateProtocol')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <datalist id="items-list">
        <option value="Stone Packet" />
        <option value="Paper Roll" />
        <option value="Fabric Roll" />
        <option value="Elastic Pkt" />
        <option value="Lace Meter" />
        <option value="Label Pkt" />
        <option value="Poly Pkt" />
        <option value="Carton" />
      </datalist>

      <div className="pt-20 pb-10 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-6 bg-white px-12 py-6 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
        >
          <div className="p-3 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
            <ArrowLeft size={20} strokeWidth={3} />
          </div>
          <span className="text-lg font-black uppercase italic tracking-widest text-black">{t('backToDashboard')}</span>
          <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  );
};

export default InventoryPanel;
