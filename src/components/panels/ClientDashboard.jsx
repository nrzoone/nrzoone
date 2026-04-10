import React, { useState, useMemo } from 'react';
import { 
  Truck, DollarSign, Package, Calendar, ArrowRight, Activity, 
  ShieldCheck, Download, Boxes, Plus, X, Wallet, Archive, 
  History, ShoppingCart, Send, Layers, CheckCircle, Clock, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientDashboard = ({ masterData, user, setMasterData, showNotify }) => {
  const clientName = user.name;
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'financials', 'materials'
  
  // -- Modals --
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // -- Data Filtering (Privacy Focused) --
  const clientDeliveries = useMemo(() => {
    return (masterData.deliveries || [])
      .filter(d => d.receiver?.toUpperCase() === clientName.toUpperCase())
      .sort((a, b) => new Date(b.date?.split('/').reverse().join('-') || 0) - new Date(a.date?.split('/').reverse().join('-') || 0));
  }, [masterData.deliveries, clientName]);

  const clientTransactions = useMemo(() => {
    return (masterData.clientTransactions || [])
      .filter(t => t.client?.toUpperCase() === clientName.toUpperCase())
      .sort((a, b) => new Date(b.date?.split('/').reverse().join('-') || 0) - new Date(a.date?.split('/').reverse().join('-') || 0));
  }, [masterData.clientTransactions, clientName]);

  const myProductionRequests = useMemo(() => {
    return (masterData.productionRequests || [])
      .filter(r => r.client?.toUpperCase() === clientName.toUpperCase())
      .sort((a, b) => b.id - a.id);
  }, [masterData.productionRequests, clientName]);

  const liveLots = useMemo(() => {
    const lots = [];
    // 1. From Cutting Stock (Pending/In Sewing)
    (masterData.cuttingStock || [])
      .filter(c => (c.client || '').toUpperCase() === clientName.toUpperCase())
      .forEach(c => lots.push({ ...c, status: 'In Production', stage: 'Cutting/Sewing' }));

    // 2. From Pata Entries (If not finished)
    (masterData.pataEntries || [])
      .filter(p => (p.client || '').toUpperCase() === clientName.toUpperCase() && p.status === 'Pending')
      .forEach(p => {
          if (!lots.find(l => l.lotNo === p.lotNo)) {
              lots.push({ ...p, status: 'Hand Work', stage: 'Pata/Stone' });
          }
      });
    return lots;
  }, [masterData.cuttingStock, masterData.pataEntries, clientName]);

  const materialStocks = useMemo(() => {
    const stocks = {};
    (masterData.rawInventory || []).forEach(log => {
        if ((log.client || '').toUpperCase() === clientName.toUpperCase()) {
            if (!stocks[log.item]) stocks[log.item] = { qty: 0, unit: log.unit || 'গজ' };
            if (log.type === 'in') stocks[log.item].qty += Number(log.qty);
            else stocks[log.item].qty -= Number(log.qty);
        }
    });
    return Object.entries(stocks).map(([name, data]) => ({ name, ...data }));
  }, [masterData.rawInventory, clientName]);

  const financials = useMemo(() => {
    let billed = 0, paid = 0;
    clientTransactions.forEach(t => {
      if (t.type === 'BILL') billed += Number(t.amount || 0);
      if (t.type === 'PAYMENT') paid += Number(t.amount || 0);
    });
    return { billed, paid, due: billed - paid };
  }, [clientTransactions]);

  const totalDelivered = clientDeliveries.reduce((sum, d) => sum + (d.qtyBorka || 0) + (d.qtyHijab || 0), 0);

  // -- Handlers --
  const handleSubmitOrder = (e) => {
    e.preventDefault();
    const f = e.target;
    const newRequest = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB"),
      client: clientName,
      design: f.design.value,
      qty: Number(f.qty.value),
      color: f.color.value,
      note: f.note.value,
      status: 'Pending Review'
    };
    setMasterData(prev => ({
      ...prev,
      productionRequests: [newRequest, ...(prev.productionRequests || [])]
    }));
    setShowOrderModal(false);
    showNotify("Order Request Submitted Successfully!", "success");
  };

  const handleDepositMaterial = (e) => {
    e.preventDefault();
    const f = e.target;
    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB"),
      item: f.item.value,
      client: clientName,
      qty: Number(f.qty.value),
      unit: f.unit.value,
      type: "in",
      note: `DEPOSITED BY CLIENT: ${f.note.value}`
    };
    setMasterData(prev => ({
      ...prev,
      rawInventory: [newItem, ...(prev.rawInventory || [])]
    }));
    setShowMaterialModal(false);
    showNotify("Material Logged Successfully!", "success");
  };

  const handlePaySubmission = (e) => {
    e.preventDefault();
    const f = e.target;
    const txn = {
      id: `txn_${Date.now()}_CP`,
      date: new Date().toLocaleDateString("en-GB"),
      client: clientName,
      type: 'PAYMENT',
      amount: Number(f.amount.value),
      note: `CLIENT PAYMENT INFO: ${f.ref.value}`
    };
    setMasterData(prev => ({
      ...prev,
      clientTransactions: [txn, ...(prev.clientTransactions || [])]
    }));
    setShowPaymentModal(false);
    showNotify("Payment details submitted for verification!", "success");
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-up font-outfit text-slate-950 dark:text-white">
      {/* Premium Hub Header */}
      <div className="saas-card bg-slate-950 text-white !border-slate-800 relative overflow-hidden group mb-12">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent opacity-60 pointer-events-none"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-emerald-500/20 shadow-2xl">
                    <ShieldCheck size={40} className="text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-2 italic">
                        Client <span className="text-emerald-500">Node Hub</span>
                    </h2>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em] font-mono">
                        {clientName} • Verified B2B Partner Portal
                    </p>
                </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
               <button onClick={() => setShowOrderModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                  <ShoppingCart size={16} /> New Order
               </button>
               <button onClick={() => setShowPaymentModal(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all">
                  <Wallet size={16} /> Pay Info
               </button>
            </div>
         </div>
      </div>

      {/* Analytics Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl border-l-4 border-l-rose-500">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Due</p>
              <h3 className="text-3xl font-black text-rose-500 italic leading-none">৳ {financials.due.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl border-l-4 border-l-emerald-500">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Paid</p>
              <h3 className="text-3xl font-black text-emerald-600 leading-none">৳ {financials.paid.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl border-l-4 border-l-blue-600">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Billed</p>
              <h3 className="text-3xl font-black text-blue-600 leading-none">৳ {financials.billed.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl border-l-4 border-l-amber-500">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Delivered Pcs</p>
              <h3 className="text-3xl font-black text-amber-600 leading-none">{totalDelivered.toLocaleString()} <span className="text-xs uppercase">Pcs</span></h3>
          </div>
      </div>

      {/* Main Grid: Orders & Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          
          {/* Production Orders (Client Entry) */}
          <div className="lg:col-span-2 space-y-8">
              <div className="saas-card bg-white dark:bg-slate-900 shadow-xl min-h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center"><Layers size={20} /></div>
                          <h3 className="text-2xl font-black uppercase tracking-tight italic">Production Orders</h3>
                      </div>
                      <span className="text-[9px] font-bold px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">{myProductionRequests.length} Active</span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                      {myProductionRequests.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center opacity-40">
                              <Archive size={48} className="mb-4" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Orders</p>
                          </div>
                      ) : (
                          myProductionRequests.map((req, i) => (
                              <div key={i} className="group p-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 hover:border-blue-500/30 transition-all">
                                  <div className="flex items-center gap-6 w-full md:w-auto">
                                      <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 shadow-inner group-hover:rotate-6 transition-transform"><CheckCircle size={20} className={req.status === 'Approved' ? 'text-emerald-500' : 'text-slate-300'} /></div>
                                      <div>
                                          <h4 className="text-lg font-black uppercase leading-none mb-2">{req.design}</h4>
                                          <div className="flex gap-3 text-[10px] font-bold uppercase text-slate-400">
                                              <span>{req.color}</span>
                                              <span>•</span>
                                              <span>{req.qty} Pcs</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
                                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                          {req.status}
                                      </span>
                                      <p className="text-[9px] font-bold text-slate-400 font-mono uppercase">{req.date}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          {/* Quick Stats: Materials & Active Tracking */}
          <div className="space-y-8">
              {/* Materials Sidebar */}
              <div className="saas-card bg-emerald-600 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.2] group-hover:rotate-12 transition-transform"><Archive size={120} /></div>
                  <h4 className="text-xl font-black uppercase tracking-tight mb-8 relative z-10 flex items-center justify-between">
                    Raw Inventory <Plus size={18} className="cursor-pointer" onClick={() => setShowMaterialModal(true)} />
                  </h4>
                  <div className="space-y-4 relative z-10">
                      {materialStocks.length === 0 ? (
                          <p className="text-[10px] font-bold text-white/50 uppercase italic tracking-widest">No stock materials logged</p>
                      ) : (
                          materialStocks.map((m, i) => (
                              <div key={i} className="flex justify-between items-end p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                  <div>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100 mb-1">{m.name}</p>
                                      <p className="text-3xl font-black italic">{m.qty.toLocaleString()} <span className="text-xs uppercase font-bold text-white/50">{m.unit}</span></p>
                                  </div>
                                  <div className="w-1.5 h-12 bg-white/20 rounded-full overflow-hidden self-center">
                                      <div className="h-1/2 w-full bg-white rounded-full"></div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              {/* Live Status Tracker */}
              <div className="saas-card bg-white dark:bg-slate-900 shadow-xl">
                  <h4 className="text-xl font-black uppercase tracking-tight mb-8 pb-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3">
                      <Clock size={20} className="text-amber-500 animate-pulse" /> Live Status
                  </h4>
                  <div className="space-y-6">
                      {liveLots.length === 0 ? (
                          <p className="text-[10px] font-bold text-slate-400 uppercase text-center py-10">No lots currently in production</p>
                      ) : (
                          liveLots.map((lot, i) => (
                              <div key={i} className="flex gap-6 items-start">
                                  <div className="flex flex-col items-center">
                                      <div className="w-4 h-4 rounded-full bg-amber-500 border-4 border-white dark:border-slate-900 shadow-lg relative z-10"></div>
                                      <div className="w-0.5 h-16 bg-slate-100 dark:bg-slate-800 mt-[-4px] mb-[-4px]"></div>
                                  </div>
                                  <div className="flex-1 pb-4">
                                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">{lot.stage}</p>
                                      <h5 className="text-sm font-black uppercase truncate italic">Lot #{lot.lotNo || '??'} • {lot.design}</h5>
                                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Current Status: {lot.status}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* History Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Dispatch Log */}
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
               <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-4">
                       <Truck size={24} className="text-blue-600" /> Dispatch Log
                   </h3>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full">{clientDeliveries.length} Records</span>
               </div>
               <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                   {clientDeliveries.map((d, i) => (
                       <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/20 border-2 border-slate-50 dark:border-slate-800 rounded-2xl flex justify-between items-center group hover:border-blue-500/20 transition-all">
                           <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                                   <Package size={22} className="text-blue-500" />
                               </div>
                               <div>
                                   <h4 className="text-lg font-black uppercase leading-none mb-1 italic">{d.design}</h4>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.color || 'MIX'} • {d.date}</p>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-2xl font-black text-slate-950 dark:text-white leading-none italic">{(d.qtyBorka || 0) + (d.qtyHijab || 0)} <span className="text-[10px] uppercase font-bold text-slate-400">Pcs</span></p>
                           </div>
                       </div>
                   ))}
               </div>
          </div>

          {/* Financial Statement */}
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
               <div className="flex justify-between items-center mb-8 text-black dark:text-white">
                   <h3 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-4">
                       <BarChart2 size={24} className="text-emerald-600" /> Financial Statement
                   </h3>
                   <button onClick={() => setShowPaymentModal(true)} className="p-3 bg-slate-950 text-white dark:bg-white dark:text-white rounded-xl hover:scale-105 transition-all"><Plus size={18} /></button>
               </div>
               <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                   {clientTransactions.map((t, i) => (
                       <div key={i} className={`p-6 border-l-8 rounded-2xl shadow-sm transition-all flex justify-between items-center ${t.type === 'PAYMENT' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-emerald-500' : 'bg-slate-50 dark:bg-slate-800/50 border-l-slate-400 hover:border-l-blue-500'}`}>
                           <div>
                               <h4 className="text-[11px] font-black uppercase leading-none mb-3 text-slate-900 dark:text-white italic tracking-widest">{t.type === 'BILL' ? 'Production Invoice' : 'Payment Settled'}</h4>
                               <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed max-w-[280px] line-clamp-1">{t.note}</p>
                               <p className="text-[10px] font-black text-slate-400 mt-4 font-mono">{t.date}</p>
                           </div>
                           <div className="text-right">
                               <p className={`text-2xl font-black leading-none tracking-tighter italic ${t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                   {t.type === 'PAYMENT' ? '+' : '-'} ৳{t.amount?.toLocaleString()}
                               </p>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      {/* -- Modals (Refined Design) -- */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="saas-card bg-white dark:bg-slate-900 w-full max-w-xl p-12 shadow-3xl space-y-10 border-2 border-slate-50 dark:border-slate-800">
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-6 mb-4"><ShoppingCart size={36} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-tight italic text-black dark:text-white">Place New Order</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none italic pb-4">Production Deployment Request</p>
                </div>
                <form onSubmit={handleSubmitOrder} className="grid grid-cols-2 gap-8">
                   <div className="col-span-2 space-y-2">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Design Style</label>
                       <select name="design" className="premium-input !h-14 font-black uppercase text-sm" required>
                          {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                       </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                      <input name="qty" type="number" className="premium-input !h-14 text-center font-black text-xl" placeholder="0" required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Color Theme</label>
                      <select name="color" className="premium-input !h-14 font-black uppercase text-[12px]" required>
                          {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div className="col-span-2 space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Order Note (Urgency/Details)</label>
                      <textarea name="note" className="premium-input !h-28 !pt-6 uppercase text-[11px] font-black italic tracking-widest" placeholder="ANY SPECIFIC REQUIREMENTS..." />
                   </div>
                   <div className="col-span-2 flex gap-6 pt-4">
                      <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-5 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-2xl text-black dark:text-white">Cancel</button>
                      <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl border-b-8 border-blue-900 active:translate-y-1 active:border-b-4 transition-all">Submit Order</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showMaterialModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="saas-card bg-white dark:bg-slate-900 w-full max-w-xl p-12 shadow-3xl space-y-10 border-2 border-slate-50 dark:border-slate-800">
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl -rotate-6 mb-4"><Archive size={36} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-tight italic text-black dark:text-white">Deposit Material</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none italic pb-4">Log Raw Stock Arrival</p>
                </div>
                <form onSubmit={handleDepositMaterial} className="space-y-8">
                   <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Material Item</label>
                       <input name="item" list="mat-list-x" className="premium-input !h-14 uppercase font-black text-sm" placeholder="FABRIC / STONE / PACKAGING" required />
                       <datalist id="mat-list-x">
                          <option value="ফেব্রিক (FABRIC ROLL)" />
                          <option value="পাথর (STONE PACK)" />
                          <option value="বোর্ড পিন (BOARD PIN)" />
                       </datalist>
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                          <input name="qty" type="number" className="premium-input !h-14 text-center font-black text-xl" placeholder="0" required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit</label>
                          <select name="unit" className="premium-input !h-14 font-black uppercase text-xs">
                             <option value="গজ">গজ (YDS)</option>
                             <option value="প্যাকেট">প্যাকেট (PKT)</option>
                             <option value="রোল">রোল (ROLL)</option>
                          </select>
                       </div>
                   </div>
                   <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Material Identity (Note)</label>
                       <input name="note" className="premium-input !h-14 uppercase text-[11px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="E.G. JET BLACK PREMIUM" required />
                   </div>
                   <div className="flex gap-6 pt-4">
                      <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 py-5 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-2xl text-black dark:text-white">Cancel</button>
                      <button type="submit" className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl border-b-8 border-emerald-900 active:translate-y-1 active:border-b-4 transition-all">Submit Deposit</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="saas-card bg-white dark:bg-slate-900 w-full max-w-xl p-12 shadow-3xl space-y-10 border-2 border-slate-50 dark:border-slate-800">
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-rose-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl -rotate-3 mb-4"><DollarSign size={36} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-tight italic text-black dark:text-white">Submit Payment Info</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none italic pb-4">Financial Settlement Log</p>
                </div>
                <form onSubmit={handlePaySubmission} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (BDT)</label>
                      <input name="amount" type="number" className="premium-input !h-24 text-5xl font-black text-center !bg-slate-50 dark:!bg-slate-800 !border-none !rounded-2xl text-black dark:text-white" placeholder="৳ 0.00" required autoFocus />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Ref / TrxID / Method</label>
                      <input name="ref" className="premium-input !h-14 uppercase text-[11px] font-black italic tracking-widest" placeholder="E.G. BANK TRANSFER / CASH" required />
                   </div>
                   <div className="flex gap-6 pt-4">
                      <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-5 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-2xl text-black dark:text-white">Cancel</button>
                      <button type="submit" className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl border-b-8 border-emerald-900 active:translate-y-1 active:border-b-4 transition-all">Submit Verification</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
