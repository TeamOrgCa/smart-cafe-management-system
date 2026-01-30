'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';

interface MenuFormProps {
  menuItem?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    is_available: boolean;
  };
}

export default function MenuForm({ menuItem }: MenuFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(menuItem?.image_url || null);

  const [formData, setFormData] = useState({
    name: menuItem?.name || '',
    description: menuItem?.description || '',
    price: menuItem?.price ?? '',
    category: menuItem?.category || CATEGORIES[0],
    image_url: menuItem?.image_url || '',
    is_available: menuItem?.is_available ?? true,
  });

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url });
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check for duplicate menu item name
      const { data: existingItems } = await supabase
        .from('menu_items')
        .select('id, name')
        .ilike('name', formData.name.trim());

      // If updating, allow same name if it's the current item
      if (existingItems && existingItems.length > 0) {
        const isDuplicate = existingItems.some(item => 
          item.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          item.id !== menuItem?.id
        );

        if (isDuplicate) {
          setError(`A menu item with the name "${formData.name}" already exists. Please use a different name.`);
          setLoading(false);
          return;
        }
      }

      const dataToSubmit = {
        ...formData,
        name: formData.name.trim(),
        price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
      };

      if (menuItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(dataToSubmit)
          .eq('id', menuItem.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert([dataToSubmit]);

        if (error) throw error;
      }

      router.push('/dashboard/menu');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImagePreview(null)}
          />
        </div>
      )}

      {!imagePreview && (
        <div className="relative h-64 bg-linear-to-br from-olive/20 to-forest/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">📷</div>
            <p className="text-olive">Image Preview</p>
          </div>
        </div>
      )}

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-forest mb-2">
          Image URL (Optional)
        </label>
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter a direct image URL or leave empty for placeholder
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-forest mb-2">
          Item Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
          placeholder="e.g., Cappuccino"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-forest mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
          placeholder="Brief description of the item"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-forest mb-2">
          Price (₱) *
        </label>
        <input
          type="number"
          required
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
          className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
          placeholder="0.00"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-forest mb-2">
          Category *
        </label>
        <select
          required
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Availability */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_available"
          checked={formData.is_available}
          onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          className="w-5 h-5 text-forest rounded focus:ring-2 focus:ring-forest"
        />
        <label htmlFor="is_available" className="text-sm font-medium text-forest">
          Available for order
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? 'Saving...' : menuItem ? 'Update Item' : 'Create Item'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/menu')}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
