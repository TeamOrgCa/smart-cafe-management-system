import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import TransactionIngredients from '@/components/TransactionIngredients';

export default async function TransactionsPage() {
  await requireAuth();
  const supabase = await createClient();

  // Fetch all completed and cancelled orders with payment details
  const { data: transactions } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (name, price, category)
      )
    `)
    .in('status', ['completed', 'cancelled'])
    .order('updated_at', { ascending: false });

  // Fetch users separately
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name');

  const userMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

  // Calculate totals
  const totalTransactions = transactions?.length || 0;
  const completedTransactions = transactions?.filter(t => t.status === 'completed').length || 0;
  const cancelledTransactions = transactions?.filter(t => t.status === 'cancelled').length || 0;
  const totalRevenue = transactions?.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.total_amount, 0) || 0;
  const cashTransactions = transactions?.filter(t => t.payment_method === 'cash' && t.status === 'completed').length || 0;
  const onlineTransactions = transactions?.filter(t => (t.payment_method === 'gcash' || t.payment_method === 'maya') && t.status === 'completed').length || 0;

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-forest mb-2">Transaction History</h1>
        <p className="text-olive">Complete audit trail of all transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-olive text-sm font-medium mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-forest">{totalTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-olive text-sm font-medium mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">{completedTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-olive text-sm font-medium mb-2">Cancelled</h3>
          <p className="text-3xl font-bold text-red-600">{cancelledTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-olive text-sm font-medium mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-forest">₱{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-olive text-sm font-medium mb-2">Cash / Online</h3>
          <p className="text-2xl font-bold text-forest">{cashTransactions} / {onlineTransactions}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-forest text-white">
              <tr>
                <th className="px-6 py-3 text-left">Date/Time</th>
                <th className="px-6 py-3 text-left">Order #</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Payment Method</th>
                <th className="px-6 py-3 text-left">Reference</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Processed By</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => {
                  const isCustomerOrder = transaction.staff_id === '00000000-0000-0000-0000-000000000000';
                  const itemCount = transaction.order_items?.length || 0;
                  
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
                        <span className="text-sm text-olive">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                      </td>
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
                      </td>
                      <td className="px-6 py-4">
                        {transaction.payment_reference ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {transaction.payment_reference}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${transaction.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-forest'}`}>
                          ₱{transaction.total_amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            {isCustomerOrder ? (
                              <span className="bg-cream text-forest px-2 py-0.5 rounded-full">
                                Customer Self-Order
                              </span>
                            ) : (
                              <span>By: {userMap.get(transaction.staff_id) || 'Staff'}</span>
                            )}
                          </div>
                          {transaction.processed_by_id && transaction.status === 'completed' && (
                            <div className="text-xs font-medium text-green-700">
                              ✓ Processed: {userMap.get(transaction.processed_by_id) || 'Staff'}
                            </div>
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
                  <td colSpan={10} className="px-6 py-8 text-center text-olive">
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options (Optional) */}
      <div className="mt-6 flex justify-end gap-4">
        <button className="bg-olive text-white px-6 py-2 rounded-lg hover:bg-forest transition-colors font-medium">
          📊 Export to CSV
        </button>
        <button className="bg-forest text-white px-6 py-2 rounded-lg hover:bg-olive transition-colors font-medium">
          🖨️ Print Report
        </button>
      </div>
    </div>
  );
}
