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
} from "lucide-react";
import { syncToSheet } from "../../utils/syncUtils";
import { getFinishedStock } from "../../utils/calculations";

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
    masterData.designs.forEach((d) => {
      masterData.colors.forEach((c) => {
        masterData.sizes.forEach((s) => {
          const res = getFinishedStock(masterData, d.name, c, s);
          if (res.borka > 0 || res.hijab > 0) {
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePanel("Overview")}
            className="p-3 bg-white text-black rounded-xl border-2 border-slate-100 shadow-xl hover:bg-black hover:text-white transition-all group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>
          <div className="flex items-center gap-3 md:gap-5 bg-white p-3 md:p-5 premium-card rounded-[1.2rem] md:rounded-xl border-2 border-slate-50 shadow-2xl w-full md:w-auto">
            <div className="p-3 md:p-4 bg-black text-white rounded-[1rem] md:rounded-2xl shadow-2xl rotate-2 transition-transform hover:rotate-0">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none text-black">
                Stock <span className="text-slate-400">Matrix</span>
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-3 italic">
                INVENTORY DIVISION
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          <div className="bg-white rounded-lg px-6 py-4 flex flex-col items-center md:items-end border-2 border-slate-50 shadow-md min-w-[140px] w-full md:w-auto">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">
              Finished Assets
            </p>
            <p className="text-xl font-black italic tracking-tighter text-black leading-none uppercase">
              {masterData.productions
                ?.filter((p) => p.status === "Received")
                .length.toLocaleString()}{" "}
              <span className="text-[10px] not-italic text-slate-300 ml-1">
                BATCHES
              </span>
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setTransactionType("out");
                setShowModal(true);
              }}
              className="bg-rose-50 text-rose-500 px-6 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-md border-b-4 border-rose-200 whitespace-nowrap flex items-center justify-center flex-1 md:flex-none"
            >
              <Minus size={14} strokeWidth={3} className="mr-2" /> Deduct Stock
            </button>
            <button
              onClick={() => {
                setTransactionType("in");
                setShowModal(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl border-b-4 border-zinc-900 whitespace-nowrap flex items-center justify-center flex-1 md:flex-none"
            >
              <Plus size={14} strokeWidth={3} className="mr-2" /> Add Stock
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-2 md:p-3 rounded-xl border border-slate-100 shadow-inner overflow-x-auto mb-10">
        {["overview", "raw", "add"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-4 md:py-8 px-4 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${view === v ? "bg-black text-white shadow-2xl scale-[1.02]" : "text-slate-400 hover:text-black"}`}
          >
            {v === "overview"
              ? "তৈরি পোশাক"
              : v === "raw"
                ? "কাঁচামাল"
                : "নতুন স্টক"}
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
              <div className="md:col-span-2 h-[300px] flex flex-col items-center justify-center text-slate-800 gap-6 bg-white rounded-2xl border-2 border-dashed border-slate-100 italic">
                <Archive size={60} strokeWidth={1} className="opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.6em] opacity-30 italic">
                  No Assets Found
                </p>
              </div>
            ) : (
              summary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 md:p-5 rounded-2xl border-2 border-slate-50 shadow-2xl hover:border-black transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Package size={100} className="text-black" />
                  </div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-black leading-none">
                          {item.design}
                        </h4>
                        <span className="text-[10px] font-black px-4 py-1.5 rounded-xl bg-black text-white uppercase tracking-widest italic shadow-lg">
                          {item.size}
                        </span>
                      </div>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">
                        {item.color}
                      </p>
                    </div>

                    <div className="flex gap-10 md:gap-14 border-l border-slate-50 pl-10 h-full">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                          Borka
                        </p>
                        <p className="text-xl md:text-2xl font-black italic tracking-tighter text-black leading-none">
                          {item.borka}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                          Hijab
                        </p>
                        <p className="text-xl md:text-2xl font-black italic tracking-tighter text-black leading-none">
                          {item.hijab}
                        </p>
                      </div>
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
          <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-slate-50 shadow-2xl flex items-center gap-6 md:gap-10 group focus-within:border-black transition-all">
            <Search
              size={32}
              strokeWidth={3}
              className="text-black opacity-10 group-focus-within:opacity-100 transition-opacity"
            />
            <input
              type="text"
              placeholder="Probe Stock Matrix..."
              className="flex-1 bg-transparent text-2xl md:text-2xl font-black italic border-none outline-none leading-none h-auto placeholder:text-slate-100 text-black uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredInventory.length === 0 ? (
              <div className="lg:col-span-3 h-[200px] flex items-center justify-center italic text-slate-300 font-black uppercase tracking-widest">
                No Materials Detected
              </div>
            ) : (
              filteredInventory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 md:p-6 rounded-3xl border-2 border-slate-50 shadow-2xl flex flex-col justify-between h-72 md:h-80 group hover:border-black transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Database size={100} className="text-black" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-3xl md:text-2xl font-black italic uppercase leading-none mb-3 text-black">
                      {item.name}
                    </h4>
                    <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                      TYPE: {item.color || "STANDARD"}
                    </p>
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <p
                      className={`text-3xl md:text-7xl font-black italic tracking-tighter leading-none ${item.qty <= 5 ? "text-rose-500" : "text-black"}`}
                    >
                      {item.qty}
                    </p>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">
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
          <div className="bg-white w-full max-w-lg rounded-2xl md:rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-y-auto max-h-[96vh] p-6 md:p-16 space-y-6 md:space-y-12 animate-fade-up">
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase italic mb-2 text-black">
                স্টক {transactionType === "in" ? "যোগ" : "বিয়োগ"}
              </h3>
              <p className="text-xl font-black tracking-widest text-slate-400 italic">
                Inventory Adjustment
              </p>
            </div>
            <form
              onSubmit={handleTransaction}
              className="space-y-6 md:space-y-8 uppercase"
            >
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="item"
                  list="items-list"
                  className="form-input py-4 md:py-6 text-xs md:text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-200"
                  placeholder="Material Name..."
                  required
                />
                <input
                  name="date"
                  type="date"
                  className="form-input py-4 md:py-6 text-xs md:text-sm font-black bg-black text-white border-none rounded-[1rem] md:rounded-lg"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <input
                name="color"
                className="form-input py-4 md:py-6 text-xs md:text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-200"
                placeholder="Color (optional)"
              />
              <div className="bg-white border border-slate-100 p-6 md:p-12 rounded-xl md:rounded-3xl text-center shadow-inner">
                <label className="bg-black text-white px-3 py-1 rounded-sm text-[8px] md:text-[10px] font-black uppercase italic tracking-widest inline-block mb-4 md:mb-6 shadow-lg">
                  Quantity
                </label>
                <input
                  name="qty"
                  type="number"
                  className="w-full text-center text-3xl md:text-[10rem] font-black bg-transparent border-none text-black outline-none leading-none h-32 md:h-44"
                  autoFocus
                />
              </div>
              <input
                name="note"
                className="form-input py-4 md:py-6 text-xs md:text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-200"
                placeholder="Reference Note..."
              />
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-4 md:py-10 rounded-full font-black text-xs md:text-sm uppercase bg-slate-100 text-black hover:bg-slate-200 transition-all order-2 md:order-1 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-4 md:py-10 rounded-full font-black text-xs md:text-sm uppercase bg-black text-white shadow-2xl border-b-[8px] md:border-b-[12px] border-zinc-900 flex-[2] order-1 md:order-2"
                >
                  Update Stock
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
          className="group relative flex items-center gap-6 bg-white px-6 py-3 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
        >
          <div className="p-3 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
            <ArrowLeft size={20} strokeWidth={3} />
          </div>
          <span className="text-lg font-black uppercase italic tracking-widest text-black">
            Back to Dashboard
          </span>
          <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  );
};

export default InventoryPanel;
