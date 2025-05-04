'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuth } from '@/components/admin-auth';
import { Home, Package, ShoppingCart, BarChart, LayoutDashboard, User, MessageCircleIcon, ImageIcon, Users, MessageCircleHeart } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}
export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Tableau de bord', href: '/admin', icon: Home },
    { name: 'Categories', href: '/admin/category', icon: Package },
    { name: 'Produits', href: '/admin/products', icon: Package },
    { name: 'Tailles', href: '/admin/sizes', icon: Package },
    { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Gestion de stock', href: '/admin/stock', icon: BarChart },
    { name: 'Affichage des produits', href: '/admin/product-display', icon: LayoutDashboard },
    { name: 'Carousel Images', href: '/admin/image-display', icon: ImageIcon },
    { name: 'Clients', href: '/admin/clients', icon: User },
    { name: 'Top Clients', href: '/admin/top-clients', icon: Users },
    { name: 'Contactes', href: '/admin/contacts', icon: MessageCircleIcon },
    { name: 'Abonnes', href: '/admin/sms-abonne', icon: MessageCircleHeart },
   
   
  ];

  return (
    <AdminAuth>
      <div className="flex min-h-screen bg-gray-100">
        <aside className="group hidden md:block border-r bg-white transition-all duration-300 hover:w-64 w-16 shrink-0 overflow-hidden">
          <div className="flex h-14 items-center border-b px-4 justify-center group-hover:justify-start overflow-hidden">
            <h1 className="text-lg font-semibold truncate">Administration</h1>
          </div>
          <nav className="flex flex-col gap-1 px-2 py-4 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50'
                } flex items-center rounded-lg px-3 py-2 transition-all`}
              >
                <div className="flex justify-center items-center w-6">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                </div>
                <span className="ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100">{item.name}</span>
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