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
  MessageCircle,
  Fingerprint
} from "lucide-react";
import { syncToSheet } from "../../utils/syncUtils";
import NRZLogo from "../NRZLogo";
import QRScanner from "../QRScanner";

const AttendancePanel = ({
  masterData,
  setMasterData,
  showNotify,
  user,
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
          verification: "biometric"
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
          verification: "manual"
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

      return { ...prev, attendance: newAttendance };
    });
    if (showNotify) showNotify(`${worker}-এর হাজিরা নিশ্চিত করা হয়েছে`);
  };

  const registerBiometric = async (worker) => {
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = crypto.getRandomValues(new Uint8Array(16));
        
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: { name: "NRZOONE ERP" },
                user: {
                    id: userId,
                    name: worker,
                    displayName: worker
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: { authenticatorAttachment: "platform" },
                timeout: 60000
            }
        });

        if (credential) {
            setMasterData(prev => ({
                ...prev,
                workerBiometrics: {
                    ...prev.workerBiometrics,
                    [worker]: {
                        id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
                        registeredAt: new Date().toISOString()
                    }
                }
            }));
            showNotify(`${worker}-এর ডিজিটাল ফিঙ্গারপ্রিন্ট সেভ করা হয়েছে`, 'success');
        }
    } catch (err) {
        console.error("Biometric registration failed:", err);
        showNotify("আঙুলের ছাপ নেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।", 'error');
    }
  };

  const scanBiometricAttendance = async () => {
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const credential = await navigator.credentials.get({
            publicKey: {
                challenge,
                timeout: 60000,
                userVerification: "required"
            }
        });

        if (credential) {
            const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            const workerMatch = Object.entries(masterData.workerBiometrics || {}).find(([w, data]) => data.id === rawId);
            
            if (workerMatch) {
                markAttendance(workerMatch[0], 'present');
                showNotify(`স্বাগতম ${workerMatch[0]}! আপনার হাজিরা নেওয়া হয়েছে।`, 'success');
            } else {
                showNotify("এটি অজানা আঙুলের ছাপ! রেজিস্ট্রেশন করুন।", "error");
            }
        }
    } catch (err) {
        console.error("Biometric scan failed:", err);
        showNotify("ফিঙ্গারপ্রিন্ট স্ক্যান বাতিল হয়েছে", "error");
    }
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
      <div className="space-y-12 p-8 bg-white text-black min-h-screen font-sans selection:bg-black selection:text-white">
        <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        {workers.map((worker) => {
          const status = getAttendance(worker);
          const dailyWage = getWorkerWage(worker);

          return (
            <div
              key={worker}
              className={`premium-card !p-6 border-l-[6px] transition-all group ${status === 'present' ? 'border-emerald-500 bg-emerald-50/10' : status === 'half-day' ? 'border-amber-400 bg-amber-50/10' : 'border-slate-100 bg-white dark:bg-slate-900/50'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">{worker}</h3>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: REF-{worker.slice(0,3).toUpperCase()}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                   <UserCheck size={14} />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                 <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-400 tracking-widest">
                    <span>Base Earnings</span>
                    <span className="text-black dark:text-white">৳{dailyWage}</span>
                 </div>
                 <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: status === 'present' ? '100%' : status === 'half-day' ? '50%' : '0%' }}></div>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => markAttendance(worker, "present")}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${status === "present" ? "bg-emerald-500 text-white shadow-md" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"}`}
                >
                  FULL
                </button>
                <button
                  onClick={() => markAttendance(worker, "half-day")}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${status === "half-day" ? "bg-amber-400 text-black shadow-md font-extrabold" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-amber-50 hover:text-amber-600"}`}
                >
                  HALF
                </button>
                <button
                  onClick={() => markAttendance(worker, "absent")}
                  className={`p-2.5 rounded-lg transition-all ${status === "absent" ? "bg-rose-500 text-white shadow-md rotate-90" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-600"}`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
        <div className="flex justify-between items-center no-print w-[210mm] mx-auto mb-12">
          <button
            onClick={() => setShowInvoice(false)}
            className="bg-slate-50 text-black px-5 py-3 rounded-full font-black uppercase text-xs border border-slate-100 shadow-sm hover:bg-black hover:text-white transition-all"
          >
            ফিরে যান
          </button>
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-12 py-5 rounded-full font-black uppercase text-xs shadow-2xl border-b-[8px] border-zinc-900"
          >
            প্রিন্ট ইনভয়েস (A4)
          </button>
        </div>
        <div className="w-[210mm] min-h-[297mm] mx-auto border-[12px] border-slate-50 p-10 md:p-14 rounded-3xl shadow-3xl relative overflow-hidden bg-white print:w-full print:min-h-[100vh] print:shadow-none print:border-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
            <NRZLogo size="xl" white={false} />
          </div>

          <div className="text-center mb-10 flex flex-col items-center relative z-10">
            <h1 className="text-2xl font-black tracking-tighter mb-2 text-black uppercase">
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
              <tr className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
                <th className="py-4">Worker Identity</th>
                <th className="py-4 text-center">Duty</th>
                <th className="py-4 text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {weeklySummary.workers.map((w, i) => (
                <tr key={i} className="text-sm font-black group">
                  <td className="py-4 uppercase tracking-tighter text-black">
                    {w.worker}
                  </td>
                  <td className="py-4 text-center text-slate-500">
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
                  className="py-6 text-right text-slate-500"
                >
                  TOTAL:
                </td>
                <td className="py-6 text-right text-black font-black">
                  ৳{weeklySummary.totalPayable.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-fade-up font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16 px-2">
        <div className="space-y-4">
          <h1 className="section-header !mb-0 tracking-tightest">Workforce <span className="text-slate-300 dark:text-slate-700 font-light">Attendance</span></h1>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="px-5 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg">v2.5 BIOMETRICS</span>
            <span className="px-5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-widest italic">{selectedDepartment.toUpperCase()} UNIT</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-8 items-center bg-[var(--bg-secondary)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner group hover:scale-110 transition-all"><UserCheck size={20} /></div>
            <div>
              <p className="text-3xl font-bold leading-none dark:text-white tracking-tight">{stats.present}</p>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Staff Active</p>
            </div>
          </div>
          <div className="w-px h-10 bg-[var(--border)]"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 shadow-inner group hover:scale-110 transition-all"><DollarSign size={20} /></div>
            <div>
              <p className="text-3xl font-bold leading-none dark:text-white tracking-tight">{stats.wages.toLocaleString()}৳</p>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Wage Load</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-8 mb-16 no-print bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="pill-nav !p-1 shadow-none !bg-slate-100/50 dark:!bg-slate-900/50">
            {['sewing', 'cutting', 'stone', 'pata', 'office'].map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${selectedDepartment === dept ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-slate-400 hover:text-black dark:hover:text-white'}`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="date"
              className="bg-slate-50 dark:bg-slate-800 border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-black/10 transition-all"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button onClick={() => setShowQR(true)} className="p-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Fingerprint size={18} /></button>
        </div>
      </div>

      {viewMode === "attendance" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">{t('worker')} (Total)</p>
              <p className="text-3xl font-black tracking-tighter text-black leading-none italic">{workers.length}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">{t('present')}</p>
              <p className="text-3xl font-black tracking-tighter text-emerald-600 leading-none italic">{stats.present}</p>
            </div>
            {(() => {
            const role = user?.role?.toLowerCase();
            const isAdmin = role === 'admin';
            const isManager = role === 'manager';
            const isPrivileged = isAdmin || isManager;
            if (isPrivileged) {
              return (
                <>
                  <button
                    onClick={() => setShowInvoice(true)}
                    className="bg-black text-white p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-left group"
                  >
                    <Printer size={16} className="mb-3" />
                    <p className="text-[10px] font-black uppercase leading-tight italic text-white/50">Weekly Report</p>
                  </button>
                  <button
                    onClick={() => setShowQR(true)}
                    className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-left group"
                  >
                    <Camera size={16} className="mb-3" />
                    <p className="text-[10px] font-black uppercase leading-tight italic text-white/50">QR Camera Scan</p>
                  </button>
                  <button
                    onClick={scanBiometricAttendance}
                    className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-left group"
                  >
                    <Fingerprint size={16} className="mb-3" />
                    <p className="text-[10px] font-black uppercase leading-tight italic text-white/50">Fingerprint Scan</p>
                  </button>
                </>
              );
            }
            return null;
          })()}
          </div>
          
          {showQR && <QRScanner onScanSuccess={handleQRScan} onClose={() => setShowQR(false)} />}

          <div className="grid grid-cols-1 gap-4">
            {workers.filter(w => {
                 const role = user?.role?.toLowerCase();
                 if (role === 'admin' || role === 'manager') return true;
                 return w.trim().toLowerCase() === user?.name?.trim().toLowerCase();
            }).map((worker, idx) => {
                const status = getAttendance(worker);
                const workerDoc = (masterData.workerDocs || []).find(d => d.name.toUpperCase() === worker.toUpperCase() && d.dept === selectedDepartment);
                const workerId = workerDoc?.workerId;
                const wage = workerDoc?.wage || getWorkerWage(worker);
                return (
                  <div key={idx} className="item-card flex flex-col md:flex-row justify-between items-center gap-6 group">
                    <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                      <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-2xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                        {worker[0].toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h4 className="text-xl font-black italic uppercase leading-none tracking-tighter text-black">{worker}</h4>
                            {workerId && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full shadow-sm">ID: {workerId}</span>}
                        </div>
                        <p className="text-slate-500 text-[11px] font-black uppercase italic tracking-widest leading-none mt-1">
                          • Rate: ৳{wage.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0 gap-2 overflow-x-auto">
                      {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') ? (
                        <>
                          {["present", "half-day", "absent"].map((s) => (
                            <button
                              key={s}
                              onClick={() => markAttendance(worker, s)}
                              className={`px-4 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                  status === s 
                                  ? (s === "present" ? "bg-emerald-500 text-white shadow-lg" : s === "half-day" ? "bg-amber-500 text-white shadow-lg" : "bg-rose-500 text-white shadow-lg") 
                                  : "text-slate-500 hover:text-black hover:bg-white"
                              }`}
                            >
                              {s === "present" ? `✓ ${t('present')}` : s === "half-day" ? `½ ${t('halfDay')}` : `✗ ${t('absent')}`}
                            </button>
                          ))}
                            <button 
                                onClick={() => registerBiometric(worker)}
                                className={`p-3 rounded-lg transition-all shadow-sm border border-slate-100 ${masterData.workerBiometrics?.[worker] ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-300 hover:text-black'}`}
                                title="Register Finger"
                            >
                                <Fingerprint size={16} />
                            </button>
                        </>
                      ) : (
                        <div className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 ${status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            Today Status: {status.toUpperCase()}
                        </div>
                      )}
                      
                      <div className="w-px h-8 bg-slate-200 mx-2 self-center hidden md:block"></div>
                      <button 
                          onClick={() => {
                              const phone = workerDoc?.phone || "8801700000000";
                              const msg = `সালাম ${worker},\nআপনার আজকের হাজিরা [${status.toUpperCase()}] হিসেবে রেকর্ড করা হয়েছে।\nধন্যবাদ - NRZOONE`;
                              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="p-3 bg-white text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-slate-100"
                      >
                          <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
            {/* Minimal Duty Log Placeholder */}
            {(masterData.productions || []).filter(p => p.status === 'Pending').map((prod, idx) => (
               <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center italic">
                   <div>
                       <h4 className="text-xl font-black italic uppercase leading-none mb-2">{prod.design}</h4>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{prod.worker} • {prod.size}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-2xl font-black italic">B:{prod.issueBorka}</p>
                       <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Pending Collection</p>
                   </div>
               </div>
            ))}
        </div>
      )}
      
      <div className="pt-20 pb-10 flex justify-center">
        <button onClick={() => setActivePanel("Overview")} className="flex items-center gap-6 bg-white px-8 py-4 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all">
          <ArrowLeft size={20} />
          <span className="text-lg font-black uppercase italic tracking-widest text-black">Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default AttendancePanel;
