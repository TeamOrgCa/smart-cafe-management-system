import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function InventoryPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .order('item_name', { ascending: true });

  return (
    <div className="p-8 lg:p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-forest mb-2">Inventory Management</h1>
          <p className="text-olive">Track and manage stock levels</p>
        </div>
        <Link
          href="/dashboard/inventory/new"
          className="bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive font-medium transition-colors shadow-lg"
        >
          + Add Item
        </Link>
      </div>

      <main>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-forest text-white">
              <tr>
                <th className="px-6 py-3 text-left">Item Name</th>
                <th className="px-6 py-3 text-left">Quantity</th>
                <th className="px-6 py-3 text-left">Unit</th>
                <th className="px-6 py-3 text-left">Min. Threshold</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Last Restocked</th>
              </tr>
            </thead>
            <tbody>
              {inventory && inventory.length > 0 ? (
                inventory.map((item) => {
                  const isLow = item.quantity <= item.minimum_threshold;
                  return (
                    <tr key={item.id} className="border-b hover:bg-beige">
                      <td className="px-6 py-4 font-medium">{item.item_name}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">{item.unit}</td>
                      <td className="px-6 py-4">{item.minimum_threshold}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            isLow
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.last_restocked
                          ? new Date(item.last_restocked).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-olive">
                    No inventory items yet. Add your first item!
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
