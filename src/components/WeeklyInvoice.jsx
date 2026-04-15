import React, { useState } from 'react';
import { Printer, Calendar, Search, CreditCard, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import NRZLogo from "./NRZLogo";

const WeeklyInvoice = ({ masterData, user, logAction, showNotify, setActivePanel }) => {
    const [selectedDept, setSelectedDept] = useState('sewing');
    const [showPreview, setShowPreview] = useState(false);

    const getWeekRange = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToSaturday = (dayOfWeek + 1) % 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() - diffToSaturday);
        saturday.setHours(0, 0, 0, 0);
        const thursday = new Date(saturday);
        thursday.setDate(saturday.getDate() + 5);
        thursday.setHours(23, 59, 59, 999);
        return { saturday, thursday };
    };

    const range = getWeekRange();
    const workers = (masterData.workerCategories?.[selectedDept] || []);

    const getWorkerData = (name) => {
        const parseDate = (dStr) => {
            if (!dStr) return new Date(0);
            if (dStr.includes("-")) return new Date(dStr); // ISO
            const parts = dStr.split("/");
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD/MM/YYYY
            return new Date(dStr);
        };

        const monthlySalary = masterData.workerWages?.[selectedDept]?.[name];
        if (monthlySalary) {
            const records = (masterData.attendance || []).filter(a => {
                const aDate = parseDate(a.date);
                return a.worker === name && a.department === selectedDept && aDate >= range.saturday && aDate <= range.thursday;
            });
            const presentCount = records.filter(r => r.status === 'present').length;
            const halfDayCount = records.filter(r => r.status === 'half-day').length;
            const totalBill = records.reduce((sum, r) => sum + (r.wage || 0), 0);
            return { type: 'Monthly', qty: presentCount + (halfDayCount * 0.5), qtyLabel: 'Days', bill: totalBill };
        }
        if (selectedDept === 'pata') {
            const entries = (masterData.pataEntries || []).filter(e => {
                const eDate = parseDate(e.date);
                return e.worker === name && eDate >= range.saturday && eDate <= range.thursday && e.status === 'Received';
            });
            return { type: 'Production', qty: entries.reduce((a, b) => a + Number(b.pataQty || 0), 0), qtyLabel: 'Pcs', bill: entries.reduce((a, b) => a + Number(b.amount || 0), 0) };
        } else {
            const items = (masterData.productions || []).filter(p => {
                const pDate = parseDate(p.date);
                return p.worker === name && p.type === selectedDept && p.status === 'Received' && pDate >= range.saturday && pDate <= range.thursday;
            });
            const totalBill = items.reduce((acc, b) => {
                const design = (masterData.designs || []).find(d => d.name === b.design);
                const netBorka = Number(b.receivedBorka || 0);
                const netHijab = Number(b.receivedHijab || 0);
                if (selectedDept === 'sewing') {
                    const bRate = design?.sewingRate || 0;
                    const hRate = design?.hijabRate || bRate;
                    return acc + (netBorka * bRate) + (netHijab * hRate);
                } else return acc + ((netBorka + netHijab) * (design?.stoneRate || 0));
            }, 0);
            return { type: 'Production', qty: items.reduce((a, b) => a + Number(b.receivedBorka || 0) + Number(b.receivedHijab || 0), 0), qtyLabel: 'Pcs', bill: totalBill };
        }
    };

    if (showPreview) {
        let gt = 0;
        return (
            <div className="bg-white p-20 font-sans italic text-black dark:text-white min-h-screen">
                <style>{`@media print { body { background: white; } .no-print { display: none; } }`}</style>
                <div className="max-w-4xl mx-auto border-[10px] border-gray-100 p-16 rounded-[4rem]">
                    <div className="flex justify-between items-start border-b-4 border-black pb-12 mb-12">
                        <div>
                            <h1 className="text-6xl font-black uppercase italic tracking-tighter">NRZO0NE <span className="text-gray-200">WEEKLY</span></h1>
                            <p className="text-xs font-black text-black dark:text-white dark:text-white mt-4 tracking-widest">{selectedDept === 'sewing' ? 'সেলাই' : selectedDept === 'stone' ? 'স্টোন' : 'পাটা'} বিভাগের সাপ্তাহিক বিল</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black italic">{range.saturday.toLocaleDateString('bn-BD')} - {range.thursday.toLocaleDateString('bn-BD')}</p>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="border-b-4 border-black">
                            <tr className="text-[10px] font-black uppercase tracking-widest">
                                <th className="py-6 text-left">কারিগর (Worker)</th>
                                <th className="py-6 text-center">আউটপুট (Output)</th>
                                <th className="py-6 text-right">পাওনা টাকা (Payable)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.map(w => {
                                const d = getWorkerData(w);
                                if (d.bill === 0) return null;
                                gt += d.bill;
                                return (
                                    <tr key={w} className="border-b-2 border-gray-100 font-black italic">
                                        <td className="py-6 uppercase text-xl">{w}</td>
                                        <td className="py-6 text-center text-2xl">{d.qty} <span className="text-xs uppercase text-gray-200">{d.qtyLabel === 'Pcs' ? 'পিস' : 'দিন'}</span></td>
                                        <td className="py-6 text-right text-3xl">৳{d.bill.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-4 border-black">
                                <td colSpan="2" className="py-10 text-right font-black uppercase tracking-widest text-gray-300">সর্বমোট সাপ্তাহিক পাওনা (Total Settlement)</td>
                                <td className="py-10 text-right text-6xl font-black italic tracking-tighter">৳{gt.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-12 pb-24 animate-fade-up px-2 italic text-black dark:text-white font-outfit">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6 md:gap-10">
                    <button
                        onClick={() => setActivePanel('Overview')}
                        className="p-4 md:p-6 bg-white text-black dark:text-white rounded-[2rem] border-4 border-slate-50 shadow-2xl hover:bg-black hover:text-white transition-all group active:scale-95"
                    >
                        <ArrowLeft size={24} strokeWidth={3} className="group-hover:-translate-x-2 transition-transform" />
                    </button>
                    <div className="flex items-center gap-6 md:gap-10">
                        <div className="bg-black rounded-[2.5rem] p-6 shadow-2xl border border-white/10 transition-transform hover:scale-110 active:scale-95 overflow-hidden group">
                           <NRZLogo size="md" white />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-black text-black dark:text-white dark:text-white uppercase tracking-[0.4em] mb-3 italic">সাপ্তাহিক ম্যাট্রিক্স</p>
                            <h2 className="text-4xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-none text-black">সাপ্তাহিক <span className="text-black dark:text-white dark:text-white">বিল হাব</span></h2>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <select className="bg-white text-black dark:text-white px-10 rounded-full font-black uppercase text-xs tracking-widest border border-slate-100 shadow-lg" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                        <option value="sewing">সেলাই বিভাগ</option>
                        <option value="stone">স্টোন বিভাগ</option>
                        <option value="pata">পাটা ফ্যাক্টরি</option>
                    </select>
                    <button onClick={() => { setShowPreview(true); setTimeout(() => { window.print(); setShowPreview(false); }, 100); }} className="bg-black text-white px-12 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl border-b-[12px] border-zinc-900 flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all">
                        <Printer size={20} /> বিল প্রিন্ট করুন
                    </button>
                </div>
            </div>

            <div className="bg-white p-12 rounded-[4rem] border-4 border-slate-50 shadow-2xl flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-black dark:text-white dark:text-white uppercase tracking-[0.5em] mb-4">Current Cycle</p>
                    <p className="text-5xl font-black italic tracking-tighter text-black">{range.saturday.toLocaleDateString('en-GB')} — {range.thursday.toLocaleDateString('en-GB')}</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-full rotate-12 border border-slate-100 shadow-inner"><Calendar size={48} className="text-black dark:text-white dark:text-white" /></div>
            </div>

            <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-black dark:text-white dark:text-white uppercase font-black text-[10px] tracking-widest">
                        <tr>
                            <th className="px-16 py-10">কারিগর (Worker Node)</th>
                            <th className="px-16 py-10 text-center">কাজের পরিমাণ (Output)</th>
                            <th className="px-16 py-10 text-right">পাওনা টাকা (৳)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {workers.map(w => {
                            const d = getWorkerData(w);
                            if (d.bill === 0) return null;
                            return (
                                <tr key={w} className="hover:bg-slate-50 transition-all group">
                                    <td className="px-16 py-12"><p className="font-black text-3xl uppercase tracking-tighter italic text-black">{w}</p></td>
                                    <td className="px-16 py-12 text-center font-black text-4xl italic text-black">{d.qty} <span className="text-xs text-black dark:text-white dark:text-white">{d.qtyLabel === 'Pcs' ? 'পিস' : 'দিন'}</span></td>
                                    <td className="px-16 py-12 text-right font-black text-5xl italic tracking-tighter text-black">৳{d.bill.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WeeklyInvoice;
