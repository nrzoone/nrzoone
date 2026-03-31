// DEPLOYMENT TRIGGER: 2026-02-26 05:13
import React, { useState } from "react";
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
} from "lucide-react";
import { getStock, getSewingStock } from "../../utils/calculations";
import { syncToSheet } from "../../utils/syncUtils";
import NRZLogo from "../NRZLogo";

const CuttingPanel = ({
  masterData,
  setMasterData,
  showNotify,
  user,
  setActivePanel,
  t,
}) => {
  const isAdmin = user?.role === "admin";
  const [showModal, setShowModal] = useState(false);
  const [checkMode, setCheckMode] = useState(null);
  const [checkSelection, setCheckSelection] = useState({
    design: "",
    color: "",
    size: "",
  });

  // New State for Modal Form
  const [entryData, setEntryData] = useState({
    design: "",
    color: "",
    cutterName: "",
    lotNo: "",
    date: new Date().toISOString().split("T")[0],
    sizes: [{ size: "", borka: "", hijab: "" }],
  });
  const [printSlip, setPrintSlip] = useState(null);

  // Yield Optimizer State
  const [optimizer, setOptimizer] = useState({ rollWidth: 60, pieceWidth: 22 });
  const optimization = React.useMemo(() => {
    const r = Number(optimizer.rollWidth) || 60;
    const p = Number(optimizer.pieceWidth) || 22;
    const count = Math.floor(r / p);
    const waste = r > 0 ? Math.round(((r - (count * p)) / r) * 100) : 0;
    return { 
      count, 
      waste, 
      rating: waste < 10 ? 'ELITE' : waste < 20 ? 'OPTIMAL' : 'REDUCIBLE' 
    };
  }, [optimizer]);

  const uniqueLots = React.useMemo(() => {
    const lots = [];
    (masterData.cuttingStock || []).forEach((c) => {
      const existing = lots.find((l) => l.lotNo === c.lotNo);
      if (!existing) {
        lots.push({ lotNo: c.lotNo, design: c.design, color: c.color });
      }
    });
    return lots;
  }, [masterData.cuttingStock]);

  const nextLotNo = React.useMemo(() => {
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

  const checkStockResult = (() => {
    if (
      !checkSelection.design ||
      !checkSelection.color ||
      !checkSelection.size ||
      !checkMode
    )
      return { borka: 0, hijab: 0 };
    if (checkMode === "swing")
      return getStock(
        masterData,
        checkSelection.design,
        checkSelection.color,
        checkSelection.size,
      );
    if (checkMode === "stone")
      return getSewingStock(
        masterData,
        checkSelection.design,
        checkSelection.color,
        checkSelection.size,
      );
    return { borka: 0, hijab: 0 };
  })();

  const currentStock =
    (masterData.cuttingStock || []).reduce(
      (a, b) => a + Number(b.borka || 0) + Number(b.hijab || 0),
      0,
    ) -
    (masterData.productions || [])
      .filter((p) => p.type === "sewing")
      .reduce(
        (a, b) => a + Number(b.issueBorka || 0) + Number(b.issueHijab || 0),
        0,
      );

  const handleAddSizeRow = () => {
    setEntryData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: "", borka: "", hijab: "" }],
    }));
  };

  const handleRemoveSizeRow = (index) => {
    if (entryData.sizes.length === 1) return;
    setEntryData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...entryData.sizes];
    newSizes[index][field] = value;
    setEntryData((prev) => ({ ...prev, sizes: newSizes }));
  };

  const handleAddCutting = (shouldPrint) => {
    const finalDesign = entryData.design || "N/A";
    const finalColor = entryData.color || "N/A";
    const finalCutter = entryData.cutterName || "N/A";

    if (user?.role === "manager") {
      if (
        !entryData.design ||
        !entryData.color ||
        !entryData.cutterName ||
        !entryData.lotNo
      ) {
        showNotify(
          "ম্যানেজার হিসেবে ডিজাইন, কালার, লট নম্বর এবং মাস্টারের নাম দেওয়া বাধ্যতামূলক!",
          "error",
        );
        return;
      }
    }

    const validSizes = entryData.sizes.filter(
      (s) => s.size && (Number(s.borka || 0) > 0 || Number(s.hijab || 0) > 0),
    );

    if (validSizes.length === 0) {
      showNotify("অন্তত একটি সাইজ এবং সঠিক সংখ্যা দিন!", "error");
      return;
    }

    const newEntries = validSizes.map((s, idx) => ({
      id: Date.now() + idx + Math.random(),
      date: entryData.date
        ? new Date(entryData.date).toLocaleDateString("en-GB")
        : new Date().toLocaleDateString("en-GB"),
      time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      design: finalDesign,
      color: finalColor,
      size: s.size,
      cutterName: finalCutter,
      lotNo: entryData.lotNo || "N/A",
      borka: Number(s.borka || 0),
      hijab: Number(s.hijab || 0),
    }));

    setMasterData((prev) => ({
      ...prev,
      cuttingStock: [...newEntries, ...(prev.cuttingStock || [])],
    }));

    newEntries.forEach((entry) => {
      syncToSheet({
        type: "CUTTING_ENTRY",
        worker: entry.cutterName,
        detail: `${entry.design}(${entry.color}) - ${entry.size} - B:${entry.borka} H:${entry.hijab}`,
        amount: 0,
      });
    });

    setShowModal(false);
    setEntryData({
      design: "",
      color: "",
      cutterName: "",
      lotNo: (parseInt(entryData.lotNo) + 1).toString(),
      date: new Date().toISOString().split("T")[0],
      sizes: [{ size: "", borka: "", hijab: "" }],
    });
    showNotify(`${finalDesign} (${finalColor}) সফলভাবে স্টক এ যোগ হয়েছে!`);

    if (shouldPrint && newEntries.length > 0) {
      setPrintSlip(newEntries[0]);
    }
  };

  const handleDelete = (id) => {
    if (!confirm("আপনি কি নিশ্চিত? এটি মুছে ফেলা হবে।")) return;
    setMasterData((prev) => ({
      ...prev,
      cuttingStock: (prev.cuttingStock || []).filter((item) => item.id !== id),
    }));
    showNotify("কাটিং রেকর্ড মুছে ফেলা হয়েছে!", "info");
  };

  if (printSlip) {
    const SlipCard = ({ copyTitle }) => (
      <ConfigProvider theme={QR_Slip_Theme}>
        <div className="w-full bg-white flex flex-col relative overflow-hidden border-2 border-black p-12" style={{ height: '148.5mm' }}>
             <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                <div>
                   <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">NRZO0NE</h1>
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 mt-2">PRODUCTION UNIT • CUTTING</p>
                </div>
                <div className="text-right">
                   <p className="text-xl font-black uppercase tracking-widest italic decoration-double">LOT #{printSlip.lotNo}</p>
                   <p className="text-sm font-black text-slate-400 mt-1">{printSlip.date}</p>
                </div>
             </div>

             <div className="flex-1 flex flex-col justify-start gap-8">
                  <div className="grid grid-cols-2 gap-8">
                      <div className="border-4 border-black p-6 bg-slate-50 rounded-[2rem]">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DESIGN / MODEL</p>
                          <p className="text-3xl font-black uppercase truncate">{printSlip.design}</p>
                      </div>
                      <div className="border-4 border-black p-6 bg-slate-50 rounded-[2rem]">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">AUTHORIZED CUTTER</p>
                          <p className="text-3xl font-black uppercase truncate">{printSlip.cutterName}</p>
                      </div>
                  </div>

                  <div className="border-4 border-black rounded-[2.5rem] overflow-hidden flex-1">
                      <table className="w-full h-full text-left border-collapse">
                          <thead className="bg-black text-[10px] text-white font-black uppercase tracking-widest">
                              <tr>
                                  <th className="px-6 py-3 border-b-2 border-black">SIZE / আকার</th>
                                  <th className="px-6 py-3 border-b-2 border-black">BORKA (PCS)</th>
                                  <th className="px-6 py-3 border-b-2 border-black">HIJAB (PCS)</th>
                              </tr>
                          </thead>
                          <tbody>
                              {(printSlip.sizes || []).map((s, idx) => (
                                  <tr key={idx} className="border-b-2 border-black/5 last:border-0 font-black italic">
                                      <td className="px-6 py-4 text-2xl uppercase tracking-tighter">{s.size}</td>
                                      <td className="px-6 py-4 text-4xl">{s.borka || '-'}</td>
                                      <td className="px-6 py-4 text-4xl">{s.hijab || '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
             </div>

             <div className="mt-8 pt-8 flex justify-between items-center border-t-2 border-dashed border-slate-200">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black rounded flex items-center justify-center p-2">
                        <img src={logoWhite} className="w-full h-full object-contain" alt="NR" />
                      </div>
                      <div className="text-right flex items-center gap-6">
                           <div className="flex gap-10">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL B</p>
                                    <p className="text-2xl font-black italic">{(printSlip.sizes || []).reduce((n, s) => n + Number(s.borka || 0), 0)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL H</p>
                                    <p className="text-2xl font-black italic">{(printSlip.sizes || []).reduce((n, s) => n + Number(s.hijab || 0), 0)}</p>
                                </div>
                           </div>
                           <QRCode value={printSlip.lotNo} size={80} bordered={false} style={{ padding: 0 }} />
                      </div>
                  </div>
                  <div className="px-12 py-4 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.4em] italic text-xl shadow-2xl">
                      {copyTitle}
                  </div>
             </div>
        </div>
      </ConfigProvider>
    );

    return (
      <div className="min-h-screen bg-white text-black italic font-outfit py-10 print:py-0 print:bg-white">
        <style>{`
          @media print { 
              .no-print { display: none !important; } 
              body { background: white !important; margin: 0; padding: 0; }
              @page { size: A4 portrait; margin: 0; }
          }
        `}</style>
        <div className="no-print flex justify-between items-center mb-6 w-[210mm] mx-auto bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-black font-black">
          <button onClick={() => setPrintSlip(null)} className="bg-slate-50 text-slate-600 px-10 py-5 uppercase text-xs rounded-full hover:bg-black hover:text-white transition-all">Cancel</button>
          <button onClick={() => window.print()} className="bg-black text-white px-10 py-5 rounded-full uppercase text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
            <Printer size={18} /> Print Job
          </button>
        </div>
        
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white border border-gray-100 overflow-hidden relative">
          <SlipCard copyTitle="MASTER COPY" />
          <div className="h-6 w-full border-t-4 border-dashed border-slate-200"></div>
          <SlipCard copyTitle="RECIPIENT COPY" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 italic text-black font-outfit uppercase">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActivePanel("Overview")}
            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="section-header">
                Cutting <span className="text-slate-400">Unit</span>
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">
               Primary Fabric Injection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Lot Intelligence</p>
            <p className="text-2xl font-black italic text-black dark:text-white leading-none uppercase">
                {uniqueLots.length} <span className="text-[10px] text-slate-300 ml-1">Lots</span>
            </p>
          </div>
        </div>
      </div>

      {/* Unified Floating Filter Bar */}
      <div className="floating-header-group mb-12 p-2 dark:bg-zinc-900 border-none shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/50 p-1.5 rounded-2xl w-full lg:w-auto">
                  <button className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black shadow-lg">চলমান</button>
              </div>
              
              <div className="flex-1 relative w-full group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                      <Search size={16} />
                  </div>
                  <input
                      placeholder="সার্চ লট বা ডিজাইন নম্বর..."
                      className="w-full bg-slate-50 dark:bg-black/20 h-14 rounded-2xl pl-16 pr-8 text-xs font-black uppercase tracking-widest italic outline-none border border-transparent focus:border-black/10 dark:focus:border-white/10 transition-all text-black dark:text-white"
                  />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-slate-50 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h3 className="text-lg md:text-3xl font-black uppercase tracking-tighter italic flex items-center gap-4 text-black">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                      <Search
                        size={24}
                        strokeWidth={3}
                        className="text-black"
                      />
                    </div>
                    <span>Stock Matrix Probe</span>
                  </h3>
                  <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">
                    REAL-TIME INVENTORY ANALYTICS
                  </p>
                </div>
                <div className="flex p-2 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
                  <button
                    onClick={() => setCheckMode("swing")}
                    className={`px-8 md:px-12 py-3 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${checkMode === "swing" ? "bg-black text-white shadow-xl translate-y-[-2px]" : "text-slate-400 hover:text-black"}`}
                  >
                    Sewing
                  </button>
                  <button
                    onClick={() => setCheckMode("stone")}
                    className={`px-8 md:px-12 py-3 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${checkMode === "stone" ? "bg-black text-white shadow-xl translate-y-[-2px]" : "text-slate-400 hover:text-black"}`}
                  >
                    Stone
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <select
                  className="form-input text-sm md:text-base font-black uppercase py-3 md:py-4 bg-slate-50 border-slate-100 text-black rounded-xl"
                  onChange={(e) =>
                    setCheckSelection((prev) => ({
                      ...prev,
                      design: e.target.value,
                    }))
                  }
                  value={checkSelection.design}
                >
                  <option value="">DESIGN</option>
                  {(masterData.designs || []).map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-input text-sm md:text-base font-black uppercase py-3 md:py-4 bg-slate-50 border-slate-100 text-black rounded-xl"
                  onChange={(e) =>
                    setCheckSelection((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  value={checkSelection.color}
                >
                  <option value="">COLOR</option>
                  {(masterData.colors || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  className="form-input text-sm md:text-base font-black uppercase py-3 md:py-4 bg-slate-50 border-slate-100 text-black rounded-xl"
                  onChange={(e) =>
                    setCheckSelection((prev) => ({
                      ...prev,
                      size: e.target.value,
                    }))
                  }
                  value={checkSelection.size}
                >
                  <option value="">SIZE</option>
                  {(masterData.sizes || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 md:p-6 border border-slate-100 italic relative overflow-hidden shadow-inner">
                {checkMode ? (
                  <div className="w-full animate-fade-up">
                    {checkSelection.design &&
                    checkSelection.color &&
                    !checkSelection.size ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center px-8 mb-4 border-b border-slate-100 pb-4">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-[0.4em]">
                            Size Breakdown
                          </p>
                          <p className="text-xs font-black text-slate-600 uppercase tracking-[0.4em]">
                            Borka / Hijab
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-4">
                          {(masterData.sizes || []).map((s) => {
                            const res =
                              checkMode === "swing"
                                ? getStock(
                                    masterData,
                                    checkSelection.design,
                                    checkSelection.color,
                                    s,
                                  )
                                : getSewingStock(
                                    masterData,
                                    checkSelection.design,
                                    checkSelection.color,
                                    s,
                                  );

                            if (res.borka === 0 && res.hijab === 0) return null;

                            return (
                              <div
                                key={s}
                                className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
                              >
                                <span className="text-2xl font-black italic text-black">
                                  {s}
                                </span>
                                <div className="flex gap-8">
                                  <div className="text-right">
                                    <span className="text-xs text-slate-600 block uppercase font-bold">
                                      Borka
                                    </span>
                                    <span className="text-2xl font-black text-black">
                                      {res.borka}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-slate-600 block uppercase font-bold">
                                      Hijab
                                    </span>
                                    <span className="text-2xl font-black text-black">
                                      {res.hijab}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {!(masterData.sizes || []).some((s) => {
                            const res =
                              checkMode === "swing"
                                ? getStock(
                                    masterData,
                                    checkSelection.design,
                                    checkSelection.color,
                                    s,
                                  )
                                : getSewingStock(
                                    masterData,
                                    checkSelection.design,
                                    checkSelection.color,
                                    s,
                                  );
                            return res.borka > 0 || res.hijab > 0;
                          }) && (
                            <p className="text-center py-10 text-slate-400 font-black uppercase tracking-widest text-xs">
                              No Stock Available
                            </p>
                          )}
                        </div>
                      </div>
                    ) : checkSelection.size ? (
                      <div className="flex w-full items-center justify-around">
                        <div className="flex flex-col items-center">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">
                            BORKA
                          </p>
                          <p className="text-3xl md:text-7xl font-black italic tracking-tighter leading-none text-black">
                            {checkStockResult.borka}
                          </p>
                        </div>
                        <div className="w-[2px] h-20 bg-slate-200 rounded-full"></div>
                        <div className="flex flex-col items-center">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">
                            HIJAB
                          </p>
                          <p className="text-3xl md:text-7xl font-black italic tracking-tighter leading-none text-black">
                            {checkStockResult.hijab}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-14 text-slate-100 flex flex-col items-center gap-6">
                        <Search
                          size={64}
                          strokeWidth={1}
                          className="opacity-20"
                        />
                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-center">
                          SELECT DESIGN & COLOR TO SEE BREAKDOWN
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-14 text-slate-100 flex flex-col items-center gap-6">
                    <Search size={64} strokeWidth={1} className="opacity-20" />
                    <p className="text-[11px] font-black uppercase tracking-[0.6em]">
                      SELECT PARAMETERS TO PROBE DATA
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between px-6">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">
                Production <span className="text-slate-300">Artifacts</span>
              </h3>
              <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest italic text-slate-500">
                {(masterData.cuttingStock || []).length} Records
              </div>
            </div>

            <div className="space-y-4">
              {(masterData.cuttingStock || []).length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
                  <Box size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Cut Nodes</p>
                </div>
              ) : (
                (masterData.cuttingStock || []).map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="item-card flex flex-col md:flex-row justify-between items-center gap-8 group"
                  >
                    <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                        <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                            {s.size}
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-4">
                                <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                                    • কাটিং # {s.cutterName}
                                </h4>
                                <span className="badge-standard">#{s.lotNo}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase italic tracking-widest">
                                <span>• {s.design}</span>
                                <span>• {s.color}</span>
                                <span>• {s.date}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0">
                        <div className="flex gap-12">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Borka</p>
                                <p className="text-4xl font-black italic tracking-tighter leading-none">{s.borka}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Hijab</p>
                                <p className="text-4xl font-black italic tracking-tighter leading-none">{s.hijab}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                              onClick={() => setPrintSlip(s)}
                              className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all shadow-sm"
                            >
                              <Printer size={18} />
                            </button>
                            {isAdmin && (
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                >
                                  <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white rounded-3xl p-12 flex items-center justify-between border-4 border-slate-50 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-500">
                <CheckCircle size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">
                  SYSTEM STATUS
                </p>
                <p className="text-xl font-black italic tracking-tighter leading-none text-black">
                  OPERATION NOMINAL
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-black animate-spin"></div>
          </div>

          <div className="bg-black text-white rounded-[4rem] p-10 md:p-12 shadow-3xl relative overflow-hidden group italic">
            <div className="relative z-10 space-y-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Yield Optimizer</h3>
                        <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.4em] mt-3">Advanced Waste Reduction Engine</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl">
                        <Scissors size={24} className="text-emerald-500" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-3 block">Roll Width (Inches)</label>
                        <input 
                            type="number" 
                            className="bg-transparent border-none text-4xl font-black italic w-full outline-none text-white focus:text-emerald-500 transition-colors" 
                            value={optimizer.rollWidth}
                            onChange={e => setOptimizer(p => ({ ...p, rollWidth: e.target.value }))}
                        />
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-3 block">Design Width (Inches)</label>
                        <input 
                            type="number" 
                            className="bg-transparent border-none text-4xl font-black italic w-full outline-none text-white focus:text-emerald-500 transition-colors" 
                            value={optimizer.pieceWidth}
                            onChange={e => setOptimizer(p => ({ ...p, pieceWidth: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Efficiency Rating</span>
                        <span className={`text-xl font-black italic ${optimization.rating === 'ELITE' ? 'text-emerald-400' : optimization.rating === 'OPTIMAL' ? 'text-emerald-500' : 'text-amber-500'}`}>{optimization.rating}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white/5 rounded-3xl text-center">
                            <p className="text-[8px] font-black uppercase text-white/40 mb-1">Max Pieces</p>
                            <p className="text-2xl font-black italic">{optimization.count} / Layer</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-3xl text-center">
                            <p className="text-[8px] font-black uppercase text-white/40 mb-1">Waste Factor</p>
                            <p className="text-2xl font-black italic">{optimization.waste}%</p>
                        </div>
                    </div>
                </div>
            </div>
            <Scissors className="absolute bottom-[-10%] right-[-5%] text-white opacity-[0.03]" size={200} />
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[250] flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl my-auto rounded-[2.5rem] border-2 border-black shadow-3xl p-6 md:p-12 space-y-10 animate-fade-up text-black italic relative font-outfit uppercase">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-4 bg-slate-50 hover:bg-black hover:text-white rounded-full transition-all z-10 border border-slate-100 shadow-sm"><X size={24} /></button>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
                <Scissors size={32} />
              </div>
              <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">Cutting <span className="text-slate-400">Entry</span></h3>
              <p className="inline-block px-4 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">LOT REGISTRATION MODE</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Authorized Cutter</label>
                        <select className="premium-input bg-black text-white h-16 w-full rounded-2xl px-6 font-black text-sm uppercase appearance-none" value={entryData.cutterName} onChange={e => setEntryData(p => ({ ...p, cutterName: e.target.value }))}>
                            <option value="">-- SELECT WORKER --</option>
                            {(masterData.workerCategories?.cutting || []).map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Design / Model</label>
                        <select className="premium-input bg-slate-50 border-slate-100 h-16 w-full rounded-2xl px-6 font-black text-sm uppercase appearance-none" value={entryData.design} onChange={e => setEntryData(p => ({ ...p, design: e.target.value }))}>
                            <option value="">-- SELECT DESIGN --</option>
                            {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Lot ID</label>
                            <input className="premium-input bg-slate-50 border-slate-100 h-16 w-full rounded-2xl px-6 font-black text-sm text-center" value={entryData.lotNo} onChange={e => setEntryData(p => ({ ...p, lotNo: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Date</label>
                            <input type="date" className="premium-input bg-slate-50 border-slate-100 h-16 w-full rounded-2xl px-6 font-black text-[10px] text-center" value={entryData.date} onChange={e => setEntryData(p => ({ ...p, date: e.target.value }))} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 flex flex-col bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <label className="text-[10px] font-black uppercase text-black tracking-widest">Size Matrix Distribution</label>
                        <button onClick={addSize} className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"><Plus size={14} /> Add Pattern</button>
                    </div>

                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {entryData.sizes.map((s, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 items-center animate-fade-in">
                                <div className="col-span-3">
                                    <select className="h-14 w-full bg-white border border-slate-200 rounded-xl px-4 font-black uppercase text-xs" value={s.size} onChange={e => handleSizeChange(i, 'size', e.target.value)}>
                                        <option value="">SIZE</option>
                                        {(masterData.sizes || []).map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-4 bg-white border border-slate-200 rounded-xl px-4 h-14 flex items-center gap-2">
                                    <p className="text-[8px] font-black text-slate-300">B</p>
                                    <input type="number" className="bg-transparent w-full font-black text-xl outline-none" placeholder="0" value={s.borka} onChange={e => handleSizeChange(i, 'borka', e.target.value)} />
                                </div>
                                <div className="col-span-4 bg-white border border-slate-200 rounded-xl px-4 h-14 flex items-center gap-2">
                                    <p className="text-[8px] font-black text-slate-300">H</p>
                                    <input type="number" className="bg-transparent w-full font-black text-xl outline-none" placeholder="0" value={s.hijab} onChange={e => handleSizeChange(i, 'hijab', e.target.value)} />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button onClick={() => removeSize(i)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center px-4">
                        <p className="text-[10px] font-black uppercase text-slate-400">Aggregate Volume</p>
                        <div className="flex gap-8">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Total Borka</p>
                                <p className="text-2xl font-black">{entryData.sizes.reduce((sum, s) => sum + Number(s.borka || 0), 0)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Total Hijab</p>
                                <p className="text-2xl font-black text-rose-500">{entryData.sizes.reduce((sum, s) => sum + Number(s.hijab || 0), 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-20">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-6 bg-white px-12 py-6 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
        >
          <div className="p-3 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
            <ArrowLeft size={20} strokeWidth={3} />
          </div>
          <span className="text-lg font-black uppercase italic tracking-widest text-black">
            ড্যাশবোর্ডে ফিরে যান
          </span>
          <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  );
};

export default CuttingPanel;
