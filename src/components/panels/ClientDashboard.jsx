import React, { useState, useMemo } from 'react';
import { 
  Truck, DollarSign, Package, Calendar, ArrowRight, Activity, 
  ShieldCheck, Download, Boxes, Plus, X, Wallet, Archive, 
  History, ShoppingCart, Send, Layers, CheckCircle, Clock, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientDashboard = ({ masterData, user, setMasterData, showNotify }) => {
  const clientName = user.name;
  // -- Modals --
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // -- Advanced Order State --
  const [orderForm, setOrderForm] = useState({
    design: '',
    fabricGoj: '',
    sizes: [{ size: '', borka: '', hijab: '' }],
    note: ''
  });

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [activeDispatch, setActiveDispatch] = useState(null);

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

  const liveLots = useMemo(() => {
    const lots = [];
    // 1. From Cutting Stock (Pending/In Sewing)
    (masterData.cuttingStock || [])
      .filter(c => (c.client || '').toUpperCase() === clientName.toUpperCase())
      .forEach(c => lots.push({ ...c, status: 'In Production', stage: 'Cutting/Sewing' }));

    // 2. From B2B Requests that are "In Cutting"
    (masterData.productionRequests || [])
      .filter(r => (r.client || '').toUpperCase() === clientName.toUpperCase() && r.status === 'In Cutting')
      .forEach(r => {
          if (!lots.find(l => l.lotNo === r.lotNo)) {
             lots.push({ ...r, status: 'Cutting Room', stage: 'Processing' });
          }
      });
    return lots;
  }, [masterData.cuttingStock, masterData.productionRequests, clientName]);

  const readyStock = useMemo(() => {
    // Received productions - Delivered
    const received = {};
    (masterData.productions || [])
      .filter(p => (p.client || '').toUpperCase() === clientName.toUpperCase() && p.status === 'Received')
      .forEach(p => {
         const key = `${p.design}_${p.color || 'MIX'}`;
         if (!received[key]) received[key] = { design: p.design, color: p.color || 'MIX', borka: 0, hijab: 0 };
         received[key].borka += Number(p.receivedBorka || 0);
         received[key].hijab += Number(p.receivedHijab || 0);
      });

    (masterData.deliveries || [])
      .filter(d => (d.receiver || d.client || '').toUpperCase() === clientName.toUpperCase())
      .forEach(d => {
         const key = `${d.design}_${d.color || 'MIX'}`;
         if (received[key]) {
             received[key].borka -= Number(d.qtyBorka || 0);
             received[key].hijab -= Number(d.qtyHijab || 0);
         }
      });

    return Object.values(received).filter(r => r.borka > 0 || r.hijab > 0);
  }, [masterData.productions, masterData.deliveries, clientName]);

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
    const reqId = Date.now();
    
    // Calculate total items
    const totalBorka = orderForm.sizes.reduce((s, x) => s + Number(x.borka || 0), 0);
    const totalHijab = orderForm.sizes.reduce((s, x) => s + Number(x.hijab || 0), 0);

    if (totalBorka === 0 && totalHijab === 0) {
        showNotify("Pcs quantity cannot be zero!", "error");
        return;
    }

    const newRequest = {
      id: reqId,
      date: new Date().toLocaleDateString("en-GB"),
      client: clientName,
      design: orderForm.design,
      fabricGoj: Number(orderForm.fabricGoj),
      sizes: orderForm.sizes.filter(s => s.size && (s.borka > 0 || s.hijab > 0)),
      totalBorka,
      totalHijab,
      note: orderForm.note,
      status: 'Pending Review'
    };

    // Fabric Deduction Logic
    const fabricDeduction = Number(orderForm.fabricGoj) > 0 ? {
        id: Date.now() + 1,
        date: new Date().toLocaleDateString("en-GB"),
        item: "ফেব্রিক রোল (Fabric)",
        client: clientName,
        qty: Number(orderForm.fabricGoj),
        type: "out",
        note: `ORDER REQ #${reqId} - ${orderForm.design}`
    } : null;

    setMasterData(prev => ({
      ...prev,
      productionRequests: [newRequest, ...(prev.productionRequests || [])],
      rawInventory: fabricDeduction ? [fabricDeduction, ...(prev.rawInventory || [])] : (prev.rawInventory || [])
    }));

    setShowOrderModal(false);
    setOrderForm({ design: '', fabricGoj: '', sizes: [{ size: '', borka: '', hijab: '' }], note: '' });
    showNotify("ভল্টে নতুন অর্ডার জমা হয়েছে!", "success");
    logAction(user, 'CLIENT_ORDER_ENTRY', `Order placed for ${orderForm.design}. Fabric: ${orderForm.fabricGoj}YDS`);
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
    showNotify("মেটেরিয়াল স্টক আপডেট হয়েছে!", "success");
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
    showNotify("পেমেন্ট অডিট কিউতে পাঠানো হয়েছে!", "success");
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    const f = e.target;
    const qty = Number(f.qty.value);
    const design = f.design.value;
    const rate = Number(f.rate.value || 0);
    const timestamp = Date.now();
    const date = new Date().toLocaleDateString("en-GB");

    // 1. Create Delivery Record
    const delivery = {
      id: `DEL_${timestamp}`,
      date,
      client: clientName,
      design,
      color: f.color.value,
      qtyBorka: Number(f.borka.value || 0),
      qtyHijab: Number(f.hijab.value || 0),
      qty,
      receiver: f.receiver.value || 'SELF PICKUP',
      note: `CLIENT SELF DISPATCH: ${f.note.value}`
    };

    // 2. Auto-Bill (Optional but requested: "se onujayi bill... hobe")
    const bill = rate > 0 ? {
      id: `BILL_${timestamp}`,
      date,
      client: clientName,
      type: 'BILL',
      amount: rate * qty,
      note: `AUTO-BILL: ${design} Dispatch`
    } : null;

    setMasterData(prev => ({
      ...prev,
      deliveries: [delivery, ...(prev.deliveries || [])],
      clientTransactions: bill ? [bill, ...(prev.clientTransactions || [])] : (prev.clientTransactions || [])
    }));

    setShowDispatchModal(false);
    showNotify("ডিসপ্যাচ সম্পন্ন হয়েছে এবং লেজারে বিল জেনারেট হয়েছে!", "success");
    logAction(user, 'CLIENT_SELF_DISPATCH', `${qty} PCS of ${design} dispatched by client.`);
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-up font-outfit text-slate-950 dark:text-white px-1 md:px-6">
      {/* SaaS Compact Header */}
      <div className="saas-card bg-slate-950 text-white !border-none relative overflow-hidden group mb-6 !p-6 md:!p-10 rounded-[2.5rem] shadow-3xl">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                    <ShieldCheck size={32} className="text-blue-400" />
                </div>
                <div className="text-center lg:text-left">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none mb-1 italic">
                        B2B <span className="text-blue-500">CLIENT ARCHIVE</span>
                    </h2>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.6em] font-mono leading-none">
                        ENTITY: {clientName} // SECURE NODE
                    </p>
                </div>
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
               <button onClick={() => setShowOrderModal(true)} className="flex-1 lg:flex-none px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                  <ShoppingCart size={16} /> NEW PRODUCTION
               </button>
               <button onClick={() => setShowPaymentModal(true)} className="flex-1 lg:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                  <Wallet size={16} /> SYNC PAYMENT
               </button>
            </div>
         </div>
      </div>

      {/* High-Density Analytics HUB */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="saas-card bg-white dark:bg-slate-900 !p-4 md:!p-6 shadow-xl border-l-[6px] border-l-rose-500 group">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL DEBT</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white italic tabular-nums">৳ {financials.due.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 !p-4 md:!p-6 shadow-xl border-l-[6px] border-l-emerald-500 group">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">SETTLED FUND</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white italic tabular-nums">৳ {financials.paid.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 !p-4 md:!p-6 shadow-xl border-l-[6px] border-l-blue-600 group">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">INVOICED VALUE</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white italic tabular-nums">৳ {financials.billed.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 !p-4 md:!p-6 shadow-xl border-l-[6px] border-l-slate-950 dark:border-l-white group">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">GLOBAL OUTPUT</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white italic tabular-nums">{totalDelivered.toLocaleString()} <span className="text-[10px] uppercase opacity-30">PCS</span></h3>
          </div>
      </div>

      {/* Operational Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          <div className="lg:col-span-2 space-y-6">
              <div className="saas-card bg-white dark:bg-slate-900 shadow-xl min-h-[400px] flex flex-col !p-0 overflow-hidden">
                  <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center shadow-inner"><Layers size={20} /></div>
                          <h3 className="text-xl font-black uppercase tracking-tight italic">ACTIVE ORDERS</h3>
                      </div>
                      <span className="text-[9px] font-black px-4 py-1 bg-slate-950 text-white rounded-full uppercase tracking-widest shadow-xl">{myProductionRequests.length} QUEUED</span>
                  </div>
                  
                  <div className="p-6 md:p-8 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                      {myProductionRequests.length === 0 ? (
                          <div className="py-20 flex flex-col items-center justify-center opacity-20">
                              <Archive size={48} className="mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-[0.5em]">No active queue logs</p>
                          </div>
                      ) : (
                          myProductionRequests.map((req, i) => (
                              <div key={i} className="group p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-3xl flex justify-between items-center hover:border-blue-500/20 transition-all border-l-[8px] border-l-blue-600">
                                  <div className="space-y-2">
                                      <h4 className="text-lg font-black uppercase leading-none italic">{req.design}</h4>
                                      <div className="flex items-center gap-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                          <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded-md shadow-sm">৳ {req.fabricGoj}YDS</span>
                                          <span className="bg-slate-950 text-white px-2 py-1 rounded-md shadow-sm">{req.totalBorka + req.totalHijab} PCS</span>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md ${req.status === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white animate-pulse'}`}>
                                          {req.status}
                                      </span>
                                      <p className="text-[9px] font-black text-slate-400 mt-2 font-mono">{req.date}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="saas-card bg-emerald-600 text-white shadow-2xl relative overflow-hidden group !p-8">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.1] group-hover:rotate-12 transition-transform"><Archive size={120} /></div>
                  <h4 className="text-lg font-black uppercase tracking-[0.2em] mb-8 relative z-10 flex items-center justify-between italic">
                    RAW STOCK <Plus size={18} className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setShowMaterialModal(true)} />
                  </h4>
                  <div className="grid grid-cols-1 gap-4 relative z-10">
                      {materialStocks.length === 0 ? (
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic leading-relaxed">No warehouse inventory established for this entity.</p>
                      ) : (
                          materialStocks.map((m, i) => (
                              <div key={i} className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10 shadow-xl group/item hover:bg-white/20 transition-all">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100 mb-2 italic underline decoration-white/20">{m.name}</p>
                                  <p className="text-3xl font-black italic tracking-tighter tabular-nums">{m.qty.toLocaleString()} <span className="text-[10px] uppercase font-black text-white/50">{m.unit}</span></p>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              <div className="saas-card bg-white dark:bg-slate-900 shadow-xl !p-8">
                  <h4 className="text-lg font-black uppercase tracking-tight mb-8 pb-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 italic text-blue-600">
                      <Boxes size={20} className="animate-pulse" /> WAREHOUSE (READY)
                  </h4>
                  <div className="space-y-4">
                      {readyStock.length === 0 ? (
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2rem] text-center space-y-4 border-2 border-dashed border-slate-100 dark:border-slate-800">
                             <Activity size={32} className="mx-auto text-slate-300" />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No stock awaiting dispatch.</p>
                          </div>
                      ) : (
                          readyStock.map((s, i) => (
                              <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500 transition-all">
                                  <div>
                                      <p className="text-[10px] font-black uppercase leading-none mb-1 italic">{s.design}</p>
                                      <p className="text-[8px] font-black text-slate-400 uppercase">{s.color}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right">
                                          <p className="text-xl font-black italic">{Number(s.borka) + Number(s.hijab)} <span className="text-[9px] text-slate-400">PCS</span></p>
                                      </div>
                                      <button 
                                        onClick={() => { setActiveDispatch(s); setShowDispatchModal(true); }}
                                        className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105"
                                      >
                                          <Truck size={16} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  <h4 className="text-lg font-black uppercase tracking-tight mt-12 mb-8 pb-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 italic text-amber-500">
                      <Clock size={20} className="animate-spin-slow" /> PRODUCTION PIPELINE
                  </h4>
                  <div className="space-y-6">
                      {liveLots.length === 0 ? (
                          <p className="text-[10px] font-black text-slate-400 uppercase text-center py-6">No lots in active assembly.</p>
                      ) : (
                          liveLots.map((lot, i) => (
                              <div key={i} className="flex gap-4 items-start">
                                  <div className="w-1.5 h-12 bg-amber-500/20 rounded-full flex flex-col justify-end">
                                      <div className="w-full h-1/2 bg-amber-500 rounded-full animate-pulse"></div>
                                  </div>
                                  <div>
                                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">{lot.stage}</p>
                                      <p className="text-[11px] font-black uppercase italic leading-none">{lot.design}</p>
                                      <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">STATUS: {lot.status}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl !p-0 overflow-hidden">
               <div className="p-8 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                   <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-4">
                       <Truck size={24} className="text-blue-600" /> DELIVERY FEED
                   </h3>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full">{clientDeliveries.length} RECS</span>
               </div>
               <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                   {clientDeliveries.map((d, i) => (
                       <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center group hover:border-blue-500/20 transition-all">
                           <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                   <Package size={20} className="text-blue-500" />
                               </div>
                               <div>
                                   <h4 className="text-sm font-black uppercase leading-none mb-1 italic">{d.design}</h4>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.date}</p>
                               </div>
                           </div>
                           <p className="text-xl font-black italic">{(d.qtyBorka || 0) + (d.qtyHijab || 0)} <span className="text-[9px] uppercase font-black text-slate-300">PCS</span></p>
                       </div>
                   ))}
               </div>
          </div>

          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl !p-0 overflow-hidden">
               <div className="p-8 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                   <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-4 text-emerald-600">
                       <Wallet size={24} /> LEDGER AUDIT
                   </h3>
                   <button onClick={() => setShowPaymentModal(true)} className="p-2.5 bg-slate-950 text-white rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"><Plus size={16} /></button>
               </div>
               <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                   {clientTransactions.map((t, i) => (
                       <div key={i} className={`p-5 rounded-3xl flex justify-between items-center ${t.type === 'PAYMENT' ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-slate-50 dark:bg-slate-800/30'}`}>
                           <div className="space-y-2">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white italic">{t.type === 'BILL' ? 'PRODUCTION INVOICE' : 'SETTLEMENT'}</h4>
                               <p className="text-[9px] font-black text-slate-400 mt-1">{t.date}</p>
                           </div>
                           <p className={`text-xl font-black italic tracking-tighter tabular-nums ${t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-950 dark:text-white'}`}>
                               ৳ {t.amount?.toLocaleString()}
                           </p>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto">
             <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-2xl p-10 md:p-14 rounded-[3.5rem] shadow-3xl space-y-12 border border-slate-100 dark:border-slate-800 relative">
                <button onClick={() => setShowOrderModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-black transition-colors"><X size={28} /></button>
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-3xl rotate-12 mb-6"><ShoppingCart size={36} /></div>
                   <h3 className="text-4xl font-black uppercase tracking-tight italic text-black dark:text-white">PRODUCTION PROTOCOL</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none italic">Define Order Specifications & Material Drawdown</p>
                </div>
                <form onSubmit={handleSubmitOrder} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Design Node</label>
                           <select value={orderForm.design} onChange={e => setOrderForm(p => ({...p, design: e.target.value}))} className="premium-input !h-16 font-black uppercase text-xs" required>
                              <option value="">SELECT DESIGN ARCHIVE...</option>
                              {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                           </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Material DRAWDOWN (YDS)</label>
                          <input type="number" value={orderForm.fabricGoj} onChange={e => setOrderForm(p => ({...p, fabricGoj: e.target.value}))} className="premium-input !h-16 text-center font-black text-2xl !bg-slate-950 !text-white !border-none" placeholder="0.00" required />
                       </div>
                   </div>

                   <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 space-y-6">
                      <div className="flex justify-between items-center mb-4">
                         <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Size Matrix Configuration</h4>
                         <button type="button" onClick={() => setOrderForm(p => ({...p, sizes: [...p.sizes, { size: '', borka: '', hijab: '' }]}))} className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center hover:scale-110 shadow-xl transition-all"><Plus size={18} /></button>
                      </div>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                         {orderForm.sizes.map((s, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                               <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                                  <select value={s.size} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].size = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full bg-slate-50 dark:bg-slate-950 h-12 rounded-xl text-[10px] font-black uppercase border-none outline-none text-center" required>
                                      <option value="">SIZE</option>
                                      {(masterData.sizes || []).map(z => <option key={z} value={z}>{z}</option>)}
                                  </select>
                               </div>
                               <div className="col-span-5 md:col-span-4 flex items-center gap-4 px-4 border-l-2 border-slate-50 dark:border-slate-800">
                                  <span className="text-[9px] font-black text-slate-300 uppercase">BORKA</span>
                                  <input type="number" value={s.borka} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].borka = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full text-center text-2xl font-black bg-transparent border-none outline-none" placeholder="0" />
                               </div>
                               <div className="col-span-5 md:col-span-4 flex items-center gap-4 px-4 border-l-2 border-slate-50 dark:border-slate-800">
                                   <span className="text-[9px] font-black text-slate-300 uppercase">HIJAB</span>
                                   <input type="number" value={s.hijab} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].hijab = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full text-center text-2xl font-black bg-transparent border-none outline-none" placeholder="0" />
                               </div>
                               <div className="col-span-2 md:col-span-1 flex justify-end">
                                  {orderForm.sizes.length > 1 && (
                                     <button type="button" onClick={() => setOrderForm(p => ({...p, sizes: p.sizes.filter((_, i) => i !== idx)}))} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X size={18} /></button>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Production Memo (Notes)</label>
                      <textarea value={orderForm.note} onChange={e => setOrderForm(p => ({...p, note: e.target.value}))} className="premium-input !h-28 !pt-6 uppercase text-[11px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="ENTER SPECIFIC MATERIAL OR CUTTING INSTRUCTIONS..." />
                   </div>

                   <div className="flex gap-6 pt-6">
                      <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-6 font-black text-[12px] uppercase tracking-[0.4em] text-slate-400 hover:text-black transition-all">ABORT</button>
                      <button type="submit" className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl border-b-[8px] border-blue-900 active:scale-95 transition-all">COMMIT ORDER</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showMaterialModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-xl p-12 rounded-[3.5rem] shadow-3xl space-y-12 border border-slate-100 dark:border-slate-800 relative">
                <button onClick={() => setShowMaterialModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-black transition-colors"><X size={28} /></button>
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-3xl -rotate-12 mb-6"><Archive size={36} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-tight italic text-black dark:text-white">STOCK INJECTION</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none italic">Update Your Factory Inventory Portfolio</p>
                </div>
                <form onSubmit={handleDepositMaterial} className="space-y-10">
                   <div className="space-y-3">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Material Identity</label>
                       <input name="item" list="mat-list-v" className="premium-input !h-16 uppercase font-black text-xs" placeholder="E.G. DUBAI CHERRY / STONE PACK" required />
                       <datalist id="mat-list-v">
                          <option value="ফেব্রিক রোল (Fabric)" />
                          <option value="পাথর (STONE PACK)" />
                          <option value="বোর্ড পিন (BOARD PIN)" />
                       </datalist>
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Quantity</label>
                          <input name="qty" type="number" className="premium-input !h-16 text-center font-black text-2xl !bg-slate-950 !text-white !border-none" placeholder="0" required />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Metric Unit</label>
                          <select name="unit" className="premium-input !h-16 font-black uppercase text-xs">
                             <option value="গজ">গজ (YDS)</option>
                             <option value="প্যাকেট">প্যাকেট (PKT)</option>
                             <option value="রোল">রোল (ROLL)</option>
                          </select>
                       </div>
                   </div>
                   <div className="space-y-3">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Reference / Note</label>
                       <input name="note" className="premium-input !h-16 uppercase text-[11px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="E.G. JET BLACK PREMIUM" required />
                   </div>
                   <div className="flex gap-6 pt-6">
                      <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 py-6 font-black text-[12px] uppercase tracking-[0.4em] text-slate-400 hover:text-black transition-all">ABORT</button>
                      <button type="submit" className="flex-[2] py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl border-b-[8px] border-emerald-900 active:scale-95 transition-all">DEPOSIT STOCK</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-xl p-12 rounded-[3.5rem] shadow-3xl space-y-12 border border-slate-100 dark:border-slate-800 relative">
                <button onClick={() => setShowPaymentModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-black transition-colors"><X size={28} /></button>
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-3xl -rotate-6 mb-6"><DollarSign size={36} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-tight italic text-black dark:text-white">SYNC FINANCIALS</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none italic">Log Payment Settlement for Factory Verification</p>
                </div>
                <form onSubmit={handlePaySubmission} className="space-y-10">
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Deposit Amount (BDT)</label>
                      <input name="amount" type="number" className="premium-input !h-28 text-5xl font-black text-center !bg-slate-950 !text-white !border-none !rounded-[2rem]" placeholder="৳ 0.00" required autoFocus />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Reference / TrxID / Method</label>
                      <input name="ref" className="premium-input !h-16 uppercase text-[11px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="E.G. BKASH / BANK / CASH" required />
                   </div>
                   <div className="flex gap-6 pt-6">
                      <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-6 font-black text-[12px] uppercase tracking-[0.4em] text-slate-400 hover:text-black transition-all">ABORT</button>
                      <button type="submit" className="flex-[2] py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl border-b-[8px] border-emerald-900 active:scale-95 transition-all">SUBMIT AUDIT</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
        {showDispatchModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-xl p-12 rounded-[3.5rem] shadow-3xl space-y-12 border border-slate-100 dark:border-slate-800 relative">
                <button onClick={() => setShowDispatchModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-black transition-colors"><X size={28} /></button>
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-3xl -rotate-6 mb-6"><Truck size={36} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-tight italic text-black dark:text-white">SELF DISPATCH</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none italic">Authorize Goods Release & Automated Billing</p>
                </div>
                <form onSubmit={handleDispatch} className="space-y-10">
                   <input type="hidden" name="design" value={activeDispatch?.design} />
                   <input type="hidden" name="color" value={activeDispatch?.color} />
                   
                   <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Item Portfolio</p>
                      <h4 className="text-xl font-black italic uppercase">{activeDispatch?.design} <span className="text-xs text-blue-500">// {activeDispatch?.color}</span></h4>
                   </div>

                   <div className="grid grid-cols-2 gap-8 text-center">
                       <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Borka Pcs</label>
                           <input name="borka" type="number" max={activeDispatch?.borka} className="premium-input !h-20 text-4xl font-black text-center" placeholder="0" required />
                       </div>
                       <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Hijab Pcs</label>
                           <input name="hijab" type="number" max={activeDispatch?.hijab} className="premium-input !h-20 text-4xl font-black text-center" placeholder="0" required />
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Total Qty (PCS)</label>
                          <input name="qty" type="number" className="premium-input !h-16 text-center font-black !bg-slate-950 !text-white !border-none" placeholder="0" required />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Rate per Pc</label>
                          <input name="rate" type="number" className="premium-input !h-16 text-center font-black !bg-blue-600 !text-white !border-none" placeholder="৳ 0.00" required />
                      </div>
                   </div>

                   <div className="space-y-3">
                       <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Receiver / Carrier Details</label>
                       <input name="receiver" className="premium-input !h-16 uppercase text-[11px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="E.G. SELF HUB / RIDER NAME" required />
                       <input name="note" type="hidden" value="MANUAL AUTHORIZATION" />
                   </div>

                   <div className="flex gap-6 pt-6">
                      <button type="button" onClick={() => setShowDispatchModal(false)} className="flex-1 py-6 font-black text-[12px] uppercase tracking-[0.4em] text-slate-400 hover:text-black transition-all">ABORT</button>
                      <button type="submit" className="flex-[2] py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl border-b-[8px] border-slate-700 active:scale-95 transition-all">AUTHORIZE RELEASE</button>
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
