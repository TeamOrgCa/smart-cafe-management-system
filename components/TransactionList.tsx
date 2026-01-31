'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import TransactionIngredients from './TransactionIngredients';
import TransactionFilters from './TransactionFilters';

interface Transaction {
  id: string;
  order_number: string;
  customer_name: string | null;
  staff_id: string;
  processed_by_id: string | null;
  total_amount: number;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  updated_at: string;
  order_items: any[];
}

interface TransactionListProps {
  transactions: Transaction[];
  userMap: Map<string, string>;
}

export default function TransactionList({ transactions, userMap }: TransactionListProps) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentMethod: 'all',
    cashier: 'all',
  });

  // Get unique cashiers
  const cashiers = useMemo(() => {
    const uniqueCashiers = new Map<string, string>();
    transactions.forEach((t) => {
      if (t.processed_by_id && t.processed_by_id !== '00000000-0000-0000-0000-000000000000') {
        const name = userMap.get(t.processed_by_id);
        if (name) uniqueCashiers.set(t.processed_by_id, name);
      }
    });
    return Array.from(uniqueCashiers, ([id, name]) => ({ id, name }));
  }, [transactions, userMap]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter
      if (filters.search && !t.order_number.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && t.status !== filters.status) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethod !== 'all' && t.payment_method !== filters.paymentMethod) {
        return false;
      }

      // Cashier filter
      if (filters.cashier !== 'all') {
        if (filters.cashier === 'self-order') {
          if (t.staff_id !== '00000000-0000-0000-0000-000000000000') {
            return false;
          }
        } else {
          if (t.processed_by_id !== filters.cashier) {
            return false;
          }
        }
      }

      return true;
    });
  }, [transactions, filters]);

  return (
    <>
      <TransactionFilters onFilterChange={setFilters} cashiers={cashiers} />

      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
        <p className="text-olive text-sm">
          Showing <span className="font-bold text-forest">{filteredTransactions.length}</span> of {transactions.length} transactions
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-forest text-white">
              <tr>
                <th className="px-6 py-3 text-left">Date/Time</th>
                <th className="px-6 py-3 text-left">Order #</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Payment</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Processed By</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const isCustomerOrder = transaction.staff_id === '00000000-0000-0000-0000-000000000000';
                  
                  return (
                    <tr key={transaction.id} className="border-b hover:bg-beige">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {new Date(transaction.updated_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.updated_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{transaction.order_number}</div>
                      </td>
                      <td className="px-6 py-4">{transaction.customer_name || 'Walk-in'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.status === 'completed' ? '✓ Completed' : '✕ Cancelled'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {transaction.payment_method === 'cash' && '💵'}
                          {transaction.payment_method === 'gcash' && '📱'}
                          {transaction.payment_method === 'maya' && '📱'}
                          <span className="capitalize font-medium">
                            {transaction.payment_method || 'N/A'}
                          </span>
                        </div>
                        {transaction.payment_reference && (
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-xs mt-1 block">
                            {transaction.payment_reference}
                          </code>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${transaction.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-forest'}`}>
                          ₱{transaction.total_amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {isCustomerOrder ? (
                            <span className="text-xs bg-cream text-forest px-2 py-1 rounded-full">
                              Self-Order
                            </span>
                          ) : transaction.processed_by_id ? (
                            userMap.get(transaction.processed_by_id) || 'Staff'
                          ) : (
                            userMap.get(transaction.staff_id) || 'Staff'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <Link
                            href={`/dashboard/orders/${transaction.id}`}
                            className="text-forest hover:text-olive font-medium text-sm block"
                          >
                            View Details
                          </Link>
                          {transaction.status === 'completed' && (
                            <TransactionIngredients orderId={transaction.id} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-olive">
                    No transactions found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => {
            const isCustomerOrder = transaction.staff_id === '00000000-0000-0000-0000-000000000000';
            
            return (
              <div key={transaction.id} className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-forest text-base">{transaction.order_number}</div>
                    <div className="text-sm text-olive">{transaction.customer_name || 'Walk-in'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(transaction.updated_at).toLocaleDateString()} {new Date(transaction.updated_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transaction.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {transaction.status === 'completed' ? '✓ Completed' : '✕ Cancelled'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-3 border-t border-b border-gray-100 py-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment:</span>
                    <div className="flex items-center gap-2">
                      {transaction.payment_method === 'cash' && '💵'}
                      {transaction.payment_method === 'gcash' && '📱'}
                      {transaction.payment_method === 'maya' && '📱'}
                      <span className="capitalize font-medium">
                        {transaction.payment_method || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {transaction.payment_reference && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Ref:</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded">{transaction.payment_reference}</code>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-bold ${transaction.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-forest'}`}>
                      ₱{transaction.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-3">
                  <span className="text-gray-500">Processed by:</span>{' '}
                  {isCustomerOrder ? (
                    <span className="bg-cream text-forest px-2 py-0.5 rounded-full">
                      Self-Order
                    </span>
                  ) : transaction.processed_by_id ? (
                    userMap.get(transaction.processed_by_id) || 'Staff'
                  ) : (
                    userMap.get(transaction.staff_id) || 'Staff'
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/orders/${transaction.id}`}
                    className="flex-1 bg-forest text-white text-center py-2 rounded-lg hover:bg-olive transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                  {transaction.status === 'completed' && (
                    <div className="flex-1">
                      <TransactionIngredients orderId={transaction.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-olive">
            No transactions found matching your filters
          </div>
        )}
      </div>
    </>
  );
}
