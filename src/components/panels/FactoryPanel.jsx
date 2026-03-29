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
  Settings,
  Trash2,
  Search,
  ChevronRight,
  Box,
} from "lucide-react";
import {
  getStock,
  getSewingStock,
  getFinishingStock,
  getPataStockItem,
} from "../../utils/calculations";
import { syncToSheet } from "../../utils/syncUtils";
import logoWhite from "../../assets/logo_white.png";
import logoBlack from "../../assets/logo_black.png";

const FactoryPanel = ({
  type: initialType,
  masterData,
  setMasterData,
  showNotify,
  user,
  setActivePanel,
  t,
}) => {
  const type = initialType;
  const [view, setView] = useState("active"); // 'active', 'history', 'payments'
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const [receiveModal, setReceiveModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [ledgerModal, setLedgerModal] = useState(null);
  const [printSlip, setPrintSlip] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [showAllLots, setShowAllLots] = useState(false);
  const [lotSearch, setLotSearch] = useState("");

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

  const isWorker = user?.role !== "admin" && user?.role !== "manager";
  const workers = (masterData.workerCategories || {})[type] || [];

  const filteredProductions = (masterData.productions || []).filter((p) => {
    if (p.type !== type) return false;
    if (isWorker && p.worker?.toLowerCase() !== user?.name?.toLowerCase())
      return false;
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
    if (rBorka > receiveModal.issueBorka || rHijab > receiveModal.issueHijab)
      return showNotify("ইস্যুর চেয়ে বেশি জমা সম্ভব নয়!", "error");

    setMasterData((prev) => ({
      ...prev,
      productions: (prev.productions || []).map((p) =>
        p.id === receiveModal.id
          ? {
            ...p,
            status: "Received",
            receivedBorka: rBorka,
            receivedHijab: rHijab,
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
    setReceiveModal(null);
    showNotify("হিসাব জমা নেওয়া হয়েছে!");
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
    const SlipHalf = ({ copyTitle }) => (
      <ConfigProvider theme={QR_Slip_Theme}>
        <div style={{ minHeight: "140mm" }} className="w-full flex-1 border-[2px] border-black bg-white relative overflow-hidden flex text-black">
          <div className="w-20 bg-white border-r-[2px] border-black flex flex-col items-center justify-between py-8 shrink-0">
            <img src={logoBlack} alt="NRZO0NE" className="w-12 h-12 object-contain" />
            <div className="rotate-[-90deg] whitespace-nowrap">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black">NRZO0NE FACTORY SYSTEM</p>
            </div>
            <div className="w-8 h-8 border border-black rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-transparent border border-black"></div>
            </div>
          </div>
          <div className="flex-1 p-6 relative flex flex-col items-center justify-center bg-white">

            <Card
              style={{ width: '100%', height: '100%', border: '2px solid #000', borderRadius: '12px', display: 'flex', flexDirection: 'column', zIndex: 10, position: 'relative' }}
              bodyStyle={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}
              hoverable={false}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4} style={{ margin: 0, letterSpacing: '1px', fontStyle: 'italic', fontWeight: '900' }}>NRZO0NE</Title>
                  <Text type="secondary" style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>{type} PRODUCTION UNIT</Text>
                </Col>
                <Col style={{ textAlign: 'right' }}>
                  <Tag color="black" style={{ margin: 0, fontWeight: 'bold' }}>{copyTitle}</Tag>
                  <br />
                  <Text strong style={{ fontSize: '12px', display: 'inline-block', marginTop: '4px' }}>{printSlip.date || '25/03/2026'}</Text>
                </Col>
              </Row>

              <Divider style={{ margin: '14px 0', borderBlockStart: '2px solid #000' }} />

              <Row gutter={12}>
                <Col span={8}>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                    <Text type="secondary" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', color: '#000' }}>WORKER / কারিগর</Text>
                    <Title level={5} style={{ margin: '4px 0 0 0', fontStyle: 'italic', textTransform: 'uppercase' }}>{printSlip.worker || 'JIHAN'}</Title>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                    <Text type="secondary" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', color: '#000' }}>DESIGN / ডিজাইন</Text>
                    <Title level={5} style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>{printSlip.design || 'পাতা'}</Title>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                    <Text style={{ fontSize: '9px', color: '#000', letterSpacing: '1px', fontWeight: 'bold' }}>LOT NO / লট নং</Text>
                    <Title level={5} style={{ margin: '4px 0 0 0', color: '#000', fontStyle: 'italic', fontWeight: '900' }}>#{printSlip.lotNo || 'ADMIN'}</Title>
                  </div>
                </Col>
              </Row>

              <Row gutter={12} style={{ marginTop: '16px', flex: 1 }}>
                <Col span={6}>
                  <Card size="small" style={{ textAlign: 'center', border: '1px solid #000', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bodyStyle={{ padding: '10px' }}>
                    <Text style={{ fontSize: '9px', color: '#000', fontWeight: 'bold' }}>ISSUE BORKA</Text>
                    <Title level={4} style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: '#000' }}>{printSlip.issueBorka || 0}</Title>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ textAlign: 'center', border: '1px solid #000', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bodyStyle={{ padding: '10px' }}>
                    <Text style={{ fontSize: '9px', color: '#000', fontWeight: 'bold' }}>ISSUE HIJAB</Text>
                    <Title level={4} style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: '#000' }}>{printSlip.issueHijab || 0}</Title>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ textAlign: 'center', background: '#fff', border: '1px solid #000', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bodyStyle={{ padding: '10px' }}>
                    <Text style={{ fontSize: '9px', fontWeight: 'bold', color: '#000' }}>RECEIVED QTY</Text>
                    <Title level={4} style={{ margin: '4px 0 0 0', color: '#000', fontStyle: 'italic' }}></Title>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ textAlign: 'center', background: '#fff', border: '1px dashed #000', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bodyStyle={{ padding: '10px' }}>
                    <Text style={{ fontSize: '9px', color: '#000', fontWeight: 'bold' }}>SIZE</Text>
                    <Title level={4} style={{ margin: '4px 0 0 0', color: '#000', fontStyle: 'italic', fontWeight: '900' }}>{printSlip.size || 44}</Title>
                  </Card>
                </Col>
              </Row>

              <Divider dashed style={{ margin: '16px 0 12px 0' }} />
              <Row align="middle" justify="space-between">
                <Col>
                  {typeof window !== 'undefined' && (
                    <QRCode value={`${window.location.origin}?track=${printSlip.id}`} size={110} bordered={false} style={{ margin: '-4px' }} color="#000" />
                  )}
                </Col>
                <Col style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>NRZO0NE SMART TRACK™</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '9px' }}>Generated by NRZO0NE Factory System • ID: {printSlip.id}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        </div>
      </ConfigProvider>
    );

    return (
      <div className="min-h-screen bg-slate-50 text-black italic font-outfit py-10 print:py-0">
        <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } @page { size: A4 portrait; margin: 0; } }`}</style>
        <div className="no-print flex justify-between items-center p-8 w-[210mm] mx-auto mb-10 bg-white rounded-2xl shadow-2xl border-4 border-slate-100 uppercase font-black">
          <button
            onClick={() => setPrintSlip(null)}
            className="px-5 py-3 rounded-full hover:bg-black hover:text-white transition-all text-sm tracking-widest"
          >
            Back
          </button>
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-sm tracking-widest"
          >
            <Printer size={20} /> PRINT BUNDLE
          </button>
        </div>
        <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-3xl flex flex-col print:w-full print:shadow-none print:m-0 border border-slate-200 print:border-none">
          <SlipHalf copyTitle="WORKER COPY" />
          <div className="w-full border-t-[2px] border-dashed border-black relative flex justify-center py-0 shrink-0 select-none items-center h-16">
            <span className="relative z-10 bg-white px-8 py-2 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 border-2 border-slate-100 rounded-full shadow-md italic">
              ✂ এখান থেকে কাটুন
            </span>
          </div>
          <SlipHalf copyTitle="FACTORY COPY" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-up px-1 md:px-2 italic text-black font-outfit uppercase">
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
              {type === "sewing" ? "Sewing" : "Stone"} <span className="text-slate-400">Unit</span>
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">
              Production Division {type.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Active Pipeline</p>
            <p className="text-2xl font-black italic text-black leading-none uppercase">
              {activeProductions.length} <span className="text-[10px] text-slate-300 ml-1">Lots</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-10">
        {["new", "active", "history", (isAdmin || isManager) && "payments"].filter(Boolean).map((v) => (
          <button
            key={v}
            onClick={() => {
              if (v === "new") setShowIssueModal(true);
              else setView(v);
            }}
            className={`pill-tab flex-1 whitespace-nowrap min-w-[100px] ${view === v ? "pill-tab-active" : "pill-tab-inactive hover:text-black"}`}
          >
            {v === "new" ? "নতুন কাজ" : v === "active" ? "চলমান" : v === "history" ? "পুরাতন" : "লেজার ও পেমেন্ট"}
          </button>
        ))}
      </div>

      {view === "active" && (
        <div className="space-y-4">
          <div className="relative group mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
            <input
              type="text"
              placeholder="সার্চ লট নম্বর, কারিগর বা ডিজাইন..."
              className="form-input pl-16 py-5 text-base border-slate-200"
              value={lotSearch}
              onChange={(e) => setLotSearch(e.target.value)}
            />
          </div>

          {activeProductions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
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
                      </h4>
                      <span className="badge-standard">#{p.lotNo}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase italic tracking-widest">
                      <span>• {p.design}</span>
                      <span>• {p.date}</span>
                      {p.pataQty > 0 && <span className="text-black">PATA: {p.pataQty}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-12 w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0">
                  <div className="flex gap-12">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Borka</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.issueBorka}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Hijab</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.issueHijab}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReceiveModal(p)}
                      className="black-button"
                    >
                      জমা নিন (REC)
                    </button>
                    <button
                      onClick={() => setPrintSlip(p)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all"
                    >
                      <Printer size={18} />
                    </button>
                    {isAdmin && (
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
                    <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase italic tracking-widest">
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
                      <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Borka</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.receivedBorka || 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Hijab</p>
                      <p className="text-4xl font-black italic tracking-tighter leading-none">{p.receivedHijab || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Wage</p>
                      <p className="text-3xl font-black text-emerald-500 italic">৳{p.rate}</p>
                    </div>
                    <button
                      onClick={() => setPrintSlip(p)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                      <Printer size={18} />
                    </button>
                    {isAdmin && (
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
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-200 uppercase font-black italic gap-6">
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
                      <h4 className="text-xl md:text-2xl font-black italic uppercase mb-2">
                        {w}
                      </h4>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">
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
                      className="p-6 bg-white border-4 border-slate-50 text-slate-300 rounded-full hover:border-black hover:text-black transition-all"
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
              <span className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${!showAllLots ? "text-black" : "text-slate-400"}`}>Normal Pipeline</span>
              <button
                type="button"
                onClick={() => setShowAllLots(!showAllLots)}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${showAllLots ? "bg-rose-500" : "bg-emerald-500"}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${showAllLots ? "translate-x-6" : ""}`}></div>
              </button>
              <span className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${showAllLots ? "text-rose-500" : "text-slate-400"}`}>Admin Power</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
              <div className="lg:col-span-6 space-y-8">
                
                {/* Lot Selection Box */}
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 relative group transition-all hover:border-black">
                  <div className="flex items-center gap-3 mb-4">
                    <Search size={18} className="text-slate-400" />
                    <label className="text-xs font-black text-black uppercase tracking-widest">
                      Select Available Lot <span className="text-slate-400 text-[10px] ml-1">(লট পছন্দ করুন)</span>
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
                    <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {availableLots.length === 0 && (
                    <div className="mt-4 p-4 bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400">
                       <Box size={16} /> <span className="text-[10px] font-black tracking-widest uppercase">No Matching Lots Found</span>
                    </div>
                  )}
                </div>

                <div className="bg-white space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-widest mb-3">
                      <User size={16} className="text-slate-400" /> Select Worker <span className="text-slate-400 text-[10px]">(কারিগর নির্বাচন করুন)</span>
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
                        {workers.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                      <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 shrink-0 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate (রেট)</p>
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date (তারিখ)</p>
                      <input 
                        type="date"
                        className="w-full bg-transparent text-sm font-black text-black outline-none p-0"
                        value={selection.date}
                        onChange={(e) => setSelection(p => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                    <div className="bg-slate-50 p-4 shrink-0 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Design</p>
                      <p className="text-sm font-black truncate">{selection.design || "---"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 shrink-0 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Color</p>
                      <p className="text-sm font-black truncate">{selection.color || "---"}</p>
                    </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Optional Note (ঐচ্ছিক)</label>
                     <input
                       type="text"
                       className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-xl font-bold text-sm italic outline-none focus:border-black transition-all placeholder:text-slate-300"
                       placeholder="Type Remarks..."
                       value={selection.note || ""}
                       onChange={(e) => setSelection(p => ({ ...p, note: e.target.value }))}
                     />
                  </div>
                </div>

              </div>

              <div className="lg:col-span-6">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <Layers size={18} className="text-slate-400" />
                    <label className="text-xs font-black text-black uppercase tracking-widest">
                       Select Size & Quantity
                    </label>
                  </div>

                  <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {issueSizes.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-slate-400 uppercase font-black italic tracking-widest text-[10px]">
                        Select Lot to Populate
                      </div>
                    ) : (
                      issueSizes.map((row, idx) => {
                           const lotDetails = availableLots.find(l => l.lotNo === selection.lotNo && l.design === selection.design && l.color === selection.color);
                           const maxBorka = lotDetails?.sizes?.[row.size]?.remB || 0;
                           const maxHijab = lotDetails?.sizes?.[row.size]?.remH || 0;
                           return (
                             <div key={idx} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-black transition-all">
                               <div className="flex items-center justify-between">
                                  <div className="px-4 py-2 bg-black text-white rounded-lg text-sm font-black">{row.size || "--"}</div>
                               </div>
                               <div className="flex gap-4 items-center">
                                  <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <div className="flex justify-between items-center mb-1">
                                         <p className="text-[9px] font-black uppercase text-slate-400">Borka Qty</p>
                                         <span className="text-[8px] font-bold text-slate-400">Max: {maxBorka}</span>
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
                                  <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <div className="flex justify-between items-center mb-1">
                                         <p className="text-[9px] font-black uppercase text-slate-400">Hijab Qty</p>
                                         <span className="text-[8px] font-bold text-slate-400">Max: {maxHijab}</span>
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
                               </div>
                             </div>
                           )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="py-4 md:py-6 px-8 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all font-outfit"
              >
                Cancel
              </button>
              <button
                type="submit"
                name="print"
                onClick={handleIssue}
                className="py-4 md:py-6 px-10 rounded-full bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 font-outfit"
              >
                <Printer size={18} /> Print Note
              </button>
              <button
                type="submit"
                onClick={handleIssue}
                className="flex-[2] py-4 md:py-6 rounded-full bg-emerald-600 text-white font-black uppercase text-sm tracking-[0.2em] shadow-emerald-600/30 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-3 font-outfit"
              >
                ASSIGN WORK <span className="text-[10px] hidden md:inline">(নিশ্চিত করুন)</span> <CheckCircle size={18} />
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
                Job Completion
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {receiveModal.worker} • {receiveModal.design}
              </p>
            </div>
            <form
              onSubmit={handleConfirmReceive}
              className="space-y-10 uppercase italic"
            >
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-inner">
                <div className="text-center">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-3 block">
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
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-3 block">
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
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setReceiveModal(null)}
                  className="py-5 bg-slate-50 text-slate-400 rounded-full font-black uppercase text-[10px] tracking-widest hover:text-black transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-6 bg-black text-white rounded-full font-black uppercase text-xs tracking-widest shadow-2xl border-b-8 border-zinc-900 transition-all hover:scale-105 active:scale-95"
                >
                  CONFIRM RECEIPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border-4 border-slate-50 shadow-3xl p-6 md:p-8 space-y-12 animate-fade-up text-black italic">
            <div className="text-center space-y-3">
              <h3 className="text-3xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">
                Payout Pipeline
              </h3>
              <p className="text-sm font-black text-slate-500 italic uppercase">
                Payment for: {payModal}
              </p>
            </div>
            <form onSubmit={handleConfirmPayment} className="space-y-12">
              <div className="bg-black p-10 rounded-2xl shadow-2xl text-center">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-4 block">
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
                className="w-full py-6 text-sm font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 px-10 rounded-2xl italic uppercase"
                placeholder="Internal Memo..."
              />
              <div className="flex flex-col md:flex-row gap-6">
                <button
                  type="button"
                  onClick={() => setPayModal(null)}
                  className="flex-1 py-8 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-400 hover:text-black transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-8 rounded-full font-black text-sm uppercase bg-emerald-600 text-white shadow-2xl border-b-[12px] border-emerald-900 hover:scale-105 active:scale-95 transition-all"
                >
                  FINALIZE PAYMENT
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
