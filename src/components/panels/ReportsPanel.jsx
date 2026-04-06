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

  const filteredProductions = (masterData.productions || []).filter((p) => {
    const matchesUser = isWorker
      ? p.worker?.toLowerCase() === user?.name?.toLowerCase()
      : true;
    const matchesSearch =
      (p.worker?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.design?.toLowerCase() || "").includes(search.toLowerCase());
    return matchesUser && matchesSearch;
  });

  const filteredCutting = (masterData.cuttingStock || []).filter(
    (c) =>
      (c.design?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.cutterName &&
        c.cutterName.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredOutside = (masterData.outsideWorkEntries || []).filter(
    (e) =>
      (e.worker?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (e.task?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const filteredAttendance = (masterData.attendance || []).filter(
    (a) =>
      (a.worker?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.department?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const filteredExpenses = (masterData.expenses || []).filter(
    (e) =>
      (e.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (e.category?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const filteredPata = (masterData.pataEntries || []).filter(
    (e) =>
      (e.worker?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (e.design?.toLowerCase() || "").includes(search.toLowerCase()),
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
                const design = (masterData.designs || []).find(ds => ds.name === d.design);
                const price = Number(design?.sellingPrice || 0);
                return acc + (Number(d.borka || 0) * price) + (Number(d.hijab || 0) * price);
            }, 0);
            const prodCosts = (masterData.productions || []).filter(p => p.status === 'Received').reduce((acc, p) => {
                const design = (masterData.designs || []).find(ds => ds.name === p.design);
                const multiplier = masterData.multipliers?.[p.type] || 1.0;
                let rate = 0;
                if (p.type === 'sewing') rate = (design?.sewingRate || 0) * multiplier;
                else if (p.type === 'stone') rate = (design?.stoneRate || 0) * multiplier;
                return acc + ((Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)) * rate);
            }, 0);
            const matCosts = (masterData.productions || []).reduce((acc, p) => {
                const design = (masterData.designs || []).find(ds => ds.name === p.design);
                const cost = Number(design?.materialCost || 0);
                return acc + ((Number(p.issueBorka || 0) + Number(p.issueHijab || 0)) * cost);
            }, 0);
            const misc = (masterData.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const totalCosts = prodCosts + matCosts + misc;
            const netProfit = revenue - totalCosts;
            return { revenue, totalCosts, netProfit };
        })();

        let lines = [
            `*NRZO0NE ERP REPORT*`, 
            `তারিখ: ${new Date().toLocaleDateString('en-GB')}`, 
            `-----------------------------`,
            `💰 আয় (Revenue): ৳${financialIntel.revenue.toLocaleString()}`,
            `📉 খরচ (Costs): ৳${financialIntel.totalCosts.toLocaleString()}`,
            `💎 প্রোফিট (Profit): ৳${financialIntel.netProfit.toLocaleString()}`,
            `-----------------------------`,
            `*অডিট লট: ${transactionTab.toUpperCase()}*`,
            `মোট তথ্য: ${printData.length}`, 
            ``
        ];
        printData.slice(0, 5).forEach(item => {
            lines.push(`• ${item.worker || item.description}: ${item.issueBorka || item.amount || item.pataQty || item.status}`);
        });
        if (printData.length > 5) lines.push(`...সমেত আরও ${printData.length - 5}টি`);
        
        const message = lines.join('\n');
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
      <div className="min-h-screen bg-white p-8 md:p-12 text-black dark:text-white font-sans italic selection:bg-slate-900 selection:text-white">
        <style>{`
            @media print {
                .no-print { display: none !important; }
                body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                @page { size: A4 portrait; margin: 15mm; }
            }
        `}</style>

        <div className="no-print flex justify-between items-center mb-12 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setIsPrinting(false)}
            className="px-8 py-3.5 bg-white dark:bg-slate-900 text-black dark:text-white dark:text-white font-bold uppercase text-[10px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-950 hover:text-white transition-all flex items-center gap-3"
          >
            <ArrowLeft size={16} /> ফিরে যান (Cancel)
          </button>
          <div className="flex gap-3">
            <button 
                onClick={shareToWhatsApp}
                className="px-6 py-3.5 bg-emerald-500 text-white font-bold uppercase text-[10px] rounded-xl shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
                <MessageCircle size={16} /> WhatsApp এ শেয়ার
            </button>
            <button
                onClick={() => window.print()}
                className="px-10 py-3.5 bg-slate-950 text-white font-bold uppercase text-[10px] rounded-xl shadow-xl flex items-center gap-3 hover:bg-slate-900 transition-all"
            >
                <Printer size={16} /> প্রিন্ট / PDF রিপোর্ট
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border border-slate-200 p-10 md:p-16 rounded-xl shadow-sm relative overflow-hidden bg-white print:border-none print:p-0 print:shadow-none">
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-10 mb-10">
            <div>
              <h1 className="text-4xl font-black tracking-tight leading-none mb-3 uppercase">
                NRZO0NE <span className="text-blue-600">FACTORY ERP</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-black dark:text-white dark:text-white">
                Official Audit Registry — {transactionTab.toUpperCase()} UNIT
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white mb-1">
                Authenticated On
              </p>
              <p className="text-lg font-bold">
                {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white">
              <tr>
                <th className="py-6">Date</th>
                <th className="py-6">Entity / Details</th>
                <th className="py-6 text-center">Operation</th>
                <th className="py-6 text-right">Value / Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {printData.map((item, idx) => (
                <tr key={idx} className="text-sm font-bold">
                  <td className="py-6 text-black dark:text-white dark:text-white">{item.date}</td>
                  <td className="py-6 uppercase">
                    <p className="text-base text-black">
                      {item.worker || item.cutterName || item.description || item.task}
                    </p>
                    <p className="text-[9px] text-black dark:text-white dark:text-white mt-0.5">
                      {item.design ? `${item.design} (${item.color})` : item.department || item.source || "Factory Registry"}
                    </p>
                  </td>
                  <td className="py-6 text-center">
                    <span className="text-[8px] uppercase tracking-widest px-3 py-1 rounded-md border border-slate-100 bg-slate-50 text-black dark:text-white dark:text-white font-bold leading-none">
                      {item.status || item.category || transactionTab.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-6 text-right text-lg font-bold">
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
                              : "SYSTEM LOG"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-20">
            <div className="space-y-4">
              <p className="text-[8px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white">Authorized Signature</p>
              <div className="h-0.5 w-full bg-slate-100"></div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white">Total Entries</p>
              <p className="text-3xl font-bold">{printData.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-fade-up px-1 md:px-2 text-black">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
            <button
                onClick={() => setActivePanel("Overview")}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-950 hover:text-white transition-all shadow-sm"
            >
                <ArrowLeft size={18} />
            </button>
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none">
                    রিপোর্ট ও <span className="text-blue-600">তথ্য ভাণ্ডার</span>
                </h2>
                <p className="text-[10px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest italic leading-none mt-1">
                    Central Business Intelligence Hub
                </p>
            </div>
        </div>
        <div className="bg-slate-950 dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold underline decoration-blue-500/50 underline-offset-4 uppercase tracking-widest flex items-center gap-3 shadow-lg">
            <Database size={14} /> ডাটা নোড (Total Nodes): {(masterData.productions || []).length + (masterData.deliveries || []).length}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 !p-1.5 flex flex-wrap gap-1 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
        {isAdmin && (
          <button
            onClick={() => setActiveTab("intel")}
            className={`px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${activeTab === "intel" ? "bg-slate-950 text-white shadow-xl" : "text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white"}`}
          >
            বিজনেস ইন্টেল (Admin)
          </button>
        )}
        {!isAdmin && (
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${activeTab === "summary" ? "bg-slate-950 text-white shadow-xl" : "text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white"}`}
          >
            লেজার সামারি (Ledger)
          </button>
        )}

        <button
          onClick={() => setActiveTab("invoice")}
          className={`px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${activeTab === "invoice" ? "bg-slate-950 text-white shadow-xl" : "text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white"}`}
        >
          সাপ্তাহিক ইনভয়েস (Invoices)
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${activeTab === "transactions" ? "bg-slate-950 text-white shadow-xl" : "text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white"}`}
        >
          অডিট লগ (Audit Records)
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[60vh]">
        {activeTab === "intel" && <BusinessIntel masterData={masterData} />}
        {activeTab === "summary" && (
          <WorkerSummary masterData={masterData} user={user} logAction={logAction} showNotify={showNotify} setActivePanel={setActivePanel} />
        )}
        {activeTab === "invoice" && (
          <WeeklyInvoice masterData={masterData} user={user} logAction={logAction} showNotify={showNotify} setActivePanel={setActivePanel} />
        )}

        {activeTab === "transactions" && (
          <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col xl:flex-row gap-6 items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-8 bg-slate-50/20 dark:bg-slate-800/20 -mx-8 px-8 -mt-8 pt-8">
              <div className="pill-nav !p-1 w-full xl:w-auto overflow-x-auto no-scrollbar">
                {[
                  { id: "productions", label: "প্রোডাকশন" },
                  { id: "cutting", label: "কাটিং" },
                  { id: "pata", label: "পাটা" },
                  { id: "outside", label: "বাইরের কাজ" },
                  { id: "attendance", label: "উপস্থিতি" },
                  { id: "expense", label: "খরচ" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTransactionTab(t.id)}
                    className={`pill-tab !px-6 !py-2.5 !text-[9px] ${transactionTab === t.id ? "pill-tab-active" : "text-black dark:text-white dark:text-white"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 w-full xl:w-auto">
                <div className="relative group flex-1 xl:w-80">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white dark:text-white" />
                  <input
                    type="text"
                    placeholder="অডিট সার্চ করুন (Search)..."
                    className="premium-input !pl-11 !h-11 !text-[10px] !bg-white dark:!bg-slate-900"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsPrinting(true)}
                  className="w-11 h-11 bg-slate-950 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-900 transition-all active:scale-95 shadow-blue-500/10"
                  title="PDF রিপোর্ট জেনারেট"
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-5 px-6">তারিখ (Date)</th>
                    <th className="py-5 px-6">বিস্তারিত (Description)</th>
                    <th className="py-5 px-6 text-center">অবস্থা (Status)</th>
                    <th className="py-5 px-6 text-right">পরিমাণ (Metric)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactionTab === "productions" &&
                    filteredProductions.map((p, idx) => {
                      return (
                          <tr key={p.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all font-bold">
                            <td className="py-6 px-6 text-black dark:text-white dark:text-white text-sm">
                              {p.date}
                            </td>
                            <td className="py-6 px-6 uppercase">
                              <p className="text-base text-black dark:text-white dark:text-white leading-none mb-1">
                                {p.worker}
                              </p>
                              <p className="text-[9px] text-black dark:text-white dark:text-white italic uppercase tracking-widest">
                                {p.design} ({p.color}) • Lot: {p.lotNo}
                              </p>
                            </td>
                            <td className="py-6 px-6 text-center">
                              <span
                                className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${p.status === "Received" ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-100 dark:border-emerald-800" : "bg-blue-50 dark:bg-blue-900/10 text-blue-600 border border-blue-100 dark:border-blue-800"}`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-6 px-6 text-right text-xl font-bold tracking-tight text-black dark:text-white dark:text-white">
                              {p.issueBorka + p.issueHijab}
                            </td>
                          </tr>
                      );
                    })}
                  
                  {/* Additional Tabs (Cutting, Pata, etc.) Simplified for clarity and consistency */}
                  {transactionTab === "cutting" && filteredCutting.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all font-bold">
                        <td className="py-6 px-6 text-black dark:text-white dark:text-white text-sm">{c.date}</td>
                        <td className="py-6 px-6 uppercase">
                            <p className="text-base text-black dark:text-white dark:text-white leading-none mb-1">{c.design}</p>
                            <p className="text-[9px] text-black dark:text-white dark:text-white italic uppercase tracking-widest">{c.color} • {c.cutterName || "Manual Cut"}</p>
                        </td>
                        <td className="py-6 px-6 text-center">
                            <span className="px-3 py-1 bg-slate-950 text-white rounded-md text-[8px] font-bold uppercase tracking-widest">CUTTING</span>
                        </td>
                        <td className="py-6 px-6 text-right text-xl font-bold">{c.borka + c.hijab}</td>
                    </tr>
                  ))}

                  {/* Rendering logic for other tabs follows the same pattern... */}
                  {(transactionTab === "outside" ? filteredOutside : transactionTab === "pata" ? filteredPata : transactionTab === "attendance" ? filteredAttendance : transactionTab === "expense" ? filteredExpenses : []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all font-bold">
                        <td className="py-6 px-6 text-black dark:text-white dark:text-white text-sm">{item.date}</td>
                        <td className="py-6 px-6 uppercase">
                            <p className="text-base text-black dark:text-white dark:text-white leading-none mb-1">{item.worker || item.description}</p>
                            <p className="text-[9px] text-black dark:text-white dark:text-white italic uppercase tracking-widest">{item.task || item.category || item.department || "Factory Record"}</p>
                        </td>
                        <td className="py-6 px-6 text-center">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[8px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white">{item.status || "LOG"}</span>
                        </td>
                        <td className="py-6 px-6 text-right text-xl font-bold">
                            {item.amount ? `৳${item.amount.toLocaleString()}` : item.borkaQty || item.pataQty || "—"}
                        </td>
                    </tr>
                  ))}

                  {(transactionTab === "productions" && filteredProductions.length === 0) || 
                   (transactionTab === "cutting" && filteredCutting.length === 0) ? (
                    <tr>
                      <td colSpan="4" className="py-24 text-center">
                        <div className="flex flex-col items-center opacity-10">
                          <AlertCircle size={48} strokeWidth={1} />
                          <p className="text-[10px] font-bold uppercase tracking-widest mt-4">তথ্য পাওয়া যায়নি (Zero Records)</p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Standardized Return Button */}
      <div className="flex justify-center pt-16 pb-8">
        <button
            onClick={() => setActivePanel("Overview")}
            className="group relative flex items-center gap-4 bg-white dark:bg-slate-900 px-10 py-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-950 transition-all duration-300"
        >
            <div className="p-2.5 bg-slate-950 text-white rounded-xl transition-transform shadow-lg group-hover:scale-110">
                <ArrowLeft size={18} />
            </div>
            <span className="text-sm font-bold tracking-tight text-black dark:text-white dark:text-white uppercase">
                ড্যাশবোর্ডে ফিরে যান (Return Home)
            </span>
        </button>
      </div>
    </div>
  );
};

export default ReportsPanel;

