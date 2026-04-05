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
  MessageCircle,
} from "lucide-react";
import WorkerSummary from "../WorkerSummary";
import WeeklyInvoice from "../WeeklyInvoice";
import BusinessIntel from "../BusinessIntel";

const ReportsPanel = ({ masterData, user, setActivePanel, t, logAction }) => {
  const [activeTab, setActiveTab] = useState(
    user?.role?.toLowerCase() === "admin" ? "intel" : "summary",
  );
  const [transactionTab, setTransactionTab] = useState("productions");
  const [search, setSearch] = useState("");
  const role = user?.role?.toLowerCase();
  const isWorker = role === "worker";
  const isAdmin = role === "admin";

  const filteredProductions = masterData.productions.filter((p) => {
    const matchesUser = isWorker
      ? p.worker?.toLowerCase() === user?.name?.toLowerCase()
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

    const shareToWhatsApp = () => {
        const financialIntel = (() => {
            const revenue = (masterData.deliveries || []).reduce((acc, d) => {
                const design = masterData.designs.find(ds => ds.name === d.design);
                const price = Number(design?.sellingPrice || 0);
                return acc + (Number(d.borka || 0) * price) + (Number(d.hijab || 0) * price);
            }, 0);
            const prodCosts = (masterData.productions || []).filter(p => p.status === 'Received').reduce((acc, p) => {
                const design = masterData.designs.find(ds => ds.name === p.design);
                const multiplier = masterData.multipliers?.[p.type] || 1.0;
                let rate = 0;
                if (p.type === 'sewing') rate = (design?.sewingRate || 0) * multiplier;
                else if (p.type === 'stone') rate = (design?.stoneRate || 0) * multiplier;
                return acc + ((Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)) * rate);
            }, 0);
            const matCosts = (masterData.productions || []).reduce((acc, p) => {
                const design = masterData.designs.find(ds => ds.name === p.design);
                const cost = Number(design?.materialCost || 0);
                return acc + ((Number(p.issueBorka || 0) + Number(p.issueHijab || 0)) * cost);
            }, 0);
            const misc = (masterData.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const totalCosts = prodCosts + matCosts + misc;
            const netProfit = revenue - totalCosts;
            return { revenue, totalCosts, netProfit };
        })();

        let lines = [
            `*NRZO0NE STRATEGIC SNAPSHOT*`, 
            `Date: ${new Date().toLocaleDateString('en-GB')}`, 
            `-----------------------------`,
            `💰 REVENUE: ৳${financialIntel.revenue.toLocaleString()}`,
            `📉 TOTAL COSTS: ৳${financialIntel.totalCosts.toLocaleString()}`,
            `💎 NET PROFIT: ৳${financialIntel.netProfit.toLocaleString()}`,
            `-----------------------------`,
            `*Audit Block: ${transactionTab.toUpperCase()}*`,
            `Entries: ${printData.length}`, 
            ``
        ];
        printData.slice(0, 5).forEach(item => {
            lines.push(`• ${item.worker || item.description}: ${item.issueBorka || item.amount || item.pataQty || item.status}`);
        });
        if (printData.length > 5) lines.push(`...and ${printData.length - 5} more.`);
        
        const message = lines.join('\n');
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

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
          <div className="flex gap-4">
            <button 
                onClick={shareToWhatsApp}
                className="px-6 py-4 bg-emerald-500 text-white font-black uppercase text-xs rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
                <MessageCircle size={16} /> Share to WhatsApp
            </button>
            <button
                onClick={() => window.print()}
                className="px-10 py-4 bg-black text-white font-black uppercase text-xs rounded-full shadow-2xl border-b-[8px] border-zinc-900 hover:scale-105 transition-all"
            >
                Download / Print PDF
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto border-[1px] border-black/10 p-16 rounded-[2rem] shadow-sm relative overflow-hidden bg-white">
          <div className="flex justify-between items-start border-b-2 border-black/5 pb-10 mb-10">
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter leading-none mb-4">
                NRZO0NE <span className="text-slate-500">PRO</span>
              </h1>
              <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-500">
                Master Audit Record — {transactionTab.toUpperCase()} UNIT
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Authenticated On
              </p>
              <p className="text-lg font-black italic">
                {new Date().toLocaleDateString("en-GB")} •{" "}
                {new Date().toLocaleTimeString("en-GB")}
              </p>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="border-b border-black/10 text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
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
                    <p className="text-[8px] text-slate-500 mt-0.5">
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
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                Authorized System Signature
              </p>
              <div className="h-10 border-b border-black/10"></div>
              <p className="text-[8px] font-black uppercase italic text-slate-500 opacity-30">
                NRZO0NE INTELLIGENCE CLOUD VERIFIED
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                Total Audit Count
              </p>
              <p className="text-4xl font-black italic">
                {printData.length}{" "}
                <span className="text-[10px] text-slate-500">Entries</span>
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
                তথ্য <span className="text-slate-500">ভাণ্ডার</span>
              </h2>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                অফিসিয়াল ইন্টেলিজেন্স হাব
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-50 p-2 md:p-3 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
        {isAdmin && (
          <button
            onClick={() => setActiveTab("intel")}
            className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "intel" ? "bg-black text-white shadow-2xl" : "text-slate-500 hover:text-black"}`}
          >
            বিজনেস ইন্টেল
          </button>
        )}
        {!isAdmin && (
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "summary" ? "bg-black text-white shadow-2xl" : "text-slate-500 hover:text-black"}`}
          >
            লেজার সামারি
          </button>
        )}

        <button
          onClick={() => setActiveTab("invoice")}
          className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "invoice" ? "bg-black text-white shadow-2xl" : "text-slate-500 hover:text-black"}`}
        >
          ইনভয়েস ম্যাট্রিক্স
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === "transactions" ? "bg-black text-white shadow-2xl" : "text-slate-500 hover:text-black"}`}
        >
          অডিট লগ (Audit)
        </button>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[4rem] border-2 md:border-4 border-slate-50 shadow-2xl overflow-hidden min-h-[60vh]">
        {activeTab === "intel" && <BusinessIntel masterData={masterData} />}
        {activeTab === "summary" && (
          <WorkerSummary masterData={masterData} user={user} logAction={logAction} showNotify={showNotify} setActivePanel={setActivePanel} />
        )}
        {activeTab === "invoice" && (
          <WeeklyInvoice masterData={masterData} user={user} logAction={logAction} showNotify={showNotify} setActivePanel={setActivePanel} />
        )}

        {activeTab === "transactions" && (
          <div className="p-6 md:p-12 space-y-8 md:space-y-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between border-b-2 border-slate-50 pb-8 md:pb-12">
              <div className="flex flex-wrap gap-2 md:gap-4 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
                {[
                  { id: "productions", label: "প্রোডাকশন" },
                  { id: "cutting", label: "কাটিং স্টক" },
                  { id: "pata", label: "পাটা ফ্যাক্টরি" },
                  { id: "outside", label: "বাইরের কাজ" },
                  { id: "attendance", label: "উপস্থিতি" },
                  { id: "expense", label: "খরচ (Expense)" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTransactionTab(t.id)}
                    className={`px-4 md:px-8 py-3 md:py-4 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${transactionTab === t.id ? "bg-black text-white shadow-xl" : "bg-slate-50 text-slate-500 hover:text-black"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex-1 md:w-64 bg-white p-3 md:p-4 rounded-full flex items-center gap-3 md:gap-4 px-6 md:px-8 border border-slate-100 shadow-inner">
                  <Search size={20} className="text-slate-500" />
                  <input
                    type="text"
                    placeholder="খুঁজুন..."
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
                <thead className="border-b-2 border-slate-50 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                  <tr>
                    <th className="py-4 md:py-6 px-2 md:px-4">তারিখ</th>
                    <th className="py-4 md:py-6 px-2 md:px-4">বিস্তারিত</th>
                    <th className="py-4 md:py-6 px-2 md:px-4 text-center">
                      বিভাগ (Activity)
                    </th>
                    <th className="py-4 md:py-6 px-2 md:px-4 text-right">
                      পরিমাণ/ভ্যালু
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
                                  <div className="h-px bg-slate-200 flex-1 opacity-75"></div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                    {p.date}
                                  </span>
                                  <div className="h-px bg-slate-200 flex-1 opacity-75"></div>
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
                                className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest ${p.status === "Received" ? "bg-black text-white shadow-xl" : "bg-slate-50 text-slate-500 border border-slate-100"}`}
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
                                  <div className="h-px bg-slate-200 flex-1 opacity-75"></div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                    {c.date}
                                  </span>
                                  <div className="h-px bg-slate-200 flex-1 opacity-75"></div>
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
                                  <div className="h-px bg-slate-200 flex-1 opacity-75"></div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                    {e.date}
                                  </span>
                                  <div className="h-px bg-slate-200 flex-1 opacity-75"></div>
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
                              className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest ${e.status === "Received" ? "bg-black text-white shadow-xl" : "bg-slate-50 text-slate-500 border border-slate-100"}`}
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
            মূল ড্যাশবোর্ডে ফিরে যান
          </span>
          <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  );
};

export default ReportsPanel;
