import React from 'react';
import { Shield, Clock, User, Activity, AlertCircle, ArrowLeft, Search, Database } from 'lucide-react';

const SecurityPanel = ({ masterData, setActivePanel, t, logs = [], syncStatus }) => {
    const [searchTerm, setSearchTerm] = React.useState("");

    return (
        <div className="space-y-8 pb-24 animate-fade-up px-1 md:px-2 text-black">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setActivePanel('Overview')}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-950 hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white uppercase leading-none">সিকিউরিটি ও <span className="text-blue-600">অডিট লগ</span></h2>
                        <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest italic leading-none mt-1">Audit Trail & System Integrity Hub</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm border border-slate-100 dark:border-slate-800 flex-1 md:flex-none">
                        <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">
                            {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : 'Neural Link Stable'}
                        </p>
                    </div>
                    <div className="bg-slate-950 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg">
                        <Database size={14} /> মোট লগ (Logs): {logs.length}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 {[
                    { label: 'Authorized Session', value: 'সক্রিয় (Active)', icon: <User size={24} />, color: 'bg-blue-50 text-blue-600' },
                    { label: 'System Integrity', value: 'সুরক্ষিত (Secured)', icon: <Shield size={24} />, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Audit Density', value: logs.length + ' ইভেন্ট', icon: <Activity size={24} />, color: 'bg-slate-50 text-black dark:bg-slate-800 dark:text-white' }
                 ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-6 shadow-sm group">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.color} shadow-inner transition-transform group-hover:scale-110`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-bold tracking-tight text-black dark:text-white leading-none mb-1 uppercase">{stat.value}</p>
                            <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest leading-none">{stat.label}</p>
                        </div>
                    </div>
                 ))}
            </div>

            {/* Audit Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-6 md:items-center bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                        <Clock size={20} className="text-black dark:text-white" />
                        <h3 className="text-lg font-bold uppercase tracking-tight text-black dark:text-white">সিস্টেম অডিট ট্রেইল (Full Audit Trail)</h3>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white" size={14} />
                        <input 
                            type="text" 
                            placeholder="অডিট সার্চ করুন (Search)..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="premium-input !pl-12 !h-11 !text-[10px] !bg-white dark:!bg-slate-900 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-black dark:text-white border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-8 py-5">সময়রেখা (Timeline)</th>
                                <th className="px-6 py-5">কারিগর/ইউজার (Identity)</th>
                                <th className="px-6 py-5">অ্যাকশন (Action)</th>
                                <th className="px-8 py-5">বিস্তারিত (Details)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(logs || []).filter(log => {
                                if(!searchTerm) return true;
                                const s = searchTerm.toLowerCase();
                                return (log.user || "").toLowerCase().includes(s) || 
                                       (log.action || "").toLowerCase().includes(s) || 
                                       (log.details || "").toLowerCase().includes(s);
                            }).length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-32 text-center">
                                        <div className="flex flex-col items-center opacity-10">
                                             <AlertCircle size={64} strokeWidth={1} />
                                             <p className="text-[10px] font-bold uppercase tracking-widest mt-6">কোনো অডিট লগ পাওয়া যায়নি (Zero Logs)</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                (logs || []).filter(log => {
                                    const s = searchTerm.toLowerCase();
                                    return (log.user || "").toLowerCase().includes(s) || 
                                           (log.action || "").toLowerCase().includes(s) || 
                                           (log.details || "").toLowerCase().includes(s);
                                }).slice(0, 100).map((log, i) => {
                                    const logDate = log.timestamp ? new Date(log.timestamp) : null;
                                    const timeStr = logDate ? logDate.toLocaleTimeString() : (log.time || 'N/A');
                                    const dateStr = logDate ? logDate.toLocaleDateString('en-GB') : (log.date || 'N/A');
                                    
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-black dark:text-white leading-none mb-1">{timeStr}</p>
                                                <p className="text-[9px] font-bold uppercase text-black dark:text-white tracking-widest leading-none">{dateStr}</p>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-950 text-white rounded-lg flex items-center justify-center text-xs font-bold uppercase">
                                                        {log.user ? log.user[0] : 'S'}
                                                    </div>
                                                    <p className="text-sm font-bold uppercase text-black dark:text-white">{log.user || 'SYSTEM'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-bold uppercase tracking-widest text-black dark:text-white group-hover:bg-slate-950 group-hover:text-white transition-all">
                                                    {log.action || log.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-medium text-black dark:text-white tracking-tight leading-relaxed lg:max-w-md italic">
                                                    {log.details || log.detail}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {logs.length > 100 && (
                    <div className="p-6 text-center bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest italic">Showing latest 100 audit entries</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityPanel;

