import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Minus, 
  Trash2, 
  Sparkles, 
  Store, 
  ShieldCheck,
  Filter
} from 'lucide-react';
import { InventoryItem, TabType } from '../types';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  onItemLowStockTrigger: (item: InventoryItem) => void;
  onNavigateTab: (tab: TabType) => void;
  onPublishToMarketplace: (item: InventoryItem) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onUpdateInventory,
  onItemLowStockTrigger,
  onNavigateTab,
  onPublishToMarketplace,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New item form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Fertilizers');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<InventoryItem['unit']>('bags');
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [costPerUnit, setCostPerUnit] = useState<number>(450);
  const [location, setLocation] = useState('Warehouse Shed A');
  const [notes, setNotes] = useState('');

  const categories = ['All', 'Fertilizers', 'Seeds', 'Pesticides', 'Tools & Equipment', 'Harvested Produce'];

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;

  const handleAdjustQuantity = (id: string, delta: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        const newItem = { 
          ...item, 
          quantity: newQty, 
          lastUpdated: 'Just now' 
        };
        // If it crossed or is at threshold, alert
        if (newQty <= item.minThreshold && item.quantity > item.minThreshold) {
          onItemLowStockTrigger(newItem);
        }
        return newItem;
      }
      return item;
    });
    onUpdateInventory(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this item from farm inventory?')) {
      onUpdateInventory(inventory.filter(i => i.id !== id));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit,
      minThreshold: Number(minThreshold),
      costPerUnit: Number(costPerUnit),
      location: location.trim() || 'Main Storage',
      lastUpdated: 'Just now',
      notes: notes.trim()
    };

    const newInventory = [newItem, ...inventory];
    onUpdateInventory(newInventory);

    if (newItem.quantity <= newItem.minThreshold) {
      onItemLowStockTrigger(newItem);
    }

    // Reset form
    setName('');
    setQuantity(10);
    setMinThreshold(5);
    setCostPerUnit(500);
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Verification Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">Smart Farm Inventory</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active Stock Monitor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time tracking of seeds, fertilizers, chemical inputs, equipment, and harvested stock with automated reorder warnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>{lowStockCount} Low Stock Item{lowStockCount > 1 ? 's' : ''}</span>
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items or storage location..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const isLowStock = item.quantity <= item.minThreshold;
          const isCritical = item.quantity === 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 transition flex flex-col justify-between shadow-xs ${
                isLowStock
                  ? 'border-rose-300 ring-1 ring-rose-200/80 bg-rose-50/10'
                  : 'border-stone-200 hover:border-emerald-300'
              }`}
            >
              <div>
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700">
                    {item.category}
                  </span>
                  {isLowStock ? (
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {isCritical ? 'Out of Stock' : 'Low Stock Alert'}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> In Stock
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-stone-900 text-base leading-snug">
                  {item.name}
                </h3>
                
                {/* Notes or location */}
                <p className="text-xs text-stone-500 mt-1">
                  Location: <strong className="text-stone-700">{item.location}</strong>
                </p>
                {item.notes && (
                  <p className="text-xs text-stone-600 italic mt-1 line-clamp-2">
                    "{item.notes}"
                  </p>
                )}

                {/* Stock Level Bar */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-stone-900">{item.quantity}</span>
                      <span className="text-xs font-semibold text-stone-500 ml-1">{item.unit}</span>
                    </div>
                    <span className="text-xs text-stone-400">
                      Reorder at: <strong>{item.minThreshold} {item.unit}</strong>
                    </span>
                  </div>

                  <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isLowStock ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (item.quantity / (item.minThreshold * 2.5)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Unit Cost: <strong>₹{item.costPerUnit.toLocaleString()}</strong></span>
                  <span className="text-stone-400 text-[11px]">{item.lastUpdated}</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {/* Stock adjuster buttons */}
                  <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                    <button
                      onClick={() => handleAdjustQuantity(item.id, -1)}
                      className="px-2.5 py-1 text-stone-700 hover:bg-stone-200 font-bold transition cursor-pointer"
                      title="Use 1 unit in field"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-semibold text-stone-800">Adjust</span>
                    <button
                      onClick={() => handleAdjustQuantity(item.id, 1)}
                      className="px-2.5 py-1 text-stone-700 hover:bg-stone-200 font-bold transition cursor-pointer"
                      title="Restock 1 unit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1-Click Sell to Marketplace for produce */}
                  {(item.category === 'Harvested Produce' || item.category === 'Seeds') && (
                    <button
                      onClick={() => {
                        onPublishToMarketplace(item);
                        onNavigateTab('marketplace');
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="List directly on Farmer Marketplace"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Sell on Market</span>
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition ml-auto cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Inventory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-1">Add Farm Inventory Item</h3>
            <p className="text-xs text-stone-500 mb-4">
              Add new seeds, fertilizers, agrochemicals, or harvested produce to your digital inventory.
            </p>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zinc Sulphate 21% / Urea / Bt Cotton BG-II"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Pesticides">Pesticides & Bio-control</option>
                    <option value="Tools & Equipment">Tools & Equipment</option>
                    <option value="Harvested Produce">Harvested Produce</option>
                    <option value="Livestock Feed">Livestock Feed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Measurement Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="bags">Bags</option>
                    <option value="quintals">Quintals</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters</option>
                    <option value="units">Units / Pcs</option>
                    <option value="tonnes">Tonnes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Cost / Unit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse Shed A, Room 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Notes / Batch Info</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or supplier details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
