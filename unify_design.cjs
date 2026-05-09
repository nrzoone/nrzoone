const fs = require('fs');
const path = require('path');
const srcDir = path.join(process.cwd(), 'src');
const files = [
    'MaBoroMeyeCollection.jsx',
    'KidsCollection.jsx',
    'HijabCollection.jsx',
    'FaizaCollection.jsx',
    'ClassicCollection.jsx',
    'BoroBonCollection.jsx'
];

const reelSection = `
            {/* Featured Reel Video Section */}
            <section className="w-full bg-black py-0">
                <div className="max-w-[1600px] mx-auto flex flex-col items-center">
                    <div className="relative w-full max-w-[500px] aspect-[9/16] bg-black overflow-hidden shadow-2xl">
                        <iframe 
                            src={\`https://www.facebook.com/plugins/video.php?href=\${encodeURIComponent('https://www.facebook.com/reel/1558834275471712')}&show_text=0&t=0&autoplay=1&mute=1\`}
                            className="absolute inset-0 w-full h-full border-none"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
                            allowFullScreen={true}
                        ></iframe>
                    </div>
                </div>
            </section>
`;

const extraSections = `
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

            {/* Trust Badges Section */}
            <section className="py-12 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="flex flex-col items-center text-center space-y-3 group">
                            <div className="w-16 h-16 bg-premium-light rounded-full flex items-center justify-center text-premium-dark group-hover:bg-premium-dark group-hover:text-white transition-all duration-500 shadow-sm">
                                <ShieldCheck size={32} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-widest">১০০% অরিজিনাল</h4>
                            <p className="text-xs text-gray-500 font-bold italic">প্রিমিয়াম কোয়ালিটি গ্যারান্টি</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-3 group">
                            <div className="w-16 h-16 bg-premium-light rounded-full flex items-center justify-center text-premium-dark group-hover:bg-premium-dark group-hover:text-white transition-all duration-500 shadow-sm">
                                <Truck size={32} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-widest">ফাস্ট ডেলিভারি</h4>
                            <p className="text-xs text-gray-500 font-bold italic">সারা বাংলাদেশে ১-৩ দিনে</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-3 group">
                            <div className="w-16 h-16 bg-premium-light rounded-full flex items-center justify-center text-premium-dark group-hover:bg-premium-dark group-hover:text-white transition-all duration-500 shadow-sm">
                                <RefreshCw size={32} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-widest">রিটার্ন সুবিধা</h4>
                            <p className="text-xs text-gray-500 font-bold italic">৭ দিনের সহজ রিটার্ন</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-3 group">
                            <div className="w-16 h-16 bg-premium-light rounded-full flex items-center justify-center text-premium-dark group-hover:bg-premium-dark group-hover:text-white transition-all duration-500 shadow-sm">
                                <ShoppingBag size={32} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-widest">ক্যাশ অন ডেলিভারি</h4>
                            <p className="text-xs text-gray-500 font-bold italic">পণ্য হাতে পেয়ে টাকা দিন</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* === SOCIAL PROOF MEGA SECTION === */}
            <section className="py-20 bg-gradient-to-b from-[#FFF8F0] to-white relative overflow-hidden">

                {/* Live order ticker */}
                <div className="bg-red-600 text-white py-3 overflow-hidden mb-16">
                    <div style={{
                        display: 'flex',
                        gap: '60px',
                        animation: 'marquee 18s linear infinite',
                        whiteSpace: 'nowrap'
                    }}>
                        {['🔴 LIVE: সানজিদা (ঢাকা) এইমাত্র অর্ডার করেছেন',
                          '🔴 LIVE: নাফিসা (চট্টগ্রাম) কালো বোরকা অর্ডার করেছেন',
                          '🔴 LIVE: রহিমা বেগম (সিলেট) হিজাবসহ সেট অর্ডার করেছেন',
                          '🔴 LIVE: ফাতেমা (গাজীপুর) অলিভ বোরকা অর্ডার করেছেন',
                          '🔴 LIVE: আয়েশা (রাজশাহী) মেরুন বোরকা অর্ডার করেছেন',
                        ].concat(['🔴 LIVE: সানজিদা (ঢাকা) এইমাত্র অর্ডার করেছেন',
                          '🔴 LIVE: নাফিসা (চট্টগ্রাম) কালো বোরকা অর্ডার করেছেন',
                          '🔴 LIVE: রহিমা বেগম (সিলেট) হিজাবসহ সেট অর্ডার করেছেন',
                          '🔴 LIVE: ফাতেমা (গাজীপুর) অলিভ বোরকা অর্ডার করেছেন',
                          '🔴 LIVE: আয়েশা (রাজশাহী) মেরুন বোরকা অর্ডার করেছেন'
                        ]).map((t, i) => <span key={i} className="text-sm font-bold tracking-wide">{t}&nbsp;&nbsp;&nbsp;&nbsp;|</span>)}
                    </div>
                    <style>{\`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }\`}</style>
                </div>

                <div className="max-w-7xl mx-auto px-4">
                    {/* Header */}
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                            <CheckCircle2 size={14} /> ৩০০০+ সন্তুষ্ট কাস্টমার
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-premium-dark leading-tight">তারা পেয়েছেন, আপনিও পাবেন!</h2>
                        <p className="text-gray-500 mt-3 text-lg font-medium">বাস্তব ক্রেতাদের অভিজ্ঞতা ও ছবি — কোনো নকল নয়</p>
                        <div className="flex justify-center gap-1 mt-3 text-yellow-400">
                            {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={22} />)}
                        </div>
                    </div>

                    {/* Photo Review Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[
                            {
                                img: '/real_review_p1.jpg',
                                name: 'সানজিদা আক্তার',
                                loc: 'মিরপুর, ঢাকা',
                                text: '"আলহামদুলিল্লাহ! যেমনটা ছবিতে দেখেছি ঠিক তেমনই পেয়েছি। কাপড় অনেক সফট, স্টোন কাজ অসাধারণ! পরের বার আবার নেবো।"',
                                badge: 'ব্লু + ব্ল্যাক কম্বো'
                            },
                            {
                                img: '/real_review_p2.jpg',
                                name: 'নাসরিন বেগম',
                                loc: 'গাজীপুর',
                                text: '"ছবির চেয়ে আরও সুন্দর পেয়েছি হাতে! কাপড় প্রিমিয়াম, স্টোনের কাজ অনেক সূক্ষ্ম। ১০০% রেকমেন্ড করবো।"',
                                badge: 'ব্লু স্টোন বোরকা — ফ্রন্ট'
                            },
                            {
                                img: '/real_review_p3.jpg',
                                name: 'ফারহানা আফরোজ',
                                loc: 'চট্টগ্রাম',
                                text: '"ব্যাক ডিজাইনটা দেখে মুগ্ধ হয়ে গেছি! আমার মা ও শাশুড়ি দুজনেই দেখে পছন্দ করলেন। পরিবারের সবার জন্য নেবো।"',
                                badge: 'ব্লু বোরকা — ব্যাক ডিটেইল'
                            }
                        ].map((r, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -6 }}
                                className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-premium-dark">
                                        ✅ {r.badge}
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col gap-3">
                                    <div className="flex gap-1 text-yellow-400">
                                        {[...Array(5)].map((_, j) => <Star key={j} fill="currentColor" size={14} />)}
                                    </div>
                                    <p className="text-gray-700 font-semibold italic leading-relaxed text-sm flex-1">{r.text}</p>
                                    <div className="flex items-center gap-3 pt-3 border-t">
                                        <div className="w-10 h-10 rounded-full bg-premium-dark text-white flex items-center justify-center font-black">{r.name[0]}</div>
                                        <div>
                                            <p className="font-black text-sm flex items-center gap-1">{r.name} <CheckCircle2 size={13} className="text-blue-500" /></p>
                                            <p className="text-xs text-gray-400">{r.loc} · <span className="text-green-600 font-bold">Verified Purchase</span></p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* WhatsApp screenshot + big quote */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="rounded-3xl overflow-hidden shadow-xl border-2 border-gray-100">
                            <img src="/real_review_chat.jpg" alt="কাস্টমার রিভিউ" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-premium-dark text-white rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-5 text-[200px]">❝</div>
                            <div>
                                <div className="flex gap-1 text-yellow-400 mb-4">
                                    {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
                                </div>
                                <p className="text-2xl md:text-3xl font-black italic leading-snug">
                                    "একথায় অসাধারণ। মা, মেয়ে, শাশুড়ি, ননদ — সবার পছন্দ হয়েছে। এই দামে এত কোয়ালিটি পাবো ভাবিনি! ❤️"
                                </p>
                            </div>
                            <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                                <div className="w-12 h-12 bg-premium-gold rounded-full flex items-center justify-center text-premium-dark font-black text-xl">R</div>
                                <div>
                                    <p className="font-black text-lg">রহিমা বেগম</p>
                                    <p className="text-xs text-white/50 uppercase tracking-widest">সিলেট · Verified Customer ✓</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Urgency CTA */}
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-8 text-white text-center shadow-2xl">
                        <div className="inline-block bg-white/20 text-white text-xs font-black px-4 py-1 rounded-full mb-4 animate-pulse">⚡ আজকের অফার সীমিত!</div>
                        <h3 className="text-2xl md:text-4xl font-black mb-2">এই মুহূর্তে ৪৭+ জন এই পেজে আছেন</h3>
                        <p className="text-white/80 mb-6 text-lg">স্টক শেষ হওয়ার আগেই আপনার অর্ডার দিন</p>
                        <button
                            onClick={() => orderFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-red-600 px-10 py-4 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-lg active:scale-95"
                        >
                            🛍️ এখনই অর্ডার দিন
                        </button>
                        <p className="text-xs text-white/60 mt-4">ক্যাশ অন ডেলিভারি · ফ্রি রিটার্ন · ১০০% অরিজিনাল</p>
                    </div>
                </div>
            </section>
`;

files.forEach(f => {
    const p = path.join(srcDir, f);
    if (!fs.existsSync(p)) return;

    let c = fs.readFileSync(p, 'utf8');

    // 1. Add RefreshCw if missing
    if (c.includes('lucide-react') && !c.includes('RefreshCw')) {
        c = c.replace(/\} from 'lucide-react';/, "    RefreshCw\n} from 'lucide-react';");
    }

    // 2. Insert Reel Section after Navigation
    if (!c.includes('Featured Reel Video Section')) {
        c = c.replace(/\{\/\* Hero Section \*\/\}/, reelSection + "\n            {/* Hero Section */}");
    }

    // 3. Insert Extra Sections before Order Form
    if (!c.includes('SOCIAL PROOF MEGA SECTION')) {
        c = c.replace(/\{\/\* Order Form \*?\/\}/, extraSections + "\n            {/* Order Form */}");
    }

    fs.writeFileSync(p, c);
    console.log('Updated ' + f);
});
