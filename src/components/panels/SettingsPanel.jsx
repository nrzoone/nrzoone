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
  Bell,
} from "lucide-react";
import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import logoWhite from "../../assets/logo_white.png";
import logoBlack from "../../assets/logo_black.png";

const SettingsPanel = ({
  masterData,
  setMasterData,
  user: currentUser,
  showNotify,
  setActivePanel,
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
            <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] md:tracking-[0.5em] mt-3 md:mt-4 italic">
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
                    SAVE
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
                      className="flex-1 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 hover:text-black transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteListItem(category, idx)}
                      className="flex-1 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 hover:text-rose-500 transition-all"
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

  return (
    <div className="space-y-4 pb-24 animate-fade-up px-2 italic text-black font-outfit">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActivePanel("Overview")}
          className="p-3 bg-white text-black rounded-xl border-2 border-slate-100 shadow-md hover:bg-black hover:text-white transition-all"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="bg-black rounded-2xl p-2.5 shadow-xl shrink-0">
          <img
            src={logoWhite}
            alt="NRZO0NE"
            className="w-8 h-8 object-contain"
          />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter leading-none text-black">
            System <span className="text-slate-400">Settings</span>
          </h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            Master Configuration Hub
          </p>
        </div>
      </div>

      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: "profile", label: "MY PROFILE", icon: <User size={16} /> },
          { id: "users", label: "IDENTITY", icon: <ShieldCheck size={16} /> },
          { id: "workers", label: "TEAM DIRECTORY", icon: <Users size={16} /> },
          { id: "designs", label: "DESIGNS", icon: <Package size={16} /> },
          { id: "colors", label: "COLORS", icon: <Plus size={16} /> },
          { id: "sizes", label: "SIZES", icon: <LayoutGrid size={16} /> },
          { id: "cutters", label: "MASTERS", icon: <Scissors size={16} /> },
          { id: "pata", label: "PATA", icon: <LayoutGrid size={16} /> },
          { id: "database", label: "DATABASE", icon: <Database size={16} /> },
        ].map((tab) => {
          if (
            ["users", "database"].includes(tab.id) &&
            currentUser?.role !== "admin" &&
            currentUser?.id !== "NRZO0NE"
          )
            return null;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[80px] py-2 rounded-lg font-black text-[8px] uppercase tracking-[0.15em] transition-all italic flex flex-col items-center gap-1.5 ${activeTab === tab.id ? "bg-black text-white shadow-md" : "text-slate-400 hover:text-black hover:bg-slate-100"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-12">
        {activeTab === "workers" && (
          <div className="space-y-12">
            {/* Summary Header */}
            <div className="bg-white p-8 md:p-12 rounded-[4rem] border-4 border-slate-50 shadow-2xl flex justify-between items-center italic">
              <div className="flex items-center gap-4 md:gap-8">
                <div className="p-4 md:p-6 bg-black text-white rounded-2xl md:rounded-3xl">
                  <Users size={28} />
                </div>
                <div>
                  <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none italic text-black">
                    কর্মী ও টিম ডিরেক্টরি
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic">
                    TOTAL WORKFORCE
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setWorkerDocModal("add");
                  setNewWorkerDept("sewing");
                }}
                className="w-14 h-14 md:w-20 md:h-20 bg-black text-white rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center hover:scale-110 transition-all shadow-2xl border-b-[8px] md:border-b-[12px] border-zinc-900"
              >
                <Plus size={32} strokeWidth={3} />
              </button>
            </div>

            {[
              "sewing",
              "stone",
              "pata",
              "cutting",
              "finishing",
              "logistics",
              "monthly",
            ].map((dept) => {
              const departmentWorkers = getUnifiedWorkers(dept);
              if (departmentWorkers.length === 0) return null;

              return (
                <div
                  key={dept}
                  className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black animate-fade-up"
                >
                  <div className="p-8 border-b-2 border-slate-50 flex justify-between items-center bg-slate-50">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-black"></div>
                      {dept === "monthly"
                        ? "OFFICE STAFF"
                        : dept === "logistics"
                          ? "OUTSIDE / LOGISTICS"
                          : `${dept.toUpperCase()} DEPT`}
                    </h3>
                    <span className="px-4 py-2 bg-white rounded-full text-[10px] font-black uppercase tracking-widest">
                      {departmentWorkers.length} Members
                    </span>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departmentWorkers.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white rounded-[3rem] border-4 border-slate-50 shadow-xl overflow-hidden group hover:border-black transition-all"
                      >
                        <div className="bg-black px-6 py-4 flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {doc.photo ? (
                              <img
                                src={doc.photo}
                                alt={doc.name}
                                className="w-12 h-12 rounded-[1.2rem] object-cover border-2 border-white/20"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-[1.2rem] bg-white/10 flex items-center justify-center text-white font-black text-xl">
                                {doc.name?.[0]}
                              </div>
                            )}
                            <div>
                              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">
                                {doc.dept || dept}
                              </p>
                              <h4 className="text-lg font-black italic uppercase tracking-tighter leading-none text-white">
                                {doc.name}
                              </h4>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <div className="flex gap-1.5">
                              {!doc.isLegacy && (
                                <button
                                  onClick={() => setPrintWorkerDoc(doc)}
                                  className="p-2 bg-white/10 text-white rounded-xl hover:bg-white hover:text-black transition-all"
                                  title="Print ID Card"
                                >
                                  <Printer size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setWorkerDocModal(doc);
                                  setTempWorkerPhoto(doc.photo || null);
                                  setTempNidPhoto(doc.nidPhoto || null);
                                }}
                                className="p-2 bg-white/10 text-white rounded-xl hover:bg-white hover:text-black transition-all"
                                title="Edit Profile & Wage"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteUnifiedWorker(
                                    doc.id,
                                    doc.name,
                                    dept,
                                  )
                                }
                                className="p-2 bg-white/10 text-white rounded-xl hover:bg-rose-500 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          {/* Wage Display */}
                          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                              {dept === "monthly"
                                ? "MONTHLY SALARY"
                                : "SPECIFIC RATE"}
                            </p>
                            <p className="font-black text-sm text-black italic">
                              {doc.wage > 0
                                ? `৳${doc.wage}`
                                : "FOLLOWS STYLE RATE"}
                            </p>
                          </div>

                          {doc.isLegacy ? (
                            <div className="py-2 text-center border-t border-slate-50">
                              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">
                                LIMITED PROFILE
                              </p>
                              <button
                                onClick={() => {
                                  setWorkerDocModal(doc);
                                }}
                                className="px-4 py-2 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest w-full"
                              >
                                Upgrade Profile Details
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <Phone
                                  size={13}
                                  className="text-slate-400 flex-shrink-0"
                                />
                                <p className="font-black text-base text-black">
                                  {doc.phone || "—"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <CreditCard
                                  size={13}
                                  className="text-slate-400 flex-shrink-0"
                                />
                                <p className="font-black text-sm text-black tracking-widest">
                                  {doc.nid || "—"}
                                </p>
                              </div>
                              {doc.emergency && (
                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3">
                                  <p className="text-[9px] font-black text-rose-400 uppercase mb-0.5">
                                    জরুরি যোগাযোগ
                                  </p>
                                  <p className="font-black text-sm text-rose-700">
                                    {doc.emergency}
                                  </p>
                                </div>
                              )}
                              {doc.phone && (
                                <div className="pt-2 border-t border-slate-50">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() =>
                                        sendWhatsApp(
                                          doc.phone,
                                          `আসসালামু আলাইকুম, ${doc.name} ভাই/বোন। আজ আপনার উপস্থিতি রেকর্ড নেই। অনুগ্রহ করে যোগাযোগ করুন। -NRZO0NE Women's Clothing`,
                                        )
                                      }
                                      className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1"
                                    >
                                      <Bell size={10} /> অনুপস্থিত
                                    </button>
                                    <button
                                      onClick={() =>
                                        sendWhatsApp(
                                          doc.phone,
                                          `আসসালামু আলাইকুম, ${doc.name} ভাই/বোন। আপনার পাওনা হনোরার বিষয়ে যোগাযোগ করুন। বাকি বেতন গ্রহণ করুন। -NRZO0NE Women's Clothing`,
                                        )
                                      }
                                      className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
                                    >
                                      <DollarSign size={10} /> পাওনা
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "designs" && (
          <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
            <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                STYLE REPOSITORY
              </h3>
              <button
                onClick={() => setShowAddModal("design")}
                className="p-10 bg-black text-white rounded-[2.5rem] shadow-2xl border-b-[12px] border-zinc-800 font-black text-sm uppercase tracking-widest"
              >
                ADD NEW STYLE
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px] tracking-widest">
                  <tr>
                    <th className="px-12 py-8">PREVIEW</th>
                    <th className="px-6 py-8">IDENTITY</th>
                    <th className="px-6 py-8 text-center">SEWING ৳</th>
                    <th className="px-6 py-8 text-center">HIJAB ৳</th>
                    <th className="px-6 py-8 text-center">STONE ৳</th>
                    <th className="px-6 py-8 text-center">PATA ৳</th>
                    <th className="px-6 py-8 text-center">SELL ৳</th>
                    <th className="px-12 py-8 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterData.designs.map((design, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-all group"
                    >
                      <td className="px-12 py-6">
                        <div className="w-28 h-28 bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-slate-200 p-2 group-hover:scale-110 transition-transform">
                          {design.image ? (
                            <img
                              src={design.image}
                              alt={design.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <ImageIcon size={32} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-black text-2xl uppercase tracking-tighter italic">
                          {design.name}
                        </p>
                      </td>
                      <td className="px-6 py-10 text-center font-black text-xl italic">
                        ৳{design.sewingRate}
                      </td>
                      <td className="px-6 py-10 text-center font-black text-xl italic">
                        ৳{design.hijabRate}
                      </td>
                      <td className="px-6 py-10 text-center font-black text-xl italic">
                        ৳{design.stoneRate}
                      </td>
                      <td className="px-6 py-10 text-center font-black text-xl italic">
                        ৳{design.pataRate || 0}
                      </td>
                      <td className="px-6 py-10 text-center font-black text-xl italic text-emerald-500">
                        ৳{design.sellingPrice}
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditDesignModal({ ...design, index: idx });
                              setTempImgUrl(design.image);
                            }}
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-black transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDesign(idx)}
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
            <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                Personal Security
              </h3>
            </div>
            <div className="p-12 max-w-2xl mx-auto space-y-10">
              <div className="bg-slate-50 p-10 rounded-[4rem] border-2 border-slate-100 flex items-center gap-8">
                <div className="w-20 h-20 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-4xl italic shadow-xl">
                  {currentUser?.id?.[0]}
                </div>
                <div>
                  <h4 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                    {currentUser?.name}
                  </h4>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2">
                    ID: {currentUser?.id} • ROLE: {currentUser?.role}
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const newPass = e.target.newPass.value;
                  const confirmPass = e.target.confirmPass.value;
                  if (newPass !== confirmPass)
                    return alert("Passwords do not match");

                  const userIdx = masterData.users.findIndex(
                    (u) => u.id === currentUser.id,
                  );
                  handleUpdateUser(userIdx, { password: newPass });
                  e.target.reset();
                }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <label className="bg-black text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg ml-5">
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      name="newPass"
                      type={showProfilePass ? "text" : "password"}
                      className="form-input text-lg tracking-[0.4em] py-5 bg-slate-50 border-slate-100 focus:border-black text-black pr-16"
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePass(!showProfilePass)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
                    >
                      {showProfilePass ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="bg-black text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase italic tracking-widest inline-block mb-2 shadow-lg ml-5">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPass"
                      type={showProfilePass ? "text" : "password"}
                      className="form-input text-lg tracking-[0.4em] py-5 bg-slate-50 border-slate-100 focus:border-black text-black pr-16"
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePass(!showProfilePass)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
                    >
                      {showProfilePass ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-xl border-b-8 border-zinc-900 transition-all hover:translate-y-[-4px]"
                >
                  Update Security Settings
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
            <div className="p-12 border-b-2 border-slate-50 flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                User Directory
              </h3>
              <button
                onClick={() => setShowAddModal("user")}
                className="p-6 bg-black text-white rounded-3xl shadow-xl hover:rotate-12 transition-transform"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {masterData.users?.map((u, idx) => {
                const isEditing = editingItem === `user-${idx}`;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 p-10 rounded-[4rem] border-2 border-slate-100 italic relative group shadow-inner min-h-[300px] flex flex-col justify-between"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          id={`edit-user-id-${idx}`}
                          className="form-input py-4 text-xs font-black bg-white uppercase"
                          defaultValue={u.id}
                          placeholder="USER ID"
                        />
                        <input
                          id={`edit-user-name-${idx}`}
                          className="form-input py-4 text-xs font-black bg-white"
                          defaultValue={u.name}
                          placeholder="NAME"
                        />
                        <div className="relative">
                          <input
                            id={`edit-user-pass-${idx}`}
                            type={showUserPass ? "text" : "password"}
                            className="form-input py-4 text-xs font-black bg-white tracking-widest pr-10"
                            defaultValue={u.password}
                            placeholder="PASSWORD"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUserPass(!showUserPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                          >
                            {showUserPass ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                        <select
                          id={`edit-user-role-${idx}`}
                          className="form-input py-4 text-xs font-black bg-white"
                          defaultValue={u.role}
                        >
                          <option value="worker">WORKER</option>
                          <option value="manager">MANAGER</option>
                          <option value="admin">ADMIN</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(null)}
                            className="flex-1 bg-white text-slate-400 py-3 rounded-2xl font-black text-[10px] uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateUser(idx, {
                                id: document
                                  .getElementById(`edit-user-id-${idx}`)
                                  .value.toUpperCase(),
                                name: document.getElementById(
                                  `edit-user-name-${idx}`,
                                ).value,
                                password: document.getElementById(
                                  `edit-user-pass-${idx}`,
                                ).value,
                                role: document.getElementById(
                                  `edit-user-role-${idx}`,
                                ).value,
                              })
                            }
                            className="flex-[2] bg-black text-white py-3 rounded-2xl font-black text-[10px] uppercase"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <span
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === "admin" ? "bg-black text-white" : "bg-white text-slate-400"}`}
                          >
                            {u.role}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingItem(`user-${idx}`)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-black transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            {u.id !== "NRZO0NE" && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-rose-300 hover:text-rose-500 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                            {u.name}
                          </h4>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2">
                            {u.id}
                          </p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-200/50 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                              ACCESS KEY
                            </p>
                            <p className="font-black tracking-[0.3em] text-slate-400">
                              ••••••
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "colors" && (
          <ListSection
            category="colors"
            title="COLOR PALETTE"
            items={masterData.colors}
            icon={<LayoutGrid />}
          />
        )}
        {activeTab === "sizes" && (
          <ListSection
            category="sizes"
            title="SIZE REPOSITORY"
            items={masterData.sizes}
            icon={<LayoutGrid />}
          />
        )}
        {activeTab === "cutters" && (
          <ListSection
            category="cutters"
            title="MASTER REPOSITORY"
            items={masterData.cutters}
            icon={<Scissors />}
          />
        )}

        {activeTab === "pata" && (
          <div className="space-y-12">
            <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
              <div className="p-12 border-b-2 border-slate-50 flex items-center justify-between">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                  Pata Rate Matrix
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest italic">
                  PRICING ARCHIVE
                </p>
              </div>
              <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {masterData.pataTypes?.map((type) => (
                  <div
                    key={type}
                    className="bg-slate-50 p-10 rounded-[3.5rem] flex flex-col justify-between shadow-inner h-64"
                  >
                    <p className="font-black text-2xl uppercase tracking-tighter mb-8 italic">
                      {type}
                    </p>
                    <div className="flex items-end gap-5 pt-8 border-t-2 border-slate-100">
                      <div className="flex-1">
                        <p className="text-[10px] opacity-20 font-black italic uppercase mb-2">
                          YIELD RATE
                        </p>
                        <input
                          type="number"
                          defaultValue={masterData.pataRates?.[type] || 0}
                          className="bg-transparent text-5xl font-black text-black text-left w-full outline-none italic leading-none"
                          onBlur={(e) => {
                            setMasterData((prev) => ({
                              ...prev,
                              pataRates: {
                                ...prev.pataRates,
                                [type]: Number(e.target.value) || 0,
                              },
                            }));
                          }}
                        />
                      </div>
                      <div className="text-3xl font-black opacity-10 italic">
                        ৳
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ListSection
              category="pataTypes"
              title="Pata Taxonomy"
              items={masterData.pataTypes}
              icon={<LayoutGrid />}
            />
          </div>
        )}

        {activeTab === "database" && (
          <div className="space-y-12">
            {/* Pro Backup Section */}
            <div className="bg-black text-white rounded-[5rem] p-12 sm:p-20 shadow-3xl text-center italic relative overflow-hidden group border-[10px] border-white/5">
              <div className="relative z-10">
                <h3 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-6">
                  Pro Secure Backup
                </h3>
                <p className="text-slate-400 text-sm sm:text-lg mb-12 uppercase tracking-widest max-w-2xl mx-auto">
                  ডাটাবেজ নিরাপদ রাখতে ব্যাকআপ ফাইল ডাউনলোড করে রাখুন। ফোন
                  হারিয়ে গেলে বা ডাটা মুছে গেলে এটি দিয়ে ১ সেকেন্ডে সব ফেরত আনা
                  যাবে।
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button
                    onClick={handleBackup}
                    className="bg-white text-black px-12 py-8 rounded-full font-black uppercase text-xs tracking-[0.4em] hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-4"
                  >
                    <Download size={20} /> Download Backup
                  </button>

                  <label className="bg-indigo-600 text-white px-12 py-8 rounded-full font-black uppercase text-xs tracking-[0.4em] hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-4 cursor-pointer">
                    <Upload size={20} /> Restore From File
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-hidden italic text-black">
              <div className="p-12 border-b-2 border-slate-50 flex items-center justify-between">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                  Database Maintenance
                </h3>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse uppercase tracking-[0.2em]">
                    Danger Zone
                  </span>
                </div>
              </div>
              <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                {[
                  {
                    label: "Production Logs",
                    key: "productions",
                    desc: "Factory work entries",
                  },
                  {
                    label: "Cutting Queue",
                    key: "cuttingStock",
                    desc: "Raw stock inputs",
                  },
                  {
                    label: "Pata Hub Logs",
                    key: "pataEntries",
                    desc: "Pata unit entries",
                  },
                  {
                    label: "Inventory Data",
                    key: "rawInventory",
                    desc: "Fabric movement logs",
                  },
                  {
                    label: "Delivery Data",
                    key: "deliveries",
                    desc: "Finished goods history",
                  },
                  {
                    label: "Staff Attendance",
                    key: "attendance",
                    desc: "Daily attendance records",
                  },
                ].map((dbItem) => (
                  <div
                    key={dbItem.key}
                    className="bg-slate-50 p-10 rounded-[4rem] border-2 border-slate-100 flex flex-col justify-between group hover:border-rose-500 transition-all shadow-inner min-h-[200px]"
                  >
                    <div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter italic leading-none group-hover:text-rose-600 transition-colors">
                        {dbItem.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-4 italic">
                        {dbItem.desc}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-8">
                      <p className="text-2xl font-black italic">
                        {masterData[dbItem.key]?.length || 0}{" "}
                        <span className="text-[8px] text-slate-500">ITEMS</span>
                      </p>
                      <button
                        onClick={() => {
                          if (confirm(`Wipe all ${dbItem.label}?`)) {
                            setMasterData((prev) => ({
                              ...prev,
                              [dbItem.key]: [],
                            }));
                            showNotify("Cleared successfully");
                          }
                        }}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-md hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal === "user" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xl z-[200] flex items-center justify-center p-3 md:p-4 text-black italic">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[5rem] border-4 border-slate-50 shadow-2xl overflow-y-auto max-h-[96vh] p-8 md:p-16 space-y-8 md:space-y-12">
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase italic mb-2">
                নতুন ইউজার
              </h3>
              <p className="text-xl font-black tracking-widest text-slate-200 italic">
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
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-400"
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
              <p className="text-xl font-black tracking-widest text-slate-200 italic">
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
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-400"
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
              <p className="text-xl font-black tracking-widest text-slate-200 italic">
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
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-400"
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
              <p className="text-xl font-black tracking-widest text-slate-200 italic">
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
                    className="form-input py-4 text-center font-black bg-white border-slate-100 placeholder:text-slate-200"
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
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-400"
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
              <p className="text-xl font-black tracking-widest text-slate-200 italic">
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
                  className="flex-1 py-10 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-400"
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
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
                        <ImageIcon size={30} className="text-slate-200" />
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
                      <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-black transition-colors">
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
                        <ImageIcon size={30} className="text-slate-200" />
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
                      <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-black transition-colors">
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
                className="flex-1 py-6 rounded-full font-black text-sm uppercase bg-slate-50 text-slate-400"
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                  <img
                    src={logoBlack}
                    alt="NRZO0NE"
                    className="w-16 h-16 object-contain mix-blend-multiply"
                  />
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
                  <p className="text-[9px] font-black uppercase text-slate-400">
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
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
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
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2">
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

              {/* Signature */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
                <div>
                  <div className="w-32 h-px bg-black mb-2"></div>
                  <p className="text-[9px] font-black uppercase text-slate-400">
                    কর্মীর স্বাক্ষর
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-px bg-black mb-2 ml-auto"></div>
                  <p className="text-[9px] font-black uppercase text-slate-400">
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
