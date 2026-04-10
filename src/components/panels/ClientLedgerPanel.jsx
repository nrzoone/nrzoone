import React, { useState, useMemo } from 'react';
import { 
  Users, DollarSign, ArrowRight, Activity, ShieldCheck, 
  Wallet, History, Search, Plus, X, ArrowLeft, 
  TrendingUp, TrendingDown, LayoutGrid, Printer, ChevronRight, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientLedgerPanel = ({ masterData, setMasterData, showNotify, user, setActivePanel, logAction, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [receivePaymentModal, setReceivePaymentModal] = useState(null);

  // Financial Calculations for all clients
  const clientBalances = useMemo(() => {
    return (masterData.clients || []).map(clientName => {
      let billed = 0;
      let paid = 0;
      (masterData.clientTransactions || [])
        .filter(t => t.client?.toUpperCase() === clientName.toUpperCase())
        .forEach(t => {
          if (t.type === 'BILL') billed += Number(t.amount || 0);
          if (t.type === 'PAYMENT') paid += Number(t.amount || 0);
        });
      return { 
        name: clientName, 
        billed, 
        paid, 
        due: billed - paid 
      };
    }).sort((a, b) => b.due - a.due);
  }, [masterData.clients, masterData.clientTransactions]);

  const stats = useMemo(() => {
    const totalBilled = clientBalances.reduce((sum, c) => sum + c.billed, 0);
    const totalPaid = clientBalances.reduce((sum, c) => sum + c.paid, 0);
    return {
      totalBilled,
      totalPaid,
      totalDue: totalBilled - totalPaid
    };
  }, [clientBalances]);

  const filteredClients = clientBalances.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReceivePayment = (e) => {
    e.preventDefault();
    const f = e.target;
    const amt = Number(f.amount.value);
    const client = receivePaymentModal;
    const note = f.note.value;
    const date = new Date().toLocaleDateString("en-GB");

    if (amt <= 0) return showNotify("সঠিক পরিমাণ লিখুন!", "error");

    const txn = { 
      id: `txn_${Date.now()}_P`, 
      date, 
      client, 
      type: 'PAYMENT', 
      amount: amt, 
      note: note || 'MANUAL PAYMENT' 
    };

    const cashEntry = {
      id: `CASH-${Date.now()}`,
      date,
      description: `B2B PAYMENT: ${client} - ${note}`,
      amount: amt
    };

    setMasterData(prev => ({
      ...prev,
      clientTransactions: [txn, ...(prev.clientTransactions || [])],
      cashEntries: [cashEntry, ...(prev.cashEntries || [])]
    }));

    setReceivePaymentModal(null);
    logAction(user, 'CLIENT_PAYMENT', `Received ৳${amt} from ${client}`);
    showNotify(`${client} থেকে ৳${amt.toLocaleString()} পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে!`);
  };

  return (
    <div className="space-y-10 pb-32 animate-fade-up font-outfit text-slate-950 dark:text-white">
      {/* Header Central Hub Style */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 saas-card bg-slate-950 text-white !border-slate-800 relative overflow-hidden group">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent opacity-60"></div>
         <div className="relative z-10 flex items-center gap-8">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                <LayoutGrid size={40} className="text-blue-400" />
            </div>
            <div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-2 italic">
                    Client <span className="text-blue-500">Ledger Hub</span>
                </h2>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.5em] font-mono">
                    B2B Financial Command Center • NRZONE v5.2
                </p>
            </div>
         </div>
         <div className="relative z-10 flex gap-4">
            <button 
                onClick={() => setActivePanel('Overview')}
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
            >
                <X size={24} />
            </button>
         </div>
      </div>

      {/* Analytics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-1 md:px-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="saas-card bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between group h-48 border-l-8 border-l-rose-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <TrendingDown size={140} className="text-rose-500" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-4">মোট বকেয়া (Total Receivables)</p>
                  <h3 className="text-5xl font-black tracking-tighter text-rose-500 leading-none italic">৳ {stats.totalDue.toLocaleString()}</h3>
                </div>
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                  <DollarSign size={28} />
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="h-full bg-rose-500" style={{ width: stats.totalDue > 0 ? '100%' : '0%' }}></div>
              </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="saas-card bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between group h-48 border-l-8 border-l-blue-600 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <TrendingUp size={140} className="text-blue-600" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-4">মোট বিলকৃত (Total Billed)</p>
                  <h3 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">৳ {stats.totalBilled.toLocaleString()}</h3>
                </div>
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                  <BarChart2 size={28} />
                </div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 italic">Financial Strength: Level A</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="saas-card bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between group h-48 border-l-8 border-l-emerald-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <CheckCircle size={140} className="text-emerald-500" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-4">সংগৃহীত পেমেন্ট (Collected)</p>
                  <h3 className="text-4xl font-black tracking-tight text-emerald-600 leading-none">৳ {stats.totalPaid.toLocaleString()}</h3>
                </div>
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                  <Wallet size={28} />
                </div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{((stats.totalPaid/stats.totalBilled || 0)*100).toFixed(1)}% Recovery Rate</p>
          </motion.div>
      </div>

      {/* Control & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 saas-card !p-4 border-blue-500/10 backdrop-blur-xl">
         <div className="relative group w-full md:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="সার্চ ক্লায়েন্ট..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input !pl-12 !h-14 font-bold uppercase text-[11px] tracking-widest"
            />
         </div>
         <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <Users size={16} /> Total B2B Partners: {(masterData.clients || []).length}
         </div>
      </div>

      {!selectedClient ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {filteredClients.map((item, idx) => (
               <motion.div 
                key={idx} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="saas-card bg-white dark:bg-slate-900 shadow-xl flex flex-col justify-between group h-[340px] border-l-4 border-l-slate-200 hover:border-l-blue-600 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden" 
                onClick={() => setSelectedClient(item.name)}
               >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-bl-full -mr-16 -mt-16 group-hover:bg-blue-600 transition-colors z-0"></div>
                   
                   <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Partner Agency</p>
                        <h3 className="text-2xl font-black tracking-tighter text-slate-950 dark:text-white leading-tight uppercase max-w-[220px]">{item.name}</h3>
                     </div>
                     <div className="w-12 h-12 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all">
                       <ShieldCheck size={20} className="text-slate-400 group-hover:text-blue-600" />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-50 dark:border-slate-800 relative z-10">
                      <div>
                         <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Total Billed</p>
                         <p className="font-bold text-lg text-slate-900 dark:text-white italic">৳ {item.billed.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Total Paid</p>
                         <p className="font-bold text-lg text-emerald-600 italic">৳ {item.paid.toLocaleString()}</p>
                      </div>
                   </div>

                   <div className="flex justify-between items-end mt-6 relative z-10">
                      <div>
                         <p className="text-[9px] font-black uppercase text-rose-500 tracking-[0.3em] mb-3">DUE BALANCE</p>
                         <h4 className={`text-3xl font-black leading-none tracking-tighter italic ${item.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>৳ {item.due.toLocaleString()}</h4>
                      </div>
                      <div className="flex gap-3">
                       <button 
                           onClick={(e) => { e.stopPropagation(); setReceivePaymentModal(item.name); }}
                           className="w-12 h-12 bg-emerald-600 text-white rounded-xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center border-b-4 border-emerald-900 active:scale-95"
                           title="পেমেন্ট নিন"
                       >
                           <Plus size={20} />
                       </button>
                       <button 
                           className="w-12 h-12 bg-slate-950 text-white rounded-xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center border-b-4 border-slate-800 active:scale-95"
                           title="লেজার দেখুন"
                       >
                           <ChevronRight size={20} />
                       </button>
                      </div>
                   </div>
               </motion.div>
           ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="saas-card bg-white dark:bg-slate-900 shadow-3xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <History size={240} className="text-slate-950 dark:text-white" />
           </div>
           
           <button 
             onClick={() => setSelectedClient(null)}
             className="absolute top-8 right-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-950 hover:text-white transition-all shadow-sm z-10"
           >
             <ArrowLeft size={20} />
           </button>

           <div className="mb-12 relative z-10">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] mb-4">Financial Drill-Down</p>
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-950 dark:text-white italic">{selectedClient}</h3>
              <div className="h-1.5 w-24 bg-blue-600 mt-6 rounded-full"></div>
           </div>
           
           {/* New: Client Production Requests */}
           <div className="mb-16 relative z-10">
               <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                   <h4 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                       <LayoutGrid size={20} className="text-blue-500" /> Pending Production Orders
                   </h4>
                   <span className="text-[10px] font-black px-4 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                       {(masterData.productionRequests || []).filter(r => r.client?.toUpperCase() === selectedClient.toUpperCase()).length} Orders
                   </span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {(masterData.productionRequests || [])
                       .filter(r => r.client?.toUpperCase() === selectedClient.toUpperCase())
                       .map((req, idx) => (
                           <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center group hover:border-blue-500/30 transition-all">
                               <div>
                                   <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">{req.status}</p>
                                   <h5 className="text-lg font-black uppercase leading-none mb-3 italic">{req.design}</h5>
                                   <div className="flex gap-4 text-[10px] font-black uppercase text-slate-400">
                                       <span>{req.color}</span>
                                       <span>•</span>
                                       <span>{req.qty} Pcs</span>
                                   </div>
                               </div>
                               <button 
                                 onClick={() => {
                                   if(confirm(`Approve this order for ${req.design}?`)) {
                                     setMasterData(prev => ({
                                       ...prev,
                                       productionRequests: (prev.productionRequests || []).map(r => r.id === req.id ? {...r, status: 'Approved'} : r)
                                     }));
                                     showNotify("Order marked as Approved!");
                                   }
                                 }}
                                 className="w-12 h-12 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                 title="Approve Order"
                               >
                                  <Plus size={20} />
                               </button>
                           </div>
                   ))}
                   {(masterData.productionRequests || []).filter(r => r.client?.toUpperCase() === selectedClient.toUpperCase()).length === 0 && (
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No pending orders for this client.</p>
                   )}
               </div>
           </div>
           
           <div className="overflow-x-auto relative z-10 custom-scrollbar">
               <table className="w-full text-left border-collapse">
                   <thead>
                       <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                           <th className="py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Date</th>
                           <th className="py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ref / Note</th>
                           <th className="py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Action Type</th>
                           <th className="py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Transaction</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                       {(masterData.clientTransactions || [])
                           .filter(t => t.client?.toUpperCase() === selectedClient.toUpperCase())
                           .sort((a,b) => new Date(b.date?.split('/').reverse().join('-')) - new Date(a.date?.split('/').reverse().join('-')))
                           .map((t, idx) => (
                               <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                   <td className="py-6 text-[11px] font-black uppercase tracking-widest text-slate-950 dark:text-white">{t.date}</td>
                                   <td className="py-6 max-w-sm">
                                      <p className="text-[11px] font-bold uppercase text-slate-950 dark:text-white truncate">{t.note}</p>
                                      <p className="text-[9px] font-bold text-slate-400 mt-1">ID: {t.id}</p>
                                   </td>
                                   <td className="py-6">
                                       <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${t.type === 'BILL' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800'}`}>
                                           {t.type}
                                       </span>
                                   </td>
                                   <td className={`py-6 text-right font-black text-xl italic tracking-tight ${t.type === 'BILL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                       {t.type === 'PAYMENT' ? '+' : '-'} ৳ {t.amount?.toLocaleString()}
                                   </td>
                               </tr>
                       ))}
                   </tbody>
               </table>
           </div>

           <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-60">
                <p className="text-[9px] font-bold uppercase tracking-[0.5em]">NRZONE AUDIT TRANSCRIPT</p>
                <div className="flex gap-6">
                    <button className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest hover:text-blue-600">
                        <Printer size={14} /> PRINT STATEMENT
                    </button>
                    <button className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest hover:text-blue-600">
                        <BarChart2 size={14} /> EXPORT CSV
                    </button>
                </div>
           </div>
        </motion.div>
      )}

      {/* Receiver Modal */}
      <AnimatePresence>
        {receivePaymentModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xl z-[500] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="saas-card bg-white dark:bg-slate-900 w-full max-w-xl p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] space-y-10 border-2 border-slate-50 dark:border-slate-800"
             >
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl border-b-8 border-emerald-900 rotate-6 mb-4">
                     <Wallet size={36} />
                   </div>
                   <h3 className="text-3xl font-black uppercase tracking-tight italic">Receive Payment</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Deposit Protocol Initiated</p>
                   <div className="inline-block px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-black uppercase text-blue-600">{receivePaymentModal}</p>
                   </div>
                </div>

                <form onSubmit={handleReceivePayment} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (BDT)</label>
                      <div className="relative">
                        <input name="amount" type="number" placeholder="৳ 0.00" className="premium-input !h-24 text-5xl font-black text-center !bg-slate-50 dark:!bg-slate-800 !border-none !rounded-2xl" required autoFocus />
                        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 pointer-events-none group-focus-within:border-emerald-500 transition-colors"></div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Note / Reference</label>
                      <input name="note" placeholder="E.G. BANK TRANSFER #12345" className="premium-input !h-14 uppercase text-xs font-black italic tracking-widest" required />
                   </div>
                   <div className="flex gap-6 pt-4">
                      <button type="button" onClick={() => setReceivePaymentModal(null)} className="flex-1 py-5 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-2xl">Cancel</button>
                      <button type="submit" className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl border-b-8 border-emerald-900 active:translate-y-1 active:border-b-4 transition-all">Receive & Sync</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientLedgerPanel;
