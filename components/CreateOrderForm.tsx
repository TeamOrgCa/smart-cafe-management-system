'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  menu_item_ingredients?: Array<{
    inventory_item_id: string;
    quantity_needed: number;
    inventory: {
      item_name: string;
      quantity: number;
      unit: string;
    };
  }>;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface StockWarning {
  item_name: string;
  available: number;
  needed: number;
  unit: string;
}

export default function CreateOrderForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockWarnings, setStockWarnings] = useState<Record<string, StockWarning[]>>({});

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_ingredients (
          inventory_item_id,
          quantity_needed,
          inventory (
            item_name,
            quantity,
            unit
          )
        )
      `)
      .eq('is_available', true)
      .order('category', { ascending: true });

    if (data) setMenuItems(data);
  };

  // Check if menu item has sufficient stock
  const checkStock = (item: MenuItem, requestedQuantity: number): StockWarning[] => {
    const warnings: StockWarning[] = [];
    
    if (!item.menu_item_ingredients || item.menu_item_ingredients.length === 0) {
      return warnings;
    }

    item.menu_item_ingredients.forEach((ingredient) => {
      const needed = ingredient.quantity_needed * requestedQuantity;
      const available = ingredient.inventory.quantity;
      
      if (available < needed) {
        warnings.push({
          item_name: ingredient.inventory.item_name,
          available,
          needed,
          unit: ingredient.inventory.unit
        });
      }
    });

    return warnings;
  };

  // Check if menu item is out of stock
  const isOutOfStock = (item: MenuItem): boolean => {
    if (!item.menu_item_ingredients || item.menu_item_ingredients.length === 0) {
      return false;
    }

    return item.menu_item_ingredients.some(
      (ingredient) => ingredient.inventory.quantity === 0
    );
  };

  const addItemToOrder = (item: MenuItem) => {
    const existingItem = orderItems.find(oi => oi.menu_item_id === item.id);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
    
    // Check stock availability
    const warnings = checkStock(item, newQuantity);
    
    if (warnings.length > 0) {
      setStockWarnings({ ...stockWarnings, [item.id]: warnings });
      return; // Don't add if stock insufficient
    }
    
    if (existingItem) {
      setOrderItems(orderItems.map(oi =>
        oi.menu_item_id === item.id
          ? { ...oi, quantity: oi.quantity + 1 }
          : oi
      ));
    } else {
      setOrderItems([...orderItems, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }]);
    }
    
    // Clear warnings for this item
    const newWarnings = { ...stockWarnings };
    delete newWarnings[item.id];
    setStockWarnings(newWarnings);
  };

  const updateQuantity = (menu_item_id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menu_item_id);
    } else {
      // Find menu item and check stock
      const menuItem = menuItems.find(mi => mi.id === menu_item_id);
      if (menuItem) {
        const warnings = checkStock(menuItem, quantity);
        
        if (warnings.length > 0) {
          setStockWarnings({ ...stockWarnings, [menu_item_id]: warnings });
          return; // Don't update if stock insufficient
        } else {
          // Clear warnings for this item
          const newWarnings = { ...stockWarnings };
          delete newWarnings[menu_item_id];
          setStockWarnings(newWarnings);
        }
      }
      
      setOrderItems(orderItems.map(oi =>
        oi.menu_item_id === menu_item_id ? { ...oi, quantity } : oi
      ));
    }
  };

  const removeItem = (menu_item_id: string) => {
    setOrderItems(orderItems.filter(oi => oi.menu_item_id !== menu_item_id));
    // Clear warnings
    const newWarnings = { ...stockWarnings };
    delete newWarnings[menu_item_id];
    setStockWarnings(newWarnings);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderNumber = generateOrderNumber();
      const totalAmount = calculateTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          staff_id: userId,
          customer_name: customerName || null,
          total_amount: totalAmount,
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      router.push('/dashboard/orders');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = filteredMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Menu Items Selection */}
      <div className="lg:col-span-2">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>

        <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xl font-bold text-forest mb-3 sticky top-0 bg-beige py-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => {
                  const outOfStock = isOutOfStock(item);
                  const warnings = stockWarnings[item.id];
                  
                  return (
                    <div key={item.id} className="relative">
                      <button
                        type="button"
                        onClick={() => addItemToOrder(item)}
                        disabled={outOfStock}
                        className={`w-full bg-white p-4 rounded-lg shadow hover:shadow-lg transition-all border-2 text-left ${
                          outOfStock 
                            ? 'border-red-300 opacity-60 cursor-not-allowed' 
                            : warnings
                            ? 'border-yellow-300'
                            : 'border-transparent hover:border-forest'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-forest">{item.name}</h4>
                          <span className="text-forest font-bold">₱{item.price.toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        )}
                      </button>
                      
                      {/* Out of Stock Badge */}
                      {outOfStock && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          OUT OF STOCK
                        </div>
                      )}
                      
                      {/* Stock Warning */}
                      {warnings && warnings.length > 0 && !outOfStock && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="text-yellow-800 font-semibold">⚠️ Insufficient Stock:</p>
                          <ul className="mt-1 space-y-1">
                            {warnings.map((warning, idx) => (
                              <li key={idx} className="text-yellow-700">
                                <strong>{warning.item_name}:</strong> Need {warning.needed.toFixed(2)} {warning.unit}, only {warning.available.toFixed(2)} {warning.unit} available
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-olive">No menu items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
          <h3 className="text-2xl font-bold text-forest mb-4">Order Summary</h3>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-forest mb-2">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in customer"
                className="w-full px-3 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div className="border-t border-olive/20 pt-4 mb-4 max-h-60 overflow-y-auto">
              {orderItems.length === 0 ? (
                <p className="text-center text-olive py-8">No items added</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.menu_item_id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-olive">₱{item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                          className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 text-forest font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                          className="w-7 h-7 bg-forest text-white rounded hover:bg-olive font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.menu_item_id)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-olive/20 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-olive">Items:</span>
                <span className="font-medium">
                  {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-forest">
                <span>Total:</span>
                <span>₱{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || orderItems.length === 0}
                className="w-full bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/orders')}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
