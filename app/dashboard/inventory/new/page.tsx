'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingNames, setExistingNames] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'pieces',
    minimum_threshold: '',
  });

  // Fetch existing inventory item names for duplicate checking
  useEffect(() => {
    async function fetchInventoryNames() {
      const { data } = await supabase
        .from('inventory')
        .select('item_name');
      
      if (data) {
        setExistingNames(data.map(item => item.item_name.toLowerCase().trim()));
      }
    }
    fetchInventoryNames();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate fields
    if (!formData.item_name.trim()) {
      setError('Item name is required');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (!formData.minimum_threshold || parseFloat(formData.minimum_threshold) < 0) {
      setError('Please enter a valid minimum threshold');
      return;
    }

    // Check for duplicate name (case-insensitive)
    const itemNameLower = formData.item_name.toLowerCase().trim();
    if (existingNames.includes(itemNameLower)) {
      setError(`Item "${formData.item_name}" already exists in inventory. Please use a different name.`);
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('inventory')
        .insert({
          item_name: formData.item_name.trim(),
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          minimum_threshold: parseFloat(formData.minimum_threshold),
          last_restocked: new Date().toISOString(),
        });

      if (insertError) {
        // Check if it's a unique constraint violation
        if (insertError.code === '23505') {
          setError('This item name already exists. Please use a different name.');
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }

      // Success - redirect to inventory page
      router.push('/dashboard/inventory');
      router.refresh();
    } catch (err) {
      setError('Failed to add inventory item');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-forest mb-2">Add Inventory Item</h1>
        <p className="text-olive">Add a new item to your inventory</p>
      </div>

      <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div>
            <label htmlFor="item_name" className="block text-forest font-medium mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="item_name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
              placeholder="e.g., Coffee Beans, Milk, Sugar"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Must be unique - duplicates are not allowed
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-forest font-medium mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
              placeholder="e.g., 100"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-forest font-medium mb-2">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
              required
            >
              <option value="pieces">Pieces</option>
              <option value="grams">Grams</option>
              <option value="kg">Kilograms</option>
              <option value="ml">Milliliters</option>
              <option value="liters">Liters</option>
              <option value="cups">Cups</option>
              <option value="packs">Packs</option>
              <option value="bottles">Bottles</option>
              <option value="bags">Bags</option>
            </select>
          </div>

          {/* Minimum Threshold */}
          <div>
            <label htmlFor="minimum_threshold" className="block text-forest font-medium mb-2">
              Minimum Threshold <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="minimum_threshold"
              name="minimum_threshold"
              value={formData.minimum_threshold}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
              placeholder="e.g., 10"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Alert level when stock is running low
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-forest text-white rounded-lg hover:bg-olive transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
