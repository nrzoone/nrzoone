import React from 'react';
import { motion } from 'framer-motion';
import { Search, User, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

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
            image: '/hero_maroon.jpg', 
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
                    <Search className="w-5 h-5 cursor-pointer hover:text-gray-500 transition" />
                    <User className="w-5 h-5 cursor-pointer hover:text-gray-500 transition hidden sm:block" />
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5 cursor-pointer hover:text-gray-500 transition" />
                        <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            0
                        </span>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative w-full h-[500px] md:h-[700px] overflow-hidden bg-[#e6e2db]">
                <img 
                    src="/classic_combo_main.jpg" 
                    alt="Hero Borka" 
                    className="absolute inset-0 w-full h-full object-cover object-[center_25%]"
                />
                <div className="absolute inset-0 bg-black/30" /> {/* Subtle overlay to ensure text readability */}
                
                <div className="absolute inset-0 max-w-[1600px] mx-auto px-6 md:px-16 py-24 flex flex-col justify-center">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)] max-w-4xl"
                    >
                        PREMIUM<br />MODESTY
                    </motion.h2>
                    
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

            {/* Footer Placeholder for completeness */}
            <footer className="w-full py-10 px-6 mt-10 border-t border-gray-100 flex flex-col items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-4 mb-2">
                    <img 
                        src="/logo.jpg" 
                        alt="NRZOONE Footer Logo" 
                        className="h-16 md:h-20 object-contain mix-blend-difference invert opacity-80"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
                <p className="font-bold">© 2026 NRZOONE | All Rights Reserved</p>
                <div className="flex gap-6 mt-2">
                    <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
                    <a href="/admin" className="hover:text-black transition-colors">Admin Dashboard</a>
                </div>
            </footer>
        </div>
    );
};

export default Home;
