'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface EditInventoryStockProps {
  itemId: string;
  currentStock: number;
  itemName: string;
  unit: string;
  onUpdate: () => void;
}

export default function EditInventoryStock({ 
  itemId, 
  currentStock, 
  itemName, 
  unit,
  onUpdate 
}: EditInventoryStockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [operationType, setOperationType] = useState<'add' | 'set'>('add');
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      let newQuantity: number;
      let quantityChange: number;
      let operation: string;

      if (operationType === 'add') {
        newQuantity = currentStock + quantity;
        quantityChange = quantity;
        operation = quantity >= 0 ? 'add' : 'subtract';
      } else {
        newQuantity = quantity;
        quantityChange = quantity - currentStock;
        operation = 'set';
      }

      // Prevent negative stock
      if (newQuantity < 0) {
        setError('Stock quantity cannot be negative');
        setLoading(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', user?.id)
        .single();

      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          last_restocked: new Date().toISOString()
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Log the change
      await supabase
        .from('inventory_logs')
        .insert({
          inventory_item_id: itemId,
          item_name: itemName,
          operation_type: operation,
          quantity_change: quantityChange,
          quantity_before: currentStock,
          quantity_after: newQuantity,
          user_id: user?.id || null,
          user_name: userData?.username || null,
          notes: `Manual stock ${operation} via Edit Stock button`
        });

      // Success
      setIsOpen(false);
      setQuantity(0);
      onUpdate();
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-forest text-white px-4 py-2 rounded-lg hover:bg-olive transition-colors text-sm"
      >
        Edit Stock
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-forest text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">Edit Stock - {itemName}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Current Stock: <span className="font-bold text-forest">{currentStock} {unit}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-forest mb-2">
                  Operation Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="add"
                      checked={operationType === 'add'}
                      onChange={(e) => setOperationType(e.target.value as 'add' | 'set')}
                      className="mr-2"
                    />
                    Add/Subtract
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="set"
                      checked={operationType === 'set'}
                      onChange={(e) => setOperationType(e.target.value as 'add' | 'set')}
                      className="mr-2"
                    />
                    Set Exact Amount
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-forest mb-2">
                  {operationType === 'add' ? 'Quantity to Add/Subtract' : 'New Stock Quantity'}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  placeholder={operationType === 'add' ? 'Use negative for subtract' : 'Enter exact amount'}
                  required
                />
                {operationType === 'add' && (
                  <p className="text-xs text-gray-500 mt-1">
                    New stock will be: {currentStock + quantity} {unit}
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setQuantity(0);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-forest text-white px-4 py-2 rounded-lg hover:bg-olive transition-colors disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
