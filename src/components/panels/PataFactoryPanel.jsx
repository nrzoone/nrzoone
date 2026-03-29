import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Typography, Divider, QRCode, Tag, ConfigProvider } from 'antd';
const { Title, Text } = Typography;

const QR_Slip_Theme = {
  token: { fontFamily: 'Inter, sans-serif', borderRadius: 8, fontSize: 12, colorTextBase: '#000000' },
  components: { Card: { paddingLG: 16 }, Typography: { fontSizeHeading4: 18, fontSizeHeading5: 14 } }
};

import { Grid, Plus, Trash2, Box, X, Search, Scissors, CheckCircle, Minus, Printer, ArrowLeft, Settings, DollarSign, History } from 'lucide-react';
import { syncToSheet } from '../../utils/syncUtils';
import logoWhite from '../../assets/logo_white.png';
import logoBlack from '../../assets/logo_black.png';

const PataFactoryPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, t }) => {
    const isAdmin = user?.role === 'admin';
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [printSlip, setPrintSlip] = useState(null);
    const [receiveModal, setReceiveModal] = useState(null);
    const [editPataModal, setEditPataModal] = useState(null);
    const [payModal, setPayModal] = useState(null);
    const [ledgerModal, setLedgerModal] = useState(null);
    const [view, setView] = useState('active');
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({
        design: '',
        color: '',
        pataType: 'Single',
        qty: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [entryData, setEntryData] = useState({
        worker: '',
        design: '',
        color: '',
        lotNo: '',
        pataType: 'Single',
        pataQty: '',
        stonePackets: '',
        paperRolls: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const workers = masterData.workerCategories?.pata || [];

    const getWorkerDue = (name) => {
        let earnings = 0;
        const prods = (masterData.pataEntries || []).filter(p => p.worker === name && p.status === 'Received');
        prods.forEach(p => {
            earnings += Number(p.amount || 0);
        });
        const paid = (masterData.workerPayments || []).filter(p => p.worker === name && p.dept === 'pata').reduce((s, p) => s + Number(p.amount), 0);
        return earnings - paid;
    };

    const handleConfirmPayment = (e) => {
        e.preventDefault();
        const amount = Number(e.target.amount.value);
        const date = e.target.date.value ? new Date(e.target.date.value).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        if (amount <= 0) return;

        const newPayment = {
            id: Date.now(),
            date,
            worker: payModal,
            dept: 'pata',
            amount,
            note: e.target.note.value
        };

        setMasterData(prev => ({
            ...prev,
            workerPayments: [newPayment, ...(prev.workerPayments || [])],
            expenses: [{
                id: Date.now() + 1,
                date: new Date().toISOString().split('T')[0],
                category: 'ভাতা',
                description: `${payModal} (pata)`,
                amount
            }, ...(prev.expenses || [])]
        }));

        syncToSheet({
            type: "WORKER_PAYMENT",
            worker: payModal,
            amount,
            detail: `Pata payment`
        });

        setPayModal(null);
        showNotify('পেমেন্ট সফল ভাবে রেকর্ড করা হয়েছে!');
    };

    const rawStock = React.useMemo(() => {
        const stock = { stone: 0, roll: 0 };
        (masterData.rawInventory || []).forEach(log => {
            if (log.item.toLowerCase().includes('stone')) {
                if (log.type === 'in') stock.stone += Number(log.qty);
                else stock.stone -= Number(log.qty);
            }
            if (log.item.toLowerCase().includes('roll')) {
                if (log.type === 'in') stock.roll += Number(log.qty);
                else stock.roll -= Number(log.qty);
            }
        });
        return stock;
    }, [masterData.rawInventory]);

    const uniqueLots = React.useMemo(() => {
        const lots = [];
        (masterData.cuttingStock || []).forEach(c => {
            const existing = lots.find(l => l.lotNo === c.lotNo);
            if (!existing) {
                lots.push({ lotNo: c.lotNo, design: c.design, color: c.color });
            }
        });
        return lots;
    }, [masterData.cuttingStock]);

    const handleSaveIssue = (shouldPrint) => {
        if (!entryData.worker || !entryData.design || !entryData.lotNo || !entryData.pataQty) {
            return showNotify('কারিগর, ডিজাইন, লট নম্বর এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now(),
            date: entryData.date ? new Date(entryData.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            worker: entryData.worker,
            design: entryData.design,
            color: entryData.color || 'N/A',
            lotNo: entryData.lotNo,
            pataType: entryData.pataType,
            pataQty: Number(entryData.pataQty),
            stonePackets: Number(entryData.stonePackets || 0),
            paperRolls: Number(entryData.paperRolls || 0),
            status: 'Pending',
            note: entryData.note
        };

        setMasterData(prev => {
            const newInventory = [...(prev.rawInventory || [])];

            if (newEntry.stonePackets > 0) {
                newInventory.unshift({
                    id: Date.now() + 1,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "Stone Packet",
                    qty: newEntry.stonePackets,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Lot: ${newEntry.lotNo})`
                });
            }
            if (newEntry.paperRolls > 0) {
                newInventory.unshift({
                    id: Date.now() + 2,
                    date: new Date().toLocaleDateString('en-GB'),
                    item: "Paper Roll",
                    qty: newEntry.paperRolls,
                    type: "out",
                    note: `Pata Work Issue: ${newEntry.worker} (Lot: ${newEntry.lotNo})`
                });
            }

            const workerTaskNotification = {
                id: Date.now().toString(),
                type: 'task',
                title: 'নতুন পাতা কাজ',
                message: `${newEntry.worker}-কে ${newEntry.pataQty} পিস ${newEntry.design} (${newEntry.color}) কাজ দেওয়া হয়েছে।`,
                timestamp: new Date().toISOString(),
                read: false,
                target: 'worker'
            };

            return {
                ...prev,
                pataEntries: [newEntry, ...(prev.pataEntries || [])],
                rawInventory: newInventory,
                notifications: [workerTaskNotification, ...(prev.notifications || [])]
            };
        });

        syncToSheet({
            type: "PATA_ISSUE",
            worker: newEntry.worker,
            detail: `${newEntry.design}(${newEntry.color}) - ${newEntry.pataType}: ${newEntry.pataQty} Pcs (Stone: ${newEntry.stonePackets}, Paper: ${newEntry.paperRolls})`,
            amount: 0
        });

        setShowModal(false);
        if (shouldPrint) {
            setPrintSlip(newEntry);
        }
        setEntryData({ worker: '', design: '', color: '', lotNo: '', pataType: 'Single', pataQty: '', stonePackets: '', paperRolls: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('পাতা কাজ সফলভাবে ইস্যু হয়েছে এবং স্টক সমন্বয় করা হয়েছে!');
    };

    const handleReceive = (e) => {
        e.preventDefault();
        const item = receiveModal;
        const receivedQty = Number(e.target.rQty.value || item.pataQty);

        if (receivedQty > item.pataQty) {
            return showNotify(`ভুল! জমার পরিমাণ (${receivedQty}) ইস্যু পরিমাণের (${item.pataQty}) চেয়ে বেশি হতে পারে না!`, 'error');
        }

        const rate = masterData.pataRates?.[item.pataType] || 0;
        const amount = receivedQty * rate;
        const receiveDate = receiveModal.receiveDate
            ? new Date(receiveModal.receiveDate).toLocaleDateString('en-GB')
            : new Date().toLocaleDateString('en-GB');

        setMasterData(prev => ({
            ...prev,
            pataEntries: prev.pataEntries.map(e => e.id === item.id ? {
                ...e,
                status: 'Received',
                receivedQty: receivedQty,
                amount: amount,
                receiveDate: receiveDate
            } : e)
        }));

        const updatedItem = { ...item, status: 'Received', receivedQty, amount, receiveDate };

        syncToSheet({
            type: "PATA_RECEIVE",
            worker: item.worker,
            detail: `${item.design}(${item.pataType}) - ${receivedQty} Pcs`,
            amount: amount
        });

        setReceiveModal(null);
        showNotify('পাতা কাজ সফলভাবে জমা নেওয়া হয়েছে!');

        if (e.nativeEvent.submitter?.name === 'print') {
            setPrintSlip(updatedItem);
        }
    };

    const handleEditPataSave = (e) => {
        e.preventDefault();
        const f = e.target;
        const updated = {
            ...editPataModal,
            worker: f.worker.value,
            design: f.design.value,
            color: f.color.value,
            lotNo: f.lotNo.value,
            pataType: f.pataType.value,
            pataQty: Number(f.qty.value),
            stonePackets: Number(f.stone.value),
            paperRolls: Number(f.roll.value),
            status: f.status.value,
            date: f.date.value ? new Date(f.date.value).toLocaleDateString('en-GB') : editPataModal.date,
            note: f.note.value
        };

        setMasterData(prev => ({
            ...prev,
            pataEntries: prev.pataEntries.map(ent => ent.id === updated.id ? updated : ent)
        }));

        setEditPataModal(null);
        showNotify('হিসাব আপডেট করা হয়েছে (Admin Power)!');
    };

    const handleManualStockIn = (e) => {
        e.preventDefault();
        if (!manualForm.design || !manualForm.qty) {
            return showNotify('ডিজাইন এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now(),
            date: manualForm.date ? new Date(manualForm.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            worker: 'Manual/Owner',
            design: manualForm.design,
            color: manualForm.color || 'N/A',
            lotNo: 'MANUAL',
            pataType: manualForm.pataType,
            pataQty: Number(manualForm.qty),
            status: 'Received',
            receiveDate: new Date().toLocaleDateString('en-GB'),
            note: manualForm.note || 'Manual Stock Entry'
        };

        setMasterData(prev => ({
            ...prev,
            pataEntries: [newEntry, ...(prev.pataEntries || [])]
        }));

        syncToSheet({
            type: "PATA_MANUAL_STOCK",
            worker: "Manual",
            detail: `${manualForm.design}(${manualForm.pataType}) - ${manualForm.qty} Pcs`,
            amount: 0
        });

        setShowManualModal(false);
        setManualForm({ design: '', color: '', pataType: 'Single', qty: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('সরাসরি স্টক যোগ করা হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            pataEntries: (prev.pataEntries || []).filter(item => item.id !== id)
        }));
        showNotify('এন্ট্রি মুছে ফেলা হয়েছে!');
    };

    const isWorker = user?.role !== 'admin' && user?.role !== 'manager';

    const filteredEntries = (masterData.pataEntries || []).filter(e => {
        if (isWorker && e.worker?.toLowerCase() !== user?.name?.toLowerCase()) return false;
        return e.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.design.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.lotNo.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const activeEntries = filteredEntries.filter(e => e.status === 'Pending');
    const historyEntries = filteredEntries.filter(e => e.status === 'Received');

    if (printSlip) {
        const isReceived = printSlip.status === 'Received';
        const rate = masterData.pataRates?.[printSlip.pataType] || 0;

        const SlipHalf = ({ copyTitle }) => (
            <ConfigProvider theme={QR_Slip_Theme}>
                <div style={{ minHeight: '140mm' }} className="w-full flex-1 border-[2px] border-black bg-white relative overflow-hidden flex text-black">
                    <div className="w-20 bg-white border-r-[2px] border-black flex flex-col items-center justify-between py-8 shrink-0">
                        <img src={logoBlack} alt="NRZO0NE" className="w-12 h-12 object-contain" />
                        <div className="rotate-[-90deg] whitespace-nowrap">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black">NRZO0NE PATA HUB</p>
                        </div>
                        <div className="w-8 h-8 border border-black rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full border border-black"></div>
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
                                    <Text type="secondary" style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>PATA HUB DIVISION</Text>
                                </Col>
                                <Col style={{ textAlign: 'right' }}>
                                    <Tag color="black" style={{ margin: 0, fontWeight: 'bold' }}>{copyTitle}</Tag>
                                    <br />
                                    <Text strong style={{ fontSize: '12px', display: 'inline-block', marginTop: '4px' }}>{printSlip.date}</Text>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '14px 0', borderBlockStart: '2px solid #000' }} />

                            <Row gutter={12}>
                                <Col span={8}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                                        <Text type="secondary" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', color: '#000' }}>WORKER / কারিগর</Text>
                                        <Title level={5} style={{ margin: '4px 0 0 0', fontStyle: 'italic', textTransform: 'uppercase' }}>{printSlip.worker}</Title>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                                        <Text type="secondary" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', color: '#000' }}>DESIGN / ডিজাইন</Text>
                                        <Title level={5} style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>{printSlip.design}</Title>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                                        <Text style={{ fontSize: '9px', color: '#000', letterSpacing: '1px', fontWeight: 'bold' }}>LOT NO / লট নং</Text>
                                        <Title level={5} style={{ margin: '4px 0 0 0', color: '#000', fontStyle: 'italic', fontWeight: '900' }}>#{printSlip.lotNo}</Title>
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={12} style={{ marginTop: '16px' }}>
                                <Col span={6}>
                                    <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                                        <Text style={{ fontSize: '9px', fontWeight: 'bold', color: '#000' }}>COLOR</Text>
                                        <Title level={5} style={{ margin: 0, color: '#000' }}>{printSlip.color || '-'}</Title>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                                        <Text style={{ fontSize: '9px', fontWeight: 'bold', color: '#000' }}>TYPE</Text>
                                        <Title level={5} style={{ margin: 0, color: '#000' }}>{printSlip.pataType || '-'}</Title>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                                        <Text style={{ fontSize: '9px', fontWeight: 'bold', color: '#000' }}>RATE</Text>
                                        <Title level={5} style={{ margin: 0, color: '#000' }}>৳{rate}</Title>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ background: '#fff', padding: '8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #000' }}>
                                        <Text style={{ fontSize: '9px', fontWeight: 'bold', color: '#000' }}>STATUS</Text>
                                        <Title level={5} style={{ margin: 0, color: '#000' }}>{printSlip.status}</Title>
                                    </div>
                                </Col>
                            </Row>

                            <Row style={{ marginTop: '16px', flex: 1 }}>
                                <Col span={24}>
                                    <Card size="small" style={{ background: '#fff', border: '1px dashed #000', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bodyStyle={{ padding: '16px' }}>
                                        <Text style={{ fontSize: '9px', color: '#000', letterSpacing: '4px', fontWeight: 'bold' }}>TOTAL QUANTITY</Text>
                                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '16px' }}>
                                            <Title level={1} style={{ margin: 0, color: '#000', fontSize: '48px', fontStyle: 'italic', fontWeight: '900' }}>{printSlip.pataQty}</Title>
                                            {isReceived && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <span style={{ color: '#000', fontSize: '24px' }}>→</span>
                                                    <Title level={2} style={{ margin: 0, color: '#000', fontStyle: 'italic' }}>{printSlip.receivedQty}</Title>
                                                </div>
                                            )}
                                            <Text style={{ color: '#000', fontSize: '16px', fontStyle: 'italic', fontWeight: 'bold' }}>Pcs</Text>
                                        </div>
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
                                    <Text type="secondary" style={{ fontSize: '9px' }}>Generated by NRZO0NE Pata Hub • ID: {printSlip.id}</Text>
                                </Col>
                            </Row>
                        </Card>
                    </div>
                </div>
            </ConfigProvider>
        );

        return (
            <div className="min-h-screen bg-white text-black italic font-outfit py-10 print:py-0 print:bg-white">
                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; margin: 0; padding: 0; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>

                {/* Screen controls */}
                <div className="no-print flex justify-between items-center p-6 w-[210mm] mx-auto mb-6 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
                    <button onClick={() => setPrintSlip(null)} className="bg-white text-slate-600 px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest border-2 border-slate-200 hover:bg-black hover:text-white transition-all">← Cancel Job</button>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">A4 Optimized Bundle (2x A5)</p>
                    <button onClick={() => window.print()} className="bg-black text-white px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 border-b-8 border-zinc-900 active:scale-95 transition-all">
                        <Printer size={18} /> Print Voucher
                    </button>
                </div>

                {/* A4 page preview containing 2 A5 slips */}
                <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-2xl flex flex-col print:w-full print:h-[100vh] print:shadow-none box-border relative z-10">
                    <SlipHalf copyTitle="WORKER COPY — কর্মীর কপি" />

                    {/* Cut line */}
                    <div className="w-full border-t-[2px] border-dashed border-black relative flex justify-center py-0 shrink-0 select-none items-center h-12">
                        <div className="absolute inset-0 bg-slate-50/50"></div>
                        <span className="relative z-10 bg-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 border-2 border-slate-100 rounded-full shadow-sm flex items-center gap-3">
                            <Scissors size={14} className="text-slate-300" /> Cut Here • এখান থেকে কাটুন
                        </span>
                    </div>

                    <SlipHalf copyTitle="OFFICE COPY — অফিসের কপি" />
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
                Pata <span className="text-slate-400">Hub</span>
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">
               Advanced Production Division
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Pending Pata</p>
            <p className="text-2xl font-black italic text-black leading-none uppercase">
                {activeEntries.reduce((sum, item) => sum + Number(item.pataQty || 0), 0)} <span className="text-[10px] text-slate-300 ml-1">Pcs</span>
            </p>
          </div>
          <div className="flex gap-3 flex-1 md:flex-none">
            <button
                onClick={() => setShowManualModal(true)}
                className="w-12 h-12 flex items-center justify-center bg-amber-500 text-white rounded-full shadow-lg hover:scale-110 transition-all border-b-4 border-amber-800"
            >
                <Box size={20} />
            </button>
            <button
                onClick={() => setShowModal(true)}
                className="black-button px-8 py-4 text-[11px] flex-1 md:flex-none justify-center"
            >
                <Plus size={16} strokeWidth={4} /> নতুন কাজ
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-10">
        {['new', 'active', 'history', isAdmin && 'payments'].filter(Boolean).map(v => (
          <button
            key={v}
            onClick={() => {
                if (v === 'new') setShowModal(true);
                else setView(v);
            }}
            className={`pill-tab flex-1 ${view === v ? "pill-tab-active" : "pill-tab-inactive hover:text-black"}`}
          >
            {v === 'new' ? 'নতুন কাজ' : v === 'active' ? 'চলমান' : v === 'history' ? 'পুরাতন' : 'লেজার ও পেমেন্ট'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {view === 'payments' ? (
             <div className="p-4 md:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {workers.map((w, idx) => {
                    const due = getWorkerDue(w);
                    return (
                        <div key={idx} className="bg-white p-10 rounded-[4rem] border border-slate-100 flex flex-col justify-between h-72 group hover:border-black transition-all relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                <DollarSign size={140} className="text-black" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black italic uppercase leading-none mb-3 text-black group-hover:translate-x-1 transition-transform">{w}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Due (পাওনা)</p>
                            </div>
                            <div className="flex justify-between items-end relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-5xl font-black italic tracking-tighter leading-none ${due > 0 ? 'text-amber-600' : 'text-slate-200'}`}>৳{due.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setLedgerModal(w)}
                                        className="w-14 h-14 bg-white text-black rounded-2xl border border-slate-100 hover:border-black transition-all shadow-sm flex items-center justify-center"
                                        title="View Ledger"
                                    >
                                        <History size={20} />
                                    </button>
                                    <button
                                        onClick={() => setPayModal(w)}
                                        className="w-14 h-14 bg-black text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                                        title="Make Payment"
                                    >
                                        <DollarSign size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="space-y-4">
                <div className="relative group mb-8">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="সার্চ কারিগর, ডিজাইন বা লট নম্বর..."
                      className="form-input pl-16 py-5 text-base border-slate-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {(view === 'active' ? activeEntries : historyEntries).length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
                        <Box size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero Production Nodes</p>
                    </div>
                ) : (
                    (view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                        <div key={item.id || idx} className="item-card flex flex-col md:flex-row justify-between items-center gap-8 group">
                            <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                                <div className={`w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6 ${item.status === 'Pending' ? 'border-amber-200' : 'border-emerald-200'}`}>
                                    {item.status === 'Pending' ? <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" /> : <div className="w-4 h-4 rounded-full bg-emerald-500" />}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-4">
                                        <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                                            • পাতা কাজ # {item.worker}
                                        </h4>
                                        <span className="badge-standard">#{item.lotNo}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase italic tracking-widest">
                                        <span>• {item.design}</span>
                                        <span>• {item.color}</span>
                                        <span>• {item.date}</span>
                                        {item.status === 'Received' && <span className="text-emerald-500 font-black tracking-widest pl-4 ml-2 border-l border-slate-100">• DONE {item.receiveDate}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-500">{item.pataType}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">S:{item.stonePackets || 0} Pkt • P:{item.paperRolls || 0} Roll</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12 w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Pcs</p>
                                    <p className="text-4xl font-black italic tracking-tighter leading-none">{item.receivedQty || item.pataQty}</p>
                                </div>
                                <div className="flex gap-3">
                                    {item.status === 'Pending' ? (
                                        <button onClick={() => setReceiveModal(item)} className="black-button">জমা নিন (REC)</button>
                                    ) : (
                                        <button onClick={() => setPrintSlip(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all shadow-sm">
                                            <Printer size={18} />
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditPataModal(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                                <Settings size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
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
      </div>

            {
                showModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-start md:items-center justify-center p-2 md:p-4 italic overflow-y-auto">
                        <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] w-full max-w-4xl border-2 border-black shadow-3xl animate-fade-up my-auto flex flex-col text-black h-auto">
                            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-gray-50 flex-shrink-0 gap-3">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="p-3 md:p-4 bg-black text-white rounded-[1rem] md:rounded-[1.5rem] shadow-xl rotate-2">
                                        <Plus size={28} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase text-xl md:text-3xl tracking-tighter leading-none">Pata Issue</h3>
                                        <p className="text-[8px] md:text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mt-1 md:mt-2 italic">Worker Assignment Hub</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 md:p-4 bg-white border border-slate-100 rounded-full hover:bg-black hover:text-white transition-all text-black shadow-sm"><X size={24} /></button>
                            </div>

                            {/* Live Material Monitor */}
                            <div className="px-4 md:px-8 pt-4 md:pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-shrink-0">
                                <div className="bg-amber-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-amber-100 flex flex-col justify-center">
                                    <p className="text-[8px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Stone Packets</p>
                                    <p className="text-2xl md:text-4xl font-black italic text-amber-600">{rawStock.stone}</p>
                                </div>
                                <div className="bg-blue-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-blue-100 flex flex-col justify-center">
                                    <p className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">Paper Rolls</p>
                                    <p className="text-2xl md:text-4xl font-black italic text-blue-600">{rawStock.roll}</p>
                                </div>
                                {entryData.design && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = (masterData.productions || []).filter(p => p.design === entryData.design && p.status === 'Received').reduce((s, p) => s + (p.receivedBorka || 0), 0);
                                                setEntryData(p => ({ ...p, pataQty: val }));
                                            }}
                                            className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 flex flex-col justify-center text-left hover:border-black transition-all group/stock">
                                            <p className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Stock (B)</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xl md:text-4xl font-black italic text-black">
                                                    {(masterData.productions || [])
                                                        .filter(p => p.design === entryData.design && p.status === 'Received')
                                                        .reduce((s, p) => s + (p.receivedBorka || 0), 0)}
                                                </p>
                                                <Plus size={14} className="text-slate-400 group-hover/stock:text-black transition-colors" />
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const val = (masterData.productions || []).filter(p => p.design === entryData.design && p.status === 'Received').reduce((s, p) => s + (p.receivedHijab || 0), 0);
                                                setEntryData(p => ({ ...p, pataQty: val }));
                                            }}
                                            className="bg-emerald-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-emerald-100 flex flex-col justify-center text-left hover:border-emerald-500 transition-all group/stock">
                                            <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">Stock (H)</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xl md:text-4xl font-black italic text-emerald-600">
                                                    {(masterData.productions || [])
                                                        .filter(p => p.design === entryData.design && p.status === 'Received')
                                                        .reduce((s, p) => s + (p.receivedHijab || 0), 0)}
                                                </p>
                                                <Plus size={14} className="text-emerald-200 group-hover/stock:text-emerald-600 transition-colors" />
                                            </div>
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1 italic">
                                {/* Group 1: Identity & Context */}
                                <div className="bg-slate-50/50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-50 space-y-4 md:space-y-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-1.5 h-4 md:h-6 bg-black rounded-full"></div>
                                        <h4 className="text-sm md:text-base font-black uppercase tracking-widest">১. কারিগর ও ডিজাইন (Identity)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Worker (কারিগর)</label>
                                            <select className="w-full h-12 md:h-16 bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] px-4 md:px-6 border border-slate-100 italic focus:border-black outline-none text-xs md:text-sm" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                                                <option value="">Select Worker</option>
                                                {(masterData.workerCategories?.pata || []).map(w => <option key={w} value={w}>{w}</option>)}
                                                <option value="Manual/Owner">Manual/Owner</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Design (ডিজাইন)</label>
                                            <select className="w-full h-12 md:h-16 bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] px-4 md:px-6 border border-slate-100 italic focus:border-black outline-none text-xs md:text-sm" value={entryData.design} onChange={(e) => setEntryData(p => ({ ...p, design: e.target.value }))}>
                                                <option value="">Select Design</option>
                                                {masterData.designs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Pata Type</label>
                                            <select className="w-full h-12 md:h-16 bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] px-4 md:px-6 border border-slate-100 italic focus:border-black outline-none text-xs md:text-sm" value={entryData.pataType} onChange={(e) => setEntryData(p => ({ ...p, pataType: e.target.value }))}>
                                                {(masterData.pataTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Date (তারিখ)</label>
                                            <input type="date" className="w-full h-12 md:h-16 bg-black text-white rounded-[1.2rem] md:rounded-[2rem] px-4 md:px-6 border-none italic outline-none text-xs md:text-sm" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-600 ml-4 font-black">Color & Lot</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <select className="h-12 md:h-16 bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] px-4 border border-slate-100 italic focus:border-black outline-none text-xs md:text-sm" value={entryData.color} onChange={(e) => setEntryData(p => ({ ...p, color: e.target.value }))}>
                                                    <option value="">Select Color</option>
                                                    {masterData.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input list="pata-lots" className="h-12 md:h-16 bg-slate-50 rounded-[1.2rem] md:rounded-[2rem] px-4 border border-slate-100 italic focus:border-black outline-none text-xs md:text-sm" placeholder="Lot No..." value={entryData.lotNo} onChange={(e) => setEntryData(p => ({ ...p, lotNo: e.target.value }))} />
                                                <datalist id="pata-lots">
                                                    {(masterData.cuttingStock || []).map(c => <option key={c.id} value={c.lotNo}>{c.design} - {c.color}</option>)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-4 md:p-6 rounded-[2rem] border border-slate-100 flex items-center justify-around shadow-inner">
                                            <div className="text-center">
                                                <label className="text-[8px] md:text-[10px] text-black block mb-2 font-black">PATA QTY</label>
                                                <input type="number" className="w-full text-center text-2xl md:text-4xl bg-transparent outline-none font-black italic text-black" placeholder="0" value={entryData.pataQty} onChange={(e) => setEntryData(p => ({ ...p, pataQty: e.target.value }))} />
                                            </div>
                                            <div className="text-center">
                                                <label className="text-[8px] md:text-[10px] text-amber-600 block mb-2 font-black">STONE PKT</label>
                                                <input type="number" className="w-full text-center text-2xl md:text-4xl bg-transparent outline-none font-black italic text-amber-600" placeholder="0" value={entryData.stonePackets} onChange={(e) => setEntryData(p => ({ ...p, stonePackets: e.target.value }))} />
                                            </div>
                                            <div className="text-center">
                                                <label className="text-[8px] md:text-[10px] text-indigo-600 block mb-2 font-black">PAPER ROLL</label>
                                                <input type="number" className="w-full text-center text-2xl md:text-4xl bg-transparent outline-none font-black italic text-indigo-600" placeholder="0" value={entryData.paperRolls} onChange={(e) => setEntryData(p => ({ ...p, paperRolls: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 2: Materials */}
                                <div className="bg-amber-50/30 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 border-amber-50 space-y-4 md:space-y-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-1.5 h-4 md:h-6 bg-amber-500 rounded-full"></div>
                                        <h4 className="text-sm md:text-base font-black uppercase tracking-widest text-amber-600">২. কাঁচামাল প্রদান (Materials Issue)</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div className="bg-white p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border-2 border-slate-50 relative group overflow-hidden shadow-sm">
                                            <label className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-2 md:mb-3 block">পাথর প্যাকেট (Stone Packet)</label>
                                            <div className="flex items-end gap-2">
                                                <input type="number" className="bg-transparent text-3xl md:text-5xl font-black text-black w-full outline-none italic placeholder:text-slate-100" placeholder="0" value={entryData.stonePackets} onChange={(e) => setEntryData(p => ({ ...p, stonePackets: e.target.value }))} />
                                                <span className="text-sm md:text-lg font-black text-slate-400 mb-1 md:mb-2 italic uppercase">Pkt</span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border-2 border-slate-50 relative group overflow-hidden shadow-sm">
                                            <label className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-2 md:mb-3 block">পেপার রোল (Paper Roll)</label>
                                            <div className="flex items-end gap-2">
                                                <input type="number" className="bg-transparent text-3xl md:text-5xl font-black text-black w-full outline-none italic placeholder:text-slate-100" placeholder="0" value={entryData.paperRolls} onChange={(e) => setEntryData(p => ({ ...p, paperRolls: e.target.value }))} />
                                                <span className="text-sm md:text-lg font-black text-slate-400 mb-1 md:mb-2 italic uppercase">Roll</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 3: Final Quantity */}
                                <div className="bg-black p-6 md:p-8 rounded-[2rem] shadow-xl text-center space-y-4 md:space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                                        <div className="absolute top-4 left-4"><Grid size={60} /></div>
                                        <div className="absolute bottom-4 right-4"><Grid size={60} /></div>
                                    </div>
                                    <label className="text-[10px] md:text-sm font-black text-amber-500 uppercase tracking-[0.2em] md:tracking-[0.5em] italic">৩. মোট পরিমাণ দিন (Total Quantity)</label>
                                    <div className="relative">
                                        <input type="number" className="w-full text-center text-4xl md:text-7xl font-black bg-transparent border-none outline-none leading-none h-[8vh] md:h-[12vh] text-white placeholder:text-zinc-800" placeholder="0" value={entryData.pataQty} onChange={(e) => setEntryData(p => ({ ...p, pataQty: e.target.value }))} />
                                        <div className="text-zinc-700 text-[10px] md:text-sm font-black uppercase tracking-widest mt-1 md:mt-2">Total Pieces (পিস)</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 border-t border-slate-100 bg-gray-50 flex flex-col md:flex-row gap-3 md:gap-4 flex-shrink-0">
                                <button onClick={() => setShowModal(false)} className="py-3 md:py-4 bg-white border border-slate-200 rounded-full font-black text-xs uppercase text-slate-600 hover:text-black transition-all order-3 md:order-1 flex-1 shadow-sm">Cancel</button>
                                <button onClick={() => handleSaveIssue(false)} className="py-3 md:py-4 bg-amber-500 text-white rounded-full font-black text-sm md:text-lg uppercase tracking-[0.1em] shadow-lg hover:scale-[1.01] transition-all order-1 md:order-2 flex-[2]">
                                    CONFIRM ONLY
                                </button>
                                <button onClick={() => handleSaveIssue(true)} className="py-3 md:py-4 bg-indigo-600 text-white rounded-full font-black text-sm md:text-lg uppercase tracking-[0.1em] shadow-lg hover:bg-black transition-all order-2 md:order-3 flex-1 flex items-center justify-center gap-2">
                                    <Printer size={16} /> & PRINT
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                receiveModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-3 md:p-4 italic">
                        <div className="bg-white rounded-[2rem] w-full max-w-sm border-2 border-slate-50 shadow-3xl animate-fade-up p-5 space-y-4 md:space-y-6 text-black">
                            <div className="text-center">
                                <h3 className="text-2xl font-black uppercase italic mb-1">পাতা কাজ জমা</h3>
                                <p className="text-sm font-black text-slate-600 uppercase italic">কারিগর: {receiveModal.worker}</p>
                            </div>
                            <form onSubmit={handleReceive} className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-[2rem] text-center shadow-inner border border-slate-100">
                                    <label className="text-[8px] text-slate-600 font-black uppercase mb-2 block tracking-widest">Received Quantity (PCS)</label>
                                    <input name="rQty" type="number" defaultValue={receiveModal.pataQty} className="w-full text-center text-4xl font-black bg-transparent border-none text-black outline-none leading-none h-20" autoFocus />
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center block">Date (তারিখ)</label>
                                    <input name="receiveDate" type="date" className="w-full py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-black italic px-4 text-center" value={receiveModal.receiveDate || new Date().toISOString().split('T')[0]} onChange={(e) => setReceiveModal({ ...receiveModal, receiveDate: e.target.value })} />
                                </div>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <button type="button" onClick={() => setReceiveModal(null)} className="flex-1 py-4 bg-slate-50 text-slate-600 font-black text-xs uppercase rounded-full hover:text-black transition-all">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 bg-black text-white font-black text-xs uppercase rounded-full shadow-xl border-b-[4px] border-zinc-900 transition-all">জমা নিন (Only)</button>
                                    <button name="print" type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase rounded-full shadow-xl border-b-[4px] border-indigo-900 transition-all flex items-center justify-center gap-2">
                                        <Printer size={16} /> জমা ও প্রিন্ট
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                showManualModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-center justify-center p-3 md:p-4 text-black italic">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg border-2 border-amber-500 shadow-3xl p-6 md:p-8 space-y-6 animate-fade-up overflow-y-auto max-h-[96vh]">
                            <div className="text-center space-y-1">
                                <div className="mx-auto w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3 mb-2">
                                    <Box size={20} />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic">Direct Stock In</h3>
                                <p className="text-[8px] font-black text-slate-600 tracking-[0.2em] uppercase italic">সরাসরি পাতা স্টক যোগ করুন</p>
                            </div>

                            <form onSubmit={handleManualStockIn} className="space-y-6 italic">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 ml-2">DESIGN (ডিজাইন)</label>
                                        <select className="w-full h-12 bg-slate-50 border border-slate-100 rounded-[1rem] px-4 font-black text-xs uppercase" value={manualForm.design} onChange={e => setManualForm(p => ({ ...p, design: e.target.value }))}>
                                            <option value="">SELECT DESIGN</option>
                                            {masterData.designs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 ml-2">COLOR (কালার)</label>
                                        <select className="w-full h-12 bg-slate-50 border border-slate-100 rounded-[1rem] px-4 font-black text-xs uppercase" value={manualForm.color} onChange={e => setManualForm(p => ({ ...p, color: e.target.value }))}>
                                            <option value="">SELECT COLOR</option>
                                            {masterData.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 ml-2">DATE (তারিখ)</label>
                                        <input type="date" className="w-full h-12 bg-black text-white rounded-[1rem] px-4 font-black text-xs border-none outline-none" value={manualForm.date} onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 text-center">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Quantity (পাক্কা পাতা পিস)</label>
                                    <input type="number" className="w-full text-center text-4xl font-black bg-transparent border-none outline-none leading-none h-20" placeholder="0" value={manualForm.qty} onChange={e => setManualForm(p => ({ ...p, qty: e.target.value }))} autoFocus />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowManualModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-full font-black text-xs uppercase">Cancel</button>
                                    <button type="submit" className="flex-[2] py-4 bg-amber-500 text-white rounded-full font-black uppercase text-sm shadow-lg border-b-[6px] border-amber-900 active:scale-95 transition-all">ADD TO STOCK</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                editPataModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-start md:items-center justify-center p-2 md:p-4 text-black italic">
                        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] w-full max-w-2xl border-2 border-amber-500 shadow-3xl p-5 md:p-8 space-y-6 animate-fade-up max-h-[96vh] overflow-y-auto italic font-outfit my-auto">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-500 text-white rounded-[1rem] shadow-lg rotate-2">
                                        <Settings size={20} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Pata <span className="text-amber-500">Override</span></h3>
                                </div>
                                <button onClick={() => setEditPataModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={18} /></button>
                            </div>

                            <form onSubmit={handleEditPataSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 font-black uppercase italic">
                                <div className="space-y-2">
                                    <label className="text-[8px] md:text-[10px] text-slate-600 ml-2">Worker (কারিগর)</label>
                                    <select name="worker" defaultValue={editPataModal.worker} className="w-full h-12 bg-slate-50 rounded-[1rem] px-4 border border-slate-100 italic focus:border-amber-500 outline-none text-xs md:text-sm">
                                        {(masterData.workerCategories?.pata || []).map(w => <option key={w} value={w}>{w}</option>)}
                                        <option value="Manual/Owner">Manual/Owner</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] md:text-[10px] text-slate-600 ml-2">Design (ডিজাইন)</label>
                                    <select name="design" defaultValue={editPataModal.design} className="w-full h-12 bg-slate-50 rounded-[1rem] px-4 border border-slate-100 italic focus:border-amber-500 outline-none text-xs md:text-sm">
                                        {masterData.designs.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] md:text-[10px] text-slate-600 ml-2">Color & Lot</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select name="color" defaultValue={editPataModal.color} className="h-12 bg-slate-50 rounded-[1rem] px-3 border border-slate-100 italic focus:border-amber-500 outline-none text-xs">
                                            {masterData.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <input name="lotNo" defaultValue={editPataModal.lotNo} list="pata-lots" className="h-12 bg-slate-50 rounded-[1rem] px-3 border border-slate-100 italic focus:border-amber-500 outline-none text-xs" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] md:text-[10px] text-slate-600 ml-2">Status & Date</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select name="status" defaultValue={editPataModal.status} className="h-12 bg-black text-white rounded-[1rem] px-3 italic focus:ring-2 ring-amber-500/20 outline-none text-xs">
                                            <option value="Pending">PENDING</option>
                                            <option value="Received">RECEIVED</option>
                                        </select>
                                        <input name="date" type="date" defaultValue={editPataModal.date ? new Date(editPataModal.date.split('/').reverse().join('-')).toISOString().split('T')[0] : ''} className="h-12 bg-slate-50 rounded-[1rem] px-3 border border-slate-100 italic focus:border-amber-500 outline-none text-xs" />
                                    </div>
                                </div>

                                <div className="md:col-span-2 bg-slate-50 p-4 md:p-6 rounded-[1.5rem] border border-slate-100 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <label className="text-[8px] text-amber-600 block mb-1 lg:text-[10px]">PATA QTY</label>
                                        <input name="qty" type="number" defaultValue={editPataModal.pataQty} className="w-full text-center text-2xl lg:text-3xl bg-transparent outline-none font-black italic" />
                                    </div>
                                    <div className="text-center">
                                        <label className="text-[8px] text-amber-600 block mb-1 lg:text-[10px]">STONE PKT</label>
                                        <input name="stone" type="number" defaultValue={editPataModal.stonePackets} className="w-full text-center text-2xl lg:text-3xl bg-transparent outline-none font-black italic" />
                                    </div>
                                    <div className="text-center">
                                        <label className="text-[8px] text-amber-600 block mb-1 lg:text-[10px]">PAPER ROLL</label>
                                        <input name="roll" type="number" defaultValue={editPataModal.paperRolls} className="w-full text-center text-2xl lg:text-3xl bg-transparent outline-none font-black italic" />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[8px] md:text-[10px] text-slate-600 ml-2">Special Note</label>
                                    <textarea name="note" defaultValue={editPataModal.note} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[1rem] p-3 md:p-4 italic outline-none mt-1 focus:border-amber-500 text-xs" />
                                </div>

                                <button type="submit" className="md:col-span-2 py-4 md:py-5 bg-amber-500 text-white rounded-full font-black text-sm md:text-lg uppercase tracking-[0.1em] shadow-lg border-b-[6px] md:border-b-[8px] border-amber-900 active:scale-95 transition-all">SAVE ADMIN OVERRIDE</button>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                payModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 italic">
                        <div className="bg-white rounded-[2rem] w-full max-w-sm border-2 border-slate-50 shadow-3xl overflow-hidden p-6 md:p-8 space-y-6 animate-fade-up text-black">
                            <div className="text-center">
                                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-black leading-none mb-2">বেতন প্রদান</h3>
                                <p className="text-xs md:text-sm font-black text-slate-600 italic uppercase tracking-widest">{payModal}</p>
                            </div>
                            <form onSubmit={handleConfirmPayment} className="space-y-6 italic">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center block">তারিখ</label>
                                            <input name="date" type="date" className="w-full py-3 bg-slate-50 border-none rounded-[1rem] text-[10px] font-black italic px-4" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center block">টাকার পরিমাণ</label>
                                            <input name="amount" type="number" className="w-full py-3 bg-black text-white border-none rounded-[1rem] text-lg font-black italic px-4 text-center shadow-lg" placeholder="৳" required autoFocus />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2 block italic">রিমার্কস (ঐচ্ছিক)</label>
                                        <input name="note" className="w-full py-3 text-[10px] font-black bg-slate-50 border-slate-100 text-black placeholder:text-slate-400 italic uppercase px-4 rounded-[1rem] border-none" placeholder="পেমেন্ট নোট লিখুন..." />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-4 rounded-full font-black text-[10px] uppercase bg-slate-50 text-slate-600 border border-slate-100 hover:text-black transition-all">বাতিল</button>
                                    <button type="submit" className="flex-[2] py-4 rounded-full font-black text-[10px] uppercase bg-black text-white shadow-xl border-b-[4px] border-zinc-900 hover:scale-105 transition-all">পেমেন্ট নিশ্চিত করুন</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                ledgerModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 text-black font-outfit">
                        <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2rem] border-2 border-slate-50 shadow-3xl italic flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">কাজের বিবরণ ও <span className="text-slate-500">লেজার</span></h3>
                                    <p className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">কারিগর: {ledgerModal}</p>
                                </div>
                                <button onClick={() => setLedgerModal(null)} className="p-3 bg-white border border-slate-100 hover:bg-black hover:text-white rounded-xl transition-all shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-black border-l-4 border-black pl-3">কাজের রিপোর্ট (Production)</h4>
                                        <div className="space-y-3">
                                            {(masterData.pataEntries || []).filter(p => p.worker === ledgerModal && p.status === 'Received').map((p, i) => (
                                                <div key={i} className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-lg transition-all group">
                                                    <div>
                                                        <p className="font-black text-sm uppercase leading-none mb-1">{p.design} <span className="text-[8px] text-slate-500 ml-1">#{p.lotNo}</span></p>
                                                        <p className="text-[8px] text-slate-600 uppercase font-black">{p.receiveDate || p.date}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black italic text-lg text-black">{p.receivedQty || p.pataQty} Pcs</p>
                                                        <p className="text-[8px] text-slate-600 uppercase font-black">Amount: ৳{p.amount || 0}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 border-l-4 border-amber-500 pl-3">পেমেন্ট ইতিহাস (Payments)</h4>
                                        <div className="space-y-3">
                                            {(masterData.workerPayments || []).filter(p => p.worker === ledgerModal && p.dept === 'pata').map((p, i) => (
                                                <div key={i} className="bg-amber-50/30 p-4 rounded-[1.5rem] border border-amber-50 flex justify-between items-center hover:bg-white hover:shadow-lg transition-all">
                                                    <div>
                                                        <p className="font-black text-sm uppercase leading-none mb-1 text-amber-700">Payment</p>
                                                        <p className="text-[8px] text-amber-400 uppercase font-black">{p.date}</p>
                                                        {p.note && <p className="text-[8px] text-amber-300 italic mt-1 leading-tight uppercase">{p.note}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black italic text-lg text-amber-600">৳{p.amount}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">মোট পাওনা ব্যালেন্স (Available)</p>
                                    <p className="text-3xl md:text-4xl font-black italic tracking-tighter text-black leading-none mt-1">৳{getWorkerDue(ledgerModal).toLocaleString()}</p>
                                </div>
                                <button onClick={() => { setLedgerModal(null); setPayModal(ledgerModal); }} className="px-6 py-3 md:px-8 md:py-4 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                                    টাকা পরিশোধ করুন
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Back Button Bottom */}
            <div className="pt-20 pb-10 flex justify-center">
                <button
                    onClick={() => setActivePanel('Overview')}
                    className="group relative flex items-center gap-6 bg-white px-12 py-6 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
                >
                    <div className="p-3 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
                        <ArrowLeft size={20} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-widest text-black">ড্যাশবোর্ডে ফিরে যান</span>
                    <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );
};

export default PataFactoryPanel;
