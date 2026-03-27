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

    // First load from Firestore
    useEffect(() => {
        const unsub = onSnapshot(doc(db, COLLECTION_NAME, DOC_ID), (snap) => {
            if (snap.exists()) {
                const cloud = snap.data()?.content;
                if (!cloud) {
                    setMasterData(initialData);
                    setIsLoading(false);
                    return;
                }

                setMasterData(prev => {
                    const updatedCloud = { ...cloud };
                    if (!updatedCloud.users) updatedCloud.users = initialData.users;
                    if (!updatedCloud.designs) updatedCloud.designs = initialData.designs;
                    if (!updatedCloud.workerCategories) updatedCloud.workerCategories = initialData.workerCategories;

                    const cloudStr = JSON.stringify(updatedCloud);
                    if (JSON.stringify(prev) !== cloudStr) {
                        return updatedCloud;
                    }
                    return prev;
                });
                setSyncStatus('synced');
            } else {
                setDoc(doc(db, COLLECTION_NAME, DOC_ID), { content: initialData });
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Firestore access error:", err);
            setSyncStatus('error');
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    // Save logic
    useEffect(() => {
        if (!masterData) return;

        // Immediate Local Save
        localStorage.setItem('nrzone_data', JSON.stringify(masterData));

        // Debounced Cloud Save
        const timer = setTimeout(async () => {
            try {
                setSyncStatus('syncing');
                await setDoc(doc(db, COLLECTION_NAME, DOC_ID), { content: masterData }, { merge: true });
                setSyncStatus('synced');
            } catch (e) {
                console.error("Cloud Save Failed:", e);
                setSyncStatus('error');
            }
        }, 3000); // 3 seconds debounce for cloud

        return () => clearTimeout(timer);
    }, [masterData]);

    return { masterData, setMasterData, isLoading, syncStatus };
};
