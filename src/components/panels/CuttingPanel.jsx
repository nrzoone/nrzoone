// DEPLOYMENT TRIGGER: 2026-02-26 05:13
import React, { useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Scissors,
  Search,
  CheckCircle,
  AlertCircle,
  Save,
  Minus,
  Printer,
  ArrowLeft,
  Box,
} from "lucide-react";
import { getStock, getSewingStock } from "../../utils/calculations";
import { syncToSheet } from "../../utils/syncUtils";
import logoWhite from "../../assets/logo_white.png";
import logoBlack from "../../assets/logo_black.png";

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
    const SlipCard = ({ copyTitle }) => {
      const rate = masterData.workerWages?.["cutting"] || 0;

      return (
        <div
          className="w-full h-full flex-1 border-4 border-black bg-white relative overflow-hidden flex flex-col justify-center text-black italic font-outfit"
          style={{ padding: "10mm 12mm" }}
        >
          {/* Watermark Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] -rotate-12 pointer-events-none">
            <img
              src={logoBlack}
              alt=""
              className="w-[600px] h-[600px] opacity-[0.04] -rotate-12 pointer-events-none mix-blend-multiply"
            />
          </div>
          <div className="relative z-10 w-full h-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
              <div className="flex items-center gap-5">
                <img
                  src={logoBlack}
                  alt="NRZO0NE"
                  className="w-20 h-20 object-contain mix-blend-multiply"
                />
                <div>
                  <h1 className="text-2xl font-black italic tracking-tighter leading-none">
                    NRZO0NE
                  </h1>
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-600">
                    CUTTING DIVISION
                  </p>
                </div>
              </div>
              <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl relative overflow-hidden">
                <p className="text-[9px] font-black uppercase text-white/40 mb-1">
                  লট নম্বর (Lot No)
                </p>
                <p className="text-2xl font-black italic text-white leading-none">
                  #{printSlip.lotNo}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border-2 border-slate-100">
                    <p className="text-[9px] font-black uppercase text-slate-600 mb-1">
                      কাটার (Cutter)
                    </p>
                    <p className="text-2xl font-black italic text-black uppercase">
                      {printSlip.cutterName}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border-2 border-slate-100">
                    <p className="text-[9px] font-black uppercase text-slate-600 mb-1">
                      তারিখ (Date)
                    </p>
                    <p className="text-2xl font-black italic text-black">
                      {printSlip.date}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-600 uppercase">
                      ডিজাইন (Design)
                    </p>
                    <p className="text-lg font-black italic text-black">
                      {printSlip.design}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-600 uppercase">
                      কালার (Color)
                    </p>
                    <p className="text-lg font-black italic text-black">
                      {printSlip.color || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-600 uppercase">
                      সাইজ (Size)
                    </p>
                    <p className="text-lg font-black italic text-black">
                      {printSlip.size}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100 text-center relative">
                    <p className="text-[9px] font-black uppercase mb-1 text-rose-400">
                      বোরকা (Borka)
                    </p>
                    <p className="text-3xl font-black italic text-rose-600 leading-none">
                      {printSlip.borka}
                    </p>
                  </div>
                  <div className="bg-teal-50 p-6 rounded-3xl border-2 border-teal-100 text-center relative">
                    <p className="text-[9px] font-black uppercase mb-1 text-teal-400">
                      হিজাব (Hijab)
                    </p>
                    <p className="text-3xl font-black italic text-teal-600 leading-none">
                      {printSlip.hijab}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 pt-6 border-t-2 border-slate-50/10 mt-4">
                <div className="text-center">
                  <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500">
                    NRZO0NE Smart Track™
                  </p>
                  <p className="text-[10px] font-black text-black mt-2 uppercase italic bg-slate-100 px-4 py-1 rounded-full">
                    ID: {printSlip.id}
                  </p>
                </div>
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-400 border-t-2 border-black/5 pt-4 w-full text-center">
                  CUTTING UNIT - {copyTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-white text-black italic font-outfit py-10 print:py-0 print:bg-white">
        <style>{`
                    @media print { 
                        .no-print { display: none !important; } 
                        body { background: white !important; margin: 0; padding: 0; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
        <div className="no-print flex justify-between items-center mb-6 w-[210mm] mx-auto bg-white p-6 rounded-2xl shadow-xl border-4 border-black font-black">
          <button
            onClick={() => setPrintSlip(null)}
            className="bg-slate-50 text-slate-600 px-5 py-3 uppercase text-xs rounded-full hover:bg-black hover:text-white transition-all"
          >
            Cancel
          </button>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest hidden md:block">
            Full A4 Page
          </p>
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-5 py-3 rounded-full uppercase text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
          >
            <Printer size={18} /> Print Full A4
          </button>
        </div>

        <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-2xl flex flex-col print:w-full print:h-[100vh] print:shadow-none box-border">
          <SlipCard copyTitle="WORKER COPY" />
          <div className="w-full border-t-4 border-dashed border-slate-300 relative flex justify-center py-0 shrink-0 select-none opacity-60 z-20">
            <span className="absolute top-1/2 -translate-y-1/2 bg-white px-4 py-1 text-[8px] font-black uppercase tracking-[0.5em] text-slate-500 border-2 border-slate-200 rounded-full">
              ✂ এখান থেকে কাটুন • Cut Here
            </span>
          </div>
          <SlipCard copyTitle="FACTORY COPY" />
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
          <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Lot Intelligence</p>
            <p className="text-3xl font-black italic text-black leading-none uppercase">
                {uniqueLots.length} <span className="text-[11px] text-slate-300 ml-1">Lots</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="black-button"
          >
            <Plus size={18} strokeWidth={4} /> নতুন এন্ট্রি
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="premium-card relative overflow-hidden group">
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

              <div className="bg-slate-50 rounded-[2rem] p-8 md:p-10 border border-slate-100 italic relative overflow-hidden shadow-inner">
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
                                className="item-card flex justify-between items-center"
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
            {/* Title for list */}
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
          <div className="premium-card flex items-center justify-between">
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
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[150] flex items-start md:items-center justify-center p-2 md:p-3 overflow-y-auto">
          <div className="bg-white rounded-lg md:rounded-2xl w-full max-w-4xl border-2 border-black shadow-3xl animate-fade-up my-auto flex flex-col text-black h-auto">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-gray-50 flex-shrink-0 italic">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="p-3 md:p-4 bg-black text-white rounded-2xl shadow-xl rotate-2">
                  <Plus size={32} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-xl md:text-3xl tracking-tighter leading-none">
                    কাটিং এন্ট্রি
                  </h3>
                  <p className="text-[7px] md:text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mt-1">
                    Advanced Production Injection
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEntryData({
                    design: "",
                    color: "",
                    cutterName: "",
                    lotNo: nextLotNo,
                    date: new Date().toISOString().split("T")[0],
                    sizes: [{ size: "", borka: "", hijab: "" }],
                  });
                }}
                className="p-3 md:p-4 bg-white border border-slate-100 rounded-full hover:bg-black hover:text-white transition-all text-black shadow-sm flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 md:p-5 space-y-8 md:space-y-10 overflow-y-auto flex-1 italic">
              <div className="bg-slate-50/50 p-4 md:p-5 rounded-xl border border-slate-50 space-y-6 md:space-y-8">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-1 h-6 bg-black rounded-full"></div>
                  <h4 className="text-sm md:text-base font-black uppercase tracking-widest text-black">
                    ১. মাস্টার ও ডিজাইন (Identity)
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">
                      Cutting Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-black text-white px-6 py-4 rounded-lg border-none font-black text-xs outline-none focus:ring-2 focus:ring-white/20"
                      value={entryData.date}
                      onChange={(e) =>
                        setEntryData((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">
                      Master Name / কার মাল
                    </label>
                    <select
                      className="flex-1 bg-slate-50 px-6 py-4 rounded-lg border-2 border-slate-100 font-black text-xs outline-none focus:border-black transition-all appearance-none"
                      value={entryData.cutterName}
                      onChange={(e) =>
                        setEntryData((p) => ({
                          ...p,
                          cutterName: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Master</option>
                      {(masterData.cutters || []).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase ml-4 tracking-widest">
                      ডিজাইন (Style)
                    </label>
                    <select
                      className="form-input text-base md:text-lg font-black uppercase py-3 md:py-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl text-black shadow-sm"
                      value={entryData.design}
                      onChange={(e) =>
                        setEntryData((p) => ({ ...p, design: e.target.value }))
                      }
                    >
                      <option value="">পছন্দ করুন</option>
                      {(masterData.designs || []).map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase ml-4 tracking-widest">
                      কালার (Color)
                    </label>
                    <select
                      className="form-input text-base md:text-lg font-black uppercase py-3 md:py-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl text-black shadow-sm"
                      value={entryData.color}
                      onChange={(e) =>
                        setEntryData((p) => ({ ...p, color: e.target.value }))
                      }
                    >
                      <option value="">পছন্দ করুন</option>
                      {(masterData.colors || []).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <label className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase ml-4 tracking-widest">
                    লট নম্বর (Lot Number)
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      list="cutting-lots"
                      placeholder={`LOT NO (e.g. ${nextLotNo})`}
                      className="form-input text-base md:text-lg font-black uppercase py-3 md:py-4 bg-black text-white border-none rounded-xl md:rounded-2xl shadow-xl focus:ring-4 focus:ring-emerald-500/20 italic px-6 md:px-8 h-12 md:h-16 w-full"
                      value={entryData.lotNo}
                      onChange={(e) => {
                        const val = e.target.value;
                        const lot = uniqueLots.find((l) => l.lotNo === val);
                        if (lot) {
                          setEntryData((p) => ({
                            ...p,
                            lotNo: val,
                            design: lot.design,
                            color: lot.color,
                          }));
                        } else {
                          setEntryData((p) => ({ ...p, lotNo: val }));
                        }
                      }}
                    />
                    <datalist id="cutting-lots">
                      <option value={nextLotNo}>Next: {nextLotNo}</option>
                      {uniqueLots.map((l) => (
                        <option key={l.lotNo} value={l.lotNo}>
                          {l.design} | {l.color}
                        </option>
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={() =>
                        setEntryData((p) => ({ ...p, lotNo: nextLotNo }))
                      }
                      className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-3 md:px-5 py-1 md:py-2 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg"
                    >
                      Auto Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 md:p-5 rounded-2xl md:rounded-2xl border border-slate-50 space-y-6 md:space-y-8">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-sm md:text-base font-black uppercase tracking-widest text-emerald-600">
                    ২. সাইজ ও সংখ্যা (Size & Quantity)
                  </h4>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 px-2">
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase italic">
                    সব সাইজের মাল একসাথেই এন্ট্রি দিন
                  </p>
                  <button
                    onClick={handleAddSizeRow}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white border-none rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                  >
                    <Plus size={14} /> নতুন সাইজ
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {entryData.sizes.map((row, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-slate-100 flex flex-col gap-3 shadow-sm relative group/size hover:border-black transition-all"
                    >
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-600 uppercase ml-1">
                          Size
                        </label>
                        <select
                          className="w-full text-[10px] md:text-xs font-black uppercase bg-slate-50 border-none rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-slate-100 italic"
                          value={row.size}
                          onChange={(e) =>
                            handleSizeChange(idx, "size", e.target.value)
                          }
                        >
                          <option value="">--</option>
                          {(masterData.sizes || []).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase ml-1 block text-center">
                            বোরকা
                          </label>
                          <input
                            type="number"
                            className="w-full text-center font-black text-sm md:text-base bg-slate-50 border-none rounded-lg py-2 outline-none focus:ring-1 focus:ring-slate-100"
                            placeholder="0"
                            value={row.borka}
                            onChange={(e) =>
                              handleSizeChange(idx, "borka", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[7px] md:text-[8px] font-black text-emerald-500 uppercase ml-1 block text-center">
                            হিজাব
                          </label>
                          <input
                            type="number"
                            className="w-full text-center font-black text-sm md:text-base bg-emerald-50/20 border-none rounded-lg py-2 outline-none focus:ring-1 focus:ring-emerald-100 text-emerald-600"
                            placeholder="0"
                            value={row.hijab}
                            onChange={(e) =>
                              handleSizeChange(idx, "hijab", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      {entryData.sizes.length > 1 && (
                        <button
                          onClick={() => handleRemoveSizeRow(idx)}
                          className="absolute -top-2 -right-2 p-1.5 bg-white text-rose-500 border border-slate-100 rounded-full shadow-md opacity-0 group-hover/size:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                        >
                          <Minus size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-gray-50 flex-shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 hover:text-black transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddCutting(false)}
                className="px-8 py-2 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                SAVE ENTRY
              </button>
              <button
                onClick={() => handleAddCutting(true)}
                className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <Printer size={12} /> & PRINT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Slip is handled by early return at top */}

      {/* Back Button Bottom */}
      <div className="pt-20 pb-10 flex justify-center no-print">
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

export default CuttingPanel;
