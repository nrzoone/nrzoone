import React from 'react';
import { QRCode, ConfigProvider } from 'antd';
import NRZLogo from './NRZLogo';

const QR_Slip_Theme = {
    token: {
        colorPrimary: '#000000',
        borderRadius: 0,
    },
};

const UniversalSlip = ({ data, type, copyTitle, logoUrl = null }) => {
    // Standardize data mapping
    const date = data.date || data.receiveDate || new Date().toLocaleDateString('en-GB');
    const displayId = data.id || 'N/A';
    const worker = data.worker || data.cutterName || 'N/A';
    
    // Status in Bengali
    const getStatusBN = () => {
        if (type === 'PAYMENT') return 'পেমেন্ট ভাউচার (PAYMENT)';
        if (type === 'ISSUE') return 'কাজের স্লিপ (WORK ISSUE)';
        if (type === 'RECEIVE') return 'জমা স্লিপ (RECEIVE)';
        if (type === 'CUTTING') return 'কাটিং স্লিপ (CUTTING NODE)';
        return 'উৎপাদন নোট (PRODUCTION)';
    };

    const hasSizes = data.sizes && data.sizes.length > 0;

    return (
        <ConfigProvider theme={QR_Slip_Theme}>
            <div className="w-full bg-white flex flex-col relative overflow-hidden border-[8px] border-black p-4 font-outfit text-black uppercase italic" style={{ height: '148.5mm', width: '210mm', pageBreakInside: 'avoid' }}>
                
                {/* Header (Shipping Label Aesthetic) */}
                <div className="flex border-b-[8px] border-black h-36">
                    <div className="w-40 border-r-[8px] border-black flex items-center justify-center bg-black">
                        <NRZLogo size="md" white={true} customUrl={logoUrl} />
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                             <div>
                                <h1 className="text-4xl font-black tracking-tighter leading-none mb-1">NRZOONE FACTORY</h1>
                                <p className="text-[10px] font-black tracking-[0.4em] opacity-50">PREMIUM WOMEN'S CLOTHING</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-2xl font-black tracking-tighter">{date}</p>
                                 <p className="text-[9px] font-black opacity-70">SYST_LOG_v4.2</p>
                             </div>
                         </div>
                         <div className="flex justify-between items-end">
                            <div className="text-xs font-black border-4 border-black px-6 py-1 self-start bg-white">
                                ID: {displayId}
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-slate-400">Security Hash</p>
                                <p className="text-[10px] font-black font-mono">0x{displayId.slice(-6)}F2A</p>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="bg-black text-white text-center py-4 border-b-[8px] border-black">
                    <h2 className="text-5xl font-black tracking-[0.1em]">{getStatusBN()}</h2>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Info */}
                    <div className="flex-1 border-r-[8px] border-black p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-slate-500">কারিগর / RECIPIENT</p>
                                <p className="text-5xl font-black leading-none tracking-tighter">{worker}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[11px] font-black text-slate-500">লট / LOT #</p>
                                <p className="text-4xl font-black tracking-tighter text-black underline decoration-4 underline-offset-8 decoration-black">{data.lotNo || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t-4 border-black">
                            <div className="bg-slate-100 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-slate-500">ডিজাইন / DESIGN</p>
                                <p className="text-3xl font-black tracking-tighter">{data.design || 'GENERAL'}</p>
                            </div>
                            <div className="bg-slate-100 p-4 rounded-xl text-right">
                                <p className="text-[10px] font-black text-slate-500">রঙ / COLOR</p>
                                <p className="text-3xl font-black tracking-tighter">{data.color || 'N/A'}</p>
                            </div>
                        </div>

                        {hasSizes && (
                            <table className="w-full text-left text-[11px] font-black uppercase mt-4 border-t-4 border-black">
                                <thead>
                                    <tr className="bg-black text-white">
                                        <th className="px-2 py-1">SIZE</th>
                                        <th className="px-2 py-1">BORKA</th>
                                        <th className="px-2 py-1">HIJAB</th>
                                        <th className="px-2 py-1">PATA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.sizes.map((s, i) => (
                                        <tr key={i} className="border-b-2 border-black">
                                            <td className="px-2 py-1">{s.size}</td>
                                            <td className="px-2 py-1">{s.borka || '-'}</td>
                                            <td className="px-2 py-1">{s.hijab || '-'}</td>
                                            <td className="px-2 py-1">{s.pataQty || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Right: Large Numbers or QR */}
                    <div className="w-[280px] p-6 flex flex-col items-center justify-between bg-slate-50">
                        <div className="w-full text-center">
                            <p className="text-[11px] font-black uppercase text-slate-400 mb-2 mt-2">Authentic QR</p>
                            <div className="border-[6px] border-black p-2 bg-white shadow-xl">
                                <QRCode 
                                    value={`${window.location.origin}/track?id=${displayId}`} 
                                    size={180} 
                                    bordered={false} 
                                    errorLevel="H"
                                    style={{ padding: 0 }}
                                />
                            </div>
                        </div>
                        
                        <div className="w-full text-center pt-6 border-t-4 border-black/10">
                            <p className="text-[11px] font-black text-slate-500 mb-1">পরিমাণ (TOTAL QTY)</p>
                            <p className="text-7xl font-black leading-none italic tracking-tighter">
                                {data.amount || data.pataQty || (Number(data.issueBorka || 0) + Number(data.issueHijab || 0)) || Number(data.receivedBorka || 0) + Number(data.receivedHijab || 0) || Number(data.receivedQty || 0)}
                            </p>
                            {type === 'PAYMENT' && <p className="text-2xl font-black text-emerald-600 mt-2">টাকা (TAKA)</p>}
                        </div>
                    </div>
                </div>

                {/* Footer Vertical Title */}
                <div className="absolute top-1/2 -right-8 -translate-y-1/2 rotate-90 bg-black text-white px-12 py-1.5 font-black tracking-[0.8em] text-[10px]">
                    {copyTitle === 'WORKER COPY' || copyTitle === 'RECIPIENT COPY' ? 'কারিগর কপি' : 'অফিস কপি'}
                </div>
            </div>
        </ConfigProvider>
    );
};

export default UniversalSlip;
