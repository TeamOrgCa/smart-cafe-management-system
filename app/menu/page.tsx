import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';



export default async function MenuPage() {
  const supabase = await createClient();

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category', { ascending: true });

  // Group items by category
  type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    is_available: boolean;
  };

  const groupedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-beige">
      {/* Header */}
      <header className="bg-forest text-white shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Smart Café</h1>
              <p className="text-cream text-sm">Browse Our Menu</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/order"
                className="bg-cream text-forest px-6 py-2 rounded-lg hover:bg-cream/90 font-medium transition-colors"
              >
                🛒 Order Now
              </Link>
              <Link
                href="/"
                className="bg-olive text-white px-4 py-2 rounded-lg hover:bg-olive/90 font-medium transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-forest mb-4">Our Menu</h2>
          <p className="text-olive text-lg max-w-2xl mx-auto">
            Discover our selection of freshly brewed coffee, artisan teas, and delicious treats
          </p>
        </div>

        {/* Menu Items by Category */}
        {groupedItems && (Object.entries(groupedItems) as [string, MenuItem[]][]).map(([category, items]) => (
          <div key={category} className="mb-12">
            <h3 className="text-3xl font-bold text-forest mb-6 pb-2 border-b-2 border-olive/30">
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Image Placeholder */}
                  <div className="relative h-48 bg-linear-to-br from-olive/20 to-forest/20">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-2">
                            {category === 'Coffee' && '☕'}
                            {category === 'Tea' && '🍵'}
                            {category === 'Pastries' && '🥐'}
                            {category === 'Sandwiches' && '🥪'}
                            {category === 'Desserts' && '🍰'}
                            {!['Coffee', 'Tea', 'Pastries', 'Sandwiches', 'Desserts'].includes(category) && '🍽️'}
                          </div>
                          <p className="text-olive/50 text-sm font-medium">No Image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="text-xl font-semibold text-forest mb-2">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-forest">
                        ₱{item.price.toFixed(2)}
                      </span>
                      <button className="bg-forest text-white px-4 py-2 rounded-lg hover:bg-olive transition-colors text-sm font-medium">
                        Add to Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {(!groupedItems || Object.keys(groupedItems).length === 0) && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-olive text-xl">No menu items available at the moment.</p>
            <p className="text-gray-600 mt-2">Please check back later!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-forest text-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-cream">© 2026 Smart Café. All rights reserved.</p>
          <p className="text-white/70 text-sm mt-2">
            Visit us daily for fresh coffee and treats
          </p>
        </div>
      </footer>
    </div>
  );
}
