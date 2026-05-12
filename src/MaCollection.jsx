import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Phone, MapPin, CheckCircle, ArrowRight, ShieldCheck, Truck, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL } from './config';

const MaCollection = () => {
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState('Standard');
    const [selectedColor, setSelectedColor] = useState('Black');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    const colors = [
        { name: 'Black', code: '#000000' },
        { name: 'Maroon', code: '#800000' },
        { name: 'Navy', code: '#000080' },
        { name: 'Bottle Green', code: '#006a4e' },
        { name: 'Coffee', code: '#4b3621' }
    ];

    const colorImages = {
        'Black': '/ma_cherry_black.png',
        'Maroon': '/ma_cherry_maroon.jpg',
        'Navy': '/ma_cherry_blue.jpg',
        'Bottle Green': '/ma_cherry_olive.png',
        'Coffee': '/ma_cherry_coffee.png'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            const currentOrderData = {
                orderId: "NRZ-" + Date.now().toString().slice(-6),
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                productType: "Ma Collection",
                productName: "Ma Collection Borka",
                color: selectedColor,
                size: selectedSize,
                quantity: Number(quantity),
                total: selectedSize === 'বোরকা + হিজাব (Combo)' ? 1680 * quantity : 1190 * quantity,
                status: 'pending',
                createdAt: serverTimestamp()
            };

            // 1. Submit to Firebase
            await addDoc(collection(db, "orders"), currentOrderData);

            // 2. Submit to Google Sheets
            if (GOOGLE_SHEET_URL) {
                const sheetData = {
                    Date: new Date().toLocaleString('en-GB'),
                    Name: currentOrderData.name,
                    name: currentOrderData.name,
                    Phone: currentOrderData.phone,
                    phone: currentOrderData.phone,
                    Address: currentOrderData.address,
                    address: currentOrderData.address,
                    Product: currentOrderData.productType,
                    product: currentOrderData.productType,
                    Color: currentOrderData.color,
                    color: currentOrderData.color,
                    Size: currentOrderData.size,
                    size: currentOrderData.size,
                    Qty: currentOrderData.quantity,
                    qty: currentOrderData.quantity,
                    Total: currentOrderData.total,
                    total: currentOrderData.total,
                    Status: currentOrderData.status,
                    status: currentOrderData.status,
                    landingPage: "Ma Collection"
                };
                
                const params = new URLSearchParams(sheetData).toString();
                const syncUrl = `${GOOGLE_SHEET_URL}?${params}`;
                
                fetch(syncUrl, { method: 'GET', mode: 'no-cors' })
                    .catch(err => console.error("Sheets Sync Error:", err));
            }

            // 3. SMS Notification (Optional)
            if (SMS_API_KEY && SMS_API_KEY.length > 5) {
                const formattedNumber = formData.phone.trim().startsWith('88') ? formData.phone.trim() : `88${formData.phone.trim()}`;
                const smsMessage = `Prio ${formData.name}, NRZOONE e apnar order ti grahon kora hoyeche. Dhonnobad!`;
                fetch(`${SMS_API_URL}?api_key=${encodeURIComponent(SMS_API_KEY)}&type=text&number=${encodeURIComponent(formattedNumber)}&senderid=${encodeURIComponent(SMS_SENDER_ID || '')}&message=${encodeURIComponent(smsMessage)}`, { mode: 'no-cors' })
                    .catch(err => console.error("SMS Error:", err));
            }

            setOrderSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error("Order Submission Error:", error);
            alert('দুঃখিত, অর্ডারটি সম্পন্ন করতে সমস্যা হচ্ছে। অনুগ্রহ করে ফোন করে অর্ডার দিন।');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#2D2D2D] overflow-x-hidden">
            {/* Header / Navigation */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#E8E1D5] py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/logo.jpg" alt="Logo" className="h-10 md:h-14 mix-blend-multiply" />
                    <span className="text-xl md:text-2xl font-black tracking-tighter text-[#1A1A1A]">NRZOONE</span>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="text-sm font-bold bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full hover:bg-black transition-all flex items-center gap-2"
                >
                    অন্যান্য কালেকশন <ArrowRight size={16} />
                </button>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-start">
                    
                    {/* Left: Visual Content */}
                    <div className="space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative group rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                        >
                            <img 
                                src={colorImages[selectedColor] || '/ma_cherry_black.png'} 
                                alt={`Ma Collection Borka - ${selectedColor}`} 
                                className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            

                            <div className="absolute top-6 left-6 flex flex-col gap-3">
                                <span className="bg-black text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl">Best Seller</span>
                                <span className="bg-[#D4AF37] text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl">Premium Cherry</span>
                            </div>
                        </motion.div>
                        
                        {/* Benefits Icons */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-2xl text-center shadow-sm border border-[#E8E1D5]">
                                <ShieldCheck className="mx-auto text-[#D4AF37] mb-2" size={24} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">অরিজিনাল চেরি</span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl text-center shadow-sm border border-[#E8E1D5]">
                                <Truck className="mx-auto text-[#D4AF37] mb-2" size={24} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">সারা দেশে ডেলিভারি</span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl text-center shadow-sm border border-[#E8E1D5]">
                                <Star className="mx-auto text-[#D4AF37] mb-2" size={24} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">প্রিমিয়াম কোয়ালিটি</span>
                            </div>
                        </div>

                        {/* Vertical Image Gallery (Landing Page Style) */}
                        <div className="space-y-6 mt-8">
                            <h4 className="text-xl font-black text-center uppercase tracking-widest text-[#1A1A1A] mb-8">
                                <span className="bg-[#1A1A1A] text-white px-6 py-2 rounded-full">আমাদের সবকটি কালার দেখুন</span>
                            </h4>
                            {Object.entries(colorImages).map(([color, img]) => (
                                <motion.div 
                                    key={color}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="relative group rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl"
                                >
                                    <img 
                                        src={img} 
                                        alt={`Ma Collection Borka - ${color}`} 
                                        className="w-full aspect-[4/5] object-cover"
                                    />
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                        <button 
                                            onClick={() => {
                                                setSelectedColor(color);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="bg-white/90 backdrop-blur-md text-black px-8 py-3 rounded-2xl font-black text-sm shadow-xl border border-white hover:bg-black hover:text-white transition-all"
                                        >
                                            {color} কালারটি কিনুন
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Customer Reviews Section */}
                        <div className="mt-16 bg-white p-8 rounded-[3rem] shadow-2xl border border-[#E8E1D5]">
                            <div className="text-center mb-10">
                                <h4 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-wider mb-2">আমাদের কাস্টমার রিভিউ</h4>
                                <div className="flex justify-center gap-1 text-[#D4AF37]">
                                    {[...Array(5)].map((_, i) => <Star key={i} fill="#D4AF37" size={20} />)}
                                </div>
                                <p className="text-gray-400 text-sm mt-2">৫০০+ এর বেশি কাস্টমার আমাদের ড্রেস পছন্দ করেছেন</p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { name: "সামিয়া আক্তার", comment: "বোরকাটির কাপড় অনেক সফট এবং ডিজাইনটি একদম ইউনিক। মা কালেকশন সত্যি প্রিমিয়াম!", date: "২ দিন আগে" },
                                    { name: "ফারিয়া ইসলাম", comment: "হিজাবসহ সেটটি অনেক সাশ্রয়ী মনে হয়েছে। কালারটা একদম ছবির মতোই সুন্দর।", date: "৫ দিন আগে" },
                                    { name: "নুসরাত জাহান", comment: "ডেলিভারি অনেক ফাস্ট ছিল। কোয়ালিটি নিয়ে কোনো সন্দেহ নেই। ধন্যবাদ NRZOONE!", date: "১ সপ্তাহ আগে" }
                                ].map((review, idx) => (
                                    <div key={idx} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-[#1A1A1A]">{review.name}</span>
                                            <span className="text-[10px] text-gray-400">{review.date}</span>
                                        </div>
                                        <div className="flex gap-1 text-[#D4AF37]">
                                            {[...Array(5)].map((_, i) => <Star key={i} fill="#D4AF37" size={12} />)}
                                        </div>
                                        <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 text-center">
                                <button className="bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl">
                                    আরও ৫৭০টি রিভিউ দেখুন
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Details & Order Form */}
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl font-black text-[#1A1A1A] leading-[1.1] tracking-tighter">
                                মা কালেকশন <br/> 
                                <span className="text-[#D4AF37]">প্রিমিয়াম বোরকা</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                                দুবাই থেকে আমদানিকৃত ১০০% অরিজিনাল চেরি জর্জেট ফেব্রিক দিয়ে তৈরি। মডেস্টি এবং আভিজাত্যের এক অনন্য মেলবন্ধন।
                            </p>
                            
                            <div className="flex items-center gap-6 py-4">
                                <div className="space-y-1">
                                    <span className="text-red-500 line-through text-lg md:text-xl font-bold">৳১,৬৯০</span>
                                    <div className="text-4xl md:text-5xl font-black text-[#1A1A1A]">৳{selectedSize === 'বোরকা + হিজাব (Combo)' ? '১,৬৮০' : '১,১৯০'}</div>
                                </div>
                            <div className="bg-[#FFF4E5] text-[#D4AF37] px-4 py-2 rounded-xl font-black text-sm md:text-base animate-pulse">
                                     স্পেশাল অফার!
                                 </div>
                            </div>

                            {/* Video Review Section */}
                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-pink-100 mb-8">
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                                    রিয়েল ভিডিও রিভিউ দেখুন
                                </h4>
                                <div className="aspect-video rounded-2xl overflow-hidden bg-black relative group">
                                    <iframe 
                                        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent('https://www.facebook.com/facebook/videos/835249912617282/')}&show_text=0&width=560`} 
                                        className="absolute inset-0 w-full h-full border-0"
                                        allowFullScreen={true}
                                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    ></iframe>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-3 text-center italic">ভিডিওতে বোরকাটির মান এবং কাপড় ভালো করে দেখে নিন</p>
                            </div>
                        </div>

                        {/* Customization Options */}
                        <div className="space-y-8 bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-[#E8E1D5]">
                            {/* Color Selector */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">পছন্দের কালার সিলেক্ট করুন</label>
                                <div className="flex flex-wrap gap-4">
                                    {colors.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setSelectedColor(color.name)}
                                            className={`group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${
                                                selectedColor === color.name ? 'bg-gray-50 scale-105' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div 
                                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 shadow-inner transition-all ${
                                                    selectedColor === color.name ? 'border-[#1A1A1A] scale-110' : 'border-white'
                                                }`}
                                                style={{ backgroundColor: color.code }}
                                            />
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${selectedColor === color.name ? 'text-black' : 'text-gray-400'}`}>
                                                {color.name}
                                            </span>
                                            {selectedColor === color.name && (
                                                <div className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white rounded-full p-1 shadow-lg">
                                                    <CheckCircle size={10} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Selector */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">সাইজ নির্বাচন করুন</label>
                                <select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all font-bold text-lg cursor-pointer appearance-none"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                                >
                                    <option value="" disabled>সাইজ সিলেক্ট করুন</option>
                                    {['50', '52', '54', '56', 'বোরকা + হিজাব (Combo)'].map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Order Form */}
                            <div id="order-form" className="space-y-6 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <ShoppingBag className="text-[#D4AF37]" size={28} />
                                    <h3 className="text-xl md:text-2xl font-black tracking-tighter">অর্ডার করতে নিচের তথ্য দিন</h3>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">আপনার নাম</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="পুরো নাম লিখুন"
                                            className="w-full bg-[#F9F9F9] border-2 border-transparent focus:border-[#D4AF37] focus:bg-white px-6 py-4 rounded-2xl outline-none transition-all font-bold"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">মোবাইল নম্বর</label>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="১১ ডিজিটের মোবাইল নম্বর দিন"
                                            className="w-full bg-[#F9F9F9] border-2 border-transparent focus:border-[#D4AF37] focus:bg-white px-6 py-4 rounded-2xl outline-none transition-all font-bold"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">পুরো ঠিকানা</label>
                                        <textarea
                                            required
                                            placeholder="বাসা নং, রোড নং, থানা ও জেলা লিখুন"
                                            className="w-full bg-[#F9F9F9] border-2 border-transparent focus:border-[#D4AF37] focus:bg-white px-6 py-5 rounded-2xl outline-none transition-all font-bold min-h-[120px] resize-none"
                                            value={formData.address}
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>

                                    <button
                                        disabled={isSubmitting}
                                        type="submit"
                                        className={`w-full group relative overflow-hidden py-6 rounded-3xl font-black text-xl md:text-2xl tracking-tighter transition-all flex items-center justify-center gap-3 shadow-2xl ${
                                            isSubmitting ? 'bg-gray-400' : 'bg-[#D4AF37] hover:bg-[#B8860B] text-white active:scale-95'
                                        }`}
                                    >
                                        <span className="relative z-10">{isSubmitting ? 'অর্ডার হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}</span>
                                        {!isSubmitting && <ArrowRight className="relative z-10 group-hover:translate-x-2 transition-transform" size={24} />}
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Success Modal */}
            <AnimatePresence>
                {orderSuccess && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[40px] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]" />
                            <button 
                                onClick={() => setOrderSuccess(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-8 relative">
                                <div className="w-24 h-24 bg-[#F1FDF6] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                                    <CheckCircle className="text-[#22C55E]" size={48} />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-black mb-4">অর্ডারটি সফল হয়েছে!</h2>
                                <p className="text-gray-500 font-bold leading-relaxed">
                                    আমাদের প্রতিনিধি শীঘ্রই আপনার নাম্বারে কল করে অর্ডারটি কনফার্ম করবেন। NRZOONE এর সাথে থাকার জন্য ধন্যবাদ!
                                </p>
                            </div>

                            <div className="space-y-4">
                                <a 
                                    href={`https://wa.me/8801783155897?text=${encodeURIComponent('Hi NRZOONE, I just placed an order for Ma Collection Borka.')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone size={20} /> WhatsApp এ নিশ্চিত করুন
                                </a>
                                <button 
                                    onClick={() => setOrderSuccess(false)}
                                    className="w-full bg-gray-100 text-black py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    ঠিক আছে
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MaCollection;
