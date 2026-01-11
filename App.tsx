
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  TrendingUp, 
  ShoppingBag, 
  LayoutDashboard,
  ShoppingCart,
  History,
  Trash2,
  MapPin,
  Phone,
  User,
  ArrowRight,
  Database,
  AlertCircle
} from 'lucide-react';
import { Product, Order, OrderItem, ProductSize } from './types';
import ProductForm from './components/ProductForm';
import ProductCard from './components/ProductCard';

// API URL - assuming api.php is in the same directory
const API_BASE = 'api.php';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Fetch data from MySQL via PHP
  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const prodRes = await fetch(`${API_BASE}?action=products`);
      if (!prodRes.ok) throw new Error(`HTTP Error: ${prodRes.status}`);
      
      const prodText = await prodRes.text();
      let prodData = [];
      try {
        prodData = JSON.parse(prodText);
      } catch (e) {
        console.error("Products Parse Error Raw Text:", prodText);
        throw new Error("API থেকে সঠিক ডাটা পাওয়া যায়নি। ফাইলটি আপলোড করা হয়েছে কি?");
      }
      setProducts(Array.isArray(prodData) ? prodData : []);

      const orderRes = await fetch(`${API_BASE}?action=orders`);
      const orderText = await orderRes.text();
      let orderData = [];
      try {
        orderData = JSON.parse(orderText);
      } catch (e) {
        console.error("Orders Parse Error:", orderText);
      }
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addProduct = async (newProduct: Product) => {
    try {
      const res = await fetch(`${API_BASE}?action=add_product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setProducts(prev => [newProduct, ...prev]);
        setIsModalOpen(false);
      } else {
        alert("সার্ভার ডাটা গ্রহণ করেনি।");
      }
    } catch (error) {
      alert("ডাটাবেজে সেভ করতে সমস্যা হয়েছে!");
    }
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('প্রোডাক্টটি ডিলিট করতে চান?')) {
      try {
        const res = await fetch(`${API_BASE}?action=delete_product&id=${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setProducts(prev => prev.filter(p => p.id !== id));
        }
      } catch (error) {
        alert("ডিলিট করতে সমস্যা হয়েছে!");
      }
    }
  };

  const addToCart = (product: Product) => {
    const availableSize = product.sizes.find(s => (product.stockBySize[s] || 0) > 0);
    if (!availableSize) {
      alert('এই প্রোডাক্টটি বর্তমানে স্টকে নেই!');
      return;
    }

    const item: OrderItem = {
      productId: product.id,
      name: product.name,
      size: availableSize,
      price: product.price,
      quantity: 1
    };
    setCart(prev => [...prev, item]);
    setIsOrderModalOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItem = (index: number, field: keyof OrderItem, value: any) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const placeOrder = async () => {
    if (!custName || !custPhone || !custAddress || cart.length === 0) {
      alert('কাস্টমারের সব তথ্য দিন।');
      return;
    }

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      items: [...cart],
      totalAmount,
      createdAt: Date.now()
    };

    try {
      const res = await fetch(`${API_BASE}?action=place_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (res.ok) {
        await fetchData();
        setCart([]);
        setCustName(''); setCustPhone(''); setCustAddress('');
        setIsOrderModalOpen(false);
        setActiveTab('orders');
        alert('অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!');
      } else {
        alert("অর্ডার সেভ করতে সার্ভারে সমস্যা হয়েছে।");
      }
    } catch (error) {
      alert("অর্ডার সেভ করতে সমস্যা হয়েছে!");
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalProducts: products.length,
      totalItemsInStock: products.reduce((acc, p) => acc + Object.values(p.stockBySize).reduce<number>((a, b) => a + (Number(b) || 0), 0), 0),
      totalOrders: orders.length
    };
  }, [products, orders]);

  return (
    <div className="min-h-screen flex bg-gray-50 pb-20 md:pb-0 font-['Hind_Siliguri']">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-950 text-white sticky top-0 h-screen shadow-2xl">
        <div className="p-8">
          <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <ShoppingBag className="text-indigo-400" />
            Inventory <span className="text-indigo-400">Pro</span>
          </h1>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-900/50 px-3 py-1.5 rounded-full w-fit">
            <Database size={12}/> MySQL Connected
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="ড্যাশবোর্ড" />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={20} />} label="ইনভেন্টরি" />
          <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<History size={20} />} label="অর্ডার হিস্ট্রি" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b p-4 sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="md:hidden">
               <h1 className="text-xl font-black text-indigo-950 leading-none">ইনভেন্টরি প্রো</h1>
             </div>
             <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="সার্চ করুন..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-gray-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsOrderModalOpen(true)} className="relative bg-white border border-indigo-200 text-indigo-600 p-2.5 rounded-full hover:bg-indigo-50 transition-all shadow-sm">
                <ShoppingCart size={20} />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-pulse shadow-md">{cart.length}</span>}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-bold shadow-lg transition-all active:scale-95">
                <Plus size={20} />
                নতুন মাল যুক্ত করুন
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {apiError && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-3xl mb-8 flex items-center gap-4 text-red-700">
               <AlertCircle size={32} />
               <div>
                 <p className="font-black text-lg">ডাটাবেজ কানেকশন এরর!</p>
                 <p className="text-sm font-bold">{apiError}</p>
                 <button onClick={fetchData} className="mt-2 text-xs bg-red-600 text-white px-4 py-1.5 rounded-full font-black">আবার চেষ্টা করুন</button>
               </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-600 font-bold animate-pulse">ডাটাবেজ থেকে তথ্য আনা হচ্ছে...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard label="প্রোডাক্ট আইটেম" value={stats.totalProducts + ' টি'} color="blue" icon={<Package size={24}/>} />
                    <StatCard label="মোট স্টক" value={stats.totalItemsInStock + ' টি'} color="emerald" icon={<TrendingUp size={24}/>} />
                    <StatCard label="সম্পন্ন অর্ডার" value={stats.totalOrders + ' টি'} color="purple" icon={<History size={24}/>} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-indigo-950 mb-8 flex items-center gap-3">
                      <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                      রিসেন্ট ইনভেন্টরি
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} onDelete={deleteProduct} onAddToCart={addToCart} />)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="animate-in slide-in-from-bottom duration-500">
                   <h2 className="text-2xl font-black text-indigo-950 mb-8 flex items-center gap-3">
                      <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                      সমস্ত ইনভেন্টরি
                   </h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {filteredProducts.map(p => <ProductCard key={p.id} product={p} onDelete={deleteProduct} onAddToCart={addToCart} />)}
                   </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                   <h2 className="text-2xl font-black text-indigo-950 mb-8 flex items-center gap-3">
                      <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                      অর্ডার হিস্ট্রি (MySQL)
                   </h2>
                   {orders.length === 0 ? <p className="text-gray-400 font-medium text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">এখনো কোনো অর্ডার রেকর্ড পাওয়া যায়নি।</p> : (
                     <div className="grid gap-6">
                       {orders.map(order => (
                         <div key={order.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-8 hover:shadow-xl transition-all duration-300">
                           <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{order.id}</span>
                                 <span className="text-xs text-gray-400 font-bold">{new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                              <h4 className="font-black text-gray-900 text-xl tracking-tight">{order.customerName}</h4>
                              <div className="space-y-2">
                                 <p className="text-sm text-gray-500 font-bold flex items-center gap-3 bg-gray-50 w-fit px-4 py-1.5 rounded-full"><Phone size={14} className="text-indigo-400"/> {order.customerPhone}</p>
                                 <p className="text-sm text-gray-500 font-bold flex items-center gap-3 bg-gray-50 w-fit px-4 py-1.5 rounded-full"><MapPin size={14} className="text-indigo-400"/> {order.customerAddress}</p>
                              </div>
                           </div>
                           <div className="bg-indigo-50/30 p-6 rounded-3xl min-w-[320px] border border-indigo-100/50">
                              <p className="text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-[0.2em] border-b border-indigo-100 pb-3">মেমো ডিটেইলস</p>
                              <div className="space-y-3">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex justify-between text-sm">
                                     <span className="text-gray-600 font-bold">{item.name} <span className="text-indigo-600 text-[10px] font-black">({item.size})</span> <span className="text-gray-400 ml-1">x{item.quantity}</span></span>
                                     <span className="font-black text-gray-900">৳{item.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-6 pt-4 border-t-2 border-dashed border-indigo-200 flex justify-between font-black text-indigo-800 text-base">
                                 <span>সর্বমোট:</span>
                                 <span className="text-xl">৳{order.totalAmount}</span>
                              </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Cart/Checkout Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col md:row border border-white/20">
            <div className="flex-1 p-10 border-r border-gray-100 overflow-y-auto bg-white">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                  <ShoppingCart className="text-indigo-600" size={32}/> কাস্টমার মেমো
                </h2>
                <button onClick={() => setIsOrderModalOpen(false)} className="md:hidden text-gray-400 hover:text-red-500 text-2xl">✕</button>
              </div>
              
              {cart.length === 0 ? <p className="text-gray-400 text-center py-24 font-bold text-lg">অর্ডার লিস্ট খালি</p> : (
                <div className="space-y-6">
                  {cart.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={index} className="bg-gray-50/50 p-6 rounded-[2rem] flex items-center gap-6 border border-gray-100 relative group transition-all hover:bg-white hover:shadow-lg">
                        <img src={product?.image} className="w-24 h-24 rounded-3xl object-cover shadow-xl group-hover:rotate-2 transition-transform"/>
                        <div className="flex-1 space-y-4">
                           <h4 className="font-black text-lg text-indigo-950 tracking-tight">{item.name}</h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">সাইজ</label>
                                <select 
                                  className="w-full text-xs font-bold p-2.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none"
                                  value={item.size}
                                  onChange={(e) => updateCartItem(index, 'size', e.target.value as ProductSize)}
                                >
                                  {product?.sizes.map(s => (
                                    <option key={s} value={s} disabled={(product.stockBySize[s] || 0) <= 0}>
                                      {s} (স্টক: {product.stockBySize[s] || 0})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">প্রাইস (৳)</label>
                                <input 
                                  type="number" 
                                  className="w-full text-xs font-black p-2.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                  value={item.price}
                                  onChange={(e) => updateCartItem(index, 'price', parseInt(e.target.value) || 0)}
                                />
                              </div>
                           </div>
                        </div>
                        <button onClick={() => removeFromCart(index)} className="p-3 text-red-300 hover:text-red-600 transition-colors bg-white rounded-full shadow-sm hover:shadow-md">
                          <Trash2 size={22}/>
                        </button>
                      </div>
                    );
                  })}
                  <div className="bg-indigo-950 text-white p-8 rounded-[2.5rem] flex justify-between items-center shadow-2xl shadow-indigo-200 border border-white/10">
                     <div>
                       <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-2">টোটাল পেমেন্ট</p>
                       <p className="text-4xl font-black tracking-tight">৳{cart.reduce((a, c) => a + (c.price * c.quantity), 0)}</p>
                     </div>
                     <div className="bg-indigo-800 p-4 rounded-3xl">
                        <ArrowRight size={32} className="text-white animate-pulse"/>
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-[420px] bg-indigo-50/50 p-10 flex flex-col border-l border-indigo-100">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-indigo-950 tracking-tight">কাস্টমার তথ্য</h2>
                <button onClick={() => setIsOrderModalOpen(false)} className="hidden md:block text-gray-400 hover:text-red-500 transition-colors">✕</button>
              </div>
              <div className="space-y-6 flex-1">
                <InputGroup icon={<User size={18}/>} label="নাম" value={custName} onChange={setCustName} placeholder="কাস্টমারের নাম লিখুন" />
                <InputGroup icon={<Phone size={18}/>} label="মোবাইল" value={custPhone} onChange={setCustPhone} placeholder="০১৮XXXXXXXX" />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-widest"><MapPin size={14} className="text-indigo-600"/> ফুল এড্রেস</label>
                  <textarea 
                    className="w-full px-5 py-4 rounded-3xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm transition-all focus:bg-white min-h-[120px]"
                    rows={4} value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="পুরো ঠিকানা এখানে লিখুন..."
                  />
                </div>
              </div>
              <button 
                onClick={placeOrder}
                className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-10 flex items-center justify-center gap-3 text-xl tracking-tight"
              >
                অর্ডার কনফার্ম করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b flex justify-between items-center bg-indigo-50/50">
              <h2 className="text-2xl font-black text-indigo-950 tracking-tight">ইনভেন্টরি এন্ট্রি</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-full transition-all text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto p-10 max-h-[calc(90vh-140px)] bg-white">
              <ProductForm onSubmit={addProduct} onCancel={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t px-8 py-4 flex justify-around z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem]">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={26} />} label="হোম" />
        <MobileNavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={26} />} label="স্টক" />
        <MobileNavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<History size={26} />} label="অর্ডার" />
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/50 scale-[1.02]' : 'text-indigo-300 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span className="tracking-tight">{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-gray-300'}`}>
    {icon} <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard = ({ label, value, color, icon }: any) => {
  const colorMap: any = { 
    blue: 'bg-blue-600 text-white shadow-blue-200', 
    emerald: 'bg-emerald-600 text-white shadow-emerald-200', 
    purple: 'bg-indigo-950 text-white shadow-indigo-200' 
  };
  return (
    <div className={`${colorMap[color]} p-8 rounded-[2.5rem] shadow-xl flex items-center gap-8 hover:translate-y-[-4px] transition-all duration-300`}>
      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">{icon}</div>
      <div>
        <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

const InputGroup = ({ icon, label, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-widest">{icon} {label}</label>
    <input 
      className="w-full px-5 py-4 rounded-[1.5rem] border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm transition-all focus:bg-white"
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    />
  </div>
);

export default App;
