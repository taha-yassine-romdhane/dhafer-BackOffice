import Link from "next/link";
import { Facebook, Instagram,  Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export function Footer() {
  return (
    <footer className="bg-white border-t border-[#D4AF37]/20">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#D4AF37]">DAR KOFTAN EL ASIL</h3>
            <p className="text-sm text-gray-600">
              Dar Koftan est votre destination de choix pour des caftans traditionnels de haute qualité.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4">
              <Link href="https://www.facebook.com/profile.php?id=100083564652543" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://www.instagram.com/lamasett_chezsameh/" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://www.youtube.com/@dar_koftan_el_asil" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-[#D4AF37]">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/collections" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  Femme
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  Enfant
                </Link>
              </li>
              <li>
                <Link href="/promo" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  Promotions
                </Link>
              </li>
              <li>
                <Link href="/top-vente" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  TOP Vente
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4 text-[#D4AF37]">Service Client</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  Dar Koftan al assil
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  Contactez Nous
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-600 hover:text-[#D4AF37] transition-colors hidden">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                  Politique de remboursement
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-[#D4AF37]">Restez informé</h3>
            <p className="text-sm text-gray-600 mb-4">
              Abonnez-vous à notre newsletter pour rester informé des dernières tendances et des offres exclusives.
            </p>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="border-[#D4AF37]/20 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
              <Button className="w-full bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90">
                S&#39;abonner
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[#D4AF37]/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600">
              {new Date().getFullYear()} <span className="font-semibold">DAR KOFTAN EL ASIL</span>  Tous droits reservés .
            </p>
            <div className="flex space-x-6">
              
              <Link href="/policy" className="text-sm text-gray-600 hover:text-[#D4AF37] transition-colors">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}