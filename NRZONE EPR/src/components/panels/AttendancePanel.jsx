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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
            <NRZLogo size="xl" white={false} />
          </div>

          <div className="text-center mb-10 flex flex-col items-center relative z-10">
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
              <tr className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
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
                  className="py-6 text-right italic text-slate-500"
                >
                  TOTAL:
                </td>
                <td className="py-6 text-right italic text-black font-black">
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
              {t('attendance')} <span className="text-slate-500">{t('and')} {t('payments')}</span>
            </h2>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
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
            <button
              onClick={() => setShowInvoice(true)}
              className="bg-black text-white p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-left group"
            >
              <Printer size={16} className="mb-3" />
              <p className="text-[10px] font-black uppercase leading-tight italic text-white/50">Weekly Report</p>
            </button>
            <button
              onClick={scanBiometricAttendance}
              className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-left group"
            >
              <Fingerprint size={16} className="mb-3" />
              <p className="text-[10px] font-black uppercase leading-tight italic text-white/50">Fingerprint Scan</p>
            </button>
          </div>
          
          {showQR && <QRScanner onScanSuccess={handleQRScan} onClose={() => setShowQR(false)} />}

          <div className="grid grid-cols-1 gap-4">
            {workers.map((worker, idx) => {
                const status = getAttendance(worker);
                const wage = getWorkerWage(worker);
                return (
                  <div key={idx} className="item-card flex flex-col md:flex-row justify-between items-center gap-6 group">
                    <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                      <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-2xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                        {worker[0].toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xl font-black italic uppercase leading-none tracking-tighter text-black">{worker}</h4>
                        <p className="text-slate-500 text-[11px] font-black uppercase italic tracking-widest leading-none mt-1">
                          • Rate: ৳{wage.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0 gap-2 overflow-x-auto">
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
                      <div className="w-px h-8 bg-slate-200 mx-2 self-center hidden md:block"></div>
                      <button 
                          onClick={() => {
                              const msg = `সালাম ${worker},\nআপনার আজকের হাজিরা [${status.toUpperCase()}] হিসেবে রেকর্ড করা হয়েছে।\nধন্যবাদ - NRZOONE`;
                              window.open(`https://wa.me/8801700000000?text=${encodeURIComponent(msg)}`, '_blank');
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
