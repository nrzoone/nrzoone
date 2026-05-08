import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ShoppingBag, ArrowRight, Menu, X, Star, CheckCircle2, Clock, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const collections = [
        {
            id: 'ma',
            title: 'মা কালেকশন বোরকা ডিজাইন',
            image: '/ma_cherry_black.png',
            oldPrice: '১,৬৯০',
            price: '১,১৯০',
            path: '/ma',
        },
        {
            id: 'classic',
            title: 'মা-মেয়ে স্পেশাল কম্বো বোরকা ডিজাইন',
            image: '/classic_combo_main.jpg',
            oldPrice: '২,২০০',
            price: '১,৬৮০',
            path: '/classic',
        },
        {
            id: 'kids',
            title: 'কিডস কালেকশন বোরকা ডিজাইন',
            image: '/kids_hero.jpg', 
            oldPrice: '৮৯০',
            price: '৬৯০',
            path: '/kids',
        },
        {
            id: 'borobon',
            title: 'বড়বোন বোরকা ডিজাইন',
            image: '/boro_bon_black.jpg',
            oldPrice: '১,২৯০',
            price: '৯৯০',
            path: '/borobon',
        },
        {
            id: 'maboromeye',
            title: 'মা ও বড়মেয়ে কম্বো বোরকা',
            image: '/ma_boro_meye_black.jpg',
            oldPrice: '১,১৯০',
            price: '৮৯০',
            path: '/maboromeye',
        },
        {
            id: 'faiza',
            title: 'ফাইজা এক্সক্লুসিভ বোরকা ডিজাইন উইথ স্টোন ওয়ার্ক',
            image: '/faiza_black.jpg',
            oldPrice: '১,১৯০',
            price: '৮৯০',
            path: '/faiza',
        },
        {
            id: 'haya',
            title: 'হায়া সিরিজ বোরকা ডিজাইন',
            image: '/hero_black.jpg',
            oldPrice: '১,৯৫০',
            price: '১,৩৫০',
            path: '/haya',
        },
        {
            id: 'hijab',
            title: 'প্রিমিয়াম হিজাব কালেকশন',
            image: '/premium-hijab.jpg', 
            oldPrice: '৪৫০',
            price: '২৫০',
            path: '/hijab',
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-12 py-4">
                {/* Logo Area */}
                <div className="flex flex-col sm:flex-row items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img 
                        src="/logo.jpg" 
                        alt="NRZOONE Logo" 
                        className="h-16 md:h-24 lg:h-28 object-contain mix-blend-difference invert drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)]"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            document.getElementById('fallback-text-logo').style.display = 'block';
                        }}
                    />
                    <h1 id="fallback-text-logo" className="hidden text-2xl md:text-3xl font-black tracking-tighter uppercase whitespace-nowrap">
                        NRZOONE
                    </h1>
                </div>

                {/* Center Nav Items */}
                <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
                    <button onClick={() => navigate('/haya')} className="hover:text-black transition-colors flex items-center gap-1">BORKA</button>
                    <button onClick={() => navigate('/ma')} className="hover:text-black transition-colors flex items-center gap-1">ABAYA</button>
                    <button onClick={() => navigate('/hijab')} className="hover:text-black transition-colors flex items-center gap-1">HIJAB</button>
                    <button className="hover:text-gray-500 transition-colors flex items-center gap-1">Store Locator</button>
                </nav>

                {/* Right Icons */}
                <div className="flex items-center gap-4 md:gap-5">
                    <Search className="w-5 h-5 cursor-pointer hover:text-gray-500 transition hidden sm:block" />
                    <User className="w-5 h-5 cursor-pointer hover:text-gray-500 transition hidden sm:block" />
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5 cursor-pointer hover:text-gray-500 transition" />
                        <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            0
                        </span>
                    </div>
                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden ml-2 focus:outline-none">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <nav className="flex flex-col px-6 py-4 gap-4 font-semibold text-sm">
                            <button onClick={() => { navigate('/haya'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">BORKA <ArrowRight className="w-4 h-4" /></button>
                            <button onClick={() => { navigate('/ma'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">ABAYA <ArrowRight className="w-4 h-4" /></button>
                            <button onClick={() => { navigate('/hijab'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">HIJAB <ArrowRight className="w-4 h-4" /></button>
                            <button onClick={() => { navigate('/kids'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">KIDS COLLECTION <ArrowRight className="w-4 h-4" /></button>
                            <button className="text-left py-2 hover:text-gray-500">Store Locator</button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Featured Reel Video Section */}
            <section className="w-full bg-black py-0">
                <div className="max-w-[1600px] mx-auto flex flex-col items-center">
                    <div className="relative w-full max-w-[500px] aspect-[9/16] bg-black overflow-hidden shadow-2xl">
                        <iframe 
                            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent('https://www.facebook.com/reel/1506415160808378')}&show_text=0&t=0&autoplay=1&mute=1`}
                            className="absolute inset-0 w-full h-full border-none"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
                            allowFullScreen={true}
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="relative w-full h-[500px] md:h-[700px] overflow-hidden bg-[#e6e2db]">
                <img 
                    src="/classic_combo_main.jpg" 
                    alt="Hero Borka" 
                    className="absolute inset-0 w-full h-full object-cover object-[center_25%]"
                />
                <div className="absolute inset-0 bg-black/30" /> {/* Subtle overlay to ensure text readability */}
                
                <div className="absolute inset-0 max-w-[1600px] mx-auto px-6 md:px-16 py-24 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl"
                    >
                        <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 md:px-6 py-2 rounded-full text-sm md:text-xl font-bold mb-6 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)] uppercase tracking-wider border-2 border-red-400">
                            🔥 ফ্ল্যাশ সেল! মেগা ডিসকাউন্ট!
                        </div>
                        <h2 className="text-white text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[1.1] drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] mb-6">
                            মা ও মেয়ের<br/>
                            <span className="text-yellow-400">স্পেশাল কম্বো!</span>
                        </h2>
                        <p className="text-white text-lg sm:text-xl md:text-3xl font-bold max-w-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-8 leading-snug">
                            এত বড় ছাড় আর কখনোই আসেনি! নিজের জন্য কিংবা আদরের সোনামণির জন্য— <span className="bg-yellow-400 text-black px-2 py-0.5 rounded whitespace-nowrap">স্টক ফুরানোর আগেই</span> কিনে নিন! না কিনলে আসলেই লস!
                        </p>
                    </motion.div>
                    
                    <motion.button 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        onClick={() => navigate('/haya')}
                        className="mt-8 md:mt-12 flex items-center gap-4 bg-[#1a1a1a] text-white px-6 py-3 md:px-8 md:py-4 w-max hover:bg-black transition-all group"
                    >
                        <span className="text-xs md:text-sm uppercase tracking-widest font-semibold flex-1 text-left">Collection 2026</span>
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>
            </section>

            {/* Product Grid */}
            <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {collections.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "100px" }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            className="group cursor-pointer flex flex-col"
                            onClick={() => navigate(item.path)}
                        >
                            {/* Image Container */}
                            <div className="w-full aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out transform group-hover:scale-[1.03]"
                                />
                            </div>
                            
                            {/* Text Container */}
                            <div className="flex space-y-1.5 flex-col flex-1 text-left">
                                <h3 className="text-[15px] font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-black transition-colors">
                                    {item.title}
                                </h3>
                                
                                <div className="flex items-center gap-2 mt-auto pt-1">
                                    <span className="text-gray-400 text-sm line-through decoration-gray-300">
                                        ৳ {item.oldPrice}
                                    </span>
                                    <span className="text-black font-bold text-base">
                                        ৳ {item.price}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Live Order Marquee */}
            <div className="w-full bg-red-600 text-white py-2.5 overflow-hidden flex whitespace-nowrap border-y-2 border-red-800 shadow-md relative z-10">
                <div className="animate-marquee flex gap-12 items-center font-bold text-sm tracking-wide">
                    <span>🔴 LIVE: সানজিদা (ঢাকা) এইমাত্র অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: নাফিসা (চট্টগ্রাম) কালো বোরকা অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: রহিমা বেগম (সিলেট) হিজাবসহ সেট অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: ফাতেমা (গাজীপুর) অলিভ বোরকা অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: আয়েশা (রাজশাহী) মেরুন বোরকা অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: সানজিদা (ঢাকা) এইমাত্র অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: নাফিসা (চট্টগ্রাম) কালো বোরকা অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: রহিমা বেগম (সিলেট) হিজাবসহ সেট অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: ফাতেমা (গাজীপুর) অলিভ বোরকা অর্ডার করেছেন</span>
                    <span className="text-red-300">|</span>
                    <span>🔴 LIVE: আয়েশা (রাজশাহী) মেরুন বোরকা অর্ডার করেছেন</span>
                </div>
            </div>

            {/* Customer Reviews Section */}
            <section className="max-w-[1600px] mx-auto px-4 md:px-12 py-16 bg-[#FDFBF7]">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 leading-tight">
                        ✅ ৩০০০+ সন্তুষ্ট কাস্টমার
                    </h2>
                    <p className="text-xl md:text-2xl text-red-600 font-bold mb-2">তারা পেয়েছেন, আপনিও পাবেন!</p>
                    <p className="text-gray-500 font-medium">বাস্তব ক্রেতাদের অভিজ্ঞতা ও ছবি — কোনো নকল নয়</p>
                </div>
                
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                    {/* Review 1 */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">স</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900">সানজিদা আক্তার <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">মিরপুর, ঢাকা · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">✅ ব্লু + ব্ল্যাক কম্বো</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2">"আলহামদুলিল্লাহ! যেমনটা ছবিতে দেখেছি ঠিক তেমনই পেয়েছি। কাপড় অনেক সফট, স্টোন কাজ অসাধারণ! পরের বার আবার নেবো।"</p>
                    </div>

                    {/* Image 1 */}
                    <div className="rounded-2xl overflow-hidden shadow-lg break-inside-avoid">
                        <img src="/reviews/media__1778274732225.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* Review 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-xl">ন</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900">নাসরিন বেগম <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">গাজীপুর · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">✅ ব্লু স্টোন বোরকা — ফ্রন্ট</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2">"ছবির চেয়ে আরও সুন্দর পেয়েছি হাতে! কাপড় প্রিমিয়াম, স্টোনের কাজ অনেক সূক্ষ্ম। ১০০% রেকমেন্ড করবো।"</p>
                    </div>

                    {/* Image 2 */}
                    <div className="rounded-2xl overflow-hidden shadow-lg break-inside-avoid">
                        <img src="/reviews/media__1778274754641.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* Review 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">ফ</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900">ফারহানা আফরোজ <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">চট্টগ্রাম · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">✅ ব্লু বোরকা — ব্যাক ডিটেইল</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2">"ব্যাক ডিজাইনটা দেখে মুগ্ধ হয়ে গেছি! পরিবারের সবাই দেখে পছন্দ করলেন। ইনশাআল্লাহ আবার নেবো।"</p>
                    </div>

                    {/* Image 3 */}
                    <div className="rounded-2xl overflow-hidden shadow-lg break-inside-avoid">
                        <img src="/reviews/media__1778274790842.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* Review 4 */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl">R</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900">রহিমা বেগম <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">সিলেট · Verified Customer</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2">"একথায় অসাধারণ। মা, মেয়ে, শাশুড়ি, ননদ — সবার পছন্দ হয়েছে। এই দামে এত কোয়ালিটি পাবো ভাবিনি! ❤️"</p>
                    </div>

                    {/* Image 4 */}
                    <div className="rounded-2xl overflow-hidden shadow-lg break-inside-avoid">
                        <img src="/reviews/media__1778274790970.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>
                    {/* Review 5 */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xl">স</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900">সুমাইয়া ইসলাম <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">কুমিল্লা · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">✅ হায়া সিরিজ বোরকা</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2">"কাপড়ের কোয়ালিটি নিয়ে একটু ভয়ে ছিলাম, কিন্তু হাতে পাওয়ার পর জাস্ট ওয়াও! এত সফট এবং কমফোর্টেবল যা বলার বাইরে। ডেলিভারিও অনেক ফাস্ট ছিল।"</p>
                    </div>

                    {/* Review 6 */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold text-xl">ত</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900">তাসনিম জারা <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">খুলনা · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">✅ মা-মেয়ে স্পেশাল কম্বো</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2">"আমার মেয়ের জন্য আর আমার জন্য নিয়েছিলাম। দুজনকে একসাথে অনেক কিউট লাগছিল। সবাই জিজ্ঞেস করছিল কোথা থেকে নিয়েছি। ধন্যবাদ NRZOONE কে!"</p>
                    </div>

                    {/* Review 7 */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 break-inside-avoid">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-xl">জ</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900">জান্নাতুল ফেরদৌস <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">বরিশাল · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">✅ প্রিমিয়াম হিজাব কালেকশন</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2">"হিজাবগুলোর কালার একদম ছবির মতোই ব্রাইট। এবং পরতেও অনেক আরামদায়ক। প্রাইস অনুযায়ী বেস্ট কোয়ালিটি!"</p>
                    </div>
                    
                    {/* Extra Images for padding out the masonry */}
                    {[
                        "/reviews/media__1778274732436.jpg",
                        "/reviews/media__1778274754541.jpg",
                        "/reviews/media__1778274754654.jpg",
                        "/reviews/media__1778274790928.jpg",
                    ].map((src, index) => (
                        <div key={index} className="rounded-2xl overflow-hidden shadow-lg break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                            <img src={src} alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Urgency & Call to Action Footer Section */}
            <section className="w-full bg-black text-white py-16 px-6 text-center border-t-4 border-red-600">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-xl mb-4 animate-pulse">
                        <Clock size={24} /> ⚡ আজকের অফার সীমিত!
                    </div>
                    <p className="text-2xl md:text-3xl font-black mb-2 text-white">
                        এই মুহূর্তে <span className="bg-red-600 px-3 py-1 rounded-md shadow-lg text-white mx-1">৪৭+ জন</span> এই পেজে আছেন
                    </p>
                    <p className="text-gray-400 mb-10 font-medium text-lg">স্টক শেষ হওয়ার আগেই আপনার অর্ডার দিন</p>
                    
                    <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-red-600 text-white px-10 py-5 rounded-full font-black text-xl md:text-2xl hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-105 flex items-center justify-center gap-3 mx-auto w-full md:w-auto">
                        <ShoppingBag size={28} /> 🛍️ এখনই অর্ডার দিন
                    </button>
                    
                    <div className="flex flex-wrap justify-center items-center gap-6 mt-10 text-sm text-gray-300 font-medium bg-[#111] py-4 px-6 rounded-2xl">
                        <span className="flex items-center gap-2"><Truck size={18} className="text-green-400" /> ক্যাশ অন ডেলিভারি</span>
                        <span className="flex items-center gap-2 text-gray-500">|</span>
                        <span className="flex items-center gap-2"><RefreshCw size={18} className="text-blue-400" /> ফ্রি রিটার্ন</span>
                        <span className="flex items-center gap-2 text-gray-500">|</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-yellow-400" /> ১০০% অরিজিনাল</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full py-10 px-6 bg-[#111] border-t border-gray-800 text-gray-500 flex flex-col items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-4 mb-2">
                    <img 
                        src="/logo.jpg" 
                        alt="NRZOONE Footer Logo" 
                        className="h-16 md:h-20 object-contain invert opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
                <p className="font-bold text-gray-400">© 2019 NRZOONE | All Rights Reserved</p>
                <div className="flex gap-6 mt-2">
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                </div>
            </footer>
        </div>
    );
};

export default Home;
