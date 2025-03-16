'use client'; // Ajoutez ceci si vous utilisez Next.js 13+ avec le répertoire app
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative  w-full h-screen flex items-center justify-center ">
      <div className="bg-white shadow-lg rounded-lg p-10 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">Bienvenue à Dar el Koftan el Asil</h1>
        <p className="text-gray-600 mb-8">Explorez le patrimoine et les traditions de Dar el Koftan.</p>
        <Link 
          href="/admin"
          className="inline-block rounded-full bg-[#D4AF37] hover:bg-[#D4AF37] px-6 md:px-8 py-3 md:py-3 text-base md:text-lg font-semibold text-white transition-all hover:bg-gold-700 hover:scale-105 active:scale-95"
        >
          Aller à l'Admin
        </Link>
      </div>
    </section>
  );
}