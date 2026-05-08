import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import LandingPage from './LandingPage';
import ClassicCollection from './ClassicCollection';
import FaizaCollection from './FaizaCollection';
import KidsCollection from './KidsCollection';
import BoroBonCollection from './BoroBonCollection';
import MaCollection from './MaCollection';
import MaBoroMeyeCollection from './MaBoroMeyeCollection';
import AdminDashboard from './AdminDashboard';
import HijabCollection from './HijabCollection';


import { CartProvider } from './CartContext';
import CartSidebar from './CartSidebar';
import CartIcon from './CartIcon';

function App() {
    return (
        <CartProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/haya" element={<LandingPage />} />
                    <Route path="/classic" element={<ClassicCollection />} />
                    <Route path="/faiza" element={<FaizaCollection />} />
                    <Route path="/kids" element={<KidsCollection />} />
                    <Route path="/borobon" element={<BoroBonCollection />} />
                    <Route path="/ma" element={<MaCollection />} />
                    <Route path="/maboromeye" element={<MaBoroMeyeCollection />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/hijab" element={<HijabCollection />} />

                </Routes>
                <CartSidebar />
                <CartIcon />
            </Router>
        </CartProvider>
    );
}

export default App;
