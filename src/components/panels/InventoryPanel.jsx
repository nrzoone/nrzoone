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
} from "lucide-react";
import { syncToSheet } from "../../utils/syncUtils";
import { getFinishedStock, getSewingStock, getFinishingStock } from "../../utils/calculations";

const InventoryPanel = ({
  masterData,
  setMasterData,
  showNotify,
  setActivePanel,
  t,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState("in"); // 'in' or 'out'
  const [view, setView] = useState("overview"); // 'overview', 'raw', 'add'

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

    syncToSheet({
      type: `STOCK_${transactionType.toUpperCase()}`,
      detail: `${item}${color ? ` (${color})` : ""}`,
      amount: qty,
    });

    setShowModal(false);
    showNotify(`স্টক ${transactionType === "in" ? "যোগ" : "কমানো"} হয়েছে!`);
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
              Stock <span className="text-slate-400">Matrix</span>
            </h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">
               Inventory Management Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Finished Assets</p>
            <p className="text-2xl font-black italic text-black leading-none uppercase">
                {(masterData.productions || []).filter((p) => p.status === "Received").length.toLocaleString()}{" "}
                <span className="text-[10px] text-slate-300 ml-1">BATCHES</span>
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => { setTransactionType("out"); setShowModal(true); }}
              className="px-6 py-4 bg-rose-50 text-rose-600 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center flex-1 md:flex-none"
            >
              <Minus size={14} strokeWidth={3} className="mr-2" /> Deduct
            </button>
            <button
              onClick={() => { setTransactionType("in"); setShowModal(true); }}
              className="black-button px-8 py-4 text-[11px] flex-1 md:flex-none justify-center"
            >
              <Plus size={16} strokeWidth={4} className="mr-2" /> Add Stock
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-10">
        {["overview", "sewing", "stone", "raw", "add"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`pill-tab flex-1 whitespace-nowrap px-4 ${view === v ? "pill-tab-active" : "pill-tab-inactive hover:text-black"}`}
          >
            {v === "overview" ? "তৈরি পোশাক" : v === "sewing" ? "সুইং স্টক" : v === "stone" ? "স্টোন স্টক" : v === "raw" ? "কাঁচামাল" : "নতুন স্টক"}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">
              Finished <span className="text-slate-300">Goods</span>
            </h3>
            <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest italic text-slate-500">
              {summary.length} Items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {summary.length === 0 ? (
              <div className="md:col-span-2 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
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
                      <p className="text-slate-400 text-[11px] font-black uppercase italic tracking-widest leading-none">• {item.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-slate-50 pl-8 relative z-10">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.borka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Hijab</p>
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
              Sewing <span className="text-slate-300">Stock</span>
            </h3>
            <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest italic text-slate-500">
              {sewingSummary.length} Items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {sewingSummary.length === 0 ? (
              <div className="md:col-span-2 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
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
                      <p className="text-slate-400 text-[11px] font-black uppercase italic tracking-widest leading-none">• {item.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-slate-50 pl-8 relative z-10">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.borka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Hijab</p>
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
              Stone <span className="text-slate-300">Stock</span>
            </h3>
            <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest italic text-slate-500">
              {stoneSummary.length} Items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {stoneSummary.length === 0 ? (
              <div className="md:col-span-2 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
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
                      <p className="text-slate-400 text-[11px] font-black uppercase italic tracking-widest leading-none">• {item.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-slate-50 pl-8 relative z-10">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-2xl font-black italic tracking-tighter leading-none">{item.borka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Hijab</p>
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
          <div className="relative group mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search Material Matrix..."
              className="form-input pl-16 py-5 text-base border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredInventory.length === 0 ? (
                 <div className="lg:col-span-3 h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                      TYPE: {item.color || "STANDARD"}
                    </p>
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <p
                      className={`text-6xl font-black italic tracking-tighter leading-none ${item.qty <= 5 ? "text-rose-500" : "text-black"}`}
                    >
                      {item.qty}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">
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
        <div className="h-[400px] flex flex-col items-center justify-center text-slate-200 gap-6">
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
              <p className="text-[10px] font-black tracking-widest text-slate-400 italic uppercase">
                Inventory Adjustment Protocol
              </p>
            </div>
            <form
              onSubmit={handleTransaction}
              className="space-y-8 md:space-y-10 uppercase"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-600 ml-4 font-black">Material</label>
                    <input
                      name="item"
                      list="items-list"
                      className="form-input py-4 md:py-5 text-sm font-black bg-slate-50 border-slate-100 placeholder:text-slate-200"
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
                    className="form-input py-4 md:py-5 text-sm font-black bg-slate-50 border-slate-100 placeholder:text-slate-200"
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
                    className="form-input py-4 md:py-5 text-sm font-black bg-slate-50 border-slate-100 placeholder:text-slate-200"
                    placeholder="Log details..."
                  />
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-5 md:py-6 rounded-full font-black text-xs md:text-sm uppercase bg-white border border-slate-100 text-slate-400 hover:text-black transition-all order-2 md:order-1 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="black-button py-5 md:py-6 text-sm flex-[2] order-1 md:order-2 justify-center"
                >
                   Update Protocol
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
          <span className="text-lg font-black uppercase italic tracking-widest text-black">ড্যাশবোর্ডে ফিরে যান</span>
          <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  );
};

export default InventoryPanel;
