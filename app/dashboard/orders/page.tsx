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
    <div className="p-4 sm:p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-forest mb-2">Orders</h1>
          <p className="text-olive text-sm sm:text-base">Manage and track customer orders</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="w-full sm:w-auto bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive font-medium transition-colors shadow-lg text-center"
        >
          + New Order
        </Link>
      </div>

      <main>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-4 rounded-lg mb-6 text-sm">
            <strong>Error loading orders:</strong> {error.message}
          </div>
        )}
        
        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
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
      </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {orders && orders.length > 0 ? (
            orders.map((order) => {
              const isCustomerOrder = order.staff_id === '00000000-0000-0000-0000-000000000000';
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-forest text-lg">{order.order_number}</div>
                      <div className="text-sm text-olive">{order.customer_name || 'Walk-in'}</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-cream text-forest'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-medium">
                        {isCustomerOrder ? (
                          <span className="text-xs bg-cream text-forest px-2 py-0.5 rounded-full">
                            Self-Order
                          </span>
                        ) : (
                          userMap.get(order.staff_id) || 'Staff'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-forest">₱{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="block w-full bg-forest text-white text-center py-2 rounded-lg hover:bg-olive transition-colors font-medium"
                  >
                    View Details
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center text-olive">
              No orders yet. Create your first order!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
