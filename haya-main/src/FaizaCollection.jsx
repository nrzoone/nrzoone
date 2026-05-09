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
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL } from './config';
import { useCart } from './CartContext';

const FaizaCollection = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState('কালো');

    const heroImages = {
        'নীল': '/faiza_blue.jpg',
        'কালো': '/faiza_black.jpg',
        'অলিভ': '/faiza_olive.jpg',
        'মেরুন': '/faiza_maroon.jpg',
        'কফি': '/faiza_coffee.jpg',
        'default': '/faiza_black.jpg'
    };

    const currentHeroImage = heroImages[selectedColor] || heroImages['default'];
    const [selectedSize, setSelectedSize] = useState('৫২');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    const sizes = ['৫০', '৫২', '৫৪', '৫৬'];
    const orderFormRef = useRef(null);

    const prices = {
        single: 890,
        withHijab: 1150
    };

    const deliveryCharges = {
        inside: 80,
        outside: 150
    };

    const colors = [
        { name: 'কালো', class: 'bg-black' },
        { name: 'নীল', class: 'bg-[#1E3A8A]' },
        { name: 'অলিভ', class: 'bg-[#556B2F]' },
        { name: 'মেরুন', class: 'bg-[#800000]' },
        { name: 'কফি', class: 'bg-[#4B3621]' }
    ];

    const [hasHijab, setHasHijab] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [deliveryArea, setDeliveryArea] = useState('inside');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const scrollToForm = () => {
        orderFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const itemPrice = hasHijab ? prices.withHijab : prices.single;
    const currentPrice = itemPrice * quantity;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        const orderData = {
            ...formData,
            landingPage: 'Faiza Borka',
            productType: hasHijab ? 'বোরকা + হিজাব' : 'শুধুমাত্র বোরকা',
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
            window.alert("অর্ডার প্রসেস হচ্ছে, দয়া করে ১ সেকেন্ড অপেক্ষা করুন...");
            setIsSubmitting(true);

            // OPTIMISTIC UPDATE: Show success modal immediately
            setOrderSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsSubmitting(false);

            // BACKGROUND SYNC
            // 1. Submit to Google Sheets (Exclude Firebase-specific objects)
            if (GOOGLE_SHEET_URL) {
                const sheetData = { ...orderData };
                delete sheetData.createdAt;
                const params = new URLSearchParams(sheetData).toString();
                fetch(`${GOOGLE_SHEET_URL}?${params}`, { method: 'GET', mode: 'no-cors' })
                    .catch(err => console.error("Sheets Sync Error:", err));
            }

            // 2. Submit to Firebase
            addDoc(collection(db, "orders"), orderData).catch(err => console.error("Firebase Error:", err));

            // 4. Automated SMS Notification
            if (SMS_API_KEY && SMS_API_KEY !== 'VoYeTuiZ7OH6ZW1rLFZf' && SMS_API_KEY !== 'PASTE_YOUR_API_KEY_HERE') {
                const formattedNumber = formData.phone.trim().startsWith('88') ? formData.phone.trim() : `88${formData.phone.trim()}`;
                const smsMessage = `প্রিয় ${formData.name}, NRZOONE এ আপনার ফাইজা বোরকা অর্ডারটি গ্রহণ করা হয়েছে। শীঘ্রই আমরা আপনাকে কল করবো। ধন্যবাদ!`;
                fetch(`${SMS_API_URL}?api_key=${encodeURIComponent(SMS_API_KEY)}&type=text&number=${encodeURIComponent(formattedNumber)}&senderid=${encodeURIComponent(SMS_SENDER_ID || '')}&message=${encodeURIComponent(smsMessage)}`, { mode: 'no-cors' })
                    .catch(err => console.error("SMS Error:", err));
            }

            return; // Success flow handled above
        } catch (error) {
            console.error("Order Submission Error:", error);
            alert('দুঃখিত, অর্ডারটি সম্পন্ন করতে সমস্যা হচ্ছে। অনুগ্রহ করে ফোন করে অর্ডার দিন।');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-bengali text-[#2D2D2D] overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center border-b border-gray-100">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
                    <img src="/logo-dark.png" alt="NRzone Logo" className="h-[40px] md:h-[50px] object-contain" onError={(e)=>{e.target.style.display='none';}} />
                </div>
                <button
                    onClick={scrollToForm}
                    className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-neutral-800 transition-all shadow-lg text-sm md:text-base"
                >
                    অর্ডার দিন
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 md:pt-32 md:pb-24 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 space-y-6 text-center md:text-left"
                    >
                        <div className="inline-flex items-center gap-2 bg-neutral-100 text-black px-4 py-1 rounded-full text-sm font-bold">
                            <Sparkles size={16} /> ফাইজা কালেকশন
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black leading-tight text-[#1A1A1A]">
                            ফাইজা বোরকা <br />
                            <span className="text-black">প্রিমিয়াম চেরি ফ্যাব্রিক</span>
                        </h1>
                        <div className="space-y-2 text-lg text-gray-600">
                            <p>👉 প্রিমিয়াম দুবাই চেরি কাপড়ের বোরকা</p>
                            <p>👉 গর্জিয়াস স্টোনের ডিজাইন করা</p>
                            <p>👉 হিজাবসহ অথবা সিঙ্গেল অর্ডার করার সুবিধা</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                            <button
                                onClick={scrollToForm}
                                className="bg-black text-white px-10 py-4 rounded-2xl font-bold text-xl hover:shadow-2xl hover:bg-neutral-800 transition-all shadow-xl shadow-black/10"
                            >
                                এখনই অর্ডার করুন
                            </button>
                            <div className="flex flex-col justify-center">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">অফার মূল্য</p>
                                <p className="text-3xl font-black text-black">৳ ৮৯০ <span className="text-base font-medium text-gray-400 line-through ml-2">৳ ১২৫০</span></p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 relative"
                    >
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group">
                            <img src={currentHeroImage} alt="Faiza Borka" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl">
                                <p className="text-xs font-bold text-gray-400 mb-1">এভেলেবল কালার</p>
                                <div className="flex gap-2">
                                    {colors.map(c => (
                                        <div
                                            key={c.name}
                                            onClick={() => setSelectedColor(c.name)}
                                            className={`w-6 h-6 rounded-full cursor-pointer border-2 ${selectedColor === c.name ? 'border-black scale-125' : 'border-transparent'} ${c.class} transition-all`}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Product Grid - Selection */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">আপনার পছন্দেরটি কিনুন</h2>
                        <div className="w-24 h-2 bg-black mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {colors.map((color) => {
                            const [withHijab, setWithHijab] = useState(false);
                            const price = withHijab ? prices.withHijab : prices.single;

                            return (
                                <motion.div
                                    key={color.name}
                                    whileHover={{ y: -10 }}
                                    className="bg-[#FDFBF7] rounded-3xl overflow-hidden border border-gray-100 shadow-xl flex flex-col"
                                >
                                    <div className="aspect-[4/5] relative overflow-hidden">
                                        <img src={heroImages[color.name]} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-4 left-4 bg-white/90 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                                            {color.name}
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                                        <h3 className="text-2xl font-bold">ফাইজা বোরকা - {color.name}</h3>

                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-gray-400 uppercase">প্যাকেজ সিলেক্ট করুন:</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                <button
                                                    onClick={() => setWithHijab(false)}
                                                    className={`p-3 rounded-xl border-2 text-left font-bold transition-all ${!withHijab ? 'border-black bg-black/5' : 'border-gray-100'}`}
                                                >
                                                    বোরকা সিঙ্গেল (৳ ৮৯০)
                                                </button>
                                                <button
                                                    onClick={() => setWithHijab(true)}
                                                    className={`p-3 rounded-xl border-2 text-left font-bold transition-all ${withHijab ? 'border-black bg-black/5' : 'border-gray-100'}`}
                                                >
                                                    বোরকা + হিজাব (৳ ১১৫০)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 mt-auto">
                                            <button
                                                onClick={() => {
                                                    addToCart({
                                                        id: `faiza_${color.name}_${withHijab ? 'with_hijab' : 'no_hijab'}`,
                                                        name: `ফাইজা বোরকা - ${color.name} ${withHijab ? '(হিজাবসহ)' : '(সিঙ্গেল)'}`,
                                                        color: color.name,
                                                        size: selectedSize,
                                                        price: price,
                                                        quantity: 1,
                                                        image: heroImages[color.name]
                                                    });
                                                }}
                                                className="w-full bg-white text-black border-2 border-black py-3 rounded-2xl font-bold hover:bg-neutral-100 transition-all shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <ShoppingBag size={20} /> কার্টে যোগ করুন
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedColor(color.name);
                                                    setHasHijab(withHijab);
                                                    scrollToForm();
                                                }}
                                                className="w-full bg-black text-white py-3 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg"
                                            >
                                                অর্ডার করুন
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Order Form */}
            <section ref={orderFormRef} className="py-24 px-6 bg-[#3A5A40]/5">
                <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white">
                    <div className="md:w-[40%] bg-black text-white p-12 space-y-8">
                        <h2 className="text-4xl font-black leading-tight">অর্ডার কনফার্ম করুন</h2>
                        <div className="space-y-4 pt-8">
                            <div className="flex justify-between items-center text-lg border-b border-white/10 pb-4">
                                <span className="opacity-70">কালার:</span>
                                <span className="font-bold">{selectedColor}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg border-b border-white/10 pb-4">
                                <span className="opacity-70">প্যাকেজ:</span>
                                <span className="font-bold">{hasHijab ? 'বোরকা + হিজাব' : 'শুধুমাত্র বোরকা'}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg border-b border-white/10 pb-4">
                                <span className="opacity-70">সাইজ:</span>
                                <span className="font-bold">লং {selectedSize}</span>
                            </div>
                            <div className="flex justify-between items-center text-3xl font-black text-white pt-4">
                                <span>সর্বমোট:</span>
                                <span>৳ {currentTotal}</span>
                            </div>
                        </div>
                        <div className="pt-8 space-y-4">
                            <div className="flex gap-4 items-center bg-white/10 p-4 rounded-2xl">
                                <Truck size={24} className="text-gray-400" />
                                <div className="text-sm">দ্রুত ডেলিভারি সারা বাংলাদেশে</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 md:p-12">
                        <form onSubmit={handleOrderSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 uppercase">আপনার নাম *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all"
                                        placeholder="সম্পূর্ণ নাম লিখুন"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 uppercase">মোবাইল নম্বর *</label>
                                    <input
                                        required
                                        type="tel"
                                        className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all"
                                        placeholder="০১XXXXXXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 uppercase">সম্পূর্ণ ঠিকানা *</label>
                                    <textarea
                                        required
                                        className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#3A5A40] outline-none transition-all min-h-[100px]"
                                        placeholder="বাসা নম্বর, রোড, এলাকা ও জেলা"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-500 uppercase block">সাইজ (লং) *</label>
                                <div className="flex flex-wrap gap-2">
                                    {sizes.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSelectedSize(s)}
                                            className={`w-14 h-14 rounded-2xl border-2 font-bold transition-all ${selectedSize === s ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 font-bold italic">* বডি ৪৬/৪৮ ফ্রি সাইজ</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-500 uppercase block">ডেলিভারি এরিয়া *</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('inside')}
                                        className={`p-4 rounded-2xl border-2 text-left ${deliveryArea === 'inside' ? 'border-black bg-black/5' : 'border-gray-100'}`}
                                    >
                                        <p className="font-bold">ঢাকার ভিতরে</p>
                                        <p className="text-xs opacity-50">৮০ ৳</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('outside')}
                                        className={`p-4 rounded-2xl border-2 text-left ${deliveryArea === 'outside' ? 'border-black bg-black/5' : 'border-gray-100'}`}
                                    >
                                        <p className="font-bold">ঢাকার বাইরে</p>
                                        <p className="text-xs opacity-50">১৫০ ৳</p>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black text-white py-6 rounded-2xl font-black text-2xl shadow-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isSubmitting ? 'প্রসেস হচ্ছে...' : 'অর্ডার সম্পন্ন করুন'} <ArrowRight />
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Success Modal */}
            {orderSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl relative border-4 border-green-500">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">অর্ডার সফল হয়েছে!</h2>
                        <p className="text-lg text-gray-600 mb-6">
                            আমরা আপনার অর্ডারটি পেয়েছি। শীঘ্রই কল করা হবে।
                        </p>
                        <div className="space-y-4">
                            <a 
                                href={`https://wa.me/8801783155897?text=${encodeURIComponent(`*অর্ডার কনফার্ম (Faiza)*\n\n*নাম:* ${formData.name}\n*মোবাইল:* ${formData.phone}\n*প্যাকেজ:* ${hasHijab ? 'বোরকা + হিজাব' : 'শুধুমাত্র বোরকা'}\n*सर्वমোট:* ${currentTotal} ৳`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                            >
                                WhatsApp এ নিশ্চিত করুন
                            </a>
                            <button
                                onClick={() => setOrderSuccess(false)}
                                className="w-full bg-gray-100 text-black py-4 rounded-xl font-bold"
                            >
                                ঠিক আছে
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky WhatsApp */}
            <a href="https://wa.me/8801783155897" target="_blank" className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all">
                <Phone size={32} />
            </a>
        </div>
    );
};

export default FaizaCollection;
