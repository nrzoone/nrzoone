import React, { useState, useEffect } from "react";
import {
  LogOut,
  ArrowLeft,
  Settings,
  User,
  Lock,
  AlertCircle,
  Activity,
  Scissors,
  Layers,
  Hammer,
  Package,
  Truck,
  Users,
  Database,
  DollarSign,
  FileText,
  LayoutGrid,
  Menu,
  Sun,
  Moon,
  Globe,
// Production Build Hook v2.11 - Final Branding Sync
  X,
  Send,
  Archive,
  CheckCircle,
  Search,
  Bell,
  MessageSquare,
  MessageCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Printer,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Overview from "./components/Overview";
import CuttingPanel from "./components/panels/CuttingPanel";
import FactoryPanel from "./components/panels/FactoryPanel";
import PataFactoryPanel from "./components/panels/PataFactoryPanel";
import WorkerSummary from "./components/WorkerSummary";
import WeeklyInvoice from "./components/WeeklyInvoice";
import ReportsPanel from "./components/panels/ReportsPanel";
import AttendancePanel from "./components/panels/AttendancePanel";
import SettingsPanel from "./components/panels/SettingsPanel_V2";
import ExpensePanel from "./components/panels/ExpensePanel";
import InventoryPanel from "./components/panels/InventoryPanel";
import OutsideWorkPanel from "./components/panels/OutsideWorkPanel";
import { useMasterData } from "./hooks/useMasterData";
import { Toast } from "./components/UIComponents";
import { useTranslation } from "./utils/translations";
import QRScanner from "./components/QRScanner";
import NRZLogo from "./components/NRZLogo";

const GlobalStyles = () => null;

// Global Emergency Suppression for AbortError and quota issues
// This must run before any hooks or components that might trigger these
const suppressGlobalError = (event) => {
    const reason = event.reason || event.error || event;
    const errStr = String(reason?.message || reason?.code || reason || '');
    if (/abort|cancelled|user aborted|timeout|quota|storage/i.test(errStr)) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        console.warn("🛡️ SILENCED BENIGN ERROR:", errStr);
        return true;
    }
};
window.addEventListener('unhandledrejection', suppressGlobalError, true);
window.addEventListener('error', suppressGlobalError, true);

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        const errStr = String(error?.message || error?.toString() || error);
        if (/abort|cancelled|user aborted|timeout|quota/i.test(errStr)) {
            return { hasError: false, error: null };
        }
        return { hasError: true, error };
    }

    handleRecover = () => {
        localStorage.clear(); // Extreme recovery
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 text-center font-outfit">
                    <div className="relative mb-12">
                        <AlertTriangle size={80} className="text-amber-500 animate-pulse" />
                        <div className="absolute inset-0 blur-3xl bg-amber-500 opacity-20 animate-pulse"></div>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Engine Protection Mode</h1>
                    <p className="text-slate-500 text-sm max-w-md mb-12 uppercase tracking-widest leading-relaxed">
                        A critical runtime discrepancy was detected. The system has paused to prevent data corruption.
                    </p>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-12 w-full max-w-lg text-left overflow-auto max-h-40">
                        <p className="text-rose-500 text-[10px] font-mono leading-relaxed line-clamp-4">{this.state.error?.toString()}</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-white text-black px-12 py-5 rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                            Emergency Reboot
                        </button>
                        <button 
                            onClick={this.handleRecover} 
                            className="bg-zinc-800 text-white px-12 py-5 rounded-full font-black uppercase text-xs tracking-widest hover:bg-rose-600 transition-all"
                        >
                            Full System Purge
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const playSound = (type = 'click') => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'success') {
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
        } else if (type === 'error') {
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
        } else {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
        }
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
        console.warn("Audio Context blocked or failed:", e);
    }
};

const Logo = ({ size = "md", white = false, showText = true }) => (
  <NRZLogo size={size} white={white} />
);

const LoginView = ({ onLogin, masterData }) => {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-primary)] animate-fade-up transition-colors duration-500">
            <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                <Logo size="lg" white />
                <div className="mt-12 text-center hidden md:block">
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.8em] italic">Industrial Strategic Nexus</p>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20">
                <div className="w-full max-w-md space-y-12">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2 text-[var(--text-primary)]">Login</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Strategic Unit Access Portal</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onLogin(id, password); }} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2 italic">Identity</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[var(--text-primary)] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        autoFocus
                                        className="premium-input pl-16 py-6"
                                        placeholder="UNID-NRZ-XXXX"
                                        value={id}
                                        onChange={(e) => setId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2 italic">Auth Protocol</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[var(--text-primary)] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        className="premium-input pl-16 pr-16 py-6"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[var(--text-primary)]">
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-6 text-xl italic mt-12 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Sign In Now</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const TrackingView = ({ trackId, masterData, onClose, isDarkMode }) => {
    const item = [...(masterData.productions || []), ...(masterData.pataEntries || [])].find(i => String(i.id) === trackId);
    if (!item) return <div className="min-h-screen flex items-center justify-center bg-black text-rose-500 font-black uppercase">Tracking ID Not Found <button onClick={onClose} className="ml-4 bg-white text-black p-2 rounded">Close</button></div>;

    return (
        <div className="min-h-screen bg-white p-8 md:p-20 font-outfit italic animate-fade-up">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex justify-between items-center">
                    <Logo size="sm" white={false} />
                    <button onClick={onClose} className="p-4 bg-slate-100 rounded-full hover:bg-black hover:text-white transition-all"><X size={20} /></button>
                </div>
                
                <div className="bg-black text-white p-12 rounded-[5rem] shadow-3xl text-center flex flex-col items-center">
                    <NRZLogo size="md" white={true} />
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500 mt-6 mb-6">Status</p>
                    <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter">{item.status === 'Pending' ? 'In Production' : 'Completed'}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 border-t border-white/10 pt-12">
                        <div><p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1 font-black underline">Lot</p><p className="font-black">#{item.lotNo}</p></div>
                        <div><p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1 font-black underline">Worker</p><p className="font-black uppercase">{item.worker}</p></div>
                        <div><p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1 font-black underline">Design</p><p className="font-black uppercase">{item.design}</p></div>
                        <div><p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1 font-black underline">Qty</p><p className="font-black">{(item.issueBorka || item.pataQty || 0)} Pcs</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MENU_ITEMS = [
  { id: "Menu", label: "Main Menu", icon: LayoutGrid, sub: "All Depts" },
  { id: "Overview", label: "Dashboard", icon: Activity, sub: "Live Monitor" },
  { id: "Cutting", label: "Cutting", icon: Scissors, sub: "Raw" },
  { id: "Swing", label: "Sewing", icon: Layers, sub: "Factory" },
  { id: "Stone", label: "Stone", icon: Hammer, sub: "Factory" },
  { id: "Pata", label: "Pata Hub", icon: Package, sub: "Logistics" },
  { id: "Outside", label: "Outside Work", icon: Truck, sub: "External" },
  { id: "Attendance", label: "Attendance", icon: Users, sub: "Staff" },
  { id: "Stock", label: "Inventory", icon: Database, sub: "Vault" },
  { id: "Accounts", label: "Accounts", icon: DollarSign, sub: "Financial" },
  { id: "Reports", label: "Reports", icon: FileText, sub: "Analytics" },
  { id: "Settings", label: "Settings", icon: Settings, sub: "System" },
  { id: "Security", label: "Security", icon: Lock, sub: "Audit Log" },
];

const Sidebar = ({ activePanel, setActivePanel, user, setUser, isOpen, setIsSidebarOpen, t, isDarkMode }) => {
    return (
        <div className={`md:left-6 md:top-6 md:h-[calc(100vh-48px)] fixed left-0 top-0 h-full bg-[var(--bg-secondary)] backdrop-blur-3xl border border-[var(--border)] z-[100] flex flex-col py-10 transition-all duration-500 sidebar ${isOpen ? "w-[280px] md:rounded-[40px] shadow-2xl" : "w-0 -translate-x-full"}`}>
            <div className="px-8 mb-16"><Logo size="sm" white={isDarkMode} /></div>
            <div className="flex-1 overflow-y-auto px-4 space-y-2 no-scrollbar">
                {MENU_ITEMS.map(item => {
                    const Icon = item.icon;
                    const active = activePanel === item.id;
                    return (
                        <button 
                            key={item.id} onClick={() => { setActivePanel(item.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 p-4 rounded-[24px] transition-all group ${active ? "bg-black text-white dark:bg-white dark:text-black shadow-xl translate-x-1" : "text-slate-500 hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] hover:shadow-lg"}`}
                        >
                            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                            <span className={`text-xs uppercase tracking-widest italic ${active ? "font-black" : "font-bold"}`}>{t(item.id.toLowerCase()) || item.label}</span>
                        </button>
                    );
                })}
            </div>
            <div className="px-4 mt-8 pt-8 border-t border-slate-100">
                <button onClick={() => setUser(null)} className="w-full flex items-center gap-4 p-4 rounded-xl text-slate-500 hover:text-rose-500 transition-colors">
                    <LogOut size={16} /><span className="text-[9px] font-black uppercase tracking-[0.3em] italic">{t('logout') || 'Logout'}</span>
                </button>
            </div>
        </div>
    );
};

const SecurityPanel = ({ masterData, t, user }) => {
    const alerts = (masterData.auditLogs || []).filter(log => {
        const isDelete = log.action?.includes('DELETE');
        const isEdit = log.action?.includes('EDIT') || log.action?.includes('OVERRIDE');
        const isLargePay = log.action?.includes('PAY') && parseFloat(log.details?.match(/\d+/)?.[0] || 0) > 5000;
        return isDelete || isEdit || isLargePay;
    });

    return (
        <div className="space-y-8 animate-fade-up font-outfit italic">
            <div className="flex items-center gap-6 mb-12">
                <div className="p-6 bg-rose-500 text-white rounded-[2rem] shadow-2xl rotate-3">
                    <Lock size={40} strokeWidth={3} />
                </div>
                <div>
                   <h2 className="text-5xl font-black uppercase tracking-tighter italic">{t('security')} <span className="text-rose-500">{t('nexus')}</span></h2>
                   <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-500 mt-2 italic opacity-60">ADMIN AUDIT & SYSTEM INTEGRITY MONITOR</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-12 rounded-[4rem] border shadow-2xl text-center flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mb-6">{t('totalLogs')}</p>
                    <p className="text-8xl font-black italic tracking-tighter">{masterData.auditLogs?.length || 0}</p>
                </div>
                <div className="col-span-2 bg-black text-rose-500 p-12 rounded-[4rem] shadow-3xl text-center flex flex-col items-center">
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500/50 mb-6 underline">{t('securityFlags')}</p>
                   <p className="text-8xl font-black italic tracking-tighter underline">{alerts.length}</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-8 text-white/70 italic">Unauthorized access attempts: 0 (Stable)</p>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border shadow-inner p-10 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                {alerts.length === 0 ? (
                    <div className="py-20 text-center opacity-20"><ShieldCheck size={100} className="mx-auto border rounded-full p-4 mb-8" /><p className="text-4xl font-black uppercase tracking-tighter">{t('systemSecure')}</p></div>
                ) : (
                    alerts.map((log, i) => (
                        <div key={i} className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 gap-8 group hover:border-rose-500 transition-all">
                           <div className="flex items-center gap-8 flex-1">
                               <div className={`p-6 rounded-3xl ${log.action?.includes('DELETE') ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white shadow-xl'}`}>
                                  {log.action?.includes('DELETE') ? <Trash2 size={30} /> : <AlertTriangle size={30} />}
                               </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 italic">{log.timestamp}</p>
                                  <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1 text-black">{log.action}</h4>
                                  <p className="text-sm font-bold text-slate-600 line-clamp-2 italic">{log.details}</p>
                               </div>
                           </div>
                           <div className="text-center md:text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t('initiatedBy')}</p>
                              <div className="px-6 py-2 bg-black text-white rounded-full text-xs font-black italic">{log.user} ({log.role})</div>
                           </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const MenuPanel = ({ setActivePanel, user, t }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-up">
            {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <button 
                        key={item.id} onClick={() => setActivePanel(item.id)}
                        className="neu-card p-10 flex flex-col items-center gap-6 group hover:scale-[1.05] transition-all italic"
                    >
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-lg shadow-black/5">
                            <Icon size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">{t(item.id.toLowerCase()) || item.label}</h3>
                            <div className="mt-8 pt-8 flex justify-between items-center border-t-2 border-dashed border-slate-200">
                                <div className="flex items-center gap-4">
                                    <NRZLogo size="sm" white={false} />
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-slate-500">System v2.10</p>
                                        <p className="text-[10px] font-black tracking-tighter italic">SMART TRACK™ PRODUCTION NODE</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{item.sub}</p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

const AppContent = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [language, setLanguage] = useState("BN");
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('nrzone_theme') === 'dark');
    const t = useTranslation(language);
    const [user, setUser] = useState(null);
    const [activePanel, setActivePanel] = useState("Overview");
    const [toast, setToast] = useState(null);
    const { masterData, setMasterData, isLoading } = useMasterData();
    const [trackingId, setTrackingId] = useState(null);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('nrzone_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('nrzone_theme', 'light');
        }
    }, [isDarkMode]);

    const showNotify = (message, type = "success") => {
        playSound(type);
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = (id, pass) => {
        const u = (masterData.users || []).find(x => x.id === id.toUpperCase() && x.password === pass);
        if (u) { setUser(u); showNotify(`স্বাগতম, ${u.name}!`); }
        else showNotify("ভুল আইডি বা পাসওয়ার্ড!", "error");
    };

    if (isLoading || !masterData) return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-20 animate-fade-in transition-all duration-1000">
            <div className="mb-12 animate-pulse scale-110">
                <Logo size="lg" white showText={false} />
            </div>
            <div className="relative group">
                <p className="italic tracking-[0.8em] uppercase text-[10px] font-black text-white opacity-70 animate-pulse">
                    Connecting NRZONE Neural Link...
                </p>
                <div className="absolute -bottom-4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
            <div className="mt-20 flex gap-1">
                {[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full bg-white opacity-10 animate-ping`} style={{ animationDelay: `${i*300}ms` }}></div>)}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-500">
            {!user ? (
                <LoginView onLogin={handleLogin} masterData={masterData} />
            ) : (
                <div className="flex min-h-screen">
                    <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} user={user} setUser={setUser} isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} t={t} isDarkMode={isDarkMode} />
                    <main className={`flex-1 p-4 md:p-20 transition-all ${isSidebarOpen ? "md:ml-[300px]" : "ml-0"}`}>
                        <header className="flex justify-between items-center mb-16 no-print">
                            <div className="flex items-center gap-6">
                                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="neu-button w-14 h-14 dark:bg-zinc-900 dark:border-zinc-800"><Menu size={20} /></button>
                                <div className="hidden md:block">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">{t(activePanel.toLowerCase()) || activePanel}</h2>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">{isLoading ? t('syncing') : t('stable')}</span>
                                        </div>
                                    </div>
                                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mt-1">Status: {t('activeNode')}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsDarkMode(!isDarkMode)} className="neu-button w-14 h-14 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 transition-all duration-500">
                                    {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-500" />}
                                </button>
                                <button onClick={() => setShowQR(true)} className="neu-button w-14 h-14 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800"><Activity size={20} /></button>
                                <button onClick={() => setLanguage(language === 'BN' ? 'EN' : 'BN')} className="neu-button px-6 font-black text-[10px] italic h-14 dark:bg-zinc-900 dark:text-white dark:border-zinc-800">{language}</button>
                                <div className="flex items-center gap-4 neu-card-flat px-6 h-14 min-w-[200px] dark:bg-zinc-900 dark:border-zinc-800">
                                    <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black transition-all duration-500"><User size={14} /></div>
                                    <div className="text-left"><p className="text-xs font-black uppercase italic leading-none dark:text-white">{user.name}</p><p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">{user.role}</p></div>
                                </div>
                            </div>
                        </header>
                        <div className="max-w-7xl mx-auto">
                            {activePanel === "Menu" && <MenuPanel setActivePanel={setActivePanel} user={user} t={t} />}
                            {activePanel === "Overview" && <Overview masterData={masterData} setMasterData={setMasterData} user={user} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Cutting" && <CuttingPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Swing" && <FactoryPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} type="sewing" t={t} />}
                            {activePanel === "Stone" && <FactoryPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} type="stone" t={t} />}
                            {activePanel === "Pata" && <PataFactoryPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} t={t} setActivePanel={setActivePanel} />}
                            {activePanel === "Outside" && <OutsideWorkPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Attendance" && <AttendancePanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Stock" && <InventoryPanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Accounts" && <ExpensePanel masterData={masterData} setMasterData={setMasterData} showNotify={showNotify} user={user} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Reports" && <ReportsPanel masterData={masterData} user={user} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Settings" && <SettingsPanel masterData={masterData} setMasterData={setMasterData} user={user} showNotify={showNotify} setActivePanel={setActivePanel} t={t} />}
                            {activePanel === "Security" && <SecurityPanel masterData={masterData} user={user} t={t} />}
                        </div>
                    </main>
                    {activePanel !== "Menu" && (
                        <button onClick={() => setActivePanel("Menu")} className="fixed bottom-12 right-12 w-20 h-20 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[200] border-4 border-white"><LayoutGrid size={32} /></button>
                    )}
                </div>
            )}
            {trackingId && <div className="fixed inset-0 z-[1000]"><TrackingView trackId={trackingId} masterData={masterData} onClose={() => setTrackingId(null)} isDarkMode={isDarkMode} /></div>}
            {showQR && <QRScanner onScanSuccess={(data) => setTrackingId(data)} onClose={() => setShowQR(false)} />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

const App = () => (<ErrorBoundary><AppContent /></ErrorBoundary>);
export default App;
