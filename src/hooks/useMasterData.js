import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const initialData = {
    workerCategories: {
        stone: ["SABBIR", "BILLALL", "SOJIB", "SONIA", "SUMAIYA"],
        sewing: ["JIHAN", "RAJIB", "IBRAHIM", "KULSUM", "SOBUJ"],
        pata: ["ALAMIN", "SABBIR", "HASAN", "KASHEM"],
        monthly: ["UZZAL"]
    },
    workerWages: {
        sewing: {}, stone: {}, pata: {}, monthly: { "UZZAL": 15000 }
    },
    designs: [
        { name: "পাতা", sewingRate: 40, stoneRate: 20, image: "" },
        { name: "ষ্টার", sewingRate: 40, stoneRate: 40, image: "" },
        { name: "দিশা", sewingRate: 50, stoneRate: 0, image: "" },
        { name: "লাইন", sewingRate: 45, stoneRate: 30, image: "" },
        { name: "লতা", sewingRate: 40, stoneRate: 45, image: "" },
        { name: "বেবি লতা", sewingRate: 30, stoneRate: 30, image: "" },
        { name: "ফুল", sewingRate: 40, stoneRate: 20, image: "" },
        { name: "বেবি ফ্রক", sewingRate: 0, stoneRate: 7, image: "" },
        { name: "ফাবিয়া 2", sewingRate: 40, stoneRate: 45, image: "" },
        { name: "মাসকা", sewingRate: 40, stoneRate: 20, image: "" },
        { name: "গুচি", sewingRate: 40, stoneRate: 20, image: "" },
        { name: "কোটি", sewingRate: 55, stoneRate: 150, image: "" },
        { name: "রিপিট", sewingRate: 45, stoneRate: 0, image: "" },
        { name: "এডজাস্ট কোটি", sewingRate: 45, stoneRate: 0, image: "" },
        { name: "আবায়া", sewingRate: 40, stoneRate: 30, image: "" },
        { name: "প্লেন", sewingRate: 40, stoneRate: 0, image: "" },
    ],
    pataRates: { "Single": 3, "Double": 5, "Triple": 10, "Mix": 8 },
    stonePacketRate: 450,
    rollPscRate: 100,
    colors: ["অলিভ", "জাম", "ব্লু", "বিস্কুট", "কালো", "সাদা", "নুড", "মেরুন", "কফি", "পিত", "পানি", "মাস্টার"],
    sizes: ["30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"],
    pataTypes: ["Single", "Double", "Triple", "Mix"],
    pataStoneColors: ["White", "Golden", "Black", "Silver", "Multi", "Rainbow"],
    users: [
        { id: "NRZONE", password: "Irham@#", role: "admin", name: "Super Admin" },
        { id: "MANAGER", password: "456", role: "manager", name: "Operations Manager" },
    ],
    cuttingStock: [],
    productions: [],
    pataEntries: [],
    pataStockTransfer: [],
    attendance: [],
    rawInventory: [],
    deliveries: [],
    outsideWorkEntries: [],
    outsideWorkers: ["REPAIR MAN 1", "BUTTON EXPERT"],
    outsideTasks: ["BUTTON", "CHAIN", "REPAIR", "KAZ", "OTHERS"],
    adminNotes: [],
    cutters: ["MEHEDI", "SABBIR", "HASAN"],
    notifications: [],
    workerDocs: [],
    workerAdvances: [],
    settings: { logo: "", whatsappNumber: "" },
    whatsappRequests: [],
    expenses: [],
    cashEntries: [],
    workerPayments: [],
    workerBiometrics: {},
    auditLogs: [], 
    systemSettings: {
        offlineMode: true,
        whatsappEnabled: true,
        barcodeEnabled: true,
        currency: "৳"
    },
    rolePermissions: {
        admin: ["*"],
        manager: ["overview", "productions", "inventory", "attendance", "outside", "reports"],
        accountant: ["overview", "expenses", "payments", "reports"],
        worker: ["overview", "productions"]
    }
};

const COLLECTION_NAME = "nrzone_pro";
const DOC_ID = "factory_data_v1";
const LOGS_DOC_ID = "factory_logs_v1";

export const useMasterData = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [masterData, setMasterData] = useState(() => {
        const saved = localStorage.getItem('nrzone_data');
        if (saved) {
            try {
                return { ...initialData, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Local storage parse error:", e);
            }
        }
        return initialData;
    });

    const [syncStatus, setSyncStatus] = useState('syncing'); 
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);

    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Initial Load & Auth Sync
    useEffect(() => {
        let isSubscribed = true;
        setSyncStatus('syncing');

        if (!db) {
            console.warn("DB not initialized - Cloud sync disabled.");
            setIsLoading(false);
            setSyncStatus('error');
            return;
        }

        // Main Data Sync
        const unsub = onSnapshot(doc(db, COLLECTION_NAME, DOC_ID), (snap) => {
            if (!isSubscribed) return;
            try {
                if (snap.exists()) {
                    const cloud = snap.data()?.content;
                    if (cloud) {
                        setMasterData(prev => {
                            const merged = { ...initialData, ...cloud };
                            // Remove auditLogs from main state if it exists (migration)
                            if (merged.auditLogs) delete merged.auditLogs;
                            if (JSON.stringify(merged) !== JSON.stringify(prev)) {
                                localStorage.setItem('nrzone_data', JSON.stringify(merged));
                                return merged;
                            }
                            return prev;
                        });
                    }
                } else {
                    setDoc(doc(db, COLLECTION_NAME, DOC_ID), { content: initialData }).catch(console.error);
                }
                setSyncStatus('synced');
            } catch (err) {
                console.error("Snapshot error:", err);
            } finally {
                setIsLoading(false);
            }
        }, (err) => {
            if (!isSubscribed) return;
            setIsLoading(false);
            setSyncStatus('error');
        });

        // Logs Sync
        const unsubLogs = onSnapshot(doc(db, COLLECTION_NAME, LOGS_DOC_ID), (snap) => {
            if (!isSubscribed) return;
            if (snap.exists()) {
                const cloudLogs = snap.data()?.auditLogs || [];
                setLogs(cloudLogs);
            }
        });

        const failSafe = setTimeout(() => {
            if (isSubscribed) setIsLoading(false);
        }, 1500);

        return () => {
            isSubscribed = false;
            clearTimeout(failSafe);
            unsub();
            unsubLogs();
        };
    }, []);

    // Save Logic - Main Data
    useEffect(() => {
        if (!db || !masterData || isLoading) return;

        const timer = setTimeout(async () => {
            try {
                if (!masterData.users || masterData.users.length === 0) return;

                setSyncStatus('syncing');
                // Ensure we don't save logs in the main document
                const { auditLogs, ...dataToSave } = masterData; 
                await setDoc(doc(db, COLLECTION_NAME, DOC_ID), { content: dataToSave }, { merge: true });
                localStorage.setItem('nrzone_data', JSON.stringify(dataToSave));
                setSyncStatus('synced');
            } catch (e) {
                console.error("MasterData sync error:", e);
                setSyncStatus('error');
            }
        }, 3000); 

        return () => clearTimeout(timer);
    }, [masterData, isLoading]);

    // Save Logic - Logs
    useEffect(() => {
        if (!db || !logs || logs.length === 0) return;
        const timer = setTimeout(async () => {
            try {
                await setDoc(doc(db, COLLECTION_NAME, LOGS_DOC_ID), { auditLogs: logs.slice(0, 500) }, { merge: true });
            } catch (e) {
                console.error("Logs sync error:", e);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [logs]);

    const logAction = (user, action, details) => {
        const newLog = {
            timestamp: new Date().toISOString(),
            user: user?.name || user?.id || 'System',
            role: user?.role || 'Guest',
            action,
            details
        };
        setLogs(prev => [newLog, ...prev].slice(0, 499));
    };

    const downloadBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ ...masterData, auditLogs: logs }));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `nrzone_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return { masterData, setMasterData, isLoading, syncStatus, logAction, logs, downloadBackup };
};
