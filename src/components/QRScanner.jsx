import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, ShieldAlert } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);
    const [scannedItems, setScannedItems] = React.useState([]);
    const [isBulk, setIsBulk] = React.useState(false);

    const isBulkRef = useRef(isBulk);
    const scannedItemsRef = useRef(scannedItems);

    useEffect(() => {
        isBulkRef.current = isBulk;
        scannedItemsRef.current = scannedItems;
    }, [isBulk, scannedItems]);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                if (!isBulkRef.current) {
                    scanner.clear().then(() => {
                        onScanSuccess(decodedText);
                        onClose();
                    }).catch(err => {
                        console.error("Failed to clear scanner:", err);
                        onScanSuccess(decodedText);
                        onClose();
                    });
                } else {
                    if (!scannedItemsRef.current.includes(decodedText)) {
                        setScannedItems(prev => [decodedText, ...prev]);
                        onScanSuccess(decodedText); // Notify parent but keep scanning
                    }
                }
            },
            (errorMessage) => {
                // parse error, ignore it
            }
        );

        return () => {
            scanner.clear().catch(err => console.error("Scanner cleanup failed", err));
        };
    }, [onScanSuccess, onClose]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
            <style dangerouslySetInnerHTML={{ __html: `
                #reader { border: none !important; }
                #reader__scan_region { background: white; border-radius: 2rem; overflow: hidden; }
                #reader__dashboard { padding: 2rem !important; font-family: 'Outfit', sans-serif; }
                #reader__dashboard_section_csr button { 
                    background: black !important; 
                    color: white !important; 
                    border: none !important; 
                    padding: 0.8rem 1.5rem !important; 
                    border-radius: 1rem !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    font-size: 0.7rem !important;
                    letter-spacing: 0.1em !important;
                }
                #reader__status_span { font-weight: 900 !important; text-transform: uppercase !important; font-size: 0.6rem !important; }
            `}} />
            
            <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative border-4 border-white/20">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                            <Camera size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter">QR Scanner</h2>
                            <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">NRZO0NE Core Intelligence</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-50 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-8 bg-slate-50 flex flex-col gap-6">
                    <div id="reader" className="rounded-3xl overflow-hidden shadow-inner bg-white border-2 border-slate-100" />
                    
                    <button 
                        onClick={() => setIsBulk(!isBulk)}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${isBulk ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 hover:text-black'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isBulk ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                        Bulk Batch Mode: {isBulk ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div className="p-8 bg-white border-t border-slate-50">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={14} className={isBulk ? "text-emerald-500" : "text-amber-500"} />
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic">{isBulk ? "Multiple Scans Active" : "Single Item Session"}</p>
                        </div>
                        {isBulk && <span className="text-[10px] font-black text-emerald-500 uppercase">{scannedItems.length} Scanned</span>}
                    </div>

                    {isBulk && scannedItems.length > 0 && (
                        <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {scannedItems.map((item, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center animate-fade-up">
                                    <p className="text-[10px] font-black italic tracking-tighter truncate max-w-[200px]">LOT #{item}</p>
                                    <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase italic">Captured</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
