import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function OrdersPage() {
  await requireAuth();
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (name, price)
      )
    `)
    .order('created_at', { ascending: false });

  // Fetch users separately
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name');

  // Create a map of user IDs to names
  const userMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-forest mb-2">Orders</h1>
          <p className="text-olive">Manage and track customer orders</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive font-medium transition-colors shadow-lg"
        >
          + New Order
        </Link>
      </div>

      <main>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            <strong>Error loading orders:</strong> {error.message}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-forest text-white">
              <tr>
                <th className="px-6 py-3 text-left">Order #</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Created By</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders && orders.length > 0 ? (
                orders.map((order) => {
                  const isCustomerOrder = order.staff_id === '00000000-0000-0000-0000-000000000000';
                  return (
                    <tr key={order.id} className="border-b hover:bg-beige">
                      <td className="px-6 py-4">
                        <div className="font-medium">{order.order_number}</div>
                        {isCustomerOrder && (
                          <span className="text-xs bg-cream text-forest px-2 py-0.5 rounded-full">
                            Self-Order
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">{order.customer_name || 'Walk-in'}</td>
                      <td className="px-6 py-4">
                        {isCustomerOrder ? (
                          <span className="text-olive text-sm">Customer</span>
                        ) : (
                          userMap.get(order.staff_id) || 'Staff'
                        )}
                      </td>
                      <td className="px-6 py-4">₱{order.total_amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'pending'
                              ? 'bg-cream text-forest'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(order.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-forest hover:text-olive font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-olive">
                    No orders yet. Create your first order!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
