
import React from 'react';
import { Trash2, ShoppingCart, Calendar, Info } from 'lucide-react';
import { Product, ProductSize } from '../types';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete, onAddToCart }) => {
  const formattedDate = new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(product.createdAt));

  // Explicitly type the reduce return and use generic to avoid 'unknown' inference
  const totalStock = Object.values(product.stockBySize).reduce<number>((a, b) => a + (Number(b) || 0), 0);

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-3 left-3">
            {/* totalStock is now correctly inferred as a number */}
            <span className={`backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${totalStock <= 5 ? 'bg-red-500/80' : 'bg-black/40'}`}>
                মোট স্টক: {totalStock} টি
            </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
          className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1">{product.name}</h3>
          <p className="text-indigo-700 font-extrabold text-sm">৳{product.price}</p>
        </div>
        
        {/* Size-wise Stock Display */}
        <div className="bg-gray-50 rounded-xl p-2.5 mb-4">
           <p className="text-[10px] font-bold text-gray-400 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
             <Info size={10}/> সাইজ ইনভেন্টরি
           </p>
           <div className="grid grid-cols-3 gap-1">
             {product.sizes.map(size => (
               <div key={size} className="flex flex-col items-center bg-white rounded-lg py-1 border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="text-[10px] font-black text-indigo-600">{size}</span>
                  <span className={`text-[10px] font-bold ${product.stockBySize[size] === 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {product.stockBySize[size] || 0}
                  </span>
               </div>
             ))}
           </div>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-50 flex flex-col gap-3">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium px-1">
            <span className="flex items-center gap-1"><Calendar size={12}/> {formattedDate}</span>
          </div>
          <button 
            disabled={totalStock === 0}
            onClick={() => onAddToCart(product)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
              totalStock === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'
            }`}
          >
            <ShoppingCart size={14} />
            {totalStock === 0 ? 'আউট অফ স্টক' : 'অর্ডারে যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
