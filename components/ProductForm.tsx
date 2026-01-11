
import React, { useState, useRef } from 'react';
import { ImagePlus, Sparkles, X, Hash } from 'lucide-react';
import { Product, ProductSize } from '../types';
import { generateProductDescription } from '../services/geminiService';

const AVAILABLE_SIZES: ProductSize[] = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

interface ProductFormProps {
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>([]);
  const [sizeStocks, setSizeStocks] = useState<Partial<Record<ProductSize, string>>>({});
  const [image, setImage] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleSize = (size: ProductSize) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(prev => prev.filter(s => s !== size));
      const newStocks = { ...sizeStocks };
      delete newStocks[size];
      setSizeStocks(newStocks);
    } else {
      setSelectedSizes(prev => [...prev, size]);
      setSizeStocks(prev => ({ ...prev, [size]: '10' })); // Default stock 10
    }
  };

  const handleStockChange = (size: ProductSize, value: string) => {
    setSizeStocks(prev => ({ ...prev, [size]: value }));
  };

  const handleAISuggestion = async () => {
    if (!name || !price) {
      alert('AI সাজেশন পেতে আগে প্রোডাক্টের নাম এবং দাম দিন।');
      return;
    }
    setIsAILoading(true);
    const suggestedDesc = await generateProductDescription(name, parseInt(price));
    setDescription(suggestedDesc);
    setIsAILoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || selectedSizes.length === 0 || !image) {
      alert('অনুগ্রহ করে সব তথ্য পূরণ করুন।');
      return;
    }

    const finalStockBySize: Partial<Record<ProductSize, number>> = {};
    selectedSizes.forEach(size => {
      finalStockBySize[size] = parseInt(sizeStocks[size] || '0');
    });

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name,
      price: parseInt(price),
      stockBySize: finalStockBySize,
      sizes: selectedSizes,
      image,
      description,
      createdAt: Date.now()
    };

    onSubmit(newProduct);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative group w-48 h-48 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-inner"
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <ImagePlus size={40} />
              <p className="text-xs font-medium">ছবি আপলোড</p>
            </div>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">প্রোডাক্টের নাম</label>
          <input 
            type="text" 
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={name} onChange={(e) => setName(e.target.value)} required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">বিক্রয় মূল্য (৳)</label>
          <input 
            type="number" 
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
            value={price} onChange={(e) => setPrice(e.target.value)} required
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">সাইজ ও স্টক নির্ধারণ করুন</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AVAILABLE_SIZES.map(size => (
            <div key={size} className={`p-3 rounded-xl border-2 transition-all ${selectedSizes.includes(size) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-white'}`}>
              <button
                type="button"
                onClick={() => toggleSize(size)}
                className={`w-full text-left font-bold text-sm mb-2 flex items-center justify-between ${selectedSizes.includes(size) ? 'text-indigo-700' : 'text-gray-400'}`}
              >
                {size}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedSizes.includes(size) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                   {selectedSizes.includes(size) && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                </div>
              </button>
              {selectedSizes.includes(size) && (
                <div className="flex items-center gap-2 bg-white rounded-lg border border-indigo-200 px-2 py-1">
                   <Hash size={12} className="text-indigo-400"/>
                   <input 
                     type="number" 
                     className="w-full text-xs font-bold outline-none bg-transparent"
                     placeholder="স্টক"
                     value={sizeStocks[size]}
                     onChange={(e) => handleStockChange(size, e.target.value)}
                   />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-gray-700">বর্ণনা</label>
          <button type="button" onClick={handleAISuggestion} disabled={isAILoading} className="text-xs font-bold flex items-center gap-1.5 text-indigo-600">
            <Sparkles size={14} /> {isAILoading ? 'তৈরি হচ্ছে...' : 'AI বর্ণনা'}
          </button>
        </div>
        <textarea rows={2} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex gap-4">
        <button type="button" onClick={onCancel} className="flex-1 py-3 font-bold text-gray-500 border border-gray-200 rounded-xl">বাতিল</button>
        <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">প্রোডাক্ট সেভ করুন</button>
      </div>
    </form>
  );
};

export default ProductForm;
