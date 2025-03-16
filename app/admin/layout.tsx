'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuth } from '@/components/admin-auth';
import { Home, Package, ShoppingCart, BarChart, LayoutDashboard, User, MessageCircleIcon } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}
export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Tableau de bord', href: '/admin', icon: Home },
    { name: 'Produits', href: '/admin/products', icon: Package },
    { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Gestion de stock', href: '/admin/stock', icon: BarChart },
    { name: 'Affichage des produits', href: '/admin/product-display', icon: LayoutDashboard },
    { name: 'Statistiques', href: '/admin/stats', icon: BarChart },
    { name: 'Clients', href: '/admin/clients', icon: User },
    { name: 'Contactes', href: '/admin/contacts', icon: MessageCircleIcon },
  ];

  return (
    <AdminAuth>
      <div className="flex min-h-screen bg-gray-100">
        <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
          <div className="flex h-14 items-center border-b px-4">
            <h1 className="text-lg font-semibold">Administration</h1>
          </div>
          <nav className="grid items-start px-2 py-4 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50'
                } flex items-center gap-3 rounded-lg px-3 py-2 transition-all`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center border-b bg-white px-4 md:px-6">
            <h1 className="text-lg font-semibold md:hidden">Administration</h1>
          </header>
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </div>
    </AdminAuth>
  );
}