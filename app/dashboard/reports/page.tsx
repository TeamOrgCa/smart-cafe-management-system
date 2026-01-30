import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch today's completed orders only
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'completed')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString());

  // Fetch all completed orders for total revenue
  const { data: completedOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'completed');

  const todayRevenue =
    todayOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const totalRevenue =
    completedOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const todayOrderCount = todayOrders?.length || 0;

  // Get top selling items
  const { data: topItems } = await supabase
    .from('order_items')
    .select(
      `
      menu_item_id,
      quantity,
      menu_items (name, price)
    `
    )
    .limit(10);

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-forest mb-2">Sales Reports</h1>
        <p className="text-olive">View performance metrics and analytics</p>
      </div>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today's Revenue */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-olive text-sm font-medium mb-2">Today's Revenue</h3>
            <p className="text-4xl font-bold text-forest">₱{todayRevenue.toFixed(2)}</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-olive text-sm font-medium mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold text-forest">₱{totalRevenue.toFixed(2)}</p>
          </div>

          {/* Today's Orders */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-olive text-sm font-medium mb-2">Today's Orders</h3>
            <p className="text-4xl font-bold text-forest">{todayOrderCount}</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-forest text-white px-6 py-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
          </div>
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-forest">Order #</th>
                  <th className="px-4 py-2 text-left text-forest">Customer</th>
                  <th className="px-4 py-2 text-left text-forest">Amount</th>
                  <th className="px-4 py-2 text-left text-forest">Status</th>
                  <th className="px-4 py-2 text-left text-forest">Date</th>
                </tr>
              </thead>
              <tbody>
                {todayOrders && todayOrders.length > 0 ? (
                  todayOrders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="border-b hover:bg-beige">
                      <td className="px-4 py-3">{order.order_number}</td>
                      <td className="px-4 py-3">{order.customer_name || 'Walk-in'}</td>
                      <td className="px-4 py-3">₱{order.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
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
                      <td className="px-4 py-3">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-olive">
                      No orders today yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
