import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Package, UploadCloud, Edit, Trash2, Image as ImageIcon, Tag, Loader, X, PlusCircle } from 'lucide-react';

const ProductManagerView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Dynamic Categories
    const [categories, setCategories] = useState([
        { id: 'haya', name: 'হায়া সিরিজ' },
        { id: 'classic', name: 'ক্লাসিক কম্বো' },
        { id: 'ma', name: 'মা কালেকশন' },
        { id: 'maboromeye', name: 'মা ও বড়মেয়ে' },
        { id: 'borobon', name: 'বড়বোন কালেকশন' },
        { id: 'faiza', name: 'ফাইজা বোরকা' },
        { id: 'kids', name: 'কিডস কালেকশন' },
        { id: 'hijab', name: 'হিজাব কালেকশন' },
    ]);
    const [newCatName, setNewCatName] = useState('');

    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'haya',
        price: '',
        discountPrice: '',
        colors: [],
        sizes: [],
        imageUrl: '',
        stock: 'available',
        description: ''
    });

    const commonColors = [
        'Black', 'Maroon', 'Olive', 'Navy', 'Grey', 'Brown', 'Purple', 'White', 
        'Pink', 'Mehndi', 'Coffee', 'Chocolate', 'Sky Blue', 'Teal', 'Lavender', 
        'Emerald', 'Peach', 'Golden', 'Silver', 'Nude'
    ];
    
    // Size range for Borka/General
    const borkaSizes = Array.from({ length: (58 - 20) / 2 + 1 }, (_, i) => (20 + i * 2).toString());
    const hijabSizes = ['40 Inchi (Choto)', '72 Inchi (Majhari)', '80 Inchi (Boro)'];
    
    const currentSizes = newProduct.category === 'hijab' ? hijabSizes : [...borkaSizes, 'Free Size'];

    // Listen to Products
    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });
        return () => unsubscribe();
    }, []);

    // Listen to Custom Categories (Optional enhancement: load from Firestore)
    // For now, let's just keep them in local state or let user add to the list
    const handleAddCategory = () => {
        if (!newCatName) return;
        const id = newCatName.toLowerCase().replace(/\s+/g, '_');
        setCategories([...categories, { id, name: newCatName }]);
        setNewProduct({ ...newProduct, category: id });
        setNewCatName('');
        alert('নতুন ক্যাটাগরি যুক্ত হয়েছে!');
    };

    const toggleColor = (color) => {
        const current = [...newProduct.colors];
        if (current.includes(color)) {
            setNewProduct({ ...newProduct, colors: current.filter(c => c !== color) });
        } else {
            setNewProduct({ ...newProduct, colors: [...current, color] });
        }
    };

    const toggleSize = (size) => {
        const current = [...newProduct.sizes];
        if (current.includes(size)) {
            setNewProduct({ ...newProduct, sizes: current.filter(s => s !== size) });
        } else {
            setNewProduct({ ...newProduct, sizes: [...current, size] });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error", error);
                alert("ছবি আপলোড ফেইল হয়েছে।");
                setLoading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setNewProduct({ ...newProduct, imageUrl: downloadURL });
                setLoading(false);
                setUploadProgress(0);
            }
        );
    };

    const addProduct = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "products"), {
                ...newProduct,
                price: parseInt(newProduct.price),
                discountPrice: newProduct.discountPrice ? parseInt(newProduct.discountPrice) : null,
                createdAt: serverTimestamp()
            });
            setNewProduct({ name: '', category: 'haya', price: '', discountPrice: '', colors: [], sizes: [], imageUrl: '', stock: 'available', description: '' });
            alert('প্রোডাক্ট সফলভাবে যোগ করা হয়েছে!');
        } catch (error) {
            console.error(error);
            alert('দুঃখিত, কোনো একটি সমস্যা হয়েছে।');
        }
    };

    const deleteProduct = async (id) => {
        if (confirm('আপনি কি এই প্রোডাক্টটি ডিলিট করতে চান?')) {
            await deleteDoc(doc(db, "products", id));
        }
    };

    const toggleStock = async (id, currentStock) => {
        const newStock = currentStock === 'available' ? 'out_of_stock' : 'available';
        await updateDoc(doc(db, "products", id), { stock: newStock });
    };

    return (
        <div className="space-y-12 animate-fade-in text-slate-800 pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-extrabold tracking-tight underline decoration-slate-100 underline-offset-[12px]">ইনভেন্টরি ও প্রোডাক্ট আপলোড</h2>
            </div>

            {/* UPOLOAD FORM */}
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-black uppercase text-blue-600 mb-8 border-b-2 pb-4 inline-block">নতুন প্রোডাক্ট যুক্ত করুন</h3>
                <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="space-y-4 md:col-span-2 flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 relative overflow-hidden group">
                        {newProduct.imageUrl ? (
                            <img src={newProduct.imageUrl} alt="preview" className="h-48 object-contain rounded-xl shadow-lg z-10 relative" />
                        ) : (
                            <div className="text-center z-10 relative pointer-events-none">
                                <UploadCloud size={48} className="mx-auto text-slate-300 mb-4 group-hover:text-blue-500 transition-colors" />
                                <p className="font-bold text-slate-500">প্রোডাক্টের ছবি সিলেক্ট করুন (PNG/JPG)</p>
                            </div>
                        )}
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-blue-600 font-black">
                                <Loader className="animate-spin mb-2" size={32} />
                                {uploadProgress}% আপলোড হচ্ছে...
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-30 w-full h-full" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase text-slate-400">অথবা ছবির সরাসরি লিংক দিন (URL)</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input type="text" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} placeholder="https://..." className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-slate-400">কালেকশন / ক্যাটাগরি</label>
                        <div className="flex gap-2">
                           <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="flex-1 px-6 py-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold appearance-none">
                               {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-slate-400">নতুন ক্যাটাগরি তৈরি করুন (দরকার হলে)</label>
                        <div className="flex gap-2">
                           <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ক্যাটাগরি নাম..." className="flex-1 px-6 py-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                           <button type="button" onClick={handleAddCategory} className="bg-slate-900 text-white px-6 rounded-2xl font-bold uppercase text-[10px]">Add</button>
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase text-slate-400">প্রোডাক্টের নাম / টাইটেল</label>
                        <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="যেমন: এক্সক্লুসিভ বোরকা..." className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">রেগুলার প্রাইস (৳)</label>
                        <input required type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} placeholder="1500" className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold text-xl" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">ডিসকাউন্ট প্রাইস (৳)</label>
                        <input type="number" value={newProduct.discountPrice} onChange={(e) => setNewProduct({...newProduct, discountPrice: e.target.value})} placeholder="1250" className="w-full px-6 py-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold text-xl" />
                    </div>

                    <div className="space-y-4 md:col-span-2">
                        <label className="text-xs font-black uppercase text-slate-400">অ্যাভেইলেবল কালার (ড্রপডাউন সিলেক্ট)</label>
                        <div className="flex flex-wrap gap-3">
                            {commonColors.map(color => (
                                <button type="button" key={color} onClick={() => toggleColor(color)} className={`px-6 py-3 rounded-full font-bold text-sm transition-all border-2 ${newProduct.colors.includes(color) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'}`}>
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 md:col-span-2">
                        <label className="text-xs font-black uppercase text-slate-400">অ্যাভেইলেবল সাইজ (ড্রপডাউন সিলেক্ট)</label>
                        <div className="flex flex-wrap gap-3">
                            {currentSizes.map(size => (
                                <button type="button" key={size} onClick={() => toggleSize(size)} className={`px-6 py-3 rounded-full font-bold text-sm transition-all border-2 ${newProduct.sizes.includes(size) ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'}`}>
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2 border-t-2 pt-8 mt-4">
                        <button type="submit" disabled={!newProduct.imageUrl || loading} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-4">
                            <PlusCircle size={28} /> প্রোডাক্ট লাইভ করুন
                        </button>
                    </div>
                </form>
            </div>

            {/* PRODUCT LIST */}
            <div className="mt-16">
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-8 flex items-center gap-3"><Package size={28}/> আপনার সমস্ত প্রোডাক্ট ({products.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(product => (
                        <div key={product.firebaseId} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col group">
                            <div className="relative h-64 bg-slate-50 rounded-[1.5rem] overflow-hidden mb-6 flex items-center justify-center">
                                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${product.stock === 'available' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                    {product.stock === 'available' ? 'In Stock' : 'Out of Stock'}
                                </div>
                                <div className="absolute top-4 left-4 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-black text-white shadow-lg">
                                   {categories.find(c => c.id === product.category)?.name || product.category}
                                </div>
                            </div>
                            <h4 className="text-xl font-black truncate">{product.name}</h4>
                            <div className="mt-2 flex items-center gap-4">
                                {product.discountPrice ? (
                                    <>
                                        <span className="text-rose-600 font-black text-xl">৳{product.discountPrice}</span>
                                        <span className="text-slate-400 font-bold line-through text-sm">৳{product.price}</span>
                                    </>
                                ) : (
                                    <span className="text-slate-900 font-black text-xl">৳{product.price}</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-black uppercase text-slate-500">
                                <span className="px-3 py-1 bg-slate-100 rounded-full">{product.colors?.length || 0} Colors</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-full">{product.sizes?.length || 0} Sizes</span>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t-2 border-slate-50 flex gap-4">
                                <button onClick={() => toggleStock(product.firebaseId, product.stock)} className={`flex-1 py-4 text-xs font-black uppercase tracking-wide rounded-2xl transition-all ${product.stock === 'available' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                                    {product.stock === 'available' ? 'Mark Out of Stock' : 'Mark In Stock'}
                                </button>
                                <button onClick={() => deleteProduct(product.firebaseId)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductManagerView;
