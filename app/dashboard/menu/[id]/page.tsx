import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MenuForm from '@/components/MenuForm';
import MenuIngredients from '@/components/MenuIngredients';

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const supabase = await createClient();
  const { id } = await params;

  const { data: menuItem } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single();

  if (!menuItem) {
    notFound();
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <Link href="/dashboard/menu" className="text-olive hover:text-forest mb-4 inline-flex items-center gap-2">
          ← Back to Menu
        </Link>
        <h1 className="text-4xl font-bold text-forest mb-2">Edit Menu Item</h1>
        <p className="text-olive">Update menu item details and manage ingredients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Menu Item Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-forest mb-6">Item Details</h2>
          <MenuForm menuItem={menuItem} />
        </div>

        {/* Ingredients Management */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <MenuIngredients menuItemId={menuItem.id} />
        </div>
      </div>
    </div>
  );
}
