'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import MenuLogs from '@/components/MenuLogs';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
}

interface MenuLog {
  id: string;
  menu_item_name: string;
  operation_type: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  user_name: string | null;
  notes: string | null;
  created_at: string;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [logs, setLogs] = useState<MenuLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const fetchMenuItems = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (data) setMenuItems(data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('menu_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchMenuItems();
    fetchLogs();
  }, []);

  // Filter and sort menu items
  const filteredMenuItems = useMemo(() => {
    let filtered = menuItems.filter((item) => {
      // Search filter
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Availability filter
      if (availabilityFilter === 'available' && !item.is_available) {
        return false;
      }
      if (availabilityFilter === 'unavailable' && item.is_available) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortBy === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'category') {
      filtered.sort((a, b) => a.category.localeCompare(b.category));
    }

    return filtered;
  }, [menuItems, searchTerm, categoryFilter, sortBy, availabilityFilter]);

  // Get unique categories from menu items
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
    return uniqueCategories.sort();
  }, [menuItems]);

  if (loading) {
    return (
      <div className="p-8 lg:p-12">
        <div className="text-center text-olive">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-forest mb-2">Menu Management</h1>
          <p className="text-olive">Add and manage café menu items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogs(true)}
            className="bg-olive text-white px-6 py-3 rounded-lg hover:bg-forest font-medium transition-colors shadow-lg"
          >
            📋 Show Log
          </button>
          <Link
            href="/dashboard/menu/new"
            className="bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive font-medium transition-colors shadow-lg"
          >
            + Add Item
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-forest mb-2">
              Search by Name
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search menu items..."
              className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-forest mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-forest mb-2">
              Availability
            </label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="all">All Items</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Unavailable Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-forest mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing <strong>{filteredMenuItems.length}</strong> of <strong>{menuItems.length}</strong> items
        </div>
      </div>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems && filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 bg-linear-to-br from-olive/20 to-forest/20">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">
                          {item.category === 'Coffee' && '☕'}
                          {item.category === 'Tea' && '🍵'}
                          {item.category === 'Pastries' && '🥐'}
                          {item.category === 'Sandwiches' && '🥪'}
                          {item.category === 'Desserts' && '🍰'}
                          {!['Coffee', 'Tea', 'Pastries', 'Sandwiches', 'Desserts'].includes(item.category) && '🍽️'}
                        </div>
                        <p className="text-olive/50 text-sm font-medium">No Image</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-forest">{item.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-sm text-olive mb-2">{item.category}</p>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-forest">
                      ₱{item.price.toFixed(2)}
                    </span>
                    <Link
                      href={`/dashboard/menu/${item.id}`}
                      className="text-olive hover:text-forest font-medium"
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              {menuItems.length === 0 ? (
                <p className="text-olive text-lg">No menu items yet. Add your first item!</p>
              ) : (
                <p className="text-olive text-lg">No items match your search criteria. Try adjusting your filters.</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Logs Modal */}
      {showLogs && (
        <MenuLogs 
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
