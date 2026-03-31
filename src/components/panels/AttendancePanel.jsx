import React, { useState, useMemo } from "react";
import {
  Calendar,
  UserCheck,
  Users,
  CheckCircle,
  XCircle,
  Printer,
  DollarSign,
  Clock,
  Archive,
  X,
  Search,
  ChevronRight,
  Hash,
  AlertCircle,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { syncToSheet } from "../../utils/syncUtils";
import NRZLogo from "../NRZLogo";
import QRScanner from "../QRScanner";

const AttendancePanel = ({
  masterData,
  setMasterData,
  showNotify,
  setActivePanel,
  t,
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedDepartment, setSelectedDepartment] = useState("sewing");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDailyPrint, setShowDailyPrint] = useState(false);
  const [viewMode, setViewMode] = useState("attendance"); // 'attendance' or 'duty'
  const [showQR, setShowQR] = useState(false);
  
  const handleQRScan = (scannedName) => {
    const workerMatch = workers.find(w => w.toUpperCase() === scannedName.toUpperCase());
    if (workerMatch) {
        markAttendance(workerMatch, 'present');
        setShowQR(false);
        showNotify(`QR: ${workerMatch} marked Present!`, 'success');
    } else {
        showNotify("Worker not found for this dept!", "error");
    }
  };

  const workers = useMemo(() => {
    return masterData.workerCategories[selectedDepartment] || [];
  }, [masterData.workerCategories, selectedDepartment]);

  const getWorkerWage = (worker) => {
    const monthlySalary =
      masterData.workerWages?.[selectedDepartment]?.[worker] || 0;
    return Math.round(monthlySalary / 30);
  };

  const getAttendance = (worker) => {
    const record = masterData.attendance?.find(
      (a) =>
        a.date === selectedDate &&
        a.worker === worker &&
        a.department === selectedDepartment,
    );
    return record?.status || "absent";
  };

  const markAttendance = (worker, status) => {
    setMasterData((prev) => {
      const existingIndex = (prev.attendance || []).findIndex(
        (a) =>
          a.date === selectedDate &&
          a.worker === worker &&
          a.department === selectedDepartment,
      );

      let newAttendance = [...(prev.attendance || [])];
      const dailyWage = getWorkerWage(worker);

      let effectiveWage = 0;
      if (status === "present") effectiveWage = dailyWage;
      else if (status === "half-day") effectiveWage = Math.round(dailyWage / 2);

      if (existingIndex >= 0) {
        newAttendance[existingIndex] = {
          ...newAttendance[existingIndex],
          status,
          wage: effectiveWage,
          markedAt: new Date().toISOString(),
        };
      } else {
        newAttendance.push({
          id: Date.now(),
          date: selectedDate,
          worker,
          department: selectedDepartment,
          status,
          wage: effectiveWage,
          markedAt: new Date().toISOString(),
        });
      }

      if (status !== "absent") {
        syncToSheet({
          type: "ATTENDANCE_MARK",
          worker,
          detail: `${selectedDepartment}: ${status}`,
          amount: effectiveWage,
        });
      }

      let notifications = [...(prev.notifications || [])];
      if (status === "absent") {
        notifications.unshift({
          id: Date.now().toString(),
          type: "absence",
          title: "কর্মী অনুপস্থিত",
          message: `${worker} (${selectedDepartment}) আজ অনুপস্থিত।`,
          timestamp: new Date().toISOString(),
          read: false,
          target: "admin",
        });
      }

      return { ...prev, attendance: newAttendance, notifications };
    });
    if (showNotify) showNotify(`${worker}-এর হাজিরা নিশ্চিত করা হয়েছে`);
  };

  const todayAttendance = useMemo(() => {
    return (masterData.attendance || []).filter(
      (a) => a.date === selectedDate && a.department === selectedDepartment,
    );
  }, [masterData.attendance, selectedDate, selectedDepartment]);

  const stats = useMemo(() => {
    const present = todayAttendance.filter(
      (a) => a.status === "present",
    ).length;
    const halfDay = todayAttendance.filter(
      (a) => a.status === "half-day",
    ).length;
    const wages = todayAttendance.reduce((sum, a) => sum + (a.wage || 0), 0);
    return { present, halfDay, wages };
  }, [todayAttendance]);

  const getBengaliDay = (dateStr) => {
    const days = [
      "রবিবার",
      "সোমবার",
      "মঙ্গলবার",
      "বুধবার",
      "বৃহস্পতিবার",
      "শুক্রবার",
      "শনিবার",
    ];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const formatBengaliDate = (dateStr) => {
    const months = [
      "জানুয়ারী",
      "ফেব্রুয়ারী",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];
    const date = new Date(dateStr);
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getWeeklySummary = () => {
    const today = new Date();
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - today.getDay() - 1);
    const thursday = new Date(saturday);
    thursday.setDate(saturday.getDate() + 5);

    const workerSummary = workers.map((worker) => {
      const records = (masterData.attendance || []).filter(
        (a) =>
          a.worker === worker &&
          a.department === selectedDepartment &&
          new Date(a.date) >= saturday &&
          new Date(a.date) <= thursday,
      );
      const totalWage = records.reduce((sum, r) => sum + (r.wage || 0), 0);
      return {
        worker,
        presentDays:
          records.filter((r) => r.status === "present").length +
          records.filter((r) => r.status === "half-day").length * 0.5,
        wage: getWorkerWage(worker),
        totalWage,
      };
    });

    return {
      saturday,
      thursday,
      workers: workerSummary,
      totalPayable: workerSummary.reduce((s, w) => s + w.totalWage, 0),
    };
  };

  const weeklySummary = getWeeklySummary();

  if (showInvoice) {
    return (
      <div className="space-y-12 p-8 bg-white text-black min-h-screen italic font-outfit selection:bg-black selection:text-white">
        <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
        <div className="flex justify-between items-center no-print w-[210mm] mx-auto mb-12">
          <button
            onClick={() => setShowInvoice(false)}
            className="bg-slate-50 text-black px-5 py-3 rounded-full font-black uppercase text-xs border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all font-outfit"
          >
            ফিরে যান
          </button>
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-12 py-5 rounded-full font-black uppercase text-xs shadow-2xl border-b-[8px] border-zinc-900 font-outfit"
          >
            প্রিন্ট ইনভয়েস (A4)
          </button>
        </div>
        <div className="w-[210mm] min-h-[297mm] mx-auto border-[12px] border-slate-50 p-10 md:p-14 rounded-3xl shadow-3xl relative overflow-hidden bg-white print:w-full print:min-h-[100vh] print:shadow-none print:border-none">
          {/* Watermark Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
            <NRZLogo size="xl" white={false} />
          </div>

          <div className="text-center mb-10 flex flex-col items-center relative z-10">
            <img
              src={logoBlack}
              alt="NRZO0NE"
              className="w-16 h-16 object-contain mb-4 mix-blend-multiply"
            />
            <h1 className="text-2xl font-black italic tracking-tighter mb-2 text-black uppercase">
              NRZO0NE
            </h1>
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">
              Official Weekly Ledger Record
            </p>
            <div className="mt-4 px-4 py-1.5 bg-black text-white rounded-full inline-block">
              <p className="text-[10px] font-black uppercase tracking-widest">
                {selectedDepartment.toUpperCase()} DEPT — WEEKLY STATEMENT
              </p>
            </div>
          </div>

          <table className="w-full text-left relative z-10">
            <thead className="border-b-2 border-slate-100">
              <tr className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                <th className="py-4">Worker Identity</th>
                <th className="py-4 text-center">Duty</th>
                <th className="py-4 text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {weeklySummary.workers.map((w, i) => (
                <tr key={i} className="text-sm font-black group">
                  <td className="py-4 uppercase tracking-tighter text-black">
                    {w.worker}
                  </td>
                  <td className="py-4 text-center text-slate-400">
                    {w.presentDays}{" "}
                    <span className="text-[8px] tracking-widest">DAYS</span>
                  </td>
                  <td className="py-4 text-right text-black">
                    ৳{w.totalWage.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-4 border-black font-black text-2xl">
                <td
                  colSpan="2"
                  className="py-6 text-right italic text-slate-400"
                >
                  TOTAL:
                </td>
                <td className="py-6 text-right italic text-black font-black">
                  ৳{weeklySummary.totalPayable.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-end opacity-20 relative z-10">
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">
              Auth Signature
            </p>
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">
              VER V4.1 SECURITY SEAL
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showDailyPrint) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-black selection:bg-black selection:text-white font-outfit">
        <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
        <div className="w-[210mm] mx-auto text-black pb-10 print:pb-0">
          <div className="no-print flex justify-between items-center mb-8 bg-white p-6 rounded-xl border border-slate-100 italic shadow-sm">
            <button
              onClick={() => setShowDailyPrint(false)}
              className="px-4 py-2 bg-slate-50 text-black font-black uppercase text-[10px] tracking-widest rounded-full border border-slate-100 hover:scale-105 transition-all"
            >
              ← Cancel
            </button>
            <p className="text-[9px] uppercase font-black tracking-[0.5em] text-slate-400">
              DAILY PERFORMANCE (A4)
            </p>
            <button
              onClick={() => window.print()}
              className="px-10 py-4 bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-full shadow-2xl border-b-[8px] border-zinc-900 hover:scale-105 transition-all"
            >
              Commit Print Job
            </button>
          </div>

          <div className="border-[4px] border-black bg-white p-6 md:p-6 rounded-3xl relative overflow-hidden italic shadow-2xl min-h-[297mm] print:min-h-[100vh] print:shadow-none box-border">
            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
              <NRZLogo size="xl" white={false} />
            </div>

            <div className="flex justify-between items-start border-b-[2px] border-black pb-8 mb-8 relative z-10">
              <div className="flex items-center gap-4">
              <NRZLogo size="sm" white={false} />
                <div>
                  <h1 className="text-3xl font-black italic tracking-tighter leading-none mb-1 uppercase">
                    NRZO0NE <span className="text-slate-300">PRO</span>
                  </h1>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
                    Official workforce recording
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase italic text-slate-400 mb-1">
                  Authenticated on
                </p>
                <p className="text-xl font-black italic tracking-tighter">
                  {selectedDate}
                </p>
                <p className="text-[8px] font-black uppercase italic text-slate-400 mt-1 tracking-widest">
                  {selectedDepartment.toUpperCase()} DEPT
                </p>
              </div>
            </div>

            <table className="w-full text-left italic relative z-10">
              <thead className="border-b border-slate-100 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                <tr>
                  <th className="py-4">Worker Identity</th>
                  <th className="py-4 text-center">Protocol</th>
                  <th className="py-4 text-right">Yield Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workers.map((worker, i) => {
                  const status = getAttendance(worker);
                  const wage = getWorkerWage(worker);
                  const todayWage =
                    status === "present"
                      ? wage
                      : status === "half-day"
                        ? Math.round(wage / 2)
                        : 0;
                  return (
                    <tr key={i} className="text-lg font-black">
                      <td className="py-4 uppercase tracking-tighter">
                        {worker}
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className={`px-4 py-1 rounded-full text-[8px] uppercase border shadow-sm ${status === "present" ? "bg-black text-white" : "text-slate-300 border-slate-50"}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        ৳{todayWage.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-[2px] border-black text-2xl font-black italic">
                <tr>
                  <td
                    colSpan="2"
                    className="py-8 text-right text-slate-100 uppercase italic"
                  >
                    Daily Aggregate
                  </td>
                  <td className="py-8 text-right text-black font-black">
                    ৳{stats.wages.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-16 pt-10 border-t border-slate-100 flex justify-between items-center opacity-30 relative z-10">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.5em] mb-3">
                  INTERNAL SECURITY SEAL
                </p>
                <div className="flex gap-1.5 overflow-hidden w-48 h-1.5 opacity-50">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="w-1 h-full bg-black shrink-0"></div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">
                  V4.4 ARCHITECTURE — SECURITY VERIFIED
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 animate-fade-up px-2 italic text-black font-outfit">
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
              {t('attendance')} <span className="text-slate-400">{t('and')} {t('payments')}</span>
            </h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">
               {t('operationalTerminal')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setViewMode("attendance")}
              className={`pill-tab ${viewMode === "attendance" ? "pill-tab-active" : "pill-tab-inactive hover:text-black"}`}
            >
              {t('attendance')}
            </button>
            <button
              onClick={() => setViewMode("duty")}
              className={`pill-tab ${viewMode === "duty" ? "pill-tab-active" : "pill-tab-inactive hover:text-black"}`}
            >
              {t('liveMonitor')}
            </button>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Daily Wages</p>
            <p className="text-2xl font-black italic text-black leading-none uppercase">
                ৳{stats.wages.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div className="bg-white p-6 md:p-8 rounded-[3rem] border-4 border-slate-50 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10 group-hover:rotate-12 transition-transform">
            <Calendar size={120} strokeWidth={3} />
          </div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-6 block tracking-[0.2em] mb-2 italic">Calendar Access</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-3xl md:text-4xl font-black italic border-none outline-none bg-transparent text-black"
          />
          <p className="mt-8 ml-6 text-sm md:text-xl font-black text-slate-200 uppercase tracking-widest italic">
            {getBengaliDay(selectedDate)} • {formatBengaliDate(selectedDate)}
          </p>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[3rem] border-4 border-slate-50 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10 group-hover:-rotate-12 transition-transform">
            <Users size={120} strokeWidth={3} />
          </div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-6 block tracking-[0.2em] mb-2 italic">Operational Dept</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full text-2xl md:text-3xl font-black italic border-none outline-none bg-transparent uppercase text-black"
          >
            <option value="sewing">{t('sewing')} {t('productionUnit')}</option>
            <option value="stone">{t('stone')} {t('productionUnit')}</option>
            <option value="pata">{t('pataHub')}</option>
            <option value="monthly">{t('monthlyStaff')}</option>
          </select>
        </div>
      </div>

      {viewMode === "attendance" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">{t('worker')} (Total)</p>
              <p className="text-3xl font-black tracking-tighter text-black leading-none italic">{workers.length}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase mt-2 italic tracking-widest">{t('active')}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">{t('present')}</p>
              <p className="text-3xl font-black tracking-tighter text-emerald-600 leading-none italic">{stats.present}</p>
              <p className="text-[8px] font-black text-emerald-400 uppercase mt-2 italic tracking-widest">{stats.halfDay} {t('halfDay')}</p>
            </div>
            <button
              onClick={() => setShowInvoice(true)}
              className="bg-black text-white p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-left group"
            >
              <Printer size={16} className="mb-3 text-white/40 group-hover:text-white transition-colors" />
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 italic">সাপ্তাহিক (Weekly)</p>
              <p className="text-sm font-black uppercase leading-tight italic">Wage Statement</p>
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-left group"
            >
              <Camera size={16} className="mb-3 text-white/40 group-hover:text-white transition-colors" />
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 italic">QR (Rapid Scan)</p>
              <p className="text-sm font-black uppercase leading-tight italic">Scan Attendance</p>
            </button>
          </div>
          
          {showQR && (
              <QRScanner 
                  onScanSuccess={handleQRScan}
                  onClose={() => setShowQR(false)}
              />
          )}

          <div className="grid grid-cols-1 gap-4">
            {workers.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
                  <AlertCircle size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Workers Found</p>
                </div>
            ) : (
                workers.map((worker, idx) => {
                  const status = getAttendance(worker);
                  const wage = getWorkerWage(worker);
                  return (
                    <div
                      key={idx}
                      className="item-card flex flex-col md:flex-row justify-between items-center gap-6 group"
                    >
                      <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                        <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-2xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                          {worker[0].toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-black italic uppercase leading-none tracking-tighter text-black">
                            {worker}
                          </h4>
                          <p className="text-slate-400 text-[11px] font-black uppercase italic tracking-widest leading-none mt-1">
                            • Daily Rate: ৳{wage.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
                        {["present", "half-day", "absent"].map((s) => (
                           <button
                            key={s}
                            onClick={() => markAttendance(worker, s)}
                            className={`px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                status === s 
                                ? (s === "present" ? "bg-emerald-500 text-white shadow-lg" : s === "half-day" ? "bg-amber-500 text-white shadow-lg" : "bg-rose-500 text-white shadow-lg") 
                                : "text-slate-400 hover:text-black hover:bg-white"
                            }`}
                          >
                            {s === "present" ? `✓ ${t('present')}` : s === "half-day" ? `½ ${t('halfDay')}` : `✗ ${t('absent')}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="bg-white p-12 rounded-[5rem] border-4 border-slate-50 shadow-2xl italic text-black">
            <div className="flex items-center justify-between mb-16 px-6">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-3">
                  Live Duty Logs
                </h3>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                  Real-time Work Assignments
                </p>
              </div>
              <Clock size={48} className="text-slate-50" />
            </div>
            <div className="space-y-6">
              {(masterData.productions || []).filter(
                (p) =>
                  p.status === "Pending" &&
                  (p.type === selectedDepartment ||
                    (selectedDepartment === "sewing" &&
                      p.type === "finishing")),
              ).length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-100 gap-8">
                  <Archive size={80} strokeWidth={1} />
                  <p className="text-xl font-black uppercase tracking-[0.4em]">
                    প্রতিষ্ঠানটি বর্তমানে অবমুক্ত
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredDutyLogs = (
                    masterData.productions || []
                  ).filter(
                    (p) =>
                      p.status === "Pending" &&
                      (p.type === selectedDepartment ||
                        (selectedDepartment === "sewing" &&
                          p.type === "finishing")),
                  );
                  return filteredDutyLogs.map((prod, idx) => {
                    const showDate =
                      idx === 0 ||
                      filteredDutyLogs[idx - 1]?.date !== prod.date;
                    return (
                      <React.Fragment key={prod.id || idx}>
                        {showDate && (
                          <div className="flex items-center gap-6 md:gap-10 px-4 md:px-4 py-2">
                            <div className="h-px bg-slate-100 flex-1"></div>
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic whitespace-nowrap">
                                {prod.date}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            </div>
                            <div className="h-px bg-slate-100 flex-1"></div>
                          </div>
                        )}
                        <div
                          key={prod.id}
                          className="bg-slate-50 p-10 rounded-3xl border-2 border-slate-100 flex items-center justify-between group hover:border-black hover:bg-white hover:shadow-2xl transition-all"
                        >
                          <div className="flex items-center gap-10">
                            <div className="w-16 h-16 bg-black text-white rounded-2xl font-black italic text-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform border-4 border-slate-50">
                              {prod.size}
                            </div>
                            <div>
                              <h4 className="text-2xl font-black italic uppercase leading-none mb-4 text-black">
                                {prod.design}
                              </h4>
                              <div className="flex gap-4">
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest bg-white px-5 py-2 rounded-xl border border-slate-100 italic">
                                  {prod.worker}
                                </span>
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest bg-white px-5 py-2 rounded-xl border border-slate-100 italic">
                                  {prod.color}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-end gap-2 mb-2">
                              <p className="text-xs font-black text-slate-300 uppercase italic">
                                Issued Units:
                              </p>
                              <p className="text-3xl font-black italic text-black leading-none">
                                B:{prod.issueBorka} / H:{prod.issueHijab}
                              </p>
                            </div>
                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-3 animate-pulse italic">
                              ⏳ Pending Collection • {prod.date}
                            </p>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}
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

export default AttendancePanel;
