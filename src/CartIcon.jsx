import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const CartIcon = () => {
    const { cartCount } = useCart();
    
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-24 right-8 z-50"
        >
            <button
                onClick={() => {
                    const drawer = document.getElementById('cart-drawer');
                    if (drawer) drawer.style.transform = 'translateX(0)';
                }}
                className="relative bg-premium-dark text-white p-4 rounded-full shadow-2xl hover:bg-premium-gold transition-all group"
            >
                <ShoppingBag size={24} />
                <AnimatePresence>
                    {cartCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                        >
                            {cartCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        </motion.div>
    );
};

export default CartIcon;
