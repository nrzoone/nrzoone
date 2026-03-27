import React, { useState } from "react";
import {
  FileText,
  Search,
  Printer,
  UserCheck,
  BarChart,
  Clock,
  Database,
  ArrowLeft,
} from "lucide-react";
import WorkerSummary from "../WorkerSummary";
import WeeklyInvoice from "../WeeklyInvoice";
import BusinessIntel from "../BusinessIntel";

const ReportsPanel = ({ masterData, user, setActivePanel, t }) => {
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "intel" : "summary",
  );
  const [transactionTab, setTransactionTab] = useState("productions");
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [search, setSearch] = useState("");
  const isWorker = user?.role === "worker";
  const isAdmin = user?.role === "admin";

  const filteredProductions = masterData.productions.filter((p) => {
    const matchesUser = isWorker
      ? p.worker.toLowerCase() === user.name.toLowerCase()
      : true;
    const matchesSearch =
      p.worker.toLowerCase().includes(search.toLowerCase()) ||
      p.design.toLowerCase().includes(search.toLowerCase());
    return matchesUser && matchesSearch;
  });

  const filteredCutting = masterData.cuttingStock.filter(
    (c) =>
      c.design.toLowerCase().includes(search.toLowerCase()) ||
      (c.cutterName &&
        c.cutterName.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredOutside = (masterData.outsideWorkEntries || []).filter(
    (e) =>
      e.worker.toLowerCase().includes(search.toLowerCase()) ||
      e.task.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredAttendance = (masterData.attendance || []).filter(
    (a) =>
      a.worker.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredExpenses = (masterData.expenses || []).filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPata = (masterData.pataEntries || []).filter(
    (e) =>
      e.worker?.toLowerCase().includes(search.toLowerCase()) ||
      e.design?.toLowerCase().includes(search.toLowerCase()),
  );

  const [isPrinting, setIsPrinting] = useState(false);

  // Collect all active/pending work for the Global Dispatch Hub
  const allActiveJobs = [
    ...(masterData.productions || [])
      .filter((p) => p.status === "Pending")
      .map((p) => ({ ...p, jobType: "Sewing" })),
    ...(masterData.pataEntries || [])
      .filter((p) => (p.status || "Pending") === "Pending")
      .map((p) => ({
        ...p,
        jobType: "Pata",
        design: p.design || "Pata Work",
        worker: p.worker || "Worker",
      })),
    ...(masterData.outsideWorkEntries || [])
      .filter((o) => o.status === "Pending")
      .map((o) => ({
        ...o,
        jobType: "Outside",
        worker: o.worker || "Outsource",
      })),
  ].sort((a, b) => b.id - a.id);

  if (isBatchPrinting) {
    const jobsToPrint = allActiveJobs.filter((j) =>
      selectedJobIds.includes(j.id),
    );
    return (
      <div className="min-h-screen bg-white text-black p-4 md:p-10 italic font-outfit">
        <style>{`
                    @media print { 
                        .no-print { display: none !important; } 
                        body { background: white !important; margin: 0; padding: 0; }
                        .grid-slip-container { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 0; height: 297mm; width: 210mm; page-break-after: always; }
                        .grid-slip { border: 1px solid #eee; padding: 20px; box-sizing: border-box; height: 148.5mm; width: 105mm; overflow: hidden; display: flex; flex-col: column; justify-content: space-between; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
        <div className="no-print flex justify-between items-center mb-10 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 italic">
          <button
            onClick={() => setIsBatchPrinting(false)}
            className="px-8 py-4 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest border border-slate-200"
          >
            ← Back
          </button>
          <p className="text-[10px] uppercase font-black text-slate-400">
            Total: {jobsToPrint.length} Slips (Batch Grid Mode)
          </p>
          <button
            onClick={() => window.print()}
            className="px-12 py-4 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl"
          >
            Confirm Print
          </button>
        </div>
        <div className="mx-auto w-[210mm]">
          {Array.from({ length: Math.ceil(jobsToPrint.length / 4) }).map(
            (_, pageIdx) => (
              <div key={pageIdx} className="grid-slip-container">
                {jobsToPrint
                  .slice(pageIdx * 4, pageIdx * 4 + 4)
                  .map((job, idx) => (
                    <div
                      key={idx}
                      className="grid-slip relative border-r border-b"
                    >
                      <div className="absolute top-4 right-4 text-[10px] font-black uppercase text-slate-200">
                        {job.jobType}
                      </div>
                      <div className="flex items-center gap-4 border-b border-black/5 pb-4 mb-4">
                        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center font-black italic">
                          NZ
                        </div>
                        <div>
                          <h4 className="text-xl font-black italic leading-none">
                            {job.design || job.task}
                          </h4>
                          <p className="text-[10px] font-black uppercase text-slate-600 mt-1 italic tracking-widest">
                            Lot: {job.lotNo || "N/A"} • {job.date}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-slate-100/50 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black uppercase text-slate-500 italic tracking-[0.2em]">
                            Official Contractor
                          </p>
                          <p className="text-xl font-black uppercase italic text-black">
                            {job.worker}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 border-2 border-rose-50 text-center rounded-xl bg-rose-50/10">
                            <p className="text-[8px] font-black uppercase text-rose-400">
                              Items/Borka
                            </p>
                            <p className="text-2xl font-black">
                              {job.issueBorka ||
                                job.pataQty ||
                                job.borkaQty ||
                                0}
                            </p>
                          </div>
                          <div className="p-3 border-2 border-indigo-50 text-center rounded-xl bg-indigo-50/10">
                            <p className="text-[8px] font-black uppercase text-indigo-400">
                              Misc/Hijab
                            </p>
                            <p className="text-2xl font-black">
                              {job.issueHijab || job.hijabQty || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-black/5">
                        <div className="text-[8px] font-black uppercase text-slate-300">
                          Verified Signature
                          <div className="h-4 border-b border-black/10 mt-2"></div>
                        </div>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://nrzo0ne.vercel.app?track=${job.id}`)}`}
                          alt="QR"
                          className="w-16 h-16 rounded-lg opacity-80"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (isPrinting) {
    const printData =
      transactionTab === "productions"
        ? filteredProductions
        : transactionTab === "cutting"
          ? filteredCutting
          : transactionTab === "pata"
            ? filteredPata
            : transactionTab === "outside"
              ? filteredOutside
              : transactionTab === "attendance"
                ? filteredAttendance
                : filteredExpenses;

    return (
      <div className="min-h-screen bg-white p-12 text-black font-serif italic">
        <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; margin: 0; padding: 0; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { size: A4 portrait; margin: 15mm; }
                    }
                `}</style>

        <div className="no-print flex justify-between items-center mb-12 max-w-4xl mx-auto bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
          <button
            onClick={() => setIsPrinting(false)}
            className="px-8 py-4 bg-white text-black font-black uppercase text-xs rounded-full border border-slate-200 shadow-sm hover:bg-black hover:text-white transition-all"
          >
            ← Cancel
          </button>
          <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 italic font-outfit uppercase tracking-[0.5em]">
            NRZO0NE OFFICIAL REPORT PREVIEW
          </p>
          <button
            onClick={() => window.print()}
            className="px-10 py-4 bg-black text-white font-black uppercase text-xs rounded-full shadow-2xl border-b-[8px] border-zinc-900 hover:scale-105 transition-all"
          >
            Download / Print PDF
          </button>
        </div>

        <div className="max-w-4xl mx-auto border-[1px] border-black/10 p-16 rounded-[2rem] shadow-sm relative overflow-hidden bg-white">
          <div className="flex justify-between items-start border-b-2 border-black/5 pb-10 mb-10">
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter leading-none mb-4">
                NRZO0NE <span className="text-slate-200">PRO</span>
              </h1>
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-400">
                Master Audit Record — {transactionTab.toUpperCase()} UNIT
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">
                Authenticated On
              </p>
              <p className="text-lg font-black italic">
                {new Date().toLocaleDateString("en-GB")} •{" "}
                {new Date().toLocaleTimeString("en-GB")}
              </p>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="border-b border-black/10 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">
              <tr>
                <th className="py-6">Date</th>
                <th className="py-6">Description / Entity</th>
                <th
                  className={`py-6 text-center ${transactionTab === "attendance" || transactionTab === "expense" ? "w-32" : ""}`}
                >
                  {transactionTab === "attendance"
                    ? "Status"
                    : transactionTab === "expense"
                      ? "Category"
                      : "Operation"}
                </th>
                <th className="py-6 text-right">Value / Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {printData.map((item, idx) => (
                <tr key={idx} className="text-sm font-black italic">
                  <td className="py-6">{item.date}</td>
                  <td className="py-6 uppercase">
                    <p className="text-lg leading-tight">
                      {item.worker ||
                        item.cutterName ||
                        item.description ||
                        item.task}
                    </p>
                    <p className="text-[8px] text-slate-400 mt-0.5">
                      {item.design
                        ? `${item.design} (${item.color})`
                        : item.department || item.source || "General Registry"}
                    </p>
                  </td>
                  <td className="py-6 text-center">
                    <span className="text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-black/5 bg-slate-50">
                      {item.status ||
                        item.category ||
                        transactionTab.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-6 text-right text-xl tracking-tighter">
                    {item.issueBorka !== undefined
                      ? `B:${item.issueBorka} H:${item.issueHijab}`
                      : item.borka !== undefined
                        ? `B:${item.borka} H:${item.hijab}`
                        : item.pataQty !== undefined
                          ? `${item.pataQty} Unit`
                          : item.amount !== undefined
                            ? `৳${item.amount.toLocaleString()}`
                            : item.status === "present"
                              ? "PRESENT"
                              : "ACTION LOG"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-20 pt-10 border-t border-black/5 grid grid-cols-2 gap-20">
            <div className="space-y-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                Authorized System Signature
              </p>
              <div className="h-10 border-b border-black/10"></div>
              <p className="text-[8px] font-black uppercase italic text-slate-400 opacity-30">
                NRZO0NE INTELLIGENCE CLOUD VERIFIED
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                Total Audit Count
              </p>
              <p className="text-4xl font-black italic">
                {printData.length}{" "}
                <span className="text-[10px] text-slate-400">Entries</span>
              </p>
            </div>
          </div>

          <div className="absolute -bottom-20 -right-20 opacity-[0.02]">
            <FileText size={400} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-12 pb-24 animate-fade-up px-2 italic text-black font-outfit">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePanel("Overview")}
            className="p-3 bg-white text-black rounded-[0.8rem] border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>
          <div className="flex items-center gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] border-2 border-slate-50 shadow-xl w-full md:w-auto">
            <div className="p-2.5 md:p-4 bg-black text-white rounded-[1rem] md:rounded-2xl shadow-xl rotate-2 hover:rotate-0 transition-transform">
              <BarChart size={24} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none text-black">
                Data <span className="text-slate-400">Vault</span>
              </h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                Official Intelligence Hub
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-50 p-2 md:p-3 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
        {isAdmin && (
          <button
            onClick={() => setActiveTab("intel")}
            className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "intel" ? "bg-black text-white shadow-2xl" : "text-slate-400 hover:text-black"}`}
          >
            Intelligence
          </button>
        )}
        {!isAdmin && (
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "summary" ? "bg-black text-white shadow-2xl" : "text-slate-400 hover:text-black"}`}
          >
            Ledger
          </button>
        )}
        <button
          onClick={() => setActiveTab("dispatch")}
          className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "dispatch" ? "bg-black text-white shadow-2xl" : "text-slate-400 hover:text-black"}`}
        >
          Dispatch Hub
        </button>
        <button
          onClick={() => setActiveTab("invoice")}
          className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "invoice" ? "bg-black text-white shadow-2xl" : "text-slate-400 hover:text-black"}`}
        >
          Invoice Matrix
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "transactions" ? "bg-black text-white shadow-2xl" : "text-slate-400 hover:text-black"}`}
        >
          Audit Log
        </button>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[4rem] border-2 md:border-4 border-slate-50 shadow-2xl overflow-hidden min-h-[60vh]">
        {activeTab === "intel" && <BusinessIntel masterData={masterData} />}
        {activeTab === "summary" && (
          <WorkerSummary masterData={masterData} user={user} />
        )}
        {activeTab === "invoice" && (
          <WeeklyInvoice masterData={masterData} user={user} />
        )}
        {activeTab === "dispatch" && (
          <div className="p-6 md:p-12 space-y-12 animate-fade-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50 p-8 rounded-[3rem] border-2 border-white shadow-inner">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-rose-600 text-white rounded-[2rem] shadow-2xl rotate-3">
                  <Printer size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-black">
                    Global Dispatch Hub
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
                    BATCH PRINT SYSTEM • 4 SLIPS PER PAGE
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() =>
                    setSelectedJobIds(allActiveJobs.map((j) => j.id))
                  }
                  className="px-8 py-4 bg-white text-slate-600 rounded-full font-black uppercase text-[10px] tracking-widest border border-slate-200"
                >
                  Select All
                </button>
                <button
                  onClick={() => setIsBatchPrinting(true)}
                  disabled={selectedJobIds.length === 0}
                  className="px-12 py-4 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl border-b-[8px] border-zinc-900 disabled:opacity-30 transition-all hover:scale-105"
                >
                  GENERATE BATCH ({selectedJobIds.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allActiveJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() =>
                    setSelectedJobIds((prev) =>
                      prev.includes(job.id)
                        ? prev.filter((id) => id !== job.id)
                        : [...prev, job.id],
                    )
                  }
                  className={`p-8 rounded-[3rem] border-4 transition-all text-left relative overflow-hidden group ${selectedJobIds.includes(job.id) ? "bg-black border-black text-white shadow-3xl" : "bg-white border-slate-50 hover:border-slate-100"}`}
                >
                  <div className="flex justify-between items-start mb-6 uppercase italic">
                    <p
                      className={`text-[9px] font-black tracking-widest px-4 py-1.5 rounded-full border ${selectedJobIds.includes(job.id) ? "border-white/20 bg-white/10 text-white" : "border-slate-100 bg-slate-50 text-slate-500"}`}
                    >
                      {job.jobType}
                    </p>
                    <p className="text-[9px] opacity-40 font-black tracking-tighter">
                      {job.date}
                    </p>
                  </div>
                  <h4 className="text-2xl font-black italic uppercase leading-none mb-3 tracking-tighter">
                    {job.worker}
                  </h4>
                  <p
                    className={`text-xs font-black uppercase opacity-60 leading-tight ${selectedJobIds.includes(job.id) ? "text-white" : "text-slate-400"}`}
                  >
                    {job.design || job.task}
                  </p>
                  <div className="mt-8 flex justify-between items-end">
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-[8px] font-black uppercase opacity-50 mb-1">
                          Borka
                        </p>
                        <p className="text-3xl font-black">
                          {job.issueBorka || job.pataQty || job.borkaQty || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black uppercase opacity-50 mb-1">
                          Hijab
                        </p>
                        <p className="text-3xl font-black">
                          {job.issueHijab || job.hijabQty || 0}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center border-2 transition-all ${selectedJobIds.includes(job.id) ? "bg-emerald-500 border-emerald-400" : "bg-slate-50 border-slate-100 opacity-20 group-hover:opacity-100"}`}
                    >
                      <UserCheck size={24} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "transactions" && (
          <div className="p-6 md:p-12 space-y-8 md:space-y-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between border-b-2 border-slate-50 pb-8 md:pb-12">
              <div className="flex flex-wrap gap-2 md:gap-4 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
                {[
                  "productions",
                  "cutting",
                  "pata",
                  "outside",
                  "attendance",
                  "expense",
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTransactionTab(t)}
                    className={`px-4 md:px-8 py-3 md:py-4 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${transactionTab === t ? "bg-black text-white shadow-xl" : "bg-slate-50 text-slate-400 hover:text-black"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex-1 md:w-64 bg-white p-3 md:p-4 rounded-full flex items-center gap-3 md:gap-4 px-6 md:px-8 border border-slate-100 shadow-inner">
                  <Search size={20} className="text-slate-200" />
                  <input
                    type="text"
                    placeholder="Scanning..."
                    className="bg-transparent font-black italic border-none outline-none leading-none h-auto w-full uppercase text-[10px] md:text-sm text-black placeholder:text-slate-100"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsPrinting(true)}
                  className="p-5 bg-black text-white rounded-2xl shadow-xl hover:scale-105 transition-all"
                >
                  <Printer size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b-2 border-slate-50 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                  <tr>
                    <th className="py-4 md:py-6 px-2 md:px-4">Date</th>
                    <th className="py-4 md:py-6 px-2 md:px-4">Details</th>
                    <th className="py-4 md:py-6 px-2 md:px-4 text-center">
                      Operation
                    </th>
                    <th className="py-4 md:py-6 px-2 md:px-4 text-right">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactionTab === "productions" &&
                    filteredProductions.map((p, idx) => {
                      const showDate =
                        idx === 0 ||
                        filteredProductions[idx - 1]?.date !== p.date;
                      return (
                        <React.Fragment key={p.id || idx}>
                          {showDate && (
                            <tr className="bg-slate-50/50">
                              <td
                                colSpan="4"
                                className="py-2 px-2 md:px-4 border-y border-slate-100/50"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                    {p.date}
                                  </span>
                                  <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr className="text-xs md:text-sm font-black italic hover:bg-slate-50 transition-all">
                            <td className="py-6 md:py-8 px-2 md:px-4 text-black">
                              {p.date}
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 uppercase text-black">
                              <p className="text-base md:text-lg leading-tight">
                                {p.worker}
                              </p>
                              <p className="text-[9px] md:text-[11px] text-slate-600 mt-1 italic uppercase tracking-widest">
                                {p.design} ({p.color})
                              </p>
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 text-center">
                              <span
                                className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest ${p.status === "Received" ? "bg-black text-white shadow-xl" : "bg-slate-50 text-slate-400 border border-slate-100"}`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 text-right text-lg md:text-2xl font-black italic tracking-tighter text-black">
                              +{p.issueBorka + p.issueHijab}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  {transactionTab === "cutting" &&
                    filteredCutting.map((c, idx) => {
                      const showDate =
                        idx === 0 || filteredCutting[idx - 1]?.date !== c.date;
                      return (
                        <React.Fragment key={c.id || idx}>
                          {showDate && (
                            <tr className="bg-slate-50/50">
                              <td
                                colSpan="4"
                                className="py-2 px-2 md:px-4 border-y border-slate-100/50"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                    {c.date}
                                  </span>
                                  <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr className="text-xs md:text-sm font-black italic hover:bg-slate-50 transition-all">
                            <td className="py-6 md:py-8 px-2 md:px-4 text-black">
                              {c.date}
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 uppercase text-black">
                              <p className="text-base md:text-lg leading-tight">
                                {c.design}
                              </p>
                              <p className="text-[9px] md:text-[11px] text-slate-600 mt-1 italic uppercase tracking-widest">
                                {c.color} • {c.cutterName || "N/A"}
                              </p>
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 text-center">
                              <span className="px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest bg-black text-white shadow-xl">
                                CUTTING
                              </span>
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 text-right text-xl md:text-4xl font-black italic tracking-tighter leading-none text-black">
                              +{c.borka + c.hijab}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  {transactionTab === "pata" &&
                    filteredPata.map((e, idx) => {
                      const showDate =
                        idx === 0 || filteredPata[idx - 1]?.date !== e.date;
                      return (
                        <React.Fragment key={e.id || idx}>
                          {showDate && (
                            <tr className="bg-slate-50/50">
                              <td
                                colSpan="4"
                                className="py-2 px-2 md:px-4 border-y border-slate-100/50"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                    {e.date}
                                  </span>
                                  <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr className="text-xs md:text-sm font-black italic hover:bg-slate-50 transition-all">
                            <td className="py-6 md:py-8 px-2 md:px-4 text-black">
                              {e.date}
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 uppercase text-black">
                              <p className="text-base md:text-lg leading-tight">
                                {e.design}
                              </p>
                              <p className="text-[9px] md:text-[11px] text-slate-600 mt-1 italic uppercase tracking-widest">
                                {e.color} ({e.pataType})
                              </p>
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 text-center">
                              <span className="px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest bg-black text-white shadow-xl">
                                PATA
                              </span>
                            </td>
                            <td className="py-6 md:py-8 px-2 md:px-4 text-right text-xl md:text-4xl font-black italic tracking-tighter leading-none text-black">
                              +{e.pataQty}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  {transactionTab === "outside" &&
                    filteredOutside.map((e, idx) => {
                      return (
                        <tr
                          key={e.id || idx}
                          className="text-xs md:text-sm font-black italic hover:bg-slate-50 transition-all border-b border-slate-100"
                        >
                          <td className="py-6 md:py-8 px-2 md:px-4 text-black">
                            {e.date}
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 uppercase text-black">
                            <p className="text-base md:text-lg leading-tight">
                              {e.worker}
                            </p>
                            <p className="text-[9px] md:text-[11px] text-slate-600 mt-1 italic uppercase tracking-widest">
                              {e.task} (Lot: {e.lotNo})
                            </p>
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 text-center">
                            <span
                              className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest ${e.status === "Received" ? "bg-black text-white shadow-xl" : "bg-slate-50 text-slate-400 border border-slate-100"}`}
                            >
                              {e.status}
                            </span>
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 text-right text-xl md:text-4xl font-black italic tracking-tighter leading-none text-black">
                            +{e.borkaQty}
                          </td>
                        </tr>
                      );
                    })}
                  {transactionTab === "attendance" &&
                    filteredAttendance.map((a, idx) => {
                      return (
                        <tr
                          key={a.id || idx}
                          className="text-xs md:text-sm font-black italic hover:bg-slate-50 transition-all border-b border-slate-100"
                        >
                          <td className="py-6 md:py-8 px-2 md:px-4 text-black">
                            {a.date}
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 uppercase text-black">
                            <p className="text-base md:text-lg leading-tight">
                              {a.worker}
                            </p>
                            <p className="text-[9px] md:text-[11px] text-slate-600 mt-1 italic uppercase tracking-widest">
                              {a.department} Unit
                            </p>
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 text-center">
                            <span
                              className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest ${a.status === "present" ? "bg-emerald-500 text-white" : a.status === "half-day" ? "bg-amber-500 text-white" : "bg-rose-500 text-white"}`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 text-right text-xl md:text-2xl font-black italic tracking-tighter leading-none text-black">
                            ৳{a.wage}
                          </td>
                        </tr>
                      );
                    })}
                  {transactionTab === "expense" &&
                    filteredExpenses.map((exp, idx) => {
                      return (
                        <tr
                          key={exp.id || idx}
                          className="text-xs md:text-sm font-black italic hover:bg-slate-50 transition-all border-b border-slate-100"
                        >
                          <td className="py-6 md:py-8 px-2 md:px-4 text-black">
                            {exp.date}
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 uppercase text-black">
                            <p className="text-base md:text-lg leading-tight">
                              {exp.description}
                            </p>
                            <p className="text-[9px] md:text-[11px] text-slate-600 mt-1 italic uppercase tracking-widest">
                              {exp.category}
                            </p>
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 text-center">
                            <span className="px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-100 italic">
                              Voucher
                            </span>
                          </td>
                          <td className="py-6 md:py-8 px-2 md:px-4 text-right text-xl md:text-3xl font-black italic tracking-tighter leading-none text-rose-500">
                            ৳{exp.amount}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div className="pt-20 pb-10 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-6 bg-white px-12 py-6 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
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

export default ReportsPanel;
