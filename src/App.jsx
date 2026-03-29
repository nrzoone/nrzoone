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
  X,
  Send,
  Archive,
  CheckCircle,
  Search,
  Bell,
  MessageSquare,
  AlertTriangle,
  Eye,
  EyeOff,
  Printer,
} from "lucide-react";
import Overview from "./components/Overview";
import CuttingPanel from "./components/panels/CuttingPanel";
import FactoryPanel from "./components/panels/FactoryPanel";
import PataFactoryPanel from "./components/panels/PataFactoryPanel";
import WorkerSummary from "./components/WorkerSummary";
import WeeklyInvoice from "./components/WeeklyInvoice";
import ReportsPanel from "./components/panels/ReportsPanel";
import AttendancePanel from "./components/panels/AttendancePanel";
import SettingsPanel from "./components/panels/SettingsPanel";
import ExpensePanel from "./components/panels/ExpensePanel";
import InventoryPanel from "./components/panels/InventoryPanel";
import OutsideWorkPanel from "./components/panels/OutsideWorkPanel";
import { useMasterData } from "./hooks/useMasterData";
import { Toast } from "./components/UIComponents";
import { useTranslation } from "./utils/translations";
import logoWhite from "./assets/logo_white.png"; // New branding logo (formerly logo_new.jpg)
import logoBlack from "./assets/logo_black.png"; // Black variant for light backgrounds

const GlobalStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Outfit:wght@400;500;700;900&display=swap');

        :root {
            --font-outfit: 'Outfit', 'Inter', -apple-system, sans-serif;
            --bg-main: #e2e4e9;
            --bg-card: #ffffff;
            --primary: #000000;
            --text-main: #1a1a1a;
            --text-muted: #64748b;
            --accent: #1e293b;
            --control-height: clamp(44px, 6vw, 52px);
            --radius-main: clamp(16px, 3vw, 32px);
            --radius-btn: clamp(12px, 2vw, 16px);
        }

        body {
            font-family: var(--font-outfit);
            background-color: var(--bg-main);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            font-weight: 400;
            overflow-x: hidden;
            font-size: clamp(13px, 1.8vw + 0.5rem, 15px);
            line-height: 1.5;
        }

        @media (max-width: 767px) {
            input[type="text"], input[type="number"], input[type="date"],
            input[type="email"], input[type="password"], select, textarea {
                font-size: 16px !important;
            }
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-weight: 700;
            color: var(--text-main);
        }

        .glass-bg {
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
        }

        .dark-theme-root .glass-bg {
             background: rgba(15, 23, 42, 0.8) !important;
        }

        .premium-card {
            background: #ffffff;
            border-radius: var(--radius-main);
            padding: clamp(20px, 4vw, 32px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .black-button {
            background: #000000;
            color: #ffffff;
            height: var(--control-height);
            padding: 0 clamp(16px, 3vw, 28px);
            border-radius: var(--radius-btn);
            font-weight: 700;
            font-size: clamp(11px, 1.5vw, 14px);
            letter-spacing: 0.06em;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 1px solid #000000;
            cursor: pointer;
            white-space: nowrap;
            min-height: 44px;
        }

        .black-button:hover {
            background: #1a1a1a;
            border-color: #1a1a1a;
            transform: scale(1.02);
        }

        .black-button:active {
            transform: scale(0.98);
        }

        .form-input {
            width: 100%;
            background: #ffffff;
            border: 1px solid rgba(0,0,0,0.10);
            border-radius: var(--radius-main);
            height: var(--control-height);
            padding: 0 clamp(12px, 2.5vw, 20px);
            color: var(--text-main);
            font-weight: 500;
            font-size: clamp(13px, 1.8vw, 15px);
            outline: none;
            transition: all 0.2s;
            box-sizing: border-box;
            min-height: 44px;
        }

        .form-input:focus {
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }

        .form-input::placeholder {
            color: #cbd5e1;
            font-weight: 400;
        }

        textarea.form-input {
            height: auto;
            min-height: clamp(80px, 12vw, 120px);
            padding: clamp(10px, 2vw, 16px) clamp(12px, 2.5vw, 20px);
            resize: vertical;
        }

        .section-header {
            font-size: clamp(1.6rem, 4vw + 0.5rem, 3rem);
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.05em;
            color: #000000;
            line-height: 0.9;
            font-style: italic;
        }

        .pill-tab {
            padding: clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 32px);
            border-radius: 9999px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: clamp(9px, 1.2vw, 12px);
            letter-spacing: 0.1em;
            transition: all 0.3s;
            font-style: italic;
            white-space: nowrap;
            cursor: pointer;
        }

        .pill-tab-active {
            background: #000000;
            color: #ffffff;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .pill-tab-inactive {
            color: #94a3b8;
        }

        .item-card {
            background: #ffffff;
            padding: clamp(14px, 2.5vw, 24px);
            border-radius: clamp(14px, 2vw, 20px);
            border: 1px solid rgba(0,0,0,0.04);
            transition: all 0.3s;
        }

        .item-card:hover {
            box-shadow: 0 20px 40px rgba(0,0,0,0.06);
            transform: translateY(-2px);
        }

        .badge-standard {
            background: #f1f5f9;
            padding: clamp(3px, 0.5vw, 5px) clamp(8px, 1.5vw, 14px);
            border-radius: 8px;
            font-size: clamp(8px, 1vw, 11px);
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #64748b;
        }

        @media (max-width: 640px) {
            .section-header { font-size: clamp(1.4rem, 8vw, 2rem); }
            .pill-tab { padding: 8px 14px; font-size: 9px; }
            .item-card { padding: 14px 16px; border-radius: 16px; }
        }

        /* ===== SCROLLBAR ===== */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        `,
    }}
  />
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
    fetch("http://localhost:8888/log", {
      method: "POST",
      body:
        error.toString() + "\n" + (errorInfo ? errorInfo.componentStack : ""),
    }).catch(() => {});
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 italic">
          <div className="w-16 h-16 bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mb-8 border border-rose-500/20">
            <AlertCircle size={40} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">
            Core Failure
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="mt-12 bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.4em] italic hover:scale-105 transition-transform"
          >
            Restart System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TrackingView = ({ trackId, masterData, onClose }) => {
  const item = [
    ...(masterData.productions || []),
    ...(masterData.pataEntries || []),
  ].find((i) => String(i.id) === trackId);

  if (!item) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mb-8 border border-rose-500/20">
          <AlertCircle size={40} className="animate-pulse" />
        </div>
        <h1 className="text-2xl font-black uppercase italic mb-4">
          Tracking ID Not Found
        </h1>
        <p className="text-slate-500 uppercase text-xs tracking-widest mb-10">
          এই আইডি-র কোনো তথ্য পাওয়া যায়নি।
        </p>
        <button
          onClick={onClose}
          className="bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-[0.4em] italic hover:scale-105 transition-all"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-6 sm:p-12 italic font-outfit animate-fade-up">
      <GlobalStyles />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-2xl shadow-xl flex items-center justify-center border-b-4 border-zinc-900">
              <img
                src={logoWhite}
                alt="NRZO0NE"
                className="w-24 h-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase ml-2">
              NRZO0NE <span className="text-slate-400">FACTORY</span>
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-black text-white p-8 sm:p-16 rounded-2xl sm:rounded-[5rem] shadow-3xl mb-12 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mb-6 font-outfit">
              Current Status (বর্তমান অবস্থা)
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div
                className={`w-6 h-6 rounded-full shadow-lg ${item.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
              />
              <h2 className="text-2xl sm:text-7xl font-black uppercase tracking-tighter italic">
                {item.status === "Pending"
                  ? "Working (কাজ চলছে)"
                  : "Completed (কাজ শেষ)"}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-white/10 pt-10 mt-10">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Lot Number
                </p>
                <p className="text-xl font-black italic">#{item.lotNo}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Worker
                </p>
                <p className="text-xl font-black italic uppercase">
                  {item.worker}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Design
                </p>
                <p className="text-xl font-black italic uppercase">
                  {item.design}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Quantity
                </p>
                <p className="text-xl font-black italic">
                  {(item.issueBorka || item.pataQty || 0) +
                    (item.issueHijab || 0)}{" "}
                  Pcs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-8 border-b border-slate-100 pb-4 flex items-center gap-3">
            <Activity size={16} /> Activity Log (মালের গতিবিধি)
          </h3>
          <div className="space-y-4">
            <div className="bg-slate-50 p-8 rounded-xl border-2 border-slate-50 flex justify-between items-center group hover:border-black transition-all">
              <div className="flex items-center gap-6 text-black">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Send size={18} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    Job Issued (কাজ দেওয়া হয়েছে)
                  </p>
                  <p className="text-lg font-black uppercase">{item.date}</p>
                </div>
              </div>
              <CheckCircle className="text-emerald-500" />
            </div>

            {item.status === "Received" && (
              <div className="bg-emerald-50 p-8 rounded-xl border-2 border-emerald-100 flex justify-between items-center group hover:border-emerald-500 transition-all">
                <div className="flex items-center gap-6 text-black">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Archive size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                      Received at Factory (মজুদ করা হয়েছে)
                    </p>
                    <p className="text-lg font-black uppercase">
                      {item.receiveDate}
                    </p>
                  </div>
                </div>
                <CheckCircle className="text-emerald-500" />
              </div>
            )}

            {item.status === "Pending" && (
              <div className="bg-amber-50 p-8 rounded-xl border-2 border-dashed border-amber-200 flex justify-between items-center group hover:border-amber-500 transition-all">
                <div className="flex items-center gap-6 text-black">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Activity size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                      Current Status
                    </p>
                    <p className="text-lg font-black uppercase">
                      In Production (কাজ চলছে)
                    </p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">
            Powered by NRZO0NE Smart Track™
          </p>
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
  { id: "Settings", label: "System Settings", icon: Settings, sub: "Config" },
];

const MenuPanel = ({ setActivePanel, user, t }) => {
  const isSuperAdmin = user?.id === "NRZO0NE" || user?.role === "admin";

  // Grouping the menu items for the main panel
  const groups = [
    {
      title: "Production Core",
      items: MENU_ITEMS.filter((i) =>
        ["Overview", "Cutting", "Swing", "Stone", "Pata", "Outside"].includes(
          i.id,
        ),
      ),
    },
    {
      title: "Personnel & Logistics",
      items: MENU_ITEMS.filter((i) => ["Attendance", "Stock"].includes(i.id)),
    },
    {
      title: "Admin & Systems",
      items: MENU_ITEMS.filter((i) =>
        ["Accounts", "Reports", "Settings"].includes(i.id),
      ),
    },
  ];

  const labelMap = {
    Menu: "mainMenu",
    Overview: "overview",
    Cutting: "cutting",
    Swing: "sewing",
    Stone: "stone",
    Pata: "pataHub",
    Outside: "outsideWork",
    Attendance: "attendance",
    Stock: "inventory",
    Accounts: "accounts",
    Reports: "reports",
    Settings: "settings",
  };

  const subMap = {
    "All Depts": "allDepts",
    "Live Monitor": "liveMonitor",
    Raw: "raw",
    Factory: "factory",
    Logistics: "logistics",
    External: "external",
    Staff: "staff",
    Vault: "vault",
    Financial: "financial",
    Analytics: "analytics",
    Config: "config",
  };

  return (
    <div className="space-y-12 animate-fade-up">
      {groups.map((group, gIdx) => (
        <div key={gIdx} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-600 italic">
              {group.title}
            </h4>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isDenied = !isSuperAdmin && item.id === "Settings"; // Basic check, more detailed in sidebar

              return (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  disabled={isDenied}
                  className={`subtle-gradient-bg p-5 md:p-6 rounded-2xl border border-slate-100 premium-shadow hover:-translate-y-2 hover:shadow-2xl hover:border-black/10 transition-all duration-300 group italic flex flex-col items-center text-center gap-4 md:gap-6 relative overflow-hidden ${isDenied ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm border border-slate-50 relative z-10">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-800 group-hover:text-black transition-colors leading-none">
                      {t(labelMap[item.id])}
                    </h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase text-slate-400 group-hover:text-slate-600 tracking-[0.2em] mt-3 transition-colors">
                      {t(subMap[item.sub])}
                    </p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-black opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-150 transition-all duration-500 ease-out transform rotate-12">
                    <Icon size={120} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const Sidebar = ({ activePanel, setActivePanel, user, setUser, isOpen, t }) => {
  const isSuperAdmin = user?.id === "NRZO0NE" || user?.role === "admin";

  const getFiltered = (items) =>
    items.filter((item) => {
      if (isSuperAdmin) return true;
      if (user.role === "manager") {
        const allowed = [
          "Overview",
          "Cutting",
          "Swing",
          "Stone",
          "Pata",
          "Outside",
          "Accounts",
          "Menu",
        ];
        return allowed.includes(item.id);
      }
      if (
        user.role === "worker" ||
        (user.role !== "admin" && user.role !== "manager")
      ) {
        const allowed = ["Swing", "Stone", "Pata", "Outside", "Menu"];
        return allowed.includes(item.id);
      }
      return true;
    });

  const coreItems = getFiltered(
    MENU_ITEMS.filter((i) =>
      [
        "Menu",
        "Overview",
        "Cutting",
        "Swing",
        "Stone",
        "Pata",
        "Outside",
      ].includes(i.id),
    ),
  );
  const systemItems = getFiltered(
    MENU_ITEMS.filter((i) =>
      ["Attendance", "Stock", "Accounts", "Reports", "Settings"].includes(i.id),
    ),
  );

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = activePanel === item.id;
    const labelMap = {
      Menu: "mainMenu",
      Overview: "overview",
      Cutting: "cutting",
      Swing: "sewing",
      Stone: "stone",
      Pata: "pataHub",
      Outside: "outsideWork",
      Attendance: "attendance",
      Stock: "inventory",
      Accounts: "accounts",
      Reports: "reports",
      Settings: "settings",
    };
    const subMap = {
      "All Depts": "allDepts",
      "Live Monitor": "liveMonitor",
      Raw: "raw",
      Factory: "factory",
      Logistics: "logistics",
      External: "external",
      Staff: "staff",
      Vault: "vault",
      Financial: "financial",
      Analytics: "analytics",
      Config: "config",
    };

    return (
      <button
        onClick={() => {
          setActivePanel(item.id);
          if (window.innerWidth < 768) setIsSidebarOpen(false); // Auto-close on mobile
        }}
        className={`w-full flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 group relative ${isActive ? "bg-[#1a1a1a] text-white shadow-xl translate-x-2 border border-white/10" : "hover:bg-slate-100/80 hover:translate-x-1"}`}
      >
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? "bg-white/10 shadow-inner" : "bg-slate-100 group-hover:bg-white shadow-sm"}`}
        >
          <Icon
            size={18}
            className={isActive ? "text-white" : "text-slate-500 group-hover:text-black"}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </div>
        <div className="flex-1 text-left hidden md:block">
          <p className={`text-[12px] tracking-widest leading-none truncate uppercase italic ${isActive ? "font-black" : "font-bold text-slate-700"}`}>
            {t(labelMap[item.id])}
          </p>
          <p className={`text-[9px] font-black uppercase mt-1 tracking-widest truncate ${isActive ? "text-white/40" : "text-slate-400"}`}>
            {t(subMap[item.sub])}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`no-print fixed md:left-4 md:top-4 md:h-[calc(100vh-32px)] left-0 top-0 h-full bg-white/95 backdrop-blur-3xl md:border border-r border-slate-100/50 z-[100] flex flex-col pt-8 pb-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sidebar overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${isOpen ? "translate-x-0 w-[280px] md:w-[300px] md:rounded-[32px] 2xl:w-[320px]" : "-translate-x-full w-0"}`}
    >
      <div className="px-5 md:px-8 mb-10 flex flex-col items-center md:items-start">
        <div className="bg-black rounded-2xl p-4 shadow-xl mb-4 group shrink-0 w-16 h-16 flex items-center justify-center">
            <img
              src={logoWhite}
              alt="NRZO0NE"
              className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-500"
            />
        </div>
        <div className="hidden md:block">
            <h1 className="text-xl font-black italic tracking-tighter leading-none text-black">
              NRZO0NE
            </h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mt-1 italic">
              FACTORY INTELLIGENCE
            </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-8">
        <div className="space-y-2">
          {coreItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>

        {systemItems.length > 0 && (
          <div className="pt-6 space-y-2">
            <div className="px-5 mb-4 flex items-center gap-4">
              <div className="h-px bg-slate-50 flex-1"></div>
              <span className="text-[7px] font-black uppercase tracking-[0.6em] text-slate-100 italic">
                Systems
              </span>
              <div className="h-px bg-slate-50 flex-1"></div>
            </div>
            {systemItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-10 border-t border-slate-300/20">
        <button
          onClick={() => setUser(null)}
          className="w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-lg text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 transition-all group mt-2"
        >
          <div className="p-1.5 rounded-xl bg-slate-500/10 group-hover:bg-rose-500/20 transition-colors">
            <LogOut size={14} />
          </div>
          <span className="hidden md:block text-[9px] font-black uppercase italic tracking-widest">
            {t("logout")}
          </span>
        </button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("nrzone_theme") || "light",
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("nrzone_language") || "BN",
  );
  const t = useTranslation(language);

  useEffect(() => {
    localStorage.setItem("nrzone_theme", theme);
    if (theme === "dark")
      document.documentElement.classList.add("dark-theme-root");
    else document.documentElement.classList.remove("dark-theme-root");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("nrzone_language", language);
  }, [language]);

  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem("nrzone_user");
      if (!savedUser || savedUser === "undefined") return null;
      return JSON.parse(savedUser);
    } catch (e) {
      console.error("Auth Restore Error:", e);
      return null;
    }
  });

  const [activePanel, setActivePanel] = useState(() => {
    return sessionStorage.getItem("nrzone_active_panel") || "Overview";
  });

  useEffect(() => {
    if (user) sessionStorage.setItem("nrzone_user", JSON.stringify(user));
    else sessionStorage.removeItem("nrzone_user");
  }, [user]);

  useEffect(() => {
    sessionStorage.setItem("nrzone_active_panel", activePanel);
  }, [activePanel]);

  const [toast, setToast] = useState(null);
  const { masterData, setMasterData, isLoading, syncStatus } = useMasterData();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [trackingId, setTrackingId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const track = params.get("track");
    if (track) setTrackingId(track);
  }, []);

  const showNotify = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState("");

  const unreadCount = (masterData?.notifications || []).filter(
    (n) => !n.read,
  ).length;

  const handleSendSOS = (e) => {
    e.preventDefault();
    if (!sosMessage.trim()) return;

    const newNotification = {
      id: Date.now().toString(),
      type: "sos",
      title: "EMERGENCY SOS",
      message: sosMessage,
      timestamp: new Date().toISOString(),
      read: false,
      target: "admin",
      sender: user?.name || "Staff",
    };

    setMasterData((prev) => ({
      ...prev,
      notifications: [newNotification, ...(prev.notifications || [])],
    }));

    setSosMessage("");
    setShowSOS(false);
    showNotify("Emergency SOS sent to Admin!", "success");
  };

  const markAllRead = () => {
    setMasterData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({
        ...n,
        read: true,
      })),
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 italic font-outfit overflow-hidden">
        <GlobalStyles />
        <div className="relative">
          {/* Animated Rings */}
          <div className="absolute inset-0 scale-150 opacity-20 transition-all duration-1000">
            <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse] scale-110"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-72 h-auto md:w-[500px] animate-premium-pulse mb-12 flex items-center justify-center preserve-colors relative group">
              <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150 group-hover:bg-white/10 transition-colors"></div>
              <img
                src={logoWhite}
                alt="NRZO0NE"
                className="w-full h-auto object-contain rounded-2xl shadow-[0_0_100px_rgba(255,255,255,0.05)] relative z-10"
              />
            </div>

            <div className="text-center space-y-4">
              {/* <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase">NRZO0NE <span className="text-slate-500">PRO</span></h1> */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-xs md:text-sm font-black uppercase tracking-[0.8em] text-emerald-500 animate-pulse">
                    Installing System...
                  </p>
                </div>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
                    @keyframes loading {
                        0% { width: 0%; transform: translateX(-100%); }
                        50% { width: 100%; transform: translateX(0%); }
                        100% { width: 0%; transform: translateX(100%); }
                    }
                `}</style>
      </div>
    );
  }

  if (trackingId) {
    return (
      <TrackingView
        trackId={trackingId}
        masterData={masterData}
        onClose={() => {
          const url = new URL(window.location);
          url.searchParams.delete("track");
          window.history.pushState({}, "", url);
          setTrackingId(null);
        }}
      />
    );
  }

  const renderPanel = () => {
    const props = {
      masterData,
      setMasterData,
      showNotify,
      setActivePanel,
      user,
      language,
      t,
      syncStatus,
    };
    switch (activePanel) {
      case "Overview":
        return <Overview {...props} />;
      case "Menu":
        return <MenuPanel setActivePanel={setActivePanel} user={user} t={t} />;
      case "Cutting":
        return <CuttingPanel {...props} />;
      case "Swing":
        return <FactoryPanel type="sewing" {...props} />;
      case "Stone":
        return <FactoryPanel type="stone" {...props} />;
      case "Pata":
        return <PataFactoryPanel {...props} />;
      case "Attendance":
        return <AttendancePanel {...props} />;
      case "Reports":
        return <ReportsPanel {...props} />;
      case "Settings":
        return <SettingsPanel {...props} />;
      case "Accounts":
        return <ExpensePanel {...props} />;
      case "Stock":
        return <InventoryPanel {...props} />;
      case "Outside":
        return <OutsideWorkPanel {...props} />;
      default:
        return <Overview {...props} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 sm:p-8 font-outfit preserve-colors">
        <GlobalStyles />
        <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-fade-up bg-[#0f1113] border border-white/5">
          {/* Left Panel: Brand & Info */}
          <div className="md:w-1/2 bg-[#000000] p-6 md:p-8 text-white flex flex-col justify-between relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -bottom-20 -left-20 w-[120%] h-80 bg-white/[0.02] blur-[120px] rounded-full group-hover:bg-white/[0.05] transition-all duration-1000"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/[0.03] blur-[100px] rounded-full"></div>

            <div className="flex justify-between items-center relative z-10">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                NRZO0NE <span className="text-white/20">FACTORY</span>
              </h2>
              <div className="hidden sm:flex gap-8 text-[9px] font-black uppercase tracking-[0.4em] text-white/30">
                <span className="text-white border-b-2 border-white pb-1 italic">
                  Log In
                </span>
                <span
                  onClick={() => {
                    const tid = prompt("Enter Tracking ID (আইডি দিন):");
                    if (tid) setTrackingId(tid);
                  }}
                  className="hover:text-white cursor-pointer transition-all hover:scale-105"
                >
                  Track Order
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-16 relative z-10">
              <div className="w-56 md:w-72 animate-premium-pulse relative">
                <img
                  src={logoWhite}
                  alt="NRZO0NE"
                  className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                />
                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full opacity-50"></div>
              </div>
              <div className="mt-14 text-center space-y-4">
                <h1 className="text-2xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                  Welcome{" "}
                  <span className="block text-white/10 not-italic">Back.</span>
                </h1>
                <p className="text-[10px] md:text-xs font-black text-white/20 uppercase tracking-[1em] mt-4 ml-2">
                  Industrial Excellence
                </p>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/5 pt-8 mt-4 flex items-center justify-between opacity-30">
              <p className="text-[8px] font-black uppercase tracking-[0.5em]">
                Global Operations Terminal
              </p>
              <div className="flex gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/20"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Form */}
          <div className="md:w-1/2 bg-white p-10 md:p-20 flex flex-col justify-center relative">
            <div className="max-w-md mx-auto w-full space-y-12">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-black tracking-tighter italic uppercase">
                  Log in
                </h1>
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">
                  Authorized Personal Access Only
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setLoggingIn(true);
                  setTimeout(() => {
                    const rawId = id.trim().toUpperCase();
                    const trimmedPass = password.trim();

                    // Check if user exists in masterData (with case-insensitive and relaxed O/0 matching)
                    const found = (masterData.users || []).find((u) => {
                      if (!u || !u.id) return false;
                      return (
                        String(u.id).toUpperCase().replace(/O/g, "0") ===
                          rawId.replace(/O/g, "0") && u.password === trimmedPass
                      );
                    });

                    if (found) {
                      setUser(found);
                      if (
                        found.role === "worker" ||
                        (found.role !== "admin" && found.role !== "manager")
                      ) {
                        setActivePanel("Swing");
                      }
                      showNotify(
                        `${t("welcome")} ${found.name.toUpperCase()}।`,
                      );
                    } else {
                      // Super Admin Fallback Logic
                      const isAdminId =
                        rawId === "NRZO0NE" ||
                        rawId === "NRZOONE" ||
                        rawId === "NRZ00NE";
                      const adminPass =
                        (masterData.users || []).find(
                          (u) => String(u.id) === "NRZO0NE",
                        )?.password || "Irham@#";

                      if (isAdminId && trimmedPass === adminPass) {
                        const admin = {
                          id: "NRZO0NE",
                          name: "Super Admin",
                          role: "admin",
                        };
                        setUser(admin);
                        showNotify(`${t("welcome")} ${t("admin")}।`);
                      } else {
                        showNotify(t("wrongInfo"), "error");
                      }
                    }
                    setLoggingIn(false);
                  }, 1000);
                }}
                className="space-y-8"
              >
                <div className="space-y-5">
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors">
                      <User size={20} strokeWidth={3} />
                    </div>
                    <input
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      type="text"
                      className="w-full bg-slate-50 border-4 border-slate-50 rounded-xl py-7 pl-16 pr-8 text-lg font-black italic placeholder:text-slate-100 focus:border-black transition-all outline-none text-black uppercase"
                      placeholder="User IDENT"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors">
                      <Lock size={20} strokeWidth={3} />
                    </div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-slate-50 border-4 border-slate-50 rounded-xl py-7 pl-16 pr-20 text-lg font-black italic placeholder:text-slate-100 focus:border-black transition-all outline-none text-black tracking-[0.4em]"
                      placeholder="Pass-Code"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-black transition-colors"
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-black rounded-lg border-slate-100"
                    />
                    <span className="text-[10px] font-black text-slate-300 group-hover:text-black transition-colors uppercase tracking-[0.2em] italic">
                      Remember Session
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      prompt(
                        "Contact Admin to reset password (এডমিনের সাথে যোগাযোগ করুন)",
                      )
                    }
                    className="text-[10px] font-black text-slate-300 hover:text-black transition-colors uppercase tracking-[0.2em] italic"
                  >
                    Lost Access?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full bg-black text-white py-8 rounded-xl font-black uppercase text-sm tracking-[0.5em] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] border-b-[12px] border-zinc-900 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 italic"
                >
                  {loggingIn ? "Connecting Terminal..." : "LOG IN NOW"}
                </button>
              </form>

              <div className="pt-10 flex flex-col gap-6">
                <div className="flex items-center gap-6 opacity-10">
                  <div className="h-px bg-black flex-1"></div>
                  <div className="w-2 h-2 rounded-full bg-black"></div>
                  <div className="h-px bg-black flex-1"></div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const tid = prompt("Enter Tracking ID (আইডি দিন):");
                    if (tid) setTrackingId(tid);
                  }}
                  className="w-full py-6 rounded-xl border-4 border-slate-50 text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] italic hover:border-black hover:text-black transition-all flex items-center justify-center gap-4"
                >
                  <Search size={18} /> PUBLIC ITEM TRACKING
                </button>
              </div>
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex selection:bg-black selection:text-white font-outfit text-black italic overflow-x-hidden relative z-0">
      <GlobalStyles />

      {/* Sidebar */}
      <Sidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        user={user}
        setUser={setUser}
        isOpen={isSidebarOpen}
        t={t}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] min-w-0 print:!m-0 print:!p-0 z-10 ${isSidebarOpen ? "md:ml-[320px] 2xl:ml-[340px]" : "ml-0"}`}
      >
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] animate-fade" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        <div className="p-4 sm:p-5 md:p-6 lg:p-8 xl:p-12 max-w-[1920px] mx-auto w-full">
          {/* Responsive Header */}
          <header className="no-print flex flex-col gap-6 mb-8 lg:mb-12">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-3 glass-bg border border-white/50 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm flex-shrink-0"
                >
                  <Menu size={20} />
                </button>
                <div className="truncate">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] truncate">
                    {t("operationalTerminal")}
                  </p>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase italic tracking-tighter truncate">
                    {activePanel === "Overview"
                      ? t("liveMonitor")
                      : t(activePanel.toLowerCase())}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* SOS Button */}
                <button
                  onClick={() => setShowSOS(true)}
                  className="p-2.5 sm:p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                >
                  <AlertTriangle size={18} />
                </button>

                {/* Global Print Button */}
                <button
                  onClick={() => window.print()}
                  title="Print Current View"
                  className="p-2.5 sm:p-3 bg-black text-white rounded-xl hover:bg-zinc-800 transition-all shadow-sm group"
                >
                  <Printer
                    size={18}
                    className="group-hover:scale-110 transition-transform"
                  />
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 sm:p-3 glass-bg border border-white/50 rounded-xl hover:bg-black/90 hover:text-white transition-all shadow-sm relative"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-[120%] right-0 w-[280px] sm:w-[350px] glass-bg rounded-3xl shadow-2xl border border-white/50 overflow-hidden z-[150] animate-fade-up">
                      <div className="p-4 border-b border-black/5 flex justify-between items-center bg-black/5 text-black">
                        <h3 className="text-xs font-black uppercase tracking-widest ">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-black"
                          >
                            Mark All Read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {(masterData?.notifications || []).length === 0 ? (
                          <div className="p-8 text-center">
                            <Search
                              size={20}
                              className="mx-auto text-slate-400 mb-2"
                            />
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                              No Notifications
                            </p>
                          </div>
                        ) : (
                          (masterData?.notifications || []).map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 border-b border-slate-50 ${n.read ? "opacity-50" : "bg-white"}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4
                                  className={`text-[10px] font-black uppercase tracking-widest ${n.type === "sos" ? "text-rose-500" : "text-black"}`}
                                >
                                  {n.title}
                                </h4>
                                <span className="text-[7px] font-black text-slate-400 uppercase">
                                  {new Date(n.timestamp).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </div>
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Desktop */}
                <div className="hidden sm:flex items-center gap-3 bg-black/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border-b-4 border-black/50 preserve-colors">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                    <User size={14} className="text-white" />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-[9px] font-black uppercase italic tracking-tighter leading-none">
                      {user?.name || ""}
                    </p>
                    <p className="text-[7px] font-black uppercase text-emerald-500 tracking-[0.2em] italic mt-1">
                      {user?.id === "NRZO0NE" || user?.role === "admin"
                        ? "SUPER ADMIN"
                        : t(user?.role) || "CONNECTED"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats/Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/5 pt-6 mt-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-3 glass-bg px-4 py-2.5 rounded-2xl border border-white/50 shadow-sm transition-all hover:bg-white/90">
                  <div
                    className={`p-1.5 rounded-full animate-pulse ${syncStatus === "synced" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : syncStatus === "syncing" ? "bg-amber-500" : "bg-rose-500"}`}
                  ></div>
                  <span className="text-[10px] font-black uppercase italic tracking-widest leading-none text-slate-700">
                    {syncStatus === "synced"
                      ? t("systemsStable")
                      : syncStatus === "syncing"
                        ? "Syncing..."
                        : "Sync Error"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 glass-bg p-1 rounded-2xl border border-white/50 shadow-sm preserve-colors">
                <button
                  onClick={() => setLanguage((l) => (l === "EN" ? "BN" : "EN"))}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl hover:bg-black/10 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                  <Globe size={14} />
                  <span>{language}</span>
                </button>
                <button
                  onClick={() =>
                    setTheme((t) => (t === "light" ? "dark" : "light"))
                  }
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-black/10 transition-all"
                >
                  {theme === "light" ? (
                    <Moon size={16} />
                  ) : (
                    <Sun size={16} className="text-amber-500 drop-shadow-md" />
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Render */}
          <main className="animate-fade-up">{renderPanel()}</main>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-up text-black italic">
          <div className="bg-white rounded-2xl p-8 sm:p-12 w-full max-w-lg border-4 border-slate-50 shadow-2xl relative">
            <button
              onClick={() => setShowSOS(false)}
              className="absolute top-6 right-6 p-3 bg-slate-100 hover:bg-black hover:text-white rounded-xl transition-all"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center rotate-6 shadow-xl">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Emergency SOS
                </h2>
                <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em]">
                  Contact Admin
                </p>
              </div>
            </div>
            <form onSubmit={handleSendSOS}>
              <textarea
                value={sosMessage}
                onChange={(e) => setSosMessage(e.target.value)}
                placeholder="Describe the emergency here... (জরুরী বার্তা লিখুন)"
                className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black uppercase tracking-widest resize-none mb-6 outline-none focus:border-black transition-colors"
                required
              />
              <button
                type="submit"
                className="w-full py-5 bg-rose-500 text-white rounded-full font-black uppercase text-[10px] tracking-[0.4em] hover:bg-black transition-all"
              >
                Send Emergency Message
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
