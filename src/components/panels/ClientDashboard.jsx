import React, { useState, useMemo } from 'react';
import { 
  Truck, DollarSign, Package, Calendar, ArrowRight, Activity, 
  ShieldCheck, Download, Boxes, Plus, X, Wallet, Archive, 
  History, ShoppingCart, Send, Layers, CheckCircle, Clock, BarChart2,
  Search, User, ArrowLeft, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientDashboard = ({ masterData, user, setMasterData, showNotify, logAction }) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const [selectedClient, setSelectedClient] = useState(isAdmin ? null : user.name);
  const clientName = selectedClient || '';

  // -- Modals --
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMalEntryModal, setShowMalEntryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // -- Advanced Order State --
  const [orderForm, setOrderForm] = useState({
    design: '',
    color: '',
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
            const colorTag = log.color || '';
            const designTag = log.design || '';
            const key = `${log.item}||${colorTag}||${designTag}`;
            if (!stocks[key]) stocks[key] = { qty: 0, unit: log.unit || 'গজ', item: log.item, color: colorTag, design: designTag };
            if (log.type === 'in') stocks[key].qty += Number(log.qty);
            else stocks[key].qty -= Number(log.qty);
        }
    });
    return Object.values(stocks).filter(s => s.qty !== 0);
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
    const stocks = {};
    (masterData.finishedStock || [])
      .filter(s => (s.client || '').toUpperCase() === clientName.toUpperCase())
      .forEach(s => {
          const key = `${s.design}_${s.color || 'MIX'}`;
          if (!stocks[key]) stocks[key] = { design: s.design, color: s.color || 'MIX', qty: 0 };
          stocks[key].qty += Number(s.qty || 0);
      });
    
    // Deduct already delivered items from the finished stock log
    (masterData.deliveries || [])
      .filter(d => (d.client || '').toUpperCase() === clientName.toUpperCase())
      .forEach(d => {
          const key = `${d.design}_${d.color || 'MIX'}`;
          if (stocks[key]) {
              stocks[key].qty -= Number(d.qty || 0);
          }
      });

    return Object.values(stocks).filter(s => s.qty > 0);
  }, [masterData.finishedStock, masterData.deliveries, clientName]);

  const financials = useMemo(() => {
    let billed = 0, paid = 0;
    (clientTransactions || []).forEach(t => {
      if (!t) return;
      if (t.type === 'BILL') billed += Number(t.amount || 0);
      if (t.type === 'PAYMENT') paid += Number(t.amount || 0);
    });
    return { billed, paid, due: billed - paid };
  }, [clientTransactions]);

  const totalDelivered = (clientDeliveries || []).reduce((sum, d) => sum + (Number(d?.qtyBorka || 0) + Number(d?.qtyHijab || 0)), 0);


  // -- Handlers --
  const shareToWhatsApp = (message) => {
    const factoryNum = (masterData.settings?.whatsappNumber || '8801700000000').replace(/\D/g, "");
    const formattedNum = factoryNum.startsWith("880") ? factoryNum : "880" + factoryNum.replace(/^0/, "");
    window.open(`https://wa.me/${formattedNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

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
      color: orderForm.color,
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
    setOrderForm({ design: '', color: '', fabricGoj: '', sizes: [{ size: '', borka: '', hijab: '' }], note: '' });
    showNotify("ভল্টে নতুন অর্ডার জমা হয়েছে!", "success");
    logAction(user, 'CLIENT_ORDER_ENTRY', `Order placed for ${orderForm.design}. Fabric: ${orderForm.fabricGoj}YDS`);
  };

  const handleMalEntry = (e) => {
    e.preventDefault();
    const f = e.target;
    const timestamp = Date.now();
    
    const entry = {
      id: `MAL_${timestamp}`,
      date: f.date.value || new Date().toLocaleDateString("en-GB"),
      client: clientName,
      design: f.design.value,
      color: f.color.value,
      size: f.size.value,
      qtyBorka: Number(f.borka.value || 0),
      qtyHijab: Number(f.hijab.value || 0),
      qty: Number(f.borka.value || 0) + Number(f.hijab.value || 0),
      note: f.note.value,
      type: 'direct_entry'
    };

    setMasterData(prev => ({
      ...prev,
      finishedStock: [entry, ...(prev.finishedStock || [])]
    }));

    setShowMalEntryModal(false);
    showNotify("মাল এন্ট্রি সফল হয়েছে!", "success");
    logAction(user, 'CLIENT_MAL_ENTRY', `Received ${entry.qty} pcs of ${entry.design} (${entry.color})`);

    if (window.confirm("মাল এন্ট্রি রিপোর্ট হোয়াটসঅ্যাপে পাঠাতে চান?")) {
        const msg = `*NRZ0ONE MAL ENTRY REPORT*\n\n` +
                    `📅 Date: ${entry.date}\n` +
                    `📌 Design: ${entry.design}\n` +
                    `🎨 Color: ${entry.color}\n` +
                    `📏 Size: ${entry.size}\n` +
                    `📦 Borka: ${entry.qtyBorka} PCS\n` +
                    `📦 Hijab: ${entry.qtyHijab} PCS\n` +
                    `👤 Client: ${clientName}\n` +
                    `📝 Note: ${entry.note}`;
        shareToWhatsApp(msg);
    }
  };

  const handleDepositMaterial = (e) => {
    e.preventDefault();
    const f = e.target;
    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-GB"),
      item: f.item.value,
      color: f.color?.value || '',
      design: f.design?.value || '',
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

    if (window.confirm("স্টোক ইনজেকশন রিপোর্ট হোয়াটসঅ্যাপে পাঠাতে চান?")) {
        const colorInfo = newItem.color ? ` | Color: ${newItem.color}` : '';
        const designInfo = newItem.design ? ` | Design: ${newItem.design}` : '';
        shareToWhatsApp(`*NRZ0ONE MATERIAL DEPOSIT*\n\nItem: ${newItem.item}${colorInfo}${designInfo}\nQty: ${newItem.qty} ${newItem.unit}\nClient: ${clientName}\nRef: ${newItem.note}`);
    }
  };

  const handlePaySubmission = (e) => {
    e.preventDefault();
    const f = e.target;
    const amount = Number(f.amount.value);
    const ref = f.ref.value;
    const txn = {
      id: `txn_${Date.now()}_CP`,
      date: new Date().toLocaleDateString("en-GB"),
      client: clientName,
      type: 'PAYMENT',
      amount,
      note: `CLIENT PAYMENT INFO: ${ref}`
    };
    const cash = { id: `CASH-${Date.now()}`, date: new Date().toLocaleDateString("en-GB"), description: `B2B PAYMENT: ${clientName}`, amount: Number(amount) };
    setMasterData(prev => ({
      ...prev,
      clientTransactions: [txn, ...(prev.clientTransactions || [])],
      cashEntries: [cash, ...(prev.cashEntries || [])]
    }));
    setShowPaymentModal(false);
    showNotify("পেমেন্ট অডিট কিউতে পাঠানো হয়েছে!", "success");

    if (window.confirm("পেমেন্ট রিপোর্ট হোয়াটসঅ্যাপে পাঠাতে চান?")) {
        shareToWhatsApp(`*NRZ0ONE PAYMENT RECEIPT*\n\nAmount: ৳ ${amount.toLocaleString()}\nMethod: ${ref}\nClient: ${clientName}\nStatus: VERIFICATION PENDING`);
    }
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
    showNotify("ডিসপ্যাচ সম্পন্ন হয়েছে!", "success");
    logAction(user, 'CLIENT_SELF_DISPATCH', `${qty} PCS of ${design} dispatched by client.`);

    if (window.confirm("ডিসপ্যাচ স্লিপ বা বিল হোয়াটসঅ্যাপে পাঠাতে চান?")) {
        const msg = `*NRZ0ONE DISPATCH SLIP*\n\n` +
                    `📦 Item: ${design}\n` +
                    `🎨 Color: ${delivery.color}\n` +
                    `🔢 Qty: ${qty} PCS\n` +
                    `💰 Total Bill: ৳ ${(rate * qty).toLocaleString()}\n` +
                    `👤 Receiver: ${delivery.receiver}\n` +
                    `📅 Date: ${date}\n\n` +
                    `*Current Outstanding Dashboard Balance: ৳ ${(financials.due + (rate * qty)).toLocaleString()}*`;
        shareToWhatsApp(msg);
    }
  };

  if (isAdmin && !selectedClient) {
    const clients = [...new Set((masterData.productionRequests || []).map(r => r.client))].filter(Boolean);
    const filteredClients = clients.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="min-h-screen pb-32 animate-fade-up font-outfit px-4 md:px-10">
        <div className="py-12 text-center space-y-4">
           <h2 className="text-4xl font-black italic uppercase tracking-tighter">B2B <span className="text-blue-600">CLIENT HUB</span></h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Select a client to view 360° Dashboard</p>
        </div>

        <div className="max-w-xl mx-auto mb-12 relative group">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all" />
            <input 
              placeholder="সার্চ ক্লায়েন্ট (Search Client Name)..." 
              className="premium-input !h-16 !pl-16 !pr-8 !text-base shadow-2xl !rounded-[2rem] border-slate-200 dark:border-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.length === 0 ? (
                <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-100 dark:border-slate-800 text-center italic text-slate-400">
                    No active B2B clients found.
                </div>
            ) : (
                filteredClients.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedClient(c)}
                      className="saas-card group p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all flex flex-col items-start gap-3 text-left shadow-lg"
                    >
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><User size={18} /></div>
                        <div>
                            <h4 className="text-lg font-black uppercase italic leading-none truncate w-full">{c}</h4>
                            <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase tracking-widest leading-none italic">View Performance Dashboard</p>
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 animate-fade-up font-outfit text-slate-950 dark:text-white px-1 md:px-6">
      {isAdmin && (
        <button 
          onClick={() => setSelectedClient(null)}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
        >
          <ArrowLeft size={14} /> Back to Client Hub
        </button>
      )}
      {/* SaaS Compact Header */}
      <div className="saas-card bg-slate-950 text-white !border-none relative overflow-hidden group mb-4 p-4 md:p-6 rounded-2xl shadow-xl">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600/20 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                    <ShieldCheck size={24} className="text-blue-400" />
                </div>
                <div className="text-center lg:text-left">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-none mb-1 italic">
                        B2B <span className="text-blue-500">ARCHIVE</span>
                    </h2>
                    <p className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.4em] font-mono leading-none">
                        ENTITY: {clientName}
                    </p>
                </div>
            </div>
            
            {isAdmin && (
               <div className="flex gap-2 w-full lg:w-auto flex-wrap justify-center">
                  <button onClick={() => setShowOrderModal(true)} className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                     <ShoppingCart size={14} /> NEW ORDER
                  </button>
                  <button onClick={() => setShowMalEntryModal(true)} className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-slate-100 text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all border border-slate-200">
                     <Plus size={14} /> PRODUCTION
                  </button>
                  <button onClick={() => setShowPaymentModal(true)} className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                     <Wallet size={14} /> PAYMENT
                  </button>
               </div>
            )}
         </div>
      </div>

      {/* High-Density Analytics HUB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="saas-card bg-white dark:bg-slate-900 p-3 md:p-4 shadow-lg border-l-4 border-l-rose-500 group rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CURRENT DEBT</p>
              <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white italic tabular-nums">৳ {financials.due.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 p-3 md:p-4 shadow-lg border-l-4 border-l-emerald-500 group rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SETTLED FUND</p>
              <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white italic tabular-nums">৳ {financials.paid.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 p-3 md:p-4 shadow-lg border-l-4 border-l-blue-600 group rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL BILLED</p>
              <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white italic tabular-nums">৳ {financials.billed.toLocaleString()}</h3>
          </div>
          <div className="saas-card bg-white dark:bg-slate-900 p-3 md:p-4 shadow-lg border-l-4 border-l-slate-950 dark:border-l-white group rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GLOBAL OUTPUT</p>
              <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white italic tabular-nums">{totalDelivered.toLocaleString()} <span className="text-[9px] uppercase opacity-30">PCS</span></h3>
          </div>
      </div>

      {/* Operational Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          <div className="lg:col-span-2 space-y-6">
              <div className="saas-card bg-white dark:bg-slate-900 shadow-xl min-h-[400px] flex flex-col !p-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="p-5 md:p-6 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center shadow-inner"><Layers size={18} /></div>
                          <h3 className="text-lg font-black uppercase tracking-tight italic">ACTIVE ORDERS</h3>
                      </div>
                      <span className="text-[8px] font-black px-3 py-1 bg-slate-950 text-white rounded-full uppercase tracking-widest shadow-xl">{myProductionRequests.length} QUEUED</span>
                  </div>
                  
                  <div className="p-5 md:p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                      {myProductionRequests.length === 0 ? (
                          <div className="py-20 flex flex-col items-center justify-center opacity-20">
                              <Archive size={40} className="mb-4" />
                              <p className="text-[9px] font-black uppercase tracking-[0.4em]">No active queue logs</p>
                          </div>
                      ) : (
                          myProductionRequests.map((req, i) => (
                              <div key={i} className="group p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center hover:border-blue-500/20 transition-all border-l-[6px] border-l-blue-600">
                                  <div className="space-y-1.5">
                                      <h4 className="text-base font-black uppercase leading-none italic">{req.design}</h4>
                                      <div className="flex items-center gap-3 text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                          <span className="bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md shadow-sm italic">🧵 {req.fabricGoj}YDS</span>
                                          <span className="bg-slate-950 text-white px-2 py-0.5 rounded-md shadow-sm">📦 {req.totalBorka + req.totalHijab} PCS</span>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-md ${req.status === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white animate-pulse'}`}>
                                          {req.status}
                                      </span>
                                      <p className="text-[8px] font-black text-slate-400 mt-1.5 font-mono">{req.date}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="saas-card bg-emerald-600 text-white shadow-2xl relative overflow-hidden group !p-6 rounded-2xl">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.1] group-hover:rotate-12 transition-transform"><Archive size={100} /></div>
                  <h4 className="text-base font-black uppercase tracking-[0.2em] mb-6 relative z-10 flex items-center justify-between italic">
                    RAW STOCK <Plus size={16} className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setShowMaterialModal(true)} />
                  </h4>
                  <div className="grid grid-cols-1 gap-3 relative z-10">
                      {materialStocks.length === 0 ? (
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest italic leading-relaxed">No warehouse inventory established for this entity.</p>
                      ) : (
                          materialStocks.map((m, i) => (
                              <div key={i} className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10 shadow-xl group/item hover:bg-white/20 transition-all">
                                  <div className="flex justify-between items-start mb-1.5">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-100 italic underline decoration-white/20">{m.item}</p>
                                    {m.design && <span className="text-[7px] font-black bg-white/15 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{m.design}</span>}
                                  </div>
                                  {m.color && <p className="text-[8px] font-black text-emerald-300/80 uppercase tracking-widest mb-1 italic">🎨 {m.color}</p>}
                                  <p className="text-2xl font-black italic tracking-tighter tabular-nums">{m.qty.toLocaleString()} <span className="text-[9px] uppercase font-black text-white/50">{m.unit}</span></p>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              <div className="saas-card bg-white dark:bg-slate-900 shadow-xl !p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-base font-black uppercase tracking-tight mb-6 pb-3 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3 italic text-blue-600">
                      <Boxes size={18} className="animate-pulse" /> WAREHOUSE (READY)
                  </h4>
                  <div className="space-y-3">
                      {readyStock.length === 0 ? (
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl text-center space-y-3 border border-dashed border-slate-100 dark:border-slate-800">
                             <Activity size={24} className="mx-auto text-slate-300" />
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No stock awaiting dispatch.</p>
                          </div>
                      ) : (
                          readyStock.map((s, i) => (
                              <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500 transition-all">
                                  <div>
                                      <p className="text-[9px] font-black uppercase leading-none mb-1 italic">{s.design}</p>
                                      <p className="text-[8px] font-black text-slate-400 uppercase">{s.color}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="text-right">
                                          <p className="text-lg font-black italic">{s.qty} <span className="text-[8px] text-slate-400">PCS</span></p>
                                      </div>
                                      <button 
                                        onClick={() => { setActiveDispatch(s); setShowDispatchModal(true); }}
                                        className="w-9 h-9 bg-slate-950 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-105"
                                      >
                                          <Truck size={14} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  <h4 className="text-base font-black uppercase tracking-tight mt-10 mb-6 pb-3 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3 italic text-amber-500">
                      <Clock size={18} className="animate-spin-slow" /> PRODUCTION PIPELINE
                  </h4>
                  <div className="space-y-4">
                      {liveLots.length === 0 ? (
                          <p className="text-[9px] font-black text-slate-400 uppercase text-center py-4">No lots in active assembly.</p>
                      ) : (
                          liveLots.map((lot, idx) => (
                              <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <p className="text-[9px] font-black uppercase italic">{lot.design} <span className="text-slate-400 text-[8px]">// {lot.color}</span></p>
                                  <div className="flex justify-between items-center mt-1.5">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS: {lot.status}</p>
                                      <p className="text-xs font-black italic tracking-tighter">{lot.lotNo}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl !p-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="p-4 md:p-5 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                   <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-3">
                       <Truck size={18} className="text-blue-600" /> DELIVERY FEED
                   </h3>
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">{clientDeliveries.length} RECS</span>
               </div>
               <div className="p-4 md:p-5 space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar">
                   {clientDeliveries.map((d, i) => (
                       <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center group hover:border-blue-500/20 transition-all">
                           <div className="flex items-center gap-3">
                               <div className="w-9 h-9 bg-white dark:bg-slate-950 rounded-lg flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                   <Package size={14} className="text-blue-500" />
                               </div>
                               <div>
                                   <h4 className="text-[11px] font-black uppercase leading-none mb-0.5 italic">{d.design}</h4>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{d.date}</p>
                               </div>
                           </div>
                           <p className="text-base font-black italic">{(d.qtyBorka || 0) + (d.qtyHijab || 0)} <span className="text-[8px] uppercase font-black text-slate-300">PCS</span></p>
                       </div>
                   ))}
               </div>
          </div>

          <div className="saas-card bg-white dark:bg-slate-900 shadow-xl !p-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="p-4 md:p-5 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                   <h3 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-3 text-emerald-600">
                       <Wallet size={18} /> LEDGER AUDIT
                   </h3>
                   <button onClick={() => setShowPaymentModal(true)} className="p-2 bg-slate-950 text-white rounded-lg shadow-xl hover:scale-105 active:scale-95 transition-all"><Plus size={12} /></button>
               </div>
               {/* Department-wise Bill Breakdown */}
               {(() => {
                   const bills = clientTransactions.filter(t => t.type === 'BILL');
                   const sewingTotal = bills.filter(t => t.dept === 'SEWING' || t.note?.startsWith('SEWING')).reduce((s,t) => s + (t.amount || 0), 0);
                   const stoneTotal = bills.filter(t => t.dept === 'STONE' || t.note?.startsWith('STONE')).reduce((s,t) => s + (t.amount || 0), 0);
                   const pataTotal = bills.filter(t => t.dept === 'PATA' || t.note?.startsWith('PATA')).reduce((s,t) => s + (t.amount || 0), 0);
                   const outsideTotal = bills.filter(t => t.dept === 'OUTSIDE' || t.note?.startsWith('OUTSIDE')).reduce((s,t) => s + (t.amount || 0), 0);
                   const hasAny = sewingTotal || stoneTotal || pataTotal || outsideTotal;
                   return hasAny ? (
                     <div className="p-3 md:p-4 grid grid-cols-4 gap-2 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                       <div className="text-center">
                         <p className="text-[7px] font-black uppercase tracking-widest text-blue-500 mb-0.5">SEWING</p>
                         <p className="text-sm font-black italic text-blue-600 tabular-nums">৳{sewingTotal.toLocaleString()}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[7px] font-black uppercase tracking-widest text-amber-500 mb-0.5">STONE</p>
                         <p className="text-sm font-black italic text-amber-600 tabular-nums">৳{stoneTotal.toLocaleString()}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[7px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">PATA</p>
                         <p className="text-sm font-black italic text-emerald-600 tabular-nums">৳{pataTotal.toLocaleString()}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[7px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">OUTSIDE</p>
                         <p className="text-sm font-black italic text-indigo-600 tabular-nums">৳{outsideTotal.toLocaleString()}</p>
                       </div>
                     </div>
                   ) : null;
               })()}
               <div className="p-4 md:p-5 space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar">
                   {clientTransactions.map((t, i) => {
                       const deptColor = t.dept === 'SEWING' || t.note?.startsWith('SEWING') ? 'bg-blue-500'
                         : t.dept === 'STONE' || t.note?.startsWith('STONE') ? 'bg-amber-500'
                         : t.dept === 'PATA' || t.note?.startsWith('PATA') ? 'bg-emerald-500'
                         : t.dept === 'OUTSIDE' || t.note?.startsWith('OUTSIDE') ? 'bg-indigo-500'
                         : '';
                       const deptLabel = t.dept || (t.note?.match(/^(SEWING|STONE|PATA|OUTSIDE)/)?.[1]) || '';
                       return (
                       <div key={i} className={`p-3 rounded-xl flex justify-between items-center ${t.type === 'PAYMENT' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-slate-50 dark:bg-slate-800/30'}`}>
                           <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-0.5">
                                   <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-900 dark:text-white italic">
                                     {t.type === 'BILL' ? 'INVOICE' : 'SETTLEMENT'}
                                   </h4>
                                   {deptLabel && t.type === 'BILL' && (
                                     <span className={`${deptColor} text-white text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm`}>{deptLabel}</span>
                                   )}
                               </div>
                               {t.note && t.type === 'BILL' && <p className="text-[7px] font-bold text-slate-400 truncate max-w-[160px] italic">{t.note.replace(/^(SEWING|STONE|PATA|OUTSIDE) BILL: /, '')}</p>}
                               <p className="text-[8px] font-black text-slate-400 mt-0.5">{t.date}</p>
                           </div>
                           <p className={`text-base font-black italic tracking-tighter tabular-nums ${t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-950 dark:text-white'}`}>
                               ৳ {t.amount?.toLocaleString()}
                           </p>
                       </div>
                       );
                   })}
               </div>
          </div>
      </div>

      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 md:p-8 rounded-3xl shadow-3xl space-y-6 border border-slate-100 dark:border-slate-800 relative my-auto">
                <button onClick={() => setShowOrderModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={20} /></button>
                <div className="text-center space-y-1.5">
                   <div className="w-14 h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg rotate-3 mb-2"><ShoppingCart size={24} /></div>
                   <h3 className="text-xl font-black uppercase tracking-tight italic text-black dark:text-white leading-none">NEW PRODUCTION</h3>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none italic">Entity: {clientName}</p>
                </div>

                 <form onSubmit={handleSubmitOrder} className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Design</label>
                             <select value={orderForm.design} onChange={e => setOrderForm(p => ({...p, design: e.target.value}))} className="premium-input !h-11 font-black uppercase text-[10px]" required>
                                <option value="">SELECT...</option>
                                {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                             </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Color</label>
                            <select value={orderForm.color} onChange={e => setOrderForm(p => ({...p, color: e.target.value}))} className="premium-input !h-11 font-black uppercase text-[10px]" required>
                                <option value="">SELECT...</option>
                                {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Fabric (YDS)</label>
                       <input type="number" value={orderForm.fabricGoj} onChange={e => setOrderForm(p => ({...p, fabricGoj: e.target.value}))} className="premium-input !h-11 text-center font-black text-base !bg-slate-950 !text-white !border-none" placeholder="0.00" required />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                       <div className="flex justify-between items-center mb-1">
                          <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] italic leading-none">Size Configuration</h4>
                          <button type="button" onClick={() => setOrderForm(p => ({...p, sizes: [...p.sizes, { size: '', borka: '', hijab: '' }]}))} className="w-7 h-7 bg-slate-950 text-white rounded-lg flex items-center justify-center hover:scale-110 shadow-md"><Plus size={12} /></button>
                       </div>
                       <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                          {orderForm.sizes.map((s, idx) => (
                             <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 group relative">
                                <div className="col-span-4 flex items-center gap-2">
                                   <select value={s.size} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].size = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full bg-slate-50 dark:bg-slate-950 h-9 rounded-lg text-[9px] font-black uppercase border-none outline-none text-center" required>
                                       <option value="">SIZE</option>
                                       {(masterData.sizes || []).map(z => <option key={z} value={z}>{z}</option>)}
                                   </select>
                                </div>
                                <div className="col-span-3 flex items-center gap-1 px-2 border-l border-slate-100 dark:border-slate-800">
                                   <input type="number" value={s.borka} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].borka = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full text-center text-base font-black bg-transparent border-none outline-none" placeholder="B:0" />
                                </div>
                                <div className="col-span-3 flex items-center gap-1 px-2 border-l border-slate-100 dark:border-slate-800">
                                    <input type="number" value={s.hijab} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].hijab = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full text-center text-base font-black bg-transparent border-none outline-none" placeholder="H:0" />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                   {orderForm.sizes.length > 1 && (
                                      <button type="button" onClick={() => setOrderForm(p => ({...p, sizes: p.sizes.filter((_, i) => i !== idx)}))} className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><X size={12} /></button>
                                   )}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Notes</label>
                       <textarea value={orderForm.note} onChange={e => setOrderForm(p => ({...p, note: e.target.value}))} className="premium-input !h-16 !pt-2 uppercase text-[9px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="ENTER INSTRUCTIONS..." />
                    </div>

                    <div className="flex gap-3 pt-2">
                       <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-3.5 font-black text-[9px] uppercase tracking-[0.3em] text-slate-400 hover:text-black transition-all">ABORT</button>
                       <button type="submit" className="flex-[3] py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-lg border-b-4 border-blue-900 active:scale-95 transition-all">COMMIT ORDER</button>
                    </div>
                 </form>
             </motion.div>
          </div>
        )}

        {showMaterialModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-3xl space-y-6 border border-slate-100 dark:border-slate-800 relative my-auto">
                <button onClick={() => setShowMaterialModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={20} /></button>
                <div className="text-center space-y-1.5">
                   <div className="w-14 h-14 bg-emerald-600 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg -rotate-3 mb-2"><Archive size={24} /></div>
                   <h3 className="text-xl font-black uppercase tracking-tight italic text-black dark:text-white leading-none">STOCK DEPOSIT</h3>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none italic">Log Material Injection</p>
                </div>
                <form onSubmit={handleDepositMaterial} className="space-y-5">
                   <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">আইটেম (Identity)</label>
                       <input name="item" list="mat-list-v" className="premium-input !h-11 uppercase font-black text-[10px]" placeholder="E.G. FABRIC ROLL" required />
                       <datalist id="mat-list-v">
                          <option value="ফেব্রিক রোল (Fabric)" />
                          <option value="পাথর (STONE PACK)" />
                          <option value="বোর্ড পিন (BOARD PIN)" />
                          <option value="সুতা (Thread)" />
                          <option value="জিপার (Zipper)" />
                       </datalist>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">🎨 রঙ (Color)</label>
                          <select name="color" className="premium-input !h-11 font-black uppercase text-[10px]">
                             <option value="">-- COLOR --</option>
                             {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">📐 ডিজাইন (Design)</label>
                          <select name="design" className="premium-input !h-11 font-black uppercase text-[10px]">
                             <option value="">-- DESIGN --</option>
                             {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                          </select>
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">পরিমাণ (Qty)</label>
                          <input name="qty" type="number" step="any" className="premium-input !h-11 text-center font-black text-base !bg-slate-950 !text-white !border-none" placeholder="0" required />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">একক (Unit)</label>
                          <select name="unit" className="premium-input !h-11 font-black uppercase text-[9px]">
                             <option value="গজ">গজ (YDS)</option>
                             <option value="প্যাকেট">প্যাকেট (PKT)</option>
                             <option value="রোল">রোল (ROLL)</option>
                             <option value="পিস">পিস (PCS)</option>
                          </select>
                       </div>
                   </div>
                   <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">নোট (Note)</label>
                       <input name="note" className="premium-input !h-11 uppercase text-[9px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="অতিরিক্ত তথ্য..." />
                   </div>
                   <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 py-3.5 font-black text-[9px] text-slate-400 uppercase">ABORT</button>
                      <button type="submit" className="flex-[3] py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase shadow-lg border-b-4 border-emerald-900 active:scale-95 transition-all">INJECT STOCK</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-3xl space-y-6 border border-slate-100 dark:border-slate-800 relative my-auto">
                <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={20} /></button>
                <div className="text-center space-y-1.5">
                   <div className="w-14 h-14 bg-rose-600 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg rotate-2 mb-2"><DollarSign size={24} /></div>
                   <h3 className="text-xl font-black uppercase tracking-tight italic text-black dark:text-white leading-none">FINANCE SYNC</h3>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none italic">Log Fund Settlement</p>
                </div>
                <form onSubmit={handlePaySubmission} className="space-y-5">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Amount (BDT)</label>
                      <input name="amount" type="number" className="premium-input !h-14 text-2xl font-black text-center !bg-slate-950 !text-white !border-none rounded-2xl" placeholder="৳ 0.00" required autoFocus />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Reference / Method</label>
                      <input name="ref" className="premium-input !h-11 uppercase text-[9px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="BKASH / BANK / CASH" required />
                   </div>
                   <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3.5 font-black text-[9px] text-slate-400 uppercase">ABORT</button>
                      <button type="submit" className="flex-[3] py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase shadow-lg border-b-4 border-emerald-900 active:scale-95 transition-all">SYNC FUND</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showDispatchModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-3xl space-y-6 border border-slate-100 dark:border-slate-800 relative my-auto">
                <button onClick={() => setShowDispatchModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={20} /></button>
                <div className="text-center space-y-1.5">
                   <div className="w-14 h-14 bg-slate-950 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg -rotate-3 mb-2"><Truck size={24} /></div>
                   <h3 className="text-xl font-black uppercase tracking-tight italic text-black dark:text-white leading-none">SELF DISPATCH</h3>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none italic">Goods Authorization</p>
                </div>
                <form onSubmit={handleDispatch} className="space-y-5">
                   <input type="hidden" name="design" value={activeDispatch?.design} />
                   <input type="hidden" name="color" value={activeDispatch?.color} />
                   
                   <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black italic uppercase text-blue-600 leading-none">{activeDispatch?.design} <span className="text-[8px] text-slate-400 opacity-50 block mt-1">// {activeDispatch?.color}</span></h4>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Total PCS</label>
                           <input name="qty" type="number" max={activeDispatch?.qty} className="premium-input !h-11 text-center font-black !bg-slate-950 !text-white !border-none" placeholder="0" required />
                       </div>
                       <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Rate</label>
                           <input name="rate" type="number" defaultValue={(masterData.designs?.find(d => d.name === activeDispatch?.design)?.clientRates?.[clientName]?.fullBody) || 0} className="premium-input !h-11 text-center font-black !bg-blue-600 !text-white !border-none" placeholder="৳ 0.00" required />
                       </div>
                   </div>

                   <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Carrier</label>
                       <input name="receiver" className="premium-input !h-11 uppercase text-[9px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="RIDER / HUB NAME" required />
                       <input name="note" type="hidden" value="SELF DISPATCH" />
                       <input name="borka" type="hidden" value="0" />
                       <input name="hijab" type="hidden" value="0" />
                   </div>

                   <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowDispatchModal(false)} className="flex-1 py-3.5 font-black text-[9px] text-slate-400 uppercase">ABORT</button>
                      <button type="submit" className="flex-[3] py-3.5 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase shadow-lg border-b-4 border-slate-700 active:scale-95 transition-all">RELEASE</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
        {showMalEntryModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-3xl shadow-3xl space-y-6 border border-slate-100 dark:border-slate-800 relative my-auto">
                <button onClick={() => setShowMalEntryModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={20} /></button>
                <div className="text-center space-y-1.5">
                   <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl rotate-3 mb-4"><Package size={28} /></div>
                   <h3 className="text-2xl font-black uppercase tracking-tight italic text-black dark:text-white">MAL ENTRY (FINISHED GOODS)</h3>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none italic">Log Entity Deposits</p>
                </div>
                <form onSubmit={handleMalEntry} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Date</label>
                            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input !h-12 font-black" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Design</label>
                            <select name="design" className="premium-input !h-12 uppercase font-black text-[11px]" required>
                                <option value="">SELECT...</option>
                                {(masterData.designs || []).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Color</label>
                            <select name="color" className="premium-input !h-12 uppercase font-black text-[11px]" required>
                                <option value="">SELECT...</option>
                                {(masterData.colors || []).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Size</label>
                            <select name="size" className="premium-input !h-12 uppercase font-black text-[11px]" required>
                                <option value="">SELECT...</option>
                                {(masterData.sizes || []).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center shadow-inner border border-slate-100 dark:border-slate-800">
                           <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Borka Pcs</p>
                           <input name="borka" type="number" className="w-full text-3xl font-black text-center bg-transparent outline-none italic" placeholder="0" required />
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center shadow-inner border border-slate-100 dark:border-slate-800">
                           <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Hijab Pcs</p>
                           <input name="hijab" type="number" className="w-full text-3xl font-black text-center bg-transparent outline-none italic" placeholder="0" required />
                        </div>
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Notes</label>
                       <input name="note" className="premium-input !h-12 uppercase text-[10px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="E.G. JET BLACK" />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowMalEntryModal(false)} className="flex-1 py-4 font-black text-[10px] text-slate-400">ABORT</button>
                      <button type="submit" className="flex-[3] py-4 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl border-b-[6px] border-slate-700 active:scale-95 transition-all">POST ENTRY</button>
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
