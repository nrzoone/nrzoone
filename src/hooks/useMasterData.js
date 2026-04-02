import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { syncToSheet } from '../utils/syncUtils';



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
        { id: "NRZO0NE", password: "Irham@#", role: "admin", name: "Super Admin" },
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
    expenses: [],
    cashEntries: [],
    workerPayments: [],
    auditLogs: [], // Feature 4: Audit Trail
    systemSettings: {
        offlineMode: true,
        whatsappEnabled: true,
        barcodeEnabled: true,
        currency: "৳"
    },
    rolePermissions: { // Feature 7: Role Based Access Control
        admin: ["*"],
        manager: ["overview", "productions", "inventory", "attendance", "outside", "reports"],
        accountant: ["overview", "expenses", "payments", "reports"],
        worker: ["overview", "productions"]
    }
};


const COLLECTION_NAME = "nrzone_pro";
const DOC_ID = "factory_data_v1";

export const useMasterData = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [masterData, setMasterData] = useState(() => {
        const saved = localStorage.getItem('nrzone_data');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Local storage parse error:", e);
            }
        }
        return initialData;
    });

    // Cloud sync status
    const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced', 'syncing', 'error'
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);

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

    // Immediate sync on online status change
    useEffect(() => {
        if (isOnline && db && masterData && !isLoading) {
            const sync = async () => {
                try {
                    setSyncStatus('syncing');
                    await setDoc(doc(db, COLLECTION_NAME, DOC_ID), { content: masterData }, { merge: true });
                    localStorage.setItem('nrzone_data', JSON.stringify(masterData));
                    setSyncStatus('synced');
                } catch (e) {
                    console.error("Online recovery sync failed:", e);
                }
            };
            sync();
        }
    }, [isOnline]);

    // First load from Firestore
    useEffect(() => {
        if (!db) {
            console.error("Firestore database is unavailable.");
            setIsLoading(false);
            setSyncStatus('error');
            return;
        }

        let isSubscribed = true;
        const unsub = onSnapshot(doc(db, COLLECTION_NAME, DOC_ID), (snap) => {
            if (!isSubscribed) return;
            try {
                if (snap.exists()) {
                    const cloudData = snap.data();
                    const cloud = cloudData?.content;
                    if (!cloud) {
                        setSyncStatus('synced');
                        setIsLoading(false);
                        return;
                    }

                    setMasterData((prev) => {
                        const cloudStr = JSON.stringify(cloud);
                        const prevStr = JSON.stringify(prev);
                        if (cloudStr !== prevStr) {
                            try {
                                localStorage.setItem('nrzone_data', cloudStr);
                            } catch (lsErr) {
                                console.warn("Local storage update failed (likely quota):", lsErr);
                            }
                            return cloud;
                        }
                        return prev;
                    });
                    setSyncStatus('synced');
                } else {
                  // Ensure setDoc is handled to avoid unhandled promise rejection
                  (async () => {
                    try {
                      await setDoc(doc(db, COLLECTION_NAME, DOC_ID), { content: initialData });
                    } catch (e) {
                      console.error("Internal initialization failed:", e);
                    }
                  })();
                }
            } catch (err) {
                console.error("Data processing error:", err);
                setSyncStatus('error');
            } finally {
                // Ensure loading is always cleared on the first response
                if (isSubscribed) setIsLoading(false);
            }
        }, (err) => {
            if (!isSubscribed) return;
            
            // Robust check for various abort error formats across browsers
            const errStr = String(err.message || err.code || err);
            if (/abort|cancelled|user aborted/i.test(errStr)) {
                console.warn("Firestore listener aborted (benign). Moving to local mode.");
                if (isSubscribed) setIsLoading(false);
                return;
            }
            
            console.error("Firestore access error:", err);
            setSyncStatus('error');
            if (isSubscribed) setIsLoading(false);
        });

        // Fail-safe timeout to unmask UI if Firestore is too slow or aborted
        const failSafe = setTimeout(() => {
            if (isSubscribed) {
                console.warn("Firestore taking too long. Unmasking UI with local data.");
                setIsLoading(false);
            }
        }, 3000);

        return () => {
            isSubscribed = false;
            clearTimeout(failSafe);
            if (unsub) unsub();
        };
    }, []);

    // Save logic - Debounced Cloud Save Only
    useEffect(() => {
        if (!db || !masterData || isLoading) return;

        const timer = setTimeout(async () => {
            try {
                // Check if current state matches what's in local storage to avoid redundant cloudsync
                const saved = localStorage.getItem('nrzone_data');
                if (JSON.stringify(masterData) === saved) {
                    setSyncStatus('synced');
                    return;
                }

                setSyncStatus('syncing');
                await setDoc(doc(db, COLLECTION_NAME, DOC_ID), { content: masterData }, { merge: true });
                localStorage.setItem('nrzone_data', JSON.stringify(masterData));
                setSyncStatus('synced');
            } catch (e) {
                console.error("Cloud Save Failed:", e);
                setSyncStatus('error');
            }
        }, 5000); // 5 seconds debounce for cloud to reduce hit count

        return () => clearTimeout(timer);
    }, [masterData, isLoading]);

    const logAction = (user, action, details) => {
        setMasterData(prev => ({
            ...prev,
            auditLogs: [
                {
                    timestamp: new Date().toISOString(),
                    user: user?.name || user?.id || 'System',
                    role: user?.role || 'Guest',
                    action,
                    details
                },
                ...(prev.auditLogs || []).slice(0, 999) // Limit to 1000 logs
            ]
        }));
    };

    return { masterData, setMasterData, isLoading, syncStatus, logAction };
};
