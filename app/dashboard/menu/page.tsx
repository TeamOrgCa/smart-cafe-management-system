import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function MenuPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .order('category', { ascending: true });

  return (
    <div className="p-8 lg:p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-forest mb-2">Menu Management</h1>
          <p className="text-olive">Add and manage café menu items</p>
        </div>
        <Link
          href="/dashboard/menu/new"
          className="bg-forest text-white px-6 py-3 rounded-lg hover:bg-olive font-medium transition-colors shadow-lg"
        >
          + Add Item
        </Link>
      </div>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems && menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 bg-linear-to-br from-olive/20 to-forest/20">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">
                          {item.category === 'Coffee' && '☕'}
                          {item.category === 'Tea' && '🍵'}
                          {item.category === 'Pastries' && '🥐'}
                          {item.category === 'Sandwiches' && '🥪'}
                          {item.category === 'Desserts' && '🍰'}
                          {!['Coffee', 'Tea', 'Pastries', 'Sandwiches', 'Desserts'].includes(item.category) && '🍽️'}
                        </div>
                        <p className="text-olive/50 text-sm font-medium">No Image</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-forest">{item.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-sm text-olive mb-2">{item.category}</p>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-forest">
                      ₱{item.price.toFixed(2)}
                    </span>
                    <Link
                      href={`/dashboard/menu/${item.id}`}
                      className="text-olive hover:text-forest font-medium"
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-olive text-lg">No menu items yet. Add your first item!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
