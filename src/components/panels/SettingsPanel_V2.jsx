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
} from "lucide-react";
import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateWorkerPaySlip } from "../../services/pdfService";
import NRZLogo from "../NRZLogo";

const SettingsPanel = ({
  masterData,
  setMasterData,
  user: currentUser,
  showNotify,
  setActivePanel,
  t,
}) => {
  const [activeTab, setActiveTab] = useState("users");
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkerDept, setNewWorkerDept] = useState("sewing");
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

  const handleAddListItem = (category, value) => {
    if (!value.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), value.toUpperCase()],
    }));
    setShowAddModal(false);
  };

  const handleDeleteListItem = (category, index) => {
    if (!confirm("Delete this item?")) return;
    setMasterData((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleUpdateListItem = (category, index, newValue) => {
    if (!newValue.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index ? newValue.toUpperCase() : item,
      ),
    }));
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
        ...prev.workerCategories,
        [dept]: (prev.workerCategories[dept] || []).filter(
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
    if (id === "NRZO0NE") return alert("Cannot delete Super Admin");
    if (!confirm(`Delete user ${id}?`)) return;
    setMasterData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  };

  const handleAddWorker = (dept, name, wage) => {
    if (!name.trim()) return showNotify("কর্মী নাম আবশ্যক!", "error");
    handleSaveUnifiedWorker({
      id: Date.now().toString(),
      name: name.toUpperCase(),
      dept,
      wage: Number(wage) || 0,
      phone: "",
      joiningDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleAddDesign = (
    name,
    sewingRate,
    stoneRate,
    pataRate,
    hijabRate,
    materialCost,
    sellingPrice,
  ) => {
    if (!name.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      designs: [
        ...prev.designs,
        {
          name,
          sewingRate: Number(sewingRate) || 0,
          stoneRate: Number(stoneRate) || 0,
          pataRate: Number(pataRate) || 0,
          hijabRate: Number(hijabRate) || 0,
          materialCost: Number(materialCost) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          image: tempImgUrl || "",
        },
      ],
    }));
    setTempImgUrl(null);
    setShowAddModal(false);
  };

  const handleUpdateDesignFull = (index, updatedDesign) => {
    setMasterData((prev) => ({
      ...prev,
      designs: prev.designs.map((d, i) =>
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
      designs: prev.designs.filter((_, i) => i !== index),
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
      className={`px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all italic ${
        active === id ? "bg-black text-white shadow-xl rotate-3" : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  const ListSection = ({ category, title, items, icon }) => (
    <div className="space-y-10 animate-fade-up text-black">
      <div className="bg-white p-12 rounded-[4rem] border-4 border-slate-50 shadow-2xl flex justify-between items-center italic relative overflow-hidden group">
        <div className="flex items-center gap-4 md:gap-8 relative z-10">
          <div className="p-4 md:p-6 bg-black text-white rounded-2xl md:rounded-3xl group-hover:rotate-6 transition-transform">
            {icon ? (
              React.cloneElement(icon, {
                size: 24,
                className: "md:w-[32px] md:h-[32px]",
              })
            ) : (
              <Database size={32} />
            )}
          </div>
          <div>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none italic">
              {title}
            </h3>
            <p className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] md:tracking-[0.5em] mt-3 md:mt-4 italic">
              {items?.length || 0} NODES CONFIGURED
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(category)}
          className="w-14 h-14 md:w-20 md:h-20 bg-black text-white rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center hover:scale-110 transition-all shadow-2xl border-b-[8px] md:border-b-[12px] border-zinc-900 relative z-10"
        >
          <Plus size={36} strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {items?.map((item, idx) => {
          const isEditing = editingItem === `${category}-${idx}`;
          return (
            <div
              key={idx}
              className="bg-white p-10 rounded-[4rem] border-4 border-slate-50 flex flex-col justify-between group hover:border-black transition-all italic shadow-2xl relative overflow-hidden h-64"
            >
              {isEditing ? (
                <div className="space-y-6 relative z-10 h-full flex flex-col">
                  <input
                    autoFocus
                    id={`edit-${category}-${idx}`}
                    className="form-input bg-slate-50 border-slate-100 text-sm font-black text-center py-4 italic appearance-none"
                    defaultValue={item}
                  />
                  <button
                    onClick={() =>
                      handleUpdateListItem(
                        category,
                        idx,
                        document.getElementById(`edit-${category}-${idx}`)
                          .value,
                      )
                    }
                    className="w-full bg-black text-white py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl mt-auto"
                  >
                    {t("save") || "SAVE"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-black text-2xl uppercase tracking-tighter leading-none mb-8 relative z-10 italic">
                    {item}
                  </p>
                  <div className="flex gap-4 opacity-10 group-hover:opacity-100 transition-all relative z-10">
                    <button
                      onClick={() => setEditingItem(`${category}-${idx}`)}
                      className="flex-1 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-black transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteListItem(category, idx)}
                      className="flex-1 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
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
    const legacyNames = masterData.workerCategories?.[dept] || [];
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
    <div className="space-y-8">
       <div className="flex justify-between items-center px-6">
          <h4 className="text-2xl font-black uppercase italic tracking-tighter">System <span className="text-slate-500">Access Nodes</span></h4>
          <button 
             onClick={() => {
                const name = prompt("Enter User Name:");
                const id = prompt("Enter User ID / Phone:");
                const pass = prompt("Enter Password:");
                if (name && id && pass) {
                   setMasterData(prev => ({
                      ...prev,
                      users: [...(prev.users || []), { name, id, password: pass, role: 'manager' }]
                   }));
                   showNotify("New Manager Node Registered!");
                }
             }}
             className="px-6 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-110 transition-all shadow-xl"
          >
             <Plus size={16} /> Add Access Node
          </button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {masterData.users?.map((u, idx) => (
             <div key={idx} className="bg-white dark:bg-black/40 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-zinc-800 italic relative group shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                   <ShieldCheck size={140} className="text-black dark:text-white" />
                </div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                      {u.role}
                   </span>
                   <div className="flex gap-2">
                       <button 
                          onClick={() => {
                             const newPass = prompt(`RESET PASSWORD FOR ${u.name.toUpperCase()}?`, u.password);
                             if (newPass) {
                                setMasterData(prev => ({
                                   ...prev,
                                   users: (prev.users || []).map(usr => usr.id === u.id ? { ...usr, password: newPass } : usr)
                                }));
                                showNotify("Access Password Updated!");
                             }
                          }}
                          className="w-10 h-10 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                          title="Reset Password"
                       >
                          <Key size={16} />
                       </button>
                       {u.id === currentUser.id && (
                          <button 
                             onClick={registerAdminBiometric} 
                             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${u.biometricId ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white font-bold animate-pulse'}`}
                             title={u.biometricId ? "Biometric Registered" : "Register Finger/Face ID"}
                          >
                             <Fingerprint size={18} />
                          </button>
                       )}
                       {u.id !== "NRZO0NE" && <button onClick={() => handleDeleteUser(u.id)} className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-300 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all"><Trash2 size={16} /></button>}
                   </div>
                </div>

                <div className="relative z-10">
                   <h4 className="text-3xl font-black uppercase tracking-tighter italic leading-none group-hover:translate-x-1 transition-transform">{u.name}</h4>
                   <div className="flex items-center gap-3 mt-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{u.id}</p>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Link</p>
                   </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-50 dark:border-zinc-800 flex justify-between items-center relative z-10">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">Auth Secret</p>
                      <p className="font-mono text-xs text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors">••••••••</p>
                   </div>
                   <div className="flex gap-2">
                       <button 
                          onClick={() => alert(`AUTH IDENTITY: ${u.id}\nSECRET PIN: ${u.password}`)}
                          className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:text-black dark:hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                       >
                          Verify Access
                       </button>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderProductContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: t("colors") || "Colors", cat: "colors", items: masterData.colors, icon: LayoutGrid },
          { label: t("sizes") || "Sizes", cat: "sizes", items: masterData.sizes, icon: Package },
          { label: t("masters") || "Masters", cat: "cutters", items: masterData.cutters, icon: Scissors },
          { label: t("pataTaxonomy") || "Pata Taxonomy", cat: "pataTypes", items: masterData.pataTypes, icon: LayoutGrid }
        ].map((sec) => (
          <button key={sec.label} onClick={() => setActiveTab(sec.cat)} className="flex items-center justify-between p-8 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all group text-left">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl group-hover:rotate-6 transition-transform"><sec.icon size={20} /></div>
              <div>
                 <h4 className="text-lg font-black uppercase italic leading-none">{sec.label}</h4>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{sec.items?.length || 0} {t("nodes") || "NODES"}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  );

  const AccordionItem = ({ id, label, icon: Icon, description, children }) => {
    const isOpen = activeTab === id || (id === 'product' && ['colors', 'sizes', 'cutters', 'pataTypes'].includes(activeTab));
    return (
      <div className={`mb-4 overflow-hidden rounded-[40px] border border-slate-100 dark:border-zinc-900 transition-all duration-500 ${isOpen ? 'bg-white dark:bg-zinc-900 shadow-2xl' : 'bg-slate-50/50 dark:bg-black/20'}`}>
        <button 
          onClick={() => setActiveTab(isOpen ? null : id)}
          className="w-full flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors group"
        >
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-2xl transition-all duration-500 ${isOpen ? 'bg-black text-white dark:bg-white dark:text-black shadow-xl rotate-6 scale-110' : 'bg-white dark:bg-zinc-900 group-hover:scale-110'}`}>
               <Icon size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black uppercase italic leading-none">{label}</h3>
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-2">{description}</p>
            </div>
          </div>
          <div className={`transition-all duration-500 ${isOpen ? 'rotate-90 scale-125 text-black dark:text-white' : 'text-slate-500'}`}>
             <ChevronRight size={24} />
          </div>
        </button>
        
        {isOpen && (
          <div className="p-10 border-t border-slate-50 dark:border-zinc-800 animate-fade-up">
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderPersonnelContent = () => (
    <div className="space-y-8">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-wrap">
        <TabButton id="staff" label={t('coreStaff') || "Core Staff"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="cutting" label={t('cutting') || "Cutting"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="sewing" label={t('sewing') || "Sewing"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="stone" label={t('stone') || "Stone"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="pata" label={t('pataUnit') || "Pata Unit"} active={personnelTab} onClick={setPersonnelTab} />
        <TabButton id="outside" label={t('outsideWork') || "Outside"} active={personnelTab} onClick={setPersonnelTab} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <button
          onClick={() => setWorkerDocModal("add")}
          className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all italic border-b-[6px] border-zinc-900"
        >
          <Plus size={20} strokeWidth={3} />
          কর্মী নিবন্ধন (Add Worker)
        </button>
        <div className="relative w-full md:w-80">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
              type="text" 
              placeholder="SEARCH WORKERS..." 
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all italic shadow-inner"
           />
        </div>
      </div>
      {['sewing', 'stone', 'pata'].map(dept => (
        <div key={dept} className="bg-slate-50 dark:bg-black/20 p-8 rounded-[3rem] border border-slate-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-8 px-4">
             <h4 className="text-xl font-black uppercase italic tracking-tighter">{dept} {t("operatives") || "Operatives"}</h4>
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{getUnifiedWorkers(dept).length} {t("staff") || "Staff"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getUnifiedWorkers(dept)
              .filter(w => !workerSearch || w.name.toUpperCase().includes(workerSearch.toUpperCase()))
              .map((w, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900/50 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all group relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border-2 border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:rotate-6 transition-all overflow-hidden shadow-inner">
                     {w.photo ? <img src={w.photo} className="w-full h-full object-cover" /> : <User size={24} />}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setWorkerDocModal(w);
                        setTempWorkerPhoto(w.photo || null);
                        setTempNidPhoto(w.nidPhoto || null);
                      }} 
                      className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-slate-500 hover:text-black dark:hover:text-white transition-all shadow-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    {!w.isLegacy && <button onClick={() => handleDeleteUnifiedWorker(w.id, w.name, w.dept)} className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-rose-300 hover:text-rose-500 transition-all shadow-sm"><Trash2 size={16} /></button>}
                    <button 
                      onClick={() => setPrintWorkerDoc(w)} 
                      className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-indigo-500 hover:text-indigo-700 transition-all shadow-sm"
                      title="Print Worker Card"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                       onClick={() => {
                          const newPass = prompt(`RESET PASSWORD FOR ${w.name.toUpperCase()}?`, w.password || "1234");
                          if (newPass) {
                             const updatedW = { ...w, password: newPass };
                             handleSaveUnifiedWorker(updatedW, w.name, w.dept);
                          }
                       }}
                       className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-amber-500 hover:text-amber-700 transition-all shadow-sm"
                       title="Reset Password"
                    >
                       <Key size={16} />
                    </button>
                    <button 
                      onClick={() => alert(`PASSWORD FOR ${w.name.toUpperCase()}: ${w.password || '1234'}`)} 
                      className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-emerald-500 hover:text-emerald-700 transition-all shadow-sm"
                      title="View Current Password"
                    >
                      {w.password ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h5 className="text-xl font-black uppercase italic truncate tracking-tighter text-black dark:text-white">{w.name}</h5>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{dept} operative</p>
                </div>
                <div className="flex justify-between items-end mt-8 border-t border-slate-50 dark:border-zinc-800 pt-4">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic font-mono mb-1">Base Rate</p>
                      <p className="text-xl font-black italic">৳{w.wage}</p>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => sendWhatsApp(w.phone, t("salaryUpdateMsg") || "NRZOONE Salary Update: আপনার বর্তমান মজুরি আপডেট করা হয়েছে।")} className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
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
    <div className="bg-white dark:bg-zinc-900/50 rounded-[3rem] border border-slate-100 dark:border-zinc-900 overflow-hidden min-h-[400px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left italic">
          <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 font-black text-[11px] uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">{t("timestamp") || "Timestamp"}</th>
              <th className="px-6 py-6">{t("nodeCreator") || "Node Creator"}</th>
              <th className="px-6 py-6">{t("operation") || "Operation"}</th>
              <th className="px-6 py-6">{t("detailMetadata") || "Detail Metadata"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {(masterData.auditLogs || []).slice(0, 50).map((log, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                <td className="px-8 py-5">
                   <p className="text-[10px] font-black opacity-30">{new Date(log.timestamp).toLocaleTimeString()}</p>
                   <p className="text-[9px] font-bold text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-5">
                   <p className="text-xs font-black uppercase">{log.user}</p>
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{log.role}</span>
                </td>
                <td className="px-6 py-5 font-black text-[10px] uppercase text-emerald-500 italic">{log.action}</td>
                <td className="px-6 py-5 text-[10px] text-slate-500 truncate max-w-xs">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBrandingContent = () => (
    <div className="space-y-10 p-4 animate-fade-up">
       <div className="bg-slate-50 dark:bg-black/20 p-12 rounded-[4rem] border-2 border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-12 group transition-all hover:border-black dark:hover:border-white">
          <div className="w-48 h-48 bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden border-4 border-slate-50 dark:border-zinc-800 relative group-hover:rotate-3 transition-transform">
             {masterData.settings?.logo ? (
                <img src={masterData.settings.logo} className="w-full h-full object-contain p-4" alt="Company Logo" />
             ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300">
                   <ImageIcon size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Custom Logo</p>
                </div>
             )}
             {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                   <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
             )}
          </div>
          </div>
       </div>

       <div className="bg-emerald-50 dark:bg-emerald-950/20 p-12 rounded-[4rem] border-2 border-emerald-100 dark:border-emerald-900 flex flex-col md:flex-row items-center gap-12 group transition-all hover:border-emerald-500">
          <div className="w-48 h-48 bg-white dark:bg-emerald-900 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden border-4 border-emerald-50 dark:border-emerald-800 relative group-hover:rotate-3 transition-transform">
             <MessageCircle size={60} className="text-emerald-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
             <h4 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Enterprise Branding</h4>
             <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-relaxed mb-10 italic">
                Upload your factory logo to personalize the ERP dashboard and print slips. High-resolution PNG/SVG recommended.
             </p>
             <label className="inline-flex items-center gap-4 bg-black dark:bg-white text-white dark:text-black px-12 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-3xl cursor-pointer italic">
                <Upload size={18} />
                {uploading ? "Uploading Neural Link..." : "Upload New Logo"}
                <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files[0])} className="hidden" />
             </label>
             {masterData.settings?.logo && (
                <button 
                   onClick={() => setMasterData(prev => ({...prev, settings: {...prev.settings, logo: ""}}))}
                   className="ml-0 md:ml-6 mt-4 md:mt-0 text-[10px] font-black uppercase text-rose-500 tracking-widest hover:underline italic"
                >
                   Reset to Defaults
                </button>
             )}
          </div>
       </div>

       <div className="bg-emerald-50 dark:bg-emerald-950/20 p-12 rounded-[4rem] border-2 border-emerald-100 dark:border-emerald-900 flex flex-col md:flex-row items-center gap-12 group transition-all hover:border-emerald-500">
             <p className="text-emerald-700/60 dark:text-emerald-400/60 text-xs font-black uppercase tracking-widest leading-relaxed mb-10 italic">
                Set your factory's official WhatsApp number for receiving automated reports, tracking alerts, and system notifications.
             </p>
             <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 md:w-80">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500">
                      <Phone size={18} />
                   </div>
                   <input 
                      id="system-whatsapp"
                      className="w-full bg-white dark:bg-zinc-800 pl-16 pr-8 py-6 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50 text-base font-black italic outline-none focus:border-emerald-500 text-emerald-900 dark:text-emerald-100"
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
                         showNotify("Official WhatsApp Number Updated!", "success");
                      }
                   }}
                   className="bg-emerald-600 dark:bg-emerald-500 text-white px-12 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-3xl hover:bg-emerald-700 active:scale-95 transition-all italic border-b-[8px] border-emerald-800"
                >
                   Update Link
                </button>
             </div>
          </div>
       </div>
    </div>
  );

  const renderDatabaseContent = () => (
    <div className="space-y-8 p-4">
      <div className="bg-black text-white rounded-[3rem] p-12 text-center relative overflow-hidden group border-8 border-white/5">
         <div className="relative z-10">
            <h4 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{t("masterArchives") || "Master Archives"}</h4>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest max-w-md mx-auto mb-10 italic">{t("backupDesc") || "Secure production backups with instant node restoration capabilities."}</p>
            <div className="flex flex-col md:flex-row justify-center gap-4 px-10">
               <button onClick={handleBackup} className="bg-white text-black px-10 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3 italic">
                  <Download size={18} /> {t("downloadJson") || "Download JSON"}
               </button>
               <label className="bg-zinc-800 text-white px-10 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-3 italic border border-zinc-700">
                  <Upload size={18} /> {t("restoreArchive") || "Restore Archive"}
                  <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
               </label>
            </div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {['productions', 'cuttingStock', 'pataEntries', 'deliveries', 'attendance'].map(key => (
            <div key={key} className="bg-slate-50 dark:bg-black/20 p-8 rounded-[3rem] flex justify-between items-center group hover:border-rose-500 transition-all border border-transparent">
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{key.toUpperCase()}</p>
                  <p className="text-2xl font-black italic tracking-tighter">{masterData[key]?.length || 0}</p>
               </div>
               <button onClick={() => { if(confirm(t("confirmWipe", { key }) || `Wipe all ${key}?`)) setMasterData(prev => ({...prev, [key]: []})); }} className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm opacity-20 group-hover:opacity-100">
                  <Trash2 size={16} />
               </button>
            </div>
         ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-24 animate-fade-up px-2 italic text-black font-outfit">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 px-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActivePanel("Overview")}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="section-header">
                   {t("strategicHub") || "Strategic"} <span className="text-slate-500">{t("hub") || "Hub"}</span>
                </h1>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
                   {t("systemVersion") || "System Control Node v2.1"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <AccordionItem id="profile" label="My Security & Profile" icon={User} description="Manage your login credentials & biometric ID">
               <div className="space-y-8 p-4">
                  <div className="bg-slate-50 dark:bg-black/20 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-8 italic transition-all group">
                     <div>
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Auth Credentials</h4>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic font-mono leading-none">Identity: {currentUser.id}</p>
                     </div>
                     <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                           <input 
                              type={showProfilePass ? "text" : "password"} 
                              id="profile-new-pass"
                              className="w-full bg-white dark:bg-zinc-800 pl-6 pr-12 py-4 rounded-xl border border-slate-100 dark:border-zinc-700 text-sm font-black italic outline-none focus:border-black"
                              placeholder="NEW PASSWORD"
                              defaultValue={currentUser.password}
                           />
                           <button onClick={() => setShowProfilePass(!showProfilePass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                              {showProfilePass ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                        </div>
                        <button 
                           onClick={() => handleUpdateCurrentPassword(document.getElementById('profile-new-pass').value)}
                           className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all italic"
                        >
                           Update
                        </button>
                     </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-10 rounded-[3rem] border-2 border-emerald-100 dark:border-emerald-900 flex flex-col md:flex-row justify-between items-center gap-8 italic">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white dark:bg-emerald-900 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                           <ShieldCheck size={32} />
                        </div>
                        <div>
                           <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Finger / Face ID</h4>
                           <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest italic">{currentUser.biometricId ? 'SUCCESSFULLY REGISTERED' : 'NOT CONFIGURED YET'}</p>
                        </div>
                     </div>
                     <button 
                        onClick={registerAdminBiometric}
                        className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-emerald-700 transition-all italic border-b-[6px] border-emerald-800"
                     >
                        Register Biometric Login
                     </button>
                  </div>
               </div>
            </AccordionItem>
            <AccordionItem id="branding" label="System Branding" icon={ImageIcon} description="Personalize dashboard and print slip logo">
               {renderBrandingContent()}
            </AccordionItem>

            <AccordionItem id="users" label={t('systemSecurity') || "System Access"} icon={ShieldCheck} description={t('authProtocol') || "Manage administrative credentials and roles"}>
              {renderUsersContent()}
            </AccordionItem>

            <AccordionItem id="personnel" label={t('personnel') || "Personnel Matrix"} icon={Users} description={t('staff') || "Consolidated staff and production operative directory"}>
              {renderPersonnelContent()}
            </AccordionItem>

            <AccordionItem id="product" label={t('productionMatrix') || "Production Matrix"} icon={LayoutGrid} description={t('config') || "Master taxonomy for sizes, colors, and design specs"}>
              {renderProductContent()}
            </AccordionItem>
            
            <AccordionItem id="logs" label={t('audit') || "Audit Archives"} icon={Clock} description={t('liveMonitor') || "Real-time chronological footprint of all system operations"}>
               {renderAuditContent()}
            </AccordionItem>

            <AccordionItem id="database" label={t('database') || "Strategic Maintenance"} icon={Database} description={t('raw') || "Legacy backup restoration and node sanitation"}>
               {renderDatabaseContent()}
            </AccordionItem>
          </div>
        </div>

        <div className="hidden md:block space-y-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3.5rem] border-2 border-slate-50 dark:border-zinc-800 shadow-2xl relative overflow-hidden italic">
            <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase mb-8 italic tracking-tighter">{t('systemDiagnostic') || "Diagnostic Node"}</h3>
              <div className="space-y-8">
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t("nodeSyncStatus") || "Node Sync Status"}</p>
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-xs font-black uppercase italic">{t("primaryCloudOnline") || "Primary Cloud Online"}</p>
                   </div>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t("dbLatency") || "Database Latency"}</p>
                   <p className="text-4xl font-black italic tracking-tighter">14<span className="text-xs ml-1 opacity-70">ms</span></p>
                </div>
                <div className="pt-6 border-t border-slate-50 dark:border-zinc-800">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{t("systemCapacity") || "System Capacity"}</p>
                   <div className="w-full h-1 bg-slate-50 dark:bg-black/50 rounded-full overflow-hidden">
                      <div className="w-[84%] h-full bg-black dark:bg-white"></div>
                   </div>
                   <p className="text-[10px] font-black uppercase mt-3 italic text-right opacity-30">{t("storageAllocated") || "8.4GB / 10GB Allocated"}</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-[0.03] rotate-12 scale-150"><Settings size={140} /></div>
          </div>

          <div className="bg-black text-white p-10 rounded-[3.5rem] shadow-3xl text-center italic group overflow-hidden relative border-8 border-white/5">
             <div className="relative z-10">
                <p className="text-[9px] font-black tracking-[0.5em] mb-4 uppercase opacity-70">Administrative</p>
                <h4 className="text-2xl font-black uppercase italic mb-8 tracking-tighter italic">Self-Correction Node</h4>
                <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl italic">
                   Soft Reboot
                </button>
             </div>
             <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent"></div>
          </div>
        </div>
      </div>

      {showAddModal === "user" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-3 md:p-4 text-black italic">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-y-auto max-h-[96vh] p-8 md:p-16 space-y-8 md:space-y-12">
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase italic mb-2">
                {t('addUser') || "নতুন ইউজার"}
              </h3>
              <p className="text-xl font-black tracking-widest text-slate-500 italic">
                Identity Provisioning
              </p>
            </div>
            <div className="space-y-8">
              <input
                id="new-user-id"
                className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 uppercase"
                placeholder="USER ID"
              />
              <div className="relative">
                <input
                  id="new-user-pass"
                  type={showUserPass ? "text" : "password"}
                  className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 pr-12"
                  placeholder="PASSWORD"
                />
                <button
                  type="button"
                  onClick={() => setShowUserPass(!showUserPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showUserPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <input
                id="new-user-name"
                className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 uppercase"
                placeholder="DISPLAY NAME"
              />
              <select
                id="new-user-role"
                className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100"
              >
                <option value="worker">WORKER</option>
                <option value="manager">MANAGER</option>
                <option value="admin">ADMIN</option>
              </select>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAddUser(
                      document.getElementById("new-user-id").value,
                      document.getElementById("new-user-pass").value,
                      document.getElementById("new-user-name").value,
                      document.getElementById("new-user-role").value,
                    )
                  }
                  className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && !["user", "worker", "design"].includes(showAddModal) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-3 md:p-4 text-black italic">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-y-auto max-h-[96vh] p-8 md:p-16 space-y-8 md:space-y-12 animate-fade-up">
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase italic mb-2">
                ADD {showAddModal.toUpperCase()}
              </h3>
              <p className="text-xl font-black tracking-widest text-slate-500 italic">
                Core configuration
              </p>
            </div>
            <div className="space-y-8 uppercase">
              <input
                id="new-list-item-value"
                className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100 italic"
                placeholder="ENTER VALUE..."
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAddListItem(
                      showAddModal,
                      document.getElementById("new-list-item-value").value,
                    )
                  }
                  className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900"
                >
                  Confirm Creation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal === "worker" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-3 md:p-4 text-black italic">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-y-auto max-h-[96vh] p-8 md:p-16 space-y-8 md:space-y-12">
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase italic mb-2">
                নতুন কর্মী
              </h3>
              <p className="text-xl font-black tracking-widest text-slate-500 italic">
                User Deployment
              </p>
            </div>
            <div className="space-y-8 uppercase">
              <select
                id="new-worker-dept"
                className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100"
                value={newWorkerDept}
                onChange={(e) => setNewWorkerDept(e.target.value)}
              >
                <option value="sewing">Sewing Dept</option>
                <option value="stone">Stone Dept</option>
                <option value="pata">Pata Dept</option>
                <option value="logistics">Outside / Logistics</option>
                <option value="monthly">Monthly Staff</option>
              </select>
              <input
                id="new-worker-name"
                className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100"
                placeholder="NAME"
              />
              <input
                id="new-worker-wage"
                type="number"
                className="form-input py-6 text-sm font-black bg-slate-50 border-slate-100"
                placeholder={
                  newWorkerDept === "monthly"
                    ? "SALARY (৳)"
                    : "SPECIFIC RATE (৳ - OPTIONAL)"
                }
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAddWorker(
                      newWorkerDept,
                      document.getElementById("new-worker-name").value,
                      document.getElementById("new-worker-wage")?.value || 0,
                    )
                  }
                  className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal === "design" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-start md:items-center justify-center p-2 md:p-4 text-black italic overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] md:rounded-[5rem] border-4 border-slate-50 shadow-2xl my-auto p-6 md:p-16 space-y-8 md:space-y-10 max-h-none md:max-h-[96vh]">
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase italic mb-2">
                নতুন ডিজাইন
              </h3>
              <p className="text-xl font-black tracking-widest text-slate-500 italic">
                Product Development
              </p>
            </div>

            <div className="flex justify-center">
              <label className="w-40 h-40 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all relative overflow-hidden group">
                {tempImgUrl ? (
                  <img
                    src={tempImgUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {uploading ? (
                      <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full"></div>
                    ) : (
                      <Upload
                        size={32}
                        className="text-slate-500 group-hover:text-black transition-colors"
                      />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2">
                      Upload Photo
                    </span>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files[0]) {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) setTempImgUrl(url);
                    }
                  }}
                />
              </label>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center mb-4">
                <label className="bg-black text-white px-4 py-2 rounded-sm text-xs font-black uppercase italic tracking-[0.2em] shadow-2xl">
                  Design Name
                </label>
              </div>
              <input
                id="new-design-name"
                className="form-input py-4 text-lg font-black bg-white border-slate-100 uppercase text-center"
                placeholder="DESIGN NAME"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Sewing Rate
                  </label>
                  <input
                    id="new-design-sewing"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Hijab Rate
                  </label>
                  <input
                    id="new-design-hijab"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Stone Rate
                  </label>
                  <input
                    id="new-design-stone"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Pata Rate
                  </label>
                  <input
                    id="new-design-pata"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Material Cost
                  </label>
                  <input
                    id="new-design-cost"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100 placeholder:text-slate-500"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Selling Price
                  </label>
                  <input
                    id="new-design-sell"
                    type="number"
                    className="form-input py-4 text-center font-black text-emerald-600 bg-white border-emerald-100 placeholder:text-emerald-200"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAddDesign(
                      document.getElementById("new-design-name").value,
                      document.getElementById("new-design-sewing").value,
                      document.getElementById("new-design-stone").value,
                      document.getElementById("new-design-pata").value,
                      document.getElementById("new-design-hijab").value,
                      document.getElementById("new-design-cost").value,
                      document.getElementById("new-design-sell").value,
                    )
                  }
                  className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900"
                >
                  Confirm Creation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editDesignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-start md:items-center justify-center p-2 md:p-4 text-black italic overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] md:rounded-[5rem] border-4 border-slate-50 shadow-2xl my-auto p-6 md:p-16 space-y-8 md:space-y-10 max-h-none md:max-h-[96vh]">
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase italic mb-2">
                স্টাইল আপডেট
              </h3>
              <p className="text-xl font-black tracking-widest text-slate-500 italic">
                Style Refinement
              </p>
            </div>

            <div className="flex justify-center">
              <label className="w-48 h-48 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all relative overflow-hidden group">
                {tempImgUrl ? (
                  <img
                    src={tempImgUrl}
                    alt="Preview"
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <>
                    {uploading ? (
                      <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full"></div>
                    ) : (
                      <Upload
                        size={40}
                        className="text-slate-500 group-hover:text-black transition-colors"
                      />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-3">
                      Update Photo
                    </span>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files[0]) {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) setTempImgUrl(url);
                    }
                  }}
                />
              </label>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center mb-4">
                <label className="bg-black text-white px-4 py-2 rounded-sm text-xs font-black uppercase italic tracking-[0.2em] shadow-2xl">
                  Design Name
                </label>
              </div>
              <input
                id="edit-design-name"
                className="form-input py-4 text-lg font-black bg-white border-slate-100 uppercase text-center"
                defaultValue={editDesignModal.name}
              />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Sewing Rate
                  </label>
                  <input
                    id="edit-design-sewing"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    defaultValue={editDesignModal.sewingRate}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Hijab Rate
                  </label>
                  <input
                    id="edit-design-hijab"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    defaultValue={editDesignModal.hijabRate}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Stone Rate
                  </label>
                  <input
                    id="edit-design-stone"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    defaultValue={editDesignModal.stoneRate}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Pata Rate
                  </label>
                  <input
                    id="edit-design-pata"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    defaultValue={editDesignModal.pataRate}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Material Cost
                  </label>
                  <input
                    id="edit-design-cost"
                    type="number"
                    className="form-input py-4 text-center font-black bg-white border-slate-100"
                    defaultValue={editDesignModal.materialCost}
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="bg-black text-white px-2 py-1 rounded-sm text-[9px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg">
                    Selling Price
                  </label>
                  <input
                    id="edit-design-sell"
                    type="number"
                    className="form-input py-4 text-center font-black text-emerald-600 bg-white border-emerald-100 placeholder:text-emerald-200"
                    defaultValue={editDesignModal.sellingPrice}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setEditDesignModal(null);
                    setTempImgUrl(null);
                  }}
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleUpdateDesignFull(editDesignModal.index, {
                      name: document.getElementById("edit-design-name").value,
                      sewingRate: Number(
                        document.getElementById("edit-design-sewing").value,
                      ),
                      stoneRate: Number(
                        document.getElementById("edit-design-stone").value,
                      ),
                      pataRate: Number(
                        document.getElementById("edit-design-pata").value,
                      ),
                      hijabRate: Number(
                        document.getElementById("edit-design-hijab").value,
                      ),
                      materialCost: Number(
                        document.getElementById("edit-design-cost").value,
                      ),
                      sellingPrice: Number(
                        document.getElementById("edit-design-sell").value,
                      ),
                      image: tempImgUrl,
                    })
                  }
                  className="flex-[2] py-10 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900"
                >
                  Update Style
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-20 pb-10 flex justify-center">
        <button
          onClick={() => setActivePanel("Overview")}
          className="group relative flex items-center gap-6 bg-white px-12 py-6 rounded-full border-4 border-slate-50 shadow-2xl hover:border-black transition-all duration-500"
        >
          <div className="p-3 bg-black text-white rounded-2xl group-hover:rotate-[-12deg] transition-transform">
            <ArrowLeft size={20} strokeWidth={3} />
          </div>
          <span className="text-lg font-black uppercase italic tracking-widest text-black">
            Back to Dashboard
          </span>
          <div className="absolute -inset-1 bg-black/5 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      {/* Worker Document Add/Edit Modal */}
      {workerDocModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-start md:items-center justify-center p-2 md:p-4 text-black italic overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] md:rounded-[5rem] border-4 border-slate-50 shadow-2xl my-auto p-6 md:p-14 space-y-6 md:space-y-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-black text-white rounded-2xl shadow-xl">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-2xl md:text-4xl font-black uppercase italic leading-none text-black">
                  {workerDocModal === "add"
                    ? "নতুন কর্মী নিবন্ধন"
                    : "তথ্য আপডেট করুন"}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  Worker Profile
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Upload Section */}
              <div className="md:col-span-2 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                    কর্মীর ছবি (Worker Photo)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-slate-50 border-4 border-slate-100 rounded-[2rem] flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                      {tempWorkerPhoto ? (
                        <>
                          <img
                            src={tempWorkerPhoto}
                            alt="Worker"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setTempWorkerPhoto(null)}
                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      ) : (
                        <ImageIcon size={30} className="text-slate-500" />
                      )}
                      {uploadingWorkerPhoto && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Clock
                            size={20}
                            className="animate-spin text-black"
                          />
                        </div>
                      )}
                    </div>
                    <label className="flex-1 flex flex-col items-center justify-center p-6 border-4 border-dashed border-slate-100 rounded-[2rem] hover:border-black/10 transition-all cursor-pointer bg-slate-50/50 group">
                      <Upload
                        size={20}
                        className="text-slate-500 group-hover:text-black mb-2 transition-colors"
                      />
                      <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-black transition-colors">
                        ছবি আপলোড করুন
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleWorkerPhotoUpload(
                              file,
                              "profile",
                            );
                            if (url) setTempWorkerPhoto(url);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                    NID / কার্ডের ছবি (NID Image)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-slate-50 border-4 border-slate-100 rounded-[2rem] flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                      {tempNidPhoto ? (
                        <>
                          <img
                            src={tempNidPhoto}
                            alt="NID"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setTempNidPhoto(null)}
                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      ) : (
                        <ImageIcon size={30} className="text-slate-500" />
                      )}
                      {uploadingWorkerPhoto && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Clock
                            size={20}
                            className="animate-spin text-black"
                          />
                        </div>
                      )}
                    </div>
                    <label className="flex-1 flex flex-col items-center justify-center p-6 border-4 border-dashed border-slate-100 rounded-[2rem] hover:border-black/10 transition-all cursor-pointer bg-slate-50/50 group">
                      <Upload
                        size={20}
                        className="text-slate-500 group-hover:text-black mb-2 transition-colors"
                      />
                      <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-black transition-colors">
                        NID আপলোড করুন
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleWorkerPhotoUpload(
                              file,
                              "nid",
                            );
                            if (url) setTempNidPhoto(url);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  পূর্ণ নাম *
                </label>
                <input
                  id="wdoc-name"
                  className="form-input py-4 font-black text-base uppercase bg-slate-50 border-slate-100"
                  defaultValue={workerDocModal?.name || ""}
                  placeholder="কর্মীর নাম"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  বিভাগ (Department)
                </label>
                <select
                  id="wdoc-dept"
                  className="form-input py-4 font-black bg-slate-50 border-slate-100"
                  defaultValue={
                    workerDocModal?.dept || newWorkerDept || "sewing"
                  }
                  disabled={!!workerDocModal?.isLegacy}
                >
                  <option value="sewing">Sewing Dept</option>
                  <option value="stone">Stone Dept</option>
                  <option value="pata">Pata Dept</option>
                  <option value="cutting">Cutting / Master</option>
                  <option value="monthly">Office / Monthly Staff</option>
                  <option value="logistics">Logistics / Outside</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  निर्धारিত রেট (Rate / Salary)
                </label>
                <input
                  id="wdoc-wage"
                  type="number"
                  className="form-input py-4 font-black text-base bg-slate-50 border-slate-100"
                  defaultValue={workerDocModal?.wage || ""}
                  placeholder="৳"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  মোবাইল নম্বর *
                </label>
                <input
                  id="wdoc-phone"
                  className="form-input py-4 font-black text-base bg-slate-50 border-slate-100"
                  defaultValue={workerDocModal?.phone || ""}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  NID / জাতীয় পরিচয়পত্র নম্বর
                </label>
                <input
                  id="wdoc-nid"
                  className="form-input py-4 font-black tracking-widest bg-slate-50 border-slate-100"
                  defaultValue={workerDocModal?.nid || ""}
                  placeholder="NID No."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  Password (Login Access)
                </label>
                <input
                  id="wdoc-pass"
                  className="form-input py-4 font-black tracking-widest bg-emerald-50 border-emerald-100 text-emerald-600"
                  defaultValue={workerDocModal?.password || ""}
                  placeholder="অ্যাক্সেস পাসওয়ার্ড (Default: 1234)"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  স্থায়ী ঠিকানা
                </label>
                <textarea
                  id="wdoc-address"
                  rows={2}
                  className="form-input py-4 font-black bg-slate-50 border-slate-100 resize-none"
                  defaultValue={workerDocModal?.address || ""}
                  placeholder="গ্রাম, উপজেলা, জেলা"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  যোগদানের তারিখ
                </label>
                <input
                  id="wdoc-join"
                  type="date"
                  className="form-input py-4 font-black bg-slate-50 border-slate-100"
                  defaultValue={
                    workerDocModal?.joinDate ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  জরুরি যোগাযোগ (নাম ও নম্বর)
                </label>
                <input
                  id="wdoc-emergency"
                  className="form-input py-4 font-black bg-slate-50 border-slate-100"
                  defaultValue={workerDocModal?.emergency || ""}
                  placeholder="নাম — 01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">
                  অতিরিক্ত নোট
                </label>
                <textarea
                  id="wdoc-note"
                  rows={2}
                  className="form-input py-4 font-black bg-slate-50 border-slate-100 resize-none"
                  defaultValue={workerDocModal?.note || ""}
                  placeholder="যেকোনো বিশেষ তথ্য..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setWorkerDocModal(null)}
                className="flex-1 py-6 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-500"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  const doc = {
                    id: workerDocModal?.id || null,
                    name: document.getElementById("wdoc-name").value.trim(),
                    dept: document.getElementById("wdoc-dept").value,
                    wage:
                      Number(document.getElementById("wdoc-wage").value) || 0,
                    phone: document.getElementById("wdoc-phone").value.trim(),
                    nid: document.getElementById("wdoc-nid").value.trim(),
                    address: document
                      .getElementById("wdoc-address")
                      .value.trim(),
                    joinDate: document.getElementById("wdoc-join").value,
                    emergency: document
                      .getElementById("wdoc-emergency")
                      .value.trim(),
                    note: document.getElementById("wdoc-note").value.trim(),
                    password: document.getElementById("wdoc-pass").value.trim() || (workerDocModal?.password || "1234"),
                    photo: tempWorkerPhoto,
                    nidPhoto: tempNidPhoto,
                  };
                  if (!doc.name)
                    return showNotify("কর্মীর নাম আবশ্যক!", "error");

                  const oldName =
                    workerDocModal && workerDocModal !== "add"
                      ? workerDocModal.name.toUpperCase()
                      : null;
                  const oldDept =
                    workerDocModal && workerDocModal !== "add"
                      ? workerDocModal.dept
                      : null;

                  handleSaveUnifiedWorker(doc, oldName, oldDept);
                }}
                className="flex-[2] py-6 rounded-full font-black text-sm uppercase bg-black text-white shadow-2xl border-b-[12px] border-zinc-900"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worker Document Print View */}
      {printWorkerDoc && (
        <div className="fixed inset-0 bg-white z-[300] overflow-auto">
          <style>{`
                        @media print {
                            .no-print { display: none !important; }
                            body { background: white !important; margin: 0; }
                            @page { size: A5; margin: 10mm; }
                        }
                    `}</style>

          {/* Screen controls */}
          <div className="no-print flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 sticky top-0">
            <button
              onClick={() => setPrintWorkerDoc(null)}
              className="px-6 py-3 bg-white border border-slate-200 rounded-full font-black text-xs uppercase"
            >
              ← বাতিল
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Worker ID Card • A5 Print
            </p>
            <button
              onClick={() => window.print()}
              className="px-8 py-3 bg-black text-white rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-xl"
            >
              <Printer size={14} /> প্রিন্ট
            </button>
          </div>

          {/* Print Content */}
          <div className="max-w-[148mm] mx-auto mt-8 p-0">
            <div
              className="border-[3px] border-black bg-white p-8 print-keep-together"
              style={{ minHeight: "200mm" }}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-5 mb-6">
                <div className="flex items-center gap-4">
                  <NRZLogo size="sm" white={false} />
                  <div>
                    <h1 className="text-3xl font-black italic tracking-tighter leading-none">
                      NRZO0NE
                    </h1>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1">
                      FACTORY WORKER PROFILE
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-slate-500">
                    Issue Date
                  </p>
                  <p className="font-black text-sm">
                    {new Date().toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>

              {/* Worker Profile Header */}
              <div className="flex gap-6 items-start mb-6">
                <div className="w-32 h-32 bg-slate-50 border-4 border-black rounded-2xl overflow-hidden flex-shrink-0">
                  {printWorkerDoc.photo ? (
                    <img
                      src={printWorkerDoc.photo}
                      alt={printWorkerDoc.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <User size={60} />
                    </div>
                  )}
                </div>
                <div className="flex-1 bg-black text-white p-5 rounded-2xl h-32 flex flex-col justify-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mb-1">
                    {printWorkerDoc.dept?.toUpperCase() || "DEPARTMENT"}
                  </p>
                  <h2 className="text-3xl font-black italic uppercase leading-none">
                    {printWorkerDoc.name}
                  </h2>
                  {printWorkerDoc.joinDate && (
                    <p className="text-[10px] font-black text-white/60 mt-2 uppercase">
                      Joined:{" "}
                      {new Date(printWorkerDoc.joinDate).toLocaleDateString(
                        "en-GB",
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border border-slate-200 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1">
                    📱 মোবাইল নম্বর
                  </p>
                  <p className="font-black text-base">
                    {printWorkerDoc.phone || "—"}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1">
                    🪪 NID নম্বর
                  </p>
                  <p className="font-black text-sm tracking-wider">
                    {printWorkerDoc.nid || "—"}
                  </p>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 mb-3">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">
                  📍 স্থায়ী ঠিকানা
                </p>
                <p className="font-black text-sm leading-snug">
                  {printWorkerDoc.address || "—"}
                </p>
              </div>
              {printWorkerDoc.emergency && (
                <div className="border-2 border-rose-400 bg-rose-50 rounded-xl p-3 mb-3">
                  <p className="text-[8px] font-black uppercase text-rose-500 mb-1">
                    🚨 জরুরি যোগাযোগ
                  </p>
                  <p className="font-black text-sm text-rose-700">
                    {printWorkerDoc.emergency}
                  </p>
                </div>
              )}
              {printWorkerDoc.note && (
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-3 mb-3">
                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1">
                    📝 নোট
                  </p>
                  <p className="font-black text-sm text-slate-700">
                    {printWorkerDoc.note}
                  </p>
                </div>
              )}

              {printWorkerDoc.nidPhoto && (
                <div className="mt-4">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    ATTACHED NID DOCUMENT
                  </p>
                  <div className="w-full h-48 border-2 border-slate-100 rounded-2xl overflow-hidden">
                    <img
                      src={printWorkerDoc.nidPhoto}
                      alt="NID Document"
                      className="w-full h-full object-contain bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {/* Access Credentials */}
              <div className="mt-6 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-3 tracking-widest text-center">
                  Smart Access Credentials
                </p>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Login Identity</p>
                    <p className="text-sm font-black uppercase tracking-tighter">{printWorkerDoc.name}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="flex-1">
                    <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Access Password</p>
                    <p className="text-sm font-black tracking-widest">{printWorkerDoc.password || "••••"}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="flex-1 text-right">
                    <p className="text-[7px] font-black uppercase text-slate-400 mb-1">System Node</p>
                    <p className="text-[10px] font-black uppercase">NRZO0NE-ERP</p>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
                <div>
                  <div className="w-32 h-px bg-black mb-2"></div>
                  <p className="text-[9px] font-black uppercase text-slate-500">
                    কর্মীর স্বাক্ষর
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-px bg-black mb-2 ml-auto"></div>
                  <p className="text-[9px] font-black uppercase text-slate-500">
                    কর্তৃপক্ষের স্বাক্ষর
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">
                  NRZO0NE Smart Track™ • Worker ID: {printWorkerDoc.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
