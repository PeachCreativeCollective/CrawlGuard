import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone } from "lucide-react";
import { BUSINESS_INFO } from "@/lib/constants";
import logoPath from "@assets/CRAWLGUARD LOGO 25_1755279513803.png";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" data-testid="logo-link">
            <img 
              src={logoPath} 
              alt="CrawlGuard LLC Logo" 
              className="h-12 w-auto"
              data-testid="logo-image"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8" data-testid="desktop-nav">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-colors font-medium ${
                  location === item.href
                    ? "text-crawlguard-primary"
                    : "text-crawlguard-dark hover:text-crawlguard-primary"
                }`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4" data-testid="contact-info">
            <div className="text-right">
              <div className="text-sm text-gray-600">Call Now</div>
              <a 
                href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}
                className="text-lg font-bold text-crawlguard-dark hover:text-crawlguard-primary transition-colors"
                data-testid="header-phone"
              >
                {BUSINESS_INFO.phone}
              </a>
            </div>
            <Button 
              asChild
              className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
              data-testid="header-cta"
            >
              <Link href="/contact">Free Estimate</Link>
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-button">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-6" data-testid="mobile-nav">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors ${
                      location === item.href
                        ? "text-crawlguard-primary"
                        : "text-crawlguard-dark hover:text-crawlguard-primary"
                    }`}
                    data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 border-t">
                  <a 
                    href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}
                    className="flex items-center space-x-2 text-crawlguard-primary font-semibold text-lg"
                    data-testid="mobile-phone"
                  >
                    <Phone className="h-5 w-5" />
                    <span>{BUSINESS_INFO.phone}</span>
                  </a>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
