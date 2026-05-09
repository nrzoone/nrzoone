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
    Menu,
    X,
    Minus,
    Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL } from './config';
import { useCart } from './CartContext';

// Product images are currently using placeholders as requested.

const LandingPage = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState('কালো');

    const heroImages = {
        'অলিভ': '/hero_olive.jpg',
        'মেরুন': '/hero_maroon.jpg',
        'কালো': '/hero_black.jpg',
        'নীল': '/hero_blue.jpg',
        'default': '/hero_black.jpg'
    };

    const currentHeroImage = heroImages[selectedColor] || heroImages['default'];
    const [selectedSize, setSelectedSize] = useState('৫০');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: '',
        customSize: ''
    });

    const sizes = ['৫০', '৫২', '৫৪', '৫৬', '৫৮'];

    const orderFormRef = useRef(null);

    const prices = {
        single: 1350,
        with_hijab: 1630
    };

    const originalPrices = {
        single: 1950,
        with_hijab: 2350
    };

    const deliveryCharges = {
        inside: 80,
        outside: 150
    };

    const colors = [
        { name: 'অলিভ', class: 'bg-[#556B2F]' },
        { name: 'মেরুন', class: 'bg-[#4B0000]' },
        { name: 'কালো', class: 'bg-black' },
        { name: 'নীল', class: 'bg-blue-900' }
    ];

    const types = [
        { id: 'with_hijab', label: 'হিজাবসহ পুরো সেট', price: prices.with_hijab },
        { id: 'single', label: 'শুধুমাত্র বোরকা', price: prices.single }
    ];

    const [selectedType, setSelectedType] = useState('single');
    const [quantity, setQuantity] = useState(1);
    const [deliveryArea, setDeliveryArea] = useState('inside');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => {
        setSelectedColor('অলিভ');
    }, []);

    const scrollToForm = () => {
        orderFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const currentPrice = prices[selectedType] * quantity;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        const orderData = {
            ...formData,
            landingPage: 'Haya Series', // Identifier for the sheet
            productType: selectedType,
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
            window.alert("অর্ডার প্রসেস হচ্ছে, ১ সেকেন্ড অপেক্ষা করুন...");
            setIsSubmitting(true);

            // OPTIMISTIC UPDATE: Show success modal immediately to prevent UI hang
            setOrderSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsSubmitting(false);

            // BACKGROUND SYNC: These will run while the user sees the success modal

            // 1. Submit to Google Sheets (Exclude Firebase-specific objects)
            if (GOOGLE_SHEET_URL) {
                const sheetData = { ...orderData };
                delete sheetData.createdAt; // Cannot serialize serverTimestamp
                const params = new URLSearchParams(sheetData).toString();
                fetch(`${GOOGLE_SHEET_URL}?${params}`, { method: 'GET', mode: 'no-cors' })
                    .catch(err => console.error("Sheets Sync Error:", err));
            }

            // 2. Submit to Firebase
            addDoc(collection(db, "orders"), orderData).catch(err => console.error("Firebase Error:", err));

            // 3. Facebook Pixel Tracking
            if (window.fbq) {
                try {
                    window.fbq('track', 'Purchase', { currency: 'BDT', value: orderData.total });
                } catch (e) { console.error(e); }
            }

            // 4. Automated SMS Notification
            if (SMS_API_KEY && SMS_API_KEY !== 'VoYeTuiZ7OH6ZW1rLFZf' && SMS_API_KEY !== 'PASTE_YOUR_API_KEY_HERE') {
                const formattedNumber = formData.phone.trim().startsWith('88') ? formData.phone.trim() : `88${formData.phone.trim()}`;
                const smsMessage = `প্রিয় ${formData.name}, NRZOONE এ আপনার অর্ডারটি গ্রহণ করা হয়েছে। শীঘ্রই আমরা আপনাকে কল করবো। ধন্যবাদ!`;
                fetch(`${SMS_API_URL}?api_key=${encodeURIComponent(SMS_API_KEY)}&type=text&number=${encodeURIComponent(formattedNumber)}&senderid=${encodeURIComponent(SMS_SENDER_ID || '')}&message=${encodeURIComponent(smsMessage)}`, { mode: 'no-cors' })
                    .catch(err => console.error("SMS Error:", err));
            }

            return; // Success flow handled above

        } catch (error) {
            console.error("Order Submission Error:", error);
            alert('দুঃখিত, অর্ডারটি সম্পন্ন করতে সমস্যা হচ্ছে। তবে আমরা আপনার তথ্য পাওয়ার চেষ্টা করছি। অনুগ্রহ করে আমাদের ফোন নম্বরে যোগাযোগ করুন।');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-premium-light font-bengali text-premium-dark overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-morphism py-4 px-6 md:px-12 flex justify-between items-center">
                <a href="/" className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-110">
                    <img src="/logo-dark.png" alt="NRzone Logo" className="h-[60px] md:h-[85px] lg:h-[105px] object-contain drop-shadow-md" onError={(e)=>{e.target.style.display='none';}} />
                </a>
                <div className="hidden md:flex gap-8 font-medium">
                    <a href="#features" className="hover:text-premium-gold transition-colors">কেন আমরা?</a>
                    <a href="#products" className="hover:text-premium-gold transition-colors">প্রোডাক্ট কালেকশন</a>
                    <a href="#delivery" className="hover:text-premium-gold transition-colors">ডেলিভারি পলিসি</a>
                </div>
                <button
                    onClick={scrollToForm}
                    className="bg-premium-dark text-white px-6 py-2 rounded-full font-bold hover:bg-premium-gold transition-all duration-300 shadow-lg"
                >
                    অর্ডার দিন
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 md:pt-32 md:pb-24 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 space-y-6 text-center md:text-left"
                    >
                        <div className="inline-block bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-bold animate-pulse">
                            🔥 স্টক শেষ হওয়ার আগেই অর্ডার করো!
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                            প্রিমিয়াম <span className="text-premium-gold">NRZOONE</span> বোরকা কালেকশন
                        </h1>
                        <p className="text-lg text-gray-600 max-w-xl">
                            এলিগ্যান্ট ডিজাইন ও আরামদায়ক প্রিমিয়াম ফেব্রিক দিয়ে তৈরি বোরকা। হিজাবসহ পুরো সেট অথবা শুধুমাত্র বোরকা হিসেবে সংগ্রহ করতে পারেন।
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <button
                                onClick={scrollToForm}
                                className="flex items-center justify-center gap-2 bg-premium-dark text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-premium-gold transition-all group"
                            >
                                অর্ডার দিন এখনই <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center justify-center gap-2 border-2 border-premium-dark px-8 py-4 rounded-xl font-bold text-xl hover:bg-premium-dark hover:text-white transition-all"
                            >
                                আমাদের প্রোডাক্ট দেখুন
                            </button>
                        </div>
                        <div className="flex items-center gap-4 justify-center md:justify-start text-sm font-medium text-gray-500">
                            <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-green-500" /> ক্যাশ অন ডেলিভারি</span>
                            <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-green-500" /> দ্রুত ডেলিভারি</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 relative"
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-gray-100 flex items-center justify-center">
                            {currentHeroImage ? (
                                <img
                                    src={currentHeroImage}
                                    alt="NRZOONE Hero"
                                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 contrast-[1.02] brightness-[1.02] saturate-[1.05]"
                                />
                            ) : (
                                <div className={`w-full h-full flex flex-col items-center justify-center gap-4 ${colors.find(c => c.name === selectedColor)?.class || 'bg-premium-dark'}`}>
                                    <ShoppingBag size={80} className="text-white/20" />
                                    <p className="text-white/40 font-bold tracking-widest uppercase">Coming Soon</p>
                                </div>
                            )}
                            <div className="absolute bottom-6 left-6 right-6 glass-morphism p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium opacity-70 italic">NRZOONE - প্রিমিয়াম কালেকশন</p>
                                    <p className="text-2xl font-bold text-premium-gold">১৩৫০ ৳ <span className="text-sm line-through text-gray-400 ml-2">১৯৫০ ৳</span></p>
                                </div>
                                <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
                                    সেভিংস ৬০০ ৳
                                </div>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-premium-gold rounded-full blur-3xl opacity-30"></div>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-premium-dark rounded-full blur-3xl opacity-20"></div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-16">কেন এই বোরকা সেটটি বিশেষ?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <Star className="text-premium-gold" />, title: "এলিগ্যান্ট ডিজাইন", desc: "হায়া সিরিজের বিশেষ ডিজাইন, যা আপনাকে দেবে এক আভিজাত্যময় লুক।" },
                            { icon: <ShieldCheck className="text-premium-gold" />, title: "প্রিমিয়াম ফেব্রিক", desc: "সেরা মানের ফেব্রিক দিয়ে তৈরি, যা অত্যন্ত আরামদায়ক ও টেকসই।" },
                            { icon: <CheckCircle2 className="text-premium-gold" />, title: "ফ্রি সাইজ বডি", desc: "৪৬/৪৮ বডি পর্যন্ত যে কেউ অনায়াসেই পরতে পারবেন।" },
                            { icon: <ShoppingBag className="text-premium-gold" />, title: "সাশ্রয়ী মূল্য", desc: "১৯৫০ টাকার বোরকা পাচ্ছেন মাত্র ১৩৫০ টাকায়!" },
                            { icon: <Truck className="text-premium-gold" />, title: "সারাদেশে ডেলিভারি", desc: "আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা দিচ্ছি।" },
                            { icon: <Headphones className="text-premium-gold" />, title: "লিমিটেড স্টক", desc: "স্টক ফুরিয়ে যাওয়ার আগেই আপনার পছন্দের কালারটি বুক করুন।" }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 rounded-2xl bg-premium-light hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center gap-4"
                            >
                                <div className="p-4 bg-white rounded-full shadow-sm">{f.icon}</div>
                                <h3 className="text-xl font-bold">{f.title}</h3>
                                <p className="text-gray-600">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Grid Section */}
            <section id="products" className="py-20 px-4 md:px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold">আমাদের বিশেষ কালেকশন</h2>
                        <p className="text-gray-500">আপনার পছন্দের কালার ও সাইজটি বেছে নিন</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {colors.map((color, index) => {
                            const [itemType, setItemType] = useState('single');
                            const [itemSize, setItemSize] = useState('৫০');
                            const [itemQty, setItemQty] = useState(1);

                            const totalPrice = prices[itemType] * itemQty;

                            const badges = ["জনপ্রিয়", "সেরাসেলার", "২৭% ছাড়", "নতুন"];

                            return (
                                <motion.div
                                    key={color.name}
                                    whileHover={{ y: -5 }}
                                    className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col"
                                >
                                    {/* Product Image Area */}
                                    <div className="relative aspect-[4/5] overflow-hidden group bg-gray-50 flex items-center justify-center">
                                        {heroImages[color.name] ? (
                                            <img
                                                src={heroImages[color.name]}
                                                alt={color.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 contrast-[1.02] brightness-[1.02] saturate-[1.05]"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${color.class}`}>
                                                <ShoppingBag size={48} className="text-white/10" />
                                                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Image Coming Soon</p>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <span className="bg-[#FF4D6D] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                {badges[index]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6 space-y-5 flex-1 flex flex-col">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{color.name} বোরকা</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-2xl font-black text-[#FF4D6D]">{prices[itemType]} ৳</span>
                                                <span className="text-sm text-gray-400 line-through">{originalPrices[itemType]} ৳</span>
                                            </div>
                                        </div>

                                        {/* Type Selection */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase">ধরণ সিলেক্ট করুন:</p>
                                            <select
                                                value={itemType}
                                                onChange={(e) => setItemType(e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-[#FF4D6D] outline-none font-bold"
                                            >
                                                <option value="with_hijab">হিজাবসহ পুরো সেট (১৬৩০ ৳)</option>
                                                <option value="single">শুধুমাত্র বোরকা (১৩৫০ ৳)</option>
                                            </select>
                                        </div>

                                        {/* Size Selection */}
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center bg-premium-gold/5 p-2 rounded-lg border border-premium-gold/20">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">পছন্দের সাইজ (লং):</p>
                                                    <span className="text-xs font-bold text-premium-dark">বডি: ৪৬/৪৮ ফ্রি সাইজ</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {['৫০', '৫২', '৫৪', '৫৬', '৫৮'].map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setItemSize(size)}
                                                            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all ${itemSize === size ? 'bg-[#FF4D6D] border-[#FF4D6D] text-white shadow-md' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity & Action */}
                                        <div className="pt-4 mt-auto space-y-4">
                                            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                                                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black bg-white rounded-xl shadow-sm"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="w-10 text-center font-bold">{itemQty}</span>
                                                    <button
                                                        onClick={() => setItemQty(itemQty + 1)}
                                                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black bg-white rounded-xl shadow-sm"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <span className="text-xs font-bold text-gray-400">পরিমাণ</span>
                                            </div>

                                            <div className="bg-[#FF4D6D]/5 p-3 rounded-2xl border border-[#FF4D6D]/10">
                                                <p className="text-xs text-center text-gray-500 mb-1">মোট মূল্য</p>
                                                <p className="text-2xl font-black text-center text-[#FF4D6D]">{prices[itemType] * itemQty} ৳</p>
                                            </div>

                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => {
                                                            addToCart({
                                                                id: `haya_${color.name}_${itemType}`,
                                                                name: `হায়া সিরিজ - ${color.name} (${itemType === 'with_hijab' ? 'হিজাবসহ' : 'সিঙ্গেল'})`,
                                                                color: color.name,
                                                                size: itemSize,
                                                                price: prices[itemType],
                                                                quantity: itemQty,
                                                                image: heroImages[color.name]
                                                            });
                                                        }}
                                                        className="w-full bg-white text-[#FF4D6D] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 border-2 border-[#FF4D6D] transition-all shadow-sm active:scale-95"
                                                    >
                                                        <ShoppingBag size={20} />
                                                        কার্টে যোগ করুন
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedColor(color.name);
                                                            setSelectedType(itemType);
                                                            setQuantity(itemQty);
                                                            setSelectedSize(itemSize);
                                                            scrollToForm();
                                                            // Facebook Pixel AddToCart
                                                            if (window.fbq) {
                                                                window.fbq('track', 'AddToCart', {
                                                                    content_name: `${color.name} বোরকা - ${itemType}`,
                                                                    content_category: 'Haya Series',
                                                                    value: prices[itemType],
                                                                    currency: 'BDT'
                                                                });
                                                            }
                                                        }}
                                                        className="w-full bg-[#FF4D6D] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#E63958] transition-all shadow-lg active:scale-95 shadow-[#FF4D6D]/20"
                                                    >
                                                        অর্ডার করুন
                                                    </button>
                                                </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Trust Badges section */}
            <section className="bg-premium-dark text-white py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-2">আপনি কি ফোন দিয়ে অর্ডার করতে চান?</h3>
                        <p className="opacity-70">আমাদের এক্সপার্টদের সাথে সরাসরি কথা বলে নিশ্চিত হোন।</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <a href="tel:+8801783155897" className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
                            <div className="p-3 bg-premium-gold rounded-xl"><Phone /></div>
                            <div>
                                <p className="text-xs opacity-70">কল করুন</p>
                                <p className="text-xl font-bold text-premium-gold">+৮৮০১ ৭৮৩-১৫৫৮৯৭</p>
                            </div>
                        </a>
                        <div className="text-center md:text-right">
                            <p className="text-sm font-medium">সার্ভিস টাইম:</p>
                            <p className="text-premium-gold font-bold">সকাল ০৯টা – রাত ০১ টা</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Delivery Info */}
            <section id="delivery" className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">আমাদের ডেলিভারি ও কোয়ালিটি নিশ্চয়তা</h2>
                        <p className="text-gray-600">আমরা শুধু কাস্টমার স্যাটিসফেকশনের জন্য কাজ করি। আমাদের প্রতিটি পলিসি আপনার সুবিধার কথা চিন্তা করে তৈরি।</p>

                        <div className="space-y-4">
                            <div className="p-6 bg-white rounded-2xl border-l-4 border-premium-gold shadow-sm">
                                <h4 className="font-bold flex items-center gap-2"><CheckCircle2 className="text-green-500" /> কোয়ালিটি গ্যারান্টি</h4>
                                <p className="text-sm text-gray-500 mt-2">১০০% প্রিমিয়াম ফেব্রিক এবং হ্যান্ডওয়ার্ক চেকড। প্রতিটি পণ্য আমরা নিখুঁতভাবে চেক করে পাঠাই।</p>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border-l-4 border-premium-gold shadow-sm text-red-600">
                                <h4 className="font-bold flex items-center gap-2">⚠️ গুরুত্বপূর্ণ কুরিয়ার নোট:</h4>
                                <p className="text-sm mt-2 opacity-80">কুরিয়ার অপশন নিন বা না নিয়ে কাস্টমারকে ফুল ডেলিভারি চার্জ বহন করতে হবে। এটা কুরিয়ার কোম্পানির পলিসি, আমাদের নিয়ন্ত্রণে নেই।</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-premium-gold/10 p-8 rounded-3xl border-2 border-premium-gold/20 space-y-8">
                        <h3 className="text-2xl font-bold text-center">ডেলিভারি চার্জ তালিকা</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl text-center space-y-2 border border-premium-gold/20">
                                <MapPin className="mx-auto text-premium-gold" size={32} />
                                <p className="font-bold">ঢাকার ভিতরে</p>
                                <p className="text-2xl font-extrabold text-premium-dark">৮০ ৳</p>
                                <p className="text-xs text-gray-500">সময় ১-২ দিন</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl text-center space-y-2 border border-premium-gold/20">
                                <Truck className="mx-auto text-premium-gold" size={32} />
                                <p className="font-bold">ঢাকার বাইরে</p>
                                <p className="text-2xl font-extrabold text-premium-dark">১৫০ ৳</p>
                                <p className="text-xs text-gray-500">সময় ২-৪ দিন</p>
                            </div>
                        </div>
                        <div className="bg-white/50 p-4 rounded-xl text-sm italic text-gray-600">
                            * কুরিয়ার সার্ভিসে মিনিমাম ০.৫ কেজি ওয়েট গণনা করা হয়।
                        </div>
                    </div>
                </div>
            </section>

            {/* Order Form Section */}
            <section ref={orderFormRef} className="py-24 px-6 relative">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-premium-dark/5 -z-10"></div>
                <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

                    <div className="md:w-[40%] bg-premium-dark text-white p-8 space-y-8">
                        <h2 className="text-3xl font-bold leading-tight">আপনার তথ্য দিন এবং অর্ডার প্রস্তুত করব</h2>
                        <p className="opacity-70">১০০% নিরাপদ ডেলিভারি ও কোয়ালিটি নিশ্চয়তা আমাদের।</p>

                        <div className="space-y-6">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-premium-gold rounded-xl flex items-center justify-center text-premium-dark"><ShieldCheck /></div>
                                <div>
                                    <p className="font-bold">১০০% অরিজিনাল</p>
                                    <p className="text-xs opacity-60">প্রিমিয়াম কোয়ালিটি গ্যারান্টি</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-premium-gold rounded-xl flex items-center justify-center text-premium-dark"><Truck /></div>
                                <div>
                                    <p className="font-bold">দ্রুত ডেলিভারি</p>
                                    <p className="text-xs opacity-60">সারা বাংলাদেশে হোম ডেলিভারি</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <p className="font-bold">কার্ট সামারি:</p>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">{selectedType === 'with_hijab' ? 'হিজাবসহ পুরো সেট' : 'শুধুমাত্র বোরকা'} ({quantity} টি)</span>
                                <span>{currentPrice} ৳</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">ডেলিভারি চার্জ</span>
                                <span>{deliveryCharges[deliveryArea]} ৳</span>
                            </div>
                            <div className="h-px bg-white/10"></div>
                            <div className="flex justify-between text-xl font-bold text-premium-gold">
                                <span>সর্বমোট:</span>
                                <span>{currentTotal} ৳</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 md:p-12">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-premium-dark text-white flex items-center justify-center text-sm font-bold">1</span>
                            গ্রাহকের তথ্য
                        </h3>
                        <form onSubmit={handleOrderSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">আপনার নাম *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">মোবাইল নম্বর *</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="০১XXXXXXXXX"
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">আমরা এই নম্বরে কল করে অর্ডার কনফার্ম করব।</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">সম্পূর্ণ ঠিকানা *</label>
                                <textarea
                                    required
                                    placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, এলাকা, জেলা"
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all min-h-[100px]"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 block">ডেলিভারি এরিয়া *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('inside')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryArea === 'inside' ? 'border-premium-dark bg-premium-light' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="font-bold flex justify-between">ঢাকার ভিতরে <CheckCircle2 size={18} className={deliveryArea === 'inside' ? 'text-premium-dark' : 'text-transparent'} /></div>
                                        <div className="text-xs opacity-60">চার্জ: ৮০ ৳ • ১-২ দিন সময়</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('outside')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryArea === 'outside' ? 'border-premium-dark bg-premium-light' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="font-bold flex justify-between">ঢাকার বাইরে <CheckCircle2 size={18} className={deliveryArea === 'outside' ? 'text-premium-dark' : 'text-transparent'} /></div>
                                        <div className="text-xs opacity-60">চার্জ: ১৫০ ৳ • ১-৩ দিন সময়</div>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-premium-gold text-premium-dark py-5 rounded-2xl font-extrabold text-2xl shadow-xl hover:shadow-premium-gold/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mt-4 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার সম্পন্ন করুন'} {!isSubmitting && <ArrowRight />}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* WhatsApp Sticky Button */}
            <a
                href="https://wa.me/8801783155897"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
            >
                <div className="flex items-center gap-2">
                    <span className="hidden group-hover:block ml-2 font-bold whitespace-nowrap">সরাসরি কথা বলুন</span>
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.888 11.888-11.888 3.176 0 6.161 1.237 8.404 3.48s3.481 5.229 3.481 8.404c0 6.556-5.332 11.888-11.888 11.888-2.012 0-3.986-.511-5.741-1.48L0 24zm6.12-2.903c1.554.921 3.03 1.388 4.61 1.388 5.623 0 10.201-4.578 10.201-10.201 0-5.623-4.578-10.201-10.201-10.201-2.723 0-5.283 1.061-7.207 2.985a10.137 10.137 0 00-2.984 7.208c0 1.637.458 3.167 1.353 4.542L1.07 22.848l5.107-1.751zm12.061-6.505c-.277-.139-1.641-.809-1.895-.9-.254-.092-.439-.139-.623.139-.184.277-.715.9-.877 1.085-.162.184-.323.208-.6.069-.277-.139-1.169-.431-2.227-1.374-.824-.735-1.38-1.642-1.541-1.92s-.018-.427.121-.565c.125-.124.277-.323.415-.485a1.868 1.868 0 00.277-.461.468.468 0 00-.023-.439c-.069-.139-.623-1.501-.853-2.053-.223-.538-.448-.465-.623-.473-.16-.008-.344-.01-.529-.01-.184 0-.485.069-.738.346-.253.277-.968.946-.968 2.308s.991 2.677 1.13 2.861c.139.184 1.95 2.977 4.724 4.173.66.285 1.174.455 1.577.583.662.21 1.265.18 1.74.109.53-.08 1.641-.67 1.872-1.316.23-.647.23-1.201.162-1.316-.069-.115-.254-.184-.531-.323z" />
                    </svg>
                </div>
            </a>

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
                                href={`https://wa.me/8801783155897?text=${encodeURIComponent(`*অর্ডার কনফার্ম (Haya)*\n\n*নাম:* ${formData.name}\n*মোবাইল:* ${formData.phone}\n*আইটেম:* ${selectedType}\n*সর্বমোট:* ${currentTotal} ৳`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
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

            {/* Footer */}
            <footer className="bg-white pt-20 pb-10 border-t border-gray-100 px-6">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left space-y-4">
                            <div className="text-3xl font-bold tracking-tighter text-black flex items-center justify-center md:justify-start gap-2">
                                <span>NR ZONE</span>
                            </div>
                            <p className="text-gray-500 max-w-sm mt-4 font-bold border-l-2 border-slate-100 pl-4">Premium Modesty Lifestyle</p>
                            <p className="text-gray-400 max-w-sm mt-2">সেরা কোয়ালিটি বোরকা এবং হিজাব কালেকশন। আমরা বিশ্বাস করি মডেস্টি মানেই আভিজাত্য।</p>
                        </div>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/share/r/185GWnrgi3/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-premium-light flex items-center justify-center text-premium-dark hover:bg-premium-dark hover:text-white transition-all shadow-sm">
                                <span className="font-bold">f</span>
                            </a>
                            <a href="https://wa.me/8801783155897" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-premium-light flex items-center justify-center text-premium-dark hover:bg-premium-dark hover:text-white transition-all shadow-sm">
                                <Phone size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500 font-medium">
                        <p>© 2026 NRZOONE | All Rights Reserved</p>
                        <p>Design & Developed by <span className="text-premium-dark font-bold">NRZOONE</span></p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-premium-dark transition-colors">প্রাইভেসি পলিসি</a>
                            <a href="#" className="hover:text-premium-dark transition-colors">টার্মস ও কন্ডিশন</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
