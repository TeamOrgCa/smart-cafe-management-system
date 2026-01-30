'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
}

interface MenuIngredient {
  inventory_item_id: string;
  quantity_needed: number;
  item_name?: string;
  unit?: string;
}

interface MenuIngredientsProps {
  menuItemId?: string;
}

export default function MenuIngredients({ menuItemId }: MenuIngredientsProps) {
  const supabase = createClient();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [ingredients, setIngredients] = useState<MenuIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    fetchInventory();
    if (menuItemId) {
      fetchMenuIngredients();
    }
  }, [menuItemId]);

  const fetchInventory = async () => {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name');
    
    if (data) setInventoryItems(data);
  };

  const fetchMenuIngredients = async () => {
    if (!menuItemId) return;

    const { data } = await supabase
      .from('menu_item_ingredients')
      .select(`
        *,
        inventory:inventory_item_id (
          item_name,
          unit
        )
      `)
      .eq('menu_item_id', menuItemId);

    if (data) {
      const formatted = data.map(ing => ({
        inventory_item_id: ing.inventory_item_id,
        quantity_needed: ing.quantity_needed,
        item_name: (ing.inventory as any)?.item_name,
        unit: (ing.inventory as any)?.unit,
      }));
      setIngredients(formatted);
    }
  };

  const addIngredient = () => {
    if (!selectedItem || !quantity || parseFloat(quantity) <= 0) {
      alert('Please select an item and enter a valid quantity');
      return;
    }

    const item = inventoryItems.find(i => i.id === selectedItem);
    if (!item) return;

    // Check if already added
    if (ingredients.some(ing => ing.inventory_item_id === selectedItem)) {
      alert('This ingredient is already added');
      return;
    }

    setIngredients([...ingredients, {
      inventory_item_id: selectedItem,
      quantity_needed: parseFloat(quantity),
      item_name: item.item_name,
      unit: item.unit,
    }]);

    setSelectedItem('');
    setQuantity('');
  };

  const removeIngredient = (inventoryItemId: string) => {
    setIngredients(ingredients.filter(ing => ing.inventory_item_id !== inventoryItemId));
  };

  const saveIngredients = async () => {
    if (!menuItemId) {
      alert('Please save the menu item first');
      return;
    }

    setLoading(true);
    try {
      // Delete existing ingredients
      await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', menuItemId);

      // Insert new ingredients
      if (ingredients.length > 0) {
        const { error } = await supabase
          .from('menu_item_ingredients')
          .insert(
            ingredients.map(ing => ({
              menu_item_id: menuItemId,
              inventory_item_id: ing.inventory_item_id,
              quantity_needed: ing.quantity_needed,
            }))
          );

        if (error) throw error;
      }

      alert('✅ Ingredients saved successfully!');
    } catch (error: any) {
      alert('Failed to save ingredients: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-forest">Recipe Ingredients</h3>
        {menuItemId && ingredients.length > 0 && (
          <button
            onClick={saveIngredients}
            disabled={loading}
            className="bg-forest text-white px-4 py-2 rounded-lg hover:bg-olive transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Ingredients'}
          </button>
        )}
      </div>

      {/* Add Ingredient Form */}
      <div className="bg-beige p-4 rounded-lg border-2 border-olive/20">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-forest mb-1">
              Select Inventory Item:
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border border-olive/30 rounded-lg focus:outline-none focus:border-forest"
            >
              <option value="">Choose an item...</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} ({item.quantity} {item.unit} available)
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-forest mb-1">
                Quantity Needed:
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-olive/30 rounded-lg focus:outline-none focus:border-forest"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addIngredient}
                className="bg-forest text-white px-6 py-2 rounded-lg hover:bg-olive transition-colors whitespace-nowrap h-10.5"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients List */}
      {ingredients.length > 0 ? (
        <div className="bg-white rounded-lg border-2 border-olive/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-forest text-white">
              <tr>
                <th className="px-4 py-2 text-left">Ingredient</th>
                <th className="px-4 py-2 text-left">Quantity Needed</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.inventory_item_id} className="border-b hover:bg-beige">
                  <td className="px-4 py-3 font-medium">{ing.item_name}</td>
                  <td className="px-4 py-3">
                    {ing.quantity_needed} {ing.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeIngredient(ing.inventory_item_id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-olive/30 rounded-lg p-8 text-center text-olive">
          <p className="text-lg mb-2">📝 No ingredients added yet</p>
          <p className="text-sm">Add ingredients from your inventory to track stock usage</p>
        </div>
      )}

      {!menuItemId && ingredients.length > 0 && (
        <div className="bg-cream border-l-4 border-forest p-4 rounded">
          <p className="text-sm text-forest">
            💡 <strong>Note:</strong> Please save the menu item first, then you can save the ingredients.
          </p>
        </div>
      )}
    </div>
  );
}
