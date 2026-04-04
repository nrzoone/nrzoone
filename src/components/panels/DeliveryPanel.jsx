import React, { useState } from 'react';
import { Truck, Calendar, Package, Search, Trash2, ArrowLeft, Plus, Users } from 'lucide-react';

const DeliveryPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, t, logAction }) => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);

    const deliveries = (masterData.deliveries || []).sort((a, b) => b.id - a.id);
    const filteredDeliveries = deliveries.filter(d => 
        (d.customer || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.design || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleAddDelivery = (e) => {
        e.preventDefault();
        const form = e.target;
        const newDelivery = {
            id: Date.now(),
            date: form.date.value || new Date().toISOString().split('T')[0],
            customer: form.customer.value,
            design: form.design.value,
            qtyBorka: Number(form.qtyBorka.value) || 0,
            qtyHijab: Number(form.qtyHijab.value) || 0,
            note: form.note.value
        };

        if (!newDelivery.customer || !newDelivery.design || (newDelivery.qtyBorka + newDelivery.qtyHijab) === 0) {
            showNotify("দয়া করে সঠিক তথ্য দিন!", "error");
            return;
        }

        setMasterData(prev => ({
            ...prev,
            deliveries: [newDelivery, ...(prev.deliveries || [])]
        }));

        logAction(user, 'DELIVERY_ADD', `Dispatched ${newDelivery.qtyBorka + newDelivery.qtyHijab} pcs of ${newDelivery.design} to ${newDelivery.customer}`);
        showNotify("ডেলিভারি এন্ট্রি সফল হয়েছে!");
        setShowForm(false);
    };

    const deleteDelivery = (id) => {
        if (!window.confirm("আপনি কি এই ডেলিভারি এন্ট্রিটি মুছে ফেলতে চান?")) return;
        setMasterData(prev => ({
            ...prev,
            deliveries: prev.deliveries.filter(d => d.id !== id)
        }));
        logAction(user, 'DELIVERY_DELETE', `Deleted delivery record #${id}`);
    };

    return (
        <div className="space-y-8 animate-fade-up px-2 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setActivePanel('Overview')}
                        className="w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.4em] mb-1 italic">Dispatch Matrix</p>
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Dispatched <span className="text-slate-400">Hub</span></h2>
                    </div>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="action-btn-primary flex items-center gap-3"
                    >
                        <Plus size={18} /> Record New Dispatch
                    </button>
                )}
            </div>

            {showForm && (
                <div className="premium-card border-emerald-500/20 bg-emerald-50/10 animate-fade-in relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <Truck className="text-emerald-500" size={24} />
                            <h3 className="text-xl font-black uppercase italic tracking-tight">New Delivery Registry</h3>
                        </div>
                        <button onClick={() => setShowForm(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500">Cancel</button>
                    </div>
                    <form onSubmit={handleAddDelivery} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Party/Customer Name</label>
                            <input name="customer" placeholder="EX: BROTHERS COLLECTION" className="premium-input uppercase" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Design Name</label>
                            <input name="design" list="designs" placeholder="EX: 4125" className="premium-input uppercase" required />
                            <datalist id="designs">
                                {masterData.designs?.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Dispatch Date</label>
                            <input name="date" type="date" className="premium-input" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Borka Qty (Pcs)</label>
                            <input name="qtyBorka" type="number" placeholder="0" className="premium-input" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Hijab Qty (Pcs)</label>
                            <input name="qtyHijab" type="number" placeholder="0" className="premium-input" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Reference Note</label>
                            <input name="note" placeholder="EX: VIA COURIER" className="premium-input uppercase" />
                        </div>
                        <div className="md:col-span-3 pt-4">
                            <button type="submit" className="action-btn-primary w-full bg-emerald-600 hover:bg-emerald-700">Finalize Dispatch Entry</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="premium-card">
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-10 items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-xl"><Users size={20} className="text-slate-500" /></div>
                        <h3 className="text-xl font-black uppercase italic tracking-tight">Recent Dispatch Ledger</h3>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="SEARCH BY PARTY OR DESIGN..." 
                            className="premium-input pl-14" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto -mx-5 md:mx-0">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            <tr>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5 text-center">Party & Design</th>
                                <th className="px-8 py-5 text-center text-emerald-500">Quantity</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                            {filteredDeliveries.map(d => (
                                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={14} className="text-slate-300" />
                                            <span className="text-xs font-black text-slate-600">{d.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-sm font-black uppercase truncate max-w-[200px] mx-auto">{d.customer || 'Unknown Party'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Design: {d.design}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="text-center">
                                                <p className="text-xl font-black tracking-tighter leading-none">{d.qtyBorka}</p>
                                                <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Borka</p>
                                            </div>
                                            <div className="w-[1px] h-6 bg-slate-100" />
                                            <div className="text-center text-slate-400">
                                                <p className="text-xl font-black tracking-tighter leading-none text-slate-400">{d.qtyHijab}</p>
                                                <p className="text-[7px] font-black uppercase mt-1">Hijab</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => deleteDelivery(d.id)}
                                            className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDeliveries.length === 0 && (
                                <tr><td colSpan="4" className="py-20 text-center font-black uppercase tracking-[0.3em] text-slate-300 italic">No Dispatch Records Found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeliveryPanel;
