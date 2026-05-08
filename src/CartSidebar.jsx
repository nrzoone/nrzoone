import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const CartSidebar = () => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);

    const toggleDrawer = () => setIsOpen(!isOpen);

    return (
        <AnimatePresence>
            <div 
                id="cart-drawer"
                className="fixed top-0 right-0 w-full md:w-[450px] h-full z-[100] transform transition-transform duration-500 translate-x-full bg-white shadow-2xl flex flex-col"
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
            >
                {/* Header */}
                <div className="p-6 bg-premium-dark text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={24} className="text-premium-gold" />
                        <h2 className="text-xl font-bold uppercase tracking-widest">আপনার ব্যাগ</h2>
                    </div>
                    <button 
                        onClick={() => {
                            const drawer = document.getElementById('cart-drawer');
                            if (drawer) drawer.style.transform = 'translateX(100%)';
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                            <ShoppingBag size={80} />
                            <p className="text-xl font-bold uppercase tracking-widest">ব্যাগটি ফাঁকা</p>
                        </div>
                    ) : (
                        cartItems.map((item, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                                <div className="w-24 h-32 rounded-xl overflow-hidden bg-white border border-gray-200">
                                    <img src={item.image || "/placeholder_item.jpg"} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-800 leading-tight">{item.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{item.color} | {item.size}</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200">
                                            <button onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)} className="p-1 hover:text-[#FF4D6D]"><Minus size={14} /></button>
                                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)} className="p-1 hover:text-[#FF4D6D]"><Plus size={14} /></button>
                                        </div>
                                        <p className="font-black text-[#FF4D6D]">{item.price * item.quantity} ৳</p>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.id, item.color, item.size)}
                                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
                        <div className="flex justify-between items-center text-xl font-black italic">
                            <span>সর্বমোট:</span>
                            <span className="text-[#FF4D6D]">{cartTotal} ৳</span>
                        </div>
                        <button 
                            onClick={() => {
                                // Scroll to order form
                                const form = document.querySelector('section[ref]'); 
                                // Or use a standard ID
                                const orderForm = document.getElementById('order-form') || document.querySelector('form');
                                if (orderForm) {
                                    orderForm.scrollIntoView({ behavior: 'smooth' });
                                    // Close sidebar
                                    const drawer = document.getElementById('cart-drawer');
                                    if (drawer) drawer.style.transform = 'translateX(100%)';
                                } else {
                                    window.location.href = '/#form';
                                }
                            }}
                            className="w-full bg-[#FF4D6D] text-white py-5 rounded-2xl font-extrabold text-xl shadow-xl hover:bg-[#E63958] transition-all flex items-center justify-center gap-3 shadow-[#FF4D6D]/20 group"
                        >
                            সরাসরি চেকআউট <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">সকল মূল্য অন্তর্ভুক্ত (কুরিয়ার চার্জ ছাড়া)</p>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
};

export default CartSidebar;
