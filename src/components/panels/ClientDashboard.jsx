import React, { useState, useMemo } from 'react';
import { Truck, DollarSign, Package, Calendar, ArrowRight, Activity, ShieldCheck, Download, Boxes, Plus, X, Wallet, Archive, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientDashboard = ({ masterData, user, setMasterData, showNotify }) => {
  // Extract client's name from user object (assuming user.name is the exact client name in masterData.clients)
  const clientName = user.name;

  // Filter deliveries meant for this exact client
  const clientDeliveries = useMemo(() => {
    return (masterData.deliveries || []).filter(d => 
      d.receiver?.toUpperCase() === clientName.toUpperCase()
    ).sort((a, b) => new Date(b.date?.split('/').reverse().join('-') || 0) - new Date(a.date?.split('/').reverse().join('-') || 0));
  }, [masterData.deliveries, clientName]);

  // Read transactions meant for this client
  const clientTransactions = useMemo(() => {
    return (masterData.clientTransactions || []).filter(t => 
      t.client?.toUpperCase() === clientName.toUpperCase()
    ).sort((a, b) => new Date(b.date?.split('/').reverse().join('-') || 0) - new Date(a.date?.split('/').reverse().join('-') || 0));
  }, [masterData.clientTransactions, clientName]);

  // Financial Ledger Math
  const { totalBilled, totalPaid, dueAmount } = useMemo(() => {
    let billed = 0;
    let paid = 0;
    
    // Add up automated bills (Deliveries -> clientTransactions)
    clientTransactions.forEach(t => {
      if (t.type === 'BILL') billed += t.amount;
      if (t.type === 'PAYMENT') paid += t.amount;
    });

    return {
      totalBilled: billed,
      totalPaid: paid,
      dueAmount: billed - paid
    };
  }, [clientTransactions]);

  // Delivery Stats
  const totalPieces = clientDeliveries.reduce((sum, d) => sum + (d.qtyBorka || 0) + (d.qtyHijab || 0), 0);

  // --- NEW CMT RELEVANT LOGIC ---

  // Live Material Balances
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

  // Production Pipeline (Work In Progress)
  const productionLots = useMemo(() => {
    const cutting = (masterData.cuttingStock || []).filter(c => (c.client || '').toUpperCase() === clientName.toUpperCase());
    const pata = (masterData.pataEntries || []).filter(p => (p.client || '').toUpperCase() === clientName.toUpperCase() && p.status === 'Pending');
    
    return {
        cutting: cutting.slice(0, 5),
        pata: pata.slice(0, 5),
        totalWorkingPieces: cutting.reduce((s, c) => s + (c.borka || 0) + (c.hijab || 0), 0)
    };
  }, [masterData.cuttingStock, masterData.pataEntries, clientName]);

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
    showNotify("কাঁচামাল জমার তথ্য সফলভাবে পাঠানো হয়েছে!");
  };

  const handlePaySubmission = (e) => {
    e.preventDefault();
    const f = e.target;
    const amt = Number(f.amount.value);
    const txn = {
      id: `txn_${Date.now()}_CP`,
      date: new Date().toLocaleDateString("en-GB"),
      client: clientName,
      type: 'PAYMENT',
      amount: amt,
      note: `CLIENT SUBMISSION: ${f.ref.value}`
    };

    setMasterData(prev => ({
      ...prev,
      clientTransactions: [txn, ...(prev.clientTransactions || [])]
    }));
    setShowPaymentModal(false);
    showNotify("পেমেন্টের তথ্য জমা দেওয়া হয়েছে!");
  };

  return (
    <div className="space-y-10 pb-32 animate-fade-up px-1 md:px-4 text-black dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 saas-card bg-slate-950 text-white !border-slate-800 relative overflow-hidden group">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50"></div>
         <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">
                Client <span className="text-emerald-500">Portal</span>
            </h2>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] font-mono">
                {clientName} • B2B Interface Active
            </p>
         </div>
         <div className="relative z-10 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/5 transform group-hover:rotate-12 transition-all">
             <ShieldCheck size={28} className="text-emerald-400" />
         </div>
      </div>

      {/* Analytics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="saas-card bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Total Outstanding</p>
                  <h3 className="text-4xl font-black tracking-tighter text-rose-500 leading-none">৳ {dueAmount.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center rounded-xl">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="h-full bg-rose-500" style={{ width: dueAmount <= 0 ? '0%' : '100%' }}></div>
              </div>
          </div>

          <div className="saas-card bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Total Billed</p>
                  <h3 className="text-3xl font-bold tracking-tight text-black dark:text-white leading-none">৳ {totalBilled.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-xl">
                  <Activity size={20} />
                </div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Lifetime purchases</p>
          </div>

          <div className="saas-card bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Pieces Dispatched</p>
                  <h3 className="text-3xl font-bold tracking-tight text-black dark:text-white leading-none">{totalPieces.toLocaleString()} <span className="text-sm">Pcs</span></h3>
                </div>
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-xl">
                  <Boxes size={20} />
                </div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">Through {clientDeliveries.length} Shipments</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dispatch Log */}
          <div className="saas-card bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Dispatch Log</h3>
                 <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-bold uppercase tracking-wider">{clientDeliveries.length} Logs</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {clientDeliveries.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                          <Truck size={48} className="mb-4 opacity-50" />
                          <p className="text-[10px] uppercase tracking-widest font-bold">No Dispatches Yet</p>
                      </div>
                  ) : (
                      clientDeliveries.map((d, i) => (
                          <div key={i} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/20 group hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                      <Package size={16} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-sm uppercase leading-none mb-1">{d.design}</h4>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.color || 'MIX'} • {d.date}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-black text-lg leading-none">{(d.qtyBorka || 0) + (d.qtyHijab || 0)} <span className="text-xs">PCS</span></p>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* Financial Ledger */}
          <div className="saas-card bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Financial Ledger</h3>
                 <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-bold uppercase tracking-wider">Accounting</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {clientTransactions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                          <DollarSign size={48} className="mb-4 opacity-50" />
                          <p className="text-[10px] uppercase tracking-widest font-bold">No Transactions</p>
                      </div>
                  ) : (
                      clientTransactions.map((t, i) => (
                          <div key={i} className={`flex justify-between items-center p-5 border-l-4 rounded-xl shadow-sm ${t.type === 'PAYMENT' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-emerald-500' : 'bg-slate-50 dark:bg-slate-800/50 border-l-slate-400'}`}>
                              <div>
                                  <h4 className="font-bold text-xs uppercase leading-none mb-1">{t.type === 'BILL' ? 'Auto-Bill (Delivery)' : 'Payment Processed'}</h4>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-[200px] truncate">{t.note}</p>
                                  <p className="text-[9px] font-bold text-slate-400 mt-2">{t.date}</p>
                              </div>
                              <div className="text-right">
                                  <p className={`font-black text-xl leading-none tracking-tight ${t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                      {t.type === 'PAYMENT' ? '+' : '-'} ৳{t.amount?.toLocaleString()}
                                  </p>
                              </div>
                          </div>
                      ))
                  )}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
                 <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-4 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl"
                 >
                    Submit New Payment Info
                 </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Raw Materials */}
          <div className="saas-card bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Material Inventory</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Managed stock in factory</p>
                 </div>
                 <button 
                  onClick={() => setShowMaterialModal(true)}
                  className="bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                 >
                    <Plus size={14} /> <span className="hidden md:inline">Deposit Material</span>
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {materialStocks.length === 0 ? (
                      <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-300">
                          <Boxes size={48} className="mb-4 opacity-50" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-center">No Materials Logged</p>
                      </div>
                  ) : (
                      materialStocks.map((m, i) => (
                          <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{m.name}</p>
                              <p className="text-3xl font-black text-black dark:text-white leading-none">{m.qty.toLocaleString()} <span className="text-sm font-bold opacity-50">{m.unit}</span></p>
                              <div className="mt-4 flex gap-1">
                                 <div className={`h-1 flex-1 rounded-full ${m.qty < 5 ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`}></div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* Production Pipeline */}
          <div className="saas-card bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[500px] border-l-4 border-l-amber-500">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Live Production</h3>
                 <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-md text-[9px] font-bold uppercase tracking-wider italic">In-Progress</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                  {productionLots.cutting.length === 0 && productionLots.pata.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300">
                          <Activity size={48} className="mb-4 opacity-50" />
                          <p className="text-[10px] uppercase tracking-widest font-bold">No Active Lots</p>
                      </div>
                  ) : (
                      <>
                        {productionLots.cutting.map((lot, i) => (
                            <div key={`c-${i}`} className="p-5 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 bg-amber-500 text-white text-[8px] font-bold uppercase tracking-widest rounded-bl-xl shadow-lg">In Cutting</div>
                                <h4 className="font-black text-sm uppercase mb-1">Lot #{lot.lotNo} - {lot.design}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">{lot.color} • Issued: {lot.date}</p>
                                <div className="flex gap-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                                     <div className="text-center"><p className="text-[9px] font-bold text-slate-400">BORKA</p><p className="font-black text-xl">{lot.borka}</p></div>
                                     <div className="text-center"><p className="text-[9px] font-bold text-slate-400">HIJAB</p><p className="font-black text-xl">{lot.hijab}</p></div>
                                </div>
                            </div>
                        ))}
                        {productionLots.pata.map((lot, i) => (
                            <div key={`p-${i}`} className="p-5 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 bg-blue-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-bl-xl shadow-lg">In Pata Work</div>
                                <h4 className="font-black text-sm uppercase mb-1">Lot #{lot.lotNo} - {lot.design}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quantity: {lot.pataQty} Pcs • Issued: {lot.date}</p>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full"><div className="w-1/2 h-full bg-blue-500 rounded-full animate-pulse"></div></div>
                            </div>
                        ))}
                      </>
                  )}
              </div>
          </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showMaterialModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[500] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="saas-card bg-white dark:bg-slate-900 w-full max-w-lg p-10 shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                   <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl"><Archive size={28} /></div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Deposit Material</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Log fabric or accessories provided</p>
                </div>
                <form onSubmit={handleDepositMaterial} className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Material Name</label>
                      <input name="item" list="cm-mat-list" className="premium-input !h-12 uppercase font-black" placeholder="E.G. FABRIC ROLL" required />
                      <datalist id="cm-mat-list">
                         <option value="ফেব্রিক রোল (Fabric)" />
                         <option value="পাথর প্যাকেট (Stone)" />
                         <option value="পেপার রোল (Paper)" />
                      </datalist>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                        <input name="qty" type="number" className="premium-input !h-12 font-black text-center" placeholder="0" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unit</label>
                        <select name="unit" className="premium-input !h-12 font-black uppercase">
                           <option value="গজ">গজ (Yards)</option>
                           <option value="প্যাকেট">প্যাকেট (Stone)</option>
                           <option value="রোল">রোল (Paper)</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Note (Color/Lot)</label>
                      <input name="note" className="premium-input !h-12 uppercase text-[11px] font-bold" placeholder="E.G. BLUE COLOR LOT A" required />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest">Cancel</button>
                      <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirm Deposit</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[500] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="saas-card bg-white dark:bg-slate-900 w-full max-w-lg p-10 shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                   <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl"><Wallet size={28} /></div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Submit Payment Info</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Record bank or cash transfer</p>
                </div>
                <form onSubmit={handlePaySubmission} className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount (BDT)</label>
                      <input name="amount" type="number" className="premium-input !h-16 text-3xl font-black text-center !bg-slate-50 dark:!bg-slate-800" placeholder="৳ 0.00" required />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ref / TrxID / Method</label>
                      <input name="ref" className="premium-input !h-12 uppercase text-[11px] font-bold" placeholder="E.G. BANK TRANSFER / TRX123" required />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest">Cancel</button>
                      <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Submit Info</button>
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
