import React, { useState } from 'react';
import { Card, Row, Col, Typography, Divider, QRCode, Tag, ConfigProvider } from 'antd';
const { Title, Text } = Typography;

const QR_Slip_Theme = {
  token: { fontFamily: 'Inter, sans-serif', borderRadius: 8, fontSize: 12, colorTextBase: '#000000' },
  components: { Card: { paddingLG: 16 }, Typography: { fontSizeHeading4: 18, fontSizeHeading5: 14 } }
};

import { ExternalLink, Plus, Trash2, CheckCircle, Clock, DollarSign, X, Search, Printer, MessageSquare, ArrowLeft, CheckCircle2, Archive, Scissors } from 'lucide-react';
import { syncToSheet } from '../../utils/syncUtils';
import logoWhite from '../../assets/logo_white.png';
import logoBlack from '../../assets/logo_black.png';

const OutsideWorkPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, t }) => {
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('active'); // 'active' or 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [payModal, setPayModal] = useState(null);
    const [receiveModal, setReceiveModal] = useState(null);
    const [noteModal, setNoteModal] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [printSlip, setPrintSlip] = useState(null);
    const [editModal, setEditModal] = useState(null);

    const isAdmin = user?.role === 'admin';
    const isWorker = user?.role !== 'admin' && user?.role !== 'manager';

    const [entryData, setEntryData] = useState({
        worker: '',
        task: '',
        borkaQty: '',
        hijabQty: '',
        rate: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSaveIssue = (shouldPrint) => {
        if (!entryData.worker || !entryData.task || (!entryData.borkaQty && !entryData.hijabQty)) {
            return showNotify('কারিগর, কাজ এবং পরিমাণ আবশ্যক!', 'error');
        }

        const newEntry = {
            id: Date.now() + Math.random(),
            date: entryData.date ? new Date(entryData.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            worker: entryData.worker,
            task: entryData.task,
            borkaQty: Number(entryData.borkaQty || 0),
            hijabQty: Number(entryData.hijabQty || 0),
            rate: Number(entryData.rate || 0),
            note: entryData.note,
            status: 'Pending',
            receivedDate: null,
            totalAmount: 0,
            paidAmount: 0
        };

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: [newEntry, ...(prev.outsideWorkEntries || [])]
        }));

        syncToSheet({
            type: "OUTSIDE_ISSUE",
            worker: newEntry.worker,
            detail: `${newEntry.task} - B:${newEntry.borkaQty} H:${newEntry.hijabQty}`,
            amount: 0
        });

        if (shouldPrint) {
            setPrintSlip(newEntry);
        }
        setShowModal(false);
        setEntryData({ worker: '', task: '', borkaQty: '', hijabQty: '', rate: '', note: '', date: new Date().toISOString().split('T')[0] });
        showNotify('বাইরের কাজ সফলভাবে ইস্যু হয়েছে!');
    };

    const handleReceive = (item) => {
        setReceiveModal({ ...item, rBorkaQty: item.borkaQty, rHijabQty: item.hijabQty, receiveDate: new Date().toISOString().split('T')[0] });
    };

    const handleConfirmReceive = (e) => {
        e.preventDefault();
        const rBorka = Number(receiveModal.rBorkaQty) || 0;
        const rHijab = Number(receiveModal.rHijabQty) || 0;
        const totalAmount = (rBorka + rHijab) * Number(receiveModal.rate);

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(entry => entry.id === receiveModal.id ? {
                ...entry,
                borkaQty: rBorka,
                hijabQty: rHijab,
                status: 'Received',
                receivedDate: receiveModal.receiveDate ? new Date(receiveModal.receiveDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                totalAmount: totalAmount
            } : entry)
        }));

        const updatedItem = {
            ...receiveModal,
            borkaQty: rBorka,
            hijabQty: rHijab,
            status: 'Received',
            receivedDate: receiveModal.receiveDate ? new Date(receiveModal.receiveDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            totalAmount: totalAmount
        };

        syncToSheet({
            type: "OUTSIDE_RECEIVE",
            worker: receiveModal.worker,
            detail: `${receiveModal.task} Received - B:${rBorka} H:${rHijab} Total: ${totalAmount}`,
            amount: totalAmount
        });

        setReceiveModal(null);
        showNotify('কাজ জমা নেওয়া হয়েছে ও বিল জেনারেট হয়েছে!');
        
        if (e.nativeEvent.submitter?.name === 'print') {
            setPrintSlip(updatedItem);
        }
    };

    const handleSaveNote = () => {
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(e => e.id === noteModal.id ? {
                ...e,
                note: noteModal.note
            } : e)
        }));
        setNoteModal(null);
        showNotify('নোট যুক্ত করা হয়েছে!');
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        const f = e.target;
        const updated = {
            ...editModal,
            worker: f.worker.value,
            task: f.task.value,
            borkaQty: Number(f.borka.value),
            hijabQty: Number(f.hijab.value),
            rate: Number(f.rate.value),
            note: f.note.value,
            status: f.status.value,
            date: f.date.value
        };
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: (prev.outsideWorkEntries || []).map(p => p.id === updated.id ? updated : p)
        }));
        setEditModal(null);
        showNotify('কাজ তথ্য আপডেট করা হয়েছে!');
    };

    const handlePayment = () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) return;

        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: prev.outsideWorkEntries.map(e => e.id === payModal.id ? {
                ...e,
                paidAmount: Number(e.paidAmount || 0) + Number(paymentAmount)
            } : e)
        }));

        syncToSheet({
            type: "OUTSIDE_PAYMENT",
            worker: payModal.worker,
            date: paymentDate ? new Date(paymentDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            detail: `Payment for ${payModal.task}`,
            amount: Number(paymentAmount)
        });

        setPayModal(null);
        setPaymentAmount('');
        showNotify('পেমেন্ট সফলভাবে রেকর্ড হয়েছে!');
    };

    const handleDelete = (id) => {
        if (!isAdmin) return showNotify('শুধুমাত্র এডমিন ডিলিট করতে পারবেন!', 'error');
        if (!window.confirm('মুছে ফেলতে চান?')) return;
        setMasterData(prev => ({
            ...prev,
            outsideWorkEntries: (prev.outsideWorkEntries || []).filter(item => item.id !== id)
        }));
        showNotify('এন্ট্রি মুছে ফেলা হয়েছে!');
    };

    const filteredEntries = (masterData.outsideWorkEntries || []).filter(e => {
        if (isWorker && e.worker?.toLowerCase() !== user?.name?.toLowerCase()) return false;
        return (e.worker?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (e.task?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    });

    const activeEntries = filteredEntries.filter(e => e.status === 'Pending');
    const historyEntries = filteredEntries.filter(e => e.status === 'Received');

    if (printSlip) {
        const SlipCard = ({ copyTitle }) => {
            return (
            <ConfigProvider theme={QR_Slip_Theme}>
                <div style={{ minHeight: '140mm' }} className="w-full flex-1 border-[6px] border-black bg-white relative overflow-hidden flex text-black">
                    <div className="w-20 bg-white border-r-[3px] border-black flex flex-col items-center justify-between py-8 shrink-0">
                        <img src={logoBlack} alt="NRZO0NE" className="w-12 h-12 object-contain" />
                        <div className="rotate-[-90deg] whitespace-nowrap">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black">NRZO0NE OUTSOURCE UNIT</p>
                        </div>
                        <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-black animate-pulse"></div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 relative flex flex-col items-center justify-center bg-white">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
                            <img src={logoBlack} alt="" className="w-80 h-80 object-contain" />
                        </div>
                        
                        <Card 
                            style={{ width: '100%', height: '100%', border: '2px solid #000', borderRadius: '12px', display: 'flex', flexDirection: 'column', zIndex: 10, position: 'relative' }}
                            bodyStyle={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}
                            hoverable={false}
                        >
                            <Row justify="space-between" align="middle">
                                <Col>
                                    <Title level={4} style={{ margin: 0, letterSpacing: '1px', fontStyle: 'italic', fontWeight: '900' }}>NRZO0NE</Title>
                                    <Text type="secondary" style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>OUTSOURCE OPERATIONS UNIT</Text>
                                </Col>
                                <Col style={{ textAlign: 'right' }}>
                                    <Tag color="black" style={{ margin: 0, fontWeight: 'bold' }}>{copyTitle}</Tag>
                                    <br />
                                    <Text strong style={{ fontSize: '12px', display: 'inline-block', marginTop: '4px' }}>{printSlip.date}</Text>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '14px 0', borderBlockStart: '2px solid #000' }} />

                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                                        <Text type="secondary" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>CONTRACTOR / কারিগর</Text>
                                        <Title level={4} style={{ margin: '4px 0 0 0', fontStyle: 'italic', textTransform: 'uppercase' }}>{printSlip.worker}</Title>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '2px solid #000' }}>
                                        <Text style={{ fontSize: '9px', color: '#000', letterSpacing: '1px', fontWeight: 'bold' }}>TASK / কাজের ধরন</Text>
                                        <Title level={4} style={{ margin: '4px 0 0 0', color: '#000', fontStyle: 'italic', textTransform: 'uppercase', fontWeight: '900' }}>{printSlip.task}</Title>
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16} style={{ marginTop: '16px', flex: 1 }}>
                                <Col span={12}>
                                    <Card style={{ textAlign: 'center', border: '2px dashed #000', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bodyStyle={{ padding: '24px' }}>
                                        <Text style={{ fontSize: '12px', color: '#000', fontWeight: 'bold', letterSpacing: '2px' }}>BORKA QTY</Text>
                                        <Title level={1} style={{ margin: '8px 0 0 0', color: '#f5222d', fontStyle: 'italic', fontSize: '56px', fontWeight: '900' }}>{printSlip.borkaQty || 0}</Title>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card style={{ textAlign: 'center', border: '2px dashed #000', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bodyStyle={{ padding: '24px' }}>
                                        <Text style={{ fontSize: '12px', color: '#000', fontWeight: 'bold', letterSpacing: '2px' }}>HIJAB QTY</Text>
                                        <Title level={1} style={{ margin: '8px 0 0 0', color: '#1d39c4', fontStyle: 'italic', fontSize: '56px', fontWeight: '900' }}>{printSlip.hijabQty || 0}</Title>
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
                                    <Text type="secondary" style={{ fontSize: '9px' }}>Generated by NRZO0NE OUTSOURCE UNIT • ID: {printSlip.id}</Text>
                                </Col>
                            </Row>
                        </Card>
                    </div>
                </div>
            </ConfigProvider>
            );
        };

        return (
            <div className="min-h-screen bg-white text-black italic font-outfit py-10 print:py-0 print:bg-white text-black italic">
                <style>{`
                    @media print { 
                        .no-print { display: none !important; } 
                        body { background: white !important; margin: 0; padding: 0; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        @page { size: A4 portrait; margin: 0; }
                    }
                `}</style>
                <div className="no-print flex justify-between items-center mb-6 w-[210mm] mx-auto bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-black font-black">
                    <button onClick={() => setPrintSlip(null)} className="bg-slate-50 text-slate-600 px-10 py-5 uppercase text-xs rounded-full hover:bg-black hover:text-white transition-all">Cancel</button>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">A4 Optimized Bundle (2x A5)</p>
                    <button onClick={() => window.print()} className="bg-black text-white px-10 py-5 rounded-full uppercase text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                        <Printer size={18} /> Print Job
                    </button>
                </div>
                
                <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-2xl flex flex-col print:w-full print:h-[100vh] print:shadow-none box-border">
                    <SlipCard copyTitle="RECIPIENT COPY" />
                    
                    {/* Stylized cut line */}
                    <div className="w-full border-t-[6px] border-dashed border-slate-200 relative flex justify-center py-0 shrink-0 select-none items-center h-12">
                        <div className="absolute inset-0 bg-slate-50/50"></div>
                        <span className="relative z-10 bg-white px-6 py-2 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 border-2 border-slate-100 rounded-full shadow-sm flex items-center gap-3">
                            <Scissors size={14} className="text-slate-300" /> Cut Here • এখান থেকে কাটুন
                        </span>
                    </div>

                    <SlipCard copyTitle="OFFICE COPY" />
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
                Outside <span className="text-slate-400">Work</span>
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">
               External Operations Unit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Pending Tasks</p>
            <p className="text-2xl font-black italic text-black leading-none uppercase">
                {activeEntries.length} <span className="text-[10px] text-slate-300 ml-1">Nodes</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-10">
        {['new', 'active', 'history', (isAdmin || isManager) && 'payments'].filter(Boolean).map(v => (
          <button
            key={v}
            onClick={() => {
                if (v === 'new') setShowModal(true);
                else setView(v);
            }}
            className={`pill-tab flex-1 whitespace-nowrap min-w-[100px] ${view === v ? "pill-tab-active" : "pill-tab-inactive hover:text-black"}`}
          >
            {v === 'new' ? 'নতুন কাজ' : v === 'active' ? 'চলমান' : v === 'history' ? 'পুরাতন' : 'লেজার ও পেমেন্ট'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="relative group mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="সার্চ কারিগর বা কাজের বিবরণ..."
              className="form-input pl-16 py-5 text-base border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="space-y-4">
            {(view === 'active' ? activeEntries : historyEntries).length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-40">
                    <ExternalLink size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Zero External Nodes</p>
                </div>
            ) : (
                (view === 'active' ? activeEntries : historyEntries).map((item, idx) => (
                    <div key={item.id || idx} className="item-card flex flex-col md:flex-row justify-between items-center gap-8 group">
                        <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                            <div className={`w-14 h-14 bg-slate-50 flex items-center justify-center text-3xl font-black italic rounded-xl border border-slate-100 shadow-inner group-hover:bg-black group-hover:text-white transition-all transform group-hover:-rotate-6 ${item.status === 'Pending' ? 'border-amber-200' : 'border-emerald-200'}`}>
                                {item.status === 'Pending' ? <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" /> : <div className="w-4 h-4 rounded-full bg-emerald-500" />}
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-4">
                                    <h4 className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">
                                        • {item.worker}
                                    </h4>
                                    <span className="badge-standard">External</span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase italic tracking-widest">
                                    <span className="text-rose-500">• {item.task}</span>
                                    <span>• {item.date}</span>
                                    {item.status === 'Received' && <span className="text-emerald-500 border-l border-slate-100 pl-4 ml-2">• REC: {item.receivedDate}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-500">Rate: ৳{item.rate}</span>
                                    {item.note && <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 italic bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Note: {item.note}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-12 w-full md:w-auto justify-between border-t md:border-t-0 pt-6 md:pt-0">
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Borka</p>
                                    <p className="text-3xl font-black italic tracking-tighter leading-none">{item.borkaQty}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Hijab</p>
                                    <p className="text-3xl font-black italic tracking-tighter leading-none">{item.hijabQty}</p>
                                </div>
                                {item.status === 'Received' && (
                                    <div className="text-center border-l border-slate-100 pl-8">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Balance</p>
                                        <p className="text-3xl font-black italic tracking-tighter leading-none text-emerald-600">৳{(item.totalAmount - (item.paidAmount || 0)).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 items-center">
                                {item.status === 'Pending' ? (
                                    <>
                                        <button onClick={() => setPrintSlip(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all shadow-sm">
                                            <Printer size={18} />
                                        </button>
                                        <button onClick={() => handleReceive(item)} className="black-button px-6">জমা নিন (REC)</button>
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditModal(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                                    <Settings size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setPrintSlip(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-black hover:text-white transition-all shadow-sm">
                                            <Printer size={18} />
                                        </button>
                                        <button onClick={() => setPayModal(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                            <DollarSign size={18} />
                                        </button>
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditModal(item)} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
                                                    <Settings size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-start md:items-center justify-center p-2 md:p-4 italic overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] md:rounded-[5rem] w-full max-w-4xl border-4 border-black shadow-3xl animate-fade-up my-auto flex flex-col text-black h-auto">
                        <div className="p-10 border-b-2 border-slate-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-black uppercase text-4xl tracking-tighter">Baire Kaj Deoya (Issue)</h3>
                            <button onClick={() => setShowModal(false)} className="p-4 bg-white border-2 border-slate-100 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"><X size={24} /></button>
                        </div>

                        <div className="p-12 space-y-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest ml-4">Worker / Karigor</label>
                                    <select className="form-input text-xl font-black border-2 border-slate-100 rounded-[2rem] bg-gray-50 h-16 w-full px-6" value={entryData.worker} onChange={(e) => setEntryData(p => ({ ...p, worker: e.target.value }))}>
                                        <option value="">Select Worker</option>
                                        {(masterData.outsideWorkers || []).map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest ml-4">Work / Task Type</label>
                                    <select className="form-input text-xl font-black border-2 border-slate-100 rounded-[2rem] bg-gray-50 h-16 w-full px-6" value={entryData.task} onChange={(e) => setEntryData(p => ({ ...p, task: e.target.value }))}>
                                        <option value="">Select Task</option>
                                        {(masterData.outsideTasks || []).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest ml-4">Issue Date</label>
                                    <input type="date" className="w-full h-16 bg-black text-white rounded-[2rem] px-8 border-none font-black text-xl outline-none focus:ring-4 focus:ring-black/20" value={entryData.date} onChange={(e) => setEntryData(p => ({ ...p, date: e.target.value }))} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                                    <label className="text-[10px] font-black text-slate-600 uppercase block mb-2">Borka (PCS)</label>
                                    <input type="number" className="w-full bg-transparent text-4xl font-black outline-none italic" placeholder="0" value={entryData.borkaQty} onChange={(e) => setEntryData(p => ({ ...p, borkaQty: e.target.value }))} />
                                </div>
                                <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                                    <label className="text-[10px] font-black text-slate-600 uppercase block mb-2">Hijab (PCS)</label>
                                    <input type="number" className="w-full bg-transparent text-4xl font-black outline-none italic" placeholder="0" value={entryData.hijabQty} onChange={(e) => setEntryData(p => ({ ...p, hijabQty: e.target.value }))} />
                                </div>
                                <div className="bg-black p-8 rounded-[3rem] shadow-2xl">
                                    <label className="text-[10px] font-black text-white/40 uppercase block mb-2">Rate (Per PCS)</label>
                                    <input type="number" className="w-full bg-transparent text-4xl font-black text-white outline-none italic" placeholder="৳0" value={entryData.rate} onChange={(e) => setEntryData(p => ({ ...p, rate: e.target.value }))} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-600 uppercase tracking-widest ml-4">Note (Optional)</label>
                                <input type="text" className="form-input text-xl font-black border-2 border-slate-100 rounded-[2rem] bg-gray-50 h-16 w-full px-8" placeholder="Enter notes..." value={entryData.note} onChange={(e) => setEntryData(p => ({ ...p, note: e.target.value }))} />
                            </div>
                        </div>

                        <div className="p-12 bg-gray-50 flex gap-4">
                            <button onClick={() => handleSaveIssue(false)} className="flex-1 py-10 bg-rose-500 text-white rounded-full font-black text-2xl uppercase tracking-[0.2em] shadow-2xl border-b-[12px] border-rose-900 active:translate-y-2 transition-all">
                                CONFIRM ISSUE
                            </button>
                            <button onClick={() => handleSaveIssue(true)} className="flex-1 py-10 bg-indigo-600 text-white rounded-full font-black text-2xl uppercase tracking-[0.2em] shadow-2xl border-b-[12px] border-indigo-900 active:translate-y-2 transition-all flex items-center justify-center gap-3">
                                <Printer size={32} /> & PRINT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {
                payModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-3 md:p-4">
                        <div className="bg-white rounded-[3rem] md:rounded-[4rem] w-full max-w-md p-6 md:p-12 text-center space-y-6 md:space-y-8 animate-pulse-once">
                            <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-12">
                                <DollarSign size={40} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Pay {payModal.worker}</h3>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">{payModal.task} Bill</p>
                            </div>
                            <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Payment Date</p>
                                    <input type="date" className="w-full text-center text-sm font-black bg-transparent border-none outline-none" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Enter Amount</p>
                                    <input type="number" autoFocus className="w-full text-center text-4xl font-black bg-transparent border-none outline-none tracking-tighter" placeholder="৳0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setPayModal(null)} className="flex-1 py-6 bg-slate-100 rounded-2xl font-black uppercase text-xs">Cancel</button>
                                <button onClick={handlePayment} className="flex-1 py-6 bg-black text-white rounded-2xl font-black uppercase text-xs shadow-xl">Confirm Pay</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                receiveModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-center justify-center p-3 md:p-4 italic">
                        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] w-full max-w-2xl border-4 border-slate-50 shadow-3xl p-6 md:p-10 animate-fade-up">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Receive Work</h3>
                                <button onClick={() => setReceiveModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleConfirmReceive} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center">
                                        <label className="text-[10px] font-black text-slate-600 uppercase block mb-4">Borka Received</label>
                                        <input type="number" className="w-full text-center text-5xl font-black bg-transparent border-none outline-none text-black" value={receiveModal.rBorkaQty} onChange={(e) => setReceiveModal({ ...receiveModal, rBorkaQty: e.target.value })} autoFocus />
                                    </div>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center">
                                        <label className="text-[10px] font-black text-slate-600 uppercase block mb-4">Hijab Received</label>
                                        <input type="number" className="w-full text-center text-5xl font-black bg-transparent border-none outline-none text-black" value={receiveModal.rHijabQty} onChange={(e) => setReceiveModal({ ...receiveModal, rHijabQty: e.target.value })} />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center block">Date (তারিখ)</label>
                                    <input type="date" className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl text-lg font-black italic px-8 text-center outline-none focus:border-black" value={receiveModal.receiveDate} onChange={(e) => setReceiveModal({ ...receiveModal, receiveDate: e.target.value })} />
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" className="flex-[2] py-6 bg-black text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">
                                        CONFIRM RECEIVE
                                    </button>
                                    <button name="print" type="submit" className="flex-1 py-6 bg-indigo-600 text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                        <Printer size={24} /> & PRINT
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                editModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[300] flex items-start md:items-center justify-center p-3 md:p-4 text-black italic">
                        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] w-full max-w-2xl border-4 border-amber-500 shadow-3xl p-6 md:p-10 animate-fade-up max-h-[96vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl rotate-3">
                                        <Settings size={28} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Outside Override</h3>
                                </div>
                                <button onClick={() => setEditModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleEditSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-black uppercase italic">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Worker (কারিগর)</label>
                                    <input name="worker" defaultValue={editModal.worker} className="form-input italic" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Task (কাজের ধরন)</label>
                                    <input name="task" defaultValue={editModal.task} className="form-input italic" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Borka Qty</label>
                                    <input name="borka" type="number" defaultValue={editModal.borkaQty} className="form-input italic" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Hijab Qty</label>
                                    <input name="hijab" type="number" defaultValue={editModal.hijabQty} className="form-input italic" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Rate (মজুরি)</label>
                                    <input name="rate" type="number" defaultValue={editModal.rate} className="form-input italic" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Date (তারিখ)</label>
                                    <input name="date" type="date" defaultValue={editModal.date ? (editModal.date.includes('/') ? editModal.date.split('/').reverse().join('-') : editModal.date) : ''} className="form-input italic" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Status</label>
                                    <select name="status" defaultValue={editModal.status} className="form-input bg-black text-white italic">
                                        <option value="Pending">PENDING</option>
                                        <option value="Received">RECEIVED</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] text-slate-400 ml-4 mb-2 block tracking-widest">Note</label>
                                    <textarea name="note" defaultValue={editModal.note} className="form-input h-24 italic py-4" />
                                </div>
                                <button type="submit" className="md:col-span-2 py-6 bg-amber-500 text-white rounded-full font-black text-xl uppercase tracking-widest shadow-2xl border-b-[8px] border-amber-900 active:scale-95 transition-all">SAVE MODIFICATIONS</button>
                            </form>
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
                    <span className="text-lg font-black uppercase italic tracking-widest text-black">Back to Dashboard</span>
                    <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div >
    );
};

export default OutsideWorkPanel;
