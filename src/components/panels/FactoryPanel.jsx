import React, { useState, useMemo } from "react";
import { Card, Row, Col, Typography, Divider, QRCode, Tag, ConfigProvider } from 'antd';
const { Title, Text } = Typography;

const QR_Slip_Theme = {
  token: { fontFamily: 'Inter, sans-serif', borderRadius: 8, fontSize: 12, colorTextBase: '#000000' },
  components: { Card: { paddingLG: 16 }, Typography: { fontSizeHeading4: 18, fontSizeHeading5: 14 } }
};

import {
  Scissors,
  Database,
  Plus,
  X,
  Archive,
  DollarSign,
  History,
  Printer,
  CheckCircle,
  Send,
  Minus,
  ArrowLeft,
  AlertCircle,
  User,
  Layers,
  Search,
  Camera,
  Box,
  Trash2,
  Settings,
  ChevronRight,
  Share2,
  MessageCircle
} from "lucide-react";
import QRScanner from "../QRScanner";
import UniversalSlip from "../UniversalSlip";
import { syncToSheet } from "../../utils/syncUtils";
import { sendProductionAlert } from "../../utils/whatsappUtils";
import {
  getStock,
  getSewingStock,
  getFinishingStock,
  getPataStockItem,
} from "../../utils/calculations";
import NRZLogo from "../NRZLogo";

const FactoryPanel = ({
  type: initialType,
  masterData,
  setMasterData,
  showNotify,
  user,
  setActivePanel,
  t,
  logAction
}) => {
  const type = initialType;
  const [view, setView] = useState("active"); // 'active', 'history', 'payments'
  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isWorker = role !== "admin" && role !== "manager";

  const [receiveModal, setReceiveModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [ledgerModal, setLedgerModal] = useState(null);
  const [printSlip, setPrintSlip] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [showAllLots, setShowAllLots] = useState(false);
  const [lotSearch, setLotSearch] = useState("");
  const [showQR, setShowQR] = useState(false);

  const [selection, setSelection] = useState({
    design: "",
    color: "",
    lotNo: "",
    date: new Date().toISOString().split("T")[0],
    pataType: (masterData.pataTypes || ["Single"])[0],
    rate: "",
    worker: "",
    note: "",
  });

  const [issueSizes, setIssueSizes] = useState([
    { size: "", borka: "", hijab: "", pataQty: "" },
  ]);
  const [selectedLot, setSelectedLot] = useState("");

  // Removed redundant isWorker since it's defined above
  const workers = (masterData.workerCategories || {})[type] || [];

  const filteredProductions = (masterData.productions || []).filter((p) => {
    if (p.type !== type) return false;
    
    // STRICT FILTER: Workers ONLY see their own work
    if (isWorker) {
        const userNameNormalized = user?.name?.trim().toLowerCase();
        const workerNameNormalized = p.worker?.trim().toLowerCase();
        if (userNameNormalized !== workerNameNormalized) return false;
    }

    return (
      (p.worker?.toLowerCase() || '').includes(lotSearch.toLowerCase()) ||
      (p.design?.toLowerCase() || '').includes(lotSearch.toLowerCase()) ||
      (p.lotNo?.toLowerCase() || '').includes(lotSearch.toLowerCase())
    );
  });

  const activeProductions = filteredProductions.filter(
    (p) => p.status === "Pending",
  );
  const historyProductions = filteredProductions.filter(
    (p) => p.status === "Received",
  );

  const availableLots = React.useMemo(() => {
    const productions = masterData.productions || [];
    const cutting = masterData.cuttingStock || [];
    const lots = [];

    const allKeys = new Set();
    cutting.forEach((c) => allKeys.add(`${c.design}|${c.color}|${c.lotNo}`));
    productions.forEach((p) =>
      allKeys.add(`${p.design}|${p.color}|${p.lotNo}`),
    );

    allKeys.forEach((key) => {
      const [design, color, lotNo] = key.split("|");
      const designObj = (masterData.designs || []).find((d) => d.name === design);
      if (!designObj) return;

      const stoneRate = Number(designObj.stoneRate || 0);
      const sewingRate = Number(designObj.sewingRate || 0);
      const hasStone = stoneRate > 0;
      const hasSewing = sewingRate > 0;

      const pataBalance = (masterData.pataTypes || ["Single"]).reduce(
        (total, pType) => {
          return total + getPataStockItem(masterData, design, color, pType);
        },
        0,
      );

      const cutItems = cutting.filter(
        (c) => c.design === design && c.color === color && c.lotNo === lotNo,
      );
      const sizesInLot = [
        ...new Set([
          ...cutItems.map((i) => i.size),
          ...productions
            .filter(
              (p) =>
                p.design === design && p.color === color && p.lotNo === lotNo,
            )
            .map((p) => p.size),
        ]),
      ];

      sizesInLot.forEach((size) => {
        const cSize = cutItems.find((i) => i.size === size) || {
          borka: 0,
          hijab: 0,
        };
        const issuedToSewingB = productions
          .filter(
            (p) =>
              p.type === "sewing" &&
              p.design === design &&
              p.color === color &&
              p.lotNo === lotNo &&
              p.size === size,
          )
          .reduce((s, p) => s + (p.issueBorka || 0), 0);
        const issuedToSewingH = productions
          .filter(
            (p) =>
              p.type === "sewing" &&
              p.design === design &&
              p.color === color &&
              p.lotNo === lotNo &&
              p.size === size,
          )
          .reduce((s, p) => s + (p.issueHijab || 0), 0);
        const issuedToStoneB = productions
          .filter(
            (p) =>
              p.type === "stone" &&
              p.design === design &&
              p.color === color &&
              p.lotNo === lotNo &&
              p.size === size,
          )
          .reduce((s, p) => s + (p.issueBorka || 0), 0);
        const issuedToStoneH = productions
          .filter(
            (p) =>
              p.type === "stone" &&
              p.design === design &&
              p.color === color &&
              p.lotNo === lotNo &&
              p.size === size,
          )
          .reduce((s, p) => s + (p.issueHijab || 0), 0);

        let remSewingB = 0,
          remSewingH = 0;
        if (hasSewing) {
          remSewingB = Math.max(0, cSize.borka - issuedToSewingB);
          remSewingH = Math.max(0, cSize.hijab - issuedToSewingH);
        }

        let remStoneB = 0,
          remStoneH = 0;
        let sewingWorkers = [];
        if (hasStone) {
          if (hasSewing) {
            remStoneB = issuedToSewingB - issuedToStoneB;
            remStoneH = issuedToSewingH - issuedToStoneH;
            const pendingS = productions.filter(
              (p) =>
                p.type === "sewing" &&
                p.status === "Pending" &&
                p.design === design &&
                p.color === color &&
                p.lotNo === lotNo &&
                p.size === size,
            );
            sewingWorkers = [...new Set(pendingS.map((p) => p.worker))];
          } else {
            remStoneB = Math.max(0, cSize.borka - issuedToStoneB);
            remStoneH = Math.max(0, cSize.hijab - issuedToStoneH);
          }
        }

        const curRB = type === "stone" ? remStoneB : remSewingB;
        const curRH = type === "stone" ? remStoneH : remSewingH;
        const isRelevant =
          (type === "stone" && hasStone) || (type === "sewing" && hasSewing);

        if (
          isRelevant &&
          (curRB > 0 || curRH > 0 || (isAdmin && showAllLots))
        ) {
          const existing = lots.find(
            (l) =>
              l.lotNo === lotNo && l.design === design && l.color === color,
          );
          const pl = {
            remB: curRB,
            remH: curRH,
            raw: { remStoneB, remStoneH, remSewingB, remSewingH },
            sewingWorkers,
          };
          if (existing) {
            existing.sizes[size] = pl;
            existing.totalAvailable += curRB + curRH;
            existing.pataStock = pataBalance;
          } else {
            lots.push({
              lotNo,
              design,
              color,
              hasStoneRate: hasStone,
              hasSewingRate: hasSewing,
              totalAvailable: curRB + curRH,
              pataStock: pataBalance,
              sizes: { [size]: pl },
              sewingWorkers,
            });
          }
        }
      });
    });

    if (isAdmin && showAllLots) {
      (masterData.designs || []).forEach((d) => {
        const colors = masterData.colors || [];
        colors.forEach((c) => {
          const exists = lots.find((l) => l.design === d.name && l.color === c);
          if (!exists) {
            lots.push({
              lotNo: "ADMIN",
              design: d.name,
              color: c,
              totalAvailable: 198,
              hasStoneRate: d.stoneRate > 0,
              hasSewingRate: d.sewingRate > 0,
              sizes: (masterData.sizes || []).reduce(
                (acc, s) => ({
                  ...acc,
                  [s]: {
                    remB: 99,
                    remH: 99,
                    raw: {
                      remStoneB: 99,
                      remStoneH: 99,
                      remSewingB: 99,
                      remSewingH: 99,
                    },
                  },
                }),
                {},
              ),
            });
          }
        });
      });
    }
    return lots;
  }, [masterData, type, showAllLots, isAdmin]);

  const handleLotSelect = (lotKey) => {
    setSelectedLot(lotKey);
    if (!lotKey) return;
    const [design, color, lotNo] = lotKey.split("|");
    const lot = availableLots.find(
      (l) => l.lotNo === lotNo && l.design === design && l.color === color,
    );
    if (lot) {
      const d = (masterData.designs || []).find((x) => x.name === lot.design);
      const defaultRate =
        type === "sewing" ? d?.sewingRate || 0 : d?.stoneRate || 0;
      setSelection((p) => ({
        ...p,
        design: lot.design,
        color: lot.color,
        lotNo: lot.lotNo,
        rate:
          p.worker && (masterData.workerWages || {})[type]?.[p.worker] > 0
            ? masterData.workerWages[type][p.worker]
            : defaultRate,
      }));
      const lotSizes = Object.keys(lot.sizes)
        .map((s) => ({
          size: s,
          borka: lot.sizes[s].remB,
          hijab: lot.sizes[s].remH,
          maxBorka: lot.sizes[s].remB,
          maxHijab: lot.sizes[s].remH,
          pataQty: "",
        }))
        .filter((s) => s.borka > 0 || s.hijab > 0);
      setIssueSizes(lotSizes);
    }
  };

  const handleIssue = (e) => {
    e.preventDefault();
    const { design, color, pataType, worker, rate, date, lotNo } = selection;
    if (!worker || !lotNo)
      return showNotify("কারিগর ও লট সিলেক্ট করুন!", "error");
    const validIssues = issueSizes.filter(
      (s) => s.size && (Number(s.borka || 0) > 0 || Number(s.hijab || 0) > 0),
    );
    if (validIssues.length === 0)
      return showNotify("অন্তত একটি সংখ্যা দিন!", "error");

    const newEntries = validIssues.map((s) => ({
      id: `prod_${Date.now()}_${Math.random()}`,
      date: new Date(date).toLocaleDateString("en-GB"),
      type: type,
      worker,
      design,
      color,
      lotNo,
      size: s.size,
      issueBorka: Number(s.borka || 0),
      issueHijab: Number(s.hijab || 0),
      pataType: type === "stone" ? pataType : null,
      pataQty: type === "stone" ? Number(s.pataQty || 0) : 0,
      status: "Pending",
      receivedBorka: 0,
      receivedHijab: 0,
      rate: Number(rate || 0),
      note: selection.note,
    }));

    setMasterData((prev) => ({
      ...prev,
      productions: [...newEntries, ...(prev.productions || [])],
      notifications: [
        {
          id: Date.now().toString(),
          type: "task",
          title: "নতুন কাজ অ্যাসাইন",
          message: `${worker}-কে ${design} ডিজাইনের কাজ দেওয়া হয়েছে।`,
          timestamp: new Date().toISOString(),
          read: false,
          target: "worker",
        },
        ...(prev.notifications || []),
      ],
    }));

    // Audit Log Integration
    logAction(
      user,
      `${type.toUpperCase()}_ISSUE`,
      `${worker} assigned ${design} (${color}) Lot #${lotNo}. Items: ${validIssues.length}`
    );

    newEntries.forEach((entry) =>
      syncToSheet({
        type: `${type.toUpperCase()}_ISSUE`,
        worker: entry.worker,
        detail: `${entry.design}(${entry.color}) - ${entry.size} - B:${entry.issueBorka} H:${entry.issueHijab}`,
        amount: 0,
      }),
    );
    setIssueSizes([{ size: "", borka: "", hijab: "", pataQty: "" }]);
    setShowIssueModal(false);
    showNotify(`${worker}-কে কাজ দেওয়া হয়েছে!`);
    if (e.nativeEvent.submitter?.name === "print") setPrintSlip(newEntries[0]);
  };

  const handleConfirmReceive = (e) => {
    e.preventDefault();
    const rBorka = Number(e.target.rBorka.value || 0);
    const rHijab = Number(e.target.rHijab.value || 0);
    const wasteMaterial = Number(e.target.wasteMaterial?.value || 0);
    
    if (rBorka > receiveModal.issueBorka || rHijab > receiveModal.issueHijab)
      return showNotify("ইস্যুর চেয়ে বেশি জমা সম্ভব নয়!", "error");

    const totalWasted = (receiveModal.issueBorka - rBorka) + (receiveModal.issueHijab - rHijab);
    const totalIssued = receiveModal.issueBorka + receiveModal.issueHijab;
    const wastePercent = totalIssued > 0 ? (totalWasted / totalIssued) * 100 : 0;

    if (wastePercent > 10) {
      if (!window.confirm(`⚠️ সতর্কতা: এই লটে ${wastePercent.toFixed(1)}% কাটিং ওয়েস্টেজ দেখা যাচ্ছে। আপনি কি নিশ্চিত যে এই হিসাবটি সঠিক?`)) {
        return;
      }
    }

    setMasterData((prev) => ({
      ...prev,
      productions: (prev.productions || []).map((p) =>
        p.id === receiveModal.id
          ? {
            ...p,
            status: "Received",
            receivedBorka: rBorka,
            receivedHijab: rHijab,
            wasteMaterial: wasteMaterial, // New Field
            wasteBorka: Math.max(0, p.issueBorka - rBorka),
            wasteHijab: Math.max(0, p.issueHijab - rHijab),
            receiveDate: e.target.receiveDate?.value
              ? new Date(e.target.receiveDate.value).toLocaleDateString(
                "en-GB",
              )
              : new Date().toLocaleDateString("en-GB"),
          }
          : p,
      ),
    }));

    syncToSheet({
      type: `${receiveModal.type.toUpperCase()}_RECEIVE`,
      worker: receiveModal.worker,
      detail: `${receiveModal.design}: Rec B:${rBorka} H:${rHijab}`,
      amount: 0,
    });
    
    // Audit Log Integration
    logAction(
      user,
      `${receiveModal.type.toUpperCase()}_RECEIVE`,
      `Received from ${receiveModal.worker}: Lot #${receiveModal.lotNo} - B:${rBorka} H:${rHijab}`
    );

    setReceiveModal(null);
    showNotify("হিসাব জমা নেওয়া হয়েছে!");

    // Automated Production Alert
    const designData = masterData.designs?.find(d => d.name === receiveModal.design);
    const workerDoc = masterData.workerDocs?.find(d => d.name.toUpperCase() === receiveModal.worker.toUpperCase() && d.dept === type);
    const phone = workerDoc?.phone;
    
    if (phone) {
      let totalBill = 0;
      if (receiveModal.type === 'sewing') {
          const bRate = designData?.sewingRate || 0;
          const hRate = designData?.hijabRate || bRate;
          totalBill = (rBorka * bRate) + (rHijab * hRate);
      } else {
          const rate = designData?.stoneRate || 0;
          totalBill = (rBorka + rHijab) * rate;
      }
      
      if (totalBill > 0 && window.confirm("গাড়ি চালকের (কারিগর) হোয়াটসঅ্যাপে পেমেন্ট কনফার্মেশন পাঠাবেন?")) {
        sendProductionAlert(receiveModal.worker, rBorka + rHijab, totalBill, phone);
      }
    }
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    const amount = Number(e.target.amount.value);
    if (amount <= 0) return;
    const newPayment = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB"),
      worker: payModal,
      dept: type,
      amount,
      note: e.target.note.value,
    };
    setMasterData((prev) => ({
      ...prev,
      workerPayments: [newPayment, ...(prev.workerPayments || [])],
      expenses: [
        {
          id: Date.now() + 1,
          date: new Date().toISOString().split("T")[0],
          category: "ভাতা",
          description: `${payModal} (${type})`,
          amount,
        },
        ...(prev.expenses || []),
      ],
    }));
    setPayModal(null);
    showNotify("পেমেন্ট সফল হয়েছে!");

    // Automated Payment Receipt (Interaction)
    const workerDoc = masterData.workerDocs?.find(d => d.name.toUpperCase() === payModal.toUpperCase() && d.dept === type);
    if (workerDoc?.phone && window.confirm("হোয়াটসঅ্যাপে পেমেন্ট রিসিপ্ট পাঠাতে চান?")) {
        import('../../utils/whatsappUtils').then(wa => {
            wa.sendInteractionReceipt(payModal, "পেমেন্ট/ভাতা", amount, workerDoc.phone);
        });
    }
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    const f = e.target;
    const updated = {
      ...editModal,
      worker: f.worker.value,
      design: f.design.value,
      color: f.color.value,
      lotNo: f.lotNo.value,
      status: f.status.value,
      date: f.date.value,
      issueBorka: Number(f.iBorka.value),
      issueHijab: Number(f.iHijab.value),
      receivedBorka: Number(f.rBorka.value),
      receivedHijab: Number(f.rHijab.value),
      rate: Number(f.rate.value),
      note: f.note.value,
    };
    
    setMasterData(prev => ({
      ...prev,
      productions: (prev.productions || []).map(p => p.id === updated.id ? updated : p)
    }));
    setEditModal(null);
    showNotify("উৎপাদন তথ্য আপডেট করা হয়েছে!");
  };

  const getWorkerDue = (name) => {
    const earnings = (masterData.productions || [])
      .filter(
        (p) => p.worker === name && p.status === "Received" && p.type === type,
      )
      .reduce(
        (s, p) =>
          s +
          (Number(p.receivedBorka || 0) + Number(p.receivedHijab || 0)) *
          Number(p.rate || 0),
        0,
      );
    const paid = (masterData.workerPayments || [])
      .filter((p) => p.worker === name && p.dept === type)
      .reduce((s, p) => s + Number(p.amount), 0);
    return earnings - paid;
  };

  if (printSlip) {
    return (
      <div className="min-h-screen bg-white text-black italic font-outfit py-10 print:py-0 print:bg-white overflow-hidden">
        <style>{`
          @media print { 
              .no-print { display: none !important; } 
              body { background: white !important; margin: 0; padding: 0; }
              @page { size: A4 portrait; margin: 0; }
          }
        `}</style>
        <div className="no-print flex justify-between items-center mb-6 w-[210mm] mx-auto bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-black font-black">
          <button onClick={() => setPrintSlip(null)} className="bg-slate-50 text-slate-600 px-10 py-5 uppercase text-xs rounded-full hover:bg-black hover:text-white transition-all">Cancel</button>
          <button onClick={() => window.print()} className="bg-black text-white px-10 py-5 rounded-full uppercase text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
            <Printer size={18} /> Print Job
          </button>
        </div>
        
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white border border-gray-100 overflow-hidden relative">
          <UniversalSlip data={printSlip} type="ISSUE" copyTitle="WORKER COPY" />
          <div className="h-4 w-full border-t-2 border-dashed border-slate-300"></div>
          <UniversalSlip data={printSlip} type="ISSUE" copyTitle="FACTORY COPY" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 italic text-black font-outfit uppercase">
      {/* QR Scanner Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4">
             <div className="bg-white rounded-[4rem] p-12 w-full max-w-sm relative">
                  <button onClick={() => setShowQR(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-black hover:text-white transition-all">
                      <X size={24} />
                  </button>
                  <h3 className="text-2xl font-black italic mb-8 text-center">{type === 'sewing' ? 'সেলাই' : 'স্টোন'} স্লিপ স্ক্যান</h3>
                  <div className="rounded-[3rem] overflow-hidden border-4 border-black">
                      <QRScanner onScan={(data) => {
                          if (data) {
                              setLotSearch(data);
                              handleLotSelect(data); 
                              setShowQR(false);
                              showNotify("লট স্ক্যান করা হয়েছে!");
                          }
                      }} />
                  </div>
                  <p className="text-[10px] font-black text-center mt-8 text-slate-400 italic">লট স্লিপের QR কোডটি সামনে ধরুন</p>
             </div>
        </div>
      )}

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
              {type === "sewing" ? 'সেলাই' : 'স্টোন'} <span className="text-slate-500">ইউনিট প্রোডাকশন</span>
            </h1>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
               সিস্টেম সচল V4.2 — {type === 'sewing' ? 'SEWING' : 'STONE'} DIVISION
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          {!isWorker && (
            <button
              onClick={() => setShowIssueModal(true)}
              className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all italic border-b-[6px] border-zinc-900"
            >
              <Plus size={20} strokeWidth={3} />
              নতুন কাজ প্রদান (ISSUE)
            </button>
          )}
        </div>
      </div>
      {/* Unified Floating Filter Bar */}
      <div className="floating-header-group mb-12 p-3 dark:bg-zinc-900 border-none shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-6 w-full">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/50 p-2 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                  {["active", "history", (isAdmin || isManager) && "payments"].filter(Boolean).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === v ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg italic' : 'text-slate-500 hover:text-black dark:hover:text-white'}`}
                    >
                      {v === 'active' ? 'চলমান প্রজেক্ট' : v === 'history' ? 'পুরাতন হিসেব' : 'পেমেন্ট ও লেজার'}
                    </button>
                  ))}
              </div>
              
              <div className="flex-1 relative w-full group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                      <Search size={16} />
                  </div>
                  <input
                      placeholder="লট, ডিজাইন বা কারিগর দিয়ে খুঁজুন..."
                      className="w-full bg-slate-50 dark:bg-black/20 h-16 rounded-2xl pl-16 pr-8 text-xs font-black uppercase tracking-widest italic outline-none border border-transparent focus:border-black/10 dark:focus:border-white/10 transition-all text-black dark:text-white"
                      value={lotSearch}
                      onChange={(e) => setLotSearch(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button 
                        onClick={() => setShowQR(true)}
                        className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                        title="Scan QR Code"
                      >
                         <Camera size={16} />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {view === "active" && (
        <div className="space-y-4">

          {activeProductions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-70">
              <Box size={48} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Active Nodes</p>
            </div>
          ) : (
            activeProductions.map((p, idx) => (
              <div
                key={p.id || idx}
                className="item-card flex flex-col md:flex-row justify-between items-center gap-8 group"
              >
                <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                  <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                    {p.size}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                        • {p.pataType ? `পাতা ${p.pataType.toUpperCase()} ` : ""}{p.type.toUpperCase()} # {p.worker}
                        {masterData.workerDocs?.find(d => d.name.toUpperCase() === p.worker?.toUpperCase() && d.dept === type)?.workerId && (
                           <span className="ml-3 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full shadow-sm relative -top-1">ID: {masterData.workerDocs?.find(d => d.name.toUpperCase() === p.worker?.toUpperCase() && d.dept === type)?.workerId}</span>
                        )}
                      </h4>
                      <span className="badge-standard">#{p.lotNo}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-[11px] font-black uppercase italic tracking-widest">
                      <span>• {p.design}</span>
                      <span>• {p.date}</span>
                      {p.pataQty > 0 && <span className="text-black">PATA: {p.pataQty}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-12 w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0">
                  <div className="flex gap-12">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.issueBorka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Hijab</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.issueHijab}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {!isWorker && (
                      <button
                        onClick={() => setReceiveModal(p)}
                        className="black-button"
                      >
                        {t('received')} (REC)
                      </button>
                    )}
                    <button
                      onClick={() => setPrintSlip(p)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-black hover:text-white transition-all"
                    >
                      <Printer size={18} />
                    </button>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditModal(p)}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("আপনি কি নিশ্চিত যে এটি ডিলিট করতে চান?")) {
                              setMasterData(prev => ({ ...prev, productions: (prev.productions || []).filter(prod => prod.id !== p.id) }));
                            }
                          }}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "history" && (
        <div className="space-y-4">
          {historyProductions.length === 0 ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-30 italic font-black uppercase tracking-widest">
              Archive Zero
            </div>
          ) : (
            historyProductions.map((p, idx) => (
              <div
                key={p.id || idx}
                className="item-card flex flex-col md:flex-row justify-between items-center gap-8 group"
              >
                <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                  <div className="w-14 h-14 bg-black text-white flex items-center justify-center text-3xl font-black italic rounded-xl shadow-xl transform group-hover:rotate-6 transition-all">
                    {p.size}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                      <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                        • {p.design} # {p.worker}
                      </h4>
                      <span className="badge-standard">#{p.lotNo}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-[11px] font-black uppercase italic tracking-widest">
                      <span>• {p.date}</span>
                      <span className="text-emerald-500 font-black">• DONE {p.receiveDate}</span>
                      {(p.wasteBorka > 0 || p.wasteHijab > 0) && (
                        <span className="text-rose-500 font-black tracking-widest border-l border-slate-100 pl-4 ml-2">
                          {(p.wasteBorka || 0) + (p.wasteHijab || 0)} WASTED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-12 text-center w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0">
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Borka</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.receivedBorka || 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Hijab</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.receivedHijab || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Wage</p>
                      <p className="text-3xl font-black text-emerald-500 italic">৳{p.rate}</p>
                    </div>
                    <button
                      onClick={() => setPrintSlip(p)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                      <Printer size={18} />
                    </button>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditModal(p)}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('মুছে ফেলবেন?')) {
                              setMasterData(prev => ({
                                ...prev,
                                productions: (prev.productions || []).filter(x => x.id !== p.id)
                              }));
                            }
                          }}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "payments" && (
        <div className="space-y-6">
          {workers.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 uppercase font-black italic gap-6">
              <User size={60} strokeWidth={1} />
              <p>No Factory Personnel Registered</p>
            </div>
          ) : (
            workers.map((w) => {
              const due = getWorkerDue(w);
              return (
                <div
                  key={w}
                  className="item-card flex flex-col md:flex-row justify-between items-center gap-10 group"
                >
                  <div className="flex items-center gap-8 flex-1">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <User size={30} />
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter flex items-center gap-3">
                        {w}
                        {masterData.workerDocs?.find(d => d.name.toUpperCase() === w.toUpperCase() && d.dept === type)?.workerId && (
                           <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full shadow-sm">ID: {masterData.workerDocs?.find(d => d.name.toUpperCase() === w.toUpperCase() && d.dept === type)?.workerId}</span>
                        )}
                      </h4>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">
                        SENIOR {type.toUpperCase()} OPERATIVE
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-16 text-center">
                    <div className="bg-emerald-50/50 px-10 py-6 rounded-3xl border border-emerald-50">
                      <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">
                        Pending Balance
                      </p>
                      <p className="text-xl md:text-2xl font-black italic text-emerald-600">
                        ৳{due.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button
                      onClick={() => setPayModal(w)}
                      className="flex-1 md:flex-none px-6 py-3 bg-black text-white rounded-full font-black uppercase text-xs tracking-widest shadow-2xl border-b-8 border-zinc-900 hover:scale-105 active:scale-95 transition-all"
                    >
                      DISBURSE PAY
                    </button>
                    <button
                      onClick={() => setLedgerModal(w)}
                      className="p-6 bg-white border-4 border-slate-50 text-slate-500 rounded-full hover:border-black hover:text-black transition-all"
                    >
                      <DollarSign size={24} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[250] flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl my-auto rounded-3xl border-2 border-black shadow-3xl p-6 md:p-16 space-y-12 animate-fade-up text-black italic relative font-outfit uppercase">
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute top-8 right-8 p-4 bg-slate-50 hover:bg-black hover:text-white rounded-full transition-all z-10 border border-slate-100 shadow-sm"
            >
              <X size={24} />
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl">
                <Plus size={32} strokeWidth={3} />
              </div>
              <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">
                <span className="text-black">Job</span> <span className="text-transparent" style={{ WebkitTextStroke: "1px #cbd5e1" }}>Assignment</span>
              </h3>
              <p className="inline-block px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest italic">
                {type.toUpperCase()} UNIT MODE
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <span className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${!showAllLots ? "text-black" : "text-slate-500"}`}>Normal Pipeline</span>
              <button
                type="button"
                onClick={() => setShowAllLots(!showAllLots)}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${showAllLots ? "bg-rose-500" : "bg-emerald-500"}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${showAllLots ? "translate-x-6" : ""}`}></div>
              </button>
              <span className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${showAllLots ? "text-rose-500" : "text-slate-500"}`}>{t('adminPower')}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
              <div className="lg:col-span-6 space-y-8">
                
                {/* Lot Selection Box */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 relative group transition-all hover:border-black">
                  <div className="flex items-center gap-3 mb-4">
                    <Search size={18} className="text-slate-500" />
                    <label className="text-xs font-black text-black uppercase tracking-widest">
                      Select Available Lot <span className="text-slate-500 text-[10px] ml-1">(লট পছন্দ করুন)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      className="w-full bg-white px-6 py-4 border-2 border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:border-black transition-all appearance-none cursor-pointer"
                      value={selectedLot}
                      onChange={(e) => handleLotSelect(e.target.value)}
                    >
                      <option value="">-- LOT NO / DESIGN... --</option>
                      {availableLots.map((l) => (
                        <option
                          key={`${l.design}|${l.color}|${l.lotNo}`}
                          value={`${l.design}|${l.color}|${l.lotNo}`}
                        >
                          {l.design} | {l.color} | #{l.lotNo} ({l.totalAvailable} Pcs)
                        </option>
                      ))}
                    </select>
                    <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                  {availableLots.length === 0 && (
                    <div className="mt-4 p-4 bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-500">
                       <Box size={16} /> <span className="text-[10px] font-black tracking-widest uppercase">No Matching Lots Found</span>
                    </div>
                  )}
                </div>

                <div className="bg-white space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-widest mb-3">
                      <User size={16} className="text-slate-500" /> Select Worker <span className="text-slate-500 text-[10px]">(কারিগর নির্বাচন করুন)</span>
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-black text-white px-6 py-4 rounded-2xl font-black text-sm uppercase outline-none appearance-none cursor-pointer"
                        value={selection.worker}
                        onChange={(e) => {
                          const w = e.target.value;
                          setSelection((p) => ({
                            ...p,
                            worker: w,
                            rate: (masterData.workerWages || {})[type]?.[w] || p.rate
                          }));
                        }}
                      >
                        <option value="">কারিগর সিলেক্ট করুন (Select Worker)</option>
                        {workers.map((w) => {
                          const doc = masterData.workerDocs?.find(d => d.name.toUpperCase() === w.toUpperCase() && d.dept === type);
                          return (
                            <option key={w} value={w}>
                              {w} {doc?.workerId ? `(ID: ${doc.workerId})` : ""}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 shrink-0 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rate (রেট)</p>
                      <div className="flex items-center gap-1 font-black text-emerald-600 text-2xl">
                         ৳
                         <input
                           type="number"
                           className="w-full bg-transparent outline-none p-0"
                           value={selection.rate}
                           placeholder="0"
                           onChange={(e) => setSelection(p => ({ ...p, rate: e.target.value }))}
                         />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 shrink-0 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date (তারিখ)</p>
                      <input 
                        type="date"
                        className="w-full bg-transparent text-sm font-black text-black outline-none p-0"
                        value={selection.date}
                        onChange={(e) => setSelection(p => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                    <div className="bg-slate-50 p-4 shrink-0 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Design</p>
                      <p className="text-sm font-black truncate">{selection.design || "---"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 shrink-0 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Color</p>
                      <p className="text-sm font-black truncate">{selection.color || "---"}</p>
                    </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Optional Note (ঐচ্ছিক)</label>
                     <input
                       type="text"
                       className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl font-bold text-sm italic outline-none focus:border-black transition-all placeholder:text-slate-500"
                       placeholder="Type Remarks..."
                       value={selection.note || ""}
                       onChange={(e) => setSelection(p => ({ ...p, note: e.target.value }))}
                     />
                  </div>

                  {type === "stone" && (
                    <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Pata Stock Control</label>
                        <span className="px-4 py-1.5 bg-white border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 shadow-sm animate-pulse">
                          LIVE STOCK: {getPataStockItem(masterData, selection.design, selection.color, selection.pataType) || 0} PCS
                        </span>
                      </div>
                      <div className="relative">
                        <select
                          className="w-full bg-white border-2 border-indigo-100 px-6 py-4 rounded-2xl font-black text-sm uppercase outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                          value={selection.pataType}
                          onChange={(e) => setSelection(p => ({ ...p, pataType: e.target.value }))}
                        >
                          {(masterData.pataTypes || ["Single", "Double", "Standard"]).map(pt => (
                            <option key={pt} value={pt}>{pt} PATA MODULE</option>
                          ))}
                        </select>
                        <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="lg:col-span-6">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <Layers size={18} className="text-slate-500" />
                    <label className="text-xs font-black text-black uppercase tracking-widest">
                       {t('qty')} & {t('category')}
                    </label>
                  </div>

                  <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {issueSizes.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-slate-500 uppercase font-black italic tracking-widest text-[10px]">
                        লট সিলেক্ট করুন (Select Lot)
                      </div>
                    ) : (
                      issueSizes.map((row, idx) => {
                           const lotDetails = availableLots.find(l => l.lotNo === selection.lotNo && l.design === selection.design && l.color === selection.color);
                           const maxBorka = lotDetails?.sizes?.[row.size]?.remB || 0;
                           const maxHijab = lotDetails?.sizes?.[row.size]?.remH || 0;
                           return (
                             <div key={idx} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-black transition-all">
                               <div className="flex items-center gap-2">
                                   <select
                                     className="px-4 py-2 bg-black text-white rounded-lg text-sm font-black outline-none appearance-none"
                                     value={row.size}
                                     onChange={(e) => {
                                       const n = [...issueSizes];
                                       n[idx].size = e.target.value;
                                       setIssueSizes(n);
                                     }}
                                   >
                                     <option value="">{t('category')}</option>
                                     {(masterData.sizes || []).map(s => <option key={s} value={s}>{s}</option>)}
                                   </select>
                                   {issueSizes.length > 1 && (
                                     <button
                                       type="button"
                                       onClick={() => setIssueSizes(issueSizes.filter((_, i) => i !== idx))}
                                       className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                   )}
                                </div>
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center">
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <div className="flex justify-between items-center mb-1">
                                         <p className="text-[9px] font-black uppercase text-slate-500">Borka Qty</p>
                                         <span className="text-[8px] font-bold text-slate-500">Max: {maxBorka}</span>
                                      </div>
                                      <input
                                        type="number"
                                        className="w-full bg-transparent text-xl font-black text-black outline-none p-0"
                                        placeholder="0"
                                        value={row.borka}
                                        onChange={(e) => {
                                          const n = [...issueSizes];
                                          n[idx].borka = e.target.value;
                                          setIssueSizes(n);
                                        }}
                                      />
                                  </div>
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <div className="flex justify-between items-center mb-1">
                                         <p className="text-[9px] font-black uppercase text-slate-500">Hijab Qty</p>
                                         <span className="text-[8px] font-bold text-slate-500">Max: {maxHijab}</span>
                                      </div>
                                      <input
                                        type="number"
                                        className="w-full bg-transparent text-xl font-black text-slate-500 outline-none p-0"
                                        placeholder="0"
                                        value={row.hijab}
                                        onChange={(e) => {
                                          const n = [...issueSizes];
                                          n[idx].hijab = e.target.value;
                                          setIssueSizes(n);
                                        }}
                                      />
                                  </div>
                                  {type === "stone" && (
                                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 relative group">
                                        <div className="flex justify-between items-center mb-1">
                                           <p className="text-[9px] font-black uppercase text-indigo-400">Pata (পাতা) Qty</p>
                                           <div className="flex flex-col items-end">
                                              {(() => {
                                                  const stock = getPataStockItem(masterData, selection.design, selection.color, selection.pataType);
                                                  return (
                                                    <>
                                                      <p className={`text-[7px] font-black uppercase tracking-widest ${stock < 10 ? 'text-rose-500 animate-pulse' : 'text-indigo-300'}`}>{stock < 10 ? 'ALERT: LOW' : 'Live Stock'}</p>
                                                      <p className={`text-[10px] font-black ${stock < 10 ? 'text-rose-500' : 'text-black'}`}>
                                                          {stock} <span className="text-[8px] text-slate-500">Pcs</span>
                                                      </p>
                                                    </>
                                                  );
                                              })()}
                                           </div>
                                        </div>
                                        <input
                                          type="number"
                                          className="w-full bg-transparent text-xl font-black text-indigo-600 outline-none p-0 placeholder:text-indigo-200"
                                          placeholder="0"
                                          value={row.pataQty}
                                          onChange={(e) => {
                                            const n = [...issueSizes];
                                            n[idx].pataQty = e.target.value;
                                            setIssueSizes(n);
                                          }}
                                        />
                                    </div>
                                  )}
                               </div>
                             </div>
                           );
                      }))}
                     <button
                       type="button"
                       onClick={() => setIssueSizes([...issueSizes, { size: "", borka: "", hijab: "", pataQty: "" }])}
                       className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:border-black hover:text-black transition-all text-[10px] font-black uppercase tracking-widest mt-4"
                     >
                       <Plus size={14} /> Add Another Size
                     </button>
                  </div>
                  
                  {/* Selection Summary Counter */}
                  {issueSizes.some(s => Number(s.borka || 0) > 0 || Number(s.hijab || 0) > 0) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center px-4">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Selected Volume</p>
                        <div className="flex gap-6 items-baseline text-black">
                           <div className="flex items-baseline gap-1">
                               <span className="text-[10px] text-slate-500">BORKA:</span>
                               <span className="text-xl font-black italic">{issueSizes.reduce((s, r) => s + Number(r.borka || 0), 0)}</span>
                           </div>
                           <div className="flex items-baseline gap-1">
                               <span className="text-[10px] text-slate-500">HIJAB:</span>
                               <span className="text-xl font-black italic">{issueSizes.reduce((s, r) => s + Number(r.hijab || 0), 0)}</span>
                           </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="py-4 md:py-6 px-8 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all font-outfit"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                name="print"
                onClick={handleIssue}
                className="py-4 md:py-6 px-10 rounded-full bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 font-outfit"
              >
                <Printer size={18} /> {t('printNote')}
              </button>
              <button
                type="submit"
                onClick={handleIssue}
                className="flex-[2] py-4 md:py-6 rounded-full bg-emerald-600 text-white font-black uppercase text-sm tracking-[0.2em] shadow-emerald-600/30 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-3 font-outfit"
              >
                {t('issueWork')} <span className="text-[10px] hidden md:inline">(নিশ্চিত করুন)</span> <CheckCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {receiveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl md:rounded-[4.5rem] border-4 border-slate-50 shadow-3xl p-5 md:p-6 space-y-10 animate-fade-up text-black italic">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                {t('receive')}
              </h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {receiveModal.worker} • {receiveModal.design}
              </p>
            </div>
            <form
              onSubmit={handleConfirmReceive}
              className="space-y-10 uppercase italic"
            >
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-inner">
                <div className="text-center">
                  <label className="text-[8px] font-black text-slate-500 uppercase mb-3 block">
                    Rec Borka
                  </label>
                  <input
                    name="rBorka"
                    type="number"
                    defaultValue={receiveModal.issueBorka}
                    className="w-full text-center text-2xl font-black bg-transparent border-none outline-none leading-none h-16"
                    autoFocus
                  />
                </div>
                <div className="text-center">
                  <label className="text-[8px] font-black text-slate-500 uppercase mb-3 block">
                    Rec Hijab
                  </label>
                  <input
                    name="rHijab"
                    type="number"
                    defaultValue={receiveModal.issueHijab}
                    className="w-full text-center text-2xl font-black bg-transparent border-none outline-none leading-none h-16"
                  />
                </div>
              </div>
              <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                <label className="text-[9px] font-black text-rose-400 uppercase mb-2 block tracking-widest text-center">Batch Waste (কাপড়/পাথর অপচয়)</label>
                <input
                  name="wasteMaterial"
                  type="number"
                  placeholder="Material Waste Pcs/Grams..."
                  className="w-full text-center text-xl font-black bg-transparent outline-none border-b-2 border-rose-100 focus:border-rose-300 transition-all uppercase italic"
                />
              </div>
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setReceiveModal(null)}
                  className="py-5 bg-slate-50 text-slate-500 rounded-full font-black uppercase text-[10px] tracking-widest hover:text-black transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="py-6 bg-black text-white rounded-full font-black uppercase text-xs tracking-widest shadow-2xl border-b-8 border-zinc-900 transition-all hover:scale-105 active:scale-95"
                >
                  {t('confirmOnly')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-start md:items-center justify-center p-2 md:p-4 text-black italic">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl border-2 border-amber-500 shadow-3xl p-6 md:p-10 space-y-8 animate-fade-up max-h-[96vh] overflow-y-auto italic font-outfit my-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-500 text-white rounded-[1.2rem] shadow-xl rotate-3">
                  <Settings size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{t('designOverride')}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Industrial Data Correction</p>
                </div>
              </div>
              <button onClick={() => setEditModal(null)} className="p-4 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleEditSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-black uppercase italic">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Worker (কারিগর)</label>
                <select name="worker" defaultValue={editModal.worker} className="form-input italic" required>
                  {workers.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Design (ডিজাইন)</label>
                <select name="design" defaultValue={editModal.design} className="form-input italic" required>
                  {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Color & Lot</label>
                <div className="grid grid-cols-2 gap-4">
                  <select name="color" defaultValue={editModal.color} className="form-input italic" required>
                    {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input name="lotNo" defaultValue={editModal.lotNo} className="form-input italic" placeholder="LOT..." required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Status & Date</label>
                <div className="grid grid-cols-2 gap-4">
                  <select name="status" defaultValue={editModal.status} className="form-input bg-black text-white italic" required>
                    <option value="Pending">PENDING</option>
                    <option value="Received">RECEIVED</option>
                  </select>
                  <input name="date" type="date" defaultValue={editModal.date} className="form-input italic" required />
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-500 text-center uppercase tracking-widest">Issue (দেওয়া কাজ)</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] text-slate-500 text-center block mb-1">Borka</label>
                        <input name="iBorka" type="number" defaultValue={editModal.issueBorka} className="w-full text-center text-3xl bg-white border border-slate-100 rounded-xl py-3 outline-none font-black italic focus:border-black transition-all" />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-500 text-center block mb-1">Hijab</label>
                        <input name="iHijab" type="number" defaultValue={editModal.issueHijab} className="w-full text-center text-3xl bg-white border border-slate-100 rounded-xl py-3 outline-none font-black italic focus:border-black transition-all" />
                      </div>
                   </div>
                </div>
                <div className="space-y-4 border-l border-slate-200 pl-8">
                   <p className="text-[10px] font-black text-emerald-500 text-center uppercase tracking-widest">Received (জমা কাজ)</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] text-emerald-400 text-center block mb-1">Borka</label>
                        <input name="rBorka" type="number" defaultValue={editModal.receivedBorka} className="w-full text-center text-3xl bg-emerald-50/50 border border-emerald-100 rounded-xl py-3 outline-none font-black italic focus:border-emerald-500 transition-all" />
                      </div>
                      <div>
                        <label className="text-[8px] text-emerald-400 text-center block mb-1">Hijab</label>
                        <input name="rHijab" type="number" defaultValue={editModal.receivedHijab} className="w-full text-center text-3xl bg-emerald-50/50 border border-emerald-100 rounded-xl py-3 outline-none font-black italic focus:border-emerald-500 transition-all" />
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-1 md:col-span-1">
                <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Wage Rate (মজুরি)</label>
                <input name="rate" type="number" defaultValue={editModal.rate} className="form-input text-2xl font-black text-rose-600 italic" required />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-500 ml-4 mb-2 block tracking-widest">Worker Note (বিশেষ দ্রষ্টব্য)</label>
                <textarea name="note" defaultValue={editModal.note} className="form-input h-24 italic py-4" placeholder="ADD NOTES..." />
              </div>

              <button type="submit" className="md:col-span-2 py-6 bg-amber-500 text-white rounded-full font-black text-xl uppercase tracking-[0.2em] shadow-2xl border-b-[10px] border-amber-900 active:translate-y-2 transition-all mt-4">{t('saveOverride')}</button>
            </form>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border-4 border-slate-50 shadow-3xl p-6 md:p-8 space-y-12 animate-fade-up text-black italic">
            <div className="text-center space-y-3">
              <h3 className="text-3xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">
                {t('pataSettlement')}
              </h3>
              <p className="text-sm font-black text-slate-500 italic uppercase">
                Payment for: {payModal}
              </p>
            </div>
            <form onSubmit={handleConfirmPayment} className="space-y-12">
              <div className="bg-black p-10 rounded-2xl shadow-2xl text-center">
                <label className="text-[10px] font-black text-white/70 uppercase tracking-[0.5em] mb-4 block">
                  Amount to Disburse
                </label>
                <input
                  name="amount"
                  type="number"
                  className="w-full text-center text-3xl md:text-[10rem] font-black bg-transparent border-none text-white outline-none leading-none h-32 md:h-44"
                  placeholder="৳"
                  autoFocus
                  required
                />
              </div>
              <input
                name="note"
                className="w-full py-6 text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-500 px-10 rounded-2xl italic uppercase"
                placeholder="Internal Memo..."
              />
              <div className="flex flex-col md:flex-row gap-6">
                <button
                  type="button"
                  onClick={() => setPayModal(null)}
                  className="flex-1 py-8 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-500 hover:text-black transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-8 rounded-full font-black text-sm uppercase bg-emerald-600 text-white shadow-2xl border-b-[12px] border-emerald-900 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle size={20} /> SYNC PAYMENT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const amount = document.querySelector('input[name="amount"]')?.value || 0;
                    const msg = `*NRZO0NE PAYMENT CONFIRMATION*\n--------------------------\nWorker: ${payModal}\nAmount: ৳${amount}\nDate: ${new Date().toLocaleDateString('en-GB')}\nStatus: DISBURSED\n--------------------------\nIndustrial Grade Management`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="p-8 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                >
                  <MessageCircle size={32} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pt-20 pb-10 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-8 bg-white px-16 py-8 rounded-full border-4 border-slate-100 shadow-3xl hover:border-black transition-all duration-500"
        >
          <div className="p-4 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
            <ArrowLeft size={24} strokeWidth={3} />
          </div>
          <span className="text-xl font-black uppercase italic tracking-widest text-black">
            Back to Nexus
          </span>
        </button>
      </div>
    </div>
  );
};

export default FactoryPanel;
