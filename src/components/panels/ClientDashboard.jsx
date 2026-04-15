import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, X, Activity, Clock, Shield, 
  LayoutGrid, Truck, ArrowLeft, PlusCircle, 
  Package, Layers, DollarSign, MessageCircle,
  Scissors, User, Calendar, ShieldCheck, Download, Boxes, 
  Wallet, Archive, History, ShoppingCart, Send, CheckCircle, 
  BarChart2, ArrowRight, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const ClientDashboard = ({ masterData, user, setMasterData, showNotify, logAction }) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const [selectedClient, setSelectedClient] = useState(isAdmin ? null : user.name);
  const clientName = selectedClient || '';
  
  const handleDownloadInvoice = (txn) => {
    const doc = new jsPDF({ format: 'a5' }); // A5 is professional for invoices
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 148, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(masterData.settings?.factoryName?.toUpperCase() || "NRZONE ERP", 14, 20);
    doc.setFontSize(8);
    doc.text("B2B TRANSACTION INVOICE", 14, 28);
    
    // Client Info
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text("INVOICE TO:", 14, 55);
    doc.setFontSize(12);
    doc.text(txn.client || clientName, 14, 62);
    
    // Txn Info
    doc.setFontSize(10);
    doc.text("DATE:", 90, 55);
    doc.text(txn.date || new Date().toLocaleDateString(), 110, 55);
    doc.text("TXN ID:", 90, 62);
    doc.text(`${txn.id}`.slice(-8), 110, 62);
    
    // Table
    doc.autoTable({
        startY: 80,
        head: [['DESCRIPTION', 'TYPE', 'AMOUNT']],
        body: [[txn.note || "Product/Service Delivery", txn.type, `BDT ${txn.amount}`]],
        theme: 'grid',
        headStyles: { fillStyle: 'black', textColor: 255 },
        styles: { font: 'helvetica', fontSize: 10 }
    });
    
    // Footer
    doc.setFontSize(8);
    doc.text("This is a computer generated invoice and requires no signature.", 14, 180);
    doc.text("System Secured by NRZONE ERP v5.5", 14, 185);
    
    doc.save(`Invoice_${txn.id}_${txn.client}.pdf`);
    showNotify("ইনভয়েস ডাউনলোড হচ্ছে...", "success");
  };

  // -- Modals --
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMalEntryModal, setShowMalEntryModal] = useState(false);
  const [showFabricModal, setShowFabricModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // -- Advanced Order State --
  const [orderForm, setOrderForm] = useState({
    design: '',
    color: '',
    fabricGoj: '',
    isFabricProvided: true, // Default to true as per user feedback
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

    // Integrated Pending Value Calculation:
    // Based on Finished items that are NOT yet billed/dispatched
    const designMap = (masterData.designs || []).reduce((acc, d) => {
        acc[d.name] = d;
        return acc;
    }, {});

    const pendingBilledValue = readyStock.reduce((sum, item) => {
        const d = designMap[item.design];
        const rate = d?.clientRates?.[clientName] || d?.sellingPrice || 0;
        return sum + (rate * item.qty);
    }, 0);

    return { billed, paid, due: billed - paid, pendingValue: pendingBilledValue };
  }, [clientTransactions, readyStock, masterData.designs, clientName]);

  const liveWorkflow = useMemo(() => {
    const list = [];
    
    // 1. Raw Requests (In Review)
    (masterData.productionRequests || [])
        .filter(r => (r.client || '').toUpperCase() === clientName.toUpperCase() && r.status === 'Pending Review')
        .forEach(r => list.push({ ...r, currentStage: 'ORDER_INTAKE', stageColor: 'bg-slate-400' }));

    // 2. Active in Factory (Cutting / Sewing / Stone)
    (masterData.cuttingStock || [])
        .filter(c => (c.client || '').toUpperCase() === clientName.toUpperCase())
        .forEach(c => {
            // Determine current department stage
            const isAtStone = (masterData.productions || []).some(p => p.lotNo === c.lotNo && p.type === 'stone' && p.status === 'Pending');
            const isAtSewing = (masterData.productions || []).some(p => p.lotNo === c.lotNo && p.type === 'sewing' && p.status === 'Pending');
            const isAtPata = (masterData.pataEntries || []).some(p => p.lotNo === c.lotNo && p.status === 'Pending');
            const isOutside = (masterData.outsideWorkEntries || []).some(o => o.lotNo === c.lotNo && o.status === 'Pending');
            
            let stage = 'CUTTING';
            let color = 'bg-blue-500';

            if (isAtStone) { stage = 'STONE'; color = 'bg-amber-500'; }
            else if (isAtSewing) { stage = 'SEWING'; color = 'bg-indigo-500'; }
            else if (isAtPata) { stage = 'PATA FACTORY'; color = 'bg-emerald-500'; }
            else if (isOutside) { stage = 'EXTERNAL'; color = 'bg-rose-500'; }

            list.push({ ...c, currentStage: stage, stageColor: color });
        });
    return list;
  }, [masterData, clientName]);

  const totalDelivered = (clientDeliveries || []).reduce((sum, d) => sum + (Number(d?.qtyBorka || 0) + Number(d?.qtyHijab || 0)), 0);


  // -- Handlers --
  const shareToWhatsApp = (message) => {
    const factoryNum = (masterData.settings?.whatsappNumber || '8801700000000').replace(/\D/g, "");
    const formattedNum = factoryNum.startsWith("880") ? factoryNum : "880" + factoryNum.replace(/^0/, "");
    window.open(`https://wa.me/${formattedNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const checkFabricStock = (color, requiredGoj) => {
    const clientFabricLogs = (masterData.rawInventory || []).filter(item => 
      item.client === clientName && item.color === color
    );
    const currentStock = clientFabricLogs.reduce((acc, curr) => 
      curr.type === 'in' ? acc + parseFloat(curr.qty) : acc - parseFloat(curr.qty), 0
    );
    return { available: currentStock, isOk: currentStock >= parseFloat(requiredGoj) };
  };

  const updateMasterData = (key, data) => {
    setMasterData(prev => ({ ...prev, [key]: data }));
  };

   const handleSubmitOrder = (e) => {
    e.preventDefault();
    
    // Calculate totals first
    const totalBorka = orderForm.sizes.reduce((s, x) => s + Number(x.borka || 0), 0);
    const totalHijab = orderForm.sizes.reduce((s, x) => s + Number(x.hijab || 0), 0);
    const reqId = Date.now();

    if (totalBorka === 0 && totalHijab === 0) {
        showNotify("Pcs quantity cannot be zero!", "error");
        return;
    }

    // -- STOCK VALIDATION --
    if (!orderForm.isFabricProvided) {
        const validation = checkFabricStock(orderForm.color, orderForm.fabricGoj);
        if (!validation.isOk) {
          alert(`⛔ INSUFFICIENT FABRIC!\nColor: ${orderForm.color}\nAvailable: ${validation.available} YDS\nRequired: ${orderForm.fabricGoj} YDS`);
          return;
        }
    }

    const newRequest = {
      id: reqId,
      date: new Date().toLocaleDateString("en-GB"),
      client: clientName,
      design: orderForm.design,
      color: orderForm.color,
      fabricGoj: Number(orderForm.fabricGoj),
      sizes: orderForm.sizes.filter(s => s.size && (Number(s.borka) > 0 || Number(s.hijab) > 0)),
      totalBorka,
      totalHijab,
      note: orderForm.note,
      status: 'Pending Review'
    };

    const inventoryActions = [];
    
    if (orderForm.isFabricProvided) {
        // Record Inward
        inventoryActions.push({
            id: Date.now() + 5,
            date: new Date().toLocaleDateString("en-GB"),
            item: "ফেব্রিক রোল (Fabric)",
            client: clientName,
            qty: Number(orderForm.fabricGoj),
            color: orderForm.color,
            type: "in",
            note: `FABRIC PROVIDED WITH ORDER #${reqId}`
        });
    }

    // Record Deduction for production
    inventoryActions.push({
        id: Date.now() + 10,
        date: new Date().toLocaleDateString("en-GB"),
        item: "ফেব্রিক রোল (Fabric)",
        client: clientName,
        qty: Number(orderForm.fabricGoj),
        color: orderForm.color,
        type: "out",
        note: `ORDER REQ #${reqId} - ${orderForm.design}`
    });

    setMasterData(prev => ({
      ...prev,
      productionRequests: [newRequest, ...(prev.productionRequests || [])],
      rawInventory: [...inventoryActions, ...(prev.rawInventory || [])]
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

  const handleFabricInward = (e) => {
    e.preventDefault();
    const f = e.target;
    const qty = Number(f.qty.value);
    const date = f.date.value || new Date().toLocaleDateString("en-GB");
    
    if (qty <= 0) return;

    const newItem = {
      id: Date.now(),
      date,
      item: "ফেব্রিক (Fabric)",
      color: f.color?.value || '',
      design: f.design?.value || '',
      client: clientName,
      qty,
      unit: "গজ",
      type: "in",
      note: `CLOTH RECEIVED: ${f.note.value}`
    };

    setMasterData(prev => ({
      ...prev,
      rawInventory: [newItem, ...(prev.rawInventory || [])]
    }));
    
    setShowFabricModal(false);
    showNotify(`${qty} গজ কাপড় রিসিভ করা হয়েছে!`, "success");
    logAction(user, 'FABRIC_INWARD', `Received ${qty} yds fabric from ${clientName}`);

    if (window.confirm("কাপড় রিসিভ রিপোর্ট হোয়াটসঅ্যাপে পাঠাতে চান?")) {
        shareToWhatsApp(`*NRZ0ONE FABRIC RECEPTION*\n\nQty: ${qty} গজ\nColor: ${newItem.color || 'N/A'}\nClient: ${clientName}\nDate: ${date}\nRef: ${f.note.value}`);
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

  const handleDepositMaterial = (e) => {
    e.preventDefault();
    const f = e.target;
    const qty = Number(f.qty.value);
    const date = new Date().toLocaleDateString("en-GB");
    
    const entry = {
      id: Date.now(),
      date: date,
      item: f.item.value,
      color: f.color.value,
      design: f.design.value,
      client: clientName,
      qty,
      unit: f.unit.value,
      type: 'in',
      note: f.note.value
    };

    setMasterData(prev => ({
      ...prev,
      rawInventory: [entry, ...(prev.rawInventory || [])]
    }));

    setShowMaterialModal(false);
    showNotify(`${qty} ${f.unit.value} স্টক ইনজেক্ট করা হয়েছে!`, "success");
    logAction(user, 'MATERIAL_DEPOSIT', `Added ${qty} ${f.unit.value} of ${entry.item} to warehouse.`);
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
        <div className="py-8 text-center space-y-2">
           <h2 className="text-2xl font-black italic uppercase tracking-tighter">B2B <span className="text-blue-600">CLIENT HUB</span></h2>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Select a client to view 360° Dashboard</p>
        </div>

        <div className="max-w-xl mx-auto mb-12 flex gap-3 group">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all" />
                <input 
                  placeholder="সার্চ ক্লায়েন্ট (Search Client Name)..." 
                  className="premium-input !h-16 !pl-16 !pr-8 !text-base shadow-2xl !rounded-[2rem] border-slate-200 dark:border-slate-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setShowAddClientModal(true)}
                className="w-16 h-16 bg-blue-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shrink-0 group/btn"
                title="নতুন ক্লায়েন্ট যোগ করুন"
            >
                <Plus size={24} className="group-hover/btn:rotate-90 transition-transform" />
            </button>
        </div>

        {showAddClientModal && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[500] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-3xl border border-slate-100 dark:border-slate-800 p-8 animate-fade-up max-h-[90vh] overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">New <span className="text-blue-600">Client Entry</span></h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Register B2B Partner</p>
                        </div>
                        <button onClick={() => setShowAddClientModal(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X size={18} /></button>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const f = e.target;
                        const name = f.name.value.trim();
                        if (!name) return;
                        
                        const clientId = name.toUpperCase().replace(/\s/g, '_');
                        const phone = f.phone.value.trim();
                        const openingBalance = Number(f.balance.value || 0);

                        const newProfile = {
                            id: clientId,
                            name: name,
                            owner: f.owner.value || '',
                            phone: phone || '',
                            address: f.address.value || '',
                            openingBalance: openingBalance,
                            createdAt: new Date().toLocaleDateString("en-GB")
                        };

                        const newUser = { 
                            id: phone || clientId, 
                            name: name, 
                            password: f.pass.value || '123', 
                            role: 'client' 
                        };

                        // Add opening balance transaction if > 0
                        const openingTxn = openingBalance !== 0 ? [{
                            id: `OB_${Date.now()}`,
                            date: new Date().toLocaleDateString("en-GB"),
                            client: name,
                            type: 'BILL',
                            amount: openingBalance,
                            note: 'OPENING BALANCE'
                        }] : [];

                        setMasterData(prev => ({ 
                            ...prev, 
                            users: [...(prev.users || []), newUser],
                            clients: [...new Set([...(prev.clients || []), name])],
                            clientProfiles: [...(prev.clientProfiles || []), newProfile],
                            clientTransactions: [...openingTxn, ...(prev.clientTransactions || [])]
                        }));

                        showNotify(`নতুন ক্লায়েন্ট '${name}' যোগ করা হয়েছে!`, "success");
                        setShowAddClientModal(false);
                    }} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Company Name *</label>
                            <input name="name" required className="premium-input !h-12 !text-base !font-bold" placeholder="যেমন: MAHDI FASHION" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Owner Name</label>
                                <input name="owner" className="premium-input !h-12" placeholder="মালিকের নাম" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Phone / WhatsApp</label>
                                <input name="phone" className="premium-input !h-12" placeholder="017XXXXXXXX" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Address</label>
                            <input name="address" className="premium-input !h-12" placeholder="দোকান/অফিস ঠিকানা" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Opening Balance</label>
                                <input name="balance" type="number" className="premium-input !h-12" placeholder="বকেয়া থাকলে লিখুন" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Portal Password</label>
                                <input name="pass" className="premium-input !h-12" placeholder="ডিফল্ট: 123" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all mt-4 border-b-4 border-blue-900">
                            Save Client Profile
                        </button>
                    </form>
                </div>
            </div>
        )}

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
                            <h4 className="text-lg font-black uppercase italic leading-none truncate w-full text-[var(--text-primary)]">{c}</h4>
                            <p className="text-[8px] font-black text-[var(--text-muted)] mt-1.5 uppercase tracking-widest leading-none italic">View Performance Dashboard</p>
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell premium-shell pb-32 animate-fade-in">
      {isAdmin && (
        <button 
          onClick={() => setSelectedClient(null)}
          className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:scale-105 transition-transform"
        >
          <ArrowLeft size={14} /> Back to Hub
        </button>
      )}

      {/* SaaS Compact Profile Header */}
      <div className="glass-card bg-slate-900 !border-none !p-4 mb-6 relative overflow-hidden group shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-40"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                   <User size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none mb-1.5">{clientName}</h2>
                   <div className="flex gap-2 items-center">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px] font-black uppercase tracking-widest border border-blue-500/30 italic">Active Partner</span>
                   </div>
                </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto flex-wrap justify-center">
               <button onClick={() => setShowOrderModal(true)} className="flex-1 lg:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  <ShoppingCart size={14} /> NEW ORDER
               </button>
               <button onClick={() => setShowFabricModal(true)} className="flex-1 lg:flex-none px-4 py-2.5 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  <Scissors size={14} /> FABRIC INWARD
               </button>
               <button onClick={() => setShowPaymentModal(true)} className="flex-1 lg:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  <Wallet size={14} /> PAYMENT
               </button>
               {isAdmin && (
                  <button onClick={() => setShowMalEntryModal(true)} className="flex-1 lg:flex-none px-4 py-2.5 bg-slate-100 text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                     <Plus size={14} /> PRODUCTION
                  </button>
               )}
            </div>
         </div>
      </div>

      {/* NEW: Live Production Tracker */}
      <div className="mb-0 animate-fade-up">
          <div className="flex justify-between items-center mb-4 px-1">
             <div className="space-y-0.5">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-black dark:text-white leading-none">লাইভ প্রোডাকশন ট্র্যাকিং <span className="text-blue-600">(LIVE)</span></h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Real-time Manufacturing Status Pipeline</p>
             </div>
             <Activity className="text-blue-500 animate-pulse" size={20} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {liveWorkflow.length === 0 ? (
                <div className="col-span-full py-12 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-3">
                   <Boxes size={40} className="text-slate-100 dark:text-slate-800 opacity-20" />
                   <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest italic">বর্তমানে কোনো প্রোডাকশন রানিং নেই</p>
                </div>
             ) : (
                liveWorkflow.map((lot, idx) => (
                    <div key={idx} className="saas-card group relative !p-5 overflow-hidden border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all">
                        <div className={`absolute top-0 right-0 px-3 py-1.5 ${lot.stageColor} text-white text-[8px] font-black uppercase tracking-widest shadow-lg rounded-bl-2xl`}>
                            {lot.currentStage}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-lg font-black italic uppercase tracking-tighter text-black dark:text-white leading-none truncate mb-1 pr-16">{lot.design}</h4>
                                <p className="text-[8px] font-black text-slate-400 tracking-widest italic uppercase">LOT: #{lot.lotNo || 'PRO-LOG'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex-1 space-y-1">
                                  <div className="flex justify-between items-center text-[7px] font-black uppercase text-slate-400 italic">
                                     <span>Manufacturing Progress</span>
                                     <span>{lot.currentStage === 'ORDER_INTAKE' ? '10%' : lot.currentStage === 'CUTTING' ? '30%' : lot.currentStage === 'SEWING' ? '55%' : lot.currentStage === 'STONE' ? '75%' : lot.currentStage === 'PATA' ? '85%' : '95%'}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                     <div 
                                        style={{ width: lot.currentStage === 'ORDER_INTAKE' ? '10%' : lot.currentStage === 'CUTTING' ? '30%' : lot.currentStage === 'SEWING' ? '55%' : lot.currentStage === 'STONE' ? '75%' : lot.currentStage === 'PATA' ? '85%' : '95%' }} 
                                        className={`h-full ${lot.stageColor} shadow-lg transition-all duration-1000`}
                                      />
                                  </div>
                               </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800">
                                <span className="text-[9px] font-bold text-slate-400 uppercase italic">Expected Output</span>
                                <span className="text-sm font-black text-black dark:text-white italic">~{lot.totalBorka || lot.borka || 0} PCS</span>
                            </div>
                        </div>
                    </div>
                ))
             )}
          </div>
      </div>

      {/* Transactions Ledger */}
      {clientTransactions.length > 0 && (
        <div className="glass-card !p-0 overflow-hidden mt-6">
           <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Activity size={14} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-tight italic">Transaction Ledger</h3>
           </div>
           <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">
              {clientTransactions.map((t, i) => {
                  const deptColor = t.dept === 'SEWING' || t.note?.startsWith('SEWING') ? 'bg-blue-500'
                    : t.dept === 'STONE' || t.note?.startsWith('STONE') ? 'bg-amber-500'
                    : t.dept === 'PATA' || t.note?.startsWith('PATA') ? 'bg-emerald-500'
                    : t.dept === 'OUTSIDE' || t.note?.startsWith('OUTSIDE') ? 'bg-indigo-500'
                    : '';
                  const deptLabel = t.dept || (t.note?.match(/^(SEWING|STONE|PATA|OUTSIDE)/)?.[1]) || '';
                  return (
                    <div key={i} className={`p-3 rounded-xl flex justify-between items-center ${t.type === 'PAYMENT' ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-slate-50 dark:bg-slate-800/30'}`}>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-[8px] font-black uppercase tracking-widest italic">
                                  {t.type === 'BILL' ? 'INVOICE' : 'SETTLEMENT'}
                                </h4>
                                {deptLabel && t.type === 'BILL' && (
                                  <span className={`${deptColor} text-white text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md`}>{deptLabel}</span>
                                )}
                            </div>
                            {t.note && t.type === 'BILL' && <p className="text-[7px] font-bold text-slate-400 truncate max-w-[160px] italic">{t.note.replace(/^(SEWING|STONE|PATA|OUTSIDE) BILL: /, '')}</p>}
                            <p className="text-[8px] font-black text-slate-400 mt-0.5">{t.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className={`text-base font-black italic tracking-tighter tabular-nums ${t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                                ৳ {t.amount?.toLocaleString()}
                            </p>
                            <button 
                                onClick={() => handleDownloadInvoice(t)} 
                                className="w-8 h-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all shadow-sm group-hover:scale-110"
                                title="Download PDF Invoice"
                            >
                                <Download size={12} />
                            </button>
                        </div>
                    </div>
                  );
              })}
           </div>
        </div>
      )}

      {/* ===== MY STOCK SECTION ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

        {/* Fabric Stock (Raw Inventory) */}
        <div className="glass-card !p-0 overflow-hidden">
           <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
              <div className="flex items-center gap-2">
                 <div className="w-7 h-7 bg-amber-500 text-white rounded-lg flex items-center justify-center"><Scissors size={14} /></div>
                 <h3 className="text-xs font-black uppercase tracking-tight italic">কাপড়ের স্টক (Fabric Stock)</h3>
              </div>
              <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-2 py-1 rounded-full">
                 {materialStocks.reduce((s, m) => s + m.qty, 0).toFixed(1)} YDS
              </span>
           </div>
           <div className="divide-y divide-slate-50">
              {materialStocks.length === 0 ? (
                 <p className="py-8 text-center text-[9px] font-black uppercase text-slate-300 tracking-widest italic">কোনো কাপড় জমা নেই</p>
              ) : (
                 materialStocks.map((m, i) => (
                    <div key={i} className="px-5 py-3.5 flex justify-between items-center hover:bg-amber-50/30 transition-colors">
                       <div>
                          <p className="text-[10px] font-black uppercase italic text-slate-800">{m.color || 'N/A'}{m.design ? ` / ${m.design}` : ''}</p>
                          <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">{m.item || 'ফেব্রিক'}</p>
                       </div>
                       <div className="text-right">
                          <p className={`text-base font-black tabular-nums ${m.qty < 0 ? 'text-rose-600' : 'text-amber-600'}`}>{Math.abs(m.qty).toFixed(1)}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase">{m.unit || 'গজ'}</p>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>

        {/* Finished Goods Stock */}
        <div className="glass-card !p-0 overflow-hidden">
           <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
              <div className="flex items-center gap-2">
                 <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center"><Package size={14} /></div>
                 <h3 className="text-xs font-black uppercase tracking-tight italic">রেডি মাল (Finished Stock)</h3>
              </div>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-full">
                 {readyStock.reduce((s, r) => s + r.qty, 0)} PCS
              </span>
           </div>
           <div className="divide-y divide-slate-50">
              {readyStock.length === 0 ? (
                 <p className="py-8 text-center text-[9px] font-black uppercase text-slate-300 tracking-widest italic">কোনো রেডি মাল নেই</p>
              ) : (
                 readyStock.map((r, i) => (
                    <div key={i} className="px-5 py-3.5 flex justify-between items-center hover:bg-emerald-50/30 transition-colors">
                       <div>
                          <p className="text-[10px] font-black uppercase italic text-slate-800">{r.design}</p>
                          <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest italic">{r.color}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xl font-black text-emerald-600 tabular-nums leading-none">{r.qty}</p>
                          <p className="text-[7px] font-black text-slate-400 uppercase">PCS</p>
                       </div>
                    </div>
                 ))
              )}
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
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Cloth Required (YDS)</label>
                           <input type="number" value={orderForm.fabricGoj} onChange={e => setOrderForm(p => ({...p, fabricGoj: e.target.value}))} className="premium-input !h-11 text-center font-black text-base !bg-slate-950 !text-white !border-none" placeholder="0.00" required />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Adding Cloth Now?</label>
                           <button 
                             type="button"
                             onClick={() => setOrderForm(p => ({...p, isFabricProvided: !p.isFabricProvided}))}
                             className={`w-full h-11 rounded-xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${orderForm.isFabricProvided ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                           >
                             {orderForm.isFabricProvided ? 'YES ( কাপড় দিচ্ছি )' : 'NO ( স্টকে আছে )'}
                           </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                       <div className="flex justify-between items-center mb-1">
                          <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] italic leading-none">Size Configuration</h4>
                          <button type="button" onClick={() => setOrderForm(p => ({...p, sizes: [...p.sizes, { size: '', borka: '', hijab: '' }]}))} className="w-7 h-7 bg-slate-950 text-white rounded-lg flex items-center justify-center hover:scale-110 shadow-md"><Plus size={12} /></button>
                       </div>
                       <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                          {/* Grid Header */}
                          <div className="grid grid-cols-12 gap-2 px-2">
                             <div className="col-span-4 text-[7px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Select Size</div>
                             <div className="col-span-3 text-[7px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Borka (Qty)</div>
                             <div className="col-span-3 text-[7px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Hijab (Qty)</div>
                             <div className="col-span-2"></div>
                          </div>
                          
                          {orderForm.sizes.map((s, idx) => (
                             <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 group relative">
                                <div className="col-span-4 flex items-center gap-2">
                                   <select value={s.size} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].size = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full bg-slate-50 dark:bg-slate-950 h-9 rounded-lg text-[9px] font-black uppercase border-none outline-none text-center" required>
                                       <option value="">SIZE</option>
                                       {(masterData.sizes && masterData.sizes.length > 0 ? masterData.sizes : ['50', '52', '54', '56', '58', '60']).map(z => <option key={z} value={z}>{z}</option>)}
                                   </select>
                                </div>
                                <div className="col-span-3 flex items-center gap-1 px-2 border-l border-slate-100 dark:border-slate-800">
                                   <input type="number" value={s.borka} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].borka = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full text-center text-sm font-black bg-transparent border-none outline-none" placeholder="0" />
                                </div>
                                <div className="col-span-3 flex items-center gap-1 px-2 border-l border-slate-100 dark:border-slate-800">
                                    <input type="number" value={s.hijab} onChange={e => { const ns = [...orderForm.sizes]; ns[idx].hijab = e.target.value; setOrderForm(p => ({...p, sizes: ns})); }} className="w-full text-center text-sm font-black bg-transparent border-none outline-none" placeholder="0" />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                   {orderForm.sizes.length > 1 && (
                                      <button type="button" onClick={() => setOrderForm(p => ({...p, sizes: p.sizes.filter((_, i) => i !== idx)}))} className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-all"><X size={12} /></button>
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

        {showFabricModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-3xl space-y-6 border border-slate-100 dark:border-slate-800 relative">
                <button onClick={() => setShowFabricModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={20} /></button>
                <div className="text-center space-y-1.5">
                   <div className="w-14 h-14 bg-amber-500 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg rotate-3 mb-2"><Scissors size={24} /></div>
                   <h3 className="text-xl font-black uppercase tracking-tight italic text-black dark:text-white leading-none">FABRIC RECEPTION</h3>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none italic">Inward Cloth Ledger</p>
                </div>
                <form onSubmit={handleFabricInward} className="space-y-5">
                   <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Color / Grade</label>
                            <input name="color" list="color-list" className="premium-input !h-11 uppercase font-black text-[10px]" placeholder="E.G. BLACK" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Design Ref (If any)</label>
                            <input name="design" className="premium-input !h-11 uppercase font-black text-[10px]" placeholder="E.G. ABAYA-X" />
                        </div>
                   </div>
                   <div className="space-y-1.5 text-center">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block italic">Quantity in Yards (গজ)</label>
                       <div className="bg-slate-950 rounded-2xl p-8 border-b-4 border-amber-500">
                          <input name="qty" type="number" step="0.01" className="w-full text-center text-5xl font-black bg-transparent border-none text-white outline-none placeholder:text-white/10" placeholder="0.00" autoFocus required />
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Date</label>
                           <input name="date" type="date" className="premium-input !h-11 text-center font-black text-[10px]" defaultValue={new Date().toISOString().split('T')[0]} />
                       </div>
                       <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Roll Specification (Manual)</label>
                           <input name="rollSize" list="roll-suggestions" className="premium-input !h-11 font-black uppercase text-[10px]" placeholder="E.G. 60 GOJ" />
                           <datalist id="roll-suggestions">
                              <option value="60 GOJ" />
                              <option value="90 GOJ" />
                              <option value="100 GOJ" />
                           </datalist>
                       </div>
                       <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Notes</label>
                           <input name="note" className="premium-input !h-11 font-black uppercase text-[10px]" placeholder="E.G. ROLL #102..." />
                       </div>
                   </div>
                   <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowFabricModal(false)} className="flex-1 py-3.5 font-black text-[9px] uppercase tracking-[0.3em] text-slate-400 hover:text-black transition-all">CANCEL</button>
                      <button type="submit" className="flex-[3] py-3.5 bg-amber-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-lg border-b-4 border-amber-700 active:scale-95 transition-all">RECIEVE CLOTH</button>
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
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">Roll Size / Spec</label>
                         <select name="rollSize" className="premium-input !h-11 font-black uppercase text-[10px]">
                            <option value="">N/A</option>
                            <option value="60M">60 MITTER</option>
                            <option value="90M">90 MITTER</option>
                            <option value="100M">100 MITTER</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic leading-none">নোট (Note)</label>
                          <input name="note" className="premium-input !h-11 uppercase text-[9px] font-black italic tracking-widest shadow-inner !bg-slate-50 dark:!bg-slate-800" placeholder="অতিরিক্ত তথ্য..." />
                      </div>
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
                                {(masterData.sizes && masterData.sizes.length > 0 ? masterData.sizes : ['50', '52', '54', '56', '58', '60']).map(s => <option key={s} value={s}>{s}</option>)}
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
