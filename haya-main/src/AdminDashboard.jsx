import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ProductManagerView from './ProductManagerView';
import {
    LayoutDashboard,
    ShoppingBag,
    PlusCircle,
    Search,
    Phone,
    MapPin,
    XCircle,
    Menu,
    X,
    Printer,
    LogOut,
    FileText,
    ExternalLink,
    Link,
    Globe,
    Package,
    TrendingUp,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    Copy,
    Check,
    Facebook,
    BarChart2,
    RefreshCw,
    Wallet,
    Factory,
    Calendar,
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingDown,
    Shield,
    Users,
    User,
    CreditCard,
    QrCode,
    History,
    UploadCloud,
    Image as ImageIcon
} from 'lucide-react';
import { GOOGLE_SHEET_URL, GOOGLE_SHEET_VIEW_URL } from './config';

const LINKS = {
    website: [
        { label: 'হোম পেজ', url: 'https://nrzoone.com/', icon: '🏠' },
        { label: 'হায়া সিরিজ', url: 'https://nrzoone.com/haya', icon: '✨' },
        { label: 'ক্লাসিক কম্বো', url: 'https://nrzoone.com/classic', icon: '👗' },
        { label: 'মা কালেকশন', url: 'https://nrzoone.com/ma', icon: '💝' },
        { label: 'মা ও বড়মেয়ে', url: 'https://nrzoone.com/maboromeye', icon: '💫' },
        { label: 'বড়বোন কালেকশন', url: 'https://nrzoone.com/borobon', icon: '🌸' },
        { label: 'ফাইজা বোরকা', url: 'https://nrzoone.com/faiza', icon: '💎' },
        { label: 'কিডস কালেকশন', url: 'https://nrzoone.com/kids', icon: '🎀' },
        { label: 'হিজাব কালেকশন', url: 'https://nrzoone.com/hijab', icon: '🧕' },
    ],
    admin: [
        { label: 'Admin Dashboard', url: 'https://nrzoone.com/admin', icon: '🔐' },
        { label: 'Google Sheet (Orders)', url: GOOGLE_SHEET_VIEW_URL, icon: '📊' },
        { label: 'Firebase Console', url: 'https://console.firebase.google.com/project/nr-zone-bd/firestore', icon: '🔥' },
        { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', icon: '▲' },
        { label: 'GitHub Repository', url: 'https://github.com', icon: '🐙' },
    ],
    social: [
        { label: 'Facebook Page', url: 'https://www.facebook.com/nrzonee', icon: '📘' },
        { label: 'Facebook Ads Manager', url: 'https://www.facebook.com/adsmanager', icon: '📣' },
        { label: 'Facebook Business Suite', url: 'https://business.facebook.com', icon: '💼' },
    ]
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('adminLoggedIn') === 'true');
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
    const [loginError, setLoginError] = useState('');
    const [copiedUrl, setCopiedUrl] = useState('');
    const [printData, setPrintData] = useState(null);
    const [workerAccounts, setWorkerAccounts] = useState([]);
    const [workerTransactions, setWorkerTransactions] = useState([]);
    const [remotePasswords, setRemotePasswords] = useState(null);

    const handleLogin = (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        
        const adminPass = remotePasswords?.admin || 'nrzone2024';
        const managerPass = remotePasswords?.manager || 'nrzone2024';
        const workerPass = remotePasswords?.worker || 'nrzone2024';

        if (username === 'admin' && password === adminPass) {
            setIsLoggedIn(true);
            setUserRole('Admin');
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('userRole', 'Admin');
            setLoginError('');
        } else if (username === 'manager' && password === managerPass) {
            setIsLoggedIn(true);
            setUserRole('Manager');
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('userRole', 'Manager');
            setLoginError('');
        } else if (username === 'worker' && password === workerPass) {
            setIsLoggedIn(true);
            setUserRole('Worker');
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('userRole', 'Worker');
            setLoginError('');
        } else {
            setLoginError('ভুল ইউজারনেম বা পাসওয়ার্ড!');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserRole('');
        setActiveTab('dashboard'); // Reset to default
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('userRole');
    };

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(''), 2000);
    };

    const handlePrint = (order) => {
        setPrintData(order);
        setTimeout(() => {
            window.print();
            setPrintData(null);
        }, 300);
    };

    const isAdmin = userRole === 'Admin';
    const isManager = userRole === 'Manager';
    const isWorker = userRole === 'Worker';

    // Orders Listener
    useEffect(() => {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersArray = [];
            querySnapshot.forEach((doc) => {
                ordersArray.push({ ...doc.data(), firebaseId: doc.id });
            });
            setOrders(ordersArray);
        });
        return () => unsubscribe();
    }, []);

    // Expenses Listener
    useEffect(() => {
        const q = query(collection(db, "factory_expenses"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const expensesArray = [];
            querySnapshot.forEach((doc) => {
                expensesArray.push({ ...doc.data(), firebaseId: doc.id });
            });
            setExpenses(expensesArray);
        });
        return () => unsubscribe();
    }, []);

    // Worker Accounts Listener
    useEffect(() => {
        const q = query(collection(db, "worker_accounts"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setWorkerAccounts(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });
        return () => unsubscribe();
    }, []);

    // Worker Transactions Listener
    useEffect(() => {
        const q = query(collection(db, "worker_transactions"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setWorkerTransactions(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });
        return () => unsubscribe();
    }, []);

    // Load Remote Passwords
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "passwords"), (doc) => {
            if (doc.exists()) setRemotePasswords(doc.data());
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (isLoggedIn) {
            if (isWorker && activeTab !== 'orders') {
                setActiveTab('orders');
            } else if (isManager && activeTab === 'dashboard') {
                setActiveTab('orders');
            }
        }
    }, [isLoggedIn, userRole]);

    const updateStatus = async (firebaseId, newStatus) => {
        try {
            await updateDoc(doc(db, "orders", firebaseId), { status: newStatus });
        } catch (error) { console.error(error); }
    };

    const deleteOrder = async (firebaseId) => {
        if (!isAdmin) { alert('দুঃখিত, শুধুমাত্র এডমিন ডিলিট করতে পারবেন।'); return; }
        if (confirm('আপনি কি এই অর্ডারটি ডিলিট করতে চান?')) {
            try { await deleteDoc(doc(db, "orders", firebaseId)); } catch (error) { console.error(error); }
        }
    };

    const deleteExpense = async (firebaseId) => {
        if (!isAdmin) { alert('দুঃখিত, শুধুমাত্র এডমিন ডিলিট করতে পারবেন।'); return; }
        if (confirm('আপনি কি এই খরচটি ডিলিট করতে চান?')) {
            try { await deleteDoc(doc(db, "factory_expenses", firebaseId)); } catch (error) { console.error(error); }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-900 border-amber-200';
            case 'confirmed': return 'bg-blue-100 text-blue-900 border-blue-200';
            case 'shipped': return 'bg-purple-100 text-purple-900 border-purple-200';
            case 'delivered': return 'bg-emerald-100 text-emerald-900 border-emerald-200';
            case 'cancelled': return 'bg-red-100 text-red-900 border-red-200';
            default: return 'bg-gray-100 text-gray-900';
        }
    };

    const getStatusBangla = (status) => {
        switch (status) {
            case 'pending': return 'নতু্ন অর্ডার';
            case 'confirmed': return 'কনফার্মড';
            case 'shipped': return 'কুরিয়ারে আছে';
            case 'delivered': return 'ডেলিভারড';
            case 'cancelled': return 'বাতিল';
            default: return status;
        }
    };

    // ─── DASHBOARD VIEW ────────────────────────────────
    const DashboardView = () => {
        const totalSales = orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + (curr.total || 0), 0);
        const totalExpenses = expenses.reduce((acc, curr) => acc + (parseInt(curr.amount) || 0), 0);
        const pendingCount = orders.filter(o => o.status === 'pending').length;

        const stats = [
            { label: 'মোট বিক্রি (Cash)', value: `৳ ${totalSales.toLocaleString()}`, sub: 'Delivered', icon: <ArrowUpCircle size={28} />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'মোট খরচ (Expense)', value: `৳ ${totalExpenses.toLocaleString()}`, sub: 'Factory/Production', icon: <TrendingDown size={28} />, color: 'text-rose-700', bg: 'bg-rose-50' },
            { label: 'নিট প্রফিট (Estimated)', value: `৳ ${(totalSales - totalExpenses).toLocaleString()}`, sub: 'Profit/Loss', icon: <Wallet size={28} />, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'নতুন অর্ডার (Waiting)', value: pendingCount, sub: 'অপেক্ষমাণ', icon: <Clock size={28} />, color: 'text-amber-700', bg: 'bg-amber-50' },
        ];

        return (
            <div className="space-y-10 animate-fade-in no-print">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">ড্যাশবোর্ড ওভারভিউ</h2>
                        <p className="text-slate-700 font-bold">
                             <User size={16} /> লগইন আছেন: <span className="font-bold text-slate-800">{userRole}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all group">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-slate-600 font-black uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                                    <p className="text-xs text-slate-600 mt-2 font-bold">{stat.sub}</p>
                                </div>
                                <div className={`p-4 ${stat.bg} ${stat.color} rounded-[1.2rem] group-hover:rotate-12 transition-transform`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
                                <ShoppingBag size={24} className="text-blue-600" /> সাম্প্রতিক অর্ডারসমূহ
                            </h3>
                            <button onClick={() => setActiveTab('orders')} className="text-sm font-black text-blue-600 hover:underline">সব অর্ডার</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-base text-left">
                                <thead className="text-slate-600 font-black uppercase text-[10px] tracking-widest border-b border-slate-50">
                                    <tr>
                                        <th className="p-6">ID</th>
                                        <th className="p-6">নাম</th>
                                        <th className="p-6">টাকা</th>
                                        <th className="p-6 text-right">স্ট্যাটাস</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orders.slice(0, 5).map((order) => (
                                        <tr key={order.firebaseId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6 font-black text-blue-600">#{order.firebaseId?.slice(-4).toUpperCase()}</td>
                                            <td className="p-6 font-bold text-slate-700">{order.name}</td>
                                            <td className="p-6 font-black text-slate-900">৳{order.total}</td>
                                            <td className="p-6 text-right font-black uppercase">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] ${getStatusColor(order.status)} border`}>
                                                    {getStatusBangla(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
                                <Factory size={24} className="text-rose-600" /> সাম্প্রতিক খরচসমূহ
                            </h3>
                            <button onClick={() => setActiveTab('factory-expenses')} className="text-sm font-black text-rose-600 hover:underline">সব খরচ</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-base text-left">
                                <thead className="text-slate-600 font-black uppercase text-[10px] tracking-widest border-b border-slate-50">
                                    <tr>
                                        <th className="p-6">তারিখ</th>
                                        <th className="p-6">ক্যাটাগরি</th>
                                        <th className="p-6 text-right">অংক</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expenses.slice(0, 5).map((exp) => (
                                        <tr key={exp.firebaseId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6 font-bold text-slate-500">{exp.date}</td>
                                            <td className="p-6 font-black text-slate-700">{exp.category}</td>
                                            <td className="p-6 text-right font-black text-rose-600 uppercase">৳{exp.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── ORDER LIST VIEW ────────────────────────────────
    const OrderListView = () => {
        const [statusFilter, setStatusFilter] = useState('all');

        const filteredOrders = orders.filter(order => {
            const matchesSearch = (order.name?.toLowerCase().includes(searchTerm.toLowerCase()) || order.phone?.includes(searchTerm) || order.firebaseId?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        return (
            <div className="space-y-8 no-print min-h-screen animate-fade-in text-slate-800">
                <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">অর্ডার আর্কাইভ</h2>
                        <p className="text-slate-700 text-lg mt-2 font-bold">নিখুঁত অর্ডার ট্র্যাকিং সিস্টেম</p>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-500 transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="কাস্টমারের নাম বা ফোন নম্বর..."
                            className="pl-14 pr-8 py-5 border-2 border-slate-50 rounded-[2rem] w-full md:w-[450px] shadow-sm focus:ring-8 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-4 noscroll">
                    {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-8 py-4 rounded-[1.5rem] text-slate-600 font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border-2 ${statusFilter === status ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.05]' : 'bg-white border-slate-50 text-slate-600 hover:border-slate-200'}`}
                        >
                            {status === 'all' ? 'সব অর্ডার' : getStatusBangla(status)}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left border-collapse">
                            <thead className="bg-[#FBFCFE] text-slate-600 font-extrabold uppercase text-[11px] tracking-[0.25em] border-b border-slate-50">
                                <tr>
                                    <th className="p-8">ORDER ID & DATE</th>
                                    <th className="p-8">CUSTOMER DETAILS</th>
                                    <th className="p-8">PRODUCT INFO</th>
                                    <th className="p-8">TOTAL AMOUNT</th>
                                    <th className="p-8">MANAGEMENT</th>
                                    <th className="p-8 text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredOrders.map((order) => (
                                    <tr key={order.firebaseId} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="p-8">
                                            <div className="font-black text-blue-600 text-lg uppercase tracking-wider">#{order.firebaseId?.slice(-6)}</div>
                                            <div className="text-xs text-slate-600 mt-2 font-bold flex items-center gap-1.5"><Calendar size={12} /> {order.date}</div>
                                        </td>
                                        <td className="p-8">
                                            <div className="font-black text-slate-900 text-xl leading-tight">{order.name}</div>
                                            <div className="text-base text-blue-700 mt-2 font-black flex items-center gap-2 tracking-wide"><Phone size={14} className="text-blue-400" /> {order.phone}</div>
                                            <div className="text-xs text-slate-600 mt-2 font-bold leading-relaxed max-w-[200px]">{order.address}</div>
                                        </td>
                                        <td className="p-8">
                                            <div className="font-black text-slate-900 text-xs uppercase tracking-widest bg-slate-100/50 inline-block px-3 py-1 rounded-md mb-3">
                                                {order.landingPage || 'Direct Order'}
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md">COL: {order.color}</span>
                                                <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md">SZ: {order.size}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="font-black text-slate-900 text-2xl tracking-tighter">৳{order.total}</div>
                                            <div className="text-[10px] text-slate-700 font-bold uppercase mt-1">Price + {order.deliveryCharge || 0} Del.</div>
                                        </td>
                                        <td className="p-8">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.firebaseId, e.target.value)}
                                                className={`text-[11px] font-black uppercase p-4 px-6 rounded-2xl border-4 appearance-none cursor-pointer tracking-widest ${getStatusColor(order.status)} transition-all focus:outline-none focus:ring-8 focus:ring-slate-100 pr-12`}
                                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'3\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 20px center', backgroundSize: '14px' }}
                                            >
                                                <option value="pending">NEW ORDER</option>
                                                <option value="confirmed">CONFIRMED</option>
                                                <option value="shipped">SHIPPING</option>
                                                <option value="delivered">DELIVERED</option>
                                                <option value="cancelled">CANCELLED</option>
                                            </select>
                                        </td>
                                        <td className="p-8 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button onClick={() => handlePrint(order)} className="p-4 bg-blue-600 text-white rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-xl shadow-blue-200">
                                                    <Printer size={22} />
                                                </button>
                                                <button onClick={() => deleteOrder(order.firebaseId)} className="p-4 bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-2xl transition-all">
                                                    <XCircle size={22} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <tr><td colSpan="6" className="p-32 text-center text-slate-500 font-black uppercase tracking-[0.5em] text-xl">Empty Result</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // ─── PRINT INVOICE COMPONENT ──────────────────────
    const PrintInvoice = ({ order }) => {
        if (!order) return null;
        return (
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] font-sans text-black">
                <style>{`
                    @media print { 
                        @page { size: A5; margin: 0; }
                        .no-print { display: none !important; } 
                        body { margin: 0; padding: 0; } 
                    }
                `}</style>
                <div className="w-[148mm] min-h-[210mm] mx-auto border-[4px] border-black p-8 bg-white overflow-hidden relative">
                    <div className="flex justify-between items-start border-b-[8px] border-black pb-10 mb-10">
                        <div>
                            <h1 className="text-7xl font-black tracking-tighter mb-4 leading-none italic underline decoration-blue-600 underline-offset-8 drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)]">NR ZONE</h1>
                            <p className="text-lg font-black uppercase tracking-[0.5em] text-slate-900 mt-6 border-l-4 border-black pl-4">Premium Modesty Lifestyle</p>
                            <p className="text-sm mt-8 font-extrabold flex items-center gap-2 italic text-slate-600">Official Contact: +880 1783-155897</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <h2 className="text-3xl font-black uppercase mb-2 tracking-[0.2em] bg-black text-white px-6 py-2">Invoice</h2>
                            <p className="text-lg font-black mt-4">ORD NO: {order.firebaseId?.slice(-10).toUpperCase()}</p>
                            <p className="text-sm font-bold mt-2 border-t-2 border-black inline-block pt-1 uppercase mb-4">{order.date}</p>
                            <div className="mt-2 border-2 border-black p-1 bg-white">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://nrzoone.com/order/${order.firebaseId}`} alt="invoice-qr" width="80" height="80" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-16 mb-12">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] border-b-4 border-black pb-2 inline-block">Shipping To:</h3>
                            <div className="pl-2">
                                <p className="text-3xl font-black uppercase leading-tight">{order.name}</p>
                                <p className="text-2xl font-black mt-3 text-slate-800 tracking-wide underline decoration-gray-200">{order.phone}</p>
                                <p className="text-base mt-6 leading-relaxed font-bold text-slate-600 border-l-4 border-slate-100 pl-4">{order.address}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] border-b-4 border-black pb-2 inline-block">Order Summary:</h3>
                            <div className="space-y-4 font-black">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-slate-600 uppercase text-xs">Collection Site</span>
                                    <span className="text-sm underline decoration-slate-200">{order.landingPage || 'NRZOONE MAIN'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-slate-600 uppercase text-xs">Payment Method</span>
                                    <span className="text-sm">Cash on Delivery</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 uppercase text-xs">Total Weight</span>
                                    <span className="text-sm">~ 0.8 KG</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <table className="w-full mb-12 border-4 border-black">
                        <thead>
                            <tr className="bg-black text-white text-left text-xs uppercase font-black">
                                <th className="p-5 tracking-widest">Product Description</th>
                                <th className="p-5 tracking-widest">Color</th>
                                <th className="p-5 tracking-widest">Long</th>
                                <th className="p-5 text-right tracking-widest">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-4 divide-black border-b-[6px] border-black">
                            <tr className="text-lg font-black italic">
                                <td className="p-6 border-r-4 border-black uppercase text-sm">{order.productType || 'Exclusive Borka'}</td>
                                <td className="p-6 border-r-4 border-black uppercase text-sm">{order.color}</td>
                                <td className="p-6 border-r-4 border-black uppercase text-sm">{order.size}</td>
                                <td className="p-6 text-right font-black text-2xl tracking-tighter">৳{order.price || (order.total - (order.deliveryCharge || 80))}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end pr-6">
                        <div className="w-80 space-y-4 font-black">
                            <div className="flex justify-between text-base py-1">
                                <span className="text-slate-600">SUBTOTAL</span>
                                <span>৳{order.total - (order.deliveryCharge || 80)}</span>
                            </div>
                            <div className="flex justify-between text-base py-1 border-b-4 border-dotted">
                                <span className="text-slate-600">DELIVERY CHARGE</span>
                                <span>৳{order.deliveryCharge || 80}</span>
                            </div>
                            <div className="flex justify-between text-4xl font-black pt-4 italic">
                                <span>GRAND TOTAL:</span>
                                <span className="underline decoration-double">৳{order.total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-28 flex justify-between px-10">
                        <div className="w-56 border-t-4 border-black text-center pt-3">
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Authority Sign</p>
                        </div>
                        <div className="w-56 border-t-4 border-black text-center pt-3">
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Customer Sign</p>
                        </div>
                    </div>

                    <div className="mt-20 text-center border-t-2 border-dashed pt-8">
                        <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-800">Modesty Defines Elegance</p>
                        <p className="text-[10px] text-slate-600 mt-4 font-black flex items-center justify-center gap-2">
                             System Generated Invoice • Date: {new Date().toLocaleDateString('en-GB')} • Time: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // ─── ADD ORDER & EXPENSE (Clean UI version) ────────────────

    const AddOrderView = () => {
        const [formData, setFormData] = useState({ name: '', phone: '', address: '', productType: 'haya', color: 'কালো', size: '৫২', price: 1350, deliveryArea: 'inside' });
        const handleSubmit = async (e) => {
            e.preventDefault();
            const deliveryCharge = formData.deliveryArea === 'inside' ? 80 : 150;
            try {
                await addDoc(collection(db, "orders"), { ...formData, deliveryCharge, total: parseInt(formData.price) + deliveryCharge, status: 'pending', date: new Date().toLocaleDateString('en-GB'), createdAt: serverTimestamp() });
                alert('অর্ডার সফলভাবে সেভ হয়েছে!'); setActiveTab('orders');
            } catch (error) { alert('ত্রুটি হয়েছে!'); }
        };
        return (
            <div className="max-w-4xl no-print animate-fade-in text-slate-800">
                <div className="mb-10">
                    <h2 className="text-4xl font-extrabold tracking-tight underline decoration-slate-100 underline-offset-[12px]">ম্যানুয়াল অর্ডার এন্ট্রি</h2>
                </div>
                <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3"><label className="text-[11px] font-black uppercase tracking-widest text-slate-600">কাস্টমারের নাম</label><input required className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-lg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div className="space-y-3"><label className="text-[11px] font-black uppercase tracking-widest text-slate-600">মোবাইল নম্বর</label><input required className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-black text-lg" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                    </div>
                    <div className="space-y-3"><label className="text-[11px] font-black uppercase tracking-widest text-slate-600">ডেলিভারি ঠিকানা</label><textarea required className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 h-28 font-bold text-lg resize-none" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-600">কালার</label>
                            <select className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl font-bold text-lg outline-none focus:border-blue-500" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}>
                                {['Black', 'Maroon', 'Olive', 'Navy', 'Grey', 'Brown', 'Purple', 'White', 'Pink', 'Mehndi', 'Coffee', 'Chocolate', 'Sky Blue', 'Teal', 'Lavender', 'Emerald', 'Peach', 'Golden', 'Silver', 'Nude'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-600">সাইজ / ক্যাটাগরি</label>
                            <select className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl font-bold text-lg outline-none focus:border-blue-500" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })}>
                                <optgroup label="Borka Sizes">
                                    {Array.from({ length: (58 - 20) / 2 + 1 }, (_, i) => (20 + i * 2).toString()).map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value="Free Size">Free Size</option>
                                </optgroup>
                                <optgroup label="Hijab Sizes">
                                    <option value="40 Inchi (Choto)">40 Inchi (Choto)</option>
                                    <option value="72 Inchi (Majhari)">72 Inchi (Majhari)</option>
                                    <option value="80 Inchi (Boro)">80 Inchi (Boro)</option>
                                </optgroup>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-widest text-slate-600">মূল্য (৳)</label>
                             <input type="number" className="w-full px-6 py-5 border-2 border-blue-500/20 rounded-2xl font-black text-2xl text-blue-600 outline-none focus:border-blue-500" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-2xl hover:scale-[1.02] shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95 transition-all">কনফার্ম এন্ট্রি করুন</button>
                </form>
            </div>
        );
    }

    const WorkerLedgerView = () => {
        const [showAddWorker, setShowAddWorker] = useState(false);
        const [showPayModal, setShowPayModal] = useState(null);
        const [showEarnModal, setShowEarnModal] = useState(null);
        const [showDocModal, setShowDocModal] = useState(null);
        
        const [newWorker, setNewWorker] = useState({ 
            name: '', 
            phone: '', 
            nid: '', 
            passport: '', 
            docImage: '' 
        });
        const [isUploading, setIsUploading] = useState(false);

        const handleDocUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setIsUploading(true);
            const storageRef = ref(storage, `workers/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on("state_changed", 
                null, 
                (err) => { alert("আপলোড ব্যর্থ হয়েছে"); setIsUploading(false); },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    setNewWorker({ ...newWorker, docImage: url });
                    setIsUploading(false);
                }
            );
        };

        const addWorker = async (e) => {
            e.preventDefault();
            if (!newWorker.name) return;
            await addDoc(collection(db, "worker_accounts"), { 
                ...newWorker, 
                totalEarned: 0, 
                totalPaid: 0, 
                currentBalance: 0, 
                createdAt: serverTimestamp() 
            });
            setNewWorker({ name: '', phone: '', nid: '', passport: '', docImage: '' }); 
            setShowAddWorker(false);
            alert('ওয়ার্কার সফলভাবে যুক্ত হয়েছে!');
        };

        const addTransaction = async (workerId, type, amount, desc) => {
            const amountNum = parseInt(amount);
            if (!amountNum) return;
            const worker = workerAccounts.find(w => w.firebaseId === workerId);
            const newTotalEarned = type === 'earning' ? worker.totalEarned + amountNum : worker.totalEarned;
            const newTotalPaid = type === 'payment' ? worker.totalPaid + amountNum : worker.totalPaid;
            const newBalance = newTotalEarned - newTotalPaid;

            await addDoc(collection(db, "worker_transactions"), { workerId, workerName: worker.name, type, amount: amountNum, description: desc, date: new Date().toLocaleDateString('en-GB'), createdAt: serverTimestamp() });
            await updateDoc(doc(db, "worker_accounts", workerId), { totalEarned: newTotalEarned, totalPaid: newTotalPaid, currentBalance: newBalance });
            setShowPayModal(null); setShowEarnModal(null);
        };

        return (
            <div className="space-y-12 no-print animate-fade-in text-slate-800 pb-20">
                <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-extrabold tracking-tight underline decoration-slate-100 underline-offset-[12px]">ওয়ার্কার লেজার ও ডকুমেন্টেশন</h2>
                    <button onClick={() => setShowAddWorker(!showAddWorker)} className="bg-slate-900 text-white px-10 py-5 rounded-[1.8rem] font-black flex items-center gap-4 shadow-2xl active:scale-95 transition-all">
                        <Users size={24} /> নতুন ওয়ার্কার যোগ করুন
                    </button>
                </div>

                {showAddWorker && (
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-2 border-slate-50 animate-slide-up">
                        <h3 className="text-xl font-black uppercase text-blue-600 mb-8 border-b-2 pb-4 inline-block">নতুন ওয়ার্কার ইনফরমেশন</h3>
                        <form onSubmit={addWorker} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">পুরো নাম</label>
                                <input required placeholder="যেমন: মো: আরিফুল ইসলাম" className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl font-bold" value={newWorker.name} onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">ফোন নম্বর</label>
                                <input required placeholder="017xxxxxxxx" className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl font-bold" value={newWorker.phone} onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">NID নম্বর</label>
                                <input placeholder="জাতীয় পরিচয়পত্র নম্বর..." className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl font-bold" value={newWorker.nid} onChange={(e) => setNewWorker({ ...newWorker, nid: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">পাসপোর্ট নম্বর (ঐচ্ছিক)</label>
                                <input placeholder="পাসপোর্ট নম্বর..." className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl font-bold" value={newWorker.passport} onChange={(e) => setNewWorker({ ...newWorker, passport: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">NID/পাসপোর্ট ছবি আপলোড</label>
                                <div className="relative border-4 border-dashed border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center bg-slate-50 overflow-hidden group">
                                    {newWorker.docImage ? (
                                        <div className="flex flex-col items-center">
                                            <img src={newWorker.docImage} alt="ID card" className="h-32 rounded-xl shadow-lg mb-4" />
                                            <p className="text-emerald-600 font-black text-xs uppercase">ডকুমেন্ট আপলোড হয়েছে!</p>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="text-slate-300 mb-4 group-hover:text-blue-500 transition-colors" size={40} />
                                            <p className="text-slate-500 font-bold">এখানে ক্লিক করে ছবি সিলেক্ট করুন</p>
                                        </>
                                    )}
                                    {isUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-black text-blue-600 animate-pulse">আপলোড হচ্ছে...</div>}
                                    <input type="file" accept="image/*" onChange={handleDocUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" disabled={isUploading} className="w-full bg-slate-900 text-white py-6 rounded-[2.2rem] font-black text-2xl uppercase tracking-widest shadow-xl shadow-slate-200">সেভ করুন</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {workerAccounts.map(worker => (
                        <div key={worker.firebaseId} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group overflow-hidden relative flex flex-col">
                            <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-blue-50 transition-colors pointer-events-none"><Shield size={100} /></div>
                            <div className="relative z-10 flex-1">
                                <h3 className="text-4xl font-black tracking-tight mb-2 text-slate-900 italic">{worker.name}</h3>
                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-8 flex items-center gap-2"><Phone size={12}/> {worker.phone || 'N/A'}</p>
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between border-b pb-2 border-slate-50"><span className="text-slate-400 font-black uppercase text-[10px]">অর্জিত কমিশন</span> <span className="text-slate-800 font-extrabold text-lg">৳{worker.totalEarned}</span></div>
                                    <div className="flex justify-between border-b pb-2 border-slate-50"><span className="text-slate-400 font-black uppercase text-[10px]">পরিশোধ করা হয়েছে</span> <span className="text-emerald-600 font-extrabold text-lg">৳{worker.totalPaid}</span></div>
                                    <div className="flex justify-between pt-6"><span className="text-rose-600 font-black uppercase text-[10px]">বর্তমান বকেয়া</span> <span className="text-rose-600 font-black text-3xl tracking-tighter">৳{worker.currentBalance}</span></div>
                                </div>

                                <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ডকুমেন্টস:</span>
                                        {worker.docImage && <button onClick={() => setShowDocModal(worker)} className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase hover:underline"><ImageIcon size={14}/> ভিউ কার্ড</button>}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-600">NID: {worker.nid || '---'}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-10">
                                    <button onClick={() => setShowEarnModal(worker)} className="bg-slate-100 text-slate-900 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">কমিশন যোগ</button>
                                    <button onClick={() => setShowPayModal(worker)} className="bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100 hover:scale-105 transition-all">পরিশোধ</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODALS */}
                {showDocModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 z-[300]">
                        <div className="bg-white p-14 rounded-[4rem] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-fade-in">
                            <button onClick={() => setShowDocModal(null)} className="absolute top-10 right-10 p-4 bg-slate-100 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all z-10"><X size={24}/></button>
                            <h3 className="text-2xl font-black uppercase tracking-widest mb-4 border-b pb-4">{showDocModal.name} - Identity Card</h3>
                            <div className="space-y-4 mb-10">
                               <p className="font-bold text-slate-600">NID: <span className="text-slate-900 font-black text-xl">{showDocModal.nid || 'N/A'}</span></p>
                               {showDocModal.passport && <p className="font-bold text-slate-600">Passport: <span className="text-slate-900 font-black text-xl">{showDocModal.passport}</span></p>}
                            </div>
                            <div className="rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-2xl">
                                <img src={showDocModal.docImage} alt="ID Document" className="w-full h-auto object-cover" />
                            </div>
                        </div>
                    </div>
                )}

                {showEarnModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 z-[200]">
                        <div className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-2xl animate-fade-in">
                            <h3 className="text-2xl font-black mb-8 border-b-4 border-slate-900 pb-4">কমিশন এন্ট্রি: <span className="text-blue-600">{showEarnModal.name}</span></h3>
                            <input type="number" placeholder="টাকার অংক..." id="earnAmount" className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl mb-6 font-black text-2xl outline-none" />
                            <input placeholder="কি কাজের জন্য..." id="earnDesc" className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl mb-10 font-bold" />
                            <div className="flex gap-4">
                                <button onClick={() => setShowEarnModal(null)} className="flex-1 py-5 rounded-2xl font-black text-slate-500 uppercase tracking-widest">বন্ধ করুন</button>
                                <button onClick={() => addTransaction(showEarnModal.firebaseId, 'earning', document.getElementById('earnAmount').value, document.getElementById('earnDesc').value)} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest">সেভ করুন</button>
                            </div>
                        </div>
                    </div>
                )}

                {showPayModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 z-[200]">
                        <div className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-2xl animate-fade-in border-t-[15px] border-emerald-500">
                            <h3 className="text-2xl font-black mb-8">পেমেন্ট এন্ট্রি: <span className="text-emerald-600">{showPayModal.name}</span></h3>
                            <input type="number" placeholder="পেমেন্ট টাকার অংক..." id="payAmount" className="w-full px-6 py-5 bg-emerald-50 border-2 border-emerald-100 rounded-2xl mb-6 font-black text-2xl outline-none focus:bg-white" />
                            <input placeholder="পেমেন্ট ডিটেইলস (যেমন: বিকাশ/ক্যাশ)..." id="payDesc" className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl mb-10 font-bold" />
                            <div className="flex gap-4">
                                <button onClick={() => setShowPayModal(null)} className="flex-1 py-5 rounded-2xl font-black text-slate-500 uppercase tracking-widest">বাতিল</button>
                                <button onClick={() => addTransaction(showPayModal.firebaseId, 'payment', document.getElementById('payAmount').value, document.getElementById('payDesc').value)} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-100">পরিশোধ করুন</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── LOGIN VIEW ────────────────────────────────
    const FactoryExpenseView = () => {
        const [showAddForm, setShowAddForm] = useState(false);
        const [newExpense, setNewExpense] = useState({ category: 'মালামাল', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

        const addExpense = async (e) => {
            e.preventDefault();
            if (!newExpense.amount || !newExpense.category) return;
            try {
                await addDoc(collection(db, "factory_expenses"), { 
                    ...newExpense, 
                    amount: parseInt(newExpense.amount),
                    createdAt: serverTimestamp() 
                });
                setNewExpense({ category: 'মালামাল', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                setShowAddForm(false);
                alert('খরচ সফলভাবে যোগ করা হয়েছে!');
            } catch (error) { console.error(error); alert('ত্রুটি হয়েছে!'); }
        };

        const totalExpenses = expenses.reduce((acc, curr) => acc + (parseInt(curr.amount) || 0), 0);

        return (
            <div className="space-y-12 no-print animate-fade-in text-slate-800">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight underline decoration-slate-100 underline-offset-[12px]">ফ্যাক্টরি ওভারহেড / খরচ</h2>
                        <p className="mt-4 text-slate-600 font-bold flex items-center gap-2">মোট খরচ: <span className="text-rose-600 text-2xl font-black">৳ {totalExpenses.toLocaleString()}</span></p>
                    </div>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="bg-slate-900 text-white px-10 py-5 rounded-[1.8rem] font-black flex items-center gap-4 shadow-2xl active:scale-95 transition-all">
                        <PlusCircle size={24} /> নতুন খরচ যোগ করুন
                    </button>
                </div>

                {showAddForm && (
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 animate-slide-up">
                        <form onSubmit={addExpense} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">ক্যাটাগরি</label>
                                <select className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-lg" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                                    <option value="মালামাল">মালামাল (Raw Material)</option>
                                    <option value="শ্রমিক মজুরি">শ্রমিক মজুরি (Labor)</option>
                                    <option value="কুরিয়ার খরচ">কুরিয়ার খরচ (Courier)</option>
                                    <option value="প্যাকিং সরঞ্জাম">প্যাকিং সরঞ্জাম (Packing)</option>
                                    <option value="অন্যান্য">অন্যান্য (Others)</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">টাকার অংক</label>
                                <input type="number" required className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all font-black text-2xl text-rose-600" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">তারিখ</label>
                                <input type="date" required className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-lg" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">বিস্তারিত বিবরণ</label>
                                <input className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-lg text-slate-700" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="যেমন: ১০ গজ কালো কাপড় বা বিকাশে মজুরি প্রদান..." />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-xl active:scale-95 transition-all">খরচ সেভ করুন</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left border-collapse">
                            <thead className="bg-[#FBFCFE] text-slate-600 font-extrabold uppercase text-[11px] tracking-[0.25em] border-b border-slate-50">
                                <tr>
                                    <th className="p-8">DATE</th>
                                    <th className="p-8">CATEGORY</th>
                                    <th className="p-8">DESCRIPTION</th>
                                    <th className="p-8 text-right">AMOUNT</th>
                                    <th className="p-8 text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {expenses.map((exp) => (
                                    <tr key={exp.firebaseId} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="p-8 font-bold text-slate-500">{exp.date}</td>
                                        <td className="p-8">
                                            <span className="bg-slate-100 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-200">{exp.category}</span>
                                        </td>
                                        <td className="p-8 font-bold text-slate-600 italic text-sm">{exp.description || 'N/A'}</td>
                                        <td className="p-8 text-right font-black text-2xl text-rose-600 tracking-tighter">৳{exp.amount}</td>
                                        <td className="p-8 text-center">
                                            <button onClick={() => deleteExpense(exp.firebaseId)} className="p-4 bg-rose-50 text-rose-200 hover:text-rose-600 hover:bg-rose-100 rounded-2xl transition-all">
                                                <XCircle size={22} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr><td colSpan="5" className="p-32 text-center text-slate-500 font-black uppercase tracking-[0.5em] text-xl">No Expenses Found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    const LoginView = () => (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-8">
            <div className="w-full max-w-[480px] bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
                <div className="bg-black py-16 px-12 text-center text-white relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[80px]"></div>
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-rose-600/10 rounded-full blur-[80px]"></div>
                    <div className="relative z-10">
                        <h1 className="text-5xl font-black tracking-tighter italic">NR ZONE</h1>
                        <p className="text-white/70 uppercase tracking-[0.6em] mt-5 font-black">Authorized System Access</p>
                    </div>
                </div>
                <form onSubmit={handleLogin} className="p-14 space-y-8">
                    <div className="space-y-2"><label className="text-slate-600 font-black uppercase text-slate-500 ml-2">Access Username</label><input name="username" placeholder="Master User" required className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none font-black text-lg focus:bg-white focus:border-slate-900 transition-all shadow-inner" /></div>
                    <div className="space-y-2"><label className="text-slate-600 font-black uppercase text-slate-500 ml-2">Secure Password</label><input name="password" type="password" placeholder="••••••••" required className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none font-black text-lg focus:bg-white focus:border-slate-900 transition-all shadow-inner" /></div>
                    {loginError && <div className="text-center p-5 bg-rose-50 rounded-2xl text-rose-600 text-[11px] font-black uppercase tracking-wider animate-shake-soft">{loginError}</div>}
                    <button className="w-full bg-black text-white py-6 rounded-[2.2rem] font-black text-2xl hover:scale-[1.02] shadow-[0_25px_50px_rgba(0,0,0,0.3)] active:scale-95 transition-all">ENTER DASHBOARD</button>
                    <p className="text-center text-[10px] text-slate-600 font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-2"><Shield size={12} /> Secure RSA 2048 Encription</p>
                </form>
            </div>
        </div>
    );

    const StaffSettingsView = () => {
        const [passForms, setPassForms] = useState({ admin: '', manager: '', worker: '' });
        const updatePass = async (role) => {
            if (!passForms[role]) return;
            try {
                await updateDoc(doc(db, "settings", "passwords"), { [role]: passForms[role] });
                alert(`${role.toUpperCase()} পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!`);
                setPassForms({ ...passForms, [role]: '' });
            } catch (e) {
                // If doc doesn't exist, create it
                await addDoc(collection(db, "settings"), { admin: 'nrzone2024', manager: 'nrzone2024', worker: 'nrzone2024' }); // Simplified for demo
            }
        };

        return (
            <div className="max-w-4xl space-y-12 no-print animate-fade-in text-slate-800">
                <h2 className="text-4xl font-extrabold tracking-tight underline decoration-slate-100 underline-offset-[12px]">পরিচালক সেটিংস</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {['admin', 'manager', 'worker'].map(role => (
                        <div key={role} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-widest text-blue-600">{role} Access</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">New Password</label>
                                <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold" value={passForms[role]} onChange={(e) => setPassForms({ ...passForms, [role]: e.target.value })} />
                            </div>
                            <button onClick={() => updatePass(role)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Update Pass</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (!isLoggedIn) return <LoginView />;

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-bengali text-slate-900 flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className={`fixed no-print md:sticky top-0 left-0 h-screen w-80 bg-[#0C0C0C] text-white z-50 transform transition-transform duration-700 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[40px_0_80px_rgba(0,0,0,0.2)] flex flex-col`}>
                <div className="p-10 border-b border-white/5 flex flex-col items-center shrink-0">
                    <img src="/logo-white.png" alt="NRZOONE" className="h-24 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
                    <div className="mt-8 flex flex-col items-center gap-3">
                        <h2 className="text-2xl font-black italic tracking-tighter text-white">NR ZONE</h2>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Live Engine Active</p>
                    </div>
                </div>
                <nav className="p-6 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {[
                        { id: 'dashboard', label: 'সেন্ট্রাল ম্যাপ', icon: <LayoutDashboard size={24} />, roles: ['Admin'] },
                        { id: 'products', label: 'প্রোডাক্ট আপলোড', icon: <Package size={24} />, roles: ['Admin', 'Manager'] },
                        { id: 'orders', label: 'অর্ডার আর্কাইভ', icon: <ShoppingBag size={24} />, roles: ['Admin', 'Manager', 'Worker'] },
                        { id: 'add-order', label: 'অর্ডার এন্ট্রি', icon: <PlusCircle size={24} />, roles: ['Admin', 'Manager'] },
                        { id: 'factory-expenses', label: 'ফ্যাক্টরি ওভারহেড', icon: <Factory size={24} />, roles: ['Admin', 'Manager'] },
                        { id: 'worker-ledger', label: 'ওয়ার্কার লেজার', icon: <History size={24} />, roles: ['Admin', 'Manager'] },
                        { id: 'staff-settings', label: 'পরিচালক সেটিংস', icon: <Shield size={24} />, roles: ['Admin'] },
                        { id: 'links', label: 'স্মার্ট অ্যাক্সেস', icon: <Link size={24} />, roles: ['Admin'] },
                    ].filter(item => item.roles.includes(userRole)).map(item => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-5 p-5 rounded-[1.8rem] font-black transition-all group relative overflow-hidden ${activeTab === item.id ? 'bg-white text-black shadow-2xl scale-[1.05]' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
                            <span className={`${activeTab === item.id ? 'text-blue-600' : 'text-slate-700 group-hover:text-blue-500'} transition-colors`}>{item.icon}</span>
                            <span className="text-[11px] uppercase tracking-[0.2em]">{item.label}</span>
                            {activeTab === item.id && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></span>}
                        </button>
                    ))}
                    <button onClick={handleLogout} className="w-full flex items-center gap-5 p-5 rounded-[1.8rem] font-black text-rose-900 hover:bg-rose-900/10 mt-10 transition-all text-[11px] uppercase tracking-[0.2em] shrink-0">
                        <LogOut size={24} /> এক্সিট সিস্টেম
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-screen p-8 md:p-16 lg:p-20 overflow-y-auto noscroll">
                <div className="md:hidden no-print flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-black italic underline decoration-blue-600 underline-offset-4 tracking-tighter">NR ZONE</h1>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-4 bg-white rounded-3xl shadow-xl border-2 border-slate-50"><Menu size={28} /></button>
                </div>

                {activeTab === 'dashboard' && isAdmin && <DashboardView />}
                {activeTab === 'products' && (isAdmin || isManager) && <ProductManagerView />}
                {activeTab === 'orders' && (isAdmin || isManager || isWorker) && <OrderListView />}
                {activeTab === 'add-order' && (isAdmin || isManager) && <AddOrderView />}
                {activeTab === 'factory-expenses' && (isAdmin || isManager) && <FactoryExpenseView />}
                {activeTab === 'worker-ledger' && (isAdmin || isManager) && <WorkerLedgerView />}
                {activeTab === 'staff-settings' && isAdmin && <StaffSettingsView />}
                {activeTab === 'links' && isAdmin && (
                    <div className="space-y-12 no-print animate-fade-in text-slate-800">
                        <h2 className="text-5xl font-extrabold tracking-tight underline decoration-slate-100 underline-offset-[16px]">স্মার্ট অ্যাক্সেস প্যানেল</h2>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            {Object.entries(LINKS).map(([category, links]) => (
                                <div key={category} className="bg-white p-14 rounded-[4rem] border border-slate-50 shadow-sm relative group overflow-hidden">
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full blur-[80px] group-hover:blur-[120px] transition-all"></div>
                                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-10 relative z-10 border-b-2 border-slate-50 pb-4 inline-block">{category}</h3>
                                    <div className="space-y-6 relative z-10">
                                        {links.map((link, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] hover:bg-slate-50 border-4 border-transparent hover:border-white transition-all group/item shadow-sm hover:shadow-xl">
                                                <div className="flex items-center gap-6">
                                                    <span className="text-4xl grayscale group-hover/item:grayscale-0 transition-all group-hover/item:scale-125 duration-500">{link.icon}</span>
                                                    <div>
                                                        <p className="font-extrabold text-slate-900 text-sm uppercase tracking-[0.1em]">{link.label}</p>
                                                        <p className="text-[11px] text-slate-600 font-black truncate w-40 md:w-64 mt-1 italic">{link.url}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-all translate-x-10 group-hover/item:translate-x-0">
                                                    <button onClick={() => handleCopy(link.url)} className={`p-4 rounded-2xl border-4 transition-all ${copiedUrl === link.url ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-300 hover:text-slate-900 hover:border-slate-900 shadow-lg'}`}><Copy size={18} /></button>
                                                    <a href={link.url} target="_blank" className="p-4 bg-white border-4 border-slate-50 hover:border-slate-900 rounded-2xl text-slate-300 hover:text-slate-900 transition-all shadow-lg active:scale-90"><ExternalLink size={18} /></a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Global Print Component */}
            <PrintInvoice order={printData} />
        </div>
    );
};

export default AdminDashboard;
