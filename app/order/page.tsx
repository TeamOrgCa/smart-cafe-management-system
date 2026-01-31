'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

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

interface CartItem {
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

export default function CustomerOrderPage() {
  const supabase = createClient();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
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

  // Check if menu item is out of stock (any ingredient is 0)
  const isOutOfStock = (item: MenuItem): boolean => {
    if (!item.menu_item_ingredients || item.menu_item_ingredients.length === 0) {
      return false;
    }

    return item.menu_item_ingredients.some(
      (ingredient) => ingredient.inventory.quantity === 0
    );
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(ci => ci.menu_item_id === item.id);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
    
    // Check stock availability BEFORE adding
    const warnings = checkStock(item, newQuantity);
    
    if (warnings.length > 0) {
      setStockWarnings({ ...stockWarnings, [item.id]: warnings });
      return; // Don't add to cart if stock insufficient
    }

    // Only update cart if stock check passes
    if (existingItem) {
      setCart(cart.map(ci =>
        ci.menu_item_id === item.id
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      ));
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }]);
    }
    
    // Clear warnings for this item only if successfully added
    const newWarnings = { ...stockWarnings };
    delete newWarnings[item.id];
    setStockWarnings(newWarnings);
    
    setShowCart(true);
  };

  const updateQuantity = (menu_item_id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(ci => ci.menu_item_id !== menu_item_id));
      // Clear warnings
      const newWarnings = { ...stockWarnings };
      delete newWarnings[menu_item_id];
      setStockWarnings(newWarnings);
    } else {
      // Find menu item and check stock
      const menuItem = menuItems.find(mi => mi.id === menu_item_id);
      if (menuItem) {
        const warnings = checkStock(menuItem, quantity);
        
        if (warnings.length > 0) {
          setStockWarnings({ ...stockWarnings, [menu_item_id]: warnings });
          return;
        } else {
          // Clear warnings for this item
          const newWarnings = { ...stockWarnings };
          delete newWarnings[menu_item_id];
          setStockWarnings(newWarnings);
        }
      }
      
      setCart(cart.map(ci =>
        ci.menu_item_id === menu_item_id ? { ...ci, quantity } : ci
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-beige">
      {/* Header */}
      <header className="bg-forest text-white shadow-lg sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Smart Café</h1>
              <p className="text-cream text-sm">Place Your Order</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative bg-cream text-forest px-6 py-2 rounded-lg hover:bg-cream/90 font-medium transition-colors"
              >
                🛒 Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <Link
                href="/menu"
                className="bg-olive text-white px-4 py-2 rounded-lg hover:bg-olive/90 font-medium transition-colors"
              >
                Browse Menu
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {orderSuccess ? (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-forest mb-4">Order Placed Successfully!</h2>
            <p className="text-xl text-olive mb-6">Order Number: <strong>{orderNumber}</strong></p>
            <p className="text-gray-600 mb-8">
              Please proceed to the counter to complete your payment.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setCart([]);
                  setCustomerName('');
                }}
                className="bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive transition-colors font-medium"
              >
                Place Another Order
              </button>
              <Link
                href="/menu"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Back to Menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu Items */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-forest mb-6">Select Items</h2>
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-2xl font-bold text-forest mb-4 pb-2 border-b-2 border-olive/30">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => {
                        const outOfStock = isOutOfStock(item);
                        const warnings = stockWarnings[item.id] || [];
                        
                        return (
                          <div
                            key={item.id}
                            className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                              outOfStock ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="relative h-32 bg-linear-to-br from-olive/20 to-forest/20">
                              {outOfStock && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                  <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">
                                    OUT OF STOCK
                                  </span>
                                </div>
                              )}
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                  {category === 'Coffee' && '☕'}
                                  {category === 'Tea' && '🍵'}
                                  {category === 'Pastries' && '🥐'}
                                  {category === 'Sandwiches' && '🥪'}
                                  {category === 'Desserts' && '🍰'}
                                  {!['Coffee', 'Tea', 'Pastries', 'Sandwiches', 'Desserts'].includes(category) && '🍽️'}
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-forest mb-1">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                              )}
                              
                              {/* Stock Warning */}
                              {warnings.length > 0 && (
                                <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                                  <p className="font-semibold text-orange-800 mb-1">⚠️ Insufficient Ingredients</p>
                                  <p className="text-orange-700">
                                    Not enough stock to fulfill this quantity.
                                  </p>
                                  <p className="text-orange-800 font-medium mt-1">Please reduce quantity or select another item</p>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-forest">₱{item.price.toFixed(2)}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  disabled={outOfStock}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    outOfStock
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-forest text-white hover:bg-olive'
                                  }`}
                                >
                                  {outOfStock ? 'Unavailable' : 'Add to Cart'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Sidebar - Desktop */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                <h3 className="text-2xl font-bold text-forest mb-4">Your Order</h3>
                <CartContent
                  cart={cart}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  updateQuantity={updateQuantity}
                  calculateTotal={calculateTotal}
                  setOrderSuccess={setOrderSuccess}
                  setOrderNumber={setOrderNumber}
                  setCart={setCart}
                  stockWarnings={stockWarnings}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cart Modal - Mobile */}
        {showCart && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setShowCart(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-forest">Your Order</h3>
                <button onClick={() => setShowCart(false)} className="text-2xl">✕</button>
              </div>
              <CartContent
                cart={cart}
                customerName={customerName}
                setCustomerName={setCustomerName}
                updateQuantity={updateQuantity}
                calculateTotal={calculateTotal}
                setOrderSuccess={setOrderSuccess}
                setOrderNumber={setOrderNumber}
                setCart={setCart}
                stockWarnings={stockWarnings}
                onSuccess={() => setShowCart(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CartContent({
  cart,
  customerName,
  setCustomerName,
  updateQuantity,
  calculateTotal,
  setOrderSuccess,
  setOrderNumber,
  setCart,
  stockWarnings,
  onSuccess,
}: {
  cart: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  calculateTotal: () => number;
  setOrderSuccess: (success: boolean) => void;
  setOrderNumber: (orderNum: string) => void;
  setCart: (cart: CartItem[]) => void;
  stockWarnings: Record<string, StockWarning[]>;
  onSuccess?: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const hasStockIssues = Object.keys(stockWarnings).length > 0;

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
      .eq('is_available', true);

    if (data) setMenuItems(data);
  };

  // Check if increasing quantity would exceed stock
  const canIncreaseQuantity = (menu_item_id: string, currentQuantity: number): boolean => {
    const menuItem = menuItems.find(mi => mi.id === menu_item_id);
    if (!menuItem || !menuItem.menu_item_ingredients || menuItem.menu_item_ingredients.length === 0) {
      return true;
    }

    const newQuantity = currentQuantity + 1;
    return !menuItem.menu_item_ingredients.some((ingredient) => {
      const needed = ingredient.quantity_needed * newQuantity;
      const available = ingredient.inventory.quantity;
      return available < needed;
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Please add items to your cart');
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (hasStockIssues) {
      setError('Please resolve stock issues before placing order');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const orderNum = `ORD-${dateStr}-${random}`;
      const totalAmount = calculateTotal();

      // Create order without staff_id (customer self-service order)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNum,
          staff_id: '00000000-0000-0000-0000-000000000000', // System placeholder for customer orders
          customer_name: customerName.trim(),
          total_amount: totalAmount,
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      setOrderNumber(orderNum);
      setOrderSuccess(true);
      setCart([]);
      setCustomerName('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-forest mb-2">
          Your Name *
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-olive/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest"
          required
        />
      </div>

      <div className="border-t border-olive/20 pt-4 mb-4 max-h-60 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-center text-olive py-8">Your cart is empty</p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => {
              const itemWarnings = stockWarnings[item.menu_item_id] || [];
              const canIncrease = canIncreaseQuantity(item.menu_item_id, item.quantity);
              
              return (
                <div key={item.menu_item_id}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-olive">₱{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 text-forest font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        disabled={!canIncrease}
                        className={`w-7 h-7 rounded font-bold ${
                          canIncrease
                            ? 'bg-forest text-white hover:bg-olive'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Cart Item Stock Warning */}
                  {itemWarnings.length > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                      <p className="font-semibold text-orange-800">⚠️ Insufficient Ingredients</p>
                      <p className="text-orange-700">
                        Not enough stock available. Please reduce quantity.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-olive/20 pt-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-olive">Items:</span>
          <span className="font-medium">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xl font-bold text-forest">
          <span>Total:</span>
          <span>₱{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={loading || cart.length === 0 || hasStockIssues}
        className={`w-full px-6 py-3 rounded-lg transition-colors font-medium ${
          hasStockIssues
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-forest text-white hover:bg-olive disabled:opacity-50'
        }`}
      >
        {loading ? 'Placing Order...' : hasStockIssues ? 'Resolve Stock Issues' : 'Place Order'}
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">
        Pay at the counter after placing your order
      </p>
    </>
  );
}
