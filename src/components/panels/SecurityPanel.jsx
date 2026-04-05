import React from 'react';
import { Shield, Clock, User, Activity, AlertCircle, ArrowLeft, Search } from 'lucide-react';

const SecurityPanel = ({ masterData, setActivePanel, t, logs = [] }) => {
    return (
        <div className="space-y-12 pb-24 animate-fade-up px-4 italic font-outfit text-black">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setActivePanel('Overview')}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Security <span className="text-slate-500">& Integrity</span></h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Operation Audit Trail Hub</p>
                    </div>
                </div>
                <div className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <Shield size={16} /> Total Logs: {logs.length}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                 {[
                    { label: 'Authorized Session', value: 'Active', icon: <User size={24} />, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'System Integrity', value: 'Secured', icon: <Shield size={24} />, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Audit Density', value: logs.length + ' Events', icon: <Activity size={24} />, color: 'bg-slate-50 text-slate-600' }
                 ].map((stat, i) => (
                    <div key={i} className="p-10 bg-white rounded-[3rem] border-4 border-slate-50 flex items-center gap-8 shadow-xl">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${stat.color} shadow-inner`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-3xl font-black italic tracking-tighter leading-none mb-2">{stat.value}</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                 ))}
            </div>

            <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-3xl overflow-hidden relative">
                <div className="p-12 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-8 md:items-center">
                    <div className="flex items-center gap-4">
                        <Clock size={24} className="text-slate-500" />
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Full Audit Trail</h3>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="SEARCH LOGS..." 
                            className="bg-white pl-16 pr-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 focus:border-black outline-none w-full md:w-80 shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">
                            <tr>
                                <th className="px-12 py-6">Timeline</th>
                                <th className="px-8 py-6">User Identity</th>
                                <th className="px-8 py-6">Action Category</th>
                                <th className="px-8 py-6">Modification Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-24 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <AlertCircle size={64} strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-widest mt-6">Zero Logs Recorded</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, i) => {
                                    const logDate = log.timestamp ? new Date(log.timestamp) : null;
                                    const timeStr = logDate ? logDate.toLocaleTimeString() : (log.time || 'N/A');
                                    const dateStr = logDate ? logDate.toLocaleDateString('en-GB') : (log.date || 'N/A');
                                    
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-12 py-10">
                                                <p className="text-sm font-black italic mb-1">{timeStr}</p>
                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{dateStr}</p>
                                            </td>
                                            <td className="px-8 py-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-xs font-black italic">{log.user ? log.user[0] : 'S'}</div>
                                                    <p className="text-sm font-black uppercase italic tracking-tight">{log.user || 'System'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-10">
                                                <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest group-hover:bg-black group-hover:text-white transition-all">{log.action || log.type}</span>
                                            </td>
                                            <td className="px-8 py-10">
                                                <p className="text-xs font-black italic text-slate-600 tracking-tight leading-relaxed lg:max-w-md">{log.details || log.detail}</p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SecurityPanel;
