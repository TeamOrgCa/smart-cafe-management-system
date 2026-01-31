'use client';

import { useState, useEffect } from 'react';
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

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
}

interface Ingredient {
  inventory_item_id: string;
  quantity_needed: number;
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

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [originalIngredients, setOriginalIngredients] = useState<Ingredient[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [quantityNeeded, setQuantityNeeded] = useState<string>('');
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');

  // Fetch inventory and existing ingredients
  useEffect(() => {
    const fetchData = async () => {
      // Fetch inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('id, item_name, quantity, unit')
        .order('item_name');
      
      if (inventoryData) {
        setInventory(inventoryData);
      }

      // Fetch existing ingredients if editing
      if (menuItem?.id) {
        const { data: ingredientsData } = await supabase
          .from('menu_item_ingredients')
          .select('inventory_item_id, quantity_needed')
          .eq('menu_item_id', menuItem.id);
        
        if (ingredientsData) {
          setIngredients(ingredientsData);
          setOriginalIngredients(ingredientsData); // Store original for comparison
        }
      }
    };

    fetchData();
  }, [menuItem?.id]);

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url });
    setImagePreview(url);
  };

  const addIngredient = () => {
    if (!selectedInventoryId || !quantityNeeded || parseFloat(quantityNeeded) <= 0) {
      return;
    }

    // Check if ingredient already added
    if (ingredients.some(ing => ing.inventory_item_id === selectedInventoryId)) {
      setError('This ingredient is already added');
      return;
    }

    // Check if quantity exceeds available stock
    const selectedItem = inventory.find(inv => inv.id === selectedInventoryId);
    if (selectedItem && parseFloat(quantityNeeded) > selectedItem.quantity) {
      setError(`Quantity exceeds available stock (${selectedItem.quantity} ${selectedItem.unit} available)`);
      return;
    }

    setIngredients([...ingredients, {
      inventory_item_id: selectedInventoryId,
      quantity_needed: parseFloat(quantityNeeded)
    }]);
    
    setSelectedInventoryId('');
    setQuantityNeeded('');
    setError(null);
  };

  const removeIngredient = (inventoryItemId: string) => {
    setIngredients(ingredients.filter(ing => ing.inventory_item_id !== inventoryItemId));
  };

  const startEditIngredient = (inventoryItemId: string, currentQuantity: number) => {
    setEditingIngredientId(inventoryItemId);
    setEditQuantity(currentQuantity.toString());
  };

  const saveEditIngredient = (inventoryItemId: string) => {
    const qty = parseFloat(editQuantity);
    
    if (!editQuantity || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    // Check if quantity exceeds available stock
    const selectedItem = inventory.find(inv => inv.id === inventoryItemId);
    if (selectedItem && qty > selectedItem.quantity) {
      setError(`Quantity exceeds available stock (${selectedItem.quantity} ${selectedItem.unit} available)`);
      return;
    }

    setIngredients(ingredients.map(ing => 
      ing.inventory_item_id === inventoryItemId 
        ? { ...ing, quantity_needed: qty }
        : ing
    ));
    
    setEditingIngredientId(null);
    setEditQuantity('');
    setError(null);
  };

  const cancelEditIngredient = () => {
    setEditingIngredientId(null);
    setEditQuantity('');
  };

  const getInventoryItemName = (inventoryItemId: string) => {
    const item = inventory.find(inv => inv.id === inventoryItemId);
    return item ? `${item.item_name} (${item.unit})` : 'Unknown';
  };

  const getSelectedInventoryItem = () => {
    return inventory.find(inv => inv.id === selectedInventoryId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
      }

      let userName: string | null = null;
      if (user?.id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          console.error('User fetch error:', userError);
        }
        
        userName = userData?.full_name || null;
      }

      // Validate ingredients for all items (both new and updates)
      if (ingredients.length === 0) {
        setError('Please add at least one ingredient to enable stock tracking for this menu item. Menu items without ingredients cannot be created or saved.');
        setLoading(false);
        return;
      }

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

        // Get original ingredients before updating
        const { data: oldIngredientsData } = await supabase
          .from('menu_item_ingredients')
          .select('inventory_item_id, quantity_needed')
          .eq('menu_item_id', menuItem.id);

        const oldIngredients = oldIngredientsData || [];

        // Update ingredients - delete old ones and insert new ones
        await supabase
          .from('menu_item_ingredients')
          .delete()
          .eq('menu_item_id', menuItem.id);

        if (ingredients.length > 0) {
          const ingredientsToInsert = ingredients.map(ing => ({
            menu_item_id: menuItem.id,
            inventory_item_id: ing.inventory_item_id,
            quantity_needed: ing.quantity_needed
          }));

          const { error: ingredientsError } = await supabase
            .from('menu_item_ingredients')
            .insert(ingredientsToInsert);

          if (ingredientsError) throw ingredientsError;
        }

        // Detect ingredient changes
        const oldIngredientMap = new Map(oldIngredients.map(ing => [ing.inventory_item_id, ing.quantity_needed]));
        const newIngredientMap = new Map(ingredients.map(ing => [ing.inventory_item_id, ing.quantity_needed]));

        // Find added ingredients
        const addedIngredients = ingredients.filter(ing => !oldIngredientMap.has(ing.inventory_item_id));
        
        // Find removed ingredients
        const removedIngredients = oldIngredients.filter(ing => !newIngredientMap.has(ing.inventory_item_id));
        
        // Find modified ingredients (quantity changed)
        const modifiedIngredients = ingredients.filter(ing => {
          const oldQty = oldIngredientMap.get(ing.inventory_item_id);
          return oldQty !== undefined && oldQty !== ing.quantity_needed;
        });

        // Log ingredient changes
        if (addedIngredients.length > 0 || removedIngredients.length > 0 || modifiedIngredients.length > 0) {
          for (const ing of addedIngredients) {
            const itemName = getInventoryItemName(ing.inventory_item_id);
            await supabase.from('menu_logs').insert({
              menu_item_id: menuItem.id,
              menu_item_name: dataToSubmit.name,
              operation_type: 'update_details',
              field_changed: 'ingredients',
              old_value: null,
              new_value: `Added: ${itemName} × ${ing.quantity_needed}`,
              user_id: user?.id || null,
              user_name: userName,
              notes: `Added ingredient: ${itemName} (${ing.quantity_needed})`
            });
          }

          for (const ing of removedIngredients) {
            const itemName = getInventoryItemName(ing.inventory_item_id);
            await supabase.from('menu_logs').insert({
              menu_item_id: menuItem.id,
              menu_item_name: dataToSubmit.name,
              operation_type: 'update_details',
              field_changed: 'ingredients',
              old_value: `${itemName} × ${ing.quantity_needed}`,
              new_value: null,
              user_id: user?.id || null,
              user_name: userName,
              notes: `Removed ingredient: ${itemName}`
            });
          }

          for (const ing of modifiedIngredients) {
            const itemName = getInventoryItemName(ing.inventory_item_id);
            const oldQty = oldIngredientMap.get(ing.inventory_item_id);
            await supabase.from('menu_logs').insert({
              menu_item_id: menuItem.id,
              menu_item_name: dataToSubmit.name,
              operation_type: 'update_details',
              field_changed: 'ingredients',
              old_value: `${itemName} × ${oldQty}`,
              new_value: `${itemName} × ${ing.quantity_needed}`,
              user_id: user?.id || null,
              user_name: userName,
              notes: `Updated ingredient quantity: ${itemName} from ${oldQty} to ${ing.quantity_needed}`
            });
          }
        }

        // Log changes
        const changes: Array<{ field: string; old: any; new: any }> = [];
        
        if (menuItem.name !== dataToSubmit.name) {
          changes.push({ field: 'name', old: menuItem.name, new: dataToSubmit.name });
        }
        if (menuItem.price !== dataToSubmit.price) {
          changes.push({ field: 'price', old: `₱${menuItem.price}`, new: `₱${dataToSubmit.price}` });
        }
        if (menuItem.is_available !== dataToSubmit.is_available) {
          changes.push({ field: 'is_available', old: menuItem.is_available ? 'Available' : 'Unavailable', new: dataToSubmit.is_available ? 'Available' : 'Unavailable' });
        }
        if (menuItem.category !== dataToSubmit.category) {
          changes.push({ field: 'category', old: menuItem.category, new: dataToSubmit.category });
        }
        if (menuItem.description !== dataToSubmit.description) {
          changes.push({ field: 'description', old: menuItem.description || 'None', new: dataToSubmit.description || 'None' });
        }

        // Create log entries for each change
        if (changes.length > 0) {
          const logOperationType = changes.some(c => c.field === 'price') ? 'update_price' : 
                                   changes.some(c => c.field === 'is_available') ? 'update_availability' : 
                                   'update_details';

          for (const change of changes) {
            await supabase.from('menu_logs').insert({
              menu_item_id: menuItem.id,
              menu_item_name: dataToSubmit.name,
              operation_type: logOperationType,
              field_changed: change.field,
              old_value: String(change.old),
              new_value: String(change.new),
              user_id: user?.id || null,
              user_name: userName,
              notes: `Updated ${change.field} from "${change.old}" to "${change.new}"`
            });
          }
        }
      } else {
        // Create new item
        const { data: newItem, error } = await supabase
          .from('menu_items')
          .insert([dataToSubmit])
          .select()
          .single();

        if (error) throw error;

        // Insert ingredients
        if (newItem && ingredients.length > 0) {
          const ingredientsToInsert = ingredients.map(ing => ({
            menu_item_id: newItem.id,
            inventory_item_id: ing.inventory_item_id,
            quantity_needed: ing.quantity_needed
          }));

          const { error: ingredientsError } = await supabase
            .from('menu_item_ingredients')
            .insert(ingredientsToInsert);

          if (ingredientsError) throw ingredientsError;
        }

        // Log creation
        if (newItem) {
          await supabase.from('menu_logs').insert({
            menu_item_id: newItem.id,
            menu_item_name: newItem.name,
            operation_type: 'create',
            field_changed: null,
            old_value: null,
            new_value: `₱${newItem.price} - ${newItem.category}`,
            user_id: user?.id || null,
            user_name: userName,
            notes: `Created new menu item: ${newItem.name}`
          });
        }
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

      {/* Ingredients */}
      <div className="border border-olive/30 rounded-lg p-4">
        <h3 className="text-lg font-medium text-forest mb-1">
          Ingredients <span className="text-red-600">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          At least one ingredient is required for stock tracking
        </p>
        
        {/* Add Ingredient */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={selectedInventoryId}
              onChange={(e) => setSelectedInventoryId(e.target.value)}
              className="sm:col-span-2 px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="">Select ingredient...</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} ({item.unit})
                </option>
              ))}
            </select>
            
            <input
              type="number"
              step="0.001"
              min="0"
              value={quantityNeeded}
              onChange={(e) => setQuantityNeeded(e.target.value)}
              placeholder="Quantity"
              className="px-4 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
          
          {/* Stock Indicator */}
          {selectedInventoryId && (() => {
            const selectedItem = getSelectedInventoryItem();
            if (!selectedItem) return null;
            
            const stockLevel = selectedItem.quantity;
            const inputQty = parseFloat(quantityNeeded) || 0;
            const isExceeding = inputQty > stockLevel;
            const isLow = inputQty > stockLevel * 0.5 && !isExceeding;
            
            return (
              <div className={`text-sm p-2 rounded ${
                isExceeding ? 'bg-red-50 text-red-700' : 
                isLow ? 'bg-yellow-50 text-yellow-700' : 
                'bg-green-50 text-green-700'
              }`}>
                {isExceeding ? (
                  <span>⚠️ Exceeds available stock: <strong>{stockLevel} {selectedItem.unit}</strong></span>
                ) : isLow ? (
                  <span>⚡ Using {((inputQty / stockLevel) * 100).toFixed(0)}% of stock: <strong>{stockLevel} {selectedItem.unit} available</strong></span>
                ) : (
                  <span>✓ Available stock: <strong>{stockLevel} {selectedItem.unit}</strong></span>
                )}
              </div>
            );
          })()}
          
          <button
            type="button"
            onClick={addIngredient}
            disabled={!selectedInventoryId || !quantityNeeded}
            className="w-full sm:w-auto px-4 py-2 bg-olive text-white rounded-lg hover:bg-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Ingredient
          </button>
        </div>

        {/* Ingredients List */}
        {ingredients.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-forest mb-2">Added Ingredients:</p>
            {ingredients.map((ing) => (
              <div
                key={ing.inventory_item_id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                {editingIngredientId === ing.inventory_item_id ? (
                  // Edit mode
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getInventoryItemName(ing.inventory_item_id)}</span>
                        <span className="text-gray-600">×</span>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-24 px-2 py-1 border border-olive/30 rounded focus:outline-none focus:ring-2 focus:ring-forest"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEditIngredient(ing.inventory_item_id)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          ✓ Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditIngredient}
                          className="text-gray-600 hover:text-gray-800 font-medium"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                    {/* Stock Indicator for Edit */}
                    {(() => {
                      const selectedItem = inventory.find(inv => inv.id === ing.inventory_item_id);
                      if (!selectedItem) return null;
                      
                      const stockLevel = selectedItem.quantity;
                      const inputQty = parseFloat(editQuantity) || 0;
                      const isExceeding = inputQty > stockLevel;
                      const isLow = inputQty > stockLevel * 0.5 && !isExceeding;
                      
                      return (
                        <div className={`text-xs p-2 rounded ${
                          isExceeding ? 'bg-red-50 text-red-700' : 
                          isLow ? 'bg-yellow-50 text-yellow-700' : 
                          'bg-green-50 text-green-700'
                        }`}>
                          {isExceeding ? (
                            <span>⚠️ Exceeds available stock: <strong>{stockLevel} {selectedItem.unit}</strong></span>
                          ) : isLow ? (
                            <span>⚡ Using {((inputQty / stockLevel) * 100).toFixed(0)}% of stock: <strong>{stockLevel} {selectedItem.unit} available</strong></span>
                          ) : (
                            <span>✓ Available stock: <strong>{stockLevel} {selectedItem.unit}</strong></span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  // View mode
                  <>
                    <div>
                      <span className="font-medium">{getInventoryItemName(ing.inventory_item_id)}</span>
                      <span className="text-gray-600 ml-2">× {ing.quantity_needed}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditIngredient(ing.inventory_item_id, ing.quantity_needed)}
                        className="text-olive hover:text-forest font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeIngredient(ing.inventory_item_id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm p-3 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
            <span>⚠️ <strong>Required:</strong> Add at least one ingredient to {menuItem ? 'save changes' : 'create this menu item'}.</span>
          </div>
        )}
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
