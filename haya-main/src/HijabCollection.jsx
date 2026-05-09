import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    ShoppingBag,
    Phone,
    MapPin,
    ChevronRight,
    Star,
    CheckCircle2,
    Truck,
    ShieldCheck,
    Headphones,
    ArrowRight,
    Minus,
    Plus,
    Sparkles,
    Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL } from './config';
import { useCart } from './CartContext';

const HijabCollection = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    
    const [selectedColor, setSelectedColor] = useState('Black');
    const [selectedSize, setSelectedSize] = useState('72 Inchi (Majhari)');
    const [quantity, setQuantity] = useState(1);
    const [deliveryArea, setDeliveryArea] = useState('inside');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    
    const orderFormRef = useRef(null);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', note: '' });

    const hijabSizes = [
        { id: '40', label: '40 Inchi (Choto)', price: 250 },
        { id: '72', label: '72 Inchi (Majhari)', price: 450 },
        { id: '80', label: '80 Inchi (Boro)', price: 650 }
    ];

    const colors = [
        { name: 'Black', class: 'bg-black' },
        { name: 'Maroon', class: 'bg-[#800000]' },
        { name: 'Olive', class: 'bg-[#556B2F]' },
        { name: 'Navy', class: 'bg-[#1E3A8A]' },
        { name: 'Grey', class: 'bg-[#808080]' },
        { name: 'Brown', class: 'bg-[#A52A2A]' },
        { name: 'Purple', class: 'bg-[#800080]' },
        { name: 'White', class: 'bg-white border' }
    ];

    const deliveryCharges = { inside: 80, outside: 150 };

    const currentSizeObj = hijabSizes.find(s => s.label === selectedSize) || hijabSizes[1];
    const currentPrice = currentSizeObj.price * quantity;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const scrollToForm = () => orderFormRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        const orderData = {
            ...formData,
            landingPage: 'Hijab Collection',
            productType: `Hijab (${selectedSize})`,
            color: selectedColor,
            size: selectedSize,
            quantity,
            price: currentPrice,
            deliveryCharge: deliveryCharges[deliveryArea],
            total: currentTotal,
            status: 'pending',
            date: new Date().toLocaleDateString('en-GB'),
            createdAt: serverTimestamp()
        };

        try {
            setIsSubmitting(true);
            setOrderSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsSubmitting(false);

            if (GOOGLE_SHEET_URL) {
                const sheetData = { ...orderData };
                delete sheetData.createdAt;
                const params = new URLSearchParams(sheetData).toString();
                fetch(`${GOOGLE_SHEET_URL}?${params}`, { method: 'GET', mode: 'no-cors' }).catch(e => console.error(e));
            }
            addDoc(collection(db, "orders"), orderData).catch(e => console.error(e));
            
            if (SMS_API_KEY && SMS_API_KEY !== 'VoYeTuiZ7OH6ZW1rLFZf') {
                const formattedNumber = formData.phone.trim().startsWith('88') ? formData.phone.trim() : `88${formData.phone.trim()}`;
                const smsMessage = `প্রিয় ${formData.name}, NRZOONE এ আপনার হিজাব অর্ডারটি গ্রহণ করা হয়েছে। শীঘ্রই আমরা কল করবো। ধন্যবাদ!`;
                fetch(`${SMS_API_URL}?api_key=${encodeURIComponent(SMS_API_KEY)}&type=text&number=${encodeURIComponent(formattedNumber)}&senderid=${encodeURIComponent(SMS_SENDER_ID || '')}&message=${encodeURIComponent(smsMessage)}`, { mode: 'no-cors' }).catch(e => console.error(e));
            }
        } catch (error) {
            console.error(error);
            alert('দুঃখিত, সমস্যা হয়েছে।');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-bengali text-slate-900 overflow-x-hidden">
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center border-b shadow-sm">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
                    <img src="/logo-dark.png" alt="NRzone" className="h-[40px] md:h-[50px] object-contain" />
                </div>
                <button onClick={scrollToForm} className="bg-slate-900 text-white px-8 py-2.5 rounded-full font-bold hover:bg-slate-700 transition-all shadow-lg text-sm">অর্ডার দিন</button>
            </nav>

            <section className="relative pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                            <Sparkles size={16} /> Premium Hijab Collection
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
                            আপনার মডেস্টিকে দিন <br />
                            <span className="text-blue-600">নতুন মাত্রা</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                            প্রিমিয়াম দুবাই চেরি ও জর্জেট ফেব্রিকের তৈরি আমাদের হিজাবগুলো আপনাকে দেবে সর্বোচ্চ আরাম এবং আভিজাত্য। ৩টি ক্যাটাগরিতে পাওয়া যাচ্ছে।
                        </p>
                        <div className="flex flex-wrap gap-6 pt-4">
                            <button onClick={scrollToForm} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all active:scale-95">অর্ডার করুন এখনই</button>
                            <div className="flex flex-col justify-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Price Starts From</p>
                                <p className="text-3xl font-black">৳ ২৫০ <span className="text-sm font-bold text-slate-300 line-through ml-2">৳ ৩৫০</span></p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 relative">
                         <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white aspect-[4/5] bg-slate-100 flex items-center justify-center">
                            <div className="text-center p-12">
                                <ImageIcon size={80} className="mx-auto text-slate-200 mb-6" />
                                <p className="text-slate-400 font-black uppercase tracking-widest">Premium Hijab Preview</p>
                            </div>
                            <div className="absolute top-8 right-8 bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">Hot Selection</div>
                         </div>
                    </motion.div>
                </div>
            </section>

            <section id="products" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase">আমাদের ৩টি বিশেষ সাইজ</h2>
                        <div className="w-24 h-3 bg-blue-600 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {hijabSizes.map((size) => (
                            <motion.div key={size.id} whileHover={{ y: -15 }} className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col text-center space-y-6">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <ShoppingBag size={40} className="text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-black">{size.label}</h3>
                                <p className="text-4xl font-black text-blue-600">৳ {size.price}</p>
                                <button
                                    onClick={() => {
                                        setSelectedSize(size.label);
                                        scrollToForm();
                                    }}
                                    className="bg-white text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                                >
                                    Select Size
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section ref={orderFormRef} className="py-24 px-6 bg-slate-900 text-white">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row rounded-[4rem] overflow-hidden border border-white/10 shadow-3xl bg-slate-800">
                    <div className="md:w-1/2 p-12 lg:p-16 space-y-10">
                        <h2 className="text-4xl font-black tracking-tight leading-none uppercase">অর্ডার কনফার্ম করুন</h2>
                        <div className="space-y-6 pt-10 border-t border-white/10">
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl"><span className="text-xs font-black uppercase text-white/40">সাইজ:</span><span className="font-black text-xl">{selectedSize}</span></div>
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl"><span className="text-xs font-black uppercase text-white/40">কালার:</span><span className="font-black text-xl">{selectedColor}</span></div>
                            <div className="flex justify-between items-center bg-blue-600 p-6 rounded-2xl shadow-xl mt-12"><span className="font-black text-lg uppercase">টোটাল (চার্জসহ):</span><span className="font-black text-3xl">৳ {currentTotal}</span></div>
                        </div>
                    </div>

                    <div className="flex-1 p-12 lg:p-16 bg-white text-slate-900">
                        <form onSubmit={handleOrderSubmit} className="space-y-6">
                            <input required className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-600 transition-all" placeholder="আপনার নাম" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            <input required className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-600 transition-all" placeholder="মোবাইল নম্বর" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            <textarea required className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-blue-600 transition-all min-h-[120px]" placeholder="ডেলিভারি ঠিকানা" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">পছন্দমতো কালারটি সিলেক্ট করুন:</p>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map(c => (
                                        <div key={c.name} onClick={() => setSelectedColor(c.name)} className={`w-10 h-10 rounded-full cursor-pointer transition-all ${selectedColor === c.name ? 'ring-4 ring-blue-600 scale-110' : 'opacity-60'} ${c.class}`} title={c.name}></div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setDeliveryArea('inside')} className={`p-4 rounded-2xl border-2 font-black text-sm uppercase transition-all ${deliveryArea === 'inside' ? 'bg-slate-900 text-white' : 'border-slate-100'}`}>ঢাকার ভিতরে</button>
                                <button type="button" onClick={() => setDeliveryArea('outside')} className={`p-4 rounded-2xl border-2 font-black text-sm uppercase transition-all ${deliveryArea === 'outside' ? 'bg-slate-900 text-white' : 'border-slate-100'}`}>ঢাকার বাইরে</button>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-2xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">অর্ডার কনফার্ম করুন</button>
                        </form>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {orderSuccess && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[4rem] p-12 max-w-lg w-full text-center shadow-3xl">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 size={50} className="text-blue-600" /></div>
                            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">অর্ডার সফল হয়েছে!</h2>
                            <p className="text-lg text-slate-500 font-bold mb-10 leading-relaxed">আমরা শীঘ্রই আপনাকে কল করে <br/> অর্ডারটি কনফার্ম করব। ইনশাআল্লাহ!</p>
                            <button onClick={() => setOrderSuccess(false)} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xl uppercase tracking-widest">ঠিক আছে</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HijabCollection;
