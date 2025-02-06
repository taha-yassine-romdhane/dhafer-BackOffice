'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuth } from '@/components/admin-auth';
import { Home, Package, ShoppingCart, BarChart, LayoutDashboard } from 'lucide-react';

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
  ];

  return (
    <AdminAuth>
      <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="border-b bg-white shadow">
          <div className="container flex justify-between items-center h-10 px-4">
            <h1 className="text-xl font-semibold">Panneau d'administration</h1>
           
          </div>
        </header>

        <div className="container p-4 flex-1 flex items-start md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r bg-white shadow md:sticky md:block">
            <nav className="grid items-start px-4 py-6 text-sm font-medium">
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
          <main className="flex w-full flex-1 flex-col overflow-hidden p-6 bg-white shadow-lg rounded-lg">
            {children}
          </main>
        </div>
      </div>
    </AdminAuth>
  );
}