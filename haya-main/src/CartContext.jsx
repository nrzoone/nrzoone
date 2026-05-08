import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('nrzone_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('nrzone_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id && item.color === product.color && item.size === product.size);
            if (existing) {
                return prev.map(item => 
                    (item.id === product.id && item.color === product.color && item.size === product.size) 
                    ? { ...item, quantity: item.quantity + product.quantity } 
                    : item
                );
            }
            return [...prev, product];
        });
        
        // Facebook Pixel AddToCart
        if (window.fbq) {
            window.fbq('track', 'AddToCart', {
                content_name: product.name,
                content_category: 'Borka',
                value: product.price,
                currency: 'BDT',
                num_items: product.quantity
            });
        }
    };

    const removeFromCart = (id, color, size) => {
        setCartItems(prev => prev.filter(item => !(item.id === id && item.color === color && item.size === size)));
    };

    const updateQuantity = (id, color, size, quantity) => {
        setCartItems(prev => prev.map(item => 
            (item.id === id && item.color === color && item.size === size) 
            ? { ...item, quantity: Math.max(1, quantity) } 
            : item
        ));
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            cartTotal, 
            cartCount 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
