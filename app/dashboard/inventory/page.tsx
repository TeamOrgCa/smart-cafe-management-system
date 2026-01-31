'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import EditInventoryStock from '@/components/EditInventoryStock';
import InventoryLogs from '@/components/InventoryLogs';

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  minimum_threshold: number;
  last_restocked: string | null;
}

interface InventoryLog {
  id: string;
  item_name: string;
  operation_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  user_name: string | null;
  notes: string | null;
  created_at: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const fetchInventory = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name', { ascending: true });
    
    if (data) setInventory(data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('inventory_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchInventory();
    fetchLogs();
  }, []);

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter((item) => 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.item_name.localeCompare(b.item_name);
        case 'name-desc':
          return b.item_name.localeCompare(a.item_name);
        case 'quantity-asc':
          return a.quantity - b.quantity;
        case 'quantity-desc':
          return b.quantity - a.quantity;
        case 'status-low':
          const aLow = a.quantity <= a.minimum_threshold ? 1 : 0;
          const bLow = b.quantity <= b.minimum_threshold ? 1 : 0;
          return bLow - aLow;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="p-8 lg:p-12">
        <div className="text-center text-olive">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-forest mb-2">Inventory Management</h1>
          <p className="text-sm lg:text-base text-olive">Track and manage stock levels</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogs(true)}
            className="bg-olive text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:bg-forest font-medium transition-colors shadow-lg whitespace-nowrap text-sm lg:text-base"
          >
            📋 Show Log
          </button>
          <Link
            href="/dashboard/inventory/new"
            className="bg-forest text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:bg-olive font-medium transition-colors shadow-lg whitespace-nowrap text-sm lg:text-base"
          >
            + Add Item
          </Link>
        </div>
      </div>

      <main>
        {/* Search and Sort Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                🔍 Search Items
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                📊 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent text-sm"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="quantity-asc">Quantity (Low to High)</option>
                <option value="quantity-desc">Quantity (High to Low)</option>
                <option value="status-low">Low Stock First</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing <span className="font-bold text-forest">{filteredInventory.length}</span> of {inventory.length} items
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-forest text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Item Name</th>
                  <th className="px-6 py-3 text-left">Quantity</th>
                  <th className="px-6 py-3 text-left">Unit</th>
                  <th className="px-6 py-3 text-left">Min. Threshold</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Last Restocked</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory && filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                    const isLow = item.quantity <= item.minimum_threshold;
                    return (
                      <tr key={item.id} className="border-b hover:bg-beige">
                        <td className="px-6 py-4 font-medium">{item.item_name}</td>
                        <td className="px-6 py-4">{item.quantity}</td>
                        <td className="px-6 py-4">{item.unit}</td>
                        <td className="px-6 py-4">{item.minimum_threshold}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              isLow
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.last_restocked
                            ? new Date(item.last_restocked).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <EditInventoryStock
                            itemId={item.id}
                            currentStock={item.quantity}
                            itemName={item.item_name}
                            unit={item.unit}
                            onUpdate={() => {
                              fetchInventory();
                              fetchLogs();
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-olive">
                      {searchQuery ? 'No items found matching your search' : 'No inventory items yet. Add your first item!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredInventory && filteredInventory.length > 0 ? (
            filteredInventory.map((item) => {
              const isLow = item.quantity <= item.minimum_threshold;
              return (
                <div key={item.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-forest text-lg">{item.item_name}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                          isLow
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-bold text-forest">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min. Threshold:</span>
                      <span className="font-medium text-gray-700">
                        {item.minimum_threshold} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Restocked:</span>
                      <span className="text-gray-700">
                        {item.last_restocked
                          ? new Date(item.last_restocked).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>

                  <EditInventoryStock
                    itemId={item.id}
                    currentStock={item.quantity}
                    itemName={item.item_name}
                    unit={item.unit}
                    onUpdate={() => {
                      fetchInventory();
                      fetchLogs();
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-olive">
              {searchQuery ? 'No items found matching your search' : 'No inventory items yet. Add your first item!'}
            </div>
          )}
        </div>
      </main>

      {/* Logs Modal */}
      {showLogs && (
        <InventoryLogs 
          logs={logs} 
          onClose={() => {
            setShowLogs(false);
            fetchLogs(); // Refresh logs when closing
          }} 
        />
      )}
    </div>
  );
}
