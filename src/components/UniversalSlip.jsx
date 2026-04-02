import React from 'react';
import { QRCode, ConfigProvider } from 'antd';
import { Hash, Calendar, Settings, User, Box, CreditCard, ChevronRight } from 'lucide-react';
import NRZLogo from './NRZLogo';

const QR_Slip_Theme = {
    token: {
        colorPrimary: '#000000',
        borderRadius: 4,
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
            <div className="w-full bg-white flex flex-col relative overflow-hidden border-[6px] border-black p-4 font-outfit text-black uppercase italic" style={{ height: '148.5mm', width: '210mm' }}>
                
                {/* 1. Header (Shipping Label Style) */}
                <div className="flex border-b-[6px] border-black h-28 overflow-hidden">
                    <div className="w-32 border-r-[6px] border-black flex items-center justify-center bg-black">
                        <NRZLogo size="sm" white={true} customUrl={logoUrl} />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                             <h1 className="text-3xl font-black tracking-tighter leading-none">NRZO0NE FACTORY</h1>
                             <div className="text-right">
                                 <p className="text-lg font-bold tracking-widest">{date}</p>
                                 <p className="text-[9px] font-black opacity-70">SYSTEM v4.0</p>
                             </div>
                         </div>
                         <div className="text-[10px] font-black border-2 border-black px-4 py-0.5 self-start">
                             NODE ID: {displayId}
                         </div>
                    </div>
                </div>

                {/* 2. Main Title (Bengali Bold) */}
                <div className="bg-black text-white text-center py-2 border-b-[6px] border-black">
                    <h2 className="text-4xl font-black tracking-[0.2em]">{getStatusBN()}</h2>
                </div>

                {/* 3. Detail Content Area */}
                <div className="flex-1 flex border-b-[6px] border-black overflow-hidden">
                    {/* Left Info Column */}
                    <div className="flex-1 border-r-[6px] border-black p-4 space-y-4 overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-0.5">কারিগর / RECIPIENT:</p>
                                <p className="text-4xl font-black leading-none">{worker}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-500 mb-0.5">লট / LOT #:</p>
                                <p className="text-3xl font-black">{data.lotNo || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t-2 border-black">
                             <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg mb-4">
                                 <div>
                                     <p className="text-[10px] font-black text-slate-500">ডিজাইন / DESCRIPTION</p>
                                     <p className="text-2xl font-black">{data.design || 'GENERAL PRODUCTION'}</p>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-[10px] font-black text-slate-500">রঙ / COLOR</p>
                                     <p className="text-xl font-black">{data.color || 'N/A'}</p>
                                 </div>
                             </div>

                             {hasSizes && (
                                <div className="border-t-2 border-black pt-2">
                                     <table className="w-full text-left text-[10px] font-black uppercase">
                                         <thead>
                                             <tr className="border-b border-black">
                                                 <th className="py-1">SIZE</th>
                                                 <th className="py-1">BORKA</th>
                                                 <th className="py-1">HIJAB</th>
                                                 <th className="py-1">PATA</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {data.sizes.map((s, i) => (
                                                 <tr key={i} className="border-b border-slate-100">
                                                     <td className="py-1">{s.size}</td>
                                                     <td className="py-1">{s.borka || '-'}</td>
                                                     <td className="py-1">{s.hijab || '-'}</td>
                                                     <td className="py-1">{s.pataQty || '-'}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Right Numbers Column */}
                    {!hasSizes && (
                        <div className="w-64 p-4 flex flex-col justify-around bg-slate-50/50">
                            <div className="text-center">
                                <p className="text-[12px] font-black text-black mb-1 border-b-2 border-black inline-block px-2">পরিমাণ (QTY)</p>
                                <p className="text-[100px] font-black leading-none tracking-tighter italic">
                                    {data.amount || data.pataQty || (Number(data.issueBorka || 0) + Number(data.issueHijab || 0)) || Number(data.receivedBorka || 0) + Number(data.receivedHijab || 0) || Number(data.receivedQty || 0)}
                                </p>
                                {type === 'PAYMENT' && <p className="text-2xl font-black text-emerald-600 mt-1 uppercase leading-none">TAKA (টাকা)</p>}
                                {(data.size || data.pataType) && (
                                    <div className="mt-2 bg-black text-white py-1 px-4 rounded-md">
                                        <p className="text-lg font-black">{data.size || data.pataType}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Footer Barcode Area */}
                <div className="h-44 p-4 flex items-center gap-8 bg-white">
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-[10px] font-black tracking-[0.5em] mb-2">SCAN FOR NODE AUTHENTICATION / ট্র্যাকিং নম্বর</p>
                        <div className="h-20 bg-white border-[4px] border-black flex items-center justify-center relative overflow-hidden">
                             <div className="absolute inset-0 flex opacity-10">
                                 {Array.from({length: 120}).map((_, i) => (
                                     <div key={i} className="h-full bg-black" style={{ width: Math.random() * 5 + 'px', marginLeft: Math.random() * 3 + 'px' }} />
                                 ))}
                             </div>
                             <p className="text-4xl md:text-5xl font-black tracking-[0.4em] relative z-10 antialiased">{displayId}</p>
                        </div>
                    </div>
                    <div className="flex-none p-2 border-[4px] border-black bg-white shadow-lg">
                         <QRCode 
                            value={`${window.location.origin}/track?id=${displayId}`} 
                            size={120} 
                            bordered={false} 
                            errorLevel="H"
                            style={{ padding: 0 }}
                         />
                    </div>
                </div>

                {/* Copy Indicator Vertical Float */}
                <div className="absolute top-1/2 -right-12 -translate-y-1/2 rotate-90 bg-black text-white px-10 py-1 font-black tracking-[0.6em] text-xs">
                    {copyTitle === 'WORKER COPY' || copyTitle === 'RECIPIENT COPY' ? 'কারিগর কপি' : 'অফিস কপি'}
                </div>
            </div>
        </ConfigProvider>
    );
};

export default UniversalSlip;
