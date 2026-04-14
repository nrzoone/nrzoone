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
  Fingerprint,
  TrendingDown
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
  logAction,
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedDepartment, setSelectedDepartment] = useState("monthly");
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
    return masterData.workerCategories?.[selectedDepartment] || [];
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
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
      <div className="space-y-12 p-8 bg-white text-black dark:text-white min-h-screen font-sans selection:bg-black selection:text-white">
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
              className={`flex flex-col h-full !p-6 border-l-[6px] transition-all group rounded-xl shadow-md ${status === 'present' ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-900/5' : status === 'half-day' ? 'border-amber-400 bg-amber-50/5 dark:bg-amber-900/5' : 'border-slate-50 bg-white dark:bg-slate-900 dark:border-slate-800'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-xl font-black tracking-tight text-[var(--text-primary)] italic uppercase truncate w-32">{worker}</h3>
                   <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5 italic leading-none">ID: REF-{worker.slice(0,3).toUpperCase()}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${status === 'present' ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
                   <UserCheck size={18} />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                 <div className="flex justify-between items-center text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest italic leading-none">
                    <span>Base Earnings</span>
                    <span className="text-[var(--text-primary)]">৳{dailyWage}</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: status === 'present' ? '100%' : status === 'half-day' ? '50%' : '0%' }}></div>
                 </div>
              </div>

              <div className="flex items-center gap-1.5 mt-auto">
                <button
                  onClick={() => markAttendance(worker, "present")}
                  className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all italic ${status === "present" ? "bg-slate-950 text-white shadow-xl scale-105" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-black dark:hover:text-white"}`}
                >
                  FULL
                </button>
                <button
                  onClick={() => markAttendance(worker, "half-day")}
                  className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all italic ${status === "half-day" ? "bg-amber-400 text-black shadow-xl scale-105" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-black dark:hover:text-white"}`}
                >
                  HALF
                </button>
                <button
                  onClick={() => markAttendance(worker, "absent")}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${status === "absent" ? "bg-rose-500 text-white shadow-xl rotate-90" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-rose-500"}`}
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
        <div className="flex justify-between items-center no-print w-full max-w-5xl mx-auto mb-10">
          <button
            onClick={() => setShowInvoice(false)}
            className="neu-button px-6 py-3 text-[10px]"
          >
            ফিরে যান
          </button>
          <button
            onClick={() => window.print()}
            className="action-btn-primary !px-10 !py-4 shadow-xl"
          >
            প্রিন্ট ইনভয়েস (A4)
          </button>
        </div>
        <div className="w-[210mm] min-h-[297mm] mx-auto border-[1px] border-slate-100 p-10 md:p-14 rounded-2xl shadow-3xl relative overflow-hidden bg-white print:w-full print:min-h-[100vh] print:shadow-none print:border-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
            <NRZLogo size="xl" white={false} />
          </div>

          <div className="text-center mb-10 flex flex-col items-center relative z-10">
            <h1 className="text-2xl font-black tracking-tighter mb-2 text-black dark:text-white uppercase">
              NRZO0NE
            </h1>
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-black dark:text-white">
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
              <tr className="text-[8px] font-black uppercase tracking-[0.3em] text-black dark:text-white">
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
                  <td className="py-4 text-center text-black dark:text-white">
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
                  className="py-6 text-right text-black dark:text-white"
                >
                  TOTAL:
                </td>
                <td className="py-6 text-right text-black dark:text-white font-black">
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
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 text-black dark:text-white border-t-0">
      {/* SaaS Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="saas-card flex items-center gap-5 group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Users size={22} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter text-black dark:text-white leading-none mb-1 italic">{workers.length}</p>
            <p className="text-subtitle">মোট কর্মী (WORKFORCE)</p>
          </div>
        </div>
        <div className="saas-card flex items-center gap-5 group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter text-emerald-600 leading-none mb-1 italic">{stats.present}</p>
            <p className="text-subtitle">আজ উপস্থিত (PRESENT)</p>
          </div>
        </div>
        <div className="saas-card flex items-center gap-5 group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter text-black dark:text-white leading-none mb-1 italic">৳{stats.wages.toLocaleString()}</p>
            <p className="text-subtitle">দৈনিক মজুরি (WAGES)</p>
          </div>
        </div>
      </div>



      {/* Control Bar - SaaS Pill Navigation */}
      <div className="bg-white dark:bg-slate-900 !p-1.5 flex flex-col md:flex-row items-center justify-between gap-4 rounded-[var(--radius-saas)] border border-[var(--border)] shadow-[var(--shadow-card)]">
        <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'monthly', label: 'মাসিক STAFF' },
            { id: 'office', label: 'OFFICE' },
            { id: 'cutting', label: 'CUTTING' },
            { id: 'pata', label: 'PATA HUB' }
          ].map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDepartment(dept.id)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedDepartment === dept.id ? 'bg-slate-950 text-white shadow-xl dark:bg-white dark:text-black' : 'text-[var(--text-muted)] hover:text-black dark:hover:text-white'}`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto px-2">
          <div className="relative group flex-1 md:flex-none">
            <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="date"
              className="premium-input !pl-11 !h-11 !text-[11px] !bg-slate-50 dark:!bg-slate-800/20 !w-full md:!w-44"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowInvoice(true)} 
                className="w-11 h-11 action-btn-secondary !p-0 !rounded-xl"
                title="সাপ্তাহিক রিপোর্ট"
              >
                <Printer size={16} />
              </button>
              <button 
                onClick={() => setShowQR(true)} 
                className="w-11 h-11 action-btn-primary !p-0 !rounded-xl shadow-blue-500/20"
                title="কিউআর স্ক্যান"
              >
                <Camera size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showQR && <QRScanner onScanSuccess={handleQRScan} onClose={() => setShowQR(false)} />}

      {/* Main Attendance List */}
      <div className="grid grid-cols-1 gap-2.5">
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
              <div key={idx} className="saas-card flex flex-col md:flex-row justify-between items-center gap-4 group !p-4 md:!p-5 hover:border-black transition-all animate-fade-up">
                <div className="flex items-center gap-5 flex-1 w-full md:w-auto">
                  <div className="w-12 h-12 bg-slate-950 text-white dark:bg-white dark:text-black flex items-center justify-center text-xl font-black rounded-2xl shadow-xl transition-transform group-hover:scale-105">
                    {worker[0].toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h4 className="text-xl font-black tracking-tighter text-black dark:text-white uppercase leading-tight italic truncate max-w-[150px] md:max-w-[250px]">{worker}</h4>
                        {workerId && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100 dark:border-blue-800">REF:{workerId}</span>}
                    </div>
                    <p className="text-subtitle flex items-center gap-2">
                       <DollarSign size={10} className="text-emerald-500" /> ৳{wage.toLocaleString()} (STANDARD DAILY RATE)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex p-0.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg gap-1 border border-slate-100/50">
                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') ? (
                      <>
                        {[
                          { id: "present", label: "FULL" },
                          { id: "half-day", label: "HALF" },
                          { id: "absent", label: "ABSENT" }
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => markAttendance(worker, s.id)}
                            className={`px-3 py-1.5 rounded-md text-[8.5px] font-black uppercase tracking-widest transition-all ${
                                status === s.id 
                                ? (s.id === "present" ? "bg-slate-950 text-white shadow-md" : s.id === "half-day" ? "bg-amber-500 text-white shadow-md" : "bg-rose-500 text-white shadow-md") 
                                : "text-black dark:text-white hover:text-black dark:text-white dark:hover:text-white"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className={`px-4 py-1.5 rounded-lg text-[8.5px] font-bold uppercase tracking-widest ${status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {status === 'present' ? 'PRESENT' : status === 'half-day' ? 'HALF' : 'ABSENT'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1.5">
                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
                       <button 
                          onClick={() => registerBiometric(worker)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border border-slate-200 dark:border-slate-800 ${masterData.workerBiometrics?.[worker] ? 'bg-emerald-500 text-white shadow-md border-none' : 'bg-white dark:bg-slate-800 text-slate-300 hover:text-black dark:text-white dark:hover:text-white'}`}
                          title="FINGERPRINT"
                      >
                          <Fingerprint size={14} />
                      </button>
                    )}
                    <button 
                        onClick={() => {
                            const phone = workerDoc?.phone || "8801700000000";
                            const msg = `সালাম ${worker},\nআপনার আজকের হাজিরা [${status.toUpperCase()}]।\nধন্যবাদ - NRZOONE`;
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
        })}
      </div>

      <div className="pt-24 pb-12 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-6 bg-white dark:bg-slate-900 px-12 md:px-16 py-7 md:py-8 rounded-[var(--radius-saas)] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:border-slate-950 transition-all duration-500"
        >
            <div className="p-3 bg-slate-950 text-white rounded-xl transition-transform shadow-lg group-hover:scale-110">
                <ArrowLeft size={20} strokeWidth={3} />
            </div>
            <span className="text-lg font-bold tracking-tight text-black dark:text-white uppercase leading-none">
                ড্যাশবোর্ডে ফিরে যান
            </span>
        </button>
      </div>
    </div>
  );
};

export default AttendancePanel;
