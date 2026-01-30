'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface IngredientUsage {
  inventory_item: {
    item_name: string;
    unit: string;
  };
  total_quantity: number;
}

export default function TransactionIngredients({ orderId }: { orderId: string }) {
  const [ingredients, setIngredients] = useState<IngredientUsage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ingredients.length === 0) {
      fetchIngredients();
    }
  }, [isOpen]);

  const fetchIngredients = async () => {
    setLoading(true);
    const supabase = createClient();

    // Get order items with their menu items and ingredients
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        quantity,
        menu_item_id,
        menu_items (
          name,
          menu_item_ingredients (
            quantity_needed,
            inventory:inventory_item_id (
              item_name,
              unit
            )
          )
        )
      `)
      .eq('order_id', orderId);

    if (orderItems) {
      // Calculate total ingredient usage
      const ingredientMap = new Map<string, { item_name: string; unit: string; total: number }>();

      orderItems.forEach((item: any) => {
        const menuIngredients = item.menu_items?.menu_item_ingredients || [];
        menuIngredients.forEach((mi: any) => {
          const invItem = mi.inventory;
          if (invItem) {
            const key = invItem.item_name;
            const totalUsed = mi.quantity_needed * item.quantity;
            
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key)!;
              existing.total += totalUsed;
            } else {
              ingredientMap.set(key, {
                item_name: invItem.item_name,
                unit: invItem.unit,
                total: totalUsed,
              });
            }
          }
        });
      });

      const formattedIngredients = Array.from(ingredientMap.values()).map(ing => ({
        inventory_item: {
          item_name: ing.item_name,
          unit: ing.unit,
        },
        total_quantity: ing.total,
      }));

      setIngredients(formattedIngredients);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-forest hover:text-olive font-medium text-sm flex items-center gap-1"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>Ingredients Used</span>
      </button>

      {isOpen && (
        <div className="mt-2 bg-beige/50 rounded p-3 border border-olive/20">
          {loading ? (
            <p className="text-sm text-olive">Loading...</p>
          ) : ingredients.length > 0 ? (
            <div className="space-y-1">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="text-xs text-forest flex justify-between">
                  <span>{ing.inventory_item.item_name}</span>
                  <span className="font-medium">
                    {ing.total_quantity.toFixed(3)} {ing.inventory_item.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-olive">No ingredients linked to this order</p>
          )}
        </div>
      )}
    </div>
  );
}
