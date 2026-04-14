import React, { useState } from "react";
import {
  Settings,
  Users,
  User,
  Package,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
  Download,
  ChevronRight,
  ShieldCheck,
  Database,
  LayoutGrid,
  Image as ImageIcon,
  Upload,
  ArrowLeft,
  Scissors,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  CreditCard,
  Printer,
  FileText,
  MessageCircle,
  AlertTriangle,
  TrendingDown,
  Send,
  BarChart2,
  Key,
  Search,
  Fingerprint,
  ShieldAlert,
  Server,
  Palette,
  Star
} from "lucide-react";
import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateWorkerPaySlip } from "../../services/pdfService";
import NRZLogo from "../NRZLogo";

const AccordionItem = ({ id, label, icon: Icon, description, children, activeTab, setActiveTab }) => {
  const isOpen = activeTab === id;
  return (
    <div className={`mb-4 transition-all duration-300 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden ${isOpen ? 'bg-white dark:bg-slate-900 shadow-xl scale-[1.01]' : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800'}`}>
      <button 
        onClick={() => setActiveTab(isOpen ? "" : id)}
        className="w-full px-6 py-5 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-slate-950 text-white' : 'bg-white dark:bg-slate-900 text-black dark:text-white dark:text-white group-hover:scale-110 shadow-sm border border-slate-100 dark:border-slate-800'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className={`text-lg font-bold uppercase tracking-tight leading-none transition-colors text-[var(--text-primary)]`}>{label}</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2 italic">{description}</p>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-zinc-700 transition-all ${isOpen ? 'bg-slate-950 border-slate-950 text-white rotate-180' : 'bg-white dark:bg-slate-800 text-slate-300 group-hover:text-black'}`}>
          <ChevronRight size={14} />
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-8 pt-4 border-t border-slate-50 dark:border-slate-800 animate-fade-down">
          {children}
        </div>
      )}
    </div>
  );
};

const SettingsPanel_V2 = ({
  masterData,
  setMasterData,
  user: currentUser,
  showNotify,
  setActivePanel,
  t,
  logs,
  downloadBackup,
  syncStatus
}) => {
  const role = currentUser?.role?.toLowerCase();
  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center animate-fade-up">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-8 shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight mb-4 text-[var(--text-primary)] uppercase">এক্সেস লিমিটেড (ACCESS RESTRICTED)</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed italic">
           এই বিভাগটি শুধুমাত্র অ্যাডমিনদের জন্য সংরক্ষিত। আপনার অনুমতির অভাব রয়েছে।
        </p>
        <button 
           onClick={() => setActivePanel('Overview')}
           className="mt-12 px-8 py-4 bg-slate-950 text-white dark:bg-white dark:text-black rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl hover:-translate-y-1 transition-all"
        >
           ড্যাশবোর্ডে ফিরে যান (Return)
        </button>
      </div>
    );
  }

  const [activeMainTab, setActiveMainTab] = useState("nodes");
  const [activeTab, setActiveTab] = useState("users");
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkerDept, setNewWorkerDept] = useState("cutting");
  const [uploading, setUploading] = useState(false);
  const [tempImgUrl, setTempImgUrl] = useState(null);
  const [editDesignModal, setEditDesignModal] = useState(null);
  const [showProfilePass, setShowProfilePass] = useState(false);
  const [showUserPass, setShowUserPass] = useState(false);
  const [workerDocModal, setWorkerDocModal] = useState(null);
  const [printWorkerDoc, setPrintWorkerDoc] = useState(null);
  const [uploadingWorkerPhoto, setUploadingWorkerPhoto] = useState(false);
  const [tempWorkerPhoto, setTempWorkerPhoto] = useState(null);
  const [tempNidPhoto, setTempNidPhoto] = useState(null);
  const [personnelTab, setPersonnelTab] = useState("staff");
  const [workerSearch, setWorkerSearch] = useState("");

  // Sync photos when modal opens
  React.useEffect(() => {
    if (workerDocModal && workerDocModal !== "add") {
      setTempWorkerPhoto(workerDocModal.photo || null);
      setTempNidPhoto(workerDocModal.nidPhoto || null);
    } else if (workerDocModal === "add") {
      setTempWorkerPhoto(null);
      setTempNidPhoto(null);
    }
  }, [workerDocModal]);

  // ===== WhatsApp Message Sender =====
  const sendWhatsApp = (phone, message) => {
    if (!phone) return alert("এই কর্মীর ফোন নম্বর সংরক্ষণ নেই!");
    // Format BD number: 01XXXXXXXXX -> 8801XXXXXXXXX
    const cleaned = phone.replace(/\D/g, "");
    const intl = cleaned.startsWith("880")
      ? cleaned
      : "880" + cleaned.replace(/^0/, "");
    const url = `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Upload worker photo or NID to Firebase
  const handleWorkerPhotoUpload = async (file, type) => {
    if (!file) return null;
    setUploadingWorkerPhoto(true);
    try {
      const storageRef = ref(
        storage,
        `workers/${type}_${Date.now()}_${file.name}`,
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setUploadingWorkerPhoto(false);
      return url;
    } catch (e) {
      console.error("Worker photo upload failed", e);
      setUploadingWorkerPhoto(false);
      return null;
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `branding/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setMasterData((prev) => ({
        ...prev,
        settings: { ...(prev.settings || {}), logo: url },
      }));
      showNotify("Company Logo Updated!");
    } catch (error) {
      console.error("Logo upload failed", error);
      showNotify("Logo upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleMasterReset = (isTotal = false) => {
    const msg = isTotal 
      ? "🚨 WARNING: This will DELETE EVERYTHING (Workers, Designs, Users, and all Transactions). This CANNOT be undone. Are you absolutely sure?"
      : "⚠️ WARNING: This will clear all WORKERS and TRANSACTIONAL data (Lots, Payments, Deliveries, Inventory) but keep your DESIGNS and RATES. Continue?";
    
    if (confirm(msg)) {
      if (confirm("FINAL CONFIRMATION: Are you sure you want to proceed with the deletion?")) {
        setMasterData(prev => {
          const transactionalKeys = [
            'cuttingStock', 'productions', 'pataEntries', 'pataStockTransfer', 
            'rawInventory', 'deliveries', 'outsideWorkEntries', 'expenses', 
            'cashEntries', 'workerPayments', 'workerAdvances', 'clientTransactions', 
            'productionRequests', 'attendance', 'auditLogs', 'notifications'
          ];
          
          const workerKeys = {
            workerCategories: { cutting: [], sewing: [], stone: [], pata: [], monthly: [] },
            workerWages: { cutting: {}, sewing: {}, stone: {}, pata: {}, monthly: {} },
            workerDocs: [],
            workerBiometrics: {}
          };

          if (isTotal) {
            // Full Reset (except super admin)
            return {
              ...prev,
              ...transactionalKeys.reduce((acc, k) => ({ ...acc, [k]: [] }), {}),
              ...workerKeys,
              designs: [],
              clients: [],
              users: prev.users.filter(u => u.id === 'NRZONE')
            };
          } else {
            // Transactional + Worker Reset (Keeping Designs/Rates/Colors/Sizes)
            return {
              ...prev,
              ...transactionalKeys.reduce((acc, k) => ({ ...acc, [k]: [] }), {}),
              ...workerKeys
            };
          }
        });
        showNotify(isTotal ? "System fully reset to factory settings!" : "Workers and transactional data cleared. Designs and rates preserved.");
      }
    }
  };

  const registerAdminBiometric = async () => {
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = crypto.getRandomValues(new Uint8Array(16));
        
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: { name: "NRZOONE ERP" },
                user: {
                    id: userId,
                    name: currentUser.name,
                    displayName: currentUser.name
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: { authenticatorAttachment: "platform" },
                timeout: 60000
            }
        });

        if (credential) {
            const biometricId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            setMasterData(prev => ({
                ...prev,
                users: prev.users.map(u => u.id === currentUser.id ? { ...u, biometricId } : u),
                settings: { ...prev.settings, adminBiometricRegistered: true }
            }));
            showNotify(`Finger/Face ID successfully registered for ${currentUser.name}!`, 'success');
        }
    } catch (err) {
        console.error("Admin biometric registration failed:", err);
        showNotify("বায়োমেট্রিক রেজিস্ট্রেশন বাতিল হয়েছে!", 'error');
    }
  };

  const handleUpdateCurrentPassword = (newPass) => {
    if (!newPass.trim()) return;
    setMasterData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === currentUser.id ? { ...u, password: newPass } : u)
    }));
    showNotify("Password updated successfully!");
    setShowProfilePass(false);
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const storageRef = ref(storage, `designs/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setUploading(false);
      return url;
    } catch (error) {
      console.error("Upload failed", error);
      setUploading(false);
      return null;
    }
  };

  const handleAddListItem = (category, value, createPortal = false) => {
    if (!value.trim()) return;
    setMasterData((prev) => {
        const list = Array.isArray(prev[category]) ? prev[category] : [];
        const newState = {
            ...prev,
            [category]: [...list, value.toUpperCase()],
        };
        
        if (createPortal && category === 'clients') {
            const userId = value.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            newState.users = [...(prev.users || []), {
                id: userId,
                password: "login123",
                name: value.toUpperCase(),
                role: "client"
            }];
            setTimeout(() => showNotify(`Portal created! ID: ${userId} | PW: login123`, "success"), 500);
        }
        
        return newState;
    });
    setShowAddModal(false);
  };

  const handleDeleteListItem = (category, index) => {
    if (!confirm("Delete this item?")) return;
    setMasterData((prev) => {
        const list = Array.isArray(prev[category]) ? prev[category] : [];
        return {
            ...prev,
            [category]: list.filter((_, i) => i !== index),
        };
    });
  };

  const handleUpdateListItem = (category, index, newValue) => {
    if (!newValue.trim()) return;
    setMasterData((prev) => {
        const list = Array.isArray(prev[category]) ? prev[category] : [];
        return {
            ...prev,
            [category]: list.map((item, i) =>
                i === index ? newValue.toUpperCase() : item,
            ),
        };
    });
    setEditingItem(null);
  };

  const handleSaveUnifiedWorker = (doc, oldName = null, oldDept = null) => {
    if (!doc.name.trim()) return showNotify("কর্মীর নাম আবশ্যক!", "error");
    const upperName = doc.name.toUpperCase();
    const dept = doc.dept;

    setMasterData((prev) => {
      const docs = prev.workerDocs || [];
      let newDocs = [...docs];
      let newCategories = { ...prev.workerCategories };
      let newWages = { ...prev.workerWages };

      // Remove old category/wage if name or dept changed
      if (oldName && oldDept && (oldName !== upperName || oldDept !== dept)) {
        if (newCategories[oldDept]) {
          newCategories[oldDept] = newCategories[oldDept].filter(
            (n) => n !== oldName,
          );
        }
        if (newWages[oldDept]) {
          delete newWages[oldDept][oldName];
        }
      }

      // Is it an existing doc?
      const existingDocIndex = docs.findIndex((d) => d.id === doc.id);
      if (existingDocIndex >= 0 && !doc.id.startsWith("legacy-")) {
        newDocs[existingDocIndex] = doc;
      } else {
        // New doc or converting a legacy
        doc.id = Date.now().toString();
        newDocs = [doc, ...newDocs];
      }

      // Ensure in categories
      if (!newCategories[dept]) newCategories[dept] = [];
      if (!newCategories[dept].includes(upperName)) {
        newCategories[dept] = [...newCategories[dept], upperName];
      }

      // Set wage
      if (!newWages[dept]) newWages[dept] = {};
      newWages[dept][upperName] = Number(doc.wage) || 0;

      return {
        ...prev,
        workerDocs: newDocs,
        workerCategories: newCategories,
        workerWages: newWages,
      };
    });
    setWorkerDocModal(null);
    showNotify("কর্মীর প্রোফাইল সংরক্ষণ হয়েছে!");
  };

  const handleDeleteUnifiedWorker = (id, name, dept) => {
    if (!confirm("এই কর্মীর প্রোফাইল ও ডাটাবেজ এক্সেস মুছে ফেলতে চান?")) return;
    setMasterData((prev) => ({
      ...prev,
      workerDocs: (prev.workerDocs || []).filter((d) => d.id !== id),
      workerCategories: {
        ...(prev.workerCategories || {}),
        [dept]: (prev.workerCategories?.[dept] || []).filter(
          (n) => n !== name.toUpperCase(),
        ),
      },
    }));
    showNotify("কর্মী মুছে ফেলা হয়েছে!");
  };

  const handleAddUser = (id, password, name, role) => {
    if (!id.trim() || !password.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      users: [
        ...(prev.users || []),
        {
          id: id.toUpperCase(),
          password,
          name: name || id,
          role: role || "manager",
        },
      ],
      clients: (role === 'client' && !(prev.clients || []).includes(name || id)) ? [...(prev.clients || []), (name || id)] : (prev.clients || [])
    }));
    setShowAddModal(false);
  };

  const handleUpdateUser = (index, updatedUser) => {
    setMasterData((prev) => ({
      ...prev,
      users: prev.users.map((u, i) =>
        i === index ? { ...u, ...updatedUser } : u,
      ),
    }));
    setEditingItem(null);
    showNotify("User updated successfully");
  };

  const handleDeleteUser = (id) => {
    if (id === "NRZONE") return alert("Cannot delete Super Admin");
    if (!confirm(`Delete user ${id}?`)) return;
    setMasterData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  };

  const handleAddWorker = (dept, name, wage, phone, password, nidNumber, address, joiningDate, emergency, notes) => {
    if (!name.trim()) return showNotify("কর্মী নাম আবশ্যক!", "error");
    
    const workerId = Date.now().toString();
    const formattedName = name.trim().toUpperCase();
    const formattedPhone = phone?.trim() || "";

    handleSaveUnifiedWorker({
      id: workerId,
      name: formattedName,
      dept,
      wage: Number(wage) || 0,
      phone: formattedPhone,
      password: password || "",
      nidNumber: nidNumber || "",
      address: address || "",
      joiningDate: joiningDate || new Date().toISOString().split("T")[0],
      emergencyContact: emergency || "",
      notes: notes || "",
    });

    if (password?.trim()) {
       setMasterData(prev => ({
          ...prev,
          users: [
             ...(prev.users || []),
             {
                id: formattedPhone || formattedName,
                name: formattedName,
                password: password.trim(),
                role: 'worker'
             }
          ]
       }));
       showNotify(`${formattedName} এর লগিন এক্সেস তৈরি হয়েছে!`, "success");
    } else {
       showNotify(`${formattedName} সফলভাবে যুক্ত হয়েছে!`, "success");
    }

    setShowAddModal(false);
  };

  const handleAddDesign = (data) => {
    if (!data.name.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      designs: [
        ...(prev.designs || []),
        {
          name: data.name,
          sewingRate: Number(data.sewingRate) || 0,
          stoneRate: Number(data.stoneRate) || 0,
          pataRateSingle: Number(data.pataRateSingle) || 3,
          pataRateDouble: Number(data.pataRateDouble) || 6,
          outsideRate: Number(data.outsideRate) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          clientRates: data.clientRates || {},
          defaultClientRates: data.defaultClientRates || {},
          image: data.image || "",
        },
      ],
    }));
    setTempImgUrl(null);
    setShowAddModal(false);
  };

  const handleUpdateDesignFull = (index, updatedDesign) => {
    setMasterData((prev) => ({
      ...prev,
      designs: (prev.designs || []).map((d, i) =>
        i === index ? { ...d, ...updatedDesign } : d,
      ),
    }));
    setEditDesignModal(null);
    setTempImgUrl(null);
    showNotify("Design updated successfully");
  };

  const handleDeleteDesign = (index) => {
    if (!confirm("Delete this design?")) return;
    setMasterData((prev) => ({
      ...prev,
      designs: (prev.designs || []).filter((_, i) => i !== index),
    }));
  };

  const handleBackup = () => {
    const dataStr = JSON.stringify(masterData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `nrzone_backup_${new Date().toISOString().split("T")[0]}.json`;

    let linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    showNotify("Database Backup Downloaded!");
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (
          confirm(
            "Importing this file will OVERWRITE ALL current data. Continue?",
          )
        ) {
          setMasterData(importedData);
          showNotify("Database Restored Successfully!");
        }
      } catch (err) {
        alert("Invalid Backup File");
      }
    };
    reader.readAsText(file);
  };

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
        active === id ? "bg-slate-950 text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );

  const ListSection = ({ category, title, items, icon }) => (
    <div className="space-y-6 animate-fade-up">
      <div className="bg-white dark:bg-slate-950 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center group">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            {icon ? (
              React.cloneElement(icon, {
                size: 24,
              })
            ) : (
              <Database size={24} />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] uppercase leading-none">
              {title}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-2">
              {items?.length || 0} টি কনফিগার করা হয়েছে
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(category)}
          className="px-6 h-12 bg-slate-950 text-white rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          <span className="text-[9px] font-bold uppercase tracking-widest">নতুন যুক্ত করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items?.map((item, idx) => {
          const isEditing = editingItem === `${category}-${idx}`;
          return (
            <div
              key={idx}
              className="saas-card !p-6 flex flex-col justify-between group h-44 hover:border-slate-950 dark:hover:border-white transition-all shadow-sm"
            >
              {isEditing ? (
                <div className="space-y-4 relative z-10 h-full flex flex-col">
                  <input
                    autoFocus
                    id={`edit-${category}-${idx}`}
                    className="premium-input !h-12 !text-center"
                    defaultValue={item}
                  />
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="flex-1 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-[8px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateListItem(
                          category,
                          idx,
                          document.getElementById(`edit-${category}-${idx}`).value,
                        )
                      }
                      className="flex-1 py-3 rounded-lg bg-slate-950 text-white text-[8px] font-bold uppercase tracking-widest shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-2">Item ID: {idx + 1}</p>
                    <p className="font-bold text-xl uppercase tracking-tight text-[var(--text-primary)] leading-tight">
                      {item}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all mt-6">
                    <button
                      onClick={() => setEditingItem(`${category}-${idx}`)}
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white transition-all shadow-sm border border-slate-100 dark:border-slate-800"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteListItem(category, idx)}
                      className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-300 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const getUnifiedWorkers = (dept) => {
    let legacyNames = masterData.workerCategories?.[dept] || [];
    if (dept === 'cutting') {
      legacyNames = masterData.cutters || [];
    }
    const wages = masterData.workerWages?.[dept] || {};
    const allDocs = masterData.workerDocs || [];

    const merged = [];

    allDocs
      .filter((d) => d.dept === dept)
      .forEach((doc) => {
        merged.push({
          ...doc,
          wage: wages[doc.name.toUpperCase()] || Number(doc.wage) || 0,
          isLegacy: false,
        });
      });

    legacyNames.forEach((name) => {
      if (!merged.find((m) => m.name.toUpperCase() === name.toUpperCase())) {
        merged.push({
          id: `legacy-${Date.now()}-${Math.random()}`,
          name,
          dept,
          wage: wages[name.toUpperCase()] || 0,
          isLegacy: true,
        });
      }
    });

    return merged;
  };

  const renderUsersContent = () => (
    <div className="space-y-8 animate-fade-up">
       <div className="flex justify-between items-center">
          <h4 className="text-2xl font-bold uppercase tracking-tight text-[var(--text-primary)]">সিস্টেম <span className="text-blue-600">এক্সেস নোড</span></h4>
          <button 
             onClick={() => setShowAddModal("user")}
             className="px-6 py-3.5 bg-slate-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2"
          >
             <Plus size={16} strokeWidth={3} /> নতুন এক্সেস নোড
          </button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masterData.users?.map((u, idx) => (
             <div key={idx} className="saas-card group relative flex flex-col justify-between overflow-hidden min-h-[220px]">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                   <ShieldCheck size={120} className="text-[var(--text-primary)]" />
                </div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white dark:text-white'}`}>
                      {u.role}
                   </span>
                   <div className="flex gap-2">
                       <button 
                          onClick={() => {
                             const newPass = prompt(`${u.name.toUpperCase()} এর পাসওয়ার্ড পরিবর্তন করবেন?`, u.password);
                             if (newPass) {
                                setMasterData(prev => ({
                                   ...prev,
                                   users: (prev.users || []).map(usr => usr.id === u.id ? { ...usr, password: newPass } : usr)
                                }));
                                showNotify("অ্যাক্সেস পাসওয়ার্ড আপডেট করা হয়েছে!");
                             }
                          }}
                          className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                       >
                          <Key size={16} />
                       </button>
                       {u.id === currentUser.id && (
                          <button 
                             onClick={registerAdminBiometric} 
                             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${u.biometricId ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white font-bold animate-pulse'}`}
                          >
                             <Fingerprint size={18} />
                          </button>
                       )}
                       {u.id !== "NRZO0NE" && <button onClick={() => handleDeleteUser(u.id)} className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all"><Trash2 size={16} /></button>}
                   </div>
                </div>

                <div className="relative z-10">
                   <h4 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] uppercase leading-none">{u.name}</h4>
                   <div className="flex items-center gap-3 mt-3">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{u.id}</p>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active Node</p>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
                   <div>
                       <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-1">Auth Level</p>
                      <p className="font-mono text-xs text-slate-300 group-hover:text-black dark:text-white dark:group-hover:text-white transition-colors">••••••••</p>
                   </div>
                   <button 
                      onClick={() => alert(`ID: ${u.id}\nPW: ${u.password}`)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all"
                   >
                      Verify
                   </button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );


  const renderDesignsList = () => (
    <div className="space-y-6 animate-fade-up">
       <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
               <Palette size={20} />
            </div>
            <div>
               <h3 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white">ডিজাইন ও <span className="text-blue-600">স্টাইল হাব</span></h3>
               <p className="text-[8px] font-black uppercase tracking-widest mt-1.5">{masterData.designs?.length || 0} টি ডিজাইন অ্যাক্টিভ আছে</p>
            </div>
          </div>
          <button 
             onClick={() => {
                setEditDesignModal(null);
                setTempImgUrl(null);
                setShowAddModal("design");
             }} 
             className="px-6 h-10 bg-slate-950 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2.5 active:scale-95"
          >
             <Plus size={16} strokeWidth={3} /> নতুন ডিজাইন যুক্ত করুন
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {masterData.designs?.map((d, idx) => (
             <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg group hover:border-blue-500 transition-all relative overflow-hidden flex flex-col h-full">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-4 border border-slate-100 dark:border-slate-700">
                    {d.image ? (
                        <img src={d.image} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" alt={d.name} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-[0.05] group-hover:opacity-10 transition-opacity">
                            <Palette size={80} />
                        </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-slate-950/90 text-white px-2.5 py-1 rounded-lg border border-white/10 shadow-xl">
                        <p className="text-[10px] font-black italic tracking-tighter">৳{d.sellingPrice || 0}</p>
                    </div>
                </div>

                <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                        <h4 className="text-base font-black uppercase tracking-tighter truncate max-w-[70%] italic">{d.name}</h4>
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[7px] font-bold uppercase tracking-widest">ID: {idx+1}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="text-[7.5px] font-black text-slate-400 uppercase mb-2 leading-none italic">Worker Wages</p>
                            <div className="space-y-1.5 min-h-[60px]">
                               <div className="flex justify-between text-[9px] font-bold"><span>Swing:</span> ৳{d.sewingRate || 0}</div>
                               <div className="flex justify-between text-[9px] font-bold"><span>Stone:</span> ৳{d.stoneRate || 0}</div>
                               <div className="flex justify-between text-[9px] font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <span>Pata:</span>
                                  <span className="text-slate-500">S:{d.pataRateSingle || 3} D:{d.pataRateDouble || 6}</span>
                               </div>
                            </div>
                        </div>
                        <div className="p-2.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
                            <p className="text-[7.5px] font-black text-blue-500 mb-2 leading-none italic uppercase">Client Rates</p>
                            <div className="space-y-1.5 min-h-[60px]">
                               <div className="flex justify-between text-[9px] font-bold text-blue-600"><span>Swing:</span> ৳{d.defaultClientRates?.sewing || 0}</div>
                               <div className="flex justify-between text-[9px] font-bold text-blue-600"><span>Stone:</span> ৳{d.defaultClientRates?.stone || 0}</div>
                               <div className="flex justify-between text-[9px] font-bold text-blue-600 pt-1 border-t border-blue-100/50 dark:border-blue-900/50">
                                  <span>Pata:</span>
                                  <span className="opacity-70">S:{d.defaultClientRates?.pataSingle || 3} D:{d.defaultClientRates?.pataDouble || 6}</span>
                               </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                       {Object.keys(d.clientRates || {}).length > 0 && (
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100/50 dark:border-slate-700/50">
                               <p className="text-[7px] font-bold text-slate-400 uppercase italic mb-1 tracking-widest">Extra B2B Rates Active</p>
                               <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                   {Object.keys(d.clientRates).map(c => (
                                       <span key={c} className="shrink-0 px-1.5 py-0.5 bg-white dark:bg-slate-900 text-[6.5px] font-black uppercase rounded border border-slate-100 dark:border-slate-800 text-slate-500">{c}</span>
                                   ))}
                               </div>
                           </div>
                       )}

                       <div className="flex gap-2">
                           <button 
                               onClick={() => { 
                                   setEditDesignModal({...d, index: idx}); 
                                   setTempImgUrl(d.image || ""); 
                                   setShowAddModal("design");
                               }} 
                               className="flex-1 h-10 bg-white dark:bg-slate-800 hover:bg-slate-950 dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl text-[9px] font-bold uppercase transition-all shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2"
                           >
                               <Edit2 size={12} /> এডিট (Edit)
                           </button>
                           <button 
                               onClick={() => handleDeleteDesign(idx)} 
                               className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all border border-transparent hover:border-rose-100"
                           >
                               <Trash2 size={16} />
                           </button>
                       </div>
                    </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderNodesContent = () => (
    <div className="space-y-6">
      {activeTab && activeTab !== "users" ? (
         <div className="space-y-6">
            <button 
               onClick={() => setActiveTab("")} 
               className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:hover:text-white transition-all mb-4 border border-slate-100 dark:border-slate-800 shadow-sm"
            >
                <ArrowLeft size={14} /> Back to Hub
            </button>
            {activeTab === 'colors' && <ListSection category="colors" title="সিস্টেম কালার (Colors)" items={masterData.colors} icon={<Palette />} />}
            {activeTab === 'sizes' && <ListSection category="sizes" title="সিস্টেম সাইজ (Sizes)" items={masterData.sizes} icon={<Package />} />}
            {activeTab === 'pataTypes' && <ListSection category="pataTypes" title="পাতা ট্যাক্সোনমি (Type)" items={masterData.pataTypes} icon={<LayoutGrid />} />}
            {activeTab === 'clients' && (
               <div className="space-y-6">
                  <div className="p-6 bg-blue-600 rounded-2xl text-white flex flex-col md:flex-row items-center gap-6 shadow-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-all">
                        <Users size={120} />
                     </div>
                     <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <ShieldCheck size={30} />
                     </div>
                     <div className="flex-1 text-center md:text-left relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-1">ক্লায়েন্ট পোর্টাল এক্সেস গাইড</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-relaxed italic">নতুন ক্লায়েন্ট যোগ করার সময় চেক-বক্সটি সিলেক্ট করুন। সিস্টেম অটোমেটিক আইডি এবং পাসওয়ার্ড (login123) তৈরি করে ইউজার লিস্টে বসিয়ে দেবে।</p>
                     </div>
                  </div>
                  <ListSection category="clients" title="ক্লায়েন্ট তালিকা (Clients)" items={masterData.clients} icon={<Users />} />
               </div>
            )}
            {activeTab === 'designers' && <ListSection category="designers" title="ব্র্যান্ড এবং ডিজাইনার (Brands)" items={masterData.designers} icon={<Star />} />}
            {activeTab === 'designs' && renderDesignsList()}
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
            { label: "Styles & Designs", cat: "designs", items: masterData.designs, icon: Palette, sub: "Product Hub" },
            { label: t("colors") || "Colors", cat: "colors", items: masterData.colors, icon: LayoutGrid, sub: "Variant Mix" },
            { label: t("sizes") || "Sizes", cat: "sizes", items: masterData.sizes, icon: Package, sub: "Physical Spec" },
            { label: "Pata Taxonomy", cat: "pataTypes", items: masterData.pataTypes, icon: LayoutGrid, sub: "Unit Logic" },
            { label: "ক্লায়েন্ট তালিকা", cat: "clients", items: masterData.clients, icon: Users, sub: "Client Directory" },
            { label: "ব্র্যান্ড / ডিজাইনার", cat: "designers", items: masterData.designers, icon: Star, sub: "Brand Identity" }
            ].map((sec) => (
            <button key={sec.label} onClick={() => setActiveTab(sec.cat)} className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-600 transition-all group text-left shadow-md hover:-translate-y-0.5">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-black dark:text-white rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner"><sec.icon size={20} /></div>
                  <div>
                     <h4 className="text-lg font-bold tracking-tight uppercase leading-none text-black dark:text-white">{sec.label}</h4>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-none">{sec.items?.length || 0} টি সংরক্ষিত • {sec.sub}</p>
                  </div>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                  <ChevronRight size={14} className="text-blue-600" />
               </div>
            </button>
            ))}
         </div>
      )}
    </div>
  );

  const renderPersonnelContent = () => (
    <div className="space-y-8 animate-fade-up">
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex overflow-x-auto no-scrollbar gap-1">
        <TabButton id="staff" label={"মূল কর্মী (Core Staff)"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="cutting" label={"কাটিং (Cutting)"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="sewing" label={"সেলাই (Sewing)"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="stone" label={"স্টোন (Stone)"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="pata" label={"পাতা ইউনিট (Pata Unit)"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="outside" label={"বাইরের কাজ (Outside)"} active={personnelTab} onClick={setPersonnelTab} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <button
          onClick={() => setShowAddModal("worker")}
          className="px-8 py-4 bg-slate-950 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:bg-black transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          কর্মী নিবন্ধন (Add Worker)
        </button>
        <div className="relative w-full md:w-80">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black dark:text-white dark:text-white" size={18} />
           <input 
              type="text" 
              placeholder="কর্মী খুঁজুন (Search)..." 
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              className="premium-input !pl-16 !h-14 !text-[11px]"
           />
        </div>
      </div>

      {[(personnelTab === 'staff' ? 'monthly' : personnelTab === 'outside' ? 'logistics' : personnelTab || 'sewing')].map(dept => (
        <div key={dept} className="saas-card !bg-slate-50/50 dark:!bg-slate-900/50">
          <div className="flex justify-between items-center mb-6">
             <h4 className="text-xl font-bold uppercase tracking-tight text-black dark:text-white dark:text-white">{dept === 'sewing' ? 'সেলাই' : dept === 'stone' ? 'স্টোন' : dept === 'monthly' ? 'মূল কর্মী' : dept === 'logistics' ? 'বাইরের কাজ' : dept === 'cutting' ? 'কাটিং' : 'পাতা'} ইউনিট {t("operatives") || "Operatives"}</h4>
             <span className="text-[10px] font-bold uppercase text-black dark:text-white dark:text-white tracking-widest">{getUnifiedWorkers(dept).length} জন কর্মী</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getUnifiedWorkers(dept)
              .filter(w => !workerSearch || w.name.toUpperCase().includes(workerSearch.toUpperCase()))
              .map((w, idx) => (
              <div key={idx} className="saas-card group relative flex flex-col justify-between overflow-hidden shadow-sm hover:border-slate-950 dark:hover:border-white transition-all min-h-[240px]">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-black dark:text-white dark:text-white group-hover:scale-105 transition-all overflow-hidden shadow-inner shrink-0">
                     {w.photo ? <img src={w.photo} className="w-full h-full object-cover" /> : <User size={20} />}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setWorkerDocModal(w);
                        setTempWorkerPhoto(w.photo || null);
                        setTempNidPhoto(w.nidPhoto || null);
                      }} 
                      className="w-9 h-9 bg-white dark:bg-slate-800 rounded-lg text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                    >
                      <Edit2 size={14} />
                    </button>
                    {!w.isLegacy && <button onClick={() => handleDeleteUnifiedWorker(w.id, w.name, w.dept)} className="w-9 h-9 bg-rose-50 dark:bg-rose-950/20 text-rose-300 hover:text-rose-500 rounded-lg flex items-center justify-center transition-all"><Trash2 size={14} /></button>}
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                   <h4 className="text-lg font-bold tracking-tight text-black dark:text-white dark:text-white uppercase leading-none truncate">{w.name}</h4>
                   <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest italic">{w.phone || "No Connection"}</p>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                   <div>
                      <p className="text-[8px] font-bold text-black dark:text-white dark:text-white uppercase tracking-tight mb-1">বেস রেট (Wage)</p>
                      <p className="text-xl font-bold text-black dark:text-white dark:text-white">৳{w.wage}</p>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setPrintWorkerDoc(w)} 
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white dark:text-white hover:bg-slate-950 hover:text-white transition-all shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center"
                      >
                         <Printer size={16} />
                      </button>
                      <button onClick={() => sendWhatsApp(w.phone, "সিস্টেম আপডেট করা হয়েছে।")} className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                         <MessageCircle size={18} strokeWidth={2.5} />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAuditContent = () => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] shadow-sm animate-fade-up">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-black dark:text-white dark:text-white font-bold text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-5">সময় (Timestamp)</th>
              <th className="px-6 py-5">ইউজার (User)</th>
              <th className="px-6 py-5">অপারেশন (Action)</th>
              <th className="px-6 py-5">বিস্তারিত (Details)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {(masterData.auditLogs || []).slice(0, 50).map((log, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4">
                   <p className="text-[10px] font-bold text-black dark:text-white dark:text-white leading-none mb-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                   <p className="text-[9px] font-bold text-black dark:text-white dark:text-white">{new Date(log.timestamp).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4">
                   <p className="text-xs font-bold uppercase text-black dark:text-white dark:text-white">{log.user}</p>
                   <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest rounded">{log.role}</span>
                </td>
                <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">{log.action}</span>
                </td>
                <td className="px-6 py-4 text-[10px] text-black dark:text-white dark:text-white truncate max-w-xs">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBrandingContent = () => (
    <div className="space-y-6 animate-fade-up">
       {/* Card 1: Logo & Identity */}
       <div className="saas-card flex flex-col md:flex-row items-center gap-10 group hover:border-slate-950 dark:hover:border-white transition-all duration-500">
          <div className="w-40 h-40 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-inner flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700 relative shrink-0">
             {masterData.settings?.logo ? (
                <img src={masterData.settings.logo} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" alt="Company Logo" />
             ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300">
                   <ImageIcon size={40} />
                   <p className="text-[9px] font-bold uppercase tracking-widest text-black dark:text-white dark:text-white">No Custom Logo</p>
                </div>
             )}
             {uploading && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center backdrop-blur-sm">
                   <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
             )}
          </div>
          <div className="flex-1 text-center md:text-left">
             <h4 className="text-2xl font-bold uppercase tracking-tight mb-3 text-black dark:text-white dark:text-white">কোম্পানি <span className="text-blue-600">ব্র্যান্ডিং (Branding)</span></h4>
             <p className="text-black dark:text-white dark:text-white text-xs font-bold leading-relaxed mb-8 italic">
                আপনার ফ্যাক্টরির লোগো আপলোড করুন যা ড্যাশবোর্ড এবং প্রিন্ট স্লিপে প্রদর্শিত হবে।
             </p>
             <div className="flex flex-col md:flex-row items-center gap-5">
                <label className="inline-flex items-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl cursor-pointer">
                   <Upload size={16} />
                   {uploading ? "Updating..." : "আপলোড লোগো"}
                   <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files[0])} className="hidden" />
                </label>
                {masterData.settings?.logo && (
                   <button 
                      onClick={() => setMasterData(prev => ({...prev, settings: {...prev.settings, logo: ""}}))}
                      className="text-[9px] font-bold uppercase text-rose-500 tracking-widest hover:underline"
                   >
                      রিসেট করুন (Reset)
                   </button>
                )}
             </div>
          </div>
       </div>

       {/* Card 1.5: Factory Details */}
       <div className="saas-card bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center gap-10 group transition-all shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-40 h-40 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-inner flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700 relative shrink-0">
             <div className="p-6 bg-slate-950 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Database size={32} />
             </div>
          </div>
          <div className="flex-1 w-full flex flex-col md:flex-row gap-6 items-start md:items-center">
             <div className="flex-1 space-y-4 w-full">
                <div className="text-center md:text-left mb-2">
                   <h4 className="text-2xl font-bold uppercase tracking-tight text-black dark:text-white dark:text-white">কোম্পানি <span className="text-blue-600">তথ্য (Info)</span></h4>
                   <p className="text-slate-500 text-[10px] font-bold leading-relaxed italic mt-1">
                      রিপোর্ট ও প্রিন্ট স্লিপের জন্য ফ্যাক্টরির নাম ও ঠিকানা সেট করুন।
                   </p>
                </div>
                <div className="grid grid-cols-1 gap-3 w-full">
                   <input id="factory-name" className="premium-input !h-12 !text-[11px]" placeholder="Factory Name (e.g. NRZOONE FACTORY)" defaultValue={masterData.settings?.factoryName || "NRZOONE FACTORY"} />
                   <input id="factory-slogan" className="premium-input !h-12 !text-[11px]" placeholder="Slogan (Optional)" defaultValue={masterData.settings?.slogan || ""} />
                   <input id="factory-address" className="premium-input !h-12 !text-[11px]" placeholder="Address" defaultValue={masterData.settings?.factoryAddress || ""} />
                </div>
             </div>
             <button
                onClick={() => {
                   const fName = document.getElementById('factory-name').value.trim();
                   const fSlogan = document.getElementById('factory-slogan').value.trim();
                   const fAddress = document.getElementById('factory-address').value.trim();
                   setMasterData(prev => ({
                      ...prev,
                      settings: { ...(prev.settings || {}), factoryName: fName || "NRZOONE FACTORY", slogan: fSlogan, factoryAddress: fAddress }
                   }));
                   window.dispatchEvent(new CustomEvent('notify', { detail: "কোম্পানির তথ্য সফলভাবে সেভ হয়েছে!" }));
                }}
                className="w-full md:w-auto px-8 py-10 bg-slate-950 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
             >
                আপডেট করুন
             </button>
          </div>
       </div>

       {/* Card 2: WhatsApp Connectivity */}
       <div className="saas-card bg-emerald-500/5 border-emerald-500/20 flex flex-col md:flex-row items-center gap-10 group transition-all hover:border-emerald-500 shadow-sm">
          <div className="w-40 h-40 bg-white dark:bg-slate-800 rounded-xl shadow-inner flex items-center justify-center overflow-hidden border border-emerald-100 dark:border-emerald-900/40 relative shrink-0">
             <div className="p-6 bg-emerald-500 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <MessageCircle size={32} />
             </div>
          </div>
          <div className="flex-1 text-center md:text-left">
             <h4 className="text-2xl font-bold uppercase tracking-tight mb-3 text-emerald-900 dark:text-emerald-400">হোয়াটসঅ্যাপ <span className="opacity-40">কানেক্টিভিটি</span></h4>
             <p className="text-emerald-700/60 dark:text-emerald-400/60 text-xs font-bold leading-relaxed mb-8 italic">
                অটোমেটেড রিপোর্ট এবং সিস্টেম নোটিফিকেশন পাওয়ার জন্য ফ্যাক্টরির অফিশিয়াল নম্বরটি সেট করুন।
             </p>
             <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 md:max-w-sm">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <Phone size={16} />
                   </div>
                   <input 
                      id="system-whatsapp"
                      className="premium-input !pl-14 !h-14 !bg-white dark:!bg-slate-900 border-emerald-100 dark:border-emerald-900/50 !text-emerald-900 dark:!text-emerald-100 font-bold"
                      placeholder="01XXXXXXXXX"
                      defaultValue={masterData.settings?.whatsappNumber || ""}
                   />
                </div>
                <button 
                   onClick={() => {
                      const num = document.getElementById('system-whatsapp').value.trim();
                      if (num) {
                         setMasterData(prev => ({
                            ...prev, 
                            settings: { ...(prev.settings || {}), whatsappNumber: num }
                         }));
                         showNotify("WhatsApp Connection Updated!", "success");
                      }
                   }}
                   className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-700 active:scale-95 transition-all"
                >
                   সেভ করুন (Secure Link)
                </button>
             </div>
          </div>
       </div>
    </div>
  );

  const renderDatabaseContent = () => (
    <div className="space-y-6 animate-fade-up">
      <div className="bg-slate-950 text-white rounded-xl p-10 text-center relative overflow-hidden group shadow-2xl">
         <div className="relative z-10">
            <h4 className="text-3xl font-bold uppercase tracking-tight mb-3">মাস্টার <span className="text-black dark:text-white dark:text-white">আর্কাইভ (Archives)</span></h4>
            <p className="text-black dark:text-white dark:text-white text-[10px] font-bold uppercase tracking-widest max-w-md mx-auto mb-10 italic">তথ্য সুরক্ষিত রাখুন এবং প্রয়োজনে রিস্টোর করুন।</p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
               <button onClick={handleBackup} className="bg-white text-black dark:text-white px-8 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3">
                  <Download size={16} /> ডাউনলোড ব্যাকআপ (Download)
               </button>
               <label className="bg-slate-800 text-white px-8 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center gap-3 border border-slate-700">
                  <Upload size={16} /> রিস্টোর আর্কাইভ (Restore)
                  <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
               </label>
            </div>
         </div>
      </div>

      <div className="saas-card bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-500/20 p-8 rounded-2xl">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
               <h4 className="text-xl font-black uppercase text-rose-500 italic mb-1 flex items-center gap-2">
                 <ShieldAlert size={20} /> Danger Zone: Factory Reset
               </h4>
               <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed max-w-md italic">
                 সব এন্ট্রি করা তথ্য (Lots, Payments, Deliveries) এক ক্লিকে মুছে ফেলুন। এই কাজ রিস্টোর করা সম্ভব নয়।
               </p>
            </div>
            <div className="flex gap-4">
               <button 
                  onClick={() => handleMasterReset(false)} 
                  className="px-6 py-4 bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-rose-600 transition-all active:scale-95 border-b-4 border-rose-700"
               >
                  Clear All Entries
               </button>
               <button 
                  onClick={() => handleMasterReset(true)} 
                  className="px-6 py-4 bg-slate-950 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 border-b-4 border-slate-800"
               >
                  Total Wipe (Zero Start)
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {['productions', 'cuttingStock', 'pataEntries', 'deliveries', 'attendance'].map(key => (
            <div key={key} className="saas-card flex justify-between items-center group hover:border-rose-500 transition-all">
               <div>
                  <p className="text-[9px] font-bold text-black dark:text-white dark:text-white uppercase tracking-widest mb-1">{key.toUpperCase()}</p>
                  <p className="text-2xl font-bold tracking-tighter text-black dark:text-white dark:text-white">{masterData[key]?.length || 0}</p>
               </div>
               <button onClick={() => { if(confirm(`সব ${key} মুছে ফেলতে চান?`)) setMasterData(prev => ({...prev, [key]: []})); }} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm opacity-20 group-hover:opacity-100">
                  <Trash2 size={16} />
               </button>
            </div>
         ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-fade-up px-2">
      {/* Header HUD */}
      <div className="bg-white dark:bg-slate-900 px-8 py-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-8 mt-2">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActivePanel("Overview")}
            className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-black dark:text-white dark:text-white hover:bg-slate-950 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-left">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black dark:text-white dark:text-white leading-none">
              সিস্টেম <span className="text-blue-600">কন্ট্রোল হাব (Control)</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">
              System Control Node v2.5 • {currentUser.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${syncStatus === 'syncing' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            {syncStatus === 'syncing' ? 'সিস্টেম সিঙ্কিং হচ্ছে...' : 'প্রাইমারি ক্লাউড অনলাইন'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Sidebar */}
        <div className="md:col-span-1 space-y-3">
          {[
            { id: 'nodes', label: 'সিস্টেম এক্সেস (Users)', icon: ShieldCheck, desc: 'Auth Security' },
            { id: 'personnel', label: 'কর্মী ব্যবস্থাপনা', icon: Users, desc: 'Workforce Core' },
            { id: 'nodes_config', label: 'সিস্টেম নোডস (Config)', icon: Server, desc: 'Node Architecture' },
            { id: 'branding', label: 'ব্র্যান্ডিং (Identity)', icon: Palette, desc: 'Visual Branding' },
            { id: 'audit', label: 'অডিট লগ (Logs)', icon: Clock, desc: 'Security Audit' },
            { id: 'database', label: 'ডাটাসোর্স (Cloud)', icon: Database, desc: 'Persistence' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
                activeMainTab === tab.id 
                ? 'bg-slate-950 text-white shadow-xl' 
                : 'hover:bg-white dark:hover:bg-slate-800 text-black dark:text-white dark:text-white hover:text-black dark:text-white dark:hover:text-white border border-transparent border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeMainTab === tab.id ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-900 group-hover:scale-110 shadow-inner'}`}>
                    <tab.icon size={18} />
                 </div>
                 <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-tight leading-none">{tab.label}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-40">{tab.desc}</p>
                 </div>
              </div>
              <ChevronRight size={14} className={activeMainTab === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-x-1'} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 min-h-[70vh]">
          {activeMainTab === 'nodes' && renderUsersContent()}
          {activeMainTab === 'personnel' && renderPersonnelContent()}
          {activeMainTab === 'nodes_config' && renderNodesContent()}
          {activeMainTab === 'branding' && renderBrandingContent()}
          {activeMainTab === 'audit' && renderAuditContent()}
          {activeMainTab === 'database' && renderDatabaseContent()}
        </div>
      </div>

      {/* Generic Item Add Modal */}
      {(showAddModal && !['user', 'worker', 'design'].includes(showAddModal)) && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 px-6 py-8 md:p-10 w-full max-w-md rounded-3xl shadow-2xl animate-fade-up border-b-8 border-blue-600">
               <h3 className="text-3xl font-black uppercase mb-2 tracking-tighter italic">নতুন <span className="text-blue-600 underline">আইটেম</span></h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">{showAddModal.toUpperCase()} CONFIGURATION NODE</p>
               <div className="space-y-6">
                  <input 
                    id="generic-item-input" 
                    className="premium-input !h-20 !text-3xl !font-black !uppercase !tracking-tighter !text-center !bg-slate-50 dark:!bg-slate-900 !border-slate-200 dark:!border-slate-700" 
                    placeholder="লিখুন..." 
                    autoFocus 
                    onKeyDown={(e) => { 
                        if(e.key === 'Enter') {
                            const val = e.target.value;
                            const createPortal = document.getElementById("client-portal-access")?.checked;
                            if(val) {
                                handleAddListItem(showAddModal, val, createPortal);
                            }
                        }
                    }} 
                  />
                  {showAddModal === 'clients' && (
                     <div className="p-6 bg-blue-600/10 border-2 border-blue-600/20 rounded-2xl flex items-center gap-5 group hover:bg-blue-600/20 transition-all cursor-pointer" onClick={() => {
                        const cb = document.getElementById("client-portal-access");
                        if(cb) cb.checked = !cb.checked;
                     }}>
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                           <ShieldCheck size={20} />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-3">
                              <input type="checkbox" id="client-portal-access" className="w-5 h-5 accent-blue-600 cursor-pointer" defaultChecked />
                              <label className="text-[11px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest cursor-pointer">ক্লায়েন্ট পোর্টাল আইডি তৈরি করুন</label>
                           </div>
                           <p className="text-[9px] font-bold text-blue-600/60 uppercase tracking-widest mt-1 ml-8 italic">পাসওয়ার্ড অটো সেট হবে: login123</p>
                        </div>
                     </div>
                  )}
                  <div className="flex gap-4 pt-6">
                     <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800">Cancel</button>
                     <button 
                        onClick={() => {
                            const val = document.getElementById("generic-item-input").value;
                            const createPortal = document.getElementById("client-portal-access")?.checked;
                            if(val) {
                                handleAddListItem(showAddModal, val, createPortal);
                            }
                        }} 
                        className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all border-b-4 border-blue-800"
                     >Confirm Save</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {showAddModal === "worker" && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 px-6 py-8 md:p-10 w-full max-w-lg rounded-3xl shadow-2xl animate-fade-up">
            <h3 className="text-xl font-bold uppercase mb-1">নতুন কর্মী <span className="text-blue-600">নিবন্ধন</span></h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-8">ওয়ার্কফোর্স ম্যানেজমেন্ট হাব</p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">বিভাগ (Department)</label>
                    <select id="new-worker-dept" className="premium-input !h-12" value={newWorkerDept} onChange={(e) => setNewWorkerDept(e.target.value)}>
                      <option value="monthly">মূল কর্মী (Core Staff)</option>
                      <option value="cutting">কাটিং (Cutting)</option>
                      <option value="sewing">সেলাই (Sewing)</option>
                      <option value="stone">স্টোন (Stone)</option>
                      <option value="pata">পাতা ইউনিট (Pata Unit)</option>
                      <option value="logistics">বাইরের কাজ (Outside)</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">পূর্ণ নাম *</label>
                    <input id="new-worker-name" className="premium-input !h-12" placeholder="কর্মীর নাম" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">মোবাইল নম্বর *</label>
                    <input id="new-worker-phone" className="premium-input !h-12" placeholder="01XXXXXXXXX" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">পাসওয়ার্ড (Login Access)</label>
                    <input id="new-worker-pass" type="password" className="premium-input !h-12" placeholder="নির্ধারণ করুন" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">নির্ধারিত রেট (Wage/Salary)</label>
                    <input id="new-worker-wage" type="number" className="premium-input !h-12" placeholder="৳ 0.00" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">NID / পরিচয়পত্র নম্বর</label>
                    <input id="new-worker-nid" className="premium-input !h-12" placeholder="NID No." />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">স্থায়ী ঠিকানা</label>
                    <input id="new-worker-address" className="premium-input !h-12" placeholder="গ্রাম, উপজেলা, জেলা" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">যোগদানের তারিখ</label>
                    <input id="new-worker-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input !h-12" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">জরুরি যোগাযোগ</label>
                    <input id="new-worker-emergency" className="premium-input !h-12" placeholder="নাম — 01XXXXXXXXX" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase ml-2">অতিরিক্ত নোট</label>
                    <input id="new-worker-notes" className="premium-input !h-12" placeholder="বিশেষ তথ্য..." />
                 </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest text-black dark:text-white hover:bg-slate-50 transition-all border border-slate-100 dark:border-slate-800">বাতিল</button>
                <button 
                   onClick={() => handleAddWorker(newWorkerDept, document.getElementById("new-worker-name").value, document.getElementById("new-worker-wage")?.value || 0, document.getElementById("new-worker-phone")?.value || "", document.getElementById("new-worker-pass")?.value || "", document.getElementById("new-worker-nid")?.value || "", document.getElementById("new-worker-address")?.value || "", document.getElementById("new-worker-date")?.value || "", document.getElementById("new-worker-emergency")?.value || "", document.getElementById("new-worker-notes")?.value || "")} 
                  className="flex-[2] py-4 rounded-xl bg-slate-950 text-white font-bold uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all"
                >সংরক্ষণ করুন</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddModal === "design" || editDesignModal) && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 px-6 py-8 md:p-10 w-full max-w-2xl rounded-3xl shadow-2xl animate-fade-up my-auto border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-bold uppercase mb-1 tracking-tighter">{editDesignModal ? 'স্টাইল আপডেট' : 'নতুন ডিজাইন'} <span className="text-blue-600">নিবন্ধন</span></h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-8">ডিজাইন ও ডেভেলপমেন্ট হাব</p>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 flex flex-col items-center gap-6">
                 <label className="w-full aspect-square bg-slate-50 dark:bg-slate-800 rounded-3xl border-4 border-dashed border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all overflow-hidden group shadow-inner">
                    {tempImgUrl ? (
                      <img src={tempImgUrl} className="w-full h-full object-contain p-4" alt="Studio Preview" />
                    ) : (
                      <div className="text-center p-6 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Upload size={28} className="text-blue-600" />
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest leading-tight">Click to Upload Store Preview</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => { if (e.target.files[0]) { const url = await handleImageUpload(e.target.files[0]); if (url) setTempImgUrl(url); } }} />
                 </label>
                 {tempImgUrl && <button onClick={() => setTempImgUrl(null)} className="text-[10px] font-bold uppercase text-rose-500 tracking-widest hover:underline">Remove Photo</button>}
              </div>
              <div className="flex-1 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Product Identity</label>
                    <input id="design-name" className="premium-input !h-14 !text-xl !font-bold" placeholder="DESIGN NAME (EG: ABAYA-X)" defaultValue={editDesignModal?.name || ""} />
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 dark:border-slate-700 pb-3">বেস রেট কনফিগারেশন (Base Rates)</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 mb-1">
                              <Scissors size={14} className="text-blue-500" />
                              <label className="text-[11px] font-bold text-black dark:text-white uppercase tracking-tight">সেলাই (Sewing)</label>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="flex-1">
                                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">কারিগর (Worker)</p>
                                 <input id="design-sewing" type="number" className="w-full premium-input !h-10 !text-sm !font-bold !bg-white dark:!bg-slate-900" defaultValue={editDesignModal?.sewingRate || 0} />
                              </div>
                              <div className="flex-1">
                                 <p className="text-[7px] font-bold text-blue-600 uppercase mb-1">ক্লায়েন্ট (Client)</p>
                                 <input id="design-client-sewing-default" type="number" className="w-full premium-input !h-10 !text-sm !font-bold !bg-blue-50/50 !border-blue-200 !text-blue-600" defaultValue={editDesignModal?.defaultClientRates?.sewing || 0} />
                              </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 mb-1">
                              <Star size={14} className="text-amber-500" />
                              <label className="text-[11px] font-bold text-black dark:text-white uppercase tracking-tight">স্টোন (Stone)</label>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="flex-1">
                                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">কারিগর (Worker)</p>
                                 <input id="design-stone" type="number" className="w-full premium-input !h-10 !text-sm !font-bold !bg-white dark:!bg-slate-900" defaultValue={editDesignModal?.stoneRate || 0} />
                              </div>
                              <div className="flex-1">
                                 <p className="text-[7px] font-bold text-blue-600 uppercase mb-1">ক্লায়েন্ট (Client)</p>
                                 <input id="design-client-stone-default" type="number" className="w-full premium-input !h-10 !text-sm !font-bold !bg-blue-50/50 !border-blue-200 !text-blue-600" defaultValue={editDesignModal?.defaultClientRates?.stone || 0} />
                              </div>
                           </div>
                        </div>
                        <div className="col-span-2 space-y-3">
                           <div className="flex items-center gap-2 mb-1">
                              <LayoutGrid size={14} className="text-emerald-500" />
                              <label className="text-[11px] font-bold text-black dark:text-white uppercase tracking-tight">পাতা রেট (Pata Rates)</label>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-white dark:border-slate-800 shadow-sm">
                                 <p className="text-[7.5px] font-black text-slate-400 uppercase mb-2 leading-none italic">Worker Wages</p>
                                 <div className="flex gap-2">
                                    <div className="flex-1">
                                       <p className="text-[6px] font-bold text-slate-400 uppercase mb-0.5">Single</p>
                                       <input id="design-pata-single" type="number" className="premium-input !h-9 !text-xs !font-bold" defaultValue={editDesignModal?.pataRateSingle || 3} />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-[6px] font-bold text-slate-400 uppercase mb-0.5">Double</p>
                                       <input id="design-pata-double" type="number" className="premium-input !h-9 !text-xs !font-bold" defaultValue={editDesignModal?.pataRateDouble || 6} />
                                    </div>
                                 </div>
                              </div>
                              <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
                                 <p className="text-[7.5px] font-black text-blue-500 uppercase mb-2 leading-none italic">Client Rates</p>
                                 <div className="flex gap-2">
                                    <div className="flex-1">
                                       <p className="text-[6px] font-bold text-blue-400 uppercase mb-0.5">Single</p>
                                       <input id="design-client-pata-single" type="number" className="premium-input !h-9 !text-xs !font-bold !bg-white dark:!bg-slate-950 !border-blue-200 !text-blue-600" defaultValue={editDesignModal?.defaultClientRates?.pataSingle || 3} />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-[6px] font-bold text-blue-400 uppercase mb-0.5">Double</p>
                                       <input id="design-client-pata-double" type="number" className="premium-input !h-9 !text-xs !font-bold !bg-white dark:!bg-slate-950 !border-blue-200 !text-blue-600" defaultValue={editDesignModal?.defaultClientRates?.pataDouble || 6} />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 mb-1">
                              <Package size={14} className="text-indigo-500" />
                              <label className="text-[11px] font-bold text-black dark:text-white uppercase tracking-tight">বাইরের (Outwork)</label>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="flex-1">
                                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">কারিগর (Worker)</p>
                                 <input id="design-outside" type="number" className="w-full premium-input !h-10 !text-sm !font-bold !bg-white dark:!bg-slate-900" defaultValue={editDesignModal?.outsideRate || 0} />
                              </div>
                              <div className="flex-1">
                                 <p className="text-[7px] font-bold text-blue-600 uppercase mb-1">ক্লায়েন্ট (Client)</p>
                                 <input id="design-client-outside-default" type="number" className="w-full premium-input !h-10 !text-sm !font-bold !bg-blue-50/50 !border-blue-200 !text-blue-600" defaultValue={editDesignModal?.defaultClientRates?.outwork || 0} />
                               </div>
                            </div>
                         </div>
                      </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                      <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-2 mb-2">
                         <DollarSign size={14} /> খুচরা বিক্রয় মূল্য (Retail Selling Price)
                      </label>
                      <input id="design-sell" type="number" className="premium-input !h-14 border-emerald-200 dark:border-emerald-900/50 !text-emerald-600 !text-2xl !font-black !bg-emerald-50/30" defaultValue={editDesignModal?.sellingPrice || 0} />
                    </div>
                  </div>
                  {masterData.clients?.length > 0 && (
                    <div className="space-y-6 pt-10 border-t-2 border-slate-100 dark:border-slate-800 animate-fade-up">
                      <div className="flex justify-between items-center bg-blue-600 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-all">
                           <Users size={80} />
                        </div>
                        <label className="text-[12px] font-black text-white uppercase tracking-widest italic flex items-center gap-3 relative z-10">
                           <Users size={18} /> বি টু বি ক্লায়েন্ট রেট (B2B Rates Management)
                        </label>
                        <div className="flex gap-6 text-[9px] font-black uppercase text-white/70 mr-2 font-mono italic relative z-10">
                           <span className="w-14 text-center">Sewing</span>
                           <span className="w-14 text-center">Stone</span>
                           <span className="w-14 text-center">Pata</span>
                           <span className="w-14 text-center">Outside</span>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 no-scrollbar">
                          {(masterData.clients || []).map(client => {
                            const cid = client.replace(/[^a-zA-Z0-9]/g,'-');
                            const cRate = editDesignModal?.clientRates?.[client] || {};
                            const isLegacy = typeof cRate === 'number';
                            return (
                             <div key={client} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-blue-600 transition-all group shadow-sm">
                                <div className="w-32 shrink-0">
                                   <p className="text-[11px] font-black uppercase truncate text-black dark:text-white italic" title={client}>{client}</p>
                                   <p className="text-[7px] font-bold text-blue-500 uppercase tracking-widest mt-0.5 leading-none">Custom B2B Override</p>
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-3">
                                   <div className="relative">
                                      <input id={`design-client-${cid}-sewing`} type="number" className="w-full premium-input !h-10 !text-[12px] !text-center !bg-white dark:!bg-slate-900 !border-slate-300 !font-black !text-blue-600" defaultValue={isLegacy ? cRate : (cRate.sewing || 0)} />
                                      <p className="absolute -bottom-1 right-1 text-[6px] font-bold text-slate-300">SEW</p>
                                   </div>
                                   <div className="relative">
                                      <input id={`design-client-${cid}-stone`} type="number" className="w-full premium-input !h-10 !text-[12px] !text-center !bg-white dark:!bg-slate-900 !border-slate-300 !font-black !text-blue-600" defaultValue={isLegacy ? 0 : (cRate.stone || 0)} />
                                      <p className="absolute -bottom-1 right-1 text-[6px] font-bold text-slate-300">STO</p>
                                   </div>
                                   <div className="relative">
                                      <input id={`design-client-${cid}-pata`} type="number" className="w-full premium-input !h-10 !text-[12px] !text-center !bg-white dark:!bg-slate-900 !border-slate-300 !font-black !text-blue-600" defaultValue={isLegacy ? 0 : (cRate.pata || 0)} />
                                      <p className="absolute -bottom-1 right-1 text-[6px] font-bold text-slate-300">PAT</p>
                                   </div>
                                   <div className="relative">
                                      <input id={`design-client-${cid}-outwork`} type="number" className="w-full premium-input !h-10 !text-[12px] !text-center !bg-white dark:!bg-slate-900 !border-slate-300 !font-black !text-blue-600" defaultValue={isLegacy ? 0 : (cRate.outwork || 0)} />
                                      <p className="absolute -bottom-1 right-1 text-[6px] font-bold text-slate-300">OUT</p>
                                   </div>
                                </div>
                             </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
              </div>
            </div>
            <div className="flex gap-4 pt-12">
              <button 
                onClick={() => { setShowAddModal(false); setEditDesignModal(null); setTempImgUrl(null); }} 
                className="flex-1 h-16 rounded-2xl font-bold uppercase text-[10px] tracking-widest text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
              >Cancel</button>
              <button 
                onClick={() => {
                  const clientRatesObj = {};
                  (masterData.clients || []).forEach(client => {
                     const cid = client.replace(/[^a-zA-Z0-9]/g,'-');
                     const sew = Number(document.getElementById(`design-client-${cid}-sewing`)?.value || 0);
                     const sto = Number(document.getElementById(`design-client-${cid}-stone`)?.value || 0);
                     const pat = Number(document.getElementById(`design-client-${cid}-pata`)?.value || 0);
                     const out = Number(document.getElementById(`design-client-${cid}-outwork`)?.value || 0);
                     
                     if (sew || sto || pat || out) {
                        clientRatesObj[client] = { sewing: sew, stone: sto, pata: pat, outwork: out };
                     }
                  });

                  const defaultClientRates = {
                    sewing: Number(document.getElementById("design-client-sewing-default")?.value || 0),
                    stone: Number(document.getElementById("design-client-stone-default")?.value || 0),
                    pataSingle: Number(document.getElementById("design-client-pata-single")?.value || 3),
                    pataDouble: Number(document.getElementById("design-client-pata-double")?.value || 6),
                    outwork: Number(document.getElementById("design-client-outside-default")?.value || 0),
                  };

                  const data = {
                    name: document.getElementById("design-name").value.trim().toUpperCase(),
                    sewingRate: Number(document.getElementById("design-sewing").value),
                    stoneRate: Number(document.getElementById("design-stone").value),
                    pataRateSingle: Number(document.getElementById("design-pata-single").value),
                    pataRateDouble: Number(document.getElementById("design-pata-double").value),
                    outsideRate: Number(document.getElementById("design-outside").value),
                    sellingPrice: Number(document.getElementById("design-sell").value),
                    clientRates: clientRatesObj,
                    defaultClientRates,
                    image: tempImgUrl
                  };
                  
                  if (!data.name) return alert("স্টাইল নাম আবশ্যক!");
                  
                  if(editDesignModal) handleUpdateDesignFull(editDesignModal.index, data);
                  else handleAddDesign(data);
                  setShowAddModal(false);
                  setEditDesignModal(null);
                  setTempImgUrl(null);
                }} 
                className="flex-[2] h-16 rounded-2xl bg-slate-950 text-white font-bold uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 border-b-4 border-slate-800"
              >{editDesignModal ? 'Sync All Rates' : 'Initialize Style'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Footer / Back Button */}
      <div className="pt-20 pb-10 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group flex items-center gap-6 bg-white dark:bg-slate-900 px-10 py-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-950 dark:hover:border-white transition-all transform hover:-translate-y-1"
        >
          <div className="w-10 h-10 bg-slate-950 text-white rounded-lg flex items-center justify-center group-hover:rotate-[-12deg] transition-transform">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">
            Back to Dashboard
          </span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel_V2;


